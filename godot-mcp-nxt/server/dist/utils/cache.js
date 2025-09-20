// Intelligent Caching System for Godot MCP Server
// Implements LRU eviction, TTL, and performance monitoring
export class SmartCache {
    constructor(maxSize = 100, defaultTTL = 300000) {
        this.cache = new Map();
        this.accessOrder = new Map(); // For LRU tracking
        this.accessCounter = 0;
        this.maxSize = maxSize;
        this.defaultTTL = defaultTTL;
        this.stats = {
            hits: 0,
            misses: 0,
            evictions: 0,
            totalRequests: 0,
            hitRate: 0,
            currentSize: this.cache.size,
            maxSize,
            memoryUsage: 0,
            memoryPressure: 0
        };
    }
    get(key) {
        this.stats.totalRequests++;
        const entry = this.cache.get(key);
        if (!entry) {
            this.stats.misses++;
            this.updateHitRate();
            return null;
        }
        // Check TTL
        if (this.isExpired(entry)) {
            this.cache.delete(key);
            this.accessOrder.delete(key);
            this.stats.misses++;
            this.updateHitRate();
            return null;
        }
        // Update access tracking for LRU
        entry.accessCount++;
        this.accessOrder.set(key, ++this.accessCounter);
        this.stats.hits++;
        this.updateHitRate();
        return entry.data;
    }
    set(key, data, options = {}) {
        const ttl = options.ttl || this.defaultTTL;
        const size = options.size || 1;
        // Evict if necessary
        if (!this.cache.has(key) && this.cache.size >= this.maxSize) {
            this.evictLRU();
        }
        const entry = {
            data,
            timestamp: Date.now(),
            accessCount: 1,
            size,
            ttl,
            key
        };
        // Remove old entry if it exists
        if (this.cache.has(key)) {
            this.cache.delete(key);
        }
        this.cache.set(key, entry);
        this.accessOrder.set(key, ++this.accessCounter);
        this.stats.currentSize = this.cache.size;
        this.updateMemoryPressure();
        // Automatic cleanup under memory pressure
        this.cleanupIfNeeded();
    }
    has(key) {
        const entry = this.cache.get(key);
        if (!entry)
            return false;
        if (this.isExpired(entry)) {
            this.cache.delete(key);
            this.accessOrder.delete(key);
            return false;
        }
        return true;
    }
    delete(key) {
        if (this.cache.has(key)) {
            this.cache.delete(key);
            this.accessOrder.delete(key);
            this.stats.currentSize = this.cache.size;
            return true;
        }
        return false;
    }
    clear() {
        this.cache.clear();
        this.accessOrder.clear();
        this.accessCounter = 0;
        this.stats.currentSize = 0;
        this.stats.evictions = 0;
    }
    getStats() {
        return { ...this.stats };
    }
    // Get cache entries sorted by access frequency (most accessed first)
    getMostAccessed(limit = 10) {
        return Array.from(this.cache.entries())
            .map(([key, entry]) => ({
            key,
            accessCount: entry.accessCount,
            data: entry.data
        }))
            .sort((a, b) => b.accessCount - a.accessCount)
            .slice(0, limit);
    }
    // Get cache entries sorted by recency (most recently accessed first)
    getMostRecent(limit = 10) {
        return Array.from(this.cache.entries())
            .map(([key, entry]) => ({
            key,
            lastAccess: this.accessOrder.get(key) || 0,
            data: entry.data
        }))
            .sort((a, b) => b.lastAccess - a.lastAccess)
            .slice(0, limit);
    }
    // Cleanup expired entries
    cleanup() {
        let cleaned = 0;
        const now = Date.now();
        for (const [key, entry] of this.cache.entries()) {
            if (this.isExpired(entry)) {
                this.cache.delete(key);
                this.accessOrder.delete(key);
                cleaned++;
            }
        }
        this.stats.currentSize = this.cache.size;
        this.updateMemoryPressure();
        return cleaned;
    }
    isExpired(entry) {
        if (!entry.ttl)
            return false;
        return Date.now() - entry.timestamp > entry.ttl;
    }
    evictLRU() {
        if (this.cache.size === 0)
            return;
        // Find the least recently used entry
        let lruKey = '';
        let oldestAccess = Number.MAX_SAFE_INTEGER;
        for (const [key, accessTime] of this.accessOrder.entries()) {
            if (accessTime < oldestAccess) {
                oldestAccess = accessTime;
                lruKey = key;
            }
        }
        if (lruKey) {
            this.cache.delete(lruKey);
            this.accessOrder.delete(lruKey);
            this.stats.evictions++;
            console.log(`Evicted LRU cache entry: ${lruKey}`);
        }
    }
    updateHitRate() {
        if (this.stats.totalRequests > 0) {
            this.stats.hitRate = this.stats.hits / this.stats.totalRequests;
        }
    }
    // Calculate approximate memory usage of cache
    calculateMemoryUsage() {
        let totalSize = 0;
        for (const entry of this.cache.values()) {
            // Rough estimation: key size + data size + metadata
            totalSize += entry.key.length * 2; // UTF-16 chars
            totalSize += entry.size || 1; // Data size
            totalSize += 100; // Metadata overhead
        }
        return totalSize;
    }
    // Update memory pressure metrics
    updateMemoryPressure() {
        this.stats.memoryUsage = this.calculateMemoryUsage();
        // Memory pressure as percentage of max size
        this.stats.memoryPressure = this.maxSize > 0 ? (this.cache.size / this.maxSize) : 0;
    }
    // Get memory pressure level (0-1, where 1 is high pressure)
    getMemoryPressure() {
        this.updateMemoryPressure();
        return this.stats.memoryPressure;
    }
    // Force cleanup if memory pressure is high
    cleanupIfNeeded(memoryPressureThreshold = 0.8) {
        const pressure = this.getMemoryPressure();
        if (pressure >= memoryPressureThreshold) {
            console.log(`High memory pressure detected (${(pressure * 100).toFixed(1)}%), triggering cleanup`);
            return this.cleanup();
        }
        return 0;
    }
}
// Specialized cache for Godot operations
export class GodotOperationCache extends SmartCache {
    constructor() {
        super(200, 600000); // 200 entries, 10 minutes TTL
    }
    // Cache key generation for common operations
    generateKey(operation, params) {
        try {
            const paramStr = JSON.stringify(params, Object.keys(params).sort());
            return `${operation}:${this.hashString(paramStr)}`;
        }
        catch (error) {
            // Fallback for non-serializable params
            console.warn('Failed to serialize cache params, using fallback key:', error);
            return `${operation}:${this.hashString(JSON.stringify({ fallback: true }))}`;
        }
    }
    // Improved string hashing for cache keys using djb2 algorithm
    hashString(str) {
        let hash = 5381;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) + hash) + char; // djb2 algorithm
            hash = hash & 0xFFFFFFFF; // Convert to 32-bit integer
        }
        return Math.abs(hash).toString(36);
    }
    // Cache result of a Godot operation
    async cacheOperation(operation, params, operationFn) {
        const key = this.generateKey(operation, params);
        // Try to get from cache first
        const cached = this.get(key);
        if (cached !== null) {
            console.log(`Cache hit for operation: ${operation}`);
            return cached;
        }
        // Execute operation and cache result
        console.log(`Cache miss for operation: ${operation}, executing...`);
        const result = await operationFn();
        this.set(key, result);
        return result;
    }
}
// Global cache instances
let globalOperationCache = null;
let globalResourceCache = null;
export function getOperationCache() {
    if (!globalOperationCache) {
        globalOperationCache = new GodotOperationCache();
    }
    return globalOperationCache;
}
export function getResourceCache() {
    if (!globalResourceCache) {
        globalResourceCache = new SmartCache(50, 1800000); // 50 entries, 30 minutes TTL
    }
    return globalResourceCache;
}
// Periodic cleanup function
export function startCacheCleanup(intervalMs = 300000) {
    return setInterval(() => {
        try {
            if (globalOperationCache) {
                const cleanedOps = globalOperationCache.cleanup();
                if (cleanedOps > 0) {
                    console.log(`Cleaned ${cleanedOps} expired operation cache entries`);
                }
            }
            if (globalResourceCache) {
                const cleanedRes = globalResourceCache.cleanup();
                if (cleanedRes > 0) {
                    console.log(`Cleaned ${cleanedRes} expired resource cache entries`);
                }
            }
        }
        catch (error) {
            console.error('Error during cache cleanup:', error);
        }
    }, intervalMs);
}
//# sourceMappingURL=cache.js.map