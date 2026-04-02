/**
 * Alert Component
 * 
 * Minimal business-style alert for displaying messages.
 * White & Blue color palette.
 */

import React from 'react';

interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'destructive' | 'success' | 'warning';
}

interface AlertDescriptionProps extends React.HTMLAttributes<HTMLDivElement> {}

export const Alert: React.FC<AlertProps> = ({
  children,
  className = '',
  variant = 'default',
  ...props
}) => {
  const baseStyles = 'rounded-lg p-4 border flex items-start gap-3';

  const variantStyles = {
    default: 'bg-primary-50/50 border-primary-200 text-primary-900',
    destructive: 'bg-error-50/50 border-error-200 text-error-900',
    success: 'bg-success-50/50 border-success-200 text-success-900',
    warning: 'bg-warning-50/50 border-warning-200 text-warning-900',
  };

  const iconColors = {
    default: 'text-primary-500',
    destructive: 'text-error-500',
    success: 'text-success-500',
    warning: 'text-warning-500',
  };

  return (
    <div
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
      role="alert"
      {...props}
    >
      <div className={`flex-shrink-0 mt-0.5 ${iconColors[variant]}`}>
        {variant === 'default' && (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )}
        {variant === 'destructive' && (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )}
        {variant === 'success' && (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )}
        {variant === 'warning' && (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        )}
      </div>
      <div className="flex-1 min-w-0">
        {children}
      </div>
    </div>
  );
};

export const AlertTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <h5 className={`text-sm font-semibold mb-1 ${className}`} {...props}>
      {children}
    </h5>
  );
};

export const AlertDescription: React.FC<AlertDescriptionProps> = ({
  className = '',
  children,
  ...props
}) => {
  return (
    <div className={`text-sm opacity-90 ${className}`} {...props}>
      {children}
    </div>
  );
};

export default Alert;
