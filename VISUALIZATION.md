# Data Visualization Guide

## Overview

The ESS Financial platform features enterprise-grade data visualization powered by ECharts 5:

- **Interactive Charts** - Dynamic, responsive charts with animations
- **Custom Dashboards** - Build personalized dashboards with drag-and-drop
- **Real-time Updates** - Live data synchronization
- **Export Capabilities** - Export charts as images or data
- **Responsive Design** - Optimized for all screen sizes

## Installation

```bash
npm install echarts
npm install @types/echarts
npm install react-beautiful-dnd
```

## Chart Components

### Investment Metrics Chart

Display key investment metrics in a combined bar chart:

```typescript
import { InvestmentChart } from '@/components/charts/InvestmentChart';

<InvestmentChart
  result={calculationResult}
  height="400px"
/>
```

**Features:**
- IRR, NPV, Payback Period, LCOE in one view
- Color-coded metrics
- Interactive tooltips
- Responsive layout

### Cash Flow Chart

Visualize annual cash flows over time:

```typescript
import { CashFlowChart } from '@/components/charts/InvestmentChart';

<CashFlowChart
  result={calculationResult}
  height="400px"
/>
```

**Features:**
- Smooth line chart with area fill
- Average value marker
- Hover tooltips for detailed values
- X-axis with year labels

### Cumulative Cash Flow Chart

Track cumulative cash flow and payback point:

```typescript
import { CumulativeCashFlowChart } from '@/components/charts/InvestmentChart';

<CumulativeCashFlowChart
  result={calculationResult}
  height="400px"
/>
```

**Features:**
- Cumulative cash flow visualization
- Payback point marker
- Break-even line
- Color gradients

## Sensitivity Analysis Charts

### Tornado Chart

Analyze parameter sensitivity:

```typescript
import { SensitivityTornadoChart } from '@/components/charts/SensitivityChart';

<SensitivityTornadoChart
  data={sensitivityData}
  parameter="电价"
  height="400px"
/>
```

**Features:**
- IRR and NPV change rates
- Positive/negative value coloring
- Parameter value range

### Spider Chart

Multi-parameter sensitivity radar:

```typescript
import { SensitivitySpiderChart } from '@/components/charts/SensitivityChart';

<SensitivitySpiderChart
  data={spiderData}
  height="400px"
/>
```

**Features:**
- Radar chart for parameter comparison
- Current value visualization
- Min/max ranges

### Heat Map

Two-parameter sensitivity matrix:

```typescript
import { SensitivityHeatMap } from '@/components/charts/SensitivityChart';

<SensitivityHeatMap
  data={heatMapData}
  xParameter="初始投资"
  yParameter="电价"
  height="400px"
/>
```

**Features:**
- Color-coded IRR values
- Interactive hover tooltips
- Gradient color scale

## Benchmark Comparison Charts

### Comparison Bar Chart

Compare project metrics against benchmarks:

```typescript
import { BenchmarkComparisonChart } from '@/components/charts/BenchmarkChart';

<BenchmarkComparisonChart
  data={[
    { name: 'IRR', current: 15.5, benchmark: 12.0, unit: '%' },
    { name: 'NPV', current: 1250000, benchmark: 1000000, unit: '元' },
  ]}
  height="400px"
/>
```

**Features:**
- Side-by-side comparison
- Value labels on bars
- Color differentiation

### Gauge Chart

Single metric gauge with benchmark:

```typescript
import { BenchmarkGaugeChart } from '@/components/charts/BenchmarkChart';

<BenchmarkGaugeChart
  title="内部收益率"
  value={15.5}
  min={0}
  max={25}
  benchmark={12.0}
  unit="%"
  height="300px"
/>
```

**Features:**
- Semi-circle gauge
- Color-coded zones
- Benchmark marker
- Animated value display

### Radar Comparison

Multi-metric radar comparison:

```typescript
import { BenchmarkRadarChart } from '@/components/charts/BenchmarkChart';

<BenchmarkRadarChart
  data={[
    { indicator: 'IRR', current: 15.5, benchmark: 12.0, max: 25 },
    { indicator: 'NPV', current: 125, benchmark: 100, max: 200 },
  ]}
  height="400px"
/>
```

**Features:**
- Multiple metrics comparison
- Filled areas
- Legend for clarity

### Percentile Ranking

Show project percentile rankings:

```typescript
import { PercentileRankingChart } from '@/components/charts/BenchmarkChart';

<PercentileRankingChart
  data={[
    { metric: 'IRR', value: 15.5, percentile: 75, unit: '%' },
    { metric: 'NPV', value: 1250000, percentile: 80, unit: '万元' },
  ]}
  height="400px"
/>
```

**Features:**
- Horizontal bar chart
- Color-coded by percentile
- Ranking display

## Custom Dashboard Builder

### Create Dashboard

Build custom dashboards with drag-and-drop:

```typescript
import { DashboardBuilder } from '@/components/dashboard/DashboardBuilder';

const [widgets, setWidgets] = useState<DashboardWidget[]>([]);

<DashboardBuilder
  widgets={widgets}
  onWidgetsChange={setWidgets}
  editable={true}
/>
```

### Widget Types

#### Metric Card
```typescript
{
  id: 'widget-1',
  type: 'metric',
  title: '内部收益率',
  size: 'small',
  config: {
    metric: 'irr',
    format: 'percentage'
  }
}
```

#### Chart Widget
```typescript
{
  id: 'widget-2',
  type: 'chart',
  title: '投资指标对比',
  size: 'medium',
  config: {
    chartType: 'bar',
    metrics: ['irr', 'npv', 'payback']
  }
}
```

#### Table Widget
```typescript
{
  id: 'widget-3',
  type: 'table',
  title: '项目列表',
  size: 'large',
  config: {
    columns: ['name', 'irr', 'npv', 'payback']
  }
}
```

#### Text Widget
```typescript
{
  id: 'widget-4',
  type: 'text',
  title: '说明',
  size: 'small',
  config: {
    content: '这里是说明文字...'
  }
}
```

### Widget Sizes

- **Small** - 1x1 grid cell
- **Medium** - 2x2 grid cells
- **Large** - 3x3 grid cells

## Advanced Features

### Real-time Updates

Charts update automatically when data changes:

```typescript
const [result, setResult] = useState(calculationResult);

useEffect(() => {
  // Update chart when result changes
  setResult(newResult);
}, [newResult]);
```

### Export Charts

Export chart as image:

```typescript
import * as echarts from 'echarts';

const chart = echarts.init(domRef);
const url = chart.getDataURL({
  type: 'png',
  pixelRatio: 2,
  backgroundColor: '#fff'
});

// Download image
const link = document.createElement('a');
link.href = url;
link.download = 'chart.png';
link.click();
```

### Custom Themes

Apply custom themes:

```typescript
const theme = {
  color: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'],
  backgroundColor: '#ffffff',
  textStyle: {
    fontFamily: 'Arial, sans-serif'
  }
};

const chart = echarts.init(domRef, theme);
```

### Responsive Charts

Charts automatically resize:

```typescript
useEffect(() => {
  const chart = echarts.init(domRef);

  const handleResize = () => {
    chart.resize();
  };

  window.addEventListener('resize', handleResize);

  return () => {
    window.removeEventListener('resize', handleResize);
    chart.dispose();
  };
}, []);
```

## Configuration Options

### Chart Options

Common ECharts options:

```typescript
const option: echarts.EChartsOption = {
  // Tooltip
  tooltip: {
    trigger: 'axis',
    formatter: '{b}: {c}'
  },

  // Legend
  legend: {
    data: ['Series 1', 'Series 2'],
    bottom: 0
  },

  // Grid
  grid: {
    left: '3%',
    right: '4%',
    bottom: '15%',
    top: '10%',
    containLabel: true
  },

  // X Axis
  xAxis: {
    type: 'category',
    data: ['A', 'B', 'C']
  },

  // Y Axis
  yAxis: {
    type: 'value'
  },

  // Series
  series: [{
    type: 'bar',
    data: [1, 2, 3]
  }]
};
```

### Color Schemes

Pre-defined color schemes:

```typescript
const colors = {
  primary: '#3b82f6',    // Blue
  success: '#10b981',    // Green
  warning: '#f59e0b',    // Orange
  danger: '#ef4444',     // Red
  info: '#8b5cf6',       // Purple
  gray: '#9ca3af'        // Gray
};
```

## Best Practices

### 1. Choose Right Chart Type

```typescript
// ✅ Good - Appropriate chart for data
<CashFlowChart result={result} />  // Time series = line chart

// ❌ Bad - Inappropriate chart
<InvestmentChart result={result} />  // Single metric ≠ bar chart
```

### 2. Set Proper Dimensions

```typescript
// ✅ Good - Responsive height
<InvestmentChart result={result} height="400px" />

// ❌ Bad - Fixed pixel width
<div style={{ width: '800px' }}>
  <InvestmentChart result={result} />
</div>
```

### 3. Handle Loading States

```typescript
const [loading, setLoading] = useState(true);

useEffect(() => {
  fetchData().then(() => setLoading(false));
}, []);

return loading ? (
  <div>Loading...</div>
) : (
  <InvestmentChart result={result} />
);
```

### 4. Clean Up Resources

```typescript
useEffect(() => {
  const chart = echarts.init(domRef);

  return () => {
    chart.dispose();  // Important!
  };
}, []);
```

## Performance Tips

### 1. Lazy Load Charts

```typescript
const InvestmentChart = lazy(() => import('@/components/charts/InvestmentChart'));

<Suspense fallback={<div>Loading...</div>}>
  <InvestmentChart result={result} />
</Suspense>
```

### 2. Debounce Updates

```typescript
const debouncedUpdate = useMemo(
  () => debounce((data) => updateChart(data), 300),
  []
);
```

### 3. Virtual Scrolling

For large datasets, use virtual scrolling:

```typescript
import { VirtualScroll } from '@/components/VirtualScroll';

<VirtualScroll
  items={largeData}
  itemHeight={50}
  renderItem={(item) => <Chart data={item} />}
/>
```

## Troubleshooting

### Chart Not Rendering

**Problem**: Chart doesn't appear
**Solution**:
1. Check if container has dimensions
2. Verify data is loaded
3. Check browser console for errors

### Chart Looks Blurry

**Problem**: Chart looks pixelated
**Solution**:
```typescript
chart.setOption({
  renderer: 'canvas',  // or 'svg'
  devicePixelRatio: window.devicePixelRatio
});
```

### Tooltip Not Working

**Problem**: Tooltip doesn't show
**Solution**:
```typescript
tooltip: {
  trigger: 'axis',  // or 'item'
  confine: true     // Keep within chart area
}
```

## API Reference

### Chart Component Props

```typescript
interface InvestmentChartProps {
  result: EngineResult;
  height?: string;  // Default: '400px'
}

interface SensitivityChartProps {
  data: SensitivityDataPoint[];
  parameter: string;
  height?: string;
}

interface BenchmarkChartProps {
  data: BenchmarkData[];
  height?: string;
}
```

### Dashboard Builder Props

```typescript
interface DashboardBuilderProps {
  widgets: DashboardWidget[];
  onWidgetsChange: (widgets: DashboardWidget[]) => void;
  editable?: boolean;  // Default: true
}

interface DashboardWidget {
  id: string;
  type: 'chart' | 'metric' | 'table' | 'text';
  title: string;
  size: 'small' | 'medium' | 'large';
  position: { x: number; y: number };
  config: any;
}
```

## Support

For visualization issues:
1. Check ECharts documentation
2. Verify data format
3. Test with sample data
4. Check browser compatibility

## License

Proprietary - All rights reserved