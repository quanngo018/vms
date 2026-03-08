import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { ArrowLeft, Video, Loader2 } from 'lucide-react';
import { connectWebRTC } from '../../services/videoStream';
import { MAP_CENTER, MAP_ZOOM, getCamerasWithPositions } from '../../mock/cameraPositions';

// Fix leaflet default icon issue with bundlers
import 'leaflet/dist/leaflet.css';
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// ── Custom marker icons ──
function createCameraIcon(status, isSelected) {
  const color = isSelected ? '#00d9ff' : status === 'online' ? '#10b981' : '#ef4444';
  const size = isSelected ? 32 : 24;
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="${color}" stroke="#111" stroke-width="1">
      <circle cx="12" cy="12" r="10" fill="${color}" opacity="0.2" stroke="${color}" stroke-width="2"/>
      <circle cx="12" cy="12" r="5" fill="${color}"/>
      ${isSelected ? '<circle cx="12" cy="12" r="10" fill="none" stroke="#00d9ff" stroke-width="2" opacity="0.6"><animate attributeName="r" from="10" to="16" dur="1.5s" repeatCount="indefinite"/><animate attributeName="opacity" from="0.6" to="0" dur="1.5s" repeatCount="indefinite"/></circle>' : ''}
    </svg>
  `;
  return L.divIcon({
    html: svg,
    className: 'camera-marker',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
}

// ── Map auto-center when selected camera changes ──
function MapUpdater({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, zoom || map.getZoom(), { duration: 0.8 });
    }
  }, [center, zoom, map]);
  return null;
}

/**
 * CameraMapPanel - Map ↔ Live Stream toggle panel
 * 
 * States:
 *   1. MAP mode (default): Interactive map with camera markers
 *      - Hover marker → popup with camera info
 *      - Click marker → switch to STREAM mode
 *   2. STREAM mode: Live WebRTC stream of selected camera
 *      - Back button → return to MAP mode
 * 
 * Props:
 *   cameras        - Array of camera objects
 *   selectedCamera - Currently selected camera ID (path_name)
 *   onCameraSelect - Callback when camera selected from map (receives camera object)
 *   width          - Panel width (default: 'w-[420px]')
 *   detectionLabel - Label for AI overlay (e.g. "AI Detection Zone Active")
 *   children       - Additional content below the map/stream (e.g. config panel)
 */
function CameraMapPanel({
  cameras = [],
  selectedCamera,
  onCameraSelect,
  onModeChange,
  width = 'w-[420px]',
  detectionLabel = 'AI Detection Zone Active',
  children,
}) {
  const [mode, setMode] = useState('map'); // 'map' | 'stream'
  const [hoveredCam, setHoveredCam] = useState(null);
  const [streamState, setStreamState] = useState('idle');
  const videoRef = useRef(null);
  const connectionRef = useRef(null);

  const camerasWithPos = getCamerasWithPositions(cameras);
  const selectedCamObj = cameras.find(
    c => (c.path_name || c.id) === selectedCamera
  );
  const selectedPos = camerasWithPos.find(
    c => (c.path_name || c.id) === selectedCamera
  );

  // Handle marker click → select camera + switch to stream
  const handleMarkerClick = useCallback((cam) => {
    const camId = cam.path_name || cam.id;
    if (onCameraSelect) onCameraSelect(camId);
    setMode('stream');
    if (onModeChange) onModeChange('stream');
  }, [onCameraSelect, onModeChange]);

  // Handle back → return to map
  const handleBackToMap = useCallback(() => {
    if (connectionRef.current) {
      connectionRef.current.disconnect();
      connectionRef.current = null;
    }
    setStreamState('idle');
    setMode('map');
    if (onModeChange) onModeChange('map');
  }, [onModeChange]);

  // Connect stream when entering stream mode
  useEffect(() => {
    if (mode !== 'stream' || !videoRef.current || !selectedCamera) return;

    if (connectionRef.current) {
      connectionRef.current.disconnect();
      connectionRef.current = null;
    }

    setStreamState('connecting');
    try {
      const streamPath = `${selectedCamera}_sub`;
      connectionRef.current = connectWebRTC(videoRef.current, streamPath);
    } catch {
      setStreamState('error');
    }

    return () => {
      if (connectionRef.current) {
        connectionRef.current.disconnect();
        connectionRef.current = null;
      }
    };
  }, [mode, selectedCamera]);

  // Video element events
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const onPlaying = () => setStreamState('playing');
    const onWaiting = () => setStreamState('connecting');
    const onError = () => setStreamState('error');
    video.addEventListener('playing', onPlaying);
    video.addEventListener('waiting', onWaiting);
    video.addEventListener('error', onError);
    return () => {
      video.removeEventListener('playing', onPlaying);
      video.removeEventListener('waiting', onWaiting);
      video.removeEventListener('error', onError);
    };
  }, [mode]);

  // When selectedCamera changes externally and we're in stream mode, reconnect
  useEffect(() => {
    if (mode === 'stream' && selectedCamera) {
      // Re-trigger stream connection by toggling mode
      setStreamState('connecting');
      if (connectionRef.current) {
        connectionRef.current.disconnect();
        connectionRef.current = null;
      }
      if (videoRef.current) {
        try {
          connectionRef.current = connectWebRTC(videoRef.current, `${selectedCamera}_sub`);
        } catch {
          setStreamState('error');
        }
      }
    }
  }, [selectedCamera]);

  return (
    <div className={`${width} flex-shrink-0 flex flex-col gap-4`}>
      {/* ── Main Panel: Map or Stream ── */}
      <div className="bg-[#1e2028] rounded-xl border border-white/5 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-white/5">
          <div className="flex items-center gap-2">
            {mode === 'stream' && (
              <button
                onClick={handleBackToMap}
                className="p-1 hover:bg-white/10 rounded transition-colors"
                title="Back to map"
              >
                <ArrowLeft size={14} className="text-gray-400" />
              </button>
            )}
            <div className={`w-2 h-2 rounded-full ${
              mode === 'stream' && streamState === 'playing'
                ? 'bg-green-500 animate-pulse'
                : mode === 'map' ? 'bg-cyan-500' : 'bg-gray-600'
            }`} />
            <span className="text-xs font-medium text-gray-300">
              {mode === 'map'
                ? `Camera Map (${camerasWithPos.filter(c => c.status === 'online').length}/${camerasWithPos.length} online)`
                : selectedCamObj?.name || selectedCamera || 'No camera'
              }
            </span>
          </div>
          <div className="flex items-center gap-2">
            {mode === 'stream' && streamState === 'playing' && (
              <span className="text-[10px] text-green-400 font-medium uppercase tracking-wider">
                LIVE
              </span>
            )}
            {mode === 'map' && (
              <span className="text-[10px] text-cyan-400/60 font-medium">
                Click camera to view
              </span>
            )}
          </div>
        </div>

        {/* Content: Map or Video */}
        <div className="relative aspect-video">
          {/* ── MAP MODE ── */}
          {mode === 'map' && (
            <MapContainer
              center={selectedPos ? [selectedPos.lat, selectedPos.lng] : MAP_CENTER}
              zoom={MAP_ZOOM}
              className="w-full h-full z-0"
              zoomControl={false}
              attributionControl={false}
              style={{ background: '#111318' }}
            >
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png"
                attribution='&copy; <a href="https://carto.com/">CARTO</a>'
              />
              {selectedPos && (
                <MapUpdater center={[selectedPos.lat, selectedPos.lng]} zoom={MAP_ZOOM} />
              )}
              {camerasWithPos.map((cam) => {
                const camId = cam.path_name || cam.id;
                const isSelected = camId === selectedCamera;
                return (
                  <Marker
                    key={camId}
                    position={[cam.lat, cam.lng]}
                    icon={createCameraIcon(cam.status, isSelected)}
                    eventHandlers={{
                      click: () => handleMarkerClick(cam),
                      mouseover: () => setHoveredCam(camId),
                      mouseout: () => setHoveredCam(null),
                    }}
                  >
                    <Popup className="camera-popup" closeButton={false} autoPan={false}>
                      <div className="min-w-[180px]">
                        <div className="flex items-center gap-2 mb-1">
                          <Video size={12} className="text-cyan-400" />
                          <span className="font-semibold text-sm">{cam.name}</span>
                          <span className={`ml-auto w-2 h-2 rounded-full ${
                            cam.status === 'online' ? 'bg-green-500' : 'bg-red-500'
                          }`} />
                        </div>
                        <div className="text-xs text-gray-600 space-y-0.5">
                          <p>{cam.address}</p>
                          <p>IP: {cam.ip}</p>
                          <p>{cam.resolution} • {cam.fps} FPS</p>
                        </div>
                        <div className="mt-1.5 pt-1.5 border-t border-gray-200">
                          <span className="text-[10px] text-cyan-600 font-medium">
                            Click to view live stream →
                          </span>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>
          )}

          {/* ── STREAM MODE ── */}
          {mode === 'stream' && (
            <>
              <video
                ref={videoRef}
                className="w-full h-full object-contain bg-black"
                autoPlay
                muted
                playsInline
              />
              {streamState === 'connecting' && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <Loader2 size={24} className="text-cyan-400 animate-spin" />
                </div>
              )}
              {streamState === 'error' && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                  <div className="text-center">
                    <p className="text-xs text-gray-500 mb-2">Stream unavailable</p>
                    <button
                      onClick={handleBackToMap}
                      className="text-xs text-cyan-400 hover:underline"
                    >
                      ← Back to map
                    </button>
                  </div>
                </div>
              )}
              {/* AI overlay */}
              {detectionLabel && (
                <div className="absolute bottom-2 left-2 bg-black/60 rounded px-2 py-0.5">
                  <span className="text-[10px] text-cyan-400">{detectionLabel}</span>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── Additional content (children) ── */}
      {children}
    </div>
  );
}

export default CameraMapPanel;
