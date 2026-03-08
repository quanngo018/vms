import React, { useState, useEffect, useCallback } from 'react';
import { Tabs, Select, DatePicker, Button, Space } from 'antd';
import { RefreshCw, Download } from 'lucide-react';
import { cameras as mockCameras } from '../mock/data';
import { fetchCameras } from '../services/videoStream';

import TrafficFlowTab from '../components/traffic/TrafficFlowTab';
import ParkingViolationTab from '../components/traffic/ParkingViolationTab';

const { RangePicker } = DatePicker;

/**
 * IntelligentTraffic Page
 * 
 * Two main sub-modules:
 *   1. Traffic Flow - Vehicle counting, charts, real-time stats
 *   2. Illegal Parking - Violation detection, event list, heatmap
 * 
 * Data flow (production):
 *   DeepStream AI → POST /api/traffic/events → Backend stores → Frontend polls/WS
 *   Frontend GET /api/traffic/stats, /api/traffic/flow, /api/traffic/violations
 * 
 * Current: Uses mock data generators. Same component structure for real API.
 */
function IntelligentTraffic() {
  const [cameras, setCameras] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState(null);
  const [activeTab, setActiveTab] = useState('flow');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Load cameras
  useEffect(() => {
    let cancelled = false;
    async function load() {
      const apiCams = await fetchCameras();
      if (!cancelled) {
        const cams = apiCams?.length > 0 ? apiCams : mockCameras;
        setCameras(cams);
        if (cams.length > 0) setSelectedCamera(cams[0].path_name || cams[0].id);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    setLastUpdated(new Date());
    setTimeout(() => setIsRefreshing(false), 600);
  }, []);

  // Auto-refresh every 30s
  useEffect(() => {
    const timer = setInterval(() => {
      setLastUpdated(new Date());
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  const cameraOptions = cameras.map(c => ({
    value: c.path_name || c.id,
    label: c.name || c.id,
  }));

  const selectedCameraObj = cameras.find(
    c => (c.path_name || c.id) === selectedCamera
  );

  const tabItems = [
    {
      key: 'flow',
      label: (
        <span className="flex items-center gap-2 px-1">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
          </svg>
          Traffic Flow
        </span>
      ),
      children: (
        <TrafficFlowTab
          cameraId={selectedCamera}
          camera={selectedCameraObj}
          cameras={cameras}
          onCameraSelect={setSelectedCamera}
          refreshKey={lastUpdated}
        />
      ),
    },
    {
      key: 'parking',
      label: (
        <span className="flex items-center gap-2 px-1">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M9 17V7h4a3 3 0 0 1 0 6H9" />
          </svg>
          Illegal Parking
        </span>
      ),
      children: (
        <ParkingViolationTab
          cameraId={selectedCamera}
          camera={selectedCameraObj}
          cameras={cameras}
          onCameraSelect={setSelectedCamera}
          refreshKey={lastUpdated}
        />
      ),
    },
  ];

  return (
    <div className="h-[calc(100vh-56px)] bg-[#111318] flex flex-col overflow-hidden">
      {/* ── Header Bar ── */}
      <div className="flex-shrink-0 px-5 py-3 bg-[#1a1d24] border-b border-white/5">
        <div className="flex items-center justify-between">
          {/* Left: Title + Camera selector */}
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-lg font-semibold text-white tracking-wide">
                Intelligent Traffic
              </h1>
              <p className="text-xs text-gray-500 mt-0.5">
                Real-time vehicle counting & parking violation detection
              </p>
            </div>
            <div className="h-8 w-px bg-white/10 mx-2" />
            <Select
              value={selectedCamera}
              onChange={setSelectedCamera}
              options={cameraOptions}
              placeholder="Select camera"
              className="min-w-[180px]"
              popupMatchSelectWidth={false}
              showSearch
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
            />
          </div>

          {/* Right: Controls */}
          <Space size="middle">
            <span className="text-xs text-gray-500">
              Updated {lastUpdated.toLocaleTimeString('vi-VN')}
            </span>
            <Button
              icon={<RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />}
              onClick={handleRefresh}
              size="small"
              type="text"
              className="!text-gray-400 hover:!text-cyan-400"
            >
              Refresh
            </Button>
            <Button
              icon={<Download size={14} />}
              size="small"
              type="text"
              className="!text-gray-400 hover:!text-cyan-400"
            >
              Export
            </Button>
          </Space>
        </div>
      </div>

      {/* ── Tabs + Content ── */}
      <div className="flex-1 overflow-hidden">
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          className="traffic-tabs h-full"
          tabBarStyle={{
            margin: 0,
            padding: '0 20px',
            background: '#1a1d24',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
          }}
        />
      </div>
    </div>
  );
}

export default IntelligentTraffic;
