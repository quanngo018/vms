"""
VMS FastAPI Backend - Main Application

Architecture:
  Camera (RTSP) → MediaMTX (converts to WebRTC/HLS) → Browser
  FastAPI Backend → Manages cameras, proxies MediaMTX API
  React Frontend → Calls FastAPI for data, connects to MediaMTX for video
"""
from fastapi import FastAPI, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import httpx
import sys
import os

from app.config import settings
from app.models import CameraCreate, CameraUpdate, CameraResponse
from app.camera_service import camera_service
from app.mediamtx_service import mediamtx_service

# Add camera config to path
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "..", "camera"))
try:
    from camera_config import CAMERAS as PREDEFINED_CAMERAS
except ImportError:
    PREDEFINED_CAMERAS = []


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("=" * 60)
    print("  VMS Backend Starting...")
    print(f"  MediaMTX API: {settings.mediamtx_api_url}")
    print(f"  MediaMTX RTSP: :{settings.mediamtx_rtsp_port}")
    print(f"  MediaMTX WebRTC: :{settings.mediamtx_webrtc_port}")
    print(f"  MediaMTX HLS: :{settings.mediamtx_hls_port}")
    print(f"  Predefined cameras: {len(PREDEFINED_CAMERAS)}")
    print("=" * 60)

    # Auto-register predefined cameras from camera_config.py
    if PREDEFINED_CAMERAS:
        print("[Startup] Auto-registering predefined cameras (main + sub streams)...")
        for cam in PREDEFINED_CAMERAS:
            try:
                data = CameraCreate(
                    name=cam["name"],
                    location=cam.get("location", ""),
                    rtsp_url=cam.get("rtsp_url_sub", cam["rtsp_url"]),
                    rtsp_url_main=cam.get("rtsp_url_main"),
                    path_name=cam["id"],
                    ip=cam.get("ip", ""),
                )
                await camera_service.add_camera(data)
                print(f"  ✅ {cam['id']} ({cam['ip']}) [main+sub]")
            except Exception as e:
                print(f"  ❌ {cam['id']}: {e}")
        print(f"[Startup] {len(PREDEFINED_CAMERAS)} cameras registered")

    yield
    print("VMS Backend shutting down...")


app = FastAPI(
    title="VMS Backend",
    description="Video Management System - FastAPI Backend with MediaMTX",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS - allow frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.frontend_url,
        "http://localhost:5173",
        "http://localhost:3000",
        "*",  # For development; restrict in production
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ──────────────────────────────────────────────
#  Health Check
# ──────────────────────────────────────────────

@app.get("/api/health")
async def health_check():
    """Check backend and MediaMTX status"""
    mediamtx_ok = False
    try:
        async with httpx.AsyncClient(timeout=3) as client:
            resp = await client.get(f"{settings.mediamtx_api_url}/v3/config/global/get")
            mediamtx_ok = resp.status_code == 200
    except Exception:
        pass

    return {
        "backend": "ok",
        "mediamtx_api": "ok" if mediamtx_ok else "unavailable",
        "mediamtx_host": settings.mediamtx_host,
        "ports": {
            "rtsp": settings.mediamtx_rtsp_port,
            "webrtc": settings.mediamtx_webrtc_port,
            "hls": settings.mediamtx_hls_port,
        }
    }


# ──────────────────────────────────────────────
#  Camera CRUD
# ──────────────────────────────────────────────

@app.post("/api/cameras", response_model=CameraResponse)
async def add_camera(data: CameraCreate):
    """
    Add a new camera.
    This registers the camera and tells MediaMTX to pull from its RTSP URL.
    
    Example:
    {
        "name": "Camera Entrance",
        "location": "Main Gate",
        "rtsp_url": "rtsp://admin:admin@192.168.1.100:554/stream1",
        "path_name": "cam_001"
    }
    """
    return await camera_service.add_camera(data)


@app.get("/api/cameras", response_model=list[CameraResponse])
async def list_cameras():
    """List all registered cameras"""
    return await camera_service.list_cameras()


@app.get("/api/cameras/{camera_id}", response_model=CameraResponse)
async def get_camera(camera_id: str):
    """Get a specific camera"""
    cam = await camera_service.get_camera(camera_id)
    if not cam:
        raise HTTPException(status_code=404, detail="Camera not found")
    return cam


@app.put("/api/cameras/{camera_id}", response_model=CameraResponse)
async def update_camera(camera_id: str, data: CameraUpdate):
    """Update camera info"""
    cam = await camera_service.update_camera(camera_id, data)
    if not cam:
        raise HTTPException(status_code=404, detail="Camera not found")
    return cam


@app.delete("/api/cameras/{camera_id}")
async def delete_camera(camera_id: str):
    """Delete a camera (also removes from MediaMTX)"""
    ok = await camera_service.delete_camera(camera_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Camera not found")
    return {"message": "Camera deleted"}


# ──────────────────────────────────────────────
#  Camera Status
# ──────────────────────────────────────────────

@app.post("/api/cameras/{camera_id}/refresh")
async def refresh_camera_status(camera_id: str):
    """Refresh camera stream status from MediaMTX"""
    cam = await camera_service.refresh_status(camera_id)
    if not cam:
        raise HTTPException(status_code=404, detail="Camera not found")
    return cam


@app.post("/api/cameras/refresh-all")
async def refresh_all_cameras():
    """Refresh status for all cameras"""
    return await camera_service.refresh_all_status()


# ──────────────────────────────────────────────
#  MediaMTX Proxy Endpoints
# ──────────────────────────────────────────────

@app.get("/api/mediamtx/paths")
async def get_mediamtx_paths():
    """List all active streams in MediaMTX"""
    return await mediamtx_service.list_paths()


@app.get("/api/mediamtx/paths/{path_name}")
async def get_mediamtx_path(path_name: str):
    """Get info about a specific stream"""
    info = await mediamtx_service.get_path(path_name)
    if not info:
        raise HTTPException(status_code=404, detail="Path not found")
    return info


@app.get("/api/mediamtx/config")
async def get_mediamtx_config():
    """Get MediaMTX global config"""
    config = await mediamtx_service.get_global_config()
    if not config:
        raise HTTPException(status_code=503, detail="MediaMTX API unavailable")
    return config


# ──────────────────────────────────────────────
#  Stream URL Helper
# ──────────────────────────────────────────────

@app.get("/api/streams/{path_name}/urls")
async def get_stream_urls(path_name: str):
    """
    Get all streaming URLs for a given path.
    Frontend uses this to know how to connect to MediaMTX.
    """
    return {
        "path_name": path_name,
        "webrtc_page": mediamtx_service.get_webrtc_url(path_name),
        "webrtc_whep": mediamtx_service.get_webrtc_whep_url(path_name),
        "hls": mediamtx_service.get_hls_url(path_name),
        "rtsp": mediamtx_service.get_rtsp_url(path_name),
    }


# ──────────────────────────────────────────────
#  WebRTC WHEP Proxy (avoid CORS issues)
# ──────────────────────────────────────────────

@app.post("/api/webrtc/{path_name}/whep")
async def proxy_webrtc_whep(path_name: str, request: Request):
    """
    Proxy WebRTC WHEP requests to MediaMTX.
    This avoids CORS issues when frontend connects to MediaMTX WebRTC.
    
    WHEP flow:
    1. Browser sends SDP offer (POST with application/sdp)
    2. MediaMTX returns SDP answer
    3. WebRTC connection established directly between browser and MediaMTX
    """
    body = await request.body()
    content_type = request.headers.get("content-type", "application/sdp")

    whep_url = mediamtx_service.get_webrtc_whep_url(path_name)

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.post(
                whep_url,
                content=body,
                headers={"Content-Type": content_type},
            )
            return Response(
                content=resp.content,
                status_code=resp.status_code,
                headers={
                    "Content-Type": resp.headers.get("Content-Type", "application/sdp"),
                    "Location": resp.headers.get("Location", ""),
                },
            )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"MediaMTX WebRTC error: {str(e)}")


@app.options("/api/webrtc/{path_name}/whep")
async def proxy_webrtc_whep_options(path_name: str):
    """Handle CORS preflight for WHEP endpoint"""
    return Response(
        status_code=204,
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
        },
    )


# ──────────────────────────────────────────────
#  DeepStream Integration
# ──────────────────────────────────────────────

@app.get("/api/deepstream/status")
async def deepstream_status():
    """
    Check if DeepStream RTSP output is available.
    DeepStream can output:
    - Tiled view: rtsp://localhost:8554/tiled_view
    - Individual: rtsp://localhost:9554/cam_001, cam_002, ...
    """
    results = {
        "tiled_view": False,
        "individual_streams": {},
    }

    # Check tiled view
    try:
        async with httpx.AsyncClient(timeout=2) as client:
            # Check if tiled_view path exists in MediaMTX
            resp = await client.get(f"{settings.mediamtx_api_url}/v3/paths/get/tiled_view")
            results["tiled_view"] = resp.status_code == 200
    except Exception:
        pass

    # Check individual DeepStream streams
    cameras = await camera_service.list_cameras()
    for cam in cameras:
        path = cam.path_name
        try:
            async with httpx.AsyncClient(timeout=2) as client:
                resp = await client.get(f"{settings.mediamtx_api_url}/v3/paths/get/{path}")
                if resp.status_code == 200:
                    data = resp.json()
                    results["individual_streams"][path] = data.get("ready", False)
                else:
                    results["individual_streams"][path] = False
        except Exception:
            results["individual_streams"][path] = False

    return results


@app.post("/api/deepstream/register-tiled")
async def register_deepstream_tiled():
    """
    Register DeepStream tiled output as a MediaMTX path.
    Call this after starting deepstream_rtsp_output.py --mode tiled
    """
    # DeepStream tiled output at port 8554 (default)
    tiled_rtsp = f"rtsp://localhost:{settings.mediamtx_rtsp_port}/tiled_view"
    ok = await mediamtx_service.add_path("deepstream_tiled", tiled_rtsp)
    if ok:
        return {
            "message": "DeepStream tiled view registered",
            "webrtc_url": mediamtx_service.get_webrtc_url("deepstream_tiled"),
            "hls_url": mediamtx_service.get_hls_url("deepstream_tiled"),
        }
    raise HTTPException(status_code=500, detail="Failed to register tiled view")


# ──────────────────────────────────────────────
#  Entry point
# ──────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.backend_host,
        port=settings.backend_port,
        reload=True,
    )
