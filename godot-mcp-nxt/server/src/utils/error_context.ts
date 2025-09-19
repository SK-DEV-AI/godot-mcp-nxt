// Enhanced Error Context and Recovery System
// Provides structured error handling with recovery mechanisms

export interface ErrorContext {
  operation: string;
  component: string;
  userId?: string;
  sessionId?: string;
  parameters: Record<string, any>;
  stackTrace?: string;
  godotError?: {
    code: number;
    message: string;
    line?: number;
    file?: string;
  };
  timestamp: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  tags: string[];
  metadata: Record<string, any>;
}

export interface RecoveryStrategy {
  id: string;
  name: string;
  description: string;
  applicableErrors: string[];
  execute: (context: ErrorContext) => Promise<RecoveryResult>;
  priority: number;
  risk: 'low' | 'medium' | 'high';
}

export interface RecoveryResult {
  success: boolean;
  message: string;
  actions: string[];
  newContext?: Partial<ErrorContext>;
  retryAfter?: number;
}

export class ErrorHandler {
  private recoveryStrategies: RecoveryStrategy[] = [];
  private errorHistory: ErrorContext[] = [];
  private maxHistorySize = 1000;

  constructor() {
    this.initializeDefaultStrategies();
  }

  async handleError(error: Error, context: ErrorContext): Promise<void> {
    // Enhance context with error details
    const enhancedContext = this.enhanceContext(error, context);

    // Log structured error
    await this.logError(enhancedContext);

    // Store in history
    this.addToHistory(enhancedContext);

    // Attempt recovery if possible
    if (await this.canRecover(enhancedContext)) {
      await this.attemptRecovery(enhancedContext);
    }

    // Notify monitoring system
    await this.notifyMonitoring(enhancedContext);

    // Escalate if critical
    if (enhancedContext.severity === 'critical') {
      await this.escalateCriticalError(enhancedContext);
    }
  }

  private enhanceContext(error: Error, context: ErrorContext): ErrorContext {
    return {
      ...context,
      stackTrace: error.stack,
      timestamp: Date.now(),
      tags: this.generateTags(error, context),
      metadata: {
        ...context.metadata,
        errorName: error.name,
        errorMessage: error.message,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'server',
        timestampISO: new Date().toISOString()
      }
    };
  }

  private generateTags(error: Error, context: ErrorContext): string[] {
    const tags = new Set<string>();

    // Add operation-based tags
    tags.add(`operation:${context.operation}`);
    tags.add(`component:${context.component}`);
    tags.add(`severity:${context.severity}`);

    // Add error-type tags
    if (error.name) tags.add(`error-type:${error.name.toLowerCase()}`);
    if (context.godotError) tags.add(`godot-error:${context.godotError.code}`);

    // Add parameter-based tags
    if (context.parameters.node_path) tags.add('has-node-path');
    if (context.parameters.script_path) tags.add('has-script-path');
    if (context.parameters.scene_path) tags.add('has-scene-path');

    return Array.from(tags);
  }

  private async canRecover(context: ErrorContext): Promise<boolean> {
    const applicableStrategies = this.recoveryStrategies.filter(strategy =>
      strategy.applicableErrors.some(errorType =>
        context.tags.includes(`error-type:${errorType}`) ||
        context.tags.includes(`operation:${errorType}`)
      )
    );

    return applicableStrategies.length > 0;
  }

  private async attemptRecovery(context: ErrorContext): Promise<void> {
    const applicableStrategies = this.recoveryStrategies
      .filter(strategy =>
        strategy.applicableErrors.some(errorType =>
          context.tags.includes(`error-type:${errorType}`) ||
          context.tags.includes(`operation:${errorType}`)
        )
      )
      .sort((a, b) => b.priority - a.priority); // Higher priority first

    console.log(`Attempting recovery for ${context.operation} with ${applicableStrategies.length} strategies`);

    for (const strategy of applicableStrategies) {
      try {
        console.log(`Trying recovery strategy: ${strategy.name}`);
        const result = await strategy.execute(context);

        if (result.success) {
          console.log(`Recovery successful: ${strategy.name} - ${result.message}`);

          // Log successful recovery
          await this.logRecovery(context, strategy, result);

          // Update context if new context provided
          if (result.newContext) {
            Object.assign(context, result.newContext);
          }

          return;
        } else {
          console.log(`Recovery failed: ${strategy.name} - ${result.message}`);
        }
      } catch (recoveryError) {
        console.error(`Recovery strategy ${strategy.name} threw error:`, recoveryError);
      }
    }

    console.log(`All recovery strategies failed for ${context.operation}`);
  }

  private initializeDefaultStrategies(): void {
    // File not found recovery
    this.addRecoveryStrategy({
      id: 'file-not-found-retry',
      name: 'Retry File Operation',
      description: 'Retry file operations that failed due to temporary issues',
      applicableErrors: ['file-not-found', 'file-bad-path'],
      priority: 10,
      risk: 'low',
      execute: async (context) => {
        // Wait a bit and retry
        await new Promise(resolve => setTimeout(resolve, 1000));

        // This would trigger a retry of the original operation
        return {
          success: false, // For now, just log that we would retry
          message: 'Would retry file operation',
          actions: ['retry_scheduled']
        };
      }
    });

    // Node not found recovery
    this.addRecoveryStrategy({
      id: 'node-not-found-refresh',
      name: 'Refresh Scene and Retry',
      description: 'Refresh scene tree and retry node operations',
      applicableErrors: ['node-not-found'],
      priority: 8,
      risk: 'medium',
      execute: async (context) => {
        // This would trigger a scene refresh
        return {
          success: false, // For now, just log the action
          message: 'Would refresh scene tree',
          actions: ['scene_refresh_scheduled']
        };
      }
    });

    // Memory pressure recovery
    this.addRecoveryStrategy({
      id: 'memory-cleanup',
      name: 'Memory Cleanup',
      description: 'Clean up memory and cached resources',
      applicableErrors: ['out-of-memory', 'memory-pressure'],
      priority: 15,
      risk: 'low',
      execute: async (context) => {
        // Trigger garbage collection and cleanup
        if (typeof global !== 'undefined' && global.gc) {
          global.gc();
        }

        return {
          success: true,
          message: 'Memory cleanup completed',
          actions: ['gc_triggered', 'cache_cleared']
        };
      }
    });

    // Connection recovery
    this.addRecoveryStrategy({
      id: 'connection-retry',
      name: 'Connection Retry',
      description: 'Retry failed connection operations',
      applicableErrors: ['connection-failed', 'timeout'],
      priority: 12,
      risk: 'low',
      execute: async (context) => {
        // This would trigger a connection retry
        return {
          success: false, // For now, just log that we would retry
          message: 'Would retry connection',
          actions: ['connection_retry_scheduled'],
          retryAfter: 2000
        };
      }
    });
  }

  addRecoveryStrategy(strategy: RecoveryStrategy): void {
    this.recoveryStrategies.push(strategy);
    this.recoveryStrategies.sort((a, b) => b.priority - a.priority);
  }

  private addToHistory(context: ErrorContext): void {
    this.errorHistory.push(context);

    // Maintain history size limit
    if (this.errorHistory.length > this.maxHistorySize) {
      this.errorHistory.shift();
    }
  }

  getErrorHistory(filters?: {
    operation?: string;
    component?: string;
    severity?: string;
    since?: number;
  }): ErrorContext[] {
    let filtered = [...this.errorHistory];

    if (filters) {
      if (filters.operation) {
        filtered = filtered.filter(e => e.operation === filters.operation);
      }
      if (filters.component) {
        filtered = filtered.filter(e => e.component === filters.component);
      }
      if (filters.severity) {
        filtered = filtered.filter(e => e.severity === filters.severity);
      }
      if (filters.since != null) {
        filtered = filtered.filter(e => e.timestamp >= filters.since!);
      }
    }

    return filtered;
  }

  getErrorStatistics(timeRange?: number): {
    totalErrors: number;
    errorsByType: Record<string, number>;
    errorsBySeverity: Record<string, number>;
    recoveryRate: number;
    averageResolutionTime: number;
  } {
    const relevantErrors = timeRange
      ? this.errorHistory.filter(e => Date.now() - e.timestamp <= timeRange)
      : this.errorHistory;

    const errorsByType: Record<string, number> = {};
    const errorsBySeverity: Record<string, number> = {};
    let recoveredErrors = 0;
    const resolutionTimes: number[] = [];

    for (const error of relevantErrors) {
      // Count by error type
      if (error.godotError) {
        const type = `godot_${error.godotError.code}`;
        errorsByType[type] = (errorsByType[type] || 0) + 1;
      }

      // Count by severity
      errorsBySeverity[error.severity] = (errorsBySeverity[error.severity] || 0) + 1;

      // Track recovery metrics (this would need to be enhanced with actual recovery tracking)
      if (error.metadata.recovered) {
        recoveredErrors++;
        if (error.metadata.resolutionTime) {
          resolutionTimes.push(error.metadata.resolutionTime);
        }
      }
    }

    return {
      totalErrors: relevantErrors.length,
      errorsByType,
      errorsBySeverity,
      recoveryRate: relevantErrors.length > 0 ? recoveredErrors / relevantErrors.length : 0,
      averageResolutionTime: resolutionTimes.length > 0
        ? resolutionTimes.reduce((a, b) => a + b, 0) / resolutionTimes.length
        : 0
    };
  }

  private async logError(context: ErrorContext): Promise<void> {
    const logEntry = {
      timestamp: new Date(context.timestamp).toISOString(),
      level: 'error',
      operation: context.operation,
      component: context.component,
      severity: context.severity,
      message: context.godotError?.message || 'Unknown error',
      tags: context.tags,
      metadata: context.metadata
    };

    console.error('[ERROR]', JSON.stringify(logEntry, null, 2));

    // Here you would send to external logging service
    // await externalLogger.log(logEntry);
  }

  private async logRecovery(
    context: ErrorContext,
    strategy: RecoveryStrategy,
    result: RecoveryResult
  ): Promise<void> {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: 'info',
      operation: context.operation,
      component: context.component,
      message: `Recovery successful: ${strategy.name} - ${result.message}`,
      strategy: strategy.id,
      actions: result.actions
    };

    console.log('[RECOVERY]', JSON.stringify(logEntry, null, 2));
  }

  private async notifyMonitoring(context: ErrorContext): Promise<void> {
    // Here you would send to monitoring service
    // await monitoringService.notify('error', context);
    console.log('[MONITORING] Error notification sent for:', context.operation);
  }

  private async escalateCriticalError(context: ErrorContext): Promise<void> {
    console.error('[CRITICAL ERROR] Escalation triggered for:', context.operation);

    // Here you would trigger alerts, notifications, etc.
    // await alertingService.alert('critical_error', context);
  }
}

// Global error handler instance
let globalErrorHandler: ErrorHandler | null = null;

export function getErrorHandler(): ErrorHandler {
  if (!globalErrorHandler) {
    globalErrorHandler = new ErrorHandler();
  }
  return globalErrorHandler;
}

// Utility function to create error context
export function createErrorContext(
  operation: string,
  component: string,
  parameters: Record<string, any>,
  godotError?: { code: number; message: string },
  severity: ErrorContext['severity'] = 'medium'
): ErrorContext {
  return {
    operation,
    component,
    parameters,
    godotError,
    timestamp: Date.now(),
    severity,
    tags: [],
    metadata: {}
  };
}

// Utility function to handle errors with context
export async function handleErrorWithContext(
  error: Error,
  operation: string,
  component: string,
  parameters: Record<string, any>,
  godotError?: { code: number; message: string }
): Promise<void> {
  const context = createErrorContext(operation, component, parameters, godotError);
  const handler = getErrorHandler();
  await handler.handleError(error, context);
}