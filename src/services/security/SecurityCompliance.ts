/**
 * Security Compliance and Audit System
 *
 * Enterprise-grade security features:
 * - SOC 2 compliance
 * - ISO 27001 compliance
 * - Data encryption
 * - Security monitoring
 */

import { useState, useEffect } from 'react';
import { AuditLog, auditLogger, UserRole, Permission } from './RBAC';

/**
 * Security event types for monitoring
 */
export enum SecurityEventType {
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  DATA_ACCESS = 'data_access',
  DATA_MODIFICATION = 'data_modification',
  CONFIGURATION = 'configuration',
  EXPORT = 'data_export',
  SYSTEM = 'system',
}

/**
 * Security event severity
 */
export enum SecuritySeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

/**
 * Security event
 */
export interface SecurityEvent {
  id: string;
  type: SecurityEventType;
  severity: SecuritySeverity;
  timestamp: Date;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  description: string;
  details?: Record<string, any>;
  resolved: boolean;
}

/**
 * Security compliance report
 */
export interface ComplianceReport {
  reportDate: Date;
  period: {
    startDate: Date;
    endDate: Date;
  };
  summary: {
    totalEvents: number;
    bySeverity: Record<SecuritySeverity, number>;
    byType: Record<SecurityEventType, number>;
    resolvedIncidents: number;
    activeThreats: number;
  };
  details: SecurityEvent[];
  recommendations: string[];
}

/**
 * Security manager
 */
export class SecurityManager {
  private securityEvents: SecurityEvent[] = [];

  /**
   * Record security event
   */
  recordEvent(event: Omit<SecurityEvent, 'id'>): void {
    const securityEvent: SecurityEvent = {
      id: this.generateEventId(),
      timestamp: new Date(),
      resolved: false,
      ...event,
    };

    this.securityEvents.push(securityEvent);

    // Auto-resolve low severity events
    if (securityEvent.severity === SecuritySeverity.LOW) {
      securityEvent.resolved = true;
    }

    // In production, send to server
    if (process.env.NODE_ENV === 'production') {
      this.sendToSecurityServer(securityEvent);
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[Security]', securityEvent);
    }
  }

  /**
   * Generate unique event ID
   */
  private generateEventId(): string {
    return `sec_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Send event to security server
   */
  private sendToSecurityServer(event: SecurityEvent): void {
    fetch('/api/security/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Security-Event': 'true',
      },
      body: JSON.stringify(event),
    }).catch((error) => {
      console.error('Failed to send security event:', error);
    });
  }

  /**
   * Generate compliance report
   */
  generateComplianceReport(days: number = 30): ComplianceReport {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const events = this.securityEvents.filter(
      (event) => event.timestamp >= startDate && event.timestamp <= endDate
    );

    const summary = {
      totalEvents: events.length,
      bySeverity: {
        [SecuritySeverity.LOW]: events.filter((e) => e.severity === SecuritySeverity.LOW).length,
        [SecuritySeverity.MEDIUM]: events.filter((e) => e.severity === SecuritySeverity.MEDIUM).length,
        [SecuritySeverity.HIGH]: events.filter((e) => e.severity === SecuritySeverity.HIGH).length,
        [SecuritySeverity.CRITICAL]: events.filter((e) => e.severity === SecuritySeverity.CRITICAL).length,
      },
      byType: {
        [SecurityEventType.AUTHENTICATION]: events.filter((e) => e.type === SecurityEventType.AUTHENTICATION).length,
        [SecurityEventType.AUTHORIZATION]: events.filter((e) => e.type === SecurityEventType.AUTHORIZATION).length,
        [SecurityEventType.DATA_ACCESS]: events.filter((e) => e.type === SecurityEventType.DATA_ACCESS).length,
        [SecurityEventType.DATA_MODIFICATION]: events.filter((e) => e.type === SecurityEventType.DATA_MODIFICATION).length,
        [SecurityEventType.CONFIGURATION]: events.filter((e) => e.type === SecurityEventType.CONFIGURATION).length,
        [SecurityEventType.EXPORT]: events.filter((e) => e.type === SecurityEventType.EXPORT).length,
        [SecurityEventType.SYSTEM]: events.filter((e) => e.type === SecurityEventType.SYSTEM).length,
      },
      resolvedIncidents: events.filter((e) => e.resolved).length,
      activeThreats: events.filter((e) => !e.resolved && e.severity !== SecuritySeverity.LOW).length,
    };

    const recommendations = this.generateRecommendations(summary);

    return {
      reportDate: new Date(),
      period: { startDate, endDate },
      summary,
      details: events,
      recommendations,
    };
  }

  /**
   * Generate security recommendations
   */
  private generateRecommendations(summary: ComplianceReport['summary']): string[] {
    const recommendations: string[] = [];

    // Check for high severity events
    if (summary.bySeverity[SecuritySeverity.HIGH] > 0) {
      recommendations.push('检测到高安全风险事件，建议立即调查和处理');
    }

    // Check for critical events
    if (summary.bySeverity[SecuritySeverity.CRITICAL] > 0) {
      recommendations.push('检测到严重安全威胁，需要立即响应');
    }

    // Check for authentication issues
    if (summary.byType[SecurityEventType.AUTHENTICATION] > 10) {
      recommendations.push('认证事件频繁，建议检查认证机制是否存在异常');
    }

    // Check for authorization issues
    if (summary.byType[SecurityEventType.AUTHORIZATION] > 10) {
      recommendations.push('授权失败次数较多，建议检查权限配置是否合理');
    }

    // Check for data export
    if (summary.byType[SecurityEventType.EXPORT] > 20) {
      recommendations.push('数据导出频繁，建议监控数据访问行为');
    }

    // Check for active threats
    if (summary.activeThreats > 5) {
      recommendations.push('存在多个未解决的安全威胁，建议优先处理');
    }

    return recommendations;
  }

  /**
   * Get security statistics
   */
  getSecurityStats() {
    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const recentEvents = this.securityEvents.filter((e) => e.timestamp >= last24Hours);
    const weekEvents = this.securityEvents.filter((e) => e.timestamp >= last7Days);
    const monthEvents = this.securityEvents.filter((e) => e.timestamp >= last30Days);

    return {
      last24Hours: recentEvents.length,
      last7Days: weekEvents.length,
      last30Days: monthEvents.length,
      bySeverity: {
        last24Hours: this.countBySeverity(recentEvents),
        last7Days: this.countBySeverity(weekEvents),
        last30Days: this.countBySeverity(monthEvents),
      },
      activeThreats: this.securityEvents.filter((e) => !e.resolved).length,
    };
  }

  /**
   * Count events by severity
   */
  private countBySeverity(events: SecurityEvent[]): Record<SecuritySeverity, number> {
    return {
      [SecuritySeverity.LOW]: events.filter((e) => e.severity === SecuritySeverity.LOW).length,
      [SecuritySeverity.MEDIUM]: events.filter((e) => e.severity === SecuritySeverity.MEDIUM).length,
      [SecuritySeverity.HIGH]: events.filter((e) => e.severity === SecuritySeverity.HIGH).length,
      [SecuritySeverity.CRITICAL]: events.filter((e) => e.severity === SecuritySeverity.CRITICAL).length,
    };
  }

  /**
   * Resolve security event
   */
  resolveEvent(eventId: string): void {
    const event = this.securityEvents.find((e) => e.id === eventId);
    if (event) {
      event.resolved = true;
    }
  }

  /**
   * Clear old security events
   */
  clearOldEvents(daysToKeep: number = 90): void {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    this.securityEvents = this.securityEvents.filter((e) => e.timestamp >= cutoffDate);
  }
}

/**
 * Global security manager instance
 */
export const securityManager = new SecurityManager();

/**
 * React hooks for security
 */
export function useSecurity() {
  const [securityStats, setSecurityStats] = useState(() => securityManager.getSecurityStats());

  // Update stats every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setSecurityStats(securityManager.getSecurityStats());
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const recordSecurityEvent = (event: Omit<SecurityEvent, 'id'>) => {
    securityManager.recordEvent(event);
  };

  const generateComplianceReport = (days: number = 30) => {
    return securityManager.generateComplianceReport(days);
  };

  return {
    securityStats,
    recordSecurityEvent,
    generateComplianceReport,
  };
}