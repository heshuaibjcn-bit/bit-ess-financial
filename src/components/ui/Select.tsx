/**
 * Select Component
 *
 * Simple select dropdown component
 */

import React, { useState, useRef, useEffect, Children, ReactElement } from 'react';

interface SelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  className?: string;
  children: React.ReactNode;
  placeholder?: string;
}

interface SelectTriggerProps {
  className?: string;
  children: React.ReactNode;
}

interface SelectContentProps {
  className?: string;
  children: React.ReactNode;
}

interface SelectItemProps {
  value: string;
  children: React.ReactNode;
}

interface SelectValueProps {
  placeholder?: string;
}

export const Select: React.FC<SelectProps> = ({
  value,
  onValueChange,
  className = '',
  children,
  placeholder = '请选择',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState(value || '');
  const selectRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle value change
  const handleValueChange = (newValue: string) => {
    setSelectedValue(newValue);
    onValueChange?.(newValue);
    setIsOpen(false);
  };

  // Find the display text for the selected value
  const findDisplayText = () => {
    let displayText = placeholder;
    Children.forEach(children, (child) => {
      if (isValidElement(child) && child.props.value === selectedValue) {
        displayText = Children.toArray(child.props.children)[0] as string;
      }
    });
    return displayText;
  };

  return (
    <div ref={selectRef} className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-left bg-white"
      >
        <span className="block truncate">{findDisplayText()}</span>
        <span className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
          {isOpen ? '▲' : '▼'}
        </span>
      </button>

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
          {Children.map(children, (child) => {
            if (isValidElement(child) && child.type === SelectItem) {
              return cloneElement(child, {
                onClick: () => handleValueChange(child.props.value),
                isSelected: child.props.value === selectedValue,
              });
            }
            return child;
          })}
        </div>
      )}
    </div>
  );
};

export const SelectTrigger: React.FC<SelectTriggerProps> = ({ className = '', children }) => {
  return <div className={className}>{children}</div>;
};

export const SelectContent: React.FC<SelectContentProps> = ({ className = '', children }) => {
  return <div className={className}>{children}</div>;
};

export const SelectItem: React.FC<SelectItemProps & {
  onClick?: () => void;
  isSelected?: boolean;
}> = ({ value, children, onClick, isSelected = false }) => {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 transition ${
        isSelected ? 'bg-blue-50 text-blue-700' : ''
      }`}
    >
      {children}
    </button>
  );
};

export const SelectValue: React.FC<SelectValueProps> = ({ placeholder }) => {
  return <span className="text-gray-500">{placeholder}</span>;
};

// Import cloneElement
const { cloneElement } = React;
