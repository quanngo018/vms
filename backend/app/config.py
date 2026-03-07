"""
VMS FastAPI Backend - Configuration
"""
import os
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

load_dotenv()


class Settings(BaseSettings):
    # MediaMTX
    mediamtx_api_url: str = os.getenv("MEDIAMTX_API_URL", "http://localhost:9997")
    mediamtx_rtsp_port: int = int(os.getenv("MEDIAMTX_RTSP_PORT", "8554"))
    mediamtx_webrtc_port: int = int(os.getenv("MEDIAMTX_WEBRTC_PORT", "8889"))
    mediamtx_hls_port: int = int(os.getenv("MEDIAMTX_HLS_PORT", "8888"))
    mediamtx_host: str = os.getenv("MEDIAMTX_HOST", "localhost")

    # Backend
    backend_host: str = os.getenv("BACKEND_HOST", "0.0.0.0")
    backend_port: int = int(os.getenv("BACKEND_PORT", "8000"))

    # CORS
    frontend_url: str = os.getenv("FRONTEND_URL", "http://localhost:5173")

    # Transcoding H.265 → H.264 for WebRTC
    # "gstreamer" = GStreamer (auto-detect Jetson HW; falls back to SW avdec_h265 + x264enc)
    # "ffmpeg"    = FFmpeg software (libx264)
    transcode_method: str = os.getenv("TRANSCODE_METHOD", "gstreamer")
    transcode_bitrate: int = int(os.getenv("TRANSCODE_BITRATE", "800000"))  # sub-stream
    transcode_bitrate_main: int = int(os.getenv("TRANSCODE_BITRATE_MAIN", "3000000"))  # main-stream
    transcode_rtsp_latency: int = int(os.getenv("TRANSCODE_RTSP_LATENCY", "200"))
    transcode_threads: int = int(os.getenv("TRANSCODE_THREADS", "2"))

    # MediaMTX config file path (for dynamic path management)
    mediamtx_config_path: str = os.getenv(
        "MEDIAMTX_CONFIG_PATH",
        os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                     "mediamtx", "mediamtx.yml")
    )

    class Config:
        env_file = ".env"


settings = Settings()
