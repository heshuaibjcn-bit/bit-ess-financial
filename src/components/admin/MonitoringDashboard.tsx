/**
 * 监控告警Dashboard
 * 
 * 展示数据质量监控和告警信息
 * 功能：
 * 1. 实时数据质量评分
 * 2. 告警列表管理
 * 3. 异常检测可视化
 * 4. 告警规则配置
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Bell, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Activity,
  TrendingUp,
  TrendingDown,
  Settings,
  Filter,
  Search,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Clock,
  MapPin,
  BarChart3,
  PieChart
} from 'lucide-react';
import { Badge } from '../ui/Badge';
import { 
  DataQualityResult, 
  AnomalyDetectionResult,
  AlertEvent,
  AlertRule 
} from '../../services/monitoring/DataQualityMonitor';

interface MonitoringDashboardProps {
  qualityResult?: DataQualityResult;
  anomalyResult?: AnomalyDetectionResult;
  alerts?: AlertEvent[];
  rules?: AlertRule[];
  onRefresh?: () => void;
  onAcknowledgeAlert?: (alertId: string) => void;
  onToggleRule?: (ruleId: string, enabled: boolean) => void;
}

export function MonitoringDashboard({
  qualityResult,
  anomalyResult,
  alerts = [],
  rules = [],
  onRefresh,
  onAcknowledgeAlert,
  onToggleRule,
}: MonitoringDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'alerts' | 'rules' | 'anomalies'>('overview');
  const [filterSeverity, setFilterSeverity] = useState<'all' | 'critical' | 'high' | 'medium' | 'low'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'acknowledged' | 'unacknowledged'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedAlerts, setExpandedAlerts] = useState<Set<string>>(new Set());
  
  // 过滤告警
  const filteredAlerts = useMemo(() => {
    return alerts.filter(alert => {
      // 严重级别过滤
      if (filterSeverity !== 'all' && alert.severity !== filterSeverity) {
        return false;
      }
      
      // 状态过滤
      if (filterStatus === 'acknowledged' && !alert.acknowledged) {
        return false;
      }
      if (filterStatus === 'unacknowledged' && alert.acknowledged) {
        return false;
      }
      
      // 搜索过滤
      if (searchQuery && !(
        alert.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
        alert.ruleName.toLowerCase().includes(searchQuery.toLowerCase())
      )) {
        return false;
      }
      
      return true;
    });
  }, [alerts, filterSeverity, filterStatus, searchQuery]);
  
  // 统计信息
  const stats = useMemo(() => {
    const unacknowledgedAlerts = alerts.filter(a => !a.acknowledged);
    return {
      totalAlerts: alerts.length,
      unacknowledged: unacknowledgedAlerts.length,
      critical: unacknowledgedAlerts.filter(a => a.severity === 'critical').length,
      high: unacknowledgedAlerts.filter(a => a.severity === 'high').length,
      medium: unacknowledgedAlerts.filter(a => a.severity === 'medium').length,
      low: unacknowledgedAlerts.filter(a => a.severity === 'low').length,
      qualityScore: qualityResult?.overallScore || 0,
      qualityStatus: qualityResult?.status || 'unknown',
      anomalyCount: anomalyResult?.anomalies.length || 0,
    };
  }, [alerts, qualityResult, anomalyResult]);
  
  // 切换告警展开状态
  const toggleAlertExpand = (alertId: string) => {
    setExpandedAlerts(prev => {
      const next = new Set(prev);
      if (next.has(alertId)) {
        next.delete(alertId);
      } else {
        next.add(alertId);
      }
      return next;
    });
  };

  return (
    <div className="bg-white rounded-lg shadow">
      {/* 头部 */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">数据监控中心</h2>
            <p className="mt-1 text-sm text-gray-500">
              实时监控电价数据质量和异常情况
            </p>
          </div>
          <button
            onClick={onRefresh}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            刷新
          </button>
        </div>
        
        {/* 统计卡片 */}
        <div className="grid grid-cols-4 gap-4 mt-4">
          <StatCard
            title="数据质量评分"
            value={`${stats.qualityScore}`}
            unit="分"
            icon={<Activity className="w-5 h-5" />}
            color={getQualityScoreColor(stats.qualityScore)}
            subtitle={getQualityStatusText(stats.qualityStatus)}
          />
          <StatCard
            title="待处理告警"
            value={stats.unacknowledged}
            icon={<Bell className="w-5 h-5" />}
            color={stats.unacknowledged > 0 ? 'red' : 'green'}
            subtitle={`总计 ${stats.totalAlerts} 条`}
          />
          <StatCard
            title="异常检测"
            value={stats.anomalyCount}
            unit="个"
            icon={<AlertTriangle className="w-5 h-5" />}
            color={stats.anomalyCount > 0 ? 'orange' : 'green'}
            subtitle={stats.anomalyCount > 0 ? '发现异常' : '无异常'}
          />
          <StatCard
            title="告警规则"
            value={rules.filter(r => r.enabled).length}
            unit="/"
            total={rules.length}
            icon={<Settings className="w-5 h-5" />}
            color="blue"
            subtitle="已启用"
          />
        </div>
        
        {/* 严重级别分布 */}
        <div className="flex gap-2 mt-4">
          {stats.critical > 0 && (
            <SeverityBadge severity="critical" count={stats.critical} />
          )}
          {stats.high > 0 && (
            <SeverityBadge severity="high" count={stats.high} />
          )}
          {stats.medium > 0 && (
            <SeverityBadge severity="medium" count={stats.medium} />
          )}
          {stats.low > 0 && (
            <SeverityBadge severity="low" count={stats.low} />
          )}
        </div>
      </div>
      
      {/* 标签页 */}
      <div className="px-6 border-b border-gray-200">
        <div className="flex gap-4">
          {(['overview', 'alerts', 'rules', 'anomalies'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab === 'overview' && '概览'}
              {tab === 'alerts' && '告警列表'}
              {tab === 'rules' && '告警规则'}
              {tab === 'anomalies' && '异常检测'}
            </button>
          ))}
        </div>
      </div>
      
      {/* 内容区域 */}
      <div className="p-6">
        {activeTab === 'overview' && (
          <OverviewTab 
            qualityResult={qualityResult} 
            anomalyResult={anomalyResult}
            recentAlerts={alerts.slice(0, 5)}
          />
        )}
        
        {activeTab === 'alerts' && (
          <AlertsTab
            alerts={filteredAlerts}
            filterSeverity={filterSeverity}
            setFilterSeverity={setFilterSeverity}
            filterStatus={filterStatus}
            setFilterStatus={setFilterStatus}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            expandedAlerts={expandedAlerts}
            onToggleExpand={toggleAlertExpand}
            onAcknowledge={onAcknowledgeAlert}
          />
        )}
        
        {activeTab === 'rules' && (
          <RulesTab rules={rules} onToggle={onToggleRule} />
        )}
        
        {activeTab === 'anomalies' && (
          <AnomaliesTab anomalyResult={anomalyResult} />
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
  unit, 
  total,
  icon, 
  color, 
  subtitle 
}: { 
  title: string; 
  value: number | string;
  unit?: string;
  total?: number;
  icon: React.ReactNode; 
  color: string;
  subtitle?: string;
}) {
  const colorClasses: Record<string, string> = {
    red: 'bg-red-50 text-red-700',
    green: 'bg-green-50 text-green-700',
    blue: 'bg-blue-50 text-blue-700',
    orange: 'bg-orange-50 text-orange-700',
    yellow: 'bg-yellow-50 text-yellow-700',
    gray: 'bg-gray-50 text-gray-700',
  };
  
  return (
    <div className={`p-4 rounded-lg ${colorClasses[color]}`}>
      <div className="flex items-center justify-between">
        <span className="text-sm opacity-75">{title}</span>
        {icon}
      </div>
      <div className="flex items-baseline gap-1 mt-2">
        <span className="text-2xl font-bold">{value}</span>
        {unit && <span className="text-sm">{unit}</span>}
        {total !== undefined && <span className="text-lg">{total}</span>}
      </div>
      {subtitle && <p className="text-xs opacity-75 mt-1">{subtitle}</p>}
    </div>
  );
}

/**
 * 严重级别标签
 */
function SeverityBadge({ severity, count }: { severity: string; count: number }) {
  const colors: Record<string, string> = {
    critical: 'bg-red-100 text-red-800',
    high: 'bg-orange-100 text-orange-800',
    medium: 'bg-yellow-100 text-yellow-800',
    low: 'bg-blue-100 text-blue-800',
  };
  
  const labels: Record<string, string> = {
    critical: '严重',
    high: '高',
    medium: '中',
    low: '低',
  };
  
  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors[severity]}`}>
      {labels[severity]}: {count}
    </span>
  );
}

/**
 * 获取质量评分颜色
 */
function getQualityScoreColor(score: number): string {
  if (score >= 90) return 'green';
  if (score >= 70) return 'blue';
  if (score >= 50) return 'yellow';
  return 'red';
}

/**
 * 获取质量状态文本
 */
function getQualityStatusText(status: string): string {
  const texts: Record<string, string> = {
    excellent: '优秀',
    good: '良好',
    warning: '警告',
    critical: '严重',
    unknown: '未知',
  };
  return texts[status] || status;
}

/**
 * 概览标签页
 */
function OverviewTab({ 
  qualityResult, 
  anomalyResult,
  recentAlerts 
}: { 
  qualityResult?: DataQualityResult;
  anomalyResult?: AnomalyDetectionResult;
  recentAlerts: AlertEvent[];
}) {
  return (
    <div className="space-y-6">
      {/* 质量检查详情 */}
      {qualityResult && (
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-3">质量检查详情</h3>
          <div className="space-y-2">
            {qualityResult.checks.map((check, index) => (
              <div 
                key={index}
                className={`p-3 rounded-lg border ${
                  check.passed 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-yellow-50 border-yellow-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {check.passed ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-yellow-600" />
                    )}
                    <span className="font-medium text-sm">{check.name}</span>
                  </div>
                  <span className={`text-sm font-medium ${
                    check.score >= 70 ? 'text-green-600' : 'text-yellow-600'
                  }`}>
                    {check.score}分
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1">{check.message}</p>
                {check.details && check.details.length > 0 && (
                  <ul className="mt-2 text-xs text-gray-500 space-y-1">
                    {check.details.map((detail, i) => (
                      <li key={i}>• {detail}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* 最近告警 */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-3">最近告警</h3>
        {recentAlerts.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <CheckCircle className="w-8 h-8 mx-auto text-green-500 mb-2" />
            <p className="text-sm text-gray-500">暂无告警</p>
          </div>
        ) : (
          <div className="space-y-2">
            {recentAlerts.map((alert) => (
              <div 
                key={alert.id}
                className={`p-3 rounded-lg border ${
                  alert.acknowledged 
                    ? 'bg-gray-50 border-gray-200' 
                    : 'bg-red-50 border-red-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <SeverityBadge severity={alert.severity} count={0} />
                  <span className="text-sm font-medium">{alert.message}</span>
                  {alert.acknowledged && (
                    <Badge variant="secondary" className="text-xs">已确认</Badge>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(alert.triggeredAt).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * 告警列表标签页
 */
function AlertsTab({
  alerts,
  filterSeverity,
  setFilterSeverity,
  filterStatus,
  setFilterStatus,
  searchQuery,
  setSearchQuery,
  expandedAlerts,
  onToggleExpand,
  onAcknowledge,
}: {
  alerts: AlertEvent[];
  filterSeverity: string;
  setFilterSeverity: (s: any) => void;
  filterStatus: string;
  setFilterStatus: (s: any) => void;
  searchQuery: string;
  setSearchQuery: (s: string) => void;
  expandedAlerts: Set<string>;
  onToggleExpand: (id: string) => void;
  onAcknowledge?: (id: string) => void;
}) {
  return (
    <div>
      {/* 过滤器 */}
      <div className="flex flex-wrap gap-4 mb-4">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="搜索告警..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
        </div>
        <select
          value={filterSeverity}
          onChange={(e) => setFilterSeverity(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
        >
          <option value="all">所有级别</option>
          <option value="critical">严重</option>
          <option value="high">高</option>
          <option value="medium">中</option>
          <option value="low">低</option>
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
        >
          <option value="all">所有状态</option>
          <option value="unacknowledged">未确认</option>
          <option value="acknowledged">已确认</option>
        </select>
      </div>
      
      {/* 告警列表 */}
      <div className="space-y-2">
        {alerts.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle className="w-12 h-12 mx-auto text-green-500 mb-4" />
            <p className="text-gray-500">没有找到匹配的告警</p>
          </div>
        ) : (
          alerts.map((alert) => (
            <div 
              key={alert.id}
              className={`border rounded-lg overflow-hidden ${
                alert.acknowledged ? 'border-gray-200' : 'border-red-200'
              }`}
            >
              <div 
                className={`p-4 flex items-center justify-between ${
                  alert.acknowledged ? 'bg-gray-50' : 'bg-red-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <SeverityBadge severity={alert.severity} count={0} />
                  <div>
                    <p className="font-medium text-sm">{alert.message}</p>
                    <p className="text-xs text-gray-500">
                      {alert.ruleName} · {new Date(alert.triggeredAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!alert.acknowledged && onAcknowledge && (
                    <button
                      onClick={() => onAcknowledge(alert.id)}
                      className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      确认
                    </button>
                  )}
                  <button
                    onClick={() => onToggleExpand(alert.id)}
                    className="p-1 text-gray-400 hover:text-gray-600"
                  >
                    {expandedAlerts.has(alert.id) ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
              
              {expandedAlerts.has(alert.id) && (
                <div className="p-4 bg-white border-t">
                  <h4 className="text-sm font-medium mb-2">详细信息</h4>
                  <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto">
                    {JSON.stringify(alert.details, null, 2)}
                  </pre>
                  {alert.acknowledged && (
                    <div className="mt-3 text-xs text-gray-500">
                      <p>确认人: {alert.acknowledgedBy}</p>
                      <p>确认时间: {alert.acknowledgedAt && new Date(alert.acknowledgedAt).toLocaleString()}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/**
 * 规则标签页
 */
function RulesTab({ 
  rules, 
  onToggle 
}: { 
  rules: AlertRule[];
  onToggle?: (ruleId: string, enabled: boolean) => void;
}) {
  return (
    <div className="space-y-2">
      {rules.length === 0 ? (
        <div className="text-center py-12">
          <Settings className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500">暂无告警规则</p>
        </div>
      ) : (
        rules.map((rule) => (
          <div 
            key={rule.id}
            className="p-4 border border-gray-200 rounded-lg flex items-center justify-between"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">{rule.name}</span>
                <SeverityBadge severity={rule.severity} count={0} />
                {rule.enabled ? (
                  <Badge variant="success" className="text-xs">启用</Badge>
                ) : (
                  <Badge variant="secondary" className="text-xs">禁用</Badge>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-1">
                条件: {rule.condition.type} {rule.condition.operator} {rule.condition.threshold}
                {' · '}
                冷却: {rule.cooldownMinutes}分钟
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={rule.enabled}
                onChange={(e) => onToggle?.(rule.id, e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        ))
      )}
    </div>
  );
}

/**
 * 异常检测标签页
 */
function AnomaliesTab({ anomalyResult }: { anomalyResult?: AnomalyDetectionResult }) {
  if (!anomalyResult || anomalyResult.anomalies.length === 0) {
    return (
      <div className="text-center py-12">
        <CheckCircle className="w-12 h-12 mx-auto text-green-500 mb-4" />
        <p className="text-gray-500">未检测到异常</p>
      </div>
    );
  }
  
  const typeLabels: Record<string, string> = {
    price_spike: '价格飙升',
    price_drop: '价格暴跌',
    missing_data: '数据缺失',
    outlier: '离群值',
    inconsistency: '数据不一致',
  };
  
  return (
    <div className="space-y-4">
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-yellow-600" />
          <span className="font-medium text-yellow-800">
            检测到 {anomalyResult.anomalies.length} 个异常
          </span>
        </div>
      </div>
      
      <div className="space-y-2">
        {anomalyResult.anomalies.map((anomaly, index) => (
          <div 
            key={index}
            className="p-4 border border-gray-200 rounded-lg"
          >
            <div className="flex items-center gap-2">
              <SeverityBadge severity={anomaly.severity} count={0} />
              <span className="font-medium">{typeLabels[anomaly.type] || anomaly.type}</span>
            </div>
            <p className="text-sm text-gray-600 mt-2">{anomaly.message}</p>
            {anomaly.expectedRange && (
              <p className="text-xs text-gray-500 mt-1">
                预期范围: {anomaly.expectedRange.min.toFixed(4)} - {anomaly.expectedRange.max.toFixed(4)}
                {anomaly.actualValue && ` · 实际值: ${anomaly.actualValue.toFixed(4)}`}
              </p>
            )}
            {anomaly.affectedItems.length > 0 && (
              <div className="mt-2 text-xs text-gray-500">
                影响: {anomaly.affectedItems.length} 个电价项
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
