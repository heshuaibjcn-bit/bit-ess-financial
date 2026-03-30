/**
 * 电价数据库管理界面
 *
 * 使用本地 IndexedDB 数据库实现
 */

import React, { useState, useEffect } from 'react';
import { Database, RefreshCw, History, Download, Upload, Bot, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { getLocalTariffRepository } from '@/repositories/LocalTariffRepository';
import { getLocalTariffUpdateAgent } from '@/services/agents/LocalTariffUpdateAgent';
import type {
  TariffProvince,
  TariffVersion,
  TariffData,
  TimePeriod,
  UpdateLog
} from '@/repositories/LocalTariffRepository';
import type { UpdateResult, DataSource } from '@/services/agents/LocalTariffUpdateAgent';

export function TariffDatabaseManagement() {
  const [selectedProvince, setSelectedProvince] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingProvince, setLoadingProvince] = useState(false);
  const [provinces, setProvinces] = useState<TariffProvince[]>([]);
  const [provinceDetail, setProvinceDetail] = useState<any>(null);
  const [updateLogs, setUpdateLogs] = useState<UpdateLog[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<UpdateLog[]>([]);
  const [updateResults, setUpdateResults] = useState<UpdateResult[]>([]);
  const [isCheckingUpdates, setIsCheckingUpdates] = useState(false);
  const [showDataSources, setShowDataSources] = useState(false);
  const [provinceError, setProvinceError] = useState<string | null>(null);

  const repository = getLocalTariffRepository();
  const agent = getLocalTariffUpdateAgent();

  // 初始化数据库和加载数据
  useEffect(() => {
    initializeDatabase();
  }, []);

  const initializeDatabase = async () => {
    try {
      setLoading(true);
      await repository.initialize();
      await loadProvinces();
      await loadPendingApprovals();
    } catch (error) {
      console.error('Failed to initialize database:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadProvinces = async () => {
    const data = await repository.getProvinces();
    setProvinces(data);
  };

  const loadPendingApprovals = async () => {
    const pending = await repository.getPendingApprovals();
    setPendingApprovals(pending);
  };

  const loadProvinceDetail = async (provinceCode: string) => {
    setLoadingProvince(true);
    setProvinceError(null);
    try {
      const detail = await repository.getActiveTariffByProvince(provinceCode);
      setProvinceDetail(detail);

      if (!detail) {
        setProvinceError(`该省份暂无电价数据`);
      }

      // 加载该省份的更新日志
      const logs = await repository.getUpdateLogs(provinceCode, 10);
      setUpdateLogs(logs);
    } catch (error) {
      console.error('Failed to load province detail:', error);
      setProvinceError('加载省份数据失败：' + (error as Error).message);
    } finally {
      setLoadingProvince(false);
    }
  };

  const handleProvinceChange = (code: string) => {
    setSelectedProvince(code);
    if (code) {
      loadProvinceDetail(code);
    } else {
      setProvinceDetail(null);
      setUpdateLogs([]);
      setProvinceError(null);
    }
  };

  const handleExportData = async () => {
    try {
      const jsonData = await repository.exportData();
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tariff-database-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export data:', error);
      alert('导出失败，请查看控制台错误');
    }
  };

  const handleImportData = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        await repository.importData(text);
        alert('导入成功！');
        await loadProvinces();
        if (selectedProvince) {
          loadProvinceDetail(selectedProvince);
        }
      } catch (error) {
        console.error('Failed to import data:', error);
        alert('导入失败，请检查文件格式');
      }
    };
    input.click();
  };

  const handleApprove = async (updateId: string) => {
    try {
      await repository.approveUpdate(updateId, 'admin');
      alert('审批通过！');
      await loadPendingApprovals();
      if (selectedProvince) {
        loadProvinceDetail(selectedProvince);
      }
    } catch (error) {
      console.error('Failed to approve:', error);
      alert('审批失败：' + (error as Error).message);
    }
  };

  const handleReject = async (updateId: string) => {
    const reason = prompt('请输入拒绝原因：');
    if (!reason) return;

    try {
      await repository.rejectUpdate(updateId, 'admin', reason);
      alert('已拒绝更新');
      await loadPendingApprovals();
    } catch (error) {
      console.error('Failed to reject:', error);
      alert('操作失败：' + (error as Error).message);
    }
  };

  const handleCheckSingleUpdate = async () => {
    if (!selectedProvince) {
      alert('请先选择省份');
      return;
    }

    setIsCheckingUpdates(true);
    setUpdateResults([]);

    try {
      const result = await agent.checkProvinceUpdate(selectedProvince);
      setUpdateResults([result]);

      if (result.success) {
        alert(`检查完成！${result.requiresApproval ? '新数据需要审批' : '无新数据'}`);
        await loadPendingApprovals();
      } else {
        alert(`检查失败：${result.error}`);
      }
    } catch (error) {
      console.error('Failed to check update:', error);
      alert('检查更新失败：' + (error as Error).message);
    } finally {
      setIsCheckingUpdates(false);
    }
  };

  const handleCheckAllUpdates = async () => {
    setIsCheckingUpdates(true);
    setUpdateResults([]);

    try {
      const results = await agent.checkAllProvinces();
      setUpdateResults(results);

      const successCount = results.filter(r => r.success).length;
      const newVersionCount = results.filter(r => r.success && r.requiresApproval).length;

      alert(`检查完成！\n成功：${successCount}/${results.length}\n新版本：${newVersionCount} 个`);

      if (newVersionCount > 0) {
        await loadPendingApprovals();
      }
    } catch (error) {
      console.error('Failed to check updates:', error);
      alert('批量检查失败：' + (error as Error).message);
    } finally {
      setIsCheckingUpdates(false);
    }
  };

  const toggleDataSource = (sourceName: string, enabled: boolean) => {
    agent.toggleDataSource(sourceName, enabled);
    // Force re-render to show updated state
    setShowDataSources(false);
    setShowDataSources(true);
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600">正在初始化电价数据库...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* 页头 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Database className="w-8 h-8" />
            全国电价数据库
          </h1>
          <p className="text-muted-foreground mt-2">
            管理全国{provinces.length}个省份的电价数据、版本历史和智能更新
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExportData}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            导出数据
          </button>
          <button
            onClick={handleImportData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            导入数据
          </button>
          <button
            onClick={handleCheckSingleUpdate}
            disabled={!selectedProvince || isCheckingUpdates}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Bot className="w-4 h-4" />
            {isCheckingUpdates ? '检查中...' : '检查当前省份'}
          </button>
          <button
            onClick={handleCheckAllUpdates}
            disabled={isCheckingUpdates}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-4 h-4 ${isCheckingUpdates ? 'animate-spin' : ''}`} />
            {isCheckingUpdates ? '检查中...' : '检查所有省份'}
          </button>
        </div>
      </div>

      {/* 功能说明 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">🚀 功能特性</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="flex items-start space-x-3">
            <span className="text-2xl">💾</span>
            <div>
              <h3 className="font-semibold text-gray-900">本地数据库</h3>
              <p className="text-sm text-gray-600">IndexedDB 存储，支持离线访问</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <span className="text-2xl">🤖</span>
            <div>
              <h3 className="font-semibold text-gray-900">AI智能更新</h3>
              <p className="text-sm text-gray-600">自动解析电价通知，智能数据验证</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <span className="text-2xl">📊</span>
            <div>
              <h3 className="font-semibold text-gray-900">版本控制</h3>
              <p className="text-sm text-gray-600">完整的变更历史和版本对比</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <span className="text-2xl">✅</span>
            <div>
              <h3 className="font-semibold text-gray-900">审批流程</h3>
              <p className="text-sm text-gray-600">管理员审核机制，确保数据准确性</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <span className="text-2xl">📦</span>
            <div>
              <h3 className="font-semibold text-gray-900">导入导出</h3>
              <p className="text-sm text-gray-600">支持 JSON 格式的数据迁移</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <span className="text-2xl">🔒</span>
            <div>
              <h3 className="font-semibold text-gray-900">数据安全</h3>
              <p className="text-sm text-gray-600">本地存储，完全掌控数据</p>
            </div>
          </div>
        </div>
      </div>

      {/* 省份选择 */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">选择省份</h2>
        <select
          value={selectedProvince}
          onChange={(e) => handleProvinceChange(e.target.value)}
          className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="">请选择省份</option>
          {provinces.map((province) => (
            <option key={province.id} value={province.code}>
              {province.name} ({province.region} - {province.gridCompany})
            </option>
          ))}
        </select>
      </div>

      {/* 选中省份的详情 */}
      {selectedProvince && (
        <div className="space-y-6">
          {/* 加载状态 */}
          {loadingProvince && (
            <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
              <p className="text-gray-600">正在加载省份数据...</p>
            </div>
          )}

          {/* 错误提示 */}
          {provinceError && !loadingProvince && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <div className="flex items-start space-x-3">
                <span className="text-2xl">⚠️</span>
                <div>
                  <h3 className="font-semibold text-yellow-900">数据未找到</h3>
                  <p className="text-sm text-yellow-800 mt-1">{provinceError}</p>
                  <p className="text-sm text-yellow-700 mt-2">
                    当前系统中有 {provinces.filter(p => ['GD', 'ZJ', 'JS', 'SD', 'SH', 'BJ'].includes(p.code)).length} 个省份包含电价数据。
                  </p>
                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => handleCheckSingleUpdate()}
                      className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition"
                    >
                      使用 AI 检查该省份数据
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 省份详情 */}
          {!loadingProvince && provinceDetail && (
            <div className="space-y-6">
              {/* 基本信息 */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">基本信息</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">省份</label>
                    <p className="text-lg">{provinceDetail.province.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">区域</label>
                    <p className="text-lg">{provinceDetail.province.region}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">电网公司</label>
                    <p className="text-lg">{provinceDetail.province.gridCompany}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">当前版本</label>
                    <p className="text-lg">{provinceDetail.version.version}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">生效日期</label>
                    <p className="text-lg">
                      {new Date(provinceDetail.version.effectiveDate).toLocaleDateString('zh-CN')}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">状态</label>
                    <p className="text-lg">
                      <span className={`px-2 py-1 rounded text-sm ${
                        provinceDetail.version.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {provinceDetail.version.status === 'active' ? '生效中' : '未生效'}
                      </span>
                    </p>
                  </div>
                </div>
                {provinceDetail.version.policyNumber && (
                  <div className="mt-4">
                    <label className="text-sm font-medium text-gray-600">政策文号</label>
                    <p className="text-lg">{provinceDetail.version.policyNumber}</p>
                  </div>
                )}
                {provinceDetail.version.policyTitle && (
                  <div className="mt-2">
                    <label className="text-sm font-medium text-gray-600">政策标题</label>
                    <p className="text-sm text-gray-700">{provinceDetail.version.policyTitle}</p>
                  </div>
                )}
              </div>

              {/* 电价数据 */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">电价数据</h2>
                {provinceDetail.tariffs && provinceDetail.tariffs.length > 0 ? (
                  <div className="space-y-4">
                    {provinceDetail.tariffs.map((tariff: TariffData) => (
                      <div key={tariff.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold">{tariff.voltageLevel}</h4>
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            {tariff.tariffType === 'large_industrial' ? '大工业' :
                             tariff.tariffType === 'industrial' ? '一般工商业' :
                             tariff.tariffType === 'commercial' ? '商业' :
                             tariff.tariffType === 'residential' ? '居民' : '农业'}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">峰时：</span>
                            <span className="font-semibold">¥{tariff.peakPrice.toFixed(3)}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">平时：</span>
                            <span className="font-semibold">¥{tariff.flatPrice.toFixed(3)}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">谷时：</span>
                            <span className="font-semibold">¥{tariff.valleyPrice.toFixed(3)}</span>
                          </div>
                        </div>
                        <div className="mt-2 text-sm">
                          <span className="text-gray-600">峰谷价差：</span>
                          <span className="font-semibold text-green-600">
                            ¥{(tariff.peakPrice - tariff.valleyPrice).toFixed(3)}
                          </span>
                          <span className="text-gray-500 ml-2">
                            (价差率: {((tariff.peakPrice - tariff.valleyPrice) / tariff.peakPrice * 100).toFixed(1)}%)
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    暂无电价数据
                  </div>
                )}
              </div>

              {/* 时段配置 */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">时段配置</h2>
                {provinceDetail.timePeriods && provinceDetail.timePeriods.peakHours ? (
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <h4 className="font-semibold text-red-600 mb-2">峰时段</h4>
                      {provinceDetail.timePeriods.peakDescription && (
                        <p className="text-sm text-gray-600 mb-2">
                          {provinceDetail.timePeriods.peakDescription}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-1">
                        {provinceDetail.timePeriods.peakHours.map((h: number) => (
                          <span key={h} className="inline-block w-8 h-8 bg-red-100 text-red-700 rounded text-center text-xs leading-8">
                            {h}:00
                          </span>
                        ))}
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        共 {provinceDetail.timePeriods.peakHours.length} 小时
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-blue-600 mb-2">平时段</h4>
                      {provinceDetail.timePeriods.flatDescription && (
                        <p className="text-sm text-gray-600 mb-2">
                          {provinceDetail.timePeriods.flatDescription}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-1">
                        {provinceDetail.timePeriods.flatHours.map((h: number) => (
                          <span key={h} className="inline-block w-8 h-8 bg-blue-100 text-blue-700 rounded text-center text-xs leading-8">
                            {h}:00
                          </span>
                        ))}
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        共 {provinceDetail.timePeriods.flatHours.length} 小时
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-green-600 mb-2">谷时段</h4>
                      {provinceDetail.timePeriods.valleyDescription && (
                        <p className="text-sm text-gray-600 mb-2">
                          {provinceDetail.timePeriods.valleyDescription}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-1">
                        {provinceDetail.timePeriods.valleyHours.map((h: number) => (
                          <span key={h} className="inline-block w-8 h-8 bg-green-100 text-green-700 rounded text-center text-xs leading-8">
                            {h}:00
                          </span>
                        ))}
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        共 {provinceDetail.timePeriods.valleyHours.length} 小时
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500 mb-2">暂无时段配置数据</p>
                    <p className="text-sm text-gray-400">AI 检查的更新可能未包含时段信息</p>
                    <button
                      onClick={() => handleCheckSingleUpdate()}
                      className="mt-4 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition"
                    >
                      重新检查该省份数据
                    </button>
                  </div>
                )}
              </div>

              {/* 版本历史 */}
              {updateLogs.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold">更新历史</h2>
                    <History className="w-5 h-5 text-gray-400" />
                  </div>
                  <div className="space-y-3">
                    {updateLogs.map((log) => (
                      <div key={log.id} className="flex items-center justify-between border rounded-lg p-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold">
                              {log.updateType === 'create' ? '创建' :
                               log.updateType === 'update' ? '更新' :
                               log.updateType === 'expire' ? '过期' : '替换'}
                            </span>
                            <span className={`text-xs px-2 py-1 rounded ${
                              log.status === 'completed' ? 'bg-green-100 text-green-800' :
                              log.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              log.status === 'failed' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {log.status === 'completed' ? '已完成' :
                               log.status === 'pending' ? '待审批' :
                               log.status === 'failed' ? '已拒绝' : log.status}
                            </span>
                            {log.triggerType === 'agent' && (
                              <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                                AI智能体
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-600">
                            <div>时间: {new Date(log.createdAt).toLocaleString('zh-CN')}</div>
                            {log.changesSummary && typeof log.changesSummary === 'object' && (
                              <div>
                                版本: {(log.changesSummary as any).version}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 更新结果 */}
      {updateResults.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">更新检查结果</h2>
            <button
              onClick={() => setUpdateResults([])}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              关闭
            </button>
          </div>
          <div className="space-y-3">
            {updateResults.map((result, index) => (
              <div key={index} className="flex items-start justify-between border rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  {result.success ? (
                    result.requiresApproval ? (
                      <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                    ) : (
                      <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                    )
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
                  )}
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold">
                        {provinces.find(p => p.code === result.provinceCode)?.name || result.provinceCode}
                      </span>
                      {result.success && (
                        <span className={`text-xs px-2 py-1 rounded ${
                          result.requiresApproval ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {result.requiresApproval ? '有新版本' : '已是最新'}
                        </span>
                      )}
                    </div>
                    {result.success && result.parsed ? (
                      <div className="text-sm text-gray-600">
                        <div>文号: {result.parsed.policyNumber}</div>
                        <div>生效日期: {result.parsed.effectiveDate}</div>
                        {result.requiresApproval && (
                          <div className="text-yellow-600 mt-1">⚠️ 等待审批后生效</div>
                        )}
                      </div>
                    ) : (
                      <div className="text-sm text-red-600">{result.error}</div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 数据源管理 */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">数据源管理</h2>
          <button
            onClick={() => setShowDataSources(!showDataSources)}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            {showDataSources ? '收起' : '展开'}
          </button>
        </div>
        {showDataSources ? (
          <div className="space-y-3">
            {agent.getDataSources().map((source, index) => (
              <div key={index} className="flex items-center justify-between border rounded-lg p-4">
                <div>
                  <div className="font-medium">{source.name}</div>
                  <div className="text-sm text-gray-500">{source.url}</div>
                  <div className="text-xs text-gray-400 mt-1">
                    省份: {source.provinceCode} | 解析器: {source.parser}
                  </div>
                </div>
                <button
                  onClick={() => toggleDataSource(source.name, !source.enabled)}
                  className={`px-3 py-1 text-sm rounded ${
                    source.enabled
                      ? 'bg-green-100 text-green-800 hover:bg-green-200'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
                >
                  {source.enabled ? '已启用' : '已禁用'}
                </button>
              </div>
            ))}
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-900">
                <strong>提示：</strong>数据源配置用于自动获取电价政策。当前使用模拟数据，
                实际部署时需要配置真实的数据源 URL 和解析规则。
              </p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-500">
            已配置 {agent.getDataSources().length} 个数据源，{agent.getDataSources().filter(ds => ds.enabled).length} 个已启用
          </p>
        )}
      </div>

      {/* 待审批提示 */}
      {pendingApprovals.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-500 rounded-lg p-6">
          <div className="flex items-start space-x-3">
            <span className="text-2xl">🔔</span>
            <div className="flex-1">
              <h3 className="font-semibold text-yellow-900">待审批更新</h3>
              <p className="text-sm text-yellow-800 mt-1">
                当前有 {pendingApprovals.length} 个更新等待审批
              </p>
              <div className="mt-4 space-y-2">
                {pendingApprovals.slice(0, 3).map((log) => (
                  <div key={log.id} className="flex items-center justify-between bg-white rounded p-3">
                    <div>
                      <div className="font-medium text-sm">
                        {provinces.find(p => p.id === log.provinceId)?.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(log.createdAt).toLocaleString('zh-CN')}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApprove(log.id)}
                        className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                      >
                        通过
                      </button>
                      <button
                        onClick={() => handleReject(log.id)}
                        className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                      >
                        拒绝
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 技术说明 */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">📋 技术架构</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-700">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">数据层</h4>
            <ul className="space-y-1">
              <li>• IndexedDB 本地存储</li>
              <li>• 5个核心对象存储</li>
              <li>• 完整索引支持</li>
              <li>• JSON 导入导出</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">服务层</h4>
            <ul className="space-y-1">
              <li>• LocalTariffRepository 数据仓库</li>
              <li>• 版本控制和审批流程</li>
              <li>• 数据验证和变更追踪</li>
              <li>• 待审批管理</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">界面层</h4>
            <ul className="space-y-1">
              <li>• React 18 + TypeScript</li>
              <li>• TailwindCSS 样式</li>
              <li>• Lucide Icons</li>
              <li>• 响应式设计</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">特性</h4>
            <ul className="space-y-1">
              <li>• 离线优先架构</li>
              <li>• 无服务器依赖</li>
              <li>• 快速数据访问</li>
              <li>• 浏览器本地存储</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
