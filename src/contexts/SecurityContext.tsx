/**
 * Security Context for Enterprise-level Security Management
 *
 * Provides centralized security state management including:
 * - Authentication state
 * - Authorization (RBAC)
 * - Security monitoring
 * - Compliance reporting
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  User,
  Session,
  authService,
  useAuth as useAuthService,
} from '../services/security/AuthenticationService';
import {
  PermissionChecker,
  UserRole,
  Permission,
  AuditLog,
  auditLogger,
} from '../services/security/RBAC';
import {
  SecurityManager,
  SecurityEvent,
  SecurityEventType,
  SecuritySeverity,
  securityManager,
  useSecurity,
} from '../services/security/SecurityCompliance';

/**
 * Security context state
 */
interface SecurityContextState {
  // Authentication
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;

  // Authorization
  permissionChecker: PermissionChecker | null;

  // Security monitoring
  securityStats: ReturnType<typeof securityManager.getSecurityStats>;

  // Actions
  login: (email: string, password: string) => Promise<any>;
  logout: () => Promise<void>;
  hasPermission: (permission: Permission) => boolean;
  hasRole: (role: UserRole) => boolean;
  recordSecurityEvent: (event: Omit<SecurityEvent, 'id'>) => void;
  generateComplianceReport: (days?: number) => ReturnType<typeof securityManager.generateComplianceReport>;
}

/**
 * Security context
 */
const SecurityContext = createContext<SecurityContextState | undefined>(undefined);

/**
 * Security provider props
 */
interface SecurityProviderProps {
  children: ReactNode;
}

/**
 * Security provider component
 */
export function SecurityProvider({ children }: SecurityProviderProps) {
  const auth = useAuthService();
  const security = useSecurity();

  const [permissionChecker, setPermissionChecker] = useState<PermissionChecker | null>(null);

  // Update permission checker when user changes
  useEffect(() => {
    if (auth.user) {
      const checker = new PermissionChecker([auth.user.role]);
      setPermissionChecker(checker);

      // Log login event
      securityManager.recordEvent({
        type: SecurityEventType.AUTHENTICATION,
        severity: SecuritySeverity.LOW,
        userId: auth.user.id,
        description: 'User logged in',
        details: {
          email: auth.user.email,
          role: auth.user.role,
        },
      });
    } else {
      setPermissionChecker(null);
    }
  }, [auth.user]);

  // Login wrapper with security logging
  const login = async (email: string, password: string) => {
    try {
      const result = await auth.login(email, password);

      // Record successful login
      securityManager.recordEvent({
        type: SecurityEventType.AUTHENTICATION,
        severity: SecuritySeverity.LOW,
        userId: result.user?.id,
        description: 'User login successful',
        details: {
          email: email,
          role: result.user?.role,
        },
      });

      return result;
    } catch (error) {
      // Record failed login attempt
      securityManager.recordEvent({
        type: SecurityEventType.AUTHENTICATION,
        severity: SecuritySeverity.MEDIUM,
        description: 'User login failed',
        details: {
          email: email,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      });

      throw error;
    }
  };

  // Logout wrapper with security logging
  const logout = async () => {
    if (auth.user) {
      // Log logout event
      auditLogger.log({
        userId: auth.user.id,
        userRole: auth.user.role,
        action: 'logout',
        resource: 'system',
        details: {
          email: auth.user.email,
        },
      });
    }

    await auth.logout();
  };

  // Permission check wrapper
  const hasPermission = (permission: Permission): boolean => {
    return permissionChecker?.hasPermission(permission) ?? false;
  };

  // Role check wrapper
  const hasRole = (role: UserRole): boolean => {
    return permissionChecker?.hasRole(role) ?? false;
  };

  // Security event recording wrapper
  const recordSecurityEvent = (event: Omit<SecurityEvent, 'id'>) => {
    securityManager.recordEvent(event);
  };

  // Compliance report generation wrapper
  const generateComplianceReport = (days?: number) => {
    return securityManager.generateComplianceReport(days);
  };

  const value: SecurityContextState = {
    // Authentication
    isAuthenticated: auth.isAuthenticated,
    user: auth.user,
    isLoading: auth.isLoading,

    // Authorization
    permissionChecker,

    // Security monitoring
    securityStats: security.securityStats,

    // Actions
    login,
    logout,
    hasPermission,
    hasRole,
    recordSecurityEvent,
    generateComplianceReport,
  };

  return (
    <SecurityContext.Provider value={value}>
      {children}
    </SecurityContext.Provider>
  );
}

/**
 * Hook to use security context
 */
export function useSecurityContext(): SecurityContextState {
  const context = useContext(SecurityContext);

  if (context === undefined) {
    throw new Error('useSecurityContext must be used within a SecurityProvider');
  }

  return context;
}

/**
 * Convenience hook for authentication
 */
export function useAuth() {
  const { isAuthenticated, user, isLoading, login, logout } = useSecurityContext();

  return {
    isAuthenticated,
    user,
    isLoading,
    login,
    logout,
  };
}

/**
 * Convenience hook for authorization
 */
export function useAuthorization() {
  const { permissionChecker, hasPermission, hasRole } = useSecurityContext();

  return {
    permissionChecker,
    hasPermission,
    hasRole,
  };
}

/**
 * Convenience hook for security monitoring
 */
export function useSecurityMonitoring() {
  const { securityStats, recordSecurityEvent, generateComplianceReport } = useSecurityContext();

  return {
    securityStats,
    recordSecurityEvent,
    generateComplianceReport,
  };
}