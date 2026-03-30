/**
 * Enhanced Loading States
 *
 * Better loading indicators with skeletons, progress bars, and smooth transitions
 */

import React from 'react';
import { cn } from '@/lib/utils';

/**
 * Loading spinner with different sizes
 */
export const LoadingSpinner: React.FC<{
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}> = ({ size = 'md', className }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div
      className={cn(
        'animate-spin rounded-full border-2 border-gray-300 border-t-blue-600',
        sizeClasses[size],
        className
      )}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
};

/**
 * Dots loading animation
 */
export const DotsLoader: React.FC<{
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}> = ({ size = 'md', className }) => {
  const sizeClasses = {
    sm: 'w-1 h-1',
    md: 'w-2 h-2',
    lg: 'w-3 h-3',
  };

  return (
    <div className={cn('flex items-center gap-1', className)} role="status" aria-label="Loading">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={cn(
            'bg-blue-600 rounded-full animate-bounce',
            sizeClasses[size]
          )}
          style={{
            animationDelay: `${i * 0.1}s`,
            animationDuration: '0.6s',
          }}
        />
      ))}
      <span className="sr-only">Loading...</span>
    </div>
  );
};

/**
 * Progress bar loader
 */
export const ProgressBar: React.FC<{
  progress: number; // 0-100
  className?: string;
  showLabel?: boolean;
  label?: string;
}> = ({ progress, className, showLabel = false, label }) => {
  return (
    <div className={cn('w-full', className)}>
      <div className="flex items-center justify-between mb-1">
        {showLabel && (
          <span className="text-sm font-medium text-gray-700">
            {label || 'Loading...'}
          </span>
        )}
        <span className="text-sm text-gray-500">{Math.round(progress)}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  );
};

/**
 * Skeleton loader for various content types
 */
export const Skeleton: React.FC<{
  className?: string;
  variant?: 'text' | 'rectangular' | 'circular';
  width?: string | number;
  height?: string | number;
}> = ({ className, variant = 'text', width, height }) => {
  const variantClasses = {
    text: 'rounded',
    rectangular: 'rounded-md',
    circular: 'rounded-full',
  };

  return (
    <div
      className={cn(
        'animate-pulse bg-gray-200',
        variantClasses[variant],
        className
      )}
      style={{ width, height }}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
};

/**
 * Text skeleton with multiple lines
 */
export const TextSkeleton: React.FC<{
  lines?: number;
  className?: string;
}> = ({ lines = 3, className }) => {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          variant="text"
          height="1rem"
          width={i === lines - 1 ? '75%' : '100%'}
        />
      ))}
    </div>
  );
};

/**
 * Card skeleton
 */
export const CardSkeleton: React.FC<{
  className?: string;
}> = ({ className }) => {
  return (
    <div className={cn('bg-white rounded-lg border border-gray-200 p-4', className)}>
      <div className="flex items-start space-x-4">
        <Skeleton variant="circular" width={48} height={48} />
        <div className="flex-1 space-y-2">
          <Skeleton width="60%" height="1.25rem" />
          <Skeleton width="40%" height="1rem" />
          <TextSkeleton lines={2} />
        </div>
      </div>
    </div>
  );
};

/**
 * Table skeleton
 */
export const TableSkeleton: React.FC<{
  rows?: number;
  cols?: number;
  className?: string;
}> = ({ rows = 5, cols = 4, className }) => {
  return (
    <div className={cn('w-full', className)}>
      <div className="border-b border-gray-200 pb-2 mb-2">
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
          {Array.from({ length: cols }).map((_, i) => (
            <Skeleton key={i} height="2rem" />
          ))}
        </div>
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="grid gap-4 py-3" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
          {Array.from({ length: cols }).map((_, j) => (
            <Skeleton key={j} height="2rem" />
          ))}
        </div>
      ))}
    </div>
  );
};

/**
 * Full page loader with backdrop
 */
export const FullPageLoader: React.FC<{
  text?: string;
  showProgress?: boolean;
  progress?: number;
}> = ({ text = 'Loading...', showProgress = false, progress }) => {
  return (
    <div className="fixed inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50">
      <div className="text-center">
        <LoadingSpinner size="lg" className="mx-auto mb-4" />
        <p className="text-gray-600 text-lg font-medium">{text}</p>
        {showProgress && progress !== undefined && (
          <div className="mt-4 w-64 mx-auto">
            <ProgressBar progress={progress} />
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Inline loading state for buttons
 */
export const ButtonLoader: React.FC<{
  loading: boolean;
  children: React.ReactNode;
  disabled?: boolean;
  className?: string;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
}> = ({ loading, children, disabled, className, onClick, type = 'button' }) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors',
        className
      )}
    >
      {loading && <LoadingSpinner size="sm" />}
      {children}
    </button>
  );
};

/**
 * Optimistic update wrapper
 */
export const OptimisticWrapper: React.FC<{
  children: React.ReactNode;
  isUpdating: boolean;
  updatePreview?: React.ReactNode;
  className?: string;
}> = ({ children, isUpdating, updatePreview, className }) => {
  return (
    <div className={cn('relative', className)}>
      <div
        className={cn(
          'transition-opacity duration-200',
          isUpdating ? 'opacity-50' : 'opacity-100'
        )}
      >
        {children}
      </div>
      {isUpdating && updatePreview && (
        <div className="absolute inset-0 flex items-center justify-center">
          {updatePreview}
        </div>
      )}
    </div>
  );
};

/**
 * Loading overlay for containers
 */
export const LoadingOverlay: React.FC<{
  loading: boolean;
  children: React.ReactNode;
  text?: string;
  className?: string;
}> = ({ loading, children, text, className }) => {
  return (
    <div className={cn('relative', className)}>
      {children}
      {loading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg">
          <div className="text-center">
            <LoadingSpinner size="md" className="mx-auto mb-2" />
            {text && <p className="text-sm text-gray-600">{text}</p>}
          </div>
        </div>
      )}
    </div>
  );
};
