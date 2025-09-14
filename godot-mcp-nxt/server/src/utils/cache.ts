/**
 * Shared caching layer for Godot MCP operations
 * Provides caching for expensive operations like file scanning, project structure analysis, etc.
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

interface CacheOptions {
  ttl?: number; // Default 5 minutes
  keyPrefix?: string;
}

class SharedCache {
  private cache = new Map<string, CacheEntry<any>>();
  private defaultTTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Get cached data if it exists and hasn't expired
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Set data in cache with optional TTL
   */
  set<T>(key: string, data: T, options: CacheOptions = {}): void {
    const ttl = options.ttl || this.defaultTTL;
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  /**
   * Check if key exists and is valid
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Delete a specific key
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all cached data
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats() {
    let validEntries = 0;
    let expiredEntries = 0;

    this.cache.forEach((entry, key) => {
      if (Date.now() - entry.timestamp > entry.ttl) {
        expiredEntries++;
      } else {
        validEntries++;
      }
    });

    return {
      totalEntries: this.cache.size,
      validEntries,
      expiredEntries
    };
  }

  /**
   * Clean up expired entries
   */
  cleanup(): void {
    const now = Date.now();
    this.cache.forEach((entry, key) => {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    });
  }

  /**
   * Create a cache key with prefix
   */
  createKey(operation: string, params: any, prefix?: string): string {
    const paramStr = JSON.stringify(params, Object.keys(params).sort());
    const fullPrefix = prefix ? `${prefix}:` : '';
    return `${fullPrefix}${operation}:${paramStr}`;
  }
}

// Global cache instance
export const sharedCache = new SharedCache();

// Cache key prefixes for different operation types
export const CACHE_PREFIXES = {
  GODOT_PATH: 'godot_path',
  PROJECT_STRUCTURE: 'project_structure',
  SCRIPT_CONTENT: 'script_content',
  SCENE_STRUCTURE: 'scene_structure',
  PROJECT_FILES: 'project_files',
  SCRIPT_METADATA: 'script_metadata'
} as const;

/**
 * Cached wrapper for Godot path detection
 */
export async function getCachedGodotPath(): Promise<string | null> {
  const cacheKey = sharedCache.createKey('godot_path', {}, CACHE_PREFIXES.GODOT_PATH);

  let godotPath = sharedCache.get<string>(cacheKey);
  if (godotPath) {
    return godotPath;
  }

  // Import and use the detection logic directly
  const util = await import('util');
  const childProcess = await import('child_process');
  const execAsync = util.promisify(childProcess.exec);
  const { normalize } = await import('path');
  const fs = await import('fs');

  // Check environment variable
  if (process.env.GODOT_PATH) {
    const normalizedPath = normalize(process.env.GODOT_PATH);
    try {
      await execAsync(`"${normalizedPath}" --version`);
      godotPath = normalizedPath;
    } catch {
      // Continue with auto-detection
    }
  }

  // Auto-detect based on platform
  if (!godotPath) {
    const osPlatform = process.platform;
    const possiblePaths: string[] = ['godot'];

    if (osPlatform === 'darwin') {
      possiblePaths.push(
        '/Applications/Godot.app/Contents/MacOS/Godot',
        '/Applications/Godot_4.app/Contents/MacOS/Godot'
      );
    } else if (osPlatform === 'win32') {
      possiblePaths.push(
        'C:\\Program Files\\Godot\\Godot.exe',
        'C:\\Program Files (x86)\\Godot\\Godot.exe'
      );
    } else if (osPlatform === 'linux') {
      possiblePaths.push(
        '/usr/bin/godot',
        '/usr/local/bin/godot'
      );
    }

    for (const path of possiblePaths) {
      const normalizedPath = normalize(path);
      try {
        await execAsync(`"${normalizedPath}" --version`);
        godotPath = normalizedPath;
        break;
      } catch {
        // Continue checking other paths
      }
    }
  }

  if (godotPath) {
    sharedCache.set(cacheKey, godotPath, { ttl: 30 * 60 * 1000 }); // 30 minutes
  }

  return godotPath;
}

/**
 * Cached wrapper for project structure
 */
export async function getCachedProjectStructure(projectPath: string): Promise<any> {
  const cacheKey = sharedCache.createKey('project_structure', { projectPath }, CACHE_PREFIXES.PROJECT_STRUCTURE);

  let structure = sharedCache.get(cacheKey);
  if (structure) {
    return structure;
  }

  // Calculate project structure directly
  const fs = await import('fs');
  const { join } = await import('path');

  try {
    const structure = {
      scenes: 0,
      scripts: 0,
      assets: 0,
      other: 0,
    };

    const scanDirectory = (currentPath: string) => {
      const entries = fs.readdirSync(currentPath, { withFileTypes: true });

      for (const entry of entries) {
        const entryPath = join(currentPath, entry.name);

        if (entry.name.startsWith('.')) continue;

        if (entry.isDirectory()) {
          scanDirectory(entryPath);
        } else if (entry.isFile()) {
          const ext = entry.name.split('.').pop()?.toLowerCase();

          if (ext === 'tscn') {
            structure.scenes++;
          } else if (ext === 'gd' || ext === 'gdscript' || ext === 'cs') {
            structure.scripts++;
          } else if (['png', 'jpg', 'jpeg', 'webp', 'svg', 'ttf', 'wav', 'mp3', 'ogg'].includes(ext || '')) {
            structure.assets++;
          } else {
            structure.other++;
          }
        }
      }
    };

    scanDirectory(projectPath);
    sharedCache.set(cacheKey, structure, { ttl: 10 * 60 * 1000 }); // 10 minutes
    return structure;
  } catch (error) {
    return {
      error: 'Failed to get project structure',
      scenes: 0,
      scripts: 0,
      assets: 0,
      other: 0
    };
  }
}

/**
 * Cached wrapper for script content
 */
export async function getCachedScriptContent(scriptPath: string): Promise<string | null> {
  const cacheKey = sharedCache.createKey('script_content', { scriptPath }, CACHE_PREFIXES.SCRIPT_CONTENT);

  let content = sharedCache.get<string>(cacheKey);
  if (content) {
    return content;
  }

  // Get from Godot connection
  const { getGodotConnection } = await import('./godot_connection.js');
  const godot = getGodotConnection();

  try {
    const result = await godot.sendCommand('get_script', { script_path: scriptPath });
    content = result?.content;

    if (content) {
      sharedCache.set(cacheKey, content, { ttl: 5 * 60 * 1000 }); // 5 minutes
    }

    return content;
  } catch (error) {
    console.error('Error getting cached script content:', error);
    return null;
  }
}

/**
 * Invalidate cache for specific patterns
 */
export function invalidateCache(pattern: string): void {
  sharedCache['cache'].forEach((value, key) => {
    if (key.includes(pattern)) {
      sharedCache.delete(key);
    }
  });
}

/**
 * Set up periodic cache cleanup
 */
export function setupCacheCleanup(intervalMs: number = 10 * 60 * 1000): void { // Default 10 minutes
  setInterval(() => {
    sharedCache.cleanup();
  }, intervalMs);
}