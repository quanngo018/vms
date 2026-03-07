"""
DeepStream Multi-Camera Pipeline → RTSP Output → MediaMTX → Web

Thay vì hiển thị qua nveglglessink (local display), pipeline này
output mỗi camera thành một RTSP stream riêng qua nvrtspoutsinkbin.

Luồng dữ liệu:
  Camera (RTSP) → DeepStream (decode + AI) → nvrtspoutsinkbin → RTSP Server
  MediaMTX pulls RTSP from DeepStream → WebRTC/HLS → Browser

Có 2 chế độ output:
  MODE = "individual" : Mỗi camera → 1 RTSP stream riêng (cam_001, cam_002, ...)
  MODE = "tiled"      : Tất cả camera → 1 RTSP stream dạng tiled grid

Usage:
  python3 deepstream_rtsp_output.py [--mode individual|tiled] [--port 8554]
"""

import sys
import os
import gi
import math
import time
import argparse

gi.require_version("Gst", "1.0")
gi.require_version("GstRtspServer", "1.0")
from gi.repository import Gst, GLib, GstRtspServer

sys.path.append('/opt/nvidia/deepstream/deepstream/lib')

# Import shared camera config
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from camera_config import CAMERAS, RTSP_SOURCES

Gst.init(None)

# ---------------------------------------------------------
# CONFIG
# ---------------------------------------------------------
MUXER_WIDTH = 768
MUXER_HEIGHT = 432
TILED_OUTPUT_WIDTH = 1920
TILED_OUTPUT_HEIGHT = 1080

# RTSP output settings
RTSP_OUT_PORT = 8554      # Port cho RTSP server output
RTSP_OUT_CODEC = "H264"   # H264 hoặc H265
RTSP_OUT_BITRATE = 2000000  # 2 Mbps mỗi stream

# Detect HW encoder availability (Orin NX does not have nvv4l2h264enc)
_HW_ENCODER_AVAILABLE = Gst.ElementFactory.find("nvv4l2h264enc") is not None

# FPS tracking
fps_frame_count = {}
fps_values = {}
cam_last_frame_time = {}
FPS_REPORT_INTERVAL = 5
CAM_TIMEOUT = 15


def get_cam_name(index):
    if index < len(CAMERAS):
        return f"{CAMERAS[index]['name']} ({CAMERAS[index]['ip']})"
    return f"Cam-{index:02d}"


def fps_src_pad_buffer_probe(pad, info, u_data):
    try:
        import pyds
    except ImportError:
        return Gst.PadProbeReturn.OK

    gst_buffer = info.get_buffer()
    if not gst_buffer:
        return Gst.PadProbeReturn.OK

    batch_meta = pyds.gst_buffer_get_nvds_batch_meta(hash(gst_buffer))
    if not batch_meta:
        return Gst.PadProbeReturn.OK

    l_frame = batch_meta.frame_meta_list
    now = time.time()
    while l_frame is not None:
        try:
            frame_meta = pyds.NvDsFrameMeta.cast(l_frame.data)
        except StopIteration:
            break
        src_id = frame_meta.source_id
        fps_frame_count[src_id] = fps_frame_count.get(src_id, 0) + 1
        cam_last_frame_time[src_id] = now
        try:
            l_frame = l_frame.next
        except StopIteration:
            break

    return Gst.PadProbeReturn.OK


def fps_report_callback(number_sources):
    now = time.time()
    error_cams = []
    fps_lines = []

    for i in range(number_sources):
        count = fps_frame_count.get(i, 0)
        fps = count / FPS_REPORT_INTERVAL
        fps_values[i] = fps
        fps_frame_count[i] = 0

        name = get_cam_name(i)
        fps_lines.append(f"  {name}: {fps:.1f} FPS")

        last_time = cam_last_frame_time.get(i, 0)
        if last_time == 0 or (now - last_time) > CAM_TIMEOUT:
            error_cams.append(name)

    print(f"\n{'='*55}")
    print(f" FPS Report ({time.strftime('%H:%M:%S')})")
    print(f"{'='*55}")
    for line in fps_lines:
        print(line)

    if error_cams:
        print(f"  [CẢNH BÁO] Camera LỖI:")
        for cam in error_cams:
            print(f"   ❌ {cam}")
    print(f"{'='*55}\n")
    return True


def cb_newpad(src, pad, data):
    sink_pad = data
    caps = pad.get_current_caps()
    if not caps:
        caps = pad.query_caps(None)
    if caps:
        structure = caps.get_structure(0)
        name = structure.get_name()
        if name.startswith("video"):
            if not sink_pad.is_linked():
                ret = pad.link(sink_pad)
                if ret == Gst.PadLinkReturn.OK:
                    print(f"[INFO] Linked video from {src.get_name()}")


def create_source_bin(index, uri):
    bin_name = f"source-bin-{index:02d}"
    nbin = Gst.ElementFactory.make("nvurisrcbin", bin_name)
    if not nbin:
        print(f"[LỖI] Cannot create nvurisrcbin for {bin_name}")
        return None
    nbin.set_property("uri", uri)
    nbin.set_property("rtsp-reconnect-interval", 5)
    nbin.set_property("cudadec-memtype", 0)
    return nbin


# ---------------------------------------------------------
# TILED MODE: All cameras → 1 tiled RTSP stream
# ---------------------------------------------------------
def build_tiled_pipeline(rtsp_port):
    """
    Pipeline:
      sources → streammux → tiler → nvvidconv → encoder → rtsp_server
    
    Output: rtsp://localhost:{rtsp_port}/tiled_view
    """
    number_sources = len(RTSP_SOURCES)
    pipeline = Gst.Pipeline.new("tiled-rtsp-pipeline")

    streammux = Gst.ElementFactory.make("nvstreammux", "stream-muxer")
    tiler = Gst.ElementFactory.make("nvmultistreamtiler", "tiler")
    nvvidconv = Gst.ElementFactory.make("nvvideoconvert", "nvvidconv")
    caps_filter = Gst.ElementFactory.make("capsfilter", "caps-filter")
    # encoder is created conditionally below based on HW availability
    encoder = None
    parser = Gst.ElementFactory.make("h264parse", "parser")
    pay = Gst.ElementFactory.make("rtph264pay", "pay")
    sink = Gst.ElementFactory.make("udpsink", "udpsink")

    if not all([pipeline, streammux, tiler, nvvidconv, caps_filter, parser, pay, sink]):
        print("[LỖI] Cannot create pipeline elements")
        sys.exit(1)

    # Muxer config
    streammux.set_property("width", MUXER_WIDTH)
    streammux.set_property("height", MUXER_HEIGHT)
    streammux.set_property("batch-size", number_sources)
    streammux.set_property("batched-push-timeout", 40000)
    streammux.set_property("live-source", 1)

    # Tiler config
    cols = int(math.ceil(math.sqrt(number_sources)))
    rows = int(math.ceil(number_sources / cols))
    tiler.set_property("rows", rows)
    tiler.set_property("columns", cols)
    tiler.set_property("width", TILED_OUTPUT_WIDTH)
    tiler.set_property("height", TILED_OUTPUT_HEIGHT)

    # Encoder config: use HW encoder (AGX) or SW encoder (Orin)
    if _HW_ENCODER_AVAILABLE:
        encoder = Gst.ElementFactory.make("nvv4l2h264enc", "encoder")
        caps_filter.set_property("caps",
            Gst.Caps.from_string("video/x-raw(memory:NVMM), format=I420"))
        encoder.set_property("bitrate", RTSP_OUT_BITRATE)
        encoder.set_property("preset-level", 1)  # UltraFast
        encoder.set_property("profile", 0)       # Baseline for compatibility
        print("[Encoder] Using nvv4l2h264enc (HW)")
    else:
        encoder = Gst.ElementFactory.make("x264enc", "encoder")
        caps_filter.set_property("caps",
            Gst.Caps.from_string("video/x-raw, format=I420"))
        encoder.set_property("bitrate", RTSP_OUT_BITRATE // 1000)  # x264enc uses kbit/s
        encoder.set_property("speed-preset", 1)   # ultrafast
        encoder.set_property("tune", 0x04)         # zerolatency
        encoder.set_property("key-int-max", 30)
        encoder.set_property("threads", 2)
        print("[Encoder] Using x264enc (SW - Orin)")
        # Replace nvvideoconvert with videoconvert for CPU path
        nvvidconv = Gst.ElementFactory.make("videoconvert", "nvvidconv")

    # UDP sink config (will be picked up by RTSP server)
    updsink_port_num = 5400
    sink.set_property("host", "224.224.255.255")
    sink.set_property("port", updsink_port_num)
    sink.set_property("async", False)
    sink.set_property("sync", False)

    # Add elements
    for elem in [streammux, tiler, nvvidconv, caps_filter, encoder, parser, pay, sink]:
        pipeline.add(elem)

    # Add sources
    for i, uri in enumerate(RTSP_SOURCES):
        source_bin = create_source_bin(i, uri)
        if not source_bin:
            continue
        pipeline.add(source_bin)
        sinkpad = streammux.request_pad_simple(f"sink_{i}")
        if sinkpad:
            source_bin.connect("pad-added", cb_newpad, sinkpad)

    # Link
    streammux.link(tiler)
    tiler.link(nvvidconv)
    nvvidconv.link(caps_filter)
    caps_filter.link(encoder)
    encoder.link(parser)
    parser.link(pay)
    pay.link(sink)

    # FPS probe
    srcpad = streammux.get_static_pad("src")
    if srcpad:
        srcpad.add_probe(Gst.PadProbeType.BUFFER, fps_src_pad_buffer_probe, 0)

    GLib.timeout_add_seconds(FPS_REPORT_INTERVAL, fps_report_callback, number_sources)

    # Create RTSP server
    server = GstRtspServer.RTSPServer.new()
    server.props.service = str(rtsp_port)
    factory = GstRtspServer.RTSPMediaFactory.new()
    factory.set_launch(
        f'( udpsrc name=pay0 port={updsink_port_num} buffer-size=524288 '
        f'caps="application/x-rtp, media=video, clock-rate=90000, '
        f'encoding-name={RTSP_OUT_CODEC}, payload=96" )'
    )
    factory.set_shared(True)
    mounts = server.get_mount_points()
    mounts.add_factory("/tiled_view", factory)
    server.attach(None)

    print(f"\n[RTSP] Tiled view available at: rtsp://localhost:{rtsp_port}/tiled_view")
    return pipeline


# ---------------------------------------------------------
# INDIVIDUAL MODE: Each camera → separate RTSP stream
# Uses MediaMTX as relay (cameras publish directly)
# ---------------------------------------------------------
def build_individual_pipeline():
    """
    Trong chế độ này, KHÔNG cần DeepStream cho viewing.
    MediaMTX sẽ trực tiếp pull RTSP từ mỗi camera.
    
    Chỉ cần chạy script register_cameras.py để cấu hình MediaMTX.
    
    Nếu muốn AI processing trên từng camera rồi output ra RTSP riêng,
    cần dùng nvrtspoutsinkbin hoặc demux sau streammux.
    """
    number_sources = len(RTSP_SOURCES)
    pipeline = Gst.Pipeline.new("individual-rtsp-pipeline")

    streammux = Gst.ElementFactory.make("nvstreammux", "stream-muxer")
    if not streammux:
        print("[LỖI] Cannot create streammux")
        sys.exit(1)

    streammux.set_property("width", MUXER_WIDTH)
    streammux.set_property("height", MUXER_HEIGHT)
    streammux.set_property("batch-size", number_sources)
    streammux.set_property("batched-push-timeout", 40000)
    streammux.set_property("live-source", 1)

    pipeline.add(streammux)

    # ─── Thêm AI inference ở đây nếu cần ───
    # nvinfer = Gst.ElementFactory.make("nvinfer", "primary-inference")
    # nvinfer.set_property("config-file-path", "config_infer.txt")
    # pipeline.add(nvinfer)
    # streammux.link(nvinfer)
    # last_element = nvinfer
    last_element = streammux

    # Demuxer: tách batch thành các stream riêng
    demux = Gst.ElementFactory.make("nvstreamdemux", "demuxer")
    if not demux:
        print("[LỖI] Cannot create nvstreamdemux")
        sys.exit(1)
    pipeline.add(demux)
    last_element.link(demux)

    # RTSP server cho output
    rtsp_port = RTSP_OUT_PORT + 1000  # 9554 to avoid conflict with camera input
    server = GstRtspServer.RTSPServer.new()
    server.props.service = str(rtsp_port)
    mounts = server.get_mount_points()

    # Tạo encoder + RTSP output cho mỗi source
    for i in range(number_sources):
        cam = CAMERAS[i] if i < len(CAMERAS) else {"id": f"cam_{i:03d}"}
        cam_id = cam["id"]

        # Elements cho mỗi camera output
        queue = Gst.ElementFactory.make("queue", f"queue_{i}")
        nvvidconv = Gst.ElementFactory.make("nvvideoconvert", f"nvvidconv_{i}")
        caps_filter = Gst.ElementFactory.make("capsfilter", f"caps_{i}")
        # Encoder: use HW (AGX) or SW (Orin)
        if _HW_ENCODER_AVAILABLE:
            encoder = Gst.ElementFactory.make("nvv4l2h264enc", f"encoder_{i}")
            caps_filter.set_property("caps",
                Gst.Caps.from_string("video/x-raw(memory:NVMM), format=I420"))
            encoder.set_property("bitrate", RTSP_OUT_BITRATE)
            encoder.set_property("preset-level", 1)
            encoder.set_property("profile", 0)
        else:
            encoder = Gst.ElementFactory.make("x264enc", f"encoder_{i}")
            caps_filter.set_property("caps",
                Gst.Caps.from_string("video/x-raw, format=I420"))
            encoder.set_property("bitrate", RTSP_OUT_BITRATE // 1000)
            encoder.set_property("speed-preset", 1)
            encoder.set_property("tune", 0x04)
            encoder.set_property("key-int-max", 30)
            encoder.set_property("threads", 2)
            # Use CPU videoconvert for Orin
            nvvidconv = Gst.ElementFactory.make("videoconvert", f"nvvidconv_{i}")

        parser = Gst.ElementFactory.make("h264parse", f"parser_{i}")
        pay = Gst.ElementFactory.make("rtph264pay", f"pay_{i}")
        udpsink = Gst.ElementFactory.make("udpsink", f"udpsink_{i}")

        if not all([queue, nvvidconv, caps_filter, encoder, parser, pay, udpsink]):
            print(f"[LỖI] Cannot create output elements for {cam_id}")
            continue

        udp_port = 5400 + i
        udpsink.set_property("host", "224.224.255.255")
        udpsink.set_property("port", udp_port)
        udpsink.set_property("async", False)
        udpsink.set_property("sync", False)

        for elem in [queue, nvvidconv, caps_filter, encoder, parser, pay, udpsink]:
            pipeline.add(elem)

        # Link demux src_{i} → queue → encoder chain
        demux_srcpad = demux.request_pad_simple(f"src_{i}")
        queue_sinkpad = queue.get_static_pad("sink")
        if demux_srcpad and queue_sinkpad:
            demux_srcpad.link(queue_sinkpad)

        queue.link(nvvidconv)
        nvvidconv.link(caps_filter)
        caps_filter.link(encoder)
        encoder.link(parser)
        parser.link(pay)
        pay.link(udpsink)

        # RTSP factory cho camera này
        factory = GstRtspServer.RTSPMediaFactory.new()
        factory.set_launch(
            f'( udpsrc name=pay0 port={udp_port} buffer-size=524288 '
            f'caps="application/x-rtp, media=video, clock-rate=90000, '
            f'encoding-name=H264, payload=96" )'
        )
        factory.set_shared(True)
        mounts.add_factory(f"/{cam_id}", factory)
        print(f"[RTSP] {cam_id} → rtsp://localhost:{rtsp_port}/{cam_id}")

    # Add sources
    for i, uri in enumerate(RTSP_SOURCES):
        source_bin = create_source_bin(i, uri)
        if not source_bin:
            continue
        pipeline.add(source_bin)
        sinkpad = streammux.request_pad_simple(f"sink_{i}")
        if sinkpad:
            source_bin.connect("pad-added", cb_newpad, sinkpad)

    # FPS probe
    srcpad = streammux.get_static_pad("src")
    if srcpad:
        srcpad.add_probe(Gst.PadProbeType.BUFFER, fps_src_pad_buffer_probe, 0)

    GLib.timeout_add_seconds(FPS_REPORT_INTERVAL, fps_report_callback, number_sources)

    server.attach(None)
    print(f"\n[RTSP] Server running on port {rtsp_port}")
    print(f"[RTSP] {number_sources} camera streams available")

    return pipeline


# ---------------------------------------------------------
# MAIN
# ---------------------------------------------------------
def main():
    parser = argparse.ArgumentParser(description="DeepStream → RTSP Output for Web VMS")
    parser.add_argument("--mode", choices=["tiled", "individual", "direct"],
                        default="direct",
                        help="Output mode: tiled (1 grid), individual (per-cam RTSP), "
                             "direct (just register cameras in MediaMTX, no DeepStream)")
    parser.add_argument("--port", type=int, default=RTSP_OUT_PORT,
                        help=f"RTSP output port (default: {RTSP_OUT_PORT})")
    args = parser.parse_args()

    if args.mode == "direct":
        print("=" * 60)
        print("  MODE: DIRECT (MediaMTX pulls from cameras directly)")
        print("  No DeepStream processing - lowest latency")
        print("=" * 60)
        print("\nRun this to register cameras in MediaMTX:")
        print("  python3 register_cameras.py")
        print("\nOr start the full system:")
        print("  cd /home/edabk/Quan/AI_challenge/vms && ./start.sh")
        return

    if args.mode == "tiled":
        print("=" * 60)
        print(f"  MODE: TILED (All cameras → 1 grid stream)")
        print(f"  Output: rtsp://localhost:{args.port}/tiled_view")
        print("=" * 60)
        pipeline = build_tiled_pipeline(args.port)
    else:
        print("=" * 60)
        print(f"  MODE: INDIVIDUAL (Each camera → separate RTSP)")
        print("=" * 60)
        pipeline = build_individual_pipeline()

    loop = GLib.MainLoop()
    bus = pipeline.get_bus()
    bus.add_signal_watch()

    def on_message(bus, message, loop):
        t = message.type
        if t == Gst.MessageType.EOS:
            print("End-Of-Stream.")
            loop.quit()
        elif t == Gst.MessageType.ERROR:
            err, debug = message.parse_error()
            print(f"\n[GSTREAMER ERROR] {err}")
            print(f"[DETAIL] {debug}\n")
            loop.quit()
        return True

    bus.connect("message", on_message, loop)

    print(f"\nStarting pipeline with {len(RTSP_SOURCES)} cameras...")
    pipeline.set_state(Gst.State.PLAYING)

    try:
        loop.run()
    except KeyboardInterrupt:
        print("\nStopped by user.")

    pipeline.set_state(Gst.State.NULL)
    print("Pipeline stopped safely.")


if __name__ == "__main__":
    main()
