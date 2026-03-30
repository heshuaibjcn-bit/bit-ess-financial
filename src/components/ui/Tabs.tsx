/**
 * Tabs Component
 *
 * Simple tabs component for organizing content
 */

import React, { useState, Children, ReactElement, cloneElement, isValidElement } from 'react';

interface TabsProps {
  defaultValue?: string;
  className?: string;
  children: React.ReactNode;
}

interface TabsListProps {
  className?: string;
  children: React.ReactNode;
}

interface TabsTriggerProps {
  value: string;
  className?: string;
  children: React.ReactNode;
}

interface TabsContentProps {
  value: string;
  className?: string;
  children: React.ReactNode;
}

const TabsContext = React.createContext<{
  activeTab: string;
  setActiveTab: (value: string) => void;
}>({
  activeTab: '',
  setActiveTab: () => {},
});

export const Tabs: React.FC<TabsProps> = ({
  defaultValue = '',
  className = '',
  children,
}) => {
  const [activeTab, setActiveTab] = useState(defaultValue);

  // Enhance children to pass activeTab context
  const enhancedChildren = Children.map(children, (child) => {
    if (isValidElement(child)) {
      return cloneElement(child as ReactElement<any>, { activeTab, setActiveTab });
    }
    return child;
  });

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className={className}>{enhancedChildren}</div>
    </TabsContext.Provider>
  );
};

export const TabsList: React.FC<TabsListProps> = ({ className = '', children }) => {
  return (
    <div className={`flex space-x-8 border-b border-gray-200 ${className}`}>
      {Children.map(children, (child) => {
        if (isValidElement(child)) {
          // @ts-ignore
          return cloneElement(child, { activeTab: child.props.value });
        }
        return child;
      })}
    </div>
  );
};

export const TabsTrigger: React.FC<TabsTriggerProps> = ({
  value,
  className = '',
  children,
}) => {
  const { activeTab, setActiveTab } = React.useContext(TabsContext);
  const isActive = activeTab === value;

  return (
    <button
      onClick={() => setActiveTab(value)}
      className={`py-4 px-1 border-b-2 font-medium text-sm transition ${
        isActive
          ? 'border-blue-500 text-blue-600'
          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
      } ${className}`}
    >
      {children}
    </button>
  );
};

export const TabsContent: React.FC<TabsContentProps> = ({
  value,
  className = '',
  children,
}) => {
  const { activeTab } = React.useContext(TabsContext);

  if (activeTab !== value) {
    return null;
  }

  return <div className={className}>{children}</div>;
};
