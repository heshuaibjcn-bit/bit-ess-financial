/**
 * TechProposalComparison - Compare technical proposal options
 *
 * Displays:
 * - Compare conservative/standard/aggressive proposals
 * - Radar chart or bar chart visualization
 * - Show capacity, power, duration, IRR, payback
 * - Highlight recommended option
 * - Interactive selection of proposal
 */

import React, { useMemo } from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';
import { useTranslation } from 'react-i18next';
import { type TechnicalProposal } from '../../domain/schemas/ProjectSchema';

interface ProposalData extends TechnicalProposal {
  irr: number;
  payback: number;
  capex: number;
}

interface TechProposalComparisonProps {
  proposals: {
    conservative: ProposalData;
    standard: ProposalData;
    aggressive: ProposalData;
  };
  recommended: 'conservative' | 'standard' | 'aggressive';
  selected: 'conservative' | 'standard' | 'aggressive';
  onSelect: (type: 'conservative' | 'standard' | 'aggressive') => void;
  height?: number;
  className?: string;
}

export const TechProposalComparison: React.FC<TechProposalComparisonProps> = ({
  proposals,
  recommended,
  selected,
  onSelect,
  height = 400,
  className = '',
}) => {
  const { t } = useTranslation();

  // Normalize data for radar chart (scale 0-100)
  const chartData = useMemo(() => {
    const metrics = [
      {
        metric: t('calculator.technicalAssessment.capacity'),
        fullMark: 10,
        key: 'capacity',
      },
      {
        metric: t('calculator.technicalAssessment.power'),
        fullMark: 5,
        key: 'power',
      },
      {
        metric: 'IRR',
        fullMark: 25,
        key: 'irr',
      },
      {
        metric: t('calculator.financialModel.paybackPeriod'),
        fullMark: 10,
        key: 'payback',
        reverse: true, // Lower is better
      },
      {
        metric: '投资额',
        fullMark: 1500,
        key: 'capex',
        reverse: true, // Lower is better
      },
    ];

    return metrics.map((m) => {
      const item: any = { metric: m.metric, fullMark: m.fullMark };

      const normalize = (value: number, reverse = false) => {
        const ratio = value / m.fullMark;
        return reverse ? (1 - Math.min(ratio, 1)) * 100 : Math.min(ratio, 1) * 100;
      };

      item.conservative = normalize(
        (propositions.conservative as any)[m.key === 'capacity' ? 'recommendedCapacity' : m.key === 'power' ? 'recommendedPower' : m.key],
        m.reverse
      );
      item.standard = normalize(
        (propositions.standard as any)[m.key === 'capacity' ? 'recommendedCapacity' : m.key === 'power' ? 'recommendedPower' : m.key],
        m.reverse
      );
      item.aggressive = normalize(
        (propositions.aggressive as any)[m.key === 'capacity' ? 'recommendedCapacity' : m.key === 'power' ? 'recommendedPower' : m.key],
        m.reverse
      );

      return item;
    });
  }, [propositions, t]);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Radar Chart */}
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={chartData}>
            <PolarGrid stroke="#e5e7eb" />
            <PolarAngleAxis
              dataKey="metric"
              tick={{ fill: '#6b7280', fontSize: 12 }}
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, 100]}
              tick={{ fill: '#9ca3af', fontSize: 10 }}
              tickCount={5}
            />
            <Tooltip
              formatter={(value: number, name: string) => [value.toFixed(0), name]}
              contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb' }}
            />
            <Legend />
            <Radar
              name="保守方案"
              dataKey="conservative"
              stroke="#22c55e"
              fill="#22c55e"
              fillOpacity={0.3}
              strokeWidth={2}
              dot={{ r: 4 }}
            />
            <Radar
              name="标准方案"
              dataKey="standard"
              stroke="#eab308"
              fill="#eab308"
              fillOpacity={0.3}
              strokeWidth={2}
              dot={{ r: 4 }}
            />
            <Radar
              name="激进方案"
              dataKey="aggressive"
              stroke="#ef4444"
              fill="#ef4444"
              fillOpacity={0.3}
              strokeWidth={2}
              dot={{ r: 4 }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Comparison Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                指标
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                保守方案
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                标准方案
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                激进方案
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            <tr>
              <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                容量
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-center text-gray-600">
                {propositions.conservative.recommendedCapacity} MWh
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-center text-gray-600">
                {propositions.standard.recommendedCapacity} MWh
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-center text-gray-600">
                {propositions.aggressive.recommendedCapacity} MWh
              </td>
            </tr>
            <tr className="bg-gray-50">
              <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                功率
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-center text-gray-600">
                {propositions.conservative.recommendedPower} MW
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-center text-gray-600">
                {propositions.standard.recommendedPower} MW
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-center text-gray-600">
                {propositions.aggressive.recommendedPower} MW
              </td>
            </tr>
            <tr>
              <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                时长
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-center text-gray-600">
                {propositions.conservative.capacityPowerRatio} h
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-center text-gray-600">
                {propositions.standard.capacityPowerRatio} h
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-center text-gray-600">
                {propositions.aggressive.capacityPowerRatio} h
              </td>
            </tr>
            <tr className="bg-gray-50">
              <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                预估IRR
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-center">
                <span className={`font-semibold ${
                  propositions.conservative.irr > 0.12 ? 'text-green-600' : propositions.conservative.irr > 0.10 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {(propositions.conservative.irr * 100).toFixed(1)}%
                </span>
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-center">
                <span className={`font-semibold ${
                  propositions.standard.irr > 0.12 ? 'text-green-600' : propositions.standard.irr > 0.10 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {(propositions.standard.irr * 100).toFixed(1)}%
                </span>
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-center">
                <span className={`font-semibold ${
                  propositions.aggressive.irr > 0.12 ? 'text-green-600' : propositions.aggressive.irr > 0.10 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {(propositions.aggressive.irr * 100).toFixed(1)}%
                </span>
              </td>
            </tr>
            <tr>
              <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                回收期
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-center text-gray-600">
                {propositions.conservative.payback.toFixed(1)} 年
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-center text-gray-600">
                {propositions.standard.payback.toFixed(1)} 年
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-center text-gray-600">
                {propositions.aggressive.payback.toFixed(1)} 年
              </td>
            </tr>
            <tr className="bg-gray-50">
              <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                投资额
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-center text-gray-600">
                ¥{(propositions.conservative.capex / 10000).toFixed(0)}万
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-center text-gray-600">
                ¥{(propositions.standard.capex / 10000).toFixed(0)}万
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-center text-gray-600">
                ¥{(propositions.aggressive.capex / 10000).toFixed(0)}万
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Selection Buttons */}
      <div className="flex justify-center space-x-4">
        {(['conservative', 'standard', 'aggressive'] as const).map((type) => {
          const isRecommended = recommended === type;
          const isSelected = selected === type;

          return (
            <button
              key={type}
              type="button"
              onClick={() => onSelect(type)}
              className={`px-6 py-3 rounded-lg border-2 font-medium transition-all ${
                isSelected
                  ? 'border-blue-500 bg-blue-50 text-blue-900 shadow-lg'
                  : 'border-gray-200 text-gray-700 hover:border-gray-300'
              } ${isRecommended && !isSelected ? 'ring-2 ring-green-400' : ''}`}
            >
              <div className="flex items-center space-x-2">
                <span>{t(`calculator.technicalAssessment.proposal_${type}`)}</span>
                {isRecommended && (
                  <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded-full">
                    推荐
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center space-x-6 text-sm">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span className="text-gray-600">保守 (安全优先)</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-yellow-500" />
          <span className="text-gray-600">标准 (平衡)</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span className="text-gray-600">激进 (收益优先)</span>
        </div>
      </div>
    </div>
  );
};

export default TechProposalComparison;
