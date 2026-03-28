/**
 * Filter Bar Component
 *
 * Provides search and filter controls for the project list.
 */

import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useCloudProjectStore, useFilteredProjects, ProjectStatus, DateRangeFilter } from '@/stores/cloudProjectStore';

/**
 * FilterBar Props
 */
interface FilterBarProps {
  onNewProject?: () => void;
  viewMode?: 'card' | 'list';
  onViewModeChange?: (mode: 'card' | 'list') => void;
}

/**
 * Status options
 */
const statusOptions: { value: ProjectStatus; label: string }[] = [
  { value: 'draft', label: '草稿' },
  { value: 'in_progress', label: '进行中' },
  { value: 'completed', label: '已完成' },
];

/**
 * Collaboration model options
 */
const collaborationOptions: { value: string; label: string }[] = [
  { value: 'emc', label: 'EMC' },
  { value: 'lease', label: '租赁' },
  { value: 'sale', label: '销售' },
  { value: 'joint_venture', label: '合资' },
];

/**
 * Date range options
 */
const dateRangeOptions: { value: DateRangeFilter; label: string }[] = [
  { value: 'all', label: '全部时间' },
  { value: 'week', label: '最近一周' },
  { value: 'month', label: '最近一月' },
  { value: 'quarter', label: '最近三月' },
];

/**
 * FilterBar Component
 */
export const FilterBar: React.FC<FilterBarProps> = ({
  onNewProject,
  viewMode = 'card',
  onViewModeChange,
}) => {
  const { t } = useTranslation();
  const filters = useCloudProjectStore((state) => state.filters);
  const setFilters = useCloudProjectStore((state) => state.setFilters);
  const resetFilters = useCloudProjectStore((state) => state.resetFilters);
  const filteredProjects = useCloudProjectStore((state) => state.filteredProjects);

  const [showStatusFilter, setShowStatusFilter] = useState(false);
  const [showCollaborationFilter, setShowCollaborationFilter] = useState(false);
  const [showDateFilter, setShowDateFilter] = useState(false);

  /**
   * Check if any filters are active
   */
  const hasActiveFilters = () => {
    return (
      filters.search !== '' ||
      filters.status.length > 0 ||
      filters.collaborationModel.length > 0 ||
      filters.dateRange !== 'all'
    );
  };

  /**
   * Toggle status filter
   */
  const toggleStatus = (status: ProjectStatus) => {
    const newStatus = filters.status.includes(status)
      ? filters.status.filter((s) => s !== status)
      : [...filters.status, status];
    setFilters({ status: newStatus });
  };

  /**
   * Toggle collaboration model filter
   */
  const toggleCollaboration = (model: string) => {
    const newModels = filters.collaborationModel.includes(model)
      ? filters.collaborationModel.filter((m) => m !== model)
      : [...filters.collaborationModel, model];
    setFilters({ collaborationModel: newModels });
  };

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Search and Filters */}
        <div className="flex items-center gap-3 flex-1">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <svg
              className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters({ search: e.target.value })}
              placeholder={t('filter.searchPlaceholder', { defaultValue: '搜索项目...' })}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors text-sm"
            />
          </div>

          {/* Status Filter Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setShowStatusFilter(!showStatusFilter);
                setShowCollaborationFilter(false);
                setShowDateFilter(false);
              }}
              className={`flex items-center gap-2 px-3 py-2 border rounded-md text-sm transition-colors ${
                filters.status.length > 0
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                />
              </svg>
              状态
              {filters.status.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 bg-blue-600 text-white text-xs rounded-full">
                  {filters.status.length}
                </span>
              )}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showStatusFilter && (
              <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-10 py-1">
                {statusOptions.map((option) => (
                  <label
                    key={option.value}
                    className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={filters.status.includes(option.value)}
                      onChange={() => toggleStatus(option.value)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{option.label}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Collaboration Model Filter Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setShowCollaborationFilter(!showCollaborationFilter);
                setShowStatusFilter(false);
                setShowDateFilter(false);
              }}
              className={`flex items-center gap-2 px-3 py-2 border rounded-md text-sm transition-colors ${
                filters.collaborationModel.length > 0
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              合作模式
              {filters.collaborationModel.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 bg-blue-600 text-white text-xs rounded-full">
                  {filters.collaborationModel.length}
                </span>
              )}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showCollaborationFilter && (
              <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-10 py-1">
                {collaborationOptions.map((option) => (
                  <label
                    key={option.value}
                    className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={filters.collaborationModel.includes(option.value)}
                      onChange={() => toggleCollaboration(option.value)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{option.label}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Date Range Filter Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setShowDateFilter(!showDateFilter);
                setShowStatusFilter(false);
                setShowCollaborationFilter(false);
              }}
              className={`flex items-center gap-2 px-3 py-2 border rounded-md text-sm transition-colors ${
                filters.dateRange !== 'all'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              {dateRangeOptions.find((opt) => opt.value === filters.dateRange)?.label || '时间'}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showDateFilter && (
              <div className="absolute top-full left-0 mt-2 w-40 bg-white rounded-md shadow-lg border border-gray-200 z-10 py-1">
                {dateRangeOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setFilters({ dateRange: option.value });
                      setShowDateFilter(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors ${
                      filters.dateRange === option.value ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Clear Filters Button */}
          {hasActiveFilters() && (
            <button
              onClick={resetFilters}
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              清除筛选
            </button>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          {/* Result Count */}
          <span className="text-sm text-gray-500">
            {filteredProjects.length} 个项目
          </span>

          {/* View Mode Toggle */}
          {onViewModeChange && (
            <div className="flex items-center border border-gray-300 rounded-md overflow-hidden">
              <button
                onClick={() => onViewModeChange('card')}
                className={`p-2 transition-colors ${
                  viewMode === 'card' ? 'bg-gray-100 text-gray-700' : 'text-gray-400 hover:text-gray-600'
                }`}
                title={t('filter.cardView', { defaultValue: 'Card view' })}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button
                onClick={() => onViewModeChange('list')}
                className={`p-2 transition-colors ${
                  viewMode === 'list' ? 'bg-gray-100 text-gray-700' : 'text-gray-400 hover:text-gray-600'
                }`}
                title={t('filter.listView', { defaultValue: 'List view' })}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          )}

          {/* New Project Button */}
          {onNewProject && (
            <button
              onClick={onNewProject}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {t('filter.newProject', { defaultValue: '新建项目' })}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default FilterBar;
