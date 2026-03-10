/**
 * Mock data for Device Manager & Device Configuration pages
 * 
 * Production endpoints:
 *   GET /api/devices         → list all devices
 *   GET /api/devices/:id     → device detail
 *   PUT /api/devices/:id     → update config
 *   DELETE /api/devices/:id  → remove device
 * 
 * To switch to real data: replace these exports with fetch() calls.
 */

import { cameras } from './data';

// ─── Device types ───
export const deviceTypes = [
  { value: 'ip_camera', label: 'IP Camera' },
  { value: 'nvr', label: 'NVR' },
  { value: 'jetson', label: 'Jetson Orin' },
  { value: 'server', label: 'Server' },
  { value: 'switch', label: 'Network Switch' },
];

// ─── Generate devices from existing cameras + extra infra ───
export function generateDevices() {
  const cameraDevices = cameras.map((cam, i) => ({
    id: cam.id,
    name: cam.name,
    type: 'ip_camera',
    ip: cam.ip,
    status: cam.status,
    model: 'Hanet HA-2000',
    firmware: '3.2.' + (10 + i),
    location: `Zone ${String.fromCharCode(65 + (i % 5))}`,
    uptime: Math.floor(Math.random() * 720) + 24, // hours
    lastSeen: cam.lastSeen,
    metrics: {
      cpu: Math.round(15 + Math.random() * 40),
      memory: Math.round(30 + Math.random() * 35),
      temperature: Math.round(35 + Math.random() * 20),
      bandwidth: Math.round(2 + Math.random() * 8), // Mbps
    },
    config: {
      resolution: cam.resolution || '768x432',
      fps: cam.fps || 25,
      codec: 'H.264',
      bitrate: 2048,
      protocol: 'RTSP',
      recording: true,
      motionDetection: i % 3 !== 0,
    },
  }));

  const infraDevices = [
    {
      id: 'nvr_001',
      name: 'NVR-Main',
      type: 'nvr',
      ip: '192.168.1.200',
      status: 'online',
      model: 'Hikvision DS-7616NI',
      firmware: '4.62.000',
      location: 'Server Room',
      uptime: 2160,
      lastSeen: new Date().toISOString(),
      metrics: { cpu: 45, memory: 62, temperature: 42, bandwidth: 85 },
      config: { channels: 16, storage: '8TB', raidType: 'RAID5', recording: true },
    },
    {
      id: 'jetson_001',
      name: 'Jetson-AI-01',
      type: 'jetson',
      ip: '192.168.1.210',
      status: 'online',
      model: 'NVIDIA Jetson Orin NX',
      firmware: 'JetPack 6.0',
      location: 'Server Room',
      uptime: 720,
      lastSeen: new Date().toISOString(),
      metrics: { cpu: 68, memory: 74, temperature: 55, bandwidth: 12, gpu: 82 },
      config: { pipelines: 8, decoders: 4, inferenceEngine: 'DeepStream 7.0' },
    },
    {
      id: 'server_001',
      name: 'Backend Server',
      type: 'server',
      ip: '192.168.1.100',
      status: 'online',
      model: 'Dell PowerEdge R740',
      firmware: 'BIOS 2.18.1',
      location: 'Server Room',
      uptime: 4320,
      lastSeen: new Date().toISOString(),
      metrics: { cpu: 38, memory: 55, temperature: 38, bandwidth: 45 },
      config: { os: 'Ubuntu 22.04', ram: '64GB', storage: '2TB SSD' },
    },
    {
      id: 'switch_001',
      name: 'PoE Switch',
      type: 'switch',
      ip: '192.168.1.1',
      status: 'online',
      model: 'Cisco SG350-28P',
      firmware: '2.5.9.15',
      location: 'Server Room',
      uptime: 8640,
      lastSeen: new Date().toISOString(),
      metrics: { cpu: 12, memory: 28, temperature: 32, bandwidth: 120 },
      config: { ports: 28, poeTotal: '195W', poeBudget: '382W' },
    },
  ];

  return [...cameraDevices, ...infraDevices];
}

// ─── Device status summary ───
export function getDeviceStats(devices) {
  const online = devices.filter(d => d.status === 'online').length;
  const offline = devices.filter(d => d.status === 'offline').length;
  const warning = devices.filter(d => d.metrics?.temperature > 50).length;
  const byType = deviceTypes.map(t => ({
    type: t.label,
    count: devices.filter(d => d.type === t.value).length,
  }));

  return { total: devices.length, online, offline, warning, byType };
}
