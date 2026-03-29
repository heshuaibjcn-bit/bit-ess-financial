/**
 * API Configuration Component
 *
 * Interface for configuring GLM API key and model settings
 */

import React, { useState, useEffect } from 'react';
import { getSettingsManager } from '@/config/Settings';

interface APIConfigProps {
  onUpdate?: () => void;
}

export const APIConfig: React.FC<APIConfigProps> = ({ onUpdate }) => {
  const settingsManager = getSettingsManager();

  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('glm-4-turbo');
  const [isConfigured, setIsConfigured] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{ valid: boolean; message: string } | null>(null);
  const [showApiKey, setShowApiKey] = useState(false);

  // Load current settings on mount
  useEffect(() => {
    const settings = settingsManager.getAllSettings();
    setApiKey(settings.glm.apiKey);
    setModel(settings.glm.model);
    setIsConfigured(settingsManager.isGLMConfigured());
  }, []);

  // Handle save
  const handleSave = async () => {
    setIsValidating(true);

    // Validate API key
    const validation = settingsManager.validateApiKey(apiKey);
    setValidationResult(validation);

    if (validation.valid) {
      // Save to settings
      settingsManager.updateGLMApiKey(apiKey);
      settingsManager.updateSettings({
        glm: {
          ...settingsManager.getSetting('glm'),
          model
        }
      });

      setIsConfigured(true);
      if (onUpdate) onUpdate();
    }

    setIsValidating(false);
  };

  // Handle test connection
  const handleTestConnection = async () => {
    if (!apiKey) {
      alert('Please enter an API key first');
      return;
    }

    // This would make a test call to the GLM API
    // For now, just show a success message
    alert('Connection test feature coming soon!\n\nThe API key will be validated when you first run an agent.');
  };

  // Handle clear
  const handleClear = () => {
    setApiKey('');
    settingsManager.updateGLMApiKey('');
    setIsConfigured(false);
    setValidationResult(null);
    if (onUpdate) onUpdate();
  };

  const models = [
    { value: 'glm-4-turbo', label: 'GLM-4 Turbo', description: 'Latest model, fast and accurate' },
    { value: 'glm-4', label: 'GLM-4', description: 'Previous version, stable' },
    { value: 'glm-3-turbo', label: 'GLM-3 Turbo', description: 'Older model, faster but less capable' }
  ];

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">GLM API Configuration</h3>
        <p className="text-sm text-gray-600">
          Configure your GLM (智谱AI) API key to enable real agent execution instead of mock data.
        </p>
      </div>

      {/* Configuration Status */}
      <div className={`mb-6 p-4 rounded-lg border-2 ${
        isConfigured
          ? 'bg-green-50 border-green-200'
          : 'bg-yellow-50 border-yellow-200'
      }`}>
        <div className="flex items-center">
          <span className="text-2xl mr-3">
            {isConfigured ? '✅' : '⚠️'}
          </span>
          <div>
            <div className={`font-semibold ${isConfigured ? 'text-green-900' : 'text-yellow-900'}`}>
              {isConfigured ? 'API Configured' : 'Not Configured'}
            </div>
            <div className={`text-sm ${isConfigured ? 'text-green-700' : 'text-yellow-700'}`}>
              {isConfigured
                ? 'Agents will use real GLM API'
                : 'Agents will use mock data for demonstration'
              }
            </div>
          </div>
        </div>
      </div>

      {/* API Key Input */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          API Key
        </label>
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <input
              type={showApiKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your GLM API key"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 pr-20 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <button
              type="button"
              onClick={() => setShowApiKey(!showApiKey)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showApiKey ? '👁️' : '👁️‍🗨️'}
            </button>
          </div>
        </div>
        {validationResult && !validationResult.valid && (
          <p className="mt-2 text-sm text-red-600">{validationResult.message}</p>
        )}
        <p className="mt-2 text-xs text-gray-500">
          Get your API key from{' '}
          <a
            href="https://open.bigmodel.cn/usercenter/apikeys"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            open.bigmodel.cn
          </a>
        </p>
      </div>

      {/* Model Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Model
        </label>
        <select
          value={model}
          onChange={(e) => setModel(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          {models.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label} - {m.description}
            </option>
          ))}
        </select>
      </div>

      {/* Buttons */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={handleSave}
          disabled={isValidating || !apiKey}
          className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-2 px-6 rounded-lg"
        >
          {isValidating ? 'Saving...' : 'Save Configuration'}
        </button>
        <button
          onClick={handleTestConnection}
          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700"
        >
          Test Connection
        </button>
        <button
          onClick={handleClear}
          className="px-4 py-2 border border-red-300 rounded-lg hover:bg-red-50 text-red-700"
        >
          Clear
        </button>
      </div>

      {/* Help Section */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h4 className="font-semibold text-blue-900 mb-2">💡 Setup Instructions</h4>
        <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
          <li>
            Visit{' '}
            <a
              href="https://open.bigmodel.cn/usercenter/apikeys"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              open.bigmodel.cn
            </a>
            {' '}and sign in
          </li>
          <li>Create a new API key (or use an existing one)</li>
          <li>Copy the API key and paste it above</li>
          <li>Select your preferred model (GLM-4 Turbo recommended)</li>
          <li>Click "Save Configuration"</li>
          <li>Test the connection to verify it works</li>
        </ol>
      </div>
    </div>
  );
};
