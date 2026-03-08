import React, { useState, useMemo, useCallback } from 'react';
import { Table, Tag, Badge, Segmented, Modal, Descriptions, Empty } from 'antd';
import { AlertTriangle, Clock, MapPin, CheckCircle2, XCircle } from 'lucide-react';
import CameraMapPanel from './CameraMapPanel';
import StatCard from './StatCard';

import {
  generateParkingViolations,
  getParkingStats,
  VIOLATION_LABELS,
} from '../../mock/trafficData';

/**
 * ParkingViolationTab - Illegal parking detection & monitoring
 * 
 * Layout:
 * ┌──────────────┬──────────────────────────────────────────┐
 * │  Camera      │  Stats Cards (4)                          │
 * │  Live Stream │────────────────────────────────────────────│
 * │  (with AI    │  Violation Table                          │
 * │   overlay)   │  (sortable, filterable, click → detail)   │
 * │              │                                            │
 * │              │                                            │
 * └──────────────┴──────────────────────────────────────────┘
 */

const VIOLATION_COLORS = {
  no_parking_zone: 'red',
  double_parking: 'orange',
  sidewalk_parking: 'volcano',
  fire_lane: 'magenta',
};

const STATUS_CONFIG = {
  confirmed: { color: 'red', icon: <XCircle size={12} />, label: 'Confirmed' },
  pending: { color: 'gold', icon: <Clock size={12} />, label: 'Pending' },
};

function ParkingViolationTab({ cameraId, camera, cameras, onCameraSelect, refreshKey }) {
  const [filter, setFilter] = useState('all');
  const [selectedViolation, setSelectedViolation] = useState(null);
  const [viewMode, setViewMode] = useState('overview'); // 'overview' | 'detail'

  const camCount = cameras.length || 6;

  const allViolations = useMemo(
    () => generateParkingViolations(25),
    [refreshKey]
  );

  // Overview: all violations, Detail: only selected camera's violations
  const violations = useMemo(() => {
    if (viewMode === 'overview') return allViolations;
    return allViolations.slice(0, 8).map(v => ({
      ...v,
      camera_id: cameraId,
      camera_name: camera?.name || cameraId,
    }));
  }, [allViolations, viewMode, cameraId, camera]);

  const parkingStats = useMemo(() => getParkingStats(violations), [violations]);

  const handleModeChange = useCallback((mode) => {
    setViewMode(mode === 'stream' ? 'detail' : 'overview');
  }, []);

  const filteredViolations = useMemo(() => {
    if (filter === 'all') return violations;
    return violations.filter(v => v.status === filter);
  }, [violations, filter]);

  const formatDuration = (seconds) => {
    if (seconds < 60) return `${seconds}s`;
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min}m ${sec}s`;
  };

  const columns = [
    {
      title: 'Time',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 90,
      sorter: (a, b) => new Date(a.timestamp) - new Date(b.timestamp),
      defaultSortOrder: 'descend',
      render: (ts) => {
        const d = new Date(ts);
        return (
          <div className="text-xs tabular-nums">
            <div className="text-gray-300">
              {d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
            <div className="text-gray-600 text-[10px]">
              {d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
            </div>
          </div>
        );
      },
    },
    {
      title: 'Camera',
      dataIndex: 'camera_name',
      key: 'camera_name',
      width: 80,
      render: (name) => <span className="text-xs text-gray-400">{name}</span>,
    },
    {
      title: 'Violation',
      dataIndex: 'violation_type',
      key: 'violation_type',
      width: 140,
      filters: Object.entries(VIOLATION_LABELS).map(([k, v]) => ({ text: v, value: k })),
      onFilter: (value, record) => record.violation_type === value,
      render: (type, record) => (
        <Tag color={VIOLATION_COLORS[type]} className="!text-xs">
          {record.violation_label}
        </Tag>
      ),
    },
    {
      title: 'Vehicle',
      dataIndex: 'vehicle_type',
      key: 'vehicle_type',
      width: 80,
      render: (type) => (
        <span className="text-xs text-gray-300 capitalize">{type === 'car' ? 'Ô tô' : 'Xe máy'}</span>
      ),
    },
    {
      title: 'Duration',
      dataIndex: 'duration_seconds',
      key: 'duration_seconds',
      width: 80,
      sorter: (a, b) => a.duration_seconds - b.duration_seconds,
      render: (sec) => (
        <span className={`text-xs tabular-nums ${sec > 300 ? 'text-red-400' : 'text-amber-400'}`}>
          {formatDuration(sec)}
        </span>
      ),
    },
    {
      title: 'Confidence',
      dataIndex: 'confidence',
      key: 'confidence',
      width: 90,
      sorter: (a, b) => a.confidence - b.confidence,
      render: (conf) => {
        const pct = (parseFloat(conf) * 100).toFixed(0);
        return (
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-amber-500"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-xs tabular-nums text-gray-400 w-8 text-right">{pct}%</span>
          </div>
        );
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => {
        const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
        return (
          <Tag color={cfg.color} icon={cfg.icon} className="!text-xs">
            {cfg.label}
          </Tag>
        );
      },
    },
  ];

  return (
    <div className="h-[calc(100vh-56px-48px-48px)] overflow-y-auto custom-scrollbar">
      <div className="flex gap-4 p-5">
        {/* ═══════════ LEFT: Camera Map ═══════════ */}
        <CameraMapPanel
          cameras={cameras}
          selectedCamera={cameraId}
          onCameraSelect={onCameraSelect}
          onModeChange={handleModeChange}
          detectionLabel="Parking Zone Detection Active"
        >
          {/* Detection zone config */}
          <div className="bg-[#1e2028] rounded-xl border border-white/5 p-4">
            <h4 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">
              Parking Detection Config
            </h4>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500">Detection Zones</span>
                <span className="text-amber-400">3 zones defined</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Min Duration</span>
                <span className="text-gray-300">30 seconds</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Model</span>
                <span className="text-gray-300">YOLOv8-Parking</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Confidence</span>
                <span className="text-gray-300">&ge; 0.6</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Auto-confirm</span>
                <span className="text-gray-300">After 2 min</span>
              </div>
            </div>
          </div>

          {/* Top violation camera */}
          {parkingStats.topCamera && (
            <div className="bg-[#1e2028] rounded-xl border border-red-500/20 p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle size={14} className="text-red-400" />
                <span className="text-xs font-medium text-red-400 uppercase tracking-wider">
                  Hotspot Camera
                </span>
              </div>
              <p className="text-sm text-white font-medium">{parkingStats.topCamera.name}</p>
              <p className="text-xs text-gray-500">{parkingStats.topCamera.count} violations detected</p>
            </div>
          )}
        </CameraMapPanel>

        {/* ═══════════ RIGHT: Analytics ═══════════ */}
        <div className="flex-1 flex flex-col gap-4 min-w-0">
          {/* Context header */}
          {viewMode === 'detail' ? (
            <div className="flex items-center gap-2 px-3 py-2 bg-cyan-500/5 rounded-lg border border-cyan-500/20">
              <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
              <span className="text-xs text-gray-400">Camera:</span>
              <span className="text-xs text-cyan-400 font-medium">{camera?.name || cameraId}</span>
              <span className="text-[10px] text-gray-600 ml-auto">← Back to map for all cameras</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-2 bg-white/[0.02] rounded-lg border border-white/5">
              <span className="text-xs text-gray-400">Monitoring</span>
              <span className="text-xs text-emerald-400 font-medium">{camCount} cameras</span>
            </div>
          )}

          {/* Stat Cards */}
          <div className="grid grid-cols-4 gap-3">
            <StatCard
              title="Total Violations"
              value={parkingStats.total}
              icon={<AlertTriangle size={16} />}
              color="red"
            />
            <StatCard
              title="Confirmed"
              value={parkingStats.confirmed}
              icon={<CheckCircle2 size={16} />}
              color="amber"
            />
            <StatCard
              title="Pending Review"
              value={parkingStats.pending}
              icon={<Clock size={16} />}
              color="blue"
            />
            <StatCard
              title={viewMode === 'overview' ? 'Cameras Monitoring' : 'Camera'}
              value={viewMode === 'overview' ? camCount : 1}
              icon={<MapPin size={16} />}
              color="green"
            />
          </div>

          {/* Violation Table */}
          <div className="bg-[#1e2028] rounded-xl border border-white/5 p-4 flex-1">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-white">Parking Violations</h3>
              <Segmented
                size="small"
                value={filter}
                onChange={setFilter}
                options={[
                  { label: `All (${violations.length})`, value: 'all' },
                  { label: `Confirmed (${parkingStats.confirmed})`, value: 'confirmed' },
                  { label: `Pending (${parkingStats.pending})`, value: 'pending' },
                ]}
                className="traffic-segmented"
              />
            </div>
            <Table
              dataSource={filteredViolations}
              columns={columns}
              rowKey="id"
              size="small"
              className="traffic-table"
              pagination={{
                pageSize: 8,
                size: 'small',
                showSizeChanger: false,
                showTotal: (total) => <span className="text-xs text-gray-500">{total} violations</span>,
              }}
              onRow={(record) => ({
                onClick: () => setSelectedViolation(record),
                className: 'cursor-pointer hover:!bg-white/5',
              })}
              scroll={{ x: 'max-content' }}
            />
          </div>
        </div>
      </div>

      {/* Violation Detail Modal */}
      <Modal
        open={!!selectedViolation}
        onCancel={() => setSelectedViolation(null)}
        footer={null}
        title={
          <span className="text-gray-200">
            Violation Detail — {selectedViolation?.id}
          </span>
        }
        width={600}
        className="traffic-modal"
      >
        {selectedViolation && (
          <div className="space-y-4">
            {/* Snapshot placeholder */}
            <div className="aspect-video bg-[#111318] rounded-lg flex items-center justify-center border border-white/5">
              {selectedViolation.snapshot_url ? (
                <img src={selectedViolation.snapshot_url} alt="Snapshot" className="w-full h-full object-contain" />
              ) : (
                <Empty
                  description={<span className="text-gray-500 text-xs">Snapshot will be captured by AI engine</span>}
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              )}
            </div>

            <Descriptions
              column={2}
              size="small"
              labelStyle={{ color: '#9ca3af', fontSize: 12 }}
              contentStyle={{ color: '#e5e7eb', fontSize: 12 }}
            >
              <Descriptions.Item label="Camera">{selectedViolation.camera_name}</Descriptions.Item>
              <Descriptions.Item label="Time">
                {new Date(selectedViolation.timestamp).toLocaleString('vi-VN')}
              </Descriptions.Item>
              <Descriptions.Item label="Violation">
                <Tag color={VIOLATION_COLORS[selectedViolation.violation_type]}>
                  {selectedViolation.violation_label}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Vehicle">
                {selectedViolation.vehicle_type === 'car' ? 'Ô tô' : 'Xe máy'}
              </Descriptions.Item>
              <Descriptions.Item label="Duration">
                {formatDurationFull(selectedViolation.duration_seconds)}
              </Descriptions.Item>
              <Descriptions.Item label="Confidence">
                {(parseFloat(selectedViolation.confidence) * 100).toFixed(0)}%
              </Descriptions.Item>
              <Descriptions.Item label="Status" span={2}>
                <Tag
                  color={STATUS_CONFIG[selectedViolation.status]?.color}
                  icon={STATUS_CONFIG[selectedViolation.status]?.icon}
                >
                  {STATUS_CONFIG[selectedViolation.status]?.label}
                </Tag>
              </Descriptions.Item>
            </Descriptions>
          </div>
        )}
      </Modal>
    </div>
  );
}

function formatDurationFull(seconds) {
  if (seconds < 60) return `${seconds} seconds`;
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  return `${min} min ${sec}s`;
}

export default ParkingViolationTab;
