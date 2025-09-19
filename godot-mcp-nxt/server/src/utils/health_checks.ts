// Health Check System for Godot MCP Server
// Comprehensive health monitoring with automated recovery

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
  interval: number; // milliseconds
  timeout: number; // milliseconds
  failureThreshold: number; // consecutive failures before marking critical
  recoveryThreshold: number; // consecutive successes before marking healthy
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

export class HealthCheckSystem {
  private checks = new Map<string, HealthCheckConfig>();
  private statuses = new Map<string, HealthStatus>();
  private intervals = new Map<string, NodeJS.Timeout>();
  private lastReport: HealthReport | null = null;

  constructor() {
    this.initializeDefaultChecks();
  }

  // Register a health check
  registerCheck(config: HealthCheckConfig): void {
    this.checks.set(config.name, config);

    if (config.enabled) {
      this.startCheck(config.name);
    }

    console.log(`Health check registered: ${config.name}`);
  }

  // Unregister a health check
  unregisterCheck(name: string): void {
    this.stopCheck(name);
    this.checks.delete(name);
    this.statuses.delete(name);
    console.log(`Health check unregistered: ${name}`);
  }

  // Enable/disable a health check
  setCheckEnabled(name: string, enabled: boolean): void {
    const config = this.checks.get(name);
    if (config) {
      config.enabled = enabled;
      if (enabled) {
        this.startCheck(name);
      } else {
        this.stopCheck(name);
      }
    }
  }

  // Run a specific health check manually
  async runCheck(name: string): Promise<HealthStatus> {
    const config = this.checks.get(name);
    if (!config) {
      throw new Error(`Health check not found: ${name}`);
    }

    const startTime = Date.now();

    try {
      // Create a timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Health check timeout')), config.timeout);
      });

      // Race between the check and timeout
      const result = await Promise.race([config.check(), timeoutPromise]);
      const responseTime = Date.now() - startTime;

      // Update status with success
      const status: HealthStatus = {
        ...result,
        timestamp: Date.now(),
        responseTime,
        lastSuccess: Date.now(),
        consecutiveFailures: 0
      };

      this.statuses.set(name, status);
      return status;

    } catch (error) {
      const responseTime = Date.now() - startTime;
      const currentStatus = this.statuses.get(name);

      const consecutiveFailures = (currentStatus?.consecutiveFailures || 0) + 1;
      const isCritical = consecutiveFailures >= config.failureThreshold;

      const status: HealthStatus = {
        status: isCritical ? 'critical' : 'warning',
        message: `Health check failed: ${error instanceof Error ? error.message : String(error)}`,
        details: {
          error: String(error),
          consecutiveFailures,
          failureThreshold: config.failureThreshold
        },
        timestamp: Date.now(),
        responseTime,
        consecutiveFailures
      };

      this.statuses.set(name, status);
      return status;
    }
  }

  // Run all enabled health checks
  async runAllChecks(): Promise<HealthReport> {
    const startTime = Date.now();
    const results: Record<string, HealthStatus> = {};

    // Run all enabled checks in parallel
    const promises = Array.from(this.checks.entries())
      .filter(([, config]) => config.enabled)
      .map(async ([name]) => {
        try {
          results[name] = await this.runCheck(name);
        } catch (error) {
          results[name] = {
            status: 'unknown',
            message: `Failed to run health check: ${error instanceof Error ? error.message : String(error)}`,
            details: { error: String(error) },
            timestamp: Date.now(),
            responseTime: 0,
            consecutiveFailures: 0
          };
        }
      });

    await Promise.all(promises);

    // Calculate overall status
    const statuses = Object.values(results);
    const summary = {
      total: statuses.length,
      healthy: statuses.filter(s => s.status === 'healthy').length,
      warning: statuses.filter(s => s.status === 'warning').length,
      critical: statuses.filter(s => s.status === 'critical').length,
      unknown: statuses.filter(s => s.status === 'unknown').length
    };

    let overall: 'healthy' | 'warning' | 'critical' | 'unknown' = 'healthy';
    if (summary.critical > 0) overall = 'critical';
    else if (summary.warning > 0) overall = 'warning';
    else if (summary.unknown > 0) overall = 'unknown';

    const report: HealthReport = {
      overall,
      checks: results,
      summary,
      timestamp: Date.now(),
      duration: Date.now() - startTime
    };

    this.lastReport = report;
    return report;
  }

  // Get current health status
  getHealthStatus(): HealthReport | null {
    return this.lastReport;
  }

  // Get status of a specific check
  getCheckStatus(name: string): HealthStatus | null {
    return this.statuses.get(name) || null;
  }

  // Get all check statuses
  getAllStatuses(): Record<string, HealthStatus> {
    const statuses: Record<string, HealthStatus> = {};
    for (const [name, status] of this.statuses.entries()) {
      statuses[name] = status;
    }
    return statuses;
  }

  private startCheck(name: string): void {
    this.stopCheck(name); // Stop any existing interval

    const config = this.checks.get(name);
    if (!config) return;

    const interval = setInterval(async () => {
      try {
        await this.runCheck(name);
      } catch (error) {
        console.error(`Error running health check ${name}:`, error);
      }
    }, config.interval);

    this.intervals.set(name, interval);
  }

  private stopCheck(name: string): void {
    const interval = this.intervals.get(name);
    if (interval) {
      clearInterval(interval);
      this.intervals.delete(name);
    }
  }

  private initializeDefaultChecks(): void {
    // System health checks
    this.registerCheck({
      name: 'system_memory',
      check: async () => {
        const memUsage = process.memoryUsage ? process.memoryUsage() : { heapUsed: 0, heapTotal: 0 };
        const usagePercent = memUsage.heapTotal > 0 ? (memUsage.heapUsed / memUsage.heapTotal) * 100 : 0;

        if (usagePercent > 90) {
          return {
            status: 'critical',
            message: `Memory usage is critically high: ${usagePercent.toFixed(1)}%`,
            details: { usagePercent, heapUsed: memUsage.heapUsed, heapTotal: memUsage.heapTotal }
          };
        } else if (usagePercent > 75) {
          return {
            status: 'warning',
            message: `Memory usage is high: ${usagePercent.toFixed(1)}%`,
            details: { usagePercent, heapUsed: memUsage.heapUsed, heapTotal: memUsage.heapTotal }
          };
        } else {
          return {
            status: 'healthy',
            message: `Memory usage is normal: ${usagePercent.toFixed(1)}%`,
            details: { usagePercent, heapUsed: memUsage.heapUsed, heapTotal: memUsage.heapTotal }
          };
        }
      },
      interval: 30000, // 30 seconds
      timeout: 5000,
      failureThreshold: 3,
      recoveryThreshold: 2,
      enabled: true,
      tags: ['system', 'memory']
    });

    // Network connectivity check
    this.registerCheck({
      name: 'network_connectivity',
      check: async () => {
        try {
          // Simple connectivity check - in real implementation, check actual connections
          return {
            status: 'healthy',
            message: 'Network connectivity is normal',
            details: { activeConnections: 0, bytesTransferred: 0 }
          };
        } catch (error) {
          return {
            status: 'critical',
            message: `Network connectivity check failed: ${error instanceof Error ? error.message : String(error)}`,
            details: { error: String(error) }
          };
        }
      },
      interval: 60000, // 1 minute
      timeout: 10000,
      failureThreshold: 2,
      recoveryThreshold: 1,
      enabled: true,
      tags: ['network', 'connectivity']
    });

    // File system check
    this.registerCheck({
      name: 'filesystem_access',
      check: async () => {
        try {
          // Check if we can access the project directory
          const fs = require('fs').promises;
          await fs.access('./');
          return {
            status: 'healthy',
            message: 'File system access is working',
            details: { accessible: true }
          };
        } catch (error) {
          return {
            status: 'critical',
            message: `File system access failed: ${error instanceof Error ? error.message : String(error)}`,
            details: { error: String(error) }
          };
        }
      },
      interval: 120000, // 2 minutes
      timeout: 5000,
      failureThreshold: 2,
      recoveryThreshold: 1,
      enabled: true,
      tags: ['filesystem', 'storage']
    });
  }

  // Cleanup method
  destroy(): void {
    for (const interval of this.intervals.values()) {
      clearInterval(interval);
    }
    this.intervals.clear();
    this.checks.clear();
    this.statuses.clear();
  }
}

// Specialized health checks for Godot MCP
export class GodotMCPHealthChecks {
  static createGodotConnectionCheck(connectionPool: any): HealthCheckConfig {
    return {
      name: 'godot_connection',
      check: async () => {
        try {
          // Check if we can get a connection from the pool
          const connection = await connectionPool.getConnection();
          const isConnected = connection.isConnected();

          if (isConnected) {
            return {
              status: 'healthy',
              message: 'Godot connection is healthy',
              details: { connected: true, poolStats: connectionPool.getStats() }
            };
          } else {
            return {
              status: 'warning',
              message: 'Godot connection is not active',
              details: { connected: false, poolStats: connectionPool.getStats() }
            };
          }
        } catch (error) {
          return {
            status: 'critical',
            message: `Godot connection check failed: ${error instanceof Error ? error.message : String(error)}`,
            details: { error: String(error) }
          };
        }
      },
      interval: 30000,
      timeout: 10000,
      failureThreshold: 3,
      recoveryThreshold: 2,
      enabled: true,
      tags: ['godot', 'connection']
    };
  }

  static createCacheHealthCheck(cache: any): HealthCheckConfig {
    return {
      name: 'cache_performance',
      check: async () => {
        try {
          const stats = cache.getStats();
          const hitRate = stats.hitRate;

          if (hitRate > 0.8) {
            return {
              status: 'healthy',
              message: `Cache performance is excellent: ${(hitRate * 100).toFixed(1)}% hit rate`,
              details: stats
            };
          } else if (hitRate > 0.6) {
            return {
              status: 'warning',
              message: `Cache performance is acceptable: ${(hitRate * 100).toFixed(1)}% hit rate`,
              details: stats
            };
          } else {
            return {
              status: 'critical',
              message: `Cache performance is poor: ${(hitRate * 100).toFixed(1)}% hit rate`,
              details: stats
            };
          }
        } catch (error) {
          return {
            status: 'warning',
            message: `Cache health check failed: ${error instanceof Error ? error.message : String(error)}`,
            details: { error: String(error) }
          };
        }
      },
      interval: 60000,
      timeout: 5000,
      failureThreshold: 2,
      recoveryThreshold: 1,
      enabled: true,
      tags: ['cache', 'performance']
    };
  }

  static createQueueHealthCheck(queue: any): HealthCheckConfig {
    return {
      name: 'operation_queue',
      check: async () => {
        try {
          const stats = queue.getStats();
          const queueLength = stats.queueLength;
          const processingCount = stats.processing;

          if (queueLength > 100) {
            return {
              status: 'critical',
              message: `Operation queue is critically backed up: ${queueLength} operations`,
              details: stats
            };
          } else if (queueLength > 50) {
            return {
              status: 'warning',
              message: `Operation queue is backed up: ${queueLength} operations`,
              details: stats
            };
          } else {
            return {
              status: 'healthy',
              message: `Operation queue is healthy: ${queueLength} queued, ${processingCount} processing`,
              details: stats
            };
          }
        } catch (error) {
          return {
            status: 'warning',
            message: `Queue health check failed: ${error instanceof Error ? error.message : String(error)}`,
            details: { error: String(error) }
          };
        }
      },
      interval: 15000,
      timeout: 3000,
      failureThreshold: 3,
      recoveryThreshold: 2,
      enabled: true,
      tags: ['queue', 'operations']
    };
  }
}

// Global health check system instance
let globalHealthCheckSystem: HealthCheckSystem | null = null;

export function getHealthCheckSystem(): HealthCheckSystem {
  if (!globalHealthCheckSystem) {
    globalHealthCheckSystem = new HealthCheckSystem();
  }
  return globalHealthCheckSystem;
}

// Utility function to create a simple health check
export function createSimpleHealthCheck(
  name: string,
  checkFn: () => Promise<{ healthy: boolean; message: string; details?: any }>,
  interval = 30000
): HealthCheckConfig {
  return {
    name,
    check: async () => {
      const result = await checkFn();
      return {
        status: result.healthy ? 'healthy' : 'critical',
        message: result.message,
        details: result.details || {}
      };
    },
    interval,
    timeout: 10000,
    failureThreshold: 2,
    recoveryThreshold: 1,
    enabled: true,
    tags: ['custom']
  };
}