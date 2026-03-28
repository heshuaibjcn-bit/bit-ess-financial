/**
 * Data Import/Export Dialog Component
 *
 * 处理项目数据的导入和导出操作
 */

import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useCloudProjectStore, LocalProject } from '@/stores/cloudProjectStore';
import { useToast } from './ui/Toast';
import {
  exportProjectToFile,
  exportProjectsToFile,
  importProjectsFromJSON,
  validateImportedProject,
  getExportStats,
} from '@/services/dataExport';

/**
 * Import/Export Dialog Props
 */
interface ImportExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Import/Export Dialog Component
 */
export const ImportExportDialog: React.FC<ImportExportDialogProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const { showSuccess, showError } = useToast();
  const projects = useCloudProjectStore((state) => state.projects);
  const createProject = useCloudProjectStore((state) => state.createProject);
  const updateProject = useCloudProjectStore((state) => state.updateProject);

  const [mode, setMode] = useState<'export' | 'import'>('export');
  const [importing, setImporting] = useState(false);
  const [importPreview, setImportPreview] = useState<any[] | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 导出统计数据
  const exportStats = getExportStats(projects);

  /**
   * 处理导出所有项目
   */
  const handleExportAll = () => {
    try {
      exportProjectsToFile(projects);
      showSuccess(t('export.allSuccess', { defaultValue: '已导出所有项目' }));
    } catch (error) {
      showError(t('export.error', { defaultValue: '导出失败' }));
    }
  };

  /**
   * 处理文件选择
   */
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setImportPreview(null);

    try {
      const text = await file.text();
      const importedProjects = importProjectsFromJSON(text);

      // 验证导入的数据
      const errors = importedProjects.flatMap(p => validateImportedProject(p));

      if (errors.length > 0) {
        showError(`导入数据验证失败：\n${errors.join('\n')}`);
        return;
      }

      // 显示预览
      setImportPreview(importedProjects);
    } catch (error) {
      showError(t('export.invalidFile', { defaultValue: '文件格式无效' }));
    } finally {
      setImporting(false);
    }
  };

  /**
   * 确认导入
   */
  const handleConfirmImport = async () => {
    if (!importPreview || importPreview.length === 0) return;

    setImporting(true);

    try {
      for (const project of importPreview) {
        // 检查是否已存在相同 ID 的项目
        const existing = projects.find(p => p.id === project.id);
        if (existing) {
          // 更新现有项目
          await updateProject(project.id, {
            name: project.name,
            description: project.description,
            formData: project.formData,
            status: project.status,
            collaborationModel: project.collaborationModel,
            industry: project.industry,
          });
        } else {
          // 创建新项目
          await createProject(project.name, project.description || undefined);
        }
      }

      showSuccess(t('export.importSuccess', { defaultValue: `成功导入 ${importPreview.length} 个项目` }));
      setImportPreview(null);
      onClose();
    } catch (error) {
      showError(t('export.importError', { defaultValue: '导入失败' }));
    } finally {
      setImporting(false);
    }
  };

  /**
   * 取消导入
   */
  const handleCancelImport = () => {
    setImportPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {t('export.title', { defaultValue: '数据导入/导出' })}
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
        <div className="p-6">
          {/* Mode Toggle */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setMode('export')}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                mode === 'export'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {t('export.exportTab', { defaultValue: '导出数据' })}
            </button>
            <button
              onClick={() => setMode('import')}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                mode === 'import'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {t('export.importTab', { defaultValue: '导入数据' })}
            </button>
          </div>

          {/* Export Mode */}
          {mode === 'export' && (
            <div className="space-y-4">
              {/* Statistics */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-700 mb-3">
                  {t('export.statistics', { defaultValue: '数据统计' })}
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">{t('export.totalProjects', { defaultValue: '项目总数' })}:</span>
                    <span className="ml-2 font-semibold text-gray-900">{exportStats.totalProjects}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">{t('export.fileSize', { defaultValue: '文件大小' })}:</span>
                    <span className="ml-2 font-semibold text-gray-900">{exportStats.estimatedSize}</span>
                  </div>
                </div>

                {/* Status Breakdown */}
                {Object.keys(exportStats.statusBreakdown).length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <span className="text-gray-500 text-sm">{t('export.statusBreakdown', { defaultValue: '状态分布' })}:</span>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {Object.entries(exportStats.statusBreakdown).map(([status, count]) => (
                        <span
                          key={status}
                          className="px-2 py-1 bg-white rounded text-xs font-medium border border-gray-200"
                        >
                          {status}: {count}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Export Action */}
              <div className="flex justify-end">
                <button
                  onClick={handleExportAll}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  {t('export.downloadAll', { defaultValue: '下载所有项目' })}
                </button>
              </div>
            </div>
          )}

          {/* Import Mode */}
          {mode === 'import' && (
            <div className="space-y-4">
              {!importPreview ? (
                <>
                  {/* Instructions */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-blue-900 mb-2">
                      {t('export.howToImport', { defaultValue: '如何导入' })}
                    </h3>
                    <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                      <li>{t('export.step1', { defaultValue: '选择之前导出的 JSON 文件' })}</li>
                      <li>{t('export.step2', { defaultValue: '系统会验证文件格式' })}</li>
                      <li>{t('export.step3', { defaultValue: '预览要导入的项目' })}</li>
                      <li>{t('export.step4', { defaultValue: '确认导入到当前账号' })}</li>
                    </ol>
                  </div>

                  {/* File Input */}
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".json"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={importing}
                      className="px-6 py-3 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      {importing
                        ? t('export.loading', { defaultValue: '加载中...' })
                        : t('export.selectFile', { defaultValue: '选择文件' })
                      }
                    </button>
                    <p className="mt-2 text-sm text-gray-500">
                      {t('export.fileType', { defaultValue: '支持 .json 格式' })}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  {/* Preview */}
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    <h3 className="text-sm font-medium text-gray-700">
                      {t('export.preview', { defaultValue: '预览' })} ({importPreview.length} {t('export.projects', { defaultValue: '个项目' })})
                    </h3>
                    {importPreview.map((project, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{project.name}</p>
                          <p className="text-xs text-gray-500">{project.status}</p>
                        </div>
                        <span className={`px-2 py-1 text-xs rounded ${
                          projects.find(p => p.id === project.id)
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {projects.find(p => p.id === project.id) ? '更新' : '新增'}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                    <button
                      onClick={handleCancelImport}
                      disabled={importing}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                      {t('common.cancel', { defaultValue: '取消' })}
                    </button>
                    <button
                      onClick={handleConfirmImport}
                      disabled={importing}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      {importing
                        ? t('export.importing', { defaultValue: '导入中...' })
                        : t('export.confirmImport', { defaultValue: '确认导入' })
                      }
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImportExportDialog;
