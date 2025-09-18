/**
 * Retry utility for handling failed operations with exponential backoff
 */
export class RetryError extends Error {
    constructor(message, attempts, lastError) {
        super(message);
        this.attempts = attempts;
        this.lastError = lastError;
        this.name = 'RetryError';
    }
}
/**
 * Retry a function with exponential backoff
 */
export async function withRetry(fn, options = {}) {
    const { maxAttempts = 3, initialDelay = 1000, maxDelay = 30000, backoffMultiplier = 2, retryCondition = () => true } = options;
    let lastError;
    let delay = initialDelay;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            return await fn();
        }
        catch (error) {
            lastError = error;
            // Don't retry if we've exhausted attempts or condition fails
            if (attempt === maxAttempts || !retryCondition(error)) {
                throw new RetryError(`Operation failed after ${attempt} attempts`, attempt, lastError);
            }
            console.warn(`Attempt ${attempt} failed, retrying in ${delay}ms:`, error.message);
            // Wait before retrying
            await new Promise(resolve => setTimeout(resolve, delay));
            // Calculate next delay with exponential backoff
            delay = Math.min(delay * backoffMultiplier, maxDelay);
        }
    }
    // This should never be reached, but TypeScript needs it
    throw new RetryError(`Operation failed after ${maxAttempts} attempts`, maxAttempts, lastError);
}
/**
 * Retry wrapper specifically for Godot operations
 */
export async function retryGodotOperation(operation, operationName, options = {}) {
    const defaultOptions = {
        maxAttempts: 3,
        initialDelay: 2000,
        maxDelay: 10000,
        backoffMultiplier: 1.5,
        retryCondition: (error) => {
            // Retry on network errors, timeouts, but not on validation errors
            const message = error.message?.toLowerCase() || '';
            return message.includes('timeout') ||
                message.includes('connection') ||
                message.includes('network') ||
                message.includes('econnrefused') ||
                message.includes('enotfound');
        }
    };
    const mergedOptions = { ...defaultOptions, ...options };
    try {
        return await withRetry(operation, mergedOptions);
    }
    catch (error) {
        if (error instanceof RetryError) {
            console.error(`${operationName} failed after ${error.attempts} attempts. Last error:`, error.lastError);
            throw error.lastError; // Throw the original error
        }
        throw error;
    }
}
/**
 * Circuit breaker pattern for operations that frequently fail
 */
export class CircuitBreaker {
    constructor(failureThreshold = 5, recoveryTimeout = 60000, // 1 minute
    monitoringPeriod = 300000 // 5 minutes
    ) {
        this.failureThreshold = failureThreshold;
        this.recoveryTimeout = recoveryTimeout;
        this.monitoringPeriod = monitoringPeriod;
        this.failures = 0;
        this.lastFailureTime = 0;
        this.state = 'closed';
    }
    async execute(operation) {
        if (this.state === 'open') {
            if (Date.now() - this.lastFailureTime > this.recoveryTimeout) {
                this.state = 'half-open';
            }
            else {
                throw new Error('Circuit breaker is open');
            }
        }
        try {
            const result = await operation();
            this.onSuccess();
            return result;
        }
        catch (error) {
            this.onFailure();
            throw error;
        }
    }
    onSuccess() {
        this.failures = 0;
        this.state = 'closed';
    }
    onFailure() {
        this.failures++;
        this.lastFailureTime = Date.now();
        if (this.failures >= this.failureThreshold) {
            this.state = 'open';
        }
    }
    getState() {
        return {
            state: this.state,
            failures: this.failures,
            lastFailureTime: this.lastFailureTime
        };
    }
}
// Global circuit breaker for Godot operations
export const godotCircuitBreaker = new CircuitBreaker();
//# sourceMappingURL=retry.js.map