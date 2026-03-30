/**
 * Project Card Component
 *
 * Displays a project summary card in the project list.
 */

import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CloudProject, ProjectStatus } from '@/stores/cloudProjectStore';

/**
 * ProjectCard Props
 */
interface ProjectCardProps {
  project: CloudProject;
  onDuplicate?: (id: string) => void;
  onDelete?: (id: string) => void;
}

/**
 * Status badge styles
 */
const statusStyles: Record<
  ProjectStatus,
  { bg: string; text: string; label: string }
> = {
  draft: {
    bg: 'bg-gray-100',
    text: 'text-gray-800',
    label: '草稿',
  },
  in_progress: {
    bg: 'bg-blue-100',
    text: 'text-blue-800',
    label: '进行中',
  },
  completed: {
    bg: 'bg-green-100',
    text: 'text-green-800',
    label: '已完成',
  },
};

/**
 * Format date to relative time
 */
const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return '刚刚';
  if (diffMins < 60) return `${diffMins}分钟前`;
  if (diffHours < 24) return `${diffHours}小时前`;
  if (diffDays < 7) return `${diffDays}天前`;

  return date.toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric',
  });
};

/**
 * Get collaboration model display name
 */
const getCollaborationModelName = (model: string | null): string => {
  if (!model) return '-';
  const models: Record<string, string> = {
    emc: 'EMC',
    lease: '租赁',
    sale: '销售',
    joint_venture: '合资',
  };
  return models[model] || model;
};

/**
 * ProjectCard Component - Optimized with React.memo
 */
export const ProjectCard = React.memo<ProjectCardProps>(({
  project,
  onDuplicate,
  onDelete,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const statusStyle = statusStyles[project.status];

  const handleClick = useCallback(() => {
    navigate(`/project/${project.id}`);
  }, [navigate, project.id]);

  const handleDuplicate = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onDuplicate?.(project.id);
  }, [onDuplicate, project.id]);

  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.(project.id);
  }, [onDelete, project.id]);

  return (
    <div
      onClick={handleClick}
      className="bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group h-full flex flex-col"
    >
      <div className="p-5 flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          {/* Title */}
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
              {project.name}
            </h3>
            {project.industry && (
              <p className="text-sm text-gray-500 mt-1">{project.industry}</p>
            )}
          </div>

          {/* Status Badge */}
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyle.bg} ${statusStyle.text}`}>
            {statusStyle.label}
          </span>
        </div>

        {/* Description */}
        {project.description && (
          <p className="text-sm text-gray-600 line-clamp-2 mb-3 flex-1">
            {project.description}
          </p>
        )}

        {/* Metadata */}
        <div className="flex items-center justify-between text-xs text-gray-500 mt-auto">
          <div className="flex items-center gap-4">
            {/* Collaboration Model */}
            {project.collaborationModel && (
              <span className="inline-flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                {getCollaborationModelName(project.collaborationModel)}
              </span>
            )}

            {/* Updated Time */}
            <span className="inline-flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {formatRelativeTime(project.updatedAt)}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={handleDuplicate}
              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
              title={t('project.duplicate', { defaultValue: 'Duplicate' })}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
            <button
              onClick={handleDelete}
              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
              title={t('project.delete', { defaultValue: 'Delete' })}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for better performance
  return (
    prevProps.project.id === nextProps.project.id &&
    prevProps.project.name === nextProps.project.name &&
    prevProps.project.status === nextProps.project.status &&
    prevProps.project.updatedAt === nextProps.project.updatedAt &&
    prevProps.project.industry === nextProps.project.industry &&
    prevProps.project.description === nextProps.project.description &&
    prevProps.project.collaborationModel === nextProps.project.collaborationModel &&
    prevProps.onDuplicate === nextProps.onDuplicate &&
    prevProps.onDelete === nextProps.onDelete
  );
});

/**
 * Project List Item (compact view) - Optimized with React.memo
 */
export const ProjectListItem = React.memo<ProjectCardProps>(({
  project,
  onDuplicate,
  onDelete,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const statusStyle = statusStyles[project.status];

  const handleClick = useCallback(() => {
    navigate(`/project/${project.id}`);
  }, [navigate, project.id]);

  const handleDuplicate = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onDuplicate?.(project.id);
  }, [onDuplicate, project.id]);

  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.(project.id);
  }, [onDelete, project.id]);

  return (
    <div
      onClick={handleClick}
      className="flex items-center justify-between py-3 px-4 hover:bg-gray-50 transition-colors cursor-pointer group border-b border-gray-100 last:border-b-0"
    >
      <div className="flex items-center gap-4 flex-1 min-w-0">
        {/* Status Indicator */}
        <div className={`w-2 h-2 rounded-full ${statusStyle.bg.replace('bg-', 'bg-').replace('100', '500')}`} />

        {/* Project Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-medium text-gray-900 truncate group-hover:text-blue-600 transition-colors">
              {project.name}
            </h4>
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${statusStyle.bg} ${statusStyle.text}`}>
              {statusStyle.label}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            {new Date(project.updatedAt).toLocaleString('zh-CN', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={handleDuplicate}
          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </button>
        <button
          onClick={handleDelete}
          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H21.862a2 2 0 01-1.995 1.858L7 7m0 0a2 2 0 01-2-2V5a2 2 0 012-2h4a2 2 0 012 2v2M7 7h10" />
          </svg>
        </button>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for better performance
  return (
    prevProps.project.id === nextProps.project.id &&
    prevProps.project.name === nextProps.project.name &&
    prevProps.project.status === nextProps.project.status &&
    prevProps.project.updatedAt === nextProps.project.updatedAt &&
    prevProps.onDuplicate === nextProps.onDuplicate &&
    prevProps.onDelete === nextProps.onDelete
  );
});

export default ProjectCard;
