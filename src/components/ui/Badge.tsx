/**
 * Badge Component
 *
 * Simple badge component for displaying status and labels
 */

import React from 'react';

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  className = '',
  variant = 'default',
  ...props
}) => {
  const baseStyles = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';

  const variantStyles = {
    default: 'bg-gray-100 text-gray-800 hover:bg-gray-200',
    secondary: 'bg-blue-100 text-blue-800 hover:bg-blue-200',
    destructive: 'bg-red-100 text-red-800 hover:bg-red-200',
    outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50',
    success: 'bg-green-100 text-green-800 hover:bg-green-200',
    warning: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
  };

  return (
    <div
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
