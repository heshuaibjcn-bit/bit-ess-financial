/**
 * Statistics Dashboard Component
 *
 * 显示项目数据的统计信息和可视化图表
 */

import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useCloudProjectStore, LocalProject } from '@/stores/cloudProjectStore';

/**
 * Statistics Dashboard Props
 */
interface StatisticsDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Chart Card Component
 */
const StatCard: React.FC<{
  title: string;
  value: string | number;
  subtitle?: string;
  color: 'blue' | 'green' | 'purple' | 'orange';
}> = ({ title, value, subtitle, color }) => {
  const colorStyles = {
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    green: 'bg-green-50 text-green-700 border-green-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
    orange: 'bg-orange-50 text-orange-700 border-orange-200',
  };

  return (
    <div className={`p-4 rounded-lg border ${colorStyles[color]}`}>
      <p className="text-sm font-medium mb-1">{title}</p>
      <p className="text-2xl font-bold mb-1">{value}</p>
      {subtitle && (
        <p className="text-xs opacity-75">{subtitle}</p>
      )}
    </div>
  );
};

/**
 * Statistics Dashboard Component
 */
export const StatisticsDashboard: React.FC<StatisticsDashboardProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const projects = useCloudProjectStore((state) => state.projects);

  // 计算统计数据
  const stats = useMemo(() => {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    const projectsLastWeek = projects.filter(p => new Date(p.createdAt) >= oneWeekAgo);
    const projectsLastMonth = projects.filter(p => new Date(p.createdAt) >= oneMonthAgo);
    const projectsLastThreeMonths = projects.filter(p => new Date(p.createdAt) >= threeMonthsAgo);

    // 按状态分组
    const byStatus = {
      draft: projects.filter(p => p.status === 'draft').length,
      in_progress: projects.filter(p => p.status === 'in_progress').length,
      completed: projects.filter(p => p.status === 'completed').length,
    };

    // 按合作模式分组
    const byCollaboration: Record<string, number> = {};
    projects.forEach(p => {
      if (p.collaborationModel) {
        byCollaboration[p.collaborationModel] = (byCollaboration[p.collaborationModel] || 0) + 1;
      }
    });

    // 按行业分组
    const byIndustry: Record<string, number> = {};
    projects.forEach(p => {
      if (p.industry) {
        byIndustry[p.industry] = (byIndustry[p.industry] || 0) + 1;
      }
    });

    // 创建趋势（按月份）
    const monthlyTrend: Record<string, number> = {};
    projects.forEach(p => {
      const month = p.createdAt.substring(0, 7); // YYYY-MM
      monthlyTrend[month] = (monthlyTrend[month] || 0) + 1;
    });

    // 最近6个月的趋势
    const sortedMonths = Object.keys(monthlyTrend).sort().slice(-6);

    return {
      totalProjects: projects.length,
      projectsLastWeek: projectsLastWeek.length,
      projectsLastMonth: projectsLastMonth.length,
      projectsLastThreeMonths: projectsLastThreeMonths.length,
      byStatus,
      byCollaboration,
      byIndustry,
      monthlyTrend: sortedMonths.map(month => ({
        month,
        count: monthlyTrend[month],
      })),
      averageCompletion: projects.length > 0
        ? (byStatus.completed / projects.length * 100).toFixed(1)
        : '0',
    };
  }, [projects]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {t('stats.title', { defaultValue: '数据统计' })}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          {/* Overview Stats */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {t('stats.overview', { defaultValue: '概览' })}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard
                title={t('stats.totalProjects', { defaultValue: '总项目数' })}
                value={stats.totalProjects}
                color="blue"
              />
              <StatCard
                title={t('stats.thisWeek', { defaultValue: '本周新增' })}
                value={stats.projectsLastWeek}
                subtitle={t('stats.projects', { defaultValue: '个项目' })}
                color="green"
              />
              <StatCard
                title={t('stats.thisMonth', { defaultValue: '本月新增' })}
                value={stats.projectsLastMonth}
                subtitle={t('stats.projects', { defaultValue: '个项目' })}
                color="purple"
              />
              <StatCard
                title={t('stats.completionRate', { defaultValue: '完成率' })}
                value={`${stats.averageCompletion}%`}
                color="orange"
              />
            </div>
          </div>

          {/* Status Distribution */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {t('stats.statusDistribution', { defaultValue: '状态分布' })}
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-600 mb-1">{t('status.draft', { defaultValue: '草稿' })}</p>
                <p className="text-3xl font-bold text-gray-900">{stats.byStatus.draft}</p>
                <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gray-400 transition-all"
                    style={{ width: `${stats.totalProjects > 0 ? (stats.byStatus.draft / stats.totalProjects * 100) : 0}%` }}
                  />
                </div>
              </div>
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <p className="text-sm text-blue-600 mb-1">{t('status.in_progress', { defaultValue: '进行中' })}</p>
                <p className="text-3xl font-bold text-blue-900">{stats.byStatus.in_progress}</p>
                <div className="mt-2 h-2 bg-blue-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 transition-all"
                    style={{ width: `${stats.totalProjects > 0 ? (stats.byStatus.in_progress / stats.totalProjects * 100) : 0}%` }}
                  />
                </div>
              </div>
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <p className="text-sm text-green-600 mb-1">{t('status.completed', { defaultValue: '已完成' })}</p>
                <p className="text-3xl font-bold text-green-900">{stats.byStatus.completed}</p>
                <div className="mt-2 h-2 bg-green-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 transition-all"
                    style={{ width: `${stats.totalProjects > 0 ? (stats.byStatus.completed / stats.totalProjects * 100) : 0}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Collaboration Model Distribution */}
          {Object.keys(stats.byCollaboration).length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {t('stats.collaborationDistribution', { defaultValue: '合作模式分布' })}
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Object.entries(stats.byCollaboration).map(([model, count]) => (
                  <div
                    key={model}
                    className="bg-white border border-gray-200 rounded-lg p-3 text-center"
                  >
                    <p className="text-xs text-gray-600 mb-1">{model}</p>
                    <p className="text-xl font-bold text-gray-900">{count}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Industry Distribution */}
          {Object.keys(stats.byIndustry).length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {t('stats.industryDistribution', { defaultValue: '行业分布' })}
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {Object.entries(stats.byIndustry).map(([industry, count]) => (
                  <div
                    key={industry}
                    className="bg-white border border-gray-200 rounded-lg p-3"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium text-gray-900">{industry}</p>
                      <span className="text-xs text-gray-500">{count}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-500 transition-all"
                        style={{ width: `${stats.totalProjects > 0 ? (count / stats.totalProjects * 100) : 0}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Monthly Trend */}
          {stats.monthlyTrend.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {t('stats.monthlyTrend', { defaultValue: '月度趋势' })}
              </h3>
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="space-y-2">
                  {stats.monthlyTrend.map(({ month, count }) => (
                    <div key={month} className="flex items-center">
                      <span className="w-20 text-sm text-gray-600">{month}</span>
                      <div className="flex-1 mx-4 h-6 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 transition-all"
                          style={{ width: `${Math.max(2, (count / stats.totalProjects) * 100)}%` }}
                        />
                      </div>
                      <span className="w-8 text-sm font-medium text-gray-900 text-right">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StatisticsDashboard;
