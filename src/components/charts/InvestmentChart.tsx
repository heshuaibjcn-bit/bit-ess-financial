/**
 * Investment Metrics Chart Component
 *
 * Displays IRR, NPV, Payback Period, and LCOE in interactive charts
 */

import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import { EngineResult } from '../../domain/services/CalculationEngine';

interface InvestmentChartProps {
  result: EngineResult;
  height?: string;
}

export function InvestmentChart({ result, height = '400px' }: InvestmentChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    // Initialize chart
    chartInstance.current = echarts.init(chartRef.current);

    // Configure chart
    const option: echarts.EChartsOption = {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        }
      },
      legend: {
        data: ['IRR (%)', 'NPV (万元)', '回收期 (年)', 'LCOE (元/kWh)'],
        bottom: 0
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '15%',
        top: '10%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: ['投资指标']
      },
      yAxis: [
        {
          type: 'value',
          name: '百分比 / 金额',
          position: 'left',
          axisLabel: {
            formatter: '{value}'
          }
        },
        {
          type: 'value',
          name: '年',
          position: 'right',
          axisLabel: {
            formatter: '{value} 年'
          }
        }
      ],
      series: [
        {
          name: 'IRR (%)',
          type: 'bar',
          data: [(result.financialMetrics.irr * 100).toFixed(2)],
          itemStyle: {
            color: '#3b82f6'
          },
          label: {
            show: true,
            position: 'top',
            formatter: '{c}%'
          }
        },
        {
          name: 'NPV (万元)',
          type: 'bar',
          data: [(result.financialMetrics.npv / 10000).toFixed(2)],
          itemStyle: {
            color: '#10b981'
          },
          label: {
            show: true,
            position: 'top',
            formatter: '{c}万'
          }
        },
        {
          name: '回收期 (年)',
          type: 'bar',
          yAxisIndex: 1,
          data: [result.financialMetrics.paybackPeriod.toFixed(2)],
          itemStyle: {
            color: '#f59e0b'
          },
          label: {
            show: true,
            position: 'top',
            formatter: '{c}年'
          }
        },
        {
          name: 'LCOE (元/kWh)',
          type: 'bar',
          data: [(result.financialMetrics.lcoe).toFixed(2)],
          itemStyle: {
            color: '#8b5cf6'
          },
          label: {
            show: true,
            position: 'top',
            formatter: '{c}元'
          }
        }
      ]
    };

    chartInstance.current.setOption(option);

    // Handle resize
    const handleResize = () => {
      chartInstance.current?.resize();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chartInstance.current?.dispose();
    };
  }, [result]);

  return <div ref={chartRef} style={{ width: '100%', height }} />;
}

/**
 * Cash Flow Chart Component
 */

interface CashFlowChartProps {
  result: EngineResult;
  height?: string;
}

export function CashFlowChart({ result, height = '400px' }: CashFlowChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    chartInstance.current = echarts.init(chartRef.current);

    const years = result.cashFlow?.map((_, i) => `第${i}年`) || [];
    const cashFlows = result.cashFlow || [];

    const option: echarts.EChartsOption = {
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          const param = params[0];
          const value = param.value;
          return `${param.name}<br/>现金流: ${value.toFixed(2)}万元`;
        }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: '10%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: years,
        axisLabel: {
          interval: Math.floor(years.length / 10)
        }
      },
      yAxis: {
        type: 'value',
        name: '现金流 (万元)',
        axisLabel: {
          formatter: '{value}'
        }
      },
      series: [
        {
          name: '现金流',
          type: 'line',
          data: cashFlows,
          smooth: true,
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(59, 130, 246, 0.3)' },
              { offset: 1, color: 'rgba(59, 130, 246, 0.05)' }
            ])
          },
          lineStyle: {
            color: '#3b82f6',
            width: 2
          },
          itemStyle: {
            color: '#3b82f6'
          },
          markLine: {
            data: [{ type: 'average', name: '平均值' }]
          }
        }
      ]
    };

    chartInstance.current.setOption(option);

    const handleResize = () => {
      chartInstance.current?.resize();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chartInstance.current?.dispose();
    };
  }, [result]);

  return <div ref={chartRef} style={{ width: '100%', height }} />;
}

/**
 * Cumulative Cash Flow Chart
 */

export function CumulativeCashFlowChart({ result, height = '400px' }: CashFlowChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    chartInstance.current = echarts.init(chartRef.current);

    const years = result.cashFlow?.map((_, i) => `第${i}年`) || [];
    const cashFlows = result.cashFlow || [];

    // Calculate cumulative cash flow
    let cumulative = 0;
    const cumulativeData = cashFlows.map(cf => {
      cumulative += cf;
      return cumulative;
    });

    // Find payback period (where cumulative becomes positive)
    const paybackIndex = cumulativeData.findIndex((value, index) => {
      return index > 0 && cumulativeData[index - 1] < 0 && value >= 0;
    });

    const option: echarts.EChartsOption = {
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          const param = params[0];
          const value = param.value;
          return `${param.name}<br/>累计现金流: ${value.toFixed(2)}万元`;
        }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: '10%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: years,
        axisLabel: {
          interval: Math.floor(years.length / 10)
        }
      },
      yAxis: {
        type: 'value',
        name: '累计现金流 (万元)',
        axisLabel: {
          formatter: '{value}'
        }
      },
      series: [
        {
          name: '累计现金流',
          type: 'line',
          data: cumulativeData,
          smooth: true,
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(16, 185, 129, 0.3)' },
              { offset: 1, color: 'rgba(16, 185, 129, 0.05)' }
            ])
          },
          lineStyle: {
            color: '#10b981',
            width: 2
          },
          itemStyle: {
            color: '#10b981'
          },
          markLine: {
            data: [
              { yAxis: 0, name: '盈亏平衡' }
            ],
            lineStyle: {
              color: '#ef4444',
              type: 'dashed'
            }
          },
          markPoint: paybackIndex >= 0 ? {
            data: [
              {
                coord: [years[paybackIndex], cumulativeData[paybackIndex]],
                value: '回收点',
                itemStyle: {
                  color: '#f59e0b'
                }
              }
            ]
          } : undefined
        }
      ]
    };

    chartInstance.current.setOption(option);

    const handleResize = () => {
      chartInstance.current?.resize();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chartInstance.current?.dispose();
    };
  }, [result]);

  return <div ref={chartRef} style={{ width: '100%', height }} />;
}