/**
 * Project List Page - Premium Edition
 * 
 * Rich textures, glass effects, and premium interactions.
 * White & Blue color palette.
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
import { Badge } from './ui/Badge';
import {
  batchDeleteProjects,
  batchUpdateStatus,
  batchExportProjects,
  toggleAllSelection,
  isAllSelected,
  isPartiallySelected,
  getBatchOperationStats,
} from '@/services/batchOperations';

type ViewMode = 'card' | 'list';

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

  // Fetch projects on mount
  useEffect(() => {
    fetchProjects().catch((err) => {
      console.error('Failed to fetch projects:', err);
      showError(t('project.fetchError', { defaultValue: '加载项目失败' }));
    });
  }, [fetchProjects, showError, t]);

  // Clear selection when filters change
  useEffect(() => {
    setSelectedIds([]);
    setBatchMode(false);
  }, [filters]);

  const handleCreateProject = useCallback(async () => {
    setIsCreating(true);
    try {
      const projectId = await createProject(
        t('project.untitled', { defaultValue: '未命名项目' }),
        ''
      );
      showSuccess(t('project.created', { defaultValue: '项目创建成功' }));
      navigate(`/project/${projectId}`);
    } catch (err) {
      console.error('Failed to create project:', err);
      showError(t('project.createError', { defaultValue: '创建项目失败' }));
    } finally {
      setIsCreating(false);
    }
  }, [createProject, navigate, showSuccess, showError, t]);

  const handleDuplicate = useCallback(
    async (id: string) => {
      try {
        await duplicateProject(id);
        showSuccess(t('project.duplicated', { defaultValue: '项目复制成功' }));
      } catch (err) {
        console.error('Failed to duplicate project:', err);
        showError(t('project.duplicateError', { defaultValue: '复制项目失败' }));
      }
    },
    [duplicateProject, showSuccess, showError, t]
  );

  const handleDelete = useCallback(
    async (id: string) => {
      const project = filteredProjects.find((p) => p.id === id);
      if (!project) return;

      const confirmed = await confirm(
        t('project.deleteConfirmTitle', { defaultValue: '删除项目' }),
        t('project.deleteConfirmMessage', {
          defaultValue: `确定要删除 "${project.name}" 吗？此操作无法撤销。`,
        }),
        {
          confirmText: t('common.delete', { defaultValue: '删除' }),
          cancelText: t('common.cancel', { defaultValue: '取消' }),
          variant: 'danger',
        }
      );

      if (confirmed) {
        try {
          await deleteProject(id);
          showSuccess(t('project.deleted', { defaultValue: '项目已删除' }));
        } catch (err) {
          console.error('Failed to delete project:', err);
          showError(t('project.deleteError', { defaultValue: '删除项目失败' }));
        }
      }
    },
    [filteredProjects, confirm, deleteProject, showSuccess, showError, t]
  );

  const handleToggleSelection = useCallback((id: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((selectedId) => selectedId !== id);
      } else {
        return [...prev, id];
      }
    });
  }, []);

  const handleToggleSelectAll = useCallback(() => {
    const allIds = filteredProjects.map((p) => p.id);
    setSelectedIds(toggleAllSelection(allIds, selectedIds));
  }, [filteredProjects, selectedIds]);

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
    return <FullPageLoading text={t('project.loading', { defaultValue: '加载项目中...' })} />;
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-mesh px-4">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-error-50 rounded-2xl mb-4 shadow-lg shadow-error-500/10">
            <svg className="w-8 h-8 text-error-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-neutral-900 mb-2">
            {t('project.errorTitle', { defaultValue: '加载项目失败' })}
          </h2>
          <p className="text-sm text-neutral-500 mb-6">{error}</p>
          <button
            onClick={() => fetchProjects()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-600 to-primary-500 text-white text-sm font-medium rounded-xl shadow-lg shadow-primary-500/25 hover:shadow-xl hover:shadow-primary-500/30 hover:-translate-y-0.5 transition-all duration-200"
          >
            {t('common.retry', { defaultValue: '重试' })}
          </button>
        </div>
      </div>
    );
  }

  const allSelected = filteredProjects.length > 0 && isAllSelected(filteredProjects.map((p) => p.id), selectedIds);
  const partiallySelected = isPartiallySelected(filteredProjects.map((p) => p.id), selectedIds);
  const batchStats = selectedIds.length > 0 ? getBatchOperationStats(projects, selectedIds) : null;

  return (
    <div className="min-h-screen bg-gradient-mesh">
      {/* Header with Glass Effect */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-neutral-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl shadow-lg shadow-primary-500/20">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h1 className="text-xl font-bold text-neutral-900">
                {t('project.listTitle', { defaultValue: '我的项目' })}
              </h1>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('/settings')}
                className="p-2.5 text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100/80 rounded-xl transition-all duration-200 hover:scale-105"
                title={t('settings.title', { defaultValue: '设置' })}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
              <button
                onClick={() => navigate('/admin')}
                className="p-2.5 text-neutral-500 hover:text-primary-600 hover:bg-primary-50/80 rounded-xl transition-all duration-200 hover:scale-105"
                title="AI 管理"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
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

      {/* Batch Mode Bar with Gradient */}
      {batchMode && selectedIds.length > 0 && (
        <div className="bg-gradient-to-r from-primary-50/90 to-primary-100/60 backdrop-blur-sm border-b border-primary-200/60 px-4 sm:px-6 lg:px-8 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-primary-900">
                已选择 <span className="font-bold text-primary-700">{selectedIds.length}</span> 个项目
              </span>

              {/* Batch Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleBatchUpdateStatus('draft')}
                  className="px-3 py-1.5 bg-white/80 border border-neutral-200/80 rounded-lg text-sm font-medium text-neutral-700 hover:bg-white hover:shadow-md transition-all duration-200"
                >
                  设为草稿
                </button>
                <button
                  onClick={() => handleBatchUpdateStatus('in_progress')}
                  className="px-3 py-1.5 bg-white/80 border border-neutral-200/80 rounded-lg text-sm font-medium text-neutral-700 hover:bg-white hover:shadow-md transition-all duration-200"
                >
                  设为进行中
                </button>
                <button
                  onClick={() => handleBatchUpdateStatus('completed')}
                  className="px-3 py-1.5 bg-white/80 border border-neutral-200/80 rounded-lg text-sm font-medium text-neutral-700 hover:bg-white hover:shadow-md transition-all duration-200"
                >
                  设为已完成
                </button>
                <button
                  onClick={handleBatchExport}
                  className="px-3 py-1.5 bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-lg text-sm font-medium shadow-md shadow-primary-500/20 hover:shadow-lg hover:shadow-primary-500/30 hover:-translate-y-0.5 transition-all duration-200"
                >
                  导出
                </button>
                <button
                  onClick={handleBatchDelete}
                  className="px-3 py-1.5 bg-gradient-to-r from-error-600 to-error-500 text-white rounded-lg text-sm font-medium shadow-md shadow-error-500/20 hover:shadow-lg hover:shadow-error-500/30 hover:-translate-y-0.5 transition-all duration-200"
                >
                  删除
                </button>
              </div>
            </div>

            <button
              onClick={() => {
                setSelectedIds([]);
                setBatchMode(false);
              }}
              className="text-sm text-neutral-500 hover:text-neutral-700 transition-colors"
            >
              取消
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Loading overlay */}
        {(saving || isCreating) && (
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl p-4 flex items-center gap-3 border border-white/60">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary-600 border-t-transparent" />
              <span className="text-sm font-medium text-neutral-700">
                {t('common.saving', { defaultValue: '保存中...' })}
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
            {/* Batch Selection Bar */}
            <div className="mb-4 flex items-center justify-between bg-white/70 backdrop-blur-sm rounded-xl border border-neutral-200/60 px-4 py-3 shadow-sm">
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      ref={(input) => {
                        if (input) input.indeterminate = partiallySelected;
                      }}
                      onChange={(e) => {
                        if (e.target.checked) setBatchMode(true);
                        handleToggleSelectAll();
                      }}
                      className="w-4 h-4 rounded border-neutral-300 text-primary-600 focus:ring-4 focus:ring-primary-500/10 transition-all"
                    />
                  </div>
                  <span className="text-sm font-medium text-neutral-700 group-hover:text-neutral-900 transition-colors">
                    全选
                  </span>
                </label>

                {selectedIds.length > 0 && (
                  <button
                    onClick={() => setBatchMode(!batchMode)}
                    className="text-sm text-primary-600 hover:text-primary-700 font-medium hover:underline underline-offset-2 transition-all"
                  >
                    {batchMode ? '收起操作' : '展开操作'}
                  </button>
                )}
              </div>

              {/* Quick Stats */}
              {batchStats && (
                <div className="flex items-center gap-4 text-sm text-neutral-500">
                  {Object.entries(batchStats.byStatus).map(([status, count]) => (
                    <span key={status} className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${
                        status === '已完成' ? 'bg-success-500 shadow-sm shadow-success-500/30' :
                        status === '进行中' ? 'bg-primary-500 shadow-sm shadow-primary-500/30' :
                        'bg-neutral-400'
                      }`} />
                      {status}: {count}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Card View */}
            {viewMode === 'card' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredProjects.map((project) => (
                  <div key={project.id} className="relative h-full">
                    {batchMode && (
                      <div className="absolute top-4 left-4 z-20">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(project.id)}
                          onChange={() => handleToggleSelection(project.id)}
                          className="w-4 h-4 rounded border-neutral-300 text-primary-600 focus:ring-4 focus:ring-primary-500/10 transition-all shadow-sm"
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
              <div className="bg-white/70 backdrop-blur-sm rounded-xl border border-neutral-200/60 shadow-sm overflow-hidden">
                {filteredProjects.map((project) => (
                  <div key={project.id} className="relative">
                    {batchMode && (
                      <div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(project.id)}
                          onChange={() => handleToggleSelection(project.id)}
                          className="w-4 h-4 rounded border-neutral-300 text-primary-600 focus:ring-4 focus:ring-primary-500/10 transition-all shadow-sm"
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
    </div>
  );
};

export default ProjectListPage;
