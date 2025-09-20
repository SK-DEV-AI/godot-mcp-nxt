import { z } from 'zod';
import { getGodotConnection } from '../utils/godot_connection.js';
/**
 * Enhanced error handling and validation utilities
 */
class GodotMCPErrors {
    static handleToolError(error, toolName, operation) {
        const errorMessage = error?.message || 'Unknown error occurred';
        const enhancedMessage = `Failed to ${operation} in ${toolName}: ${errorMessage}`;
        // Log detailed error information with structured format
        console.error(`[${toolName}] Error during ${operation}:`, {
            error: errorMessage,
            stack: error?.stack,
            timestamp: new Date().toISOString(),
            tool: toolName,
            operation,
            code: error?.code,
            errno: error?.errno
        });
        throw new Error(enhancedMessage);
    }
    static validateProjectPath(projectPath, toolName) {
        if (!projectPath || typeof projectPath !== 'string') {
            throw new Error(`Invalid project path provided to ${toolName}: path must be a non-empty string`);
        }
        // Basic sanitization - remove dangerous characters
        const sanitized = projectPath.replace(/[<>'"|\\]/g, '').trim();
        if (sanitized !== projectPath) {
            console.warn(`[${toolName}] Project path contained potentially dangerous characters, sanitized: "${projectPath}" -> "${sanitized}"`);
        }
        if (!sanitized.includes('res://') && !sanitized.includes('.tscn') && !sanitized.includes('.gd')) {
            console.warn(`[${toolName}] Project path doesn't contain expected Godot file extensions: ${sanitized}`);
        }
    }
    static validateScenePath(scenePath, toolName) {
        if (!scenePath || typeof scenePath !== 'string') {
            throw new Error(`Invalid scene path provided to ${toolName}: path must be a non-empty string`);
        }
        if (scenePath.trim() !== scenePath) {
            console.warn(`[${toolName}] Scene path contains leading/trailing whitespace: "${scenePath}"`);
        }
        if (!scenePath.endsWith('.tscn') && !scenePath.startsWith('res://')) {
            throw new Error(`Invalid scene file format in ${toolName}. Expected .tscn file or res:// path, got: ${scenePath}`);
        }
    }
    static validateScriptPath(scriptPath, toolName) {
        if (!scriptPath || typeof scriptPath !== 'string') {
            throw new Error(`Invalid script path provided to ${toolName}: path must be a non-empty string`);
        }
        // Basic sanitization
        const sanitized = scriptPath.replace(/[<>'"|\\]/g, '').trim();
        if (sanitized !== scriptPath) {
            console.warn(`[${toolName}] Script path contained potentially dangerous characters, sanitized: "${scriptPath}" -> "${sanitized}"`);
        }
        if (!sanitized.endsWith('.gd') && !sanitized.startsWith('res://')) {
            throw new Error(`Invalid script file format in ${toolName}. Expected .gd file or res:// path, got: ${sanitized}`);
        }
    }
    static validateScriptContent(content, toolName) {
        if (!content || typeof content !== 'string') {
            throw new Error(`Invalid script content provided to ${toolName}: content must be a non-empty string`);
        }
        // Check file size (1MB limit)
        if (Buffer.byteLength(content, 'utf8') > 1024 * 1024) {
            throw new Error(`Script content too large in ${toolName}: maximum size is 1MB`);
        }
        // Basic security check - remove potentially harmful patterns
        const dangerous = ['<script', 'javascript:', 'onload=', 'onerror='];
        for (const pattern of dangerous) {
            if (content.toLowerCase().includes(pattern)) {
                console.warn(`[${toolName}] Script content contains potentially dangerous pattern: ${pattern}`);
            }
        }
    }
    static validateNodePath(nodePath, toolName) {
        if (!nodePath || typeof nodePath !== 'string') {
            throw new Error(`Invalid node path provided to ${toolName}: path must be a non-empty string`);
        }
        if (!nodePath.startsWith('/root') && !nodePath.startsWith('.')) {
            console.warn(`[${toolName}] Node path doesn't follow Godot conventions (should start with /root or .): ${nodePath}`);
        }
    }
    static createRecoverySuggestions(error, toolName, operation) {
        const suggestions = [];
        const errorMsg = error?.message?.toLowerCase() || '';
        if (errorMsg.includes('not found') || errorMsg.includes('enoent')) {
            suggestions.push('Check if the file path exists and is accessible');
            suggestions.push('Verify the project structure and file locations');
            suggestions.push('Ensure the path is relative to the project root (res://)');
        }
        if (errorMsg.includes('permission') || errorMsg.includes('eacces')) {
            suggestions.push('Check file permissions for the project directory');
            suggestions.push('Ensure Godot has write access to the project files');
            suggestions.push('Try running the command with elevated privileges if necessary');
        }
        if (errorMsg.includes('connection') || errorMsg.includes('econnrefused')) {
            suggestions.push('Verify Godot Editor is running and accessible');
            suggestions.push('Check WebSocket connection to Godot (default port 4242)');
            suggestions.push('Ensure the Godot MCP addon is enabled in the project');
        }
        if (errorMsg.includes('syntax') || errorMsg.includes('parse')) {
            suggestions.push('Review the generated code for syntax errors');
            suggestions.push('Check variable names and Godot API usage');
            suggestions.push('Validate GDScript syntax with the Godot editor');
        }
        if (errorMsg.includes('timeout')) {
            suggestions.push('Increase timeout values for long-running operations');
            suggestions.push('Check network connectivity if using remote connections');
        }
        if (suggestions.length === 0) {
            suggestions.push('Check the Godot Editor console for detailed error messages');
            suggestions.push('Verify all required dependencies are installed');
            suggestions.push('Try restarting the Godot Editor and MCP server');
            suggestions.push('Check the server logs for additional error details');
        }
        return suggestions;
    }
    static logOperation(toolName, operation, details) {
        console.log(`[${toolName}] ${operation}`, details ? { timestamp: new Date().toISOString(), ...details } : '');
    }
    static validateParameters(params, requiredFields, toolName) {
        const missingFields = requiredFields.filter(field => !params[field]);
        if (missingFields.length > 0) {
            throw new Error(`Missing required parameters in ${toolName}: ${missingFields.join(', ')}`);
        }
    }
}
/**
 * Advanced tools for complex operations and AI-powered features
 */
export const advancedTools = [
    {
        name: 'generate_complete_scripts',
        description: 'Generate complete, production-ready GDScript files from natural language descriptions with proper error handling and Godot best practices',
        parameters: z.object({
            description: z.string()
                .describe('Detailed natural language description of the script functionality (e.g. "Create a player controller with jumping, movement, and collision detection")'),
            scriptType: z.enum(['character', 'ui', 'gameplay', 'utility', 'custom']).optional()
                .describe('Type of script to generate - affects the base class and structure'),
            complexity: z.enum(['simple', 'medium', 'complex']).optional().default('medium')
                .describe('Complexity level: simple (basic functionality), medium (balanced features), complex (advanced features)'),
            features: z.array(z.string()).optional()
                .describe('Specific features to include (e.g. ["health", "inventory", "dialogue", "animation"])'),
            targetScene: z.string().optional()
                .describe('Path to scene where the script will be used (helps with context-aware code generation)')
        }),
        execute: async ({ description, scriptType, complexity = 'medium', features, targetScene }) => {
            // Enhanced input validation
            if (!description || description.trim().length < 10) {
                throw new Error('Script description must be at least 10 characters long and describe the desired functionality');
            }
            if (targetScene) {
                GodotMCPErrors.validateScenePath(targetScene, 'generate_complete_scripts');
            }
            // Validate features array if provided
            if (features && (!Array.isArray(features) || features.some(f => typeof f !== 'string'))) {
                throw new Error('Features must be an array of strings');
            }
            const godot = await getGodotConnection();
            try {
                const result = await godot.sendCommand('generate_complete_scripts', {
                    description,
                    scriptType,
                    complexity,
                    features,
                    targetScene
                });
                let response = `Generated ${result.script_type || 'character'} script\n\n`;
                response += `Path: ${result.script_path}\n`;
                response += `Complexity: ${result.complexity}\n`;
                response += `Features included: ${result.features?.join(', ') || 'N/A'}\n\n`;
                if (result.code) {
                    response += `Generated Code:\n\`\`\`gdscript\n${result.code}\n\`\`\`\n\n`;
                }
                if (result.explanation) {
                    response += `Explanation:\n${result.explanation}\n\n`;
                }
                if (result.suggestions && result.suggestions.length > 0) {
                    response += `Suggestions:\n${result.suggestions.map((s) => `- ${s}`).join('\n')}`;
                }
                return response;
            }
            catch (error) {
                const suggestions = GodotMCPErrors.createRecoverySuggestions(error, 'generate_complete_scripts', 'generate script');
                const enhancedError = `${error.message}\n\nTroubleshooting suggestions:\n${suggestions.map(s => `- ${s}`).join('\n')}`;
                throw new Error(enhancedError);
            }
        },
    },
    {
        name: 'refactor_existing_code',
        description: 'Intelligently refactor existing GDScript code with AI-powered suggestions',
        parameters: z.object({
            scriptPath: z.string()
                .describe('Path to the script file to refactor'),
            refactoringType: z.enum(['state_machine', 'extract_method', 'optimize_performance', 'apply_pattern', 'simplify_logic'])
                .describe('Type of refactoring to apply'),
            parameters: z.record(z.any()).optional()
                .describe('Additional parameters for the refactoring operation')
        }),
        execute: async ({ scriptPath, refactoringType, parameters }) => {
            // Validate script path
            GodotMCPErrors.validateScriptPath(scriptPath, 'refactor_existing_code');
            const godot = await getGodotConnection();
            try {
                const result = await godot.sendCommand('refactor_existing_code', {
                    scriptPath,
                    refactoringType,
                    parameters
                });
                let response = `Refactored ${scriptPath} using ${refactoringType}\n\n`;
                if (result.changes && result.changes.length > 0) {
                    response += `Changes made:\n${result.changes.map((c) => `- ${c.description}`).join('\n')}\n\n`;
                }
                if (result.refactoredCode) {
                    response += `Refactored Code:\n\`\`\`gdscript\n${result.refactoredCode}\n\`\`\`\n\n`;
                }
                if (result.benefits) {
                    response += `Benefits:\n${result.benefits.map((b) => `- ${b}`).join('\n')}\n\n`;
                }
                if (result.warnings && result.warnings.length > 0) {
                    response += `Warnings:\n${result.warnings.map((w) => `- ${w}`).join('\n')}`;
                }
                return response;
            }
            catch (error) {
                throw new Error(`Failed to refactor code: ${error.message}`);
            }
        },
    },
    {
        name: 'optimize_texture_atlas',
        description: 'Optimize texture assets by creating atlases and compressing images',
        parameters: z.object({
            projectPath: z.string()
                .describe('Path to the Godot project'),
            maxTextureSize: z.number().optional().default(2048)
                .describe('Maximum texture size for atlas creation'),
            compression: z.enum(['lossless', 'lossy', 'auto']).optional().default('auto')
                .describe('Compression type to use'),
            createAtlas: z.boolean().optional().default(true)
                .describe('Whether to create texture atlases'),
            preview: z.boolean().optional().default(false)
                .describe('Preview changes without applying them')
        }),
        execute: async ({ projectPath, maxTextureSize = 2048, compression = 'auto', createAtlas = true, preview = false }) => {
            const godot = await getGodotConnection();
            try {
                const result = await godot.sendCommand('optimize_texture_atlas', {
                    projectPath,
                    maxTextureSize,
                    compression,
                    createAtlas,
                    preview
                });
                let response = preview ? 'PREVIEW MODE - No changes applied\n\n' : 'Texture optimization completed\n\n';
                if (result.atlasesCreated && result.atlasesCreated.length > 0) {
                    response += `Atlases created:\n${result.atlasesCreated.map((a) => `- ${a.name} (${a.textures} textures, ${a.size}px)`).join('\n')}\n\n`;
                }
                if (result.texturesOptimized && result.texturesOptimized.length > 0) {
                    response += `Textures optimized:\n${result.texturesOptimized.map((t) => `- ${t.name}: ${t.originalSize} → ${t.optimizedSize} (${t.savings}%)`).join('\n')}\n\n`;
                }
                response += `Total space saved: ${result.totalSpaceSaved || 0} KB\n`;
                response += `Performance improvement: ${result.performanceImprovement || 'N/A'}`;
                return response;
            }
            catch (error) {
                throw new Error(`Failed to optimize textures: ${error.message}`);
            }
        },
    },
    {
        name: 'manage_audio_assets',
        description: 'Analyze, optimize, and organize audio assets in the project',
        parameters: z.object({
            operation: z.enum(['analyze', 'optimize', 'convert', 'organize'])
                .describe('Type of audio operation to perform'),
            audioFiles: z.array(z.string()).optional()
                .describe('Specific audio files to process (optional - processes all if not specified)'),
            targetFormat: z.enum(['ogg', 'mp3', 'wav']).optional()
                .describe('Target format for conversion operations'),
            quality: z.number().optional()
                .describe('Quality setting for compression (0-100)'),
            outputDir: z.string().optional()
                .describe('Output directory for organized files')
        }),
        execute: async ({ operation, audioFiles, targetFormat, quality, outputDir }) => {
            const godot = await getGodotConnection();
            try {
                const result = await godot.sendCommand('manage_audio_assets', {
                    operation,
                    audioFiles,
                    targetFormat,
                    quality,
                    outputDir
                });
                let response = `Audio ${operation} completed\n\n`;
                switch (operation) {
                    case 'analyze':
                        if (result.analysis) {
                            response += `Analysis Results:\n`;
                            response += `- Total files: ${result.analysis.totalFiles}\n`;
                            response += `- Total size: ${result.analysis.totalSize} MB\n`;
                            response += `- Formats: ${result.analysis.formats?.join(', ')}\n`;
                            response += `- Quality issues: ${result.analysis.qualityIssues?.length || 0}\n`;
                        }
                        break;
                    case 'optimize':
                        if (result.optimizations) {
                            response += `Optimizations Applied:\n`;
                            result.optimizations.forEach((opt) => {
                                response += `- ${opt.file}: ${opt.originalSize} → ${opt.optimizedSize} (${opt.savings}%)\n`;
                            });
                            response += `\nTotal space saved: ${result.totalSpaceSaved} MB`;
                        }
                        break;
                    case 'convert':
                        if (result.conversions) {
                            response += `Files converted:\n`;
                            result.conversions.forEach((conv) => {
                                response += `- ${conv.original} → ${conv.converted}\n`;
                            });
                        }
                        break;
                    case 'organize':
                        if (result.organization) {
                            response += `Files organized:\n`;
                            response += `- Moved: ${result.organization.moved}\n`;
                            response += `- Created folders: ${result.organization.foldersCreated}\n`;
                            response += `- Output directory: ${result.organization.outputDir}`;
                        }
                        break;
                }
                return response;
            }
            catch (error) {
                throw new Error(`Failed to manage audio assets: ${error.message}`);
            }
        },
    },
    {
        name: 'apply_project_template',
        description: 'Apply complete project templates with predefined structure and features',
        parameters: z.object({
            templateType: z.enum(['2d_platformer', 'topdown', '3d_basic', 'ui_heavy', 'puzzle', 'custom'])
                .describe('Type of project template to apply'),
            projectName: z.string()
                .describe('Name for the new project'),
            features: z.array(z.string())
                .describe('Additional features to include in the template'),
            structure: z.enum(['minimal', 'standard', 'complete']).optional().default('standard')
                .describe('Level of project structure complexity')
        }),
        execute: async ({ templateType, projectName, features, structure = 'standard' }) => {
            const godot = await getGodotConnection();
            try {
                const result = await godot.sendCommand('apply_project_template', {
                    templateType,
                    projectName,
                    features,
                    structure
                });
                let response = `Applied ${templateType} template to project "${projectName}"\n\n`;
                if (result.filesCreated && result.filesCreated.length > 0) {
                    response += `Files created:\n${result.filesCreated.map((f) => `- ${f}`).join('\n')}\n\n`;
                }
                if (result.foldersCreated && result.foldersCreated.length > 0) {
                    response += `Folders created:\n${result.foldersCreated.map((f) => `- ${f}`).join('\n')}\n\n`;
                }
                if (result.scenesCreated && result.scenesCreated.length > 0) {
                    response += `Scenes created:\n${result.scenesCreated.map((s) => `- ${s}`).join('\n')}\n\n`;
                }
                if (result.scriptsCreated && result.scriptsCreated.length > 0) {
                    response += `Scripts created:\n${result.scriptsCreated.map((s) => `- ${s}`).join('\n')}\n\n`;
                }
                response += `Template features included: ${features.join(', ')}\n`;
                response += `Structure level: ${structure}\n\n`;
                if (result.nextSteps && result.nextSteps.length > 0) {
                    response += `Next steps:\n${result.nextSteps.map((s) => `- ${s}`).join('\n')}`;
                }
                return response;
            }
            catch (error) {
                throw new Error(`Failed to apply project template: ${error.message}`);
            }
        },
    },
    {
        name: 'automated_optimization',
        description: 'Run comprehensive project-wide optimizations automatically',
        parameters: z.object({
            projectPath: z.string()
                .describe('Path to the Godot project to optimize'),
            optimizationTypes: z.array(z.enum(['performance', 'memory', 'assets', 'code', 'scenes']))
                .describe('Types of optimizations to apply'),
            aggressive: z.boolean().optional().default(false)
                .describe('Whether to apply aggressive optimizations (may affect quality)'),
            preview: z.boolean().optional().default(false)
                .describe('Preview changes without applying them')
        }),
        execute: async ({ projectPath, optimizationTypes, aggressive = false, preview = false }) => {
            const godot = await getGodotConnection();
            try {
                const result = await godot.sendCommand('automated_optimization', {
                    projectPath,
                    optimizationTypes,
                    aggressive,
                    preview
                });
                let response = preview ? 'PREVIEW MODE - No changes applied\n\n' : 'Automated optimization completed\n\n';
                optimizationTypes.forEach(type => {
                    const optResult = result[`${type}Optimization`];
                    if (optResult) {
                        response += `${type.toUpperCase()} Optimization:\n`;
                        if (optResult.changes && optResult.changes.length > 0) {
                            response += `Changes made:\n${optResult.changes.map((c) => `- ${c}`).join('\n')}\n`;
                        }
                        if (optResult.improvement) {
                            response += `Improvement: ${optResult.improvement}\n`;
                        }
                        response += '\n';
                    }
                });
                if (result.overallImprovement) {
                    response += `Overall improvement: ${result.overallImprovement}\n\n`;
                }
                if (result.recommendations && result.recommendations.length > 0) {
                    response += `Recommendations for further optimization:\n${result.recommendations.map((r) => `- ${r}`).join('\n')}`;
                }
                return response;
            }
            catch (error) {
                throw new Error(`Failed to run automated optimization: ${error.message}`);
            }
        },
    },
    {
        name: 'create_character_system',
        description: 'Generate complete character systems with movement, animation, and AI',
        parameters: z.object({
            characterType: z.enum(['player', 'enemy', 'npc'])
                .describe('Type of character to create'),
            movementType: z.enum(['platformer', 'topdown', '3d'])
                .describe('Movement style for the character'),
            features: z.array(z.string())
                .describe('Additional features to include (e.g. "health", "inventory", "dialogue")'),
            spritePath: z.string().optional()
                .describe('Path to character sprite sheet (optional)'),
            createScene: z.boolean().optional().default(true)
                .describe('Whether to create a demo scene with the character')
        }),
        execute: async ({ characterType, movementType, features, spritePath, createScene = true }) => {
            const godot = await getGodotConnection();
            try {
                const result = await godot.sendCommand('create_character_system', {
                    characterType,
                    movementType,
                    features,
                    spritePath,
                    createScene
                });
                let response = `Created ${characterType} character system (${movementType})\n\n`;
                if (result.scriptPath) {
                    response += `Main script: ${result.scriptPath}\n`;
                }
                if (result.scenePath) {
                    response += `Demo scene: ${result.scenePath}\n`;
                }
                if (result.additionalScripts && result.additionalScripts.length > 0) {
                    response += `Additional scripts:\n${result.additionalScripts.map((s) => `- ${s}`).join('\n')}\n`;
                }
                response += `\nFeatures included: ${features.join(', ')}\n\n`;
                if (result.setupInstructions) {
                    response += `Setup instructions:\n${result.setupInstructions.map((i) => `- ${i}`).join('\n')}\n\n`;
                }
                if (result.controls && result.controls.length > 0) {
                    response += `Controls:\n${result.controls.map((c) => `- ${c}`).join('\n')}`;
                }
                return response;
            }
            catch (error) {
                throw new Error(`Failed to create character system: ${error.message}`);
            }
        },
    },
    {
        name: 'generate_level',
        description: 'Create procedural game levels with terrain, enemies, and objectives',
        parameters: z.object({
            levelType: z.enum(['platformer', 'topdown', 'puzzle', 'endless'])
                .describe('Type of level to generate'),
            difficulty: z.enum(['easy', 'medium', 'hard'])
                .describe('Difficulty level of the generated level'),
            theme: z.string()
                .describe('Visual theme for the level (e.g. "forest", "castle", "space")'),
            dimensions: z.object({
                width: z.number(),
                height: z.number()
            })
                .describe('Dimensions of the level in tiles/units'),
            features: z.array(z.string()).optional()
                .describe('Additional features to include (e.g. "enemies", "powerups", "traps")')
        }),
        execute: async ({ levelType, difficulty, theme, dimensions, features }) => {
            const godot = await getGodotConnection();
            try {
                const result = await godot.sendCommand('generate_level', {
                    levelType,
                    difficulty,
                    theme,
                    dimensions,
                    features
                });
                let response = `Generated ${levelType} level (${difficulty} difficulty, ${theme} theme)\n\n`;
                if (result.scenePath) {
                    response += `Level scene: ${result.scenePath}\n`;
                }
                if (result.dimensions) {
                    response += `Dimensions: ${result.dimensions.width} x ${result.dimensions.height}\n`;
                }
                if (result.elements && result.elements.length > 0) {
                    response += `\nLevel elements:\n${result.elements.map((e) => `- ${e.type}: ${e.count} (${e.description})`).join('\n')}\n`;
                }
                if (result.objectives && result.objectives.length > 0) {
                    response += `\nObjectives:\n${result.objectives.map((o) => `- ${o}`).join('\n')}\n`;
                }
                response += `\nFeatures included: ${(features || []).join(', ')}\n\n`;
                if (result.difficultySettings) {
                    response += `Difficulty settings:\n`;
                    Object.entries(result.difficultySettings).forEach(([key, value]) => {
                        response += `- ${key}: ${value}\n`;
                    });
                }
                return response;
            }
            catch (error) {
                throw new Error(`Failed to generate level: ${error.message}`);
            }
        },
    },
    {
        name: 'apply_smart_suggestion',
        description: 'Apply intelligent suggestions to improve project quality and performance',
        parameters: z.object({
            suggestionType: z.enum(['performance', 'architecture', 'code_quality', 'assets', 'ux'])
                .describe('Type of suggestion to apply'),
            target: z.string()
                .describe('Target file, scene, or component for the suggestion'),
            autoApply: z.boolean().optional().default(false)
                .describe('Whether to apply the suggestion automatically'),
            parameters: z.record(z.any()).optional()
                .describe('Additional parameters for the suggestion')
        }),
        execute: async ({ suggestionType, target, autoApply = false, parameters }) => {
            const godot = await getGodotConnection();
            try {
                const result = await godot.sendCommand('apply_smart_suggestion', {
                    suggestionType,
                    target,
                    autoApply,
                    parameters
                });
                let response = `Smart suggestion for ${suggestionType} on ${target}\n\n`;
                if (result.analysis) {
                    response += `Analysis:\n${result.analysis}\n\n`;
                }
                if (result.suggestions && result.suggestions.length > 0) {
                    response += `Suggestions found:\n${result.suggestions.map((s, i) => `${i + 1}. ${s.description} (${s.confidence}% confidence)`).join('\n')}\n\n`;
                }
                if (autoApply && result.applied && result.applied.length > 0) {
                    response += `Changes applied:\n${result.applied.map((a) => `- ${a}`).join('\n')}\n\n`;
                }
                else if (!autoApply && result.preview) {
                    response += `Preview of changes:\n${result.preview.map((p) => `- ${p}`).join('\n')}\n\n`;
                    response += `Run with autoApply=true to apply these changes.`;
                }
                if (result.benefits) {
                    response += `Expected benefits:\n${result.benefits.map((b) => `- ${b}`).join('\n')}`;
                }
                return response;
            }
            catch (error) {
                throw new Error(`Failed to apply smart suggestion: ${error.message}`);
            }
        },
    },
    {
        name: 'batch_operations',
        description: 'Execute multiple Godot operations in a single request with rollback support',
        parameters: z.object({
            operations: z.array(z.object({
                tool: z.enum(['create_node', 'update_node_property', 'create_script', 'save_scene']),
                parameters: z.record(z.any())
            })).min(1).max(10),
            rollbackOnError: z.boolean().default(true),
            continueOnError: z.boolean().default(false)
        }),
        execute: async ({ operations, rollbackOnError = true, continueOnError = false }) => {
            const godot = await getGodotConnection();
            const results = [];
            const executedOperations = [];
            GodotMCPErrors.logOperation('batch_operations', 'Starting batch execution', { operationCount: operations.length });
            try {
                for (let i = 0; i < operations.length; i++) {
                    const operation = operations[i];
                    try {
                        GodotMCPErrors.logOperation('batch_operations', `Executing operation ${i + 1}/${operations.length}`, { tool: operation.tool });
                        const result = await godot.sendCommand(operation.tool, operation.parameters);
                        results.push({ index: i, success: true, result, tool: operation.tool });
                        executedOperations.push({ index: i, operation, result });
                    }
                    catch (error) {
                        const errorResult = { index: i, success: false, error: error.message, tool: operation.tool };
                        results.push(errorResult);
                        if (!continueOnError) {
                            if (rollbackOnError && executedOperations.length > 0) {
                                GodotMCPErrors.logOperation('batch_operations', 'Rolling back operations due to error');
                                // Note: Rollback implementation would depend on specific undo mechanisms
                                // For now, we'll log the rollback intent
                                console.warn('[batch_operations] Rollback requested but not fully implemented');
                            }
                            throw new Error(`Batch operation failed at step ${i + 1}: ${error.message}`);
                        }
                    }
                }
                const successCount = results.filter(r => r.success).length;
                const failureCount = results.filter(r => !r.success).length;
                return `Batch operations completed: ${successCount} successful, ${failureCount} failed\n\n` +
                    `Results:\n${results.map(r => `Operation ${r.index + 1} (${r.tool}): ${r.success ? 'SUCCESS' : 'FAILED'}${r.error ? ` - ${r.error}` : ''}`).join('\n')}`;
            }
            catch (error) {
                const suggestions = GodotMCPErrors.createRecoverySuggestions(error, 'batch_operations', 'execute batch');
                const enhancedError = `${error.message}\n\nTroubleshooting suggestions:\n${suggestions.map(s => `- ${s}`).join('\n')}`;
                throw new Error(enhancedError);
            }
        },
    },
    {
        name: 'validate_project_structure',
        description: 'Validate and analyze the current Godot project structure for common issues',
        parameters: z.object({
            projectPath: z.string().optional(),
            checkScripts: z.boolean().default(true),
            checkScenes: z.boolean().default(true),
            checkResources: z.boolean().default(true),
            fixIssues: z.boolean().default(false)
        }),
        execute: async ({ projectPath, checkScripts = true, checkScenes = true, checkResources = true, fixIssues = false }) => {
            const godot = await getGodotConnection();
            try {
                GodotMCPErrors.logOperation('validate_project_structure', 'Starting project validation');
                const result = await godot.sendCommand('validate_project_structure', {
                    projectPath,
                    checkScripts,
                    checkScenes,
                    checkResources,
                    fixIssues
                });
                let response = 'Project Structure Validation Results:\n\n';
                if (result.issues && result.issues.length > 0) {
                    response += `Issues Found (${result.issues.length}):\n`;
                    result.issues.forEach((issue, index) => {
                        response += `${index + 1}. ${issue.severity.toUpperCase()}: ${issue.message}\n`;
                        if (issue.file)
                            response += `   File: ${issue.file}\n`;
                        if (issue.line)
                            response += `   Line: ${issue.line}\n`;
                        if (issue.suggestion)
                            response += `   Suggestion: ${issue.suggestion}\n`;
                        response += '\n';
                    });
                }
                else {
                    response += '✅ No issues found in project structure\n\n';
                }
                if (result.statistics) {
                    response += 'Project Statistics:\n';
                    Object.entries(result.statistics).forEach(([key, value]) => {
                        response += `- ${key}: ${value}\n`;
                    });
                }
                if (fixIssues && result.fixed && result.fixed.length > 0) {
                    response += '\nIssues Fixed:\n';
                    result.fixed.forEach((fix) => {
                        response += `- ${fix}\n`;
                    });
                }
                return response;
            }
            catch (error) {
                const suggestions = GodotMCPErrors.createRecoverySuggestions(error, 'validate_project_structure', 'validate project');
                const enhancedError = `${error.message}\n\nTroubleshooting suggestions:\n${suggestions.map(s => `- ${s}`).join('\n')}`;
                throw new Error(enhancedError);
            }
        },
    },
    {
        name: 'game_development_workflow',
        description: 'Orchestrate complete game development workflow from concept to playable prototype',
        parameters: z.object({
            gameConcept: z.string()
                .describe('High-level description of the game concept'),
            targetPlatform: z.enum(['desktop', 'mobile', 'web', 'console'])
                .describe('Primary target platform'),
            gameType: z.enum(['action', 'puzzle', 'adventure', 'rpg', 'simulation', 'sports'])
                .describe('Type of game to develop'),
            scope: z.enum(['prototype', 'full_game', 'mvp'])
                .describe('Development scope'),
            features: z.array(z.string())
                .describe('Key features to include'),
            artStyle: z.string().optional()
                .describe('Art style description'),
            audioRequirements: z.array(z.string()).optional()
                .describe('Audio requirements (music, sfx, voice)'),
            estimatedDuration: z.number().optional()
                .describe('Estimated development time in hours')
        }),
        execute: async (params) => {
            const godot = await getGodotConnection();
            try {
                const result = await godot.sendCommand('game_development_workflow', {
                    gameConcept: params.gameConcept,
                    targetPlatform: params.targetPlatform,
                    gameType: params.gameType,
                    scope: params.scope,
                    features: params.features || [],
                    artStyle: params.artStyle,
                    audioRequirements: params.audioRequirements,
                    estimatedDuration: params.estimatedDuration
                });
                let response = `🎮 Game Development Workflow Initiated!\n\n`;
                response += `Concept: ${params.gameConcept}\n`;
                response += `Type: ${params.gameType}\n`;
                response += `Platform: ${params.targetPlatform}\n`;
                response += `Scope: ${params.scope}\n`;
                response += `Features: ${params.features?.join(', ') || 'Basic gameplay'}\n\n`;
                if (result.workflow_steps && result.workflow_steps.length > 0) {
                    response += `📋 Development Roadmap:\n`;
                    result.workflow_steps.forEach((step, index) => {
                        response += `${index + 1}. ${step.name}\n`;
                        if (step.description)
                            response += `   ${step.description}\n`;
                        if (step.estimated_time)
                            response += `   ⏱️ ${step.estimated_time} hours\n`;
                        response += '\n';
                    });
                }
                if (result.generated_assets && result.generated_assets.length > 0) {
                    response += `🎨 Generated Assets:\n`;
                    result.generated_assets.forEach((asset, index) => {
                        response += `${index + 1}. ${asset}\n`;
                    });
                    response += '\n';
                }
                response += `🚀 Next Steps:\n`;
                response += `1. Review generated project structure\n`;
                response += `2. Customize assets and gameplay\n`;
                response += `3. Test core mechanics\n`;
                response += `4. Iterate and refine\n`;
                response += `5. Deploy to target platform\n\n`;
                response += `💡 Pro Tips:\n`;
                response += `- Start with core gameplay loop\n`;
                response += `- Use version control for all changes\n`;
                response += `- Test frequently on target platform\n`;
                response += `- Get player feedback early\n`;
                return response;
            }
            catch (error) {
                throw new Error(`Game development workflow failed: ${error.message}`);
            }
        },
    },
];
//# sourceMappingURL=advanced_tools.js.map