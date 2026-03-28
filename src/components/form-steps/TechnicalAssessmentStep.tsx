/**
 * TechnicalAssessmentStep - Step 3: System Technical Assessment
 *
 * Features:
 * - AI-recommended system configuration
 * - Interactive capacity/power adjustment
 * - Compare 3 proposal options (conservative/standard/aggressive)
 * - Charge/discharge strategy selection
 * - Technical parameters confirmation
 */

import React, { useState, useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import {
  recommendCapacity,
  estimateIRR,
  type RecommendationResult,
  type TechnicalProposal,
} from '../../domain/services/CapacityRecommender';
import {
  CHARGE_STRATEGIES,
  OPTIMIZATION_TARGETS,
  type TechnicalProposalSchema,
} from '../../domain/schemas/ProjectSchema';

export const TechnicalAssessmentStep: React.FC = () => {
  const { t } = useTranslation();
  const { watch, setValue, formState: { errors } } = useFormContext();

  // Watch required fields
  const ownerInfo = watch('ownerInfo');
  const facilityInfo = watch('facilityInfo');
  const tariffDetail = watch('tariffDetail');

  // State for recommendations
  const [recommendations, setRecommendations] = useState<RecommendationResult | null>(null);
  const [selectedProposal, setSelectedProposal] = useState<'conservative' | 'standard' | 'aggressive'>('standard');
  const [manualOverride, setManualOverride] = useState(false);

  // Generate recommendations when data is available
  useEffect(() => {
    if (ownerInfo && facilityInfo && tariffDetail?.hourlyPrices?.length === 24) {
      const result = recommendCapacity({
        ownerInfo,
        facilityInfo,
        tariffDetail,
      });
      setRecommendations(result);
      setSelectedProposal(result.recommended);

      // Set default technical proposal
      setValue('technicalProposal', result.standard);
    }
  }, [ownerInfo, facilityInfo, tariffDetail, setValue]);

  // Handle proposal selection
  const handleSelectProposal = (type: 'conservative' | 'standard' | 'aggressive') => {
    if (!recommendations) return;

    setSelectedProposal(type);
    setValue('technicalProposal', recommendations[type]);
    setManualOverride(false);
  };

  // Handle manual adjustment
  const handleManualAdjust = (field: keyof TechnicalProposal, value: number | string) => {
    setManualOverride(true);
    setValue(`technicalProposal.${field}` as any, value);
  };

  if (!recommendations) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('common.loading')}...</p>
          <p className="text-sm text-gray-500 mt-2">正在分析数据并生成推荐方案</p>
        </div>
      </div>
    );
  }

  const currentProposal = recommendations[selectedProposal];
  const estimatedIRR = estimateIRR(currentProposal, { ownerInfo, facilityInfo, tariffDetail });

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {t('calculator.title')} - {t('calculator.steps.technicalAssessment')}
        </h3>
        <p className="text-sm text-gray-600">
          {t('calculator.technicalAssessment.description')}
        </p>
      </div>

      {/* AI Recommendation Reasoning */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <svg className="w-6 h-6 text-blue-600 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <div>
            <h4 className="text-sm font-semibold text-blue-900 mb-1">
              {t('calculator.technicalAssessment.aiRecommendation')}
            </h4>
            <p className="text-sm text-blue-800">{recommendations.reasoning}</p>
          </div>
        </div>
      </div>

      {/* Proposal Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(['conservative', 'standard', 'aggressive'] as const).map((type) => {
          const proposal = recommendations[type];
          const isSelected = selectedProposal === type;
          const isRecommended = recommendations.recommended === type;

          return (
            <div
              key={type}
              className={`relative border-2 rounded-lg p-4 cursor-pointer transition-all ${
                isSelected
                  ? 'border-blue-500 bg-blue-50 shadow-lg'
                  : 'border-gray-200 hover:border-gray-300'
              } ${isRecommended && !isSelected ? 'ring-2 ring-green-400' : ''}`}
              onClick={() => handleSelectProposal(type)}
            >
              {isRecommended && (
                <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                  推荐
                </div>
              )}

              <h5 className={`text-lg font-semibold mb-3 ${
                isSelected ? 'text-blue-900' : 'text-gray-900'
              }`}>
                {t(`calculator.technicalAssessment.proposal_${type}`)}
              </h5>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">容量:</span>
                  <span className="font-medium">{proposal.recommendedCapacity} MWh</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">功率:</span>
                  <span className="font-medium">{proposal.recommendedPower} MW</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">时长:</span>
                  <span className="font-medium">{proposal.capacityPowerRatio} h</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">预估IRR:</span>
                  <span className={`font-medium ${
                    estimateIRR(proposal, { ownerInfo, facilityInfo, tariffDetail }) > 0.12
                      ? 'text-green-600'
                      : estimateIRR(proposal, { ownerInfo, facilityInfo, tariffDetail }) > 0.10
                      ? 'text-yellow-600'
                      : 'text-red-600'
                  }`}>
                    {(estimateIRR(proposal, { ownerInfo, facilityInfo, tariffDetail }) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">优化:</span>
                  <span className="font-medium">
                    {t(`calculator.technicalAssessment.optimizedFor_${proposal.optimizedFor}`)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Manual Adjustment */}
      <div className="border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-md font-medium text-gray-800">
            {t('calculator.technicalAssessment.confirmConfiguration')}
          </h4>
          {manualOverride && (
            <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
              手动调整中
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Capacity Adjustment */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('calculator.technicalAssessment.capacity')}
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="range"
                min="0.5"
                max="10"
                step="0.1"
                value={watch('technicalProposal.recommendedCapacity') || currentProposal.recommendedCapacity}
                onChange={(e) => handleManualAdjust('recommendedCapacity', parseFloat(e.target.value))}
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <input
                type="number"
                step="0.1"
                min="0.5"
                max="10"
                value={watch('technicalProposal.recommendedCapacity') || currentProposal.recommendedCapacity}
                onChange={(e) => handleManualAdjust('recommendedCapacity', parseFloat(e.target.value))}
                className="w-20 px-2 py-1 border border-gray-300 rounded text-center"
              />
              <span className="text-gray-500 text-sm">MWh</span>
            </div>
          </div>

          {/* Power Adjustment */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('calculator.technicalAssessment.power')}
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="range"
                min="0.25"
                max="5"
                step="0.1"
                value={watch('technicalProposal.recommendedPower') || currentProposal.recommendedPower}
                onChange={(e) => handleManualAdjust('recommendedPower', parseFloat(e.target.value))}
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <input
                type="number"
                step="0.1"
                min="0.25"
                max="5"
                value={watch('technicalProposal.recommendedPower') || currentProposal.recommendedPower}
                onChange={(e) => handleManualAdjust('recommendedPower', parseFloat(e.target.value))}
                className="w-20 px-2 py-1 border border-gray-300 rounded text-center"
              />
              <span className="text-gray-500 text-sm">MW</span>
            </div>
          </div>
        </div>

        {/* Charge Strategy Selection */}
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('calculator.technicalAssessment.chargeStrategy')}
          </label>
          <div className="grid grid-cols-3 gap-3">
            {CHARGE_STRATEGIES.map((strategy) => {
              const isSelected = watch('technicalProposal.chargeStrategy') === strategy;
              return (
                <button
                  key={strategy}
                  type="button"
                  onClick={() => handleManualAdjust('chargeStrategy', strategy)}
                  className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition-colors ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50 text-blue-900'
                      : 'border-gray-200 text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {t(`calculator.technicalAssessment.chargeStrategy_${strategy}`)}
                </button>
              );
            })}
          </div>
        </div>

        {/* Technical Parameters Display */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <p className="text-xs text-gray-600 mb-1">{t('calculator.technicalAssessment.cycleLife')}</p>
            <p className="text-lg font-semibold text-gray-900">
              {currentProposal.cycleLife.toLocaleString()}
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <p className="text-xs text-gray-600 mb-1">{t('calculator.technicalAssessment.expectedThroughput')}</p>
            <p className="text-lg font-semibold text-gray-900">
              {currentProposal.expectedThroughput.toLocaleString()} MWh
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <p className="text-xs text-gray-600 mb-1">预估IRR</p>
            <p className={`text-lg font-semibold ${
              estimatedIRR > 0.12 ? 'text-green-600' : estimatedIRR > 0.10 ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {(estimatedIRR * 100).toFixed(1)}%
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <p className="text-xs text-gray-600 mb-1">预估回收期</p>
            <p className="text-lg font-semibold text-gray-900">
              {(1 / estimatedIRR).toFixed(1)} 年
            </p>
          </div>
        </div>
      </div>

      {/* System Size Summary */}
      <div className="bg-green-50 border border-green-200 rounded-md p-4">
        <div className="flex items-center">
          <svg
            className="w-5 h-5 text-green-500 mr-2"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          <div className="flex-1">
            <p className="text-sm font-medium text-green-800">
              系统配置: {watch('technicalProposal.recommendedCapacity') || currentProposal.recommendedCapacity} MWh /
              {watch('technicalProposal.recommendedPower') || currentProposal.recommendedPower} MW /
              {watch('technicalProposal.capacityPowerRatio') || currentProposal.capacityPowerRatio}h
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
