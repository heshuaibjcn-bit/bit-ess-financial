/**
 * Developer Tools Panel
 *
 * Comprehensive development tools with:
 * - State inspector
 * - Performance monitor
 * - Error logs viewer
 * - Network requests inspector
 * - Console output
 * - Component tree viewer
 */

import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { errorHandler, getErrorStats } from '@/services/error/ErrorHandling';
import { performanceMonitor, getPerformanceSummary } from '@/services/performance/PerformanceMonitor';

/**
 * DevTools panel component
 */
export const DevToolsPanel: React.FC<{
  isOpen: boolean;
  onClose: () => void;
}> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'state' | 'performance' | 'errors' | 'network' | 'console'>('state');
  const [position, setPosition] = useState<'right' | 'left' | 'bottom'>('right');
  const [isMinimized, setIsMinimized] = useState(false);

  if (!isOpen) return null;

  return (
    <div
      className={cn(
        'fixed z-[9999] bg-white shadow-2xl border border-gray-200',
        position === 'right' && 'right-0 top-0 h-full w-96',
        position === 'left' && 'left-0 top-0 h-full w-96',
        position === 'bottom' && 'bottom-0 left-0 right-0 h-96'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between bg-gray-800 text-white px-4 py-2">
        <div className="flex items-center gap-2">
          <span className="font-semibold">DevTools</span>
          <span className="text-xs bg-gray-700 px-2 py-0.5 rounded">ESS Financial</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1 hover:bg-gray-700 rounded"
            title={isMinimized ? 'Expand' : 'Minimize'}
          >
            {isMinimized ? '□' : '−'}
          </button>

          <button
            onClick={() => {
              const positions: Array<'right' | 'left' | 'bottom'> = ['right', 'left', 'bottom'];
              const currentIndex = positions.indexOf(position);
              setPosition(positions[(currentIndex + 1) % positions.length]);
            }}
            className="p-1 hover:bg-gray-700 rounded"
            title="Change position"
          >
            ⟳
          </button>

          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-700 rounded"
            title="Close"
          >
            ×
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Tabs */}
          <div className="flex bg-gray-100 border-b border-gray-200">
            {[
              { id: 'state' as const, label: 'State' },
              { id: 'performance' as const, label: 'Performance' },
              { id: 'errors' as const, label: 'Errors' },
              { id: 'network' as const, label: 'Network' },
              { id: 'console' as const, label: 'Console' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex-1 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 bg-white'
                    : 'border-transparent text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="h-[calc(100%-120px)] overflow-auto">
            {activeTab === 'state' && <StateInspector />}
            {activeTab === 'performance' && <PerformanceMonitorPanel />}
            {activeTab === 'errors' && <ErrorLogPanel />}
            {activeTab === 'network' && <NetworkInspector />}
            {activeTab === 'console' && <ConsolePanel />}
          </div>
        </>
      )}
    </div>
  );
};

/**
 * State inspector component
 */
const StateInspector: React.FC = () => {
  const [stores, setStores] = useState<Record<string, any>>({});

  useEffect(() => {
    // Try to access various stores
    const importStores = async () => {
      try {
        const { useCloudProjectStore } = await import('@/stores/cloudProjectStore');
        const projectStore = useCloudProjectStore.getState();

        const { useCalculationStore } = await import('@/stores/calculationStore');
        const calcStore = useCalculationStore.getState();

        setStores({
          projectStore: {
            projects: projectStore.projects.length,
            filteredProjects: projectStore.filteredProjects.length,
            currentProject: projectStore.currentProject?.name || 'None',
            filters: projectStore.filters,
          },
          calcStore: {
            hasResult: !!calcStore.result,
            loading: calcStore.loading,
            error: calcStore.error,
            isValid: calcStore.isValid,
          },
        });
      } catch (error) {
        console.error('Failed to load stores:', error);
      }
    };

    importStores();
    const interval = setInterval(importStores, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Application State</h3>
      <pre className="text-xs bg-gray-50 p-3 rounded overflow-auto max-h-96">
        {JSON.stringify(stores, null, 2)}
      </pre>
    </div>
  );
};

/**
 * Performance monitor panel
 */
const PerformanceMonitorPanel: React.FC = () => {
  const [summary, setSummary] = useState(getPerformanceSummary());
  const [metrics, setMetrics] = useState(performanceMonitor.getMetrics());

  useEffect(() => {
    const interval = setInterval(() => {
      setSummary(getPerformanceSummary());
      setMetrics(performanceMonitor.getMetrics({ limit: 50 }));
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const getRatingColor = (rating: string) => {
    switch (rating) {
      case 'good':
        return 'text-green-600';
      case 'needs-improvement':
        return 'text-yellow-600';
      case 'poor':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const formatValue = (value: number, type: string) => {
    if (type.includes('memory')) {
      return `${(value / 1024 / 1024).toFixed(2)} MB`;
    }
    if (value > 1000) {
      return `${(value / 1000).toFixed(2)}s`;
    }
    return `${Math.round(value)}ms`;
  };

  return (
    <div className="p-4">
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-gray-700">Performance Summary</h3>
          <span className={cn('text-xs font-medium', getRatingColor(summary.overallRating))}>
            {summary.overallRating.toUpperCase()}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {Object.entries(summary.webVitals).map(([key, metric]) => (
            <div key={key} className="bg-gray-50 p-2 rounded">
              <div className="text-xs text-gray-600 mb-1">{key}</div>
              <div className={cn('text-sm font-semibold', getRatingColor(metric.rating))}>
                {formatValue(metric.value, key)}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Recent Metrics</h3>
        <div className="space-y-1 max-h-64 overflow-auto">
          {metrics.slice(-20).reverse().map((metric, index) => (
            <div key={index} className="text-xs bg-gray-50 p-2 rounded">
              <div className="flex items-center justify-between">
                <span className="font-medium">{metric.type}</span>
                <span className={cn('font-semibold', getRatingColor(metric.rating))}>
                  {formatValue(metric.value, metric.type)}
                </span>
              </div>
              {metric.metadata && (
                <div className="text-gray-500 mt-1">
                  {JSON.stringify(metric.metadata, null, 2)}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/**
 * Error log panel
 */
const ErrorLogPanel: React.FC = () => {
  const [stats, setStats] = useState(getErrorStats());
  const [logs, setLogs] = useState(errorHandler.getErrorLogs({ limit: 50 }));

  useEffect(() => {
    const interval = setInterval(() => {
      setStats(getErrorStats());
      setLogs(errorHandler.getErrorLogs({ limit: 50 }));
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low':
        return 'text-blue-600 bg-blue-50';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50';
      case 'high':
        return 'text-orange-600 bg-orange-50';
      case 'critical':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="p-4">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Error Statistics</h3>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-gray-50 p-2 rounded">
            <span className="text-gray-600">Total: </span>
            <span className="font-semibold">{stats.total}</span>
          </div>
          <div className="bg-gray-50 p-2 rounded">
            <span className="text-gray-600">Unresolved: </span>
            <span className="font-semibold text-red-600">{stats.unresolved}</span>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Recent Errors</h3>
        <div className="space-y-2 max-h-64 overflow-auto">
          {logs.length === 0 ? (
            <div className="text-sm text-gray-500 text-center py-4">No errors logged</div>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="border border-gray-200 rounded p-2">
                <div className="flex items-start justify-between mb-1">
                  <span className={cn('text-xs px-2 py-0.5 rounded', getSeverityColor(log.error.severity))}>
                    {log.error.severity}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <div className="text-sm font-medium text-gray-800">{log.error.message}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {log.error.code} • {log.error.category}
                </div>
                {log.resolved && (
                  <div className="text-xs text-green-600 mt-1">✓ Resolved</div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Network inspector
 */
const NetworkInspector: React.FC = () => {
  const [requests, setRequests] = useState<PerformanceResourceTiming[]>([]);

  useEffect(() => {
    const updateRequests = () => {
      const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      setRequests(resources.slice(-50));
    };

    updateRequests();
    const interval = setInterval(updateRequests, 2000);

    return () => clearInterval(interval);
  }, []);

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
  };

  return (
    <div className="p-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Network Requests</h3>
      <div className="space-y-1 max-h-96 overflow-auto">
        {requests.map((req, index) => (
          <div key={index} className="text-xs border-b border-gray-100 py-2">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-800 truncate">{req.name}</div>
                <div className="text-gray-500">{req.initiatorType}</div>
              </div>
              <div className="text-right ml-2">
                <div className="font-semibold text-gray-700">{formatDuration(req.duration)}</div>
                <div className="text-gray-500">{formatSize(req.transferSize)}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Console panel
 */
const ConsolePanel: React.FC = () => {
  const [logs, setLogs] = useState<Array<{ type: string; message: string; timestamp: Date }>>([]);

  useEffect(() => {
    const originalLog = console.log;
    const originalWarn = console.warn;
    const originalError = console.error;

    const addLog = (type: string, message: any) => {
      const logMessage = typeof message === 'object' ? JSON.stringify(message) : String(message);
      setLogs((prev) => [
        ...prev,
        {
          type,
          message: logMessage,
          timestamp: new Date(),
        },
      ].slice(-100));
    };

    console.log = (...args) => {
      originalLog(...args);
      addLog('log', args.join(' '));
    };

    console.warn = (...args) => {
      originalWarn(...args);
      addLog('warn', args.join(' '));
    };

    console.error = (...args) => {
      originalError(...args);
      addLog('error', args.join(' '));
    };

    return () => {
      console.log = originalLog;
      console.warn = originalWarn;
      console.error = originalError;
    };
  }, []);

  const getLogColor = (type: string) => {
    switch (type) {
      case 'log':
        return 'text-gray-600';
      case 'warn':
        return 'text-yellow-600';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700">Console</h3>
        <button
          onClick={() => setLogs([])}
          className="text-xs text-blue-600 hover:text-blue-800"
        >
          Clear
        </button>
      </div>

      <div className="space-y-1 max-h-96 overflow-auto font-mono text-xs">
        {logs.map((log, index) => (
          <div key={index} className={cn('border-b border-gray-100 py-1', getLogColor(log.type))}>
            <span className="text-gray-400 mr-2">
              {log.timestamp.toLocaleTimeString()}
            </span>
            <span>[{log.type}]</span>
            <span className="ml-2">{log.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * DevTools trigger button
 */
export const DevToolsTrigger: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 z-[9998] bg-gray-800 text-white p-3 rounded-full shadow-lg hover:bg-gray-700 transition-colors"
        title="Toggle DevTools"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>

      <DevToolsPanel isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
};
