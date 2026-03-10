/**
 * Mock data for User Management page
 * 
 * Production endpoints:
 *   GET  /api/users       → list users
 *   POST /api/users       → create user
 *   PUT  /api/users/:id   → update user
 *   DELETE /api/users/:id → delete user
 * 
 * To switch to real data: replace these exports with fetch() calls.
 */

export const roles = [
  { value: 'admin', label: 'Administrator', color: '#ff4d4f' },
  { value: 'operator', label: 'Operator', color: '#1890ff' },
  { value: 'viewer', label: 'Viewer', color: '#52c41a' },
  { value: 'ai_engineer', label: 'AI Engineer', color: '#722ed1' },
];

export const permissions = [
  'live_view', 'playback', 'export_video', 'manage_cameras',
  'manage_devices', 'manage_users', 'configure_events', 'view_analytics',
  'system_settings', 'ai_config',
];

export const rolePermissions = {
  admin: permissions, // all
  operator: ['live_view', 'playback', 'export_video', 'manage_cameras', 'view_analytics', 'configure_events'],
  viewer: ['live_view', 'playback', 'view_analytics'],
  ai_engineer: ['live_view', 'playback', 'view_analytics', 'ai_config', 'configure_events'],
};

export function generateUsers() {
  return [
    {
      id: 'user_001',
      username: 'admin',
      fullName: 'Nguyễn Văn Admin',
      email: 'admin@hanet.ai',
      role: 'admin',
      status: 'active',
      lastLogin: '2026-02-24T09:15:00Z',
      createdAt: '2025-01-15T08:00:00Z',
      loginCount: 342,
    },
    {
      id: 'user_002',
      username: 'operator1',
      fullName: 'Trần Thị Operator',
      email: 'operator1@hanet.ai',
      role: 'operator',
      status: 'active',
      lastLogin: '2026-02-24T08:30:00Z',
      createdAt: '2025-03-10T10:00:00Z',
      loginCount: 156,
    },
    {
      id: 'user_003',
      username: 'viewer1',
      fullName: 'Lê Minh Viewer',
      email: 'viewer1@hanet.ai',
      role: 'viewer',
      status: 'active',
      lastLogin: '2026-02-23T17:45:00Z',
      createdAt: '2025-06-20T14:00:00Z',
      loginCount: 89,
    },
    {
      id: 'user_004',
      username: 'ai_dev',
      fullName: 'Phạm Hoàng AI',
      email: 'ai.dev@hanet.ai',
      role: 'ai_engineer',
      status: 'active',
      lastLogin: '2026-02-24T10:00:00Z',
      createdAt: '2025-04-05T09:00:00Z',
      loginCount: 210,
    },
    {
      id: 'user_005',
      username: 'operator2',
      fullName: 'Võ Thanh Operator',
      email: 'operator2@hanet.ai',
      role: 'operator',
      status: 'inactive',
      lastLogin: '2026-01-15T12:00:00Z',
      createdAt: '2025-05-12T11:00:00Z',
      loginCount: 45,
    },
    {
      id: 'user_006',
      username: 'viewer2',
      fullName: 'Đặng Thùy Viewer',
      email: 'viewer2@hanet.ai',
      role: 'viewer',
      status: 'active',
      lastLogin: '2026-02-22T14:20:00Z',
      createdAt: '2025-08-01T09:00:00Z',
      loginCount: 67,
    },
  ];
}
