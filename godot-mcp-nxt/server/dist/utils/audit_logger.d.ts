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
    maxLogSize: number;
    retentionDays: number;
    sensitiveFields: string[];
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
export declare class AuditLogger {
    private logs;
    private config;
    private pendingBatch;
    private flushTimer?;
    constructor(config?: Partial<AuditLogConfig>);
    log(event: Omit<AuditEvent, 'id' | 'timestamp'>): Promise<void>;
    logOperation(operation: string, clientId: string, parameters: Record<string, any>, result: AuditEvent['result'], metadata?: Record<string, any>): Promise<void>;
    logSecurity(event: string, clientId: string, details: Record<string, any>, severity?: 'info' | 'warn' | 'error' | 'security'): Promise<void>;
    logPerformance(operation: string, clientId: string, duration: number, metadata?: Record<string, any>): Promise<void>;
    logSystem(event: string, details: Record<string, any>, level?: AuditEvent['level']): Promise<void>;
    getLogs(options?: {
        level?: AuditEvent['level'];
        category?: AuditEvent['category'];
        operation?: string;
        clientId?: string;
        since?: number;
        until?: number;
        limit?: number;
        tags?: string[];
    }): AuditEvent[];
    getStatistics(timeRange?: number): {
        totalEvents: number;
        eventsByLevel: Record<string, number>;
        eventsByCategory: Record<string, number>;
        eventsByOperation: Record<string, number>;
        averageResponseTime: number;
        errorRate: number;
        securityEvents: number;
    };
    exportLogs(options?: {
        format: 'json' | 'csv';
        since?: number;
        until?: number;
        filter?: Partial<AuditEvent>;
    }): Promise<string>;
    cleanup(retentionMs?: number): number;
    private shouldLogLevel;
    private redactSensitiveFields;
    private generateEventId;
    private logToConsole;
    private logToFile;
    private flushBatch;
    private startBatchFlushTimer;
    private convertToCSV;
    private emitAuditEvent;
}
export declare function getAuditLogger(config?: Partial<AuditLogConfig>): AuditLogger;
export declare const AuditUtils: {
    createOperationEvent: (operation: string, clientId: string, parameters: Record<string, any>, result: AuditEvent["result"]) => Omit<AuditEvent, "id" | "timestamp">;
    createSecurityEvent: (event: string, clientId: string, details: Record<string, any>) => Omit<AuditEvent, "id" | "timestamp">;
    createPerformanceEvent: (operation: string, clientId: string, duration: number) => Omit<AuditEvent, "id" | "timestamp">;
};
