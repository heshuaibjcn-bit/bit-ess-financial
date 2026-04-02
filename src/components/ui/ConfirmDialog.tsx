/**
 * Confirm Dialog Component
 * 
 * Minimal business-style modal dialog for confirming actions.
 * White & Blue color palette.
 */

import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
}

const variantStyles = {
  danger: {
    confirmButton: 'bg-error-600 hover:bg-error-700 text-white',
    iconBg: 'bg-error-50',
    icon: (
      <svg className="w-6 h-6 text-error-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
  },
  warning: {
    confirmButton: 'bg-warning-600 hover:bg-warning-700 text-white',
    iconBg: 'bg-warning-50',
    icon: (
      <svg className="w-6 h-6 text-warning-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
  },
  info: {
    confirmButton: 'bg-primary-600 hover:bg-primary-700 text-white',
    iconBg: 'bg-primary-50',
    icon: (
      <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
};

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmText,
  cancelText,
  variant = 'danger',
  onConfirm,
  onCancel,
}) => {
  const { t } = useTranslation();
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen) {
      cancelButtonRef.current?.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onCancel();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onCancel]);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onCancel();
    }
  };

  if (!isOpen) return null;

  const styles = variantStyles[variant];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="flex items-start p-6">
          <div className={`flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-lg ${styles.iconBg}`}>
            {styles.icon}
          </div>
          <div className="ml-4 flex-1">
            <h3 className="text-base font-semibold text-neutral-900 mb-1">
              {title}
            </h3>
            <p className="text-sm text-neutral-600">
              {message}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-neutral-50 border-t border-neutral-100">
          <button
            ref={cancelButtonRef}
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors"
          >
            {cancelText || t('common.cancel', { defaultValue: '取消' })}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${styles.confirmButton}`}
          >
            {confirmText || t('common.confirm', { defaultValue: '确认' })}
          </button>
        </div>
      </div>
    </div>
  );
};

export const useConfirmDialog = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [config, setConfig] = React.useState<Omit<ConfirmDialogProps, 'isOpen' | 'onConfirm' | 'onCancel'>>({
    title: '',
    message: '',
    variant: 'danger',
  });

  const promiseRef = React.useRef<{
    resolve: (confirmed: boolean) => void;
    reject: () => void;
  } | null>(null);

  const confirm = (
    title: string,
    message: string,
    options?: Partial<Pick<ConfirmDialogProps, 'confirmText' | 'cancelText' | 'variant'>>
  ): Promise<boolean> => {
    return new Promise((resolve, reject) => {
      setConfig({
        title,
        message,
        confirmText: options?.confirmText,
        cancelText: options?.cancelText,
        variant: options?.variant || 'danger',
      });
      setIsOpen(true);
      promiseRef.current = { resolve, reject };
    });
  };

  const handleConfirm = () => {
    promiseRef.current?.resolve(true);
    setIsOpen(false);
  };

  const handleCancel = () => {
    promiseRef.current?.resolve(false);
    setIsOpen(false);
  };

  const Dialog = () => (
    <ConfirmDialog
      isOpen={isOpen}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
      {...config}
    />
  );

  return { confirm, Dialog };
};

export default ConfirmDialog;
