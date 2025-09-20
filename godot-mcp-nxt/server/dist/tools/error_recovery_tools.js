import { z } from 'zod';
import { getGodotConnection } from '../utils/godot_connection.js';
import { getErrorHandler } from '../utils/enhanced_error_handler.js';
/**
 * Advanced error recovery and analysis tools for Godot MCP
 */
export const errorRecoveryTools = [
    {
        name: 'error_analyzer',
        description: `🔍 ADVANCED ERROR ANALYZER - Intelligent Error Analysis and Recovery

ANALYSIS WORKFLOW:
1. 📋 ANALYZE: Use operation="analyze" to get detailed error analysis with root cause identification
2. 💡 SUGGEST: Use operation="suggest_recovery" to get automated recovery suggestions
3. 🔧 APPLY: Use operation="apply_recovery" to execute recovery strategies
4. 📊 STATS: Use operation="get_statistics" to review error patterns and resolution rates

ERROR ANALYSIS FEATURES:
- Root cause identification using pattern matching
- Severity assessment (low/medium/high/critical)
- Category classification (node/script/scene/resource/performance)
- Similar error detection from history
- Confidence scoring for suggestions

RECOVERY STRATEGIES:
- Automatic fixes for common issues (syntax errors, missing imports)
- Semi-automatic fixes requiring confirmation (type mismatches, path corrections)
- Manual recovery suggestions with step-by-step guidance
- Risk assessment for each recovery option

EXAMPLES:
✅ Analyze error: {operation: "analyze", error_type: "script_error", message: "Undefined variable 'player'"}
✅ Get suggestions: {operation: "suggest_recovery", error_id: "err_123"}
✅ Apply recovery: {operation: "apply_recovery", error_id: "err_123", strategy_index: 0}
✅ Get statistics: {operation: "get_statistics"}

ERROR CATEGORIES SUPPORTED:
- Node errors (path issues, missing nodes, invalid types)
- Script errors (syntax, compilation, runtime issues)
- Scene errors (missing files, circular references)
- Resource errors (missing assets, invalid formats)
- Performance errors (memory leaks, frame rate drops)`,
        parameters: z.object({
            operation: z.enum(['analyze', 'suggest_recovery', 'apply_recovery', 'get_statistics', 'learn_from_resolution'])
                .describe('Type of error analysis operation to perform'),
            // Error analysis parameters
            error_type: z.string().optional()
                .describe('Type of error (script_error, node_error, etc.)'),
            message: z.string().optional()
                .describe('Error message to analyze'),
            stack_trace: z.string().optional()
                .describe('Stack trace for additional context'),
            context: z.record(z.any()).optional()
                .describe('Additional error context'),
            // Recovery parameters
            error_id: z.string().optional()
                .describe('ID of error to work with (from previous analysis)'),
            strategy_index: z.number().optional()
                .describe('Index of recovery strategy to apply'),
            automatic_only: z.boolean().optional().default(false)
                .describe('Only suggest automatic recovery strategies'),
            // Statistics parameters
            time_range: z.enum(['hour', 'day', 'week', 'month']).optional().default('day')
                .describe('Time range for statistics'),
            category_filter: z.string().optional()
                .describe('Filter statistics by error category')
        }),
        execute: async (params) => {
            const errorHandler = getErrorHandler();
            try {
                switch (params.operation) {
                    case 'analyze': {
                        if (!params.message) {
                            throw new Error('Error message is required for analysis');
                        }
                        const errorContext = {
                            id: `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                            type: params.error_type || 'unknown',
                            message: params.message,
                            stackTrace: params.stack_trace,
                            context: params.context,
                            timestamp: Date.now()
                        };
                        const analysis = await errorHandler.analyzeError(errorContext);
                        return formatErrorAnalysis(analysis);
                    }
                    case 'suggest_recovery': {
                        if (!params.error_id) {
                            throw new Error('Error ID is required for recovery suggestions');
                        }
                        // Find the error in history
                        const stats = errorHandler.getErrorStatistics();
                        const errorRecord = stats.recentErrors.find(record => record.error.id === params.error_id);
                        if (!errorRecord) {
                            throw new Error(`Error with ID ${params.error_id} not found`);
                        }
                        return formatRecoverySuggestions(errorRecord.analysis.suggestions, params.automatic_only);
                    }
                    case 'apply_recovery': {
                        if (!params.error_id || params.strategy_index === undefined) {
                            throw new Error('Error ID and strategy index are required');
                        }
                        const result = await errorHandler.applyRecovery(params.error_id, params.strategy_index);
                        return formatRecoveryResult(result);
                    }
                    case 'get_statistics': {
                        const stats = errorHandler.getErrorStatistics();
                        return formatErrorStatistics(stats, params.time_range, params.category_filter);
                    }
                    case 'learn_from_resolution': {
                        if (!params.error_id) {
                            throw new Error('Error ID is required for learning');
                        }
                        // Find the error and learn from its resolution
                        const stats = errorHandler.getErrorStatistics();
                        const errorRecord = stats.recentErrors.find(record => record.error.id === params.error_id);
                        if (errorRecord && errorRecord.resolved) {
                            errorHandler.learnFromResolution(errorRecord);
                            return `✅ Learned from successful resolution of error ${params.error_id}`;
                        }
                        else {
                            return `❌ Error ${params.error_id} is not resolved or not found`;
                        }
                    }
                    default:
                        throw new Error(`Unknown operation: ${params.operation}`);
                }
            }
            catch (error) {
                throw new Error(`Error recovery operation failed: ${error.message}`);
            }
        },
    },
    {
        name: 'fuzzy_matcher',
        description: `🎯 FUZZY PATH MATCHER - Intelligent Path Resolution and Correction

PATH RESOLUTION WORKFLOW:
1. 🔍 MATCH: Use operation="find_matches" to find similar paths using fuzzy matching
2. ✅ VALIDATE: Use operation="validate_path" to check if a path exists
3. 🔧 CORRECT: Use operation="suggest_corrections" to get path correction suggestions
4. 📊 SCORE: Use operation="get_similarity_score" to see how similar two paths are

FUZZY MATCHING FEATURES:
- Levenshtein distance calculation for string similarity
- Path segment analysis (handle directory vs file differences)
- Case-insensitive matching with smart capitalization
- Context-aware suggestions based on project structure
- Learning from user corrections to improve future matches

PATH TYPES SUPPORTED:
- Node paths (/root/Player/Sprite)
- File paths (res://scenes/main.tscn)
- Script paths (res://scripts/player.gd)
- Resource paths (res://assets/textures/player.png)

EXAMPLES:
✅ Find similar paths: {operation: "find_matches", target_path: "/root/Playr", search_type: "node"}
✅ Validate path: {operation: "validate_path", path: "/root/Player"}
✅ Get corrections: {operation: "suggest_corrections", incorrect_path: "/root/Playr/Sprit"}
✅ Similarity score: {operation: "get_similarity_score", path1: "/root/Player", path2: "/root/Playr"}

ADVANCED FEATURES:
- Multi-segment matching for complex paths
- Project structure awareness
- Common typo pattern recognition
- Learning from successful corrections`,
        parameters: z.object({
            operation: z.enum(['find_matches', 'validate_path', 'suggest_corrections', 'get_similarity_score', 'learn_correction'])
                .describe('Type of fuzzy matching operation to perform'),
            // Path matching parameters
            target_path: z.string().optional()
                .describe('Path to find matches for'),
            search_type: z.enum(['node', 'file', 'script', 'resource', 'all']).optional().default('all')
                .describe('Type of path to search for'),
            max_results: z.number().optional().default(5)
                .describe('Maximum number of matches to return'),
            min_similarity: z.number().optional().default(0.3)
                .describe('Minimum similarity score (0.0 to 1.0)'),
            // Validation parameters
            path: z.string().optional()
                .describe('Path to validate'),
            // Correction parameters
            incorrect_path: z.string().optional()
                .describe('Incorrect path to generate corrections for'),
            // Similarity parameters
            path1: z.string().optional()
                .describe('First path for similarity comparison'),
            path2: z.string().optional()
                .describe('Second path for similarity comparison'),
            // Learning parameters
            original_path: z.string().optional()
                .describe('Original incorrect path'),
            corrected_path: z.string().optional()
                .describe('Corrected path to learn from')
        }),
        execute: async (params) => {
            const godot = await getGodotConnection();
            try {
                switch (params.operation) {
                    case 'find_matches': {
                        if (!params.target_path) {
                            throw new Error('Target path is required for finding matches');
                        }
                        const result = await godot.sendCommand('find_fuzzy_matches', {
                            target_path: params.target_path,
                            search_type: params.search_type,
                            max_results: params.max_results,
                            min_similarity: params.min_similarity
                        });
                        return formatFuzzyMatches(result.matches || []);
                    }
                    case 'validate_path': {
                        if (!params.path) {
                            throw new Error('Path is required for validation');
                        }
                        const result = await godot.sendCommand('validate_path', {
                            path: params.path
                        });
                        return result.result?.exists
                            ? `✅ Path exists: ${params.path}`
                            : `❌ Path not found: ${params.path}`;
                    }
                    case 'suggest_corrections': {
                        if (!params.incorrect_path) {
                            throw new Error('Incorrect path is required for suggestions');
                        }
                        const result = await godot.sendCommand('suggest_path_corrections', {
                            incorrect_path: params.incorrect_path,
                            max_suggestions: params.max_results || 5
                        });
                        return formatPathCorrections(result.suggestions || []);
                    }
                    case 'get_similarity_score': {
                        if (!params.path1 || !params.path2) {
                            throw new Error('Both paths are required for similarity comparison');
                        }
                        const result = await godot.sendCommand('calculate_path_similarity', {
                            path1: params.path1,
                            path2: params.path2
                        });
                        const score = result.result?.similarity || 0;
                        return `🔍 Path Similarity Score: ${(score * 100).toFixed(1)}%\nPath 1: ${params.path1}\nPath 2: ${params.path2}`;
                    }
                    case 'learn_correction': {
                        if (!params.original_path || !params.corrected_path) {
                            throw new Error('Both original and corrected paths are required for learning');
                        }
                        const result = await godot.sendCommand('learn_path_correction', {
                            original_path: params.original_path,
                            corrected_path: params.corrected_path
                        });
                        return `✅ Learned correction pattern:\nFrom: ${params.original_path}\nTo: ${params.corrected_path}`;
                    }
                    default:
                        throw new Error(`Unknown fuzzy matching operation: ${params.operation}`);
                }
            }
            catch (error) {
                throw new Error(`Fuzzy matching operation failed: ${error.message}`);
            }
        },
    }
];
/**
 * Helper functions for formatting error recovery data
 */
function formatErrorAnalysis(analysis) {
    let output = "🔍 **Error Analysis Report**\n\n";
    output += `**Error ID:** ${analysis.error.id}\n`;
    output += `**Type:** ${analysis.error.type}\n`;
    output += `**Severity:** ${analysis.severity.toUpperCase()}\n`;
    output += `**Category:** ${analysis.category}\n`;
    output += `**Confidence:** ${(analysis.confidence * 100).toFixed(1)}%\n\n`;
    output += `**Original Message:**\n${analysis.error.message}\n\n`;
    if (analysis.rootCause) {
        output += `**Root Cause:** ${analysis.rootCause}\n\n`;
    }
    if (analysis.similarErrors && analysis.similarErrors.length > 0) {
        output += `**Similar Errors Found:** ${analysis.similarErrors.length}\n`;
        analysis.similarErrors.slice(0, 3).forEach((error, index) => {
            output += `${index + 1}. ${error.error.message.substring(0, 100)}...\n`;
        });
        output += "\n";
    }
    if (analysis.suggestions && analysis.suggestions.length > 0) {
        output += `**Recovery Suggestions:** ${analysis.suggestions.length} available\n`;
        output += "Use 'suggest_recovery' operation to see detailed options.\n";
    }
    return output;
}
function formatRecoverySuggestions(suggestions, automaticOnly = false) {
    if (!suggestions || suggestions.length === 0) {
        return "❌ No recovery suggestions available for this error.";
    }
    let filteredSuggestions = automaticOnly
        ? suggestions.filter(s => s.strategy.automatic)
        : suggestions;
    if (filteredSuggestions.length === 0) {
        return "❌ No automatic recovery suggestions available.";
    }
    let output = "💡 **Recovery Suggestions**\n\n";
    filteredSuggestions.forEach((suggestion, index) => {
        const strategy = suggestion.strategy;
        output += `${index + 1}. **${strategy.name}**\n`;
        output += `   ${strategy.description}\n`;
        output += `   **Type:** ${strategy.automatic ? 'Automatic' : 'Manual'}\n`;
        output += `   **Risk:** ${strategy.riskLevel}\n`;
        output += `   **Confidence:** ${(suggestion.confidence * 100).toFixed(1)}%\n`;
        output += `   **Est. Time:** ${suggestion.estimatedTime}s\n\n`;
        if (strategy.steps && strategy.steps.length > 0) {
            output += `   **Steps:**\n`;
            strategy.steps.forEach((step, stepIndex) => {
                output += `   ${stepIndex + 1}. ${step}\n`;
            });
            output += "\n";
        }
    });
    output += `**To apply a suggestion:** Use operation="apply_recovery" with strategy_index\n`;
    output += `**Example:** {operation: "apply_recovery", error_id: "err_123", strategy_index: 0}`;
    return output;
}
function formatRecoveryResult(result) {
    if (result.success) {
        let output = "✅ **Recovery Applied Successfully**\n\n";
        output += `**Message:** ${result.message}\n`;
        if (result.changes && result.changes.length > 0) {
            output += "\n**Changes Made:**\n";
            result.changes.forEach((change, index) => {
                output += `${index + 1}. ${change.description}\n`;
            });
        }
        return output;
    }
    else {
        let output = "❌ **Recovery Failed**\n\n";
        output += `**Message:** ${result.message}\n`;
        if (result.error) {
            output += `**Error:** ${result.error.message}\n`;
        }
        return output;
    }
}
function formatErrorStatistics(stats, timeRange, categoryFilter) {
    let output = "📊 **Error Statistics**\n\n";
    output += `**Total Errors:** ${stats.totalErrors}\n`;
    output += `**Resolved Errors:** ${stats.resolvedErrors}\n`;
    output += `**Resolution Rate:** ${stats.resolutionRate.toFixed(1)}%\n\n`;
    if (stats.categoryBreakdown && Object.keys(stats.categoryBreakdown).length > 0) {
        output += "**Errors by Category:**\n";
        Object.entries(stats.categoryBreakdown)
            .sort(([, a], [, b]) => b - a)
            .forEach(([category, count]) => {
            output += `  • ${category}: ${count}\n`;
        });
        output += "\n";
    }
    if (stats.severityBreakdown && Object.keys(stats.severityBreakdown).length > 0) {
        output += "**Errors by Severity:**\n";
        Object.entries(stats.severityBreakdown)
            .sort(([, a], [, b]) => b - a)
            .forEach(([severity, count]) => {
            output += `  • ${severity}: ${count}\n`;
        });
        output += "\n";
    }
    if (stats.recentErrors && stats.recentErrors.length > 0) {
        output += "**Recent Errors:**\n";
        stats.recentErrors.slice(0, 5).forEach((error, index) => {
            const timestamp = new Date(error.timestamp).toLocaleString();
            output += `${index + 1}. [${timestamp}] ${error.analysis.category}: ${error.error.message.substring(0, 80)}...\n`;
        });
    }
    return output;
}
function formatFuzzyMatches(matches) {
    if (!matches || matches.length === 0) {
        return "❌ No similar paths found.";
    }
    let output = "🎯 **Fuzzy Path Matches**\n\n";
    matches.forEach((match, index) => {
        output += `${index + 1}. **${match.path}**\n`;
        output += `   Similarity: ${(match.similarity * 100).toFixed(1)}%\n`;
        output += `   Type: ${match.type}\n`;
        if (match.suggestions && match.suggestions.length > 0) {
            output += `   Suggestions: ${match.suggestions.join(', ')}\n`;
        }
        output += "\n";
    });
    return output;
}
function formatPathCorrections(suggestions) {
    if (!suggestions || suggestions.length === 0) {
        return "❌ No correction suggestions available.";
    }
    let output = "🔧 **Path Correction Suggestions**\n\n";
    suggestions.forEach((suggestion, index) => {
        output += `${index + 1}. **${suggestion.corrected_path}**\n`;
        output += `   Original: ${suggestion.original_path}\n`;
        output += `   Confidence: ${(suggestion.confidence * 100).toFixed(1)}%\n`;
        output += `   Reason: ${suggestion.reason}\n\n`;
    });
    return output;
}
//# sourceMappingURL=error_recovery_tools.js.map