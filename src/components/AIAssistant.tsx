/**
 * AI 助手组件
 *
 * 轻量级储能项目咨询助手界面
 */

import { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Sparkles, Settings, Key } from 'lucide-react';
import { getEnergyAssistant, EnergyStorageAssistant, type Message } from '../services/energyStorageAssistant';
import { AI_CONFIG } from '../config/aiConfig';

interface AIAssistantProps {
  className?: string;
  // 可选的上下文信息
  context?: {
    province?: string;
    voltage?: string;
    monthlyUsage?: number;
    peakLoad?: number;
  };
}

export function AIAssistant({ className = '', context }: AIAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [apiKey, setApiKeyInput] = useState('');
  const [history, setHistory] = useState<Message[]>([]);
  const [isAvailable, setIsAvailable] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const assistant = getEnergyAssistant();

  // 检查助手是否可用
  useEffect(() => {
    setIsAvailable(assistant.isAvailable());
  }, [assistant]);

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [answer, history]);

  const toggleOpen = () => setIsOpen(!isOpen);

  const handleAsk = async (q?: string) => {
    const questionToAsk = q || question;
    if (!questionToAsk.trim() || loading) return;

    setLoading(true);
    setQuestion('');

    try {
      // 构建增强的问题（如果有上下文）
    let enhancedQuestion = questionToAsk;
    if (context?.province && context?.voltage) {
      enhancedQuestion = `关于${context.province}${context.voltage}的电价：${questionToAsk}`;
    }

      const response = await assistant.ask(enhancedQuestion);
      setAnswer(response);

      // 更新历史记录
      setHistory(assistant.getHistory());
    } catch (error) {
      setAnswer(error instanceof Error ? error.message : '抱歉，我无法回答这个问题。');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickQuestion = (qq: string) => {
    setQuestion(qq);
    handleAsk(qq);
  };

  const handleSetApiKey = () => {
    if (apiKey.trim()) {
      EnergyStorageAssistant.setUserApiKey(apiKey.trim());
      setShowSettings(false);
      setApiKeyInput('');
      // 重新检查可用性
      setTimeout(() => setIsAvailable(assistant.isAvailable()), 100);
    }
  };

  const handleClearHistory = () => {
    assistant.clearHistory();
    setHistory([]);
    setAnswer('');
  };

  if (!isOpen) {
    return (
      <button
        onClick={toggleOpen}
        className={`fixed bottom-6 right-6 z-50 bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg transition-all duration-200 hover:scale-110 ${className}`}
        title="打开储能项目助手"
      >
        <MessageCircle className="w-6 h-6" />
        <span className="absolute -top-1 -right-1 bg-green-500 w-3 h-3 rounded-full border-2 border-white"></span>
      </button>
    );
  }

  return (
    <div className={`fixed bottom-6 right-6 z-50 w-96 ${className}`}>
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              <h3 className="font-semibold text-lg">储能项目助手</h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-1 hover:bg-white/10 rounded transition-colors"
                title="设置"
              >
                <Settings className="w-4 h-4" />
              </button>
              <button
                onClick={toggleOpen}
                className="p-1 hover:bg-white/10 rounded transition-colors"
                title="关闭"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          {!isAvailable && (
            <div className="mt-2 text-xs bg-yellow-500/20 px-2 py-1 rounded text-yellow-100">
              ⚠️ 请先设置 API Key
            </div>
          )}
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="p-4 bg-gray-50 border-b border-gray-200">
            <div className="space-y-3">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <Key className="w-4 h-4" />
                  Anthropic API Key
                </label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder="sk-ant-..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  API Key 将安全存储在本地浏览器中
                </p>
              </div>
              <button
                onClick={handleSetApiKey}
                disabled={!apiKey.trim()}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                保存 API Key
              </button>
              {AI_CONFIG.apiKey.get() && (
                <button
                  onClick={() => {
                    EnergyStorageAssistant.clearUserApiKey();
                    setIsAvailable(false);
                  }}
                  className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  清除 API Key
                </button>
              )}
            </div>
          </div>
        )}

        {/* Chat Area */}
        <div className="h-[500px] flex flex-col">
          {/* Quick Questions */}
          {history.length === 0 && !answer && (
            <div className="p-4 border-b border-gray-100">
              <p className="text-xs text-gray-500 mb-2">快速提问：</p>
              <div className="flex flex-wrap gap-2">
                {AI_CONFIG.quickQuestions.map((qq, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleQuickQuestion(qq)}
                    className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-1.5 rounded-full transition-colors"
                  >
                    {qq}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {history.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {answer && (
              <div className="flex justify-start">
                <div className="max-w-[80%] rounded-2xl px-4 py-2 text-sm bg-gray-100 text-gray-900">
                  <div className="whitespace-pre-wrap">{answer}</div>
                </div>
              </div>
            )}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-2xl px-4 py-2 text-sm text-gray-500">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex gap-2">
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAsk()}
                placeholder="请输入问题..."
                disabled={loading || !isAvailable}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
              <button
                onClick={() => handleAsk()}
                disabled={loading || !isAvailable || !question.trim()}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white p-2 rounded-lg transition-colors"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
            {history.length > 0 && (
              <button
                onClick={handleClearHistory}
                className="mt-2 text-xs text-gray-500 hover:text-gray-700 transition-colors"
              >
                清空对话记录
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
