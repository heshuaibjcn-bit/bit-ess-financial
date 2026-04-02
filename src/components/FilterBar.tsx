/**
 * Filter Bar Component - Premium Edition
 * 
 * Glass effects and premium textures.
 * White & Blue color palette.
 */

import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useCloudProjectStore, ProjectStatus, DateRangeFilter } from '@/stores/cloudProjectStore';
import { Badge } from './ui/Badge';

interface FilterBarProps {
  onNewProject?: () => void;
  viewMode?: 'card' | 'list';
  onViewModeChange?: (mode: 'card' | 'list') => void;
}

const statusOptions: { value: ProjectStatus; label: string }[] = [
  { value: 'draft', label: '草稿' },
  { value: 'in_progress', label: '进行中' },
  { value: 'completed', label: '已完成' },
];

const collaborationOptions: { value: string; label: string }[] = [
  { value: 'emc', label: 'EMC' },
  { value: 'lease', label: '租赁' },
  { value: 'sale', label: '销售' },
  { value: 'joint_venture', label: '合资' },
];

const dateRangeOptions: { value: DateRangeFilter; label: string }[] = [
  { value: 'all', label: '全部时间' },
  { value: 'week', label: '最近一周' },
  { value: 'month', label: '最近一月' },
  { value: 'quarter', label: '最近三月' },
];

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

  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const hasActiveFilters = filters.search !== '' || 
    filters.status.length > 0 || 
    filters.collaborationModel.length > 0 || 
    filters.dateRange !== 'all';

  const totalFilters = filters.status.length + filters.collaborationModel.length + 
    (filters.dateRange !== 'all' ? 1 : 0);

  const toggleStatus = (status: ProjectStatus) => {
    const newStatus = filters.status.includes(status)
      ? filters.status.filter((s) => s !== status)
      : [...filters.status, status];
    setFilters({ status: newStatus });
  };

  const toggleCollaboration = (model: string) => {
    const newModels = filters.collaborationModel.includes(model)
      ? filters.collaborationModel.filter((m) => m !== model)
      : [...filters.collaborationModel, model];
    setFilters({ collaborationModel: newModels });
  };

  return (
    <div className="bg-white/80 backdrop-blur-sm border-b border-neutral-200/60 px-6 py-4" ref={dropdownRef}>
      <div className="flex items-center justify-between gap-4">
        {/* Left: Search and Filters */}
        <div className="flex items-center gap-3 flex-1">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md group">
            <svg
              className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400 group-focus-within:text-primary-500 transition-colors"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters({ search: e.target.value })}
              placeholder={t('filter.searchPlaceholder', { defaultValue: '搜索项目...' })}
              className="w-full pl-9 pr-4 py-2 bg-white/60 border border-neutral-200/80 rounded-xl text-sm text-neutral-900 placeholder-neutral-400 focus:bg-white focus:border-primary-400 focus:ring-4 focus:ring-primary-500/10 transition-all duration-200 shadow-sm"
            />
            {filters.search && (
              <button
                onClick={() => setFilters({ search: '' })}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-full p-0.5 transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Status Filter */}
          <div className="relative">
            <button
              onClick={() => setActiveDropdown(activeDropdown === 'status' ? null : 'status')}
              className={`inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-xl border transition-all duration-200 shadow-sm ${
                filters.status.length > 0
                  ? 'bg-primary-50/80 border-primary-200 text-primary-700'
                  : 'bg-white/60 border-neutral-200/80 text-neutral-700 hover:bg-white hover:shadow-md'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              状态
              {filters.status.length > 0 && (
                <Badge variant="primary" size="sm">{filters.status.length}</Badge>
              )}
              <svg className={`w-4 h-4 transition-transform ${activeDropdown === 'status' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {activeDropdown === 'status' && (
              <div className="absolute top-full left-0 mt-2 w-44 bg-white/95 backdrop-blur-xl rounded-xl shadow-xl border border-neutral-200/60 py-1 z-20 animate-fade-in-up">
                {statusOptions.map((option) => (
                  <label
                    key={option.value}
                    className="flex items-center gap-3 px-3 py-2 hover:bg-neutral-50/80 cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={filters.status.includes(option.value)}
                      onChange={() => toggleStatus(option.value)}
                      className="w-4 h-4 rounded border-neutral-300 text-primary-600 focus:ring-4 focus:ring-primary-500/10"
                    />
                    <span className="text-sm text-neutral-700">{option.label}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Collaboration Filter */}
          <div className="relative">
            <button
              onClick={() => setActiveDropdown(activeDropdown === 'collab' ? null : 'collab')}
              className={`inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-xl border transition-all duration-200 shadow-sm ${
                filters.collaborationModel.length > 0
                  ? 'bg-primary-50/80 border-primary-200 text-primary-700'
                  : 'bg-white/60 border-neutral-200/80 text-neutral-700 hover:bg-white hover:shadow-md'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              合作模式
              {filters.collaborationModel.length > 0 && (
                <Badge variant="primary" size="sm">{filters.collaborationModel.length}</Badge>
              )}
              <svg className={`w-4 h-4 transition-transform ${activeDropdown === 'collab' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {activeDropdown === 'collab' && (
              <div className="absolute top-full left-0 mt-2 w-44 bg-white/95 backdrop-blur-xl rounded-xl shadow-xl border border-neutral-200/60 py-1 z-20 animate-fade-in-up">
                {collaborationOptions.map((option) => (
                  <label
                    key={option.value}
                    className="flex items-center gap-3 px-3 py-2 hover:bg-neutral-50/80 cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={filters.collaborationModel.includes(option.value)}
                      onChange={() => toggleCollaboration(option.value)}
                      className="w-4 h-4 rounded border-neutral-300 text-primary-600 focus:ring-4 focus:ring-primary-500/10"
                    />
                    <span className="text-sm text-neutral-700">{option.label}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Date Range Filter */}
          <div className="relative">
            <button
              onClick={() => setActiveDropdown(activeDropdown === 'date' ? null : 'date')}
              className={`inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-xl border transition-all duration-200 shadow-sm ${
                filters.dateRange !== 'all'
                  ? 'bg-primary-50/80 border-primary-200 text-primary-700'
                  : 'bg-white/60 border-neutral-200/80 text-neutral-700 hover:bg-white hover:shadow-md'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {dateRangeOptions.find((opt) => opt.value === filters.dateRange)?.label}
              <svg className={`w-4 h-4 transition-transform ${activeDropdown === 'date' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {activeDropdown === 'date' && (
              <div className="absolute top-full left-0 mt-2 w-40 bg-white/95 backdrop-blur-xl rounded-xl shadow-xl border border-neutral-200/60 py-1 z-20 animate-fade-in-up">
                {dateRangeOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setFilters({ dateRange: option.value });
                      setActiveDropdown(null);
                    }}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-neutral-50/80 transition-colors ${
                      filters.dateRange === option.value ? 'text-primary-700 bg-primary-50/80' : 'text-neutral-700'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="text-sm text-neutral-500 hover:text-neutral-700 transition-colors hover:underline underline-offset-2"
            >
              清除筛选
            </button>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          {/* Result Count */}
          <span className="text-sm text-neutral-500">
            {filteredProjects.length} 个项目
          </span>

          {/* View Mode Toggle */}
          {onViewModeChange && (
            <div className="flex items-center bg-neutral-100/80 rounded-xl p-0.5">
              <button
                onClick={() => onViewModeChange('card')}
                className={`p-1.5 rounded-lg transition-all duration-200 ${
                  viewMode === 'card' 
                    ? 'bg-white shadow-sm text-neutral-900' 
                    : 'text-neutral-500 hover:text-neutral-700 hover:bg-white/50'
                }`}
                title={t('filter.cardView', { defaultValue: '卡片视图' })}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button
                onClick={() => onViewModeChange('list')}
                className={`p-1.5 rounded-lg transition-all duration-200 ${
                  viewMode === 'list' 
                    ? 'bg-white shadow-sm text-neutral-900' 
                    : 'text-neutral-500 hover:text-neutral-700 hover:bg-white/50'
                }`}
                title={t('filter.listView', { defaultValue: '列表视图' })}
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
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-600 to-primary-500 text-white text-sm font-medium rounded-xl shadow-lg shadow-primary-500/25 hover:shadow-xl hover:shadow-primary-500/30 hover:-translate-y-0.5 transition-all duration-200 group relative overflow-hidden"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              <svg className="w-4 h-4 relative" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="relative">{t('filter.newProject', { defaultValue: '新建项目' })}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default FilterBar;
