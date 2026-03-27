/**
 * PDF Document Templates for Investment Reports
 *
 * Provides React components for generating professional PDF reports
 * using @react-pdf/renderer
 */

import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  PDFViewer,
  PDFDownloadLink,
} from '@react-pdf/renderer';
import type { CalculationResult } from '@/domain/models/CalculationResult';
import type { ProjectInput } from '@/domain/schemas/ProjectSchema';

// Register fonts
Font.register({
  family: 'Roboto',
  fonts: [
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/font/Roboto/Roboto-Regular.ttf', weight: 400 },
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/font/Roboto/Roboto-Bold.ttf', weight: 700 },
  ],
});

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    padding: 40,
    backgroundColor: '#ffffff',
  },
  header: {
    marginBottom: 30,
    borderBottom: '2 solid #2563eb',
    paddingBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 700,
    color: '#1f2937',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 30,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 700,
    color: '#1f2937',
    marginBottom: 15,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  col: {
    flex: 1,
  },
  label: {
    fontSize: 11,
    color: '#6b7280',
    fontWeight: 500,
  },
  value: {
    fontSize: 12,
    color: '#1f2937',
    marginBottom: 6,
  },
  highlight: {
    fontSize: 14,
    fontWeight: 600,
    color: '#2563eb',
  },
  table: {
    width: '100%',
    marginBottom: 15,
  },
  tableHeader: {
    backgroundColor: '#f3f4f6',
    fontSize: 11,
    fontWeight: 600,
    color: '#1f2937',
    padding: 8,
  },
  tableCell: {
    fontSize: 10,
    padding: 8,
    borderBottom: '1 solid #e5e7eb',
  },
  footer: {
    marginTop: 'auto',
    paddingTop: 20,
    borderTop: '1 solid #e5e7eb',
    fontSize: 9,
    color: '#6b7280',
  },
  disclaimer: {
    fontSize: 8,
    color: '#9ca3af',
    fontStyle: 'italic',
    marginTop: 10,
  },
});

interface InvestmentReportPDFProps {
  projectInput: ProjectInput;
  calculationResult: CalculationResult;
  benchmarkComparison?: any;
  includeDisclaimer?: boolean;
}

/**
 * Main investment report PDF document
 */
export const InvestmentReportPDF: React.FC<InvestmentReportPDFProps> = ({
  projectInput,
  calculationResult,
  benchmarkComparison,
  includeDisclaimer = true,
}) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: 'CNY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>C&I Energy Storage Investment Analysis Report</Text>
          <Text style={styles.subtitle}>
            工商业储能投资分析报告
          </Text>
        </View>

        {/* Project Overview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>项目概况 / Project Overview</Text>

          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>省份 / Province:</Text>
              <Text style={styles.value}>{projectInput.province}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>项目名称 / Project:</Text>
              <Text style={styles.value}>
                {projectInput.projectName || 'N/A'}
              </Text>
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>系统容量 / Capacity:</Text>
              <Text style={styles.value}>
                {projectInput.systemSize.capacity} MW × {projectInput.systemSize.duration} h ={' '}
                {projectInput.systemSize.capacity * projectInput.systemSize.duration} MWh
              </Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>技术类型 / Technology:</Text>
              <Text style={styles.value}>Lithium-ion</Text>
            </View>
          </View>
        </View>

        {/* Financial Metrics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>财务指标 / Financial Metrics</Text>

          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text>指标</Text>
              <Text>数值</Text>
            </View>
            <View style={styles.tableCell}>
              <Text>内部收益率 (IRR)</Text>
              <Text style={styles.highlight}>
                {formatPercent(calculationResult.financialMetrics.irr)}
              </Text>
            </View>
            <View style={styles.tableCell}>
              <Text>净现值 (NPV)</Text>
              <Text style={styles.highlight}>
                {formatCurrency(calculationResult.financialMetrics.npv)}
              </Text>
            </View>
            <View style={styles.tableCell}>
              <Text>投资回收期 / Payback Period</Text>
              <Text style={styles.value}>
                {calculationResult.financialMetrics.paybackPeriod.toFixed(2)} years
              </Text>
            </View>
            <View style={styles.tableCell}>
              <Text>投资回报率 (ROI)</Text>
              <Text style={styles.highlight}>
                {formatPercent(calculationResult.financialMetrics.roi)}
              </Text>
            </View>
            <View style={styles.tableCell}>
              <Text>总投资 / Total Investment</Text>
              <Text style={styles.value}>
                {formatCurrency(calculationResult.costBreakdown.initialInvestment)}
              </Text>
            </View>
            <View style={styles.tableCell}>
              <Text>度电成本 (LCOS)</Text>
              <Text style={styles.value}>
                ¥{calculationResult.performanceMetrics.levelizedCost.toFixed(2)}/kWh
              </Text>
            </View>
          </View>
        </View>

        {/* Annual Cash Flows */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>年度现金流 / Annual Cash Flows</Text>

          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text>年份</Text>
              <Text>收入</Text>
              <Text>成本</Text>
              <Text>净现金流</Text>
              <Text>累计现金流</Text>
            </View>
            {calculationResult.annualCashFlows.slice(0, 10).map((cf, index) => (
              <View key={index} style={styles.tableCell}>
                <Text>Year {cf.year}</Text>
                <Text>{formatCurrency(cf.revenue)}</Text>
                <Text>{formatCurrency(cf.operatingCost + cf.financingCost)}</Text>
                <Text style={cf.netCashFlow >= 0 ? styles.highlight : {}}>
                  {formatCurrency(cf.netCashFlow)}
                </Text>
                <Text>{formatCurrency(cf.cumulativeCashFlow)}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Revenue Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>收入构成 / Revenue Breakdown</Text>

          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text>收入来源</Text>
              <Text>金额 (¥/year)</Text>
              <Text>占比</Text>
            </View>
            <View style={styles.tableCell}>
              <Text>峰谷价差套利</Text>
              <Text>
                {formatCurrency(calculationResult.revenueBreakdown.peakValleyArbitrage)}
              </Text>
              <Text>
                {((calculationResult.revenueBreakdown.peakValleyArbitrage /
                  calculationResult.revenueBreakdown.total) * 100).toFixed(1)}%
              </Text>
            </View>
            <View style={styles.tableCell}>
              <Text>容量补偿</Text>
              <Text>
                {formatCurrency(calculationResult.revenueBreakdown.capacityCompensation)}
              </Text>
              <Text>
                {((calculationResult.revenueBreakdown.capacityCompensation /
                  calculationResult.revenueBreakdown.total) * 100).toFixed(1)}%
              </Text>
            </View>
          </View>
        </View>

        {/* Benchmark Comparison */}
        {benchmarkComparison && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>行业对比 / Benchmark Comparison</Text>

            <View style={styles.row}>
              <View style={styles.col}>
                <Text style={styles.label}>可比项目数量:</Text>
                <Text style={styles.value}>
                  {benchmarkComparison.comparablesCount || 0}
                </Text>
              </View>
              <View style={styles.col}>
                <Text style={styles.label}>IRR百分位排名:</Text>
                <Text style={styles.highlight}>
                  {benchmarkComparison.percentileIRR?.toFixed(1)}th percentile
                </Text>
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.col}>
                <Text style={styles.label}>行业平均IRR:</Text>
                <Text style={styles.value}>
                  {formatPercent(benchmarkComparison.irrStats?.mean || 0)}
                </Text>
              </View>
              <View style={styles.col}>
                <Text style={styles.label}>评级:</Text>
                <Text style={styles.value}>
                  {benchmarkComparison.overallRating?.label || 'N/A'}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Disclaimer */}
        {includeDisclaimer && (
          <View style={styles.footer}>
            <Text style={styles.sectionTitle}>免责声明 / Disclaimer</Text>
            <Text style={styles.disclaimer}>
              本报告提供的计算、预测和结果仅供参考，不构成财务、投资、法律、税务或会计建议。
              所述信息基于假设和估计，可能无法反映实际市场状况或项目结果。
              过往业绩不预示未来表现。用户应在做出任何投资决定前咨询合格专业人士。
              平台运营者和开发者不对因使用本信息而产生的任何损失或损害承担责任。
            </Text>
            <Text style={styles.disclaimer}>
              This report is provided for informational purposes only and does not
              constitute financial, investment, legal, tax, or accounting advice.
              The calculations, projections, and results are based on assumptions and
              estimates that may not reflect actual market conditions or project outcomes.
              Past performance is not indicative of future results. Users should consult
              with qualified professionals before making any investment decisions.
            </Text>
            <Text style={styles.disclaimer}>
              Generated: {new Date().toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
            </Text>
          </View>
        )}
      </Page>
    </Document>
  );
};

/**
 * Sensitivity Analysis Report PDF
 */
interface SensitivityReportPDFProps {
  projectName: string;
  baseProject: ProjectInput;
  scenarios: Array<{
    variable: string;
    scenarios: Array<{
      change: number;
      irr: number;
      npv: number;
    }>;
  }>;
}

export const SensitivityReportPDF: React.FC<SensitivityReportPDFProps> = ({
  projectName,
  baseProject,
  scenarios,
}) => {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Sensitivity Analysis Report</Text>
          <Text style={styles.subtitle}>敏感性分析报告</Text>
        </View>

        {scenarios.map((scenario, index) => (
          <View key={index} style={styles.section}>
            <Text style={styles.sectionTitle}>
              {scenario.variable} Sensitivity
            </Text>

            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text>Change</Text>
                <Text>IRR</Text>
                <Text>NPV (¥)</Text>
                <Text>Δ IRR (pp)</Text>
              </View>
              {scenario.scenarios.map((s, i) => (
                <View key={i} style={styles.tableCell}>
                  <Text>{(s.change * 100).toFixed(0)}%</Text>
                  <Text style={styles.highlight}>{s.irr.toFixed(2)}%</Text>
                  <Text>{s.npv.toLocaleString()}</Text>
                  <Text>
                    {s.irr - scenario.scenarios[0]?.irr || 0 > 0 ? '+' : ''}
                    {(s.irr - scenario.scenarios[0]?.irr || 0).toFixed(2)}%
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ))}
      </Page>
    </Document>
  );
};

/**
 * Quick Summary PDF (one-page)
 */
interface QuickSummaryPDFProps {
  projectName: string;
  irr: number;
  npv: number;
  paybackPeriod: number;
  totalInvestment: number;
  annualRevenue: number;
}

export const QuickSummaryPDF: React.FC<QuickSummaryPDFProps> = ({
  projectName,
  irr,
  npv,
  paybackPeriod,
  totalInvestment,
  annualRevenue,
}) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: 'CNY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Investment Analysis Summary</Text>
          <Text style={styles.subtitle}>{projectName}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Key Metrics</Text>

          <View style={styles.table}>
            <View style={[styles.tableCell, styles.highlight]}>
              <Text style={{ fontSize: 14 }}>Internal Rate of Return (IRR)</Text>
              <Text style={{ fontSize: 24 }}>{irr.toFixed(2)}%</Text>
            </View>
            <View style={styles.tableCell}>
              <Text>Net Present Value (NPV)</Text>
              <Text style={{ fontSize: 16, fontWeight: 600 }}>
                {formatCurrency(npv)}
              </Text>
            </View>
            <View style={styles.tableCell}>
              <Text>Payback Period</Text>
              <Text>{paybackPeriod.toFixed(2)} years</Text>
            </View>
            <View style={styles.tableCell}>
              <Text>Total Investment</Text>
              <Text>{formatCurrency(totalInvestment)}</Text>
            </View>
            <View style={styles.tableCell}>
              <Text>Annual Revenue</Text>
              <Text>{formatCurrency(annualRevenue)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.disclaimer}>
            Generated: {new Date().toLocaleDateString()}
          </Text>
        </View>
      </Page>
    </Document>
  );
};

export default InvestmentReportPDF;
