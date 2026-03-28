/**
 * Local Storage Service
 *
 * 替代 Supabase 的本地存储方案
 * 使用 localStorage + IndexedDB 实现数据持久化
 */

interface User {
  id: string;
  email: string;
  password: string; // 在实际应用中应该哈希存储
  displayName?: string;
  createdAt: string;
}

interface LocalProject {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  formData: any;
  status: 'draft' | 'in_progress' | 'completed';
  collaborationModel: string | null;
  industry: string | null;
  createdAt: string;
  updatedAt: string;
}

interface UserProfile {
  id: string;
  displayName: string | null;
  avatarUrl: string | null;
  companyName: string | null;
  createdAt: string;
}

// Storage keys
const KEYS = {
  USERS: 'ess_users',
  CURRENT_USER: 'ess_current_user',
  PROJECTS: 'ess_projects',
  USER_PROFILES: 'ess_user_profiles',
} as const;

/**
 * 生成 UUID
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * 获取所有用户
 */
function getUsers(): User[] {
  try {
    const data = localStorage.getItem(KEYS.USERS);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

/**
 * 保存用户列表
 */
function saveUsers(users: User[]): void {
  localStorage.setItem(KEYS.USERS, JSON.stringify(users));
}

/**
 * 根据邮箱查找用户
 */
function findUserByEmail(email: string): User | null {
  const users = getUsers();
  return users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
}

/**
 * 用户认证服务
 */
export const localAuthService = {
  /**
   * 注册新用户
   */
  signUp: async (email: string, password: string, displayName?: string) => {
    // 检查邮箱是否已存在
    const existingUser = findUserByEmail(email);
    if (existingUser) {
      throw new Error('该邮箱已被注册');
    }

    // 创建新用户
    const newUser: User = {
      id: generateId(),
      email,
      password,
      displayName,
      createdAt: new Date().toISOString(),
    };

    const users = getUsers();
    users.push(newUser);
    saveUsers(users);

    // 创建用户配置
    const profile: UserProfile = {
      id: newUser.id,
      displayName: displayName || null,
      avatarUrl: null,
      companyName: null,
      createdAt: new Date().toISOString(),
    };
    saveUserProfile(profile);

    // 自动登录
    localStorage.setItem(KEYS.CURRENT_USER, JSON.stringify({
      id: newUser.id,
      email: newUser.email,
      ...profile,
    }));

    return { user: { ...newUser, ...profile } };
  },

  /**
   * 用户登录
   */
  signIn: async (email: string, password: string) => {
    const user = findUserByEmail(email);
    if (!user) {
      throw new Error('用户不存在');
    }

    if (user.password !== password) {
      throw new Error('密码错误');
    }

    const profile = getUserProfile(user.id);

    // 保存当前会话
    localStorage.setItem(KEYS.CURRENT_USER, JSON.stringify({
      id: user.id,
      email: user.email,
      ...profile,
    }));

    return { user: { ...user, ...profile } };
  },

  /**
   * 用户登出
   */
  signOut: async () => {
    localStorage.removeItem(KEYS.CURRENT_USER);
  },

  /**
   * 获取当前用户
   */
  getCurrentUser: () => {
    try {
      const data = localStorage.getItem(KEYS.CURRENT_USER);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  /**
   * 更新用户配置
   */
  updateUserProfile: async (userId: string, updates: Partial<UserProfile>) => {
    const profile = getUserProfile(userId);
    if (profile) {
      const updated = { ...profile, ...updates };
      saveUserProfile(updated);

      // 更新当前会话
      const currentUser = localAuthService.getCurrentUser();
      if (currentUser && currentUser.id === userId) {
        localStorage.setItem(KEYS.CURRENT_USER, JSON.stringify({
          ...currentUser,
          ...updates,
        }));
      }

      return updated;
    }
    throw new Error('用户不存在');
  },
};

/**
 * 获取用户配置
 */
function getUserProfile(userId: string): UserProfile | null {
  try {
    const data = localStorage.getItem(KEYS.USER_PROFILES);
    const profiles: Record<string, UserProfile> = data ? JSON.parse(data) : {};
    return profiles[userId] || null;
  } catch {
    return null;
  }
}

/**
 * 保存用户配置
 */
function saveUserProfile(profile: UserProfile): void {
  try {
    const data = localStorage.getItem(KEYS.USER_PROFILES);
    const profiles: Record<string, UserProfile> = data ? JSON.parse(data) : {};
    profiles[profile.id] = profile;
    localStorage.setItem(KEYS.USER_PROFILES, JSON.stringify(profiles));
  } catch (e) {
    console.error('Failed to save user profile:', e);
  }
}

/**
 * 项目存储服务
 */
export const localProjectService = {
  /**
   * 获取用户的所有项目
   */
  getProjects: (userId: string): LocalProject[] => {
    try {
      const data = localStorage.getItem(KEYS.PROJECTS);
      const allProjects: LocalProject[] = data ? JSON.parse(data) : [];
      return allProjects.filter(p => p.userId === userId);
    } catch {
      return [];
    }
  },

  /**
   * 保存项目列表
   */
  saveProjects: (projects: LocalProject[], userId?: string): void => {
    try {
      const data = localStorage.getItem(KEYS.PROJECTS);
      const allProjects: LocalProject[] = data ? JSON.parse(data) : [];

      // 如果提供了 userId，只更新该用户的项目
      if (userId) {
        const userProjectIds = new Set(projects.map(p => p.id));
        const otherUsersProjects = allProjects.filter(p => p.userId !== userId);
        const updated = [...otherUsersProjects, ...projects];
        localStorage.setItem(KEYS.PROJECTS, JSON.stringify(updated));
      } else {
        // 旧逻辑：更新属于当前用户的项目（用于向后兼容）
        const otherProjects = allProjects.filter(p => !projects.some(up => up.id === p.id));
        const updated = [...otherProjects, ...projects];
        localStorage.setItem(KEYS.PROJECTS, JSON.stringify(updated));
      }
    } catch (e) {
      console.error('Failed to save projects:', e);
    }
  },

  /**
   * 获取单个项目
   */
  getProject: (userId: string, projectId: string): LocalProject | null => {
    const projects = localProjectService.getProjects(userId);
    return projects.find(p => p.id === projectId) || null;
  },

  /**
   * 创建项目
   */
  createProject: (userId: string, data: Omit<LocalProject, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): LocalProject => {
    const newProject: LocalProject = {
      ...data,
      id: generateId(),
      userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const projects = localProjectService.getProjects(userId);
    projects.unshift(newProject);
    localProjectService.saveProjects(projects, userId);

    return newProject;
  },

  /**
   * 更新项目
   */
  updateProject: (userId: string, projectId: string, updates: Partial<Omit<LocalProject, 'id' | 'userId' | 'createdAt'>>): LocalProject => {
    const projects = localProjectService.getProjects(userId);
    const index = projects.findIndex(p => p.id === projectId);

    if (index === -1) {
      throw new Error('项目不存在');
    }

    const updated = {
      ...projects[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    projects[index] = updated;
    localProjectService.saveProjects(projects, userId);

    return updated;
  },

  /**
   * 删除项目
   */
  deleteProject: (userId: string, projectId: string): void => {
    const projects = localProjectService.getProjects(userId);
    const filtered = projects.filter(p => p.id !== projectId);
    localProjectService.saveProjects(filtered, userId);
  },

  /**
   * 复制项目
   */
  duplicateProject: (userId: string, projectId: string): LocalProject => {
    const original = localProjectService.getProject(userId, projectId);
    if (!original) {
      throw new Error('项目不存在');
    }

    const duplicated = localProjectService.createProject(userId, {
      name: `${original.name} (副本)`,
      description: original.description,
      formData: original.formData,
      status: 'draft',
      collaborationModel: original.collaborationModel,
      industry: original.industry,
    });

    return duplicated;
  },
};

/**
 * 实时订阅模拟
 */
export const localRealtime = {
  listeners: Map<string, Set<(event: string, data: any) => void>>,

  init() {
    if (typeof window === 'undefined') return;
    this.listeners = new Map();

    // 监听 storage 事件以实现跨标签页同步
    window.addEventListener('storage', (e) => {
      if (e.key === KEYS.PROJECTS && e.newValue) {
        const projects = JSON.parse(e.newValue);
        const currentUser = localAuthService.getCurrentUser();
        if (currentUser) {
          const userProjects = projects.filter((p: LocalProject) => p.userId === currentUser.id);
          this.notify('projects', userProjects);
        }
      }
    });
  },

  subscribe(channel: string, callback: (event: string, data: any) => void) {
    if (!this.listeners.has(channel)) {
      this.listeners.set(channel, new Set());
    }
    this.listeners.get(channel)!.add(callback);

    return () => {
      this.listeners.get(channel)?.delete(callback);
    };
  },

  notify(channel: string, data: any) {
    const listeners = this.listeners.get(channel);
    if (listeners) {
      listeners.forEach(cb => cb('UPDATE', data));
    }
  },
};

// 初始化实时订阅
if (typeof window !== 'undefined') {
  localRealtime.init();
}
