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
 * Tool for analyzing GDScript code with syntax highlighting and error detection
 */
export var analyzeScriptTool = {
    name: 'analyze_gdscript',
    description: 'Analyze GDScript code for syntax errors, style issues, and provide syntax highlighting information',
    parameters: z.object({
        script_path: z.string().describe('Path to the GDScript file to analyze'),
        include_highlighting: z.boolean().optional().default(true).describe('Include syntax highlighting information'),
        check_style: z.boolean().optional().default(true).describe('Check for style guide violations'),
    }),
    execute: function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
        var godot, scriptResult, content, analysis, compressedAnalysis, error_1;
        var script_path = _b.script_path, include_highlighting = _b.include_highlighting, check_style = _b.check_style;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    godot = getGodotConnection();
                    _c.label = 1;
                case 1:
                    _c.trys.push([1, 4, , 5]);
                    return [4 /*yield*/, godot.sendCommand('get_script', {
                            script_path: script_path
                        })];
                case 2:
                    scriptResult = _c.sent();
                    if (!scriptResult || !scriptResult.content) {
                        throw new Error("Script not found: ".concat(script_path));
                    }
                    content = scriptResult.content;
                    analysis = analyzeGDScriptContent(content, script_path, include_highlighting, check_style);
                    return [4 /*yield*/, compressJsonResponse(analysis, {
                            minSize: 2048, // Compress if larger than 2KB
                            algorithm: 'gzip'
                        })];
                case 3:
                    compressedAnalysis = (_c.sent()).data;
                    return [2 /*return*/, {
                            content: [
                                {
                                    type: 'text',
                                    text: "Analysis complete for ".concat(script_path, "\n\nAnalysis Results:\n").concat(JSON.stringify(compressedAnalysis, null, 2))
                                }
                            ]
                        }];
                case 4:
                    error_1 = _c.sent();
                    console.error('Error analyzing script:', error_1);
                    throw error_1;
                case 5: return [2 /*return*/];
            }
        });
    }); }
};
/**
 * Tool for comparing two GDScript files
 */
export var compareScriptsTool = {
    name: 'compare_gdscripts',
    description: 'Compare two GDScript files and highlight differences',
    parameters: z.object({
        script_path_a: z.string().describe('Path to the first GDScript file'),
        script_path_b: z.string().describe('Path to the second GDScript file'),
        include_line_numbers: z.boolean().optional().default(true).describe('Include line numbers in comparison'),
    }),
    execute: function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
        var godot, _c, resultA, resultB, comparison, error_2;
        var script_path_a = _b.script_path_a, script_path_b = _b.script_path_b, include_line_numbers = _b.include_line_numbers;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    godot = getGodotConnection();
                    _d.label = 1;
                case 1:
                    _d.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, Promise.all([
                            godot.sendCommand('get_script', { script_path: script_path_a }),
                            godot.sendCommand('get_script', { script_path: script_path_b })
                        ])];
                case 2:
                    _c = _d.sent(), resultA = _c[0], resultB = _c[1];
                    if (!(resultA === null || resultA === void 0 ? void 0 : resultA.content) || !(resultB === null || resultB === void 0 ? void 0 : resultB.content)) {
                        throw new Error('One or both scripts not found');
                    }
                    comparison = compareGDScriptFiles(resultA.content, resultB.content, script_path_a, script_path_b, include_line_numbers);
                    return [2 /*return*/, {
                            content: [
                                {
                                    type: 'text',
                                    text: "Comparison complete between ".concat(script_path_a, " and ").concat(script_path_b, "\n\nComparison Results:\n").concat(JSON.stringify(comparison, null, 2))
                                }
                            ]
                        }];
                case 3:
                    error_2 = _d.sent();
                    console.error('Error comparing scripts:', error_2);
                    throw error_2;
                case 4: return [2 /*return*/];
            }
        });
    }); }
};
/**
 * Tool for extracting code metrics from GDScript files
 */
export var codeMetricsTool = {
    name: 'gdscript_metrics',
    description: 'Extract code metrics from GDScript files (lines of code, complexity, etc.)',
    parameters: z.object({
        script_path: z.string().describe('Path to the GDScript file to analyze'),
        include_complexity: z.boolean().optional().default(true).describe('Calculate cyclomatic complexity'),
    }),
    execute: function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
        var godot, result, metrics, error_3;
        var script_path = _b.script_path, include_complexity = _b.include_complexity;
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
                    result = _c.sent();
                    if (!(result === null || result === void 0 ? void 0 : result.content)) {
                        throw new Error("Script not found: ".concat(script_path));
                    }
                    metrics = calculateCodeMetrics(result.content, script_path, include_complexity);
                    return [2 /*return*/, {
                            content: [
                                {
                                    type: 'text',
                                    text: "Metrics calculated for ".concat(script_path, "\n\nCode Metrics:\n").concat(JSON.stringify(metrics, null, 2))
                                }
                            ]
                        }];
                case 3:
                    error_3 = _c.sent();
                    console.error('Error calculating metrics:', error_3);
                    throw error_3;
                case 4: return [2 /*return*/];
            }
        });
    }); }
};
// Helper functions for code analysis
function analyzeGDScriptContent(content, filePath, includeHighlighting, checkStyle) {
    var _a;
    var lines = content.split('\n');
    var analysis = {
        file_path: filePath,
        total_lines: lines.length,
        errors: [],
        warnings: [],
        style_issues: [],
        syntax_highlighting: includeHighlighting ? [] : undefined
    };
    // Basic syntax analysis
    for (var i = 0; i < lines.length; i++) {
        var line = lines[i];
        var lineNumber = i + 1;
        // Check for basic syntax issues
        if (line.includes('var ') && !line.includes(':')) {
            analysis.warnings.push({
                line: lineNumber,
                message: 'Variable declaration without type hint',
                severity: 'warning'
            });
        }
        // Check for long lines
        if (checkStyle && line.length > 100) {
            analysis.style_issues.push({
                line: lineNumber,
                message: 'Line too long (>100 characters)',
                severity: 'style'
            });
        }
        // Basic syntax highlighting (simplified)
        if (includeHighlighting) {
            var highlighting = analyzeLineForHighlighting(line, lineNumber);
            if (highlighting.length > 0) {
                (_a = analysis.syntax_highlighting).push.apply(_a, highlighting);
            }
        }
    }
    return analysis;
}
function analyzeLineForHighlighting(line, lineNumber) {
    var highlights = [];
    // Keywords
    var keywords = ['func', 'var', 'const', 'if', 'else', 'for', 'while', 'class', 'extends', 'return'];
    for (var _i = 0, keywords_1 = keywords; _i < keywords_1.length; _i++) {
        var keyword = keywords_1[_i];
        var index = line.indexOf(keyword);
        while (index !== -1) {
            highlights.push({
                line: lineNumber,
                start: index,
                end: index + keyword.length,
                type: 'keyword'
            });
            index = line.indexOf(keyword, index + 1);
        }
    }
    // Strings
    var stringRegex = /"([^"\\]|\\.)*"/g;
    var match;
    while ((match = stringRegex.exec(line)) !== null) {
        highlights.push({
            line: lineNumber,
            start: match.index,
            end: match.index + match[0].length,
            type: 'string'
        });
    }
    return highlights;
}
function compareGDScriptFiles(contentA, contentB, pathA, pathB, includeLineNumbers) {
    var linesA = contentA.split('\n');
    var linesB = contentB.split('\n');
    var comparison = {
        file_a: pathA,
        file_b: pathB,
        differences: [],
        summary: {
            lines_a: linesA.length,
            lines_b: linesB.length,
            additions: 0,
            deletions: 0,
            modifications: 0
        }
    };
    var maxLines = Math.max(linesA.length, linesB.length);
    for (var i = 0; i < maxLines; i++) {
        var lineA = linesA[i] || '';
        var lineB = linesB[i] || '';
        if (lineA !== lineB) {
            if (!lineA) {
                comparison.differences.push({
                    type: 'addition',
                    line: includeLineNumbers ? i + 1 : i,
                    content: lineB
                });
                comparison.summary.additions++;
            }
            else if (!lineB) {
                comparison.differences.push({
                    type: 'deletion',
                    line: includeLineNumbers ? i + 1 : i,
                    content: lineA
                });
                comparison.summary.deletions++;
            }
            else {
                comparison.differences.push({
                    type: 'modification',
                    line: includeLineNumbers ? i + 1 : i,
                    content_a: lineA,
                    content_b: lineB
                });
                comparison.summary.modifications++;
            }
        }
    }
    return comparison;
}
function calculateCodeMetrics(content, filePath, includeComplexity) {
    var lines = content.split('\n');
    var metrics = {
        file_path: filePath,
        lines_of_code: lines.length,
        non_empty_lines: lines.filter(function (line) { return line.trim().length > 0; }).length,
        comment_lines: lines.filter(function (line) { return line.trim().startsWith('#'); }).length,
        functions: 0,
        classes: 0,
        variables: 0,
        complexity: includeComplexity ? 0 : undefined
    };
    for (var _i = 0, lines_1 = lines; _i < lines_1.length; _i++) {
        var line = lines_1[_i];
        var trimmed = line.trim();
        if (trimmed.startsWith('func ')) {
            metrics.functions++;
        }
        if (trimmed.startsWith('class ') || trimmed.startsWith('class_name ')) {
            metrics.classes++;
        }
        if (trimmed.startsWith('var ') || trimmed.startsWith('const ')) {
            metrics.variables++;
        }
        // Simple complexity calculation (control structures)
        if (includeComplexity && (trimmed.startsWith('if ') || trimmed.startsWith('for ') ||
            trimmed.startsWith('while ') || trimmed.startsWith('elif '))) {
            metrics.complexity++;
        }
    }
    return metrics;
}
export var codeAnalysisTools = [
    analyzeScriptTool,
    compareScriptsTool,
    codeMetricsTool
];
//# sourceMappingURL=code_analysis_tools.js.map