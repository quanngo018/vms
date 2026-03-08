import React from 'react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
} from 'recharts';

/**
 * VehicleDistributionChart - Donut chart showing vehicle type proportions
 * 
 * Props:
 *   data   - Array of { name, value, color }
 *   height - Chart height in px
 */

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const { name, value, payload: data } = payload[0];
  return (
    <div className="bg-[#1e2028] border border-white/10 rounded-lg px-3 py-2 shadow-xl">
      <div className="flex items-center gap-2 text-xs">
        <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: data.color }} />
        <span className="text-gray-300">{name}</span>
        <span className="text-white font-semibold ml-auto tabular-nums">{value.toLocaleString()}</span>
      </div>
    </div>
  );
}

const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  if (percent < 0.05) return null;
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central"
          fontSize={12} fontWeight={600}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

function VehicleDistributionChart({ data, height = 240 }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center text-gray-500 text-sm" style={{ height }}>
        No data
      </div>
    );
  }

  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <div style={{ height }} className="relative">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius="55%"
            outerRadius="85%"
            paddingAngle={2}
            dataKey="value"
            labelLine={false}
            label={renderCustomLabel}
            animationDuration={800}
          >
            {data.map((entry, index) => (
              <Cell key={index} fill={entry.color} stroke="transparent" />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="bottom"
            iconType="circle"
            iconSize={8}
            formatter={(val) => <span className="text-xs text-gray-400">{val}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
      {/* Center label */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none"
           style={{ marginBottom: 28 }}>
        <div className="text-center">
          <p className="text-2xl font-bold text-white tabular-nums">{total.toLocaleString()}</p>
          <p className="text-[10px] text-gray-500 uppercase tracking-wider">Total</p>
        </div>
      </div>
    </div>
  );
}

export default VehicleDistributionChart;
