import { z } from 'zod';
import { getGodotConnection } from '../utils/godot_connection.js';
import { MCPTool, CommandResult } from '../utils/types.js';

/**
 * Type definitions for script tool parameters
 */
interface CreateScriptParams {
  script_path: string;
  content: string;
  node_path?: string;
}

interface EditScriptParams {
  script_path: string;
  content: string;
}

interface GetScriptParams {
  script_path?: string;
  node_path?: string;
}

interface CreateScriptTemplateParams {
  class_name?: string;
  extends_type: string;
  include_ready: boolean;
  include_process: boolean;
  include_input: boolean;
  include_physics: boolean;
}

/**
 * Unified Script Management Tool - Consolidates all script-related operations
 */
export const scriptTools: MCPTool[] = [
  {
    name: 'script_manager',
    description: 'Unified tool for all script operations: create, edit, read, generate templates, and AI-powered script generation',
    parameters: z.object({
      operation: z.enum(['create', 'edit', 'read', 'generate_template', 'generate_ai'])
        .describe('Type of script operation to perform'),
      script_path: z.string().optional()
        .describe('Path to the script file (required for most operations)'),
      content: z.string().optional()
        .describe('Script content (required for create/edit operations)'),
      node_path: z.string().optional()
        .describe('Path to a node to attach the script to (optional)'),
      // Template generation options
      class_name: z.string().optional()
        .describe('Optional class name for the script template'),
      extends_type: z.string().optional().default('Node')
        .describe('Base class that this script extends'),
      include_ready: z.boolean().optional().default(true)
        .describe('Whether to include the _ready() function'),
      include_process: z.boolean().optional().default(false)
        .describe('Whether to include the _process() function'),
      include_input: z.boolean().optional().default(false)
        .describe('Whether to include the _input() function'),
      include_physics: z.boolean().optional().default(false)
        .describe('Whether to include the _physics_process() function'),
      // AI generation options
      description: z.string().optional()
        .describe('Natural language description for AI script generation'),
      scriptType: z.enum(['character', 'ui', 'gameplay', 'utility', 'custom']).optional()
        .describe('Type of script to generate'),
      complexity: z.enum(['simple', 'medium', 'complex']).optional().default('medium')
        .describe('Complexity level of the generated script'),
      features: z.array(z.string()).optional()
        .describe('Specific features to include in the script'),
      targetScene: z.string().optional()
        .describe('Path to scene where the script will be used'),
      // Refactoring options
      refactoringType: z.enum(['state_machine', 'extract_method', 'optimize_performance', 'apply_pattern', 'simplify_logic']).optional()
        .describe('Type of refactoring to apply'),
      parameters: z.record(z.any()).optional()
        .describe('Additional parameters for the operation')
    }),
    execute: async (params: any): Promise<string> => {
      const godot = getGodotConnection();

      try {
        switch (params.operation) {
          case 'create': {
            if (!params.script_path || !params.content) {
              throw new Error('script_path and content are required for create operation');
            }
            const result = await godot.sendCommand<CommandResult>('create_script', {
              script_path: params.script_path,
              content: params.content,
              node_path: params.node_path,
            });
            const attachMessage = params.node_path ? ` and attached to node at ${params.node_path}` : '';
            return `Created script at ${result.script_path}${attachMessage}`;
          }

          case 'edit': {
            if (!params.script_path || !params.content) {
              throw new Error('script_path and content are required for edit operation');
            }
            await godot.sendCommand('edit_script', {
              script_path: params.script_path,
              content: params.content,
            });
            return `Updated script at ${params.script_path}`;
          }

          case 'read': {
            if (!params.script_path && !params.node_path) {
              throw new Error('Either script_path or node_path must be provided for read operation');
            }
            const result = await godot.sendCommand<CommandResult>('get_script', {
              script_path: params.script_path,
              node_path: params.node_path,
            });
            return `Script at ${result.script_path}:\n\n\`\`\`gdscript\n${result.content}\n\`\`\``;
          }

          case 'generate_template': {
            // Generate the template locally
            let template = '';

            if (params.class_name) {
              template += `class_name ${params.class_name}\n`;
            }

            template += `extends ${params.extends_type || 'Node'}\n\n`;

            if (params.include_ready) {
              template += `func _ready():\n\tpass\n\n`;
            }

            if (params.include_process) {
              template += `func _process(delta):\n\tpass\n\n`;
            }

            if (params.include_physics) {
              template += `func _physics_process(delta):\n\tpass\n\n`;
            }

            if (params.include_input) {
              template += `func _input(event):\n\tpass\n\n`;
            }

            template = template.trimEnd();
            return `Generated GDScript template:\n\n\`\`\`gdscript\n${template}\n\`\`\``;
          }

          case 'generate_ai': {
            if (!params.description) {
              throw new Error('description is required for generate_ai operation');
            }

            // Validate features array if provided
            if (params.features && (!Array.isArray(params.features) || params.features.some((f: any) => typeof f !== 'string'))) {
              throw new Error('Features must be an array of strings');
            }

            // Use the existing generate_complete_scripts logic
            const result = await godot.sendCommand<CommandResult>('generate_complete_scripts', {
              description: params.description,
              scriptType: params.scriptType,
              complexity: params.complexity,
              features: params.features,
              targetScene: params.targetScene
            });

            return `AI-generated script:\n\n\`\`\`gdscript\n${result.content}\n\`\`\`\n\n${result.explanation || ''}`;
          }

          default:
            throw new Error(`Unknown operation: ${params.operation}`);
        }
      } catch (error) {
        throw new Error(`Script manager operation failed: ${(error as Error).message}`);
      }
    },
  },
];