/**
 * Badge Component
 * 
 * Minimal business-style badge for displaying status and labels.
 * White & Blue color palette.
 */

import React from 'react';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'outline';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  className = '',
  variant = 'default',
  size = 'md',
  ...props
}) => {
  const baseStyles = 'inline-flex items-center font-medium transition-colors';
  
  const sizeStyles = {
    sm: 'px-2 py-0.5 text-xs rounded',
    md: 'px-2.5 py-0.5 text-xs rounded-md',
  };

  const variantStyles = {
    default: 'bg-neutral-100 text-neutral-700',
    primary: 'bg-primary-50 text-primary-700 border border-primary-200',
    secondary: 'bg-neutral-100 text-neutral-600',
    success: 'bg-success-50 text-success-700 border border-success-200',
    warning: 'bg-warning-50 text-warning-700 border border-warning-200',
    error: 'bg-error-50 text-error-700 border border-error-200',
    outline: 'bg-transparent border border-neutral-300 text-neutral-600',
  };

  return (
    <span
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};

/**
 * Status Badge with dot indicator
 */
interface StatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  status: 'active' | 'inactive' | 'pending' | 'error' | 'success';
  text: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  text,
  className = '',
  ...props
}) => {
  const dotColors = {
    active: 'bg-success-500',
    inactive: 'bg-neutral-400',
    pending: 'bg-warning-500',
    error: 'bg-error-500',
    success: 'bg-success-500',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-medium text-neutral-700 bg-neutral-100 rounded-md ${className}`}
      {...props}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotColors[status]}`} />
      {text}
    </span>
  );
};

export default Badge;
