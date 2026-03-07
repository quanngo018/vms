import React from 'react';
import { Button, Select, Space, Tooltip } from 'antd';
import { 
  Maximize, 
  Minimize, 
  Grid3x3, 
  Square,
  Grid2x2,
  LayoutGrid,
  Camera,
  Download,
  Settings
} from 'lucide-react';

/**
 * ControlToolbar Component
 * 
 * Toolbar with layout controls and actions for the video monitor
 * 
 * Props:
 * @param {String} currentLayout - Current grid layout ('1x1', '2x2', etc.)
 * @param {Function} onLayoutChange - Callback when layout changes
 * @param {Boolean} isFullscreen - Whether fullscreen is active
 * @param {Function} onToggleFullscreen - Toggle fullscreen mode
 * @param {Array} availableCameras - List of available cameras
 * 
 * React Concept:
 * - Controlled components: Parent controls the state via props
 * - Event handling: Buttons trigger callbacks to parent
 */
function ControlToolbar({
  currentLayout,
  onLayoutChange,
  isFullscreen = false,
  onToggleFullscreen,
  availableCameras = []
}) {
  
  // Layout options with icons
  const layoutOptions = [
    { value: '1x1', label: '1×1', icon: <Square size={16} /> },
    { value: '2x2', label: '2×2', icon: <Grid2x2 size={16} /> },
    { value: '3x3', label: '3×3', icon: <Grid3x3 size={16} /> },
    { value: '4x4', label: '4×4', icon: <LayoutGrid size={16} /> },
  ];

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
      {/* Left side - Layout controls */}
      <Space size="middle">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600 font-medium">Layout:</span>
          
          {/* Layout selector buttons */}
          <Space.Compact>
            {layoutOptions.map((option) => (
              <Tooltip key={option.value} title={option.label}>
                <Button
                  type={currentLayout === option.value ? 'primary' : 'default'}
                  icon={option.icon}
                  onClick={() => onLayoutChange(option.value)}
                >
                  {option.label}
                </Button>
              </Tooltip>
            ))}
          </Space.Compact>
        </div>

        {/* Divider */}
        <div className="h-6 w-px bg-gray-300" />

        {/* Camera selector dropdown (for single view) */}
        {currentLayout === '1x1' && (
          <div className="flex items-center gap-2">
            <Camera size={16} className="text-gray-600" />
            <Select
              style={{ width: 200 }}
              placeholder="Select camera"
              options={availableCameras.map(cam => ({
                value: cam.id,
                label: cam.name,
                disabled: cam.status === 'offline'
              }))}
            />
          </div>
        )}
      </Space>

      {/* Right side - Action buttons */}
      <Space>
        {/* Download/Snapshot */}
        <Tooltip title="Take Snapshot">
          <Button
            icon={<Download size={16} />}
            onClick={() => {
              console.log('Taking snapshot...');
              // In real app: capture current frame
            }}
          >
            Snapshot
          </Button>
        </Tooltip>

        {/* Settings */}
        <Tooltip title="Display Settings">
          <Button
            icon={<Settings size={16} />}
            onClick={() => {
              console.log('Opening display settings...');
            }}
          />
        </Tooltip>

        {/* Fullscreen toggle */}
        <Tooltip title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}>
          <Button
            type={isFullscreen ? 'primary' : 'default'}
            icon={isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
            onClick={onToggleFullscreen}
          >
            {isFullscreen ? 'Exit' : 'Fullscreen'}
          </Button>
        </Tooltip>

        {/* Status indicator */}
        <div className="flex items-center gap-2 px-3 py-1 bg-green-50 rounded border border-green-200">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-xs text-green-700 font-medium">
            {availableCameras.filter(c => c.status === 'online').length} / {availableCameras.length} Online
          </span>
        </div>
      </Space>
    </div>
  );
}

export default ControlToolbar;
