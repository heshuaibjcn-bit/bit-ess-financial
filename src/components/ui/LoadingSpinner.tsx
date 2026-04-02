/**
 * Loading Spinner Component
 * 
 * Minimal business-style loading indicator.
 * White & Blue color palette.
 */

import React from 'react';
import { useTranslation } from 'react-i18next';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  text?: string;
  className?: string;
  variant?: 'primary' | 'secondary' | 'white';
}

const sizeClasses = {
  sm: 'h-4 w-4 border-2',
  md: 'h-6 w-6 border-2',
  lg: 'h-8 w-8 border-2',
  xl: 'h-12 w-12 border-3',
};

const variantClasses = {
  primary: 'border-primary-600 border-t-transparent',
  secondary: 'border-neutral-400 border-t-transparent',
  white: 'border-white border-t-transparent/30',
};

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  text,
  className = '',
  variant = 'primary',
}) => {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="flex flex-col items-center gap-3">
        <div
          className={`animate-spin rounded-full ${sizeClasses[size]} ${variantClasses[variant]}`}
          role="status"
          aria-label="loading"
        />
        {text && (
          <p className="text-sm text-neutral-500">{text}</p>
        )}
      </div>
    </div>
  );
};

/**
 * Full Page Loading Spinner
 */
export const FullPageLoading: React.FC<{ text?: string }> = ({
  text,
}) => {
  const { t } = useTranslation();
  const displayText = text || t('common.loading', { defaultValue: 'Loading...' });

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50">
      <LoadingSpinner size="xl" text={displayText} />
    </div>
  );
};

/**
 * Inline Loading Spinner (for buttons, etc)
 */
export const InlineLoadingSpinner: React.FC<{ size?: 'sm' | 'md'; className?: string }> = ({ 
  size = 'sm',
  className = ''
}) => {
  return (
    <div
      className={`inline-block animate-spin rounded-full border-2 border-current border-t-transparent ${
        size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'
      } ${className}`}
      role="status"
      aria-label="loading"
    />
  );
};

/**
 * Skeleton Loading Component
 */
interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  width?: string | number;
  height?: string | number;
  circle?: boolean;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width,
  height,
  circle = false,
  className = '',
  style,
  ...props
}) => {
  const customStyle: React.CSSProperties = {
    width: width,
    height: height,
    ...style,
  };

  return (
    <div
      className={`animate-pulse bg-neutral-200 ${circle ? 'rounded-full' : 'rounded-md'} ${className}`}
      style={customStyle}
      {...props}
    />
  );
};

export default LoadingSpinner;
