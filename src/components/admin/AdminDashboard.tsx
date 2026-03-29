/**
 * Admin Dashboard - NanoClaw Agent Management Interface
 *
 * Comprehensive dashboard for managing all AI agents:
 * - Monitor agent status and tasks
 * - Schedule automated tasks
 * - View and manage reports
 * - Configure system settings
 * - Manage tariff data updates
 */

import React, { useState, useEffect } from 'react';
import {
  getAgentManager,
} from '../../services/agents';
import { TariffUpdateAgent } from '../../services/agents/TariffUpdateAgent';
import { getTariffService } from '../../services/tariffDataService';
import { getCommunicationLogger, type CommunicationLog } from '../../services/agents/AgentCommunicationLogger';
import { AgentMetricsDashboard } from './AgentMetricsDashboard';
import { AdminSettings } from './AdminSettings';
import { getSettingsManager } from '@/config/Settings';
import type { AgentTask } from '../../services/agents';

type AgentType =
  | 'policy'
  | 'tariff'
  | 'diligence'
  | 'sentiment'
  | 'technical'
  | 'financial'
  | 'report';

interface AgentConfig {
  id: AgentType;
  name: string;
  description: string;
  icon: string;
  enabled: boolean;
  lastRun?: string;
  status: 'idle' | 'running' | 'completed' | 'error';
}

const AGENTS: AgentConfig[] = [
  {
    id: 'policy',
    name: '政策更新智能体',
    description: '监控政府网站，自动更新储能政策数据库',
    icon: '📜',
    enabled: true,
    status: 'idle',
  },
  {
    id: 'tariff',
    name: '电价更新智能体',
    description: '追踪31省份电价变化，生成对比报告',
    icon: '⚡',
    enabled: true,
    status: 'idle',
  },
  {
    id: 'diligence',
    name: '尽职调查智能体',
    description: '业主背景调查、信用分析、风险评估',
    icon: '🔍',
    enabled: true,
    status: 'idle',
  },
  {
    id: 'sentiment',
    name: '舆情分析智能体',
    description: '监测公司舆情，分析公众情绪，预警风险',
    icon: '📊',
    enabled: true,
    status: 'idle',
  },
  {
    id: 'technical',
    name: '技术可行性智能体',
    description: '评估场地条件、电网容量、技术约束',
    icon: '🏗️',
    enabled: true,
    status: 'idle',
  },
  {
    id: 'financial',
    name: '财务可行性智能体',
    description: '投资回报分析、现金流预测、风险评估',
    icon: '💰',
    enabled: true,
    status: 'idle',
  },
  {
    id: 'report',
    name: '报告生成智能体',
    description: '整合所有评估结果，生成综合报告',
    icon: '📋',
    enabled: true,
    status: 'idle',
  },
];

export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'agents' | 'tasks' | 'reports' | 'settings' | 'console' | 'metrics'>('overview');
  const [agents, setAgents] = useState<AgentConfig[]>(AGENTS);
  const [tasks, setTasks] = useState<AgentTask[]>([]);

  const settingsManager = getSettingsManager();

  // Helper function to check if API is configured
  const isApiConfigured = () => settingsManager.isGLMConfigured();

  // Tariff update states
  const [isUpdatingTariff, setIsUpdatingTariff] = useState(false);
  const [tariffUpdateSteps, setTariffUpdateSteps] = useState<any[]>([]);
  const [tariffUpdateResult, setTariffUpdateResult] = useState<any>(null);
  const [showTariffProcess, setShowTariffProcess] = useState(false);

  // Tariff auto-update configuration
  const [autoUpdateEnabled, setAutoUpdateEnabled] = useState(false);
  const [updateInterval, setUpdateInterval] = useState<number>(7); // days
  const [nextUpdateTime, setNextUpdateTime] = useState<Date | null>(null);
  const [showScheduleConfig, setShowScheduleConfig] = useState(false);
  const [timeUntilNextUpdate, setTimeUntilNextUpdate] = useState<string>('');

  // Communication console states
  const [commLogs, setCommLogs] = useState<CommunicationLog[]>([]);
  const [consoleFilter, setConsoleFilter] = useState<{
    agentType?: string;
    direction?: 'request' | 'response' | 'error';
    searchTerm: string;
  }>({
    searchTerm: '',
  });

  const agentManager = getAgentManager();

  useEffect(() => {
    // Load tariff auto-update configuration
    const loadTariffConfig = () => {
      const savedConfig = localStorage.getItem('tariff_auto_update_config');
      if (savedConfig) {
        try {
          const config = JSON.parse(savedConfig);
          setAutoUpdateEnabled(config.enabled || false);
          setUpdateInterval(config.interval || 7);
          if (config.nextUpdateTime) {
            setNextUpdateTime(new Date(config.nextUpdateTime));
          }
        } catch (e) {
          console.warn('Failed to parse tariff auto-update config:', e);
        }
      }
    };
    loadTariffConfig();

    // Load tasks from AgentManager
    const loadTasks = () => {
      const allTasks = agentManager.getAllTasks();
      setTasks(allTasks);
    };

    loadTasks();

    // Auto-refresh tasks every 5 seconds
    const interval = setInterval(loadTasks, 5000);

    // Check for auto-update trigger
    const checkAutoUpdate = setInterval(() => {
      if (autoUpdateEnabled && nextUpdateTime) {
        if (new Date() >= nextUpdateTime) {
          console.log('Triggering auto-update...');
          handleTariffUpdate();
          // Schedule next update
          scheduleNextUpdate();
        }
      }
    }, 60000); // Check every minute

    // Update countdown display
    const updateCountdown = setInterval(() => {
      if (autoUpdateEnabled && nextUpdateTime) {
        const now = new Date();
        const diff = nextUpdateTime.getTime() - now.getTime();

        if (diff <= 0) {
          setTimeUntilNextUpdate('即将更新');
        } else {
          const days = Math.floor(diff / (1000 * 60 * 60 * 24));
          const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

          if (days > 0) {
            setTimeUntilNextUpdate(`${days}天${hours}小时后`);
          } else if (hours > 0) {
            setTimeUntilNextUpdate(`${hours}小时${minutes}分钟后`);
          } else {
            setTimeUntilNextUpdate(`${minutes}分钟后`);
          }
        }
      } else {
        setTimeUntilNextUpdate('');
      }
    }, 60000); // Update every minute

    // Initial countdown update
    if (autoUpdateEnabled && nextUpdateTime) {
      const now = new Date();
      const diff = nextUpdateTime.getTime() - now.getTime();
      if (diff > 0) {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        if (days > 0) {
          setTimeUntilNextUpdate(`${days}天${hours}小时后`);
        } else if (hours > 0) {
          setTimeUntilNextUpdate(`${hours}小时后`);
        } else {
          setTimeUntilNextUpdate('即将更新');
        }
      }
    }

    // Subscribe to communication logs
    const logger = getCommunicationLogger();
    const unsubscribe = logger.subscribe((logs) => {
      setCommLogs(logs);
    });

    return () => {
      clearInterval(interval);
      clearInterval(checkAutoUpdate);
      clearInterval(updateCountdown);
      unsubscribe();
    };
  }, [autoUpdateEnabled, nextUpdateTime]);

  const handleRunAgent = async (agentId: AgentType) => {
    if (!isApiConfigured()) {
      alert('请先在设置页面配置智谱GLM API密钥');
      return;
    }

    setAgents(prev =>
      prev.map(a => (a.id === agentId ? { ...a, status: 'running' } : a))
    );

    try {
      // Import agents dynamically
      const { PolicyUpdateAgent } = await import('../../services/agents/PolicyUpdateAgent');
      const { TariffUpdateAgent } = await import('../../services/agents/TariffUpdateAgent');
      const { DueDiligenceAgent } = await import('../../services/agents/DueDiligenceAgent');
      const { SentimentAnalysisAgent } = await import('../../services/agents/SentimentAnalysisAgent');
      const { TechnicalFeasibilityAgent } = await import('../../services/agents/TechnicalFeasibilityAgent');
      const { FinancialFeasibilityAgent } = await import('../../services/agents/FinancialFeasibilityAgent');
      const { ReportGenerationAgent } = await import('../../services/agents/ReportGenerationAgent');

      let agentType: string;
      let input: any;

      switch (agentId) {
        case 'policy':
          const policyAgent = new PolicyUpdateAgent();
          agentManager.registerAgent('policy', policyAgent);
          agentType = 'policy';
          input = {
            sources: ['national', 'provincial'],
            checkLatest: true,
          };
          break;
        case 'tariff':
          const tariffAgent = new TariffUpdateAgent();
          agentManager.registerAgent('tariff', tariffAgent);
          agentType = 'tariff';
          input = {
            provinces: ['guangdong', 'zhejiang', 'jiangsu'],
            checkLatest: true,
          };
          break;
        case 'diligence':
          const diligenceAgent = new DueDiligenceAgent();
          agentManager.registerAgent('diligence', diligenceAgent);
          agentType = 'diligence';
          input = {
            companyName: '示例公司',
            searchDepth: 'standard',
          };
          break;
        case 'sentiment':
          const sentimentAgent = new SentimentAnalysisAgent();
          agentManager.registerAgent('sentiment', sentimentAgent);
          agentType = 'sentiment';
          input = {
            companyName: '示例公司',
            timeRange: '30d',
          };
          break;
        case 'technical':
          const technicalAgent = new TechnicalFeasibilityAgent();
          agentManager.registerAgent('technical', technicalAgent);
          agentType = 'technical';
          input = {
            projectName: '示例项目',
            province: 'guangdong',
            system: { capacity: 2, power: 1 },
          };
          break;
        case 'financial':
          const financialAgent = new FinancialFeasibilityAgent();
          agentManager.registerAgent('financial', financialAgent);
          agentType = 'financial';
          input = {
            projectName: '示例项目',
            province: 'guangdong',
            system: { capacity: 2, power: 1, duration: 2 },
            costs: {
              batteryCost: 1200,
              pcsCost: 400,
              bmsCost: 100,
              emsCost: 50000,
              otherCost: 100,
              installationCostPerKw: 100,
              gridConnectionCost: 50000,
              landCost: 0,
              developmentCost: 50000,
              permittingCost: 30000,
              contingencyPercent: 5,
            },
            tariff: { peakPrice: 1.103, valleyPrice: 0.369, flatPrice: 0.668 },
            operations: {
              systemEfficiency: 0.88,
              depthOfDischarge: 0.9,
              cyclesPerDay: 1.5,
              degradationRate: 0.02,
              availabilityPercent: 0.95,
            },
            financial: {
              projectYears: 15,
              discountRate: 0.08,
              electricityPriceEscalation: 0.02,
              omCostPercent: 0.03,
              insurancePercent: 0.01,
            },
          };
          break;
        case 'report':
          const reportAgent = new ReportGenerationAgent();
          agentManager.registerAgent('report', reportAgent);
          agentType = 'report';
          input = {
            projectName: '示例项目',
            companyName: '示例公司',
            province: 'guangdong',
            reportType: 'comprehensive',
            includeSections: [
              'executive_summary',
              'policy_analysis',
              'tariff_analysis',
              'company_background',
              'technical_feasibility',
              'financial_feasibility',
              'risk_assessment',
              'recommendations',
            ],
            format: 'html',
            language: 'zh',
          };
          break;
        default:
          throw new Error(`Unknown agent type: ${agentId}`);
      }

      // Create and execute task
      const task = agentManager.createTask(agentType!, input!);
      await agentManager.executeTask(task.id);

      // Refresh tasks
      setTasks(agentManager.getAllTasks());

      // Update agent status
      setTimeout(() => {
        setAgents(prev =>
          prev.map(a => (a.id === agentId ? { ...a, status: 'completed', lastRun: new Date().toISOString() } : a))
        );
      }, 1000);
    } catch (error) {
      console.error('Agent execution failed:', error);
      setAgents(prev =>
        prev.map(a => (a.id === agentId ? { ...a, status: 'error' } : a))
      );
    }
  };

  // Tariff update functions
  const handleTariffUpdate = async () => {
    if (!isApiConfigured()) {
      alert('请先在设置页面配置智谱GLM API密钥');
      return;
    }

    setIsUpdatingTariff(true);
    setShowTariffProcess(true);

    // Initialize process steps
    const initialSteps = [
      { id: '1', name: '启动AI智能体', status: 'pending' },
      { id: '2', name: '检查各省电价变化', status: 'pending' },
      { id: '3', name: '分析电价调整影响', status: 'pending' },
      { id: '4', name: '生成更新报告', status: 'pending' },
      { id: '5', name: '更新本地数据库', status: 'pending' },
    ];
    setTariffUpdateSteps(initialSteps);

    try {
      const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
      const updateStep = async (id: string, status: string, message?: string) => {
        setTariffUpdateSteps(prev => prev.map(step => {
          if (step.id === id) {
            return {
              ...step,
              status,
              message: message || step.message,
              timestamp: new Date().toLocaleTimeString('zh-CN'),
            };
          }
          return step;
        }));
        await sleep(100);
      };

      // Step 1: Start AI agent
      await updateStep('1', 'running', '正在初始化TariffUpdateAgent...');
      await sleep(500);
      const agent = new TariffUpdateAgent();
      await updateStep('1', 'completed', 'AI智能体已启动');

      // Step 2: Check tariff changes
      await updateStep('2', 'running', '正在检查全国31个省份电价政策...');
      const provinces = ['guangdong', 'zhejiang', 'jiangsu', 'shandong', 'beijing'];
      const result = await agent.execute({
        provinces,
        checkLatest: true,
        compareWithPrevious: true,
      });
      await updateStep('2', 'completed', `已检查 ${result.provincesChecked} 个省份，发现 ${result.provincesUpdated} 个省份有变化`);

      // Step 3: Analyze impact
      await updateStep('3', 'running', 'AI正在分析电价变化对储能项目的影响...');
      await sleep(1000);
      await updateStep('3', 'completed', `影响分析完成，${result.alerts.length} 条重要提醒`);

      // Step 4: Generate report
      await updateStep('4', 'running', 'AI正在生成更新总结报告...');
      await sleep(800);
      await updateStep('4', 'completed', '报告生成完成');

      // Step 5: Update local database
      await updateStep('5', 'running', '正在更新本地电价数据库...');
      const tariffService = getTariffService();
      await tariffService.updateTariffData();
      await updateStep('5', 'completed', '数据库更新完成');

      setTariffUpdateResult(result);

      // Schedule next update if auto-update is enabled
      if (autoUpdateEnabled) {
        scheduleNextUpdate();
      }
    } catch (error) {
      console.error('Tariff update failed:', error);
      setTariffUpdateSteps(prev => prev.map(step => {
        if (step.status === 'running') {
          return { ...step, status: 'error', message: '执行失败' };
        }
        return step;
      }));
    } finally {
      setIsUpdatingTariff(false);
    }
  };

  // Schedule next update
  const scheduleNextUpdate = () => {
    const nextUpdate = new Date();
    nextUpdate.setDate(nextUpdate.getDate() + updateInterval);
    setNextUpdateTime(nextUpdate);

    // Save to localStorage
    const config = {
      enabled: autoUpdateEnabled,
      interval: updateInterval,
      nextUpdateTime: nextUpdate.toISOString(),
    };
    localStorage.setItem('tariff_auto_update_config', JSON.stringify(config));
  };

  // Toggle auto-update
  const handleToggleAutoUpdate = (enabled: boolean) => {
    setAutoUpdateEnabled(enabled);
    if (enabled) {
      scheduleNextUpdate();
    } else {
      setNextUpdateTime(null);
      // Clear config
      localStorage.removeItem('tariff_auto_update_config');
    }
  };

  // Update interval change
  const handleIntervalChange = (days: number) => {
    setUpdateInterval(days);
    if (autoUpdateEnabled) {
      scheduleNextUpdate();
    }
  };

  // Save schedule configuration
  const handleSaveScheduleConfig = () => {
    const config = {
      enabled: autoUpdateEnabled,
      interval: updateInterval,
      nextUpdateTime: autoUpdateEnabled ? (nextUpdateTime || new Date(Date.now() + updateInterval * 24 * 60 * 60 * 1000)).toISOString() : null,
    };
    localStorage.setItem('tariff_auto_update_config', JSON.stringify(config));

    if (autoUpdateEnabled && !nextUpdateTime) {
      scheduleNextUpdate();
    }

    setShowScheduleConfig(false);
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Agent Status Summary */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">智能体状态概览</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-green-900">
              {agents.filter(a => a.enabled).length}
            </div>
            <div className="text-sm text-green-700">已启用</div>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-900">
              {tasks.filter(t => t.status === 'running').length}
            </div>
            <div className="text-sm text-blue-700">运行中</div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">
              {tasks.filter(t => t.status === 'completed').length}
            </div>
            <div className="text-sm text-gray-700">已完成</div>
          </div>
        </div>
      </div>

      {/* Recent Tasks */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">最近任务</h3>
        {tasks.length === 0 ? (
          <p className="text-gray-500 text-sm">暂无任务记录</p>
        ) : (
          <div className="space-y-3">
            {tasks.slice(0, 5).map(task => (
              <div key={task.id} className="flex items-center justify-between py-2 border-b border-gray-100">
                <div className="flex items-center space-x-3">
                  <span className={`w-2 h-2 rounded-full ${
                    task.status === 'running' ? 'bg-blue-500 animate-pulse' :
                    task.status === 'completed' ? 'bg-green-500' :
                    task.status === 'failed' ? 'bg-red-500' :
                    'bg-gray-400'
                  }`} />
                  <span className="text-sm font-medium text-gray-900">{task.type}</span>
                  <span className="text-xs text-gray-500">{new Date(task.startTime).toLocaleString()}</span>
                </div>
                <span className={`text-xs px-2 py-1 rounded ${
                  task.status === 'running' ? 'bg-blue-100 text-blue-800' :
                  task.status === 'completed' ? 'bg-green-100 text-green-800' :
                  task.status === 'failed' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {task.status === 'running' ? '运行中' :
                   task.status === 'completed' ? '已完成' :
                   task.status === 'failed' ? '失败' : '待执行'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderAgents = () => (
    <div className="space-y-4">
      {agents.map(agent => (
        <div
          key={agent.id}
          className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-4">
              <span className="text-3xl">{agent.icon}</span>
              <div>
                <h3 className="text-lg font-medium text-gray-900">{agent.name}</h3>
                <p className="text-sm text-gray-600 mt-1">{agent.description}</p>
                {agent.lastRun && (
                  <p className="text-xs text-gray-500 mt-2">
                    上次运行: {new Date(agent.lastRun).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <span className={`text-xs px-2 py-1 rounded ${
                agent.status === 'running' ? 'bg-blue-100 text-blue-800' :
                agent.status === 'completed' ? 'bg-green-100 text-green-800' :
                agent.status === 'error' ? 'bg-red-100 text-red-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {agent.status === 'running' ? '运行中' :
                 agent.status === 'completed' ? '已完成' :
                 agent.status === 'error' ? '错误' : '空闲'}
              </span>
              <button
                onClick={() => agent.id === 'tariff' ? handleTariffUpdate() : handleRunAgent(agent.id)}
                disabled={!isApiConfigured() || agent.status === 'running' || (agent.id === 'tariff' && isUpdatingTariff)}
                className={`px-4 py-2 rounded-lg transition ${
                  !isApiConfigured() || agent.status === 'running' || (agent.id === 'tariff' && isUpdatingTariff)
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : agent.id === 'tariff'
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {agent.status === 'running' || (agent.id === 'tariff' && isUpdatingTariff) ? '运行中...' :
                 agent.id === 'tariff' ? '更新电价' : '运行'}
              </button>
            </div>
          </div>

          {/* Special UI for Tariff Update Agent - Auto Update Configuration */}
          {agent.id === 'tariff' && !showTariffProcess && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              {/* Auto Update Status Bar */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className={`w-2 h-2 rounded-full ${autoUpdateEnabled ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      自动更新状态
                    </p>
                    <p className="text-xs text-gray-500">
                      {autoUpdateEnabled ? (
                        <>{nextUpdateTime ? (
                          <span>
                            {timeUntilNextUpdate && <span className="text-blue-600 font-medium">{timeUntilNextUpdate}</span>}
                            <span className="mx-1">•</span>
                            {new Date(nextUpdateTime).toLocaleDateString('zh-CN')}
                          </span>
                        ) : '计算中...'}
                        </>
                      ) : (
                        <>自动更新已禁用</>
                      )}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowScheduleConfig(!showScheduleConfig)}
                  className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                  </svg>
                  配置周期
                </button>
              </div>

              {/* Schedule Configuration Panel */}
              {showScheduleConfig && (
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">配置自动更新周期</h4>

                  <div className="space-y-4">
                    {/* Enable/Disable Toggle */}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">启用自动更新</p>
                        <p className="text-xs text-gray-500">系统将自动检查并更新电价数据</p>
                      </div>
                      <button
                        onClick={() => handleToggleAutoUpdate(!autoUpdateEnabled)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          autoUpdateEnabled ? 'bg-blue-600' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            autoUpdateEnabled ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Update Interval Selector */}
                    {autoUpdateEnabled && (
                      <div>
                        <label className="block text-sm font-medium text-gray-900 mb-2">
                          更新周期
                        </label>
                        <div className="grid grid-cols-4 gap-2">
                          {[1, 3, 7, 14, 30].map((days) => (
                            <button
                              key={days}
                              onClick={() => handleIntervalChange(days)}
                              className={`px-3 py-2 text-xs font-medium rounded-lg border transition-colors ${
                                updateInterval === days
                                  ? 'bg-blue-600 text-white border-blue-600'
                                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                              }`}
                            >
                              {days === 1 ? '每天' : days === 3 ? '每3天' : days === 7 ? '每周' : days === 14 ? '每2周' : '每月'}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Custom Interval Input */}
                    {autoUpdateEnabled && (
                      <div>
                        <label className="block text-sm font-medium text-gray-900 mb-2">
                          自定义天数
                        </label>
                        <div className="flex items-center space-x-2">
                          <input
                            type="number"
                            min="1"
                            max="90"
                            value={updateInterval}
                            onChange={(e) => handleIntervalChange(parseInt(e.target.value))}
                            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                          <span className="text-sm text-gray-600">天</span>
                        </div>
                      </div>
                    )}

                    {/* Next Update Preview */}
                    {autoUpdateEnabled && nextUpdateTime && (
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-xs font-medium text-blue-900 mb-1">预计下次更新时间</p>
                        <p className="text-xs text-blue-800">{new Date(nextUpdateTime).toLocaleString('zh-CN')}</p>
                      </div>
                    )}

                    {/* Save Button */}
                    <div className="flex gap-2">
                      <button
                        onClick={handleSaveScheduleConfig}
                        className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                      >
                        保存配置
                      </button>
                      <button
                        onClick={() => setShowScheduleConfig(false)}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        取消
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Special UI for Tariff Update Agent */}
          {agent.id === 'tariff' && showTariffProcess && (
            <div className="mt-6 space-y-4">
              {/* Process Steps */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center mb-3">
                  <svg className="w-4 h-4 text-blue-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <h4 className="text-sm font-semibold text-blue-900">AI智能体执行过程</h4>
                </div>

                <div className="space-y-2">
                  {tariffUpdateSteps.map((step, index) => (
                    <div key={step.id} className="flex items-start text-xs">
                      {/* Status Icon */}
                      <div className="flex-shrink-0 mt-0.5">
                        {step.status === 'pending' && (
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <circle cx="12" cy="12" r="10" strokeWidth="2" strokeDasharray="4 4" />
                          </svg>
                        )}
                        {step.status === 'running' && (
                          <svg className="w-4 h-4 text-blue-600 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <circle cx="12" cy="12" r="10" strokeWidth="2" strokeDasharray="4 4" className="opacity-25" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                        )}
                        {step.status === 'completed' && (
                          <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 001.414 1.414l-2-2a1 1 0 00-1.414 0L4 9.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a2 2 0 002-2h3a1 1 0 001-1V9.414l-1.293-1.293z" clipRule="evenodd" />
                          </svg>
                        )}
                        {step.status === 'error' && (
                          <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>

                      {/* Step Info */}
                      <div className="ml-2 flex-1">
                        <div className="flex items-center justify-between">
                          <span className={`font-medium ${
                            step.status === 'running' ? 'text-blue-900' :
                            step.status === 'completed' ? 'text-green-900' :
                            step.status === 'error' ? 'text-red-900' :
                            'text-gray-700'
                          }`}>
                            {step.name}
                          </span>
                          {step.timestamp && (
                            <span className="text-gray-500">{step.timestamp}</span>
                          )}
                        </div>
                        {step.message && (
                          <p className={`mt-0.5 ${
                            step.status === 'running' ? 'text-blue-700' :
                            step.status === 'completed' ? 'text-green-700' :
                            step.status === 'error' ? 'text-red-700' :
                            'text-gray-600'
                          }`}>
                            {step.message}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Results Display */}
              {tariffUpdateResult && !isUpdatingTariff && (
                <div className="space-y-3">
                  {/* Summary */}
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-start">
                      <svg className="w-4 h-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-green-900 mb-1">AI分析摘要</p>
                        <p className="text-xs text-green-800">{tariffUpdateResult.summary}</p>
                      </div>
                    </div>
                  </div>

                  {/* Alerts */}
                  {tariffUpdateResult.alerts && tariffUpdateResult.alerts.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-gray-700">重要提醒</p>
                      {tariffUpdateResult.alerts.map((alert: any, index: number) => (
                        <div key={index} className={`p-2 rounded border ${
                          alert.severity === 'urgent' ? 'bg-red-50 border-red-200' :
                          alert.severity === 'warning' ? 'bg-orange-50 border-orange-200' :
                          'bg-blue-50 border-blue-200'
                        }`}>
                          <p className={`text-xs font-medium ${
                            alert.severity === 'urgent' ? 'text-red-900' :
                            alert.severity === 'warning' ? 'text-orange-900' :
                            'text-blue-900'
                          }`}>
                            {alert.message}
                          </p>
                          <p className="text-xs text-gray-600 mt-1">{alert.recommendation}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Close Button */}
                  <button
                    onClick={() => {
                      setShowTariffProcess(false);
                      setTariffUpdateResult(null);
                    }}
                    className="w-full px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    关闭结果
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );

  const renderTasks = () => (
    <div className="space-y-4">
      {tasks.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
          <p className="text-gray-500">暂无任务记录</p>
          <p className="text-sm text-gray-400 mt-2">运行智能体后将显示任务历史</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  智能体
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  任务ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  创建时间
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  状态
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  结果
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {tasks.map(task => (
                <tr key={task.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {task.type}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {task.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(task.startTime).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-xs px-2 py-1 rounded ${
                      task.status === 'running' ? 'bg-blue-100 text-blue-800' :
                      task.status === 'completed' ? 'bg-green-100 text-green-800' :
                      task.status === 'failed' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {task.status === 'running' ? '运行中' :
                       task.status === 'completed' ? '已完成' :
                       task.status === 'failed' ? '失败' : '待执行'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {task.result ? '✓' : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const renderReports = () => (
    <div className="space-y-4">
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-2">报告管理</h3>
        <p className="text-sm text-gray-600 mb-4">
          生成的报告将在这里显示。报告由报告生成智能体整合其他智能体的输出结果。
        </p>
        <button
          onClick={() => handleRunAgent('report')}
          disabled={!isApiConfigured()}
          className={`px-4 py-2 rounded-lg transition ${
            !isApiConfigured()
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          生成示例报告
        </button>
      </div>

      {/* Sample reports would be listed here */}
      <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
        <p className="text-gray-500">暂无报告</p>
        <p className="text-sm text-gray-400 mt-2">运行报告生成智能体后将显示报告列表</p>
      </div>
    </div>
  );

  const renderSettings = () => <AdminSettings />;

  const renderConsole = () => {
    const logger = getCommunicationLogger();
    const stats = logger.getStats();

    // Filter logs
    let filteredLogs = commLogs;
    if (consoleFilter.agentType) {
      filteredLogs = filteredLogs.filter(log => log.agentType === consoleFilter.agentType);
    }
    if (consoleFilter.direction) {
      filteredLogs = filteredLogs.filter(log => log.direction === consoleFilter.direction);
    }
    if (consoleFilter.searchTerm) {
      filteredLogs = filteredLogs.filter(log =>
        log.prompt?.toLowerCase().includes(consoleFilter.searchTerm.toLowerCase()) ||
        log.response?.toLowerCase().includes(consoleFilter.searchTerm.toLowerCase()) ||
        log.error?.toLowerCase().includes(consoleFilter.searchTerm.toLowerCase())
      );
    }

    return (
      <div className="space-y-6">
        {/* Console Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">总请求数</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalRequests}</p>
              </div>
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">成功率</p>
                <p className="text-2xl font-bold text-green-600">{stats.successRate}</p>
              </div>
              <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">总Token数</p>
                <p className="text-2xl font-bold text-purple-600">{stats.totalTokens.toLocaleString()}</p>
              </div>
              <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
              </div>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">平均响应时间</p>
                <p className="text-2xl font-bold text-orange-600">{stats.avgDuration}</p>
              </div>
              <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Agent Stats */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">智能体通信统计</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-7 gap-4">
            {stats.agentStats.map((agentStat: any) => (
              <div key={agentStat.agentType} className="p-4 bg-gray-50 rounded-lg">
                <p className="text-xs font-medium text-gray-700 mb-2">{agentStat.agentType}</p>
                <div className="space-y-1">
                  <p className="text-xs text-gray-600">请求: {agentStat.requests}</p>
                  <p className="text-xs text-gray-600">响应: {agentStat.responses}</p>
                  <p className="text-xs text-gray-600">成功率: {agentStat.successRate.toFixed(0)}%</p>
                  <p className="text-xs text-gray-600">Tokens: {agentStat.totalTokens.toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Console Controls */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* Search */}
            <div className="flex-1 min-w-[200px]">
              <input
                type="text"
                placeholder="搜索通信内容..."
                value={consoleFilter.searchTerm}
                onChange={(e) => setConsoleFilter({ ...consoleFilter, searchTerm: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Agent Filter */}
            <select
              value={consoleFilter.agentType || ''}
              onChange={(e) => setConsoleFilter({ ...consoleFilter, agentType: e.target.value || undefined })}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">所有智能体</option>
              <option value="PolicyUpdateAgent">PolicyUpdateAgent</option>
              <option value="TariffUpdateAgent">TariffUpdateAgent</option>
              <option value="DueDiligenceAgent">DueDiligenceAgent</option>
              <option value="SentimentAnalysisAgent">SentimentAnalysisAgent</option>
              <option value="TechnicalFeasibilityAgent">TechnicalFeasibilityAgent</option>
              <option value="FinancialFeasibilityAgent">FinancialFeasibilityAgent</option>
              <option value="ReportGenerationAgent">ReportGenerationAgent</option>
            </select>

            {/* Direction Filter */}
            <select
              value={consoleFilter.direction || ''}
              onChange={(e) => setConsoleFilter({ ...consoleFilter, direction: e.target.value || undefined })}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">所有方向</option>
              <option value="request">请求</option>
              <option value="response">响应</option>
              <option value="error">错误</option>
            </select>

            {/* Clear Button */}
            <button
              onClick={() => {
                logger.clearLogs();
                setCommLogs([]);
              }}
              className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100"
            >
              清空日志
            </button>

            {/* Export Button */}
            <button
              onClick={() => {
                const json = logger.exportLogs();
                const blob = new Blob([json], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `agent-logs-${Date.now()}.json`;
                a.click();
              }}
              className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100"
            >
              导出JSON
            </button>
          </div>
        </div>

        {/* Console Logs */}
        <div className="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gray-800 px-4 py-2 border-b border-gray-700 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-xs font-medium text-gray-300">实时通信监控</span>
              <span className="text-xs text-gray-500">{filteredLogs.length} 条记录</span>
            </div>
          </div>

          {/* Logs */}
          <div className="max-h-[600px] overflow-y-auto">
            {filteredLogs.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <svg className="w-12 h-12 mx-auto mb-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m0 6l-3-3-3-3m9 9V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V9z" />
                </svg>
                <p>暂无通信记录</p>
                <p className="text-sm mt-2">运行智能体后将显示通信日志</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-800">
                {filteredLogs.map((log) => (
                  <div key={log.id} className="px-4 py-3 hover:bg-gray-800 transition">
                    <div className="flex items-start space-x-3">
                      {/* Direction Icon */}
                      <div className="flex-shrink-0 mt-1">
                        {log.direction === 'request' && (
                          <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5h12" />
                          </svg>
                        )}
                        {log.direction === 'response' && (
                          <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                          </svg>
                        )}
                        {log.direction === 'error' && (
                          <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        )}
                      </div>

                      {/* Log Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className={`text-xs font-medium ${
                            log.direction === 'request' ? 'text-blue-400' :
                            log.direction === 'response' ? 'text-green-400' :
                            'text-red-400'
                          }`}>
                            {log.agentType}
                          </span>
                          <span className="text-xs text-gray-500">•</span>
                          <span className="text-xs text-gray-500">{log.model}</span>
                          {log.tokens && (
                            <>
                              <span className="text-xs text-gray-500">•</span>
                              <span className="text-xs text-gray-500">{log.tokens.total} tokens</span>
                            </>
                          )}
                          {log.duration && (
                            <>
                              <span className="text-xs text-gray-500">•</span>
                              <span className="text-xs text-gray-500">{log.duration}ms</span>
                            </>
                          )}
                          <span className="text-xs text-gray-500">•</span>
                          <span className="text-xs text-gray-500">{new Date(log.timestamp).toLocaleTimeString()}</span>
                        </div>

                        {/* Request/Response Content */}
                        {log.direction === 'request' && log.prompt && (
                          <div className="mt-2 p-2 bg-gray-800 rounded text-xs text-gray-300 font-mono whitespace-pre-wrap break-all">
                            {log.prompt.length > 500 ? log.prompt.substring(0, 500) + '...' : log.prompt}
                          </div>
                        )}
                        {log.direction === 'response' && log.response && (
                          <div className="mt-2 p-2 bg-gray-800 rounded text-xs text-gray-300 font-mono whitespace-pre-wrap break-all">
                            {log.response.length > 500 ? log.response.substring(0, 500) + '...' : log.response}
                          </div>
                        )}
                        {log.direction === 'error' && log.error && (
                          <div className="mt-2 p-2 bg-red-900/20 border border-red-800 rounded text-xs text-red-400 font-mono whitespace-pre-wrap break-all">
                            {log.error}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">🤖</span>
              <div>
                <h1 className="text-xl font-bold text-gray-900">NanoClaw 管理后台</h1>
                <p className="text-xs text-gray-500">AI智能体驱动的储能项目评估系统</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <a
                href="/"
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                返回计算器
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition ${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              概览
            </button>
            <button
              onClick={() => setActiveTab('agents')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition ${
                activeTab === 'agents'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              智能体
            </button>
            <button
              onClick={() => setActiveTab('tasks')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition ${
                activeTab === 'tasks'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              任务
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition ${
                activeTab === 'reports'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              报告
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition ${
                activeTab === 'settings'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              设置
            </button>
            <button
              onClick={() => setActiveTab('console')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition ${
                activeTab === 'console'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              控制台
            </button>
            <button
              onClick={() => setActiveTab('metrics')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition ${
                activeTab === 'metrics'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              性能监控
            </button>
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'agents' && renderAgents()}
        {activeTab === 'tasks' && renderTasks()}
        {activeTab === 'reports' && renderReports()}
        {activeTab === 'settings' && renderSettings()}
        {activeTab === 'console' && renderConsole()}
        {activeTab === 'metrics' && (
          <div className="space-y-6">
            <AgentMetricsDashboard refreshInterval={5000} />
          </div>
        )}
      </div>
    </div>
  );
};
