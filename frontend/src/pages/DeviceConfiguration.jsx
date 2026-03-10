import React, { useState, useMemo } from 'react';
import { Select, Card, Form, Input, InputNumber, Switch, Button, Descriptions, Badge, Tabs, Slider, Tag, message } from 'antd';
import { Camera, Save, RotateCw, Video, Sliders, Wifi, Eye } from 'lucide-react';
import { generateDevices } from '../mock/deviceData';

/**
 * Device Configuration Page
 * 
 * Per-device configuration: stream settings, recording params,
 * motion detection, network config.
 * 
 * Production: Replace mock with fetch('/api/devices/:id/config') & PUT
 */
function DeviceConfiguration() {
  const devices = useMemo(() => generateDevices(), []);
  const cameraDevices = useMemo(() => devices.filter(d => d.type === 'ip_camera'), [devices]);
  const [selectedId, setSelectedId] = useState(cameraDevices[0]?.id);
  const [configs, setConfigs] = useState(() => {
    const map = {};
    devices.forEach(d => { map[d.id] = { ...d.config }; });
    return map;
  });

  const selected = devices.find(d => d.id === selectedId);
  const currentConfig = configs[selectedId] || {};

  const handleSave = (values) => {
    setConfigs(prev => ({ ...prev, [selectedId]: { ...prev[selectedId], ...values } }));
    message.success(`Configuration saved for ${selected?.name}`);
  };

  const deviceOptions = cameraDevices.map(d => ({
    value: d.id,
    label: (
      <span className="flex items-center gap-2">
        <Badge status={d.status === 'online' ? 'success' : 'error'} />
        {d.name} — {d.ip}
      </span>
    ),
  }));

  const tabItems = [
    {
      key: 'stream',
      label: <span className="flex items-center gap-2"><Video size={14} />Stream</span>,
      children: (
        <ConfigForm
          key={`stream-${selectedId}`}
          initialValues={{
            resolution: currentConfig.resolution || '768x432',
            fps: currentConfig.fps || 25,
            codec: currentConfig.codec || 'H.264',
            bitrate: currentConfig.bitrate || 2048,
            protocol: currentConfig.protocol || 'RTSP',
          }}
          onSave={handleSave}
          fields={[
            {
              name: 'resolution', label: 'Resolution',
              component: (
                <Select options={[
                  { value: '1920x1080', label: '1920×1080 (Full HD)' },
                  { value: '1280x720', label: '1280×720 (HD)' },
                  { value: '768x432', label: '768×432 (Sub-stream)' },
                  { value: '640x360', label: '640×360 (Low)' },
                ]} />
              ),
            },
            { name: 'fps', label: 'Frame Rate (FPS)', component: <InputNumber min={1} max={60} /> },
            {
              name: 'codec', label: 'Video Codec',
              component: (
                <Select options={[
                  { value: 'H.264', label: 'H.264 (AVC)' },
                  { value: 'H.265', label: 'H.265 (HEVC)' },
                  { value: 'MJPEG', label: 'MJPEG' },
                ]} />
              ),
            },
            { name: 'bitrate', label: 'Bitrate (kbps)', component: <InputNumber min={256} max={16384} step={256} /> },
            {
              name: 'protocol', label: 'Protocol',
              component: (
                <Select options={[
                  { value: 'RTSP', label: 'RTSP' },
                  { value: 'RTMP', label: 'RTMP' },
                  { value: 'WebRTC', label: 'WebRTC' },
                ]} />
              ),
            },
          ]}
        />
      ),
    },
    {
      key: 'recording',
      label: <span className="flex items-center gap-2"><Camera size={14} />Recording</span>,
      children: (
        <ConfigForm
          key={`rec-${selectedId}`}
          initialValues={{
            recording: currentConfig.recording ?? true,
            motionDetection: currentConfig.motionDetection ?? true,
            preRecord: 5,
            postRecord: 10,
            storageQuota: 100,
          }}
          onSave={handleSave}
          fields={[
            { name: 'recording', label: 'Enable Recording', component: <Switch />, valuePropName: 'checked' },
            { name: 'motionDetection', label: 'Motion Detection', component: <Switch />, valuePropName: 'checked' },
            { name: 'preRecord', label: 'Pre-record (seconds)', component: <InputNumber min={0} max={30} /> },
            { name: 'postRecord', label: 'Post-record (seconds)', component: <InputNumber min={0} max={60} /> },
            { name: 'storageQuota', label: 'Storage Quota (GB)', component: <InputNumber min={10} max={2000} /> },
          ]}
        />
      ),
    },
    {
      key: 'image',
      label: <span className="flex items-center gap-2"><Sliders size={14} />Image</span>,
      children: (
        <ConfigForm
          key={`img-${selectedId}`}
          initialValues={{
            brightness: 50,
            contrast: 50,
            saturation: 50,
            sharpness: 50,
            wdr: false,
            irMode: 'auto',
            nightVision: true,
          }}
          onSave={handleSave}
          fields={[
            { name: 'brightness', label: 'Brightness', component: <Slider min={0} max={100} /> },
            { name: 'contrast', label: 'Contrast', component: <Slider min={0} max={100} /> },
            { name: 'saturation', label: 'Saturation', component: <Slider min={0} max={100} /> },
            { name: 'sharpness', label: 'Sharpness', component: <Slider min={0} max={100} /> },
            { name: 'wdr', label: 'Wide Dynamic Range', component: <Switch />, valuePropName: 'checked' },
            { name: 'nightVision', label: 'Night Vision', component: <Switch />, valuePropName: 'checked' },
            {
              name: 'irMode', label: 'IR LED Mode',
              component: (
                <Select options={[
                  { value: 'auto', label: 'Auto' },
                  { value: 'on', label: 'Always On' },
                  { value: 'off', label: 'Off' },
                ]} />
              ),
            },
          ]}
        />
      ),
    },
    {
      key: 'network',
      label: <span className="flex items-center gap-2"><Wifi size={14} />Network</span>,
      children: selected ? (
        <div className="space-y-4">
          <Card className="bg-[#1e2028] border-white/5" size="small">
            <Descriptions column={2} size="small">
              <Descriptions.Item label="IP Address">{selected.ip}</Descriptions.Item>
              <Descriptions.Item label="Model">{selected.model}</Descriptions.Item>
              <Descriptions.Item label="Firmware">{selected.firmware}</Descriptions.Item>
              <Descriptions.Item label="Status">
                <Badge status={selected.status === 'online' ? 'success' : 'error'} text={selected.status} />
              </Descriptions.Item>
              <Descriptions.Item label="Bandwidth">{selected.metrics?.bandwidth} Mbps</Descriptions.Item>
              <Descriptions.Item label="Uptime">{Math.floor(selected.uptime / 24)}d {selected.uptime % 24}h</Descriptions.Item>
            </Descriptions>
          </Card>
          <ConfigForm
            key={`net-${selectedId}`}
            initialValues={{
              dhcp: false,
              port: 554,
              httpPort: 80,
              onvifEnabled: true,
            }}
            onSave={handleSave}
            fields={[
              { name: 'dhcp', label: 'DHCP', component: <Switch />, valuePropName: 'checked' },
              { name: 'port', label: 'RTSP Port', component: <InputNumber min={1} max={65535} /> },
              { name: 'httpPort', label: 'HTTP Port', component: <InputNumber min={1} max={65535} /> },
              { name: 'onvifEnabled', label: 'ONVIF', component: <Switch />, valuePropName: 'checked' },
            ]}
          />
        </div>
      ) : null,
    },
  ];

  return (
    <div className="h-[calc(100vh-56px)] flex bg-[#111318] text-white">
      {/* Left: Device Selector */}
      <div className="w-72 bg-[#1a1d24] border-r border-white/5 p-4 flex flex-col gap-3">
        <div className="flex items-center gap-2 mb-2">
          <Camera size={18} className="text-cyan-400" />
          <span className="font-semibold text-gray-300">Select Device</span>
        </div>

        <div className="flex-1 overflow-auto space-y-1">
          {cameraDevices.map(d => (
            <button
              key={d.id}
              onClick={() => setSelectedId(d.id)}
              className={`w-full text-left p-3 rounded-lg transition-colors ${
                selectedId === d.id
                  ? 'bg-cyan-500/10 border border-cyan-500/30'
                  : 'bg-[#252830] border border-transparent hover:bg-[#2d3040]'
              }`}
            >
              <div className="flex items-center gap-2">
                <Badge status={d.status === 'online' ? 'success' : 'error'} />
                <span className="font-medium text-white text-sm">{d.name}</span>
              </div>
              <div className="text-xs text-gray-500 mt-1 ml-5">{d.ip}</div>
              <div className="text-xs text-gray-600 mt-0.5 ml-5">{d.model}</div>
            </button>
          ))}
        </div>

        {/* Non-camera devices label */}
        <div className="border-t border-white/5 pt-2">
          <span className="text-xs text-gray-600 uppercase tracking-wider">Infrastructure</span>
          {devices.filter(d => d.type !== 'ip_camera').map(d => (
            <button
              key={d.id}
              onClick={() => setSelectedId(d.id)}
              className={`w-full text-left p-2 rounded mt-1 transition-colors text-sm ${
                selectedId === d.id
                  ? 'bg-cyan-500/10 border border-cyan-500/30'
                  : 'bg-[#252830] border border-transparent hover:bg-[#2d3040]'
              }`}
            >
              <div className="flex items-center gap-2">
                <Badge status={d.status === 'online' ? 'success' : 'error'} />
                <span className="text-gray-300">{d.name}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Right: Config Tabs */}
      <div className="flex-1 p-4 overflow-auto">
        {selected ? (
          <>
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-lg font-semibold m-0">{selected.name}</h2>
              <Tag>{selected.model}</Tag>
              <Badge status={selected.status === 'online' ? 'success' : 'error'} text={selected.status} />
              <span className="text-xs text-gray-500 ml-auto">
                Last seen: {new Date(selected.lastSeen).toLocaleString('vi-VN')}
              </span>
            </div>
            <Tabs items={tabItems} />
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            Select a device to configure
          </div>
        )}
      </div>
    </div>
  );
}

function ConfigForm({ initialValues, onSave, fields }) {
  const [form] = Form.useForm();

  return (
    <Form form={form} initialValues={initialValues} layout="horizontal" labelCol={{ span: 8 }} wrapperCol={{ span: 16 }}>
      {fields.map(f => (
        <Form.Item key={f.name} name={f.name} label={f.label} valuePropName={f.valuePropName || 'value'}>
          {f.component}
        </Form.Item>
      ))}
      <Form.Item wrapperCol={{ offset: 8, span: 16 }}>
        <Button type="primary" icon={<Save size={14} />} onClick={() => form.validateFields().then(onSave)}>
          Save Configuration
        </Button>
      </Form.Item>
    </Form>
  );
}

export default DeviceConfiguration;
