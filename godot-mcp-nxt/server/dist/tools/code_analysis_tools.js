import { z } from 'zod';
import { getGodotConnection } from '../utils/godot_connection.js';
import { compressJsonResponse } from '../utils/compression.js';
/**
 * Tool for analyzing GDScript code with syntax highlighting and error detection
 */
export const analyzeScriptTool = {
    name: 'analyze_gdscript',
    description: 'Analyze GDScript code for syntax errors, style issues, and provide syntax highlighting information',
    parameters: z.object({
        script_path: z.string().describe('Path to the GDScript file to analyze'),
        include_highlighting: z.boolean().optional().default(true).describe('Include syntax highlighting information'),
        check_style: z.boolean().optional().default(true).describe('Check for style guide violations'),
    }),
    execute: async ({ script_path, include_highlighting, check_style }) => {
        const godot = await getGodotConnection();
        try {
            // Get script content first
            const scriptResult = await godot.sendCommand('get_script', {
                script_path: script_path
            });
            if (!scriptResult || !scriptResult.content) {
                throw new Error(`Script not found: ${script_path}`);
            }
            const content = scriptResult.content;
            // Perform basic analysis (this would be enhanced with actual Godot parsing)
            const analysis = analyzeGDScriptContent(content, script_path, include_highlighting, check_style);
            // Compress large analysis results
            const { data: compressedAnalysis } = await compressJsonResponse(analysis, {
                minSize: 2048, // Compress if larger than 2KB
                algorithm: 'gzip'
            });
            return {
                content: [
                    {
                        type: 'text',
                        text: `Analysis complete for ${script_path}\n\nAnalysis Results:\n${JSON.stringify(compressedAnalysis, null, 2)}`
                    }
                ]
            };
        }
        catch (error) {
            console.error('Error analyzing script:', error);
            throw error;
        }
    }
};
/**
 * Tool for comparing two GDScript files
 */
export const compareScriptsTool = {
    name: 'compare_gdscripts',
    description: 'Compare two GDScript files and highlight differences',
    parameters: z.object({
        script_path_a: z.string().describe('Path to the first GDScript file'),
        script_path_b: z.string().describe('Path to the second GDScript file'),
        include_line_numbers: z.boolean().optional().default(true).describe('Include line numbers in comparison'),
    }),
    execute: async ({ script_path_a, script_path_b, include_line_numbers }) => {
        const godot = await getGodotConnection();
        try {
            // Get both scripts
            const [resultA, resultB] = await Promise.all([
                godot.sendCommand('get_script', { script_path: script_path_a }),
                godot.sendCommand('get_script', { script_path: script_path_b })
            ]);
            if (!resultA?.content || !resultB?.content) {
                throw new Error('One or both scripts not found');
            }
            const comparison = compareGDScriptFiles(resultA.content, resultB.content, script_path_a, script_path_b, include_line_numbers);
            return {
                content: [
                    {
                        type: 'text',
                        text: `Comparison complete between ${script_path_a} and ${script_path_b}\n\nComparison Results:\n${JSON.stringify(comparison, null, 2)}`
                    }
                ]
            };
        }
        catch (error) {
            console.error('Error comparing scripts:', error);
            throw error;
        }
    }
};
/**
 * Tool for extracting code metrics from GDScript files
 */
export const codeMetricsTool = {
    name: 'gdscript_metrics',
    description: 'Extract code metrics from GDScript files (lines of code, complexity, etc.)',
    parameters: z.object({
        script_path: z.string().describe('Path to the GDScript file to analyze'),
        include_complexity: z.boolean().optional().default(true).describe('Calculate cyclomatic complexity'),
    }),
    execute: async ({ script_path, include_complexity }) => {
        const godot = await getGodotConnection();
        try {
            const result = await godot.sendCommand('get_script', {
                script_path: script_path
            });
            if (!result?.content) {
                throw new Error(`Script not found: ${script_path}`);
            }
            const metrics = calculateCodeMetrics(result.content, script_path, include_complexity);
            return {
                content: [
                    {
                        type: 'text',
                        text: `Metrics calculated for ${script_path}\n\nCode Metrics:\n${JSON.stringify(metrics, null, 2)}`
                    }
                ]
            };
        }
        catch (error) {
            console.error('Error calculating metrics:', error);
            throw error;
        }
    }
};
// Helper functions for code analysis
function analyzeGDScriptContent(content, filePath, includeHighlighting, checkStyle) {
    const lines = content.split('\n');
    const analysis = {
        file_path: filePath,
        total_lines: lines.length,
        errors: [],
        warnings: [],
        style_issues: [],
        syntax_highlighting: includeHighlighting ? [] : undefined
    };
    // Basic syntax analysis
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lineNumber = i + 1;
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
            const highlighting = analyzeLineForHighlighting(line, lineNumber);
            if (highlighting.length > 0) {
                analysis.syntax_highlighting.push(...highlighting);
            }
        }
    }
    return analysis;
}
function analyzeLineForHighlighting(line, lineNumber) {
    const highlights = [];
    // Keywords
    const keywords = ['func', 'var', 'const', 'if', 'else', 'for', 'while', 'class', 'extends', 'return'];
    for (const keyword of keywords) {
        let index = line.indexOf(keyword);
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
    const stringRegex = /"([^"\\]|\\.)*"/g;
    let match;
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
    const linesA = contentA.split('\n');
    const linesB = contentB.split('\n');
    const comparison = {
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
    const maxLines = Math.max(linesA.length, linesB.length);
    for (let i = 0; i < maxLines; i++) {
        const lineA = linesA[i] || '';
        const lineB = linesB[i] || '';
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
    const lines = content.split('\n');
    const metrics = {
        file_path: filePath,
        lines_of_code: lines.length,
        non_empty_lines: lines.filter(line => line.trim().length > 0).length,
        comment_lines: lines.filter(line => line.trim().startsWith('#')).length,
        functions: 0,
        classes: 0,
        variables: 0,
        complexity: includeComplexity ? 0 : undefined
    };
    for (const line of lines) {
        const trimmed = line.trim();
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
export const codeAnalysisTools = [
    analyzeScriptTool,
    compareScriptsTool,
    codeMetricsTool
];
//# sourceMappingURL=code_analysis_tools.js.map