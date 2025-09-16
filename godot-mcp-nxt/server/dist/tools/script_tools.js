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
 * Unified Script Management Tool - Consolidates all script-related operations
 */
export var scriptTools = [
    {
        name: 'script_manager',
        description: 'Unified tool for all script operations: create, edit, read, generate templates, and AI-powered script generation',
        parameters: z.object({
            operation: z.enum(['create', 'edit', 'read', 'generate_template', 'generate_ai'])
                .describe('Type of script operation to perform'),
            script_path: z.string().optional()
                .describe('Path to the script file (required for most operations)'),
            content: z.string().optional()
                .describe('Script content (required for create/edit operations)'),
            node_path: z.string().optional()
                .describe('Path to a node to attach the script to (optional)'),
            // Template generation options
            class_name: z.string().optional()
                .describe('Optional class name for the script template'),
            extends_type: z.string().optional().default('Node')
                .describe('Base class that this script extends'),
            include_ready: z.boolean().optional().default(true)
                .describe('Whether to include the _ready() function'),
            include_process: z.boolean().optional().default(false)
                .describe('Whether to include the _process() function'),
            include_input: z.boolean().optional().default(false)
                .describe('Whether to include the _input() function'),
            include_physics: z.boolean().optional().default(false)
                .describe('Whether to include the _physics_process() function'),
            // AI generation options
            description: z.string().optional()
                .describe('Natural language description for AI script generation'),
            scriptType: z.enum(['character', 'ui', 'gameplay', 'utility', 'custom']).optional()
                .describe('Type of script to generate'),
            complexity: z.enum(['simple', 'medium', 'complex']).optional().default('medium')
                .describe('Complexity level of the generated script'),
            features: z.array(z.string()).optional()
                .describe('Specific features to include in the script'),
            targetScene: z.string().optional()
                .describe('Path to scene where the script will be used'),
            // Refactoring options
            refactoringType: z.enum(['state_machine', 'extract_method', 'optimize_performance', 'apply_pattern', 'simplify_logic']).optional()
                .describe('Type of refactoring to apply'),
            parameters: z.record(z.any()).optional()
                .describe('Additional parameters for the operation')
        }),
        execute: function (params) { return __awaiter(void 0, void 0, void 0, function () {
            var godot, _a, result, attachMessage, result, template, result, error_1;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        godot = getGodotConnection();
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 13, , 14]);
                        _a = params.operation;
                        switch (_a) {
                            case 'create': return [3 /*break*/, 2];
                            case 'edit': return [3 /*break*/, 4];
                            case 'read': return [3 /*break*/, 6];
                            case 'generate_template': return [3 /*break*/, 8];
                            case 'generate_ai': return [3 /*break*/, 9];
                        }
                        return [3 /*break*/, 11];
                    case 2:
                        if (!params.script_path || !params.content) {
                            throw new Error('script_path and content are required for create operation');
                        }
                        return [4 /*yield*/, godot.sendCommand('create_script', {
                                script_path: params.script_path,
                                content: params.content,
                                node_path: params.node_path,
                            })];
                    case 3:
                        result = _b.sent();
                        attachMessage = params.node_path ? " and attached to node at ".concat(params.node_path) : '';
                        return [2 /*return*/, "Created script at ".concat(result.script_path).concat(attachMessage)];
                    case 4:
                        if (!params.script_path || !params.content) {
                            throw new Error('script_path and content are required for edit operation');
                        }
                        return [4 /*yield*/, godot.sendCommand('edit_script', {
                                script_path: params.script_path,
                                content: params.content,
                            })];
                    case 5:
                        _b.sent();
                        return [2 /*return*/, "Updated script at ".concat(params.script_path)];
                    case 6:
                        if (!params.script_path && !params.node_path) {
                            throw new Error('Either script_path or node_path must be provided for read operation');
                        }
                        return [4 /*yield*/, godot.sendCommand('get_script', {
                                script_path: params.script_path,
                                node_path: params.node_path,
                            })];
                    case 7:
                        result = _b.sent();
                        return [2 /*return*/, "Script at ".concat(result.script_path, ":\n\n```gdscript\n").concat(result.content, "\n```")];
                    case 8:
                        {
                            template = '';
                            if (params.class_name) {
                                template += "class_name ".concat(params.class_name, "\n");
                            }
                            template += "extends ".concat(params.extends_type || 'Node', "\n\n");
                            if (params.include_ready) {
                                template += "func _ready():\n\tpass\n\n";
                            }
                            if (params.include_process) {
                                template += "func _process(delta):\n\tpass\n\n";
                            }
                            if (params.include_physics) {
                                template += "func _physics_process(delta):\n\tpass\n\n";
                            }
                            if (params.include_input) {
                                template += "func _input(event):\n\tpass\n\n";
                            }
                            template = template.trimEnd();
                            return [2 /*return*/, "Generated GDScript template:\n\n```gdscript\n".concat(template, "\n```")];
                        }
                        _b.label = 9;
                    case 9:
                        if (!params.description) {
                            throw new Error('description is required for generate_ai operation');
                        }
                        // Validate features array if provided
                        if (params.features && (!Array.isArray(params.features) || params.features.some(function (f) { return typeof f !== 'string'; }))) {
                            throw new Error('Features must be an array of strings');
                        }
                        return [4 /*yield*/, godot.sendCommand('generate_complete_scripts', {
                                description: params.description,
                                scriptType: params.scriptType,
                                complexity: params.complexity,
                                features: params.features,
                                targetScene: params.targetScene
                            })];
                    case 10:
                        result = _b.sent();
                        return [2 /*return*/, "AI-generated script:\n\n```gdscript\n".concat(result.content, "\n```\n\n").concat(result.explanation || '')];
                    case 11: throw new Error("Unknown operation: ".concat(params.operation));
                    case 12: return [3 /*break*/, 14];
                    case 13:
                        error_1 = _b.sent();
                        throw new Error("Script manager operation failed: ".concat(error_1.message));
                    case 14: return [2 /*return*/];
                }
            });
        }); },
    },
];
//# sourceMappingURL=script_tools.js.map