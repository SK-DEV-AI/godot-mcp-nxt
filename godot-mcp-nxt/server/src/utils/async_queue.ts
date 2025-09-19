// Async Operation Queue for managing concurrent Godot operations
// Prevents blocking and provides better resource utilization

interface QueueItem<T = any> {
  id: string;
  operation: () => Promise<T>;
  resolve: (value: T) => void;
  reject: (reason: any) => void;
  priority: number;
  timestamp: number;
  timeout?: NodeJS.Timeout;
}

interface QueueStats {
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  averageProcessingTime: number;
  queueLength: number;
  maxConcurrency: number;
}

export class AsyncOperationQueue {
  private queue: QueueItem[] = [];
  private processing = new Set<string>();
  private maxConcurrency: number;
  private defaultTimeout: number;
  private stats: QueueStats;
  private processingTimes: number[] = [];
  private isProcessing = false;

  constructor(maxConcurrency = 3, defaultTimeout = 30000) {
    this.maxConcurrency = maxConcurrency;
    this.defaultTimeout = defaultTimeout;
    this.stats = {
      pending: 0,
      processing: 0,
      completed: 0,
      failed: 0,
      averageProcessingTime: 0,
      queueLength: 0,
      maxConcurrency
    };
  }

  async add<T>(
    operation: () => Promise<T>,
    options: {
      priority?: number;
      timeout?: number;
      id?: string;
    } = {}
  ): Promise<T> {
    const {
      priority = 0,
      timeout = this.defaultTimeout,
      id = this.generateId()
    } = options;

    return new Promise<T>((resolve, reject) => {
      const queueItem: QueueItem<T> = {
        id,
        operation,
        resolve,
        reject,
        priority,
        timestamp: Date.now()
      };

      // Set timeout if specified
      if (timeout > 0) {
        queueItem.timeout = setTimeout(() => {
          this.removeFromQueue(id);
          reject(new Error(`Operation ${id} timed out after ${timeout}ms`));
        }, timeout);
      }

      // Add to queue with priority sorting
      this.insertWithPriority(queueItem);
      this.stats.pending++;
      this.stats.queueLength = this.queue.length;

      console.log(`Added operation ${id} to queue (priority: ${priority}, queue length: ${this.queue.length})`);

      // Start processing if not already running
      this.processQueue();
    });
  }

  private insertWithPriority(item: QueueItem): void {
    // Find insertion point based on priority (higher priority = lower index)
    let insertIndex = this.queue.length;
    for (let i = 0; i < this.queue.length; i++) {
      if (item.priority > this.queue[i].priority) {
        insertIndex = i;
        break;
      }
    }

    this.queue.splice(insertIndex, 0, item);
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing) return;
    this.isProcessing = true;

    while (this.queue.length > 0 && this.processing.size < this.maxConcurrency) {
      const item = this.queue.shift();
      if (!item) break;

      this.stats.pending--;
      this.stats.processing++;
      this.stats.queueLength = this.queue.length;
      this.processing.add(item.id);

      console.log(`Processing operation ${item.id} (${this.processing.size}/${this.maxConcurrency} active)`);

      const startTime = Date.now();

      try {
        const result = await item.operation();
        const processingTime = Date.now() - startTime;

        // Track processing time for statistics
        this.processingTimes.push(processingTime);
        if (this.processingTimes.length > 100) {
          this.processingTimes.shift(); // Keep only last 100 measurements
        }

        this.stats.completed++;
        this.stats.averageProcessingTime = this.processingTimes.reduce((a, b) => a + b, 0) / this.processingTimes.length;

        console.log(`Operation ${item.id} completed in ${processingTime}ms`);

        // Clear timeout and resolve
        if (item.timeout) {
          clearTimeout(item.timeout);
        }
        item.resolve(result);

      } catch (error) {
        const processingTime = Date.now() - startTime;

        this.stats.failed++;
        console.error(`Operation ${item.id} failed after ${processingTime}ms:`, error);

        // Clear timeout and reject
        if (item.timeout) {
          clearTimeout(item.timeout);
        }
        item.reject(error);
      }

      this.processing.delete(item.id);
      this.stats.processing--;
    }

    this.isProcessing = false;

    // If there are still items in queue and we're below concurrency limit, continue processing
    if (this.queue.length > 0 && this.processing.size < this.maxConcurrency) {
      setImmediate(() => this.processQueue());
    }
  }

  private removeFromQueue(id: string): boolean {
    const index = this.queue.findIndex(item => item.id === id);
    if (index !== -1) {
      const item = this.queue[index];
      this.queue.splice(index, 1);

      // Clear timeout
      if (item.timeout) {
        clearTimeout(item.timeout);
      }

      this.stats.pending--;
      this.stats.queueLength = this.queue.length;
      return true;
    }
    return false;
  }

  cancel(id: string): boolean {
    // Try to remove from queue first
    if (this.removeFromQueue(id)) {
      console.log(`Cancelled queued operation ${id}`);
      return true;
    }

    // If it's currently processing, we can't cancel it
    // but we can mark it for cancellation
    if (this.processing.has(id)) {
      console.log(`Cannot cancel actively processing operation ${id}`);
      return false;
    }

    return false;
  }

  getStats(): QueueStats {
    return { ...this.stats };
  }

  getQueueStatus(): {
    queueLength: number;
    processingCount: number;
    pendingOperations: Array<{ id: string; priority: number; waitTime: number }>;
  } {
    const now = Date.now();
    const pendingOperations = this.queue.map(item => ({
      id: item.id,
      priority: item.priority,
      waitTime: now - item.timestamp
    }));

    return {
      queueLength: this.queue.length,
      processingCount: this.processing.size,
      pendingOperations
    };
  }

  setMaxConcurrency(maxConcurrency: number): void {
    this.maxConcurrency = Math.max(1, maxConcurrency);
    this.stats.maxConcurrency = this.maxConcurrency;
    console.log(`Max concurrency set to ${this.maxConcurrency}`);

    // Trigger processing if we can now handle more operations
    if (!this.isProcessing && this.queue.length > 0) {
      this.processQueue();
    }
  }

  clear(): void {
    // Clear timeouts for all queued items
    for (const item of this.queue) {
      if (item.timeout) {
        clearTimeout(item.timeout);
      }
    }

    // Reject all pending operations
    const pendingItems = [...this.queue];
    this.queue.length = 0;

    for (const item of pendingItems) {
      item.reject(new Error('Queue cleared'));
    }

    this.stats.pending = 0;
    this.stats.queueLength = 0;

    console.log(`Cleared queue (${pendingItems.length} operations cancelled)`);
  }

  protected generateId(): string {
    return `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Specialized queue for Godot operations with resource awareness
export class GodotOperationQueue extends AsyncOperationQueue {
  private resourceLocks = new Map<string, Set<string>>(); // resource -> Set of operation IDs

  constructor(maxConcurrency = 2) { // Lower concurrency for Godot operations
    super(maxConcurrency, 45000); // 45 second timeout for Godot operations
  }

  async addWithResourceLock<T>(
    operation: () => Promise<T>,
    resources: string[],
    options: {
      priority?: number;
      timeout?: number;
      id?: string;
    } = {}
  ): Promise<T> {
    // Check for resource conflicts
    const conflictingOps = this.getConflictingOperations(resources);
    if (conflictingOps.length > 0) {
      console.log(`Operation conflicts with: ${conflictingOps.join(', ')}`);
      // Could implement waiting or priority boosting here
    }

    const operationPromise = this.add(operation, options);

    // Track resource locks
    const opId = options.id || this.generateId();
    for (const resource of resources) {
      if (!this.resourceLocks.has(resource)) {
        this.resourceLocks.set(resource, new Set());
      }
      this.resourceLocks.get(resource)!.add(opId);
    }

    // Clean up resource locks when operation completes
    operationPromise.finally(() => {
      for (const resource of resources) {
        const locks = this.resourceLocks.get(resource);
        if (locks) {
          locks.delete(opId);
          if (locks.size === 0) {
            this.resourceLocks.delete(resource);
          }
        }
      }
    });

    return operationPromise;
  }

  private getConflictingOperations(resources: string[]): string[] {
    const conflicts: string[] = [];

    for (const resource of resources) {
      const locks = this.resourceLocks.get(resource);
      if (locks && locks.size > 0) {
        conflicts.push(...Array.from(locks));
      }
    }

    return [...new Set(conflicts)]; // Remove duplicates
  }

  getResourceLocks(): Record<string, string[]> {
    const locks: Record<string, string[]> = {};
    for (const [resource, operationIds] of this.resourceLocks.entries()) {
      locks[resource] = Array.from(operationIds);
    }
    return locks;
  }
}

// Global queue instances
let globalGodotQueue: GodotOperationQueue | null = null;
let globalGeneralQueue: AsyncOperationQueue | null = null;

export function getGodotOperationQueue(): GodotOperationQueue {
  if (!globalGodotQueue) {
    globalGodotQueue = new GodotOperationQueue();
  }
  return globalGodotQueue;
}

export function getGeneralOperationQueue(): AsyncOperationQueue {
  if (!globalGeneralQueue) {
    globalGeneralQueue = new AsyncOperationQueue(5, 30000); // Higher concurrency for general ops
  }
  return globalGeneralQueue;
}

// Health monitoring for queues
export function getQueueHealthStatus(): {
  godotQueue: QueueStats;
  generalQueue: QueueStats;
  overallHealth: 'healthy' | 'warning' | 'critical';
} {
  const godotQueue = globalGodotQueue?.getStats() || {
    pending: 0, processing: 0, completed: 0, failed: 0,
    averageProcessingTime: 0, queueLength: 0, maxConcurrency: 2
  };

  const generalQueue = globalGeneralQueue?.getStats() || {
    pending: 0, processing: 0, completed: 0, failed: 0,
    averageProcessingTime: 0, queueLength: 0, maxConcurrency: 5
  };

  // Determine overall health
  let overallHealth: 'healthy' | 'warning' | 'critical' = 'healthy';

  if (godotQueue.failed > godotQueue.completed * 0.1) { // >10% failure rate
    overallHealth = 'critical';
  } else if (godotQueue.queueLength > godotQueue.maxConcurrency * 2) { // Queue backing up
    overallHealth = 'warning';
  }

  return {
    godotQueue,
    generalQueue,
    overallHealth
  };
}