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
import { compressJsonResponse } from '../utils/compression.js';
/**
 * Tool for analyzing scene performance metrics
 */
export var analyzeScenePerformanceTool = {
    name: 'analyze_scene_performance',
    description: 'Analyze Godot scene performance including node count, draw calls, and potential optimizations',
    parameters: z.object({
        scene_path: z.string().describe('Path to the scene file to analyze'),
        include_detailed_breakdown: z.boolean().optional().default(false).describe('Include detailed node-by-node performance breakdown'),
    }),
    annotations: {
        streamingHint: true,
    },
    execute: function (args, context) { return __awaiter(void 0, void 0, void 0, function () {
        var scene_path, include_detailed_breakdown, _a, reportProgress, streamContent, godot, sceneResult, analysis, compressedAnalysis, error_1;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    scene_path = args.scene_path, include_detailed_breakdown = args.include_detailed_breakdown;
                    _a = context || {}, reportProgress = _a.reportProgress, streamContent = _a.streamContent;
                    godot = getGodotConnection();
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 16, , 17]);
                    if (!streamContent) return [3 /*break*/, 3];
                    return [4 /*yield*/, streamContent({ type: 'text', text: "Starting performance analysis for scene: ".concat(scene_path, "\n") })];
                case 2:
                    _b.sent();
                    _b.label = 3;
                case 3:
                    if (!reportProgress) return [3 /*break*/, 5];
                    return [4 /*yield*/, reportProgress({ progress: 10, total: 100 })];
                case 4:
                    _b.sent();
                    _b.label = 5;
                case 5: return [4 /*yield*/, godot.sendCommand('get_scene_structure', {
                        path: scene_path
                    })];
                case 6:
                    sceneResult = _b.sent();
                    if (!streamContent) return [3 /*break*/, 8];
                    return [4 /*yield*/, streamContent({ type: 'text', text: 'Retrieved scene structure, analyzing nodes...\n' })];
                case 7:
                    _b.sent();
                    _b.label = 8;
                case 8:
                    if (!reportProgress) return [3 /*break*/, 10];
                    return [4 /*yield*/, reportProgress({ progress: 30, total: 100 })];
                case 9:
                    _b.sent();
                    _b.label = 10;
                case 10:
                    analysis = analyzeScenePerformance(sceneResult, include_detailed_breakdown);
                    if (!streamContent) return [3 /*break*/, 12];
                    return [4 /*yield*/, streamContent({ type: 'text', text: 'Performance analysis complete.\n' })];
                case 11:
                    _b.sent();
                    _b.label = 12;
                case 12:
                    if (!reportProgress) return [3 /*break*/, 14];
                    return [4 /*yield*/, reportProgress({ progress: 100, total: 100 })];
                case 13:
                    _b.sent();
                    _b.label = 14;
                case 14: return [4 /*yield*/, compressJsonResponse(analysis, {
                        minSize: 2048, // Compress if larger than 2KB
                        algorithm: 'gzip'
                    })];
                case 15:
                    compressedAnalysis = (_b.sent()).data;
                    return [2 /*return*/, {
                            content: [
                                {
                                    type: 'text',
                                    text: "Performance analysis completed for ".concat(scene_path, "\n\nAnalysis Results:\n").concat(JSON.stringify(compressedAnalysis, null, 2))
                                }
                            ]
                        }];
                case 16:
                    error_1 = _b.sent();
                    console.error('Error analyzing scene performance:', error_1);
                    throw error_1;
                case 17: return [2 /*return*/];
            }
        });
    }); }
};
/**
 * Tool for analyzing script performance
 */
export var analyzeScriptPerformanceTool = {
    name: 'analyze_script_performance',
    description: 'Analyze GDScript performance including function complexity, potential bottlenecks, and optimization suggestions',
    parameters: z.object({
        script_path: z.string().describe('Path to the script file to analyze'),
        include_complexity_analysis: z.boolean().optional().default(true).describe('Include cyclomatic complexity analysis'),
    }),
    execute: function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
        var godot, scriptResult, analysis, error_2;
        var script_path = _b.script_path, include_complexity_analysis = _b.include_complexity_analysis;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    godot = getGodotConnection();
                    _c.label = 1;
                case 1:
                    _c.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, godot.sendCommand('get_script', {
                            script_path: script_path
                        })];
                case 2:
                    scriptResult = _c.sent();
                    if (!(scriptResult === null || scriptResult === void 0 ? void 0 : scriptResult.content)) {
                        throw new Error("Script not found: ".concat(script_path));
                    }
                    analysis = analyzeScriptPerformance(scriptResult.content, script_path, include_complexity_analysis);
                    return [2 /*return*/, {
                            content: [
                                {
                                    type: 'text',
                                    text: "Script performance analysis completed for ".concat(script_path, "\n\nAnalysis Results:\n").concat(JSON.stringify(analysis, null, 2))
                                }
                            ]
                        }];
                case 3:
                    error_2 = _c.sent();
                    console.error('Error analyzing script performance:', error_2);
                    throw error_2;
                case 4: return [2 /*return*/];
            }
        });
    }); }
};
/**
 * Tool for getting real-time performance metrics
 */
export var getRealtimePerformanceMetricsTool = {
    name: 'get_realtime_performance_metrics',
    description: 'Get current Godot engine performance metrics (FPS, memory usage, draw calls, etc.)',
    parameters: z.object({
        include_system_info: z.boolean().optional().default(false).describe('Include system information and hardware details'),
    }),
    execute: function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
        var godot, metricsResult, metrics, error_3;
        var include_system_info = _b.include_system_info;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    godot = getGodotConnection();
                    _c.label = 1;
                case 1:
                    _c.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, godot.sendCommand('get_performance_metrics', {
                            include_system_info: include_system_info
                        })];
                case 2:
                    metricsResult = _c.sent();
                    metrics = {
                        timestamp: new Date().toISOString(),
                        fps: metricsResult.fps || 0,
                        frame_time: metricsResult.frame_time || 0,
                        memory_usage: metricsResult.memory_usage || 0,
                        draw_calls: metricsResult.draw_calls || 0,
                        objects_drawn: metricsResult.objects_drawn || 0,
                        vertices_drawn: metricsResult.vertices_drawn || 0,
                        system_info: include_system_info ? metricsResult.system_info : undefined
                    };
                    return [2 /*return*/, {
                            content: [
                                {
                                    type: 'text',
                                    text: "Current performance metrics - FPS: ".concat(metrics.fps, ", Memory: ").concat(Math.round(metrics.memory_usage / 1024 / 1024), "MB, Draw Calls: ").concat(metrics.draw_calls, "\n\nDetailed Metrics:\n").concat(JSON.stringify(metrics, null, 2))
                                }
                            ]
                        }];
                case 3:
                    error_3 = _c.sent();
                    console.error('Error getting performance metrics:', error_3);
                    throw error_3;
                case 4: return [2 /*return*/];
            }
        });
    }); }
};
// Helper functions for performance analysis
function analyzeScenePerformance(sceneData, detailed) {
    var analysis = {
        scene_path: sceneData.scene_path || 'unknown',
        total_nodes: 0,
        performance_score: 0,
        issues: [],
        recommendations: [],
        breakdown: detailed ? [] : undefined
    };
    // Handle different response formats
    var sceneNodes;
    if (sceneData.nodes) {
        sceneNodes = sceneData.nodes;
    }
    else if (sceneData.structure) {
        sceneNodes = sceneData.structure;
    }
    else {
        analysis.issues.push({
            type: 'error',
            message: 'No scene data available for analysis'
        });
        return analysis;
    }
    // Analyze nodes recursively
    function analyzeNode(node, depth) {
        var _a, _b;
        if (depth === void 0) { depth = 0; }
        analysis.total_nodes++;
        var nodeAnalysis = {
            name: node.name,
            type: node.type,
            depth: depth,
            issues: [],
            score: 100
        };
        // Check for performance issues
        if (node.type === 'Sprite2D' && !node.texture) {
            nodeAnalysis.issues.push('Sprite2D without texture');
            nodeAnalysis.score -= 20;
        }
        if (node.type === 'RigidBody2D' && ((_a = node.children) === null || _a === void 0 ? void 0 : _a.length) > 10) {
            nodeAnalysis.issues.push('RigidBody2D with many children - consider optimization');
            nodeAnalysis.score -= 15;
        }
        if (node.type === 'AnimationPlayer' && ((_b = node.animations) === null || _b === void 0 ? void 0 : _b.length) > 20) {
            nodeAnalysis.issues.push('Many animations - consider splitting into multiple players');
            nodeAnalysis.score -= 10;
        }
        // Analyze children
        if (node.children) {
            for (var _i = 0, _c = node.children; _i < _c.length; _i++) {
                var child = _c[_i];
                var childAnalysis = analyzeNode(child, depth + 1);
                nodeAnalysis.score = Math.min(nodeAnalysis.score, childAnalysis.score);
            }
        }
        if (detailed && nodeAnalysis.issues.length > 0) {
            analysis.breakdown.push(nodeAnalysis);
        }
        return nodeAnalysis;
    }
    var rootAnalysis = analyzeNode(sceneNodes);
    analysis.performance_score = rootAnalysis.score;
    // Generate recommendations
    if (analysis.total_nodes > 1000) {
        analysis.recommendations.push({
            priority: 'high',
            message: 'Scene has many nodes - consider scene instancing or optimization'
        });
    }
    if (analysis.performance_score < 70) {
        analysis.recommendations.push({
            priority: 'medium',
            message: 'Performance score is low - review node structure and remove unnecessary elements'
        });
    }
    return analysis;
}
function analyzeScriptPerformance(content, filePath, includeComplexity) {
    var lines = content.split('\n');
    var analysis = {
        script_path: filePath,
        total_lines: lines.length,
        functions: [],
        complexity_score: 0,
        issues: [],
        recommendations: []
    };
    var currentFunction = null;
    var braceDepth = 0;
    for (var i = 0; i < lines.length; i++) {
        var line = lines[i].trim();
        var originalLine = lines[i];
        // Function detection
        var funcMatch = line.match(/^func\s+(\w+)\s*\(/);
        if (funcMatch) {
            if (currentFunction) {
                // Finalize previous function
                currentFunction.end_line = i;
                currentFunction.complexity = calculateFunctionComplexity(currentFunction.lines);
                analysis.functions.push(currentFunction);
            }
            currentFunction = {
                name: funcMatch[1],
                start_line: i + 1,
                lines: [],
                complexity: 0
            };
        }
        // Track braces for function boundaries
        var openBraces = (line.match(/\{/g) || []).length;
        var closeBraces = (line.match(/\}/g) || []).length;
        braceDepth += openBraces - closeBraces;
        if (currentFunction && braceDepth > 0) {
            currentFunction.lines.push(originalLine);
        }
        // End of function
        if (currentFunction && braceDepth === 0 && currentFunction.lines.length > 0) {
            currentFunction.end_line = i + 1;
            currentFunction.complexity = calculateFunctionComplexity(currentFunction.lines);
            analysis.functions.push(currentFunction);
            currentFunction = null;
        }
        // Check for performance issues
        if (line.includes('get_node(') && line.includes('../')) {
            analysis.issues.push({
                line: i + 1,
                type: 'warning',
                message: 'Deep node path lookup - consider caching node reference'
            });
        }
        if (line.includes('find_node(') || line.includes('get_node(')) {
            analysis.issues.push({
                line: i + 1,
                type: 'info',
                message: 'Node lookup in _process or _physics_process - consider caching'
            });
        }
    }
    // Finalize last function
    if (currentFunction) {
        currentFunction.complexity = calculateFunctionComplexity(currentFunction.lines);
        analysis.functions.push(currentFunction);
    }
    // Calculate overall complexity
    if (includeComplexity) {
        analysis.complexity_score = analysis.functions.reduce(function (sum, func) { return sum + func.complexity; }, 0);
    }
    // Generate recommendations
    var highComplexityFunctions = analysis.functions.filter(function (f) { return f.complexity > 10; });
    if (highComplexityFunctions.length > 0) {
        analysis.recommendations.push({
            priority: 'high',
            message: "Functions with high complexity: ".concat(highComplexityFunctions.map(function (f) { return f.name; }).join(', '), " - consider refactoring")
        });
    }
    if (analysis.issues.filter(function (i) { return i.type === 'warning'; }).length > 5) {
        analysis.recommendations.push({
            priority: 'medium',
            message: 'Many performance warnings - review node access patterns'
        });
    }
    return analysis;
}
function calculateFunctionComplexity(lines) {
    var complexity = 1; // Base complexity
    for (var _i = 0, lines_1 = lines; _i < lines_1.length; _i++) {
        var line = lines_1[_i];
        var trimmed = line.trim();
        // Control structures increase complexity
        if (trimmed.startsWith('if ') || trimmed.startsWith('elif ')) {
            complexity++;
        }
        if (trimmed.startsWith('for ') || trimmed.startsWith('while ')) {
            complexity++;
        }
        if (trimmed.includes(' and ') || trimmed.includes(' or ')) {
            complexity++;
        }
        // Nested conditions (simple heuristic)
        var indentLevel = line.length - line.trimStart().length;
        if (indentLevel > 8 && (trimmed.startsWith('if ') || trimmed.startsWith('for ') || trimmed.startsWith('while '))) {
            complexity++;
        }
    }
    return complexity;
}
export var performanceTools = [
    analyzeScenePerformanceTool,
    analyzeScriptPerformanceTool,
    getRealtimePerformanceMetricsTool
];
//# sourceMappingURL=performance_tools.js.map