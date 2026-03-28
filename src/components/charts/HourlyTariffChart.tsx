/**
 * HourlyTariffChart - 峰谷平时段分布图
 *
 * Displays:
 * - Horizontal time axis showing peak/valley/flat period distribution
 * - Color-coded period blocks
 * - Price information for each period
 * - Time range display
 */

import React, { useMemo } from 'react';
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
  // Group consecutive hours by period
  const periodBlocks = useMemo(() => {
    const blocks: Array<{
      startHour: number;
      endHour: number;
      period: 'peak' | 'valley' | 'flat';
      price: number;
      duration: number;
    }> = [];

    let currentBlock: typeof blocks[0] | null = null;

    for (let i = 0; i < hourlyPrices.length; i++) {
      const hour = hourlyPrices[i].hour;
      const period = hourlyPrices[i].period;
      const price = hourlyPrices[i].price;

      if (!currentBlock) {
        currentBlock = {
          startHour: hour,
          endHour: hour,
          period,
          price,
          duration: 1,
        };
      } else if (period === currentBlock.period) {
        currentBlock.endHour = hour;
        currentBlock.duration = hour - currentBlock.startHour + 1;
      } else {
        blocks.push(currentBlock);
        currentBlock = {
          startHour: hour,
          endHour: hour,
          period,
          price,
          duration: 1,
        };
      }
    }

    if (currentBlock) {
      blocks.push(currentBlock);
    }

    return blocks;
  }, [hourlyPrices]);

  // Get period info
  const getPeriodInfo = (period: string) => {
    switch (period) {
      case 'peak':
        return {
          name: '峰时',
          bgColor: 'bg-red-500',
          bgColorLight: 'bg-red-50',
          borderColor: 'border-red-500',
          textColor: 'text-red-700',
          icon: '⚡',
        };
      case 'valley':
        return {
          name: '谷时',
          bgColor: 'bg-green-500',
          bgColorLight: 'bg-green-50',
          borderColor: 'border-green-500',
          textColor: 'text-green-700',
          icon: '🌙',
        };
      case 'flat':
      default:
        return {
          name: '平时',
          bgColor: 'bg-yellow-500',
          bgColorLight: 'bg-yellow-50',
          borderColor: 'border-yellow-500',
          textColor: 'text-yellow-700',
          icon: '📊',
        };
    }
  };

  // Calculate statistics
  const stats = useMemo(() => {
    const peakBlocks = periodBlocks.filter(b => b.period === 'peak');
    const valleyBlocks = periodBlocks.filter(b => b.period === 'valley');
    const flatBlocks = periodBlocks.filter(b => b.period === 'flat');

    return {
      peakHours: peakBlocks.reduce((sum, b) => sum + b.duration, 0),
      valleyHours: valleyBlocks.reduce((sum, b) => sum + b.duration, 0),
      flatHours: flatBlocks.reduce((sum, b) => sum + b.duration, 0),
      peakPrice: peakBlocks[0]?.price || 0,
      valleyPrice: valleyBlocks[0]?.price || 0,
      flatPrice: flatBlocks[0]?.price || 0,
    };
  }, [periodBlocks]);

  // Format time range
  const formatTimeRange = (start: number, end: number) => {
    return `${start.toString().padStart(2, '0')}:00 - ${(end + 1).toString().padStart(2, '0')}:00`;
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Period Distribution Timeline */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-gray-900 mb-4">
          峰谷平时段分布
        </h4>

        {/* Timeline blocks */}
        <div className="relative">
          {/* Hour markers */}
          <div className="flex justify-between text-xs text-gray-500 mb-2 px-1">
            <span>0:00</span>
            <span>6:00</span>
            <span>12:00</span>
            <span>18:00</span>
            <span>24:00</span>
          </div>

          {/* Period blocks */}
          <div className="flex rounded-lg overflow-hidden border-2 border-gray-200">
            {periodBlocks.map((block, index) => {
              const info = getPeriodInfo(block.period);
              const widthPercentage = (block.duration / 24) * 100;

              return (
                <div
                  key={index}
                  className={`relative ${info.bgColor} hover:opacity-90 transition-opacity cursor-pointer group`}
                  style={{ width: `${widthPercentage}%` }}
                  title={`${info.name}: ${formatTimeRange(block.startHour, block.endHour)} | ¥${block.price.toFixed(3)}/kWh`}
                >
                  {/* Block content */}
                  <div className="h-20 flex flex-col items-center justify-center p-2 text-white">
                    <span className="text-lg font-bold">{info.icon}</span>
                    <span className="text-xs font-semibold mt-1">{info.name}</span>
                    <span className="text-xs mt-0.5 opacity-90">¥{block.price.toFixed(3)}</span>
                  </div>

                  {/* Tooltip on hover */}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                    <div className="font-semibold">{info.name}</div>
                    <div>{formatTimeRange(block.startHour, block.endHour)}</div>
                    <div>电价: ¥{block.price.toFixed(3)}/kWh</div>
                    <div>时长: {block.duration}小时</div>
                    {/* Arrow */}
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Hour tick marks */}
          <div className="flex justify-between mt-1 px-1">
            {[0, 6, 12, 18, 24].map((hour) => (
              <div key={hour} className="w-px h-2 bg-gray-400" />
            ))}
          </div>
        </div>
      </div>

      {/* Period Details Cards */}
      <div className="grid grid-cols-3 gap-4 mt-6">
        {periodBlocks.map((block, index) => {
          const info = getPeriodInfo(block.period);
          const percentage = ((block.duration / 24) * 100).toFixed(1);

          return (
            <div
              key={index}
              className={`${info.bgColorLight} ${info.borderColor} border-2 rounded-lg p-4 transition-all hover:shadow-md`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className={`text-2xl`}>{info.icon}</span>
                <span className={`text-xs font-semibold ${info.textColor} px-2 py-1 rounded-full ${info.bgColor} text-white`}>
                  {percentage}%
                </span>
              </div>

              <h5 className={`font-bold ${info.textColor} text-lg mb-2`}>
                {info.name}
              </h5>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">时间</span>
                  <span className="font-medium text-gray-900">
                    {formatTimeRange(block.startHour, block.endHour)}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">电价</span>
                  <span className={`font-bold ${info.textColor}`}>
                    ¥{block.price.toFixed(3)}/kWh
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">时长</span>
                  <span className="font-medium text-gray-900">
                    {block.duration}小时
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary Statistics */}
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <div className="grid grid-cols-4 gap-4 text-center">
          <div>
            <p className="text-xs text-gray-500 mb-1">峰谷比</p>
            <p className="text-lg font-bold text-gray-900">
              {stats.peakPrice > 0 ? (stats.peakPrice / stats.valleyPrice).toFixed(2) : '-'}
            </p>
          </div>

          <div>
            <p className="text-xs text-gray-500 mb-1">价差</p>
            <p className="text-lg font-bold text-gray-900">
              ¥{(stats.peakPrice - stats.valleyPrice).toFixed(3)}
            </p>
          </div>

          <div>
            <p className="text-xs text-gray-500 mb-1">平均电价</p>
            <p className="text-lg font-bold text-gray-900">
              ¥{((stats.peakPrice * stats.peakHours + stats.valleyPrice * stats.valleyHours + stats.flatPrice * stats.flatHours) / 24).toFixed(3)}
            </p>
          </div>

          <div>
            <p className="text-xs text-gray-500 mb-1">套利空间</p>
            <p className="text-lg font-bold text-green-600">
              ¥{(stats.peakPrice - stats.valleyPrice).toFixed(3)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HourlyTariffChart;
