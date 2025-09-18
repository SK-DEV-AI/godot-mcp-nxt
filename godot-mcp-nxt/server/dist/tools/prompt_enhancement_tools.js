import { z } from 'zod';
import { getGodotConnection } from '../utils/godot_connection.js';
import { getPromptManager } from '../utils/dynamic_prompt_manager.js';
/**
 * Prompt enhancement tools using dynamic prompt injection
 */
export const promptEnhancementTools = [
    {
        name: 'enhance_prompt',
        description: `🎯 DYNAMIC PROMPT ENHANCER - Context-Aware Prompt Enhancement

ENHANCE WORKFLOW:
1. 📝 ANALYZE: Use operation="analyze" to understand current prompt context
2. 🚀 ENHANCE: Use operation="enhance" to add intelligent context and suggestions
3. 💡 SUGGEST: Use operation="suggest_improvements" to get specific enhancement recommendations
4. 📊 LEARN: Use operation="learn_from_feedback" to improve future enhancements

CONTEXT-AWARE ENHANCEMENTS:
- Godot scene and node information
- Current performance metrics
- Recent error patterns
- User experience level and preferences
- Session context and workflow state
- Project-specific guidance

EXAMPLES:
✅ Enhance basic prompt: {operation: "enhance", prompt: "Create a player controller"}
✅ Get suggestions: {operation: "suggest_improvements", current_prompt: "Add movement"}
✅ Analyze context: {operation: "analyze", operation_type: "script_creation"}
✅ Learn from success: {operation: "learn_from_feedback", injection_id: "123", effectiveness: 0.9}

ENHANCEMENT FEATURES:
- Scene-aware suggestions for spatial operations
- Performance-guided optimization hints
- Error prevention based on recent issues
- User-level appropriate complexity
- Project-type specific guidance (2D platformer, 3D RPG, etc.)`,
        parameters: z.object({
            operation: z.enum(['enhance', 'analyze', 'suggest_improvements', 'learn_from_feedback', 'get_statistics'])
                .describe('Type of prompt enhancement operation to perform'),
            prompt: z.string().optional()
                .describe('The base prompt to enhance'),
            current_prompt: z.string().optional()
                .describe('Current prompt for improvement suggestions'),
            operation_type: z.string().optional()
                .describe('Type of operation (script_creation, node_management, etc.)'),
            injection_id: z.string().optional()
                .describe('ID of previous injection for learning feedback'),
            effectiveness: z.number().optional()
                .describe('Effectiveness rating (0.0 to 1.0) for learning'),
            include_godot_context: z.boolean().optional().default(true)
                .describe('Include current Godot editor context'),
            include_performance: z.boolean().optional().default(false)
                .describe('Include performance metrics in enhancement'),
            user_experience_level: z.enum(['beginner', 'intermediate', 'advanced']).optional()
                .describe('User experience level for appropriate complexity')
        }),
        execute: async (params) => {
            const promptManager = getPromptManager();
            try {
                switch (params.operation) {
                    case 'enhance': {
                        if (!params.prompt) {
                            throw new Error('Prompt is required for enhancement');
                        }
                        // Build context for enhancement
                        const context = await buildPromptContext(params);
                        // Enhance the prompt
                        const enhancedPrompt = await promptManager.injectPrompts(params.prompt, context);
                        return formatEnhancedPrompt(params.prompt, enhancedPrompt, context);
                    }
                    case 'analyze': {
                        const context = await buildPromptContext(params);
                        const suggestions = await promptManager.getPromptSuggestions(params.current_prompt || '', context);
                        return formatContextAnalysis(context, suggestions);
                    }
                    case 'suggest_improvements': {
                        if (!params.current_prompt) {
                            throw new Error('Current prompt is required for suggestions');
                        }
                        const context = await buildPromptContext(params);
                        const suggestions = await promptManager.getPromptSuggestions(params.current_prompt, context);
                        return formatImprovementSuggestions(suggestions, params.current_prompt);
                    }
                    case 'learn_from_feedback': {
                        if (!params.injection_id || params.effectiveness === undefined) {
                            throw new Error('Injection ID and effectiveness rating are required');
                        }
                        promptManager.learnFromSuccess(params.injection_id, params.effectiveness);
                        return `✅ Learned from feedback - effectiveness: ${(params.effectiveness * 100).toFixed(1)}%`;
                    }
                    case 'get_statistics': {
                        const stats = promptManager.getInjectionStatistics();
                        return formatInjectionStatistics(stats);
                    }
                    default:
                        throw new Error(`Unknown operation: ${params.operation}`);
                }
            }
            catch (error) {
                throw new Error(`Prompt enhancement operation failed: ${error.message}`);
            }
        },
    },
    {
        name: 'context_aware_assistant',
        description: `🧠 CONTEXT-AWARE ASSISTANT - Intelligent Development Guidance

ASSISTANCE WORKFLOW:
1. 🎯 ANALYZE: Understand current development context and needs
2. 💡 PROVIDE: Context-aware guidance and best practices
3. 🔧 SUGGEST: Specific improvements based on current state
4. 📈 OPTIMIZE: Performance and code quality recommendations

CONTEXT ANALYSIS:
- Current scene structure and complexity
- Open scripts and recent changes
- Performance metrics and bottlenecks
- Error patterns and common issues
- User workflow and development patterns

EXAMPLES:
✅ Get guidance: {operation: "get_guidance", context_type: "scripting"}
✅ Analyze project: {operation: "analyze_project", focus_area: "performance"}
✅ Get best practices: {operation: "get_best_practices", category: "node_management"}
✅ Performance advice: {operation: "performance_guidance", current_fps: 45}

GUIDANCE CATEGORIES:
- Scripting best practices
- Scene organization and optimization
- Performance monitoring and improvement
- Error prevention and debugging
- Code structure and maintainability`,
        parameters: z.object({
            operation: z.enum(['get_guidance', 'analyze_project', 'get_best_practices', 'performance_guidance', 'workflow_assistance'])
                .describe('Type of assistance operation to perform'),
            context_type: z.string().optional()
                .describe('Type of context (scripting, scene, performance, etc.)'),
            focus_area: z.string().optional()
                .describe('Specific area to focus analysis on'),
            category: z.string().optional()
                .describe('Category for best practices'),
            current_fps: z.number().optional()
                .describe('Current FPS for performance guidance'),
            workflow_step: z.string().optional()
                .describe('Current workflow step for assistance'),
            include_examples: z.boolean().optional().default(true)
                .describe('Include code examples in guidance'),
            detail_level: z.enum(['brief', 'detailed', 'comprehensive']).optional().default('detailed')
                .describe('Level of detail in response')
        }),
        execute: async (params) => {
            const godot = getGodotConnection();
            try {
                switch (params.operation) {
                    case 'get_guidance': {
                        const context = await getCurrentGodotContext();
                        const guidance = await generateContextualGuidance(params.context_type || 'general', context, params.detail_level);
                        return formatGuidanceResponse(guidance, params.include_examples);
                    }
                    case 'analyze_project': {
                        const analysis = await analyzeProjectState(params.focus_area);
                        return formatProjectAnalysis(analysis);
                    }
                    case 'get_best_practices': {
                        const practices = await getBestPractices(params.category || 'general');
                        return formatBestPractices(practices, params.include_examples);
                    }
                    case 'performance_guidance': {
                        const guidance = await generatePerformanceGuidance(params.current_fps || 60);
                        return formatPerformanceGuidance(guidance);
                    }
                    case 'workflow_assistance': {
                        const assistance = await generateWorkflowAssistance(params.workflow_step);
                        return formatWorkflowAssistance(assistance);
                    }
                    default:
                        throw new Error(`Unknown assistance operation: ${params.operation}`);
                }
            }
            catch (error) {
                throw new Error(`Context-aware assistance failed: ${error.message}`);
            }
        },
    }
];
/**
 * Helper functions for prompt enhancement
 */
async function buildPromptContext(params) {
    const context = {
        operation: params.operation_type,
        godotContext: {},
        userContext: {},
        sessionContext: {}
    };
    // Get Godot context if requested
    if (params.include_godot_context) {
        try {
            const godot = getGodotConnection();
            const godotResult = await godot.sendCommand('get_current_context', {});
            if (godotResult.result) {
                context.godotContext = {
                    currentScene: godotResult.result.scene_name,
                    selectedNodes: godotResult.result.selected_nodes || [],
                    openScripts: godotResult.result.open_scripts || [],
                    recentErrors: godotResult.result.recent_errors || []
                };
            }
        }
        catch (e) {
            // Continue without Godot context
        }
    }
    // Add performance context if requested
    if (params.include_performance) {
        try {
            const godot = getGodotConnection();
            const perfResult = await godot.sendCommand('get_performance_metrics', {});
            if (perfResult.result) {
                context.godotContext.performanceMetrics = perfResult.result;
            }
        }
        catch (e) {
            // Continue without performance context
        }
    }
    // Add user context
    if (params.user_experience_level) {
        context.userContext = {
            experienceLevel: params.user_experience_level,
            preferredStyle: params.detail_level === 'brief' ? 'concise' : 'detailed'
        };
    }
    return context;
}
async function getCurrentGodotContext() {
    try {
        const godot = getGodotConnection();
        const result = await godot.sendCommand('get_current_context', {});
        return result.result || {};
    }
    catch (e) {
        return {};
    }
}
async function generateContextualGuidance(contextType, context, detailLevel) {
    const guidance = {
        type: contextType,
        recommendations: [],
        examples: [],
        rationale: ''
    };
    switch (contextType) {
        case 'scripting':
            guidance.recommendations = [
                'Use descriptive variable and function names',
                'Add comments for complex logic',
                'Use type hints for better IDE support',
                'Follow Godot naming conventions (_ready, _process, etc.)'
            ];
            guidance.rationale = 'Good scripting practices improve code maintainability and reduce errors.';
            if (detailLevel !== 'brief') {
                guidance.examples = [
                    'func _ready():\n\t# Initialize player stats\n\tinitialize_player()',
                    'func calculate_movement(delta: float) -> Vector2:\n\treturn input_vector * speed * delta'
                ];
            }
            break;
        case 'scene':
            guidance.recommendations = [
                'Use meaningful node names',
                'Group related nodes in containers',
                'Use scenes for reusable components',
                'Keep scene hierarchy shallow when possible'
            ];
            guidance.rationale = 'Well-organized scenes are easier to maintain and debug.';
            break;
        case 'performance':
            guidance.recommendations = [
                'Use _process instead of _physics_process when possible',
                'Pool reusable objects',
                'Use Viewport culling for large scenes',
                'Profile before optimizing'
            ];
            guidance.rationale = 'Performance optimization ensures smooth gameplay experience.';
            break;
        default:
            guidance.recommendations = [
                'Follow Godot best practices',
                'Test changes incrementally',
                'Use version control',
                'Document complex systems'
            ];
            guidance.rationale = 'General best practices improve development efficiency.';
    }
    return guidance;
}
async function analyzeProjectState(focusArea) {
    const analysis = {
        focusArea: focusArea || 'general',
        metrics: {},
        issues: [],
        recommendations: []
    };
    try {
        const godot = getGodotConnection();
        // Get scene complexity
        const sceneResult = await godot.sendCommand('get_scene_complexity', {});
        analysis.metrics.sceneComplexity = sceneResult.result || {};
        // Get performance metrics
        const perfResult = await godot.sendCommand('get_performance_metrics', {});
        analysis.metrics.performance = perfResult.result || {};
        // Analyze based on focus area
        if (focusArea === 'performance') {
            if (analysis.metrics.performance.fps < 30) {
                analysis.issues.push('Low FPS detected');
                analysis.recommendations.push('Consider optimizing rendering or reducing scene complexity');
            }
        }
    }
    catch (e) {
        analysis.error = 'Could not retrieve project state';
    }
    return analysis;
}
async function getBestPractices(category) {
    const practices = {
        category: category,
        practices: [],
        examples: []
    };
    switch (category) {
        case 'node_management':
            practices.practices = [
                'Use groups for similar nodes',
                'Leverage node signals for communication',
                'Keep node hierarchies shallow',
                'Use unique names for important nodes'
            ];
            practices.examples = [
                'get_tree().call_group("enemies", "take_damage", damage)',
                'node.connect("pressed", Callable(self, "_on_button_pressed"))'
            ];
            break;
        case 'scripting':
            practices.practices = [
                'Use signals instead of direct method calls',
                'Implement error handling',
                'Use constants for magic numbers',
                'Document public methods'
            ];
            break;
        default:
            practices.practices = [
                'Follow Godot conventions',
                'Test regularly',
                'Use meaningful names',
                'Keep code modular'
            ];
    }
    return practices;
}
async function generatePerformanceGuidance(currentFps) {
    const guidance = {
        currentFps: currentFps,
        status: currentFps >= 60 ? 'excellent' : currentFps >= 30 ? 'good' : 'needs_improvement',
        recommendations: [],
        priority: currentFps < 30 ? 'high' : 'medium'
    };
    if (currentFps < 30) {
        guidance.recommendations = [
            'Reduce draw calls by using texture atlases',
            'Implement object pooling for frequently created objects',
            'Use simpler collision shapes where possible',
            'Consider reducing visual effects or particle systems'
        ];
    }
    else if (currentFps < 60) {
        guidance.recommendations = [
            'Optimize shader usage',
            'Reduce overdraw with better sorting',
            'Use LOD (Level of Detail) for distant objects',
            'Consider using simpler materials'
        ];
    }
    else {
        guidance.recommendations = [
            'Performance is excellent',
            'Consider adding more visual effects if desired',
            'Monitor for future performance regressions'
        ];
    }
    return guidance;
}
async function generateWorkflowAssistance(workflowStep) {
    const assistance = {
        currentStep: workflowStep,
        nextSteps: [],
        tips: [],
        resources: []
    };
    // Provide workflow-specific assistance
    switch (workflowStep) {
        case 'project_setup':
            assistance.nextSteps = ['Create main scene', 'Set up input actions', 'Create player character'];
            assistance.tips = ['Use Godot\'s project templates', 'Set up version control early'];
            break;
        case 'character_creation':
            assistance.nextSteps = ['Add collision shapes', 'Implement movement', 'Add animations'];
            assistance.tips = ['Use CharacterBody2D/3D for player characters', 'Test movement in different scenarios'];
            break;
        case 'level_design':
            assistance.nextSteps = ['Create tilemaps', 'Add interactive objects', 'Test navigation'];
            assistance.tips = ['Use Godot\'s TileMap system', 'Consider level streaming for large worlds'];
            break;
        default:
            assistance.nextSteps = ['Plan your game mechanics', 'Create prototype scenes', 'Iterate and test'];
            assistance.tips = ['Start small and build incrementally', 'Test early and often'];
    }
    return assistance;
}
/**
 * Formatting functions for responses
 */
function formatEnhancedPrompt(original, enhanced, context) {
    let output = "🚀 **Enhanced Prompt**\n\n";
    output += "**Original:**\n```\n" + original + "\n```\n\n";
    output += "**Enhanced with Context:**\n```\n" + enhanced + "\n```\n\n";
    if (context.godotContext) {
        output += "**Context Added:**\n";
        if (context.godotContext.currentScene) {
            output += `• Scene: ${context.godotContext.currentScene}\n`;
        }
        if (context.godotContext.selectedNodes?.length > 0) {
            output += `• Selected Nodes: ${context.godotContext.selectedNodes.length}\n`;
        }
    }
    return output;
}
function formatContextAnalysis(context, suggestions) {
    let output = "🔍 **Context Analysis**\n\n";
    if (context.godotContext) {
        output += "**Godot Context:**\n";
        output += `• Current Scene: ${context.godotContext.currentScene || 'None'}\n`;
        output += `• Selected Nodes: ${context.godotContext.selectedNodes?.length || 0}\n`;
        output += `• Open Scripts: ${context.godotContext.openScripts?.length || 0}\n`;
    }
    if (suggestions && suggestions.length > 0) {
        output += "\n**Suggested Enhancements:**\n";
        suggestions.slice(0, 5).forEach((suggestion, index) => {
            output += `${index + 1}. ${suggestion.description} (${(suggestion.confidence * 100).toFixed(1)}% confidence)\n`;
        });
    }
    return output;
}
function formatImprovementSuggestions(suggestions, currentPrompt) {
    let output = "💡 **Prompt Improvement Suggestions**\n\n";
    output += "**Current Prompt:**\n```\n" + currentPrompt + "\n```\n\n";
    if (suggestions && suggestions.length > 0) {
        output += "**Suggestions:**\n";
        suggestions.forEach((suggestion, index) => {
            output += `${index + 1}. **${suggestion.type}** (${(suggestion.confidence * 100).toFixed(1)}% confidence)\n`;
            output += `   ${suggestion.description}\n\n`;
        });
    }
    else {
        output += "No specific suggestions available for this prompt.\n";
    }
    return output;
}
function formatInjectionStatistics(stats) {
    let output = "📊 **Prompt Enhancement Statistics**\n\n";
    output += `**Total Injections:** ${stats.totalInjections}\n`;
    output += `**Effective Injections:** ${stats.effectiveInjections}\n`;
    output += `**Effectiveness Rate:** ${stats.effectivenessRate.toFixed(1)}%\n\n`;
    if (stats.templateStats && Object.keys(stats.templateStats).length > 0) {
        output += "**Template Performance:**\n";
        Object.entries(stats.templateStats).forEach(([name, template]) => {
            output += `• ${name}: ${template.usageCount} uses, ${(template.successRate * 100).toFixed(1)}% success rate\n`;
        });
    }
    return output;
}
function formatGuidanceResponse(guidance, includeExamples) {
    let output = `🧠 **${guidance.type.toUpperCase()} Guidance**\n\n`;
    if (guidance.rationale) {
        output += `**Why it matters:** ${guidance.rationale}\n\n`;
    }
    output += "**Recommendations:**\n";
    guidance.recommendations.forEach((rec, index) => {
        output += `${index + 1}. ${rec}\n`;
    });
    if (includeExamples && guidance.examples && guidance.examples.length > 0) {
        output += "\n**Examples:**\n";
        guidance.examples.forEach((example, index) => {
            output += `**Example ${index + 1}:**\n\`\`\`gdscript\n${example}\n\`\`\`\n\n`;
        });
    }
    return output;
}
function formatProjectAnalysis(analysis) {
    let output = "📊 **Project Analysis**\n\n";
    output += `**Focus Area:** ${analysis.focusArea}\n\n`;
    if (analysis.metrics) {
        output += "**Metrics:**\n";
        if (analysis.metrics.sceneComplexity) {
            output += `• Scene Nodes: ${analysis.metrics.sceneComplexity.total_nodes || 'N/A'}\n`;
            output += `• Scene Depth: ${analysis.metrics.sceneComplexity.max_depth || 'N/A'}\n`;
        }
        if (analysis.metrics.performance) {
            output += `• FPS: ${analysis.metrics.performance.fps?.toFixed(1) || 'N/A'}\n`;
            output += `• Memory: ${analysis.metrics.performance.memory_total?.toFixed(1) || 'N/A'} MB\n`;
        }
    }
    if (analysis.issues && analysis.issues.length > 0) {
        output += "\n**Issues Found:**\n";
        analysis.issues.forEach((issue, index) => {
            output += `${index + 1}. ${issue}\n`;
        });
    }
    if (analysis.recommendations && analysis.recommendations.length > 0) {
        output += "\n**Recommendations:**\n";
        analysis.recommendations.forEach((rec, index) => {
            output += `• ${rec}\n`;
        });
    }
    return output;
}
function formatBestPractices(practices, includeExamples) {
    let output = `📋 **${practices.category.toUpperCase()} Best Practices**\n\n`;
    output += "**Practices:**\n";
    practices.practices.forEach((practice, index) => {
        output += `${index + 1}. ${practice}\n`;
    });
    if (includeExamples && practices.examples && practices.examples.length > 0) {
        output += "\n**Examples:**\n";
        practices.examples.forEach((example, index) => {
            output += `**Example ${index + 1}:**\n\`\`\`gdscript\n${example}\n\`\`\`\n\n`;
        });
    }
    return output;
}
function formatPerformanceGuidance(guidance) {
    let output = "⚡ **Performance Guidance**\n\n";
    output += `**Current FPS:** ${guidance.currentFps}\n`;
    output += `**Status:** ${guidance.status.toUpperCase()}\n`;
    output += `**Priority:** ${guidance.priority.toUpperCase()}\n\n`;
    if (guidance.recommendations && guidance.recommendations.length > 0) {
        output += "**Recommendations:**\n";
        guidance.recommendations.forEach((rec, index) => {
            output += `${index + 1}. ${rec}\n`;
        });
    }
    return output;
}
function formatWorkflowAssistance(assistance) {
    let output = "🔄 **Workflow Assistance**\n\n";
    if (assistance.currentStep) {
        output += `**Current Step:** ${assistance.currentStep}\n\n`;
    }
    if (assistance.nextSteps && assistance.nextSteps.length > 0) {
        output += "**Next Steps:**\n";
        assistance.nextSteps.forEach((step, index) => {
            output += `${index + 1}. ${step}\n`;
        });
        output += "\n";
    }
    if (assistance.tips && assistance.tips.length > 0) {
        output += "**Tips:**\n";
        assistance.tips.forEach((tip, index) => {
            output += `• ${tip}\n`;
        });
    }
    return output;
}
//# sourceMappingURL=prompt_enhancement_tools.js.map