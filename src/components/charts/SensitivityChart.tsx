/**
 * Sensitivity Analysis Charts
 *
 * Visualize how changes in parameters affect investment returns
 */

import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts';

interface SensitivityDataPoint {
  parameter: string;
  value: number;
  irr: number;
  npv: number;
}

interface SensitivityChartProps {
  data: SensitivityDataPoint[];
  parameter: string;
  height?: string;
}

export function SensitivityTornadoChart({ data, parameter, height = '400px' }: SensitivityChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!chartRef.current || !data.length) return;

    chartInstance.current = echarts.init(chartRef.current);

    // Calculate base values
    const baseIRR = data[0]?.irr || 0;
    const baseNPV = data[0]?.npv || 0;

    // Calculate changes
    const irrChanges = data.map(d => ((d.irr - baseIRR) / baseIRR) * 100);
    const npvChanges = data.map(d => ((d.npv - baseNPV) / Math.abs(baseNPV || 1)) * 100);
    const values = data.map(d => d.value);

    const option: echarts.EChartsOption = {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        },
        formatter: (params: any) => {
          const irrParam = params[0];
          const npvParam = params[1];
          return `
            ${parameter}: ${irrParam.name}<br/>
            IRR变化: ${irrParam.value.toFixed(2)}%<br/>
            NPV变化: ${npvParam.value.toFixed(2)}%
          `;
        }
      },
      legend: {
        data: ['IRR变化率', 'NPV变化率'],
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
        data: values.map(v => v.toFixed(2)),
        name: parameter
      },
      yAxis: {
        type: 'value',
        name: '变化率 (%)',
        axisLabel: {
          formatter: '{value}%'
        }
      },
      series: [
        {
          name: 'IRR变化率',
          type: 'bar',
          data: irrChanges,
          itemStyle: {
            color: (params: any) => {
              return params.value >= 0 ? '#10b981' : '#ef4444';
            }
          },
          label: {
            show: true,
            position: 'top',
            formatter: '{c}%'
          }
        },
        {
          name: 'NPV变化率',
          type: 'bar',
          data: npvChanges,
          itemStyle: {
            color: (params: any) => {
              return params.value >= 0 ? '#3b82f6' : '#f59e0b';
            }
          },
          label: {
            show: true,
            position: 'top',
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
  }, [data, parameter]);

  return <div ref={chartRef} style={{ width: '100%', height }} />;
}

/**
 * Spider Chart for Multi-parameter Sensitivity
 */

interface SpiderData {
  indicator: string;
  current: number;
  min: number;
  max: number;
}

interface SensitivitySpiderChartProps {
  data: SpiderData[];
  height?: string;
}

export function SensitivitySpiderChart({ data, height = '400px' }: SensitivitySpiderChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!chartRef.current || !data.length) return;

    chartInstance.current = echarts.init(chartRef.current);

    const indicators = data.map(d => ({
      name: d.indicator,
      max: d.max,
      min: d.min
    }));

    const currentValues = data.map(d => d.current);

    const option: echarts.EChartsOption = {
      tooltip: {
        trigger: 'item'
      },
      legend: {
        data: ['当前值', '最小值', '最大值'],
        bottom: 0
      },
      radar: {
        indicator: indicators,
        radius: '65%',
        axisName: {
          color: '#666'
        }
      },
      series: [
        {
          name: '敏感性分析',
          type: 'radar',
          data: [
            {
              value: currentValues,
              name: '当前值',
              itemStyle: {
                color: '#3b82f6'
              },
              areaStyle: {
                color: 'rgba(59, 130, 246, 0.3)'
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
 * Heat Map for Two-parameter Sensitivity
 */

interface HeatMapData {
  x: number;
  y: number;
  value: number;
}

interface SensitivityHeatMapProps {
  data: HeatMapData[];
  xParameter: string;
  yParameter: string;
  height?: string;
}

export function SensitivityHeatMap({
  data,
  xParameter,
  yParameter,
  height = '400px'
}: SensitivityHeatMapProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!chartRef.current || !data.length) return;

    chartInstance.current = echarts.init(chartRef.current);

    // Extract unique values for axes
    const xValues = [...new Set(data.map(d => d.x))].sort((a, b) => a - b);
    const yValues = [...new Set(data.map(d => d.y))].sort((a, b) => a - b);

    // Create 2D array for heatmap
    const heatmapData = data.map(d => [d.x, d.y, d.value]);

    // Find min/max for color scale
    const values = data.map(d => d.value);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);

    const option: echarts.EChartsOption = {
      tooltip: {
        position: 'top',
        formatter: (params: any) => {
          return `
            ${xParameter}: ${params.value[0]}<br/>
            ${yParameter}: ${params.value[1]}<br/>
            IRR: ${params.value[2].toFixed(2)}%
          `;
        }
      },
      grid: {
        height: '70%',
        top: '10%'
      },
      xAxis: {
        type: 'category',
        data: xValues,
        name: xParameter,
        splitArea: {
          show: true
        }
      },
      yAxis: {
        type: 'category',
        data: yValues,
        name: yParameter,
        splitArea: {
          show: true
        }
      },
      visualMap: {
        min: minValue,
        max: maxValue,
        calculable: true,
        orient: 'horizontal',
        left: 'center',
        bottom: '5%',
        inRange: {
          color: ['#ef4444', '#f59e0b', '#10b981', '#3b82f6']
        },
        text: ['高', '低']
      },
      series: [
        {
          name: 'IRR',
          type: 'heatmap',
          data: heatmapData,
          label: {
            show: false
          },
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
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
  }, [data, xParameter, yParameter]);

  return <div ref={chartRef} style={{ width: '100%', height }} />;
}