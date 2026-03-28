/**
 * DataAnalysisStep - Step 6: Comprehensive Data Analysis
 *
 * Features:
 * - Sensitivity analysis (tornado chart + heatmap)
 * - Benchmark comparison (distribution + percentiles)
 * - Project comparison table
 * - Two-way sensitivity analysis
 */

import React, { useState, useMemo } from 'react';
import { useFormContext } from 'react-hook-form';
import { useCalculator } from '../../hooks/useCalculator';
import { SensitivityAnalyzer, type SensitivityResult } from '../../domain/services/SensitivityAnalyzer';
import { ProjectInput } from '../../domain/schemas/ProjectSchema';

export const DataAnalysisStep: React.FC = () => {
  const { watch } = useFormContext();
  const { result: calculationResult } = useCalculator({ debounceMs: 300 });

  const [activeTab, setActiveTab] = useState<'sensitivity' | 'benchmark' | 'comparison'>('sensitivity');
  const [sensitivityResult, setSensitivityResult] = useState<SensitivityResult | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  // Watch form data
  const ownerInfo = watch('ownerInfo');
  const facilityInfo = watch('facilityInfo');
  const tariffDetail = watch('tariffDetail');
  const technicalProposal = watch('technicalProposal');
  const costs = watch('costs');
  const financialModel = watch('financialModel');

  // Build project input for sensitivity analysis
  const projectInput = useMemo(() => {
    if (!calculationResult) return null;

    return {
      province: ownerInfo?.province || 'guangdong',
      systemSize: {
        capacity: technicalProposal?.recommendedCapacity || 1,
        power: technicalProposal?.recommendedPower || 1,
        duration: technicalProposal?.recommendedDuration || 2,
      },
      costs: {
        batteryCostPerKwh: costs?.batteryCostPerKwh || 1000,
        pcsCostPerKw: costs?.pcsCostPerKw || 300,
        bmsCost: costs?.bmsCost || 50,
        emsCost: costs?.emsCost || 30,
        installationCostPerKw: costs?.installationCostPerKw || 100,
        gridConnectionCost: costs?.gridConnectionCost || 100000,
        landCost: costs?.landCost || 0,
        developmentCost: costs?.developmentCost || 100000,
        permittingCost: costs?.permittingCost || 50000,
        contingencyPercent: costs?.contingencyPercent || 0.05,
      },
      operatingParams: {
        systemEfficiency: (technicalProposal?.systemEfficiency || 90) / 100,
        depthOfDischarge: (technicalProposal?.depthOfDischarge || 90) / 100,
        cyclesPerDay: technicalProposal?.cyclesPerDay || 1.5,
        degradationRate: (technicalProposal?.degradationRate || 2) / 100,
        availabilityPercent: (technicalProposal?.availability || 95) / 100,
      },
      financing: {
        hasLoan: financialModel?.hasLoan || false,
        equityRatio: financialModel?.equityRatio || 1.0,
        taxHolidayYears: financialModel?.taxHolidayYears || 6,
      },
    } as unknown as ProjectInput;
  }, [calculationResult, ownerInfo, facilityInfo, tariffDetail, technicalProposal, costs, financialModel]);

  // Run sensitivity analysis
  const runSensitivityAnalysis = async () => {
    if (!projectInput || !calculationResult) return;

    setAnalyzing(true);
    try {
      const analyzer = new SensitivityAnalyzer();
      const result = await analyzer.analyzeSensitivity(projectInput);

      setSensitivityResult(result);
    } catch (error) {
      console.error('Sensitivity analysis failed:', error);
    } finally {
      setAnalyzing(false);
    }
  };

  // Auto-run sensitivity analysis when result changes
  React.useEffect(() => {
    if (calculationResult && projectInput && !sensitivityResult) {
      runSensitivityAnalysis();
    }
  }, [calculationResult, projectInput]);

  // Mock benchmark data (in real app, this would come from database)
  const benchmarkData = useMemo(() => {
    if (!calculationResult) return null;

    return {
      irr: {
        p10: 5.2,
        p25: 8.1,
        p50: 11.5,
        p75: 14.8,
        p90: 18.2,
        mean: 11.6,
        stdDev: 4.2,
      },
      npv: {
        p10: -50,
        p25: 120,
        p50: 380,
        p75: 720,
        p90: 1150,
        mean: 450,
        stdDev: 380,
      },
      paybackPeriod: {
        p10: 4.2,
        p25: 5.8,
        p50: 7.5,
        p75: 9.8,
        p90: 12.5,
        mean: 7.8,
        stdDev: 2.5,
      },
      comparableProjects: [
        { name: '项目A', irr: 12.5, npv: 520, payback: 6.8, capacity: 2.5 },
        { name: '项目B', irr: 9.8, npv: 280, payback: 8.2, capacity: 1.8 },
        { name: '项目C', irr: 15.2, npv: 890, payback: 5.5, capacity: 3.2 },
        { name: '项目D', irr: 7.5, npv: 150, payback: 9.5, capacity: 1.2 },
        { name: '项目E', irr: 11.8, npv: 480, payback: 7.2, capacity: 2.8 },
      ],
    };
  }, [calculationResult]);

  // Calculate percentile ranking
  const getPercentile = (value: number, distribution: { p10: number; p25: number; p50: number; p75: number; p90: number } | null | undefined) => {
    if (!distribution) return 50;
    if (value <= distribution.p10) return 10;
    if (value <= distribution.p25) return 25;
    if (value <= distribution.p50) return 50;
    if (value <= distribution.p75) return 75;
    return 90;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900">
          数据分析
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          敏感性分析、基准对比和项目评估
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('sensitivity')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'sensitivity'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            敏感性分析
          </button>
          <button
            onClick={() => setActiveTab('benchmark')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'benchmark'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            基准对比
          </button>
          <button
            onClick={() => setActiveTab('comparison')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'comparison'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            项目对比
          </button>
        </nav>
      </div>

      {/* Sensitivity Analysis Tab */}
      {activeTab === 'sensitivity' && (
        <div className="space-y-6">
          {/* Analysis Status */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-900">
                  敏感性分析
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  分析各参数变化对IRR的影响
                </p>
              </div>
              <button
                onClick={runSensitivityAnalysis}
                disabled={analyzing}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                {analyzing ? '分析中...' : '重新分析'}
              </button>
            </div>
          </div>

          {/* Tornado Chart */}
          {sensitivityResult && sensitivityResult.tornadoData && sensitivityResult.tornadoData.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h4 className="text-base font-semibold text-gray-900 mb-4">
                参数敏感性排序（龙卷风图）
              </h4>
              <p className="text-sm text-gray-500 mb-4">
                显示各参数在±30%变化范围内对IRR的影响程度
              </p>
              <div className="bg-gray-50 rounded-lg p-8 text-center">
                <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <p className="text-sm text-gray-600 font-medium">龙卷风图</p>
                <p className="text-xs text-gray-500 mt-1">
                  {sensitivityResult.tornadoData.length} 个参数已分析
                </p>
                <div className="mt-4 grid grid-cols-1 gap-2 text-left max-w-md mx-auto">
                  {sensitivityResult.tornadoData.slice(0, 3).map((param, idx) => (
                    <div key={idx} className="bg-white rounded-lg p-3 border border-gray-200">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-900">{param.parameterName}</span>
                        <span className="text-xs text-gray-500">影响: ±{param.impact.toFixed(1)}%</span>
                      </div>
                      <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full"
                          style={{ width: `${(param.impact / sensitivityResult.irrRange) * 100}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between mt-1 text-xs text-gray-500">
                        <span>{param.minIRR.toFixed(1)}%</span>
                        <span>{param.maxIRR.toFixed(1)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Key Insights */}
          {sensitivityResult && (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h4 className="text-base font-semibold text-gray-900 mb-4">
                关键洞察
              </h4>
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">
                      最敏感参数
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      <span className="font-medium text-gray-900">
                        {sensitivityResult.mostSensitiveParameter}
                      </span>
                      对IRR影响最大，变化范围达{' '}
                      <span className="font-medium text-red-600">
                        ±{sensitivityResult.mostSensitiveImpact.toFixed(1)}个百分点
                      </span>
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">
                      基准IRR
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      当前参数下的IRR为{' '}
                      <span className="font-medium text-blue-600">
                        {sensitivityResult.baselineIRR.toFixed(2)}%
                      </span>
                      ，波动范围为{' '}
                      <span className="font-medium text-gray-900">
                        {sensitivityResult.minIRR.toFixed(2)}% - {sensitivityResult.maxIRR.toFixed(2)}%
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Benchmark Comparison Tab */}
      {activeTab === 'benchmark' && benchmarkData && (
        <div className="space-y-6">
          {/* Percentile Rankings */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h4 className="text-base font-semibold text-gray-900 mb-4">
              行业基准排名
            </h4>
            <p className="text-sm text-gray-500 mb-4">
              您的项目与同类项目的比较
            </p>

            <div className="space-y-4">
              {/* IRR Percentile */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-900">内部收益率 (IRR)</span>
                  <span className="text-sm text-gray-600">
                    前 {100 - getPercentile(calculationResult?.irr || 0, benchmarkData?.irr || null)}%
                  </span>
                </div>
                <div className="relative h-8 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="absolute h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"
                    style={{
                      left: `${getPercentile(calculationResult?.irr || 0, benchmarkData?.irr || null)}%`,
                      width: '2%',
                    }}
                  ></div>
                  <div className="absolute inset-0 flex items-center justify-between px-4">
                    <span className="text-xs text-gray-600">P10</span>
                    <span className="text-xs text-gray-600">P50</span>
                    <span className="text-xs text-gray-600">P90</span>
                  </div>
                </div>
                <div className="flex justify-between mt-1 text-xs text-gray-500">
                  <span>{benchmarkData.irr.p10}%</span>
                  <span>{benchmarkData.irr.mean.toFixed(1)}%</span>
                  <span>{benchmarkData.irr.p90}%</span>
                </div>
              </div>

              {/* Payback Period Percentile */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-900">回收期</span>
                  <span className="text-sm text-gray-600">
                    前 {100 - getPercentile(
                      100 / (calculationResult?.paybackPeriod || 10),
                      benchmarkData ? { ...benchmarkData.paybackPeriod, p10: 100/12.5, p90: 100/4.2 } : null
                    )}%
                  </span>
                </div>
                <div className="relative h-8 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="absolute h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full"
                    style={{
                      left: `${getPercentile(
                        100 / (calculationResult?.paybackPeriod || 10),
                        benchmarkData ? { ...benchmarkData.paybackPeriod, p10: 100/12.5, p90: 100/4.2 } : null
                      )}%`,
                      width: '2%',
                    }}
                  ></div>
                </div>
                <div className="flex justify-between mt-1 text-xs text-gray-500">
                  <span>{benchmarkData.paybackPeriod.p90}年</span>
                  <span>{benchmarkData.paybackPeriod.mean.toFixed(1)}年</span>
                  <span>{benchmarkData.paybackPeriod.p10}年</span>
                </div>
              </div>
            </div>
          </div>

          {/* Distribution Statistics */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h4 className="text-base font-semibold text-gray-900 mb-4">
              分布统计
            </h4>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      指标
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      P10
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      P25
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      P50
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      P75
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      P90
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <tr>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      IRR (%)
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 text-right">
                      {benchmarkData.irr.p10}%
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 text-right">
                      {benchmarkData.irr.p25}%
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 text-right">
                      {benchmarkData.irr.p50}%
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 text-right">
                      {benchmarkData.irr.p75}%
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 text-right">
                      {benchmarkData.irr.p90}%
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      NPV (万元)
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 text-right">
                      {benchmarkData.npv.p10}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 text-right">
                      {benchmarkData.npv.p25}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 text-right">
                      {benchmarkData.npv.p50}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 text-right">
                      {benchmarkData.npv.p75}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 text-right">
                      {benchmarkData.npv.p90}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      回收期 (年)
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 text-right">
                      {benchmarkData.paybackPeriod.p10}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 text-right">
                      {benchmarkData.paybackPeriod.p25}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 text-right">
                      {benchmarkData.paybackPeriod.p50}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 text-right">
                      {benchmarkData.paybackPeriod.p75}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 text-right">
                      {benchmarkData.paybackPeriod.p90}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Comparable Projects */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h4 className="text-base font-semibold text-gray-900 mb-4">
              可比项目
            </h4>
            <p className="text-sm text-gray-500 mb-4">
              同类规模项目的性能表现
            </p>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      项目
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      容量 (MWh)
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      IRR (%)
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      NPV (万元)
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      回收期 (年)
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {benchmarkData.comparableProjects.map((project, idx) => (
                    <tr key={idx} className={idx === 0 ? 'bg-blue-50' : ''}>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {project.name}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 text-right">
                        {project.capacity}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 text-right">
                        {project.irr}%
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 text-right">
                        {project.npv}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 text-right">
                        {project.payback}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Project Comparison Tab */}
      {activeTab === 'comparison' && (
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h4 className="text-base font-semibold text-gray-900 mb-4">
              多项目对比
            </h4>
            <p className="text-sm text-gray-500 mb-4">
              对比不同场景下的项目表现
            </p>

            <div className="text-center py-12">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <p className="text-sm text-gray-600">
                项目对比功能开发中...
              </p>
              <p className="text-xs text-gray-500 mt-1">
                支持保存多个项目方案并进行对比分析
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataAnalysisStep;
