/**
 * MOCK DATA for Civil Intelligent Sensing System Demo
 * 
 * Camera data matches actual cameras from camera_config.py
 * These are used as FALLBACK when the backend API is not available.
 * When backend is running, LiveMonitor fetches from /api/cameras instead.
 */

// Camera data — 15 real cameras matching camera_config.py
export const cameras = [
  {
    id: 'cam_001',
    name: 'Cam 01',
    location: '192.168.1.133',
    ip: '192.168.1.133',
    status: 'online',
    rtspUrl: 'rtsp://admin:YDVFNP@192.168.1.133:554/ch1/sub',
    path_name: 'cam_001',
    resolution: '768x432',
    fps: 25,
    type: 'Fixed Dome',
    lastSeen: '2026-02-24T10:30:00Z'
  },
  {
    id: 'cam_002',
    name: 'Cam 02',
    location: '192.168.1.134',
    ip: '192.168.1.134',
    status: 'online',
    rtspUrl: 'rtsp://admin:TIJEQB@192.168.1.134:554/ch1/sub',
    path_name: 'cam_002',
    resolution: '768x432',
    fps: 25,
    type: 'Fixed Dome',
    lastSeen: '2026-02-24T10:30:00Z'
  },
  {
    id: 'cam_003',
    name: 'Cam 03',
    location: '192.168.1.138',
    ip: '192.168.1.138',
    status: 'online',
    rtspUrl: 'rtsp://admin:CYXJBA@192.168.1.138:554/ch1/sub',
    path_name: 'cam_003',
    resolution: '768x432',
    fps: 25,
    type: 'Fixed Dome',
    lastSeen: '2026-02-24T10:30:00Z'
  },
  {
    id: 'cam_004',
    name: 'Cam 04',
    location: '192.168.1.143',
    ip: '192.168.1.143',
    status: 'online',
    rtspUrl: 'rtsp://admin:EIUSAY@192.168.1.143:554/ch1/sub',
    path_name: 'cam_004',
    resolution: '768x432',
    fps: 25,
    type: 'Fixed Dome',
    lastSeen: '2026-02-24T10:30:00Z'
  },
  {
    id: 'cam_005',
    name: 'Cam 05',
    location: '192.168.1.146',
    ip: '192.168.1.146',
    status: 'online',
    rtspUrl: 'rtsp://admin:VZBRIC@192.168.1.146:554/ch1/sub',
    path_name: 'cam_005',
    resolution: '768x432',
    fps: 25,
    type: 'Fixed Dome',
    lastSeen: '2026-02-24T10:30:00Z'
  },
  {
    id: 'cam_006',
    name: 'Cam 06',
    location: '192.168.1.154',
    ip: '192.168.1.154',
    status: 'online',
    rtspUrl: 'rtsp://admin:XLRPZQ@192.168.1.154:554/ch1/sub',
    path_name: 'cam_006',
    resolution: '768x432',
    fps: 25,
    type: 'Fixed Dome',
    lastSeen: '2026-02-24T10:30:00Z'
  },
  {
    id: 'cam_007',
    name: 'Cam 07',
    location: '192.168.1.141',
    ip: '192.168.1.141',
    status: 'online',
    rtspUrl: 'rtsp://admin:YLXVJA@192.168.1.141:554/ch1/sub',
    path_name: 'cam_007',
    resolution: '768x432',
    fps: 25,
    type: 'Fixed Dome',
    lastSeen: '2026-02-24T10:30:00Z'
  },
  {
    id: 'cam_008',
    name: 'Cam 08',
    location: '192.168.1.174',
    ip: '192.168.1.174',
    status: 'online',
    rtspUrl: 'rtsp://admin:FWZLED@192.168.1.174:554/ch1/sub',
    path_name: 'cam_008',
    resolution: '768x432',
    fps: 25,
    type: 'Fixed Dome',
    lastSeen: '2026-02-24T10:30:00Z'
  },
  {
    id: 'cam_009',
    name: 'Cam 09',
    location: '192.168.1.135',
    ip: '192.168.1.135',
    status: 'online',
    rtspUrl: 'rtsp://admin:NWKGIC@192.168.1.135:554/ch1/sub',
    path_name: 'cam_009',
    resolution: '768x432',
    fps: 25,
    type: 'Fixed Dome',
    lastSeen: '2026-02-24T10:30:00Z'
  },
  {
    id: 'cam_010',
    name: 'Cam 10',
    location: '192.168.1.128',
    ip: '192.168.1.128',
    status: 'online',
    rtspUrl: 'rtsp://admin:WSLRQC@192.168.1.128:554/ch1/sub',
    path_name: 'cam_010',
    resolution: '768x432',
    fps: 25,
    type: 'Fixed Dome',
    lastSeen: '2026-02-24T10:30:00Z'
  },
  {
    id: 'cam_011',
    name: 'Cam 11',
    location: '192.168.1.132',
    ip: '192.168.1.132',
    status: 'online',
    rtspUrl: 'rtsp://admin:UAQHDA@192.168.1.132:554/ch1/sub',
    path_name: 'cam_011',
    resolution: '768x432',
    fps: 25,
    type: 'Fixed Dome',
    lastSeen: '2026-02-24T10:30:00Z'
  },
  {
    id: 'cam_012',
    name: 'Cam 12',
    location: '192.168.1.137',
    ip: '192.168.1.137',
    status: 'online',
    rtspUrl: 'rtsp://admin:NNFVAJ@192.168.1.137:554/ch1/sub',
    path_name: 'cam_012',
    resolution: '768x432',
    fps: 25,
    type: 'Fixed Dome',
    lastSeen: '2026-02-24T10:30:00Z'
  },
  {
    id: 'cam_013',
    name: 'Cam 13',
    location: '192.168.1.114',
    ip: '192.168.1.114',
    status: 'online',
    rtspUrl: 'rtsp://admin:IFPREC@192.168.1.114:554/ch1/sub',
    path_name: 'cam_013',
    resolution: '768x432',
    fps: 25,
    type: 'Fixed Dome',
    lastSeen: '2026-02-24T10:30:00Z'
  },
  {
    id: 'cam_014',
    name: 'Cam 14',
    location: '192.168.1.124',
    ip: '192.168.1.124',
    status: 'online',
    rtspUrl: 'rtsp://admin:DTAJVP@192.168.1.124:554/ch1/sub',
    path_name: 'cam_014',
    resolution: '768x432',
    fps: 25,
    type: 'Fixed Dome',
    lastSeen: '2026-02-24T10:30:00Z'
  },
  {
    id: 'cam_015',
    name: 'Cam 15',
    location: '192.168.1.127',
    ip: '192.168.1.127',
    status: 'online',
    rtspUrl: 'rtsp://admin:HLTHKD@192.168.1.127:554/ch1/sub',
    path_name: 'cam_015',
    resolution: '768x432',
    fps: 25,
    type: 'Fixed Dome',
    lastSeen: '2026-02-24T10:30:00Z'
  },
];

// Event types configuration
export const eventTypes = {
  person_detected: { label: 'Person Detected', color: '#52c41a', priority: 'low' },
  vehicle_detected: { label: 'Vehicle Detected', color: '#1890ff', priority: 'low' },
  loitering: { label: 'Loitering', color: '#faad14', priority: 'medium' },
  suspicious_activity: { label: 'Suspicious Activity', color: '#ff4d4f', priority: 'high' },
  crowd_detected: { label: 'Crowd Detected', color: '#722ed1', priority: 'medium' },
  unattended_object: { label: 'Unattended Object', color: '#eb2f96', priority: 'high' },
};

// Events data (detected events from AI models)
export const events = [
  {
    id: 'evt_001',
    cameraId: 'cam_001',
    cameraName: 'Main Entrance',
    type: 'person_detected',
    timestamp: '2026-02-11T10:25:30Z',
    confidence: 0.95,
    description: 'Person entering building',
    snapshotUrl: '/snapshots/evt_001.jpg',
    bbox: { x: 120, y: 80, width: 150, height: 320 },
    trackId: 'track_001'
  },
  {
    id: 'evt_002',
    cameraId: 'cam_002',
    cameraName: 'Parking Lot A',
    type: 'vehicle_detected',
    timestamp: '2026-02-11T10:20:15Z',
    confidence: 0.92,
    description: 'Vehicle entering parking area',
    snapshotUrl: '/snapshots/evt_002.jpg',
    bbox: { x: 200, y: 150, width: 280, height: 180 },
    trackId: 'track_002'
  },
  {
    id: 'evt_003',
    cameraId: 'cam_001',
    cameraName: 'Main Entrance',
    type: 'loitering',
    timestamp: '2026-02-11T10:15:45Z',
    confidence: 0.88,
    description: 'Person standing in same location for 3 minutes',
    snapshotUrl: '/snapshots/evt_003.jpg',
    bbox: { x: 180, y: 100, width: 140, height: 300 },
    trackId: 'track_003',
    alert: true
  },
  {
    id: 'evt_004',
    cameraId: 'cam_003',
    cameraName: 'Lobby Camera 1',
    type: 'suspicious_activity',
    timestamp: '2026-02-11T10:10:20Z',
    confidence: 0.82,
    description: 'Unusual behavior detected - person looking around nervously',
    snapshotUrl: '/snapshots/evt_004.jpg',
    bbox: { x: 300, y: 120, width: 160, height: 330 },
    trackId: 'track_004',
    alert: true
  },
  {
    id: 'evt_005',
    cameraId: 'cam_003',
    cameraName: 'Lobby Camera 1',
    type: 'crowd_detected',
    timestamp: '2026-02-11T09:45:00Z',
    confidence: 0.91,
    description: '15 people detected in lobby area',
    snapshotUrl: '/snapshots/evt_005.jpg',
    count: 15
  },
  {
    id: 'evt_006',
    cameraId: 'cam_005',
    cameraName: 'Emergency Exit',
    type: 'person_detected',
    timestamp: '2026-02-11T09:30:12Z',
    confidence: 0.94,
    description: 'Person near emergency exit',
    snapshotUrl: '/snapshots/evt_006.jpg',
    bbox: { x: 220, y: 90, width: 145, height: 310 },
    trackId: 'track_006'
  },
  {
    id: 'evt_007',
    cameraId: 'cam_002',
    cameraName: 'Parking Lot A',
    type: 'unattended_object',
    timestamp: '2026-02-11T09:15:30Z',
    confidence: 0.85,
    description: 'Unattended bag detected',
    snapshotUrl: '/snapshots/evt_007.jpg',
    bbox: { x: 350, y: 280, width: 80, height: 60 },
    alert: true
  },
];

// Alerts (high-priority events that need attention)
export const alerts = events
  .filter(event => event.alert)
  .map(event => ({
    ...event,
    priority: eventTypes[event.type]?.priority || 'medium',
    acknowledged: false,
    acknowledgedBy: null,
    acknowledgedAt: null,
  }));

// Dashboard statistics
export const stats = {
  totalCameras: cameras.length,
  onlineCameras: cameras.filter(c => c.status === 'online').length,
  offlineCameras: cameras.filter(c => c.status === 'offline').length,
  totalEvents: events.length,
  totalAlerts: alerts.length,
  eventsToday: events.filter(e => {
    const eventDate = new Date(e.timestamp);
    const today = new Date();
    return eventDate.toDateString() === today.toDateString();
  }).length,
};

// Chart data: Events over last 24 hours (hourly buckets)
export const eventsChartData = [
  { hour: '00:00', events: 2, alerts: 0 },
  { hour: '01:00', events: 1, alerts: 0 },
  { hour: '02:00', events: 0, alerts: 0 },
  { hour: '03:00', events: 1, alerts: 0 },
  { hour: '04:00', events: 0, alerts: 0 },
  { hour: '05:00', events: 3, alerts: 1 },
  { hour: '06:00', events: 5, alerts: 0 },
  { hour: '07:00', events: 8, alerts: 0 },
  { hour: '08:00', events: 12, alerts: 1 },
  { hour: '09:00', events: 15, alerts: 2 },
  { hour: '10:00', events: 7, alerts: 0 },
  { hour: '11:00', events: 4, alerts: 0 },
  { hour: '12:00', events: 6, alerts: 0 },
  { hour: '13:00', events: 9, alerts: 1 },
  { hour: '14:00', events: 11, alerts: 0 },
  { hour: '15:00', events: 10, alerts: 0 },
  { hour: '16:00', events: 13, alerts: 1 },
  { hour: '17:00', events: 16, alerts: 2 },
  { hour: '18:00', events: 14, alerts: 1 },
  { hour: '19:00', events: 8, alerts: 0 },
  { hour: '20:00', events: 5, alerts: 0 },
  { hour: '21:00', events: 3, alerts: 0 },
  { hour: '22:00', events: 2, alerts: 0 },
  { hour: '23:00', events: 1, alerts: 0 },
];

// System settings (for settings page later)
export const systemSettings = {
  alertThreshold: 0.85,
  retentionDays: 30,
  recordingEnabled: true,
  motionDetection: true,
  aiProcessing: true,
  notificationsEnabled: true,
};
