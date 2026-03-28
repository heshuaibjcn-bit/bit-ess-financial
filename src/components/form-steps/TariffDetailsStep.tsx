/**
 * TariffDetailsStep - Step 2: Time-of-Use Tariff Details
 *
 * Features:
 * - Auto-load tariffs by province and voltage level
 * - Real-time tariff data from reliable sources
 * - Manual update capability
 * - Voltage level-based tariff type selection
 * - 24-hour price distribution chart
 */

import React, { useState, useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useAllProvinces } from '../../hooks/useProvince';
import HourlyTariffChart from '../charts/HourlyTariffChart';
import { TARIFF_TYPES, type HourlyPrice, type TariffType, VOLTAGE_LEVELS } from '../../domain/schemas/ProjectSchema';
import { getTariffService } from '../../services/tariffDataService';
import TariffUpdateButton from '../TariffUpdateButton';

export const TariffDetailsStep: React.FC = () => {
  const { t } = useTranslation();
  const { register, watch, setValue, formState: { errors } } = useFormContext();
  const { provinces, loading: loadingProvinces } = useAllProvinces();
  const tariffService = getTariffService();

  // Watch province, voltage level, and tariff type
  const province = watch('province') || 'guangdong';
  const voltageLevel = watch('facilityInfo.voltageLevel') || '0.4kV';
  const tariffType = watch('tariffDetail.tariffType');

  // State for hourly prices
  const [hourlyPrices, setHourlyPrices] = useState<HourlyPrice[]>([]);
  const [currentTariff, setCurrentTariff] = useState<any>(null);
  const [isAutoFilled, setIsAutoFilled] = useState(false);

  /**
   * 根据电压等级自动选择电价类型
   */
  useEffect(() => {
    if (voltageLevel && !tariffType) {
      const recommendedType = tariffService.getRecommendedTariffType(voltageLevel);
      setValue('tariffDetail.tariffType', recommendedType);
      setIsAutoFilled(true);
    }
  }, [voltageLevel, tariffType, setValue]);

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

        // 如果电价类型与电压等级不匹配，更新它
        if (tariff.tariffType !== tariffType) {
          setValue('tariffDetail.tariffType', tariff.tariffType);
        }
      }
    } catch (e) {
      console.error('Failed to load tariff data:', e);
    }
  }, [province, voltageLevel, tariffType, setValue]);

  /**
   * 手动更新电价数据后刷新
   */
  const handleTariffUpdated = () => {
    // 重新加载电价数据
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

  // Calculate price spread
  const priceSpread = hourlyPrices.length > 0 ? (
    Math.max(...hourlyPrices.map(h => h.price)) - Math.min(...hourlyPrices.map(h => h.price))
  ) : 0;

  // Get current tariff type display
  const currentTariffType = TARIFF_TYPES.find(
    (type) => type.value === watch('tariffDetail.tariffType')
  );

  return (
    <div className="space-y-6">
      {/* Header with update button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {t('tariff.title', { defaultValue: '电价信息' })}
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            {currentTariff ? (
              <>
                {currentTariff.name} · {t('tariff.effectiveDate', { defaultValue: '生效日期' })}：{currentTariff.effectiveDate}
              </>
            ) : (
              t('tariff.loading', { defaultValue: '加载中...' })
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Auto-filled indicator */}
          {isAutoFilled && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 001.414-1.414l-2-2a1 1 0 00-1.414 0L4 9.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a2 2 0 002 2h3a1 1 0 001-1V9.414l-1.293-1.293z" clipRule="evenodd" />
              </svg>
              {t('tariff.autoFilled', { defaultValue: '已根据电压等级自动选择' })}
            </span>
          )}

          <TariffUpdateButton onUpdated={handleTariffUpdated} />
        </div>
      </div>

      {/* Tariff type notice */}
      {currentTariff && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-blue-400 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-900">
                {t('tariff.typeInfo', { defaultValue: '电价类型说明' })}
              </p>
              <p className="text-xs text-blue-800 mt-1">
                {voltageLevel === '0.4kV' && t('tariff.voltage0.4kV', { defaultValue: '低压（不满1千伏）：适用于一般工商业用电' })}
                {voltageLevel === '10kV' && t('tariff.voltage10kV', { defaultValue: '高压（1-10千伏）：适用于大工业用电' })}
                {voltageLevel === '35kV' && t('tariff.voltage35kV', { defaultValue: '超高压（35千伏及以上）：适用于大型工业用电' })}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Price Overview Cards */}
      {hourlyPrices.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Peak Price */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-red-900">
                {t('tariff.peakPrice', { defaultValue: '峰时电价' })}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-red-200 text-red-800">
                {t('tariff.peak', { defaultValue: '峰' })}
              </span>
            </div>
            <p className="text-2xl font-bold text-red-700">
              ¥{currentTariff?.peakPrice.toFixed(4) || '-'} / kWh
            </p>
            <p className="text-xs text-red-600 mt-1">
              {hourlyPrices.filter(p => p.period === 'peak').length} {t('tariff.hours', { defaultValue: '小时' })}
            </p>
          </div>

          {/* Flat Price */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-yellow-900">
                {t('tariff.flatPrice', { defaultValue: '平时电价' })}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-200 text-yellow-800">
                {t('tariff.flat', { defaultValue: '平' })}
              </span>
            </div>
            <p className="text-2xl font-bold text-yellow-700">
              ¥{currentTariff?.flatPrice.toFixed(4) || '-'} / kWh
            </p>
            <p className="text-xs text-yellow-600 mt-1">
              {hourlyPrices.filter(p => p.period === 'flat').length} {t('tariff.hours', { defaultValue: '小时' })}
            </p>
          </div>

          {/* Valley Price */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-green-900">
                {t('tariff.valleyPrice', { defaultValue: '谷时电价' })}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-green-200 text-green-800">
                {t('tariff.valley', { defaultValue: '谷' })}
              </span>
            </div>
            <p className="text-2xl font-bold text-green-700">
              ¥{currentTariff?.valleyPrice.toFixed(4) || '-'} / kWh
            </p>
            <p className="text-xs text-green-600 mt-1">
              {hourlyPrices.filter(p => p.period === 'valley').length} {t('tariff.hours', { defaultValue: '小时' })}
            </p>
          </div>
        </div>
      )}

      {/* 24-Hour Price Chart */}
      {hourlyPrices.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="text-sm font-semibold text-gray-900 mb-4">
            {t('tariff.hourlyDistribution', { defaultValue: '24小时电价分布' })}
          </h4>
          <HourlyTariffChart data={hourlyPrices} />
        </div>
      )}

      {/* Price Statistics */}
      {hourlyPrices.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
            <p className="text-xs text-gray-500 mb-1">
              {t('tariff.avgPrice', { defaultValue: '平均电价' })}
            </p>
            <p className="text-lg font-semibold text-gray-900">
              ¥{(hourlyPrices.reduce((sum, h) => sum + h.price, 0) / hourlyPrices.length).toFixed(4)}
            </p>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
            <p className="text-xs text-gray-500 mb-1">
              {t('tariff.priceSpread', { defaultValue: '价差' })}
            </p>
            <p className="text-lg font-semibold text-gray-900">
              ¥{priceSpread.toFixed(4)}
            </p>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
            <p className="text-xs text-gray-500 mb-1">
              {t('tariff.peakValleyRatio', { defaultValue: '峰谷比' })}
            </p>
            <p className="text-lg font-semibold text-gray-900">
              {currentTariff ? (currentTariff.peakPrice / currentTariff.valleyPrice).toFixed(2) : '-'}
            </p>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
            <p className="text-xs text-gray-500 mb-1">
              {t('tariff.shavingPotential', { defaultValue: '套利空间' })}
            </p>
            <p className="text-lg font-semibold text-green-600">
              ¥{priceSpread.toFixed(4)}
            </p>
          </div>
        </div>
      )}

      {/* Policy Info */}
      {currentTariff?.policyNumber && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <p className="text-xs text-gray-500">
            {t('tariff.policyReference', { defaultValue: '政策文件' })}：{currentTariff.policyNumber}
          </p>
        </div>
      )}

      {/* Hidden input for tariff type */}
      <input
        type="hidden"
        {...register('tariffDetail.tariffType')}
      />

      {/* Hidden inputs for prices */}
      <input
        type="hidden"
        {...register('tariffDetail.peakPrice')}
      />
      <input
        type="hidden"
        {...register('tariffDetail.valleyPrice')}
      />
      <input
        type="hidden"
        {...register('tariffDetail.flatPrice')}
      />

      {/* Hidden input for hourly prices */}
      <input
        type="hidden"
        {...register('tariffDetail.hourlyPrices')}
      />
    </div>
  );
};

export default TariffDetailsStep;
