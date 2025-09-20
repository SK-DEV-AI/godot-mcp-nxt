// Comprehensive Monitoring and Health Check System
// Provides real-time metrics, alerting, and system health monitoring
export class MonitoringSystem {
    constructor() {
        this.healthChecks = new Map();
        this.alertRules = [];
        this.alerts = [];
        this.maxAlerts = 1000;
        this.metricsHistory = [];
        this.maxHistorySize = 100;
        this.metrics = this.createEmptyMetrics();
        this.initializeDefaultAlertRules();
        this.startMetricsCollection();
    }
    // Metrics Collection
    startMetricsCollection() {
        // Collect metrics every 5 seconds
        setInterval(() => {
            this.collectMetrics();
        }, 5000);
        // Run health checks every 30 seconds
        setInterval(() => {
            this.runHealthChecks();
        }, 30000);
        // Check alert rules every 10 seconds
        setInterval(() => {
            this.checkAlertRules();
        }, 10000);
    }
    async collectMetrics() {
        try {
            const newMetrics = await this.gatherSystemMetrics();
            // Store in history
            this.metricsHistory.push(newMetrics);
            if (this.metricsHistory.length > this.maxHistorySize) {
                this.metricsHistory.shift();
            }
            this.metrics = newMetrics;
            // Emit metrics event for external monitoring
            this.emitMetricsUpdate(newMetrics);
        }
        catch (error) {
            console.error('Failed to collect metrics:', error);
        }
    }
    async gatherSystemMetrics() {
        const timestamp = Date.now();
        // CPU metrics
        const cpuUsage = await this.getCpuUsage();
        const loadAverage = this.getLoadAverage();
        // Memory metrics
        const memoryInfo = this.getMemoryInfo();
        // Network metrics (would need platform-specific implementation)
        const networkInfo = await this.getNetworkInfo();
        // Operations metrics
        const operationsInfo = this.getOperationsInfo();
        // Cache metrics
        const cacheInfo = this.getCacheInfo();
        // Error metrics
        const errorInfo = this.getErrorInfo();
        return {
            timestamp,
            cpu: {
                usage: cpuUsage,
                loadAverage
            },
            memory: memoryInfo,
            network: networkInfo,
            operations: operationsInfo,
            cache: cacheInfo,
            errors: errorInfo
        };
    }
    createEmptyMetrics() {
        return {
            timestamp: Date.now(),
            cpu: { usage: 0, loadAverage: [0, 0, 0] },
            memory: { used: 0, total: 0, usagePercent: 0, heapUsed: 0, heapTotal: 0, external: 0 },
            network: { connections: 0, bytesReceived: 0, bytesSent: 0, requestsPerSecond: 0 },
            operations: { totalProcessed: 0, successRate: 0, averageResponseTime: 0, activeOperations: 0, queuedOperations: 0 },
            cache: { hitRate: 0, totalRequests: 0, currentSize: 0, maxSize: 0 },
            errors: { total: 0, byType: {}, bySeverity: {}, recentErrors: [] }
        };
    }
    // Health Checks
    registerHealthCheck(name, checkFn) {
        // Store the check function for later execution
        this[`healthCheck_${name}`] = checkFn;
    }
    async runHealthChecks() {
        const checkNames = Object.keys(this).filter(key => key.startsWith('healthCheck_'));
        for (const checkKey of checkNames) {
            const checkName = checkKey.replace('healthCheck_', '');
            const checkFn = this[checkKey];
            if (typeof checkFn === 'function') {
                try {
                    const startTime = Date.now();
                    const result = await checkFn();
                    const responseTime = Date.now() - startTime;
                    this.healthChecks.set(checkName, {
                        ...result,
                        lastCheck: Date.now(),
                        responseTime
                    });
                }
                catch (error) {
                    this.healthChecks.set(checkName, {
                        name: checkName,
                        status: 'critical',
                        message: `Health check failed: ${error instanceof Error ? error.message : String(error)}`,
                        details: { error: String(error) },
                        lastCheck: Date.now(),
                        responseTime: 0
                    });
                }
            }
        }
    }
    getHealthStatus() {
        const status = {};
        for (const [name, check] of this.healthChecks.entries()) {
            status[name] = check;
        }
        return status;
    }
    getOverallHealth() {
        const checks = Array.from(this.healthChecks.values());
        if (checks.length === 0)
            return 'unknown';
        const criticalCount = checks.filter(c => c.status === 'critical').length;
        const warningCount = checks.filter(c => c.status === 'warning').length;
        if (criticalCount > 0)
            return 'critical';
        if (warningCount > 0)
            return 'warning';
        if (checks.every(c => c.status === 'healthy'))
            return 'healthy';
        return 'warning';
    }
    // Alert System
    initializeDefaultAlertRules() {
        this.addAlertRule({
            id: 'high_memory_usage',
            name: 'High Memory Usage',
            condition: (metrics) => metrics.memory.usagePercent > 85,
            severity: 'high',
            message: 'Memory usage is above 85%',
            cooldown: 300000 // 5 minutes
        });
        this.addAlertRule({
            id: 'high_error_rate',
            name: 'High Error Rate',
            condition: (metrics) => metrics.operations.successRate < 0.95,
            severity: 'medium',
            message: 'Operation success rate dropped below 95%',
            cooldown: 60000 // 1 minute
        });
        this.addAlertRule({
            id: 'queue_backlog',
            name: 'Operation Queue Backlog',
            condition: (metrics) => metrics.operations.queuedOperations > 50,
            severity: 'medium',
            message: 'Operation queue has more than 50 pending operations',
            cooldown: 120000 // 2 minutes
        });
        this.addAlertRule({
            id: 'cache_low_hit_rate',
            name: 'Low Cache Hit Rate',
            condition: (metrics) => metrics.cache.hitRate < 0.7 && metrics.cache.totalRequests > 100,
            severity: 'low',
            message: 'Cache hit rate dropped below 70%',
            cooldown: 300000 // 5 minutes
        });
    }
    addAlertRule(rule) {
        this.alertRules.push(rule);
    }
    checkAlertRules() {
        const now = Date.now();
        for (const rule of this.alertRules) {
            // Check cooldown
            if (rule.lastTriggered && (now - rule.lastTriggered) < rule.cooldown) {
                continue;
            }
            // Check condition
            if (rule.condition(this.metrics)) {
                this.triggerAlert(rule);
                rule.lastTriggered = now;
            }
        }
    }
    triggerAlert(rule) {
        const alert = {
            id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            ruleId: rule.id,
            timestamp: Date.now(),
            severity: rule.severity,
            message: rule.message,
            metrics: { ...this.metrics },
            acknowledged: false
        };
        this.alerts.push(alert);
        // Maintain alert limit
        if (this.alerts.length > this.maxAlerts) {
            this.alerts.shift();
        }
        console.warn(`[ALERT] ${rule.severity.toUpperCase()}: ${rule.message}`);
        // Emit alert event
        this.emitAlert(alert);
    }
    acknowledgeAlert(alertId, acknowledgedBy) {
        const alert = this.alerts.find(a => a.id === alertId);
        if (alert && !alert.acknowledged) {
            alert.acknowledged = true;
            alert.acknowledgedBy = acknowledgedBy;
            alert.acknowledgedAt = Date.now();
            return true;
        }
        return false;
    }
    getAlerts(options = {}) {
        let filtered = [...this.alerts];
        if (options.acknowledged !== undefined) {
            filtered = filtered.filter(a => a.acknowledged === options.acknowledged);
        }
        if (options.severity) {
            filtered = filtered.filter(a => a.severity === options.severity);
        }
        if (options.since != null) {
            filtered = filtered.filter(a => a.timestamp >= options.since);
        }
        if (options.limit) {
            filtered = filtered.slice(-options.limit);
        }
        return filtered.reverse(); // Most recent first
    }
    // Metrics Access
    getCurrentMetrics() {
        return { ...this.metrics };
    }
    getMetricsHistory(hours = 1) {
        const since = Date.now() - (hours * 60 * 60 * 1000);
        return this.metricsHistory.filter(m => m.timestamp >= since);
    }
    // Platform-specific metric gathering (simplified implementations)
    async getCpuUsage() {
        // In a real implementation, this would use platform-specific APIs
        // For now, return a mock value
        return Math.random() * 100;
    }
    getLoadAverage() {
        // Mock implementation
        return [Math.random() * 4, Math.random() * 4, Math.random() * 4];
    }
    getMemoryInfo() {
        // Use Node.js process.memoryUsage() if available
        if (typeof process !== 'undefined' && process.memoryUsage) {
            const mem = process.memoryUsage();
            const totalMem = 8 * 1024 * 1024 * 1024; // Assume 8GB total (mock)
            return {
                used: mem.heapUsed,
                total: totalMem,
                usagePercent: (mem.heapUsed / totalMem) * 100,
                heapUsed: mem.heapUsed,
                heapTotal: mem.heapTotal,
                external: mem.external
            };
        }
        // Fallback mock values
        return {
            used: 512 * 1024 * 1024, // 512MB
            total: 8 * 1024 * 1024 * 1024, // 8GB
            usagePercent: 6.25,
            heapUsed: 256 * 1024 * 1024,
            heapTotal: 512 * 1024 * 1024,
            external: 64 * 1024 * 1024
        };
    }
    async getNetworkInfo() {
        // Mock network metrics
        return {
            connections: Math.floor(Math.random() * 100),
            bytesReceived: Math.floor(Math.random() * 1000000),
            bytesSent: Math.floor(Math.random() * 1000000),
            requestsPerSecond: Math.floor(Math.random() * 1000)
        };
    }
    getOperationsInfo() {
        // This would be populated by the actual operation tracking
        return {
            totalProcessed: Math.floor(Math.random() * 10000),
            successRate: 0.95 + Math.random() * 0.05,
            averageResponseTime: 50 + Math.random() * 200,
            activeOperations: Math.floor(Math.random() * 10),
            queuedOperations: Math.floor(Math.random() * 20)
        };
    }
    getCacheInfo() {
        // This would be populated by the actual cache system
        return {
            hitRate: 0.8 + Math.random() * 0.2,
            totalRequests: Math.floor(Math.random() * 10000),
            currentSize: Math.floor(Math.random() * 1000),
            maxSize: 1000
        };
    }
    getErrorInfo() {
        // This would be populated by the error tracking system
        const errorTypes = ['file-not-found', 'connection-failed', 'timeout', 'validation-error'];
        const byType = {};
        errorTypes.forEach(type => {
            byType[type] = Math.floor(Math.random() * 50);
        });
        return {
            total: Object.values(byType).reduce((a, b) => a + b, 0),
            byType,
            bySeverity: {
                low: Math.floor(Math.random() * 20),
                medium: Math.floor(Math.random() * 30),
                high: Math.floor(Math.random() * 10),
                critical: Math.floor(Math.random() * 5)
            },
            recentErrors: [] // Would be populated by error tracking
        };
    }
    // Event emission (would integrate with actual event system)
    emitMetricsUpdate(metrics) {
        // Emit to external monitoring systems
        console.log('[METRICS] System metrics updated');
    }
    emitAlert(alert) {
        // Emit to alerting systems
        console.log(`[ALERT] ${alert.severity}: ${alert.message}`);
    }
}
// Global monitoring instance
let globalMonitoringSystem = null;
export function getMonitoringSystem() {
    if (!globalMonitoringSystem) {
        globalMonitoringSystem = new MonitoringSystem();
    }
    return globalMonitoringSystem;
}
// Health check functions
export async function createDatabaseHealthCheck() {
    // Mock database health check
    return {
        name: 'database',
        status: 'healthy',
        message: 'Database connection is healthy',
        details: { latency: 5, connections: 10 },
        lastCheck: Date.now(),
        responseTime: 5
    };
}
export async function createCacheHealthCheck() {
    // Mock cache health check
    return {
        name: 'cache',
        status: 'healthy',
        message: 'Cache system is operating normally',
        details: { hitRate: 0.85, size: 150 },
        lastCheck: Date.now(),
        responseTime: 2
    };
}
export async function createFilesystemHealthCheck() {
    // Mock filesystem health check
    return {
        name: 'filesystem',
        status: 'healthy',
        message: 'Filesystem is accessible and healthy',
        details: { freeSpace: '50GB', readSpeed: '100MB/s' },
        lastCheck: Date.now(),
        responseTime: 10
    };
}
//# sourceMappingURL=monitoring.js.map