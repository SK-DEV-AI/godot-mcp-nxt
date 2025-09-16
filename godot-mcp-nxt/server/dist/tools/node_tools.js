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
 * Unified Node Management Tool - Consolidates all node-related operations
 */
export var nodeTools = [
    {
        name: 'node_manager',
        description: 'Unified tool for all node operations: create, delete, update properties, inspect, and batch operations',
        parameters: z.object({
            operation: z.enum(['create', 'delete', 'update_property', 'get_properties', 'list_children', 'batch_update'])
                .describe('Type of node operation to perform'),
            node_path: z.string().optional()
                .describe('Path to the target node (required for most operations)'),
            node_type: z.string().optional()
                .describe('Type of node to create (required for create operation)'),
            node_name: z.string().optional()
                .describe('Name for new node (required for create operation)'),
            property: z.string().optional()
                .describe('Property name to update (required for update_property)'),
            value: z.any().optional()
                .describe('New value for property (required for update_property)'),
            // Batch operations
            operations: z.array(z.object({
                nodePattern: z.string().describe('Pattern to match nodes'),
                property: z.string().describe('Property to modify'),
                value: z.any().describe('New value for the property'),
                condition: z.string().optional().describe('Optional condition to filter nodes')
            })).optional()
                .describe('Array of property operations for batch_update'),
            // Intelligent creation options
            context: z.string().optional()
                .describe('Context description for intelligent placement'),
            position: z.object({ x: z.number(), y: z.number() }).optional()
                .describe('Specific position for the node'),
            autoPosition: z.boolean().optional().default(true)
                .describe('Whether to automatically determine optimal position'),
            suggestedName: z.string().optional()
                .describe('Suggested name for the node'),
            // General options
            preview: z.boolean().optional().default(false)
                .describe('Whether to preview changes without applying them')
        }),
        execute: function (params) { return __awaiter(void 0, void 0, void 0, function () {
            var godot, _a, result, response, result, result, result, formattedProperties, result, formattedChildren, scenePath, result, response_1, error_1;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        godot = getGodotConnection();
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 18, , 19]);
                        _a = params.operation;
                        switch (_a) {
                            case 'create': return [3 /*break*/, 2];
                            case 'delete': return [3 /*break*/, 6];
                            case 'update_property': return [3 /*break*/, 8];
                            case 'get_properties': return [3 /*break*/, 10];
                            case 'list_children': return [3 /*break*/, 12];
                            case 'batch_update': return [3 /*break*/, 14];
                        }
                        return [3 /*break*/, 16];
                    case 2:
                        if (!params.node_path || !params.node_type || !params.node_name) {
                            throw new Error('node_path, node_type, and node_name are required for create operation');
                        }
                        if (!(params.context || params.position || params.suggestedName)) return [3 /*break*/, 4];
                        return [4 /*yield*/, godot.sendCommand('intelligent_node_creation', {
                                scenePath: params.node_path.split('/').slice(0, -1).join('/') || 'res://',
                                nodeType: params.node_type,
                                context: params.context,
                                position: params.position,
                                autoPosition: params.autoPosition,
                                suggestedName: params.suggestedName || params.node_name
                            })];
                    case 3:
                        result = _b.sent();
                        response = "Created ".concat(params.node_type, " node \"").concat(result.node_name, "\" at ").concat(result.node_path);
                        if (result.position) {
                            response += "\nPosition: (".concat(result.position.x, ", ").concat(result.position.y, ")");
                        }
                        return [2 /*return*/, response];
                    case 4: return [4 /*yield*/, godot.sendCommand('create_node', {
                            parent_path: params.node_path,
                            node_type: params.node_type,
                            node_name: params.node_name,
                        })];
                    case 5:
                        result = _b.sent();
                        return [2 /*return*/, "Created ".concat(params.node_type, " node named \"").concat(params.node_name, "\" at ").concat(result.node_path)];
                    case 6:
                        if (!params.node_path) {
                            throw new Error('node_path is required for delete operation');
                        }
                        return [4 /*yield*/, godot.sendCommand('delete_node', { node_path: params.node_path })];
                    case 7:
                        _b.sent();
                        return [2 /*return*/, "Deleted node at ".concat(params.node_path)];
                    case 8:
                        if (!params.node_path || !params.property) {
                            throw new Error('node_path and property are required for update_property operation');
                        }
                        return [4 /*yield*/, godot.sendCommand('update_node_property', {
                                node_path: params.node_path,
                                property: params.property,
                                value: params.value,
                            })];
                    case 9:
                        result = _b.sent();
                        return [2 /*return*/, "Updated property \"".concat(params.property, "\" of node at ").concat(params.node_path, " to ").concat(JSON.stringify(params.value))];
                    case 10:
                        if (!params.node_path) {
                            throw new Error('node_path is required for get_properties operation');
                        }
                        return [4 /*yield*/, godot.sendCommand('get_node_properties', { node_path: params.node_path })];
                    case 11:
                        result = _b.sent();
                        formattedProperties = Object.entries(result.properties)
                            .map(function (_a) {
                            var key = _a[0], value = _a[1];
                            return "".concat(key, ": ").concat(JSON.stringify(value));
                        })
                            .join('\n');
                        return [2 /*return*/, "Properties of node at ".concat(params.node_path, ":\n\n").concat(formattedProperties)];
                    case 12:
                        if (!params.node_path) {
                            throw new Error('node_path is required for list_children operation');
                        }
                        return [4 /*yield*/, godot.sendCommand('list_nodes', { parent_path: params.node_path })];
                    case 13:
                        result = _b.sent();
                        if (result.children.length === 0) {
                            return [2 /*return*/, "No child nodes found under ".concat(params.node_path)];
                        }
                        formattedChildren = result.children
                            .map(function (child) { return "".concat(child.name, " (").concat(child.type, ") - ").concat(child.path); })
                            .join('\n');
                        return [2 /*return*/, "Children of node at ".concat(params.node_path, ":\n\n").concat(formattedChildren)];
                    case 14:
                        if (!params.operations || !Array.isArray(params.operations)) {
                            throw new Error('operations array is required for batch_update operation');
                        }
                        scenePath = params.node_path ? params.node_path.split('/').slice(0, -1).join('/') || 'res://' : 'res://';
                        return [4 /*yield*/, godot.sendCommand('node_property_automation', {
                                scenePath: scenePath,
                                operations: params.operations,
                                preview: params.preview
                            })];
                    case 15:
                        result = _b.sent();
                        response_1 = params.preview ? 'PREVIEW MODE - No changes applied\n\n' : 'Batch changes applied successfully\n\n';
                        response_1 += "Operations performed:\n";
                        if (result.results && Array.isArray(result.results)) {
                            result.results.forEach(function (opResult, index) {
                                var operation = opResult.operation || {};
                                response_1 += "".concat(index + 1, ". ").concat(operation.nodePattern || 'Unknown', " -> ").concat(operation.property || 'Unknown', " = ").concat(JSON.stringify(operation.value), "\n");
                                response_1 += "   Success: ".concat(opResult.success ? 'Yes' : 'No', "\n");
                                if (opResult.error)
                                    response_1 += "   Error: ".concat(opResult.error, "\n");
                                if (opResult.nodes_affected !== undefined)
                                    response_1 += "   Affected nodes: ".concat(opResult.nodes_affected, "\n");
                            });
                        }
                        if (result.warnings && result.warnings.length > 0) {
                            response_1 += "\nWarnings:\n".concat(result.warnings.map(function (w) { return "- ".concat(w); }).join('\n'));
                        }
                        return [2 /*return*/, response_1];
                    case 16: throw new Error("Unknown operation: ".concat(params.operation));
                    case 17: return [3 /*break*/, 19];
                    case 18:
                        error_1 = _b.sent();
                        throw new Error("Node manager operation failed: ".concat(error_1.message));
                    case 19: return [2 /*return*/];
                }
            });
        }); },
    },
];
//# sourceMappingURL=node_tools.js.map