/**
 * Template Selector Dialog Component
 *
 * 显示项目模板列表，支持从模板创建新项目
 */

import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useCloudProjectStore } from '@/stores/cloudProjectStore';
import { useToast } from './ui/Toast';
import {
  getTemplates,
  getTemplateCategories,
  createProjectFromTemplate,
  saveProjectAsTemplate,
  TEMPLATE_CATEGORIES,
  type ProjectTemplate,
} from '@/services/projectTemplate';

/**
 * Template Selector Dialog Props
 */
interface TemplateSelectorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  currentProjectData?: any; // 当前项目数据，用于"保存为模板"
  mode?: 'create' | 'save';
}

/**
 * Template Selector Dialog Component
 */
export const TemplateSelectorDialog: React.FC<TemplateSelectorDialogProps> = ({
  isOpen,
  onClose,
  currentProjectData,
  mode = 'create',
}) => {
  const { t } = useTranslation();
  const { showSuccess, showError } = useToast();
  const createProject = useCloudProjectStore((state) => state.createProject);

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [savingAsTemplate, setSavingAsTemplate] = useState(false);
  const [creatingFromTemplate, setCreatingFromTemplate] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateDesc, setTemplateDesc] = useState('');
  const [templateCategory, setTemplateCategory] = useState('other');

  // 获取并筛选模板
  const templates = useMemo(() => {
    let filtered = getTemplates();

    // 按分类筛选
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(t => t.category === selectedCategory);
    }

    // 按搜索词筛选
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(t =>
        t.name.toLowerCase().includes(query) ||
        t.description?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [selectedCategory, searchQuery]);

  const categories = useMemo(() => ['all', ...getTemplateCategories()], []);

  /**
   * 从模板创建项目
   */
  const handleCreateFromTemplate = async (template: ProjectTemplate) => {
    setCreatingFromTemplate(true);

    try {
      const formData = createProjectFromTemplate(template.id, template.name);
      const projectId = await createProject(template.name);

      showSuccess(t('template.created', { defaultValue: `已从模板"${template.name}"创建项目` }));
      onClose();
    } catch (error) {
      showError(t('template.createError', { defaultValue: '创建项目失败' }));
    } finally {
      setCreatingFromTemplate(false);
    }
  };

  /**
   * 保存当前项目为模板
   */
  const handleSaveAsTemplate = () => {
    if (!templateName.trim()) {
      showError(t('template.nameRequired', { defaultValue: '请输入模板名称' }));
      return;
    }

    if (!currentProjectData) {
      showError(t('template.noProjectData', { defaultValue: '没有项目数据' }));
      return;
    }

    setSavingAsTemplate(true);

    try {
      saveProjectAsTemplate(
        'current', // 使用当前项目ID
        templateName,
        templateDesc || null,
        templateCategory,
        currentProjectData
      );

      showSuccess(t('template.saved', { defaultValue: '模板已保存' }));
      setTemplateName('');
      setTemplateDesc('');
      onClose();
    } catch (error) {
      showError(t('template.saveError', { defaultValue: '保存模板失败' }));
    } finally {
      setSavingAsTemplate(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {mode === 'create'
              ? t('template.selectTitle', { defaultValue: '选择项目模板' })
              : t('template.saveTitle', { defaultValue: '保存为模板' })
            }
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
          {mode === 'create' ? (
            <>
              {/* Search and Filter */}
              <div className="flex items-center gap-4 mb-6">
                {/* Search */}
                <div className="flex-1 relative">
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
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t('template.searchPlaceholder', { defaultValue: '搜索模板...' })}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                  />
                </div>

                {/* Category Filter */}
                <div className="flex gap-2">
                  {categories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        selectedCategory === cat
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {cat === 'all' ? t('template.allCategories', { defaultValue: '全部' }) : TEMPLATE_CATEGORIES[cat as keyof typeof TEMPLATE_CATEGORIES] || cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Template Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group"
                    onClick={() => handleCreateFromTemplate(template)}
                  >
                    {/* Category Badge */}
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded">
                        {TEMPLATE_CATEGORIES[template.category as keyof typeof TEMPLATE_CATEGORIES] || template.category}
                      </span>
                      {template.isSystem && (
                        <span className="px-2 py-1 bg-purple-50 text-purple-700 text-xs font-medium rounded">
                          系统模板
                        </span>
                      )}
                    </div>

                    {/* Template Name */}
                    <h3 className="text-sm font-semibold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
                      {template.name}
                    </h3>

                    {/* Description */}
                    {template.description && (
                      <p className="text-xs text-gray-600 line-clamp-2">
                        {template.description}
                      </p>
                    )}

                    {/* Usage Count */}
                    {template.usageCount !== undefined && template.usageCount > 0 && (
                      <p className="text-xs text-gray-500 mt-2">
                        使用 {template.usageCount} 次
                      </p>
                    )}

                    {/* Use Template Button */}
                    <button
                      disabled={creatingFromTemplate}
                      className="mt-3 w-full px-3 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      {creatingFromTemplate
                        ? t('common.creating', { defaultValue: '创建中...' })
                        : t('template.useTemplate', { defaultValue: '使用此模板' })
                      }
                    </button>
                  </div>
                ))}
              </div>

              {/* Empty State */}
              {templates.length === 0 && (
                <div className="text-center py-12">
                  <svg
                    className="w-16 h-16 text-gray-400 mx-auto mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-gray-600">{t('template.noTemplates', { defaultValue: '没有找到模板' })}</p>
                </div>
              )}
            </>
          ) : (
            <>
              {/* Save as Template Form */}
              <div className="space-y-4 max-w-md">
                {/* Template Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('template.templateName', { defaultValue: '模板名称' })} *
                  </label>
                  <input
                    type="text"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    placeholder={t('template.namePlaceholder', { defaultValue: '输入模板名称' })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('template.description', { defaultValue: '描述' })}
                  </label>
                  <textarea
                    value={templateDesc}
                    onChange={(e) => setTemplateDesc(e.target.value)}
                    placeholder={t('template.descPlaceholder', { defaultValue: '简要描述此模板的用途' })}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('template.category', { defaultValue: '分类' })} *
                  </label>
                  <select
                    value={templateCategory}
                    onChange={(e) => setTemplateCategory(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  >
                    {Object.entries(TEMPLATE_CATEGORIES).map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    {t('common.cancel', { defaultValue: '取消' })}
                  </button>
                  <button
                    onClick={handleSaveAsTemplate}
                    disabled={savingAsTemplate || !templateName.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {savingAsTemplate
                      ? t('common.saving', { defaultValue: '保存中...' })
                      : t('template.save', { defaultValue: '保存模板' })
                    }
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default TemplateSelectorDialog;
