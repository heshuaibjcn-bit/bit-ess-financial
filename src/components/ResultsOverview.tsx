/**
 * ResultsOverview - Display calculation results
 *
 * Shows:
 * - Key metrics (IRR, NPV, Payback Period, LCOE)
 * - Revenue breakdown
 * - Comparison with benchmark
 * - Investment rating
 */

import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useUIStore } from '@/stores/uiStore';
import { EngineResult } from '../domain/services/CalculationEngine';
import { BenchmarkComparison } from '../domain/services/BenchmarkEngine';
import { AIChatSidebar } from './AIChat';

interface ResultsOverviewProps {
  result: EngineResult;
  benchmarkComparison?: BenchmarkComparison;
  loading?: boolean;
  className?: string;
}

export const ResultsOverview: React.FC<ResultsOverviewProps> = ({
  result,
  benchmarkComparison,
  loading = false,
  className = '',
}) => {
  const { t } = useTranslation();
  const setAIChatOpen = useUIStore((state) => state.setAIChatOpen);
  const [animated, setAnimated] = useState(false);

  // Trigger animations when result changes
  useEffect(() => {
    setAnimated(false);
    const timer = setTimeout(() => setAnimated(true), 100);
    return () => clearTimeout(timer);
  }, [result]);

  if (loading) {
    return (
      <div className={`results-overview ${className}`}>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-4 text-gray-600">{t('common.loading')}</span>
        </div>
      </div>
    );
  }

  // Calculate rating
  const getRating = (irr: number) => {
    if (irr <= 0) return { label: '严重亏损', color: 'text-red-700', bg: 'bg-red-100' };
    if (irr >= 12) return { label: t('results.rating.excellent'), color: 'text-green-600', bg: 'bg-green-50' };
    if (irr >= 10) return { label: t('results.rating.good'), color: 'text-blue-600', bg: 'bg-blue-50' };
    if (irr >= 8) return { label: t('results.rating.average'), color: 'text-yellow-600', bg: 'bg-yellow-50' };
    if (irr >= 6) return { label: t('results.rating.belowAverage'), color: 'text-orange-600', bg: 'bg-orange-50' };
    return { label: t('results.rating.poor'), color: 'text-red-600', bg: 'bg-red-50' };
  };

  // Use direct property access from CalculationResult
  const irrValue = result.irr ?? 0;
  const npvValue = result.npv ?? 0;
  const paybackValue = result.paybackPeriod ?? -1;
  const lcoeValue = result.levelizedCost ?? 0;
  const rating = getRating(irrValue);

  // Get percentile ranking for display
  const getPercentileLabel = (percentile: number) => {
    if (percentile >= 90) return t('benchmark.percentiles.top10');
    if (percentile >= 75) return t('benchmark.percentiles.top25');
    if (percentile >= 50) return t('benchmark.percentiles.aboveAverage');
    return t('benchmark.percentiles.belowAverage');
  };

  return (
    <div className={`results-overview ${className}`}>
      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* IRR Card */}
        <div className={`bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300 ${animated ? 'animate-fade-in-up' : 'opacity-0'}`} style={{ animationDelay: '0ms' }}>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 mb-1">{t('results.financials.irr')}</p>
              <p className={`mt-2 text-3xl font-bold transition-all duration-500 ${irrValue > 0 ? 'text-gray-900' : 'text-red-600'}`}>
                {typeof irrValue === 'number' ? irrValue.toFixed(2) + '%' : '---'}
              </p>
              {irrValue > 0 && irrValue < 6 && (
                <p className="text-xs text-orange-500 mt-1 font-medium">⚠️ 回报较低</p>
              )}
              {irrValue >= 6 && irrValue < 8 && (
                <p className="text-xs text-yellow-600 mt-1 font-medium">📊 一般水平</p>
              )}
              {irrValue >= 8 && (
                <p className="text-xs text-green-600 mt-1 font-medium">✓ 投资价值良好</p>
              )}
            </div>
            <div className={`w-14 h-14 rounded-2xl ${rating.bg} flex items-center justify-center ml-3 transition-all duration-300 hover:scale-110`}>
              <svg className={`w-7 h-7 ${rating.color}`} fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
              </svg>
            </div>
          </div>
          {benchmarkComparison && benchmarkComparison.percentiles && (
            <p className="mt-3 text-xs text-gray-500 flex items-center">
              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {t('benchmark.comparison.comparable')}: {getPercentileLabel(benchmarkComparison.percentiles.irr || benchmarkComparison.percentileIRR || 0)}
            </p>
          )}
        </div>

        {/* NPV Card */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{t('results.financials.npv')}</p>
              <p className={`mt-2 text-3xl font-bold ${npvValue >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {typeof npvValue === 'number' ? `¥${(npvValue / 10000).toFixed(1)}万` : '---'}
              </p>
              {npvValue < 0 && (
                <p className="text-xs text-red-500 mt-1">项目亏损</p>
              )}
            </div>
            <div className={`w-12 h-12 rounded-full ${npvValue >= 0 ? 'bg-green-50' : 'bg-red-50'} flex items-center justify-center`}>
              <svg className={`w-6 h-6 ${npvValue >= 0 ? 'text-green-600' : 'text-red-600'}`} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 002-2h-4a2 2 0 00-2 2v4a2 2 0 002 2h4a2 2 0 002-2v-4z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          {benchmarkComparison && benchmarkComparison.percentiles && (
            <p className="mt-2 text-xs text-gray-500">
              {t('benchmark.comparison.comparable')}: {getPercentileLabel(benchmarkComparison.percentiles.npv || 0)}
            </p>
          )}
        </div>

        {/* Payback Period Card */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{t('results.financials.paybackPeriod')}</p>
              <p className={`mt-2 text-3xl font-bold ${paybackValue > 0 && paybackValue < 100 ? 'text-gray-900' : 'text-red-600'}`}>
                {paybackValue < 0 || paybackValue >= 100
                  ? '无法回收'
                  : typeof paybackValue === 'number' ? `${paybackValue.toFixed(1)} ${t('common.year')}` : '---'}
              </p>
              {paybackValue < 0 && (
                <p className="text-xs text-red-500 mt-1">投资无法回收</p>
              )}
            </div>
            <div className={`w-12 h-12 rounded-full ${paybackValue > 0 && paybackValue < 100 ? 'bg-purple-50' : 'bg-red-50'} flex items-center justify-center`}>
              <svg className={`w-6 h-6 ${paybackValue > 0 && paybackValue < 100 ? 'text-purple-600' : 'text-red-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          {benchmarkComparison && benchmarkComparison.percentiles && (
            <p className="mt-2 text-xs text-gray-500">
              {t('benchmark.comparison.comparable')}: {getPercentileLabel(benchmarkComparison.percentiles.paybackPeriod || 0)}
            </p>
          )}
        </div>

        {/* LCOE Card */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{t('results.financials.lcoe')}</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                {typeof lcoeValue === 'number' ? `¥${lcoeValue.toFixed(2)}` : '---'}
              </p>
              <p className="mt-2 text-xs text-gray-500">
                / {t('common.kwh')}
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Investment Rating */}
      <div className={`${rating.bg} border ${irrValue < 0 ? 'border-red-300' : 'border-gray-200'} rounded-lg p-6 mb-6`}>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">
              {t('results.rating.title')}
            </h3>
            <p className={`text-2xl font-bold ${rating.color} mb-1`}>
              {rating.label}
            </p>
            {irrValue <= 0 && (
              <p className="text-xs text-red-600 mt-2">
                ⚠️ 当前参数下项目无法盈利，建议调整系统规模、成本结构或选择其他省份
              </p>
            )}
            {irrValue > 0 && irrValue < 6 && (
              <p className="text-xs text-orange-600 mt-2">
                💡 投资回报较低，建议优化项目参数
              </p>
            )}
          </div>
          {benchmarkComparison && (
            <div className="text-right ml-4 pl-4 border-l border-gray-300">
              <p className="text-sm text-gray-600">{t('benchmark.rating.title')}</p>
              <p className={`text-lg font-bold ${rating.color}`}>
                {benchmarkComparison.rating.overall}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Revenue Summary */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {t('results.revenue.title')}
        </h3>

        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-blue-500 mr-3"></div>
              <span className="text-sm text-gray-700">{t('results.revenue.arbitrage')}</span>
            </div>
            <span className="text-sm font-medium text-gray-900">
              ¥{((result.revenueBreakdown?.peakValleyArbitrage || 0) / 10000).toFixed(1)}万
            </span>
          </div>

          {(result.revenueBreakdown?.capacityCompensation || 0) > 0 && (
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-green-500 mr-3"></div>
                <span className="text-sm text-gray-700">{t('results.revenue.capacity')}</span>
              </div>
              <span className="text-sm font-medium text-gray-900">
                ¥{(result.revenueBreakdown.capacityCompensation / 10000).toFixed(1)}万
              </span>
            </div>
          )}

          {(result.revenueBreakdown?.demandResponse || 0) > 0 && (
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-yellow-500 mr-3"></div>
                <span className="text-sm text-gray-700">{t('results.revenue.demandResponse')}</span>
              </div>
              <span className="text-sm font-medium text-gray-900">
                ¥{(result.revenueBreakdown.demandResponse / 10000).toFixed(1)}万
              </span>
            </div>
          )}

          {(result.revenueBreakdown?.auxiliaryServices || 0) > 0 && (
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-purple-500 mr-3"></div>
                <span className="text-sm text-gray-700">{t('results.revenue.auxiliary')}</span>
              </div>
              <span className="text-sm font-medium text-gray-900">
                ¥{(result.revenueBreakdown.auxiliaryServices / 10000).toFixed(1)}万
              </span>
            </div>
          )}

          <div className="flex items-center justify-between py-2 bg-gray-50 rounded-md px-3">
            <span className="text-sm font-semibold text-gray-900">{t('results.revenue.totalRevenue')}</span>
            <span className="text-base font-bold text-blue-600">
              ¥{((result.revenueBreakdown?.peakValleyArbitrage || 0 +
                  result.revenueBreakdown?.capacityCompensation || 0 +
                  result.revenueBreakdown?.demandResponse || 0 +
                  result.revenueBreakdown?.auxiliaryServices || 0) / 10000).toFixed(1)}万
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3 mt-6">
        <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium">
          {t('results.actions.save')}
        </button>
        <button className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors font-medium">
          {t('results.actions.export')}
        </button>
        <button className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors font-medium">
          {t('results.actions.share')}
        </button>
        <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors font-medium">
          {t('results.actions.recalculate')}
        </button>
        <button
          onClick={() => setAIChatOpen(true)}
          className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-md hover:from-blue-700 hover:to-purple-700 transition-all font-medium flex items-center space-x-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <span>{t('aiChat.title', { defaultValue: 'AI分析' })}</span>
        </button>
      </div>

      {/* AI Chat Sidebar */}
      <AIChatSidebar />
    </div>
  );
};

export default ResultsOverview;
