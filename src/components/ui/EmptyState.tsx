/**
 * Empty State Component
 *
 * Displays an empty state with optional illustration and action button.
 */

import React from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Empty State Props
 */
interface EmptyStateProps {
  icon?: React.ReactNode;
  title?: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

/**
 * Default empty state icons
 */
const EmptyStateIcons = {
  folder: (
    <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
    </svg>
  ),
  document: (
    <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  search: (
    <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  ),
  cloud: (
    <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
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
}) => {
  const { t } = useTranslation();

  const defaultIcon = icon || EmptyStateIcons.folder;

  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 ${className}`}>
      {/* Icon */}
      <div className="mb-4">
        {defaultIcon}
      </div>

      {/* Title */}
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {title}
        </h3>
      )}

      {/* Description */}
      {description && (
        <p className="text-sm text-gray-600 text-center max-w-md mb-6">
          {description}
        </p>
      )}

      {/* Action Button */}
      {action && (
        <button
          onClick={action.onClick}
          className="px-6 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors"
        >
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
      title={t('emptyState.noProjects', { defaultValue: 'No projects yet' })}
      description={t('emptyState.noProjectsDescription', { defaultValue: 'Create your first energy storage investment analysis project.' })}
      action={{
        label: t('emptyState.createProject', { defaultValue: 'Create Project' }),
        onClick: onCreateProject,
      }}
    />
  );
};

export const NoSearchResultsEmptyState: React.FC<{ query: string }> = ({ query }) => {
  const { t } = useTranslation();

  return (
    <EmptyState
      icon={EmptyStateIcons.search}
      title={t('emptyState.noResults', { defaultValue: 'No results found' })}
      description={t('emptyState.noResultsDescription', { defaultValue: `We couldn't find anything matching "${query}"` })}
    />
  );
};

export const NoConnectionEmptyState: React.FC<{ onRetry: () => void }> = ({ onRetry }) => {
  const { t } = useTranslation();

  return (
    <EmptyState
      icon={EmptyStateIcons.cloud}
      title={t('emptyState.noConnection', { defaultValue: 'Connection lost' })}
      description={t('emptyState.noConnectionDescription', { defaultValue: 'Check your internet connection and try again.' })}
      action={{
        label: t('emptyState.retry', { defaultValue: 'Retry' }),
        onClick: onRetry,
      }}
    />
  );
};

export default EmptyState;
