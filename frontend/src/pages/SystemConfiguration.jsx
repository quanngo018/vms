import React, { useState, useMemo } from 'react';
import { Tabs, Form, Input, InputNumber, Select, Switch, Button, Card, Progress, Badge, Tag, Descriptions, message } from 'antd';
import { Save, RefreshCw, Server, Database, HardDrive, Wifi, Brain, Bell, Wrench, Activity } from 'lucide-react';
import { getSystemConfig, getSystemStatus } from '../mock/systemData';

/**
 * System Configuration Page
 * 
 * Tabbed settings: General, Storage, Recording, Network, AI, Alerts, Maintenance
 * Plus system status overview.
 * 
 * Production: Replace mock with fetch('/api/system/config') & PUT
 */
function SystemConfiguration() {
  const [config, setConfig] = useState(() => getSystemConfig());
  const [status] = useState(() => getSystemStatus());
  const [activeTab, setActiveTab] = useState('status');

  const handleSave = (section, values) => {
    setConfig(prev => ({ ...prev, [section]: { ...prev[section], ...values } }));
    message.success(`${section} settings saved`);
  };

  const storagePercent = ((config.storage.usedSpace / config.storage.totalSpace) * 100).toFixed(1);

  const tabItems = [
    {
      key: 'status',
      label: <span className="flex items-center gap-2"><Activity size={14} />Status</span>,
      children: (
        <div className="space-y-4">
          {/* System Health */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card className="bg-[#1e2028] border-white/5" size="small">
              <div className="text-gray-500 text-xs mb-1">Uptime</div>
              <div className="text-white text-lg font-mono">{status.uptime}</div>
            </Card>
            <Card className="bg-[#1e2028] border-white/5" size="small">
              <div className="text-gray-500 text-xs mb-1">CPU Usage</div>
              <Progress percent={status.cpuUsage} size="small" strokeColor="#00d9ff" />
            </Card>
            <Card className="bg-[#1e2028] border-white/5" size="small">
              <div className="text-gray-500 text-xs mb-1">Memory Usage</div>
              <Progress percent={status.memoryUsage} size="small" strokeColor="#52c41a" />
            </Card>
            <Card className="bg-[#1e2028] border-white/5" size="small">
              <div className="text-gray-500 text-xs mb-1">Disk Usage</div>
              <Progress percent={status.diskUsage} size="small" strokeColor={status.diskUsage > 80 ? '#ff4d4f' : '#faad14'} />
            </Card>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Card className="bg-[#1e2028] border-white/5" size="small">
              <div className="text-gray-500 text-xs mb-1">Active Streams</div>
              <div className="text-cyan-400 text-2xl font-bold">{status.activeStreams}</div>
            </Card>
            <Card className="bg-[#1e2028] border-white/5" size="small">
              <div className="text-gray-500 text-xs mb-1">AI Pipelines</div>
              <div className="text-purple-400 text-2xl font-bold">{status.aiPipelines}</div>
            </Card>
            <Card className="bg-[#1e2028] border-white/5" size="small">
              <div className="text-gray-500 text-xs mb-1">Connected Clients</div>
              <div className="text-green-400 text-2xl font-bold">{status.connectedClients}</div>
            </Card>
          </div>

          {/* Services */}
          <Card title="Services" className="bg-[#1e2028] border-white/5" size="small">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {status.services.map(svc => (
                <div key={svc.name} className="flex items-center gap-2 p-2 bg-[#252830] rounded">
                  <Badge status={svc.status === 'running' ? 'success' : 'error'} />
                  <span className="text-sm text-white">{svc.name}</span>
                  <span className="text-xs text-gray-500 ml-auto">:{svc.port}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Network */}
          <Card title="Network I/O" className="bg-[#1e2028] border-white/5" size="small">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-gray-500 mb-1">Inbound</div>
                <div className="text-green-400 font-mono">{status.networkIn} Mbps</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Outbound</div>
                <div className="text-blue-400 font-mono">{status.networkOut} Mbps</div>
              </div>
            </div>
          </Card>
        </div>
      ),
    },
    {
      key: 'general',
      label: <span className="flex items-center gap-2"><Server size={14} />General</span>,
      children: (
        <SettingsForm
          initialValues={config.general}
          onSave={(v) => handleSave('general', v)}
          fields={[
            { name: 'systemName', label: 'System Name', component: <Input /> },
            { name: 'language', label: 'Language', component: <Select options={[{ value: 'vi', label: 'Tiếng Việt' }, { value: 'en', label: 'English' }]} /> },
            { name: 'timezone', label: 'Timezone', component: <Select options={[{ value: 'Asia/Ho_Chi_Minh', label: 'Asia/Ho_Chi_Minh (UTC+7)' }, { value: 'UTC', label: 'UTC' }]} /> },
            { name: 'dateFormat', label: 'Date Format', component: <Select options={[{ value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' }, { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' }]} /> },
            { name: 'autoLogout', label: 'Auto Logout (minutes)', component: <InputNumber min={5} max={120} /> },
          ]}
        />
      ),
    },
    {
      key: 'storage',
      label: <span className="flex items-center gap-2"><HardDrive size={14} />Storage</span>,
      children: (
        <div className="space-y-4">
          <Card className="bg-[#1e2028] border-white/5" size="small">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400">Storage Usage</span>
              <span className="text-white font-mono">{config.storage.usedSpace} / {config.storage.totalSpace} GB</span>
            </div>
            <Progress percent={parseFloat(storagePercent)} strokeColor={parseFloat(storagePercent) > 80 ? '#ff4d4f' : '#00d9ff'} />
          </Card>
          <SettingsForm
            initialValues={config.storage}
            onSave={(v) => handleSave('storage', v)}
            fields={[
              { name: 'primaryPath', label: 'Primary Storage Path', component: <Input /> },
              { name: 'backupPath', label: 'Backup Path', component: <Input /> },
              { name: 'retentionDays', label: 'Retention (days)', component: <InputNumber min={1} max={365} /> },
              { name: 'overwriteOldest', label: 'Overwrite Oldest When Full', component: <Switch />, valuePropName: 'checked' },
              { name: 'recordingFormat', label: 'Recording Format', component: <Select options={[{ value: 'mp4', label: 'MP4' }, { value: 'mkv', label: 'MKV' }]} /> },
            ]}
          />
        </div>
      ),
    },
    {
      key: 'recording',
      label: <span className="flex items-center gap-2"><Database size={14} />Recording</span>,
      children: (
        <SettingsForm
          initialValues={config.recording}
          onSave={(v) => handleSave('recording', v)}
          fields={[
            { name: 'defaultResolution', label: 'Default Resolution', component: <Select options={[{ value: '1920x1080', label: '1080p' }, { value: '1280x720', label: '720p' }, { value: '768x432', label: '432p' }]} /> },
            { name: 'defaultFps', label: 'Default FPS', component: <InputNumber min={1} max={60} /> },
            { name: 'defaultCodec', label: 'Codec', component: <Select options={[{ value: 'H.264', label: 'H.264' }, { value: 'H.265', label: 'H.265 (HEVC)' }]} /> },
            { name: 'defaultBitrate', label: 'Bitrate (kbps)', component: <InputNumber min={512} max={16384} step={512} /> },
            { name: 'preRecordSeconds', label: 'Pre-record (seconds)', component: <InputNumber min={0} max={30} /> },
            { name: 'postRecordSeconds', label: 'Post-record (seconds)', component: <InputNumber min={0} max={60} /> },
            { name: 'continuousRecording', label: 'Continuous Recording', component: <Switch />, valuePropName: 'checked' },
            { name: 'scheduleEnabled', label: 'Schedule Recording', component: <Switch />, valuePropName: 'checked' },
          ]}
        />
      ),
    },
    {
      key: 'network',
      label: <span className="flex items-center gap-2"><Wifi size={14} />Network</span>,
      children: (
        <SettingsForm
          initialValues={config.network}
          onSave={(v) => handleSave('network', v)}
          fields={[
            { name: 'serverIp', label: 'Backend Server IP', component: <Input /> },
            { name: 'serverPort', label: 'Backend Port', component: <InputNumber min={1} max={65535} /> },
            { name: 'mediaServerIp', label: 'Media Server IP', component: <Input /> },
            { name: 'mediaServerPort', label: 'Media Server Port', component: <InputNumber min={1} max={65535} /> },
            { name: 'maxBandwidth', label: 'Max Bandwidth (Mbps)', component: <InputNumber min={100} max={10000} /> },
            { name: 'rtspTimeout', label: 'RTSP Timeout (seconds)', component: <InputNumber min={3} max={60} /> },
          ]}
        />
      ),
    },
    {
      key: 'ai',
      label: <span className="flex items-center gap-2"><Brain size={14} />AI Engine</span>,
      children: (
        <div className="space-y-4">
          <SettingsForm
            initialValues={config.ai}
            onSave={(v) => handleSave('ai', v)}
            fields={[
              { name: 'enabled', label: 'AI Processing Enabled', component: <Switch />, valuePropName: 'checked' },
              { name: 'processingMode', label: 'Processing Mode', component: <Select options={[{ value: 'edge', label: 'Edge (Jetson)' }, { value: 'cloud', label: 'Cloud' }, { value: 'hybrid', label: 'Hybrid' }]} /> },
              { name: 'maxConcurrentStreams', label: 'Max Concurrent Streams', component: <InputNumber min={1} max={32} /> },
              { name: 'inferenceDevice', label: 'Inference Device', component: <Input disabled /> },
              { name: 'modelUpdateInterval', label: 'Model Update Interval (hours)', component: <InputNumber min={1} max={168} /> },
              { name: 'confidenceThreshold', label: 'Global Confidence Threshold', component: <InputNumber min={0.1} max={1} step={0.05} /> },
            ]}
          />
          <Card title="AI Modules" className="bg-[#1e2028] border-white/5" size="small">
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(config.ai.modules).map(([key, val]) => (
                <div key={key} className="flex items-center justify-between p-2 bg-[#252830] rounded">
                  <span className="text-sm text-gray-300 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                  <Badge status={val ? 'success' : 'default'} text={val ? 'ON' : 'OFF'} />
                </div>
              ))}
            </div>
          </Card>
        </div>
      ),
    },
    {
      key: 'alerts',
      label: <span className="flex items-center gap-2"><Bell size={14} />Alerts</span>,
      children: (
        <SettingsForm
          initialValues={config.alerts}
          onSave={(v) => handleSave('alerts', v)}
          fields={[
            { name: 'emailEnabled', label: 'Email Notifications', component: <Switch />, valuePropName: 'checked' },
            { name: 'emailRecipients', label: 'Email Recipients', component: <Input /> },
            { name: 'smtpServer', label: 'SMTP Server', component: <Input /> },
            { name: 'smtpPort', label: 'SMTP Port', component: <InputNumber min={1} max={65535} /> },
            { name: 'webhookEnabled', label: 'Webhook Notifications', component: <Switch />, valuePropName: 'checked' },
            { name: 'webhookUrl', label: 'Webhook URL', component: <Input placeholder="https://..." /> },
            { name: 'soundEnabled', label: 'Sound Alerts', component: <Switch />, valuePropName: 'checked' },
            { name: 'popupEnabled', label: 'Popup Alerts', component: <Switch />, valuePropName: 'checked' },
          ]}
        />
      ),
    },
    {
      key: 'maintenance',
      label: <span className="flex items-center gap-2"><Wrench size={14} />Maintenance</span>,
      children: (
        <div className="space-y-4">
          <Card className="bg-[#1e2028] border-white/5" size="small">
            <Descriptions column={2} size="small">
              <Descriptions.Item label="Version">{config.maintenance.systemVersion}</Descriptions.Item>
              <Descriptions.Item label="Last Update">
                {new Date(config.maintenance.lastUpdate).toLocaleDateString('vi-VN')}
              </Descriptions.Item>
              <Descriptions.Item label="Last Backup">
                {new Date(config.maintenance.lastBackup).toLocaleDateString('vi-VN')}
              </Descriptions.Item>
              <Descriptions.Item label="Backup Schedule">{config.maintenance.backupSchedule}</Descriptions.Item>
            </Descriptions>
          </Card>
          <SettingsForm
            initialValues={config.maintenance}
            onSave={(v) => handleSave('maintenance', v)}
            fields={[
              { name: 'autoRestart', label: 'Auto Restart', component: <Switch />, valuePropName: 'checked' },
              { name: 'restartTime', label: 'Restart Time', component: <Input placeholder="HH:mm" /> },
              { name: 'logRetentionDays', label: 'Log Retention (days)', component: <InputNumber min={7} max={365} /> },
              { name: 'backupSchedule', label: 'Backup Schedule', component: <Select options={[{ value: 'daily', label: 'Daily' }, { value: 'weekly', label: 'Weekly' }, { value: 'monthly', label: 'Monthly' }]} /> },
            ]}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="h-[calc(100vh-56px)] bg-[#111318] text-white p-4 overflow-auto">
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
        tabPosition="left"
        className="system-config-tabs"
      />
    </div>
  );
}

/**
 * Reusable settings form: renders fields, handles save
 */
function SettingsForm({ initialValues, onSave, fields }) {
  const [form] = Form.useForm();

  const handleSubmit = () => {
    form.validateFields().then(values => {
      onSave(values);
    });
  };

  return (
    <Form form={form} initialValues={initialValues} layout="horizontal" labelCol={{ span: 8 }} wrapperCol={{ span: 16 }}>
      {fields.map(f => (
        <Form.Item key={f.name} name={f.name} label={f.label} valuePropName={f.valuePropName || 'value'}>
          {f.component}
        </Form.Item>
      ))}
      <Form.Item wrapperCol={{ offset: 8, span: 16 }}>
        <Button type="primary" icon={<Save size={14} />} onClick={handleSubmit}>
          Save Changes
        </Button>
      </Form.Item>
    </Form>
  );
}

export default SystemConfiguration;
