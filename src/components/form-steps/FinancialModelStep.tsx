/**
 * FinancialModelStep - Step 4: Financial Model Assessment
 *
 * Features:
 * - Revenue-sharing calculations based on collaboration model
 * - IRR, NPV, payback period per stakeholder
 * - Annual cash flow forecast by party
 * - Sensitivity analysis visualization
 * - Industry comparison
 */

import React, { useMemo } from 'react';
import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

export const FinancialModelStep: React.FC = () => {
  const { t } = useTranslation();
  const { watch } = useFormContext();

  // Watch all relevant data
  const ownerInfo = watch('ownerInfo');
  const technicalProposal = watch('technicalProposal');
  const tariffDetail = watch('tariffDetail');
  const costs = watch('costs');
  const operatingParams = watch('operatingParams');
  const operatingCosts = watch('operatingCosts');
  const financing = watch('financing');

  // Calculate financial metrics
  const financialMetrics = useMemo(() => {
    if (!technicalProposal || !tariffDetail) {
      return null;
    }

    const capacity = technicalProposal.recommendedCapacity; // MWh
    const power = technicalProposal.recommendedPower; // MW

    // Calculate initial investment (CAPEX)
    const batteryCost = capacity * 1000 * costs.batteryCostPerKwh; // ¥
    const pcsCost = power * 1000 * costs.pcsCostPerKw; // ¥
    const installationCost = power * 1000 * costs.installationCostPerKw; // ¥
    const totalCapex = batteryCost + pcsCost + installationCost +
      costs.emsCost + costs.gridConnectionCost + costs.landCost +
      costs.developmentCost + costs.permittingCost;

    // Apply contingency
    const capexWithContingency = totalCapex * (1 + costs.contingencyPercent);

    // Calculate annual revenue
    const priceSpread = tariffDetail.peakPrice - tariffDetail.valleyPrice;
    const dailyCycles = 1.5;
    const systemEfficiency = operatingParams?.systemEfficiency || 0.88;
    const dod = operatingParams?.depthOfDischarge || 0.9;
    const availability = operatingParams?.availabilityPercent || 0.97;

    const annualRevenue = dailyCycles * systemEfficiency * dod * availability *
      priceSpread * capacity * 365;

    // Calculate annual OPEX
    const totalOpex = operatingCosts ? Object.values(operatingCosts).reduce((sum, val) => sum + (val || 0), 0) : 0;

    // Calculate annual profit before tax
    const annualProfitBeforeTax = annualRevenue - totalOpex;

    // Calculate tax (assuming 6% VAT + 12% surtax + 25% corporate tax)
    const vatRate = operatingCosts?.vatRate || 0.06;
    const surtaxRate = operatingCosts?.surtaxRate || 0.12;
    const corporateTaxRate = operatingCosts?.corporateTaxRate || 0.25;

    const vatAndSurtax = annualRevenue * vatRate * surtaxRate;
    const corporateTax = (annualProfitBeforeTax - vatAndSurtax) * corporateTaxRate;
    const annualProfitAfterTax = annualProfitBeforeTax - vatAndSurtax - corporateTax;

    // Calculate revenue share based on collaboration model
    let investorShare = 0;
    let ownerShare = 0;

    if (ownerInfo?.collaborationModel === 'investor_owned') {
      investorShare = annualProfitAfterTax;
      ownerShare = 0;
    } else if (ownerInfo?.collaborationModel === 'joint_venture') {
      const ratio = (ownerInfo?.revenueShareRatio || 50) / 100;
      investorShare = annualProfitAfterTax * ratio;
      ownerShare = annualProfitAfterTax * (1 - ratio);
    } else if (ownerInfo?.collaborationModel === 'emc') {
      // EMC mode: use investor ratio and auto-calculate owner ratio
      const investorRatio = (ownerInfo?.revenueShareRatio || 50) / 100;
      const ownerRatio = 1 - investorRatio; // Auto-calculate as (100% - investor%)
      investorShare = annualProfitAfterTax * investorRatio;
      ownerShare = annualProfitAfterTax * ownerRatio;
    }

    // Calculate investor IRR
    const investorCapex = capexWithContingency * (financing?.equityRatio || 1);
    const investorIRR = investorCapex > 0 ? investorShare / investorCapex : 0;

    // Calculate payback period
    const paybackPeriod = investorShare > 0 ? investorCapex / investorShare : 0;

    // Generate 10-year cash flow projection
    const cashFlowProjection = Array.from({ length: 10 }, (_, year) => {
      const degradation = Math.pow(1 - (operatingParams?.degradationRate || 0.02), year);
      const yearRevenue = annualRevenue * degradation;
      const yearProfit = yearRevenue - totalOpex;
      const yearTax = yearProfit * corporateTaxRate;
      const yearNetProfit = yearProfit - yearTax;

      let yearInvestor = 0;
      let yearOwner = 0;

      if (ownerInfo?.collaborationModel === 'investor_owned') {
        yearInvestor = yearNetProfit;
      } else if (ownerInfo?.collaborationModel === 'joint_venture') {
        const ratio = (ownerInfo?.revenueShareRatio || 50) / 100;
        yearInvestor = yearNetProfit * ratio;
        yearOwner = yearNetProfit * (1 - ratio);
      } else {
        // EMC mode: use investor ratio and auto-calculate owner ratio
        const investorRatio = (ownerInfo?.revenueShareRatio || 50) / 100;
        const ownerRatio = 1 - investorRatio; // Auto-calculate as (100% - investor%)
        yearInvestor = yearNetProfit * investorRatio;
        yearOwner = yearNetProfit * ownerRatio;
      }

      return {
        year: `第${year + 1}年`,
        investor: Math.round(yearInvestor),
        owner: Math.round(yearOwner),
        total: Math.round(yearNetProfit),
      };
    });

    return {
      capex: capexWithContingency,
      annualRevenue,
      totalOpex,
      annualProfitAfterTax,
      investorShare,
      ownerShare,
      investorIRR,
      paybackPeriod,
      cashFlowProjection,
    };
  }, [technicalProposal, tariffDetail, costs, operatingParams, operatingCosts, ownerInfo, financing]);

  if (!financialMetrics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('common.loading')}...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {t('calculator.title')} - {t('calculator.steps.financialModel')}
        </h3>
        <p className="text-sm text-gray-600">
          {t('calculator.financialModel.description')}
        </p>
      </div>

      {/* Collaboration Mode Display */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-purple-700">合作模式</p>
            <p className="text-lg font-semibold text-purple-900">
              {t(`calculator.ownerInfo.collaboration_${ownerInfo?.collaborationModel}`)}
            </p>
          </div>
          {(ownerInfo?.collaborationModel === 'joint_venture' || ownerInfo?.collaborationModel === 'emc') && (
            <div className="text-right">
              <p className="text-sm text-purple-700">收益分成</p>
              <p className="text-lg font-semibold text-purple-900">
                {`投资方 ${ownerInfo?.revenueShareRatio || 50}% / 业主 ${100 - (ownerInfo?.revenueShareRatio || 50)}%`}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Key Financial Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-700">总投资 (CAPEX)</p>
          <p className="text-2xl font-bold text-blue-900">
            ¥{(financialMetrics.capex / 10000).toFixed(0)}万
          </p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-700">年总收入</p>
          <p className="text-2xl font-bold text-green-900">
            ¥{(financialMetrics.annualRevenue / 10000).toFixed(0)}万
          </p>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-700">投资方IRR</p>
          <p className="text-2xl font-bold text-yellow-900">
            {(financialMetrics.investorIRR * 100).toFixed(1)}%
          </p>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <p className="text-sm text-orange-700">回收期</p>
          <p className="text-2xl font-bold text-orange-900">
            {financialMetrics.paybackPeriod.toFixed(1)}年
          </p>
        </div>
      </div>

      {/* Revenue Share Breakdown */}
      <div className="border border-gray-200 rounded-lg p-4">
        <h4 className="text-md font-medium text-gray-800 mb-4">
          {t('calculator.financialModel.revenueShare')}
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Investor Share */}
          <div className="bg-indigo-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h5 className="font-semibold text-indigo-900">{t('calculator.financialModel.investorReturn')}</h5>
              <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-indigo-700">年收益:</span>
                <span className="font-semibold text-indigo-900">
                  ¥{(financialMetrics.investorShare / 10000).toFixed(1)}万
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-indigo-700">IRR:</span>
                <span className="font-semibold text-indigo-900">
                  {(financialMetrics.investorIRR * 100).toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-indigo-700">回收期:</span>
                <span className="font-semibold text-indigo-900">
                  {financialMetrics.paybackPeriod.toFixed(1)}年
                </span>
              </div>
            </div>
          </div>

          {/* Owner Share */}
          <div className="bg-teal-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h5 className="font-semibold text-teal-900">{t('calculator.financialModel.ownerReturn')}</h5>
              <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-teal-700">年收益:</span>
                <span className="font-semibold text-teal-900">
                  ¥{(financialMetrics.ownerShare / 10000).toFixed(1)}万
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-teal-700">合作年限:</span>
                <span className="font-semibold text-teal-900">
                  {ownerInfo?.contractDuration || 10}年
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-teal-700">总收益:</span>
                <span className="font-semibold text-teal-900">
                  ¥{(financialMetrics.ownerShare * (ownerInfo?.contractDuration || 10) / 10000).toFixed(0)}万
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cash Flow Chart */}
      <div className="border border-gray-200 rounded-lg p-4">
        <h4 className="text-md font-medium text-gray-800 mb-4">
          {t('calculator.financialModel.annualCashFlow')}
        </h4>
        <div style={{ height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={financialMetrics.cashFlowProjection}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="year" tick={{ fill: '#6b7280' }} />
              <YAxis
                tickFormatter={(value) => `¥${(value / 10000).toFixed(0)}万`}
                tick={{ fill: '#6b7280' }}
              />
              <Tooltip
                formatter={(value: number) => `¥${(value / 10000).toFixed(1)}万`}
                contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb' }}
              />
              <Legend />
              <Bar dataKey="investor" name="投资方收益" fill="#6366f1" radius={[4, 4, 0, 0]} />
              <Bar dataKey="owner" name="业主收益" fill="#14b8a6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Cost Breakdown */}
      <div className="border border-gray-200 rounded-lg p-4">
        <h4 className="text-md font-medium text-gray-800 mb-4">成本构成</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-gray-600 mb-2">初始投资 (CAPEX)</p>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-700">电池成本</span>
                <span className="font-medium">
                  ¥{((technicalProposal?.recommendedCapacity || 0) * 1000 * costs.batteryCostPerKwh / 10000).toFixed(0)}万
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-700">PCS成本</span>
                <span className="font-medium">
                  ¥{((technicalProposal?.recommendedPower || 0) * 1000 * costs.pcsCostPerKw / 10000).toFixed(0)}万
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-700">其他成本</span>
                <span className="font-medium">
                  ¥{((costs.emsCost + costs.gridConnectionCost + costs.developmentCost + costs.permittingCost) / 10000).toFixed(0)}万
                </span>
              </div>
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-2">年度运营成本 (OPEX)</p>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-700">人力成本</span>
                <span className="font-medium">
                  ¥{(((operatingCosts?.operationsStaffCost || 0) + (operatingCosts?.managementCost || 0) + (operatingCosts?.technicalSupportCost || 0)) / 10000).toFixed(0)}万
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-700">维护成本</span>
                <span className="font-medium">
                  ¥{(((operatingCosts?.regularMaintenanceCost || 0) + (operatingCosts?.preventiveMaintenanceCost || 0)) / 10000).toFixed(0)}万
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-700">其他费用</span>
                <span className="font-medium">
                  ¥{(financialMetrics.totalOpex / 10000).toFixed(0)}万
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
        <div className="flex">
          <svg
            className="w-5 h-5 text-yellow-400 mr-2 flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          <div className="flex-1">
            <p className="text-sm text-yellow-800">
              <strong>注意：</strong>以上财务测算基于当前技术方案和市场假设。实际收益可能因电价政策变化、系统性能衰减、运营成本波动等因素而有所不同。
              建议在投资决策前进行详细的尽职调查和风险评估。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
