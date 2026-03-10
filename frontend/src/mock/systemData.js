/**
 * Mock data for System Configuration page
 * 
 * Production endpoints:
 *   GET  /api/system/config   → get all settings
 *   PUT  /api/system/config   → update settings
 *   GET  /api/system/status   → health check
 * 
 * To switch to real data: replace these exports with fetch() calls.
 */

export function getSystemConfig() {
  return {
    general: {
      systemName: 'Civil Intelligent Sensing System',
      language: 'vi',
      timezone: 'Asia/Ho_Chi_Minh',
      dateFormat: 'DD/MM/YYYY',
      autoLogout: 30, // minutes
    },
    storage: {
      primaryPath: '/mnt/storage/recordings',
      backupPath: '/mnt/backup/recordings',
      totalSpace: 8000, // GB
      usedSpace: 3420, // GB
      retentionDays: 30,
      overwriteOldest: true,
      recordingFormat: 'mp4',
    },
    recording: {
      defaultResolution: '1920x1080',
      defaultFps: 25,
      defaultCodec: 'H.264',
      defaultBitrate: 4096,
      preRecordSeconds: 5,
      postRecordSeconds: 10,
      scheduleEnabled: true,
      continuousRecording: true,
    },
    network: {
      serverIp: '192.168.1.100',
      serverPort: 8000,
      mediaServerIp: '192.168.1.100',
      mediaServerPort: 8554,
      maxBandwidth: 1000, // Mbps
      rtspTimeout: 10, // seconds
    },
    ai: {
      enabled: true,
      processingMode: 'edge', // 'edge' | 'cloud' | 'hybrid'
      maxConcurrentStreams: 8,
      inferenceDevice: 'Jetson Orin NX',
      modelUpdateInterval: 24, // hours
      confidenceThreshold: 0.6,
      modules: {
        traffic: true,
        publicSecurity: true,
        targetTracking: false,
        anomalyDetection: true,
      },
    },
    alerts: {
      emailEnabled: true,
      emailRecipients: 'admin@hanet.ai, security@hanet.ai',
      smtpServer: 'smtp.hanet.ai',
      smtpPort: 587,
      webhookEnabled: false,
      webhookUrl: '',
      soundEnabled: true,
      popupEnabled: true,
    },
    maintenance: {
      autoRestart: true,
      restartTime: '03:00',
      logRetentionDays: 90,
      backupSchedule: 'daily',
      lastBackup: '2026-02-24T03:00:00Z',
      systemVersion: '1.0.0-beta',
      lastUpdate: '2026-02-20T10:00:00Z',
    },
  };
}

export function getSystemStatus() {
  return {
    uptime: '15d 8h 32m',
    cpuUsage: 38,
    memoryUsage: 55,
    diskUsage: 42.8,
    networkIn: 245, // Mbps
    networkOut: 180,
    activeStreams: 12,
    aiPipelines: 8,
    connectedClients: 3,
    services: [
      { name: 'Backend API', status: 'running', port: 8000 },
      { name: 'MediaMTX', status: 'running', port: 8554 },
      { name: 'DeepStream', status: 'running', port: 8555 },
      { name: 'PostgreSQL', status: 'running', port: 5432 },
      { name: 'Redis', status: 'running', port: 6379 },
      { name: 'Nginx', status: 'running', port: 443 },
    ],
  };
}

// ─── System logs (for Log page) ───
export function generateSystemLogs(count = 50) {
  const levels = ['info', 'warning', 'error', 'debug'];
  const sources = ['Backend', 'MediaMTX', 'DeepStream', 'Frontend', 'Database', 'AI Engine'];
  const messages = {
    info: [
      'Camera cam_001 connected successfully',
      'Recording started for cam_003',
      'AI pipeline initialized with 8 streams',
      'User admin logged in',
      'System backup completed successfully',
      'Model weights updated to v2.3',
    ],
    warning: [
      'Camera cam_005 high latency detected (>500ms)',
      'Storage usage above 80% threshold',
      'AI inference queue backlog: 15 frames',
      'NVR recording disk nearly full',
      'Network bandwidth utilization at 85%',
    ],
    error: [
      'Camera cam_012 connection lost',
      'Failed to write recording chunk: disk I/O error',
      'DeepStream pipeline crash — auto-restarting',
      'Database connection pool exhausted',
      'RTSP stream timeout for cam_008',
    ],
    debug: [
      'Frame processed in 12ms (cam_001)',
      'WebSocket client connected: 192.168.1.50',
      'Cache hit for detection model config',
      'GC cycle completed: freed 128MB',
    ],
  };

  const logs = [];
  const now = Date.now();
  for (let i = 0; i < count; i++) {
    const level = levels[Math.floor(Math.random() * levels.length)];
    const msgs = messages[level];
    logs.push({
      id: `log_${String(i + 1).padStart(4, '0')}`,
      timestamp: new Date(now - i * 60000 * (1 + Math.random() * 5)).toISOString(),
      level,
      source: sources[Math.floor(Math.random() * sources.length)],
      message: msgs[Math.floor(Math.random() * msgs.length)],
    });
  }
  return logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}
