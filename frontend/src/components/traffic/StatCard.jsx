import React from 'react';
import { Card } from 'antd';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

/**
 * StatCard - Thẻ thống kê nhỏ gọn
 * 
 * Props:
 *   title    - Label (e.g. "Total Vehicles")
 *   value    - Numeric value
 *   suffix   - Unit text (e.g. "vehicles")
 *   icon     - React node (lucide icon)
 *   color    - Accent color class (tailwind)
 *   trend    - Percent change vs previous period (positive = up)
 *   loading  - Show skeleton
 */
function StatCard({ title, value, suffix, icon, color = 'cyan', trend, loading }) {
  const colorMap = {
    cyan: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/20' },
    blue: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
    green: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
    amber: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' },
    red: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20' },
  };
  const c = colorMap[color] || colorMap.cyan;

  const trendUp = trend > 0;
  const trendIcon = trendUp
    ? <ArrowUpRight size={14} />
    : <ArrowDownRight size={14} />;
  const trendColor = trendUp ? 'text-emerald-400' : 'text-red-400';

  return (
    <div className={`bg-[#1e2028] rounded-xl border ${c.border} p-4 flex flex-col gap-2`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
          {title}
        </span>
        <div className={`w-8 h-8 rounded-lg ${c.bg} flex items-center justify-center ${c.text}`}>
          {icon}
        </div>
      </div>

      {/* Value */}
      <div className="flex items-end gap-2">
        <span className="text-2xl font-bold text-white tabular-nums">
          {loading ? '—' : value?.toLocaleString()}
        </span>
        {suffix && (
          <span className="text-xs text-gray-500 pb-1">{suffix}</span>
        )}
      </div>

      {/* Trend */}
      {trend !== undefined && trend !== null && (
        <div className={`flex items-center gap-1 text-xs ${trendColor}`}>
          {trendIcon}
          <span>{Math.abs(trend)}% vs previous period</span>
        </div>
      )}
    </div>
  );
}

export default StatCard;
