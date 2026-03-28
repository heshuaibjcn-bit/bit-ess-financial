/**
 * SimpleCharts - Simple chart components using Recharts
 *
 * Lightweight chart components for result visualization
 */

import React from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useTranslation } from 'react-i18next';
import type { EngineResult } from '@/domain/services/CalculationEngine';

interface SimpleChartsProps {
  result: EngineResult;
  className?: string;
}

// Colors for charts
const COLORS = {
  arbitrage: '#3b82f6',
  capacity: '#10b981',
  demand: '#f59e0b',
  auxiliary: '#8b5cf6',
  positive: '#10b981',
  negative: '#ef4444',
};

/**
 * Revenue Breakdown Bar Chart
 */
export const RevenueBarChart: React.FC<SimpleChartsProps> = ({
  result,
  className = '',
}) => {
  const { t } = useTranslation();
  const { revenueBreakdown } = result;

  const data = [
    {
      name: t('results.revenue.arbitrage'),
      value: Math.round((revenueBreakdown?.peakValleyArbitrage || 0) / 10000),
      color: COLORS.arbitrage,
    },
  ];

  if ((revenueBreakdown?.capacityCompensation || 0) > 0) {
    data.push({
      name: t('results.revenue.capacity'),
      value: Math.round(revenueBreakdown.capacityCompensation / 10000),
      color: COLORS.capacity,
    });
  }

  if ((revenueBreakdown?.demandResponse || 0) > 0) {
    data.push({
      name: t('results.revenue.demandResponse'),
      value: Math.round(revenueBreakdown.demandResponse / 10000),
      color: COLORS.demand,
    });
  }

  if ((revenueBreakdown?.auxiliaryServices || 0) > 0) {
    data.push({
      name: t('results.revenue.auxiliary'),
      value: Math.round(revenueBreakdown.auxiliaryServices / 10000),
      color: COLORS.auxiliary,
    });
  }

  return (
    <div className={`revenue-bar-chart ${className}`}>
      <h4 className="text-sm font-medium text-gray-700 mb-3">
        {t('charts.revenueBreakdown')}
      </h4>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
          <XAxis type="number" stroke="#9ca3af" />
          <YAxis
            type="category"
            dataKey="name"
            width={100}
            stroke="#9ca3af"
            tick={{ fontSize: 12 }}
          />
          <Tooltip
            formatter={(value: number) => [`¥${value}万`, '年收入']}
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
            }}
          />
          <Bar dataKey="value" radius={[0, 4, 4, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

/**
 * Revenue Sources Pie Chart
 */
export const RevenuePieChart: React.FC<SimpleChartsProps> = ({
  result,
  className = '',
}) => {
  const { t } = useTranslation();
  const { revenueBreakdown } = result;

  const data = [
    {
      name: t('results.revenue.arbitrage'),
      value: revenueBreakdown?.peakValleyArbitrage || 0,
      color: COLORS.arbitrage,
    },
  ];

  if ((revenueBreakdown?.capacityCompensation || 0) > 0) {
    data.push({
      name: t('results.revenue.capacity'),
      value: revenueBreakdown.capacityCompensation,
      color: COLORS.capacity,
    });
  }

  if ((revenueBreakdown?.demandResponse || 0) > 0) {
    data.push({
      name: t('results.revenue.demandResponse'),
      value: revenueBreakdown.demandResponse,
      color: COLORS.demand,
    });
  }

  if ((revenueBreakdown?.auxiliaryServices || 0) > 0) {
    data.push({
      name: t('results.revenue.auxiliary'),
      value: revenueBreakdown.auxiliaryServices,
      color: COLORS.auxiliary,
    });
  }

  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className={`revenue-pie-chart ${className}`}>
      <h4 className="text-sm font-medium text-gray-700 mb-3">
        收入来源占比
      </h4>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={80}
            paddingAngle={2}
            dataKey="value"
            label={({ name, percent }) => {
              const pct = ((percent || 0) * 100).toFixed(0);
              return `${name} ${pct}%`;
            }}
            labelLine={false}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number) => `¥${(value / 10000).toFixed(1)}万`}
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      <p className="text-xs text-gray-600 text-center mt-2">
        总收入: ¥{(total / 10000).toFixed(1)}万/年
      </p>
    </div>
  );
};

/**
 * Cash Flow Line Chart
 */
export const CashFlowLineChart: React.FC<SimpleChartsProps> = ({
  result,
  className = '',
}) => {
  const { t } = useTranslation();
  const annualCashFlows = result.annualCashFlows || [];

  // Calculate cumulative cash flow
  let cumulative = 0;
  const data = annualCashFlows.map((flow, index) => {
    cumulative += flow;
    return {
      year: `第${index + 1}年`,
      annual: Math.round(flow / 10000),
      cumulative: Math.round(cumulative / 10000),
    };
  });

  return (
    <div className={`cash-flow-line-chart ${className}`}>
      <h4 className="text-sm font-medium text-gray-700 mb-3">
        {t('results.cashFlow.title')}
      </h4>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
          <XAxis
            dataKey="year"
            stroke="#9ca3af"
            tick={{ fontSize: 11 }}
          />
          <YAxis
            stroke="#9ca3af"
            tick={{ fontSize: 11 }}
            label={{ value: '金额 (万元)', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
            }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="annual"
            stroke={COLORS.arbitrage}
            strokeWidth={2}
            dot={{ fill: COLORS.arbitrage, strokeWidth: 2, r: 3 }}
            name="年度现金流"
          />
          <Line
            type="monotone"
            dataKey="cumulative"
            stroke={COLORS.positive}
            strokeWidth={3}
            dot={{ fill: COLORS.positive, strokeWidth: 2, r: 4 }}
            name="累计现金流"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

// Remove incorrect default export - components are individually exported

