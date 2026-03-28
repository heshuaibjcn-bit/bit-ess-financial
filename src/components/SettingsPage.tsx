/**
 * Settings Page Component
 *
 * 应用设置页面，支持切换本地/云端存储模式
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useCloudProjectStore } from '@/stores/cloudProjectStore';
import { useToast } from './ui/Toast';
import { FullPageLoading } from './ui';

/**
 * 存储模式类型
 */
type StorageMode = 'local' | 'cloud';

/**
 * Settings Page Component
 */
export const SettingsPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, userProfile, signOut } = useAuth();
  const { showSuccess, showError } = useToast();
  const fetchProjects = useCloudProjectStore((state) => state.fetchProjects);

  const [storageMode, setStorageMode] = useState<StorageMode>('local');
  const [saving, setSaving] = useState(false);
  const [clearingData, setClearingData] = useState(false);

  useEffect(() => {
    // 检查是否配置了 Supabase
    const hasSupabase = !!import.meta.env.VITE_SUPABASE_URL;
    if (hasSupabase) {
      setStorageMode('cloud');
    }
  }, []);

  /**
   * 切换存储模式
   */
  const handleSwitchStorageMode = async (mode: StorageMode) => {
    if (mode === 'cloud') {
      const hasSupabase = !!import.meta.env.VITE_SUPABASE_URL;
      if (!hasSupabase) {
        showError(t('settings.noCloudConfig', { defaultValue: '未配置云端服务' }));
        return;
      }

      setSaving(true);
      // TODO: 实现数据迁移逻辑
      showSuccess(t('settings.switchedToCloud', { defaultValue: '已切换到云端模式' }));
      setSaving(false);
    } else {
      setSaving(true);
      // TODO: 实现数据下载逻辑
      showSuccess(t('settings.switchedToLocal', { defaultValue: '已切换到本地模式' }));
      setSaving(false);
    }

    setStorageMode(mode);
  };

  /**
   * 清除所有数据
   */
  const handleClearAllData = async () => {
    if (!confirm(t('settings.clearDataConfirm', { defaultValue: '确定要清除所有数据吗？此操作无法撤销。' }))) {
      return;
    }

    setClearingData(true);

    try {
      // 清除 localStorage
      localStorage.removeItem('ess_users');
      localStorage.removeItem('ess_current_user');
      localStorage.removeItem('ess_projects');
      localStorage.removeItem('ess_user_profiles');
      localStorage.removeItem('ess_project_templates');

      showSuccess(t('settings.dataCleared', { defaultValue: '数据已清除' }));

      // 登出并跳转到首页
      await signOut();
      navigate('/');
    } catch (error) {
      showError(t('settings.clearDataError', { defaultValue: '清除数据失败' }));
    } finally {
      setClearingData(false);
    }
  };

  /**
   * 导出所有数据
   */
  const handleExportAllData = () => {
    try {
      const data = {
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        user: userProfile,
        projects: fetchProjects(),
      };

      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showSuccess(t('settings.dataExported', { defaultValue: '数据已导出' }));
    } catch (error) {
      showError(t('settings.exportError', { defaultValue: '导出失败' }));
    }
  };

  if (!user) {
    return <FullPageLoading />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/')}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h1 className="text-2xl font-bold text-gray-900">
                {t('settings.title', { defaultValue: '设置' })}
              </h1>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* User Profile */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {t('settings.account', { defaultValue: '账号信息' })}
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('settings.email', { defaultValue: '邮箱' })}
              </label>
              <p className="text-gray-900">{user.email}</p>
            </div>
            {userProfile?.displayName && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('settings.displayName', { defaultValue: '显示名称' })}
                </label>
                <p className="text-gray-900">{userProfile.displayName}</p>
              </div>
            )}
            <button
              onClick={() => signOut()}
              className="text-red-600 hover:text-red-700 font-medium"
            >
              {t('settings.signOut', { defaultValue: '退出登录' })}
            </button>
          </div>
        </div>

        {/* Storage Mode */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {t('settings.storageMode', { defaultValue: '存储模式' })}
          </h2>
          <div className="space-y-4">
            {/* Local Storage Option */}
            <div
              className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                storageMode === 'local'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => handleSwitchStorageMode('local')}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">
                    {t('settings.localMode', { defaultValue: '本地存储' })}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {t('settings.localModeDesc', { defaultValue: '数据存储在浏览器中，无需网络连接' })}
                  </p>
                  <ul className="text-xs text-gray-500 mt-2 space-y-1">
                    <li>✓ {t('settings.localPros.1', { defaultValue: '零配置，开箱即用' })}</li>
                    <li>✓ {t('settings.localPros.2', { defaultValue: '隐私保护，数据不上传' })}</li>
                    <li>⚠ {t('settings.localCons.1', { defaultValue: '清除浏览器数据会丢失所有项目' })}</li>
                  </ul>
                </div>
                <div className="w-5 h-5">
                  {storageMode === 'local' && (
                    <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 001.414-1.414l-2-2a1 1 0 00-1.414 0L4 9.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a2 2 0 002-2V5a1 1 0 00-1-1H6a1 1 0 00-1 1v7a2 2 0 002 2h3a1 1 0 001-1v-4.586l1.293-1.293a1 1 0 001.414-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </div>
              </div>
            </div>

            {/* Cloud Storage Option */}
            <div
              className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                storageMode === 'cloud'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => handleSwitchStorageMode('cloud')}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">
                    {t('settings.cloudMode', { defaultValue: '云端存储' })}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {t('settings.cloudModeDesc', { defaultValue: '使用 Supabase 云端数据库' })}
                  </p>
                  <ul className="text-xs text-gray-500 mt-2 space-y-1">
                    <li>✓ {t('settings.cloudPros.1', { defaultValue: '多设备同步' })}</li>
                    <li>✓ {t('settings.cloudPros.2', { defaultValue: '云端自动备份' })}</li>
                    <li>⚠ {t('settings.cloudCons.1', { defaultValue: '需要配置 Supabase' })}</li>
                  </ul>
                </div>
                <div className="w-5 h-5">
                  {storageMode === 'cloud' && (
                    <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 001.414-1.414l-2-2a1 1 0 00-1.414 0L4 9.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a2 2 0 002 2h3a1 1 0 001-1v-4.586l1.293-1.293a1 1 0 001.414-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Data Management */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {t('settings.dataManagement', { defaultValue: '数据管理' })}
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h3 className="font-medium text-gray-900">{t('settings.exportAll', { defaultValue: '导出所有数据' })}</h3>
                <p className="text-sm text-gray-600">{t('settings.exportAllDesc', { defaultValue: '下载完整数据备份' })}</p>
              </div>
              <button
                onClick={handleExportAllData}
                className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 transition-colors"
              >
                {t('settings.export', { defaultValue: '导出' })}
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-lg">
              <div>
                <h3 className="font-medium text-red-900">{t('settings.clearAllData', { defaultValue: '清除所有数据' })}</h3>
                <p className="text-sm text-red-700">{t('settings.clearAllDataDesc', { defaultValue: '删除所有项目和账号信息，不可恢复' })}</p>
              </div>
              <button
                onClick={handleClearAllData}
                disabled={clearingData}
                className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 transition-colors disabled:bg-red-400 disabled:cursor-not-allowed"
              >
                {clearingData
                  ? t('settings.clearing', { defaultValue: '清除中...' })
                  : t('settings.clear', { defaultValue: '清除' })
                }
              </button>
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">
            {t('settings.storageInfo', { defaultValue: '关于存储模式' })}
          </h3>
          <p className="text-sm text-blue-800">
            {t('settings.storageInfoDesc', { defaultValue: '本地模式适合个人使用，数据完全在浏览器中。云端模式需要配置 Supabase，支持多设备访问。可以随时在两种模式间切换。' })}
          </p>
          <p className="text-sm text-blue-800 mt-2">
            {t('settings.storageInfoTip', { defaultValue: '建议定期导出数据备份，以防数据丢失。' })}
          </p>
        </div>
      </main>
    </div>
  );
};

export default SettingsPage;
