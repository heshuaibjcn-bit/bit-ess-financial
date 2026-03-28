/**
 * Admin Dashboard - NanoClaw Agent Management Interface
 *
 * Comprehensive dashboard for managing all AI agents:
 * - Monitor agent status and tasks
 * - Schedule automated tasks
 * - View and manage reports
 * - Configure system settings
 */

import React, { useState, useEffect } from 'react';
import {
  getAgentManager,
} from '../../services/agents';
import type { AgentTask } from '../../services/agents/NanoAgent';

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
  const [activeTab, setActiveTab] = useState<'overview' | 'agents' | 'tasks' | 'reports' | 'settings'>('overview');
  const [agents, setAgents] = useState<AgentConfig[]>(AGENTS);
  const [tasks, setTasks] = useState<AgentTask[]>([]);
  const [apiConfigured, setApiConfigured] = useState(false);

  const agentManager = getAgentManager();

  useEffect(() => {
    // Check if API key is configured
    const checkApiKey = () => {
      const key = localStorage.getItem('glm_api_key');
      setApiConfigured(!!key);
    };
    checkApiKey();

    // Load tasks from AgentManager
    const loadTasks = () => {
      const allTasks = agentManager.getAllTasks();
      setTasks(allTasks);
    };

    loadTasks();

    // Auto-refresh tasks every 5 seconds
    const interval = setInterval(loadTasks, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleRunAgent = async (agentId: AgentType) => {
    if (!apiConfigured) {
      alert('请先配置智谱GLM API密钥');
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

  const handleConfigureApiKey = () => {
    const key = prompt('请输入智谱AI GLM API密钥:');
    if (key) {
      localStorage.setItem('glm_api_key', key);
      setApiConfigured(true);
    }
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* API Configuration Status */}
      <div className={`p-4 rounded-lg border ${apiConfigured ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">{apiConfigured ? '✅' : '⚠️'}</span>
            <div>
              <h3 className={`font-medium ${apiConfigured ? 'text-green-900' : 'text-yellow-900'}`}>
                智谱GLM API密钥状态
              </h3>
              <p className={`text-sm ${apiConfigured ? 'text-green-700' : 'text-yellow-700'}`}>
                {apiConfigured ? '已配置' : '未配置'}
              </p>
            </div>
          </div>
          {!apiConfigured && (
            <button
              onClick={handleConfigureApiKey}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              配置密钥
            </button>
          )}
        </div>
      </div>

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
                onClick={() => handleRunAgent(agent.id)}
                disabled={!apiConfigured || agent.status === 'running'}
                className={`px-4 py-2 rounded-lg transition ${
                  !apiConfigured || agent.status === 'running'
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {agent.status === 'running' ? '运行中...' : '运行'}
              </button>
            </div>
          </div>
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
          disabled={!apiConfigured}
          className={`px-4 py-2 rounded-lg transition ${
            !apiConfigured
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

  const renderSettings = () => (
    <div className="space-y-6">
      {/* API Configuration */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">API配置</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              智谱GLM API密钥
            </label>
            <div className="flex space-x-3">
              <input
                type="password"
                defaultValue={localStorage.getItem('glm_api_key') || ''}
                placeholder="输入智谱AI的API密钥"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                readOnly
              />
              <button
                onClick={handleConfigureApiKey}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                更新密钥
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              密钥存储在浏览器本地存储中，不会上传到服务器
            </p>
          </div>
        </div>
      </div>

      {/* Agent Configuration */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">智能体配置</h3>
        <div className="space-y-3">
          {agents.map(agent => (
            <div key={agent.id} className="flex items-center justify-between py-2">
              <div className="flex items-center space-x-3">
                <span className="text-xl">{agent.icon}</span>
                <span className="text-sm font-medium text-gray-900">{agent.name}</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={agent.enabled}
                  onChange={(e) => {
                    setAgents(prev =>
                      prev.map(a => a.id === agent.id ? { ...a, enabled: e.target.checked } : a)
                    );
                  }}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* System Information */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">系统信息</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">NanoClaw版本</span>
            <span className="font-medium">1.0.0</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">智能体数量</span>
            <span className="font-medium">{agents.length}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">已完成任务</span>
            <span className="font-medium">{tasks.filter(t => t.status === 'completed').length}</span>
          </div>
        </div>
      </div>
    </div>
  );

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
      </div>
    </div>
  );
};
