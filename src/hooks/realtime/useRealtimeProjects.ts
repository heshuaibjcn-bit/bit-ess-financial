/**
 * Real-time Projects Hook (本地存储版本)
 *
 * 订阅本地存储的项目更新，实现跨标签页同步
 */

import { useEffect, useRef } from 'react';
import { useCloudProjectStore } from '@/stores/cloudProjectStore';
import { localRealtime } from '@/lib/localStorage';

/**
 * Real-time Projects Hook 选项
 */
interface UseRealtimeProjectsOptions {
  /**
   * 启用/禁用实时订阅
   * @default true
   */
  enabled?: boolean;

  /**
   * 项目变更时的回调
   */
  onProjectChange?: (event: 'INSERT' | 'UPDATE' | 'DELETE', project: any) => void;

  /**
   * 错误时的回调
   */
  onError?: (error: Error) => void;
}

/**
 * 订阅实时项目变更
 */
export const useRealtimeProjects = (options: UseRealtimeProjectsOptions = {}) => {
  const { enabled = true, onProjectChange, onError } = options;
  const fetchProjects = useCloudProjectStore((state) => state.fetchProjects);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    /**
     * 订阅项目变更
     */
    const unsubscribe = localRealtime.subscribe('projects', (event, data) => {
      console.log('Real-time project change:', event, data);

      // 刷新项目列表
      fetchProjects().catch((err) => {
        console.error('Failed to refresh projects:', err);
        if (onError) {
          onError(err);
        }
      });

      // 通知回调
      if (onProjectChange && data) {
        // 根据事件类型确定操作
        if (Array.isArray(data)) {
          onProjectChange('UPDATE', data);
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, [enabled, fetchProjects, onProjectChange, onError]);

  /**
   * 手动刷新项目
   */
  const refresh = () => {
    return fetchProjects().catch((err) => {
      console.error('Failed to refresh projects:', err);
      if (onError) {
        onError(err);
      }
    });
  };

  return {
    refresh,
    isSubscribed: enabled,
  };
};

/**
 * 单个项目的实时 Hook
 */
export const useRealtimeProject = (projectId: string | undefined) => {
  useEffect(() => {
    if (!projectId) {
      return;
    }

    /**
     * 订阅单个项目的更新
     */
    const unsubscribe = localRealtime.subscribe('projects', (event, data) => {
      console.log('Real-time project update:', projectId, event, data);

      // 更新当前项目在 store 中的状态
      const store = useCloudProjectStore.getState();

      if (Array.isArray(data)) {
        const updated = data.find(p => p.id === projectId);
        if (updated && store.currentProject?.id === projectId) {
          store.currentProject = updated;
        }

        // 同时更新项目列表
        store.projects = store.projects.map(p =>
          p.id === projectId ? updated : p
        );
      }
    });

    return () => {
      unsubscribe();
    };
  }, [projectId]);

  return {
    isSubscribed: !!projectId,
  };
};

export default useRealtimeProjects;
