import React, { useState, useMemo } from 'react';
import { Table, Tag, Button, Modal, Form, Input, Select, Badge, Space, Popconfirm, Descriptions, Card, Statistic } from 'antd';
import { UserPlus, Edit2, Trash2, Shield, Users, UserCheck, UserX, Key, Search } from 'lucide-react';
import { generateUsers, roles, permissions, rolePermissions } from '../mock/userData';

/**
 * User Management Page
 * 
 * User list with CRUD, role assignment, permission overview.
 * 
 * Production: Replace generateUsers() with fetch('/api/users')
 */
function UserManagement() {
  const [users, setUsers] = useState(() => generateUsers());
  const [editModal, setEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [permModal, setPermModal] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [form] = Form.useForm();

  const filtered = useMemo(() => {
    if (!searchText) return users;
    const q = searchText.toLowerCase();
    return users.filter(u =>
      u.username.toLowerCase().includes(q) ||
      u.fullName.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q)
    );
  }, [users, searchText]);

  const stats = useMemo(() => ({
    total: users.length,
    active: users.filter(u => u.status === 'active').length,
    inactive: users.filter(u => u.status === 'inactive').length,
    admins: users.filter(u => u.role === 'admin').length,
  }), [users]);

  const handleEdit = (user) => {
    setEditingUser(user);
    form.setFieldsValue(user);
    setEditModal(true);
  };

  const handleCreate = () => {
    setEditingUser(null);
    form.resetFields();
    form.setFieldsValue({ role: 'viewer', status: 'active' });
    setEditModal(true);
  };

  const handleSave = () => {
    form.validateFields().then(values => {
      if (editingUser) {
        setUsers(prev => prev.map(u => u.id === editingUser.id ? { ...u, ...values } : u));
      } else {
        setUsers(prev => [...prev, {
          id: `user_${String(prev.length + 1).padStart(3, '0')}`,
          ...values,
          lastLogin: null,
          createdAt: new Date().toISOString(),
          loginCount: 0,
        }]);
      }
      setEditModal(false);
    });
  };

  const handleDelete = (userId) => {
    setUsers(prev => prev.filter(u => u.id !== userId));
  };

  const roleColors = {
    admin: 'red',
    operator: 'blue',
    viewer: 'green',
    ai_engineer: 'purple',
  };

  const columns = [
    {
      title: 'User',
      key: 'user',
      width: 240,
      render: (_, r) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white text-sm font-bold">
            {r.fullName.charAt(0)}
          </div>
          <div>
            <div className="font-medium text-white">{r.fullName}</div>
            <div className="text-xs text-gray-500">@{r.username}</div>
          </div>
        </div>
      ),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      width: 180,
      render: (v) => <span className="text-gray-400 text-sm">{v}</span>,
    },
    {
      title: 'Role',
      dataIndex: 'role',
      width: 120,
      render: (v) => {
        const role = roles.find(r => r.value === v);
        return <Tag color={roleColors[v]}>{role?.label || v}</Tag>;
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      width: 90,
      render: (v) => (
        <Badge
          status={v === 'active' ? 'success' : 'default'}
          text={<span className={v === 'active' ? 'text-green-400' : 'text-gray-500'}>{v}</span>}
        />
      ),
    },
    {
      title: 'Last Login',
      dataIndex: 'lastLogin',
      width: 150,
      render: (v) => v ? (
        <span className="text-xs text-gray-400">
          {new Date(v).toLocaleString('vi-VN')}
        </span>
      ) : <span className="text-xs text-gray-600">Never</span>,
    },
    {
      title: 'Logins',
      dataIndex: 'loginCount',
      width: 70,
      render: (v) => <span className="text-gray-400">{v}</span>,
    },
    {
      title: '',
      key: 'actions',
      width: 120,
      render: (_, r) => (
        <Space size={4}>
          <Button
            type="text" size="small"
            icon={<Key size={14} />}
            onClick={() => setPermModal(r)}
            className="text-gray-400"
            title="Permissions"
          />
          <Button
            type="text" size="small"
            icon={<Edit2 size={14} />}
            onClick={() => handleEdit(r)}
            className="text-cyan-400"
          />
          <Popconfirm
            title="Delete this user?"
            onConfirm={() => handleDelete(r.id)}
            okText="Delete"
            okType="danger"
            disabled={r.role === 'admin' && stats.admins <= 1}
          >
            <Button
              type="text" size="small"
              icon={<Trash2 size={14} />}
              className="text-red-400"
              disabled={r.role === 'admin' && stats.admins <= 1}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="h-[calc(100vh-56px)] flex flex-col bg-[#111318] text-white p-4 gap-4 overflow-auto">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        <Card className="bg-[#1e2028] border-white/5">
          <Statistic
            title={<span className="text-gray-500">Total Users</span>}
            value={stats.total}
            prefix={<Users size={16} className="text-cyan-400" />}
            valueStyle={{ color: '#fff', fontSize: 24 }}
          />
        </Card>
        <Card className="bg-[#1e2028] border-white/5">
          <Statistic
            title={<span className="text-gray-500">Active</span>}
            value={stats.active}
            prefix={<UserCheck size={16} className="text-green-400" />}
            valueStyle={{ color: '#52c41a', fontSize: 24 }}
          />
        </Card>
        <Card className="bg-[#1e2028] border-white/5">
          <Statistic
            title={<span className="text-gray-500">Inactive</span>}
            value={stats.inactive}
            prefix={<UserX size={16} className="text-gray-500" />}
            valueStyle={{ color: '#666', fontSize: 24 }}
          />
        </Card>
        <Card className="bg-[#1e2028] border-white/5">
          <Statistic
            title={<span className="text-gray-500">Administrators</span>}
            value={stats.admins}
            prefix={<Shield size={16} className="text-red-400" />}
            valueStyle={{ color: '#ff4d4f', fontSize: 24 }}
          />
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <Input
          prefix={<Search size={14} className="text-gray-500" />}
          placeholder="Search users..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className="w-64"
          allowClear
        />
        <div className="ml-auto">
          <Button type="primary" icon={<UserPlus size={14} />} onClick={handleCreate}>
            Add User
          </Button>
        </div>
      </div>

      {/* Table */}
      <Table
        dataSource={filtered}
        columns={columns}
        rowKey="id"
        size="small"
        pagination={false}
      />

      {/* Edit/Create Modal */}
      <Modal
        title={editingUser ? 'Edit User' : 'Create User'}
        open={editModal}
        onOk={handleSave}
        onCancel={() => setEditModal(false)}
        okText="Save"
        width={500}
      >
        <Form form={form} layout="vertical" className="mt-4">
          <div className="grid grid-cols-2 gap-4">
            <Form.Item name="username" label="Username" rules={[{ required: true }]}>
              <Input disabled={!!editingUser} />
            </Form.Item>
            <Form.Item name="fullName" label="Full Name" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
          </div>
          <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
            <Input />
          </Form.Item>
          <div className="grid grid-cols-2 gap-4">
            <Form.Item name="role" label="Role" rules={[{ required: true }]}>
              <Select options={roles} />
            </Form.Item>
            <Form.Item name="status" label="Status">
              <Select options={[
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
              ]} />
            </Form.Item>
          </div>
          {!editingUser && (
            <Form.Item name="password" label="Password" rules={[{ required: true, min: 6 }]}>
              <Input.Password />
            </Form.Item>
          )}
        </Form>
      </Modal>

      {/* Permissions Modal */}
      <Modal
        title={`Permissions — ${permModal?.fullName}`}
        open={!!permModal}
        onCancel={() => setPermModal(null)}
        footer={null}
        width={500}
      >
        {permModal && (
          <div className="mt-2">
            <p className="text-sm text-gray-400 mb-3">
              Role: <Tag color={roleColors[permModal.role]}>
                {roles.find(r => r.value === permModal.role)?.label}
              </Tag>
            </p>
            <div className="grid grid-cols-2 gap-2">
              {permissions.map(p => {
                const has = rolePermissions[permModal.role]?.includes(p);
                return (
                  <div key={p} className={`p-2 rounded text-sm flex items-center gap-2 ${has ? 'bg-green-500/10 text-green-400' : 'bg-white/5 text-gray-600'}`}>
                    {has ? '✓' : '✗'}
                    {p.replace(/_/g, ' ')}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default UserManagement;
