"""
Camera Models - Pydantic schemas for camera data
"""
from pydantic import BaseModel
from typing import Optional
from enum import Enum


class CameraStatus(str, Enum):
    online = "online"
    offline = "offline"


class CameraCreate(BaseModel):
    """Schema for adding a new camera"""
    name: str
    location: str = ""
    rtsp_url: str  # Sub-stream URL (default for grid view)
    rtsp_url_main: Optional[str] = None  # Main-stream URL (high-res, single camera view)
    path_name: str  # MediaMTX path name, e.g. "cam_001"
    ip: str = ""
    resolution: str = "1920x1080"
    fps: int = 25
    camera_type: str = "Fixed Dome"


class CameraUpdate(BaseModel):
    """Schema for updating a camera"""
    name: Optional[str] = None
    location: Optional[str] = None
    rtsp_url: Optional[str] = None
    rtsp_url_main: Optional[str] = None
    ip: Optional[str] = None
    resolution: Optional[str] = None
    fps: Optional[int] = None
    camera_type: Optional[str] = None


class CameraResponse(BaseModel):
    """Schema for camera response"""
    id: str
    name: str
    location: str
    ip: str
    status: CameraStatus
    rtsp_url: str
    rtsp_url_main: str = ""
    path_name: str
    resolution: str
    fps: int
    camera_type: str
    # Streaming URLs (computed)
    webrtc_url: str = ""
    hls_url: str = ""
    rtsp_play_url: str = ""


class StreamInfo(BaseModel):
    """Stream info from MediaMTX"""
    name: str
    source_type: str = ""
    ready: bool = False
    readers: int = 0
    bytesReceived: int = 0
