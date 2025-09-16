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
import { join, dirname, normalize } from 'path';
import { readdirSync, existsSync } from 'fs';
import { spawn } from 'child_process';
import { promisify } from 'util';
import { exec } from 'child_process';
import { getCachedProjectStructure } from '../utils/cache.js';
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
// Unified Project Management Tool - Consolidates all project-related operations
export var cliTools = [
    {
        name: 'project_manager',
        description: 'Unified tool for all project operations: launch editor, run project, health checks, setup, and project discovery',
        parameters: z.object({
            operation: z.enum(['launch_editor', 'run_project', 'get_debug_output', 'stop_project', 'get_godot_version', 'list_projects', 'health_check', 'quick_setup'])
                .describe('Type of project operation to perform'),
            projectPath: z.string().optional()
                .describe('Path to the Godot project directory'),
            directory: z.string().optional()
                .describe('Directory to search for projects'),
            projectName: z.string().optional()
                .describe('Name for new project'),
            // Launch/run options
            waitForReady: z.boolean().optional().default(false)
                .describe('Wait for editor/project to be ready'),
            customArgs: z.array(z.string()).optional()
                .describe('Additional command line arguments'),
            scene: z.string().optional()
                .describe('Specific scene to run'),
            // Health check options
            includeDependencies: z.boolean().optional().default(true)
                .describe('Check for missing dependencies'),
            includeFileIntegrity: z.boolean().optional().default(true)
                .describe('Verify file integrity'),
            includePerformanceMetrics: z.boolean().optional().default(false)
                .describe('Include basic performance metrics'),
            // Setup options
            template: z.enum(['2d', '3d', 'empty']).optional().default('2d')
                .describe('Project template to use'),
            includeDemo: z.boolean().optional().default(true)
                .describe('Include demo scene and script'),
            // List options
            recursive: z.boolean().optional().default(false)
                .describe('Whether to search recursively')
        }),
        execute: function (params) { return __awaiter(void 0, void 0, void 0, function () {
            var _a, result, result, result, result, result, fs_1, path_1, projectFile, healthReport_1, requiredFiles, recommendedFiles, commonDirs, stats, fs_2, path_2, fullProjectPath_1, dirs, projectGodot, mainScene, mainScript, gitignore, setupReport_1, error_1;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 21, , 22]);
                        _a = params.operation;
                        switch (_a) {
                            case 'launch_editor': return [3 /*break*/, 1];
                            case 'run_project': return [3 /*break*/, 3];
                            case 'get_debug_output': return [3 /*break*/, 5];
                            case 'stop_project': return [3 /*break*/, 7];
                            case 'get_godot_version': return [3 /*break*/, 9];
                            case 'list_projects': return [3 /*break*/, 11];
                            case 'health_check': return [3 /*break*/, 13];
                            case 'quick_setup': return [3 /*break*/, 16];
                        }
                        return [3 /*break*/, 19];
                    case 1:
                        if (!params.projectPath) {
                            throw new Error('projectPath is required for launch_editor operation');
                        }
                        console.log("[project_manager] Launching Godot editor for project: ".concat(params.projectPath));
                        return [4 /*yield*/, handleLaunchEditor({
                                projectPath: params.projectPath,
                                waitForReady: params.waitForReady,
                                customArgs: params.customArgs
                            })];
                    case 2:
                        result = _b.sent();
                        if (params.waitForReady) {
                            return [2 /*return*/, "".concat(result, "\n\u23F3 Editor launched and ready for use")];
                        }
                        return [2 /*return*/, result];
                    case 3:
                        if (!params.projectPath) {
                            throw new Error('projectPath is required for run_project operation');
                        }
                        return [4 /*yield*/, handleRunProject({
                                projectPath: params.projectPath,
                                scene: params.scene
                            })];
                    case 4: return [2 /*return*/, _b.sent()];
                    case 5: return [4 /*yield*/, handleGetDebugOutput()];
                    case 6:
                        result = _b.sent();
                        return [2 /*return*/, result.content[0].text];
                    case 7: return [4 /*yield*/, handleStopProject()];
                    case 8:
                        result = _b.sent();
                        return [2 /*return*/, result.content[0].text];
                    case 9: return [4 /*yield*/, handleGetGodotVersion()];
                    case 10:
                        result = _b.sent();
                        return [2 /*return*/, result.content[0].text];
                    case 11:
                        if (!params.directory) {
                            throw new Error('directory is required for list_projects operation');
                        }
                        return [4 /*yield*/, handleListProjects({
                                directory: params.directory,
                                recursive: params.recursive
                            })];
                    case 12:
                        result = _b.sent();
                        return [2 /*return*/, result.content[0].text];
                    case 13:
                        if (!params.projectPath) {
                            throw new Error('projectPath is required for health_check operation');
                        }
                        console.log("[project_manager] Starting health check for: ".concat(params.projectPath));
                        return [4 /*yield*/, import('fs')];
                    case 14:
                        fs_1 = _b.sent();
                        return [4 /*yield*/, import('path')];
                    case 15:
                        path_1 = _b.sent();
                        projectFile = path_1.join(params.projectPath, 'project.godot');
                        if (!fs_1.existsSync(projectFile)) {
                            throw new Error("Not a valid Godot project: ".concat(params.projectPath));
                        }
                        healthReport_1 = "\uD83C\uDFE5 Godot Project Health Check\n";
                        healthReport_1 += "Project: ".concat(params.projectPath, "\n\n");
                        requiredFiles = ['project.godot'];
                        recommendedFiles = ['.gitignore', 'README.md'];
                        healthReport_1 += "\uD83D\uDCC1 Project Structure:\n";
                        requiredFiles.forEach(function (file) {
                            var exists = fs_1.existsSync(path_1.join(params.projectPath, file));
                            healthReport_1 += "".concat(exists ? '✅' : '❌', " ").concat(file, "\n");
                        });
                        healthReport_1 += "\n\uD83D\uDCCB Recommended Files:\n";
                        recommendedFiles.forEach(function (file) {
                            var exists = fs_1.existsSync(path_1.join(params.projectPath, file));
                            healthReport_1 += "".concat(exists ? '✅' : '⚠️', " ").concat(file, "\n");
                        });
                        commonDirs = ['scenes', 'scripts', 'assets', 'addons'];
                        healthReport_1 += "\n\uD83D\uDCC2 Common Directories:\n";
                        commonDirs.forEach(function (dir) {
                            var exists = fs_1.existsSync(path_1.join(params.projectPath, dir));
                            healthReport_1 += "".concat(exists ? '✅' : 'ℹ️', " ").concat(dir, "/\n");
                        });
                        if (params.includeDependencies) {
                            healthReport_1 += "\n\uD83D\uDD17 Dependencies Check:\n";
                            healthReport_1 += "\u26A0\uFE0F Dependency checking not fully implemented yet\n";
                        }
                        if (params.includeFileIntegrity) {
                            healthReport_1 += "\n\uD83D\uDD0D File Integrity:\n";
                            try {
                                stats = fs_1.statSync(projectFile);
                                healthReport_1 += "\u2705 project.godot accessible (".concat(stats.size, " bytes)\n");
                            }
                            catch (error) {
                                healthReport_1 += "\u274C project.godot inaccessible: ".concat(error.message, "\n");
                            }
                        }
                        if (params.includePerformanceMetrics) {
                            healthReport_1 += "\n\u26A1 Performance Metrics:\n";
                            healthReport_1 += "\u2139\uFE0F Performance metrics collection not implemented yet\n";
                        }
                        healthReport_1 += "\n\uD83C\uDFAF Recommendations:\n";
                        healthReport_1 += "- Consider adding a .gitignore file if missing\n";
                        healthReport_1 += "- Create organized folder structure (scenes/, scripts/, assets/)\n";
                        healthReport_1 += "- Add a README.md for project documentation\n";
                        return [2 /*return*/, healthReport_1];
                    case 16:
                        if (!params.projectPath || !params.projectName) {
                            throw new Error('projectPath and projectName are required for quick_setup operation');
                        }
                        console.log("[project_manager] Setting up new Godot project: ".concat(params.projectName));
                        return [4 /*yield*/, import('fs')];
                    case 17:
                        fs_2 = _b.sent();
                        return [4 /*yield*/, import('path')];
                    case 18:
                        path_2 = _b.sent();
                        fullProjectPath_1 = path_2.join(params.projectPath, params.projectName);
                        if (fs_2.existsSync(fullProjectPath_1)) {
                            throw new Error("Directory already exists: ".concat(fullProjectPath_1));
                        }
                        fs_2.mkdirSync(fullProjectPath_1, { recursive: true });
                        dirs = ['scenes', 'scripts', 'assets'];
                        dirs.forEach(function (dir) {
                            fs_2.mkdirSync(path_2.join(fullProjectPath_1, dir), { recursive: true });
                        });
                        projectGodot = "[application]\nconfig/name=\"".concat(params.projectName, "\"\nconfig/description=\"\"\nrun/main_scene=\"res://scenes/main.tscn\"\nconfig/features=PackedStringArray(\"4.2\")\n\n[display]\nwindow/size/viewport_width=1920\nwindow/size/viewport_height=1080\n\n[rendering]\nrenderer/rendering_method=\"gl_compatibility\"\n");
                        fs_2.writeFileSync(path_2.join(fullProjectPath_1, 'project.godot'), projectGodot);
                        // Create main scene if requested
                        if (params.includeDemo) {
                            mainScene = "[gd_scene load_steps=2 format=3 uid=\"uid://b8q8q8q8q8q8q8q8q8q8q\"]\n\n[ext_resource type=\"Script\" path=\"res://scripts/main.gd\" id=\"1\"]\n\n[node name=\"Main\" type=\"Node2D\"]\nscript = ExtResource(\"1\")\n\n[node name=\"Camera2D\" type=\"Camera2D\" parent=\".\"]\n";
                            fs_2.writeFileSync(path_2.join(fullProjectPath_1, 'scenes', 'main.tscn'), mainScene);
                            mainScript = "extends Node2D\n\nfunc _ready():\n    print(\"Hello from ".concat(params.projectName, "!\")\n    print(\"MCP integration ready!\")\n\nfunc _process(delta):\n    # Add your game logic here\n    pass\n");
                            fs_2.writeFileSync(path_2.join(fullProjectPath_1, 'scripts', 'main.gd'), mainScript);
                        }
                        gitignore = "# Godot files\n.import/\nexport_presets.cfg\n.mono/\n\n# Logs\n*.log\n\n# OS files\n.DS_Store\nThumbs.db\n\n# IDE files\n.vscode/\n.idea/\n";
                        fs_2.writeFileSync(path_2.join(fullProjectPath_1, '.gitignore'), gitignore);
                        setupReport_1 = "\uD83D\uDE80 Quick Setup Complete!\n\n";
                        setupReport_1 += "Project: ".concat(params.projectName, "\n");
                        setupReport_1 += "Location: ".concat(fullProjectPath_1, "\n\n");
                        setupReport_1 += "\uD83D\uDCC1 Created directories:\n";
                        dirs.forEach(function (dir) {
                            setupReport_1 += "- ".concat(dir, "/\n");
                        });
                        setupReport_1 += "\n\uD83D\uDCC4 Created files:\n";
                        setupReport_1 += "- project.godot\n";
                        setupReport_1 += "- .gitignore\n";
                        if (params.includeDemo) {
                            setupReport_1 += "- scenes/main.tscn\n";
                            setupReport_1 += "- scripts/main.gd\n";
                        }
                        setupReport_1 += "\n\uD83C\uDFAE Next steps:\n";
                        setupReport_1 += "1. Open the project in Godot Editor\n";
                        setupReport_1 += "2. Enable the MCP addon in Project Settings\n";
                        setupReport_1 += "3. Start developing your game!\n";
                        return [2 /*return*/, setupReport_1];
                    case 19: throw new Error("Unknown operation: ".concat(params.operation));
                    case 20: return [3 /*break*/, 22];
                    case 21:
                        error_1 = _b.sent();
                        console.error("[project_manager] Operation failed:", error_1);
                        throw new Error("Project manager operation failed: ".concat(error_1.message));
                    case 22: return [2 /*return*/];
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
                    _b.trys.push([0, 15, , 16]);
                    _a = name;
                    switch (_a) {
                        case 'launch_editor': return [3 /*break*/, 1];
                        case 'run_project': return [3 /*break*/, 3];
                        case 'get_debug_output': return [3 /*break*/, 5];
                        case 'stop_project': return [3 /*break*/, 7];
                        case 'get_godot_version': return [3 /*break*/, 9];
                        case 'list_projects': return [3 /*break*/, 11];
                    }
                    return [3 /*break*/, 13];
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
                case 13: throw new Error("Unknown CLI tool: ".concat(name));
                case 14: return [3 /*break*/, 16];
                case 15:
                    error_2 = _b.sent();
                    console.error("Error in CLI tool ".concat(name, ":"), error_2);
                    throw error_2;
                case 16: return [2 /*return*/];
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
//# sourceMappingURL=cli_tools.js.map