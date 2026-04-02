/**
 * Tabs Component
 * 
 * Minimal business-style tabs for organizing content.
 * White & Blue color palette.
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
    <div className={`flex border-b border-neutral-200 ${className}`}>
      {Children.map(children, (child) => {
        if (isValidElement(child)) {
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
      className={`relative py-3 px-4 text-sm font-medium transition-colors focus:outline-none ${
        isActive
          ? 'text-primary-600'
          : 'text-neutral-500 hover:text-neutral-700'
      } ${className}`}
    >
      {children}
      {isActive && (
        <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600 rounded-t-full" />
      )}
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

  return <div className={`animate-fade-in ${className}`}>{children}</div>;
};

export default Tabs;
