import React, { useState, useMemo } from 'react';
import { Table, Tag, Select, Input, Button, Progress, Card, Statistic, Badge, Tooltip, Modal, Descriptions } from 'antd';
import { Server, Wifi, WifiOff, HardDrive, RefreshCw, Plus, Search, Eye } from 'lucide-react';
import { generateDevices, getDeviceStats, deviceTypes } from '../mock/deviceData';

/**
 * Device Manager Page
 * 
 * Shows all network devices: cameras, NVR, Jetson, servers, switches.
 * Stats row + filterable table + detail modal.
 * 
 * Production: Replace generateDevices() with fetch('/api/devices')
 */
function DeviceManager() {
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchText, setSearchText] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [detailDevice, setDetailDevice] = useState(null);

  const devices = useMemo(() => generateDevices(), [refreshKey]);

  const filtered = useMemo(() => {
    return devices.filter(d => {
      if (filterType !== 'all' && d.type !== filterType) return false;
      if (filterStatus !== 'all' && d.status !== filterStatus) return false;
      if (searchText) {
        const q = searchText.toLowerCase();
        return d.name.toLowerCase().includes(q) || d.ip.toLowerCase().includes(q) || d.model.toLowerCase().includes(q);
      }
      return true;
    });
  }, [devices, filterType, filterStatus, searchText]);

  const stats = useMemo(() => getDeviceStats(devices), [devices]);

  const typeIcons = {
    ip_camera: '📷',
    nvr: '💾',
    jetson: '🧠',
    server: '🖥️',
    switch: '🔗',
  };

  const columns = [
    {
      title: 'Device',
      key: 'device',
      width: 220,
      render: (_, r) => (
        <div className="flex items-center gap-2">
          <span className="text-lg">{typeIcons[r.type] || '📦'}</span>
          <div>
            <div className="font-medium text-white">{r.name}</div>
            <div className="text-xs text-gray-500">{r.model}</div>
          </div>
        </div>
      ),
    },
    {
      title: 'IP',
      dataIndex: 'ip',
      width: 140,
      render: (v) => <span className="font-mono text-xs text-gray-400">{v}</span>,
    },
    {
      title: 'Type',
      dataIndex: 'type',
      width: 110,
      render: (v) => {
        const t = deviceTypes.find(dt => dt.value === v);
        return <Tag>{t?.label || v}</Tag>;
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      width: 90,
      render: (v) => (
        <Badge
          status={v === 'online' ? 'success' : 'error'}
          text={<span className={v === 'online' ? 'text-green-400' : 'text-red-400'}>{v}</span>}
        />
      ),
    },
    {
      title: '',
      key: 'actions',
      width: 50,
      render: (_, r) => (
        <Button
          type="text"
          size="small"
          icon={<Eye size={14} />}
          onClick={() => setDetailDevice(r)}
          className="text-cyan-400"
        />
      ),
    },
  ];

  return (
    <div className="h-[calc(100vh-56px)] flex flex-col bg-[#111318] text-white p-4 gap-4 overflow-auto">
      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <Card className="bg-[#1e2028] border-white/5">
          <Statistic
            title={<span className="text-gray-500">Total Devices</span>}
            value={stats.total}
            prefix={<Server size={16} className="text-cyan-400" />}
            valueStyle={{ color: '#fff', fontSize: 24 }}
          />
        </Card>
        <Card className="bg-[#1e2028] border-white/5">
          <Statistic
            title={<span className="text-gray-500">Online</span>}
            value={stats.online}
            prefix={<Wifi size={16} className="text-green-400" />}
            valueStyle={{ color: '#52c41a', fontSize: 24 }}
          />
        </Card>
        <Card className="bg-[#1e2028] border-white/5">
          <Statistic
            title={<span className="text-gray-500">Offline</span>}
            value={stats.offline}
            prefix={<WifiOff size={16} className="text-red-400" />}
            valueStyle={{ color: '#ff4d4f', fontSize: 24 }}
          />
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <Input
          prefix={<Search size={14} className="text-gray-500" />}
          placeholder="Search name, IP, model..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className="w-64"
          allowClear
        />
        <Select
          value={filterType}
          onChange={setFilterType}
          className="w-40"
          options={[{ value: 'all', label: 'All Types' }, ...deviceTypes]}
        />
        <Select
          value={filterStatus}
          onChange={setFilterStatus}
          className="w-36"
          options={[
            { value: 'all', label: 'All Status' },
            { value: 'online', label: 'Online' },
            { value: 'offline', label: 'Offline' },
          ]}
        />
        <div className="ml-auto flex gap-2">
          <Button icon={<RefreshCw size={14} />} onClick={() => setRefreshKey(k => k + 1)}>
            Refresh
          </Button>
          <Button type="primary" icon={<Plus size={14} />}>
            Add Device
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 min-h-0">
        <Table
          dataSource={filtered}
          columns={columns}
          rowKey="id"
          size="small"
          pagination={{ pageSize: 15, showTotal: (t) => `${t} devices` }}
          scroll={{ y: 'calc(100vh - 340px)' }}
          className="device-table"
        />
      </div>

      {/* Detail Modal */}
      <Modal
        title={detailDevice?.name}
        open={!!detailDevice}
        onCancel={() => setDetailDevice(null)}
        footer={null}
        width={600}
      >
        {detailDevice && (
          <Descriptions bordered column={2} size="small">
            <Descriptions.Item label="Type">
              {deviceTypes.find(t => t.value === detailDevice.type)?.label}
            </Descriptions.Item>
            <Descriptions.Item label="Status">
              <Badge status={detailDevice.status === 'online' ? 'success' : 'error'} text={detailDevice.status} />
            </Descriptions.Item>
            <Descriptions.Item label="IP">{detailDevice.ip}</Descriptions.Item>
            <Descriptions.Item label="Model">{detailDevice.model}</Descriptions.Item>
            <Descriptions.Item label="Firmware">{detailDevice.firmware}</Descriptions.Item>
            <Descriptions.Item label="Location">{detailDevice.location}</Descriptions.Item>
            <Descriptions.Item label="Bandwidth">{detailDevice.metrics?.bandwidth} Mbps</Descriptions.Item>
            <Descriptions.Item label="Uptime">
              {Math.floor(detailDevice.uptime / 24)}d {detailDevice.uptime % 24}h
            </Descriptions.Item>
            <Descriptions.Item label="Configuration" span={2}>
              <pre className="text-xs m-0 whitespace-pre-wrap">
                {JSON.stringify(detailDevice.config, null, 2)}
              </pre>
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
}

export default DeviceManager;
