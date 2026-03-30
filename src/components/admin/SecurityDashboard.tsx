/**
 * Security Dashboard for Enterprise Administration
 *
 * Comprehensive security monitoring and management:
 * - Real-time security event monitoring
 * - Compliance reporting (SOC 2, ISO 27001)
 * - User and permission management
 * - Audit log viewing
 * - Security recommendations
 */

import React, { useState, useEffect } from 'react';
import { useAuth, useAuthorization, useSecurityMonitoring } from '../../contexts/SecurityContext';
import { Permission, UserRole } from '../../services/security/RBAC';
import { SecuritySeverity, SecurityEventType } from '../../services/security/SecurityCompliance';
import { SecurityStatsCard } from '../security/SecurityComponents';

/**
 * Security Dashboard Component
 */
export function SecurityDashboard() {
  const { user } = useAuth();
  const { hasPermission } = useAuthorization();
  const { securityStats, recordSecurityEvent, generateComplianceReport } = useSecurityMonitoring();

  const [activeTab, setActiveTab] = useState<'overview' | 'events' | 'compliance' | 'users'>('overview');
  const [reportPeriod, setReportPeriod] = useState(30);
  const [complianceReport, setComplianceReport] = useState(generateComplianceReport(reportPeriod));

  // Check if user has access to security dashboard
  const canViewSecurity = hasPermission(Permission.AUDIT_VIEW) || hasPermission(Permission.SYSTEM_LOGS);

  useEffect(() => {
    // Record access to security dashboard
    if (user) {
      recordSecurityEvent({
        type: SecurityEventType.DATA_ACCESS,
        severity: SecuritySeverity.LOW,
        userId: user.id,
        description: 'Security dashboard accessed',
        details: {
          tab: activeTab,
        },
      });
    }
  }, [activeTab, user, recordSecurityEvent]);

  const handleGenerateReport = () => {
    const report = generateComplianceReport(reportPeriod);
    setComplianceReport(report);
  };

  const handleExportReport = () => {
    const dataStr = JSON.stringify(complianceReport, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `security-report-${new Date().toISOString()}.json`;
    link.click();
    URL.revokeObjectURL(url);

    // Record export event
    if (user) {
      recordSecurityEvent({
        type: SecurityEventType.EXPORT,
        severity: SecuritySeverity.MEDIUM,
        userId: user.id,
        description: 'Security compliance report exported',
        details: {
          period: reportPeriod,
        },
      });
    }
  };

  if (!canViewSecurity) {
    return (
      <div className="p-8 text-center">
        <div className="text-red-600 font-semibold text-lg mb-2">
          权限不足
        </div>
        <p className="text-gray-600">
          您没有权限访问安全仪表板
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">安全仪表板</h1>
              <p className="text-sm text-gray-500 mt-1">
                企业级安全监控与合规管理
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-600">
                用户: {user?.name} ({user?.email})
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                securityStats.activeThreats > 0
                  ? 'bg-red-100 text-red-800'
                  : 'bg-green-100 text-green-800'
              }`}>
                {securityStats.activeThreats > 0 ? `${securityStats.activeThreats} 活跃威胁` : '系统安全'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              概览
            </button>
            <button
              onClick={() => setActiveTab('events')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'events'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              安全事件
            </button>
            <button
              onClick={() => setActiveTab('compliance')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'compliance'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              合规报告
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'users'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              用户管理
            </button>
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <SecurityStatsCard />

            {/* Security Recommendations */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                安全建议
              </h3>
              {complianceReport.recommendations.length > 0 ? (
                <ul className="space-y-2">
                  {complianceReport.recommendations.map((recommendation, index) => (
                    <li key={index} className="flex items-start">
                      <svg
                        className="w-5 h-5 text-yellow-500 mr-2 mt-0.5 flex-shrink-0"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="text-gray-700">{recommendation}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 text-sm">
                  当前没有安全建议，系统运行良好
                </p>
              )}
            </div>

            {/* Event Severity Breakdown */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                事件严重程度分布
              </h3>
              <div className="space-y-3">
                {Object.entries(securityStats.bySeverity.last30Days).map(([severity, count]) => (
                  <div key={severity} className="flex items-center">
                    <div className="w-24 text-sm text-gray-600">
                      {severity === 'low' && '低'}
                      {severity === 'medium' && '中'}
                      {severity === 'high' && '高'}
                      {severity === 'critical' && '严重'}
                    </div>
                    <div className="flex-1 mx-4">
                      <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${
                            severity === 'low' && 'bg-blue-500'}
                            ${severity === 'medium' && 'bg-yellow-500'}
                            ${severity === 'high' && 'bg-orange-500'}
                            ${severity === 'critical' && 'bg-red-500'}
                          `}
                          style={{
                            width: `${Math.max(
                              (count / complianceReport.summary.totalEvents) * 100,
                              5
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                    <div className="w-12 text-sm text-gray-900 font-medium text-right">
                      {count}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'events' && (
          <div className="space-y-6">
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                最近安全事件
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        时间
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        类型
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        严重程度
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        描述
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        状态
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {complianceReport.details.slice(0, 20).map((event) => (
                      <tr key={event.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(event.timestamp).toLocaleString('zh-CN')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {event.type}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            event.severity === SecuritySeverity.LOW && 'bg-blue-100 text-blue-800'}
                            ${event.severity === SecuritySeverity.MEDIUM && 'bg-yellow-100 text-yellow-800'}
                            ${event.severity === SecuritySeverity.HIGH && 'bg-orange-100 text-orange-800'}
                            ${event.severity === SecuritySeverity.CRITICAL && 'bg-red-100 text-red-800'}
                          `}>
                            {event.severity === 'low' && '低'}
                            {event.severity === 'medium' && '中'}
                            {event.severity === 'high' && '高'}
                            {event.severity === 'critical' && '严重'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {event.description}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            event.resolved
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {event.resolved ? '已解决' : '未解决'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'compliance' && (
          <div className="space-y-6">
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  合规报告生成
                </h3>
                <div className="flex items-center gap-4">
                  <select
                    value={reportPeriod}
                    onChange={(e) => setReportPeriod(Number(e.target.value))}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value={7}>最近7天</option>
                    <option value={30}>最近30天</option>
                    <option value={90}>最近90天</option>
                  </select>
                  <button
                    onClick={handleGenerateReport}
                    className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    生成报告
                  </button>
                  <button
                    onClick={handleExportReport}
                    className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    导出报告
                  </button>
                </div>
              </div>

              {/* Report Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-500 mb-1">报告周期</div>
                  <div className="font-medium text-gray-900">
                    {new Date(complianceReport.period.startDate).toLocaleDateString('zh-CN')} -
                    {' '}{new Date(complianceReport.period.endDate).toLocaleDateString('zh-CN')}
                  </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-500 mb-1">总事件数</div>
                  <div className="font-medium text-gray-900">
                    {complianceReport.summary.totalEvents}
                  </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-500 mb-1">已解决</div>
                  <div className="font-medium text-gray-900">
                    {complianceReport.summary.resolvedIncidents}
                  </div>
                </div>
              </div>

              {/* Compliance Standards */}
              <div className="border-t pt-6">
                <h4 className="text-md font-semibold text-gray-900 mb-4">
                  合规标准支持
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-medium text-gray-900">SOC 2</h5>
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                        支持
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      满足SOC 2安全、可用性、处理完整性和保密性要求
                    </p>
                  </div>
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-medium text-gray-900">ISO 27001</h5>
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                        支持
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      符合ISO 27001信息安全管理体系标准
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                用户权限管理
              </h3>
              <p className="text-gray-600 mb-4">
                用户权限管理功能需要配合用户管理系统使用
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">角色层级</h4>
                  <ul className="space-y-1 text-sm text-gray-600">
                    <li>• 超级管理员 - 拥有所有权限</li>
                    <li>• 管理员 - 系统管理权限</li>
                    <li>• 经理 - 项目和团队管理</li>
                    <li>• 用户 - 基本操作权限</li>
                    <li>• 查看者 - 只读权限</li>
                    <li>• 访客 - 演示模式</li>
                  </ul>
                </div>
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">权限类别</h4>
                  <ul className="space-y-1 text-sm text-gray-600">
                    <li>• 项目权限 - 创建、编辑、删除、导出</li>
                    <li>• 计算权限 - 运行、查看、删除</li>
                    <li>• 报告权限 - 生成、查看、导出</li>
                    <li>• 用户权限 - 管理用户和角色</li>
                    <li>• 系统权限 - 设置、日志、监控</li>
                    <li>• 审计权限 - 查看和导出审计日志</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}