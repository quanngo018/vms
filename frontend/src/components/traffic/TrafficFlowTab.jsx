import React, { useState, useMemo, useCallback } from 'react';
import { Segmented } from 'antd';
import { Car, Bike, Truck, Activity } from 'lucide-react';

import CameraMapPanel from './CameraMapPanel';
import StatCard from './StatCard';
import TrafficFlowChart from './TrafficFlowChart';
import VehicleDistributionChart from './VehicleDistributionChart';
import HourlyDistributionChart from './HourlyDistributionChart';
import TrafficEventTable from './TrafficEventTable';

import {
  generateHourlyFlow,
  generateRealtimeFlow,
  getVehicleDistribution,
  getTrafficStats,
  generateTrafficEvents,
} from '../../mock/trafficData';

/**
 * TrafficFlowTab - Vehicle counting & flow analysis
 * 
 * Layout:
 * ┌──────────────┬─────────────────────────────────────────┐
 * │  Map / Cam   │  Stat Cards (4)                         │
 * │  (toggle)    │───────────────────┬─────────────────────│
 * │              │  Flow Chart       │  Pie Chart          │
 * │   + Config   │  (area/line)      │  (vehicle dist)     │
 * │   panel      │───────────────────┴─────────────────────│
 * │              │  Hourly Bar Chart                       │
 * │              │─────────────────────────────────────────│
 * │              │  Recent Events Table                    │
 * └──────────────┴─────────────────────────────────────────┘
 */
function TrafficFlowTab({ cameraId, camera, cameras, onCameraSelect, refreshKey }) {
  const [timeRange, setTimeRange] = useState('24h');
  const [viewMode, setViewMode] = useState('overview'); // 'overview' | 'detail'

  const camCount = cameras.length || 6;

  // Scale: overview = aggregate of all cameras, detail = single camera
  const flowData = useMemo(() => {
    const scale = viewMode === 'overview' ? camCount : 1;
    if (timeRange === 'realtime') return generateRealtimeFlow(12, scale);
    if (timeRange === '1h') return generateRealtimeFlow(12, scale);
    return generateHourlyFlow(24, scale);
  }, [cameraId, timeRange, refreshKey, viewMode, camCount]);

  const distribution = useMemo(() => getVehicleDistribution(flowData), [flowData]);
  const stats = useMemo(() => getTrafficStats(flowData), [flowData]);

  const events = useMemo(() => {
    const all = generateTrafficEvents(20);
    if (viewMode === 'overview') return all;
    return all.slice(0, 8).map(e => ({ ...e, camera_id: cameraId, camera_name: camera?.name || cameraId }));
  }, [cameraId, camera, refreshKey, viewMode]);

  const handleModeChange = useCallback((mode) => {
    setViewMode(mode === 'stream' ? 'detail' : 'overview');
  }, []);

  return (
    <div className="h-[calc(100vh-56px-48px-48px)] overflow-y-auto custom-scrollbar">
      <div className="flex gap-4 p-5">
        {/* ═══════════ LEFT: Map ↔ Camera Stream ═══════════ */}
        <CameraMapPanel
          cameras={cameras}
          selectedCamera={cameraId}
          onCameraSelect={onCameraSelect}
          onModeChange={handleModeChange}
          detectionLabel="AI Detection Zone Active"
        >
          {/* Detection zone config */}
          <div className="bg-[#1e2028] rounded-xl border border-white/5 p-4">
            <h4 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">
              Detection Config
            </h4>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500">Counting Line</span>
                <span className="text-emerald-400">Active</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Direction</span>
                <span className="text-gray-300">Bidirectional</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Model</span>
                <span className="text-gray-300">YOLOv8-Traffic</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Confidence</span>
                <span className="text-gray-300">&ge; 0.5</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Tracker</span>
                <span className="text-gray-300">NvDCF</span>
              </div>
            </div>
          </div>
        </CameraMapPanel>

        {/* ═══════════ RIGHT: Analytics ═══════════ */}
        <div className="flex-1 flex flex-col gap-4 min-w-0">
          {/* Context header: overview vs detail */}
          {viewMode === 'detail' ? (
            <div className="flex items-center gap-2 px-3 py-2 bg-cyan-500/5 rounded-lg border border-cyan-500/20">
              <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
              <span className="text-xs text-gray-400">Camera:</span>
              <span className="text-xs text-cyan-400 font-medium">{camera?.name || cameraId}</span>
              <span className="text-[10px] text-gray-600 ml-auto">← Back to map for all cameras</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-2 bg-white/[0.02] rounded-lg border border-white/5">
              <span className="text-xs text-gray-400">Aggregate data from</span>
              <span className="text-xs text-emerald-400 font-medium">{camCount} cameras</span>
            </div>
          )}

          {/* Stat Cards Row */}
          <div className="grid grid-cols-4 gap-3">
            <StatCard
              title="Total Vehicles"
              value={stats.total}
              icon={<Activity size={16} />}
              color="cyan"
              trend={stats.changePercent}
            />
            <StatCard
              title="Cars"
              value={stats.car}
              icon={<Car size={16} />}
              color="blue"
            />
            <StatCard
              title="Motorbikes"
              value={stats.motorbike}
              icon={<Bike size={16} />}
              color="green"
            />
            <StatCard
              title="Bus & Truck"
              value={stats.bus + stats.truck}
              icon={<Truck size={16} />}
              color="amber"
            />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-3 gap-4">
            {/* Flow chart - 2/3 width */}
            <div className="col-span-2 bg-[#1e2028] rounded-xl border border-white/5 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-white">Traffic Flow</h3>
                <Segmented
                  size="small"
                  value={timeRange}
                  onChange={setTimeRange}
                  options={[
                    { label: 'Real-time', value: 'realtime' },
                    { label: '1 Hour', value: '1h' },
                    { label: '24 Hours', value: '24h' },
                  ]}
                  className="traffic-segmented"
                />
              </div>
              <TrafficFlowChart
                data={flowData}
                interval={timeRange === '24h' ? 'hourly' : 'realtime'}
                height={240}
              />
            </div>

            {/* Pie chart - 1/3 width */}
            <div className="bg-[#1e2028] rounded-xl border border-white/5 p-4">
              <h3 className="text-sm font-medium text-white mb-2">Vehicle Distribution</h3>
              <VehicleDistributionChart data={distribution} height={268} />
            </div>
          </div>

          {/* Hourly bar chart */}
          <div className="bg-[#1e2028] rounded-xl border border-white/5 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-white">Hourly Distribution</h3>
              <div className="flex items-center gap-3 text-[10px]">
                <div className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-sm bg-blue-500 opacity-60" />
                  <span className="text-gray-500">Normal</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-sm bg-amber-500 opacity-90" />
                  <span className="text-gray-500">Peak</span>
                </div>
              </div>
            </div>
            <HourlyDistributionChart data={flowData} height={160} />
          </div>

          {/* Recent events table */}
          <div className="bg-[#1e2028] rounded-xl border border-white/5 p-4">
            <h3 className="text-sm font-medium text-white mb-3">Recent Detections</h3>
            <TrafficEventTable events={events} pageSize={6} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default TrafficFlowTab;
