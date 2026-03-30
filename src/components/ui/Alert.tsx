/**
 * Alert Component
 *
 * Simple alert component for displaying messages
 */

import React from 'react';

interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'destructive';
}

interface AlertDescriptionProps extends React.HTMLAttributes<HTMLDivElement> {}

export const Alert: React.FC<AlertProps> = ({
  children,
  className = '',
  variant = 'default',
  ...props
}) => {
  const baseStyles = 'rounded-lg p-4 border';

  const variantStyles = {
    default: 'bg-blue-50 border-blue-200',
    destructive: 'bg-red-50 border-red-200',
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

export const AlertDescription: React.FC<AlertDescriptionProps> = ({
  className = '',
  children,
  ...props
}) => {
  return (
    <div className={`text-sm ${className}`} {...props}>
      {children}
    </div>
  );
};
