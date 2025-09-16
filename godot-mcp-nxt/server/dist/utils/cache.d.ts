/**
 * Shared caching layer for Godot MCP operations
 * Provides caching for expensive operations like file scanning, project structure analysis, etc.
 */
interface CacheOptions {
    ttl?: number;
    keyPrefix?: string;
}
declare class SharedCache {
    private cache;
    private defaultTTL;
    /**
     * Get cached data if it exists and hasn't expired
     */
    get<T>(key: string): T | null;
    /**
     * Set data in cache with optional TTL
     */
    set<T>(key: string, data: T, options?: CacheOptions): void;
    /**
     * Check if key exists and is valid
     */
    has(key: string): boolean;
    /**
     * Delete a specific key
     */
    delete(key: string): boolean;
    /**
     * Clear all cached data
     */
    clear(): void;
    /**
     * Get cache statistics
     */
    getStats(): {
        totalEntries: number;
        validEntries: number;
        expiredEntries: number;
    };
    /**
     * Clean up expired entries
     */
    cleanup(): void;
    /**
     * Create a cache key with prefix
     */
    createKey(operation: string, params: any, prefix?: string): string;
}
export declare const sharedCache: SharedCache;
export declare const CACHE_PREFIXES: {
    readonly GODOT_PATH: "godot_path";
    readonly PROJECT_STRUCTURE: "project_structure";
    readonly SCRIPT_CONTENT: "script_content";
    readonly SCENE_STRUCTURE: "scene_structure";
    readonly PROJECT_FILES: "project_files";
    readonly SCRIPT_METADATA: "script_metadata";
};
/**
 * Cached wrapper for Godot path detection
 */
export declare function getCachedGodotPath(): Promise<string | null>;
/**
 * Cached wrapper for project structure
 */
export declare function getCachedProjectStructure(projectPath: string): Promise<any>;
/**
 * Cached wrapper for script content
 */
export declare function getCachedScriptContent(scriptPath: string): Promise<string | null>;
/**
 * Invalidate cache for specific patterns
 */
export declare function invalidateCache(pattern: string): void;
/**
 * Set up periodic cache cleanup
 */
export declare function setupCacheCleanup(intervalMs?: number): void;
export {};
