import React from 'react';
import CameraPlayer from './CameraPlayer';

/**
 * VideoGrid Component - FIXED VIEWPORT VERSION
 * 
 * Displays multiple cameras in a grid layout that FITS THE VIEWPORT
 * - No scrolling needed
 * - Auto-sizing: more cameras = smaller windows
 * - Double-click switches to 1x1 view
 * - Dual stream: uses 'main' quality for 1x1, 'sub' for grid views
 * 
 * Props:
 * @param {Array} cameras - Array of camera objects to display
 * @param {String} layout - Grid layout: '1x1', '2x2', '3x3', '4x4'
 * @param {Function} onCameraSelect - Callback when a camera is selected
 * @param {String} selectedCameraId - ID of currently selected camera
 * @param {Function} onCameraDoubleClick - Callback when camera is double-clicked
 */
function VideoGrid({
  cameras,
  layout = '2x2',
  onCameraSelect,
  selectedCameraId,
  onCameraDoubleClick
}) {
  // Determine stream quality based on layout
  // 1x1 = full resolution (main stream), grid = lower resolution (sub stream)
  const streamQuality = layout === '1x1' ? 'main' : 'sub';
  // Calculate grid configuration
  const layoutConfig = {
    '1x1': { cols: 1, rows: 1, maxCameras: 1 },
    '2x2': { cols: 2, rows: 2, maxCameras: 4 },
    '3x3': { cols: 3, rows: 3, maxCameras: 9 },
    '4x4': { cols: 4, rows: 4, maxCameras: 16 },
    '5x5': { cols: 5, rows: 5, maxCameras: 25 },
    '1+5': { cols: 3, rows: 2, maxCameras: 6 },
  };

  let config;
  if (layout.startsWith('custom:')) {
    const parts = layout.split(':')[1].split('x');
    const cols = parseInt(parts[0], 10) || 6;
    const rows = parseInt(parts[1], 10) || 6;
    config = { cols, rows, maxCameras: cols * rows };
  } else {
    config = layoutConfig[layout] || layoutConfig['2x2'];
  }

  const displayCameras = cameras.slice(0, config.maxCameras);
  const emptySlots = Math.max(0, config.maxCameras - displayCameras.length);

  // Handle double-click to switch to 1x1 view
  const handleDoubleClick = (camera) => {
    console.log('Double-clicked camera:', camera.name);
    if (onCameraDoubleClick) {
      onCameraDoubleClick(camera);
    }
  };

  return (
    <div
      className="w-full h-full bg-[#1a1a1a] overflow-hidden"
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${config.cols}, 1fr)`,
        gridTemplateRows: `repeat(${config.rows}, 1fr)`,
        gap: '4px',
        padding: '4px',
      }}
    >
      {/* Map through cameras and create a CameraPlayer for each */}
      {displayCameras.map((camera) => (
        <div
          key={camera.id}
          className="w-full h-full"
          onDoubleClick={() => handleDoubleClick(camera)}
        >
          <CameraPlayer
            camera={camera}
            onSelect={onCameraSelect}
            isSelected={selectedCameraId === camera.id}
            quality={streamQuality}
          />
        </div>
      ))}

      {/* Empty slots to fill the grid */}
      {Array.from({ length: emptySlots }).map((_, index) => (
        <div
          key={`empty-${index}`}
          className="w-full h-full bg-[#2d2d2d] rounded flex items-center justify-center border border-dashed border-gray-700"
        >
          <div className="text-center text-gray-600">
            <p className="text-xs">Empty Slot</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default VideoGrid;
