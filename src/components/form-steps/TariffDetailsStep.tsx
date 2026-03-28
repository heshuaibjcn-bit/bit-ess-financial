/**
 * TariffDetailsStep - Step 2: Time-of-Use Tariff Details
 *
 * Features:
 * - Auto-load tariffs by province and voltage level
 * - Manual tariff type selection
 * - Real-time tariff data from reliable sources
 * - Manual update capability
 * - Clear information hierarchy without duplication
 */

import React, { useState, useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import HourlyTariffChart from '../charts/HourlyTariffChart';
import { type HourlyPrice } from '../../domain/schemas/ProjectSchema';
import { getTariffService } from '../../services/tariffDataService';
import TariffUpdateButton from '../TariffUpdateButton';
import { type TariffType } from '../../domain/schemas/ProjectSchema';

const TARIFF_TYPE_OPTIONS: Array<{ value: TariffType; label: string; description: string }> = [
  {
    value: 'industrial',
    label: '一般工商业',
    description: '不满1千伏工商业用电'
  },
  {
    value: 'large_industrial',
    label: '大工业',
    description: '1千伏及以上大工业用电'
  },
  {
    value: 'agricultural',
    label: '农业',
    description: '农业生产用电'
  },
  {
    value: 'residential',
    label: '居民',
    description: '居民生活用电'
  }
];

export const TariffDetailsStep: React.FC = () => {
  const { register, watch, setValue } = useFormContext();
  const tariffService = getTariffService();

  // Watch province from project location, voltage level, and tariff type
  const province = watch('ownerInfo.projectLocation') || 'guangdong';
  const voltageLevel = watch('facilityInfo.voltageLevel') || '0.4kV';
  const tariffType = watch('tariffDetail.tariffType');

  // State for hourly prices
  const [hourlyPrices, setHourlyPrices] = useState<HourlyPrice[]>([]);
  const [currentTariff, setCurrentTariff] = useState<any>(null);
  const [isAutoFilled, setIsAutoFilled] = useState(false);
  const [isUserChanged, setIsUserChanged] = useState(false);

  /**
   * 根据电压等级自动选择电价类型
   */
  useEffect(() => {
    if (voltageLevel && !tariffType && !isUserChanged) {
      const recommendedType = tariffService.getRecommendedTariffType(voltageLevel);
      setValue('tariffDetail.tariffType', recommendedType);
      setIsAutoFilled(true);
    }
  }, [voltageLevel, tariffType, setValue, isUserChanged]);

  /**
   * 加载电价数据
   */
  useEffect(() => {
    if (!province || !voltageLevel) {
      return;
    }

    try {
      // 获取电价信息
      const tariff = tariffService.getTariffByVoltage(province as any, voltageLevel);
      if (tariff) {
        setCurrentTariff(tariff);

        // 生成24小时电价分布
        const prices = tariffService.generateHourlyPrices(province as any, voltageLevel);
        setHourlyPrices(prices);

        // 更新表单字段
        setValue('tariffDetail.peakPrice', tariff.peakPrice);
        setValue('tariffDetail.valleyPrice', tariff.valleyPrice);
        setValue('tariffDetail.flatPrice', tariff.flatPrice);
        setValue('tariffDetail.hourlyPrices', prices);
      }
    } catch (e) {
      console.error('Failed to load tariff data:', e);
    }
  }, [province, voltageLevel, setValue]);

  /**
   * 手动更新电价数据后刷新
   */
  const handleTariffUpdated = () => {
    if (province && voltageLevel) {
      const tariff = tariffService.getTariffByVoltage(province as any, voltageLevel);
      if (tariff) {
        setCurrentTariff(tariff);
        const prices = tariffService.generateHourlyPrices(province as any, voltageLevel);
        setHourlyPrices(prices);

        setValue('tariffDetail.peakPrice', tariff.peakPrice);
        setValue('tariffDetail.valleyPrice', tariff.valleyPrice);
        setValue('tariffDetail.flatPrice', tariff.flatPrice);
        setValue('tariffDetail.hourlyPrices', prices);
      }
    }
  };

  /**
   * 处理电价类型选择
   */
  const handleTariffTypeChange = (value: TariffType) => {
    setValue('tariffDetail.tariffType', value);
    setIsUserChanged(true);
    setIsAutoFilled(false);
  };

  // Calculate statistics
  const stats = hourlyPrices.length > 0 ? {
    avg: hourlyPrices.reduce((sum, h) => sum + h.price, 0) / hourlyPrices.length,
    spread: Math.max(...hourlyPrices.map(h => h.price)) - Math.min(...hourlyPrices.map(h => h.price)),
    peakValleyRatio: currentTariff ? currentTariff.peakPrice / currentTariff.valleyPrice : 0,
  } : null;

  // Get voltage level description
  const getVoltageDescription = (voltage: string) => {
    switch (voltage) {
      case '0.4kV':
        return '低压（不满1千伏）';
      case '10kV':
        return '高压（1-10千伏）';
      case '35kV':
        return '超高压（35千伏及以上）';
      default:
        return voltage;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with update button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            电价信息
          </h3>
          <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
            {currentTariff ? (
              <>
                <span>{currentTariff.name}</span>
                <span className="text-gray-300">|</span>
                <span>生效日期：{currentTariff.effectiveDate}</span>
              </>
            ) : (
              '加载中...'
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Voltage level indicator */}
          {voltageLevel && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
              {getVoltageDescription(voltageLevel)}
            </span>
          )}

          <TariffUpdateButton onUpdated={handleTariffUpdated} />
        </div>
      </div>

      {/* Tariff Type Selection */}
      <div className="bg-white border border-gray-200 rounded-lg p-5">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          电价模式
        </label>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {TARIFF_TYPE_OPTIONS.map((option) => {
            const isSelected = tariffType === option.value;
            const isRecommended = !isUserChanged && option.value === tariffService.getRecommendedTariffType(voltageLevel);

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => handleTariffTypeChange(option.value)}
                className={`
                  relative p-4 rounded-lg border-2 text-left transition-all
                  ${isSelected
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }
                `}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`font-medium ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                        {option.label}
                      </span>
                      {isRecommended && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                          推荐
                        </span>
                      )}
                    </div>
                    <p className={`text-xs mt-1 ${isSelected ? 'text-blue-700' : 'text-gray-500'}`}>
                      {option.description}
                    </p>
                  </div>

                  {isSelected && (
                    <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 001.414-1.414l-2-2a1 1 0 00-1.414 0L4 9.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a2 2 0 002 2h3a1 1 0 001-1V9.414l-1.293-1.293z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Price Overview - Simplified */}
      {currentTariff && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-red-50 border-l-4 border-red-500 rounded-r-lg p-4">
            <p className="text-xs font-medium text-red-900 mb-1">峰时电价</p>
            <p className="text-2xl font-bold text-red-700">
              ¥{currentTariff.peakPrice.toFixed(3)}
            </p>
          </div>

          <div className="bg-yellow-50 border-l-4 border-yellow-500 rounded-r-lg p-4">
            <p className="text-xs font-medium text-yellow-900 mb-1">平时电价</p>
            <p className="text-2xl font-bold text-yellow-700">
              ¥{currentTariff.flatPrice.toFixed(3)}
            </p>
          </div>

          <div className="bg-green-50 border-l-4 border-green-500 rounded-r-lg p-4">
            <p className="text-xs font-medium text-green-900 mb-1">谷时电价</p>
            <p className="text-2xl font-bold text-green-700">
              ¥{currentTariff.valleyPrice.toFixed(3)}
            </p>
          </div>
        </div>
      )}

      {/* 24-Hour Price Visualization */}
      {hourlyPrices.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="text-sm font-semibold text-gray-900 mb-4">
            时段分布与电价走势
          </h4>
          <HourlyTariffChart hourlyPrices={hourlyPrices} />
        </div>
      )}

      {/* Summary Statistics */}
      {stats && currentTariff && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-xs text-gray-500 mb-1">平均电价</p>
            <p className="text-lg font-bold text-gray-900">¥{stats.avg.toFixed(3)}</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-xs text-gray-500 mb-1">峰谷价差</p>
            <p className="text-lg font-bold text-gray-900">¥{stats.spread.toFixed(3)}</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-xs text-gray-500 mb-1">峰谷比</p>
            <p className="text-lg font-bold text-gray-900">{stats.peakValleyRatio.toFixed(2)}x</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-xs text-gray-500 mb-1">套利空间</p>
            <p className="text-lg font-bold text-green-600">¥{stats.spread.toFixed(3)}</p>
          </div>
        </div>
      )}

      {/* Policy Information */}
      {currentTariff?.policyNumber && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
          <p className="text-xs text-gray-500">
            政策文件：{currentTariff.policyNumber}
          </p>
        </div>
      )}

      {/* Hidden inputs */}
      <input type="hidden" {...register('tariffDetail.tariffType')} />
      <input type="hidden" {...register('tariffDetail.peakPrice')} />
      <input type="hidden" {...register('tariffDetail.valleyPrice')} />
      <input type="hidden" {...register('tariffDetail.flatPrice')} />
      <input type="hidden" {...register('tariffDetail.hourlyPrices')} />
    </div>
  );
};

export default TariffDetailsStep;
