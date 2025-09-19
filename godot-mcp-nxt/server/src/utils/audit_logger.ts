// Audit Logging System for Godot MCP Server
// Comprehensive logging of all operations for security, compliance, and debugging

export interface AuditEvent {
  id: string;
  timestamp: number;
  level: 'info' | 'warn' | 'error' | 'security' | 'performance';
  category: 'authentication' | 'authorization' | 'operation' | 'system' | 'security' | 'performance';
  operation: string;
  userId?: string;
  sessionId?: string;
  clientId?: string;
  ipAddress?: string;
  userAgent?: string;
  resource: string;
  action: string;
  parameters: Record<string, any>;
  result: {
    success: boolean;
    errorCode?: string;
    errorMessage?: string;
    duration?: number;
    affectedResources?: string[];
  };
  metadata: Record<string, any>;
  tags: string[];
}

export interface AuditLogConfig {
  enabled: boolean;
  logLevel: 'info' | 'warn' | 'error' | 'security' | 'performance';
  maxLogSize: number; // Maximum number of log entries to keep in memory
  retentionDays: number; // How long to keep logs
  sensitiveFields: string[]; // Fields to redact in logs
  logToConsole: boolean;
  logToFile: boolean;
  logFilePath?: string;
  remoteLogging?: {
    enabled: boolean;
    endpoint: string;
    apiKey: string;
    batchSize: number;
    flushInterval: number;
  };
}

export class AuditLogger {
  private logs: AuditEvent[] = [];
  private config: AuditLogConfig;
  private pendingBatch: AuditEvent[] = [];
  private flushTimer?: NodeJS.Timeout;

  constructor(config: Partial<AuditLogConfig> = {}) {
    this.config = {
      enabled: true,
      logLevel: 'info',
      maxLogSize: 10000,
      retentionDays: 30,
      sensitiveFields: ['password', 'token', 'apiKey', 'secret'],
      logToConsole: true,
      logToFile: false,
      ...config
    };

    if (this.config.remoteLogging?.enabled) {
      this.startBatchFlushTimer();
    }
  }

  // Log an audit event
  async log(event: Omit<AuditEvent, 'id' | 'timestamp'>): Promise<void> {
    if (!this.config.enabled) return;

    // Check if this log level should be recorded
    if (!this.shouldLogLevel(event.level)) return;

    const auditEvent: AuditEvent = {
      id: this.generateEventId(),
      timestamp: Date.now(),
      ...event,
      parameters: this.redactSensitiveFields(event.parameters),
      metadata: this.redactSensitiveFields(event.metadata)
    };

    // Add to in-memory log
    this.logs.push(auditEvent);

    // Maintain log size limit
    if (this.logs.length > this.config.maxLogSize) {
      this.logs.shift();
    }

    // Log to console if enabled
    if (this.config.logToConsole) {
      this.logToConsole(auditEvent);
    }

    // Log to file if enabled
    if (this.config.logToFile && this.config.logFilePath) {
      await this.logToFile(auditEvent);
    }

    // Add to batch for remote logging
    if (this.config.remoteLogging?.enabled) {
      this.pendingBatch.push(auditEvent);

      // Flush if batch is full
      if (this.pendingBatch.length >= this.config.remoteLogging.batchSize) {
        await this.flushBatch();
      }
    }

    // Emit event for real-time monitoring
    this.emitAuditEvent(auditEvent);
  }

  // Convenience methods for different types of events
  async logOperation(
    operation: string,
    clientId: string,
    parameters: Record<string, any>,
    result: AuditEvent['result'],
    metadata: Record<string, any> = {}
  ): Promise<void> {
    await this.log({
      level: result.success ? 'info' : 'error',
      category: 'operation',
      operation,
      clientId,
      resource: parameters.resource || operation,
      action: operation,
      parameters,
      result,
      metadata,
      tags: ['operation', result.success ? 'success' : 'failure']
    });
  }

  async logSecurity(
    event: string,
    clientId: string,
    details: Record<string, any>,
    severity: 'info' | 'warn' | 'error' | 'security' = 'security'
  ): Promise<void> {
    await this.log({
      level: severity,
      category: 'security',
      operation: event,
      clientId,
      resource: 'security',
      action: event,
      parameters: details,
      result: { success: true },
      metadata: {},
      tags: ['security', severity]
    });
  }

  async logPerformance(
    operation: string,
    clientId: string,
    duration: number,
    metadata: Record<string, any> = {}
  ): Promise<void> {
    const level = duration > 5000 ? 'warn' : duration > 1000 ? 'info' : 'info';

    await this.log({
      level,
      category: 'performance',
      operation,
      clientId,
      resource: 'performance',
      action: 'operation_timing',
      parameters: { duration },
      result: { success: true, duration },
      metadata,
      tags: ['performance', duration > 5000 ? 'slow' : 'normal']
    });
  }

  async logSystem(
    event: string,
    details: Record<string, any>,
    level: AuditEvent['level'] = 'info'
  ): Promise<void> {
    await this.log({
      level,
      category: 'system',
      operation: event,
      resource: 'system',
      action: event,
      parameters: details,
      result: { success: true },
      metadata: {},
      tags: ['system', level]
    });
  }

  // Query logs
  getLogs(options: {
    level?: AuditEvent['level'];
    category?: AuditEvent['category'];
    operation?: string;
    clientId?: string;
    since?: number;
    until?: number;
    limit?: number;
    tags?: string[];
  } = {}): AuditEvent[] {
    let filtered = [...this.logs];

    if (options.level) {
      filtered = filtered.filter(log => log.level === options.level);
    }

    if (options.category) {
      filtered = filtered.filter(log => log.category === options.category);
    }

    if (options.operation) {
      filtered = filtered.filter(log => log.operation === options.operation);
    }

    if (options.clientId) {
      filtered = filtered.filter(log => log.clientId === options.clientId);
    }

    if (options.since != null) {
      filtered = filtered.filter(log => log.timestamp >= options.since!);
    }

    if (options.until != null) {
      filtered = filtered.filter(log => log.timestamp <= options.until!);
    }

    if (options.tags && options.tags.length > 0) {
      filtered = filtered.filter(log =>
        options.tags!.some(tag => log.tags.includes(tag))
      );
    }

    if (options.limit) {
      filtered = filtered.slice(-options.limit);
    }

    return filtered.reverse(); // Most recent first
  }

  // Get statistics
  getStatistics(timeRange?: number): {
    totalEvents: number;
    eventsByLevel: Record<string, number>;
    eventsByCategory: Record<string, number>;
    eventsByOperation: Record<string, number>;
    averageResponseTime: number;
    errorRate: number;
    securityEvents: number;
  } {
    const relevantLogs = timeRange
      ? this.logs.filter(log => Date.now() - log.timestamp <= timeRange)
      : this.logs;

    const stats = {
      totalEvents: relevantLogs.length,
      eventsByLevel: {} as Record<string, number>,
      eventsByCategory: {} as Record<string, number>,
      eventsByOperation: {} as Record<string, number>,
      averageResponseTime: 0,
      errorRate: 0,
      securityEvents: 0
    };

    let totalResponseTime = 0;
    let responseTimeCount = 0;
    let errorCount = 0;

    for (const log of relevantLogs) {
      // Count by level
      stats.eventsByLevel[log.level] = (stats.eventsByLevel[log.level] || 0) + 1;

      // Count by category
      stats.eventsByCategory[log.category] = (stats.eventsByCategory[log.category] || 0) + 1;

      // Count by operation
      stats.eventsByOperation[log.operation] = (stats.eventsByOperation[log.operation] || 0) + 1;

      // Track response times
      if (log.result.duration) {
        totalResponseTime += log.result.duration;
        responseTimeCount++;
      }

      // Track errors
      if (!log.result.success) {
        errorCount++;
      }

      // Count security events
      if (log.category === 'security' || log.level === 'security') {
        stats.securityEvents++;
      }
    }

    stats.averageResponseTime = responseTimeCount > 0 ? totalResponseTime / responseTimeCount : 0;
    stats.errorRate = relevantLogs.length > 0 ? errorCount / relevantLogs.length : 0;

    return stats;
  }

  // Export logs
  async exportLogs(options: {
    format: 'json' | 'csv';
    since?: number;
    until?: number;
    filter?: Partial<AuditEvent>;
  } = { format: 'json' }): Promise<string> {
    let logsToExport = [...this.logs];

    if (options.since) {
      logsToExport = logsToExport.filter(log => log.timestamp >= options.since!);
    }

    if (options.until) {
      logsToExport = logsToExport.filter(log => log.timestamp <= options.until!);
    }

    if (options.filter) {
      logsToExport = logsToExport.filter(log => {
        return Object.entries(options.filter!).every(([key, value]) => {
          return (log as any)[key] === value;
        });
      });
    }

    if (options.format === 'csv') {
      return this.convertToCSV(logsToExport);
    } else {
      return JSON.stringify(logsToExport, null, 2);
    }
  }

  // Cleanup old logs
  cleanup(retentionMs?: number): number {
    const cutoffTime = Date.now() - (retentionMs || (this.config.retentionDays * 24 * 60 * 60 * 1000));
    const initialLength = this.logs.length;

    this.logs = this.logs.filter(log => log.timestamp >= cutoffTime);

    const removed = initialLength - this.logs.length;
    console.log(`Cleaned up ${removed} old audit log entries`);

    return removed;
  }

  // Private methods
  private shouldLogLevel(level: AuditEvent['level']): boolean {
    const levels = ['info', 'warn', 'error', 'security', 'performance'];
    const configLevelIndex = levels.indexOf(this.config.logLevel);
    const eventLevelIndex = levels.indexOf(level);

    return eventLevelIndex >= configLevelIndex;
  }

  private redactSensitiveFields(data: Record<string, any>): Record<string, any> {
    const redacted = { ...data };

    for (const field of this.config.sensitiveFields) {
      if (redacted[field]) {
        redacted[field] = '[REDACTED]';
      }
    }

    return redacted;
  }

  private generateEventId(): string {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private logToConsole(event: AuditEvent): void {
    const timestamp = new Date(event.timestamp).toISOString();
    const level = event.level.toUpperCase();
    const message = `[${timestamp}] ${level} [${event.category}] ${event.operation}`;

    switch (event.level) {
      case 'error':
      case 'security':
        console.error(message, event);
        break;
      case 'warn':
        console.warn(message, event);
        break;
      default:
        console.log(message, event);
    }
  }

  private async logToFile(event: AuditEvent): Promise<void> {
    try {
      const fs = require('fs').promises;
      const logEntry = JSON.stringify(event) + '\n';
      await fs.appendFile(this.config.logFilePath!, logEntry);
    } catch (error) {
      console.error('Failed to write audit log to file:', error);
    }
  }

  private async flushBatch(): Promise<void> {
    if (this.pendingBatch.length === 0 || !this.config.remoteLogging) return;

    try {
      const response = await fetch(this.config.remoteLogging.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.remoteLogging.apiKey}`
        },
        body: JSON.stringify({ events: this.pendingBatch })
      });

      if (response.ok) {
        console.log(`Successfully sent ${this.pendingBatch.length} audit events to remote logging`);
        this.pendingBatch.length = 0; // Clear the batch
      } else {
        console.error('Failed to send audit events to remote logging:', response.statusText);
      }
    } catch (error) {
      console.error('Error sending audit events to remote logging:', error);
    }
  }

  private startBatchFlushTimer(): void {
    if (!this.config.remoteLogging) return;

    this.flushTimer = setInterval(async () => {
      if (this.pendingBatch.length > 0) {
        await this.flushBatch();
      }
    }, this.config.remoteLogging.flushInterval);
  }

  private convertToCSV(logs: AuditEvent[]): string {
    if (logs.length === 0) return '';

    const headers = [
      'id', 'timestamp', 'level', 'category', 'operation', 'clientId',
      'resource', 'action', 'success', 'errorCode', 'errorMessage', 'duration'
    ];

    const rows = logs.map(log => [
      log.id,
      new Date(log.timestamp).toISOString(),
      log.level,
      log.category,
      log.operation,
      log.clientId || '',
      log.resource,
      log.action,
      log.result.success.toString(),
      log.result.errorCode || '',
      log.result.errorMessage || '',
      log.result.duration?.toString() || ''
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    return csvContent;
  }

  private emitAuditEvent(event: AuditEvent): void {
    // Emit for real-time monitoring systems
    // This could be enhanced to use EventEmitter or similar
    console.log('Audit event emitted:', event.id);
  }
}

// Global audit logger instance
let globalAuditLogger: AuditLogger | null = null;

export function getAuditLogger(config?: Partial<AuditLogConfig>): AuditLogger {
  if (!globalAuditLogger) {
    globalAuditLogger = new AuditLogger(config);
  }
  return globalAuditLogger;
}

// Utility functions for common audit scenarios
export const AuditUtils = {
  createOperationEvent: (
    operation: string,
    clientId: string,
    parameters: Record<string, any>,
    result: AuditEvent['result']
  ): Omit<AuditEvent, 'id' | 'timestamp'> => ({
    level: result.success ? 'info' : 'error',
    category: 'operation',
    operation,
    clientId,
    resource: parameters.resource || operation,
    action: operation,
    parameters,
    result,
    metadata: {},
    tags: ['operation', result.success ? 'success' : 'failure']
  }),

  createSecurityEvent: (
    event: string,
    clientId: string,
    details: Record<string, any>
  ): Omit<AuditEvent, 'id' | 'timestamp'> => ({
    level: 'security',
    category: 'security',
    operation: event,
    clientId,
    resource: 'security',
    action: event,
    parameters: details,
    result: { success: true },
    metadata: {},
    tags: ['security']
  }),

  createPerformanceEvent: (
    operation: string,
    clientId: string,
    duration: number
  ): Omit<AuditEvent, 'id' | 'timestamp'> => ({
    level: duration > 5000 ? 'warn' : 'info',
    category: 'performance',
    operation,
    clientId,
    resource: 'performance',
    action: 'timing',
    parameters: { duration },
    result: { success: true, duration },
    metadata: {},
    tags: ['performance']
  })
};