/**
 * HourlyTariffChart - 24-hour price distribution visualization
 *
 * Displays:
 * - 24-hour price distribution using AreaChart
 * - Color coding for peak/valley/flat periods
 * - Interactive tooltips
 * - Responsive design
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
  ReferenceLine,
} from 'recharts';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();

  // Prepare data for the chart
  const chartData = useMemo(() => {
    return hourlyPrices.map((item) => ({
      hour: `${item.hour}:00`,
      hourNum: item.hour,
      price: item.price,
      period: item.period,
    }));
  }, [hourlyPrices]);

  // Get color based on period
  const getAreaColor = (period: string) => {
    switch (period) {
      case 'peak':
        return '#ef4444'; // red-500
      case 'valley':
        return '#22c55e'; // green-500
      case 'flat':
      default:
        return '#eab308'; // yellow-500
    }
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
          <p className="text-sm font-medium text-gray-900">{`${t('calculator.tariffDetails.period')}: ${t(`calculator.tariffDetails.period_${data.period}`)}`}</p>
          <p className="text-lg font-bold text-gray-900">
            ¥{data.price.toFixed(3)}/kWh
          </p>
          <p className="text-xs text-gray-500">{data.hour}</p>
        </div>
      );
    }
    return null;
  };

  // Calculate statistics
  const stats = useMemo(() => {
    const prices = hourlyPrices.map((h) => h.price);
    return {
      max: Math.max(...prices),
      min: Math.min(...prices),
      avg: prices.reduce((a, b) => a + b, 0) / prices.length,
      spread: Math.max(...prices) - Math.min(...prices),
    };
  }, [hourlyPrices]);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-xs text-red-600 font-medium">{t('calculator.tariffDetails.peakPrice')}</p>
          <p className="text-xl font-bold text-red-700">¥{stats.max.toFixed(3)}</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <p className="text-xs text-green-600 font-medium">{t('calculator.tariffDetails.valleyPrice')}</p>
          <p className="text-xl font-bold text-green-700">¥{stats.min.toFixed(3)}</p>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <p className="text-xs text-yellow-600 font-medium">{t('common.avg')}</p>
          <p className="text-xl font-bold text-yellow-700">¥{stats.avg.toFixed(3)}</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-xs text-blue-600 font-medium">价差</p>
          <p className="text-xl font-bold text-blue-700">¥{stats.spread.toFixed(3)}</p>
        </div>
      </div>

      {/* Chart */}
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorPeak" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorValley" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorFlat" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#eab308" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#eab308" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
            <XAxis
              dataKey="hour"
              interval={2}
              tick={{ fill: '#6b7280', fontSize: 12 }}
              axisLine={{ stroke: '#d1d5db' }}
            />
            <YAxis
              tick={{ fill: '#6b7280', fontSize: 12 }}
              axisLine={{ stroke: '#d1d5db' }}
              tickFormatter={(value) => `¥${value.toFixed(2)}`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="price"
              stroke="#6366f1"
              strokeWidth={2}
              fill="url(#colorFlat)"
              fillOpacity={0.3}
            />

            {/* Reference lines for peak and valley */}
            <ReferenceLine
              y={stats.max}
              stroke="#ef4444"
              strokeDasharray="3 3"
              label={{
                value: `峰: ¥${stats.max.toFixed(2)}`,
                position: 'topLeft',
                fill: '#ef4444',
                fontSize: 11,
              }}
            />
            <ReferenceLine
              y={stats.min}
              stroke="#22c55e"
              strokeDasharray="3 3"
              label={{
                value: `谷: ¥${stats.min.toFixed(2)}`,
                position: 'bottomLeft',
                fill: '#22c55e',
                fontSize: 11,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center space-x-6 text-sm">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span className="text-gray-600">{t('calculator.tariffDetails.period_peak')}</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-yellow-500" />
          <span className="text-gray-600">{t('calculator.tariffDetails.period_flat')}</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span className="text-gray-600">{t('calculator.tariffDetails.period_valley')}</span>
        </div>
      </div>
    </div>
  );
};

export default HourlyTariffChart;
