/**
 * TariffDetailsStep - Step 2: Time-of-Use Tariff Details (Simplified for testing)
 */

import React, { useState, useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import { getTariffService } from '../../services/tariffDataService';

export const TariffDetailsStep: React.FC = () => {
  const { register, watch, setValue } = useFormContext();
  const tariffService = getTariffService();

  // Watch province and voltage level
  const province = watch('province') || 'guangdong';
  const voltageLevel = watch('facilityInfo.voltageLevel') || '0.4kV';

  // State
  const [currentTariff, setCurrentTariff] = useState<any>(null);

  /**
   * 加载电价数据
   */
  useEffect(() => {
    if (!province || !voltageLevel) {
      return;
    }

    try {
      const tariff = tariffService.getTariffByVoltage(province as any, voltageLevel);
      if (tariff) {
        setCurrentTariff(tariff);
        setValue('tariffDetail.peakPrice', tariff.peakPrice);
        setValue('tariffDetail.valleyPrice', tariff.valleyPrice);
        setValue('tariffDetail.flatPrice', tariff.flatPrice);
        setValue('tariffDetail.tariffType', tariff.tariffType);
      }
    } catch (e) {
      console.error('Failed to load tariff data:', e);
    }
  }, [province, voltageLevel, setValue]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            电价信息
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            {currentTariff ? (
              <>
                {currentTariff.name} · 生效日期：{currentTariff.effectiveDate}
              </>
            ) : (
                '加载中...'
              )}
          </p>
        </div>

        {/* Tariff Update Button - Temporary simplified version */}
        <div className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg">
          <svg className="w-4 h-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>电价数据</span>
        </div>
      </div>

      {/* Price Display */}
      {currentTariff && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm font-medium text-red-900 mb-2">峰时电价</p>
            <p className="text-2xl font-bold text-red-700">
              ¥{currentTariff.peakPrice.toFixed(4)} / kWh
            </p>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm font-medium text-yellow-900 mb-2">平时电价</p>
            <p className="text-2xl font-bold text-yellow-700">
              ¥{currentTariff.flatPrice.toFixed(4)} / kWh
            </p>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm font-medium text-green-900 mb-2">谷时电价</p>
            <p className="text-2xl font-bold text-green-700">
              ¥{currentTariff.valleyPrice.toFixed(4)} / kWh
            </p>
          </div>
        </div>
      )}

      {/* Policy Info */}
      {currentTariff?.policyNumber && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
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
    </div>
  );
};

export default TariffDetailsStep;
