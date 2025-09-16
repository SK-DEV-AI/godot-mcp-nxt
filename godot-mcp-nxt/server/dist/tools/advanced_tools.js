var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
import { z } from 'zod';
import { getGodotConnection } from '../utils/godot_connection.js';
/**
 * Enhanced error handling and validation utilities
 */
var GodotMCPErrors = /** @class */ (function () {
    function GodotMCPErrors() {
    }
    GodotMCPErrors.handleToolError = function (error, toolName, operation) {
        var errorMessage = (error === null || error === void 0 ? void 0 : error.message) || 'Unknown error occurred';
        var enhancedMessage = "Failed to ".concat(operation, " in ").concat(toolName, ": ").concat(errorMessage);
        // Log detailed error information with structured format
        console.error("[".concat(toolName, "] Error during ").concat(operation, ":"), {
            error: errorMessage,
            stack: error === null || error === void 0 ? void 0 : error.stack,
            timestamp: new Date().toISOString(),
            tool: toolName,
            operation: operation,
            code: error === null || error === void 0 ? void 0 : error.code,
            errno: error === null || error === void 0 ? void 0 : error.errno
        });
        throw new Error(enhancedMessage);
    };
    GodotMCPErrors.validateProjectPath = function (projectPath, toolName) {
        if (!projectPath || typeof projectPath !== 'string') {
            throw new Error("Invalid project path provided to ".concat(toolName, ": path must be a non-empty string"));
        }
        // Basic sanitization - remove dangerous characters
        var sanitized = projectPath.replace(/[<>'"|\\]/g, '').trim();
        if (sanitized !== projectPath) {
            console.warn("[".concat(toolName, "] Project path contained potentially dangerous characters, sanitized: \"").concat(projectPath, "\" -> \"").concat(sanitized, "\""));
        }
        if (!sanitized.includes('res://') && !sanitized.includes('.tscn') && !sanitized.includes('.gd')) {
            console.warn("[".concat(toolName, "] Project path doesn't contain expected Godot file extensions: ").concat(sanitized));
        }
    };
    GodotMCPErrors.validateScenePath = function (scenePath, toolName) {
        if (!scenePath || typeof scenePath !== 'string') {
            throw new Error("Invalid scene path provided to ".concat(toolName, ": path must be a non-empty string"));
        }
        if (scenePath.trim() !== scenePath) {
            console.warn("[".concat(toolName, "] Scene path contains leading/trailing whitespace: \"").concat(scenePath, "\""));
        }
        if (!scenePath.endsWith('.tscn') && !scenePath.startsWith('res://')) {
            throw new Error("Invalid scene file format in ".concat(toolName, ". Expected .tscn file or res:// path, got: ").concat(scenePath));
        }
    };
    GodotMCPErrors.validateScriptPath = function (scriptPath, toolName) {
        if (!scriptPath || typeof scriptPath !== 'string') {
            throw new Error("Invalid script path provided to ".concat(toolName, ": path must be a non-empty string"));
        }
        // Basic sanitization
        var sanitized = scriptPath.replace(/[<>'"|\\]/g, '').trim();
        if (sanitized !== scriptPath) {
            console.warn("[".concat(toolName, "] Script path contained potentially dangerous characters, sanitized: \"").concat(scriptPath, "\" -> \"").concat(sanitized, "\""));
        }
        if (!sanitized.endsWith('.gd') && !sanitized.startsWith('res://')) {
            throw new Error("Invalid script file format in ".concat(toolName, ". Expected .gd file or res:// path, got: ").concat(sanitized));
        }
    };
    GodotMCPErrors.validateScriptContent = function (content, toolName) {
        if (!content || typeof content !== 'string') {
            throw new Error("Invalid script content provided to ".concat(toolName, ": content must be a non-empty string"));
        }
        // Check file size (1MB limit)
        if (Buffer.byteLength(content, 'utf8') > 1024 * 1024) {
            throw new Error("Script content too large in ".concat(toolName, ": maximum size is 1MB"));
        }
        // Basic security check - remove potentially harmful patterns
        var dangerous = ['<script', 'javascript:', 'onload=', 'onerror='];
        for (var _i = 0, dangerous_1 = dangerous; _i < dangerous_1.length; _i++) {
            var pattern = dangerous_1[_i];
            if (content.toLowerCase().includes(pattern)) {
                console.warn("[".concat(toolName, "] Script content contains potentially dangerous pattern: ").concat(pattern));
            }
        }
    };
    GodotMCPErrors.validateNodePath = function (nodePath, toolName) {
        if (!nodePath || typeof nodePath !== 'string') {
            throw new Error("Invalid node path provided to ".concat(toolName, ": path must be a non-empty string"));
        }
        if (!nodePath.startsWith('/root') && !nodePath.startsWith('.')) {
            console.warn("[".concat(toolName, "] Node path doesn't follow Godot conventions (should start with /root or .): ").concat(nodePath));
        }
    };
    GodotMCPErrors.createRecoverySuggestions = function (error, toolName, operation) {
        var _a;
        var suggestions = [];
        var errorMsg = ((_a = error === null || error === void 0 ? void 0 : error.message) === null || _a === void 0 ? void 0 : _a.toLowerCase()) || '';
        if (errorMsg.includes('not found') || errorMsg.includes('enoent')) {
            suggestions.push('Check if the file path exists and is accessible');
            suggestions.push('Verify the project structure and file locations');
            suggestions.push('Ensure the path is relative to the project root (res://)');
        }
        if (errorMsg.includes('permission') || errorMsg.includes('eacces')) {
            suggestions.push('Check file permissions for the project directory');
            suggestions.push('Ensure Godot has write access to the project files');
            suggestions.push('Try running the command with elevated privileges if necessary');
        }
        if (errorMsg.includes('connection') || errorMsg.includes('econnrefused')) {
            suggestions.push('Verify Godot Editor is running and accessible');
            suggestions.push('Check WebSocket connection to Godot (default port 4242)');
            suggestions.push('Ensure the Godot MCP addon is enabled in the project');
        }
        if (errorMsg.includes('syntax') || errorMsg.includes('parse')) {
            suggestions.push('Review the generated code for syntax errors');
            suggestions.push('Check variable names and Godot API usage');
            suggestions.push('Validate GDScript syntax with the Godot editor');
        }
        if (errorMsg.includes('timeout')) {
            suggestions.push('Increase timeout values for long-running operations');
            suggestions.push('Check network connectivity if using remote connections');
        }
        if (suggestions.length === 0) {
            suggestions.push('Check the Godot Editor console for detailed error messages');
            suggestions.push('Verify all required dependencies are installed');
            suggestions.push('Try restarting the Godot Editor and MCP server');
            suggestions.push('Check the server logs for additional error details');
        }
        return suggestions;
    };
    GodotMCPErrors.logOperation = function (toolName, operation, details) {
        console.log("[".concat(toolName, "] ").concat(operation), details ? __assign({ timestamp: new Date().toISOString() }, details) : '');
    };
    GodotMCPErrors.validateParameters = function (params, requiredFields, toolName) {
        var missingFields = requiredFields.filter(function (field) { return !params[field]; });
        if (missingFields.length > 0) {
            throw new Error("Missing required parameters in ".concat(toolName, ": ").concat(missingFields.join(', ')));
        }
    };
    return GodotMCPErrors;
}());
/**
 * Advanced tools for complex operations and AI-powered features
 */
export var advancedTools = [
    {
        name: 'generate_complete_scripts',
        description: 'Generate complete, production-ready GDScript files from natural language descriptions with proper error handling and Godot best practices',
        parameters: z.object({
            description: z.string()
                .describe('Detailed natural language description of the script functionality (e.g. "Create a player controller with jumping, movement, and collision detection")'),
            scriptType: z.enum(['character', 'ui', 'gameplay', 'utility', 'custom']).optional()
                .describe('Type of script to generate - affects the base class and structure'),
            complexity: z.enum(['simple', 'medium', 'complex']).optional().default('medium')
                .describe('Complexity level: simple (basic functionality), medium (balanced features), complex (advanced features)'),
            features: z.array(z.string()).optional()
                .describe('Specific features to include (e.g. ["health", "inventory", "dialogue", "animation"])'),
            targetScene: z.string().optional()
                .describe('Path to scene where the script will be used (helps with context-aware code generation)')
        }),
        execute: function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
            var godot, result, response, error_1, suggestions, enhancedError;
            var _c;
            var description = _b.description, scriptType = _b.scriptType, _d = _b.complexity, complexity = _d === void 0 ? 'medium' : _d, features = _b.features, targetScene = _b.targetScene;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        // Enhanced input validation
                        if (!description || description.trim().length < 10) {
                            throw new Error('Script description must be at least 10 characters long and describe the desired functionality');
                        }
                        if (targetScene) {
                            GodotMCPErrors.validateScenePath(targetScene, 'generate_complete_scripts');
                        }
                        // Validate features array if provided
                        if (features && (!Array.isArray(features) || features.some(function (f) { return typeof f !== 'string'; }))) {
                            throw new Error('Features must be an array of strings');
                        }
                        godot = getGodotConnection();
                        _e.label = 1;
                    case 1:
                        _e.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, godot.sendCommand('generate_complete_scripts', {
                                description: description,
                                scriptType: scriptType,
                                complexity: complexity,
                                features: features,
                                targetScene: targetScene
                            })];
                    case 2:
                        result = _e.sent();
                        response = "Generated ".concat(result.script_type || 'character', " script\n\n");
                        response += "Path: ".concat(result.script_path, "\n");
                        response += "Complexity: ".concat(result.complexity, "\n");
                        response += "Features included: ".concat(((_c = result.features) === null || _c === void 0 ? void 0 : _c.join(', ')) || 'N/A', "\n\n");
                        if (result.code) {
                            response += "Generated Code:\n```gdscript\n".concat(result.code, "\n```\n\n");
                        }
                        if (result.explanation) {
                            response += "Explanation:\n".concat(result.explanation, "\n\n");
                        }
                        if (result.suggestions && result.suggestions.length > 0) {
                            response += "Suggestions:\n".concat(result.suggestions.map(function (s) { return "- ".concat(s); }).join('\n'));
                        }
                        return [2 /*return*/, response];
                    case 3:
                        error_1 = _e.sent();
                        suggestions = GodotMCPErrors.createRecoverySuggestions(error_1, 'generate_complete_scripts', 'generate script');
                        enhancedError = "".concat(error_1.message, "\n\nTroubleshooting suggestions:\n").concat(suggestions.map(function (s) { return "- ".concat(s); }).join('\n'));
                        throw new Error(enhancedError);
                    case 4: return [2 /*return*/];
                }
            });
        }); },
    },
    {
        name: 'refactor_existing_code',
        description: 'Intelligently refactor existing GDScript code with AI-powered suggestions',
        parameters: z.object({
            scriptPath: z.string()
                .describe('Path to the script file to refactor'),
            refactoringType: z.enum(['state_machine', 'extract_method', 'optimize_performance', 'apply_pattern', 'simplify_logic'])
                .describe('Type of refactoring to apply'),
            parameters: z.record(z.any()).optional()
                .describe('Additional parameters for the refactoring operation')
        }),
        execute: function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
            var godot, result, response, error_2;
            var scriptPath = _b.scriptPath, refactoringType = _b.refactoringType, parameters = _b.parameters;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        // Validate script path
                        GodotMCPErrors.validateScriptPath(scriptPath, 'refactor_existing_code');
                        godot = getGodotConnection();
                        _c.label = 1;
                    case 1:
                        _c.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, godot.sendCommand('refactor_existing_code', {
                                scriptPath: scriptPath,
                                refactoringType: refactoringType,
                                parameters: parameters
                            })];
                    case 2:
                        result = _c.sent();
                        response = "Refactored ".concat(scriptPath, " using ").concat(refactoringType, "\n\n");
                        if (result.changes && result.changes.length > 0) {
                            response += "Changes made:\n".concat(result.changes.map(function (c) { return "- ".concat(c.description); }).join('\n'), "\n\n");
                        }
                        if (result.refactoredCode) {
                            response += "Refactored Code:\n```gdscript\n".concat(result.refactoredCode, "\n```\n\n");
                        }
                        if (result.benefits) {
                            response += "Benefits:\n".concat(result.benefits.map(function (b) { return "- ".concat(b); }).join('\n'), "\n\n");
                        }
                        if (result.warnings && result.warnings.length > 0) {
                            response += "Warnings:\n".concat(result.warnings.map(function (w) { return "- ".concat(w); }).join('\n'));
                        }
                        return [2 /*return*/, response];
                    case 3:
                        error_2 = _c.sent();
                        throw new Error("Failed to refactor code: ".concat(error_2.message));
                    case 4: return [2 /*return*/];
                }
            });
        }); },
    },
    {
        name: 'optimize_texture_atlas',
        description: 'Optimize texture assets by creating atlases and compressing images',
        parameters: z.object({
            projectPath: z.string()
                .describe('Path to the Godot project'),
            maxTextureSize: z.number().optional().default(2048)
                .describe('Maximum texture size for atlas creation'),
            compression: z.enum(['lossless', 'lossy', 'auto']).optional().default('auto')
                .describe('Compression type to use'),
            createAtlas: z.boolean().optional().default(true)
                .describe('Whether to create texture atlases'),
            preview: z.boolean().optional().default(false)
                .describe('Preview changes without applying them')
        }),
        execute: function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
            var godot, result, response, error_3;
            var projectPath = _b.projectPath, _c = _b.maxTextureSize, maxTextureSize = _c === void 0 ? 2048 : _c, _d = _b.compression, compression = _d === void 0 ? 'auto' : _d, _e = _b.createAtlas, createAtlas = _e === void 0 ? true : _e, _f = _b.preview, preview = _f === void 0 ? false : _f;
            return __generator(this, function (_g) {
                switch (_g.label) {
                    case 0:
                        godot = getGodotConnection();
                        _g.label = 1;
                    case 1:
                        _g.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, godot.sendCommand('optimize_texture_atlas', {
                                projectPath: projectPath,
                                maxTextureSize: maxTextureSize,
                                compression: compression,
                                createAtlas: createAtlas,
                                preview: preview
                            })];
                    case 2:
                        result = _g.sent();
                        response = preview ? 'PREVIEW MODE - No changes applied\n\n' : 'Texture optimization completed\n\n';
                        if (result.atlasesCreated && result.atlasesCreated.length > 0) {
                            response += "Atlases created:\n".concat(result.atlasesCreated.map(function (a) { return "- ".concat(a.name, " (").concat(a.textures, " textures, ").concat(a.size, "px)"); }).join('\n'), "\n\n");
                        }
                        if (result.texturesOptimized && result.texturesOptimized.length > 0) {
                            response += "Textures optimized:\n".concat(result.texturesOptimized.map(function (t) { return "- ".concat(t.name, ": ").concat(t.originalSize, " \u2192 ").concat(t.optimizedSize, " (").concat(t.savings, "%)"); }).join('\n'), "\n\n");
                        }
                        response += "Total space saved: ".concat(result.totalSpaceSaved || 0, " KB\n");
                        response += "Performance improvement: ".concat(result.performanceImprovement || 'N/A');
                        return [2 /*return*/, response];
                    case 3:
                        error_3 = _g.sent();
                        throw new Error("Failed to optimize textures: ".concat(error_3.message));
                    case 4: return [2 /*return*/];
                }
            });
        }); },
    },
    {
        name: 'manage_audio_assets',
        description: 'Analyze, optimize, and organize audio assets in the project',
        parameters: z.object({
            operation: z.enum(['analyze', 'optimize', 'convert', 'organize'])
                .describe('Type of audio operation to perform'),
            audioFiles: z.array(z.string()).optional()
                .describe('Specific audio files to process (optional - processes all if not specified)'),
            targetFormat: z.enum(['ogg', 'mp3', 'wav']).optional()
                .describe('Target format for conversion operations'),
            quality: z.number().optional()
                .describe('Quality setting for compression (0-100)'),
            outputDir: z.string().optional()
                .describe('Output directory for organized files')
        }),
        execute: function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
            var godot, result, response_1, error_4;
            var _c, _d;
            var operation = _b.operation, audioFiles = _b.audioFiles, targetFormat = _b.targetFormat, quality = _b.quality, outputDir = _b.outputDir;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        godot = getGodotConnection();
                        _e.label = 1;
                    case 1:
                        _e.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, godot.sendCommand('manage_audio_assets', {
                                operation: operation,
                                audioFiles: audioFiles,
                                targetFormat: targetFormat,
                                quality: quality,
                                outputDir: outputDir
                            })];
                    case 2:
                        result = _e.sent();
                        response_1 = "Audio ".concat(operation, " completed\n\n");
                        switch (operation) {
                            case 'analyze':
                                if (result.analysis) {
                                    response_1 += "Analysis Results:\n";
                                    response_1 += "- Total files: ".concat(result.analysis.totalFiles, "\n");
                                    response_1 += "- Total size: ".concat(result.analysis.totalSize, " MB\n");
                                    response_1 += "- Formats: ".concat((_c = result.analysis.formats) === null || _c === void 0 ? void 0 : _c.join(', '), "\n");
                                    response_1 += "- Quality issues: ".concat(((_d = result.analysis.qualityIssues) === null || _d === void 0 ? void 0 : _d.length) || 0, "\n");
                                }
                                break;
                            case 'optimize':
                                if (result.optimizations) {
                                    response_1 += "Optimizations Applied:\n";
                                    result.optimizations.forEach(function (opt) {
                                        response_1 += "- ".concat(opt.file, ": ").concat(opt.originalSize, " \u2192 ").concat(opt.optimizedSize, " (").concat(opt.savings, "%)\n");
                                    });
                                    response_1 += "\nTotal space saved: ".concat(result.totalSpaceSaved, " MB");
                                }
                                break;
                            case 'convert':
                                if (result.conversions) {
                                    response_1 += "Files converted:\n";
                                    result.conversions.forEach(function (conv) {
                                        response_1 += "- ".concat(conv.original, " \u2192 ").concat(conv.converted, "\n");
                                    });
                                }
                                break;
                            case 'organize':
                                if (result.organization) {
                                    response_1 += "Files organized:\n";
                                    response_1 += "- Moved: ".concat(result.organization.moved, "\n");
                                    response_1 += "- Created folders: ".concat(result.organization.foldersCreated, "\n");
                                    response_1 += "- Output directory: ".concat(result.organization.outputDir);
                                }
                                break;
                        }
                        return [2 /*return*/, response_1];
                    case 3:
                        error_4 = _e.sent();
                        throw new Error("Failed to manage audio assets: ".concat(error_4.message));
                    case 4: return [2 /*return*/];
                }
            });
        }); },
    },
    {
        name: 'apply_project_template',
        description: 'Apply complete project templates with predefined structure and features',
        parameters: z.object({
            templateType: z.enum(['2d_platformer', 'topdown', '3d_basic', 'ui_heavy', 'puzzle', 'custom'])
                .describe('Type of project template to apply'),
            projectName: z.string()
                .describe('Name for the new project'),
            features: z.array(z.string())
                .describe('Additional features to include in the template'),
            structure: z.enum(['minimal', 'standard', 'complete']).optional().default('standard')
                .describe('Level of project structure complexity')
        }),
        execute: function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
            var godot, result, response, error_5;
            var templateType = _b.templateType, projectName = _b.projectName, features = _b.features, _c = _b.structure, structure = _c === void 0 ? 'standard' : _c;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        godot = getGodotConnection();
                        _d.label = 1;
                    case 1:
                        _d.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, godot.sendCommand('apply_project_template', {
                                templateType: templateType,
                                projectName: projectName,
                                features: features,
                                structure: structure
                            })];
                    case 2:
                        result = _d.sent();
                        response = "Applied ".concat(templateType, " template to project \"").concat(projectName, "\"\n\n");
                        if (result.filesCreated && result.filesCreated.length > 0) {
                            response += "Files created:\n".concat(result.filesCreated.map(function (f) { return "- ".concat(f); }).join('\n'), "\n\n");
                        }
                        if (result.foldersCreated && result.foldersCreated.length > 0) {
                            response += "Folders created:\n".concat(result.foldersCreated.map(function (f) { return "- ".concat(f); }).join('\n'), "\n\n");
                        }
                        if (result.scenesCreated && result.scenesCreated.length > 0) {
                            response += "Scenes created:\n".concat(result.scenesCreated.map(function (s) { return "- ".concat(s); }).join('\n'), "\n\n");
                        }
                        if (result.scriptsCreated && result.scriptsCreated.length > 0) {
                            response += "Scripts created:\n".concat(result.scriptsCreated.map(function (s) { return "- ".concat(s); }).join('\n'), "\n\n");
                        }
                        response += "Template features included: ".concat(features.join(', '), "\n");
                        response += "Structure level: ".concat(structure, "\n\n");
                        if (result.nextSteps && result.nextSteps.length > 0) {
                            response += "Next steps:\n".concat(result.nextSteps.map(function (s) { return "- ".concat(s); }).join('\n'));
                        }
                        return [2 /*return*/, response];
                    case 3:
                        error_5 = _d.sent();
                        throw new Error("Failed to apply project template: ".concat(error_5.message));
                    case 4: return [2 /*return*/];
                }
            });
        }); },
    },
    {
        name: 'automated_optimization',
        description: 'Run comprehensive project-wide optimizations automatically',
        parameters: z.object({
            projectPath: z.string()
                .describe('Path to the Godot project to optimize'),
            optimizationTypes: z.array(z.enum(['performance', 'memory', 'assets', 'code', 'scenes']))
                .describe('Types of optimizations to apply'),
            aggressive: z.boolean().optional().default(false)
                .describe('Whether to apply aggressive optimizations (may affect quality)'),
            preview: z.boolean().optional().default(false)
                .describe('Preview changes without applying them')
        }),
        execute: function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
            var godot, result_1, response_2, error_6;
            var projectPath = _b.projectPath, optimizationTypes = _b.optimizationTypes, _c = _b.aggressive, aggressive = _c === void 0 ? false : _c, _d = _b.preview, preview = _d === void 0 ? false : _d;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        godot = getGodotConnection();
                        _e.label = 1;
                    case 1:
                        _e.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, godot.sendCommand('automated_optimization', {
                                projectPath: projectPath,
                                optimizationTypes: optimizationTypes,
                                aggressive: aggressive,
                                preview: preview
                            })];
                    case 2:
                        result_1 = _e.sent();
                        response_2 = preview ? 'PREVIEW MODE - No changes applied\n\n' : 'Automated optimization completed\n\n';
                        optimizationTypes.forEach(function (type) {
                            var optResult = result_1["".concat(type, "Optimization")];
                            if (optResult) {
                                response_2 += "".concat(type.toUpperCase(), " Optimization:\n");
                                if (optResult.changes && optResult.changes.length > 0) {
                                    response_2 += "Changes made:\n".concat(optResult.changes.map(function (c) { return "- ".concat(c); }).join('\n'), "\n");
                                }
                                if (optResult.improvement) {
                                    response_2 += "Improvement: ".concat(optResult.improvement, "\n");
                                }
                                response_2 += '\n';
                            }
                        });
                        if (result_1.overallImprovement) {
                            response_2 += "Overall improvement: ".concat(result_1.overallImprovement, "\n\n");
                        }
                        if (result_1.recommendations && result_1.recommendations.length > 0) {
                            response_2 += "Recommendations for further optimization:\n".concat(result_1.recommendations.map(function (r) { return "- ".concat(r); }).join('\n'));
                        }
                        return [2 /*return*/, response_2];
                    case 3:
                        error_6 = _e.sent();
                        throw new Error("Failed to run automated optimization: ".concat(error_6.message));
                    case 4: return [2 /*return*/];
                }
            });
        }); },
    },
    {
        name: 'create_character_system',
        description: 'Generate complete character systems with movement, animation, and AI',
        parameters: z.object({
            characterType: z.enum(['player', 'enemy', 'npc'])
                .describe('Type of character to create'),
            movementType: z.enum(['platformer', 'topdown', '3d'])
                .describe('Movement style for the character'),
            features: z.array(z.string())
                .describe('Additional features to include (e.g. "health", "inventory", "dialogue")'),
            spritePath: z.string().optional()
                .describe('Path to character sprite sheet (optional)'),
            createScene: z.boolean().optional().default(true)
                .describe('Whether to create a demo scene with the character')
        }),
        execute: function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
            var godot, result, response, error_7;
            var characterType = _b.characterType, movementType = _b.movementType, features = _b.features, spritePath = _b.spritePath, _c = _b.createScene, createScene = _c === void 0 ? true : _c;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        godot = getGodotConnection();
                        _d.label = 1;
                    case 1:
                        _d.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, godot.sendCommand('create_character_system', {
                                characterType: characterType,
                                movementType: movementType,
                                features: features,
                                spritePath: spritePath,
                                createScene: createScene
                            })];
                    case 2:
                        result = _d.sent();
                        response = "Created ".concat(characterType, " character system (").concat(movementType, ")\n\n");
                        if (result.scriptPath) {
                            response += "Main script: ".concat(result.scriptPath, "\n");
                        }
                        if (result.scenePath) {
                            response += "Demo scene: ".concat(result.scenePath, "\n");
                        }
                        if (result.additionalScripts && result.additionalScripts.length > 0) {
                            response += "Additional scripts:\n".concat(result.additionalScripts.map(function (s) { return "- ".concat(s); }).join('\n'), "\n");
                        }
                        response += "\nFeatures included: ".concat(features.join(', '), "\n\n");
                        if (result.setupInstructions) {
                            response += "Setup instructions:\n".concat(result.setupInstructions.map(function (i) { return "- ".concat(i); }).join('\n'), "\n\n");
                        }
                        if (result.controls && result.controls.length > 0) {
                            response += "Controls:\n".concat(result.controls.map(function (c) { return "- ".concat(c); }).join('\n'));
                        }
                        return [2 /*return*/, response];
                    case 3:
                        error_7 = _d.sent();
                        throw new Error("Failed to create character system: ".concat(error_7.message));
                    case 4: return [2 /*return*/];
                }
            });
        }); },
    },
    {
        name: 'generate_level',
        description: 'Create procedural game levels with terrain, enemies, and objectives',
        parameters: z.object({
            levelType: z.enum(['platformer', 'topdown', 'puzzle', 'endless'])
                .describe('Type of level to generate'),
            difficulty: z.enum(['easy', 'medium', 'hard'])
                .describe('Difficulty level of the generated level'),
            theme: z.string()
                .describe('Visual theme for the level (e.g. "forest", "castle", "space")'),
            dimensions: z.object({
                width: z.number(),
                height: z.number()
            })
                .describe('Dimensions of the level in tiles/units'),
            features: z.array(z.string()).optional()
                .describe('Additional features to include (e.g. "enemies", "powerups", "traps")')
        }),
        execute: function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
            var godot, result, response_3, error_8;
            var levelType = _b.levelType, difficulty = _b.difficulty, theme = _b.theme, dimensions = _b.dimensions, features = _b.features;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        godot = getGodotConnection();
                        _c.label = 1;
                    case 1:
                        _c.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, godot.sendCommand('generate_level', {
                                levelType: levelType,
                                difficulty: difficulty,
                                theme: theme,
                                dimensions: dimensions,
                                features: features
                            })];
                    case 2:
                        result = _c.sent();
                        response_3 = "Generated ".concat(levelType, " level (").concat(difficulty, " difficulty, ").concat(theme, " theme)\n\n");
                        if (result.scenePath) {
                            response_3 += "Level scene: ".concat(result.scenePath, "\n");
                        }
                        if (result.dimensions) {
                            response_3 += "Dimensions: ".concat(result.dimensions.width, " x ").concat(result.dimensions.height, "\n");
                        }
                        if (result.elements && result.elements.length > 0) {
                            response_3 += "\nLevel elements:\n".concat(result.elements.map(function (e) { return "- ".concat(e.type, ": ").concat(e.count, " (").concat(e.description, ")"); }).join('\n'), "\n");
                        }
                        if (result.objectives && result.objectives.length > 0) {
                            response_3 += "\nObjectives:\n".concat(result.objectives.map(function (o) { return "- ".concat(o); }).join('\n'), "\n");
                        }
                        response_3 += "\nFeatures included: ".concat((features || []).join(', '), "\n\n");
                        if (result.difficultySettings) {
                            response_3 += "Difficulty settings:\n";
                            Object.entries(result.difficultySettings).forEach(function (_a) {
                                var key = _a[0], value = _a[1];
                                response_3 += "- ".concat(key, ": ").concat(value, "\n");
                            });
                        }
                        return [2 /*return*/, response_3];
                    case 3:
                        error_8 = _c.sent();
                        throw new Error("Failed to generate level: ".concat(error_8.message));
                    case 4: return [2 /*return*/];
                }
            });
        }); },
    },
    {
        name: 'apply_smart_suggestion',
        description: 'Apply intelligent suggestions to improve project quality and performance',
        parameters: z.object({
            suggestionType: z.enum(['performance', 'architecture', 'code_quality', 'assets', 'ux'])
                .describe('Type of suggestion to apply'),
            target: z.string()
                .describe('Target file, scene, or component for the suggestion'),
            autoApply: z.boolean().optional().default(false)
                .describe('Whether to apply the suggestion automatically'),
            parameters: z.record(z.any()).optional()
                .describe('Additional parameters for the suggestion')
        }),
        execute: function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
            var godot, result, response, error_9;
            var suggestionType = _b.suggestionType, target = _b.target, _c = _b.autoApply, autoApply = _c === void 0 ? false : _c, parameters = _b.parameters;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        godot = getGodotConnection();
                        _d.label = 1;
                    case 1:
                        _d.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, godot.sendCommand('apply_smart_suggestion', {
                                suggestionType: suggestionType,
                                target: target,
                                autoApply: autoApply,
                                parameters: parameters
                            })];
                    case 2:
                        result = _d.sent();
                        response = "Smart suggestion for ".concat(suggestionType, " on ").concat(target, "\n\n");
                        if (result.analysis) {
                            response += "Analysis:\n".concat(result.analysis, "\n\n");
                        }
                        if (result.suggestions && result.suggestions.length > 0) {
                            response += "Suggestions found:\n".concat(result.suggestions.map(function (s, i) { return "".concat(i + 1, ". ").concat(s.description, " (").concat(s.confidence, "% confidence)"); }).join('\n'), "\n\n");
                        }
                        if (autoApply && result.applied && result.applied.length > 0) {
                            response += "Changes applied:\n".concat(result.applied.map(function (a) { return "- ".concat(a); }).join('\n'), "\n\n");
                        }
                        else if (!autoApply && result.preview) {
                            response += "Preview of changes:\n".concat(result.preview.map(function (p) { return "- ".concat(p); }).join('\n'), "\n\n");
                            response += "Run with autoApply=true to apply these changes.";
                        }
                        if (result.benefits) {
                            response += "Expected benefits:\n".concat(result.benefits.map(function (b) { return "- ".concat(b); }).join('\n'));
                        }
                        return [2 /*return*/, response];
                    case 3:
                        error_9 = _d.sent();
                        throw new Error("Failed to apply smart suggestion: ".concat(error_9.message));
                    case 4: return [2 /*return*/];
                }
            });
        }); },
    },
    {
        name: 'batch_operations',
        description: 'Execute multiple Godot operations in a single request with rollback support',
        parameters: z.object({
            operations: z.array(z.object({
                tool: z.enum(['create_node', 'update_node_property', 'create_script', 'save_scene']),
                parameters: z.record(z.any())
            })).min(1).max(10),
            rollbackOnError: z.boolean().default(true),
            continueOnError: z.boolean().default(false)
        }),
        execute: function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
            var godot, results, executedOperations, i, operation, result, error_10, errorResult, successCount, failureCount, error_11, suggestions, enhancedError;
            var operations = _b.operations, _c = _b.rollbackOnError, rollbackOnError = _c === void 0 ? true : _c, _d = _b.continueOnError, continueOnError = _d === void 0 ? false : _d;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        godot = getGodotConnection();
                        results = [];
                        executedOperations = [];
                        GodotMCPErrors.logOperation('batch_operations', 'Starting batch execution', { operationCount: operations.length });
                        _e.label = 1;
                    case 1:
                        _e.trys.push([1, 8, , 9]);
                        i = 0;
                        _e.label = 2;
                    case 2:
                        if (!(i < operations.length)) return [3 /*break*/, 7];
                        operation = operations[i];
                        _e.label = 3;
                    case 3:
                        _e.trys.push([3, 5, , 6]);
                        GodotMCPErrors.logOperation('batch_operations', "Executing operation ".concat(i + 1, "/").concat(operations.length), { tool: operation.tool });
                        return [4 /*yield*/, godot.sendCommand(operation.tool, operation.parameters)];
                    case 4:
                        result = _e.sent();
                        results.push({ index: i, success: true, result: result, tool: operation.tool });
                        executedOperations.push({ index: i, operation: operation, result: result });
                        return [3 /*break*/, 6];
                    case 5:
                        error_10 = _e.sent();
                        errorResult = { index: i, success: false, error: error_10.message, tool: operation.tool };
                        results.push(errorResult);
                        if (!continueOnError) {
                            if (rollbackOnError && executedOperations.length > 0) {
                                GodotMCPErrors.logOperation('batch_operations', 'Rolling back operations due to error');
                                // Note: Rollback implementation would depend on specific undo mechanisms
                                // For now, we'll log the rollback intent
                                console.warn('[batch_operations] Rollback requested but not fully implemented');
                            }
                            throw new Error("Batch operation failed at step ".concat(i + 1, ": ").concat(error_10.message));
                        }
                        return [3 /*break*/, 6];
                    case 6:
                        i++;
                        return [3 /*break*/, 2];
                    case 7:
                        successCount = results.filter(function (r) { return r.success; }).length;
                        failureCount = results.filter(function (r) { return !r.success; }).length;
                        return [2 /*return*/, "Batch operations completed: ".concat(successCount, " successful, ").concat(failureCount, " failed\n\n") +
                                "Results:\n".concat(results.map(function (r) {
                                    return "Operation ".concat(r.index + 1, " (").concat(r.tool, "): ").concat(r.success ? 'SUCCESS' : 'FAILED').concat(r.error ? " - ".concat(r.error) : '');
                                }).join('\n'))];
                    case 8:
                        error_11 = _e.sent();
                        suggestions = GodotMCPErrors.createRecoverySuggestions(error_11, 'batch_operations', 'execute batch');
                        enhancedError = "".concat(error_11.message, "\n\nTroubleshooting suggestions:\n").concat(suggestions.map(function (s) { return "- ".concat(s); }).join('\n'));
                        throw new Error(enhancedError);
                    case 9: return [2 /*return*/];
                }
            });
        }); },
    },
    {
        name: 'validate_project_structure',
        description: 'Validate and analyze the current Godot project structure for common issues',
        parameters: z.object({
            projectPath: z.string().optional(),
            checkScripts: z.boolean().default(true),
            checkScenes: z.boolean().default(true),
            checkResources: z.boolean().default(true),
            fixIssues: z.boolean().default(false)
        }),
        execute: function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
            var godot, result, response_4, error_12, suggestions, enhancedError;
            var projectPath = _b.projectPath, _c = _b.checkScripts, checkScripts = _c === void 0 ? true : _c, _d = _b.checkScenes, checkScenes = _d === void 0 ? true : _d, _e = _b.checkResources, checkResources = _e === void 0 ? true : _e, _f = _b.fixIssues, fixIssues = _f === void 0 ? false : _f;
            return __generator(this, function (_g) {
                switch (_g.label) {
                    case 0:
                        godot = getGodotConnection();
                        _g.label = 1;
                    case 1:
                        _g.trys.push([1, 3, , 4]);
                        GodotMCPErrors.logOperation('validate_project_structure', 'Starting project validation');
                        return [4 /*yield*/, godot.sendCommand('validate_project_structure', {
                                projectPath: projectPath,
                                checkScripts: checkScripts,
                                checkScenes: checkScenes,
                                checkResources: checkResources,
                                fixIssues: fixIssues
                            })];
                    case 2:
                        result = _g.sent();
                        response_4 = 'Project Structure Validation Results:\n\n';
                        if (result.issues && result.issues.length > 0) {
                            response_4 += "Issues Found (".concat(result.issues.length, "):\n");
                            result.issues.forEach(function (issue, index) {
                                response_4 += "".concat(index + 1, ". ").concat(issue.severity.toUpperCase(), ": ").concat(issue.message, "\n");
                                if (issue.file)
                                    response_4 += "   File: ".concat(issue.file, "\n");
                                if (issue.line)
                                    response_4 += "   Line: ".concat(issue.line, "\n");
                                if (issue.suggestion)
                                    response_4 += "   Suggestion: ".concat(issue.suggestion, "\n");
                                response_4 += '\n';
                            });
                        }
                        else {
                            response_4 += '✅ No issues found in project structure\n\n';
                        }
                        if (result.statistics) {
                            response_4 += 'Project Statistics:\n';
                            Object.entries(result.statistics).forEach(function (_a) {
                                var key = _a[0], value = _a[1];
                                response_4 += "- ".concat(key, ": ").concat(value, "\n");
                            });
                        }
                        if (fixIssues && result.fixed && result.fixed.length > 0) {
                            response_4 += '\nIssues Fixed:\n';
                            result.fixed.forEach(function (fix) {
                                response_4 += "- ".concat(fix, "\n");
                            });
                        }
                        return [2 /*return*/, response_4];
                    case 3:
                        error_12 = _g.sent();
                        suggestions = GodotMCPErrors.createRecoverySuggestions(error_12, 'validate_project_structure', 'validate project');
                        enhancedError = "".concat(error_12.message, "\n\nTroubleshooting suggestions:\n").concat(suggestions.map(function (s) { return "- ".concat(s); }).join('\n'));
                        throw new Error(enhancedError);
                    case 4: return [2 /*return*/];
                }
            });
        }); },
    },
    {
        name: 'game_development_workflow',
        description: 'Orchestrate complete game development workflow from concept to playable prototype',
        parameters: z.object({
            gameConcept: z.string()
                .describe('High-level description of the game concept'),
            targetPlatform: z.enum(['desktop', 'mobile', 'web', 'console'])
                .describe('Primary target platform'),
            gameType: z.enum(['action', 'puzzle', 'adventure', 'rpg', 'simulation', 'sports'])
                .describe('Type of game to develop'),
            scope: z.enum(['prototype', 'full_game', 'mvp'])
                .describe('Development scope'),
            features: z.array(z.string())
                .describe('Key features to include'),
            artStyle: z.string().optional()
                .describe('Art style description'),
            audioRequirements: z.array(z.string()).optional()
                .describe('Audio requirements (music, sfx, voice)'),
            estimatedDuration: z.number().optional()
                .describe('Estimated development time in hours')
        }),
        execute: function (params) { return __awaiter(void 0, void 0, void 0, function () {
            var godot, result, response_5, error_13;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        godot = getGodotConnection();
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, godot.sendCommand('game_development_workflow', {
                                gameConcept: params.gameConcept,
                                targetPlatform: params.targetPlatform,
                                gameType: params.gameType,
                                scope: params.scope,
                                features: params.features || [],
                                artStyle: params.artStyle,
                                audioRequirements: params.audioRequirements,
                                estimatedDuration: params.estimatedDuration
                            })];
                    case 2:
                        result = _b.sent();
                        response_5 = "\uD83C\uDFAE Game Development Workflow Initiated!\n\n";
                        response_5 += "Concept: ".concat(params.gameConcept, "\n");
                        response_5 += "Type: ".concat(params.gameType, "\n");
                        response_5 += "Platform: ".concat(params.targetPlatform, "\n");
                        response_5 += "Scope: ".concat(params.scope, "\n");
                        response_5 += "Features: ".concat(((_a = params.features) === null || _a === void 0 ? void 0 : _a.join(', ')) || 'Basic gameplay', "\n\n");
                        if (result.workflow_steps && result.workflow_steps.length > 0) {
                            response_5 += "\uD83D\uDCCB Development Roadmap:\n";
                            result.workflow_steps.forEach(function (step, index) {
                                response_5 += "".concat(index + 1, ". ").concat(step.name, "\n");
                                if (step.description)
                                    response_5 += "   ".concat(step.description, "\n");
                                if (step.estimated_time)
                                    response_5 += "   \u23F1\uFE0F ".concat(step.estimated_time, " hours\n");
                                response_5 += '\n';
                            });
                        }
                        if (result.generated_assets && result.generated_assets.length > 0) {
                            response_5 += "\uD83C\uDFA8 Generated Assets:\n";
                            result.generated_assets.forEach(function (asset, index) {
                                response_5 += "".concat(index + 1, ". ").concat(asset, "\n");
                            });
                            response_5 += '\n';
                        }
                        response_5 += "\uD83D\uDE80 Next Steps:\n";
                        response_5 += "1. Review generated project structure\n";
                        response_5 += "2. Customize assets and gameplay\n";
                        response_5 += "3. Test core mechanics\n";
                        response_5 += "4. Iterate and refine\n";
                        response_5 += "5. Deploy to target platform\n\n";
                        response_5 += "\uD83D\uDCA1 Pro Tips:\n";
                        response_5 += "- Start with core gameplay loop\n";
                        response_5 += "- Use version control for all changes\n";
                        response_5 += "- Test frequently on target platform\n";
                        response_5 += "- Get player feedback early\n";
                        return [2 /*return*/, response_5];
                    case 3:
                        error_13 = _b.sent();
                        throw new Error("Game development workflow failed: ".concat(error_13.message));
                    case 4: return [2 /*return*/];
                }
            });
        }); },
    },
];
//# sourceMappingURL=advanced_tools.js.map