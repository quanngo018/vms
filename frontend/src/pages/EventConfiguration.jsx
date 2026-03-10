import React, { useState, useMemo } from 'react';
import { Table, Tag, Switch, Button, Select, Modal, Form, Input, Slider, TimePicker, Checkbox, Space, Badge, Popconfirm } from 'antd';
import { Plus, Edit2, Trash2, RefreshCw, Shield, Camera, Clock } from 'lucide-react';
import { generateEventRules, eventModules, eventTypeOptions, alertPriorities } from '../mock/eventConfigData';
import { cameras } from '../mock/data';

import dayjs from 'dayjs';

/**
 * Event Configuration Page
 * 
 * Configure AI detection rules: which events, which cameras,
 * thresholds, schedules, and alert actions.
 * 
 * Production: Replace mock with fetch('/api/event-rules')
 */
function EventConfiguration() {
  const [rules, setRules] = useState(() => generateEventRules());
  const [filterModule, setFilterModule] = useState('all');
  const [editModal, setEditModal] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [form] = Form.useForm();

  const selectedModule = Form.useWatch('module', form);

  const filtered = useMemo(() => {
    if (filterModule === 'all') return rules;
    return rules.filter(r => r.module === filterModule);
  }, [rules, filterModule]);

  const handleToggle = (ruleId, checked) => {
    setRules(prev => prev.map(r => r.id === ruleId ? { ...r, enabled: checked } : r));
  };

  const handleEdit = (rule) => {
    setEditingRule(rule);
    form.setFieldsValue({
      ...rule,
      schedule_from: rule.schedule?.from ? dayjs(rule.schedule.from, 'HH:mm') : null,
      schedule_to: rule.schedule?.to ? dayjs(rule.schedule.to, 'HH:mm') : null,
      allDay: rule.schedule?.allDay ?? true,
      action_record: rule.actions?.record,
      action_snapshot: rule.actions?.snapshot,
      action_alert: rule.actions?.alert,
      action_webhook: rule.actions?.webhook,
    });
    setEditModal(true);
  };

  const handleCreate = () => {
    setEditingRule(null);
    form.resetFields();
    form.setFieldsValue({
      enabled: true,
      module: 'traffic',
      confidence: 0.7,
      priority: 'medium',
      allDay: true,
      action_record: true,
      action_snapshot: true,
      action_alert: false,
      action_webhook: false,
    });
    setEditModal(true);
  };

  const handleSave = () => {
    form.validateFields().then(values => {
      const ruleData = {
        id: editingRule?.id || `rule_${String(rules.length + 1).padStart(3, '0')}`,
        name: values.name,
        module: values.module,
        eventType: values.eventType,
        enabled: values.enabled,
        cameras: values.cameras || [],
        priority: values.priority,
        confidence: values.confidence,
        schedule: {
          allDay: values.allDay,
          from: values.allDay ? undefined : values.schedule_from?.format('HH:mm'),
          to: values.allDay ? undefined : values.schedule_to?.format('HH:mm'),
        },
        actions: {
          record: values.action_record,
          snapshot: values.action_snapshot,
          alert: values.action_alert,
          webhook: values.action_webhook,
        },
        createdAt: editingRule?.createdAt || new Date().toISOString(),
        updatedBy: 'admin',
      };

      if (editingRule) {
        setRules(prev => prev.map(r => r.id === ruleData.id ? ruleData : r));
      } else {
        setRules(prev => [...prev, ruleData]);
      }
      setEditModal(false);
    });
  };

  const handleDelete = (ruleId) => {
    setRules(prev => prev.filter(r => r.id !== ruleId));
  };

  const priorityColors = { low: 'green', medium: 'gold', high: 'orange', critical: 'red' };

  const columns = [
    {
      title: 'Enabled',
      dataIndex: 'enabled',
      width: 70,
      render: (v, r) => <Switch size="small" checked={v} onChange={(c) => handleToggle(r.id, c)} />,
    },
    {
      title: 'Rule Name',
      dataIndex: 'name',
      width: 220,
      render: (v, r) => (
        <div>
          <div className={`font-medium ${r.enabled ? 'text-white' : 'text-gray-500'}`}>{v}</div>
          <div className="text-xs text-gray-600">
            {eventModules.find(m => m.value === r.module)?.label}
          </div>
        </div>
      ),
    },
    {
      title: 'Event Type',
      dataIndex: 'eventType',
      width: 140,
      render: (v, r) => {
        const opts = eventTypeOptions[r.module] || [];
        const label = opts.find(o => o.value === v)?.label || v;
        return <Tag>{label}</Tag>;
      },
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      width: 90,
      render: (v) => <Tag color={priorityColors[v]}>{v.toUpperCase()}</Tag>,
    },
    {
      title: 'Cameras',
      dataIndex: 'cameras',
      width: 100,
      render: (v) => (
        <span className="text-gray-400">
          <Camera size={12} className="inline mr-1" />
          {v?.length || 0} cameras
        </span>
      ),
    },
    {
      title: 'Confidence',
      dataIndex: 'confidence',
      width: 90,
      render: (v) => <span className="text-cyan-400 font-mono">{(v * 100).toFixed(0)}%</span>,
    },
    {
      title: 'Schedule',
      key: 'schedule',
      width: 120,
      render: (_, r) => (
        <span className="text-xs text-gray-400">
          <Clock size={10} className="inline mr-1" />
          {r.schedule?.allDay ? '24/7' : `${r.schedule?.from} - ${r.schedule?.to}`}
        </span>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_, r) => (
        <Space size={0}>
          {r.actions?.record && <Tag className="text-xs">REC</Tag>}
          {r.actions?.alert && <Tag color="orange" className="text-xs">ALERT</Tag>}
          {r.actions?.webhook && <Tag color="purple" className="text-xs">HOOK</Tag>}
        </Space>
      ),
    },
    {
      title: '',
      key: 'ops',
      width: 80,
      render: (_, r) => (
        <Space size={4}>
          <Button type="text" size="small" icon={<Edit2 size={14} />} onClick={() => handleEdit(r)} className="text-cyan-400" />
          <Popconfirm title="Delete this rule?" onConfirm={() => handleDelete(r.id)} okText="Delete" okType="danger">
            <Button type="text" size="small" icon={<Trash2 size={14} />} className="text-red-400" />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const cameraOptions = cameras.map(c => ({ value: c.id, label: c.name }));

  return (
    <div className="h-[calc(100vh-56px)] flex flex-col bg-[#111318] text-white p-4 gap-4 overflow-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield size={20} className="text-cyan-400" />
          <h2 className="text-lg font-semibold m-0">Event Rules</h2>
          <Tag>{rules.length} rules</Tag>
          <Tag color="green">{rules.filter(r => r.enabled).length} active</Tag>
        </div>
        <div className="flex items-center gap-3">
          <Select
            value={filterModule}
            onChange={setFilterModule}
            className="w-48"
            options={[{ value: 'all', label: 'All Modules' }, ...eventModules]}
          />
          <Button type="primary" icon={<Plus size={14} />} onClick={handleCreate}>
            New Rule
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
        scroll={{ y: 'calc(100vh - 200px)' }}
      />

      {/* Edit/Create Modal */}
      <Modal
        title={editingRule ? 'Edit Rule' : 'Create Rule'}
        open={editModal}
        onOk={handleSave}
        onCancel={() => setEditModal(false)}
        width={640}
        okText="Save"
      >
        <Form form={form} layout="vertical" className="mt-4">
          <Form.Item name="name" label="Rule Name" rules={[{ required: true }]}>
            <Input placeholder="e.g. Illegal Parking - Zone A" />
          </Form.Item>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item name="module" label="Module" rules={[{ required: true }]}>
              <Select options={eventModules} />
            </Form.Item>
            <Form.Item name="eventType" label="Event Type" rules={[{ required: true }]}>
              <Select options={eventTypeOptions[selectedModule] || []} />
            </Form.Item>
          </div>

          <Form.Item name="cameras" label="Cameras">
            <Select mode="multiple" options={cameraOptions} placeholder="Select cameras" maxTagCount={3} />
          </Form.Item>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item name="priority" label="Alert Priority">
              <Select options={alertPriorities} />
            </Form.Item>
            <Form.Item name="confidence" label="Min Confidence">
              <Slider min={0.1} max={1} step={0.05} tooltip={{ formatter: (v) => `${(v * 100).toFixed(0)}%` }} />
            </Form.Item>
          </div>

          <Form.Item name="allDay" label="Schedule" valuePropName="checked">
            <Checkbox>All Day (24/7)</Checkbox>
          </Form.Item>

          <Form.Item noStyle shouldUpdate={(prev, cur) => prev.allDay !== cur.allDay}>
            {({ getFieldValue }) =>
              !getFieldValue('allDay') && (
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <Form.Item name="schedule_from" label="From">
                    <TimePicker format="HH:mm" className="w-full" />
                  </Form.Item>
                  <Form.Item name="schedule_to" label="To">
                    <TimePicker format="HH:mm" className="w-full" />
                  </Form.Item>
                </div>
              )
            }
          </Form.Item>

          <div className="border-t border-white/10 pt-3 mt-2">
            <p className="text-sm text-gray-400 mb-2">Trigger Actions:</p>
            <div className="flex gap-6">
              <Form.Item name="action_record" valuePropName="checked" className="mb-0">
                <Checkbox>Record</Checkbox>
              </Form.Item>
              <Form.Item name="action_snapshot" valuePropName="checked" className="mb-0">
                <Checkbox>Snapshot</Checkbox>
              </Form.Item>
              <Form.Item name="action_alert" valuePropName="checked" className="mb-0">
                <Checkbox>Alert</Checkbox>
              </Form.Item>
              <Form.Item name="action_webhook" valuePropName="checked" className="mb-0">
                <Checkbox>Webhook</Checkbox>
              </Form.Item>
            </div>
          </div>

          <Form.Item name="enabled" valuePropName="checked" className="mt-3 mb-0">
            <Checkbox>Enable rule immediately</Checkbox>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default EventConfiguration;
