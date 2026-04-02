/**
 * Empty State Component
 * 
 * Minimal business-style empty state with clean illustration and action button.
 * White & Blue color palette.
 */

import React from 'react';
import { useTranslation } from 'react-i18next';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title?: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeConfig = {
  sm: {
    icon: 'w-10 h-10',
    title: 'text-base',
    description: 'text-sm',
    padding: 'py-8',
  },
  md: {
    icon: 'w-14 h-14',
    title: 'text-lg',
    description: 'text-sm',
    padding: 'py-12',
  },
  lg: {
    icon: 'w-20 h-20',
    title: 'text-xl',
    description: 'text-base',
    padding: 'py-16',
  },
};

/**
 * Default empty state icons
 */
const EmptyStateIcons = {
  folder: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
    </svg>
  ),
  document: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  search: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  ),
  cloud: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
    </svg>
  ),
  inbox: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
    </svg>
  ),
  chart: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
};

/**
 * Empty State Component
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className = '',
  size = 'md',
}) => {
  const { t } = useTranslation();
  const defaultIcon = icon || EmptyStateIcons.folder;
  const config = sizeConfig[size];

  return (
    <div className={`flex flex-col items-center justify-center px-4 ${config.padding} ${className}`}>
      {/* Icon Container */}
      <div className={`${config.icon} text-neutral-300 mb-4`}>
        {defaultIcon}
      </div>

      {/* Title */}
      {title && (
        <h3 className={`${config.title} font-semibold text-neutral-900 mb-2 text-center`}>
          {title}
        </h3>
      )}

      {/* Description */}
      {description && (
        <p className={`${config.description} text-neutral-500 text-center max-w-sm mb-6`}>
          {description}
        </p>
      )}

      {/* Action Button */}
      {action && (
        <button
          onClick={action.onClick}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          {action.label}
        </button>
      )}
    </div>
  );
};

/**
 * Pre-configured empty states
 */

export const NoProjectsEmptyState: React.FC<{ onCreateProject: () => void }> = ({ onCreateProject }) => {
  const { t } = useTranslation();

  return (
    <EmptyState
      icon={EmptyStateIcons.folder}
      title={t('emptyState.noProjects', { defaultValue: '还没有项目' })}
      description={t('emptyState.noProjectsDescription', { defaultValue: '创建您的第一个储能投资分析项目，开始评估投资回报率。' })}
      action={{
        label: t('emptyState.createProject', { defaultValue: '创建项目' }),
        onClick: onCreateProject,
      }}
      size="lg"
    />
  );
};

export const NoSearchResultsEmptyState: React.FC<{ query: string }> = ({ query }) => {
  const { t } = useTranslation();

  return (
    <EmptyState
      icon={EmptyStateIcons.search}
      title={t('emptyState.noResults', { defaultValue: '未找到结果' })}
      description={t('emptyState.noResultsDescription', { defaultValue: `没有找到与 "${query}" 匹配的项目` })}
      size="md"
    />
  );
};

export const NoConnectionEmptyState: React.FC<{ onRetry: () => void }> = ({ onRetry }) => {
  const { t } = useTranslation();

  return (
    <EmptyState
      icon={EmptyStateIcons.cloud}
      title={t('emptyState.noConnection', { defaultValue: '连接中断' })}
      description={t('emptyState.noConnectionDescription', { defaultValue: '请检查网络连接后重试' })}
      action={{
        label: t('emptyState.retry', { defaultValue: '重试' }),
        onClick: onRetry,
      }}
      size="md"
    />
  );
};

export default EmptyState;
