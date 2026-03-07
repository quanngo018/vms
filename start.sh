#!/bin/bash
# ============================================================
#  VMS - Start All Services
#  
#  This script starts:
#  1. MediaMTX  (RTSP/WebRTC/HLS media server)
#  2. FastAPI   (Backend API)
#  3. Vite      (Frontend dev server)
# ============================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Paths
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
MEDIAMTX_DIR="$SCRIPT_DIR/backend/mediamtx"
BACKEND_DIR="$SCRIPT_DIR/backend"
FRONTEND_DIR="$SCRIPT_DIR/frontend"

# Kill any leftover processes from previous runs
echo -e "${YELLOW}Cleaning up old processes...${NC}"
for port in 8554 8889 8888 9997 8000 5173; do
    pid=$(lsof -ti :$port 2>/dev/null || true)
    if [ -n "$pid" ]; then
        echo -e "  Killing process on port $port (PID: $pid)"
        kill $pid 2>/dev/null || true
    fi
done
sleep 1

echo -e "${CYAN}============================================================${NC}"
echo -e "${CYAN}  VMS - Video Management System${NC}"
echo -e "${CYAN}============================================================${NC}"
echo ""

# Cleanup function
cleanup() {
    echo ""
    echo -e "${YELLOW}Shutting down all services...${NC}"
    kill $MEDIAMTX_PID 2>/dev/null || true
    kill $BACKEND_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    echo -e "${GREEN}All services stopped.${NC}"
    exit 0
}

trap cleanup SIGINT SIGTERM

# ─── 1. Start MediaMTX ───────────────────────────────────
echo -e "${GREEN}[1/3] Starting MediaMTX...${NC}"
if [ ! -f "$MEDIAMTX_DIR/mediamtx" ]; then
    echo -e "${RED}ERROR: mediamtx binary not found at $MEDIAMTX_DIR/mediamtx${NC}"
    echo "Please download MediaMTX from https://github.com/bluenviron/mediamtx/releases"
    exit 1
fi

cd "$MEDIAMTX_DIR"
./mediamtx &
MEDIAMTX_PID=$!
echo -e "  MediaMTX PID: $MEDIAMTX_PID"
echo -e "  RTSP:   ${CYAN}rtsp://localhost:8554${NC}"
echo -e "  WebRTC: ${CYAN}http://localhost:8889${NC}"
echo -e "  HLS:    ${CYAN}http://localhost:8888${NC}"
echo -e "  API:    ${CYAN}http://localhost:9997${NC}"
echo ""

sleep 2

# ─── 2. Start FastAPI Backend ────────────────────────────
echo -e "${GREEN}[2/3] Starting FastAPI Backend...${NC}"
cd "$BACKEND_DIR"

# Create venv if needed
if [ ! -d "venv" ]; then
    echo "  Creating Python virtual environment..."
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
else
    source venv/bin/activate
fi

uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!
echo -e "  Backend PID: $BACKEND_PID"
echo -e "  API:    ${CYAN}http://localhost:8000${NC}"
echo -e "  Docs:   ${CYAN}http://localhost:8000/docs${NC}"
echo ""

sleep 2

# ─── 3. Start Frontend ──────────────────────────────────
echo -e "${GREEN}[3/3] Starting Frontend...${NC}"
cd "$FRONTEND_DIR"

# Install deps if needed
if [ ! -d "node_modules" ]; then
    echo "  Installing npm dependencies..."
    npm install
fi

npm run dev &
FRONTEND_PID=$!
echo -e "  Frontend PID: $FRONTEND_PID"
echo -e "  URL:    ${CYAN}http://localhost:5173${NC}"
echo ""

# ─── Summary ─────────────────────────────────────────────
echo -e "${CYAN}============================================================${NC}"
echo -e "${CYAN}  All services started!${NC}"
echo -e "${CYAN}============================================================${NC}"
echo ""

sleep 3

# ─── 4. Register cameras ─────────────────────────────────
echo -e "${GREEN}[4/4] Registering cameras in MediaMTX...${NC}"
cd "$SCRIPT_DIR/backend/camera"

# Export backend .env so register_cameras.py uses the same settings
if [ -f "$BACKEND_DIR/.env" ]; then
    set -a
    source "$BACKEND_DIR/.env"
    set +a
    echo -e "  Loaded config from backend/.env (TRANSCODE_METHOD=$TRANSCODE_METHOD)"
fi

if [ -f "camera_config.py" ] && [ -f "register_cameras.py" ]; then
    # Backend auto-registers cameras on startup, so only ensure MediaMTX paths exist
    python3 register_cameras.py --mediamtx-only --no-wait 2>&1 | head -40
else
    echo "  camera_config.py or register_cameras.py not found, skipping."
    echo "  Backend will auto-register cameras from camera_config.py on startup."
fi
echo ""

echo -e "  ${GREEN}Frontend:${NC}  http://localhost:5173"
echo -e "  ${GREEN}Backend:${NC}   http://localhost:8000/docs"
echo -e "  ${GREEN}MediaMTX:${NC}  http://localhost:9997"
echo ""
echo -e "  ${YELLOW}To add a camera:${NC}"
echo -e "  curl -X POST http://localhost:8000/api/cameras \\"
echo -e "    -H 'Content-Type: application/json' \\"
echo -e "    -d '{\"name\": \"Cam 1\", \"rtsp_url\": \"rtsp://admin:pass@192.168.1.100:554/stream1\", \"path_name\": \"cam_001\"}'"
echo ""
echo -e "  Press ${RED}Ctrl+C${NC} to stop all services."
echo ""

# Wait for all
wait
