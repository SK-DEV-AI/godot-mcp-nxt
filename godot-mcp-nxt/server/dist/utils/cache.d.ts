interface CacheStats {
    hits: number;
    misses: number;
    evictions: number;
    totalRequests: number;
    hitRate: number;
    currentSize: number;
    maxSize: number;
    memoryUsage: number;
    memoryPressure: number;
}
export declare class SmartCache<T = any> {
    private cache;
    private accessOrder;
    private accessCounter;
    private maxSize;
    private defaultTTL;
    private stats;
    constructor(maxSize?: number, defaultTTL?: number);
    get(key: string): T | null;
    set(key: string, data: T, options?: {
        ttl?: number;
        size?: number;
    }): void;
    has(key: string): boolean;
    delete(key: string): boolean;
    clear(): void;
    getStats(): CacheStats;
    getMostAccessed(limit?: number): Array<{
        key: string;
        accessCount: number;
        data: T;
    }>;
    getMostRecent(limit?: number): Array<{
        key: string;
        lastAccess: number;
        data: T;
    }>;
    cleanup(): number;
    private isExpired;
    private evictLRU;
    private updateHitRate;
    private calculateMemoryUsage;
    private updateMemoryPressure;
    getMemoryPressure(): number;
    cleanupIfNeeded(memoryPressureThreshold?: number): number;
}
export declare class GodotOperationCache extends SmartCache {
    constructor();
    generateKey(operation: string, params: Record<string, any>): string;
    private hashString;
    cacheOperation<T>(operation: string, params: Record<string, any>, operationFn: () => Promise<T>): Promise<T>;
}
export declare function getOperationCache(): GodotOperationCache;
export declare function getResourceCache(): SmartCache;
export declare function startCacheCleanup(intervalMs?: number): ReturnType<typeof setInterval>;
export {};
