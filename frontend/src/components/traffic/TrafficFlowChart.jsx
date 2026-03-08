import React from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
} from 'recharts';

/**
 * TrafficFlowChart - Stacked area chart showing vehicle count over time
 * 
 * Props:
 *   data       - Array of { time, car, motorbike, bus, truck }
 *   interval   - Display mode: 'realtime' (5min) | 'hourly' (24h)
 *   height     - Chart height in px
 */

const SERIES = [
  { key: 'motorbike', name: 'Xe máy', color: '#10b981', order: 1 },
  { key: 'car', name: 'Ô tô', color: '#3b82f6', order: 2 },
  { key: 'bus', name: 'Xe buýt', color: '#f59e0b', order: 3 },
  { key: 'truck', name: 'Xe tải', color: '#ef4444', order: 4 },
];

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const total = payload.reduce((s, p) => s + (p.value || 0), 0);

  return (
    <div className="bg-[#1e2028] border border-white/10 rounded-lg px-3 py-2 shadow-xl">
      <p className="text-xs text-gray-400 mb-1.5 font-medium">{label}</p>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center justify-between gap-4 text-xs py-0.5">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: p.color }} />
            <span className="text-gray-300">{p.name}</span>
          </div>
          <span className="text-white font-medium tabular-nums">{p.value}</span>
        </div>
      ))}
      <div className="border-t border-white/10 mt-1.5 pt-1.5 flex justify-between text-xs">
        <span className="text-gray-400">Total</span>
        <span className="text-cyan-400 font-semibold tabular-nums">{total}</span>
      </div>
    </div>
  );
}

function TrafficFlowChart({ data, interval = 'hourly', height = 280 }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center text-gray-500 text-sm" style={{ height }}>
        No data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
        <defs>
          {SERIES.map(s => (
            <linearGradient key={s.key} id={`grad_${s.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={s.color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={s.color} stopOpacity={0.02} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
        <XAxis
          dataKey="time"
          tick={{ fill: '#9ca3af', fontSize: 11 }}
          axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
          tickLine={false}
          interval={interval === 'hourly' ? 2 : 1}
        />
        <YAxis
          tick={{ fill: '#9ca3af', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          verticalAlign="top"
          height={32}
          iconType="rect"
          iconSize={10}
          formatter={(val) => <span className="text-xs text-gray-300">{val}</span>}
        />
        {SERIES.map(s => (
          <Area
            key={s.key}
            type="monotone"
            dataKey={s.key}
            name={s.name}
            stroke={s.color}
            fill={`url(#grad_${s.key})`}
            strokeWidth={2}
            stackId="1"
            animationDuration={800}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}

export default TrafficFlowChart;
