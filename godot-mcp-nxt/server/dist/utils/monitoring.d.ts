export interface SystemMetrics {
    timestamp: number;
    cpu: {
        usage: number;
        loadAverage: number[];
    };
    memory: {
        used: number;
        total: number;
        usagePercent: number;
        heapUsed: number;
        heapTotal: number;
        external: number;
    };
    network: {
        connections: number;
        bytesReceived: number;
        bytesSent: number;
        requestsPerSecond: number;
    };
    operations: {
        totalProcessed: number;
        successRate: number;
        averageResponseTime: number;
        activeOperations: number;
        queuedOperations: number;
    };
    cache: {
        hitRate: number;
        totalRequests: number;
        currentSize: number;
        maxSize: number;
    };
    errors: {
        total: number;
        byType: Record<string, number>;
        bySeverity: Record<string, number>;
        recentErrors: Array<{
            timestamp: number;
            operation: string;
            error: string;
            severity: string;
        }>;
    };
}
export interface HealthCheck {
    name: string;
    status: 'healthy' | 'warning' | 'critical' | 'unknown';
    message: string;
    details: Record<string, any>;
    lastCheck: number;
    responseTime: number;
}
export interface AlertRule {
    id: string;
    name: string;
    condition: (metrics: SystemMetrics) => boolean;
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    cooldown: number;
    lastTriggered?: number;
}
export interface Alert {
    id: string;
    ruleId: string;
    timestamp: number;
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    metrics: Partial<SystemMetrics>;
    acknowledged: boolean;
    acknowledgedBy?: string;
    acknowledgedAt?: number;
}
export declare class MonitoringSystem {
    private metrics;
    private healthChecks;
    private alertRules;
    private alerts;
    private maxAlerts;
    private metricsHistory;
    private maxHistorySize;
    constructor();
    private startMetricsCollection;
    private collectMetrics;
    private gatherSystemMetrics;
    private createEmptyMetrics;
    registerHealthCheck(name: string, checkFn: () => Promise<HealthCheck>): void;
    private runHealthChecks;
    getHealthStatus(): Record<string, HealthCheck>;
    getOverallHealth(): 'healthy' | 'warning' | 'critical' | 'unknown';
    private initializeDefaultAlertRules;
    addAlertRule(rule: AlertRule): void;
    private checkAlertRules;
    private triggerAlert;
    acknowledgeAlert(alertId: string, acknowledgedBy?: string): boolean;
    getAlerts(options?: {
        acknowledged?: boolean;
        severity?: string;
        limit?: number;
        since?: number;
    }): Alert[];
    getCurrentMetrics(): SystemMetrics;
    getMetricsHistory(hours?: number): SystemMetrics[];
    private getCpuUsage;
    private getLoadAverage;
    private getMemoryInfo;
    private getNetworkInfo;
    private getOperationsInfo;
    private getCacheInfo;
    private getErrorInfo;
    private emitMetricsUpdate;
    private emitAlert;
}
export declare function getMonitoringSystem(): MonitoringSystem;
export declare function createDatabaseHealthCheck(): Promise<HealthCheck>;
export declare function createCacheHealthCheck(): Promise<HealthCheck>;
export declare function createFilesystemHealthCheck(): Promise<HealthCheck>;
