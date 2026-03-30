/**
 * 电价数据库 React Hook
 */

import { useState, useEffect, useCallback } from 'react';
import {
  getTariffRepository,
  TariffProvince,
  TariffVersion,
  TariffData,
  CompleteTariffData,
  TariffUpdateLog,
} from '@/repositories/TariffRepository';
import {
  getTariffUpdateAgent,
  EnhancedUpdateResult,
  ParsedTariffNotice,
} from '@/services/agents/TariffUpdateAgent.enhanced';

/**
 * 使用电价数据库
 */
export function useTariffDatabase() {
  const [provinces, setProvinces] = useState<TariffProvince[]>([]);
  const [selectedProvince, setSelectedProvince] = useState<CompleteTariffData | null>(null);
  const [versionHistory, setVersionHistory] = useState<TariffVersion[]>([]);
  const [updateLogs, setUpdateLogs] = useState<Array<TariffUpdateLog & { province: TariffProvince }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const repository = getTariffRepository();

  /**
   * 加载所有省份
   */
  const loadProvinces = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await repository.getProvinces();
      setProvinces(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * 加载省份详情
   */
  const loadProvinceDetail = useCallback(async (provinceCode: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await repository.getActiveTariffByProvince(provinceCode);
      setSelectedProvince(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * 加载版本历史
   */
  const loadVersionHistory = useCallback(async (provinceCode: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await repository.getVersionHistory(provinceCode);
      setVersionHistory(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * 加载更新日志
   */
  const loadUpdateLogs = useCallback(async (provinceCode?: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await repository.getUpdateLogs(provinceCode);
      setUpdateLogs(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * 初始化
   */
  useEffect(() => {
    loadProvinces();
  }, [loadProvinces]);

  return {
    provinces,
    selectedProvince,
    versionHistory,
    updateLogs,
    loading,
    error,
    loadProvinces,
    loadProvinceDetail,
    loadVersionHistory,
    loadUpdateLogs,
    setSelectedProvince,
  };
}

/**
 * 使用智能体更新
 */
export function useAgentUpdate() {
  const [updating, setUpdating] = useState(false);
  const [results, setResults] = useState<EnhancedUpdateResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  const agent = getTariffUpdateAgent();

  /**
   * 解析通知
   */
  const parseNotice = useCallback(async (noticeUrl: string): Promise<ParsedTariffNotice | null> => {
    setUpdating(true);
    setError(null);
    try {
      const parsed = await agent.parseNotice(noticeUrl);
      return parsed;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setUpdating(false);
    }
  }, []);

  /**
   * 验证并存储
   */
  const validateAndStore = useCallback(async (parsed: ParsedTariffNotice, userId?: string) => {
    setUpdating(true);
    setError(null);
    try {
      const result = await agent.validateAndStore(parsed, userId);
      return result;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setUpdating(false);
    }
  }, []);

  /**
   * 批量检查
   */
  const batchCheck = useCallback(async (provinceCodes: string[]) => {
    setUpdating(true);
    setError(null);
    try {
      const checkResults = await agent.batchCheckProvinces(provinceCodes);
      setResults(checkResults);
      return checkResults;
    } catch (err: any) {
      setError(err.message);
      return [];
    } finally {
      setUpdating(false);
    }
  }, []);

  /**
   * 自动检查
   */
  const autoCheck = useCallback(async () => {
    setUpdating(true);
    setError(null);
    try {
      const checkResults = await agent.autoCheckAndUpdate();
      setResults(checkResults.results);
      return checkResults;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setUpdating(false);
    }
  }, []);

  /**
   * 导入历史数据
   */
  const importHistorical = useCallback(async () => {
    setUpdating(true);
    setError(null);
    try {
      const importResult = await agent.importHistoricalData();
      return importResult;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setUpdating(false);
    }
  }, []);

  return {
    updating,
    results,
    error,
    parseNotice,
    validateAndStore,
    batchCheck,
    autoCheck,
    importHistorical,
  };
}

/**
 * 使用审批管理
 */
export function useApprovalManagement() {
  const [loading, setLoading] = useState(false);
  const [pendingApprovals, setPendingApprovals] = useState<Array<TariffUpdateLog & {
    province: TariffProvince;
    version: TariffVersion;
  }>>([]);
  const [error, setError] = useState<string | null>(null);

  const repository = getTariffRepository();

  /**
   * 加载待审批项
   */
  const loadPendingApprovals = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const approvals = await repository.getPendingApprovals();
      setPendingApprovals(approvals);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * 批准更新
   */
  const approveUpdate = useCallback(async (updateId: string, userId: string) => {
    setLoading(true);
    setError(null);
    try {
      const success = await repository.approveUpdate(updateId, userId);
      if (success) {
        // 刷新列表
        await loadPendingApprovals();
      }
      return success;
    } catch (err: any) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [loadPendingApprovals]);

  /**
   * 拒绝更新
   */
  const rejectUpdate = useCallback(async (updateId: string, userId: string, reason: string) => {
    setLoading(true);
    setError(null);
    try {
      const success = await repository.rejectUpdate(updateId, userId, reason);
      if (success) {
        // 刷新列表
        await loadPendingApprovals();
      }
      return success;
    } catch (err: any) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [loadPendingApprovals]);

  /**
   * 初始化
   */
  useEffect(() => {
    loadPendingApprovals();
  }, [loadPendingApprovals]);

  return {
    loading,
    pendingApprovals,
    error,
    loadPendingApprovals,
    approveUpdate,
    rejectUpdate,
  };
}
