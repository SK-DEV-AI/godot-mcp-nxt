import { getGodotConnection } from './godot_connection.js';
/**
 * Dynamic Prompt Manager using Prompty-inspired patterns
 * Provides context-aware prompt injection for MCP responses
 */
export class DynamicPromptManager {
    constructor() {
        this.promptTemplates = new Map();
        this.contextCache = new Map();
        this.injectionHistory = [];
        this.maxHistorySize = 50;
        this.initializeBaseTemplates();
    }
    /**
     * Inject dynamic prompts based on current context
     */
    async injectPrompts(basePrompt, context) {
        const enrichedPrompt = await this.enrichPrompt(basePrompt, context);
        const injectedPrompt = await this.applyInjections(enrichedPrompt, context);
        // Store injection for learning
        this.storeInjection({
            timestamp: Date.now(),
            originalPrompt: basePrompt,
            context: context,
            enrichedPrompt: enrichedPrompt,
            finalPrompt: injectedPrompt,
            effectiveness: 0 // Will be updated based on usage feedback
        });
        return injectedPrompt;
    }
    /**
     * Get context-aware suggestions for prompt improvement
     */
    async getPromptSuggestions(currentPrompt, context) {
        const suggestions = [];
        // Analyze current context
        const contextAnalysis = await this.analyzeContext(context);
        // Generate suggestions based on context
        if (contextAnalysis.needsSceneContext) {
            suggestions.push({
                type: 'scene_context',
                description: 'Add current scene information for better spatial understanding',
                template: this.getTemplate('scene_context_injection'),
                confidence: 0.8,
                category: 'context_enhancement'
            });
        }
        if (contextAnalysis.needsPerformanceContext) {
            suggestions.push({
                type: 'performance_context',
                description: 'Include performance metrics for optimization guidance',
                template: this.getTemplate('performance_context_injection'),
                confidence: 0.7,
                category: 'performance_optimization'
            });
        }
        if (contextAnalysis.needsErrorContext) {
            suggestions.push({
                type: 'error_context',
                description: 'Add recent error patterns for better troubleshooting',
                template: this.getTemplate('error_context_injection'),
                confidence: 0.9,
                category: 'error_handling'
            });
        }
        // Add project-specific suggestions
        const projectSuggestions = await this.getProjectSpecificSuggestions(context);
        suggestions.push(...projectSuggestions);
        return suggestions.sort((a, b) => b.confidence - a.confidence);
    }
    /**
     * Learn from successful prompt injections
     */
    learnFromSuccess(injectionId, effectiveness) {
        const injection = this.injectionHistory.find(i => i.timestamp === parseInt(injectionId));
        if (injection) {
            injection.effectiveness = effectiveness;
            // Update template effectiveness
            const template = this.promptTemplates.get(injection.context.operation || 'default');
            if (template) {
                template.successRate = (template.successRate + effectiveness) / 2;
                template.usageCount++;
            }
        }
    }
    /**
     * Get injection statistics and patterns
     */
    getInjectionStatistics() {
        const totalInjections = this.injectionHistory.length;
        const effectiveInjections = this.injectionHistory.filter(i => i.effectiveness > 0.7).length;
        const effectivenessRate = totalInjections > 0 ? (effectiveInjections / totalInjections) * 100 : 0;
        const templateStats = {};
        this.promptTemplates.forEach((template, name) => {
            templateStats[name] = {
                usageCount: template.usageCount,
                successRate: template.successRate,
                averageEffectiveness: template.usageCount > 0 ?
                    this.injectionHistory
                        .filter(i => i.context.operation === name)
                        .reduce((sum, i) => sum + i.effectiveness, 0) / template.usageCount : 0
            };
        });
        return {
            totalInjections,
            effectiveInjections,
            effectivenessRate,
            templateStats,
            recentInjections: this.injectionHistory.slice(-10)
        };
    }
    async enrichPrompt(basePrompt, context) {
        let enrichedPrompt = basePrompt;
        // Add Godot-specific context
        if (context.godotContext) {
            enrichedPrompt = await this.addGodotContext(enrichedPrompt, context.godotContext);
        }
        // Add user context
        if (context.userContext) {
            enrichedPrompt = this.addUserContext(enrichedPrompt, context.userContext);
        }
        // Add session context
        if (context.sessionContext) {
            enrichedPrompt = this.addSessionContext(enrichedPrompt, context.sessionContext);
        }
        return enrichedPrompt;
    }
    async applyInjections(enrichedPrompt, context) {
        let finalPrompt = enrichedPrompt;
        // Apply template-based injections
        const template = this.getTemplate(context.operation || 'default');
        if (template) {
            finalPrompt = await this.applyTemplate(finalPrompt, template, context);
        }
        // Apply dynamic injections based on context analysis
        const dynamicInjections = await this.generateDynamicInjections(context);
        for (const injection of dynamicInjections) {
            finalPrompt = this.injectContent(finalPrompt, injection);
        }
        return finalPrompt;
    }
    async addGodotContext(prompt, godotContext) {
        let contextString = "\n\n## Godot Environment Context\n";
        if (godotContext.currentScene) {
            contextString += `Current Scene: ${godotContext.currentScene}\n`;
        }
        if (godotContext.selectedNodes && godotContext.selectedNodes.length > 0) {
            contextString += `Selected Nodes: ${godotContext.selectedNodes.join(', ')}\n`;
        }
        if (godotContext.openScripts && godotContext.openScripts.length > 0) {
            contextString += `Open Scripts: ${godotContext.openScripts.join(', ')}\n`;
        }
        if (godotContext.recentErrors && godotContext.recentErrors.length > 0) {
            contextString += `Recent Errors: ${godotContext.recentErrors.slice(0, 3).join('; ')}\n`;
        }
        // Get additional context from Godot
        try {
            const godot = getGodotConnection();
            const contextResult = await godot.sendCommand('get_prompt_context', {});
            if (contextResult.result?.performanceMetrics) {
                const metrics = contextResult.result.performanceMetrics;
                contextString += `Performance: FPS ${metrics.fps?.toFixed(1) || 'N/A'}, Memory ${(metrics.memory_total || 0).toFixed(1)}MB\n`;
            }
        }
        catch (e) {
            // Continue without additional context
        }
        return prompt + contextString;
    }
    addUserContext(prompt, userContext) {
        let contextString = "\n\n## User Context\n";
        if (userContext.experienceLevel) {
            contextString += `Experience Level: ${userContext.experienceLevel}\n`;
        }
        if (userContext.preferredStyle) {
            contextString += `Preferred Style: ${userContext.preferredStyle}\n`;
        }
        if (userContext.recentActions && userContext.recentActions.length > 0) {
            contextString += `Recent Actions: ${userContext.recentActions.slice(0, 5).join(', ')}\n`;
        }
        return prompt + contextString;
    }
    addSessionContext(prompt, sessionContext) {
        let contextString = "\n\n## Session Context\n";
        if (sessionContext.duration) {
            contextString += `Session Duration: ${Math.floor(sessionContext.duration / 60)} minutes\n`;
        }
        if (sessionContext.completedTasks && sessionContext.completedTasks.length > 0) {
            contextString += `Completed Tasks: ${sessionContext.completedTasks.length}\n`;
        }
        if (sessionContext.currentWorkflow) {
            contextString += `Current Workflow: ${sessionContext.currentWorkflow}\n`;
        }
        return prompt + contextString;
    }
    async analyzeContext(context) {
        const analysis = {
            needsSceneContext: false,
            needsPerformanceContext: false,
            needsErrorContext: false,
            needsUserContext: false,
            contextStrength: 0
        };
        // Check if scene context is needed
        if (context.operation?.includes('node') || context.operation?.includes('scene')) {
            analysis.needsSceneContext = true;
            analysis.contextStrength += 0.3;
        }
        // Check if performance context is needed
        if (context.operation?.includes('performance') || context.operation?.includes('optimize')) {
            analysis.needsPerformanceContext = true;
            analysis.contextStrength += 0.25;
        }
        // Check if error context is needed
        if (context.operation?.includes('error') || context.operation?.includes('debug')) {
            analysis.needsErrorContext = true;
            analysis.contextStrength += 0.35;
        }
        // Check if user context is needed
        if (context.userContext?.experienceLevel === 'beginner') {
            analysis.needsUserContext = true;
            analysis.contextStrength += 0.2;
        }
        return analysis;
    }
    async getProjectSpecificSuggestions(context) {
        const suggestions = [];
        try {
            const godot = getGodotConnection();
            const projectResult = await godot.sendCommand('get_project_context', {});
            if (projectResult.result?.projectType) {
                const projectType = projectResult.result.projectType;
                if (projectType === '2d_platformer') {
                    suggestions.push({
                        type: 'platformer_specific',
                        description: 'Add platformer-specific guidance for 2D game development',
                        template: this.getTemplate('platformer_guidance'),
                        confidence: 0.8,
                        category: 'project_specific'
                    });
                }
                else if (projectType === '3d_rpg') {
                    suggestions.push({
                        type: 'rpg_specific',
                        description: 'Include RPG development patterns and best practices',
                        template: this.getTemplate('rpg_guidance'),
                        confidence: 0.75,
                        category: 'project_specific'
                    });
                }
            }
        }
        catch (e) {
            // Continue without project-specific suggestions
        }
        return suggestions;
    }
    async applyTemplate(prompt, template, context) {
        let result = template.content;
        // Replace template variables
        const variables = await this.extractTemplateVariables(context);
        for (const [key, value] of Object.entries(variables)) {
            result = result.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
        }
        return prompt + '\n\n' + result;
    }
    async extractTemplateVariables(context) {
        const variables = {};
        // Extract from Godot context
        if (context.godotContext) {
            variables.scene_name = context.godotContext.currentScene || 'unknown';
            variables.node_count = context.godotContext.selectedNodes?.length || 0;
        }
        // Extract from user context
        if (context.userContext) {
            variables.user_level = context.userContext.experienceLevel || 'intermediate';
            variables.preferred_style = context.userContext.preferredStyle || 'concise';
        }
        // Extract from session context
        if (context.sessionContext) {
            variables.session_time = Math.floor((context.sessionContext.duration || 0) / 60);
        }
        return variables;
    }
    async generateDynamicInjections(context) {
        const injections = [];
        // Add performance-based injections
        if (context.operation?.includes('optimize')) {
            injections.push({
                type: 'performance_guidance',
                content: '\n\nConsider performance implications and provide optimization suggestions where relevant.',
                position: 'end',
                condition: 'always'
            });
        }
        // Add error handling injections
        if (context.operation?.includes('create') || context.operation?.includes('modify')) {
            injections.push({
                type: 'error_prevention',
                content: '\n\nInclude error handling and validation in the suggested code.',
                position: 'end',
                condition: 'always'
            });
        }
        return injections;
    }
    injectContent(prompt, injection) {
        switch (injection.position) {
            case 'beginning':
                return injection.content + prompt;
            case 'end':
                return prompt + injection.content;
            case 'middle':
                const middleIndex = Math.floor(prompt.length / 2);
                return prompt.slice(0, middleIndex) + injection.content + prompt.slice(middleIndex);
            default:
                return prompt + injection.content;
        }
    }
    initializeBaseTemplates() {
        // Scene context injection template
        this.promptTemplates.set('scene_context_injection', {
            name: 'Scene Context Injection',
            content: `
## Current Scene Information
- Scene: {{scene_name}}
- Selected Nodes: {{node_count}}
- Consider the scene hierarchy and node relationships when providing suggestions.`,
            usageCount: 0,
            successRate: 0.8,
            category: 'context'
        });
        // Performance context injection template
        this.promptTemplates.set('performance_context_injection', {
            name: 'Performance Context Injection',
            content: `
## Performance Considerations
Current performance metrics should be considered when making changes.
Focus on efficient implementations and provide optimization suggestions.`,
            usageCount: 0,
            successRate: 0.75,
            category: 'performance'
        });
        // Error context injection template
        this.promptTemplates.set('error_context_injection', {
            name: 'Error Context Injection',
            content: `
## Error Prevention
Consider potential error scenarios and provide robust error handling.
Include validation and fallback mechanisms in suggestions.`,
            usageCount: 0,
            successRate: 0.85,
            category: 'error_handling'
        });
        // Platformer-specific guidance
        this.promptTemplates.set('platformer_guidance', {
            name: 'Platformer Development Guidance',
            content: `
## Platformer-Specific Considerations
- Implement proper collision detection for platforms and enemies
- Consider gravity, jump mechanics, and physics interactions
- Optimize for 2D rendering performance
- Include level design best practices for platformer games`,
            usageCount: 0,
            successRate: 0.8,
            category: 'project_specific'
        });
        // RPG-specific guidance
        this.promptTemplates.set('rpg_guidance', {
            name: 'RPG Development Guidance',
            content: `
## RPG-Specific Considerations
- Implement character progression and stat systems
- Consider inventory management and item interactions
- Include dialogue systems and quest mechanics
- Optimize for complex scene management and NPC AI`,
            usageCount: 0,
            successRate: 0.75,
            category: 'project_specific'
        });
    }
    getTemplate(name) {
        return this.promptTemplates.get(name);
    }
    storeInjection(injection) {
        this.injectionHistory.push(injection);
        // Maintain history size limit
        if (this.injectionHistory.length > this.maxHistorySize) {
            this.injectionHistory.shift();
        }
    }
}
// Singleton instance
let promptManagerInstance = null;
export function getPromptManager() {
    if (!promptManagerInstance) {
        promptManagerInstance = new DynamicPromptManager();
    }
    return promptManagerInstance;
}
//# sourceMappingURL=dynamic_prompt_manager.js.map