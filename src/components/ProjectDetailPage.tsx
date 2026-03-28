/**
 * Project Detail Page
 *
 * Project editing page with CalculatorForm integration and auto-save.
 */

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { debounce } from 'lodash-es';
import { useCloudProjectStore } from '@/stores/cloudProjectStore';
import { CalculatorForm } from './CalculatorForm';
import { LoadingSpinner, useToast, useConfirmDialog } from './ui';
import type { ProjectInput } from '@/domain/schemas/ProjectSchema';

/**
 * ProjectDetailPage Component
 */
export const ProjectDetailPage: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { confirm, Dialog } = useConfirmDialog();
  const { showSuccess, showError } = useToast();

  // Store state
  const loadProject = useCloudProjectStore((state) => state.loadProject);
  const updateProject = useCloudProjectStore((state) => state.updateProject);
  const deleteProject = useCloudProjectStore((state) => state.deleteProject);
  const currentProject = useCloudProjectStore((state) => state.currentProject);
  const loading = useCloudProjectStore((state) => state.loading);
  const saving = useCloudProjectStore((state) => state.saving);

  // Local state
  const [formData, setFormData] = useState<ProjectInput | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState('');

  // Track initial form data for unsaved changes detection
  const initialFormDataRef = useRef<ProjectInput | null>(null);

  /**
   * Load project on mount
   */
  useEffect(() => {
    if (id) {
      loadProject(id)
        .then(() => {
          // Project loaded, initialFormDataRef will be set in the next effect
        })
        .catch((err) => {
          console.error('Failed to load project:', err);
          showError(t('project.loadError', { defaultValue: 'Failed to load project' }));
        });
    }
  }, [id, loadProject, showError, t]);

  /**
   * Initialize form data when project loads
   */
  useEffect(() => {
    if (currentProject) {
      setFormData(currentProject.formData);
      setProjectName(currentProject.name);
      setTempName(currentProject.name);
      initialFormDataRef.current = currentProject.formData;
      setLastSaved(new Date(currentProject.updatedAt));
    }
  }, [currentProject]);

  /**
   * Auto-save with debounce
   */
  const autoSave = useCallback(
    debounce(async (data: ProjectInput, name?: string) => {
      if (!id) return;

      try {
        const updates: { form_data?: ProjectInput; name?: string } = { form_data: data };
        if (name !== undefined && name !== currentProject?.name) {
          updates.name = name;
        }

        await updateProject(id, updates);
        setLastSaved(new Date());
        setHasUnsavedChanges(false);
        initialFormDataRef.current = data;
      } catch (err) {
        console.error('Auto-save failed:', err);
        // Don't show error for auto-save failures to avoid spamming user
      }
    }, 1000),
    [id, updateProject, currentProject]
  );

  /**
   * Handle form data change
   */
  const handleFormChange = useCallback((data: ProjectInput) => {
    setFormData(data);
    setHasUnsavedChanges(
      JSON.stringify(data) !== JSON.stringify(initialFormDataRef.current)
    );
    autoSave(data);
  }, [autoSave]);

  /**
   * Handle form submit (manual save)
   */
  const handleSubmit = useCallback(async (data: ProjectInput) => {
    if (!id) return;

    try {
      await updateProject(id, { form_data: data });
      setLastSaved(new Date());
      setHasUnsavedChanges(false);
      showSuccess(t('project.saved', { defaultValue: 'Project saved successfully' }));
    } catch (err) {
      console.error('Failed to save project:', err);
      showError(t('project.saveError', { defaultValue: 'Failed to save project' }));
    }
  }, [id, updateProject, showSuccess, showError, t]);

  /**
   * Handle manual calculate
   */
  const handleCalculate = useCallback((data: ProjectInput) => {
    handleFormChange(data);
  }, [handleFormChange]);

  /**
   * Handle delete project
   */
  const handleDelete = useCallback(async () => {
    if (!currentProject || !id) return;

    const confirmed = await confirm(
      t('project.deleteConfirmTitle', { defaultValue: 'Delete Project' }),
      t('project.deleteConfirmMessage', {
        defaultValue: `Are you sure you want to delete "${currentProject.name}"? This action cannot be undone.`,
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
        navigate('/');
      } catch (err) {
        console.error('Failed to delete project:', err);
        showError(t('project.deleteError', { defaultValue: 'Failed to delete project' }));
      }
    }
  }, [currentProject, id, confirm, deleteProject, showSuccess, showError, navigate, t]);

  /**
   * Handle back to list
   */
  const handleBack = useCallback(async () => {
    if (hasUnsavedChanges) {
      const confirmed = await confirm(
        t('project.unsavedChangesTitle', { defaultValue: 'Unsaved Changes' }),
        t('project.unsavedChangesMessage', {
          defaultValue: 'You have unsaved changes. Are you sure you want to leave?',
        }),
        {
          confirmText: t('common.leave', { defaultValue: 'Leave' }),
          cancelText: t('common.stay', { defaultValue: 'Stay' }),
          variant: 'warning',
        }
      );

      if (!confirmed) return;
    }
    navigate('/');
  }, [hasUnsavedChanges, confirm, navigate, t]);

  /**
   * Handle project name save
   */
  const handleSaveName = useCallback(async () => {
    if (!id || tempName.trim() === '') return;

    try {
      await updateProject(id, { name: tempName.trim() });
      setProjectName(tempName.trim());
      setIsEditingName(false);
      setLastSaved(new Date());
      showSuccess(t('project.nameSaved', { defaultValue: 'Project name updated' }));
    } catch (err) {
      console.error('Failed to update project name:', err);
      showError(t('project.nameSaveError', { defaultValue: 'Failed to update project name' }));
    }
  }, [id, tempName, updateProject, showSuccess, showError, t]);

  /**
   * Format last saved time
   */
  const formatLastSaved = useCallback((date: Date | null): string => {
    if (!date) return '-';
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return t('project.justNow', { defaultValue: '刚刚' });
    if (diffMins < 60) return t('project.minutesAgo', { defaultValue: `{{minutes}}分钟前`, minutes: diffMins });

    const diffHours = Math.floor(diffMs / 3600000);
    if (diffHours < 24) return t('project.hoursAgo', { defaultValue: `{{hours}}小时前`, hours: diffHours });

    return date.toLocaleString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }, [t]);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" text={t('project.loading', { defaultValue: 'Loading project...' })} />
      </div>
    );
  }

  // Show error state if project not found
  if (!currentProject || !formData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center">
          <svg
            className="w-16 h-16 text-gray-400 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {t('project.notFound', { defaultValue: 'Project Not Found' })}
          </h2>
          <button
            onClick={() => navigate('/')}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors"
          >
            {t('project.backToList', { defaultValue: 'Back to Projects' })}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            {/* Left: Back button and Project Name */}
            <div className="flex items-center gap-4 flex-1">
              <button
                onClick={handleBack}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                title={t('common.back', { defaultValue: 'Back' })}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              <div className="flex-1 min-w-0">
                {isEditingName ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={tempName}
                      onChange={(e) => setTempName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveName();
                        if (e.key === 'Escape') {
                          setTempName(projectName);
                          setIsEditingName(false);
                        }
                      }}
                      className="flex-1 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-lg font-semibold"
                      autoFocus
                    />
                    <button
                      onClick={handleSaveName}
                      className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </button>
                    <button
                      onClick={() => {
                        setTempName(projectName);
                        setIsEditingName(false);
                      }}
                      className="p-1 text-gray-400 hover:bg-gray-100 rounded transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <h1
                      onClick={() => setIsEditingName(true)}
                      className="text-lg font-semibold text-gray-900 cursor-pointer hover:text-blue-600 transition-colors truncate"
                      title={t('project.editName', { defaultValue: 'Click to edit' })}
                    >
                      {projectName}
                    </h1>
                    <button
                      onClick={() => setIsEditingName(true)}
                      className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                  </div>
                )}

                {/* Save status */}
                <div className="flex items-center gap-2 mt-0.5">
                  {saving ? (
                    <div className="flex items-center gap-1.5 text-sm text-gray-500">
                      <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      {t('project.saving', { defaultValue: 'Saving...' })}
                    </div>
                  ) : hasUnsavedChanges ? (
                    <div className="flex items-center gap-1.5 text-sm text-orange-600">
                      <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {t('project.unsaved', { defaultValue: 'Unsaved changes' })}
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-sm text-green-600">
                      <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {t('project.savedAt', { defaultValue: 'Saved {{time}}', time: formatLastSaved(lastSaved) })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleDelete}
                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                title={t('project.delete', { defaultValue: 'Delete project' })}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H21.862a2 2 0 01-1.995 1.858L7 7m0 0a2 2 0 01-2-2V5a2 2 0 012-2h4a2 2 0 012 2v2M7 7h10" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <CalculatorForm
            defaultValues={formData}
            onSubmit={handleSubmit}
            onCalculate={handleCalculate}
          />
        </div>
      </main>

      {/* Confirm Dialog */}
      <Dialog />
    </div>
  );
};

export default ProjectDetailPage;
