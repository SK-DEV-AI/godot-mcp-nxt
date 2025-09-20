import * as fs from 'fs';
import * as path from 'path';
import { Logger } from './logger.js';

const configLogger = new Logger('config');

/**
 * Server configuration interface
 */
export interface ServerConfig {
  // Logging
  logLevel: string;
  debug: boolean;

  // Server
  godotWsPort: number;
  connectionTimeout: number;
  maxRetries: number;
  retryDelay: number;

  // Performance
  cacheCleanupInterval: number;
  maxCacheSize: number;
  queueProcessInterval: number;
  maxConcurrentOperations: number;

  // Debug features
  enablePerformanceMonitoring: boolean;
  enableDetailedErrors: boolean;
  enableRequestLogging: boolean;
  enableWsTracing: boolean;

  // Development
  hotReload: boolean;
  testMode: boolean;
  mockGodotConnection: boolean;
}

/**
 * Default configuration values
 */
const DEFAULT_CONFIG: ServerConfig = {
  // Logging
  logLevel: 'INFO',
  debug: false,

  // Server
  godotWsPort: 9080,
  connectionTimeout: 20000,
  maxRetries: 3,
  retryDelay: 2000,

  // Performance
  cacheCleanupInterval: 300000, // 5 minutes
  maxCacheSize: 1000,
  queueProcessInterval: 100,
  maxConcurrentOperations: 10,

  // Debug features
  enablePerformanceMonitoring: true,
  enableDetailedErrors: true,
  enableRequestLogging: false,
  enableWsTracing: false,

  // Development
  hotReload: false,
  testMode: false,
  mockGodotConnection: false
};

/**
 * Load environment variables from .env file
 */
function loadEnvFile(): void {
  const envPath = path.resolve(process.cwd(), '.env');

  try {
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      const lines = envContent.split('\n');

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const [key, ...valueParts] = trimmed.split('=');
          if (key && valueParts.length > 0) {
            const value = valueParts.join('=').trim();
            // Remove quotes if present
            const cleanValue = value.replace(/^["']|["']$/g, '');
            process.env[key.trim()] = cleanValue;
          }
        }
      }

      configLogger.info('Loaded environment configuration from .env file');
    } else {
      configLogger.info('No .env file found, using default configuration');
    }
  } catch (error) {
    configLogger.error('Failed to load .env file', { error: (error as Error).message });
  }
}

/**
 * Parse environment variable to number with fallback
 */
function parseNumber(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? fallback : parsed;
}

/**
 * Parse environment variable to boolean with fallback
 */
function parseBoolean(value: string | undefined, fallback: boolean): boolean {
  if (!value) return fallback;
  return value.toLowerCase() === 'true' || value === '1';
}

/**
 * Load and validate server configuration
 */
export function loadConfig(): ServerConfig {
  // Load .env file first
  loadEnvFile();

  const config: ServerConfig = {
    // Logging
    logLevel: process.env.LOG_LEVEL || DEFAULT_CONFIG.logLevel,
    debug: parseBoolean(process.env.DEBUG, DEFAULT_CONFIG.debug),

    // Server
    godotWsPort: parseNumber(process.env.GODOT_WS_PORT, DEFAULT_CONFIG.godotWsPort),
    connectionTimeout: parseNumber(process.env.CONNECTION_TIMEOUT, DEFAULT_CONFIG.connectionTimeout),
    maxRetries: parseNumber(process.env.MAX_RETRIES, DEFAULT_CONFIG.maxRetries),
    retryDelay: parseNumber(process.env.RETRY_DELAY, DEFAULT_CONFIG.retryDelay),

    // Performance
    cacheCleanupInterval: parseNumber(process.env.CACHE_CLEANUP_INTERVAL, DEFAULT_CONFIG.cacheCleanupInterval),
    maxCacheSize: parseNumber(process.env.MAX_CACHE_SIZE, DEFAULT_CONFIG.maxCacheSize),
    queueProcessInterval: parseNumber(process.env.QUEUE_PROCESS_INTERVAL, DEFAULT_CONFIG.queueProcessInterval),
    maxConcurrentOperations: parseNumber(process.env.MAX_CONCURRENT_OPERATIONS, DEFAULT_CONFIG.maxConcurrentOperations),

    // Debug features
    enablePerformanceMonitoring: parseBoolean(process.env.ENABLE_PERFORMANCE_MONITORING, DEFAULT_CONFIG.enablePerformanceMonitoring),
    enableDetailedErrors: parseBoolean(process.env.ENABLE_DETAILED_ERRORS, DEFAULT_CONFIG.enableDetailedErrors),
    enableRequestLogging: parseBoolean(process.env.ENABLE_REQUEST_LOGGING, DEFAULT_CONFIG.enableRequestLogging),
    enableWsTracing: parseBoolean(process.env.ENABLE_WS_TRACING, DEFAULT_CONFIG.enableWsTracing),

    // Development
    hotReload: parseBoolean(process.env.HOT_RELOAD, DEFAULT_CONFIG.hotReload),
    testMode: parseBoolean(process.env.TEST_MODE, DEFAULT_CONFIG.testMode),
    mockGodotConnection: parseBoolean(process.env.MOCK_GODOT_CONNECTION, DEFAULT_CONFIG.mockGodotConnection)
  };

  // Validate configuration
  validateConfig(config);

  configLogger.info('Configuration loaded successfully', {
    logLevel: config.logLevel,
    debug: config.debug,
    port: config.godotWsPort
  });

  return config;
}

/**
 * Validate configuration values
 */
function validateConfig(config: ServerConfig): void {
  const errors: string[] = [];

  // Validate log level
  const validLogLevels = ['ERROR', 'WARN', 'INFO', 'DEBUG', 'TRACE'];
  if (!validLogLevels.includes(config.logLevel.toUpperCase())) {
    errors.push(`Invalid LOG_LEVEL: ${config.logLevel}. Must be one of: ${validLogLevels.join(', ')}`);
  }

  // Validate port range
  if (config.godotWsPort < 1024 || config.godotWsPort > 65535) {
    errors.push(`Invalid GODOT_WS_PORT: ${config.godotWsPort}. Must be between 1024 and 65535`);
  }

  // Validate timeouts
  if (config.connectionTimeout < 1000) {
    errors.push(`Invalid CONNECTION_TIMEOUT: ${config.connectionTimeout}. Must be at least 1000ms`);
  }

  if (config.retryDelay < 100) {
    errors.push(`Invalid RETRY_DELAY: ${config.retryDelay}. Must be at least 100ms`);
  }

  // Validate performance settings
  if (config.maxCacheSize < 10) {
    errors.push(`Invalid MAX_CACHE_SIZE: ${config.maxCacheSize}. Must be at least 10`);
  }

  if (config.maxConcurrentOperations < 1) {
    errors.push(`Invalid MAX_CONCURRENT_OPERATIONS: ${config.maxConcurrentOperations}. Must be at least 1`);
  }

  if (errors.length > 0) {
    const errorMessage = `Configuration validation failed:\n${errors.join('\n')}`;
    configLogger.error(errorMessage);
    throw new Error(errorMessage);
  }
}

/**
 * Get current configuration (loads if not already loaded)
 */
let currentConfig: ServerConfig | null = null;

export function getConfig(): ServerConfig {
  if (!currentConfig) {
    currentConfig = loadConfig();
  }
  return currentConfig;
}

/**
 * Reload configuration (useful for testing)
 */
export function reloadConfig(): ServerConfig {
  currentConfig = null;
  return loadConfig();
}

/**
 * Check if debug mode is enabled
 */
export function isDebugMode(): boolean {
  return getConfig().debug || getConfig().logLevel.toUpperCase() === 'DEBUG';
}

/**
 * Check if trace mode is enabled
 */
export function isTraceMode(): boolean {
  return getConfig().logLevel.toUpperCase() === 'TRACE';
}