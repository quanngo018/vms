import sys
import gi
import math
import time
import os
gi.require_version("Gst", "1.0")
from gi.repository import Gst, GLib

sys.path.append('/opt/nvidia/deepstream/deepstream/lib')

# Import shared camera config
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
from camera_config import CAMERAS, RTSP_SOURCES

Gst.init(None)

# ---------------------------------------------------------
# 1. CẤU HÌNH THÔNG SỐ (CONFIG)
# ---------------------------------------------------------
# RTSP_SOURCES is now imported from camera_config.py

# Kích thước khung hình nội bộ tại nvstreammux (Tối ưu cho Substream)
MUXER_WIDTH = 768 
MUXER_HEIGHT = 432

# Kích thước màn hình hiển thị tổng (Tiler Grid)
TILED_OUTPUT_WIDTH = 1920
TILED_OUTPUT_HEIGHT = 1080

# ---------------------------------------------------------
# FPS TRACKING & ERROR DETECTION
# ---------------------------------------------------------
fps_frame_count = {}       # source_id -> frame count trong khoảng đo
fps_values = {}            # source_id -> FPS hiện tại
cam_last_frame_time = {}   # source_id -> thời gian nhận frame cuối
FPS_REPORT_INTERVAL = 5    # In FPS mỗi 5 giây
CAM_TIMEOUT = 15           # Nếu cam không có frame trong 15s -> coi là lỗi

def get_cam_name(index):
    """Trích xuất tên camera từ shared config."""
    if index < len(CAMERAS):
        cam = CAMERAS[index]
        return f"{cam['name']} ({cam['ip']})"
    return f"Cam-{index:02d}"

def fps_src_pad_buffer_probe(pad, info, u_data):
    """Probe trên src pad của streammux - đếm frame từng source_id."""
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
    """Callback định kỳ: tính FPS và phát hiện camera lỗi."""
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
        print(f"{'='*55}")
        print(f" [CẢNH BÁO] Camera LỖI (không nhận được frame):")
        for cam in error_cams:
            print(f"   ❌ {cam}")
    print(f"{'='*55}\n")

    return True

# ---------------------------------------------------------
# 2. XỬ LÝ SỰ KIỆN KẾT NỐI PAD (LỌC VIDEO)
# ---------------------------------------------------------
def cb_newpad(src, pad, data):
    """ 
    Callback này được gọi khi nvurisrcbin bắt đầu phát luồng.
    Nhiệm vụ: Chỉ bắt luồng Video để cắm vào nvstreammux, bỏ qua Audio/Metadata.
    """
    sink_pad = data
    
    # Lấy thông tin định dạng (caps) của luồng dữ liệu hiện tại
    caps = pad.get_current_caps()
    if not caps:
        caps = pad.query_caps(None)
    
    if caps:
        structure = caps.get_structure(0)
        name = structure.get_name()
        
        # Lọc: Nếu luồng là video thì mới thực hiện link
        if name.startswith("video"):
            if not sink_pad.is_linked():
                ret = pad.link(sink_pad)
                if ret != Gst.PadLinkReturn.OK:
                    print(f"[LỖI] Không thể link luồng video vào streammux. Mã lỗi: {ret}")
                else:
                    print(f"[INFO] Đã kết nối thành công luồng video từ {src.get_name()}")

# ---------------------------------------------------------
# 3. TẠO SOURCE BIN (NVURISRCBIN)
# ---------------------------------------------------------
def create_source_bin(index, uri):
    bin_name = f"source-bin-{index:02d}"
    
    nbin = Gst.ElementFactory.make("nvurisrcbin", bin_name)
    if not nbin:
        print(f"[LỖI] Không thể tạo nvurisrcbin cho {bin_name}")
        return None

    # Thiết lập các thông số thông minh cho luồng RTSP
    nbin.set_property("uri", uri)
    nbin.set_property("rtsp-reconnect-interval", 5) # Cứu luồng: tự reconnect sau 5s
    nbin.set_property("cudadec-memtype", 0)         # Tối ưu RAM cho Jetson (Memory: Device)
    
    return nbin

# ---------------------------------------------------------
# 4. HÀM MAIN: XÂY DỰNG PIPELINE
# ---------------------------------------------------------
def main():
    number_sources = len(RTSP_SOURCES)
    pipeline = Gst.Pipeline.new("vms-optimized-pipeline")

    # Khởi tạo các Element cốt lõi
    streammux = Gst.ElementFactory.make("nvstreammux", "stream-muxer")
    tiler = Gst.ElementFactory.make("nvmultistreamtiler", "tiler")
    nvvidconv = Gst.ElementFactory.make("nvvideoconvert", "nvvidconv")
    sink = Gst.ElementFactory.make("nveglglessink", "sink")

    if not all([pipeline, streammux, tiler, nvvidconv, sink]):
        print("[LỖI] Không thể khởi tạo các Element chính của DeepStream.")
        sys.exit(1)

    # Cấu hình Muxer
    streammux.set_property("width", MUXER_WIDTH)
    streammux.set_property("height", MUXER_HEIGHT)
    streammux.set_property("batch-size", number_sources)
    streammux.set_property("batched-push-timeout", 40000) # Đợi tối đa 40ms để gom đủ batch
    streammux.set_property("live-source", 1)

    # Cấu hình Tiler (Tính toán tự động số hàng/cột dựa trên số lượng cam)
    cols = int(math.ceil(math.sqrt(number_sources)))
    rows = int(math.ceil(number_sources / cols))
    tiler.set_property("rows", rows)
    tiler.set_property("columns", cols)
    tiler.set_property("width", TILED_OUTPUT_WIDTH)
    tiler.set_property("height", TILED_OUTPUT_HEIGHT)

    # Cấu hình Sink (Tắt đồng bộ để tránh giật lag khi xem live)
    sink.set_property("sync", 0)
    sink.set_property("qos", 0)

    # Thêm các Element chính vào Pipeline
    pipeline.add(streammux)
    pipeline.add(tiler)
    pipeline.add(nvvidconv)
    pipeline.add(sink)

    # Thêm các Source (Camera) vào Pipeline và Link vào Muxer
    for i, uri in enumerate(RTSP_SOURCES):
        source_bin = create_source_bin(i, uri)
        if not source_bin:
            continue
            
        pipeline.add(source_bin)
        
        # SỬA LỖI DEPRECATION: Dùng request_pad_simple thay cho get_request_pad
        sinkpad = streammux.request_pad_simple(f"sink_{i}")
        if not sinkpad:
            print(f"[LỖI] Không thể yêu cầu pad từ streammux cho luồng {i}")
            continue
            
        # Nối callback để tự động link khi có dữ liệu video
        source_bin.connect("pad-added", cb_newpad, sinkpad)

    # Link phần đuôi của Pipeline
    streammux.link(tiler)
    tiler.link(nvvidconv)
    nvvidconv.link(sink)

    # Gắn probe FPS lên src pad của streammux
    srcpad = streammux.get_static_pad("src")
    if srcpad:
        srcpad.add_probe(Gst.PadProbeType.BUFFER, fps_src_pad_buffer_probe, 0)
        print("[INFO] Đã gắn FPS probe lên streammux.")
    else:
        print("[CẢNH BÁO] Không thể lấy src pad của streammux để gắn FPS probe.")

    # Đăng ký timer in FPS định kỳ
    GLib.timeout_add_seconds(FPS_REPORT_INTERVAL, fps_report_callback, number_sources)

    # Thiết lập Bus để bắt thông điệp (Lỗi hoặc Kết thúc)
    loop = GLib.MainLoop()
    bus = pipeline.get_bus()
    bus.add_signal_watch()
    
    def on_message(bus, message, loop):
        t = message.type
        if t == Gst.MessageType.EOS:
            print("Đã kết thúc luồng (End-Of-Stream).")
            loop.quit()
        elif t == Gst.MessageType.ERROR:
            err, debug = message.parse_error()
            print(f"\n[LỖI GSTREAMER] {err}")
            print(f"[CHI TIẾT] {debug}\n")
            loop.quit()
        return True

    bus.connect("message", on_message, loop)

    print(f"Đang khởi tạo VMS với {number_sources} camera...")
    pipeline.set_state(Gst.State.PLAYING)

    try:
        loop.run()
    except KeyboardInterrupt:
        print("\nNgười dùng đã ngắt chương trình (Ctrl+C).")

    # Dọn dẹp tài nguyên
    pipeline.set_state(Gst.State.NULL)
    print("Đã tắt an toàn.")

if __name__ == "__main__":
    main()