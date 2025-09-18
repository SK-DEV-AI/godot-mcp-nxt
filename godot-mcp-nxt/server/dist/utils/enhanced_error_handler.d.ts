/**
 * Enhanced error handling and recovery system for Godot MCP
 */
export declare class EnhancedErrorHandler {
    private errorPatterns;
    private recoveryStrategies;
    private errorHistory;
    private maxHistorySize;
    constructor();
    /**
     * Analyze an error and provide recovery suggestions
     */
    analyzeError(error: ErrorContext): Promise<ErrorAnalysis>;
    /**
     * Apply a recovery strategy
     */
    applyRecovery(errorId: string, strategyIndex: number): Promise<RecoveryResult>;
    /**
     * Get error statistics and patterns
     */
    getErrorStatistics(): ErrorStatistics;
    /**
     * Learn from successful resolutions to improve future suggestions
     */
    learnFromResolution(errorRecord: ErrorRecord): void;
    private initializeErrorPatterns;
    private initializeRecoveryStrategies;
    private determineSeverity;
    private categorizeError;
    private identifyRootCause;
    private findSimilarErrors;
    private isSimilarError;
    private generateSuggestions;
    private calculateStrategyConfidence;
    private estimateRecoveryTime;
    private calculateConfidence;
    private executeRecoveryStrategy;
    private storeErrorRecord;
}
export declare function getErrorHandler(): EnhancedErrorHandler;
export interface ErrorContext {
    id: string;
    type: string;
    message: string;
    stackTrace?: string;
    context?: any;
    timestamp: number;
}
export interface ErrorPattern {
    patterns: RegExp[];
    category: string;
    commonCauses: string[];
    successfulResolutions?: number;
}
export interface RecoveryStrategy {
    name: string;
    description: string;
    steps: string[];
    automatic: boolean;
    riskLevel: 'low' | 'medium' | 'high';
}
export interface RecoverySuggestion {
    strategy: RecoveryStrategy;
    confidence: number;
    estimatedTime: number;
    riskAssessment: string;
}
export interface ErrorAnalysis {
    error: ErrorContext;
    severity: ErrorSeverity;
    category: string;
    rootCause: string;
    suggestions: RecoverySuggestion[];
    similarErrors: ErrorRecord[];
    confidence: number;
}
export interface RecoveryResult {
    success: boolean;
    message: string;
    changes?: any[];
    error?: Error;
}
export interface ErrorRecord {
    timestamp: number;
    error: ErrorContext;
    analysis: ErrorAnalysis;
    resolved: boolean;
    resolution?: {
        strategy: RecoverySuggestion;
        timestamp: number;
        result: RecoveryResult;
    };
}
export interface ErrorStatistics {
    totalErrors: number;
    resolvedErrors: number;
    resolutionRate: number;
    categoryBreakdown: {
        [key: string]: number;
    };
    severityBreakdown: {
        [key: string]: number;
    };
    recentErrors: ErrorRecord[];
}
export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';
