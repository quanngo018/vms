import React, { useState } from 'react';
import {
  Grid3x3,
  Square,
  Maximize,
  MonitorPlay,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

/**
 * BottomBar - Simple bottom bar with layout buttons and pagination
 * 
 * Features:
 * - Layout switcher buttons
 * - Previous/Next page navigation for camera pagination
 */
function BottomBar({ layout, onLayoutChange, currentPage, totalPages, onPageChange }) {
  // Layout buttons
  const layoutButtons = [
    { icon: <Maximize size={16} />, value: '1x1', title: '1x1' },
    { icon: <Square size={16} />, value: '1+5', title: '1+5' },
    { icon: <Grid3x3 size={16} />, value: '2x2', title: '2x2' },
    { icon: <Grid3x3 size={18} />, value: '3x3', title: '3x3' },
    { icon: <Grid3x3 size={20} />, value: '4x4', title: '4x4' },
    { icon: <Grid3x3 size={24} />, value: '5x5', title: '5x5' },
    { icon: <MonitorPlay size={16} />, value: 'custom', title: 'Custom' },
  ];

  const [showCustomPopup, setShowCustomPopup] = useState(false);
  const [customCols, setCustomCols] = useState(6);
  const [customRows, setCustomRows] = useState(6);

  const handleCustomSubmit = () => {
    onLayoutChange(`custom:${customCols}x${customRows}`);
    setShowCustomPopup(false);
  };

  return (
    <div className="h-12 bg-[#2d2d2d] border-t border-gray-700 flex items-center justify-between px-4">
      {/* Left side - Pagination */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-400">
          Page {currentPage} of {totalPages}
        </span>
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-1.5 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed
                   text-gray-400 hover:bg-[#353535] hover:text-cyan-400"
          title="Previous Page"
        >
          <ChevronLeft size={18} />
        </button>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-1.5 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed
                   text-gray-400 hover:bg-[#353535] hover:text-cyan-400"
          title="Next Page"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Right side - Layout Buttons */}
      <div className="flex items-center gap-1 relative">
        <span className="text-xs text-gray-400 mr-2">Layout:</span>
        {layoutButtons.map((btn, idx) => (
          <button
            key={idx}
            onClick={() => {
              if (btn.value === 'custom') {
                setShowCustomPopup(!showCustomPopup);
              } else {
                setShowCustomPopup(false);
                onLayoutChange(btn.value);
              }
            }}
            title={btn.title}
            className={`p-2 rounded transition-colors
                      ${(layout === btn.value || (layout.startsWith('custom') && btn.value === 'custom'))
                ? 'bg-cyan-500 text-white'
                : 'text-gray-400 hover:bg-[#353535] hover:text-cyan-400'}`}
          >
            {btn.icon}
          </button>
        ))}

        {/* Custom Layout Popup */}
        {showCustomPopup && (
          <div className="absolute bottom-12 right-0 bg-[#2d2d2d] border border-gray-600 rounded-lg p-4 shadow-xl z-50 w-64">
            <h3 className="text-white text-sm font-semibold mb-3">Custom Layout</h3>
            <div className="flex items-center justify-between gap-4 mb-4">
              <div className="flex flex-col w-full">
                <label className="text-xs text-gray-400 mb-1 block text-center">Columns</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={customCols}
                  onChange={(e) => setCustomCols(parseInt(e.target.value) || 1)}
                  className="w-full bg-[#1a1a1a] text-white border border-gray-600 rounded p-1.5 text-center focus:outline-none focus:border-cyan-500"
                />
              </div>
              <span className="text-gray-400 font-bold mt-4">x</span>
              <div className="flex flex-col w-full">
                <label className="text-xs text-gray-400 mb-1 block text-center">Rows</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={customRows}
                  onChange={(e) => setCustomRows(parseInt(e.target.value) || 1)}
                  className="w-full bg-[#1a1a1a] text-white border border-gray-600 rounded p-1.5 text-center focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowCustomPopup(false)}
                className="px-3 py-1.5 rounded text-xs text-gray-400 hover:bg-[#353535]"
              >
                Cancel
              </button>
              <button
                onClick={handleCustomSubmit}
                className="px-3 py-1.5 rounded text-xs bg-cyan-600 text-white hover:bg-cyan-500"
              >
                Apply
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default BottomBar;
