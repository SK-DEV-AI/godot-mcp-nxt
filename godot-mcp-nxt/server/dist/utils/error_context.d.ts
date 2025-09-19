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
export declare class ErrorHandler {
    private recoveryStrategies;
    private errorHistory;
    private maxHistorySize;
    constructor();
    handleError(error: Error, context: ErrorContext): Promise<void>;
    private enhanceContext;
    private generateTags;
    private canRecover;
    private attemptRecovery;
    private initializeDefaultStrategies;
    addRecoveryStrategy(strategy: RecoveryStrategy): void;
    private addToHistory;
    getErrorHistory(filters?: {
        operation?: string;
        component?: string;
        severity?: string;
        since?: number;
    }): ErrorContext[];
    getErrorStatistics(timeRange?: number): {
        totalErrors: number;
        errorsByType: Record<string, number>;
        errorsBySeverity: Record<string, number>;
        recoveryRate: number;
        averageResolutionTime: number;
    };
    private logError;
    private logRecovery;
    private notifyMonitoring;
    private escalateCriticalError;
}
export declare function getErrorHandler(): ErrorHandler;
export declare function createErrorContext(operation: string, component: string, parameters: Record<string, any>, godotError?: {
    code: number;
    message: string;
}, severity?: ErrorContext['severity']): ErrorContext;
export declare function handleErrorWithContext(error: Error, operation: string, component: string, parameters: Record<string, any>, godotError?: {
    code: number;
    message: string;
}): Promise<void>;
