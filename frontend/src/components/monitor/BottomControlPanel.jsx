import React, { useState } from 'react';
import { 
  ChevronRight,
  ChevronDown,
  Grid3x3,
  Square,
  Maximize,
  MonitorPlay,
  ZoomIn,
  ZoomOut,
  Focus,
  RotateCw,
  ChevronUp,
  ChevronLeft,
  Home
} from 'lucide-react';

/**
 * BottomControlPanel - Bottom panel with View and PTZ controls (matches template)
 * 
 * Features:
 * - Collapsible View section
 * - Collapsible PTZ section with circular control pad
 * - Layout buttons on the right
 * - Dark theme styling
 */
function BottomControlPanel({ layout, onLayoutChange, selectedCamera }) {
  const [viewExpanded, setViewExpanded] = useState(false);
  const [ptzExpanded, setPtzExpanded] = useState(false);
  const [ptzStep, setPtzStep] = useState(4);

  // Layout buttons matching template (bottom right)
  const layoutButtons = [
    { icon: <Maximize size={16} />, value: '1x1', title: '1x1' },
    { icon: <Square size={16} />, value: '1+5', title: '1+5' },
    { icon: <Grid3x3 size={16} />, value: '2x2', title: '2x2' },
    { icon: <Grid3x3 size={18} />, value: '3x3', title: '3x3' },
    { icon: <Grid3x3 size={20} />, value: '4x4', title: '4x4' },
    { icon: <MonitorPlay size={16} />, value: 'custom', title: 'Custom' },
  ];

  const handlePTZCommand = (action, direction) => {
    console.log(`[PTZ] Camera: ${selectedCamera?.id}, Action: ${action}, Direction: ${direction}, Step: ${ptzStep}`);
  };

  return (
    <div className="bg-[#2d2d2d] border-t border-gray-700">
      <div className="flex items-stretch">
        {/* Left Side - View and PTZ Sections */}
        <div className="flex-1 flex">
          {/* View Section */}
          <div className="border-r border-gray-700">
            <button
              onClick={() => setViewExpanded(!viewExpanded)}
              className="w-48 px-4 py-2 flex items-center justify-between text-gray-300 
                       hover:bg-[#353535] transition-colors text-sm"
            >
              <span>View</span>
              {viewExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>
            
            {viewExpanded && (
              <div className="p-4 bg-[#1a1a1a] border-t border-gray-700">
                <p className="text-xs text-gray-400">View options will go here</p>
              </div>
            )}
          </div>

          {/* PTZ Section */}
          <div className="flex-1 border-r border-gray-700">
            <button
              onClick={() => setPtzExpanded(!ptzExpanded)}
              className="w-full px-4 py-2 flex items-center justify-between text-gray-300 
                       hover:bg-[#353535] transition-colors text-sm"
            >
              <span>PTZ</span>
              {ptzExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>
            
            {ptzExpanded && (
              <div className="p-4 bg-[#1a1a1a] border-t border-gray-700">
                {selectedCamera && selectedCamera.type === 'PTZ' ? (
                  <div className="flex gap-6">
                    {/* PTZ Control Pad */}
                    <div className="flex flex-col items-center">
                      <div className="relative w-32 h-32 bg-[#2d2d2d] rounded-full flex items-center justify-center">
                        {/* Center Button */}
                        <button
                          onClick={() => handlePTZCommand('home', 'center')}
                          className="absolute w-10 h-10 bg-[#3d3d3d] hover:bg-[#4d4d4d] 
                                   rounded-full flex items-center justify-center transition-colors z-10"
                        >
                          <Home size={16} className="text-gray-400" />
                        </button>

                        {/* Up */}
                        <button
                          onMouseDown={() => handlePTZCommand('tilt', 'up')}
                          onMouseUp={() => handlePTZCommand('tilt', 'stop')}
                          className="absolute top-2 left-1/2 transform -translate-x-1/2 
                                   p-2 hover:bg-[#353535] rounded transition-colors"
                        >
                          <ChevronUp size={18} className="text-gray-400" />
                        </button>

                        {/* Down */}
                        <button
                          onMouseDown={() => handlePTZCommand('tilt', 'down')}
                          onMouseUp={() => handlePTZCommand('tilt', 'stop')}
                          className="absolute bottom-2 left-1/2 transform -translate-x-1/2 
                                   p-2 hover:bg-[#353535] rounded transition-colors"
                        >
                          <ChevronDown size={18} className="text-gray-400" />
                        </button>

                        {/* Left */}
                        <button
                          onMouseDown={() => handlePTZCommand('pan', 'left')}
                          onMouseUp={() => handlePTZCommand('pan', 'stop')}
                          className="absolute left-2 top-1/2 transform -translate-y-1/2 
                                   p-2 hover:bg-[#353535] rounded transition-colors"
                        >
                          <ChevronLeft size={18} className="text-gray-400" />
                        </button>

                        {/* Right */}
                        <button
                          onMouseDown={() => handlePTZCommand('pan', 'right')}
                          onMouseUp={() => handlePTZCommand('pan', 'stop')}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 
                                   p-2 hover:bg-[#353535] rounded transition-colors"
                        >
                          <ChevronRight size={18} className="text-gray-400" />
                        </button>
                      </div>

                      {/* Step Slider */}
                      <div className="mt-4 w-full">
                        <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                          <span>Step {ptzStep}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setPtzStep(Math.max(1, ptzStep - 1))}
                            className="text-gray-400 hover:text-cyan-400"
                          >
                            −
                          </button>
                          <input
                            type="range"
                            min="1"
                            max="8"
                            value={ptzStep}
                            onChange={(e) => setPtzStep(parseInt(e.target.value))}
                            className="flex-1 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer
                                     [&::-webkit-slider-thumb]:appearance-none 
                                     [&::-webkit-slider-thumb]:w-3 
                                     [&::-webkit-slider-thumb]:h-3 
                                     [&::-webkit-slider-thumb]:bg-cyan-400 
                                     [&::-webkit-slider-thumb]:rounded-full"
                          />
                          <button
                            onClick={() => setPtzStep(Math.min(8, ptzStep + 1))}
                            className="text-gray-400 hover:text-cyan-400"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Zoom and Focus Controls */}
                    <div className="flex flex-col gap-3">
                      <div className="flex gap-2">
                        <button className="p-2 bg-[#2d2d2d] hover:bg-[#3d3d3d] rounded transition-colors">
                          <ZoomOut size={18} className="text-gray-400" />
                        </button>
                        <button className="p-2 bg-[#2d2d2d] hover:bg-[#3d3d3d] rounded transition-colors">
                          <ZoomIn size={18} className="text-gray-400" />
                        </button>
                        <button className="p-2 bg-[#2d2d2d] hover:bg-[#3d3d3d] rounded transition-colors">
                          <Focus size={18} className="text-gray-400" />
                        </button>
                        <button className="p-2 bg-[#2d2d2d] hover:bg-[#3d3d3d] rounded transition-colors">
                          <RotateCw size={18} className="text-gray-400" />
                        </button>
                      </div>

                      {/* Preset Dropdowns */}
                      <div className="space-y-2">
                        <select className="w-full px-3 py-1.5 bg-[#2d2d2d] border border-gray-600 rounded text-sm text-gray-300">
                          <option>Preset</option>
                          <option>Preset 1</option>
                          <option>Preset 2</option>
                        </select>
                        
                        <div className="flex gap-2">
                          <button className="flex-1 px-3 py-1.5 bg-[#2d2d2d] hover:bg-[#3d3d3d] 
                                         rounded text-xs text-gray-300 transition-colors">
                            Call
                          </button>
                          <button className="flex-1 px-3 py-1.5 bg-[#2d2d2d] hover:bg-[#3d3d3d] 
                                         rounded text-xs text-gray-300 transition-colors">
                            Add
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-gray-400">
                    {selectedCamera ? 'This camera does not support PTZ' : 'Select a PTZ camera'}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Side - Layout Buttons */}
        <div className="flex items-center gap-1 px-4">
          {layoutButtons.map((btn, idx) => (
            <button
              key={idx}
              onClick={() => onLayoutChange(btn.value)}
              title={btn.title}
              className={`p-2 rounded transition-colors
                        ${layout === btn.value 
                          ? 'bg-cyan-500 text-white' 
                          : 'text-gray-400 hover:bg-[#353535] hover:text-cyan-400'}`}
            >
              {btn.icon}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default BottomControlPanel;
