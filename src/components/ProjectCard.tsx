/**
 * Project Card Component - Premium Edition
 * 
 * Rich textured project card with glass effects, gradients, and depth.
 * White & Blue color palette with premium finish.
 */

import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CloudProject, ProjectStatus } from '@/stores/cloudProjectStore';
import { Badge } from './ui/Badge';

interface ProjectCardProps {
  project: CloudProject;
  onDuplicate?: (id: string) => void;
  onDelete?: (id: string) => void;
}

const statusConfig: Record<
  ProjectStatus,
  { variant: 'default' | 'primary' | 'success'; label: string; glow: string }
> = {
  draft: { variant: 'default', label: '草稿', glow: 'shadow-neutral-200' },
  in_progress: { variant: 'primary', label: '进行中', glow: 'shadow-primary-200' },
  completed: { variant: 'success', label: '已完成', glow: 'shadow-success-200' },
};

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

export const ProjectCard = React.memo<ProjectCardProps>(({
  project,
  onDuplicate,
  onDelete,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const status = statusConfig[project.status];

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
      className="group relative bg-gradient-to-b from-white to-neutral-50/80 rounded-xl border border-neutral-200/80 hover:border-primary-300/60 transition-all duration-300 cursor-pointer h-full flex flex-col overflow-hidden hover-lift"
      style={{
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
      }}
    >
      {/* Top gradient line */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary-400/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      {/* Shine effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

      <div className="p-5 flex-1 flex flex-col relative">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-neutral-900 truncate group-hover:text-primary-600 transition-colors duration-200">
              {project.name}
            </h3>
            {project.industry && (
              <p className="text-sm text-neutral-500 mt-0.5">{project.industry}</p>
            )}
          </div>

          <div className="relative">
            <Badge variant={status.variant} className="relative z-10">
              {status.label}
            </Badge>
            {/* Status glow */}
            <div className={`absolute inset-0 blur-md opacity-0 group-hover:opacity-40 transition-opacity duration-300 bg-${status.variant === 'primary' ? 'primary' : status.variant === 'success' ? 'success' : 'neutral'}-400`} />
          </div>
        </div>

        {/* Description */}
        {project.description ? (
          <p className="text-sm text-neutral-600 line-clamp-2 mb-4 flex-1 leading-relaxed">
            {project.description}
          </p>
        ) : (
          <div className="flex-1" />
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-neutral-100/80">
          <div className="flex items-center gap-4 text-xs text-neutral-500">
            {project.collaborationModel && (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-neutral-100/80 rounded-md">
                <svg className="w-3.5 h-3.5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                {getCollaborationModelName(project.collaborationModel)}
              </span>
            )}

            <span className="inline-flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {formatRelativeTime(project.updatedAt)}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-y-1 group-hover:translate-y-0">
            <button
              onClick={handleDuplicate}
              className="p-1.5 text-neutral-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all duration-200 hover:scale-105"
              title={t('project.duplicate', { defaultValue: '复制' })}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
            <button
              onClick={handleDelete}
              className="p-1.5 text-neutral-400 hover:text-error-600 hover:bg-error-50 rounded-lg transition-all duration-200 hover:scale-105"
              title={t('project.delete', { defaultValue: '删除' })}
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

export const ProjectListItem = React.memo<ProjectCardProps>(({
  project,
  onDuplicate,
  onDelete,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const status = statusConfig[project.status];

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
      className="group flex items-center justify-between py-3 px-4 hover:bg-gradient-to-r hover:from-neutral-50/80 hover:to-white/40 transition-all duration-200 cursor-pointer border-b border-neutral-100/80 last:border-b-0"
    >
      <div className="flex items-center gap-4 flex-1 min-w-0">
        {/* Status Dot with glow */}
        <div className="relative">
          <div className={`w-2 h-2 rounded-full ${
            project.status === 'completed' ? 'bg-success-500' :
            project.status === 'in_progress' ? 'bg-primary-500' :
            'bg-neutral-400'
          }`} />
          <div className={`absolute inset-0 rounded-full blur-sm opacity-50 ${
            project.status === 'completed' ? 'bg-success-400' :
            project.status === 'in_progress' ? 'bg-primary-400' :
            'bg-neutral-300'
          }`} />
        </div>

        {/* Project Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <h4 className="text-sm font-medium text-neutral-900 truncate group-hover:text-primary-600 transition-colors duration-200">
              {project.name}
            </h4>
            <Badge variant={status.variant} size="sm" className="opacity-80">
              {status.label}
            </Badge>
          </div>
          <p className="text-xs text-neutral-500 mt-0.5">
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
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-1 group-hover:translate-x-0">
        <button
          onClick={handleDuplicate}
          className="p-1.5 text-neutral-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all duration-200 hover:scale-105"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </button>
        <button
          onClick={handleDelete}
          className="p-1.5 text-neutral-400 hover:text-error-600 hover:bg-error-50 rounded-lg transition-all duration-200 hover:scale-105"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H21.862a2 2 0 01-1.995-1.858L7 7m0 0a2 2 0 01-2-2V5a2 2 0 012-2h4a2 2 0 012 2v2M7 7h10" />
          </svg>
        </button>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
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
