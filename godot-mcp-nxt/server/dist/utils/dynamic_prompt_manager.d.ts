/**
 * Dynamic Prompt Manager using Prompty-inspired patterns
 * Provides context-aware prompt injection for MCP responses
 */
export declare class DynamicPromptManager {
    private promptTemplates;
    private contextCache;
    private injectionHistory;
    private maxHistorySize;
    constructor();
    /**
     * Inject dynamic prompts based on current context
     */
    injectPrompts(basePrompt: string, context: PromptContext): Promise<string>;
    /**
     * Get context-aware suggestions for prompt improvement
     */
    getPromptSuggestions(currentPrompt: string, context: PromptContext): Promise<PromptSuggestion[]>;
    /**
     * Learn from successful prompt injections
     */
    learnFromSuccess(injectionId: string, effectiveness: number): void;
    /**
     * Get injection statistics and patterns
     */
    getInjectionStatistics(): InjectionStatistics;
    private enrichPrompt;
    private applyInjections;
    private addGodotContext;
    private addUserContext;
    private addSessionContext;
    private analyzeContext;
    private getProjectSpecificSuggestions;
    private applyTemplate;
    private extractTemplateVariables;
    private generateDynamicInjections;
    private injectContent;
    private initializeBaseTemplates;
    private getTemplate;
    private storeInjection;
}
export declare function getPromptManager(): DynamicPromptManager;
export interface PromptContext {
    operation?: string;
    godotContext?: GodotContext;
    userContext?: UserContext;
    sessionContext?: SessionContext;
}
export interface GodotContext {
    currentScene?: string;
    selectedNodes?: string[];
    openScripts?: string[];
    recentErrors?: string[];
}
export interface UserContext {
    experienceLevel?: 'beginner' | 'intermediate' | 'advanced';
    preferredStyle?: 'concise' | 'detailed' | 'educational';
    recentActions?: string[];
}
export interface SessionContext {
    duration?: number;
    completedTasks?: string[];
    currentWorkflow?: string;
}
export interface PromptTemplate {
    name: string;
    content: string;
    usageCount: number;
    successRate: number;
    category: string;
}
export interface PromptSuggestion {
    type: string;
    description: string;
    template: PromptTemplate | undefined;
    confidence: number;
    category: string;
}
export interface DynamicInjection {
    type: string;
    content: string;
    position: 'beginning' | 'middle' | 'end';
    condition: string;
}
export interface PromptInjection {
    timestamp: number;
    originalPrompt: string;
    context: PromptContext;
    enrichedPrompt: string;
    finalPrompt: string;
    effectiveness: number;
}
export interface ContextAnalysis {
    needsSceneContext: boolean;
    needsPerformanceContext: boolean;
    needsErrorContext: boolean;
    needsUserContext: boolean;
    contextStrength: number;
}
export interface ContextData {
    sceneInfo?: any;
    performanceMetrics?: any;
    userPreferences?: any;
    timestamp: number;
}
export interface InjectionStatistics {
    totalInjections: number;
    effectiveInjections: number;
    effectivenessRate: number;
    templateStats: {
        [key: string]: TemplateStats;
    };
    recentInjections: PromptInjection[];
}
export interface TemplateStats {
    usageCount: number;
    successRate: number;
    averageEffectiveness: number;
}
