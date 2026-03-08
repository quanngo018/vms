/**
 * Mock data for Intelligent Traffic module
 * 
 * This data simulates AI detection results.
 * In production, these come from:
 *   - GET /api/traffic/stats?camera_id=&from=&to=
 *   - GET /api/traffic/events?camera_id=&type=&limit=
 *   - GET /api/traffic/flow?camera_id=&interval=5m
 * 
 * AI team will implement the backend endpoints.
 * Frontend consumes this structure regardless of source.
 */

// ─── Hourly vehicle count data (line chart) ───
export function generateHourlyFlow(hours = 24, scale = 1) {
  const data = [];
  const now = new Date();
  for (let i = hours - 1; i >= 0; i--) {
    const time = new Date(now);
    time.setHours(now.getHours() - i, 0, 0, 0);
    const hour = time.getHours();

    // Simulate realistic traffic patterns
    const isRush = (hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19);
    const isNight = hour >= 22 || hour <= 5;
    const baseCar = isNight ? 5 : isRush ? 85 : 35;
    const baseMoto = isNight ? 8 : isRush ? 120 : 50;

    data.push({
      time: `${String(hour).padStart(2, '0')}:00`,
      timestamp: time.toISOString(),
      car: Math.round((baseCar + Math.floor(Math.random() * 20)) * scale),
      motorbike: Math.round((baseMoto + Math.floor(Math.random() * 30)) * scale),
      bus: Math.round(Math.floor(Math.random() * (isRush ? 12 : 4)) * scale),
      truck: Math.round(Math.floor(Math.random() * (isNight ? 8 : 5)) * scale),
    });
  }
  return data;
}

// ─── 5-minute interval data (real-time chart) ───
export function generateRealtimeFlow(intervals = 12, scale = 1) {
  const data = [];
  const now = new Date();
  for (let i = intervals - 1; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 5 * 60 * 1000);
    data.push({
      time: time.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      timestamp: time.toISOString(),
      car: Math.round((8 + Math.floor(Math.random() * 15)) * scale),
      motorbike: Math.round((12 + Math.floor(Math.random() * 20)) * scale),
      bus: Math.round(Math.floor(Math.random() * 3) * scale),
      truck: Math.round(Math.floor(Math.random() * 2) * scale),
    });
  }
  return data;
}

// ─── Vehicle type distribution (pie chart) ───
export function getVehicleDistribution(flowData) {
  const totals = flowData.reduce(
    (acc, d) => ({
      car: acc.car + d.car,
      motorbike: acc.motorbike + d.motorbike,
      bus: acc.bus + d.bus,
      truck: acc.truck + d.truck,
    }),
    { car: 0, motorbike: 0, bus: 0, truck: 0 }
  );

  return [
    { name: 'Ô tô', value: totals.car, color: '#3b82f6' },
    { name: 'Xe máy', value: totals.motorbike, color: '#10b981' },
    { name: 'Xe buýt', value: totals.bus, color: '#f59e0b' },
    { name: 'Xe tải', value: totals.truck, color: '#ef4444' },
  ];
}

// ─── Summary stats ───
export function getTrafficStats(flowData) {
  const totals = flowData.reduce(
    (acc, d) => ({
      car: acc.car + d.car,
      motorbike: acc.motorbike + d.motorbike,
      bus: acc.bus + d.bus,
      truck: acc.truck + d.truck,
    }),
    { car: 0, motorbike: 0, bus: 0, truck: 0 }
  );

  const total = totals.car + totals.motorbike + totals.bus + totals.truck;
  const prevTotal = Math.floor(total * (0.85 + Math.random() * 0.3)); // simulated previous period
  const changePercent = total > 0 ? (((total - prevTotal) / prevTotal) * 100).toFixed(1) : 0;

  return {
    total,
    car: totals.car,
    motorbike: totals.motorbike,
    bus: totals.bus,
    truck: totals.truck,
    changePercent: Number(changePercent),
  };
}

// ─── Illegal parking events ───
const VIOLATION_TYPES = ['no_parking_zone', 'double_parking', 'sidewalk_parking', 'fire_lane'];
const VIOLATION_LABELS = {
  no_parking_zone: 'Đỗ vùng cấm',
  double_parking: 'Đỗ chồng',
  sidewalk_parking: 'Đỗ trên vỉa hè',
  fire_lane: 'Đỗ làn cứu hỏa',
};

export function generateParkingViolations(count = 20) {
  const events = [];
  const now = Date.now();
  for (let i = 0; i < count; i++) {
    const type = VIOLATION_TYPES[Math.floor(Math.random() * VIOLATION_TYPES.length)];
    const cameraIdx = Math.floor(Math.random() * 6) + 1;
    events.push({
      id: `viol_${String(i + 1).padStart(4, '0')}`,
      timestamp: new Date(now - i * 180000 - Math.random() * 60000).toISOString(),
      camera_id: `cam_${String(cameraIdx).padStart(3, '0')}`,
      camera_name: `Cam ${String(cameraIdx).padStart(2, '0')}`,
      violation_type: type,
      violation_label: VIOLATION_LABELS[type],
      vehicle_type: Math.random() > 0.4 ? 'car' : 'motorbike',
      confidence: (0.75 + Math.random() * 0.24).toFixed(2),
      duration_seconds: Math.floor(30 + Math.random() * 570), // 30s - 10min
      snapshot_url: null, // AI team will provide
      status: Math.random() > 0.3 ? 'confirmed' : 'pending',
    });
  }
  return events.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

// ─── Traffic events (recent detections table) ───
export function generateTrafficEvents(count = 30) {
  const events = [];
  const now = Date.now();
  const vehicleTypes = ['car', 'motorbike', 'bus', 'truck'];
  const directions = ['Bắc → Nam', 'Nam → Bắc', 'Đông → Tây', 'Tây → Đông'];

  for (let i = 0; i < count; i++) {
    const cameraIdx = Math.floor(Math.random() * 6) + 1;
    events.push({
      id: `evt_${String(i + 1).padStart(4, '0')}`,
      timestamp: new Date(now - i * 12000 - Math.random() * 5000).toISOString(),
      camera_id: `cam_${String(cameraIdx).padStart(3, '0')}`,
      camera_name: `Cam ${String(cameraIdx).padStart(2, '0')}`,
      vehicle_type: vehicleTypes[Math.floor(Math.random() * vehicleTypes.length)],
      direction: directions[Math.floor(Math.random() * directions.length)],
      speed_kmh: Math.floor(15 + Math.random() * 50),
      confidence: (0.8 + Math.random() * 0.19).toFixed(2),
    });
  }
  return events.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

// ─── Parking violation summary for dashboard ───
export function getParkingStats(violations) {
  const total = violations.length;
  const confirmed = violations.filter(v => v.status === 'confirmed').length;
  const byCam = {};
  violations.forEach(v => {
    byCam[v.camera_name] = (byCam[v.camera_name] || 0) + 1;
  });
  const topCamera = Object.entries(byCam).sort((a, b) => b[1] - a[1])[0];

  return {
    total,
    confirmed,
    pending: total - confirmed,
    topCamera: topCamera ? { name: topCamera[0], count: topCamera[1] } : null,
  };
}

export { VIOLATION_LABELS };
