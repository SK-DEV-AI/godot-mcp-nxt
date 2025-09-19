import { getGodotConnection } from './godot_connection.js';
/**
 * Enhanced error handling and recovery system for Godot MCP
 */
export class EnhancedErrorHandler {
    constructor() {
        this.errorPatterns = new Map();
        this.recoveryStrategies = new Map();
        this.errorHistory = [];
        this.maxHistorySize = 100;
        this.initializeErrorPatterns();
        this.initializeRecoveryStrategies();
    }
    /**
     * Analyze an error and provide recovery suggestions
     */
    async analyzeError(error) {
        const analysis = {
            error: error,
            severity: this.determineSeverity(error),
            category: this.categorizeError(error),
            rootCause: await this.identifyRootCause(error),
            suggestions: [],
            similarErrors: this.findSimilarErrors(error),
            confidence: 0
        };
        // Get recovery strategies for this error category
        const strategies = this.recoveryStrategies.get(analysis.category) || [];
        analysis.suggestions = await this.generateSuggestions(error, strategies);
        // Calculate confidence based on pattern matching
        analysis.confidence = this.calculateConfidence(error, analysis);
        // Store in history
        this.storeErrorRecord({
            timestamp: Date.now(),
            error: error,
            analysis: analysis,
            resolved: false
        });
        return analysis;
    }
    /**
     * Apply a recovery strategy
     */
    async applyRecovery(errorId, strategyIndex) {
        const errorRecord = this.errorHistory.find(record => record.error.id === errorId);
        if (!errorRecord) {
            throw new Error(`Error record not found: ${errorId}`);
        }
        const strategy = errorRecord.analysis.suggestions[strategyIndex];
        if (!strategy) {
            throw new Error(`Recovery strategy not found at index: ${strategyIndex}`);
        }
        try {
            const result = await this.executeRecoveryStrategy(strategy, errorRecord.error);
            // Mark as resolved if successful
            if (result.success) {
                errorRecord.resolved = true;
                errorRecord.resolution = {
                    strategy: strategy,
                    timestamp: Date.now(),
                    result: result
                };
            }
            return result;
        }
        catch (executionError) {
            return {
                success: false,
                error: executionError,
                message: `Failed to apply recovery strategy: ${executionError.message}`
            };
        }
    }
    /**
     * Get error statistics and patterns
     */
    getErrorStatistics() {
        const totalErrors = this.errorHistory.length;
        const resolvedErrors = this.errorHistory.filter(record => record.resolved).length;
        const resolutionRate = totalErrors > 0 ? (resolvedErrors / totalErrors) * 100 : 0;
        const categoryCounts = {};
        const severityCounts = {};
        this.errorHistory.forEach(record => {
            const category = record.analysis.category;
            const severity = record.analysis.severity;
            categoryCounts[category] = (categoryCounts[category] || 0) + 1;
            severityCounts[severity] = (severityCounts[severity] || 0) + 1;
        });
        return {
            totalErrors,
            resolvedErrors,
            resolutionRate,
            categoryBreakdown: categoryCounts,
            severityBreakdown: severityCounts,
            recentErrors: this.errorHistory.slice(-10)
        };
    }
    /**
     * Learn from successful resolutions to improve future suggestions
     */
    learnFromResolution(errorRecord) {
        if (!errorRecord.resolved || !errorRecord.resolution)
            return;
        const pattern = this.errorPatterns.get(errorRecord.analysis.category);
        if (pattern) {
            // Update pattern with successful resolution
            pattern.successfulResolutions = (pattern.successfulResolutions || 0) + 1;
            // Boost confidence for similar future errors
            const similarErrors = this.findSimilarErrors(errorRecord.error);
            similarErrors.forEach(similarError => {
                const similarRecord = this.errorHistory.find(r => r.error.id === similarError.error.id);
                if (similarRecord && !similarRecord.resolved) {
                    similarRecord.analysis.confidence += 0.1; // Small boost
                }
            });
        }
    }
    initializeErrorPatterns() {
        // Node-related errors
        this.errorPatterns.set('node_errors', {
            patterns: [
                /Node not found/i,
                /Invalid node path/i,
                /Parent node not found/i,
                /Cannot instantiate node/i
            ],
            category: 'node_errors',
            commonCauses: ['Invalid path', 'Node deleted', 'Scene not loaded'],
            successfulResolutions: 0
        });
        // Script-related errors
        this.errorPatterns.set('script_errors', {
            patterns: [
                /Script error/i,
                /Syntax error/i,
                /Compilation failed/i,
                /Invalid GDScript/i
            ],
            category: 'script_errors',
            commonCauses: ['Syntax errors', 'Missing dependencies', 'Type mismatches'],
            successfulResolutions: 0
        });
        // Scene-related errors
        this.errorPatterns.set('scene_errors', {
            patterns: [
                /Scene not found/i,
                /Cannot load scene/i,
                /Scene corruption/i,
                /Circular reference/i
            ],
            category: 'scene_errors',
            commonCauses: ['Missing files', 'Corrupted data', 'Dependency cycles'],
            successfulResolutions: 0
        });
        // Resource-related errors
        this.errorPatterns.set('resource_errors', {
            patterns: [
                /Resource not found/i,
                /Cannot load resource/i,
                /Invalid resource type/i,
                /Resource corruption/i
            ],
            category: 'resource_errors',
            commonCauses: ['Missing files', 'Wrong format', 'Path issues'],
            successfulResolutions: 0
        });
        // Performance-related errors
        this.errorPatterns.set('performance_errors', {
            patterns: [
                /Performance warning/i,
                /Frame rate drop/i,
                /Memory leak/i,
                /High CPU usage/i
            ],
            category: 'performance_errors',
            commonCauses: ['Inefficient code', 'Memory leaks', 'Too many objects'],
            successfulResolutions: 0
        });
    }
    initializeRecoveryStrategies() {
        // Node error recovery strategies
        this.recoveryStrategies.set('node_errors', [
            {
                name: 'Validate and fix path',
                description: 'Check if the node path is correct and fix any typos',
                steps: [
                    'Verify the node exists in the scene tree',
                    'Check for typos in the node path',
                    'Ensure the scene is properly loaded',
                    'Try using relative paths instead of absolute paths'
                ],
                automatic: true,
                riskLevel: 'low'
            },
            {
                name: 'Create missing parent nodes',
                description: 'Automatically create missing parent nodes in the hierarchy',
                steps: [
                    'Identify missing parent nodes',
                    'Create parent nodes with default settings',
                    'Reconnect the target node to the hierarchy'
                ],
                automatic: true,
                riskLevel: 'medium'
            },
            {
                name: 'Reload scene',
                description: 'Reload the current scene to refresh the node tree',
                steps: [
                    'Save any unsaved changes',
                    'Reload the scene from disk',
                    'Verify all nodes are properly restored'
                ],
                automatic: false,
                riskLevel: 'medium'
            }
        ]);
        // Script error recovery strategies
        this.recoveryStrategies.set('script_errors', [
            {
                name: 'Fix syntax errors',
                description: 'Automatically fix common syntax errors in GDScript',
                steps: [
                    'Parse the script for syntax errors',
                    'Apply automatic fixes for common issues',
                    'Validate the script compiles correctly'
                ],
                automatic: true,
                riskLevel: 'low'
            },
            {
                name: 'Add missing imports',
                description: 'Identify and add missing import statements',
                steps: [
                    'Analyze undefined references',
                    'Find appropriate import statements',
                    'Add imports to the script'
                ],
                automatic: true,
                riskLevel: 'low'
            },
            {
                name: 'Fix type mismatches',
                description: 'Resolve type-related compilation errors',
                steps: [
                    'Identify type mismatch locations',
                    'Suggest appropriate type conversions',
                    'Apply fixes with user confirmation'
                ],
                automatic: false,
                riskLevel: 'medium'
            }
        ]);
        // Scene error recovery strategies
        this.recoveryStrategies.set('scene_errors', [
            {
                name: 'Fix missing dependencies',
                description: 'Locate and restore missing scene dependencies',
                steps: [
                    'Identify missing files',
                    'Search for files in project directory',
                    'Restore or recreate missing dependencies'
                ],
                automatic: true,
                riskLevel: 'medium'
            },
            {
                name: 'Resolve circular references',
                description: 'Detect and break circular reference chains',
                steps: [
                    'Analyze scene dependency graph',
                    'Identify circular references',
                    'Remove or redirect problematic references'
                ],
                automatic: false,
                riskLevel: 'high'
            }
        ]);
    }
    determineSeverity(error) {
        const message = error.message.toLowerCase();
        if (message.includes('critical') || message.includes('fatal')) {
            return 'critical';
        }
        else if (message.includes('error') || message.includes('failed')) {
            return 'high';
        }
        else if (message.includes('warning') || message.includes('deprecated')) {
            return 'medium';
        }
        else {
            return 'low';
        }
    }
    categorizeError(error) {
        const message = error.message.toLowerCase();
        for (const [category, pattern] of this.errorPatterns) {
            for (const regex of pattern.patterns) {
                if (regex.test(message)) {
                    return category;
                }
            }
        }
        return 'unknown';
    }
    async identifyRootCause(error) {
        // Use Godot connection to get additional context
        try {
            const godot = await getGodotConnection();
            const contextResult = await godot.sendCommand('get_error_context', {
                error: error
            });
            if (contextResult.result?.rootCause) {
                return contextResult.result.rootCause;
            }
        }
        catch (e) {
            // Continue with local analysis if Godot context unavailable
        }
        // Fallback to pattern-based root cause identification
        const category = this.categorizeError(error);
        const pattern = this.errorPatterns.get(category);
        if (pattern && pattern.commonCauses.length > 0) {
            return pattern.commonCauses[0]; // Return most likely cause
        }
        return 'Unknown - requires manual investigation';
    }
    findSimilarErrors(error) {
        return this.errorHistory
            .filter(record => this.isSimilarError(record.error, error))
            .slice(-5); // Return last 5 similar errors
    }
    isSimilarError(error1, error2) {
        // Simple similarity check based on error type and message keywords
        const typeMatch = error1.type === error2.type;
        const messageWords1 = error1.message.toLowerCase().split(/\s+/);
        const messageWords2 = error2.message.toLowerCase().split(/\s+/);
        const commonWords = messageWords1.filter(word => messageWords2.includes(word) && word.length > 3);
        return typeMatch && commonWords.length >= 2;
    }
    async generateSuggestions(error, strategies) {
        const suggestions = [];
        for (const strategy of strategies) {
            const suggestion = {
                strategy: strategy,
                confidence: this.calculateStrategyConfidence(strategy, error),
                estimatedTime: this.estimateRecoveryTime(strategy),
                riskAssessment: strategy.riskLevel
            };
            suggestions.push(suggestion);
        }
        // Sort by confidence (highest first)
        suggestions.sort((a, b) => b.confidence - a.confidence);
        return suggestions;
    }
    calculateStrategyConfidence(strategy, error) {
        // Simple confidence calculation based on strategy success history
        const pattern = this.errorPatterns.get(this.categorizeError(error));
        if (pattern && pattern.successfulResolutions && pattern.successfulResolutions > 0) {
            return Math.min(0.9, pattern.successfulResolutions / 10); // Cap at 90%
        }
        // Default confidence based on risk level
        switch (strategy.riskLevel) {
            case 'low': return 0.8;
            case 'medium': return 0.6;
            case 'high': return 0.3;
            default: return 0.5;
        }
    }
    estimateRecoveryTime(strategy) {
        // Estimate time in seconds based on strategy complexity
        switch (strategy.riskLevel) {
            case 'low': return strategy.automatic ? 5 : 30;
            case 'medium': return strategy.automatic ? 15 : 120;
            case 'high': return strategy.automatic ? 60 : 300;
            default: return 60;
        }
    }
    calculateConfidence(error, analysis) {
        let confidence = 0.5; // Base confidence
        // Increase confidence based on pattern matching
        if (analysis.category !== 'unknown') {
            confidence += 0.2;
        }
        // Increase confidence based on similar resolved errors
        if (analysis.similarErrors.length > 0) {
            const resolvedSimilar = analysis.similarErrors.filter(err => err.resolved).length;
            confidence += (resolvedSimilar / analysis.similarErrors.length) * 0.2;
        }
        // Increase confidence based on suggestion quality
        if (analysis.suggestions.length > 0) {
            const avgConfidence = analysis.suggestions.reduce((sum, sug) => sum + sug.confidence, 0) / analysis.suggestions.length;
            confidence += avgConfidence * 0.1;
        }
        return Math.min(1.0, confidence);
    }
    async executeRecoveryStrategy(suggestion, error) {
        try {
            const godot = await getGodotConnection();
            const result = await godot.sendCommand('apply_error_recovery', {
                strategy: suggestion.strategy.name,
                error: error,
                automatic: suggestion.strategy.automatic
            });
            return {
                success: result.result?.success || false,
                message: result.result?.message || 'Recovery completed',
                changes: result.result?.changes || []
            };
        }
        catch (executionError) {
            return {
                success: false,
                error: executionError,
                message: `Recovery execution failed: ${executionError.message}`
            };
        }
    }
    storeErrorRecord(record) {
        this.errorHistory.push(record);
        // Maintain history size limit
        if (this.errorHistory.length > this.maxHistorySize) {
            this.errorHistory.shift();
        }
    }
}
// Singleton instance
let errorHandlerInstance = null;
export function getErrorHandler() {
    if (!errorHandlerInstance) {
        errorHandlerInstance = new EnhancedErrorHandler();
    }
    return errorHandlerInstance;
}
// Singleton instance
//# sourceMappingURL=enhanced_error_handler.js.map