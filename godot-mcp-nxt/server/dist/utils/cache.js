/**
 * Shared caching layer for Godot MCP operations
 * Provides caching for expensive operations like file scanning, project structure analysis, etc.
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var SharedCache = /** @class */ (function () {
    function SharedCache() {
        this.cache = new Map();
        this.defaultTTL = 5 * 60 * 1000; // 5 minutes
    }
    /**
     * Get cached data if it exists and hasn't expired
     */
    SharedCache.prototype.get = function (key) {
        var entry = this.cache.get(key);
        if (!entry)
            return null;
        if (Date.now() - entry.timestamp > entry.ttl) {
            this.cache.delete(key);
            return null;
        }
        return entry.data;
    };
    /**
     * Set data in cache with optional TTL
     */
    SharedCache.prototype.set = function (key, data, options) {
        if (options === void 0) { options = {}; }
        var ttl = options.ttl || this.defaultTTL;
        this.cache.set(key, {
            data: data,
            timestamp: Date.now(),
            ttl: ttl
        });
    };
    /**
     * Check if key exists and is valid
     */
    SharedCache.prototype.has = function (key) {
        var entry = this.cache.get(key);
        if (!entry)
            return false;
        if (Date.now() - entry.timestamp > entry.ttl) {
            this.cache.delete(key);
            return false;
        }
        return true;
    };
    /**
     * Delete a specific key
     */
    SharedCache.prototype.delete = function (key) {
        return this.cache.delete(key);
    };
    /**
     * Clear all cached data
     */
    SharedCache.prototype.clear = function () {
        this.cache.clear();
    };
    /**
     * Get cache statistics
     */
    SharedCache.prototype.getStats = function () {
        var validEntries = 0;
        var expiredEntries = 0;
        this.cache.forEach(function (entry, key) {
            if (Date.now() - entry.timestamp > entry.ttl) {
                expiredEntries++;
            }
            else {
                validEntries++;
            }
        });
        return {
            totalEntries: this.cache.size,
            validEntries: validEntries,
            expiredEntries: expiredEntries
        };
    };
    /**
     * Clean up expired entries
     */
    SharedCache.prototype.cleanup = function () {
        var _this = this;
        var now = Date.now();
        this.cache.forEach(function (entry, key) {
            if (now - entry.timestamp > entry.ttl) {
                _this.cache.delete(key);
            }
        });
    };
    /**
     * Create a cache key with prefix
     */
    SharedCache.prototype.createKey = function (operation, params, prefix) {
        var paramStr = JSON.stringify(params, Object.keys(params).sort());
        var fullPrefix = prefix ? "".concat(prefix, ":") : '';
        return "".concat(fullPrefix).concat(operation, ":").concat(paramStr);
    };
    return SharedCache;
}());
// Global cache instance
export var sharedCache = new SharedCache();
// Cache key prefixes for different operation types
export var CACHE_PREFIXES = {
    GODOT_PATH: 'godot_path',
    PROJECT_STRUCTURE: 'project_structure',
    SCRIPT_CONTENT: 'script_content',
    SCENE_STRUCTURE: 'scene_structure',
    PROJECT_FILES: 'project_files',
    SCRIPT_METADATA: 'script_metadata'
};
/**
 * Cached wrapper for Godot path detection
 */
export function getCachedGodotPath() {
    return __awaiter(this, void 0, void 0, function () {
        var cacheKey, godotPath, util, childProcess, execAsync, normalize, fs, normalizedPath, _a, osPlatform, possiblePaths, _i, possiblePaths_1, path, normalizedPath, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    cacheKey = sharedCache.createKey('godot_path', {}, CACHE_PREFIXES.GODOT_PATH);
                    godotPath = sharedCache.get(cacheKey);
                    if (godotPath) {
                        return [2 /*return*/, godotPath];
                    }
                    return [4 /*yield*/, import('util')];
                case 1:
                    util = _c.sent();
                    return [4 /*yield*/, import('child_process')];
                case 2:
                    childProcess = _c.sent();
                    execAsync = util.promisify(childProcess.exec);
                    return [4 /*yield*/, import('path')];
                case 3:
                    normalize = (_c.sent()).normalize;
                    return [4 /*yield*/, import('fs')];
                case 4:
                    fs = _c.sent();
                    if (!process.env.GODOT_PATH) return [3 /*break*/, 8];
                    normalizedPath = normalize(process.env.GODOT_PATH);
                    _c.label = 5;
                case 5:
                    _c.trys.push([5, 7, , 8]);
                    return [4 /*yield*/, execAsync("\"".concat(normalizedPath, "\" --version"))];
                case 6:
                    _c.sent();
                    godotPath = normalizedPath;
                    return [3 /*break*/, 8];
                case 7:
                    _a = _c.sent();
                    return [3 /*break*/, 8];
                case 8:
                    if (!!godotPath) return [3 /*break*/, 14];
                    osPlatform = process.platform;
                    possiblePaths = ['godot'];
                    if (osPlatform === 'darwin') {
                        possiblePaths.push('/Applications/Godot.app/Contents/MacOS/Godot', '/Applications/Godot_4.app/Contents/MacOS/Godot');
                    }
                    else if (osPlatform === 'win32') {
                        possiblePaths.push('C:\\Program Files\\Godot\\Godot.exe', 'C:\\Program Files (x86)\\Godot\\Godot.exe');
                    }
                    else if (osPlatform === 'linux') {
                        possiblePaths.push('/usr/bin/godot', '/usr/local/bin/godot');
                    }
                    _i = 0, possiblePaths_1 = possiblePaths;
                    _c.label = 9;
                case 9:
                    if (!(_i < possiblePaths_1.length)) return [3 /*break*/, 14];
                    path = possiblePaths_1[_i];
                    normalizedPath = normalize(path);
                    _c.label = 10;
                case 10:
                    _c.trys.push([10, 12, , 13]);
                    return [4 /*yield*/, execAsync("\"".concat(normalizedPath, "\" --version"))];
                case 11:
                    _c.sent();
                    godotPath = normalizedPath;
                    return [3 /*break*/, 14];
                case 12:
                    _b = _c.sent();
                    return [3 /*break*/, 13];
                case 13:
                    _i++;
                    return [3 /*break*/, 9];
                case 14:
                    if (godotPath) {
                        sharedCache.set(cacheKey, godotPath, { ttl: 30 * 60 * 1000 }); // 30 minutes
                    }
                    return [2 /*return*/, godotPath];
            }
        });
    });
}
/**
 * Cached wrapper for project structure
 */
export function getCachedProjectStructure(projectPath) {
    return __awaiter(this, void 0, void 0, function () {
        var cacheKey, structure, fs, join, structure_1, scanDirectory_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    cacheKey = sharedCache.createKey('project_structure', { projectPath: projectPath }, CACHE_PREFIXES.PROJECT_STRUCTURE);
                    structure = sharedCache.get(cacheKey);
                    if (structure) {
                        return [2 /*return*/, structure];
                    }
                    return [4 /*yield*/, import('fs')];
                case 1:
                    fs = _a.sent();
                    return [4 /*yield*/, import('path')];
                case 2:
                    join = (_a.sent()).join;
                    try {
                        structure_1 = {
                            scenes: 0,
                            scripts: 0,
                            assets: 0,
                            other: 0,
                        };
                        scanDirectory_1 = function (currentPath) {
                            var _a;
                            var entries = fs.readdirSync(currentPath, { withFileTypes: true });
                            for (var _i = 0, entries_1 = entries; _i < entries_1.length; _i++) {
                                var entry = entries_1[_i];
                                var entryPath = join(currentPath, entry.name);
                                if (entry.name.startsWith('.'))
                                    continue;
                                if (entry.isDirectory()) {
                                    scanDirectory_1(entryPath);
                                }
                                else if (entry.isFile()) {
                                    var ext = (_a = entry.name.split('.').pop()) === null || _a === void 0 ? void 0 : _a.toLowerCase();
                                    if (ext === 'tscn') {
                                        structure_1.scenes++;
                                    }
                                    else if (ext === 'gd' || ext === 'gdscript' || ext === 'cs') {
                                        structure_1.scripts++;
                                    }
                                    else if (['png', 'jpg', 'jpeg', 'webp', 'svg', 'ttf', 'wav', 'mp3', 'ogg'].includes(ext || '')) {
                                        structure_1.assets++;
                                    }
                                    else {
                                        structure_1.other++;
                                    }
                                }
                            }
                        };
                        scanDirectory_1(projectPath);
                        sharedCache.set(cacheKey, structure_1, { ttl: 10 * 60 * 1000 }); // 10 minutes
                        return [2 /*return*/, structure_1];
                    }
                    catch (error) {
                        return [2 /*return*/, {
                                error: 'Failed to get project structure',
                                scenes: 0,
                                scripts: 0,
                                assets: 0,
                                other: 0
                            }];
                    }
                    return [2 /*return*/];
            }
        });
    });
}
/**
 * Cached wrapper for script content
 */
export function getCachedScriptContent(scriptPath) {
    return __awaiter(this, void 0, void 0, function () {
        var cacheKey, content, getGodotConnection, godot, result, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    cacheKey = sharedCache.createKey('script_content', { scriptPath: scriptPath }, CACHE_PREFIXES.SCRIPT_CONTENT);
                    content = sharedCache.get(cacheKey);
                    if (content) {
                        return [2 /*return*/, content];
                    }
                    return [4 /*yield*/, import('./godot_connection.js')];
                case 1:
                    getGodotConnection = (_a.sent()).getGodotConnection;
                    godot = getGodotConnection();
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 4, , 5]);
                    return [4 /*yield*/, godot.sendCommand('get_script', { script_path: scriptPath })];
                case 3:
                    result = _a.sent();
                    content = result === null || result === void 0 ? void 0 : result.content;
                    if (content) {
                        sharedCache.set(cacheKey, content, { ttl: 5 * 60 * 1000 }); // 5 minutes
                    }
                    return [2 /*return*/, content];
                case 4:
                    error_1 = _a.sent();
                    console.error('Error getting cached script content:', error_1);
                    return [2 /*return*/, null];
                case 5: return [2 /*return*/];
            }
        });
    });
}
/**
 * Invalidate cache for specific patterns
 */
export function invalidateCache(pattern) {
    sharedCache['cache'].forEach(function (value, key) {
        if (key.includes(pattern)) {
            sharedCache.delete(key);
        }
    });
}
/**
 * Set up periodic cache cleanup
 */
export function setupCacheCleanup(intervalMs) {
    if (intervalMs === void 0) { intervalMs = 10 * 60 * 1000; }
    setInterval(function () {
        sharedCache.cleanup();
    }, intervalMs);
}
//# sourceMappingURL=cache.js.map