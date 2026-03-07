import React, { useState } from 'react';
import { Search, ChevronDown, ChevronRight, Folder, Camera } from 'lucide-react';
import { cameras } from '../../mock/data';

/**
 * CameraSidebar - Left sidebar for camera organization (matches template)
 * 
 * Features:
 * - Organization dropdown
 * - Search bar
 * - Tree view with groups and cameras
 * - Dark theme styling
 */
function CameraSidebar({ onCameraSelect, selectedCameraId }) {
  const [expandedGroups, setExpandedGroups] = useState(['default']);
  const [searchTerm, setSearchTerm] = useState('');

  const toggleGroup = (groupId) => {
    setExpandedGroups(prev => 
      prev.includes(groupId)
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
  };

  // Group cameras (for demo, just one group)
  const groups = [
    {
      id: 'default',
      name: 'Default Group',
      cameras: cameras
    }
  ];

  // Filter cameras by search
  const filteredGroups = groups.map(group => ({
    ...group,
    cameras: group.cameras.filter(cam =>
      cam.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cam.ip.includes(searchTerm)
    )
  }));

  return (
    <div className="w-64 bg-[#2d2d2d] border-r border-gray-700 flex flex-col h-full">
      {/* Organization Dropdown */}
      <div className="p-4 border-b border-gray-700">
        <button className="w-full flex items-center justify-between px-3 py-2 
                         bg-[#1a1a1a] hover:bg-[#252525] rounded text-gray-300 text-sm">
          <span>Organization</span>
          <ChevronDown size={16} />
        </button>
      </div>

      {/* Search Bar */}
      <div className="p-4 border-b border-gray-700">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-[#1a1a1a] border border-gray-600 
                     rounded text-gray-300 text-sm placeholder-gray-500
                     focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* Camera Tree */}
      <div className="flex-1 overflow-y-auto p-2">
        {filteredGroups.map(group => (
          <div key={group.id} className="mb-2">
            {/* Group Header */}
            <button
              onClick={() => toggleGroup(group.id)}
              className="w-full flex items-center gap-2 px-2 py-1.5 
                       hover:bg-[#353535] rounded text-sm text-gray-300"
            >
              {expandedGroups.includes(group.id) ? (
                <ChevronDown size={14} />
              ) : (
                <ChevronRight size={14} />
              )}
              <Folder size={14} className="text-yellow-500" />
              <span>{group.name}</span>
            </button>

            {/* Cameras List */}
            {expandedGroups.includes(group.id) && (
              <div className="ml-4 mt-1">
                {group.cameras.map(camera => (
                  <button
                    key={camera.id}
                    onClick={() => onCameraSelect(camera)}
                    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm
                              hover:bg-[#353535] transition-colors
                              ${selectedCameraId === camera.id ? 'bg-cyan-500/20 text-cyan-400' : 'text-gray-400'}`}
                  >
                    <Camera size={14} className={camera.status === 'online' ? 'text-orange-500' : 'text-gray-600'} />
                    <span className="truncate">{camera.ip}</span>
                    {camera.status === 'offline' && (
                      <span className="ml-auto w-2 h-2 rounded-full bg-red-500"></span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default CameraSidebar;
