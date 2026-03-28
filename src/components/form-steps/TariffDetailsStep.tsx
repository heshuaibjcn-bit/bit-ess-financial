/**
 * TariffDetailsStep - Step 2: Time-of-Use Tariff Details
 *
 * Displays:
 * - Province selection (auto-load tariffs)
 * - Tariff type selection
 * - Peak/valley/flat price display
 * - 24-hour price distribution chart
 * - Price table with hourly breakdown
 */

import React, { useState, useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useAllProvinces } from '../../hooks/useProvince';
import HourlyTariffChart from '../charts/HourlyTariffChart';
import { TARIFF_TYPES, type HourlyPrice, type TariffType } from '../../domain/schemas/ProjectSchema';

// Mock data for hourly prices - in production, this would come from the province data
const generateMockHourlyPrices = (tariffType: TariffType): HourlyPrice[] => {
  const prices: HourlyPrice[] = [];

  // Define periods based on Chinese TOU tariff structure
  const getPeriod = (hour: number): 'peak' | 'valley' | 'flat' => {
    if (tariffType === 'industrial' || tariffType === 'commercial') {
      // Industrial/Commercial TOU structure
      if ((hour >= 8 && hour <= 11) || (hour >= 14 && hour <= 17) || (hour >= 19 && hour <= 21)) {
        return 'peak';
      } else if (hour >= 23 || hour <= 6) {
        return 'valley';
      } else {
        return 'flat';
      }
    } else {
      // Large industrial structure
      if ((hour >= 8 && hour <= 11) || (hour >= 14 && hour <= 17) || (hour >= 19 && hour <= 21)) {
        return 'peak';
      } else if (hour >= 23 || hour <= 7) {
        return 'valley';
      } else {
        return 'flat';
      }
    }
  };

  // Base prices by tariff type (¥/kWh)
  const basePrices = {
    peak: tariffType === 'large_industrial' ? 1.2 : tariffType === 'industrial' ? 1.0 : 1.1,
    flat: tariffType === 'large_industrial' ? 0.65 : tariffType === 'industrial' ? 0.6 : 0.65,
    valley: tariffType === 'large_industrial' ? 0.35 : tariffType === 'industrial' ? 0.4 : 0.38,
  };

  for (let hour = 0; hour < 24; hour++) {
    const period = getPeriod(hour);
    prices.push({
      hour,
      price: basePrices[period] + (Math.random() * 0.05 - 0.025), // Add slight variation
      period,
    });
  }

  return prices;
};

export const TariffDetailsStep: React.FC = () => {
  const { t } = useTranslation();
  const { register, watch, setValue, formState: { errors } } = useFormContext();
  const { provinces, loading: loadingProvinces } = useAllProvinces();

  // Watch province and tariff type
  const province = watch('province');
  const tariffType = watch('tariffDetail.tariffType') || 'industrial';

  // State for hourly prices
  const [hourlyPrices, setHourlyPrices] = useState<HourlyPrice[]>([]);

  // Generate hourly prices when tariff type changes
  useEffect(() => {
    const prices = generateMockHourlyPrices(tariffType);
    setHourlyPrices(prices);

    // Calculate and set peak/valley/flat prices
    const peakPrices = prices.filter(p => p.period === 'peak').map(p => p.price);
    const valleyPrices = prices.filter(p => p.period === 'valley').map(p => p.price);
    const flatPrices = prices.filter(p => p.period === 'flat').map(p => p.price);

    const avgPeak = peakPrices.reduce((a, b) => a + b, 0) / peakPrices.length;
    const avgValley = valleyPrices.reduce((a, b) => a + b, 0) / valleyPrices.length;
    const avgFlat = flatPrices.reduce((a, b) => a + b, 0) / flatPrices.length;

    setValue('tariffDetail.peakPrice', avgPeak);
    setValue('tariffDetail.valleyPrice', avgValley);
    setValue('tariffDetail.flatPrice', avgFlat);
    setValue('tariffDetail.hourlyPrices', prices);
  }, [tariffType, setValue]);

  // Calculate price spread
  const priceSpread = hourlyPrices.length > 0 ? (
    Math.max(...hourlyPrices.map(h => h.price)) - Math.min(...hourlyPrices.map(h => h.price))
  ) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {t('calculator.title')} - {t('calculator.steps.tariffDetails')}
        </h3>
        <p className="text-sm text-gray-600">
          {t('calculator.tariffDetails.description')}
        </p>
      </div>

      {/* Province and Tariff Type */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Province Selection */}
        <div>
          <label htmlFor="province" className="block text-sm font-medium text-gray-700 mb-2">
            {t('calculator.basic.province')} <span className="text-red-500">*</span>
          </label>
          <select
            id="province"
            {...register('province')}
            disabled={loadingProvinces}
            className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.province ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            {loadingProvinces ? (
              <option value="">{t('common.loading')}...</option>
            ) : (
              provinces.map((prov) => (
                <option key={prov.code} value={prov.code}>
                  {prov.name} ({prov.nameEn})
                </option>
              ))
            )}
          </select>
          {errors.province && (
            <p className="mt-1 text-sm text-red-600">{errors.province.message}</p>
          )}
        </div>

        {/* Tariff Type */}
        <div>
          <label htmlFor="tariffType" className="block text-sm font-medium text-gray-700 mb-2">
            {t('calculator.tariffDetails.tariffType')} <span className="text-red-500">*</span>
          </label>
          <select
            id="tariffType"
            {...register('tariffDetail.tariffType')}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {TARIFF_TYPES.map((type) => (
              <option key={type} value={type}>
                {t(`calculator.tariffDetails.tariffType_${type}`)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Price Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-800">
                {t('calculator.tariffDetails.period_peak')}
              </p>
              <p className="text-2xl font-bold text-red-900 mt-1">
                ¥{watch('tariffDetail.peakPrice')?.toFixed(3) || '-'}
              </p>
            </div>
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-800">
                {t('calculator.tariffDetails.period_valley')}
              </p>
              <p className="text-2xl font-bold text-green-900 mt-1">
                ¥{watch('tariffDetail.valleyPrice')?.toFixed(3) || '-'}
              </p>
            </div>
            <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
            </svg>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-800">价差</p>
              <p className="text-2xl font-bold text-blue-900 mt-1">
                ¥{priceSpread.toFixed(3)}
              </p>
            </div>
            <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
            </svg>
          </div>
        </div>
      </div>

      {/* 24-Hour Price Distribution Chart */}
      <div className="border border-gray-200 rounded-lg p-4">
        <h4 className="text-md font-medium text-gray-800 mb-4">
          {t('calculator.tariffDetails.priceDistribution')}
        </h4>
        {hourlyPrices.length > 0 ? (
          <HourlyTariffChart hourlyPrices={hourlyPrices} height={350} />
        ) : (
          <div className="flex items-center justify-center h-64 text-gray-400">
            {t('common.loading')}...
          </div>
        )}
      </div>

      {/* Hourly Price Table */}
      <div className="border border-gray-200 rounded-lg p-4">
        <h4 className="text-md font-medium text-gray-800 mb-4">
          {t('calculator.tariffDetails.hourlyPrices')}
        </h4>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  时间
                </th>
                {Array.from({ length: 24 }, (_, i) => (
                  <th key={i} className="px-2 py-2 text-center text-xs font-medium text-gray-500">
                    {i}:00
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr>
                <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                  电价
                </td>
                {hourlyPrices.map((hour, index) => {
                  const bgColor = hour.period === 'peak'
                    ? 'bg-red-100 text-red-800'
                    : hour.period === 'valley'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-yellow-100 text-yellow-800';
                  return (
                    <td key={index} className={`px-2 py-2 text-center text-xs font-medium ${bgColor}`}>
                      {hour.price.toFixed(3)}
                    </td>
                  );
                })}
              </tr>
              <tr>
                <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                  时段
                </td>
                {hourlyPrices.map((hour, index) => {
                  const periodLabel = hour.period === 'peak'
                    ? '峰'
                    : hour.period === 'valley'
                    ? '谷'
                    : '平';
                  const bgColor = hour.period === 'peak'
                    ? 'bg-red-50'
                    : hour.period === 'valley'
                    ? 'bg-green-50'
                    : 'bg-yellow-50';
                  return (
                    <td key={index} className={`px-2 py-2 text-center text-xs ${bgColor}`}>
                      {periodLabel}
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Additional Notes */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <div className="flex">
          <svg
            className="w-5 h-5 text-blue-400 mr-2 flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
          <div className="flex-1">
            <p className="text-sm text-blue-800">
              <strong>注意：</strong>以上电价数据为演示数据。实际使用时，系统将根据选择的省份自动加载当地的分时电价政策。
              不同季节可能有不同的电价调整系数。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
