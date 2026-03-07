import React, { useState } from 'react';
import { Button, Slider, Card } from 'antd';
import { 
  ChevronUp, 
  ChevronDown, 
  ChevronLeft, 
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  X
} from 'lucide-react';

/**
 * PTZControl Component
 * 
 * Pan-Tilt-Zoom control overlay for PTZ cameras
 * 
 * Props:
 * @param {Object} camera - Selected camera object
 * @param {Function} onClose - Close the PTZ panel
 * @param {String} position - Position of panel: 'right' or 'bottom'
 * 
 * React Concepts:
 * - Local state: Zoom level managed within component
 * - Event simulation: console.log instead of real PTZ commands
 * - Conditional rendering: Only show if camera supports PTZ
 */
function PTZControl({ camera, onClose, position = 'right' }) {
  const [zoom, setZoom] = useState(1); // 1x to 10x zoom
  const [isPTZ] = useState(camera?.type === 'PTZ'); // Check if camera supports PTZ

  // PTZ command handler (mock)
  const handlePTZ = (action, value) => {
    console.log(`[PTZ] Camera: ${camera?.id}, Action: ${action}, Value: ${value || ''}`);
    
    // In real app, this would send commands to camera:
    // await fetch('/api/camera/ptz', { 
    //   method: 'POST', 
    //   body: JSON.stringify({ cameraId: camera.id, action, value })
    // });
  };

  if (!camera) return null;

  const panelClassName = position === 'right' 
    ? 'fixed right-4 top-24 w-64'
    : 'fixed bottom-4 left-1/2 transform -translate-x-1/2 w-auto';

  return (
    <Card
      className={panelClassName}
      style={{ 
        zIndex: 1000,
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
      }}
      title={
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold">PTZ Control</span>
          <Button 
            type="text" 
            size="small" 
            icon={<X size={16} />}
            onClick={onClose}
          />
        </div>
      }
      bodyStyle={{ padding: '16px' }}
    >
      {/* Camera Info */}
      <div className="mb-4 pb-3 border-b">
        <p className="text-xs text-gray-500 mb-1">{camera.name}</p>
        <p className="text-xs text-gray-400">{camera.location}</p>
      </div>

      {isPTZ ? (
        <>
          {/* Pan/Tilt Controls - Directional Pad */}
          <div className="mb-4">
            <p className="text-xs font-semibold text-gray-700 mb-2">Pan & Tilt</p>
            <div className="grid grid-cols-3 gap-1 w-32 mx-auto">
              {/* Top row */}
              <div />
              <Button
                icon={<ChevronUp size={16} />}
                onMouseDown={() => handlePTZ('tilt', 'up')}
                onMouseUp={() => handlePTZ('tilt', 'stop')}
                className="flex items-center justify-center"
              />
              <div />

              {/* Middle row */}
              <Button
                icon={<ChevronLeft size={16} />}
                onMouseDown={() => handlePTZ('pan', 'left')}
                onMouseUp={() => handlePTZ('pan', 'stop')}
                className="flex items-center justify-center"
              />
              <Button
                icon={<RotateCcw size={16} />}
                onClick={() => handlePTZ('home', null)}
                className="flex items-center justify-center"
                title="Return to Home Position"
              />
              <Button
                icon={<ChevronRight size={16} />}
                onMouseDown={() => handlePTZ('pan', 'right')}
                onMouseUp={() => handlePTZ('pan', 'stop')}
                className="flex items-center justify-center"
              />

              {/* Bottom row */}
              <div />
              <Button
                icon={<ChevronDown size={16} />}
                onMouseDown={() => handlePTZ('tilt', 'down')}
                onMouseUp={() => handlePTZ('tilt', 'stop')}
                className="flex items-center justify-center"
              />
              <div />
            </div>
          </div>

          {/* Zoom Control - Slider */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-gray-700">Zoom</p>
              <span className="text-xs text-gray-500">{zoom.toFixed(1)}x</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                size="small"
                icon={<ZoomOut size={14} />}
                onClick={() => {
                  const newZoom = Math.max(1, zoom - 0.5);
                  setZoom(newZoom);
                  handlePTZ('zoom', newZoom);
                }}
              />
              
              <Slider
                min={1}
                max={10}
                step={0.1}
                value={zoom}
                onChange={(value) => {
                  setZoom(value);
                  handlePTZ('zoom', value);
                }}
                className="flex-1"
              />
              
              <Button
                size="small"
                icon={<ZoomIn size={14} />}
                onClick={() => {
                  const newZoom = Math.min(10, zoom + 0.5);
                  setZoom(newZoom);
                  handlePTZ('zoom', newZoom);
                }}
              />
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-700 mb-2">Quick Actions</p>
            <Button
              block
              size="small"
              onClick={() => handlePTZ('preset', 1)}
            >
              Go to Preset 1
            </Button>
            <Button
              block
              size="small"
              onClick={() => handlePTZ('preset', 2)}
            >
              Go to Preset 2
            </Button>
          </div>
        </>
      ) : (
        // Non-PTZ camera
        <div className="text-center py-4">
          <p className="text-sm text-gray-500">
            This camera does not support PTZ control
          </p>
          <p className="text-xs text-gray-400 mt-2">
            Camera Type: {camera.type}
          </p>
        </div>
      )}
    </Card>
  );
}

export default PTZControl;
