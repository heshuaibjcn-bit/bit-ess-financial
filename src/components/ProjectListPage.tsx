/**
 * Project List Page
 *
 * Main dashboard page showing all user projects with search and filtering.
 * Now with batch operations support!
 */

import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCloudProjectStore } from '@/stores/cloudProjectStore';
import { FilterBar } from './FilterBar';
import { ProjectCard, ProjectListItem } from './ProjectCard';
import { NoProjectsEmptyState, NoSearchResultsEmptyState, FullPageLoading } from './ui';
import { useConfirmDialog } from './ui/ConfirmDialog';
import { useToast } from './ui/Toast';
import { ImportExportDialog } from './ImportExportDialog';
import { TemplateSelectorDialog } from './TemplateSelectorDialog';
import { StatisticsDashboard } from './StatisticsDashboard';
import {
  batchDeleteProjects,
  batchUpdateStatus,
  batchExportProjects,
  toggleAllSelection,
  isAllSelected,
  isPartiallySelected,
  getBatchOperationStats,
} from '@/services/batchOperations';

/**
 * View mode type
 */
type ViewMode = 'card' | 'list';

/**
 * Batch operation type
 */
type BatchOperation = 'delete' | 'export' | 'status' | null;

/**
 * ProjectListPage Component
 */
export const ProjectListPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { confirm, Dialog } = useConfirmDialog();
  const { showSuccess, showError } = useToast();

  // Store state
  const fetchProjects = useCloudProjectStore((state) => state.fetchProjects);
  const createProject = useCloudProjectStore((state) => state.createProject);
  const duplicateProject = useCloudProjectStore((state) => state.duplicateProject);
  const deleteProject = useCloudProjectStore((state) => state.deleteProject);
  const updateProject = useCloudProjectStore((state) => state.updateProject);
  const loading = useCloudProjectStore((state) => state.loading);
  const saving = useCloudProjectStore((state) => state.saving);
  const error = useCloudProjectStore((state) => state.error);
  const filteredProjects = useCloudProjectStore((state) => state.filteredProjects);
  const projects = useCloudProjectStore((state) => state.projects);
  const filters = useCloudProjectStore((state) => state.filters);

  // Local state
  const [viewMode, setViewMode] = useState<ViewMode>('card');
  const [isCreating, setIsCreating] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [batchMode, setBatchMode] = useState(false);
  const [showImportExport, setShowImportExport] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  /**
   * Fetch projects on mount
   */
  useEffect(() => {
    fetchProjects().catch((err) => {
      console.error('Failed to fetch projects:', err);
      showError(t('project.fetchError', { defaultValue: 'Failed to load projects' }));
    });
  }, [fetchProjects, showError, t]);

  /**
   * Clear selection when filters change
   */
  useEffect(() => {
    setSelectedIds([]);
    setBatchMode(false);
  }, [filters]);

  /**
   * Handle create new project
   */
  const handleCreateProject = useCallback(async () => {
    setIsCreating(true);
    try {
      const projectId = await createProject(
        t('project.untitled', { defaultValue: '未命名项目' }),
        ''
      );
      showSuccess(t('project.created', { defaultValue: 'Project created successfully' }));
      navigate(`/project/${projectId}`);
    } catch (err) {
      console.error('Failed to create project:', err);
      showError(t('project.createError', { defaultValue: 'Failed to create project' }));
    } finally {
      setIsCreating(false);
    }
  }, [createProject, navigate, showSuccess, showError, t]);

  /**
   * Handle duplicate project
   */
  const handleDuplicate = useCallback(
    async (id: string) => {
      try {
        await duplicateProject(id);
        showSuccess(t('project.duplicated', { defaultValue: 'Project duplicated successfully' }));
      } catch (err) {
        console.error('Failed to duplicate project:', err);
        showError(t('project.duplicateError', { defaultValue: 'Failed to duplicate project' }));
      }
    },
    [duplicateProject, showSuccess, showError, t]
  );

  /**
   * Handle delete project with confirmation
   */
  const handleDelete = useCallback(
    async (id: string) => {
      const project = filteredProjects.find((p) => p.id === id);
      if (!project) return;

      const confirmed = await confirm(
        t('project.deleteConfirmTitle', { defaultValue: 'Delete Project' }),
        t('project.deleteConfirmMessage', {
          defaultValue: `Are you sure you want to delete "${project.name}"? This action cannot be undone.`,
        }),
        {
          confirmText: t('common.delete', { defaultValue: 'Delete' }),
          cancelText: t('common.cancel', { defaultValue: 'Cancel' }),
          variant: 'danger',
        }
      );

      if (confirmed) {
        try {
          await deleteProject(id);
          showSuccess(t('project.deleted', { defaultValue: 'Project deleted successfully' }));
        } catch (err) {
          console.error('Failed to delete project:', err);
          showError(t('project.deleteError', { defaultValue: 'Failed to delete project' }));
        }
      }
    },
    [filteredProjects, confirm, deleteProject, showSuccess, showError, t]
  );

  /**
   * Toggle project selection
   */
  const handleToggleSelection = useCallback((id: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((selectedId) => selectedId !== id);
      } else {
        return [...prev, id];
      }
    });
  }, []);

  /**
   * Toggle select all
   */
  const handleToggleSelectAll = useCallback(() => {
    const allIds = filteredProjects.map((p) => p.id);
    setSelectedIds(toggleAllSelection(allIds, selectedIds));
  }, [filteredProjects, selectedIds]);

  /**
   * Batch delete
   */
  const handleBatchDelete = useCallback(async () => {
    if (selectedIds.length === 0) return;

    const confirmed = await confirm(
      t('batch.deleteConfirmTitle', { defaultValue: '批量删除项目' }),
      t('batch.deleteConfirmMessage', {
        defaultValue: `确定要删除选中的 ${selectedIds.length} 个项目吗？此操作无法撤销。`,
      }),
      {
        confirmText: t('common.delete', { defaultValue: '删除' }),
        cancelText: t('common.cancel', { defaultValue: '取消' }),
        variant: 'danger',
      }
    );

    if (confirmed) {
      const result = await batchDeleteProjects(projects, selectedIds, deleteProject);

      if (result.failed > 0) {
        showError(t('batch.partialFailure', { defaultValue: `${result.success} 个成功，${result.failed} 个失败` }));
      } else {
        showSuccess(t('batch.deleteSuccess', { defaultValue: `成功删除 ${result.success} 个项目` }));
      }

      setSelectedIds([]);
      setBatchMode(false);
    }
  }, [selectedIds, projects, deleteProject, confirm, showSuccess, showError, t]);

  /**
   * Batch export
   */
  const handleBatchExport = useCallback(() => {
    if (selectedIds.length === 0) return;

    try {
      batchExportProjects(projects, selectedIds);
      showSuccess(t('batch.exportSuccess', { defaultValue: `成功导出 ${selectedIds.length} 个项目` }));
      setSelectedIds([]);
      setBatchMode(false);
    } catch (error) {
      showError(t('batch.exportError', { defaultValue: '导出失败' }));
    }
  }, [selectedIds, projects, showSuccess, showError, t]);

  /**
   * Batch update status
   */
  const handleBatchUpdateStatus = useCallback(
    async (newStatus: 'draft' | 'in_progress' | 'completed') => {
      if (selectedIds.length === 0) return;

      const result = await batchUpdateStatus(projects, selectedIds, newStatus, updateProject);

      if (result.failed > 0) {
        showError(t('batch.partialFailure', { defaultValue: `${result.success} 个成功，${result.failed} 个失败` }));
      } else {
        showSuccess(t('batch.statusUpdateSuccess', { defaultValue: `成功更新 ${result.success} 个项目` }));
      }

      setSelectedIds([]);
      setBatchMode(false);
    },
    [selectedIds, projects, updateProject, showSuccess, showError, t]
  );

  // Show loading state
  if (loading) {
    return <FullPageLoading text={t('project.loading', { defaultValue: 'Loading projects...' })} />;
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center">
          <svg
            className="w-16 h-16 text-red-400 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {t('project.errorTitle', { defaultValue: 'Error Loading Projects' })}
          </h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => fetchProjects()}
            className="px-6 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors"
          >
            {t('common.retry', { defaultValue: 'Retry' })}
          </button>
        </div>
      </div>
    );
  }

  const allSelected = filteredProjects.length > 0 && isAllSelected(filteredProjects.map((p) => p.id), selectedIds);
  const partiallySelected = isPartiallySelected(filteredProjects.map((p) => p.id), selectedIds);
  const batchStats = selectedIds.length > 0 ? getBatchOperationStats(projects, selectedIds) : null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">
              {t('project.listTitle', { defaultValue: '我的项目' })}
            </h1>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowStats(true)}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
                title={t('stats.title', { defaultValue: '数据统计' })}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v2m-6 9h12a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2h2m-6 9V9a2 2 0 012-2h2a2 2 0 012 2v2M9 19V9a2 2 0 012-2h2a2 2 0 012 2v2" />
                </svg>
              </button>
              <button
                onClick={() => setShowTemplates(true)}
                className="px-4 py-2 bg-purple-600 text-white rounded-md text-sm font-medium hover:bg-purple-700 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 012-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                {t('template.selectButton', { defaultValue: '模板' })}
              </button>
              <button
                onClick={() => setShowImportExport(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                {t('export.importExport', { defaultValue: '导入/导出' })}
              </button>
              <button
                onClick={() => navigate('/settings')}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
                title={t('settings.title', { defaultValue: '设置' })}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.08 2.83 2.815-1.264 1.778-2.347 3.014-1.778.67-2.347-3.015.645-.67 2.815-2.83 1.679-4.67-1.08-2.815" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2v2m0 12h.01" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Filter Bar */}
      <FilterBar
        onNewProject={handleCreateProject}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      {/* Batch Mode Bar */}
      {batchMode && (
        <div className="bg-blue-50 border-b border-blue-200 px-4 sm:px-6 lg:8 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-blue-900">
                {t('batch.selected', { defaultValue: '已选择' })} {selectedIds.length} {t('batch.projects', { defaultValue: '个项目' })}
              </span>

              {/* Batch Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleBatchUpdateStatus('draft')}
                  className="px-3 py-1 bg-white border border-gray-300 rounded text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  {t('batch.setToDraft', { defaultValue: '设为草稿' })}
                </button>
                <button
                  onClick={() => handleBatchUpdateStatus('in_progress')}
                  className="px-3 py-1 bg-white border border-gray-300 rounded text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  {t('batch.setToInProgress', { defaultValue: '设为进行中' })}
                </button>
                <button
                  onClick={() => handleBatchUpdateStatus('completed')}
                  className="px-3 py-1 bg-white border border-gray-300 rounded text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  {t('batch.setToCompleted', { defaultValue: '设为已完成' })}
                </button>
                <button
                  onClick={handleBatchExport}
                  className="px-3 py-1 bg-green-600 text-white rounded text-sm font-medium hover:bg-green-700 transition-colors"
                >
                  {t('batch.export', { defaultValue: '导出' })}
                </button>
                <button
                  onClick={handleBatchDelete}
                  className="px-3 py-1 bg-red-600 text-white rounded text-sm font-medium hover:bg-red-700 transition-colors"
                >
                  {t('batch.delete', { defaultValue: '删除' })}
                </button>
              </div>
            </div>

            <button
              onClick={() => {
                setSelectedIds([]);
                setBatchMode(false);
              }}
              className="text-sm text-gray-600 hover:text-gray-800"
            >
              {t('batch.cancel', { defaultValue: '取消' })}
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Loading overlay */}
        {(saving || isCreating) && (
          <div className="fixed inset-0 bg-black bg-opacity-10 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg p-6 flex items-center gap-3">
              <svg className="animate-spin h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <span className="text-sm font-medium text-gray-700">
                {t('common.saving', { defaultValue: 'Saving...' })}
              </span>
            </div>
          </div>
        )}

        {/* Empty State */}
        {filteredProjects.length === 0 ? (
          filters.search || filters.status.length > 0 || filters.collaborationModel.length > 0 ? (
            <NoSearchResultsEmptyState query={filters.search} />
          ) : (
            <NoProjectsEmptyState onCreateProject={handleCreateProject} />
          )
        ) : (
          <>
            {/* Batch Mode Selection Bar */}
            {filteredProjects.length > 0 && (
              <div className="mb-4 flex items-center justify-between bg-white rounded-lg border border-gray-200 px-4 py-3">
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedIds.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setBatchMode(true);
                        }
                        handleToggleSelectAll();
                      }}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      {t('batch.selectAll', { defaultValue: '全选' })}
                    </span>
                  </label>

                  {selectedIds.length > 0 && (
                    <button
                      onClick={() => setBatchMode(!batchMode)}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      {batchMode ? t('batch.collapse', { defaultValue: '收起' }) : t('batch.expand', { defaultValue: '展开操作' })}
                    </button>
                  )}
                </div>

                {/* Quick Stats */}
                {batchStats && (
                  <div className="text-sm text-gray-500">
                    {Object.entries(batchStats.byStatus).map(([status, count]) => (
                      <span key={status} className="mr-4">
                        {status}: {count}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Card View */}
            {viewMode === 'card' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredProjects.map((project) => (
                  <div key={project.id} className="relative">
                    {/* Checkbox for batch mode */}
                    {batchMode && (
                      <div className="absolute top-4 left-4 z-10">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(project.id)}
                          onChange={() => handleToggleSelection(project.id)}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                      </div>
                    )}

                    <ProjectCard
                      project={project}
                      onDuplicate={handleDuplicate}
                      onDelete={handleDelete}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* List View */}
            {viewMode === 'list' && (
              <div className="bg-white rounded-lg border border-gray-200">
                {filteredProjects.map((project) => (
                  <div key={project.id} className="relative">
                    {/* Checkbox for batch mode */}
                    {batchMode && (
                      <div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(project.id)}
                          onChange={() => handleToggleSelection(project.id)}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                      </div>
                    )}

                    <div className={batchMode ? 'ml-8' : ''}>
                      <ProjectListItem
                        project={project}
                        onDuplicate={handleDuplicate}
                        onDelete={handleDelete}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {/* Dialogs */}
      <Dialog />

      {/* Import/Export Dialog */}
      <ImportExportDialog isOpen={showImportExport} onClose={() => setShowImportExport(false)} />

      {/* Template Selector Dialog */}
      <TemplateSelectorDialog isOpen={showTemplates} onClose={() => setShowTemplates(false)} />

      {/* Statistics Dashboard */}
      <StatisticsDashboard isOpen={showStats} onClose={() => setShowStats(false)} />
    </div>
  );
};

export default ProjectListPage;
