/**
 * TariffUpdateButton - 电价数据更新组件
 *
 * 功能：
 * - 显示电价数据最后更新时间
 * - 检查并显示是否有可用更新
 * - 手动触发电价数据更新
 * - 显示更新进度和结果
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { getTariffService } from '@/services/tariffDataService';
import { useToast } from './ui/Toast';

interface TariffUpdateButtonProps {
  className?: string;
  onUpdated?: () => void;
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

  // 执行更新
  const handleUpdate = async () => {
    setIsUpdating(true);
    setShowMenu(false);

    try {
      await tariffService.updateTariffData();

      const metadata = tariffService.getMetadata();
      setLastUpdated(metadata.lastUpdated);
      setDaysUntilUpdate(tariffService.getDaysUntilUpdate());
      setHasUpdate(false);

      showSuccess(
        t('tariff.updateSuccess', { defaultValue: '电价数据更新成功' }),
        t('tariff.updateSuccessDesc', { defaultValue: `数据来源：${metadata.dataSource}` })
      );

      if (onUpdated) {
        onUpdated();
      }
    } catch (e) {
      showError(
        t('tariff.updateFailed', { defaultValue: '电价数据更新失败' }),
        t('tariff.updateFailedDesc', { defaultValue: '请稍后重试' })
      );
    } finally {
      setIsUpdating(false);
    }
  };

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
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default TariffUpdateButton;
