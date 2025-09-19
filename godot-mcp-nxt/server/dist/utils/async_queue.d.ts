interface QueueStats {
    pending: number;
    processing: number;
    completed: number;
    failed: number;
    averageProcessingTime: number;
    queueLength: number;
    maxConcurrency: number;
}
export declare class AsyncOperationQueue {
    private queue;
    private processing;
    private maxConcurrency;
    private defaultTimeout;
    private stats;
    private processingTimes;
    private isProcessing;
    constructor(maxConcurrency?: number, defaultTimeout?: number);
    add<T>(operation: () => Promise<T>, options?: {
        priority?: number;
        timeout?: number;
        id?: string;
    }): Promise<T>;
    private insertWithPriority;
    private processQueue;
    private removeFromQueue;
    cancel(id: string): boolean;
    getStats(): QueueStats;
    getQueueStatus(): {
        queueLength: number;
        processingCount: number;
        pendingOperations: Array<{
            id: string;
            priority: number;
            waitTime: number;
        }>;
    };
    setMaxConcurrency(maxConcurrency: number): void;
    clear(): void;
    protected generateId(): string;
}
export declare class GodotOperationQueue extends AsyncOperationQueue {
    private resourceLocks;
    constructor(maxConcurrency?: number);
    addWithResourceLock<T>(operation: () => Promise<T>, resources: string[], options?: {
        priority?: number;
        timeout?: number;
        id?: string;
    }): Promise<T>;
    private getConflictingOperations;
    getResourceLocks(): Record<string, string[]>;
}
export declare function getGodotOperationQueue(): GodotOperationQueue;
export declare function getGeneralOperationQueue(): AsyncOperationQueue;
export declare function getQueueHealthStatus(): {
    godotQueue: QueueStats;
    generalQueue: QueueStats;
    overallHealth: 'healthy' | 'warning' | 'critical';
};
export {};
