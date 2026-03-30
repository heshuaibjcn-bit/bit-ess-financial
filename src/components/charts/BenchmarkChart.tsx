/**
 * Benchmark Comparison Charts
 *
 * Compare project metrics against industry benchmarks
 */

import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts';

interface BenchmarkData {
  name: string;
  current: number;
  benchmark: number;
  unit: string;
  higherIsBetter?: boolean;
}

interface BenchmarkComparisonProps {
  data: BenchmarkData[];
  height?: string;
}

export function BenchmarkComparisonChart({ data, height = '400px' }: BenchmarkComparisonProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!chartRef.current || !data.length) return;

    chartInstance.current = echarts.init(chartRef.current);

    const categories = data.map(d => d.name);
    const currentValues = data.map(d => d.current);
    const benchmarkValues = data.map(d => d.benchmark);

    const option: echarts.EChartsOption = {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        }
      },
      legend: {
        data: ['当前项目', '行业基准'],
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
        data: categories
      },
      yAxis: {
        type: 'value',
        name: '数值'
      },
      series: [
        {
          name: '当前项目',
          type: 'bar',
          data: currentValues,
          itemStyle: {
            color: '#3b82f6'
          },
          label: {
            show: true,
            position: 'top',
            formatter: (params: any) => {
              const item = data[params.dataIndex];
              return `${params.value}${item.unit}`;
            }
          }
        },
        {
          name: '行业基准',
          type: 'bar',
          data: benchmarkValues,
          itemStyle: {
            color: '#9ca3af'
          },
          label: {
            show: true,
            position: 'top',
            formatter: (params: any) => {
              const item = data[params.dataIndex];
              return `${params.value}${item.unit}`;
            }
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
  }, [data]);

  return <div ref={chartRef} style={{ width: '100%', height }} />;
}

/**
 * Benchmark Gauge Chart
 */

interface GaugeChartProps {
  title: string;
  value: number;
  min: number;
  max: number;
  benchmark: number;
  unit: string;
  height?: string;
}

export function BenchmarkGaugeChart({
  title,
  value,
  min,
  max,
  benchmark,
  unit,
  height = '300px'
}: GaugeChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    chartInstance.current = echarts.init(chartRef.current);

    const option: echarts.EChartsOption = {
      series: [
        {
          type: 'gauge',
          min,
          max,
          splitNumber: 10,
          progress: {
            show: true,
            width: 15
          },
          axisLine: {
            lineStyle: {
              width: 15,
              color: [
                [benchmark / (max - min), '#10b981'],
                [value / (max - min), '#3b82f6'],
                [1, '#ef4444']
              ]
            }
          },
          axisTick: {
            distance: -25,
            length: 5,
            lineStyle: {
              color: '#fff',
              width: 1
            }
          },
          splitLine: {
            distance: -30,
            length: 15,
            lineStyle: {
              color: '#fff',
              width: 2
            }
          },
          axisLabel: {
            distance: -10,
            color: '#999',
            fontSize: 10
          },
          anchor: {
            show: true,
            showAbove: true,
            size: 20,
            itemStyle: {
              borderWidth: 5
            }
          },
          title: {
            show: false
          },
          detail: {
            valueAnimation: true,
            fontSize: 20,
            offsetCenter: [0, '70%'],
            formatter: (value: number) => {
              return `${value.toFixed(2)}${unit}`;
            },
            color: 'inherit'
          },
          data: [
            {
              value: value
            }
          ]
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
  }, [value, min, max, benchmark, unit]);

  return (
    <div>
      <div className="text-center text-sm font-medium text-gray-700 mb-2">
        {title}
      </div>
      <div ref={chartRef} style={{ width: '100%', height }} />
    </div>
  );
}

/**
 * Benchmark Radar Chart
 */

interface RadarBenchmarkData {
  indicator: string;
  current: number;
  benchmark: number;
  max: number;
}

interface BenchmarkRadarProps {
  data: RadarBenchmarkData[];
  height?: string;
}

export function BenchmarkRadarChart({ data, height = '400px' }: BenchmarkRadarProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!chartRef.current || !data.length) return;

    chartInstance.current = echarts.init(chartRef.current);

    const indicators = data.map(d => ({
      name: d.indicator,
      max: d.max
    }));

    const currentValues = data.map(d => d.current);
    const benchmarkValues = data.map(d => d.benchmark);

    const option: echarts.EChartsOption = {
      tooltip: {
        trigger: 'item'
      },
      legend: {
        data: ['当前项目', '行业基准'],
        bottom: 0
      },
      radar: {
        indicator: indicators,
        radius: '65%'
      },
      series: [
        {
          name: '基准对比',
          type: 'radar',
          data: [
            {
              value: currentValues,
              name: '当前项目',
              itemStyle: {
                color: '#3b82f6'
              },
              areaStyle: {
                color: 'rgba(59, 130, 246, 0.3)'
              }
            },
            {
              value: benchmarkValues,
              name: '行业基准',
              itemStyle: {
                color: '#9ca3af'
              },
              areaStyle: {
                color: 'rgba(156, 163, 175, 0.3)'
              }
            }
          ]
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
  }, [data]);

  return <div ref={chartRef} style={{ width: '100%', height }} />;
}

/**
 * Percentile Ranking Chart
 */

interface PercentileData {
  metric: string;
  value: number;
  percentile: number;
  unit: string;
}

interface PercentileRankingProps {
  data: PercentileData[];
  height?: string;
}

export function PercentileRankingChart({ data, height = '400px' }: PercentileRankingProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!chartRef.current || !data.length) return;

    chartInstance.current = echarts.init(chartRef.current);

    const option: echarts.EChartsOption = {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        },
        formatter: (params: any) => {
          const param = params[0];
          const item = data[param.dataIndex];
          return `
            ${item.metric}<br/>
            当前值: ${item.value}${item.unit}<br/>
            百分位: ${item.percentile}%
          `;
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
        type: 'value',
        max: 100,
        name: '百分位 (%)'
      },
      yAxis: {
        type: 'category',
        data: data.map(d => d.metric)
      },
      series: [
        {
          type: 'bar',
          data: data.map(d => ({
            value: d.percentile,
            itemStyle: {
              color: d.percentile >= 75 ? '#10b981' : d.percentile >= 50 ? '#3b82f6' : d.percentile >= 25 ? '#f59e0b' : '#ef4444'
            }
          })),
          label: {
            show: true,
            position: 'right',
            formatter: '{c}%'
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
  }, [data]);

  return <div ref={chartRef} style={{ width: '100%', height }} />;
}