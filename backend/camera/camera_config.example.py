"""
Camera Configuration - Shared between DeepStream, Backend, and MediaMTX

Single source of truth for all camera RTSP URLs.
Used by:
  - DeepStream pipeline (test_multicam.py)
  - FastAPI backend (auto-register cameras)
  - MediaMTX config generator

SETUP INSTRUCTIONS:
  1. Copy this file to camera_config.py:
       cp camera_config.example.py camera_config.py
  2. Edit camera_config.py and fill in your actual camera details.
  3. camera_config.py is git-ignored so your credentials stay private.
"""

# ─── Camera Definitions ──────────────────────────────────
# Each camera has:
#   - id: unique path name for MediaMTX (e.g., "cam_001")
#   - name: display name
#   - location: physical location
#   - rtsp_url_main: mainstream RTSP URL (high-res, for single camera view)
#   - rtsp_url_sub:  sub-stream RTSP URL (low-res, for grid / multi-cam view)
#   - rtsp_url:      alias → rtsp_url_sub (backward compatibility)
#   - ip: camera IP

CAMERAS = [
    {
        "id": "cam_001",
        "name": "Camera 01",
        "location": "Location A",
        "ip": "192.168.1.100",
        "rtsp_url_main": "rtsp://username:password@192.168.1.100:554/ch1/main",
        "rtsp_url_sub": "rtsp://username:password@192.168.1.100:554/ch1/sub",
        "rtsp_url": "rtsp://username:password@192.168.1.100:554/ch1/sub",
    },
    {
        "id": "cam_002",
        "name": "Camera 02",
        "location": "Location B",
        "ip": "192.168.1.101",
        "rtsp_url_main": "rtsp://username:password@192.168.1.101:554/ch1/main",
        "rtsp_url_sub": "rtsp://username:password@192.168.1.101:554/ch1/sub",
        "rtsp_url": "rtsp://username:password@192.168.1.101:554/ch1/sub",
    },
    # Add more cameras as needed...
]

# ─── DeepStream RTSP Sources ─────────────────────────────
# Auto-generated from CAMERAS list. Used by DeepStream pipelines.
RTSP_SOURCES = [cam["rtsp_url_sub"] for cam in CAMERAS]
RTSP_SOURCES_MAIN = [cam["rtsp_url_main"] for cam in CAMERAS]
RTSP_SOURCES_SUB = RTSP_SOURCES  # alias


# ─── Helper Functions ────────────────────────────────────

def get_camera_by_id(cam_id: str):
    """Get camera config by ID (e.g., 'cam_001')"""
    for cam in CAMERAS:
        if cam["id"] == cam_id:
            return cam
    return None


def get_camera_by_index(index: int):
    """Get camera config by index (compatible with DeepStream source_id)"""
    if 0 <= index < len(CAMERAS):
        return CAMERAS[index]
    return None


def get_rtsp_url(cam_id: str, stream: str = "sub") -> str | None:
    """Get RTSP URL for a camera by ID.

    Args:
        cam_id: Camera ID (e.g., "cam_001")
        stream: "main" for high-res single view, "sub" for grid/multi-cam view
    """
    cam = get_camera_by_id(cam_id)
    if cam is None:
        return None
    key = "rtsp_url_main" if stream == "main" else "rtsp_url_sub"
    return cam[key]
