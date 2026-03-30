/**
 * Security Components for Enterprise-level Features
 *
 * Components for enforcing security UI:
 * - Permission-based rendering
 * - Security alerts
 * - Login forms
 * - Audit log viewers
 * - Compliance dashboards
 */

import React, { useState } from 'react';
import { Permission, UserRole } from '../../services/security/RBAC';
import { SecuritySeverity, SecurityEventType } from '../../services/security/SecurityCompliance';
import { useAuth, useAuthorization, useSecurityMonitoring } from '../../contexts/SecurityContext';

/**
 * Permission Gate - renders children only if user has permission
 */
export function PermissionGate({
  permission,
  fallback = null,
  children,
}: {
  permission: Permission;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}) {
  const { hasPermission } = useAuthorization();

  if (!hasPermission(permission)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * Role Gate - renders children only if user has role
 */
export function RoleGate({
  role,
  fallback = null,
  children,
}: {
  role: UserRole;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}) {
  const { hasRole } = useAuthorization();

  if (!hasRole(role)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * Any Permission Gate - renders children if user has any of the permissions
 */
export function AnyPermissionGate({
  permissions,
  fallback = null,
  children,
}: {
  permissions: Permission[];
  fallback?: React.ReactNode;
  children: React.ReactNode;
}) {
  const { permissionChecker } = useAuthorization();

  if (!permissionChecker?.hasAnyPermission(permissions)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * All Permissions Gate - renders children only if user has all permissions
 */
export function AllPermissionsGate({
  permissions,
  fallback = null,
  children,
}: {
  permissions: Permission[];
  fallback?: React.ReactNode;
  children: React.ReactNode;
}) {
  const { permissionChecker } = useAuthorization();

  if (!permissionChecker?.hasAllPermissions(permissions)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * Auth Gate - renders children only if user is authenticated
 */
export function AuthGate({
  fallback = null,
  children,
}: {
  fallback?: React.ReactNode;
  children: React.ReactNode;
}) {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * Security Alert Banner
 */
export function SecurityAlert({
  severity,
  message,
  onDismiss,
}: {
  severity: SecuritySeverity;
  message: string;
  onDismiss?: () => void;
}) {
  const colors = {
    [SecuritySeverity.LOW]: 'bg-blue-50 border-blue-200 text-blue-800',
    [SecuritySeverity.MEDIUM]: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    [SecuritySeverity.HIGH]: 'bg-orange-50 border-orange-200 text-orange-800',
    [SecuritySeverity.CRITICAL]: 'bg-red-50 border-red-200 text-red-800',
  };

  return (
    <div className={`border px-4 py-3 rounded-lg ${colors[severity]} relative`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <svg
            className="w-5 h-5 mr-2"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          <span className="font-medium">{message}</span>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="ml-4 hover:opacity-70"
          >
            <svg
              className="w-5 h-5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Security Stats Card
 */
export function SecurityStatsCard() {
  const { securityStats } = useSecurityMonitoring();

  const severityColors = {
    [SecuritySeverity.LOW]: 'text-blue-600',
    [SecuritySeverity.MEDIUM]: 'text-yellow-600',
    [SecuritySeverity.HIGH]: 'text-orange-600',
    [SecuritySeverity.CRITICAL]: 'text-red-600',
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="text-sm text-gray-500 mb-1">最近24小时</div>
        <div className="text-2xl font-bold text-gray-900">
          {securityStats.last24Hours}
        </div>
        <div className="text-xs text-gray-400 mt-1">安全事件</div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="text-sm text-gray-500 mb-1">最近7天</div>
        <div className="text-2xl font-bold text-gray-900">
          {securityStats.last7Days}
        </div>
        <div className="text-xs text-gray-400 mt-1">安全事件</div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="text-sm text-gray-500 mb-1">最近30天</div>
        <div className="text-2xl font-bold text-gray-900">
          {securityStats.last30Days}
        </div>
        <div className="text-xs text-gray-400 mt-1">安全事件</div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="text-sm text-gray-500 mb-1">活跃威胁</div>
        <div className={`text-2xl font-bold ${
          securityStats.activeThreats > 0 ? 'text-red-600' : 'text-green-600'
        }`}>
          {securityStats.activeThreats}
        </div>
        <div className="text-xs text-gray-400 mt-1">需要处理</div>
      </div>
    </div>
  );
}

/**
 * Login Form Component
 */
export function LoginForm({
  onSuccess,
  onError,
}: {
  onSuccess?: (user: any) => void;
  onError?: (error: Error) => void;
}) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const result = await login(email, password);
      onSuccess?.(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '登录失败';
      setError(errorMessage);
      onError?.(err instanceof Error ? err : new Error(errorMessage));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 text-center">
            ESS Financial
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            储能投资分析平台
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                邮箱地址
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                密码
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? '登录中...' : '登录'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/**
 * Protected Route Component
 */
export function ProtectedRoute({
  children,
  fallback = <LoginForm />,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}