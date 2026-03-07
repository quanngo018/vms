import React, { useState, useEffect } from 'react';
import { cameras as mockCameras } from '../mock/data';
import { fetchCameras } from '../services/videoStream';
import VideoGrid from '../components/monitor/VideoGrid';
import LeftControlPanel from '../components/monitor/LeftControlPanel';
import BottomBar from '../components/monitor/BottomBar';

/**
 * LiveMonitor Page - Optimized layout with left sidebar
 * 
 * Fetches camera list from backend API (/api/cameras).
 * Falls back to mock data if backend is unavailable.
 * 
 * Layout:
 * - Left sidebar: Camera Tree + Chat + View + PTZ (all stacked vertically)
 * - Main area: Video Grid (maximized viewing area)
 * - Bottom bar: Layout buttons + Pagination
 */
function LiveMonitor() {
  const [cameras, setCameras] = useState(mockCameras);
  const [layout, setLayout] = useState('2x2');
  const [selectedCamera, setSelectedCamera] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [previousLayout, setPreviousLayout] = useState('2x2');
  const [previousPage, setPreviousPage] = useState(1);
  const [skipPageReset, setSkipPageReset] = useState(false);

  // Fetch cameras from backend, fallback to mock data
  useEffect(() => {
    let cancelled = false;
    async function loadCameras() {
      const apiCameras = await fetchCameras();
      if (!cancelled && apiCameras && apiCameras.length > 0) {
        setCameras(apiCameras);
        console.log(`[LiveMonitor] Loaded ${apiCameras.length} cameras from backend`);
      } else if (!cancelled) {
        console.log(`[LiveMonitor] Using ${mockCameras.length} cameras from mock data`);
      }
    }
    loadCameras();
    return () => { cancelled = true; };
  }, []);

  // Calculate cameras per page based on layout
  const getCamerasPerPage = (layoutType) => {
    switch (layoutType) {
      case '1x1': return 1;
      case '1+5': return 6;
      case '2x2': return 4;
      case '3x3': return 9;
      case '4x4': return 16;
      case '5x5': return 25;
      default:
        if (layoutType.startsWith('custom:')) {
          const parts = layoutType.split(':')[1].split('x');
          const cols = parseInt(parts[0], 10) || 6;
          const rows = parseInt(parts[1], 10) || 6;
          return cols * rows;
        }
        return 4;
    }
  };

  const camerasPerPage = getCamerasPerPage(layout);
  const totalPages = Math.ceil(cameras.length / camerasPerPage);

  // Reset to page 1 when layout changes (unless triggered by double-click)
  useEffect(() => {
    if (skipPageReset) {
      setSkipPageReset(false);
      return;
    }
    setCurrentPage(1);
  }, [layout]);

  // Get cameras for current page
  const startIdx = (currentPage - 1) * camerasPerPage;
  const endIdx = startIdx + camerasPerPage;
  const paginatedCameras = cameras.slice(startIdx, endIdx);

  const handleCameraSelect = (camera) => {
    console.log('Camera selected:', camera.name);
    setSelectedCamera(camera);
  };

  const handleLayoutChange = (newLayout) => {
    console.log('Layout changed to:', newLayout);
    setLayout(newLayout);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      console.log('Page changed to:', newPage);
    }
  };

  // Handle double-click to toggle between 1x1 and previous view
  const handleCameraDoubleClick = (camera) => {
    if (layout === '1x1') {
      // Already in 1x1, return to previous layout
      console.log('Double-clicked in 1x1 - Returning to previous view:', previousLayout);
      setSkipPageReset(true);
      setCurrentPage(previousPage);
      setLayout(previousLayout);
    } else {
      // Switch to 1x1 view
      console.log('Double-clicked camera:', camera.name, '- Switching to 1x1 view');
      // Save current layout and page before switching
      setPreviousLayout(layout);
      setPreviousPage(currentPage);

      setSelectedCamera(camera);

      // Find which page this camera is on in 1x1 mode and switch to it
      const cameraIndex = cameras.findIndex(cam => cam.id === camera.id);
      const pageForCamera = cameraIndex !== -1 ? cameraIndex + 1 : 1;

      // Skip the useEffect page-reset since we set the correct page here
      setSkipPageReset(true);
      setCurrentPage(pageForCamera);
      setLayout('1x1');
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-56px)] bg-[#1a1a1a] overflow-hidden">
      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Control Panel - All controls in one sidebar */}
        <LeftControlPanel
          selectedCamera={selectedCamera}
          onCameraSelect={handleCameraSelect}
        />

        {/* Center - Video Grid (Maximized) */}
        <div className="flex-1 bg-[#1a1a1a] overflow-hidden relative">
          {/* Pagination Info Overlay */}
          {totalPages > 1 && (
            <div className="absolute top-4 right-4 z-10 bg-[#2d2d2d]/90 backdrop-blur-sm 
                          px-3 py-1.5 rounded-lg border border-gray-600">
              <span className="text-xs text-gray-300">
                Cameras {startIdx + 1}-{Math.min(endIdx, cameras.length)} of {cameras.length}
              </span>
            </div>
          )}

          <VideoGrid
            cameras={paginatedCameras}
            layout={layout}
            onCameraSelect={handleCameraSelect}
            selectedCameraId={selectedCamera?.id}
            onCameraDoubleClick={handleCameraDoubleClick}
          />
        </div>
      </div>

      {/* Bottom Bar - Layout buttons and pagination */}
      <BottomBar
        layout={layout}
        onLayoutChange={handleLayoutChange}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />
    </div>
  );
}

export default LiveMonitor;
