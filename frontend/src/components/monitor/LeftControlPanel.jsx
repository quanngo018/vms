import React, { useState, useRef, useEffect } from 'react';
import { 
  ChevronDown,
  ChevronRight,
  Search,
  Folder,
  Camera,
  Send,
  Mic,
  ZoomIn,
  ZoomOut,
  Focus,
  RotateCw,
  ChevronUp,
  ChevronLeft,
  Home,
  Sparkles,
  Bot,
  User
} from 'lucide-react';
import { cameras } from '../../mock/data';

/**
 * LeftControlPanel - Chat-focused left sidebar
 * 
 * Layout priority:
 * 1. Chat Bot Agent (primary - fills most space)
 * 2. Camera Tree (collapsible - collapsed by default)
 * 3. PTZ Controls (collapsible - collapsed by default)
 */
function LeftControlPanel({ selectedCamera, onCameraSelect }) {
  // Camera Tree State
  const [expandedGroups, setExpandedGroups] = useState(['default']);
  const [searchTerm, setSearchTerm] = useState('');

  // Section Collapse State - Chat expanded, others collapsed by default
  const [cameraListExpanded, setCameraListExpanded] = useState(false);
  const [ptzExpanded, setPtzExpanded] = useState(false);

  // Chat State
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([
    { role: 'ai', text: 'Hello! I\'m your AI surveillance assistant. I can help you analyze camera feeds, detect anomalies, and manage your monitoring system. How can I help you today?' }
  ]);
  const chatEndRef = useRef(null);

  // PTZ State
  const [ptzStep, setPtzStep] = useState(4);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Camera Tree
  const groups = [
    {
      id: 'default',
      name: 'Default Group',
      cameras: cameras
    }
  ];

  const toggleGroup = (groupId) => {
    setExpandedGroups(prev => 
      prev.includes(groupId)
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
  };

  const filteredGroups = groups.map(group => ({
    ...group,
    cameras: group.cameras.filter(cam =>
      cam.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cam.ip.includes(searchTerm)
    )
  }));

  // Chat Handlers
  const handleChatSend = () => {
    if (chatInput.trim()) {
      const userMsg = chatInput.trim();
      setChatMessages(prev => [...prev, { role: 'user', text: userMsg }]);
      console.log('[AI Agent] User prompt:', userMsg);
      setChatInput('');

      // Mock AI typing indicator then response
      setChatMessages(prev => [...prev, { role: 'ai', text: '...', typing: true }]);
      setTimeout(() => {
        setChatMessages(prev => {
          const filtered = prev.filter(m => !m.typing);
          return [...filtered, { 
            role: 'ai', 
            text: `I've analyzed your request: "${userMsg}". Here's what I found:\n\n• All monitored cameras are operational\n• No anomalies detected in the last hour\n• System performance is optimal` 
          }];
        });
      }, 1200);
    }
  };

  // PTZ Handlers
  const handlePTZCommand = (action, direction) => {
    console.log(`[PTZ] Camera: ${selectedCamera?.id}, Action: ${action}, Direction: ${direction}, Step: ${ptzStep}`);
  };

  const isPTZCamera = selectedCamera && selectedCamera.type === 'ptz';

  // Quick action suggestions for chat
  const quickActions = [
    'Show anomalies',
    'Camera status',
    'Recent events',
    'System health'
  ];

  return (
    <div className="w-80 bg-[#2d2d2d] border-r border-gray-700 flex flex-col h-full overflow-hidden">

      {/* ==================== CAMERA LIST (Collapsible) ==================== */}
      <div className="flex-shrink-0 border-b border-gray-700">
        <button
          onClick={() => setCameraListExpanded(!cameraListExpanded)}
          className="w-full px-4 py-2.5 flex items-center justify-between text-gray-300 
                   hover:bg-[#353535] transition-colors text-sm bg-[#252525]"
        >
          <div className="flex items-center gap-2">
            <Camera size={16} className="text-orange-400" />
            <span className="font-medium">Cameras</span>
            <span className="text-xs text-gray-500 bg-[#1a1a1a] px-1.5 py-0.5 rounded">
              {cameras.filter(c => c.status === 'online').length}/{cameras.length}
            </span>
          </div>
          {cameraListExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </button>

        {cameraListExpanded && (
          <div className="bg-[#1a1a1a]">
            {/* Search Bar */}
            <div className="p-2 border-b border-gray-700/50">
              <div className="relative">
                <Search size={14} className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search cameras..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-[#2d2d2d] border border-gray-600 
                           rounded text-gray-300 text-xs placeholder-gray-500
                           focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            {/* Camera Tree - Compact */}
            <div className="max-h-48 overflow-y-auto p-1.5">
              {filteredGroups.map(group => (
                <div key={group.id} className="mb-1">
                  <button
                    onClick={() => toggleGroup(group.id)}
                    className="w-full flex items-center gap-1.5 px-2 py-1 
                             hover:bg-[#353535] rounded text-xs text-gray-300"
                  >
                    {expandedGroups.includes(group.id) ? (
                      <ChevronDown size={12} />
                    ) : (
                      <ChevronRight size={12} />
                    )}
                    <Folder size={12} className="text-yellow-500" />
                    <span>{group.name}</span>
                  </button>

                  {expandedGroups.includes(group.id) && (
                    <div className="ml-3 mt-0.5">
                      {group.cameras.map(camera => (
                        <button
                          key={camera.id}
                          onClick={() => onCameraSelect(camera)}
                          className={`w-full flex items-center gap-1.5 px-2 py-1 rounded text-xs
                                    hover:bg-[#353535] transition-colors
                                    ${selectedCamera?.id === camera.id ? 'bg-cyan-500/20 text-cyan-400' : 'text-gray-400'}`}
                        >
                          <Camera size={10} className={camera.status === 'online' ? 'text-orange-500' : 'text-gray-600'} />
                          <span className="truncate">{camera.name}</span>
                          {camera.status === 'offline' && (
                            <span className="ml-auto w-1.5 h-1.5 rounded-full bg-red-500"></span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ==================== CHAT BOT AGENT (Primary - fills remaining space) ==================== */}
      <div className="flex-1 flex flex-col min-h-0 border-b border-gray-700">
        {/* Chat Header */}
        <div className="flex-shrink-0 px-4 py-2.5 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 
                      border-b border-gray-700/50">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Sparkles size={18} className="text-cyan-400" />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-400 rounded-full"></span>
            </div>
            <div>
              <span className="text-sm font-semibold text-gray-200">AI Agent</span>
              <span className="text-[10px] text-green-400 ml-2">Online</span>
            </div>
          </div>
        </div>

        {/* Chat Messages - Scrollable, takes all available space */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
          {chatMessages.map((msg, idx) => (
            <div key={idx} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              {/* Avatar */}
              <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center
                            ${msg.role === 'user' ? 'bg-cyan-500/30' : 'bg-purple-500/30'}`}>
                {msg.role === 'user' 
                  ? <User size={12} className="text-cyan-400" />
                  : <Bot size={12} className="text-purple-400" />
                }
              </div>
              {/* Message Bubble */}
              <div className={`max-w-[85%] text-xs p-2.5 rounded-lg leading-relaxed whitespace-pre-line
                            ${msg.role === 'user' 
                              ? 'bg-cyan-500/20 text-cyan-100 rounded-tr-none' 
                              : 'bg-[#353535] text-gray-300 rounded-tl-none'
                            } ${msg.typing ? 'animate-pulse' : ''}`}>
                {msg.text}
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        {/* Quick Actions */}
        {chatMessages.length <= 1 && (
          <div className="flex-shrink-0 px-3 pb-2">
            <div className="flex flex-wrap gap-1.5">
              {quickActions.map((action, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setChatInput(action);
                  }}
                  className="px-2.5 py-1 bg-[#353535] hover:bg-cyan-500/20 hover:text-cyan-400
                           rounded-full text-[10px] text-gray-400 transition-colors border border-gray-600/50
                           hover:border-cyan-500/30"
                >
                  {action}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Chat Input - Always visible at bottom */}
        <div className="flex-shrink-0 p-3 bg-[#1a1a1a] border-t border-gray-700/50">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Ask AI agent anything..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleChatSend()}
              className="flex-1 px-3 py-2 bg-[#2d2d2d] border border-gray-600 
                       rounded-lg text-sm text-gray-300 placeholder-gray-500
                       focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30"
            />
            <button
              onClick={handleChatSend}
              disabled={!chatInput.trim()}
              className="p-2 bg-cyan-500 hover:bg-cyan-600 disabled:bg-gray-600 disabled:cursor-not-allowed
                       rounded-lg transition-colors"
              title="Send"
            >
              <Send size={16} className="text-white" />
            </button>
            <button
              className="p-2 bg-[#2d2d2d] hover:bg-[#3d3d3d] rounded-lg transition-colors 
                       border border-gray-600"
              title="Voice Input"
            >
              <Mic size={16} className="text-gray-400" />
            </button>
          </div>
        </div>
      </div>

      {/* ==================== PTZ CONTROLS (Collapsible) ==================== */}
      <div className="flex-shrink-0">
        <button
          onClick={() => setPtzExpanded(!ptzExpanded)}
          className="w-full px-4 py-2.5 flex items-center justify-between text-gray-300 
                   hover:bg-[#353535] transition-colors text-sm bg-[#252525]"
        >
          <div className="flex items-center gap-2">
            <RotateCw size={16} className="text-gray-400" />
            <span className="font-medium">PTZ Controls</span>
          </div>
          {ptzExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </button>
        
        {ptzExpanded && (
          <div className="p-3 bg-[#1a1a1a] max-h-72 overflow-y-auto">
            {isPTZCamera ? (
              <div className="space-y-3">
                {/* PTZ Control Pad */}
                <div className="flex flex-col items-center">
                  <div className="relative w-28 h-28 bg-[#2d2d2d] rounded-full flex items-center justify-center">
                    <button
                      onClick={() => handlePTZCommand('home', 'center')}
                      className="absolute w-9 h-9 bg-[#3d3d3d] hover:bg-[#4d4d4d] 
                               rounded-full flex items-center justify-center transition-colors z-10"
                    >
                      <Home size={14} className="text-gray-400" />
                    </button>
                    <button
                      onMouseDown={() => handlePTZCommand('tilt', 'up')}
                      onMouseUp={() => handlePTZCommand('tilt', 'stop')}
                      className="absolute top-1 left-1/2 transform -translate-x-1/2 
                               p-1.5 hover:bg-[#353535] rounded transition-colors"
                    >
                      <ChevronUp size={16} className="text-gray-400" />
                    </button>
                    <button
                      onMouseDown={() => handlePTZCommand('tilt', 'down')}
                      onMouseUp={() => handlePTZCommand('tilt', 'stop')}
                      className="absolute bottom-1 left-1/2 transform -translate-x-1/2 
                               p-1.5 hover:bg-[#353535] rounded transition-colors"
                    >
                      <ChevronDown size={16} className="text-gray-400" />
                    </button>
                    <button
                      onMouseDown={() => handlePTZCommand('pan', 'left')}
                      onMouseUp={() => handlePTZCommand('pan', 'stop')}
                      className="absolute left-1 top-1/2 transform -translate-y-1/2 
                               p-1.5 hover:bg-[#353535] rounded transition-colors"
                    >
                      <ChevronLeft size={16} className="text-gray-400" />
                    </button>
                    <button
                      onMouseDown={() => handlePTZCommand('pan', 'right')}
                      onMouseUp={() => handlePTZCommand('pan', 'stop')}
                      className="absolute right-1 top-1/2 transform -translate-y-1/2 
                               p-1.5 hover:bg-[#353535] rounded transition-colors"
                    >
                      <ChevronRight size={16} className="text-gray-400" />
                    </button>
                  </div>

                  {/* Step Slider */}
                  <div className="mt-2 w-full">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-gray-500">Step {ptzStep}</span>
                      <input
                        type="range"
                        min="1"
                        max="8"
                        value={ptzStep}
                        onChange={(e) => setPtzStep(parseInt(e.target.value))}
                        className="flex-1 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer
                                 [&::-webkit-slider-thumb]:appearance-none 
                                 [&::-webkit-slider-thumb]:w-2.5 
                                 [&::-webkit-slider-thumb]:h-2.5 
                                 [&::-webkit-slider-thumb]:bg-cyan-400 
                                 [&::-webkit-slider-thumb]:rounded-full"
                      />
                    </div>
                  </div>
                </div>

                {/* Zoom and Focus Controls */}
                <div className="grid grid-cols-4 gap-1.5">
                  <button className="p-1.5 bg-[#2d2d2d] hover:bg-[#3d3d3d] rounded transition-colors" title="Zoom Out">
                    <ZoomOut size={14} className="text-gray-400 mx-auto" />
                  </button>
                  <button className="p-1.5 bg-[#2d2d2d] hover:bg-[#3d3d3d] rounded transition-colors" title="Zoom In">
                    <ZoomIn size={14} className="text-gray-400 mx-auto" />
                  </button>
                  <button className="p-1.5 bg-[#2d2d2d] hover:bg-[#3d3d3d] rounded transition-colors" title="Focus">
                    <Focus size={14} className="text-gray-400 mx-auto" />
                  </button>
                  <button className="p-1.5 bg-[#2d2d2d] hover:bg-[#3d3d3d] rounded transition-colors" title="Rotate">
                    <RotateCw size={14} className="text-gray-400 mx-auto" />
                  </button>
                </div>

                {/* Presets */}
                <div className="flex gap-1.5">
                  <select className="flex-1 px-2 py-1 bg-[#2d2d2d] border border-gray-600 rounded text-xs text-gray-300">
                    <option>Preset</option>
                    <option>Preset 1</option>
                    <option>Preset 2</option>
                    <option>Gate View</option>
                  </select>
                  <button className="px-2 py-1 bg-[#2d2d2d] hover:bg-[#3d3d3d] 
                                   rounded text-[10px] text-gray-300 transition-colors">
                    Call
                  </button>
                  <button className="px-2 py-1 bg-[#2d2d2d] hover:bg-[#3d3d3d] 
                                   rounded text-[10px] text-gray-300 transition-colors">
                    Add
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-xs text-gray-400 text-center py-3">
                {selectedCamera ? 'This camera does not support PTZ' : 'Select a PTZ camera'}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default LeftControlPanel;
