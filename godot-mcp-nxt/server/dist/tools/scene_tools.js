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
 * Unified Scene Management Tool - Consolidates all scene and resource operations
 */
export var sceneTools = [
    {
        name: 'scene_manager',
        description: 'Unified tool for all scene operations: create, save, open, edit, and resource management',
        parameters: z.object({
            operation: z.enum(['create_scene', 'save_scene', 'open_scene', 'get_current_scene', 'get_project_info', 'create_resource', 'edit_scene', 'batch_edit'])
                .describe('Type of scene operation to perform'),
            path: z.string().optional()
                .describe('Path to the scene or resource file'),
            root_node_type: z.string().optional().default('Node')
                .describe('Type of root node to create for new scenes'),
            resource_type: z.string().optional()
                .describe('Type of resource to create'),
            properties: z.record(z.any()).optional()
                .describe('Properties for resource creation'),
            // Scene editing options
            operations: z.array(z.object({
                type: z.enum(['create_node', 'modify_property', 'delete_node', 'move_node', 'add_script', 'set_signal'])
                    .describe('Type of operation to perform'),
                target: z.string().optional()
                    .describe('Target node path for the operation'),
                parameters: z.any()
                    .describe('Parameters specific to the operation type')
            })).optional()
                .describe('Array of operations to perform on the scene'),
            // Batch operations
            batch_operations: z.array(z.object({
                scenePath: z.string()
                    .describe('Path to the scene file'),
                operation: z.object({
                    type: z.enum(['create_node', 'modify_property', 'delete_node', 'move_node', 'add_script', 'set_signal']),
                    target: z.string().optional(),
                    parameters: z.any()
                })
                    .describe('Operation to perform on this scene')
            })).optional()
                .describe('Array of operations across multiple scenes'),
            // General options
            autoSave: z.boolean().optional().default(true)
                .describe('Whether to automatically save after operations')
        }),
        execute: function (params) { return __awaiter(void 0, void 0, void 0, function () {
            var godot, _a, result, result, result, result, result, godotVersion, output, result, results, operationCount, _i, _b, operation, result, results, sceneResults, _c, _d, _e, scenePath, operation, result, _f, _g, scenePath, _h, _j, _k, scenePath, sceneOps, error_1;
            return __generator(this, function (_l) {
                switch (_l.label) {
                    case 0:
                        godot = getGodotConnection();
                        _l.label = 1;
                    case 1:
                        _l.trys.push([1, 32, , 33]);
                        _a = params.operation;
                        switch (_a) {
                            case 'create_scene': return [3 /*break*/, 2];
                            case 'save_scene': return [3 /*break*/, 4];
                            case 'open_scene': return [3 /*break*/, 6];
                            case 'get_current_scene': return [3 /*break*/, 8];
                            case 'get_project_info': return [3 /*break*/, 10];
                            case 'create_resource': return [3 /*break*/, 12];
                            case 'edit_scene': return [3 /*break*/, 14];
                            case 'batch_edit': return [3 /*break*/, 21];
                        }
                        return [3 /*break*/, 30];
                    case 2:
                        if (!params.path) {
                            throw new Error('path is required for create_scene operation');
                        }
                        return [4 /*yield*/, godot.sendCommand('create_scene', {
                                path: params.path,
                                root_node_type: params.root_node_type
                            })];
                    case 3:
                        result = _l.sent();
                        return [2 /*return*/, "Created new scene at ".concat(result.scene_path, " with root node type ").concat(result.root_node_type)];
                    case 4: return [4 /*yield*/, godot.sendCommand('save_scene', { path: params.path })];
                    case 5:
                        result = _l.sent();
                        return [2 /*return*/, "Saved scene to ".concat(result.scene_path)];
                    case 6:
                        if (!params.path) {
                            throw new Error('path is required for open_scene operation');
                        }
                        return [4 /*yield*/, godot.sendCommand('open_scene', { path: params.path })];
                    case 7:
                        result = _l.sent();
                        return [2 /*return*/, "Opened scene at ".concat(result.scene_path)];
                    case 8: return [4 /*yield*/, godot.sendCommand('get_current_scene', {})];
                    case 9:
                        result = _l.sent();
                        return [2 /*return*/, "Current scene: ".concat(result.scene_path, "\nRoot node: ").concat(result.root_node_name, " (").concat(result.root_node_type, ")")];
                    case 10: return [4 /*yield*/, godot.sendCommand('get_project_info', {})];
                    case 11:
                        result = _l.sent();
                        godotVersion = "".concat(result.godot_version.major, ".").concat(result.godot_version.minor, ".").concat(result.godot_version.patch);
                        output = "Project Name: ".concat(result.project_name, "\n");
                        output += "Project Version: ".concat(result.project_version, "\n");
                        output += "Project Path: ".concat(result.project_path, "\n");
                        output += "Godot Version: ".concat(godotVersion, "\n");
                        if (result.current_scene) {
                            output += "Current Scene: ".concat(result.current_scene);
                        }
                        else {
                            output += "No scene is currently open";
                        }
                        return [2 /*return*/, output];
                    case 12:
                        if (!params.resource_type || !params.path) {
                            throw new Error('resource_type and path are required for create_resource operation');
                        }
                        return [4 /*yield*/, godot.sendCommand('create_resource', {
                                resource_type: params.resource_type,
                                resource_path: params.path,
                                properties: params.properties || {}
                            })];
                    case 13:
                        result = _l.sent();
                        return [2 /*return*/, "Created ".concat(params.resource_type, " resource at ").concat(result.resource_path)];
                    case 14:
                        if (!params.path || !params.operations || !Array.isArray(params.operations)) {
                            throw new Error('path and operations array are required for edit_scene operation');
                        }
                        results = [];
                        operationCount = 0;
                        _i = 0, _b = params.operations;
                        _l.label = 15;
                    case 15:
                        if (!(_i < _b.length)) return [3 /*break*/, 18];
                        operation = _b[_i];
                        operationCount++;
                        return [4 /*yield*/, godot.sendCommand('live_scene_edit', {
                                scenePath: params.path,
                                operation: operation,
                                operationIndex: operationCount
                            })];
                    case 16:
                        result = _l.sent();
                        results.push("".concat(operation.type, ": ").concat(result.message || 'Success'));
                        _l.label = 17;
                    case 17:
                        _i++;
                        return [3 /*break*/, 15];
                    case 18:
                        if (!params.autoSave) return [3 /*break*/, 20];
                        return [4 /*yield*/, godot.sendCommand('save_scene', { path: params.path })];
                    case 19:
                        _l.sent();
                        results.push('Scene auto-saved');
                        _l.label = 20;
                    case 20: return [2 /*return*/, "Scene editing completed:\n".concat(results.map(function (r, i) { return "".concat(i + 1, ". ").concat(r); }).join('\n'))];
                    case 21:
                        if (!params.batch_operations || !Array.isArray(params.batch_operations)) {
                            throw new Error('batch_operations array is required for batch_edit operation');
                        }
                        results = [];
                        sceneResults = new Map();
                        _c = 0, _d = params.batch_operations;
                        _l.label = 22;
                    case 22:
                        if (!(_c < _d.length)) return [3 /*break*/, 25];
                        _e = _d[_c], scenePath = _e.scenePath, operation = _e.operation;
                        if (!sceneResults.has(scenePath)) {
                            sceneResults.set(scenePath, []);
                        }
                        return [4 /*yield*/, godot.sendCommand('live_scene_edit', {
                                scenePath: scenePath,
                                operation: operation
                            })];
                    case 23:
                        result = _l.sent();
                        sceneResults.get(scenePath).push("".concat(operation.type, ": ").concat(result.message || 'Success'));
                        _l.label = 24;
                    case 24:
                        _c++;
                        return [3 /*break*/, 22];
                    case 25:
                        if (!params.autoSave) return [3 /*break*/, 29];
                        _f = 0, _g = Array.from(sceneResults.keys());
                        _l.label = 26;
                    case 26:
                        if (!(_f < _g.length)) return [3 /*break*/, 29];
                        scenePath = _g[_f];
                        return [4 /*yield*/, godot.sendCommand('save_scene', { path: scenePath })];
                    case 27:
                        _l.sent();
                        sceneResults.get(scenePath).push('Scene saved');
                        _l.label = 28;
                    case 28:
                        _f++;
                        return [3 /*break*/, 26];
                    case 29:
                        for (_h = 0, _j = Array.from(sceneResults.entries()); _h < _j.length; _h++) {
                            _k = _j[_h], scenePath = _k[0], sceneOps = _k[1];
                            results.push("".concat(scenePath, ":\n").concat(sceneOps.map(function (op) { return "  - ".concat(op); }).join('\n')));
                        }
                        return [2 /*return*/, "Batch operations completed:\n".concat(results.join('\n\n'))];
                    case 30: throw new Error("Unknown operation: ".concat(params.operation));
                    case 31: return [3 /*break*/, 33];
                    case 32:
                        error_1 = _l.sent();
                        throw new Error("Scene manager operation failed: ".concat(error_1.message));
                    case 33: return [2 /*return*/];
                }
            });
        }); },
    },
];
//# sourceMappingURL=scene_tools.js.map