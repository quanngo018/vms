import React, { useState, useRef, useEffect, useCallback } from 'react';
import { VideoOff, Loader2, AlertCircle, Maximize2 } from 'lucide-react';
import { connectMSE, connectWebRTC } from '../../services/videoStream';

/**
 * CameraPlayer Component - Real Video Streaming via MediaMTX
 * 
 * Connects to MediaMTX via WebRTC (WHEP) or HLS.
 * Uses camera.path_name (or camera.id) as the MediaMTX stream path.
 * 
 * Props:
 * @param {Object} camera - Camera data { id, path_name, name, location, status, ... }
 * @param {Function} onSelect - Callback when camera clicked
 * @param {Boolean} isSelected - Whether this camera is selected
 * @param {'main'|'sub'} quality - Stream quality (default: 'sub' for grid view)
 * @param {'mse'|'webrtc'} mode - Streaming mode (default: 'webrtc' for MediaMTX WHEP)
 */
function CameraPlayer({
  camera,
  onSelect,
  isSelected = false,
  quality = 'sub',
  mode = 'webrtc'
}) {
  const videoRef = useRef(null);
  const connectionRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);
  const [streamState, setStreamState] = useState('idle'); // idle | connecting | playing | error
  const [fps, setFps] = useState(0);
  const [droppedFrames, setDroppedFrames] = useState(0);

  // Status color
  const statusColor = camera.status === 'online' ? 'bg-green-500' : 'bg-red-500';

  // Connect to stream
  const connectStream = useCallback(() => {
    if (!videoRef.current || camera.status !== 'online') return;

    // Disconnect previous
    if (connectionRef.current) {
      connectionRef.current.disconnect();
      connectionRef.current = null;
    }

    setStreamState('connecting');

    try {
      // Use path_name for MediaMTX path, fallback to camera.id
      // Append '_sub' suffix for sub-stream (grid view), bare path for main stream (1x1 view)
      const basePath = camera.path_name || camera.id;
      const streamPath = quality === 'main' ? basePath : `${basePath}_sub`;
      const connectFn = mode === 'webrtc' ? connectWebRTC : connectMSE;
      connectionRef.current = connectFn(videoRef.current, streamPath);
    } catch (err) {
      console.error(`Failed to connect: ${camera.path_name || camera.id}`, err);
      setStreamState('error');
    }
  }, [camera.id, camera.path_name, camera.status, quality, mode]);

  // Disconnect stream
  const disconnectStream = useCallback(() => {
    if (connectionRef.current) {
      connectionRef.current.disconnect();
      connectionRef.current = null;
    }
    setStreamState('idle');
  }, []);

  // Connect when camera comes online, disconnect when offline or unmount
  useEffect(() => {
    if (camera.status === 'online') {
      connectStream();
    } else {
      disconnectStream();
    }

    return () => {
      disconnectStream();
    };
  }, [camera.id, camera.status, quality, mode, connectStream, disconnectStream]);

  // Track video element events
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onPlaying = () => setStreamState('playing');
    const onWaiting = () => setStreamState('connecting');
    const onError = () => setStreamState('error');
    const onStalled = () => {
      // Only show error if stalled for too long
      setTimeout(() => {
        if (video.readyState < 3) setStreamState('error');
      }, 5000);
    };

    video.addEventListener('playing', onPlaying);
    video.addEventListener('waiting', onWaiting);
    video.addEventListener('error', onError);
    video.addEventListener('stalled', onStalled);

    return () => {
      video.removeEventListener('playing', onPlaying);
      video.removeEventListener('waiting', onWaiting);
      video.removeEventListener('error', onError);
      video.removeEventListener('stalled', onStalled);
    };
  }, []);

  // FPS measurement using requestVideoFrameCallback (works with WebRTC)
  useEffect(() => {
    const video = videoRef.current;
    if (!video || streamState !== 'playing') {
      setFps(0);
      setDroppedFrames(0);
      return;
    }

    let frameCount = 0;
    let callbackId = null;
    let cancelled = false;

    // Count each decoded frame via requestVideoFrameCallback
    function onFrame(now, metadata) {
      if (cancelled) return;
      frameCount++;
      callbackId = video.requestVideoFrameCallback(onFrame);
    }

    // Start counting frames
    if (typeof video.requestVideoFrameCallback === 'function') {
      callbackId = video.requestVideoFrameCallback(onFrame);
    }

    // Every 1 second, calculate FPS from counted frames
    const interval = setInterval(() => {
      setFps(frameCount);
      // Also check getVideoPlaybackQuality for dropped frames (works in some browsers)
      const quality = video.getVideoPlaybackQuality?.();
      if (quality) {
        setDroppedFrames(quality.droppedVideoFrames);
      }
      frameCount = 0;
    }, 1000);

    return () => {
      cancelled = true;
      clearInterval(interval);
      if (callbackId != null && typeof video.cancelVideoFrameCallback === 'function') {
        video.cancelVideoFrameCallback(callbackId);
      }
    };
  }, [streamState]);

  return (
    <div
      className={`
        relative w-full h-full bg-[#1a1a1a] rounded overflow-hidden
        transition-all duration-200 cursor-pointer
        ${isSelected ? 'ring-2 ring-cyan-400' : 'ring-1 ring-gray-700'}
        ${isHovered ? 'ring-cyan-500/50' : ''}
      `}
      onClick={() => onSelect && onSelect(camera)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ boxSizing: 'border-box' }}
    >
      {/* Video / Stream Area */}
      {camera.status === 'online' ? (
        <>
          {/* Real video element — go2rtc streams here */}
          <video
            ref={videoRef}
            className="w-full h-full object-contain bg-black"
            autoPlay
            muted
            playsInline
          />

          {/* Loading overlay */}
          {streamState === 'connecting' && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60">
              <div className="text-center">
                <Loader2 size={32} className="text-cyan-400 animate-spin mx-auto mb-2" />
                <p className="text-gray-300 text-xs">Connecting...</p>
              </div>
            </div>
          )}

          {/* Error overlay — with retry button */}
          {streamState === 'error' && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80">
              <div className="text-center">
                <AlertCircle size={32} className="text-red-400 mx-auto mb-2" />
                <p className="text-gray-300 text-xs mb-2">Stream Error</p>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    connectStream();
                  }}
                  className="px-3 py-1 bg-cyan-500 text-white text-xs rounded hover:bg-cyan-600 transition-colors"
                >
                  Retry
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        // Offline state
        <div className="w-full h-full flex items-center justify-center bg-gray-800">
          <div className="text-center text-gray-400">
            <VideoOff size={48} className="mx-auto mb-2" />
            <p className="text-sm">Camera Offline</p>
          </div>
        </div>
      )}

      {/* Top Overlay — Camera Info */}
      <div className="absolute top-0 left-0 right-0 bg-black/60 p-3">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-white font-semibold text-sm">{camera.name}</h3>
            <p className="text-white/70 text-xs">{camera.location}</p>
          </div>

          {/* Status Indicator */}
          <div className="flex items-center gap-1.5">
            {streamState === 'playing' && (
              <>
                <span className="text-[10px] font-mono px-1 py-0.5 rounded bg-black/60 text-cyan-300">
                  {fps} FPS{droppedFrames > 0 ? ` | ${droppedFrames} drop` : ''}
                </span>
                <span className="text-[10px] text-green-400 font-medium uppercase tracking-wider">LIVE</span>
              </>
            )}
            <div className={`w-2 h-2 rounded-full ${statusColor} ${camera.status === 'online' ? 'animate-pulse' : ''}`} />
          </div>
        </div>
      </div>

      {/* Bottom Overlay — Timestamp + Hint (show on hover) */}
      {isHovered && camera.status === 'online' && (
        <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-3">
          <div className="flex items-center justify-between">
            <span className="text-white text-xs font-mono">
              {new Date().toLocaleTimeString()}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-white/60 text-xs">Double-click to expand</span>
              <Maximize2 size={12} className="text-cyan-400" />
            </div>
          </div>
        </div>
      )}

      {/* Selected Indicator */}
      {isSelected && (
        <div className="absolute top-2 right-2 pointer-events-none">
          <div className="w-3 h-3 bg-cyan-400 rounded-full animate-pulse"></div>
        </div>
      )}
    </div>
  );
}

export default CameraPlayer;
