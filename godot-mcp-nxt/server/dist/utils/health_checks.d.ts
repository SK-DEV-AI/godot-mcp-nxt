export interface HealthStatus {
    status: 'healthy' | 'warning' | 'critical' | 'unknown';
    message: string;
    details: Record<string, any>;
    timestamp: number;
    responseTime: number;
    lastSuccess?: number;
    consecutiveFailures: number;
}
export interface HealthCheckResult {
    status: 'healthy' | 'warning' | 'critical' | 'unknown';
    message: string;
    details: Record<string, any>;
}
export interface HealthCheckConfig {
    name: string;
    check: () => Promise<HealthCheckResult>;
    interval: number;
    timeout: number;
    failureThreshold: number;
    recoveryThreshold: number;
    enabled: boolean;
    tags: string[];
}
export interface HealthReport {
    overall: 'healthy' | 'warning' | 'critical' | 'unknown';
    checks: Record<string, HealthStatus>;
    summary: {
        total: number;
        healthy: number;
        warning: number;
        critical: number;
        unknown: number;
    };
    timestamp: number;
    duration: number;
}
export declare class HealthCheckSystem {
    private checks;
    private statuses;
    private intervals;
    private lastReport;
    constructor();
    registerCheck(config: HealthCheckConfig): void;
    unregisterCheck(name: string): void;
    setCheckEnabled(name: string, enabled: boolean): void;
    runCheck(name: string): Promise<HealthStatus>;
    runAllChecks(): Promise<HealthReport>;
    getHealthStatus(): HealthReport | null;
    getCheckStatus(name: string): HealthStatus | null;
    getAllStatuses(): Record<string, HealthStatus>;
    private startCheck;
    private stopCheck;
    private initializeDefaultChecks;
    destroy(): void;
}
export declare class GodotMCPHealthChecks {
    static createGodotConnectionCheck(connectionPool: any): HealthCheckConfig;
    static createCacheHealthCheck(cache: any): HealthCheckConfig;
    static createQueueHealthCheck(queue: any): HealthCheckConfig;
}
export declare function getHealthCheckSystem(): HealthCheckSystem;
export declare function createSimpleHealthCheck(name: string, checkFn: () => Promise<{
    healthy: boolean;
    message: string;
    details?: any;
}>, interval?: number): HealthCheckConfig;
