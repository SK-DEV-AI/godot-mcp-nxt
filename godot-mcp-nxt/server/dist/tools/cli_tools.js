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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import { z } from 'zod';
import { fileURLToPath } from 'url';
import { join, dirname, normalize, basename } from 'path';
import { readdirSync, existsSync } from 'fs';
import { spawn } from 'child_process';
import { promisify } from 'util';
import { exec } from 'child_process';
import { getCachedGodotPath, getCachedProjectStructure } from '../utils/cache.js';
import { retryGodotOperation } from '../utils/retry.js';
var execAsync = promisify(exec);
// Derive __filename and __dirname in ESM
var __filename = fileURLToPath(import.meta.url);
var __dirname = dirname(__filename);
// Godot path detection and management
var godotPath = null;
var activeProcess = null;
var output = [];
var errors = [];
function detectGodotPath() {
    return __awaiter(this, void 0, void 0, function () {
        var _a, normalizedPath, osPlatform, possiblePaths, _i, possiblePaths_1, path, normalizedPath;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _a = godotPath;
                    if (!_a) return [3 /*break*/, 2];
                    return [4 /*yield*/, isValidGodotPath(godotPath)];
                case 1:
                    _a = (_b.sent());
                    _b.label = 2;
                case 2:
                    if (_a) {
                        return [2 /*return*/];
                    }
                    if (!process.env.GODOT_PATH) return [3 /*break*/, 4];
                    normalizedPath = normalize(process.env.GODOT_PATH);
                    return [4 /*yield*/, isValidGodotPath(normalizedPath)];
                case 3:
                    if (_b.sent()) {
                        godotPath = normalizedPath;
                        return [2 /*return*/];
                    }
                    _b.label = 4;
                case 4:
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
                    _b.label = 5;
                case 5:
                    if (!(_i < possiblePaths_1.length)) return [3 /*break*/, 8];
                    path = possiblePaths_1[_i];
                    normalizedPath = normalize(path);
                    return [4 /*yield*/, isValidGodotPath(normalizedPath)];
                case 6:
                    if (_b.sent()) {
                        godotPath = normalizedPath;
                        return [2 /*return*/];
                    }
                    _b.label = 7;
                case 7:
                    _i++;
                    return [3 /*break*/, 5];
                case 8:
                    console.warn('[CLI] Could not find Godot executable');
                    return [2 /*return*/];
            }
        });
    });
}
function isValidGodotPath(path) {
    return __awaiter(this, void 0, void 0, function () {
        var command, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, , 3]);
                    command = path === 'godot' ? 'godot --version' : "\"".concat(path, "\" --version");
                    return [4 /*yield*/, execAsync(command)];
                case 1:
                    _b.sent();
                    return [2 /*return*/, true];
                case 2:
                    _a = _b.sent();
                    return [2 /*return*/, false];
                case 3: return [2 /*return*/];
            }
        });
    });
}
function executeOperation(operation, params, projectPath) {
    return __awaiter(this, void 0, void 0, function () {
        var operationsScriptPath, paramsJson, escapedParams, isWindows, quotedParams, cmd, result, error_1;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!!godotPath) return [3 /*break*/, 2];
                    return [4 /*yield*/, getCachedGodotPath()];
                case 1:
                    godotPath = _a.sent();
                    if (!godotPath) {
                        throw new Error('Could not find a valid Godot executable path');
                    }
                    _a.label = 2;
                case 2:
                    operationsScriptPath = join(__dirname, '..', 'scripts', 'godot_operations.gd');
                    paramsJson = JSON.stringify(params);
                    escapedParams = paramsJson.replace(/'/g, "'\\''");
                    isWindows = process.platform === 'win32';
                    quotedParams = isWindows
                        ? "\"".concat(paramsJson.replace(/\"/g, '\\"'), "\"")
                        : "'".concat(escapedParams, "'");
                    cmd = [
                        "\"".concat(godotPath, "\""),
                        '--headless',
                        '--path',
                        "\"".concat(projectPath, "\""),
                        '--script',
                        "\"".concat(operationsScriptPath, "\""),
                        operation,
                        quotedParams,
                    ].join(' ');
                    _a.label = 3;
                case 3:
                    _a.trys.push([3, 5, , 6]);
                    return [4 /*yield*/, retryGodotOperation(function () { return __awaiter(_this, void 0, void 0, function () {
                            var _a, stdout, stderr;
                            return __generator(this, function (_b) {
                                switch (_b.label) {
                                    case 0: return [4 /*yield*/, execAsync(cmd)];
                                    case 1:
                                        _a = _b.sent(), stdout = _a.stdout, stderr = _a.stderr;
                                        return [2 /*return*/, { stdout: stdout, stderr: stderr }];
                                }
                            });
                        }); }, "Godot operation: ".concat(operation), { maxAttempts: 2, initialDelay: 1000 })];
                case 4:
                    result = _a.sent();
                    return [2 /*return*/, result];
                case 5:
                    error_1 = _a.sent();
                    if (error_1.stdout && error_1.stderr) {
                        return [2 /*return*/, { stdout: error_1.stdout, stderr: error_1.stderr }];
                    }
                    throw error_1;
                case 6: return [2 /*return*/];
            }
        });
    });
}
function findGodotProjects(directory, recursive) {
    var projects = [];
    try {
        var entries = readdirSync(directory, { withFileTypes: true });
        // Check if current directory is a project
        var projectFile = join(directory, 'project.godot');
        if (existsSync(projectFile)) {
            projects.push({
                path: directory,
                name: directory.split('/').pop() || 'Unknown',
            });
        }
        if (!recursive) {
            // Check immediate subdirectories
            for (var _i = 0, entries_1 = entries; _i < entries_1.length; _i++) {
                var entry = entries_1[_i];
                if (entry.isDirectory()) {
                    var subdir = join(directory, entry.name);
                    var subProjectFile = join(subdir, 'project.godot');
                    if (existsSync(subProjectFile)) {
                        projects.push({
                            path: subdir,
                            name: entry.name,
                        });
                    }
                }
            }
        }
        else {
            // Recursive search
            for (var _a = 0, entries_2 = entries; _a < entries_2.length; _a++) {
                var entry = entries_2[_a];
                if (entry.isDirectory() && !entry.name.startsWith('.')) {
                    var subdir = join(directory, entry.name);
                    var subProjects = findGodotProjects(subdir, true);
                    projects.push.apply(projects, subProjects);
                }
            }
        }
    }
    catch (error) {
        console.error("Error searching directory ".concat(directory, ":"), error);
    }
    return projects;
}
// Use the cached version from utils/cache.ts
var getProjectStructureAsync = getCachedProjectStructure;
// CLI-based tools
export var cliTools = [
    {
        name: 'launch_editor',
        description: 'Launch Godot editor for a specific project',
        parameters: z.object({
            projectPath: z.string().describe('Path to the Godot project directory'),
        }),
        execute: function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
            var projectPath = _b.projectPath;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0: return [4 /*yield*/, handleLaunchEditor({ projectPath: projectPath })];
                    case 1: return [2 /*return*/, _c.sent()];
                }
            });
        }); },
    },
    {
        name: 'run_project',
        description: 'Run the Godot project and capture output',
        parameters: z.object({
            projectPath: z.string().describe('Path to the Godot project directory'),
            scene: z.string().optional().describe('Optional: Specific scene to run'),
        }),
        execute: function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
            var projectPath = _b.projectPath, scene = _b.scene;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0: return [4 /*yield*/, handleRunProject({ projectPath: projectPath, scene: scene })];
                    case 1: return [2 /*return*/, _c.sent()];
                }
            });
        }); },
    },
    {
        name: 'get_debug_output',
        description: 'Get the current debug output and errors',
        parameters: z.object({}),
        execute: function () { return __awaiter(void 0, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, handleGetDebugOutput()];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result.content[0].text];
                }
            });
        }); },
    },
    {
        name: 'stop_project',
        description: 'Stop the currently running Godot project',
        parameters: z.object({}),
        execute: function () { return __awaiter(void 0, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, handleStopProject()];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result.content[0].text];
                }
            });
        }); },
    },
    {
        name: 'get_godot_version',
        description: 'Get the installed Godot version',
        parameters: z.object({}),
        execute: function () { return __awaiter(void 0, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, handleGetGodotVersion()];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result.content[0].text];
                }
            });
        }); },
    },
    {
        name: 'list_projects',
        description: 'List Godot projects in a directory',
        parameters: z.object({
            directory: z.string().describe('Directory to search for Godot projects'),
            recursive: z.boolean().optional().describe('Whether to search recursively (default: false)'),
        }),
        execute: function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
            var result;
            var directory = _b.directory, recursive = _b.recursive;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0: return [4 /*yield*/, handleListProjects({ directory: directory, recursive: recursive })];
                    case 1:
                        result = _c.sent();
                        return [2 /*return*/, result.content[0].text];
                }
            });
        }); },
    },
    {
        name: 'get_project_info',
        description: 'Retrieve metadata about a Godot project',
        parameters: z.object({
            projectPath: z.string().describe('Path to the Godot project directory'),
        }),
        execute: function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
            var result;
            var projectPath = _b.projectPath;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0: return [4 /*yield*/, handleGetProjectInfo({ projectPath: projectPath })];
                    case 1:
                        result = _c.sent();
                        return [2 /*return*/, result.content[0].text];
                }
            });
        }); },
    },
    {
        name: 'create_scene_cli',
        description: 'Create a new Godot scene file (CLI version)',
        parameters: z.object({
            projectPath: z.string().describe('Path to the Godot project directory'),
            scenePath: z.string().describe('Path where the scene file will be saved (relative to project)'),
            rootNodeType: z.string().optional().default('Node2D').describe('Type of the root node (e.g., Node2D, Node3D)'),
        }),
        execute: function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
            var result;
            var projectPath = _b.projectPath, scenePath = _b.scenePath, rootNodeType = _b.rootNodeType;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0: return [4 /*yield*/, handleCreateScene({ projectPath: projectPath, scenePath: scenePath, rootNodeType: rootNodeType })];
                    case 1:
                        result = _c.sent();
                        return [2 /*return*/, result.content[0].text];
                }
            });
        }); },
    },
    {
        name: 'add_node_cli',
        description: 'Add a node to an existing scene (CLI version)',
        parameters: z.object({
            projectPath: z.string().describe('Path to the Godot project directory'),
            scenePath: z.string().describe('Path to the scene file (relative to project)'),
            parentNodePath: z.string().optional().default('root').describe('Path to the parent node (e.g., "root" or "root/Player")'),
            nodeType: z.string().describe('Type of node to add (e.g., Sprite2D, CollisionShape2D)'),
            nodeName: z.string().describe('Name for the new node'),
            properties: z.record(z.any()).optional().describe('Optional properties to set on the node'),
        }),
        execute: function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
            var result;
            var projectPath = _b.projectPath, scenePath = _b.scenePath, parentNodePath = _b.parentNodePath, nodeType = _b.nodeType, nodeName = _b.nodeName, properties = _b.properties;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0: return [4 /*yield*/, handleAddNode({ projectPath: projectPath, scenePath: scenePath, parentNodePath: parentNodePath, nodeType: nodeType, nodeName: nodeName, properties: properties })];
                    case 1:
                        result = _c.sent();
                        return [2 /*return*/, result.content[0].text];
                }
            });
        }); },
    },
    {
        name: 'load_sprite_cli',
        description: 'Load a sprite into a Sprite2D node (CLI version)',
        parameters: z.object({
            projectPath: z.string().describe('Path to the Godot project directory'),
            scenePath: z.string().describe('Path to the scene file (relative to project)'),
            nodePath: z.string().describe('Path to the Sprite2D node (e.g., "root/Player/Sprite2D")'),
            texturePath: z.string().describe('Path to the texture file (relative to project)'),
        }),
        execute: function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
            var result;
            var projectPath = _b.projectPath, scenePath = _b.scenePath, nodePath = _b.nodePath, texturePath = _b.texturePath;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0: return [4 /*yield*/, handleLoadSprite({ projectPath: projectPath, scenePath: scenePath, nodePath: nodePath, texturePath: texturePath })];
                    case 1:
                        result = _c.sent();
                        return [2 /*return*/, result.content[0].text];
                }
            });
        }); },
    },
    {
        name: 'export_mesh_library_cli',
        description: 'Export a scene as a MeshLibrary resource (CLI version)',
        parameters: z.object({
            projectPath: z.string().describe('Path to the Godot project directory'),
            scenePath: z.string().describe('Path to the scene file (.tscn) to export'),
            outputPath: z.string().describe('Path where the mesh library (.res) will be saved'),
            meshItemNames: z.array(z.string()).optional().describe('Optional: Names of specific mesh items to include (defaults to all)'),
        }),
        execute: function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
            var result;
            var projectPath = _b.projectPath, scenePath = _b.scenePath, outputPath = _b.outputPath, meshItemNames = _b.meshItemNames;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0: return [4 /*yield*/, handleExportMeshLibrary({ projectPath: projectPath, scenePath: scenePath, outputPath: outputPath, meshItemNames: meshItemNames })];
                    case 1:
                        result = _c.sent();
                        return [2 /*return*/, result.content[0].text];
                }
            });
        }); },
    },
    {
        name: 'save_scene_cli',
        description: 'Save changes to a scene file (CLI version)',
        parameters: z.object({
            projectPath: z.string().describe('Path to the Godot project directory'),
            scenePath: z.string().describe('Path to the scene file (relative to project)'),
            newPath: z.string().optional().describe('Optional: New path to save the scene to (for creating variants)'),
        }),
        execute: function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
            var result;
            var projectPath = _b.projectPath, scenePath = _b.scenePath, newPath = _b.newPath;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0: return [4 /*yield*/, handleSaveScene({ projectPath: projectPath, scenePath: scenePath, newPath: newPath })];
                    case 1:
                        result = _c.sent();
                        return [2 /*return*/, result.content[0].text];
                }
            });
        }); },
    },
    {
        name: 'get_uid_cli',
        description: 'Get the UID for a specific file in a Godot project (for Godot 4.4+)',
        parameters: z.object({
            projectPath: z.string().describe('Path to the Godot project directory'),
            filePath: z.string().describe('Path to the file (relative to project) for which to get the UID'),
        }),
        execute: function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
            var result;
            var projectPath = _b.projectPath, filePath = _b.filePath;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0: return [4 /*yield*/, handleGetUid({ projectPath: projectPath, filePath: filePath })];
                    case 1:
                        result = _c.sent();
                        return [2 /*return*/, result.content[0].text];
                }
            });
        }); },
    },
    {
        name: 'update_project_uids_cli',
        description: 'Update UID references in a Godot project by resaving resources (for Godot 4.4+)',
        parameters: z.object({
            projectPath: z.string().describe('Path to the Godot project directory'),
        }),
        annotations: {
            streamingHint: true,
        },
        execute: function (args, context) { return __awaiter(void 0, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, handleUpdateProjectUids(args, context)];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result.content[0].text];
                }
            });
        }); },
    },
];
// Tool handlers - these will be called by the FastMCP server
export function handleCliTool(name, args) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, error_2;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 31, , 32]);
                    _a = name;
                    switch (_a) {
                        case 'launch_editor': return [3 /*break*/, 1];
                        case 'run_project': return [3 /*break*/, 3];
                        case 'get_debug_output': return [3 /*break*/, 5];
                        case 'stop_project': return [3 /*break*/, 7];
                        case 'get_godot_version': return [3 /*break*/, 9];
                        case 'list_projects': return [3 /*break*/, 11];
                        case 'get_project_info': return [3 /*break*/, 13];
                        case 'create_scene_cli': return [3 /*break*/, 15];
                        case 'add_node_cli': return [3 /*break*/, 17];
                        case 'load_sprite_cli': return [3 /*break*/, 19];
                        case 'export_mesh_library_cli': return [3 /*break*/, 21];
                        case 'save_scene_cli': return [3 /*break*/, 23];
                        case 'get_uid_cli': return [3 /*break*/, 25];
                        case 'update_project_uids_cli': return [3 /*break*/, 27];
                    }
                    return [3 /*break*/, 29];
                case 1: return [4 /*yield*/, handleLaunchEditor(args)];
                case 2: return [2 /*return*/, _b.sent()];
                case 3: return [4 /*yield*/, handleRunProject(args)];
                case 4: return [2 /*return*/, _b.sent()];
                case 5: return [4 /*yield*/, handleGetDebugOutput()];
                case 6: return [2 /*return*/, _b.sent()];
                case 7: return [4 /*yield*/, handleStopProject()];
                case 8: return [2 /*return*/, _b.sent()];
                case 9: return [4 /*yield*/, handleGetGodotVersion()];
                case 10: return [2 /*return*/, _b.sent()];
                case 11: return [4 /*yield*/, handleListProjects(args)];
                case 12: return [2 /*return*/, _b.sent()];
                case 13: return [4 /*yield*/, handleGetProjectInfo(args)];
                case 14: return [2 /*return*/, _b.sent()];
                case 15: return [4 /*yield*/, handleCreateScene(args)];
                case 16: return [2 /*return*/, _b.sent()];
                case 17: return [4 /*yield*/, handleAddNode(args)];
                case 18: return [2 /*return*/, _b.sent()];
                case 19: return [4 /*yield*/, handleLoadSprite(args)];
                case 20: return [2 /*return*/, _b.sent()];
                case 21: return [4 /*yield*/, handleExportMeshLibrary(args)];
                case 22: return [2 /*return*/, _b.sent()];
                case 23: return [4 /*yield*/, handleSaveScene(args)];
                case 24: return [2 /*return*/, _b.sent()];
                case 25: return [4 /*yield*/, handleGetUid(args)];
                case 26: return [2 /*return*/, _b.sent()];
                case 27: return [4 /*yield*/, handleUpdateProjectUids(args)];
                case 28: return [2 /*return*/, _b.sent()];
                case 29: throw new Error("Unknown CLI tool: ".concat(name));
                case 30: return [3 /*break*/, 32];
                case 31:
                    error_2 = _b.sent();
                    console.error("Error in CLI tool ".concat(name, ":"), error_2);
                    throw error_2;
                case 32: return [2 /*return*/];
            }
        });
    });
}
function handleLaunchEditor(args) {
    return __awaiter(this, void 0, void 0, function () {
        var projectFile;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!args.projectPath) {
                        throw new Error('Project path is required');
                    }
                    return [4 /*yield*/, detectGodotPath()];
                case 1:
                    _a.sent();
                    if (!godotPath) {
                        throw new Error('Could not find a valid Godot executable path');
                    }
                    projectFile = join(args.projectPath, 'project.godot');
                    if (!existsSync(projectFile)) {
                        throw new Error("Not a valid Godot project: ".concat(args.projectPath));
                    }
                    // Launch editor in background
                    spawn(godotPath, ['-e', '--path', args.projectPath], {
                        stdio: 'ignore',
                        detached: true
                    });
                    return [2 /*return*/, "Godot editor launched successfully for project at ".concat(args.projectPath, ".")];
            }
        });
    });
}
function handleRunProject(args) {
    return __awaiter(this, void 0, void 0, function () {
        var projectFile, cmdArgs, process;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    if (!args.projectPath) {
                        throw new Error('Project path is required');
                    }
                    return [4 /*yield*/, detectGodotPath()];
                case 1:
                    _c.sent();
                    if (!godotPath) {
                        throw new Error('Could not find a valid Godot executable path');
                    }
                    projectFile = join(args.projectPath, 'project.godot');
                    if (!existsSync(projectFile)) {
                        throw new Error("Not a valid Godot project: ".concat(args.projectPath));
                    }
                    // Kill any existing process
                    if (activeProcess) {
                        activeProcess.kill();
                    }
                    cmdArgs = ['-d', '--path', args.projectPath];
                    if (args.scene) {
                        cmdArgs.push(args.scene);
                    }
                    process = spawn(godotPath, cmdArgs, { stdio: 'pipe' });
                    output.length = 0;
                    errors.length = 0;
                    (_a = process.stdout) === null || _a === void 0 ? void 0 : _a.on('data', function (data) {
                        var lines = data.toString().split('\n');
                        output.push.apply(output, lines);
                    });
                    (_b = process.stderr) === null || _b === void 0 ? void 0 : _b.on('data', function (data) {
                        var lines = data.toString().split('\n');
                        errors.push.apply(errors, lines);
                    });
                    process.on('exit', function () {
                        activeProcess = null;
                    });
                    activeProcess = process;
                    return [2 /*return*/, "Godot project started in debug mode. Use get_debug_output to see output."];
            }
        });
    });
}
function handleGetDebugOutput() {
    return __awaiter(this, void 0, void 0, function () {
        var result;
        return __generator(this, function (_a) {
            if (!activeProcess) {
                throw new Error('No active Godot process.');
            }
            result = JSON.stringify({ output: output, errors: errors }, null, 2);
            return [2 /*return*/, {
                    content: [{ type: 'text', text: result }]
                }];
        });
    });
}
function handleStopProject() {
    return __awaiter(this, void 0, void 0, function () {
        var finalOutput, finalErrors;
        return __generator(this, function (_a) {
            if (!activeProcess) {
                throw new Error('No active Godot process to stop.');
            }
            activeProcess.kill();
            finalOutput = __spreadArray([], output, true);
            finalErrors = __spreadArray([], errors, true);
            activeProcess = null;
            return [2 /*return*/, {
                    content: [{
                            type: 'text',
                            text: JSON.stringify({
                                message: 'Godot project stopped',
                                finalOutput: finalOutput,
                                finalErrors: finalErrors
                            }, null, 2)
                        }]
                }];
        });
    });
}
function handleGetGodotVersion() {
    return __awaiter(this, void 0, void 0, function () {
        var stdout;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, detectGodotPath()];
                case 1:
                    _a.sent();
                    if (!godotPath) {
                        throw new Error('Could not find a valid Godot executable path');
                    }
                    return [4 /*yield*/, execAsync("\"".concat(godotPath, "\" --version"))];
                case 2:
                    stdout = (_a.sent()).stdout;
                    return [2 /*return*/, {
                            content: [{ type: 'text', text: stdout.trim() }]
                        }];
            }
        });
    });
}
function handleListProjects(args) {
    return __awaiter(this, void 0, void 0, function () {
        var recursive, projects;
        return __generator(this, function (_a) {
            if (!args.directory) {
                throw new Error('Directory is required');
            }
            if (!existsSync(args.directory)) {
                throw new Error("Directory does not exist: ".concat(args.directory));
            }
            recursive = args.recursive === true;
            projects = findGodotProjects(args.directory, recursive);
            return [2 /*return*/, {
                    content: [{ type: 'text', text: JSON.stringify(projects, null, 2) }]
                }];
        });
    });
}
function handleGetProjectInfo(args) {
    return __awaiter(this, void 0, void 0, function () {
        var projectFile, stdout, projectStructure, projectName, fs, projectFileContent, configNameMatch, error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!args.projectPath) {
                        throw new Error('Project path is required');
                    }
                    return [4 /*yield*/, detectGodotPath()];
                case 1:
                    _a.sent();
                    if (!godotPath) {
                        throw new Error('Could not find a valid Godot executable path');
                    }
                    projectFile = join(args.projectPath, 'project.godot');
                    if (!existsSync(projectFile)) {
                        throw new Error("Not a valid Godot project: ".concat(args.projectPath));
                    }
                    return [4 /*yield*/, execAsync("\"".concat(godotPath, "\" --version"))];
                case 2:
                    stdout = (_a.sent()).stdout;
                    return [4 /*yield*/, getProjectStructureAsync(args.projectPath)];
                case 3:
                    projectStructure = _a.sent();
                    projectName = basename(args.projectPath);
                    _a.label = 4;
                case 4:
                    _a.trys.push([4, 6, , 7]);
                    return [4 /*yield*/, import('fs')];
                case 5:
                    fs = _a.sent();
                    projectFileContent = fs.readFileSync(projectFile, 'utf8');
                    configNameMatch = projectFileContent.match(/config\/name="([^"]+)"/);
                    if (configNameMatch && configNameMatch[1]) {
                        projectName = configNameMatch[1];
                    }
                    return [3 /*break*/, 7];
                case 6:
                    error_3 = _a.sent();
                    return [3 /*break*/, 7];
                case 7: return [2 /*return*/, {
                        content: [{
                                type: 'text',
                                text: JSON.stringify({
                                    name: projectName,
                                    path: args.projectPath,
                                    godotVersion: stdout.trim(),
                                    structure: projectStructure,
                                }, null, 2)
                            }]
                    }];
            }
        });
    });
}
function handleCreateScene(args) {
    return __awaiter(this, void 0, void 0, function () {
        var projectFile, params, _a, stdout, stderr;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (!args.projectPath || !args.scenePath) {
                        throw new Error('Project path and scene path are required');
                    }
                    projectFile = join(args.projectPath, 'project.godot');
                    if (!existsSync(projectFile)) {
                        throw new Error("Not a valid Godot project: ".concat(args.projectPath));
                    }
                    params = {
                        scenePath: args.scenePath,
                        rootNodeType: args.rootNodeType || 'Node2D',
                    };
                    return [4 /*yield*/, executeOperation('create_scene', params, args.projectPath)];
                case 1:
                    _a = _b.sent(), stdout = _a.stdout, stderr = _a.stderr;
                    if (stderr && stderr.includes('Failed to')) {
                        throw new Error("Failed to create scene: ".concat(stderr));
                    }
                    return [2 /*return*/, {
                            content: [{ type: 'text', text: "Scene created successfully at: ".concat(args.scenePath, "\n\nOutput: ").concat(stdout) }]
                        }];
            }
        });
    });
}
function handleAddNode(args) {
    return __awaiter(this, void 0, void 0, function () {
        var projectFile, scenePath, params, _a, stdout, stderr;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (!args.projectPath || !args.scenePath || !args.nodeType || !args.nodeName) {
                        throw new Error('Missing required parameters');
                    }
                    projectFile = join(args.projectPath, 'project.godot');
                    if (!existsSync(projectFile)) {
                        throw new Error("Not a valid Godot project: ".concat(args.projectPath));
                    }
                    scenePath = join(args.projectPath, args.scenePath);
                    if (!existsSync(scenePath)) {
                        throw new Error("Scene file does not exist: ".concat(args.scenePath));
                    }
                    params = {
                        scenePath: args.scenePath,
                        nodeType: args.nodeType,
                        nodeName: args.nodeName,
                    };
                    if (args.parentNodePath)
                        params.parentNodePath = args.parentNodePath;
                    if (args.properties)
                        params.properties = args.properties;
                    return [4 /*yield*/, executeOperation('add_node', params, args.projectPath)];
                case 1:
                    _a = _b.sent(), stdout = _a.stdout, stderr = _a.stderr;
                    if (stderr && stderr.includes('Failed to')) {
                        throw new Error("Failed to add node: ".concat(stderr));
                    }
                    return [2 /*return*/, {
                            content: [{ type: 'text', text: "Node '".concat(args.nodeName, "' of type '").concat(args.nodeType, "' added successfully to '").concat(args.scenePath, "'.\n\nOutput: ").concat(stdout) }]
                        }];
            }
        });
    });
}
function handleLoadSprite(args) {
    return __awaiter(this, void 0, void 0, function () {
        var projectFile, scenePath, texturePath, params, _a, stdout, stderr;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (!args.projectPath || !args.scenePath || !args.nodePath || !args.texturePath) {
                        throw new Error('Missing required parameters');
                    }
                    projectFile = join(args.projectPath, 'project.godot');
                    if (!existsSync(projectFile)) {
                        throw new Error("Not a valid Godot project: ".concat(args.projectPath));
                    }
                    scenePath = join(args.projectPath, args.scenePath);
                    if (!existsSync(scenePath)) {
                        throw new Error("Scene file does not exist: ".concat(args.scenePath));
                    }
                    texturePath = join(args.projectPath, args.texturePath);
                    if (!existsSync(texturePath)) {
                        throw new Error("Texture file does not exist: ".concat(args.texturePath));
                    }
                    params = {
                        scenePath: args.scenePath,
                        nodePath: args.nodePath,
                        texturePath: args.texturePath,
                    };
                    return [4 /*yield*/, executeOperation('load_sprite', params, args.projectPath)];
                case 1:
                    _a = _b.sent(), stdout = _a.stdout, stderr = _a.stderr;
                    if (stderr && stderr.includes('Failed to')) {
                        throw new Error("Failed to load sprite: ".concat(stderr));
                    }
                    return [2 /*return*/, {
                            content: [{ type: 'text', text: "Sprite loaded successfully with texture: ".concat(args.texturePath, "\n\nOutput: ").concat(stdout) }]
                        }];
            }
        });
    });
}
function handleExportMeshLibrary(args) {
    return __awaiter(this, void 0, void 0, function () {
        var projectFile, scenePath, params, _a, stdout, stderr;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (!args.projectPath || !args.scenePath || !args.outputPath) {
                        throw new Error('Missing required parameters');
                    }
                    projectFile = join(args.projectPath, 'project.godot');
                    if (!existsSync(projectFile)) {
                        throw new Error("Not a valid Godot project: ".concat(args.projectPath));
                    }
                    scenePath = join(args.projectPath, args.scenePath);
                    if (!existsSync(scenePath)) {
                        throw new Error("Scene file does not exist: ".concat(args.scenePath));
                    }
                    params = {
                        scenePath: args.scenePath,
                        outputPath: args.outputPath,
                    };
                    if (args.meshItemNames)
                        params.meshItemNames = args.meshItemNames;
                    return [4 /*yield*/, executeOperation('export_mesh_library', params, args.projectPath)];
                case 1:
                    _a = _b.sent(), stdout = _a.stdout, stderr = _a.stderr;
                    if (stderr && stderr.includes('Failed to')) {
                        throw new Error("Failed to export mesh library: ".concat(stderr));
                    }
                    return [2 /*return*/, {
                            content: [{ type: 'text', text: "MeshLibrary exported successfully to: ".concat(args.outputPath, "\n\nOutput: ").concat(stdout) }]
                        }];
            }
        });
    });
}
function handleSaveScene(args) {
    return __awaiter(this, void 0, void 0, function () {
        var projectFile, scenePath, params, _a, stdout, stderr, savePath;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (!args.projectPath || !args.scenePath) {
                        throw new Error('Missing required parameters');
                    }
                    projectFile = join(args.projectPath, 'project.godot');
                    if (!existsSync(projectFile)) {
                        throw new Error("Not a valid Godot project: ".concat(args.projectPath));
                    }
                    scenePath = join(args.projectPath, args.scenePath);
                    if (!existsSync(scenePath)) {
                        throw new Error("Scene file does not exist: ".concat(args.scenePath));
                    }
                    params = { scenePath: args.scenePath };
                    if (args.newPath)
                        params.newPath = args.newPath;
                    return [4 /*yield*/, executeOperation('save_scene', params, args.projectPath)];
                case 1:
                    _a = _b.sent(), stdout = _a.stdout, stderr = _a.stderr;
                    if (stderr && stderr.includes('Failed to')) {
                        throw new Error("Failed to save scene: ".concat(stderr));
                    }
                    savePath = args.newPath || args.scenePath;
                    return [2 /*return*/, {
                            content: [{ type: 'text', text: "Scene saved successfully to: ".concat(savePath, "\n\nOutput: ").concat(stdout) }]
                        }];
            }
        });
    });
}
function handleGetUid(args) {
    return __awaiter(this, void 0, void 0, function () {
        var projectFile, filePath, versionOutput, version, params, _a, stdout, stderr;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (!args.projectPath || !args.filePath) {
                        throw new Error('Missing required parameters');
                    }
                    return [4 /*yield*/, detectGodotPath()];
                case 1:
                    _b.sent();
                    if (!godotPath) {
                        throw new Error('Could not find a valid Godot executable path');
                    }
                    projectFile = join(args.projectPath, 'project.godot');
                    if (!existsSync(projectFile)) {
                        throw new Error("Not a valid Godot project: ".concat(args.projectPath));
                    }
                    filePath = join(args.projectPath, args.filePath);
                    if (!existsSync(filePath)) {
                        throw new Error("File does not exist: ".concat(args.filePath));
                    }
                    return [4 /*yield*/, execAsync("\"".concat(godotPath, "\" --version"))];
                case 2:
                    versionOutput = (_b.sent()).stdout;
                    version = versionOutput.trim();
                    if (!isGodot44OrLater(version)) {
                        throw new Error("UIDs are only supported in Godot 4.4 or later. Current version: ".concat(version));
                    }
                    params = { filePath: args.filePath };
                    return [4 /*yield*/, executeOperation('get_uid', params, args.projectPath)];
                case 3:
                    _a = _b.sent(), stdout = _a.stdout, stderr = _a.stderr;
                    if (stderr && stderr.includes('Failed to')) {
                        throw new Error("Failed to get UID: ".concat(stderr));
                    }
                    return [2 /*return*/, {
                            content: [{ type: 'text', text: "UID for ".concat(args.filePath, ": ").concat(stdout.trim()) }]
                        }];
            }
        });
    });
}
function handleUpdateProjectUids(args, context) {
    return __awaiter(this, void 0, void 0, function () {
        var projectFile, versionOutput, version, params, _a, stdout, stderr;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (!args.projectPath) {
                        throw new Error('Project path is required');
                    }
                    return [4 /*yield*/, detectGodotPath()];
                case 1:
                    _b.sent();
                    if (!godotPath) {
                        throw new Error('Could not find a valid Godot executable path');
                    }
                    projectFile = join(args.projectPath, 'project.godot');
                    if (!existsSync(projectFile)) {
                        throw new Error("Not a valid Godot project: ".concat(args.projectPath));
                    }
                    return [4 /*yield*/, execAsync("\"".concat(godotPath, "\" --version"))];
                case 2:
                    versionOutput = (_b.sent()).stdout;
                    version = versionOutput.trim();
                    if (!isGodot44OrLater(version)) {
                        throw new Error("UIDs are only supported in Godot 4.4 or later. Current version: ".concat(version));
                    }
                    if (!(context === null || context === void 0 ? void 0 : context.reportProgress)) return [3 /*break*/, 4];
                    return [4 /*yield*/, context.reportProgress({ progress: 0, total: 100 })];
                case 3:
                    _b.sent();
                    _b.label = 4;
                case 4:
                    if (!(context === null || context === void 0 ? void 0 : context.streamContent)) return [3 /*break*/, 6];
                    return [4 /*yield*/, context.streamContent({ type: 'text', text: 'Starting UID update process...\n' })];
                case 5:
                    _b.sent();
                    _b.label = 6;
                case 6:
                    if (!(context === null || context === void 0 ? void 0 : context.reportProgress)) return [3 /*break*/, 8];
                    return [4 /*yield*/, context.reportProgress({ progress: 10, total: 100 })];
                case 7:
                    _b.sent();
                    _b.label = 8;
                case 8:
                    params = { projectPath: args.projectPath };
                    if (!(context === null || context === void 0 ? void 0 : context.streamContent)) return [3 /*break*/, 10];
                    return [4 /*yield*/, context.streamContent({ type: 'text', text: 'Scanning project files...\n' })];
                case 9:
                    _b.sent();
                    _b.label = 10;
                case 10:
                    if (!(context === null || context === void 0 ? void 0 : context.reportProgress)) return [3 /*break*/, 12];
                    return [4 /*yield*/, context.reportProgress({ progress: 30, total: 100 })];
                case 11:
                    _b.sent();
                    _b.label = 12;
                case 12: return [4 /*yield*/, executeOperation('resave_resources', params, args.projectPath)];
                case 13:
                    _a = _b.sent(), stdout = _a.stdout, stderr = _a.stderr;
                    if (!(stderr && stderr.includes('Failed to'))) return [3 /*break*/, 16];
                    if (!(context === null || context === void 0 ? void 0 : context.streamContent)) return [3 /*break*/, 15];
                    return [4 /*yield*/, context.streamContent({ type: 'text', text: "Error: ".concat(stderr, "\n") })];
                case 14:
                    _b.sent();
                    _b.label = 15;
                case 15: throw new Error("Failed to update project UIDs: ".concat(stderr));
                case 16:
                    if (!(context === null || context === void 0 ? void 0 : context.reportProgress)) return [3 /*break*/, 18];
                    return [4 /*yield*/, context.reportProgress({ progress: 100, total: 100 })];
                case 17:
                    _b.sent();
                    _b.label = 18;
                case 18:
                    if (!(context === null || context === void 0 ? void 0 : context.streamContent)) return [3 /*break*/, 20];
                    return [4 /*yield*/, context.streamContent({ type: 'text', text: 'UID update completed successfully.\n' })];
                case 19:
                    _b.sent();
                    _b.label = 20;
                case 20: return [2 /*return*/, {
                        content: [{ type: 'text', text: "Project UIDs updated successfully.\n\nOutput: ".concat(stdout) }]
                    }];
            }
        });
    });
}
function isGodot44OrLater(version) {
    var match = version.match(/^(\d+)\.(\d+)/);
    if (match) {
        var major = parseInt(match[1], 10);
        var minor = parseInt(match[2], 10);
        return major > 4 || (major === 4 && minor >= 4);
    }
    return false;
}
//# sourceMappingURL=cli_tools.js.map