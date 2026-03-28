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
import { type HourlyPrice, PROVINCE_NAMES, type ElectricityBillComponents } from '../../domain/schemas/ProjectSchema';
import { getTariffService } from '../../services/tariffDataService';
import TariffUpdateButton from '../TariffUpdateButton';
import { type TariffType } from '../../domain/schemas/ProjectSchema';
import { AIAssistant } from './AIAssistant';

interface BillComponentsDisplayProps {
  billComponents: ElectricityBillComponents;
  tariffType: TariffType;
  peakPrice: number;
  flatPrice: number;
  valleyPrice: number;
}

const BillComponentsDisplay: React.FC<BillComponentsDisplayProps> = ({
  billComponents,
  tariffType,
  peakPrice,
  flatPrice,
  valleyPrice,
}) => {
  const isLargeIndustrial = tariffType === 'large_industrial';

  // 计算综合电价估算
  // 对于大工业用户，基本电费需要折算到每kWh
  // 假设每月用电量100,000 kWh，基本电费折算约为0.023-0.026元/kWh
  const basicFeePerKwh = isLargeIndustrial && billComponents.basicFee
    ? (billComponents.basicFee.price * 1000) / 100000 // 假设10万kWh/月
    : 0;

  const avgEnergyPrice = (peakPrice + flatPrice + valleyPrice) / 3;
  const governmentTotal = billComponents.governmentSurcharges?.total || 0;
  const estimatedTotalPrice = avgEnergyPrice + basicFeePerKwh + governmentTotal;

  return (
    <div className="space-y-3">
      {/* 电度电费 */}
      <div className="flex justify-between items-center py-2 border-b border-gray-100">
        <span className="text-sm text-gray-600">电度电费（峰/平/谷）</span>
        <span className="text-sm font-medium text-gray-900">
          {peakPrice.toFixed(3)}/{flatPrice.toFixed(3)}/{valleyPrice.toFixed(3)} 元/kWh
        </span>
      </div>

      {/* 基本电费（仅大工业） */}
      {isLargeIndustrial && billComponents.basicFee && (
        <div className="flex justify-between items-center py-2 border-b border-gray-100">
          <span className="text-sm text-gray-600">
            基本电费（{billComponents.basicFee.type === 'capacity' ? '容量' : '需量'}电价）
          </span>
          <span className="text-sm font-medium text-gray-900">
            {billComponents.basicFee.price} 元/{billComponents.basicFee.type === 'capacity' ? 'kVA' : 'kW'}/月
          </span>
        </div>
      )}

      {/* 政府性基金 */}
      {billComponents.governmentSurcharges && (
        <>
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-sm text-gray-600">政府性基金及附加</span>
            <span className="text-sm font-medium text-gray-900">
              {billComponents.governmentSurcharges.total.toFixed(4)} 元/kWh
            </span>
          </div>

          {/* 展开/收起详情 */}
          <details className="mt-2">
            <summary className="text-xs text-blue-600 cursor-pointer hover:underline select-none">
              查看基金明细
            </summary>
            <div className="mt-2 ml-4 space-y-1 text-xs text-gray-500 bg-gray-50 p-2 rounded">
              <div className="flex justify-between">
                <span>可再生能源附加:</span>
                <span>{billComponents.governmentSurcharges.renewableEnergy.toFixed(4)} 元/kWh</span>
              </div>
              <div className="flex justify-between">
                <span>水库移民基金:</span>
                <span>{billComponents.governmentSurcharges.reservoirFund.toFixed(4)} 元/kWh</span>
              </div>
              <div className="flex justify-between">
                <span>农网还贷资金:</span>
                <span>{billComponents.governmentSurcharges.ruralGridRepayment.toFixed(4)} 元/kWh</span>
              </div>
            </div>
          </details>
        </>
      )}

      {/* 功率因数调整（仅大工业） */}
      {isLargeIndustrial && billComponents.powerFactorAdjustment && (
        <div className="flex justify-between items-center py-2 border-b border-gray-100">
          <span className="text-sm text-gray-600">功率因数调整</span>
          <span className="text-sm font-medium text-gray-900">
            标准 {billComponents.powerFactorAdjustment.standard.toFixed(2)} | 调整率 ±{(billComponents.powerFactorAdjustment.rate * 100).toFixed(1)}%
          </span>
        </div>
      )}

      {/* 综合电价 */}
      <div className="flex justify-between items-center py-3 bg-blue-50 -mx-2 px-3 rounded-lg mt-3">
        <span className="text-sm font-medium text-gray-900">综合电价估算</span>
        <span className="text-lg font-bold text-blue-600">
          ¥{estimatedTotalPrice.toFixed(3)} 元/kWh
        </span>
      </div>

      {/* 说明文字 */}
      <p className="text-xs text-gray-500 mt-2">
        * 综合电价包含电度电费、政府性基金及附加。大工业用户的基本电费已按月用电量10万kWh折算到每kWh，实际金额需根据用电量计算。
      </p>
    </div>
  );
};

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
    value: 'commercial',
    label: '商业',
    description: '商业用电'
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
  const [isUserChanged, setIsUserChanged] = useState(false);

  /**
   * 根据电压等级自动选择电价类型
   */
  useEffect(() => {
    if (voltageLevel && !tariffType && !isUserChanged) {
      const recommendedType = tariffService.getRecommendedTariffType(voltageLevel);
      setValue('tariffDetail.tariffType', recommendedType);
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
  };

  // Calculate statistics
  const stats = hourlyPrices.length > 0 ? {
    avg: hourlyPrices.reduce((sum, h) => sum + h.price, 0) / hourlyPrices.length,
    spread: Math.max(...hourlyPrices.map(h => h.price)) - Math.min(...hourlyPrices.map(h => h.price)),
    peakValleyRatio: currentTariff ? currentTariff.peakPrice / currentTariff.valleyPrice : 0,
  } : null;

  return (
    <div className="space-y-6">
      {/* Header with parameters and update button */}
      <div className="flex items-center justify-between">
        <div className="flex-1">
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
          {/* Location and voltage indicators */}
          {province && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
              项目所在地：{PROVINCE_NAMES[province as keyof typeof PROVINCE_NAMES] || province}
            </span>
          )}

          {voltageLevel && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-2.297 2.897a1 1 0 01-.707.293l-2.121-2.121A1 1 0 009.616 9.21l-2.121 2.121a1 1 0 01-.707.293l-2.297-2.897A1 1 0 017 7V2a1 1 0 011-1V1a1 1 0 001.3.046zM9 7V2a1 1 0 00-1 1v4a1 1 0 001.618.78l2.122-2.121a1 1 0 01.707-.293l2.12 2.122a1 1 0 00.708.293l2.297-2.897A1 1 0 019 7V2a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 001.618.78l2.122 2.121a1 1 0 00.707.293l2.12-2.122a1 1 0 00.708-.293l2.297 2.897A1 1 0 0115 7V2a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 001.618.78l2.122 2.121a1 1 0 00.707.293l2.12-2.122a1 1 0 00.708-.293l2.297-2.897A1 1 0 0119 7V2a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              电压等级：{voltageLevel}
            </span>
          )}

          <TariffUpdateButton onUpdated={handleTariffUpdated} />
        </div>
      </div>

      {/* Auto-update notice */}
      {currentTariff && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-blue-400 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-900">
                电价自动联动
              </p>
              <p className="text-xs text-blue-700 mt-1">
                电价信息根据项目所在地和电压等级自动加载。如需更改，请返回"业主信息"步骤修改。
              </p>
            </div>
          </div>
        </div>
      )}

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

      {/* Electricity Bill Components */}
      {currentTariff?.billComponents && (
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <h4 className="text-sm font-semibold text-gray-900 mb-4">
            电费组成明细
          </h4>

          <BillComponentsDisplay
            billComponents={currentTariff.billComponents}
            tariffType={tariffType}
            peakPrice={currentTariff.peakPrice}
            flatPrice={currentTariff.flatPrice}
            valleyPrice={currentTariff.valleyPrice}
          />
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

    {/* AI Assistant */}
    <AIAssistant
      context={{
        province: province as any,
        voltage: voltageLevel,
        monthlyUsage: watch('facilityInfo.monthlyUsage'),
        peakLoad: watch('facilityInfo.peakLoad')
      }}
    />
  </>
  );
};

export default TariffDetailsStep;
