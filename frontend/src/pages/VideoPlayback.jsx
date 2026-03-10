import React, { useState, useMemo } from 'react';
import { Select, DatePicker, Button, Table, Slider, Space, Tag, Empty } from 'antd';
import { Play, Pause, SkipBack, SkipForward, Download, Search, Clock, Film, AlertTriangle } from 'lucide-react';
import { cameras } from '../mock/data';
import { generateTimelineSegments, generatePlaybackEvents, searchRecordings } from '../mock/playbackData';

import dayjs from 'dayjs';

/**
 * Video Playback Page
 * 
 * Left: Video player + timeline
 * Right: Camera selector, date/time, event list
 * 
 * Production: Replace mock imports with fetch() to /api/playback/*
 */
function VideoPlayback() {
  const [selectedCamera, setSelectedCamera] = useState(cameras[0]?.id);
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(8 * 60); // minutes from midnight
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [searchResults, setSearchResults] = useState(null);

  const cameraOptions = cameras.map(c => ({ value: c.id, label: c.name }));
  const currentCam = cameras.find(c => c.id === selectedCamera);

  const segments = useMemo(
    () => generateTimelineSegments(selectedCamera, selectedDate?.toDate()),
    [selectedCamera, selectedDate]
  );

  const events = useMemo(
    () => generatePlaybackEvents(selectedCamera, selectedDate?.toDate()),
    [selectedCamera, selectedDate]
  );

  const handleSearch = () => {
    const results = searchRecordings({ cameraIds: [selectedCamera] });
    setSearchResults(results);
  };

  const handleEventClick = (evt) => {
    const d = new Date(evt.timestamp);
    setCurrentTime(d.getHours() * 60 + d.getMinutes());
  };

  const formatMinutes = (mins) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

  const eventTypeColors = {
    vehicle_detected: 'blue',
    person_detected: 'green',
    illegal_parking: 'orange',
    loitering: 'gold',
    suspicious_activity: 'red',
    crowd: 'purple',
  };

  const resultColumns = [
    {
      title: 'Camera',
      dataIndex: 'cameraName',
      width: 100,
    },
    {
      title: 'Time',
      dataIndex: 'startTime',
      width: 140,
      render: (v) => new Date(v).toLocaleString('vi-VN'),
    },
    {
      title: 'Duration',
      dataIndex: 'duration',
      width: 80,
      render: (v) => `${Math.floor(v / 60)}m ${v % 60}s`,
    },
    {
      title: 'Events',
      dataIndex: 'eventCount',
      width: 60,
      render: (v) => v > 0 ? <Tag color="orange">{v}</Tag> : <Tag>0</Tag>,
    },
    {
      title: '',
      width: 40,
      render: () => (
        <Button type="text" size="small" icon={<Play size={14} />} className="text-cyan-400" />
      ),
    },
  ];

  return (
    <div className="h-[calc(100vh-56px)] flex bg-[#111318] text-white">
      {/* Left: Player + Timeline */}
      <div className="flex-1 flex flex-col p-4 gap-3">
        {/* Video Player Area */}
        <div className="flex-1 bg-black rounded-lg relative flex items-center justify-center min-h-0">
          <div className="text-center text-gray-500">
            <Film size={48} className="mx-auto mb-3 opacity-50" />
            <p className="text-lg font-medium">{currentCam?.name || 'No Camera'}</p>
            <p className="text-sm mt-1">{selectedDate?.format('DD/MM/YYYY')} — {formatMinutes(currentTime)}</p>
            <p className="text-xs mt-2 text-gray-600">
              Playback stream sẽ kết nối qua MediaMTX API
            </p>
          </div>

          {/* Speed indicator */}
          <div className="absolute top-3 right-3 bg-black/60 px-2 py-1 rounded text-xs text-cyan-400">
            {playbackSpeed}x
          </div>
        </div>

        {/* Timeline Bar */}
        <div className="bg-[#1e2028] rounded-lg p-3">
          {/* Segment visualization */}
          <div className="relative h-8 bg-[#2a2d35] rounded mb-2 overflow-hidden">
            {segments.map((seg) => {
              const start = new Date(seg.startTime);
              const end = new Date(seg.endTime);
              const startPct = ((start.getHours() * 60 + start.getMinutes()) / 1440) * 100;
              const widthPct = ((end - start) / (24 * 60 * 60 * 1000)) * 100;
              return (
                <div
                  key={seg.id}
                  className="absolute top-0 h-full"
                  style={{
                    left: `${startPct}%`,
                    width: `${widthPct}%`,
                    backgroundColor: seg.hasEvents ? '#f59e0b44' : '#00d9ff33',
                  }}
                />
              );
            })}

            {/* Event markers */}
            {events.map((evt) => {
              const d = new Date(evt.timestamp);
              const pct = ((d.getHours() * 60 + d.getMinutes()) / 1440) * 100;
              return (
                <div
                  key={evt.id}
                  className="absolute top-0 w-0.5 h-full bg-red-500 cursor-pointer hover:w-1 transition-all"
                  style={{ left: `${pct}%` }}
                  title={`${evt.type}: ${evt.description}`}
                  onClick={() => handleEventClick(evt)}
                />
              );
            })}

            {/* Playhead */}
            <div
              className="absolute top-0 w-0.5 h-full bg-cyan-400 z-10"
              style={{ left: `${(currentTime / 1440) * 100}%` }}
            >
              <div className="absolute -top-1 -left-1.5 w-3 h-3 bg-cyan-400 rounded-full" />
            </div>
          </div>

          {/* Time slider */}
          <Slider
            min={0}
            max={1439}
            value={currentTime}
            onChange={setCurrentTime}
            tooltip={{ formatter: formatMinutes }}
            className="mb-2"
          />

          {/* Playback controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                type="text" size="small"
                icon={<SkipBack size={16} />}
                onClick={() => setCurrentTime(Math.max(0, currentTime - 30))}
                className="text-gray-400 hover:text-white"
              />
              <Button
                type="primary" shape="circle" size="small"
                icon={playing ? <Pause size={16} /> : <Play size={16} />}
                onClick={() => setPlaying(!playing)}
              />
              <Button
                type="text" size="small"
                icon={<SkipForward size={16} />}
                onClick={() => setCurrentTime(Math.min(1439, currentTime + 30))}
                className="text-gray-400 hover:text-white"
              />
            </div>

            <div className="text-sm text-gray-400 font-mono">
              {formatMinutes(currentTime)}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Speed:</span>
              {[0.5, 1, 2, 4, 8].map(s => (
                <Button
                  key={s}
                  type={playbackSpeed === s ? 'primary' : 'text'}
                  size="small"
                  onClick={() => setPlaybackSpeed(s)}
                  className={playbackSpeed !== s ? 'text-gray-500' : ''}
                >
                  {s}x
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right: Controls + Events */}
      <div className="w-80 bg-[#1a1d24] border-l border-white/5 flex flex-col p-4 gap-4">
        {/* Camera & Date Selection */}
        <div>
          <label className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">Camera</label>
          <Select
            value={selectedCamera}
            onChange={setSelectedCamera}
            options={cameraOptions}
            className="w-full"
            popupMatchSelectWidth
          />
        </div>

        <div>
          <label className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">Date</label>
          <DatePicker
            value={selectedDate}
            onChange={setSelectedDate}
            className="w-full"
            format="DD/MM/YYYY"
          />
        </div>

        <Button icon={<Search size={14} />} onClick={handleSearch} block>
          Search Recordings
        </Button>

        {/* Events List */}
        <div className="flex-1 overflow-auto min-h-0">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={14} className="text-orange-400" />
            <span className="text-sm font-medium text-gray-300">Events on Timeline</span>
            <Tag className="ml-auto">{events.length}</Tag>
          </div>

          <div className="space-y-1.5">
            {events.map(evt => (
              <div
                key={evt.id}
                className="p-2 bg-[#252830] rounded cursor-pointer hover:bg-[#2d3040] transition-colors"
                onClick={() => handleEventClick(evt)}
              >
                <div className="flex items-center gap-2">
                  <Tag color={eventTypeColors[evt.type] || 'default'} className="text-xs">
                    {evt.type.replace(/_/g, ' ')}
                  </Tag>
                  <span className="text-xs text-gray-500 ml-auto">
                    <Clock size={10} className="inline mr-1" />
                    {new Date(evt.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-1 truncate">{evt.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Search Results */}
        {searchResults && (
          <div className="border-t border-white/5 pt-3">
            <div className="flex items-center gap-2 mb-2">
              <Film size={14} className="text-cyan-400" />
              <span className="text-sm font-medium text-gray-300">Recordings</span>
              <Tag className="ml-auto">{searchResults.length}</Tag>
            </div>
            <Table
              dataSource={searchResults}
              columns={resultColumns}
              rowKey="id"
              size="small"
              pagination={false}
              scroll={{ y: 200 }}
              className="compact-table"
            />
          </div>
        )}

        {/* Export */}
        <Button icon={<Download size={14} />} block className="mt-auto">
          Export Clip
        </Button>
      </div>
    </div>
  );
}

export default VideoPlayback;
