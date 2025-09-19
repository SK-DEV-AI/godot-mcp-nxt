import { z } from 'zod';
import { getGodotConnection } from '../utils/godot_connection.js';
/**
 * Unified Script Management Tool - Consolidates all script-related operations
 */
export const scriptTools = [
    {
        name: 'script_manager',
        description: `📝 UNIFIED SCRIPT MANAGER - Complete GDScript Lifecycle Management

USAGE WORKFLOW:
1. 📝 CREATE: Use operation="create" with script_path and content
2. 🤖 GENERATE: Use operation="generate_ai" for AI-powered script creation
3. 📋 TEMPLATE: Use operation="generate_template" for boilerplate code
4. ✏️ EDIT: Use operation="edit" to modify existing scripts
5. 👁️ READ: Use operation="read" to examine script content

COMMON PITFALLS TO AVOID:
❌ DON'T forget script_path for create/edit operations
❌ DON'T use invalid GDScript syntax in content
❌ DON'T forget description for AI generation
❌ DON'T use wrong file extensions (.gd required)
❌ DON'T try to read without script_path or node_path

EXAMPLES:
✅ Create script: {operation: "create", script_path: "res://player.gd", content: "extends Node\nfunc _ready():\n\tpass"}
✅ AI generate: {operation: "generate_ai", description: "Create a 2D player controller with movement"}
✅ Template: {operation: "generate_template", extends_type: "Node2D", include_ready: true}
✅ Edit script: {operation: "edit", script_path: "res://player.gd", content: "extends Node\nfunc _ready():\n\tprint('Hello!')"}
✅ Read script: {operation: "read", script_path: "res://player.gd"}

PREREQUISITES:
- Valid GDScript syntax for content
- Script paths must use .gd extension
- For AI generation: descriptive prompt required
- For templates: valid Godot base classes (Node, Node2D, CharacterBody2D, etc.)

ERROR PREVENTION:
- Always validate GDScript syntax before submission
- Use res:// prefix for project-relative paths
- Test AI descriptions are specific and clear
- Verify base classes exist in your Godot version
- Check file permissions for script operations`,
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
        execute: async (params) => {
            const godot = await getGodotConnection();
            try {
                switch (params.operation) {
                    case 'create': {
                        if (!params.script_path || !params.content) {
                            throw new Error('script_path and content are required for create operation');
                        }
                        const result = await godot.sendCommand('create_script', {
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
                        const result = await godot.sendCommand('get_script', {
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
                        if (params.features && (!Array.isArray(params.features) || params.features.some((f) => typeof f !== 'string'))) {
                            throw new Error('Features must be an array of strings');
                        }
                        // Use the existing generate_complete_scripts logic
                        const result = await godot.sendCommand('generate_complete_scripts', {
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
            }
            catch (error) {
                throw new Error(`Script manager operation failed: ${error.message}`);
            }
        },
    },
];
//# sourceMappingURL=script_tools.js.map