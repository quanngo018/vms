import React from 'react';
import { Table, Tag } from 'antd';

/**
 * TrafficEventTable - Recent vehicle detection events
 * 
 * Props:
 *   events   - Array of traffic event objects
 *   pageSize - Rows per page
 */

const VEHICLE_COLORS = {
  car: { color: 'blue', label: 'Ô tô' },
  motorbike: { color: 'green', label: 'Xe máy' },
  bus: { color: 'orange', label: 'Xe buýt' },
  truck: { color: 'red', label: 'Xe tải' },
};

const columns = [
  {
    title: 'Time',
    dataIndex: 'timestamp',
    key: 'timestamp',
    width: 100,
    render: (ts) => {
      const d = new Date(ts);
      return (
        <span className="text-xs tabular-nums text-gray-300">
          {d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </span>
      );
    },
  },
  {
    title: 'Camera',
    dataIndex: 'camera_name',
    key: 'camera_name',
    width: 90,
    render: (name) => <span className="text-xs text-gray-400">{name}</span>,
  },
  {
    title: 'Vehicle',
    dataIndex: 'vehicle_type',
    key: 'vehicle_type',
    width: 100,
    filters: Object.entries(VEHICLE_COLORS).map(([k, v]) => ({ text: v.label, value: k })),
    onFilter: (value, record) => record.vehicle_type === value,
    render: (type) => {
      const config = VEHICLE_COLORS[type] || { color: 'default', label: type };
      return <Tag color={config.color} className="!text-xs">{config.label}</Tag>;
    },
  },
  {
    title: 'Direction',
    dataIndex: 'direction',
    key: 'direction',
    width: 110,
    render: (dir) => <span className="text-xs text-gray-400">{dir}</span>,
  },
  {
    title: 'Speed',
    dataIndex: 'speed_kmh',
    key: 'speed_kmh',
    width: 80,
    sorter: (a, b) => a.speed_kmh - b.speed_kmh,
    render: (speed) => (
      <span className={`text-xs tabular-nums ${speed > 50 ? 'text-amber-400' : 'text-gray-300'}`}>
        {speed} km/h
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
              className="h-full rounded-full bg-cyan-500"
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="text-xs tabular-nums text-gray-400 w-8 text-right">{pct}%</span>
        </div>
      );
    },
  },
];

function TrafficEventTable({ events = [], pageSize = 8 }) {
  return (
    <Table
      dataSource={events}
      columns={columns}
      rowKey="id"
      size="small"
      pagination={{
        pageSize,
        size: 'small',
        showSizeChanger: false,
        showTotal: (total) => <span className="text-xs text-gray-500">{total} events</span>,
      }}
      className="traffic-table"
      scroll={{ x: 'max-content' }}
    />
  );
}

export default TrafficEventTable;
