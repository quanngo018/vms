/**
 * Video Stream Service - MediaMTX Version
 * 
 * Connects to MediaMTX media server for camera streaming.
 * Supports:
 *   - WebRTC via WHEP (lowest latency, H.264)
 *   - HLS (most compatible, H.264/H.265)
 * 
 * MediaMTX Ports:
 *   - :8889 = WebRTC (WHEP/WHIP)
 *   - :8888 = HLS
 *   - :8554 = RTSP
 * 
 * Backend (FastAPI) at :8000 provides:
 *   - Camera management API
 *   - WHEP proxy (to avoid CORS)
 */

// ─── Configuration ───────────────────────────────────────

const BACKEND_HOST = window.location.hostname || 'localhost';
const BACKEND_PORT = 8000;
const BACKEND_URL = `http://${BACKEND_HOST}:${BACKEND_PORT}`;

// For API calls, prefer relative paths (works with Vite proxy and production reverse proxy)
const API_BASE = '/api';

// MediaMTX direct access
const MEDIAMTX_HOST = window.location.hostname || 'localhost';
const MEDIAMTX_WEBRTC_PORT = 8889;
const MEDIAMTX_HLS_PORT = 8888;

// Use backend proxy for WHEP to avoid CORS issues
const USE_WHEP_PROXY = true;


// ─── URL Builders ────────────────────────────────────────

/**
 * Get the MediaMTX path name for a camera
 */
export function getStreamPath(cameraId) {
  return cameraId;
}

/**
 * Get WHEP URL for WebRTC playback
 */
export function getWhepUrl(pathName) {
  if (USE_WHEP_PROXY) {
    return `${API_BASE}/webrtc/${pathName}/whep`;
  }
  return `http://${MEDIAMTX_HOST}:${MEDIAMTX_WEBRTC_PORT}/${pathName}/whep`;
}

/**
 * Get HLS URL
 */
export function getHlsUrl(pathName) {
  return `http://${MEDIAMTX_HOST}:${MEDIAMTX_HLS_PORT}/${pathName}`;
}

/**
 * Get HLS m3u8 URL
 */
export function getHlsM3u8Url(pathName) {
  return `http://${MEDIAMTX_HOST}:${MEDIAMTX_HLS_PORT}/${pathName}/index.m3u8`;
}

/**
 * Get MediaMTX built-in WebRTC page URL
 */
export function getWebRTCPageUrl(pathName) {
  return `http://${MEDIAMTX_HOST}:${MEDIAMTX_WEBRTC_PORT}/${pathName}`;
}


// ─── Backend API ─────────────────────────────────────────

/**
 * Fetch all cameras from backend
 */
export async function fetchCameras() {
  try {
    const resp = await fetch(`${API_BASE}/cameras`);
    if (!resp.ok) return [];
    return await resp.json();
  } catch (e) {
    console.error('[API] Failed to fetch cameras:', e);
    return [];
  }
}

/**
 * Add a camera via backend
 */
export async function addCamera(cameraData) {
  try {
    const resp = await fetch(`${API_BASE}/cameras`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cameraData),
    });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    return await resp.json();
  } catch (e) {
    console.error('[API] Failed to add camera:', e);
    return null;
  }
}

/**
 * Delete a camera via backend
 */
export async function deleteCamera(cameraId) {
  try {
    const resp = await fetch(`${API_BASE}/cameras/${cameraId}`, {
      method: 'DELETE',
    });
    return resp.ok;
  } catch (e) {
    console.error('[API] Failed to delete camera:', e);
    return false;
  }
}

/**
 * Check backend health + MediaMTX status
 */
export async function checkHealth() {
  try {
    const resp = await fetch(`${API_BASE}/health`);
    if (!resp.ok) return null;
    return await resp.json();
  } catch {
    return null;
  }
}


// ─── WebRTC Player (WHEP) ────────────────────────────────

/**
 * Connect WebRTC player via WHEP protocol.
 * 
 * WHEP flow:
 * 1. Browser creates RTCPeerConnection + SDP offer
 * 2. POST offer to WHEP endpoint
 * 3. Receive SDP answer
 * 4. Stream plays
 * 
 * @param {HTMLVideoElement} videoEl
 * @param {string} pathName - MediaMTX stream path (e.g., "cam_001")
 * @returns {{ disconnect: () => void }}
 */
export function connectWebRTC(videoEl, pathName) {
  let pc = null;
  let isConnected = false;
  let reconnectTimer = null;
  let reconnectAttempts = 0;
  const MAX_RECONNECT_ATTEMPTS = 15;
  const RECONNECT_DELAY = 3000;

  async function connect() {
    if (isConnected) return;

    try {
      pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
      });

      pc.ontrack = (event) => {
        console.log(`[WebRTC] Track received: ${pathName}`, event.track.kind);
        if (event.streams && event.streams[0]) {
          videoEl.srcObject = event.streams[0];
        } else {
          const stream = new MediaStream();
          stream.addTrack(event.track);
          videoEl.srcObject = stream;
        }
        videoEl.play().catch(() => {});
        isConnected = true;
        reconnectAttempts = 0;
      };

      pc.oniceconnectionstatechange = () => {
        console.log(`[WebRTC] ICE state: ${pc.iceConnectionState} (${pathName})`);
        if (['disconnected', 'failed', 'closed'].includes(pc.iceConnectionState)) {
          isConnected = false;
          scheduleReconnect();
        }
      };

      pc.addTransceiver('video', { direction: 'recvonly' });
      pc.addTransceiver('audio', { direction: 'recvonly' });

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // Wait for ICE gathering
      await waitForIceGathering(pc, 2000);

      const whepUrl = getWhepUrl(pathName);
      console.log(`[WebRTC] WHEP: ${whepUrl}`);

      const response = await fetch(whepUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/sdp' },
        body: pc.localDescription.sdp,
      });

      if (!response.ok) {
        throw new Error(`WHEP failed (${response.status})`);
      }

      const answerSdp = await response.text();
      await pc.setRemoteDescription({ type: 'answer', sdp: answerSdp });
      console.log(`[WebRTC] Connected: ${pathName}`);

    } catch (err) {
      console.error(`[WebRTC] Error (${pathName}):`, err);
      isConnected = false;
      scheduleReconnect();
    }
  }

  function waitForIceGathering(peerConnection, timeout) {
    return new Promise((resolve) => {
      if (peerConnection.iceGatheringState === 'complete') {
        resolve();
        return;
      }
      const timer = setTimeout(resolve, timeout);
      peerConnection.addEventListener('icegatheringstatechange', () => {
        if (peerConnection.iceGatheringState === 'complete') {
          clearTimeout(timer);
          resolve();
        }
      });
    });
  }

  function scheduleReconnect() {
    if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) return;
    if (reconnectTimer) clearTimeout(reconnectTimer);
    reconnectTimer = setTimeout(() => {
      reconnectAttempts++;
      console.log(`[WebRTC] Reconnect ${pathName} (#${reconnectAttempts})`);
      if (pc) { try { pc.close(); } catch(e) {} pc = null; }
      connect();
    }, RECONNECT_DELAY);
  }

  function disconnect() {
    isConnected = false;
    if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null; }
    if (pc) {
      pc.ontrack = null;
      pc.oniceconnectionstatechange = null;
      try { pc.close(); } catch(e) {}
      pc = null;
    }
    if (videoEl.srcObject) {
      videoEl.srcObject.getTracks().forEach(t => t.stop());
      videoEl.srcObject = null;
    }
    console.log(`[WebRTC] Disconnected: ${pathName}`);
  }

  connect();
  return { disconnect };
}


// ─── HLS Player (fallback) ──────────────────────────────

/**
 * Connect HLS player. Higher latency but better compatibility.
 */
export function connectHLS(videoEl, pathName) {
  const hlsUrl = getHlsM3u8Url(pathName);

  function connect() {
    console.log(`[HLS] Connecting: ${hlsUrl}`);
    videoEl.src = hlsUrl;
    videoEl.play().catch(() => {});
  }

  function disconnect() {
    videoEl.src = '';
    videoEl.load();
    console.log(`[HLS] Disconnected: ${pathName}`);
  }

  connect();
  return { disconnect };
}


// ─── Compatibility Aliases (so CameraPlayer.jsx still works) ───

export function connectMSE(videoEl, cameraId, quality = 'sub') {
  const pathName = quality === 'main' ? cameraId : `${cameraId}_sub`;
  return connectWebRTC(videoEl, pathName);
}

export function getStreamName(cameraId, quality = 'sub') {
  return quality === 'main' ? cameraId : `${cameraId}_sub`;
}

export function getMSEUrl(cameraId, quality = 'sub') {
  return getWhepUrl(getStreamName(cameraId, quality));
}

export function getMP4Url(cameraId, quality = 'sub') {
  return getHlsUrl(getStreamName(cameraId, quality));
}

export function getSnapshotUrl(cameraId) {
  return '';
}

export async function checkStreamAvailable(cameraId) {
  try {
    const resp = await fetch(`${BACKEND_URL}/api/mediamtx/paths/${cameraId}`, {
      signal: AbortSignal.timeout(3000),
    });
    return resp.ok;
  } catch {
    return false;
  }
}

export async function getAvailableStreams() {
  try {
    const resp = await fetch(`${BACKEND_URL}/api/mediamtx/paths`);
    if (!resp.ok) return {};
    return await resp.json();
  } catch {
    return {};
  }
}


export default {
  connectWebRTC,
  connectHLS,
  connectMSE,
  getWhepUrl,
  getHlsUrl,
  getStreamPath,
  fetchCameras,
  addCamera,
  deleteCamera,
  checkHealth,
  getStreamName,
  getMSEUrl,
  getMP4Url,
  getSnapshotUrl,
  checkStreamAvailable,
  getAvailableStreams,
};
