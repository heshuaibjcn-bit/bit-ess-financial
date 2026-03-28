/**
 * HourlyTariffChart - 24-hour price distribution visualization
 *
 * Displays:
 * - 24-hour price distribution using AreaChart
 * - Background color regions for peak/valley/flat periods
 * - Period distribution timeline
 * - Period detail cards
 */

import React, { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceArea,
  ReferenceLine,
} from 'recharts';
import { type HourlyPrice } from '../../domain/schemas/ProjectSchema';

interface HourlyTariffChartProps {
  hourlyPrices: HourlyPrice[];
  height?: number;
  className?: string;
}

export const HourlyTariffChart: React.FC<HourlyTariffChartProps> = ({
  hourlyPrices,
  height = 300,
  className = '',
}) => {
  // Prepare data for the chart
  const chartData = useMemo(() => {
    return hourlyPrices.map((item) => ({
      hour: `${item.hour}:00`,
      hourNum: item.hour,
      price: item.price,
      period: item.period,
    }));
  }, [hourlyPrices]);

  // Group consecutive hours by period
  const periodRegions = useMemo(() => {
    const regions: Array<{ start: number; end: number; period: 'peak' | 'valley' | 'flat' }> = [];
    let currentRegion: typeof regions[0] | null = null;

    for (let i = 0; i < hourlyPrices.length; i++) {
      const hour = hourlyPrices[i].hour;
      const period = hourlyPrices[i].period;

      if (!currentRegion) {
        currentRegion = { start: hour, end: hour, period };
      } else if (period === currentRegion.period) {
        currentRegion.end = hour;
      } else {
        regions.push(currentRegion);
        currentRegion = { start: hour, end: hour, period };
      }
    }

    if (currentRegion) {
      regions.push(currentRegion);
    }

    return regions;
  }, [hourlyPrices]);

  // Helper functions
  const getPeriodBackgroundColor = (period: string) => {
    switch (period) {
      case 'peak': return 'rgba(239, 68, 68, 0.08)';
      case 'valley': return 'rgba(34, 197, 94, 0.08)';
      case 'flat':
      default: return 'rgba(234, 179, 8, 0.08)';
    }
  };

  const getPeriodLabelColor = (period: string) => {
    switch (period) {
      case 'peak': return '#ef4444';
      case 'valley': return '#22c55e';
      case 'flat':
      default: return '#eab308';
    }
  };

  const getPeriodName = (period: string) => {
    switch (period) {
      case 'peak': return '峰时';
      case 'valley': return '谷时';
      case 'flat':
      default: return '平时';
    }
  };

  const getPeriodIcon = (period: string) => {
    switch (period) {
      case 'peak': return '⚡';
      case 'valley': return '🌙';
      case 'flat':
      default: return '📊';
    }
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const periodName = getPeriodName(data.period);
      const periodColor = getPeriodLabelColor(data.period);

      return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
          <p className="text-sm font-medium" style={{ color: periodColor }}>
            {periodName}电价
          </p>
          <p className="text-lg font-bold text-gray-900">
            ¥{data.price.toFixed(3)}/kWh
          </p>
          <p className="text-xs text-gray-500">{data.hour}</p>
        </div>
      );
    }
    return null;
  };

  // Format time range
  const formatTimeRange = (start: number, end: number) => {
    return `${start.toString().padStart(2, '0')}:00 - ${(end + 1).toString().padStart(2, '0')}:00`;
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 24-Hour Price Curve */}
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 40 }}>
            <defs>
              <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
            <XAxis
              dataKey="hour"
              interval={2}
              tick={{ fill: '#6b7280', fontSize: 11 }}
              axisLine={{ stroke: '#d1d5db' }}
              label={{ value: '时间', position: 'insideBottom', offset: -15, fill: '#6b7280', fontSize: 12 }}
            />
            <YAxis
              tick={{ fill: '#6b7280', fontSize: 11 }}
              axisLine={{ stroke: '#d1d5db' }}
              tickFormatter={(value) => `¥${value.toFixed(2)}`}
              label={{ value: '电价 (¥/kWh)', angle: -90, position: 'insideLeft', fill: '#6b7280', fontSize: 12 }}
            />
            <Tooltip content={<CustomTooltip />} />

            {/* Background regions for periods */}
            {periodRegions.map((region, index) => (
              <ReferenceArea
                key={index}
                x1={region.start}
                x2={region.end + 1}
                fill={getPeriodBackgroundColor(region.period)}
                stroke="none"
              />
            ))}

            {/* Period labels */}
            {periodRegions.map((region, index) => {
              const midHour = (region.start + region.end) / 2;
              const periodName = getPeriodName(region.period);
              const periodColor = getPeriodLabelColor(region.period);

              return (
                <ReferenceLine
                  key={`label-${index}`}
                  x={midHour}
                  stroke="none"
                  label={{
                    value: periodName,
                    position: 'top',
                    fill: periodColor,
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                />
              );
            })}

            {/* Vertical separators */}
            {periodRegions.slice(1).map((region, index) => (
              <ReferenceLine
                key={`separator-${index}`}
                x={region.start}
                stroke="#9ca3af"
                strokeDasharray="2 2"
                strokeWidth={1}
              />
            ))}

            {/* Price area */}
            <Area
              type="monotone"
              dataKey="price"
              stroke="#6366f1"
              strokeWidth={2.5}
              fill="url(#colorPrice)"
              fillOpacity={0.4}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Period Distribution Timeline */}
      <div>
        <div className="relative">
          <div className="flex justify-between text-xs text-gray-500 mb-2 px-1">
            <span>0:00</span>
            <span>6:00</span>
            <span>12:00</span>
            <span>18:00</span>
            <span>24:00</span>
          </div>

          <div className="flex rounded-lg overflow-hidden border-2 border-gray-200">
            {periodRegions.map((region, index) => {
              const periodColor = getPeriodLabelColor(region.period);
              const periodName = getPeriodName(region.period);
              const periodIcon = getPeriodIcon(region.period);
              const duration = region.end - region.start + 1;
              const widthPercentage = (duration / 24) * 100;
              const price = hourlyPrices.find(h => h.hour === region.start)?.price || 0;

              const bgColorClass = region.period === 'peak' ? 'bg-red-500' :
                                  region.period === 'valley' ? 'bg-green-500' :
                                  'bg-yellow-500';

              return (
                <div
                  key={index}
                  className={`${bgColorClass} hover:opacity-90 transition-opacity cursor-pointer group relative`}
                  style={{ width: `${widthPercentage}%` }}
                  title={`${periodName}: ${formatTimeRange(region.start, region.end)} | ¥${price.toFixed(3)}/kWh`}
                >
                  <div className="h-14 flex flex-col items-center justify-center p-1 text-white">
                    <span className="text-lg">{periodIcon}</span>
                    <span className="text-xs font-semibold">{periodName}</span>
                  </div>

                  {/* Hover tooltip */}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                    <div className="font-semibold">{periodName}</div>
                    <div>{formatTimeRange(region.start, region.end)}</div>
                    <div>电价: ¥{price.toFixed(3)}/kWh</div>
                    <div>时长: {duration}小时</div>
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-between mt-1 px-1">
            {[0, 6, 12, 18, 24].map((hour) => (
              <div key={hour} className="w-px h-2 bg-gray-400" />
            ))}
          </div>
        </div>
      </div>

      {/* Period Detail Cards */}
      <div className="grid grid-cols-3 gap-4">
        {periodRegions.map((region, index) => {
          const periodInfo = {
            peak: {
              name: '峰时',
              bgColor: 'bg-red-500',
              bgColorLight: 'bg-red-50',
              borderColor: 'border-red-500',
              textColor: 'text-red-700',
              icon: '⚡'
            },
            valley: {
              name: '谷时',
              bgColor: 'bg-green-500',
              bgColorLight: 'bg-green-50',
              borderColor: 'border-green-500',
              textColor: 'text-green-700',
              icon: '🌙'
            },
            flat: {
              name: '平时',
              bgColor: 'bg-yellow-500',
              bgColorLight: 'bg-yellow-50',
              borderColor: 'border-yellow-500',
              textColor: 'text-yellow-700',
              icon: '📊'
            },
          }[region.period];

          const duration = region.end - region.start + 1;
          const percentage = ((duration / 24) * 100).toFixed(1);
          const price = hourlyPrices.find(h => h.hour === region.start)?.price || 0;

          return (
            <div
              key={index}
              className={`${periodInfo.bgColorLight} ${periodInfo.borderColor} border rounded-lg p-4`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-2xl">{periodInfo.icon}</span>
                <span className={`text-xs font-semibold ${periodInfo.textColor} px-2 py-1 rounded-full bg-opacity-90`}>
                  {percentage}%
                </span>
              </div>

              <h5 className={`font-bold ${periodInfo.textColor} text-lg mb-2`}>
                {periodInfo.name}
              </h5>

              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">时间</span>
                  <span className="font-medium text-gray-900">
                    {formatTimeRange(region.start, region.end)}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">电价</span>
                  <span className={`font-bold ${periodInfo.textColor}`}>
                    ¥{price.toFixed(3)}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">时长</span>
                  <span className="font-medium text-gray-900">
                    {duration}小时
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default HourlyTariffChart;
