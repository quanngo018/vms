"""
Camera Service - Business logic for camera management
Stores camera data in-memory (replace with database later)
"""
import uuid
from typing import Dict, Optional, List
from app.models import CameraCreate, CameraUpdate, CameraResponse, CameraStatus
from app.mediamtx_service import mediamtx_service


class CameraService:
    """Manages camera registry and coordinates with MediaMTX"""

    def __init__(self):
        # In-memory store: {camera_id: camera_dict}
        # Replace with database (SQLite/PostgreSQL) for production
        self._cameras: Dict[str, dict] = {}

    def _generate_id(self) -> str:
        return f"cam_{uuid.uuid4().hex[:8]}"

    def _build_response(self, cam: dict) -> CameraResponse:
        path = cam["path_name"]
        return CameraResponse(
            id=cam["id"],
            name=cam["name"],
            location=cam["location"],
            ip=cam["ip"],
            status=cam["status"],
            rtsp_url=cam["rtsp_url"],
            rtsp_url_main=cam.get("rtsp_url_main", ""),
            path_name=cam["path_name"],
            resolution=cam["resolution"],
            fps=cam["fps"],
            camera_type=cam["camera_type"],
            webrtc_url=mediamtx_service.get_webrtc_url(path),
            hls_url=mediamtx_service.get_hls_url(path),
            rtsp_play_url=mediamtx_service.get_rtsp_url(path),
        )

    async def add_camera(self, data: CameraCreate) -> CameraResponse:
        """
        Add a camera:
        1. Register in our store (skip if path_name already exists)
        2. Add path to MediaMTX (so it pulls from the camera RTSP)
        """
        # Dedup: if path_name already registered, return existing
        for existing in self._cameras.values():
            if existing["path_name"] == data.path_name:
                return self._build_response(existing)

        cam_id = self._generate_id()

        # Register both main and sub MediaMTX paths
        # Main stream: path_name (e.g. cam_001) → high-res for single camera view
        # Sub stream:  path_name_sub (e.g. cam_001_sub) → low-res for grid view
        rtsp_main = data.rtsp_url_main or data.rtsp_url
        added_main = await mediamtx_service.add_path(data.path_name, rtsp_main, stream_type="main")
        added_sub = await mediamtx_service.add_path(f"{data.path_name}_sub", data.rtsp_url, stream_type="sub")
        added = added_main or added_sub

        cam = {
            "id": cam_id,
            "name": data.name,
            "location": data.location,
            "ip": data.ip or self._extract_ip(data.rtsp_url),
            "status": CameraStatus.online if added else CameraStatus.offline,
            "rtsp_url": data.rtsp_url,
            "rtsp_url_main": rtsp_main,
            "path_name": data.path_name,
            "resolution": data.resolution,
            "fps": data.fps,
            "camera_type": data.camera_type,
        }

        self._cameras[cam_id] = cam
        return self._build_response(cam)

    async def get_camera(self, camera_id: str) -> Optional[CameraResponse]:
        cam = self._cameras.get(camera_id)
        if not cam:
            return None
        return self._build_response(cam)

    async def list_cameras(self) -> List[CameraResponse]:
        return [self._build_response(cam) for cam in self._cameras.values()]

    async def update_camera(self, camera_id: str, data: CameraUpdate) -> Optional[CameraResponse]:
        cam = self._cameras.get(camera_id)
        if not cam:
            return None

        update_dict = data.model_dump(exclude_unset=True)
        for key, value in update_dict.items():
            if key in cam:
                cam[key] = value

        # If RTSP URL changed, update MediaMTX paths
        if "rtsp_url" in update_dict:
            await mediamtx_service.edit_path(f"{cam['path_name']}_sub", cam["rtsp_url"], stream_type="sub")
        if "rtsp_url_main" in update_dict:
            await mediamtx_service.edit_path(cam["path_name"], cam["rtsp_url_main"], stream_type="main")

        self._cameras[camera_id] = cam
        return self._build_response(cam)

    async def delete_camera(self, camera_id: str) -> bool:
        cam = self._cameras.get(camera_id)
        if not cam:
            return False
        # Remove both main and sub paths from MediaMTX
        await mediamtx_service.remove_path(cam["path_name"])
        await mediamtx_service.remove_path(f"{cam['path_name']}_sub")
        del self._cameras[camera_id]
        return True

    async def refresh_status(self, camera_id: str) -> Optional[CameraResponse]:
        """Check if camera stream is actually active in MediaMTX"""
        cam = self._cameras.get(camera_id)
        if not cam:
            return None
        ready = await mediamtx_service.is_path_ready(cam["path_name"])
        cam["status"] = CameraStatus.online if ready else CameraStatus.offline
        return self._build_response(cam)

    async def refresh_all_status(self) -> List[CameraResponse]:
        """Refresh status for all cameras"""
        results = []
        for cam_id in list(self._cameras.keys()):
            result = await self.refresh_status(cam_id)
            if result:
                results.append(result)
        return results

    @staticmethod
    def _extract_ip(rtsp_url: str) -> str:
        """Extract IP from RTSP URL"""
        try:
            # rtsp://user:pass@192.168.1.100:554/stream
            after_protocol = rtsp_url.split("://")[1]
            host_part = after_protocol.split("/")[0]
            if "@" in host_part:
                host_part = host_part.split("@")[1]
            return host_part.split(":")[0]
        except Exception:
            return ""


# Singleton
camera_service = CameraService()
