// Audit Logging System for Godot MCP Server
// Comprehensive logging of all operations for security, compliance, and debugging
export class AuditLogger {
    constructor(config = {}) {
        this.logs = [];
        this.pendingBatch = [];
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
    async log(event) {
        if (!this.config.enabled)
            return;
        // Check if this log level should be recorded
        if (!this.shouldLogLevel(event.level))
            return;
        const auditEvent = {
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
    async logOperation(operation, clientId, parameters, result, metadata = {}) {
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
    async logSecurity(event, clientId, details, severity = 'security') {
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
    async logPerformance(operation, clientId, duration, metadata = {}) {
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
    async logSystem(event, details, level = 'info') {
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
    getLogs(options = {}) {
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
            filtered = filtered.filter(log => log.timestamp >= options.since);
        }
        if (options.until != null) {
            filtered = filtered.filter(log => log.timestamp <= options.until);
        }
        if (options.tags && options.tags.length > 0) {
            filtered = filtered.filter(log => options.tags.some(tag => log.tags.includes(tag)));
        }
        if (options.limit) {
            filtered = filtered.slice(-options.limit);
        }
        return filtered.reverse(); // Most recent first
    }
    // Get statistics
    getStatistics(timeRange) {
        const relevantLogs = timeRange
            ? this.logs.filter(log => Date.now() - log.timestamp <= timeRange)
            : this.logs;
        const stats = {
            totalEvents: relevantLogs.length,
            eventsByLevel: {},
            eventsByCategory: {},
            eventsByOperation: {},
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
    async exportLogs(options = { format: 'json' }) {
        let logsToExport = [...this.logs];
        if (options.since) {
            logsToExport = logsToExport.filter(log => log.timestamp >= options.since);
        }
        if (options.until) {
            logsToExport = logsToExport.filter(log => log.timestamp <= options.until);
        }
        if (options.filter) {
            logsToExport = logsToExport.filter(log => {
                return Object.entries(options.filter).every(([key, value]) => {
                    return log[key] === value;
                });
            });
        }
        if (options.format === 'csv') {
            return this.convertToCSV(logsToExport);
        }
        else {
            return JSON.stringify(logsToExport, null, 2);
        }
    }
    // Cleanup old logs
    cleanup(retentionMs) {
        const cutoffTime = Date.now() - (retentionMs || (this.config.retentionDays * 24 * 60 * 60 * 1000));
        const initialLength = this.logs.length;
        this.logs = this.logs.filter(log => log.timestamp >= cutoffTime);
        const removed = initialLength - this.logs.length;
        console.log(`Cleaned up ${removed} old audit log entries`);
        return removed;
    }
    // Private methods
    shouldLogLevel(level) {
        const levels = ['info', 'warn', 'error', 'security', 'performance'];
        const configLevelIndex = levels.indexOf(this.config.logLevel);
        const eventLevelIndex = levels.indexOf(level);
        return eventLevelIndex >= configLevelIndex;
    }
    redactSensitiveFields(data) {
        const redacted = { ...data };
        for (const field of this.config.sensitiveFields) {
            if (redacted[field]) {
                redacted[field] = '[REDACTED]';
            }
        }
        return redacted;
    }
    generateEventId() {
        return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    logToConsole(event) {
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
    async logToFile(event) {
        try {
            const fs = require('fs').promises;
            const logEntry = JSON.stringify(event) + '\n';
            await fs.appendFile(this.config.logFilePath, logEntry);
        }
        catch (error) {
            console.error('Failed to write audit log to file:', error);
        }
    }
    async flushBatch() {
        if (this.pendingBatch.length === 0 || !this.config.remoteLogging)
            return;
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
            }
            else {
                console.error('Failed to send audit events to remote logging:', response.statusText);
            }
        }
        catch (error) {
            console.error('Error sending audit events to remote logging:', error);
        }
    }
    startBatchFlushTimer() {
        if (!this.config.remoteLogging)
            return;
        this.flushTimer = setInterval(async () => {
            if (this.pendingBatch.length > 0) {
                await this.flushBatch();
            }
        }, this.config.remoteLogging.flushInterval);
    }
    convertToCSV(logs) {
        if (logs.length === 0)
            return '';
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
    emitAuditEvent(event) {
        // Emit for real-time monitoring systems
        // This could be enhanced to use EventEmitter or similar
        console.log('Audit event emitted:', event.id);
    }
}
// Global audit logger instance
let globalAuditLogger = null;
export function getAuditLogger(config) {
    if (!globalAuditLogger) {
        globalAuditLogger = new AuditLogger(config);
    }
    return globalAuditLogger;
}
// Utility functions for common audit scenarios
export const AuditUtils = {
    createOperationEvent: (operation, clientId, parameters, result) => ({
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
    createSecurityEvent: (event, clientId, details) => ({
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
    createPerformanceEvent: (operation, clientId, duration) => ({
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
//# sourceMappingURL=audit_logger.js.map