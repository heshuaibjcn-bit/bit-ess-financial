/**
 * Enterprise-level Security System
 *
 * Comprehensive security infrastructure including:
 * - Role-Based Access Control (RBAC)
 * - Authentication and Session Management
 * - Security Monitoring and Compliance
 * - Audit Logging
 *
 * @example
 * ```tsx
 * import { useAuth, useAuthorization, PermissionGate } from '@/services/security';
 *
 * function MyComponent() {
 *   const { user, isAuthenticated } = useAuth();
 *   const { hasPermission } = useAuthorization();
 *
 *   return (
 *     <PermissionGate permission={Permission.PROJECT_VIEW}>
 *       <SecureContent />
 *     </PermissionGate>
 *   );
 * }
 * ```
 */

// RBAC System
export {
  UserRole,
  Permission,
  PermissionCategory,
  ROLES_CONFIG,
  type RoleDefinition,
  type ResourceAction,
  PermissionChecker,
  AuditLogger,
  auditLogger,
  checkPermission,
  logAction,
  useRBAC,
} from './RBAC';

export type {
  AuditLog,
} from './RBAC';

// Authentication Service
export {
  AuthenticationService,
  authService,
  useAuth as useAuthService,
} from './AuthenticationService';

export type {
  User,
  Session,
  LoginAttempt,
  AuthConfig,
} from './AuthenticationService';

// Security Compliance
export {
  SecurityManager,
  securityManager,
  useSecurity,
} from './SecurityCompliance';

export {
  SecurityEventType,
  SecuritySeverity,
} from './SecurityCompliance';

export type {
  SecurityEvent,
  ComplianceReport,
} from './SecurityCompliance';

// Security Context
export {
  SecurityProvider,
  useSecurityContext,
  useAuth,
  useAuthorization,
  useSecurityMonitoring,
} from '../../contexts/SecurityContext';

export type {
  SecurityContextState,
} from '../../contexts/SecurityContext';

// Security Components
export {
  PermissionGate,
  RoleGate,
  AnyPermissionGate,
  AllPermissionsGate,
  AuthGate,
  SecurityAlert,
  SecurityStatsCard,
  LoginForm,
  ProtectedRoute as SecureRoute,
} from '../../components/security/SecurityComponents';