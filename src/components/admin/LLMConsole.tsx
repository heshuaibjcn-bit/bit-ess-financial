/**
 * LLM智能体控制台组件
 *
 * 实时显示AI智能体的日志、状态和操作信息
 */

import React, { useEffect, useRef, useState } from 'react';
import { Activity, CheckCircle, AlertCircle, XCircle, Info, Trash2, Filter, ChevronDown, ChevronUp, Code, ChevronRight, ChevronDown as ChevronDownIcon, Bug } from 'lucide-react';

export type LogLevel = 'info' | 'success' | 'warning' | 'error' | 'debug';

export interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  message: string;
  details?: string;
  source: string;
  // 调试信息
  debugData?: {
    request?: any;
    response?: any;
    error?: any;
    duration?: number;
    stack?: string;
  };
  // 是否展开
  expanded?: boolean;
}

interface LLMConsoleProps {
  logs: LogEntry[];
  onClear?: () => void;
  isVisible?: boolean;
}

/**
 * 日志图标组件
 */
function LogIcon({ level }: { level: LogLevel }) {
  const icons = {
    info: <Info className="w-4 h-4 text-blue-500" />,
    success: <CheckCircle className="w-4 h-4 text-green-500" />,
    warning: <AlertCircle className="w-4 h-4 text-yellow-500" />,
    error: <XCircle className="w-4 h-4 text-red-500" />,
    debug: <Bug className="w-4 h-4 text-gray-500" />,
  };

  return icons[level] || icons.info;
}

/**
 * 日志条目组件
 */
function LogEntry({ entry, onToggle }: { entry: LogEntry; onToggle: (id: string) => void }) {
  const bgColor = {
    info: 'bg-blue-50 border-blue-200',
    success: 'bg-green-50 border-green-200',
    warning: 'bg-yellow-50 border-yellow-200',
    error: 'bg-red-50 border-red-200',
    debug: 'bg-gray-100 border-gray-300',
  };

  const textColor = {
    info: 'text-blue-800',
    success: 'text-green-800',
    warning: 'text-yellow-800',
    error: 'text-red-800',
    debug: 'text-gray-800',
  };

  const hasDebugData = entry.debugData && (
    entry.debugData.request ||
    entry.debugData.response ||
    entry.debugData.error ||
    entry.debugData.stack
  );

  return (
    <div className={`border rounded ${bgColor[entry.level]} mb-1 text-sm`}>
      {/* 主要日志内容 */}
      <div
        className="flex items-start gap-2 p-2 cursor-pointer hover:opacity-80"
        onClick={() => hasDebugData && onToggle(entry.id)}
      >
        <div className="mt-0.5 flex-shrink-0">
          <LogIcon level={entry.level} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-xs text-gray-500 font-mono">{entry.timestamp}</span>
            <span className="text-xs text-gray-400">•</span>
            <span className="text-xs text-gray-600">{entry.source}</span>
            {entry.debugData?.duration && (
              <>
                <span className="text-xs text-gray-400">•</span>
                <span className="text-xs text-gray-600">{entry.debugData.duration}ms</span>
              </>
            )}
            {hasDebugData && (
              <>
                <span className="text-xs text-gray-400">•</span>
                <ChevronRight
                  className={`w-3 h-3 text-gray-400 transition-transform ${
                    entry.expanded ? 'rotate-90' : ''
                  }`}
                />
              </>
            )}
          </div>
          <p className={`font-medium ${textColor[entry.level]}`}>
            {entry.message}
          </p>
          {entry.details && (
            <p className="text-xs text-gray-600 mt-1 font-mono bg-white/50 p-1 rounded">
              {entry.details}
            </p>
          )}
        </div>
      </div>

      {/* 调试信息（可展开） */}
      {hasDebugData && entry.expanded && (
        <div className="border-t border-gray-300 bg-white/80 p-2 space-y-2">
          {/* 请求数据 */}
          {entry.debugData.request && (
            <div>
              <div className="text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
                <Code className="w-3 h-3" />
                请求
              </div>
              <pre className="text-xs bg-gray-900 text-green-400 p-2 rounded overflow-x-auto">
                {JSON.stringify(entry.debugData.request, null, 2)}
              </pre>
            </div>
          )}

          {/* 响应数据 */}
          {entry.debugData.response && (
            <div>
              <div className="text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
                <Code className="w-3 h-3" />
                响应
              </div>
              <pre className="text-xs bg-gray-900 text-blue-400 p-2 rounded overflow-x-auto">
                {JSON.stringify(entry.debugData.response, null, 2)}
              </pre>
            </div>
          )}

          {/* 错误信息 */}
          {entry.debugData.error && (
            <div>
              <div className="text-xs font-semibold text-red-700 mb-1 flex items-center gap-1">
                <XCircle className="w-3 h-3" />
                错误
              </div>
              <div className="text-xs bg-red-50 text-red-700 p-2 rounded">
                <p className="font-mono">{entry.debugData.error}</p>
                {entry.debugData.stack && (
                  <pre className="mt-1 text-xs bg-red-100 p-1 rounded overflow-x-auto">
                    {entry.debugData.stack}
                  </pre>
                )}
              </div>
            </div>
          )}

          {/* 性能信息 */}
          {entry.debugData.duration && (
            <div className="text-xs text-gray-600">
              ⏱️ 耗时: {entry.debugData.duration}ms
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * LLM控制台组件
 */
export function LLMConsole({ logs, onClear, isVisible = true }: LLMConsoleProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [filter, setFilter] = useState<LogLevel | 'all' | 'debug'>('all');
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());
  const [isExpanded, setIsExpanded] = useState(true);

  // 自动滚动到底部
  useEffect(() => {
    if (containerRef.current && isExpanded) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logs, isExpanded]);

  // 过滤日志
  const filteredLogs = filter === 'all'
    ? logs
    : logs.filter(log => log.level === filter);

  // 切换日志展开状态
  const toggleLog = (id: string) => {
    setExpandedLogs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // 统计各类型日志数量
  const counts = {
    all: logs.length,
    debug: logs.filter(l => l.level === 'debug').length,
    info: logs.filter(l => l.level === 'info').length,
    success: logs.filter(l => l.level === 'success').length,
    warning: logs.filter(l => l.level === 'warning').length,
    error: logs.filter(l => l.level === 'error').length,
  };

  // 最新日志级别
  const latestLevel = logs.length > 0 ? logs[logs.length - 1].level : 'info';
  const isActive = logs.length > 0 && (Date.now() - new Date(logs[logs.length - 1].timestamp).getTime() < 5000);

  if (!isVisible) {
    return null;
  }

  return (
    <div className="flex flex-col h-full bg-gray-900 text-white">
      {/* 标题栏 */}
      <div className="flex-shrink-0 bg-gray-800 border-b border-gray-700 p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-400 animate-pulse' : 'bg-gray-500'}`} />
            <h3 className="font-semibold text-sm">AI智能体控制台</h3>
            <span className="text-xs text-gray-400">
              {logs.length} 条日志
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 hover:bg-gray-700 rounded transition"
              title={isExpanded ? '收起' : '展开'}
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronUp className="w-4 h-4" />
              )}
            </button>
            {onClear && logs.length > 0 && (
              <button
                onClick={onClear}
                className="p-1 hover:bg-gray-700 rounded transition"
                title="清除日志"
              >
                <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-400" />
              </button>
            )}
          </div>
        </div>

        {/* 过滤器 */}
        <div className="flex items-center gap-1 flex-wrap">
          <Filter className="w-3 h-3 text-gray-500" />
          {(['all', 'debug', 'info', 'success', 'warning', 'error'] as const).map((level) => (
            <button
              key={level}
              onClick={() => setFilter(level)}
              className={`px-2 py-0.5 text-xs rounded transition ${
                filter === level
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {level === 'all' ? '全部' : level === 'debug' ? '调试' : level}
              <span className="ml-1 text-gray-400">({counts[level]})</span>
            </button>
          ))}
        </div>
      </div>

      {/* 日志内容区域 */}
      {isExpanded && (
        <div
          ref={containerRef}
          className="flex-1 overflow-y-auto p-3 space-y-1 font-mono text-xs"
          style={{ maxHeight: 'calc(100vh - 200px)' }}
        >
          {filteredLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <Activity className="w-8 h-8 mb-2 animate-pulse" />
              <p>等待智能体活动...</p>
              <p className="text-xs mt-1">点击"检查更新"开始</p>
            </div>
          ) : (
            filteredLogs.map((log) => (
              <LogEntry
                key={log.id}
                entry={{ ...log, expanded: expandedLogs.has(log.id) }}
                onToggle={toggleLog}
              />
            ))
          )}
        </div>
      )}

      {/* 状态栏 */}
      {isExpanded && (
        <div className="flex-shrink-0 bg-gray-800 border-t border-gray-700 p-2">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="text-gray-400">最新状态:</span>
              <span className={`font-medium ${
                latestLevel === 'error' ? 'text-red-400' :
                latestLevel === 'warning' ? 'text-yellow-400' :
                latestLevel === 'success' ? 'text-green-400' :
                'text-blue-400'
              }`}>
                {latestLevel === 'info' ? '运行中' :
                 latestLevel === 'success' ? '成功' :
                 latestLevel === 'warning' ? '警告' :
                 '错误'}
              </span>
            </div>
            <span className="text-gray-500">
              显示 {filteredLogs.length} / {logs.length} 条
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * 日志收集器Hook
 */
export function useLogCollector() {
  const [logs, setLogs] = useState<LogEntry[]>([]);

  const addLog = (
    level: LogLevel,
    message: string,
    details?: string,
    source = 'System',
    debugData?: LogEntry['debugData']
  ) => {
    const entry: LogEntry = {
      id: `${Date.now()}-${Math.random()}`,
      timestamp: new Date().toLocaleTimeString('zh-CN', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
      level,
      message,
      details,
      source,
      debugData,
    };

    setLogs(prev => [...prev, entry]);

    // 同时输出到浏览器控制台
    const consoleMethod = {
      info: 'log',
      success: 'log',
      warning: 'warn',
      error: 'error',
      debug: 'log',
    }[level];

    console[consoleMethod as keyof Console](
      `[${source}] ${message}`,
      details || '',
      debugData || ''
    );
  };

  const clearLogs = () => {
    setLogs([]);
  };

  return {
    logs,
    addLog,
    clearLogs,
    info: (message: string, details?: string, source?: string, debugData?: LogEntry['debugData']) =>
      addLog('info', message, details, source, debugData),
    success: (message: string, details?: string, source?: string, debugData?: LogEntry['debugData']) =>
      addLog('success', message, details, source, debugData),
    warning: (message: string, details?: string, source?: string, debugData?: LogEntry['debugData']) =>
      addLog('warning', message, details, source, debugData),
    error: (message: string, details?: string, source?: string, debugData?: LogEntry['debugData']) =>
      addLog('error', message, details, source, debugData),
    debug: (message: string, details?: string, source?: string, debugData?: LogEntry['debugData']) =>
      addLog('debug', message, details, source, debugData),
  };
}
