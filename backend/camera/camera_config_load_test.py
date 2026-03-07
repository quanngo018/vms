"""
Test load N cameras at backend and Media Server (MediaMTX and FFmpeg transcode).

This script generates N virtual cameras by duplicating the base cameras.
It connects to the local MediaMTX RTSP streams (instead of hitting the IP cameras directly)
to avoid overloading the actual hardware cameras.

Usage:
  python3 camera_config_load_test.py --total 50

Make sure MediaMTX and Backend are running before executing this script.
"""

import sys
import os
import argparse
from typing import List, Dict, Any

# Import base cameras and registration logic
from camera_config import CAMERAS as ORIGINAL_CAMERAS
from register_cameras import register_mediamtx, register_backend

def generate_virtual_cameras(total_cameras: int) -> List[Dict[str, Any]]:
    """Generate N cameras by duplicating the original ones."""
    cameras = ORIGINAL_CAMERAS.copy()

    # If the requested total is less than original, just return a subset
    if total_cameras <= len(ORIGINAL_CAMERAS):
        return cameras[:total_cameras]

    print(f"Generating {total_cameras - len(ORIGINAL_CAMERAS)} virtual cameras...")
    
    for i in range(len(ORIGINAL_CAMERAS), total_cameras):
        # Pick one of the base cameras to duplicate
        base_cam = ORIGINAL_CAMERAS[i % len(ORIGINAL_CAMERAS)]
        
        # VERY IMPORTANT: Use the local MediaMTX stream as the source!
        # This prevents opening 100+ connections to a single physical IP camera,
        # which would crash the camera.
        local_rtsp_main = f"rtsp://localhost:8554/{base_cam['id']}"
        local_rtsp_sub = f"rtsp://localhost:8554/{base_cam['id']}_sub"
        
        cam_id = f"cam_{i + 1:03d}"
        
        cameras.append({
            "id": cam_id,
            "name": f"Virtual Cam {i + 1:03d}",
            "location": "Virtual (Load Test)",
            "ip": "localhost",
            "rtsp_url_main": local_rtsp_main,
            "rtsp_url_sub": local_rtsp_sub,
            "rtsp_url": local_rtsp_sub,
        })

    return cameras

def main():
    parser = argparse.ArgumentParser(description="Load Test Camera Generator")
    parser.add_argument(
        "--total", 
        type=int, 
        default=50, 
        help="Total number of cameras to register (default: 50)"
    )
    parser.add_argument("--backend-only", action="store_true", help="Only register in backend")
    parser.add_argument("--mediamtx-only", action="store_true", help="Only register in MediaMTX")
    
    args = parser.parse_args()

    print("=" * 60)
    print(f"  VMS Load Test Preparation Script")
    print(f"  Target Total Cameras: {args.total}")
    print("=" * 60)

    # 1. Generate Virtual Cameras
    generated_cameras = generate_virtual_cameras(args.total)
    print(f"Total cameras prepared for registration: {len(generated_cameras)}")
    
    # 2. Register them to MediaMTX and Backend
    mediamtx_ok = 0
    backend_ok = 0

    if not args.backend_only:
        mediamtx_ok = register_mediamtx(generated_cameras)

    if not args.mediamtx_only:
        backend_ok = register_backend(generated_cameras)

    # 3. Summary
    print(f"\n{'='*50}")
    print(f"  LOAD TEST REGISTRATION COMPLETE")
    print(f"{'='*50}")
    if not args.backend_only:
        print(f"  MediaMTX: {mediamtx_ok}/{len(generated_cameras)} cameras")
    if not args.mediamtx_only:
        print(f"  Backend:  {backend_ok}/{len(generated_cameras)} cameras")
    
    print("\n[INSTRUCTIONS FOR LOAD TESTING]")
    print("1. MediaMTX is now configured to pull all these streams.")
    print("2. Streams are configured as 'runOnDemand' in MediaMTX by default.")
    print("   To truly load test the server (force all streams to decode continuously),")
    print("   you need to either connect to them or set 'runOnDemand: false' in mediamtx.yml")
    print("3. Alternatively, open multiple tabs of the Web UI (http://localhost:5173)")
    print("   and navigate to different pages to trigger standard usage load.")
    print("4. Monitor server usage in another terminal:")
    print("   - CPU/RAM: 'htop'")
    print("   - GPU:     'nvidia-smi' or 'jtop' (if on Jetson)")
    print("=" * 60)

if __name__ == "__main__":
    main()
