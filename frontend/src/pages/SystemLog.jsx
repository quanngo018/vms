import React, { useState, useMemo } from 'react';
import { Table, Tag, Select, Input, Button, DatePicker, Space } from 'antd';
import { RefreshCw, Download, Search, Filter } from 'lucide-react';
import { generateSystemLogs } from '../mock/systemData';

import dayjs from 'dayjs';

/**
 * System Log Page
 * 
 * Filterable system log viewer with level/source filters.
 * 
 * Production: Replace generateSystemLogs() with fetch('/api/system/logs')
 */
function SystemLog() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [filterLevel, setFilterLevel] = useState('all');
  const [filterSource, setFilterSource] = useState('all');
  const [searchText, setSearchText] = useState('');

  const logs = useMemo(() => generateSystemLogs(100), [refreshKey]);

  const filtered = useMemo(() => {
    return logs.filter(l => {
      if (filterLevel !== 'all' && l.level !== filterLevel) return false;
      if (filterSource !== 'all' && l.source !== filterSource) return false;
      if (searchText && !l.message.toLowerCase().includes(searchText.toLowerCase())) return false;
      return true;
    });
  }, [logs, filterLevel, filterSource, searchText]);

  const sources = useMemo(() => {
    const s = [...new Set(logs.map(l => l.source))];
    return [{ value: 'all', label: 'All Sources' }, ...s.map(v => ({ value: v, label: v }))];
  }, [logs]);

  const levelColors = {
    info: 'blue',
    warning: 'gold',
    error: 'red',
    debug: 'default',
  };

  const columns = [
    {
      title: 'Time',
      dataIndex: 'timestamp',
      width: 170,
      render: (v) => (
        <span className="font-mono text-xs text-gray-400">
          {new Date(v).toLocaleString('vi-VN')}
        </span>
      ),
    },
    {
      title: 'Level',
      dataIndex: 'level',
      width: 90,
      render: (v) => <Tag color={levelColors[v]}>{v.toUpperCase()}</Tag>,
    },
    {
      title: 'Source',
      dataIndex: 'source',
      width: 120,
      render: (v) => <span className="text-cyan-400 text-sm">{v}</span>,
    },
    {
      title: 'Message',
      dataIndex: 'message',
      render: (v) => <span className="text-gray-300 text-sm">{v}</span>,
    },
  ];

  return (
    <div className="h-[calc(100vh-56px)] flex flex-col bg-[#111318] text-white p-4 gap-4">
      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <Input
          prefix={<Search size={14} className="text-gray-500" />}
          placeholder="Search logs..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className="w-64"
          allowClear
        />
        <Select
          value={filterLevel}
          onChange={setFilterLevel}
          className="w-36"
          options={[
            { value: 'all', label: 'All Levels' },
            { value: 'info', label: 'Info' },
            { value: 'warning', label: 'Warning' },
            { value: 'error', label: 'Error' },
            { value: 'debug', label: 'Debug' },
          ]}
        />
        <Select
          value={filterSource}
          onChange={setFilterSource}
          className="w-40"
          options={sources}
        />
        <div className="ml-auto flex gap-2">
          <Button icon={<RefreshCw size={14} />} onClick={() => setRefreshKey(k => k + 1)}>
            Refresh
          </Button>
          <Button icon={<Download size={14} />}>Export</Button>
        </div>
      </div>

      {/* Summary */}
      <div className="flex items-center gap-4 text-sm">
        <span className="text-gray-500">{filtered.length} entries</span>
        <Tag color="red">{filtered.filter(l => l.level === 'error').length} errors</Tag>
        <Tag color="gold">{filtered.filter(l => l.level === 'warning').length} warnings</Tag>
      </div>

      {/* Table */}
      <div className="flex-1 min-h-0">
        <Table
          dataSource={filtered}
          columns={columns}
          rowKey="id"
          size="small"
          pagination={{ pageSize: 25, showTotal: (t) => `${t} log entries` }}
          scroll={{ y: 'calc(100vh - 260px)' }}
        />
      </div>
    </div>
  );
}

export default SystemLog;
