# VMS Version 1 — System Documentation

> **Platform:** NVIDIA Jetson AGX Orin (aarch64, 12 CPU cores, 62 GB RAM)
> **Date:** 2026-02-24

---

## 1. Tổng quan hệ thống

VMS (Video Management System) là hệ thống quản lý và hiển thị camera IP trên trình duyệt web. Hệ thống gồm 4 thành phần chính:

         (Request)            (Start)            (Pull RTSP)
Browser ----------> MediaMTX ----------> FFmpeg ------------> Camera

        (H.265)             (H.264)             (WebRTC)
Camera ----------> FFmpeg ----------> MediaMTX ----------> Browser

BOTTLENECK: Transcode H.265 → H.264

```
┌────────────────┐      RTSP (H.265)       ┌──────────────┐
│  15 IP Cameras │ ──────────────────────── │   MediaMTX   │
│  192.168.1.x   │                          │   v1.16.2    │
└────────────────┘                          └──────┬───────┘
                                                   │
                              ┌─────────────────────┼─────────────────────┐
                              │                     │                     │
                         RTSP :8554           WebRTC :8889           HLS :8888
                              │                     │                     │
                              │              ┌──────┴───────┐             │
                              │              │  FFmpeg x15  │             │
                              │              │  (transcode  │             │
                              │              │  H.265→H.264)│             │
                              │              └──────────────┘             │
                              │                     │                     │
                              │                WHEP Proxy                 │
                              │              ┌──────┴───────┐             │
                              │              │   FastAPI    │             │
                              │              │  Backend     │             │
                              │              │  :8000       │             │
                              │              └──────┬───────┘             │
                              │                     │  /api/*             │
                              │              ┌──────┴───────┐             │
                              │              │  Vite React  │             │
                              │              │  Frontend    │             │
                              │              │  :5173       │             │
                              │              └──────────────┘             │
                              │                     │                     │
                              └─────────────────────┼─────────────────────┘
                                                    │
                                              ┌─────┴─────┐
                                              │  Browser   │
                                              └───────────┘
```

---

## 2. Thành phần & Ports

| Thành phần         | Port   | Mô tả                                                |
| ------------------- | ------ | ----------------------------------------------------- |
| **MediaMTX**        | `:8554`  | RTSP server — nhận stream từ camera & FFmpeg        |
| **MediaMTX**        | `:8889`  | WebRTC (WHEP/WHIP) — phát stream tới browser        |
| **MediaMTX**        | `:8888`  | HLS — phát stream qua HTTP                           |
| **MediaMTX**        | `:9997`  | Control API — quản lý path/config qua REST           |
| **MediaMTX**        | `:8010`  | RTP (nội bộ, tránh conflict với backend :8000)       |
| **FastAPI Backend** | `:8000`  | REST API — quản lý camera, proxy WHEP                |
| **Vite Frontend**   | `:5173`  | React dev server — giao diện web                     |

---

## 3. Cấu trúc thư mục

```
vms/
├── start.sh                          # Script khởi động toàn bộ hệ thống
├── backend/
│   ├── .env                          # Biến môi trường (ports, transcode config)
│   ├── requirements.txt              # Python dependencies
│   ├── venv/                         # Python virtual environment
│   └── app/
│       ├── main.py                   # FastAPI app, routes, lifespan startup
│       ├── config.py                 # Pydantic Settings (đọc từ .env)
│       ├── models.py                 # Pydantic schemas (CameraCreate/Response...)
│       ├── camera_service.py         # Business logic: CRUD camera, sync MediaMTX
│       └── mediamtx_service.py       # Giao tiếp MediaMTX API + build transcode cmd
├── camera/
│   ├── camera_config.py              # Source of truth: 15 camera (IP, RTSP URL, ID)
│   ├── register_cameras.py           # Script đăng ký camera vào MediaMTX & Backend
│   └── mediamtx_v1.16.2/
│       ├── mediamtx                  # Binary MediaMTX (aarch64)
│       └── mediamtx.yml              # Config: api: true, ports, paths
└── frontend/
    ├── package.json
    ├── vite.config.js                # Proxy /api → localhost:8000
    ├── index.html
    └── src/
        ├── App.jsx                   # Router chính
        ├── pages/
        │   ├── LiveMonitor.jsx       # Trang xem camera live (grid + sidebar)
        │   ├── Dashboard.jsx
        │   ├── CameraManagement.jsx
        │   ├── EventHistory.jsx
        │   └── Settings.jsx
        ├── components/
        │   └── monitor/
        │       ├── CameraPlayer.jsx  # Component phát video (WebRTC WHEP)
        │       ├── VideoGrid.jsx     # Grid layout multi-camera
        │       ├── LeftControlPanel.jsx
        │       └── BottomBar.jsx     # Layout selector + pagination
        ├── services/
        │   └── videoStream.js        # WHEP client, API calls, URL builders
        ├── mock/
        │   └── data.js               # 15 camera mock data (fallback)
        └── layouts/
            ├── MainLayout.jsx
            └── TopBar.jsx
```

---

## 4. Luồng khởi động (start.sh)

```
start.sh
  │
  ├── [1] Kill stale processes trên ports 8554/8889/8888/9997/8000/5173
  │
  ├── [2] Start MediaMTX
  │       cd camera/mediamtx_v1.16.2 && ./mediamtx &
  │       → Ports: 8554, 8889, 8888, 9997
  │       → api: true (Control API bật)
  │
  ├── [3] Start FastAPI Backend
  │       cd backend && source venv/bin/activate
  │       uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload &
  │       → Lifespan startup: auto-register 15 cameras từ camera_config.py
  │       → Mỗi camera → camera_service.add_camera() → mediamtx_service.add_path()
  │
  ├── [4] Start Vite Frontend
  │       cd frontend && npm run dev &
  │       → Port 5173, proxy /api → localhost:8000
  │
  └── [5] Register cameras vào MediaMTX
          cd camera && python3 register_cameras.py --mediamtx-only --no-wait
          → POST /v3/config/paths/add/{cam_xxx} cho mỗi camera
          → Body: { runOnDemand: "<ffmpeg transcode cmd>", ... }
```

**Kết quả sau khởi động:**
- 15 paths đã được đăng ký trong MediaMTX (cam_001 → cam_015)
- 15 cameras đã được lưu trong backend (in-memory)
- Frontend sẵn sàng tại http://localhost:5173

---

## 5. Luồng Streaming (Camera → Browser)

### 5.1 Vấn đề codec

Camera IP stream **H.265 (HEVC)**, nhưng WebRTC trên browser **không hỗ trợ H.265**. Do đó cần **transcode H.265 → H.264** trước khi phát qua WebRTC.

### 5.2 Cơ chế On-Demand Transcode

MediaMTX sử dụng **`runOnDemand`** — FFmpeg transcode chỉ khởi động khi có viewer yêu cầu stream.

```
Browser yêu cầu cam_001
         │
         ▼
   MediaMTX nhận WHEP request cho path "cam_001"
         │
         ▼
   Path chưa có source → trigger runOnDemand
         │
         ▼
   MediaMTX spawn FFmpeg process:
   ┌──────────────────────────────────────────────────────────────────────┐
   │ ffmpeg -fflags nobuffer -flags low_delay                            │
   │   -rtsp_transport tcp -i rtsp://admin:XXX@192.168.1.133:554/ch1/sub│
   │   -c:v libx264 -preset ultrafast -tune zerolatency                 │
   │   -threads 2 -b:v 800000 -maxrate 800000 -bufsize 400000           │
   │   -g 30 -keyint_min 15                                             │
   │   -an -f rtsp rtsp://localhost:8554/cam_001                        │
   └──────────────────────────────────────────────────────────────────────┘
         │
         ▼
   FFmpeg: pull H.265 từ camera → decode → encode H.264 → push RTSP lên MediaMTX
         │
         ▼
   MediaMTX: nhận H.264 RTSP → convert sang WebRTC → gửi tới browser
         │
         ▼
   Browser: nhận video qua WebRTC peer connection
```

**Thông số FFmpeg transcode:**

| Tham số              | Giá trị        | Ý nghĩa                                  |
| -------------------- | -------------- | ----------------------------------------- |
| `-c:v libx264`       | software       | Encode bằng CPU (NVENC không khả dụng)    |
| `-preset ultrafast`  | —              | Tốc độ encode nhanh nhất, thấp CPU nhất   |
| `-tune zerolatency`  | —              | Không look-ahead, giảm delay              |
| `-threads 2`         | 2 thread/cam   | Giới hạn thread tránh tràn CPU            |
| `-b:v 800000`        | 800 Kbps       | Bitrate phù hợp 768×432 sub-stream       |
| `-maxrate / -bufsize`| 800K / 400K    | CBR-ish, tránh spike                      |
| `-g 30`              | 30 frames      | GOP size cho WebRTC                       |
| `-an`                | no audio       | Bỏ audio, giảm overhead                   |

**Timeout config:**

| Tham số                    | Giá trị | Ý nghĩa                                        |
| -------------------------- | ------- | ----------------------------------------------- |
| `runOnDemandStartTimeout`  | 15s     | Chờ FFmpeg sẵn sàng tối đa 15 giây             |
| `runOnDemandCloseAfter`    | 10s     | Tắt FFmpeg sau 10 giây không có viewer          |
| `runOnDemandRestart`       | true    | Tự restart FFmpeg nếu crash                     |

### 5.3 Hiệu năng (15 camera đồng thời)

| Metric              | Giá trị                               |
| -------------------- | ------------------------------------- |
| FFmpeg tổng CPU      | ~107% single-core (= ~8.9% / 12 cores)|
| CPU mỗi camera       | ~7.1%                                 |
| FPS encode           | 10 fps                                |
| RAM mỗi FFmpeg       | ~0.1% (~60 MB)                        |
| Resolution           | 768×432 (sub-stream)                  |

---

## 6. Luồng WebRTC WHEP (Browser ↔ MediaMTX)

```
┌─────────────┐              ┌─────────────┐              ┌─────────────┐
│   Browser    │              │   FastAPI    │              │  MediaMTX   │
│ (React app)  │              │   :8000      │              │   :8889     │
└──────┬──────┘              └──────┬──────┘              └──────┬──────┘
       │                            │                            │
       │  1. Create RTCPeerConn     │                            │
       │  2. Add transceiver        │                            │
       │     (video: recvonly)      │                            │
       │  3. Create SDP Offer       │                            │
       │  4. Wait ICE gathering     │                            │
       │                            │                            │
       │  ── POST /api/webrtc/ ──── │                            │
       │     cam_001/whep           │                            │
       │     Body: SDP Offer        │                            │
       │                            │  ── POST /cam_001/whep ──  │
       │                            │     Body: SDP Offer        │
       │                            │                            │
       │                            │  ◄── 201 SDP Answer ────── │
       │  ◄── 201 SDP Answer ────── │                            │
       │                            │                            │
       │  5. setRemoteDescription   │                            │
       │  6. ICE connection          │                            │
       │  7. RTP media flow  ◄───────────────────────────────── │
       │     (H.264 video)          │                            │
       │                            │                            │
       │  8. ontrack → video.play() │                            │
       │                            │                            │
```

**Tại sao cần WHEP Proxy qua FastAPI?**
- MediaMTX WebRTC chạy trên port `:8889` — khác origin với frontend `:5173`
- Browser chặn cross-origin fetch (CORS)
- FastAPI proxy: Frontend gọi `/api/webrtc/cam_001/whep` → FastAPI forward tới `localhost:8889/cam_001/whep`
- Vite config proxy `/api` → `localhost:8000` — nên request đi qua cùng origin

---

## 7. Luồng API Backend

### 7.1 Camera CRUD

```
Frontend (fetch)                         FastAPI                        MediaMTX
     │                                      │                              │
     │── GET /api/cameras ──────────────── │                              │
     │◄── [{id, name, path_name, ...}] ──  │                              │
     │                                      │                              │
     │── POST /api/cameras ─────────────── │                              │
     │   {name, rtsp_url, path_name}       │                              │
     │                                      │── POST /v3/config/paths/ ── │
     │                                      │   add/cam_xxx               │
     │                                      │   {runOnDemand: "ffmpeg.."} │
     │                                      │◄── 200 OK ──────────────── │
     │◄── {id, name, status: online} ────  │                              │
     │                                      │                              │
     │── DELETE /api/cameras/{id} ──────── │                              │
     │                                      │── DELETE /v3/config/paths/  │
     │                                      │   delete/cam_xxx            │
     │◄── {message: "deleted"} ──────────  │                              │
```

### 7.2 API Endpoints

| Method   | Path                              | Mô tả                               |
| -------- | --------------------------------- | ------------------------------------ |
| `GET`    | `/api/health`                     | Health check (backend + MediaMTX)    |
| `POST`   | `/api/cameras`                    | Thêm camera mới                     |
| `GET`    | `/api/cameras`                    | Danh sách tất cả camera              |
| `GET`    | `/api/cameras/{id}`               | Chi tiết 1 camera                    |
| `PUT`    | `/api/cameras/{id}`               | Cập nhật camera                      |
| `DELETE` | `/api/cameras/{id}`               | Xóa camera                           |
| `POST`   | `/api/cameras/{id}/refresh`       | Refresh trạng thái (check MediaMTX)  |
| `POST`   | `/api/cameras/refresh-all`        | Refresh tất cả camera                |
| `GET`    | `/api/mediamtx/paths`             | Danh sách paths trong MediaMTX       |
| `GET`    | `/api/mediamtx/paths/{name}`      | Chi tiết 1 path                      |
| `GET`    | `/api/mediamtx/config`            | Config MediaMTX                      |
| `GET`    | `/api/streams/{name}/urls`        | URLs streaming cho 1 path            |
| `POST`   | `/api/webrtc/{name}/whep`         | **WHEP Proxy** (SDP offer → answer)  |
| `GET`    | `/api/deepstream/status`          | Trạng thái DeepStream                |

### 7.3 Data Model

```python
CameraCreate {
    name: str                    # "Cam 01"
    location: str                # "192.168.1.133"
    rtsp_url: str                # "rtsp://admin:XXX@192.168.1.133:554/ch1/sub"
    path_name: str               # "cam_001" (MediaMTX path)
    ip: str                      # "192.168.1.133"
    resolution: str = "1920x1080"
    fps: int = 25
    camera_type: str = "Fixed Dome"
}

CameraResponse {
    id: str                      # "cam_a1b2c3d4" (auto-generated UUID)
    name, location, ip, status,
    rtsp_url, path_name,
    resolution, fps, camera_type,
    webrtc_url: str              # "http://localhost:8889/cam_001"
    hls_url: str                 # "http://localhost:8888/cam_001"
    rtsp_play_url: str           # "rtsp://localhost:8554/cam_001"
}
```

**Lưu trữ:** In-memory dict (chưa có database). Mỗi lần restart backend, camera được auto-register lại từ `camera_config.py`.

---

## 8. Frontend Flow

### 8.1 LiveMonitor Page

```
LiveMonitor.jsx
  │
  ├── useEffect → fetchCameras() ── GET /api/cameras
  │   └── Nếu fail → fallback mock data (15 cameras)
  │
  ├── State:
  │   ├── cameras[]          — danh sách camera
  │   ├── layout             — "1x1" | "2x2" | "3x3" | "4x4" | "5x5" | "1+5"
  │   ├── currentPage        — pagination
  │   └── selectedCamera     — camera đang chọn
  │
  ├── Layout:
  │   ├── LeftControlPanel   — Camera tree, Chat, View, PTZ
  │   ├── VideoGrid          — Grid các CameraPlayer
  │   └── BottomBar          — Layout buttons + Page nav
  │
  └── Double-click camera → toggle 1x1 ↔ previous layout
```

### 8.2 CameraPlayer Component

```
CameraPlayer.jsx
  │
  ├── Props: camera, mode="webrtc"
  │
  ├── useEffect (camera online → connectStream)
  │   │
  │   ├── streamPath = camera.path_name || camera.id   → "cam_001"
  │   │
  │   └── connectWebRTC(videoElement, streamPath)
  │       │
  │       ├── new RTCPeerConnection({stun})
  │       ├── addTransceiver("video", recvonly)
  │       ├── addTransceiver("audio", recvonly)
  │       ├── createOffer → setLocalDescription
  │       ├── wait ICE gathering (2s timeout)
  │       │
  │       ├── POST /api/webrtc/cam_001/whep
  │       │   Body: SDP offer
  │       │   Response: SDP answer
  │       │
  │       ├── setRemoteDescription(answer)
  │       │
  │       └── ontrack → videoElement.srcObject = stream
  │
  ├── States: idle → connecting → playing → error
  │
  ├── Auto-reconnect:
  │   ├── Max 15 attempts
  │   ├── 3 giây giữa mỗi lần
  │   └── Trigger khi ICE state = disconnected/failed/closed
  │
  └── UI overlays: Loading spinner, Error + Retry button, LIVE indicator
```

### 8.3 Vite Proxy

```javascript
// vite.config.js
server: {
  host: '0.0.0.0',
  port: 5173,
  proxy: {
    '/api': {
      target: 'http://localhost:8000',
      changeOrigin: true,
    }
  }
}
```

Mọi request từ browser tới `http://localhost:5173/api/*` → Vite forward tới `http://localhost:8000/api/*`. Giúp tránh CORS.

---

## 9. Camera Config (Source of Truth)

File `camera/camera_config.py` chứa danh sách 15 camera:

| ID       | IP              | Sub-stream                                        |
| -------- | --------------- | ------------------------------------------------- |
| cam_001  | 192.168.1.133   | `rtsp://admin:YDVFNP@192.168.1.133:554/ch1/sub`  |
| cam_002  | 192.168.1.134   | `rtsp://admin:TIJEQB@192.168.1.134:554/ch1/sub`  |
| cam_003  | 192.168.1.138   | `rtsp://admin:CYXJBA@192.168.1.138:554/ch1/sub`  |
| cam_004  | 192.168.1.143   | `rtsp://admin:EIUSAY@192.168.1.143:554/ch1/sub`  |
| cam_005  | 192.168.1.146   | `rtsp://admin:VZBRIC@192.168.1.146:554/ch1/sub`  |
| cam_006  | 192.168.1.154   | `rtsp://admin:XLRPZQ@192.168.1.154:554/ch1/sub`  |
| cam_007  | 192.168.1.141   | `rtsp://admin:YLXVJA@192.168.1.141:554/ch1/sub`  |
| cam_008  | 192.168.1.174   | `rtsp://admin:FWZLED@192.168.1.174:554/ch1/sub`  |
| cam_009  | 192.168.1.135   | `rtsp://admin:NWKGIC@192.168.1.135:554/ch1/sub`  |
| cam_010  | 192.168.1.128   | `rtsp://admin:WSLRQC@192.168.1.128:554/ch1/sub`  |
| cam_011  | 192.168.1.132   | `rtsp://admin:UAQHDA@192.168.1.132:554/ch1/sub`  |
| cam_012  | 192.168.1.137   | `rtsp://admin:NNFVAJ@192.168.1.137:554/ch1/sub`  |
| cam_013  | 192.168.1.114   | `rtsp://admin:XVHSRC@192.168.1.114:554/ch1/sub`  |
| cam_014  | 192.168.1.124   | `rtsp://admin:YOHJNX@192.168.1.124:554/ch1/sub`  |
| cam_015  | 192.168.1.127   | `rtsp://admin:HLTHKD@192.168.1.127:554/ch1/sub`  |

- Tất cả camera stream **H.265 (HEVC)**
- Sub-stream: **768×432**, ~10 fps
- Port RTSP camera: **554**
- Path pattern: `/ch1/sub`

---

## 10. Biến môi trường (.env)

```env
# MediaMTX
MEDIAMTX_API_URL=http://localhost:9997
MEDIAMTX_RTSP_PORT=8554
MEDIAMTX_WEBRTC_PORT=8889
MEDIAMTX_HLS_PORT=8888
MEDIAMTX_HOST=localhost

# Backend
BACKEND_HOST=0.0.0.0
BACKEND_PORT=8000

# CORS
FRONTEND_URL=http://localhost:5173

# Transcode H.265 → H.264
TRANSCODE_METHOD=ffmpeg        # "ffmpeg" hoặc "gstreamer"
TRANSCODE_BITRATE=800000       # 800 Kbps
TRANSCODE_RTSP_LATENCY=200     # ms
TRANSCODE_THREADS=2            # thread/process FFmpeg
```

---

## 11. Sequence Diagram — Toàn bộ flow

```
                  start.sh
                     │
         ┌───────────┼───────────────┬──────────────────┐
         ▼           ▼               ▼                  ▼
      MediaMTX    FastAPI          Vite           register_cameras.py
      (binary)    (uvicorn)       (npm dev)        (python3)
         │           │               │                  │
         │ ◄─────────│── add_path ───│──────────────── │
         │  (15x runOnDemand)        │                  │
         │           │               │                  │
         │           │ ◄─────────────│── GET /api/cameras
         │           │──[15 cams]──► │                  │
         │           │               │                  │
         │           │               │ ── User opens ── │
         │           │               │    LiveMonitor   │
         │           │               │                  │
         │           │               │── VideoGrid renders 4 CameraPlayers
         │           │               │                  │
         │           │ ◄─────────────│── POST /api/webrtc/cam_001/whep
         │ ◄─────────│── POST /cam_001/whep (SDP offer)
         │           │               │                  │
         │ trigger runOnDemand       │                  │
         │ → spawn FFmpeg            │                  │
         │   (H.265→H.264)          │                  │
         │           │               │                  │
         │──SDP answer──►           │                  │
         │           │──SDP answer──►│                  │
         │           │               │                  │
         │═══ RTP H.264 (WebRTC) ═══════════════════► Browser
         │           │               │    video plays   │
```

---

## 12. Hạn chế & Ghi chú

### Hiện tại

1. **Không có database** — camera lưu in-memory, mất khi restart backend (nhưng auto-register lại từ `camera_config.py`)
2. **Không có authentication** — API và frontend không yêu cầu đăng nhập
3. **Software transcode** — dùng libx264 (CPU), NVDEC/NVENC không khả dụng trên thiết bị này (`/dev/v4l2-nvdec` mapped to `/dev/null`)
4. **Sub-stream only** — đang dùng 768×432 để giảm tải CPU
5. **No recording** — chỉ live view, chưa có ghi hình

### Config GStreamer (dự phòng)

Nếu hệ thống có NVDEC/NVENC thật (device tree có entry nvdec), đổi trong `.env`:

```env
TRANSCODE_METHOD=gstreamer
```

Pipeline sẽ dùng:
```
gst-launch-1.0 -e rtspsrc ... ! rtph265depay ! h265parse ! nvv4l2decoder !
  nvv4l2h264enc bitrate=800000 ! h264parse ! rtspclientsink ...
```

→ CPU giảm từ ~8.9% xuống ~1-2%, NVDEC/NVENC xử lý hardware.

---

## 13. Cách sử dụng

### Khởi động

```bash
cd /home/edabk/Quan/AI_challenge/vms
bash start.sh
```

### Truy cập

| URL                           | Mô tả                    |
| ----------------------------- | ------------------------ |
| http://localhost:5173         | Frontend (Live Monitor)  |
| http://localhost:5173/monitor | Trang xem camera         |
| http://localhost:8000/docs    | Swagger API docs         |
| http://localhost:9997         | MediaMTX API             |
| http://localhost:8889/cam_001 | WebRTC player (trực tiếp)|

### Dừng hệ thống

Nhấn `Ctrl+C` trong terminal đang chạy `start.sh` — sẽ kill cả 3 services.

### Thêm camera mới

```bash
curl -X POST http://localhost:8000/api/cameras \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "Camera New",
    "rtsp_url": "rtsp://admin:pass@192.168.1.200:554/ch1/sub",
    "path_name": "cam_new",
    "location": "Building A"
  }'
```

### Kiểm tra trạng thái

```bash
# Danh sách camera
curl -s http://localhost:8000/api/cameras | python3 -m json.tool

# Trạng thái MediaMTX paths
curl -s http://localhost:9997/v3/paths/list | python3 -c "
import sys,json
d=json.load(sys.stdin)
for p in d.get('items',[]):
    print(f\"  {p['name']:12s} ready={p['ready']}\")
"

# Health check
curl -s http://localhost:8000/api/health | python3 -m json.tool
```
