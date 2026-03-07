"""
MediaMTX Service - Communicates with MediaMTX API and manages config
"""
import httpx
import yaml
import os
import subprocess
from typing import Optional
from app.config import settings


# ── Detect Jetson HW decoder/encoder via GStreamer plugin probe ──
def _gst_plugin_exists(name: str) -> bool:
    try:
        r = subprocess.run(
            ["gst-inspect-1.0", name],
            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=5
        )
        return r.returncode == 0
    except Exception:
        return False

_HW_DECODER = _gst_plugin_exists("nvv4l2decoder")
_HW_ENCODER = _gst_plugin_exists("nvv4l2h264enc")


class MediaMTXService:
    """Service to interact with MediaMTX Control API"""

    def __init__(self):
        self.api_url = settings.mediamtx_api_url
        self.config_path = settings.mediamtx_config_path

    # ──────────────────────────────────────────────
    #  MediaMTX Control API (requires api: true in mediamtx.yml)
    # ──────────────────────────────────────────────

    async def list_paths(self) -> list:
        """List all active paths (streams) from MediaMTX API"""
        try:
            async with httpx.AsyncClient(timeout=5) as client:
                resp = await client.get(f"{self.api_url}/v3/paths/list")
                if resp.status_code == 200:
                    data = resp.json()
                    return data.get("items", [])
                return []
        except Exception as e:
            print(f"[MediaMTX API] Error listing paths: {e}")
            return []

    async def get_path(self, path_name: str) -> Optional[dict]:
        """Get info about a specific path"""
        try:
            async with httpx.AsyncClient(timeout=5) as client:
                resp = await client.get(f"{self.api_url}/v3/paths/get/{path_name}")
                if resp.status_code == 200:
                    return resp.json()
                return None
        except Exception as e:
            print(f"[MediaMTX API] Error getting path {path_name}: {e}")
            return None

    def _build_transcode_cmd(self, rtsp_source: str, stream_type: str = "sub") -> str:
        """
        Build transcode command: H.265 → H.264 for WebRTC.

        method="gstreamer":
          - Auto-detects Jetson HW (nvv4l2decoder + nvv4l2h264enc).
          - Falls back to GStreamer SW (avdec_h265 + x264enc) if HW is dummy.
        method="ffmpeg":
          - Software fallback using libx264.

        Args:
            rtsp_source: Camera RTSP URL
            stream_type: "main" or "sub"
        """
        method = settings.transcode_method
        bitrate = settings.transcode_bitrate_main if stream_type == "main" else settings.transcode_bitrate
        latency = settings.transcode_rtsp_latency
        rtsp_port = settings.mediamtx_rtsp_port
        threads = settings.transcode_threads
        # x264enc uses kbit/s
        bitrate_kbps = bitrate // 1000

        if method == "gstreamer":
            if _HW_DECODER and _HW_ENCODER:
                # ── Full HW (AGX): nvv4l2decoder → nvv4l2h264enc ──
                print(f"[Transcode] Using GStreamer full-HW pipeline (AGX)")
                cmd = (
                    f"gst-launch-1.0 -e "
                    f"rtspsrc location={rtsp_source} protocols=tcp latency={latency} "
                    f"drop-on-latency=true do-retransmission=false ! "
                    f"rtph265depay ! h265parse config-interval=-1 ! "
                    f"nvv4l2decoder enable-max-performance=1 ! "
                    f"nvvideoconvert ! "
                    f"nvv4l2h264enc bitrate={bitrate} preset-level=1 "
                    f"iframeinterval=30 insert-sps-pps=true ! "
                    f"h264parse config-interval=1 ! "
                    f"rtspclientsink location=rtsp://localhost:{rtsp_port}/$MTX_PATH protocols=tcp"
                )
            elif _HW_DECODER:
                # ── Orin: nvv4l2decoder (HW decode) → x264enc (SW encode) ──
                print(f"[Transcode] Using GStreamer Orin pipeline (HW decode + SW encode)")
                cmd = (
                    f"gst-launch-1.0 -e "
                    f"rtspsrc location={rtsp_source} protocols=tcp latency={latency} "
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
                # ── Full SW: avdec_h265 → x264enc ──
                print(f"[Transcode] Jetson HW not available, using GStreamer SW pipeline")
                cmd = (
                    f"gst-launch-1.0 -e "
                    f"rtspsrc location={rtsp_source} protocols=tcp latency={latency} "
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
            # ── FFmpeg software fallback ──
            cmd = (
                f"ffmpeg -fflags nobuffer -flags low_delay "
                f"-rtsp_transport tcp -i {rtsp_source} "
                f"-c:v libx264 -preset ultrafast -tune zerolatency "
                f"-threads {threads} -b:v {bitrate} -maxrate {bitrate} "
                f"-bufsize {bitrate // 2} "
                f"-g 30 -keyint_min 15 "
                f"-an -f rtsp rtsp://localhost:{rtsp_port}/$MTX_PATH"
            )
        return cmd

    async def add_path(self, path_name: str, rtsp_source: str, stream_type: str = "sub") -> bool:
        """
        Add a camera path to MediaMTX via API.
        Uses runOnDemand with GStreamer/FFmpeg to transcode H.265 → H.264.
        Transcoding starts only when a viewer requests the stream.
        """
        transcode_cmd = self._build_transcode_cmd(rtsp_source, stream_type)
        print(f"[MediaMTX] add_path {path_name} [{stream_type}]: {transcode_cmd}")

        try:
            async with httpx.AsyncClient(timeout=5) as client:
                resp = await client.post(
                    f"{self.api_url}/v3/config/paths/add/{path_name}",
                    json={
                        "runOnDemand": transcode_cmd,
                        "runOnDemandRestart": True,
                        "runOnDemandStartTimeout": "15s",
                        "runOnDemandCloseAfter": "10s",
                    }
                )
                if resp.status_code in (200, 201):
                    return True
                # Path already exists — try patch
                if resp.status_code == 400:
                    resp2 = await client.patch(
                        f"{self.api_url}/v3/config/paths/patch/{path_name}",
                        json={
                            "runOnDemand": transcode_cmd,
                            "runOnDemandRestart": True,
                            "runOnDemandStartTimeout": "15s",
                            "runOnDemandCloseAfter": "10s",
                        }
                    )
                    return resp2.status_code == 200
                return False
        except Exception as e:
            print(f"[MediaMTX API] Error adding path {path_name}: {e}")
            return False

    async def edit_path(self, path_name: str, rtsp_source: str, stream_type: str = "sub") -> bool:
        """Edit an existing camera path (update transcode command)"""
        transcode_cmd = self._build_transcode_cmd(rtsp_source, stream_type)
        try:
            async with httpx.AsyncClient(timeout=5) as client:
                resp = await client.patch(
                    f"{self.api_url}/v3/config/paths/patch/{path_name}",
                    json={
                        "runOnDemand": transcode_cmd,
                        "runOnDemandRestart": True,
                        "runOnDemandStartTimeout": "15s",
                        "runOnDemandCloseAfter": "10s",
                    }
                )
                return resp.status_code == 200
        except Exception as e:
            print(f"[MediaMTX API] Error editing path {path_name}: {e}")
            return False

    async def remove_path(self, path_name: str) -> bool:
        """Remove a camera path from MediaMTX"""
        try:
            async with httpx.AsyncClient(timeout=5) as client:
                resp = await client.delete(
                    f"{self.api_url}/v3/config/paths/delete/{path_name}"
                )
                return resp.status_code == 200
        except Exception as e:
            print(f"[MediaMTX API] Error removing path {path_name}: {e}")
            return False

    async def is_path_ready(self, path_name: str) -> bool:
        """Check if a path is currently streaming (has an active source)"""
        path_info = await self.get_path(path_name)
        if path_info:
            return path_info.get("ready", False)
        return False

    async def get_global_config(self) -> Optional[dict]:
        """Get MediaMTX global config"""
        try:
            async with httpx.AsyncClient(timeout=5) as client:
                resp = await client.get(f"{self.api_url}/v3/config/global/get")
                if resp.status_code == 200:
                    return resp.json()
                return None
        except Exception as e:
            print(f"[MediaMTX API] Error getting config: {e}")
            return None

    # ──────────────────────────────────────────────
    #  YAML Config File Management (fallback/alternative)
    # ──────────────────────────────────────────────

    def read_config(self) -> dict:
        """Read mediamtx.yml directly"""
        config_path = os.path.abspath(self.config_path)
        if not os.path.exists(config_path):
            print(f"[MediaMTX] Config not found: {config_path}")
            return {}
        with open(config_path, "r") as f:
            return yaml.safe_load(f) or {}

    def write_config(self, config: dict):
        """Write mediamtx.yml"""
        config_path = os.path.abspath(self.config_path)
        with open(config_path, "w") as f:
            yaml.dump(config, f, default_flow_style=False, allow_unicode=True)

    def add_path_to_config(self, path_name: str, rtsp_source: str) -> bool:
        """Add a camera path directly to mediamtx.yml (requires MediaMTX restart)"""
        try:
            config = self.read_config()
            if "paths" not in config:
                config["paths"] = {}
            config["paths"][path_name] = {
                "source": rtsp_source,
                "sourceOnDemand": True,
            }
            self.write_config(config)
            return True
        except Exception as e:
            print(f"[MediaMTX] Error adding path to config: {e}")
            return False

    def remove_path_from_config(self, path_name: str) -> bool:
        """Remove a camera path from mediamtx.yml"""
        try:
            config = self.read_config()
            if "paths" in config and path_name in config["paths"]:
                del config["paths"][path_name]
                self.write_config(config)
            return True
        except Exception as e:
            print(f"[MediaMTX] Error removing path from config: {e}")
            return False

    # ──────────────────────────────────────────────
    #  Stream URL builders
    # ──────────────────────────────────────────────

    def get_webrtc_url(self, path_name: str) -> str:
        """Get the WebRTC playback page URL"""
        host = settings.mediamtx_host
        port = settings.mediamtx_webrtc_port
        return f"http://{host}:{port}/{path_name}"

    def get_webrtc_whep_url(self, path_name: str) -> str:
        """Get the WebRTC WHEP endpoint (for programmatic WebRTC)"""
        host = settings.mediamtx_host
        port = settings.mediamtx_webrtc_port
        return f"http://{host}:{port}/{path_name}/whep"

    def get_webrtc_whip_url(self, path_name: str) -> str:
        """Get the WebRTC WHIP endpoint (for publishing)"""
        host = settings.mediamtx_host
        port = settings.mediamtx_webrtc_port
        return f"http://{host}:{port}/{path_name}/whip"

    def get_hls_url(self, path_name: str) -> str:
        """Get the HLS stream URL"""
        host = settings.mediamtx_host
        port = settings.mediamtx_hls_port
        return f"http://{host}:{port}/{path_name}"

    def get_rtsp_url(self, path_name: str) -> str:
        """Get the RTSP playback URL (via MediaMTX)"""
        host = settings.mediamtx_host
        port = settings.mediamtx_rtsp_port
        return f"rtsp://{host}:{port}/{path_name}"


# Singleton
mediamtx_service = MediaMTXService()
