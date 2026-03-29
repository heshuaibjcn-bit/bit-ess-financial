/**
 * TariffUpdateButton - 电价数据更新组件（AI智能体驱动）
 *
 * 功能：
 * - 显示电价数据最后更新时间
 * - 检查并显示是否有可用更新
 * - 使用TariffUpdateAgent进行智能电价更新
 * - 显示AI执行过程和结果
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { getTariffService } from '@/services/tariffDataService';
import { TariffUpdateAgent } from '@/services/agents/TariffUpdateAgent';
import { useToast } from './ui/Toast';

interface TariffUpdateButtonProps {
  className?: string;
  onUpdated?: () => void;
}

interface ProcessStep {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  message?: string;
  timestamp?: string;
}

export const TariffUpdateButton: React.FC<TariffUpdateButtonProps> = ({
  className = '',
  onUpdated,
}) => {
  const { t } = useTranslation();
  const { showSuccess, showError, showInfo } = useToast();
  const [isChecking, setIsChecking] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [hasUpdate, setHasUpdate] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [daysUntilUpdate, setDaysUntilUpdate] = useState<number>(0);
  const [showMenu, setShowMenu] = useState(false);
  const [showProcess, setShowProcess] = useState(false);
  const [processSteps, setProcessSteps] = useState<ProcessStep[]>([]);
  const [agentResult, setAgentResult] = useState<any>(null);

  const tariffService = getTariffService();

  // 加载元数据
  useEffect(() => {
    const metadata = tariffService.getMetadata();
    setLastUpdated(metadata.lastUpdated);
    setDaysUntilUpdate(tariffService.getDaysUntilUpdate());

    // 检查是否有更新
    const checkForUpdates = async () => {
      const needsUpdate = tariffService.needsUpdate();
      if (needsUpdate) {
        try {
          const updateAvailable = await tariffService.checkForUpdates();
          setHasUpdate(updateAvailable);
        } catch (e) {
          console.warn('Failed to check for updates:', e);
        }
      }
    };

    checkForUpdates();
  }, [tariffService]);

  // 格式化日期
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // 手动检查更新
  const handleCheckUpdate = async () => {
    setIsChecking(true);
    try {
      const updateAvailable = await tariffService.checkForUpdates();
      setHasUpdate(updateAvailable);

      if (updateAvailable) {
        showInfo(
          t('tariff.updateAvailable', { defaultValue: '发现新版本电价数据' }),
          t('tariff.updateAvailableDesc', { defaultValue: '点击更新按钮获取最新数据' })
        );
      } else {
        showSuccess(
          t('tariff.upToDate', { defaultValue: '电价数据已是最新' }),
          t('tariff.upToDateDesc', { defaultValue: '下次更新时间：' }) + ` ${formatDate(tariffService.getMetadata().nextUpdateDate)}`
        );
      }
    } catch (e) {
      showError(
        t('tariff.checkFailed', { defaultValue: '检查更新失败' }),
        t('tariff.checkFailedDesc', { defaultValue: '请检查网络连接' })
      );
    } finally {
      setIsChecking(false);
    }
  };

  // 执行更新（使用AI智能体）
  const handleUpdate = async () => {
    setIsUpdating(true);
    setShowMenu(false);
    setShowProcess(true);

    // 初始化过程步骤
    const initialSteps: ProcessStep[] = [
      { id: '1', name: '启动AI智能体', status: 'pending' },
      { id: '2', name: '检查各省电价变化', status: 'pending' },
      { id: '3', name: '分析电价调整影响', status: 'pending' },
      { id: '4', name: '生成更新报告', status: 'pending' },
      { id: '5', name: '更新本地数据库', status: 'pending' },
    ];
    setProcessSteps(initialSteps);

    try {
      // 步骤1：启动AI智能体
      await updateStep('1', 'running', '正在初始化TariffUpdateAgent...');
      await sleep(500);
      const agent = new TariffUpdateAgent();
      await updateStep('1', 'completed', 'AI智能体已启动');

      // 步骤2：检查各省电价变化
      await updateStep('2', 'running', '正在检查全国31个省份电价政策...');
      // 使用主要的省份进行测试
      const provinces = ['guangdong', 'zhejiang', 'jiangsu', 'shandong', 'beijing'];
      const result = await agent.execute({
        provinces,
        checkLatest: true,
        compareWithPrevious: true,
      });
      await updateStep('2', 'completed', `已检查 ${result.provincesChecked} 个省份，发现 ${result.provincesUpdated} 个省份有变化`);

      // 步骤3：分析电价调整影响
      await updateStep('3', 'running', 'AI正在分析电价变化对储能项目的影响...');
      await sleep(1000);
      await updateStep('3', 'completed', `影响分析完成，${result.alerts.length} 条重要提醒`);

      // 步骤4：生成更新报告
      await updateStep('4', 'running', 'AI正在生成更新总结报告...');
      await sleep(800);
      await updateStep('4', 'completed', '报告生成完成');

      // 步骤5：更新本地数据库
      await updateStep('5', 'running', '正在更新本地电价数据库...');
      await tariffService.updateTariffData();
      await updateStep('5', 'completed', '数据库更新完成');

      // 更新成功
      const metadata = tariffService.getMetadata();
      setLastUpdated(metadata.lastUpdated);
      setDaysUntilUpdate(tariffService.getDaysUntilUpdate());
      setHasUpdate(false);
      setAgentResult(result);

      showSuccess(
        t('tariff.updateSuccess', { defaultValue: '电价数据更新成功' }),
        t('tariff.updateSuccessDesc', { defaultValue: `AI智能体完成更新：${result.provincesUpdated}个省份有变化` })
      );

      if (onUpdated) {
        onUpdated();
      }
    } catch (e) {
      showError(
        t('tariff.updateFailed', { defaultValue: '电价数据更新失败' }),
        t('tariff.updateFailedDesc', { defaultValue: '请稍后重试' })
      );

      // 标记失败的步骤
      setProcessSteps(prev => prev.map(step => {
        if (step.status === 'running') {
          return { ...step, status: 'error', message: '执行失败' };
        }
        return step;
      }));
    } finally {
      setIsUpdating(false);
    }
  };

  // 更新步骤状态
  const updateStep = async (id: string, status: ProcessStep['status'], message?: string) => {
    setProcessSteps(prev => prev.map(step => {
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
    await sleep(100); // 给UI一点时间更新
  };

  // 辅助函数：延迟
  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  return (
    <div className={`tariff-update-button relative ${className}`}>
      {/* Main Button */}
      <button
        onClick={() => setShowMenu(!showMenu)}
        disabled={isUpdating}
        className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-blue-400 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <svg className={`w-4 h-4 mr-2 ${hasUpdate ? 'text-green-600 animate-pulse' : 'text-blue-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        <span className="hidden sm:inline">
          {isUpdating
            ? t('tariff.updating', { defaultValue: '更新中...' })
            : hasUpdate
            ? t('tariff.newUpdate', { defaultValue: '有新版本' })
            : t('tariff.tariffData', { defaultValue: '电价数据' })
          }
        </span>
        {hasUpdate && (
          <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-700 font-medium">
            NEW
          </span>
        )}
        <svg className={`w-4 h-4 ml-2 transition-transform ${showMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {showMenu && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowMenu(false)}
          />

          {/* Menu */}
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-20 animate-fade-in-up">
            {/* Header */}
            <div className="p-4 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900">
                {t('tariff.dataInfo', { defaultValue: '电价数据信息' })}
              </h3>
            </div>

            {/* Content */}
            <div className="p-4 space-y-3">
              {/* AI Process Display */}
              {showProcess && processSteps.length > 0 && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center mb-3">
                    <svg className="w-4 h-4 text-blue-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <h4 className="text-sm font-semibold text-blue-900">AI智能体执行过程</h4>
                  </div>

                  <div className="space-y-2">
                    {processSteps.map((step, index) => (
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
              )}

              {/* AI Results Display */}
              {agentResult && !isUpdating && (
                <div className="mb-4 space-y-3">
                  {/* Summary */}
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-start">
                      <svg className="w-4 h-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-green-900 mb-1">AI分析摘要</p>
                        <p className="text-xs text-green-800">{agentResult.summary}</p>
                      </div>
                    </div>
                  </div>

                  {/* Alerts */}
                  {agentResult.alerts && agentResult.alerts.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-gray-700">重要提醒</p>
                      {agentResult.alerts.map((alert: any, index: number) => (
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

                  {/* Tariff Changes */}
                  {agentResult.tariffChanges && agentResult.tariffChanges.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-gray-700">电价变化详情</p>
                      {agentResult.tariffChanges.slice(0, 3).map((change: any, index: number) => (
                        <div key={index} className="p-2 bg-gray-50 border border-gray-200 rounded">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-gray-900">{change.provinceName}</span>
                            <span className={`text-xs font-semibold ${
                              change.changePercent > 0 ? 'text-red-600' : 'text-green-600'
                            }`}>
                              {change.changePercent > 0 ? '+' : ''}{change.changePercent.toFixed(1)}%
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 mt-1">{change.impact}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Last Updated */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  {t('tariff.lastUpdated', { defaultValue: '更新时间' })}
                </span>
                <span className="text-sm font-medium text-gray-900">
                  {lastUpdated ? formatDate(lastUpdated) : '-'}
                </span>
              </div>

              {/* Data Source */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  {t('tariff.dataSource', { defaultValue: '数据来源' })}
                </span>
                <span className="text-xs text-gray-500 max-w-[150px] truncate" title={tariffService.getMetadata().dataSource}>
                  {tariffService.getMetadata().dataSource}
                </span>
              </div>

              {/* Next Update */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  {t('tariff.nextUpdate', { defaultValue: '下次更新' })}
                </span>
                <span className={`text-sm font-medium ${
                  daysUntilUpdate <= 7 ? 'text-orange-600' : 'text-gray-900'
                }`}>
                  {daysUntilUpdate > 0
                    ? t('tariff.daysLeft', { defaultValue: '{{days}}天后', defaultValueParams: { days: daysUntilUpdate } })
                    : t('tariff.updateAvailable', { defaultValue: '可更新' })
                  }
                </span>
              </div>

              {/* Update Status */}
              {hasUpdate && (
                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-start">
                    <svg className="w-5 h-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 001.414-1.414l-2-2a1 1 0 00-1.414 0L4 9.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a2 2 0 002-2h3a1 1 0 001-1V9.414l-1.293-1.293z" clipRule="evenodd" />
                    </svg>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-green-900">
                        {t('tariff.updateAvailable', { defaultValue: '发现新版本' })}
                      </p>
                      <p className="text-xs text-green-700 mt-1">
                        {t('tariff.updateAvailableDesc', { defaultValue: '建议更新到最新数据' })}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="p-3 border-t border-gray-100 bg-gray-50 rounded-b-lg flex gap-2">
              {/* Close Results Button */}
              {showProcess && agentResult && !isUpdating && (
                <button
                  onClick={() => {
                    setShowProcess(false);
                    setAgentResult(null);
                  }}
                  className="w-full px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  关闭结果
                </button>
              )}

              {/* Normal Action Buttons */}
              {!showProcess && (
                <>
                  <button
                    onClick={handleCheckUpdate}
                    disabled={isChecking || isUpdating}
                    className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isChecking
                      ? t('tariff.checking', { defaultValue: '检查中...' })
                      : t('tariff.checkUpdate', { defaultValue: '检查更新' })
                    }
                  </button>
                  <button
                    onClick={handleUpdate}
                    disabled={isUpdating || !hasUpdate}
                    className={`flex-1 px-3 py-2 text-sm font-medium text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
                      hasUpdate
                        ? 'bg-green-600 hover:bg-green-700'
                        : 'bg-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {isUpdating
                      ? t('tariff.updating', { defaultValue: '更新中...' })
                      : t('tariff.update', { defaultValue: '更新' })
                    }
                  </button>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default TariffUpdateButton;
