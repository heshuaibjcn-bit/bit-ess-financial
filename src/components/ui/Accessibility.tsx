/**
 * Accessibility Utilities and Components
 *
 * Enhanced accessibility features for keyboard navigation, screen readers, and assistive technologies
 */

import React, { useRef, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';

/**
 * Live region announcer for screen readers
 */
export const useAnnouncer = () => {
  const announcerRef = useRef<HTMLDivElement | null>(null);

  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    // Create announcer element if it doesn't exist
    if (!announcerRef.current) {
      announcerRef.current = document.createElement('div');
      announcerRef.current.setAttribute('role', 'status');
      announcerRef.current.setAttribute('aria-live', priority);
      announcerRef.current.className = 'sr-only';
      document.body.appendChild(announcerRef.current);
    }

    announcerRef.current.textContent = '';
    setTimeout(() => {
      if (announcerRef.current) {
        announcerRef.current.textContent = message;
      }
    }, 100);
  }, []);

  useEffect(() => {
    return () => {
      if (announcerRef.current) {
        document.body.removeChild(announcerRef.current);
      }
    };
  }, []);

  return announce;
};

/**
 * Focus trap for modals and dialogs
 */
export const useFocusTrap = (active: boolean = true) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!active || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );

    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    // Focus first element
    firstElement.focus();

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    document.addEventListener('keydown', handleTab);
    return () => document.removeEventListener('keydown', handleTab);
  }, [active]);

  return containerRef;
};

/**
 * Skip links for keyboard navigation
 */
export const SkipLinks: React.FC<{
  links: Array<{ href: string; label: string }>;
  className?: string;
}> = ({ links, className }) => {
  return (
    <div className={cn('sr-only focus-within:not-sr-only', className)}>
      {links.map((link, index) => (
        <a
          key={index}
          href={link.href}
          className="fixed top-4 left-4 z-50 px-4 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          {link.label}
        </a>
      ))}
    </div>
  );
};

/**
 * Visually hidden (screen reader only) text
 */
export const VisuallyHidden: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => {
  return (
    <span
      className={cn(
        'sr-only',
        'position: absolute;',
        'width: 1px;',
        'height: 1px;',
        'padding: 0;',
        'margin: -1px;',
        'overflow: hidden;',
        'clip: rect(0, 0, 0, 0);',
        'white-space: nowrap;',
        'border-width: 0;',
        className
      )}
    >
      {children}
    </span>
  );
};

/**
 * Focus visible indicator for keyboard navigation
 */
export const FocusVisible: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => {
  const [isFocusVisible, setIsFocusVisible] = React.useState(false);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Tab') {
      setIsFocusVisible(true);
    }
  }, []);

  const handleMouseDown = useCallback(() => {
    setIsFocusVisible(false);
  }, []);

  return (
    <div
      onFocus={handleKeyDown}
      onMouseDown={handleMouseDown}
      className={cn('focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2', className)}
    >
      {children}
    </div>
  );
};

/**
 * Accessible button with icon support
 */
export const AccessibleButton: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    icon?: React.ReactNode;
    iconPosition?: 'left' | 'right';
    loading?: boolean;
  }
> = ({ children, icon, iconPosition = 'left', loading = false, disabled, className, ...props }) => {
  return (
    <button
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors',
        'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
        className
      )}
      aria-busy={loading}
      {...props}
    >
      {loading && (
        <svg
          className="animate-spin h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {icon && iconPosition === 'left' && <span aria-hidden="true">{icon}</span>}
      <span>{children}</span>
      {icon && iconPosition === 'right' && <span aria-hidden="true">{icon}</span>}
    </button>
  );
};

/**
 * Accessible form field with label integration
 */
export const FormField: React.FC<{
  label: string;
  error?: string;
  required?: boolean;
  description?: string;
  children: React.ReactElement;
  className?: string;
}> = ({ label, error, required, description, children, className }) => {
  const childId = React.useId();
  const errorId = `${childId}-error`;
  const descriptionId = `${childId}-description`;

  const clonedChild = React.cloneElement(children, {
    id: childId,
    'aria-invalid': error ? 'true' : 'false',
    'aria-describedby': cn(
      error && errorId,
      description && descriptionId
    ) || undefined,
  } as React.Attributes);

  return (
    <div className={cn('space-y-1', className)}>
      <label htmlFor={childId} className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1" aria-label="required">*</span>}
      </label>

      {description && (
        <p id={descriptionId} className="text-sm text-gray-500">
          {description}
        </p>
      )}

      {clonedChild}

      {error && (
        <p id={errorId} className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};

/**
 * Accessible modal with focus trap
 */
export const AccessibleModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}> = ({ isOpen, onClose, title, children, className }) => {
  const modalRef = useFocusTrap(isOpen);
  const announce = useAnnouncer();

  useEffect(() => {
    if (isOpen) {
      announce(`Modal opened: ${title}`);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, title, announce]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="flex items-center justify-center min-h-screen px-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black bg-opacity-50"
          onClick={onClose}
          aria-hidden="true"
        />

        {/* Modal */}
        <div
          ref={modalRef}
          className={cn(
            'relative bg-white rounded-lg shadow-xl max-w-md w-full p-6',
            'focus:outline-none',
            className
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 id="modal-title" className="text-xl font-semibold text-gray-900">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
              aria-label="Close modal"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div>{children}</div>
        </div>
      </div>
    </div>
  );
};

/**
 * Keyboard navigation helper
 */
export const useKeyboardNavigation = (items: Array<{ id: string; element: HTMLElement }>) => {
  const [focusedIndex, setFocusedIndex] = React.useState(0);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex((prev) => (prev + 1) % items.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex((prev) => (prev - 1 + items.length) % items.length);
        break;
      case 'Home':
        e.preventDefault();
        setFocusedIndex(0);
        break;
      case 'End':
        e.preventDefault();
        setFocusedIndex(items.length - 1);
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        items[focusedIndex]?.element.click();
        break;
    }
  }, [items, focusedIndex]);

  useEffect(() => {
    if (items[focusedIndex]) {
      items[focusedIndex].element.focus();
    }
  }, [focusedIndex, items]);

  return { focusedIndex, handleKeyDown };
};

/**
 * ARIA live region for dynamic content
 */
export const LiveRegion: React.FC<{
  children: React.ReactNode;
  priority?: 'polite' | 'assertive';
  className?: string;
}> = ({ children, priority = 'polite', className }) => {
  return (
    <div
      role="status"
      aria-live={priority}
      aria-atomic="true"
      className={cn('sr-only', className)}
    >
      {children}
    </div>
  );
};

/**
 * Accessible tabs component
 */
export const AccessibleTabs: React.FC<{
  tabs: Array<{ id: string; label: string; content: React.ReactNode }>;
  defaultTab?: string;
  className?: string;
}> = ({ tabs, defaultTab, className }) => {
  const [activeTab, setActiveTab] = React.useState(defaultTab || tabs[0]?.id);

  const announcer = useAnnouncer();

  const handleTabChange = (tabId: string, label: string) => {
    setActiveTab(tabId);
    announcer(`Tab changed to ${label}`);
  };

  return (
    <div className={className}>
      {/* Tab list */}
      <div role="tablist" className="flex border-b border-gray-200">
        {tabs.map((tab, index) => (
          <button
            key={tab.id}
            id={`tab-${tab.id}`}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`panel-${tab.id}`}
            tabIndex={activeTab === tab.id ? 0 : -1}
            onClick={() => handleTabChange(tab.id, tab.label)}
            className={cn(
              'px-4 py-2 text-sm font-medium border-b-2 -mb-px',
              activeTab === tab.id
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab panels */}
      {tabs.map((tab) => (
        <div
          key={tab.id}
          id={`panel-${tab.id}`}
          role="tabpanel"
          aria-labelledby={`tab-${tab.id}`}
          tabIndex={0}
          hidden={activeTab !== tab.id}
          className="mt-4"
        >
          {tab.content}
        </div>
      ))}
    </div>
  );
};

/**
 * Screen reader only utility class
 */
export const srOnly = 'sr-only';

/**
 * Not sr-only utility class
 */
export const notSrOnly = 'not-sr-only';
