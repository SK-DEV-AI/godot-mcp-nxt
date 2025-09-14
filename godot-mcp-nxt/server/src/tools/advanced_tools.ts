import { z } from 'zod';
import { getGodotConnection } from '../utils/godot_connection.js';
import { MCPTool, CommandResult } from '../utils/types.js';

/**
 * Enhanced error handling utilities
 */
class GodotMCPErrors {
  static handleToolError(error: any, toolName: string, operation: string): never {
    const errorMessage = error?.message || 'Unknown error occurred';
    const enhancedMessage = `Failed to ${operation} in ${toolName}: ${errorMessage}`;

    // Log detailed error information
    console.error(`[${toolName}] Error during ${operation}:`, {
      error: errorMessage,
      stack: error?.stack,
      timestamp: new Date().toISOString(),
      tool: toolName,
      operation
    });

    throw new Error(enhancedMessage);
  }

  static validateProjectPath(projectPath: string, toolName: string): void {
    if (!projectPath || typeof projectPath !== 'string') {
      throw new Error(`Invalid project path provided to ${toolName}`);
    }

    if (!projectPath.includes('res://') && !projectPath.includes('.tscn') && !projectPath.includes('.gd')) {
      console.warn(`[${toolName}] Project path doesn't contain expected Godot file extensions: ${projectPath}`);
    }
  }

  static validateScenePath(scenePath: string, toolName: string): void {
    if (!scenePath || typeof scenePath !== 'string') {
      throw new Error(`Invalid scene path provided to ${toolName}`);
    }

    if (!scenePath.endsWith('.tscn') && !scenePath.startsWith('res://')) {
      throw new Error(`Invalid scene file format. Expected .tscn file or res:// path in ${toolName}`);
    }
  }

  static validateScriptPath(scriptPath: string, toolName: string): void {
    if (!scriptPath || typeof scriptPath !== 'string') {
      throw new Error(`Invalid script path provided to ${toolName}`);
    }

    if (!scriptPath.endsWith('.gd') && !scriptPath.startsWith('res://')) {
      throw new Error(`Invalid script file format. Expected .gd file or res:// path in ${toolName}`);
    }
  }

  static createRecoverySuggestions(error: any, toolName: string, operation: string): string[] {
    const suggestions: string[] = [];

    if (error?.message?.includes('not found')) {
      suggestions.push('Check if the file path exists and is accessible');
      suggestions.push('Verify the project structure and file locations');
    }

    if (error?.message?.includes('permission')) {
      suggestions.push('Check file permissions for the project directory');
      suggestions.push('Ensure Godot has write access to the project files');
    }

    if (error?.message?.includes('connection')) {
      suggestions.push('Verify Godot Editor is running and accessible');
      suggestions.push('Check WebSocket connection to Godot');
    }

    if (error?.message?.includes('syntax')) {
      suggestions.push('Review the generated code for syntax errors');
      suggestions.push('Check variable names and Godot API usage');
    }

    if (suggestions.length === 0) {
      suggestions.push('Check the Godot Editor console for detailed error messages');
      suggestions.push('Verify all required dependencies are installed');
      suggestions.push('Try restarting the Godot Editor and MCP server');
    }

    return suggestions;
  }
}

/**
 * Type definitions for advanced tool parameters
 */
interface GenerateCompleteScriptsParams {
  description: string;
  scriptType?: 'character' | 'ui' | 'gameplay' | 'utility' | 'custom';
  complexity?: 'simple' | 'medium' | 'complex';
  features?: string[];
  targetScene?: string;
}

interface RefactorExistingCodeParams {
  scriptPath: string;
  refactoringType: 'state_machine' | 'extract_method' | 'optimize_performance' | 'apply_pattern' | 'simplify_logic';
  parameters?: Record<string, any>;
}

interface OptimizeTextureAtlasParams {
  projectPath: string;
  maxTextureSize?: number;
  compression?: 'lossless' | 'lossy' | 'auto';
  createAtlas?: boolean;
  preview?: boolean;
}

interface ManageAudioAssetsParams {
  operation: 'analyze' | 'optimize' | 'convert' | 'organize';
  audioFiles?: string[];
  targetFormat?: 'ogg' | 'mp3' | 'wav';
  quality?: number;
  outputDir?: string;
}

interface ApplyProjectTemplateParams {
  templateType: '2d_platformer' | 'topdown' | '3d_basic' | 'ui_heavy' | 'puzzle' | 'custom';
  projectName: string;
  features: string[];
  structure?: 'minimal' | 'standard' | 'complete';
}

interface AutomatedOptimizationParams {
  projectPath: string;
  optimizationTypes: Array<'performance' | 'memory' | 'assets' | 'code' | 'scenes'>;
  aggressive?: boolean;
  preview?: boolean;
}

interface CreateCharacterSystemParams {
  characterType: 'player' | 'enemy' | 'npc';
  movementType: 'platformer' | 'topdown' | '3d';
  features: string[];
  spritePath?: string;
  createScene?: boolean;
}

interface GenerateLevelParams {
  levelType: 'platformer' | 'topdown' | 'puzzle' | 'endless';
  difficulty: 'easy' | 'medium' | 'hard';
  theme: string;
  dimensions: { width: number; height: number };
  features?: string[];
}

interface ApplySmartSuggestionParams {
  suggestionType: 'performance' | 'architecture' | 'code_quality' | 'assets' | 'ux';
  target: string;
  autoApply?: boolean;
  parameters?: Record<string, any>;
}

/**
 * Advanced tools for complex operations and AI-powered features
 */
export const advancedTools: MCPTool[] = [
  {
    name: 'generate_complete_scripts',
    description: 'Generate complete GDScript files from natural language descriptions',
    parameters: z.object({
      description: z.string()
        .describe('Natural language description of the script functionality (e.g. "Create a player controller with jumping and movement")'),
      scriptType: z.enum(['character', 'ui', 'gameplay', 'utility', 'custom']).optional()
        .describe('Type of script to generate'),
      complexity: z.enum(['simple', 'medium', 'complex']).optional().default('medium')
        .describe('Complexity level of the generated script'),
      features: z.array(z.string()).optional()
        .describe('Specific features to include in the script'),
      targetScene: z.string().optional()
        .describe('Path to scene where the script will be used (for context)')
    }),
    execute: async ({ description, scriptType, complexity = 'medium', features, targetScene }: GenerateCompleteScriptsParams): Promise<string> => {
      // Enhanced input validation
      if (!description || description.trim().length < 10) {
        throw new Error('Script description must be at least 10 characters long and describe the desired functionality');
      }

      if (targetScene) {
        GodotMCPErrors.validateScenePath(targetScene, 'generate_complete_scripts');
      }

      const godot = getGodotConnection();

      try {
        const result = await godot.sendCommand<CommandResult>('generate_complete_scripts', {
          description,
          scriptType,
          complexity,
          features,
          targetScene
        });

        let response = `Generated ${result.scriptType} script: ${result.scriptName}\n\n`;
        response += `Path: ${result.scriptPath}\n`;
        response += `Complexity: ${result.complexity}\n`;
        response += `Features included: ${result.features?.join(', ') || 'N/A'}\n\n`;

        if (result.code) {
          response += `Generated Code:\n\`\`\`gdscript\n${result.code}\n\`\`\`\n\n`;
        }

        if (result.explanation) {
          response += `Explanation:\n${result.explanation}\n\n`;
        }

        if (result.suggestions && result.suggestions.length > 0) {
          response += `Suggestions:\n${result.suggestions.map((s: string) => `- ${s}`).join('\n')}`;
        }

        return response;
      } catch (error) {
        const suggestions = GodotMCPErrors.createRecoverySuggestions(error, 'generate_complete_scripts', 'generate script');
        const enhancedError = `${(error as Error).message}\n\nTroubleshooting suggestions:\n${suggestions.map(s => `- ${s}`).join('\n')}`;
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
    execute: async ({ scriptPath, refactoringType, parameters }: RefactorExistingCodeParams): Promise<string> => {
      const godot = getGodotConnection();

      try {
        const result = await godot.sendCommand<CommandResult>('refactor_existing_code', {
          scriptPath,
          refactoringType,
          parameters
        });

        let response = `Refactored ${scriptPath} using ${refactoringType}\n\n`;

        if (result.changes && result.changes.length > 0) {
          response += `Changes made:\n${result.changes.map((c: any) => `- ${c.description}`).join('\n')}\n\n`;
        }

        if (result.refactoredCode) {
          response += `Refactored Code:\n\`\`\`gdscript\n${result.refactoredCode}\n\`\`\`\n\n`;
        }

        if (result.benefits) {
          response += `Benefits:\n${result.benefits.map((b: string) => `- ${b}`).join('\n')}\n\n`;
        }

        if (result.warnings && result.warnings.length > 0) {
          response += `Warnings:\n${result.warnings.map((w: string) => `- ${w}`).join('\n')}`;
        }

        return response;
      } catch (error) {
        throw new Error(`Failed to refactor code: ${(error as Error).message}`);
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
    execute: async ({ projectPath, maxTextureSize = 2048, compression = 'auto', createAtlas = true, preview = false }: OptimizeTextureAtlasParams): Promise<string> => {
      const godot = getGodotConnection();

      try {
        const result = await godot.sendCommand<CommandResult>('optimize_texture_atlas', {
          projectPath,
          maxTextureSize,
          compression,
          createAtlas,
          preview
        });

        let response = preview ? 'PREVIEW MODE - No changes applied\n\n' : 'Texture optimization completed\n\n';

        if (result.atlasesCreated && result.atlasesCreated.length > 0) {
          response += `Atlases created:\n${result.atlasesCreated.map((a: any) => `- ${a.name} (${a.textures} textures, ${a.size}px)`).join('\n')}\n\n`;
        }

        if (result.texturesOptimized && result.texturesOptimized.length > 0) {
          response += `Textures optimized:\n${result.texturesOptimized.map((t: any) => `- ${t.name}: ${t.originalSize} → ${t.optimizedSize} (${t.savings}%)`).join('\n')}\n\n`;
        }

        response += `Total space saved: ${result.totalSpaceSaved || 0} KB\n`;
        response += `Performance improvement: ${result.performanceImprovement || 'N/A'}`;

        return response;
      } catch (error) {
        throw new Error(`Failed to optimize textures: ${(error as Error).message}`);
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
    execute: async ({ operation, audioFiles, targetFormat, quality, outputDir }: ManageAudioAssetsParams): Promise<string> => {
      const godot = getGodotConnection();

      try {
        const result = await godot.sendCommand<CommandResult>('manage_audio_assets', {
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
              result.optimizations.forEach((opt: any) => {
                response += `- ${opt.file}: ${opt.originalSize} → ${opt.optimizedSize} (${opt.savings}%)\n`;
              });
              response += `\nTotal space saved: ${result.totalSpaceSaved} MB`;
            }
            break;

          case 'convert':
            if (result.conversions) {
              response += `Files converted:\n`;
              result.conversions.forEach((conv: any) => {
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
      } catch (error) {
        throw new Error(`Failed to manage audio assets: ${(error as Error).message}`);
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
    execute: async ({ templateType, projectName, features, structure = 'standard' }: ApplyProjectTemplateParams): Promise<string> => {
      const godot = getGodotConnection();

      try {
        const result = await godot.sendCommand<CommandResult>('apply_project_template', {
          templateType,
          projectName,
          features,
          structure
        });

        let response = `Applied ${templateType} template to project "${projectName}"\n\n`;

        if (result.filesCreated && result.filesCreated.length > 0) {
          response += `Files created:\n${result.filesCreated.map((f: string) => `- ${f}`).join('\n')}\n\n`;
        }

        if (result.foldersCreated && result.foldersCreated.length > 0) {
          response += `Folders created:\n${result.foldersCreated.map((f: string) => `- ${f}`).join('\n')}\n\n`;
        }

        if (result.scenesCreated && result.scenesCreated.length > 0) {
          response += `Scenes created:\n${result.scenesCreated.map((s: string) => `- ${s}`).join('\n')}\n\n`;
        }

        if (result.scriptsCreated && result.scriptsCreated.length > 0) {
          response += `Scripts created:\n${result.scriptsCreated.map((s: string) => `- ${s}`).join('\n')}\n\n`;
        }

        response += `Template features included: ${features.join(', ')}\n`;
        response += `Structure level: ${structure}\n\n`;

        if (result.nextSteps && result.nextSteps.length > 0) {
          response += `Next steps:\n${result.nextSteps.map((s: string) => `- ${s}`).join('\n')}`;
        }

        return response;
      } catch (error) {
        throw new Error(`Failed to apply project template: ${(error as Error).message}`);
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
    execute: async ({ projectPath, optimizationTypes, aggressive = false, preview = false }: AutomatedOptimizationParams): Promise<string> => {
      const godot = getGodotConnection();

      try {
        const result = await godot.sendCommand<CommandResult>('automated_optimization', {
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
              response += `Changes made:\n${optResult.changes.map((c: string) => `- ${c}`).join('\n')}\n`;
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
          response += `Recommendations for further optimization:\n${result.recommendations.map((r: string) => `- ${r}`).join('\n')}`;
        }

        return response;
      } catch (error) {
        throw new Error(`Failed to run automated optimization: ${(error as Error).message}`);
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
    execute: async ({ characterType, movementType, features, spritePath, createScene = true }: CreateCharacterSystemParams): Promise<string> => {
      const godot = getGodotConnection();

      try {
        const result = await godot.sendCommand<CommandResult>('create_character_system', {
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
          response += `Additional scripts:\n${result.additionalScripts.map((s: string) => `- ${s}`).join('\n')}\n`;
        }

        response += `\nFeatures included: ${features.join(', ')}\n\n`;

        if (result.setupInstructions) {
          response += `Setup instructions:\n${result.setupInstructions.map((i: string) => `- ${i}`).join('\n')}\n\n`;
        }

        if (result.controls && result.controls.length > 0) {
          response += `Controls:\n${result.controls.map((c: string) => `- ${c}`).join('\n')}`;
        }

        return response;
      } catch (error) {
        throw new Error(`Failed to create character system: ${(error as Error).message}`);
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
    execute: async ({ levelType, difficulty, theme, dimensions, features }: GenerateLevelParams): Promise<string> => {
      const godot = getGodotConnection();

      try {
        const result = await godot.sendCommand<CommandResult>('generate_level', {
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
          response += `\nLevel elements:\n${result.elements.map((e: any) => `- ${e.type}: ${e.count} (${e.description})`).join('\n')}\n`;
        }

        if (result.objectives && result.objectives.length > 0) {
          response += `\nObjectives:\n${result.objectives.map((o: string) => `- ${o}`).join('\n')}\n`;
        }

        response += `\nFeatures included: ${(features || []).join(', ')}\n\n`;

        if (result.difficultySettings) {
          response += `Difficulty settings:\n`;
          Object.entries(result.difficultySettings).forEach(([key, value]) => {
            response += `- ${key}: ${value}\n`;
          });
        }

        return response;
      } catch (error) {
        throw new Error(`Failed to generate level: ${(error as Error).message}`);
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
    execute: async ({ suggestionType, target, autoApply = false, parameters }: ApplySmartSuggestionParams): Promise<string> => {
      const godot = getGodotConnection();

      try {
        const result = await godot.sendCommand<CommandResult>('apply_smart_suggestion', {
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
          response += `Suggestions found:\n${result.suggestions.map((s: any, i: number) => `${i + 1}. ${s.description} (${s.confidence}% confidence)`).join('\n')}\n\n`;
        }

        if (autoApply && result.applied && result.applied.length > 0) {
          response += `Changes applied:\n${result.applied.map((a: string) => `- ${a}`).join('\n')}\n\n`;
        } else if (!autoApply && result.preview) {
          response += `Preview of changes:\n${result.preview.map((p: string) => `- ${p}`).join('\n')}\n\n`;
          response += `Run with autoApply=true to apply these changes.`;
        }

        if (result.benefits) {
          response += `Expected benefits:\n${result.benefits.map((b: string) => `- ${b}`).join('\n')}`;
        }

        return response;
      } catch (error) {
        throw new Error(`Failed to apply smart suggestion: ${(error as Error).message}`);
      }
    },
  },
];