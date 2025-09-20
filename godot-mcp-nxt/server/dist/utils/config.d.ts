/**
 * Server configuration interface
 */
export interface ServerConfig {
    logLevel: string;
    debug: boolean;
    godotWsPort: number;
    connectionTimeout: number;
    maxRetries: number;
    retryDelay: number;
    cacheCleanupInterval: number;
    maxCacheSize: number;
    queueProcessInterval: number;
    maxConcurrentOperations: number;
    enablePerformanceMonitoring: boolean;
    enableDetailedErrors: boolean;
    enableRequestLogging: boolean;
    enableWsTracing: boolean;
    hotReload: boolean;
    testMode: boolean;
    mockGodotConnection: boolean;
}
/**
 * Load and validate server configuration
 */
export declare function loadConfig(): ServerConfig;
export declare function getConfig(): ServerConfig;
/**
 * Reload configuration (useful for testing)
 */
export declare function reloadConfig(): ServerConfig;
/**
 * Check if debug mode is enabled
 */
export declare function isDebugMode(): boolean;
/**
 * Check if trace mode is enabled
 */
export declare function isTraceMode(): boolean;
