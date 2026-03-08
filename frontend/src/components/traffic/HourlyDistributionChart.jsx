import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts';

/**
 * HourlyDistributionChart - Bar chart of total vehicles per hour
 * Highlights peak hours in different color
 * 
 * Props:
 *   data   - Array of { time, car, motorbike, bus, truck }
 *   height - Chart height
 */

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const val = payload[0]?.value || 0;
  return (
    <div className="bg-[#1e2028] border border-white/10 rounded-lg px-3 py-2 shadow-xl">
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <p className="text-sm text-white font-semibold tabular-nums">{val.toLocaleString()} vehicles</p>
    </div>
  );
}

function HourlyDistributionChart({ data, height = 200 }) {
  if (!data || data.length === 0) return null;

  // Aggregate total per time slot
  const barData = data.map(d => ({
    time: d.time,
    total: (d.car || 0) + (d.motorbike || 0) + (d.bus || 0) + (d.truck || 0),
  }));

  // Find peak value to highlight
  const maxVal = Math.max(...barData.map(d => d.total));
  const threshold = maxVal * 0.8;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={barData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
        <XAxis
          dataKey="time"
          tick={{ fill: '#9ca3af', fontSize: 10 }}
          axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
          tickLine={false}
          interval={2}
        />
        <YAxis
          tick={{ fill: '#9ca3af', fontSize: 10 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
        <Bar dataKey="total" radius={[3, 3, 0, 0]} animationDuration={800}>
          {barData.map((entry, index) => (
            <Cell
              key={index}
              fill={entry.total >= threshold ? '#f59e0b' : '#3b82f6'}
              fillOpacity={entry.total >= threshold ? 0.9 : 0.6}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export default HourlyDistributionChart;
