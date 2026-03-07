"""
Register cameras from camera_config.py into MediaMTX and FastAPI backend.

Usage:
  python3 register_cameras.py [--backend-only | --mediamtx-only]

This script:
1. Adds each camera as a path in MediaMTX (pull from RTSP source)
2. Registers each camera in FastAPI backend

Can be run independently or as part of start.sh
"""

import sys
import os
import json
import argparse
import time
import urllib.request
import urllib.error

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from camera_config import CAMERAS

# Load backend .env so we share the same TRANSCODE_METHOD, bitrate, etc.
_backend_env = os.path.join(
    os.path.dirname(os.path.abspath(__file__)), "..", "backend", ".env"
)
if os.path.isfile(_backend_env):
    with open(_backend_env) as _f:
        for _line in _f:
            _line = _line.strip()
            if _line and not _line.startswith("#") and "=" in _line:
                _key, _, _val = _line.partition("=")
                os.environ.setdefault(_key.strip(), _val.strip())

MEDIAMTX_API = os.getenv("MEDIAMTX_API_URL", "http://localhost:9997")
BACKEND_API = os.getenv("BACKEND_URL", "http://localhost:8000")


def _post_json(url, data, timeout=5):
    """POST JSON using stdlib urllib"""
    body = json.dumps(data).encode("utf-8")
    req = urllib.request.Request(
        url, data=body,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return resp.status, resp.read().decode("utf-8")
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode("utf-8", errors="replace")


def _patch_json(url, data, timeout=5):
    """PATCH JSON using stdlib urllib"""
    body = json.dumps(data).encode("utf-8")
    req = urllib.request.Request(
        url, data=body,
        headers={"Content-Type": "application/json"},
        method="PATCH",
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return resp.status, resp.read().decode("utf-8")
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode("utf-8", errors="replace")


def _get(url, timeout=3):
    """GET using stdlib urllib"""
    req = urllib.request.Request(url, method="GET")
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return resp.status
    except urllib.error.HTTPError as e:
        return e.code
    except Exception:
        return 0


def wait_for_service(url, name, timeout=30):
    """Wait for a service to become available"""
    print(f"  Waiting for {name} at {url}...", end="", flush=True)
    start = time.time()
    while time.time() - start < timeout:
        try:
            status = _get(url)
            if status and status < 500:
                print(" OK")
                return True
        except Exception:
            pass
        print(".", end="", flush=True)
        time.sleep(1)
    print(" TIMEOUT")
    return False


def register_mediamtx(cameras):
    """Register cameras in MediaMTX via its Control API"""
    print(f"\n{'='*50}")
    print(f"  Registering {len(cameras)} cameras in MediaMTX")
    print(f"{'='*50}")

    # Transcode command (H.265 → H.264 for WebRTC)
    # GStreamer pipeline selection (auto-detect HW capabilities):
    #   Full HW (AGX):  nvv4l2decoder + nvv4l2h264enc
    #   Orin NX:        nvv4l2decoder (HW decode) + x264enc (SW encode)
    #   Full SW:        avdec_h265 + x264enc
    # FFmpeg: Software fallback (libx264)
    method = os.getenv("TRANSCODE_METHOD", "gstreamer")
    bitrate_sub = int(os.getenv("TRANSCODE_BITRATE", "800000"))
    bitrate_main = int(os.getenv("TRANSCODE_BITRATE_MAIN", "3000000"))
    latency = int(os.getenv("TRANSCODE_RTSP_LATENCY", "200"))
    threads = int(os.getenv("TRANSCODE_THREADS", "2"))
    rtsp_port = os.getenv("MEDIAMTX_RTSP_PORT", "8554")

    # Detect Jetson HW decoder/encoder via GStreamer plugin probe
    import subprocess
    def _gst_plugin_exists(name):
        try:
            r = subprocess.run(
                ["gst-inspect-1.0", name],
                stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=5
            )
            return r.returncode == 0
        except Exception:
            return False

    _hw_decoder = _gst_plugin_exists("nvv4l2decoder")
    _hw_encoder = _gst_plugin_exists("nvv4l2h264enc")

    if method == "gstreamer":
        if _hw_decoder and _hw_encoder:
            print(f"  ✓  Jetson full HW detected (decoder+encoder), using GStreamer full-HW pipeline")
        elif _hw_decoder:
            print(f"  ✓  Jetson Orin detected (HW decode only), using GStreamer HW-decode + SW-encode pipeline")
        else:
            print(f"  ⚠  Jetson HW not available, using GStreamer full-SW pipeline")

    def build_transcode_cmd(rtsp_url, stream_type="sub"):
        bitrate = bitrate_main if stream_type == "main" else bitrate_sub
        bitrate_kbps = bitrate // 1000
        if method == "gstreamer":
            if _hw_decoder and _hw_encoder:
                # Full HW (AGX): nvv4l2decoder → nvv4l2h264enc
                return (
                    f"gst-launch-1.0 -e "
                    f"rtspsrc location={rtsp_url} protocols=tcp latency={latency} "
                    f"drop-on-latency=true do-retransmission=false ! "
                    f"rtph265depay ! h265parse config-interval=-1 ! "
                    f"nvv4l2decoder enable-max-performance=1 ! "
                    f"nvvideoconvert ! "
                    f"nvv4l2h264enc bitrate={bitrate} preset-level=1 "
                    f"iframeinterval=30 insert-sps-pps=true ! "
                    f"h264parse config-interval=1 ! "
                    f"rtspclientsink location=rtsp://localhost:{rtsp_port}/$MTX_PATH protocols=tcp"
                )
            elif _hw_decoder:
                # Orin: nvv4l2decoder (HW decode) → x264enc (SW encode)
                return (
                    f"gst-launch-1.0 -e "
                    f"rtspsrc location={rtsp_url} protocols=tcp latency={latency} "
                    f"drop-on-latency=true do-retransmission=false ! "
                    f"rtph265depay ! h265parse config-interval=-1 ! "
                    f"nvv4l2decoder enable-max-performance=1 ! "
                    f"nvvideoconvert ! video/x-raw,format=I420 ! "
                    f"x264enc bitrate={bitrate_kbps} speed-preset=ultrafast "
                    f"tune=zerolatency key-int-max=30 threads={threads} ! "
                    f"h264parse config-interval=1 ! "
                    f"rtspclientsink location=rtsp://localhost:{rtsp_port}/$MTX_PATH protocols=tcp"
                )
            else:
                # Full SW: avdec_h265 → x264enc
                return (
                    f"gst-launch-1.0 -e "
                    f"rtspsrc location={rtsp_url} protocols=tcp latency={latency} "
                    f"drop-on-latency=true do-retransmission=false ! "
                    f"rtph265depay ! h265parse ! "
                    f"avdec_h265 max-threads={threads} ! "
                    f"videoconvert ! video/x-raw,format=I420 ! "
                    f"x264enc bitrate={bitrate_kbps} speed-preset=ultrafast "
                    f"tune=zerolatency key-int-max=30 threads={threads} ! "
                    f"h264parse config-interval=1 ! "
                    f"rtspclientsink location=rtsp://localhost:{rtsp_port}/$MTX_PATH protocols=tcp"
                )
        else:
            return (
                f"ffmpeg -fflags nobuffer -flags low_delay "
                f"-rtsp_transport tcp -i {rtsp_url} "
                f"-c:v libx264 -preset ultrafast -tune zerolatency "
                f"-threads {threads} -b:v {bitrate} -maxrate {bitrate} "
                f"-bufsize {bitrate // 2} "
                f"-g 30 -keyint_min 15 "
                f"-an -f rtsp rtsp://localhost:{rtsp_port}/$MTX_PATH"
            )

    def _add_or_patch_path(path_name, rtsp_url, label, stream_type="sub"):
        """Register a single MediaMTX path (add or patch if exists). Returns True on success."""
        transcode_cmd = build_transcode_cmd(rtsp_url, stream_type)
        payload = {
            "runOnDemand": transcode_cmd,
            "runOnDemandRestart": True,
            "runOnDemandStartTimeout": "15s",
            "runOnDemandCloseAfter": "10s",
        }
        try:
            status, body = _post_json(
                f"{MEDIAMTX_API}/v3/config/paths/add/{path_name}", payload
            )
            if status in (200, 201):
                print(f"  ✅ {label} (added)")
                return True
            elif status == 409 or (status == 400 and "already exists" in body):
                status2, _ = _patch_json(
                    f"{MEDIAMTX_API}/v3/config/paths/patch/{path_name}", payload
                )
                if status2 == 200:
                    print(f"  ✅ {label} (updated)")
                else:
                    print(f"  ✅ {label} (already registered)")
                return True
            else:
                print(f"  ❌ {label} → failed ({status}: {body[:100]})")
                return False
        except Exception as e:
            print(f"  ❌ {label} → error: {e}")
            return False

    success = 0
    for cam in cameras:
        cam_id = cam["id"]
        ip = cam["ip"]
        # Main stream path: cam_xxx  (high-res, for single camera view)
        main_ok = _add_or_patch_path(
            cam_id,
            cam.get("rtsp_url_main", cam["rtsp_url"]),
            f"{cam_id} → {ip} [main]",
            stream_type="main",
        )
        # Sub stream path: cam_xxx_sub  (low-res, for grid view)
        sub_ok = _add_or_patch_path(
            f"{cam_id}_sub",
            cam.get("rtsp_url_sub", cam["rtsp_url"]),
            f"{cam_id}_sub → {ip} [sub]",
            stream_type="sub",
        )
        if main_ok and sub_ok:
            success += 1

    print(f"\n  Result: {success}/{len(cameras)} cameras registered in MediaMTX (main+sub)")
    return success


def register_backend(cameras):
    """Register cameras in FastAPI backend"""
    print(f"\n{'='*50}")
    print(f"  Registering {len(cameras)} cameras in Backend")
    print(f"{'='*50}")

    success = 0
    for cam in cameras:
        try:
            status, body = _post_json(
                f"{BACKEND_API}/api/cameras",
                {
                    "name": cam["name"],
                    "location": cam["location"],
                    "rtsp_url": cam["rtsp_url_sub"],
                    "rtsp_url_main": cam["rtsp_url_main"],
                    "path_name": cam["id"],
                    "ip": cam["ip"],
                    "resolution": "768x432",
                    "fps": 25,
                    "camera_type": "Fixed Dome",
                },
            )

            if status in (200, 201):
                data = json.loads(body)
                print(f"  ✅ {cam['id']} → {cam['ip']} (id: {data.get('id', 'N/A')})")
                success += 1
            else:
                print(f"  ❌ {cam['id']} → failed ({status})")
        except Exception as e:
            print(f"  ❌ {cam['id']} → error: {e}")

    print(f"\n  Result: {success}/{len(cameras)} cameras registered in Backend")
    return success


def main():
    parser = argparse.ArgumentParser(description="Register cameras in MediaMTX and Backend")
    parser.add_argument("--backend-only", action="store_true", help="Only register in backend")
    parser.add_argument("--mediamtx-only", action="store_true", help="Only register in MediaMTX")
    parser.add_argument("--no-wait", action="store_true", help="Don't wait for services")
    args = parser.parse_args()

    print("=" * 50)
    print("  Camera Registration Script")
    print(f"  Cameras: {len(CAMERAS)}")
    print("=" * 50)

    if not args.no_wait:
        if not args.backend_only:
            if not wait_for_service(f"{MEDIAMTX_API}/v3/config/global/get", "MediaMTX"):
                print("  ⚠️  MediaMTX API not available. Make sure api: true in mediamtx.yml")
                if not args.mediamtx_only:
                    print("  Continuing with backend registration only...")

        if not args.mediamtx_only:
            if not wait_for_service(f"{BACKEND_API}/api/health", "FastAPI Backend"):
                print("  ⚠️  Backend not available.")
                if not args.backend_only:
                    print("  Continuing with MediaMTX registration only...")

    mediamtx_ok = 0
    backend_ok = 0

    if not args.backend_only:
        mediamtx_ok = register_mediamtx(CAMERAS)

    if not args.mediamtx_only:
        backend_ok = register_backend(CAMERAS)

    # Summary
    print(f"\n{'='*50}")
    print(f"  REGISTRATION COMPLETE")
    print(f"{'='*50}")
    if not args.backend_only:
        print(f"  MediaMTX: {mediamtx_ok}/{len(CAMERAS)} cameras")
    if not args.mediamtx_only:
        print(f"  Backend:  {backend_ok}/{len(CAMERAS)} cameras")
    print()
    print(f"  Now open: http://localhost:5173/monitor")
    print(f"  API docs: http://localhost:8000/docs")
    print()

    # Print stream URLs
    print(f"  Stream URLs (test in browser):")
    for cam in CAMERAS[:3]:
        print(f"    WebRTC: http://localhost:8889/{cam['id']}")
        print(f"    HLS:    http://localhost:8888/{cam['id']}")
    if len(CAMERAS) > 3:
        print(f"    ... and {len(CAMERAS) - 3} more cameras")
    print()


if __name__ == "__main__":
    main()
