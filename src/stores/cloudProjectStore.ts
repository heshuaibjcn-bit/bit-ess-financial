/**
 * Cloud Project Store (本地存储版本)
 *
 * 使用本地存储管理项目，替代 Supabase 云端存储
 * 提供 CRUD 操作、筛选、搜索和缓存功能
 */

import { create } from 'zustand';
import { localProjectService, localRealtime } from '@/lib/localStorage';
import type { ProjectInput } from '@/domain/schemas/ProjectSchema';

/**
 * 项目状态类型
 */
export type ProjectStatus = 'draft' | 'in_progress' | 'completed';

/**
 * 合作模式类型
 */
export type CollaborationModel = 'emc' | 'lease' | 'sale' | 'joint_venture';

/**
 * 日期范围筛选类型
 */
export type DateRangeFilter = 'week' | 'month' | 'quarter' | 'all';

/**
 * 本地项目（来自数据库）
 */
export interface LocalProject {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  formData: ProjectInput;
  status: ProjectStatus;
  collaborationModel: string | null;
  industry: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * 项目筛选器
 */
export interface ProjectFilters {
  search: string;
  status: ProjectStatus[];
  collaborationModel: string[];
  dateRange: DateRangeFilter;
}

/**
 * Store 状态
 */
interface CloudProjectState {
  // 数据
  projects: LocalProject[];
  filteredProjects: LocalProject[];
  currentProject: LocalProject | null;

  // 加载状态
  loading: boolean;
  saving: boolean;
  error: string | null;

  // 筛选器
  filters: ProjectFilters;

  // 操作
  fetchProjects: () => Promise<void>;
  createProject: (name: string, description?: string) => Promise<string>;
  updateProject: (id: string, updates: Partial<any>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  duplicateProject: (id: string) => Promise<string>;

  // 当前项目操作
  loadProject: (id: string) => Promise<void>;
  updateCurrentProjectFormData: (formData: ProjectInput) => Promise<void>;
  clearCurrentProject: () => void;

  // 筛选
  setFilters: (filters: Partial<ProjectFilters>) => void;
  resetFilters: () => void;
}

/**
 * 默认筛选器
 */
const defaultFilters: ProjectFilters = {
  search: '',
  status: [],
  collaborationModel: [],
  dateRange: 'all',
};

/**
 * 按日期范围筛选项目
 */
const filterByDateRange = (projects: LocalProject[], range: DateRangeFilter): LocalProject[] => {
  if (range === 'all') return projects;

  const now = new Date();
  const cutoff = new Date();

  switch (range) {
    case 'week':
      cutoff.setDate(now.getDate() - 7);
      break;
    case 'month':
      cutoff.setMonth(now.getMonth() - 1);
      break;
    case 'quarter':
      cutoff.setMonth(now.getMonth() - 3);
      break;
  }

  return projects.filter((p) => new Date(p.createdAt) >= cutoff);
};

/**
 * 按搜索词筛选项目
 */
const filterBySearch = (projects: LocalProject[], search: string): LocalProject[] => {
  if (!search) return projects;

  const lowerSearch = search.toLowerCase();
  return projects.filter(
    (p) =>
      p.name.toLowerCase().includes(lowerSearch) ||
      p.description?.toLowerCase().includes(lowerSearch) ||
      p.industry?.toLowerCase().includes(lowerSearch)
  );
};

/**
 * 按状态筛选项目
 */
const filterByStatus = (projects: LocalProject[], statuses: ProjectStatus[]): LocalProject[] => {
  if (statuses.length === 0) return projects;
  return projects.filter((p) => statuses.includes(p.status));
};

/**
 * 按合作模式筛选项目
 */
const filterByCollaborationModel = (projects: LocalProject[], models: string[]): LocalProject[] => {
  if (models.length === 0) return projects;
  return projects.filter((p) => p.collaborationModel && models.includes(p.collaborationModel));
};

/**
 * 应用所有筛选器
 */
const applyFilters = (projects: LocalProject[], filters: ProjectFilters): LocalProject[] => {
  let filtered = projects;

  filtered = filterBySearch(filtered, filters.search);
  filtered = filterByStatus(filtered, filters.status);
  filtered = filterByCollaborationModel(filtered, filters.collaborationModel);
  filtered = filterByDateRange(filtered, filters.dateRange);

  return filtered;
};

/**
 * 获取当前用户 ID
 */
function getCurrentUserId(): string {
  const currentUser = localStorage.getItem('ess_current_user');
  if (!currentUser) {
    throw new Error('用户未登录');
  }
  const user = JSON.parse(currentUser);
  return user.id;
}

/**
 * 创建本地项目 Store
 */
export const useCloudProjectStore = create<CloudProjectState>((set, get) => ({
  // 初始状态
  projects: [],
  filteredProjects: [],
  currentProject: null,
  loading: false,
  saving: false,
  error: null,
  filters: defaultFilters,

  /**
   * 获取当前用户的所有项目
   */
  fetchProjects: async () => {
    set({ loading: true, error: null });

    try {
      const userId = getCurrentUserId();
      const projects = localProjectService.getProjects(userId);
      const { filters } = get();

      set({
        projects,
        filteredProjects: applyFilters(projects, filters),
        loading: false,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : '获取项目失败';
      set({
        error: message,
        loading: false,
      });
      throw err;
    }
  },

  /**
   * 创建新项目
   */
  createProject: async (name, description) => {
    set({ saving: true, error: null });

    try {
      const userId = getCurrentUserId();

      const newProject = localProjectService.createProject(userId, {
        name,
        description: description || null,
        formData: {}, // 初始为空表单数据
        status: 'draft',
        collaborationModel: null,
        industry: null,
      });

      // 添加到本地状态
      set((state) => {
        const newProjects = [newProject, ...state.projects];
        return {
          projects: newProjects,
          filteredProjects: applyFilters(newProjects, state.filters),
          saving: false,
        };
      });

      // 通知实时订阅
      localRealtime.notify('projects', get().projects);

      return newProject.id;
    } catch (err) {
      const message = err instanceof Error ? err.message : '创建项目失败';
      set({
        error: message,
        saving: false,
      });
      throw err;
    }
  },

  /**
   * 更新项目
   */
  updateProject: async (id, updates) => {
    set({ saving: true, error: null });

    try {
      const userId = getCurrentUserId();
      const updated = localProjectService.updateProject(userId, id, {
        ...updates,
        updatedAt: new Date().toISOString(),
      });

      // 更新本地状态
      set((state) => {
        const newProjects = state.projects.map((p) => (p.id === id ? updated : p));
        return {
          projects: newProjects,
          filteredProjects: applyFilters(newProjects, state.filters),
          currentProject: state.currentProject?.id === id ? updated : state.currentProject,
          saving: false,
        };
      });

      // 通知实时订阅
      localRealtime.notify('projects', get().projects);
    } catch (err) {
      const message = err instanceof Error ? err.message : '更新项目失败';
      set({
        error: message,
        saving: false,
      });
      throw err;
    }
  },

  /**
   * 删除项目
   */
  deleteProject: async (id) => {
    set({ saving: true, error: null });

    try {
      const userId = getCurrentUserId();
      localProjectService.deleteProject(userId, id);

      // 从本地状态移除
      set((state) => {
        const newProjects = state.projects.filter((p) => p.id !== id);
        return {
          projects: newProjects,
          filteredProjects: applyFilters(newProjects, state.filters),
          currentProject: state.currentProject?.id === id ? null : state.currentProject,
          saving: false,
        };
      });

      // 通知实时订阅
      localRealtime.notify('projects', get().projects);
    } catch (err) {
      const message = err instanceof Error ? err.message : '删除项目失败';
      set({
        error: message,
        saving: false,
      });
      throw err;
    }
  },

  /**
   * 复制项目
   */
  duplicateProject: async (id) => {
    set({ saving: true, error: null });

    try {
      const userId = getCurrentUserId();
      const duplicated = localProjectService.duplicateProject(userId, id);

      // 添加到本地状态
      set((state) => {
        const newProjects = [duplicated, ...state.projects];
        return {
          projects: newProjects,
          filteredProjects: applyFilters(newProjects, state.filters),
          saving: false,
        };
      });

      // 通知实时订阅
      localRealtime.notify('projects', get().projects);

      return duplicated.id;
    } catch (err) {
      const message = err instanceof Error ? err.message : '复制项目失败';
      set({
        error: message,
        saving: false,
      });
      throw err;
    }
  },

  /**
   * 加载项目到 currentProject
   */
  loadProject: async (id) => {
    set({ loading: true, error: null });

    try {
      const userId = getCurrentUserId();
      const project = localProjectService.getProject(userId, id);

      if (!project) {
        throw new Error('项目不存在');
      }

      set({
        currentProject: project,
        loading: false,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : '加载项目失败';
      set({
        error: message,
        loading: false,
      });
      throw err;
    }
  },

  /**
   * 更新当前项目表单数据
   */
  updateCurrentProjectFormData: async (formData) => {
    const currentProject = get().currentProject;
    if (!currentProject) {
      throw new Error('没有加载的项目');
    }

    return get().updateProject(currentProject.id, { formData });
  },

  /**
   * 清除当前项目
   */
  clearCurrentProject: () => {
    set({ currentProject: null });
  },

  /**
   * 设置筛选器
   */
  setFilters: (newFilters) => {
    set((state) => {
      const updatedFilters = { ...state.filters, ...newFilters };
      return {
        filters: updatedFilters,
        filteredProjects: applyFilters(state.projects, updatedFilters),
      };
    });
  },

  /**
   * 重置筛选器
   */
  resetFilters: () => {
    set((state) => ({
      filters: defaultFilters,
      filteredProjects: state.projects,
    }));
  },
}));

/**
 * Selector hooks
 */
export const useCloudProjects = () => useCloudProjectStore((state) => state.projects);
export const useFilteredProjects = () => useCloudProjectStore((state) => state.filteredProjects);
export const useCurrentCloudProject = () => useCloudProjectStore((state) => state.currentProject);
export const useProjectFilters = () => useCloudProjectStore((state) => state.filters);
export const useProjectLoading = () => useCloudProjectStore((state) => state.loading);
export const useProjectSaving = () => useCloudProjectStore((state) => state.saving);
export const useProjectError = () => useCloudProjectStore((state) => state.error);
