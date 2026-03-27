/**
 * React Hooks for Sensitivity Precomputation
 *
 * Provides hooks for triggering and monitoring sensitivity precomputation.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { sensitivityPrecomputeService } from '@/services/sensitivity';
import type {
  SensitivityPrecomputeOptions,
  SensitivityPrecomputeJob,
  SensitivityPrecomputeResult,
  SensitivityType,
} from '@/services/sensitivity';

/**
 * Hook for sensitivity precomputation
 */
export function useSensitivityPrecompute() {
  const [job, setJob] = useState<SensitivityPrecomputeJob | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const pollInterval = useRef<NodeJS.Timeout | null>(null);

  /**
   * Start sensitivity precomputation
   */
  const precompute = useCallback(async (options: SensitivityPrecomputeOptions) => {
    setLoading(true);
    setError(null);

    try {
      const newJob = await sensitivityPrecomputeService.precompute(options);
      setJob(newJob);

      // If already completed, return result
      if (newJob.status === 'completed' && newJob.result) {
        setLoading(false);
        return newJob.result;
      }

      // Otherwise start polling
      startPolling(newJob.id);
      return null;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Precomputation failed');
      setError(error);
      setLoading(false);
      throw error;
    }
  }, []);

  /**
   * Start polling for job completion
   */
  const startPolling = useCallback((jobId: string) => {
    if (pollInterval.current) {
      clearInterval(pollInterval.current);
    }

    pollInterval.current = setInterval(() => {
      const currentJob = sensitivityPrecomputeService.getJob(jobId);

      if (!currentJob) {
        stopPolling();
        return;
      }

      setJob(currentJob);

      if (currentJob.status === 'completed' || currentJob.status === 'failed') {
        stopPolling();
        setLoading(false);

        if (currentJob.status === 'failed') {
          setError(new Error(currentJob.error || 'Precomputation failed'));
        }
      }
    }, 500); // Poll every 500ms
  }, []);

  /**
   * Stop polling
   */
  const stopPolling = useCallback(() => {
    if (pollInterval.current) {
      clearInterval(pollInterval.current);
      pollInterval.current = null;
    }
  }, []);

  /**
   * Cancel active job
   */
  const cancel = useCallback(() => {
    if (job) {
      sensitivityPrecomputeService.cancelJob(job.id);
      stopPolling();
      setLoading(false);
    }
  }, [job, stopPolling]);

  /**
   * Clear result
   */
  const clear = useCallback(() => {
    setJob(null);
    setError(null);
    setLoading(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  return {
    precompute,
    job,
    loading,
    error,
    result: job?.result || null,
    cancel,
    clear,
  };
}

/**
 * Hook for checking cached sensitivity results
 */
export function useSensitivityCache(projectId: string, sensitivityType: SensitivityType) {
  const [hasCached, setHasCached] = useState(false);
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<SensitivityPrecomputeResult | null>(null);

  const checkCache = useCallback(async () => {
    setLoading(true);

    try {
      const cached = await sensitivityPrecomputeService.getCachedResults(
        projectId,
        sensitivityType
      );

      setHasCached(cached !== null);
      setResult(cached);
    } catch (err) {
      console.error('Error checking cache:', err);
    } finally {
      setLoading(false);
    }
  }, [projectId, sensitivityType]);

  useEffect(() => {
    checkCache();
  }, [checkCache]);

  return {
    hasCached,
    loading,
    result,
    refresh: checkCache,
  };
}

/**
 * Hook for sensitivity precompute job monitoring
 */
export function useSensitivityJobs() {
  const [stats, setStats] = useState(() => sensitivityPrecomputeService.getStats());

  const refresh = useCallback(() => {
    setStats(sensitivityPrecomputeService.getStats());
  }, []);

  const getActiveJobs = useCallback(() => {
    return sensitivityPrecomputeService.getActiveJobs();
  }, []);

  const clearCompletedJobs = useCallback((olderThanHours: number = 1) => {
    return sensitivityPrecomputeService.clearCompletedJobs(olderThanHours);
  }, []);

  return {
    stats,
    refresh,
    getActiveJobs,
    clearCompletedJobs,
  };
}
