/**
 * Enhanced Form Feedback
 *
 * Real-time form validation with smooth animations and clear feedback
 */

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

/**
 * Validation status types
 */
export type ValidationStatus = 'idle' | 'validating' | 'success' | 'error';

/**
 * Form feedback component
 */
export const FormFeedback: React.FC<{
  status: ValidationStatus;
  message?: string;
  className?: string;
}> = ({ status, message, className }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (status !== 'idle') {
      setVisible(true);
    }
  }, [status]);

  if (status === 'idle' || !visible) {
    return null;
  }

  const statusConfig = {
    validating: {
      icon: (
        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      ),
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-800',
      borderColor: 'border-blue-200',
    },
    success: {
      icon: (
        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clipRule="evenodd"
          />
        </svg>
      ),
      bgColor: 'bg-green-50',
      textColor: 'text-green-800',
      borderColor: 'border-green-200',
    },
    error: {
      icon: (
        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
            clipRule="evenodd"
          />
        </svg>
      ),
      bgColor: 'bg-red-50',
      textColor: 'text-red-800',
      borderColor: 'border-red-200',
    },
  };

  const config = statusConfig[status];

  return (
    <div
      className={cn(
        'flex items-start gap-2 p-3 rounded-lg border transition-all duration-200',
        config.bgColor,
        config.textColor,
        config.borderColor,
        className
      )}
      role="alert"
      aria-live="polite"
    >
      <span className="flex-shrink-0 mt-0.5">{config.icon}</span>
      {message && <p className="text-sm font-medium">{message}</p>}
    </div>
  );
};

/**
 * Field-level validation feedback
 */
export const FieldFeedback: React.FC<{
  status: ValidationStatus;
  message?: string;
  className?: string;
}> = ({ status, message, className }) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (status !== 'idle') {
      const timer = setTimeout(() => setShow(true), 100);
      return () => clearTimeout(timer);
    } else {
      setShow(false);
    }
  }, [status]);

  if (!show || !message) {
    return null;
  }

  const errorClasses = status === 'error'
    ? 'text-red-600'
    : status === 'success'
    ? 'text-green-600'
    : 'text-blue-600';

  return (
    <p
      className={cn(
        'text-sm mt-1 transition-opacity duration-200',
        show ? 'opacity-100' : 'opacity-0',
        errorClasses,
        className
      )}
      role="alert"
      aria-live="polite"
    >
      {message}
    </p>
  );
};

/**
 * Debounced validation hook
 */
export function useDebouncedValidation<T>(
  value: T,
  validate: (value: T) => Promise<boolean>,
  delay: number = 500
): { status: ValidationStatus; message?: string } {
  const [status, setStatus] = useState<ValidationStatus>('idle');
  const [message, setMessage] = useState<string>();

  useEffect(() => {
    setStatus('idle');
    setMessage(undefined);

    if (!value) {
      return;
    }

    const timer = setTimeout(async () => {
      setStatus('validating');

      try {
        const isValid = await validate(value);
        setStatus(isValid ? 'success' : 'error');
        setMessage(isValid ? 'Valid' : 'Invalid');
      } catch (error) {
        setStatus('error');
        setMessage(error instanceof Error ? error.message : 'Validation failed');
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [value, validate, delay]);

  return { status, message };
}

/**
 * Form progress indicator
 */
export const FormProgress: React.FC<{
  steps: Array<{ name: string; completed: boolean; current: boolean }>;
  className?: string;
}> = ({ steps, className }) => {
  return (
    <div className={cn('w-full', className)}>
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <React.Fragment key={step.name}>
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'flex items-center justify-center w-10 h-10 rounded-full border-2 font-medium transition-colors',
                  step.completed
                    ? 'bg-green-500 border-green-500 text-white'
                    : step.current
                    ? 'bg-blue-500 border-blue-500 text-white'
                    : 'bg-white border-gray-300 text-gray-500'
                )}
              >
                {step.completed ? (
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  <span>{index + 1}</span>
                )}
              </div>
              <span
                className={cn(
                  'mt-2 text-sm font-medium',
                  step.current ? 'text-blue-600' : 'text-gray-500'
                )}
              >
                {step.name}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  'flex-1 h-1 mx-4',
                  step.completed ? 'bg-green-500' : 'bg-gray-200'
                )}
              />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

/**
 * Character counter for text inputs
 */
export const CharacterCounter: React.FC<{
  current: number;
  max: number;
  className?: string;
}> = ({ current, max, className }) => {
  const percentage = (current / max) * 100;
  const isNearLimit = percentage > 80;
  const isAtLimit = current >= max;

  return (
    <div className={cn('text-xs text-right mt-1', className)}>
      <span
        className={cn(
          isAtLimit
            ? 'text-red-600 font-medium'
            : isNearLimit
            ? 'text-yellow-600'
            : 'text-gray-500'
        )}
      >
        {current} / {max}
      </span>
    </div>
  );
};

/**
 * Password strength indicator
 */
export const PasswordStrength: React.FC<{
  password: string;
  className?: string;
}> = ({ password, className }) => {
  const [strength, setStrength] = useState<{
    score: number;
    label: string;
    color: string;
  }>({ score: 0, label: 'Weak', color: 'bg-red-500' });

  useEffect(() => {
    if (!password) {
      setStrength({ score: 0, label: 'Weak', color: 'bg-red-500' });
      return;
    }

    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;

    const strengths = [
      { score: 1, label: 'Weak', color: 'bg-red-500' },
      { score: 2, label: 'Fair', color: 'bg-orange-500' },
      { score: 3, label: 'Good', color: 'bg-yellow-500' },
      { score: 4, label: 'Strong', color: 'bg-green-500' },
      { score: 5, label: 'Very Strong', color: 'bg-green-600' },
    ];

    const strengthLevel = strengths[Math.min(score - 1, strengths.length - 1)] || strengths[0];
    setStrength(strengthLevel);
  }, [password]);

  return (
    <div className={cn('mt-2', className)}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-gray-600">Password strength</span>
        <span className="text-xs font-medium" style={{ color: strength.color.replace('bg-', '#') }}>
          {strength.label}
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={cn('h-2 rounded-full transition-all duration-300', strength.color)}
          style={{ width: `${(strength.score / 5) * 100}%` }}
        />
      </div>
    </div>
  );
};

/**
 * Auto-save indicator
 */
export const AutoSaveIndicator: React.FC<{
  status: 'idle' | 'saving' | 'saved' | 'error';
  className?: string;
}> = ({ status, className }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (status !== 'idle') {
      setVisible(true);
      const timer = setTimeout(() => setVisible(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [status]);

  if (!visible) {
    return null;
  }

  const statusConfig = {
    saving: {
      icon: <LoadingSpinner size="sm" />,
      text: 'Saving...',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-800',
    },
    saved: {
      icon: (
        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clipRule="evenodd"
          />
        </svg>
      ),
      text: 'Saved',
      bgColor: 'bg-green-50',
      textColor: 'text-green-800',
    },
    error: {
      icon: (
        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
            clipRule="evenodd"
          />
        </svg>
      ),
      text: 'Error saving',
      bgColor: 'bg-red-50',
      textColor: 'text-red-800',
    },
  };

  const config = statusConfig[status];

  return (
    <div
      className={cn(
        'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200',
        config.bgColor,
        config.textColor,
        className
      )}
      role="status"
      aria-live="polite"
    >
      {config.icon}
      <span>{config.text}</span>
    </div>
  );
};
