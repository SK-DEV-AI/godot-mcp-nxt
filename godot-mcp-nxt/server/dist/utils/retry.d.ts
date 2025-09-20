/**
 * Retry utility for handling failed operations with exponential backoff
 */
export interface RetryOptions {
    maxAttempts?: number;
    initialDelay?: number;
    maxDelay?: number;
    backoffMultiplier?: number;
    retryCondition?: (error: any) => boolean;
}
export declare class RetryError extends Error {
    readonly attempts: number;
    readonly lastError: any;
    constructor(message: string, attempts: number, lastError: any);
}
/**
 * Retry a function with exponential backoff
 */
export declare function withRetry<T>(fn: () => Promise<T>, options?: RetryOptions): Promise<T>;
/**
 * Retry wrapper specifically for Godot operations
 */
export declare function retryGodotOperation<T>(operation: () => Promise<T>, operationName: string, options?: RetryOptions): Promise<T>;
/**
 * Circuit breaker pattern for operations that frequently fail
 */
export declare class CircuitBreaker {
    private readonly failureThreshold;
    private readonly recoveryTimeout;
    private readonly monitoringPeriod;
    private failures;
    private lastFailureTime;
    private state;
    constructor(failureThreshold?: number, recoveryTimeout?: number, // 1 minute
    monitoringPeriod?: number);
    execute<T>(operation: () => Promise<T>): Promise<T>;
    private onSuccess;
    private onFailure;
    getState(): {
        state: "open" | "closed" | "half-open";
        failures: number;
        lastFailureTime: number;
    };
}
export declare const godotCircuitBreaker: CircuitBreaker;
