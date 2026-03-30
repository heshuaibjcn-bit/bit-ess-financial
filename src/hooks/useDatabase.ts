/**
 * Database Hooks
 *
 * React hooks for database operations with real-time updates
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { projectRepository, ProjectRow } from '../repositories/ProjectRepository';
import { userRepository, UserRow } from '../repositories/UserRepository';
import { supabase, getCurrentUser, isSupabaseAvailable } from '../lib/supabase';

/**
 * Hook for checking database availability
 */
export function useDatabaseAvailable() {
  const [isAvailable, setIsAvailable] = useState(isSupabaseAvailable());
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    if (!isAvailable) {
      setIsChecking(true);
      // Recheck every 5 seconds
      const interval = setInterval(() => {
        const available = isSupabaseAvailable();
        setIsAvailable(available);
        if (available) {
          setIsChecking(false);
          clearInterval(interval);
        }
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [isAvailable]);

  return { isAvailable, isChecking };
}

/**
 * Hook for user projects with real-time updates
 */
export function useProjects(options?: {
  includeDemo?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
}) {
  const { user } = useAuth();
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchProjects = useCallback(async () => {
    if (!user) {
      setProjects([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const data = await projectRepository.findByUserId(user.id, {
        includeDemo: options?.includeDemo,
      });

      setProjects(data);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch projects');
      setError(error);
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  }, [user, options?.includeDemo]);

  // Initial fetch
  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // Auto refresh
  useEffect(() => {
    if (!options?.autoRefresh || !options.refreshInterval) {
      return;
    }

    const interval = setInterval(fetchProjects, options.refreshInterval);
    return () => clearInterval(interval);
  }, [fetchProjects, options?.autoRefresh, options?.refreshInterval]);

  // Real-time updates
  useEffect(() => {
    if (!user || !options?.autoRefresh) {
      return;
    }

    const subscription = projectRepository.subscribeToProjects(user.id, {
      onInsert: (project) => {
        setProjects((prev) => [project, ...prev]);
      },
      onUpdate: (project) => {
        setProjects((prev) =>
          prev.map((p) => (p.id === project.id ? project : p))
        );
      },
      onDelete: (project) => {
        setProjects((prev) => prev.filter((p) => p.id !== project.id));
      },
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [user, options?.autoRefresh]);

  return {
    projects,
    loading,
    error,
    refetch: fetchProjects,
  };
}

/**
 * Hook for single project with real-time updates
 */
export function useProject(projectId: string, options?: {
  autoRefresh?: boolean;
}) {
  const [project, setProject] = useState<ProjectRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchProject = useCallback(async () => {
    if (!projectId) {
      setProject(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const data = await projectRepository.findById(projectId);
      setProject(data);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch project');
      setError(error);
      console.error('Error fetching project:', error);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  // Initial fetch
  useEffect(() => {
    fetchProject();
  }, [fetchProject]);

  // Real-time updates
  useEffect(() => {
    if (!projectId || !options?.autoRefresh) {
      return;
    }

    const subscription = projectRepository.subscribeToProjects('', {
      onUpdate: (updatedProject) => {
        if (updatedProject.id === projectId) {
          setProject(updatedProject);
        }
      },
      onDelete: (deletedProject) => {
        if (deletedProject.id === projectId) {
          setProject(null);
        }
      },
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [projectId, options?.autoRefresh]);

  return {
    project,
    loading,
    error,
    refetch: fetchProject,
  };
}

/**
 * Hook for project operations
 */
export function useProjectOperations() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const createProject = useCallback(async (
    name: string,
    input: any,
    result: any,
    options?: { description?: string; isDemo?: boolean }
  ) => {
    setLoading(true);
    setError(null);

    try {
      const user = await getCurrentUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const project = await projectRepository.createFromCalculation(
        user.id,
        name,
        input,
        result,
        options
      );

      return project;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to create project');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateProject = useCallback(async (
    projectId: string,
    updates: Partial<ProjectRow>
  ) => {
    setLoading(true);
    setError(null);

    try {
      const project = await projectRepository.update(projectId, updates);
      return project;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to update project');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteProject = useCallback(async (projectId: string) => {
    setLoading(true);
    setError(null);

    try {
      await projectRepository.delete(projectId);
      return true;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to delete project');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const cloneProject = useCallback(async (projectId: string, newName: string) => {
    setLoading(true);
    setError(null);

    try {
      const project = await projectRepository.cloneProject(projectId, newName);
      return project;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to clone project');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    createProject,
    updateProject,
    deleteProject,
    cloneProject,
  };
}

/**
 * Hook for user data
 */
export function useUserProfile(options?: {
  includeStats?: boolean;
  autoSync?: boolean;
}) {
  const { user: authUser } = useAuth();
  const [user, setUser] = useState<UserRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchUser = useCallback(async () => {
    if (!authUser) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      if (options?.includeStats) {
        const data = await userRepository.getWithStats(authUser.id);
        setUser(data);
      } else {
        const data = await userRepository.findById(authUser.id);
        setUser(data || null);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch user');
      setError(error);
      console.error('Error fetching user:', error);
    } finally {
      setLoading(false);
    }
  }, [authUser, options?.includeStats]);

  // Initial fetch
  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  // Auto sync from auth
  useEffect(() => {
    if (!authUser || !options?.autoSync) {
      return;
    }

    const syncUser = async () => {
      try {
        const synced = await userRepository.syncAuthUser();
        if (synced) {
          setUser(synced);
        }
      } catch (err) {
        console.error('Error syncing user:', err);
      }
    };

    syncUser();
  }, [authUser, options?.autoSync]);

  return {
    user,
    loading,
    error,
    refetch: fetchUser,
  };
}

/**
 * Hook for project statistics
 */
export function useProjectStatistics() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalProjects: 0,
    totalInvestment: 0,
    totalCapacity: 0,
    averageIRR: 0,
    averageNPV: 0,
    averagePaybackPeriod: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);

        const data = await projectRepository.getStatistics(user.id);
        setStats(data);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to fetch statistics');
        setError(error);
        console.error('Error fetching statistics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user]);

  return {
    stats,
    loading,
    error,
  };
}

/**
 * Hook for database mutations with optimistic updates
 */
export function useMutation<T = any>(
  mutationFn: () => Promise<T>,
  options?: {
    onSuccess?: (data: T) => void;
    onError?: (error: Error) => void;
  }
) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<T | null>(null);

  const mutate = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await mutationFn();
      setData(result);
      options?.onSuccess?.(result);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Mutation failed');
      setError(error);
      options?.onError?.(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [mutationFn, options]);

  return {
    mutate,
    loading,
    error,
    data,
  };
}