/**
 * Authentication Context (本地存储版本)
 *
 * 提供用户认证状态和操作，使用本地存储而不是 Supabase
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { localAuthService } from '@/lib/localStorage';

/**
 * 认证上下文类型
 */
interface AuthContextType {
  // 状态
  user: any;
  userProfile: any;
  loading: boolean;
  error: string | null;

  // 操作
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName?: string) => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

/**
 * 创建上下文
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * 认证提供者属性
 */
interface AuthProviderProps {
  children: React.ReactNode;
}

/**
 * 认证提供者组件
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * 初始化认证状态
   */
  useEffect(() => {
    // 获取当前会话
    const currentUser = localAuthService.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
      setUserProfile(currentUser);
    }
    setLoading(false);
  }, []);

  /**
   * 使用邮箱和密码登录
   */
  const signIn = useCallback(async (email: string, password: string) => {
    setError(null);
    setLoading(true);

    try {
      const { user } = await localAuthService.signIn(email, password);
      setUser(user);
      setUserProfile(user);
    } catch (err) {
      const message = err instanceof Error ? err.message : '登录失败';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * 注册新用户
   */
  const signUp = useCallback(async (email: string, password: string, displayName?: string) => {
    setError(null);
    setLoading(true);

    try {
      const { user } = await localAuthService.signUp(email, password, displayName);
      setUser(user);
      setUserProfile(user);
    } catch (err) {
      const message = err instanceof Error ? err.message : '注册失败';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * 登出
   */
  const signOut = useCallback(async () => {
    setError(null);
    setLoading(true);

    try {
      await localAuthService.signOut();
      setUser(null);
      setUserProfile(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : '登出失败';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * 清除错误
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * 上下文值
   */
  const value: AuthContextType = {
    user,
    userProfile,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * 使用认证上下文的 Hook
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};

/**
 * 获取当前用户
 */
export const useCurrentUser = (): any => {
  const { user } = useAuth();
  return user;
};

/**
 * 检查用户是否已认证
 */
export const useIsAuthenticated = (): boolean => {
  const { user, loading } = useAuth();
  return !!user && !loading;
};

/**
 * 获取用户配置
 */
export const useUserProfile = (): any => {
  const { userProfile } = useAuth();
  return userProfile;
};
