/**
 * Role-Based Access Control (RBAC) System
 *
 * Enterprise-grade permission management with:
 * - Hierarchical roles and permissions
 * - Fine-grained resource control
 * - Dynamic permission checking
 * - Audit logging
 */

/**
 * Available roles in the system
 */
export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  MANAGER = 'manager',
  USER = 'user',
  VIEWER = 'viewer',
  GUEST = 'guest',
}

/**
 * Permission categories
 */
export enum PermissionCategory {
  PROJECT = 'project',
  CALCULATION = 'calculation',
  REPORT = 'report',
  USER = 'user',
  SYSTEM = 'system',
  AUDIT = 'audit',
}

/**
 * Individual permissions
 */
export enum Permission {
  // Project permissions
  PROJECT_CREATE = 'project:create',
  PROJECT_VIEW = 'project:view',
  PROJECT_EDIT = 'project:edit',
  PROJECT_DELETE = 'project:delete',
  PROJECT_SHARE = 'project:share',
  PROJECT_EXPORT = 'project:export',

  // Calculation permissions
  CALCULATION_RUN = 'calculation:run',
  CALCULATION_VIEW = 'calculation:view',
  CALCULATION_DELETE = 'calculation:delete',

  // Report permissions
  REPORT_GENERATE = 'report:generate',
  REPORT_VIEW = 'report:view',
  REPORT_EXPORT = 'report:export',
  REPORT_DELETE = 'report:delete',

  // User permissions
  USER_CREATE = 'user:create',
  USER_VIEW = 'user:view',
  USER_EDIT = 'user:edit',
  USER_DELETE = 'user:delete',
  USER_MANAGE_ROLES = 'user:manage_roles',

  // System permissions
  SYSTEM_SETTINGS = 'system:settings',
  SYSTEM_LOGS = 'system:logs',
  SYSTEM_BACKUP = 'system:backup',
  SYSTEM_MONITORING = 'system:monitoring',

  // Audit permissions
  AUDIT_VIEW = 'audit:view',
  AUDIT_EXPORT = 'audit:export',
  AUDIT_DELETE = 'audit:delete',
}

/**
 * Role definition with permissions
 */
export interface RoleDefinition {
  name: UserRole;
  displayName: string;
  description: string;
  permissions: Permission[];
  inheritsFrom?: UserRole[];
}

/**
 * RBAC configuration
 */
export const ROLES_CONFIG: Record<UserRole, RoleDefinition> = {
  [UserRole.SUPER_ADMIN]: {
    name: UserRole.SUPER_ADMIN,
    displayName: '超级管理员',
    description: '拥有所有权限的超级管理员',
    permissions: Object.values(Permission),
  },

  [UserRole.ADMIN]: {
    name: UserRole.ADMIN,
    displayName: '管理员',
    description: '系统管理员，可以管理大部分功能',
    permissions: [
      Permission.PROJECT_CREATE,
      Permission.PROJECT_VIEW,
      Permission.PROJECT_EDIT,
      Permission.PROJECT_DELETE,
      Permission.PROJECT_SHARE,
      Permission.PROJECT_EXPORT,
      Permission.CALCULATION_RUN,
      Permission.CALCULATION_VIEW,
      Permission.CALCULATION_DELETE,
      Permission.REPORT_GENERATE,
      Permission.REPORT_VIEW,
      Permission.REPORT_EXPORT,
      Permission.USER_VIEW,
      Permission.USER_EDIT,
      Permission.SYSTEM_SETTINGS,
      Permission.SYSTEM_LOGS,
      Permission.AUDIT_VIEW,
      Permission.AUDIT_EXPORT,
    ],
    inheritsFrom: [UserRole.MANAGER],
  },

  [UserRole.MANAGER]: {
    name: UserRole.MANAGER,
    displayName: '经理',
    description: '可以管理项目和团队',
    permissions: [
      Permission.PROJECT_CREATE,
      Permission.PROJECT_VIEW,
      Permission.PROJECT_EDIT,
      Permission.PROJECT_DELETE,
      Permission.PROJECT_SHARE,
      Permission.PROJECT_EXPORT,
      Permission.CALCULATION_RUN,
      Permission.CALCULATION_VIEW,
      Permission.REPORT_GENERATE,
      Permission.REPORT_VIEW,
      Permission.REPORT_EXPORT,
      Permission.USER_VIEW,
    ],
    inheritsFrom: [UserRole.USER],
  },

  [UserRole.USER]: {
    name: UserRole.USER,
    displayName: '用户',
    description: '普通用户，可以创建和管理自己的项目',
    permissions: [
      Permission.PROJECT_CREATE,
      Permission.PROJECT_VIEW,
      Permission.PROJECT_EDIT,
      Permission.PROJECT_DELETE,
      Permission.CALCULATION_RUN,
      Permission.CALCULATION_VIEW,
      Permission.REPORT_GENERATE,
      Permission.REPORT_VIEW,
      Permission.REPORT_EXPORT,
    ],
  },

  [UserRole.VIEWER]: {
    name: UserRole.VIEWER,
    displayName: '查看者',
    description: '只能查看，不能编辑',
    permissions: [
      Permission.PROJECT_VIEW,
      Permission.CALCULATION_VIEW,
      Permission.REPORT_VIEW,
    ],
  },

  [UserRole.GUEST]: {
    name: UserRole.GUEST,
    displayName: '访客',
    description: '未登录用户，只能使用演示模式',
    permissions: [],
  },
};

/**
 * Resource action
 */
export interface ResourceAction {
  resource: string;
  action: string;
  category: PermissionCategory;
}

/**
 * Permission checker
 */
export class PermissionChecker {
  private userRoles: Set<UserRole>;
  private userPermissions: Set<Permission>;

  constructor(roles: UserRole[] = []) {
    this.userRoles = new Set(roles);
    this.userPermissions = new Set();
    this.calculatePermissions();
  }

  /**
   * Calculate all permissions based on roles (including inherited)
   */
  private calculatePermissions(): void {
    this.userPermissions.clear();

    for (const role of this.userRoles) {
      const roleDefinition = ROLES_CONFIG[role];

      if (!roleDefinition) {
        console.warn(`Unknown role: ${role}`);
        continue;
      }

      // Add direct permissions
      roleDefinition.permissions.forEach((permission) => {
        this.userPermissions.add(permission);
      });

      // Add inherited permissions
      if (roleDefinition.inheritsFrom) {
        for (const inheritedRole of roleDefinition.inheritsFrom) {
          const inheritedDefinition = ROLES_CONFIG[inheritedRole];
          if (inheritedDefinition) {
            inheritedDefinition.permissions.forEach((permission) => {
              this.userPermissions.add(permission);
            });
          }
        }
      }
    }
  }

  /**
   * Check if user has specific permission
   */
  hasPermission(permission: Permission): boolean {
    return this.userPermissions.has(permission);
  }

  /**
   * Check if user has any of the specified permissions
   */
  hasAnyPermission(permissions: Permission[]): boolean {
    return permissions.some((permission) => this.userPermissions.has(permission));
  }

  /**
   * Check if user has all of the specified permissions
   */
  hasAllPermissions(permissions: Permission[]): boolean {
    return permissions.every((permission) => this.userPermissions.has(permission));
  }

  /**
   * Check if user has role
   */
  hasRole(role: UserRole): boolean {
    return this.userRoles.has(role);
  }

  /**
   * Check if user has any of the specified roles
   */
  hasAnyRole(roles: UserRole[]): boolean {
    return roles.some((role) => this.userRoles.has(role));
  }

  /**
   * Get all user permissions
   */
  getPermissions(): Permission[] {
    return Array.from(this.userPermissions);
  }

  /**
   * Get all user roles
   */
  getRoles(): UserRole[] {
    return Array.from(this.userRoles);
  }

  /**
   * Check if user can perform action on resource
   */
  canPerformAction(action: ResourceAction): boolean {
    // Super admin can do anything
    if (this.hasRole(UserRole.SUPER_ADMIN)) {
      return true;
    }

    // Check specific permission based on action
    const permission = this.actionToPermission(action);
    if (permission) {
      return this.hasPermission(permission);
    }

    return false;
  }

  /**
   * Convert action to permission
   */
  private actionToPermission(action: ResourceAction): Permission | null {
    const permissionKey = `${action.resource}:${action}`.toUpperCase().replace(/[^A-Z0-9_]/g, '_') as Permission;

    if (Object.values(Permission).includes(permissionKey)) {
      return permissionKey;
    }

    return null;
  }

  /**
   * Add role to user
   */
  addRole(role: UserRole): void {
    this.userRoles.add(role);
    this.calculatePermissions();
  }

  /**
   * Remove role from user
   */
  removeRole(role: UserRole): void {
    this.userRoles.delete(role);
    this.calculatePermissions();
  }

  /**
   * Set user roles
   */
  setRoles(roles: UserRole[]): void {
    this.userRoles = new Set(roles);
    this.calculatePermissions();
  }
}

/**
 * Audit log entry
 */
export interface AuditLog {
  id: string;
  timestamp: Date;
  userId: string;
  userRole: UserRole;
  action: string;
  resource: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
  errorMessage?: string;
}

/**
 * Audit log manager
 */
export class AuditLogger {
  private logs: AuditLog[] = [];

  /**
   * Log an action
   */
  log(action: {
    userId: string;
    userRole: UserRole;
    action: string;
    resource: string;
    details?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
    success?: boolean;
    errorMessage?: string;
  }): void {
    const logEntry: AuditLog = {
      id: this.generateLogId(),
      timestamp: new Date(),
      userId: action.userId,
      userRole: action.userRole,
      action: action.action,
      resource: action.resource,
      details: action.details,
      ipAddress: action.ipAddress,
      userAgent: action.userAgent,
      success: action.success ?? true,
      errorMessage: action.errorMessage,
    };

    this.logs.push(logEntry);

    // Keep only last 10,000 logs
    if (this.logs.length > 10000) {
      this.logs = this.logs.slice(-10000);
    }

    // In production, send to server
    this.sendToServer(logEntry);
  }

  /**
   * Query audit logs
   */
  query(filters: {
    userId?: string;
    action?: string;
    resource?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }): AuditLog[] {
    let filtered = [...this.logs];

    if (filters.userId) {
      filtered = filtered.filter((log) => log.userId === filters.userId);
    }

    if (filters.action) {
      filtered = filtered.filter((log) => log.action === filters.action);
    }

    if (filters.resource) {
      filtered = filtered.filter((log) => log.resource.includes(filters.resource));
    }

    if (filters.startDate) {
      filtered = filtered.filter((log) => log.timestamp >= filters.startDate);
    }

    if (filters.endDate) {
      filtered = filtered.filter((log) => log.timestamp <= filters.endDate);
    }

    if (filters.limit) {
      filtered = filtered.slice(-filters.limit);
    }

    return filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Generate unique log ID
   */
  private generateLogId(): string {
    return `audit_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Send log to server (in production)
   */
  private sendToServer(log: AuditLog): void {
    if (process.env.NODE_ENV === 'production') {
      // Send to server
      fetch('/api/audit/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(log),
      }).catch((error) => {
        console.error('Failed to send audit log:', error);
      });
    }
  }

  /**
   * Export audit logs
   */
  export(format: 'json' | 'csv' = 'json'): string {
    if (format === 'json') {
      return JSON.stringify(this.logs, null, 2);
    }

    if (format === 'csv') {
      const headers = ['id', 'timestamp', 'userId', 'userRole', 'action', 'resource', 'success', 'errorMessage'];
      const rows = this.logs.map((log) => [
        log.id,
        log.timestamp.toISOString(),
        log.userId,
        log.userRole,
        log.action,
        log.resource,
        log.success,
        log.errorMessage || '',
      ]);

      return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    }

    return '';
  }

  /**
   * Clear old logs
   */
  clearOldLogs(daysToKeep: number = 90): void {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    this.logs = this.logs.filter((log) => log.timestamp >= cutoffDate);
  }
}

/**
 * Global audit logger instance
 */
export const auditLogger = new AuditLogger();

/**
 * Convenience function to check permission
 */
export function checkPermission(
  userRoles: UserRole[],
  permission: Permission
): boolean {
  const checker = new PermissionChecker(userRoles);
  return checker.hasPermission(permission);
}

/**
 * Convenience function to log action
 */
export function logAction(action: {
  userId: string;
  userRole: UserRole;
  action: string;
  resource: string;
  details?: Record<string, any>;
  success?: boolean;
}): void {
  auditLogger.log(action);
}

/**
 * React hook for RBAC
 */
export function useRBAC(userRoles: UserRole[] = []) {
  const [permissionChecker, setPermissionChecker] = useState<PermissionChecker | null>(null);

  useEffect(() => {
    setPermissionChecker(new PermissionChecker(userRoles));
  }, [userRoles]);

  const hasPermission = (permission: Permission) => {
    return permissionChecker?.hasPermission(permission) ?? false;
  };

  const hasRole = (role: UserRole) => {
    return permissionChecker?.hasRole(role) ?? false;
  };

  const canPerformAction = (action: ResourceAction) => {
    return permissionChecker?.canPerformAction(action) ?? false;
  };

  return {
    hasPermission,
    hasRole,
    canPerformAction,
    permissionChecker,
  };
}