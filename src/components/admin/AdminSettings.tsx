/**
 * Admin Settings - 统一的 API 配置管理
 *
 * 整合所有 AI 和 LLM 的 API 配置：
 * - GLM API (智谱AI) - 用于 Agent 系统
 * - 系统配置和调试选项
 */

import React, { useState, useEffect } from 'react';
import { getSettingsManager } from '@/config/Settings';

interface ConfigStatus {
  glm: { configured: boolean; model: string; lastChecked?: Date };
}

export const AdminSettings: React.FC = () => {
  const settingsManager = getSettingsManager();
  const [configStatus, setConfigStatus] = useState<ConfigStatus>({
    glm: { configured: false, model: 'glm-4-turbo' }
  });

  // GLM API States
  const [glmApiKey, setGlmApiKey] = useState('');
  const [glmModel, setGlmModel] = useState('glm-4-turbo');
  const [showGlmKey, setShowGlmKey] = useState(false);
  const [glmSaving, setGlmSaving] = useState(false);

  // Agent Configuration
  const [agentRetryEnabled, setAgentRetryEnabled] = useState(true);
  const [agentRateLimitEnabled, setAgentRateLimitEnabled] = useState(true);
  const [rateLimitCapacity, setRateLimitCapacity] = useState(10);
  const [rateLimitRefillRate, setRateLimitRefillRate] = useState(2);

  // Debug Mode
  const [debugMode, setDebugMode] = useState(false);
  const [verboseLogging, setVerboseLogging] = useState(false);

  useEffect(() => {
    // Load GLM settings
    const glmSettings = settingsManager.getSetting('glm');
    setGlmApiKey(glmSettings.apiKey);
    setGlmModel(glmSettings.model);

    // Load agent settings
    const agentSettings = settingsManager.getSetting('agents');
    setAgentRetryEnabled(agentSettings.retryConfig.maxRetries > 0);
    setAgentRateLimitEnabled(agentSettings.rateLimit.enabled);
    setRateLimitCapacity(agentSettings.rateLimit.capacity);
    setRateLimitRefillRate(agentSettings.rateLimit.refillRate);

    // Load debug settings
    const debugEnabled = localStorage.getItem('debug_mode') === 'true';
    const verboseEnabled = localStorage.getItem('verbose_logging') === 'true';
    setDebugMode(debugEnabled);
    setVerboseLogging(verboseEnabled);

    // Update status
    updateConfigStatus();
  }, []);

  const updateConfigStatus = () => {
    const glmSettings = settingsManager.getSetting('glm');

    setConfigStatus({
      glm: {
        configured: settingsManager.isGLMConfigured(),
        model: glmSettings.model,
        lastChecked: new Date()
      }
    });
  };

  // GLM API Handlers
  const handleSaveGlmKey = async () => {
    setGlmSaving(true);
    try {
      const validation = settingsManager.validateApiKey(glmApiKey);
      if (!validation.valid) {
        alert(`GLM API Key 验证失败: ${validation.message}`);
        return;
      }

      settingsManager.updateGLMApiKey(glmApiKey);
      settingsManager.updateSettings({
        glm: { ...settingsManager.getSetting('glm'), model: glmModel }
      });

      updateConfigStatus();
      alert('GLM API 密钥已保存');
    } catch (error) {
      alert(`保存失败: ${error}`);
    } finally {
      setGlmSaving(false);
    }
  };

  const handleClearGlmKey = () => {
    if (confirm('确定要清除 GLM API 密钥吗？')) {
      settingsManager.updateGLMApiKey('');
      setGlmApiKey('');
      updateConfigStatus();
    }
  };

  // Agent Configuration Handlers
  const handleSaveAgentConfig = () => {
    settingsManager.updateSettings({
      agents: {
        retryConfig: {
          maxRetries: agentRetryEnabled ? 3 : 0,
          initialDelay: 1000,
          maxDelay: 10000,
          backoffMultiplier: 2,
          jitter: true
        },
        rateLimit: {
          capacity: rateLimitCapacity,
          refillRate: rateLimitRefillRate,
          enabled: agentRateLimitEnabled
        }
      }
    });
    alert('Agent 配置已保存');
  };

  // Debug Mode Handlers
  const handleToggleDebugMode = (enabled: boolean) => {
    setDebugMode(enabled);
    localStorage.setItem('debug_mode', String(enabled));
  };

  const handleToggleVerboseLogging = (enabled: boolean) => {
    setVerboseLogging(enabled);
    localStorage.setItem('verbose_logging', String(enabled));
  };

  const glmModels = [
    { value: 'glm-4-turbo', label: 'GLM-4 Turbo', description: '最新模型，快速且准确' },
    { value: 'glm-4', label: 'GLM-4', description: '稳定版本' },
    { value: 'glm-3-turbo', label: 'GLM-3 Turbo', description: '旧版模型，速度快' }
  ];

  return (
    <div className="space-y-6">
      {/* Configuration Status Overview */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">🔧 API 配置状态</h3>
        <div className="grid grid-cols-1 gap-4">
          <div className={`p-4 rounded-lg border-2 ${
            configStatus.glm.configured
              ? 'bg-green-50 border-green-200'
              : 'bg-yellow-50 border-yellow-200'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-gray-900">智谱 GLM API</div>
                <div className="text-sm text-gray-600">
                  模型: {configStatus.glm.model}
                </div>
              </div>
              <div className="text-3xl">
                {configStatus.glm.configured ? '✅' : '⚠️'}
              </div>
            </div>
            <div className="text-xs text-gray-500 mt-2">
              用于 Agent 系统（政策分析、财务评估等）
            </div>
          </div>
        </div>
      </div>

      {/* GLM API Configuration */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">🤖 智谱 GLM API 配置</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              API 密钥
            </label>
            <div className="flex space-x-3">
              <div className="flex-1 relative">
                <input
                  type={showGlmKey ? 'text' : 'password'}
                  value={glmApiKey}
                  onChange={(e) => setGlmApiKey(e.target.value)}
                  placeholder="输入智谱AI的API密钥"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => setShowGlmKey(!showGlmKey)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showGlmKey ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              获取 API 密钥: <a href="https://open.bigmodel.cn/usercenter/apikeys" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">open.bigmodel.cn</a>
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              模型选择
            </label>
            <select
              value={glmModel}
              onChange={(e) => setGlmModel(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {glmModels.map(m => (
                <option key={m.value} value={m.value}>
                  {m.label} - {m.description}
                </option>
              ))}
            </select>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={handleSaveGlmKey}
              disabled={glmSaving || !glmApiKey}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400"
            >
              {glmSaving ? '保存中...' : '保存 GLM 密钥'}
            </button>
            <button
              onClick={handleClearGlmKey}
              className="px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50"
            >
              清除
            </button>
          </div>
        </div>
      </div>

      {/* Agent Configuration */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">⚙️ Agent 系统配置</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-900">启用重试机制</div>
              <div className="text-sm text-gray-600">API 调用失败时自动重试（最多3次）</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={agentRetryEnabled}
                onChange={(e) => setAgentRetryEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-900">启用速率限制</div>
              <div className="text-sm text-gray-600">防止 API 调用过快（令牌桶算法）</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={agentRateLimitEnabled}
                onChange={(e) => setAgentRateLimitEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {agentRateLimitEnabled && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  令牌桶容量
                </label>
                <input
                  type="number"
                  value={rateLimitCapacity}
                  onChange={(e) => setRateLimitCapacity(Number(e.target.value))}
                  min="1"
                  max="100"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  填充速率 (令牌/秒)
                </label>
                <input
                  type="number"
                  value={rateLimitRefillRate}
                  onChange={(e) => setRateLimitRefillRate(Number(e.target.value))}
                  min="1"
                  max="60"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
          )}

          <button
            onClick={handleSaveAgentConfig}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            保存 Agent 配置
          </button>
        </div>
      </div>

      {/* Debug Configuration */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">🐛 调试选项</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-900">调试模式</div>
              <div className="text-sm text-gray-600">启用详细的控制台日志和错误信息</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={debugMode}
                onChange={(e) => handleToggleDebugMode(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-900">详细日志</div>
              <div className="text-sm text-gray-600">记录所有 API 请求和响应的完整内容</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={verboseLogging}
                onChange={(e) => handleToggleVerboseLogging(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* System Information */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">ℹ️ 系统信息</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">NanoClaw 版本</span>
            <span className="font-medium">1.0.0</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">配置存储位置</span>
            <span className="font-medium">localStorage (浏览器本地)</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">最后更新检查</span>
            <span className="font-medium">
              {configStatus.glm.lastChecked?.toLocaleString('zh-CN')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
