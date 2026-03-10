/**
 * Mock data for Event Configuration page
 * 
 * Production endpoints:
 *   GET  /api/event-rules         → list rules
 *   POST /api/event-rules         → create rule
 *   PUT  /api/event-rules/:id     → update rule
 *   DELETE /api/event-rules/:id   → delete rule
 * 
 * To switch to real data: replace these exports with fetch() calls.
 */

import { cameras } from './data';

export const eventModules = [
  { value: 'traffic', label: 'Traffic Monitoring' },
  { value: 'public_security', label: 'Public Security' },
  { value: 'anomaly', label: 'Anomaly Detection' },
  { value: 'tracking', label: 'Target Tracking' },
];

export const eventTypeOptions = {
  traffic: [
    { value: 'vehicle_count', label: 'Vehicle Counting' },
    { value: 'illegal_parking', label: 'Illegal Parking' },
    { value: 'wrong_way', label: 'Wrong Way Driving' },
    { value: 'speed_violation', label: 'Speed Violation' },
    { value: 'red_light', label: 'Red Light Violation' },
  ],
  public_security: [
    { value: 'intrusion', label: 'Intrusion Detection' },
    { value: 'loitering', label: 'Loitering' },
    { value: 'crowd', label: 'Crowd Detection' },
    { value: 'fight', label: 'Fight Detection' },
    { value: 'abandoned_object', label: 'Abandoned Object' },
  ],
  anomaly: [
    { value: 'fire', label: 'Fire/Smoke Detection' },
    { value: 'fall', label: 'Fall Detection' },
    { value: 'unusual_activity', label: 'Unusual Activity' },
  ],
  tracking: [
    { value: 'person_tracking', label: 'Person Tracking' },
    { value: 'vehicle_tracking', label: 'Vehicle Tracking' },
  ],
};

export const alertPriorities = [
  { value: 'low', label: 'Low', color: '#52c41a' },
  { value: 'medium', label: 'Medium', color: '#faad14' },
  { value: 'high', label: 'High', color: '#ff4d4f' },
  { value: 'critical', label: 'Critical', color: '#f5222d' },
];

export function generateEventRules() {
  return [
    {
      id: 'rule_001',
      name: 'Traffic Count - All Cameras',
      module: 'traffic',
      eventType: 'vehicle_count',
      enabled: true,
      cameras: cameras.slice(0, 5).map(c => c.id),
      priority: 'low',
      confidence: 0.6,
      schedule: { allDay: true },
      actions: { record: true, snapshot: true, alert: false, webhook: false },
      createdAt: '2025-12-01T10:00:00Z',
      updatedBy: 'admin',
    },
    {
      id: 'rule_002',
      name: 'Illegal Parking Detection',
      module: 'traffic',
      eventType: 'illegal_parking',
      enabled: true,
      cameras: cameras.slice(0, 8).map(c => c.id),
      priority: 'medium',
      confidence: 0.75,
      schedule: { allDay: false, from: '06:00', to: '22:00' },
      actions: { record: true, snapshot: true, alert: true, webhook: false },
      zone: { type: 'polygon', points: [[100,100],[400,100],[400,300],[100,300]] },
      createdAt: '2025-12-05T14:00:00Z',
      updatedBy: 'admin',
    },
    {
      id: 'rule_003',
      name: 'Intrusion - Restricted Areas',
      module: 'public_security',
      eventType: 'intrusion',
      enabled: true,
      cameras: ['cam_005', 'cam_010', 'cam_013'],
      priority: 'high',
      confidence: 0.8,
      schedule: { allDay: false, from: '22:00', to: '06:00' },
      actions: { record: true, snapshot: true, alert: true, webhook: true },
      zone: { type: 'polygon', points: [[50,50],[350,50],[350,250],[50,250]] },
      createdAt: '2025-12-10T09:00:00Z',
      updatedBy: 'admin',
    },
    {
      id: 'rule_004',
      name: 'Crowd Monitoring',
      module: 'public_security',
      eventType: 'crowd',
      enabled: true,
      cameras: ['cam_001', 'cam_003', 'cam_006'],
      priority: 'medium',
      confidence: 0.7,
      threshold: 20, // max people count
      schedule: { allDay: true },
      actions: { record: true, snapshot: true, alert: true, webhook: false },
      createdAt: '2025-12-15T11:00:00Z',
      updatedBy: 'operator1',
    },
    {
      id: 'rule_005',
      name: 'Fire & Smoke Detection',
      module: 'anomaly',
      eventType: 'fire',
      enabled: true,
      cameras: cameras.map(c => c.id), // all cameras
      priority: 'critical',
      confidence: 0.65,
      schedule: { allDay: true },
      actions: { record: true, snapshot: true, alert: true, webhook: true },
      createdAt: '2025-12-20T08:00:00Z',
      updatedBy: 'admin',
    },
    {
      id: 'rule_006',
      name: 'Loitering Alert',
      module: 'public_security',
      eventType: 'loitering',
      enabled: false,
      cameras: ['cam_001', 'cam_002', 'cam_005'],
      priority: 'low',
      confidence: 0.7,
      threshold: 180, // seconds
      schedule: { allDay: true },
      actions: { record: true, snapshot: true, alert: false, webhook: false },
      createdAt: '2026-01-05T16:00:00Z',
      updatedBy: 'operator1',
    },
    {
      id: 'rule_007',
      name: 'Person Tracking - VIP Area',
      module: 'tracking',
      eventType: 'person_tracking',
      enabled: false,
      cameras: ['cam_003', 'cam_004'],
      priority: 'medium',
      confidence: 0.85,
      schedule: { allDay: false, from: '08:00', to: '18:00' },
      actions: { record: true, snapshot: true, alert: false, webhook: false },
      createdAt: '2026-01-10T10:00:00Z',
      updatedBy: 'ai_dev',
    },
  ];
}
