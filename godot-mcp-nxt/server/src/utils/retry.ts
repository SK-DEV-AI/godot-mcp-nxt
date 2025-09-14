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

export class RetryError extends Error {
  constructor(
    message: string,
    public readonly attempts: number,
    public readonly lastError: any
  ) {
    super(message);
    this.name = 'RetryError';
  }
}

/**
 * Retry a function with exponential backoff
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    initialDelay = 1000,
    maxDelay = 30000,
    backoffMultiplier = 2,
    retryCondition = () => true
  } = options;

  let lastError: any;
  let delay = initialDelay;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Don't retry if we've exhausted attempts or condition fails
      if (attempt === maxAttempts || !retryCondition(error)) {
        throw new RetryError(
          `Operation failed after ${attempt} attempts`,
          attempt,
          lastError
        );
      }

      console.warn(`Attempt ${attempt} failed, retrying in ${delay}ms:`, (error as Error).message);

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));

      // Calculate next delay with exponential backoff
      delay = Math.min(delay * backoffMultiplier, maxDelay);
    }
  }

  // This should never be reached, but TypeScript needs it
  throw new RetryError(
    `Operation failed after ${maxAttempts} attempts`,
    maxAttempts,
    lastError
  );
}

/**
 * Retry wrapper specifically for Godot operations
 */
export async function retryGodotOperation<T>(
  operation: () => Promise<T>,
  operationName: string,
  options: RetryOptions = {}
): Promise<T> {
  const defaultOptions: RetryOptions = {
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
  } catch (error) {
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
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';

  constructor(
    private readonly failureThreshold: number = 5,
    private readonly recoveryTimeout: number = 60000, // 1 minute
    private readonly monitoringPeriod: number = 300000 // 5 minutes
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime > this.recoveryTimeout) {
        this.state = 'half-open';
      } else {
        throw new Error('Circuit breaker is open');
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    this.failures = 0;
    this.state = 'closed';
  }

  private onFailure() {
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