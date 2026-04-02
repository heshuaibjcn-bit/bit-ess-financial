/**
 * 电价数据对比组件
 * 
 * 展示新旧电价数据的详细对比
 * 包括：
 * - 价格变化趋势
 * - 新增/删除/修改的电价项
 * - 可视化对比图表
 */

import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Plus, 
  Trash2, 
  Edit3, 
  ArrowRight,
  Filter,
  ChevronDown,
  ChevronUp,
  BarChart3,
  Table2,
  Download
} from 'lucide-react';
import { Badge } from '../ui/Badge';

/**
 * 电价项
 */
export interface TariffItem {
  id: string;
  voltageLevel: string;
  category: string;
  timePeriod: string;
  price: number;
  unit: string;
}

/**
 * 电价版本
 */
export interface TariffVersion {
  version: string;
  effectiveDate: string;
  policyNumber: string;
  items: TariffItem[];
}

/**
 * 对比结果
 */
export interface ComparisonResult {
  unchanged: TariffItem[];
  increased: PriceChangeItem[];
  decreased: PriceChangeItem[];
  added: TariffItem[];
  removed: TariffItem[];
}

export interface PriceChangeItem {
  oldItem: TariffItem;
  newItem: TariffItem;
  changeAmount: number;
  changePercent: number;
}

interface TariffDataComparisonProps {
  oldVersion: TariffVersion;
  newVersion: TariffVersion;
  provinceName: string;
}

type ViewMode = 'table' | 'chart';
type FilterType = 'all' | 'changed' | 'unchanged' | 'added' | 'removed';

export function TariffDataComparison({ 
  oldVersion, 
  newVersion, 
  provinceName 
}: TariffDataComparisonProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [filter, setFilter] = useState<FilterType>('all');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    increased: true,
    decreased: true,
    unchanged: false,
    added: true,
    removed: true,
  });
  
  // 计算对比结果
  const comparison = useMemo<ComparisonResult>(() => {
    const result: ComparisonResult = {
      unchanged: [],
      increased: [],
      decreased: [],
      added: [],
      removed: [],
    };
    
    // 创建旧版本映射
    const oldMap = new Map<string, TariffItem>();
    oldVersion.items.forEach(item => {
      const key = `${item.voltageLevel}_${item.category}_${item.timePeriod}`;
      oldMap.set(key, item);
    });
    
    // 对比新版本
    newVersion.items.forEach(newItem => {
      const key = `${newItem.voltageLevel}_${newItem.category}_${newItem.timePeriod}`;
      const oldItem = oldMap.get(key);
      
      if (oldItem) {
        const changeAmount = newItem.price - oldItem.price;
        const changePercent = (changeAmount / oldItem.price) * 100;
        
        if (Math.abs(changeAmount) < 0.0001) {
          result.unchanged.push(newItem);
        } else if (changeAmount > 0) {
          result.increased.push({
            oldItem,
            newItem,
            changeAmount,
            changePercent,
          });
        } else {
          result.decreased.push({
            oldItem,
            newItem,
            changeAmount,
            changePercent,
          });
        }
        
        // 从旧Map中删除已处理的项
        oldMap.delete(key);
      } else {
        result.added.push(newItem);
      }
    });
    
    // 剩余的就是删除的项
    result.removed = Array.from(oldMap.values());
    
    return result;
  }, [oldVersion, newVersion]);
  
  // 统计信息
  const stats = useMemo(() => {
    const totalChanges = comparison.increased.length + comparison.decreased.length;
    const avgIncrease = comparison.increased.length > 0
      ? comparison.increased.reduce((sum, item) => sum + item.changePercent, 0) / comparison.increased.length
      : 0;
    const avgDecrease = comparison.decreased.length > 0
      ? comparison.decreased.reduce((sum, item) => sum + Math.abs(item.changePercent), 0) / comparison.decreased.length
      : 0;
    
    return {
      totalChanges,
      added: comparison.added.length,
      removed: comparison.removed.length,
      unchanged: comparison.unchanged.length,
      avgIncrease,
      avgDecrease,
    };
  }, [comparison]);
  
  // 切换展开状态
  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };
  
  // 导出对比报告
  const exportReport = () => {
    const report = {
      province: provinceName,
      oldVersion,
      newVersion,
      comparison,
      stats,
      generatedAt: new Date().toISOString(),
    };
    
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `电价对比报告_${provinceName}_${newVersion.effectiveDate}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white rounded-lg shadow">
      {/* 头部 */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{provinceName} 电价数据对比</h2>
            <p className="text-sm text-gray-500 mt-1">
              对比版本: {oldVersion.version} → {newVersion.version}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode(viewMode === 'table' ? 'chart' : 'table')}
              className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              {viewMode === 'table' ? <BarChart3 className="w-4 h-4" /> : <Table2 className="w-4 h-4" />}
              {viewMode === 'table' ? '图表视图' : '表格视图'}
            </button>
            <button
              onClick={exportReport}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Download className="w-4 h-4" />
              导出报告
            </button>
          </div>
        </div>
        
        {/* 统计卡片 */}
        <div className="grid grid-cols-5 gap-4 mt-4">
          <StatCard
            title="价格上调"
            value={comparison.increased.length}
            icon={<TrendingUp className="w-4 h-4 text-red-500" />}
            color="red"
            subtitle={stats.avgIncrease > 0 ? `平均 +${stats.avgIncrease.toFixed(2)}%` : undefined}
          />
          <StatCard
            title="价格下调"
            value={comparison.decreased.length}
            icon={<TrendingDown className="w-4 h-4 text-green-500" />}
            color="green"
            subtitle={stats.avgDecrease > 0 ? `平均 -${stats.avgDecrease.toFixed(2)}%` : undefined}
          />
          <StatCard
            title="新增电价"
            value={comparison.added.length}
            icon={<Plus className="w-4 h-4 text-blue-500" />}
            color="blue"
          />
          <StatCard
            title="删除电价"
            value={comparison.removed.length}
            icon={<Trash2 className="w-4 h-4 text-orange-500" />}
            color="orange"
          />
          <StatCard
            title="未变化"
            value={comparison.unchanged.length}
            icon={<Minus className="w-4 h-4 text-gray-500" />}
            color="gray"
          />
        </div>
      </div>
      
      {/* 过滤器 */}
      <div className="px-6 py-3 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-4">
          <Filter className="w-4 h-4 text-gray-400" />
          <div className="flex gap-2">
            {(['all', 'changed', 'added', 'removed', 'unchanged'] as FilterType[]).map((type) => (
              <button
                key={type}
                onClick={() => setFilter(type)}
                className={`px-3 py-1 text-sm rounded-full transition-colors ${
                  filter === type
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
              >
                {type === 'all' && '全部'}
                {type === 'changed' && '价格变化'}
                {type === 'added' && '新增'}
                {type === 'removed' && '删除'}
                {type === 'unchanged' && '未变化'}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {/* 内容区域 */}
      <div className="p-6">
        {viewMode === 'table' ? (
          <div className="space-y-4">
            {/* 价格上调 */}
            {(filter === 'all' || filter === 'changed') && comparison.increased.length > 0 && (
              <ComparisonSection
                title="价格上调"
                icon={<TrendingUp className="w-5 h-5" />}
                color="red"
                count={comparison.increased.length}
                isExpanded={expandedSections.increased}
                onToggle={() => toggleSection('increased')}
              >
                <PriceChangeTable items={comparison.increased} type="increase" />
              </ComparisonSection>
            )}
            
            {/* 价格下调 */}
            {(filter === 'all' || filter === 'changed') && comparison.decreased.length > 0 && (
              <ComparisonSection
                title="价格下调"
                icon={<TrendingDown className="w-5 h-5" />}
                color="green"
                count={comparison.decreased.length}
                isExpanded={expandedSections.decreased}
                onToggle={() => toggleSection('decreased')}
              >
                <PriceChangeTable items={comparison.decreased} type="decrease" />
              </ComparisonSection>
            )}
            
            {/* 新增电价 */}
            {(filter === 'all' || filter === 'added') && comparison.added.length > 0 && (
              <ComparisonSection
                title="新增电价"
                icon={<Plus className="w-5 h-5" />}
                color="blue"
                count={comparison.added.length}
                isExpanded={expandedSections.added}
                onToggle={() => toggleSection('added')}
              >
                <TariffItemTable items={comparison.added} type="added" />
              </ComparisonSection>
            )}
            
            {/* 删除电价 */}
            {(filter === 'all' || filter === 'removed') && comparison.removed.length > 0 && (
              <ComparisonSection
                title="删除电价"
                icon={<Trash2 className="w-5 h-5" />}
                color="orange"
                count={comparison.removed.length}
                isExpanded={expandedSections.removed}
                onToggle={() => toggleSection('removed')}
              >
                <TariffItemTable items={comparison.removed} type="removed" />
              </ComparisonSection>
            )}
            
            {/* 未变化 */}
            {(filter === 'all' || filter === 'unchanged') && comparison.unchanged.length > 0 && (
              <ComparisonSection
                title="未变化"
                icon={<Minus className="w-5 h-5" />}
                color="gray"
                count={comparison.unchanged.length}
                isExpanded={expandedSections.unchanged}
                onToggle={() => toggleSection('unchanged')}
              >
                <TariffItemTable items={comparison.unchanged} type="unchanged" />
              </ComparisonSection>
            )}
          </div>
        ) : (
          <ComparisonChart comparison={comparison} />
        )}
      </div>
    </div>
  );
}

/**
 * 统计卡片
 */
function StatCard({ 
  title, 
  value, 
  icon, 
  color, 
  subtitle 
}: { 
  title: string; 
  value: number; 
  icon: React.ReactNode; 
  color: string;
  subtitle?: string;
}) {
  const colorClasses: Record<string, string> = {
    red: 'bg-red-50 border-red-200',
    green: 'bg-green-50 border-green-200',
    blue: 'bg-blue-50 border-blue-200',
    orange: 'bg-orange-50 border-orange-200',
    gray: 'bg-gray-50 border-gray-200',
  };
  
  return (
    <div className={`p-4 rounded-lg border ${colorClasses[color]}`}>
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-600">{title}</span>
        {icon}
      </div>
      <p className="text-2xl font-bold text-gray-900 mt-2">{value}</p>
      {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
    </div>
  );
}

/**
 * 对比区块
 */
function ComparisonSection({
  title,
  icon,
  color,
  count,
  isExpanded,
  onToggle,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  color: string;
  count: number;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  const colorClasses: Record<string, string> = {
    red: 'text-red-700 bg-red-50 border-red-200',
    green: 'text-green-700 bg-green-50 border-green-200',
    blue: 'text-blue-700 bg-blue-50 border-blue-200',
    orange: 'text-orange-700 bg-orange-50 border-orange-200',
    gray: 'text-gray-700 bg-gray-50 border-gray-200',
  };
  
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className={`w-full px-4 py-3 flex items-center justify-between ${colorClasses[color]}`}
      >
        <div className="flex items-center gap-2">
          {icon}
          <span className="font-medium">{title}</span>
          <span className="text-sm opacity-75">({count})</span>
        </div>
        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
      </button>
      {isExpanded && (
        <div className="p-4">
          {children}
        </div>
      )}
    </div>
  );
}

/**
 * 价格变化表格
 */
function PriceChangeTable({ 
  items, 
  type 
}: { 
  items: PriceChangeItem[]; 
  type: 'increase' | 'decrease';
}) {
  return (
    <table className="w-full">
      <thead>
        <tr className="text-left text-xs text-gray-500 border-b">
          <th className="pb-2">电压等级</th>
          <th className="pb-2">用电类别</th>
          <th className="pb-2">时段</th>
          <th className="pb-2 text-right">旧价格</th>
          <th className="pb-2 text-center"></th>
          <th className="pb-2 text-right">新价格</th>
          <th className="pb-2 text-right">变化</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item, index) => (
          <tr key={index} className="border-b border-gray-100 last:border-0">
            <td className="py-2 text-sm">{item.oldItem.voltageLevel}</td>
            <td className="py-2 text-sm">{item.oldItem.category}</td>
            <td className="py-2 text-sm">{item.oldItem.timePeriod}</td>
            <td className="py-2 text-sm text-right">{item.oldItem.price.toFixed(4)}</td>
            <td className="py-2 text-center">
              <ArrowRight className="w-4 h-4 text-gray-400 mx-auto" />
            </td>
            <td className="py-2 text-sm text-right">{item.newItem.price.toFixed(4)}</td>
            <td className={`py-2 text-sm text-right font-medium ${
              type === 'increase' ? 'text-red-600' : 'text-green-600'
            }`}>
              {type === 'increase' ? '+' : ''}
              {item.changeAmount.toFixed(4)}
              {' '}
              ({type === 'increase' ? '+' : ''}
              {item.changePercent.toFixed(2)}%)
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/**
 * 电价项表格
 */
function TariffItemTable({ 
  items, 
  type 
}: { 
  items: TariffItem[]; 
  type: 'added' | 'removed' | 'unchanged';
}) {
  const typeColors = {
    added: 'text-blue-600',
    removed: 'text-orange-600',
    unchanged: 'text-gray-600',
  };
  
  return (
    <table className="w-full">
      <thead>
        <tr className="text-left text-xs text-gray-500 border-b">
          <th className="pb-2">电压等级</th>
          <th className="pb-2">用电类别</th>
          <th className="pb-2">时段</th>
          <th className="pb-2 text-right">价格</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item, index) => (
          <tr key={index} className="border-b border-gray-100 last:border-0">
            <td className="py-2 text-sm">{item.voltageLevel}</td>
            <td className="py-2 text-sm">{item.category}</td>
            <td className="py-2 text-sm">{item.timePeriod}</td>
            <td className={`py-2 text-sm text-right font-medium ${typeColors[type]}`}>
              {item.price.toFixed(4)} 元/kWh
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/**
 * 对比图表
 */
function ComparisonChart({ comparison }: { comparison: ComparisonResult }) {
  // 这里可以集成 ECharts 或其他图表库
  // 为简化，这里只显示一个占位图
  return (
    <div className="h-96 flex items-center justify-center bg-gray-50 rounded-lg">
      <div className="text-center">
        <BarChart3 className="w-12 h-12 mx-auto text-gray-400 mb-4" />
        <p className="text-gray-500">图表视图开发中</p>
        <p className="text-sm text-gray-400 mt-1">
          将展示价格变化分布、变化幅度等可视化数据
        </p>
      </div>
    </div>
  );
}
