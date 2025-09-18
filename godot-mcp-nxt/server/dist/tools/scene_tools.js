import { z } from 'zod';
import { getGodotConnection } from '../utils/godot_connection.js';
/**
 * Unified Scene Management Tool - Consolidates all scene and resource operations
 */
export const sceneTools = [
    {
        name: 'scene_manager',
        description: `🎬 UNIFIED SCENE MANAGER - Complete Scene and Resource Lifecycle Management

USAGE WORKFLOW:
1. 📁 CREATE: Use operation="create_scene" to make new scenes
2. 📂 OPEN: Use operation="open_scene" to load existing scenes
3. ✏️ EDIT: Use operation="edit_scene" for live scene modifications
4. 💾 SAVE: Use operation="save_scene" to persist changes
5. 📊 INFO: Use operation="get_current_scene" or "get_project_info" for status
6. 📦 RESOURCE: Use operation="create_resource" for assets
7. 🔄 BATCH: Use operation="batch_edit" for multi-scene operations

COMMON PITFALLS TO AVOID:
❌ DON'T try scene operations without Godot Editor running
❌ DON'T use invalid scene paths (.tscn extension required)
❌ DON'T forget path for create_scene and open_scene operations
❌ DON'T use wrong root_node_type (must be valid Godot node class)
❌ DON'T try to edit scenes that aren't open
❌ DON'T forget operations array for edit_scene

EXAMPLES:
✅ Create scene: {operation: "create_scene", path: "res://main.tscn", root_node_type: "Node2D"}
✅ Open scene: {operation: "open_scene", path: "res://main.tscn"}
✅ Edit scene: {operation: "edit_scene", path: "res://main.tscn", operations: [{type: "create_node", target: "/root", parameters: {node_type: "Sprite2D"}}]}
✅ Get info: {operation: "get_project_info"}
✅ Create resource: {operation: "create_resource", resource_type: "Texture", path: "res://icon.png"}

PREREQUISITES:
- Godot Editor must be running and connected
- Scene paths must use .tscn extension
- Resource paths must use appropriate extensions (.png, .wav, etc.)
- Valid Godot node types (Node2D, Sprite2D, CharacterBody2D, etc.)
- Valid Godot resource types (Texture, AudioStream, etc.)

ERROR PREVENTION:
- Always verify Godot Editor is running before operations
- Use res:// prefix for project-relative paths
- Test scene paths exist before opening
- Verify node types exist in your Godot version
- Check resource types are supported
- Ensure operations array is properly formatted for editing`,
        parameters: z.object({
            operation: z.enum(['create_scene', 'save_scene', 'open_scene', 'get_current_scene', 'get_project_info', 'create_resource', 'edit_scene', 'batch_edit'])
                .describe('Type of scene operation to perform'),
            path: z.string().optional()
                .describe('Path to the scene or resource file'),
            root_node_type: z.string().optional().default('Node')
                .describe('Type of root node to create for new scenes'),
            resource_type: z.string().optional()
                .describe('Type of resource to create'),
            properties: z.record(z.any()).optional()
                .describe('Properties for resource creation'),
            // Scene editing options
            operations: z.array(z.object({
                type: z.enum(['create_node', 'modify_property', 'delete_node', 'move_node', 'add_script', 'set_signal'])
                    .describe('Type of operation to perform'),
                target: z.string().optional()
                    .describe('Target node path for the operation'),
                parameters: z.any()
                    .describe('Parameters specific to the operation type')
            })).optional()
                .describe('Array of operations to perform on the scene'),
            // Batch operations
            batch_operations: z.array(z.object({
                scenePath: z.string()
                    .describe('Path to the scene file'),
                operation: z.object({
                    type: z.enum(['create_node', 'modify_property', 'delete_node', 'move_node', 'add_script', 'set_signal']),
                    target: z.string().optional(),
                    parameters: z.any()
                })
                    .describe('Operation to perform on this scene')
            })).optional()
                .describe('Array of operations across multiple scenes'),
            // General options
            autoSave: z.boolean().optional().default(true)
                .describe('Whether to automatically save after operations')
        }),
        execute: async (params) => {
            const godot = getGodotConnection();
            try {
                switch (params.operation) {
                    case 'create_scene': {
                        if (!params.path) {
                            throw new Error('path is required for create_scene operation');
                        }
                        const result = await godot.sendCommand('create_scene', {
                            path: params.path,
                            root_node_type: params.root_node_type
                        });
                        return `Created new scene at ${result.scene_path} with root node type ${result.root_node_type}`;
                    }
                    case 'save_scene': {
                        const result = await godot.sendCommand('save_scene', { path: params.path });
                        return `Saved scene to ${result.scene_path}`;
                    }
                    case 'open_scene': {
                        if (!params.path) {
                            throw new Error('path is required for open_scene operation');
                        }
                        const result = await godot.sendCommand('open_scene', { path: params.path });
                        return `Opened scene at ${result.scene_path}`;
                    }
                    case 'get_current_scene': {
                        const result = await godot.sendCommand('get_current_scene', {});
                        return `Current scene: ${result.scene_path}\nRoot node: ${result.root_node_name} (${result.root_node_type})`;
                    }
                    case 'get_project_info': {
                        const result = await godot.sendCommand('get_project_info', {});
                        const godotVersion = `${result.godot_version.major}.${result.godot_version.minor}.${result.godot_version.patch}`;
                        let output = `Project Name: ${result.project_name}\n`;
                        output += `Project Version: ${result.project_version}\n`;
                        output += `Project Path: ${result.project_path}\n`;
                        output += `Godot Version: ${godotVersion}\n`;
                        if (result.current_scene) {
                            output += `Current Scene: ${result.current_scene}`;
                        }
                        else {
                            output += "No scene is currently open";
                        }
                        return output;
                    }
                    case 'create_resource': {
                        if (!params.resource_type || !params.path) {
                            throw new Error('resource_type and path are required for create_resource operation');
                        }
                        const result = await godot.sendCommand('create_resource', {
                            resource_type: params.resource_type,
                            resource_path: params.path,
                            properties: params.properties || {}
                        });
                        return `Created ${params.resource_type} resource at ${result.resource_path}`;
                    }
                    case 'edit_scene': {
                        if (!params.path || !params.operations || !Array.isArray(params.operations)) {
                            throw new Error('path and operations array are required for edit_scene operation');
                        }
                        const results = [];
                        let operationCount = 0;
                        for (const operation of params.operations) {
                            operationCount++;
                            const result = await godot.sendCommand('live_scene_edit', {
                                scenePath: params.path,
                                operation,
                                operationIndex: operationCount
                            });
                            results.push(`${operation.type}: ${result.message || 'Success'}`);
                        }
                        if (params.autoSave) {
                            await godot.sendCommand('save_scene', { path: params.path });
                            results.push('Scene auto-saved');
                        }
                        return `Scene editing completed:\n${results.map((r, i) => `${i + 1}. ${r}`).join('\n')}`;
                    }
                    case 'batch_edit': {
                        if (!params.batch_operations || !Array.isArray(params.batch_operations)) {
                            throw new Error('batch_operations array is required for batch_edit operation');
                        }
                        const results = [];
                        const sceneResults = new Map();
                        for (const { scenePath, operation } of params.batch_operations) {
                            if (!sceneResults.has(scenePath)) {
                                sceneResults.set(scenePath, []);
                            }
                            const result = await godot.sendCommand('live_scene_edit', {
                                scenePath,
                                operation
                            });
                            sceneResults.get(scenePath).push(`${operation.type}: ${result.message || 'Success'}`);
                        }
                        if (params.autoSave) {
                            for (const scenePath of Array.from(sceneResults.keys())) {
                                await godot.sendCommand('save_scene', { path: scenePath });
                                sceneResults.get(scenePath).push('Scene saved');
                            }
                        }
                        for (const [scenePath, sceneOps] of Array.from(sceneResults.entries())) {
                            results.push(`${scenePath}:\n${sceneOps.map((op) => `  - ${op}`).join('\n')}`);
                        }
                        return `Batch operations completed:\n${results.join('\n\n')}`;
                    }
                    default:
                        throw new Error(`Unknown operation: ${params.operation}`);
                }
            }
            catch (error) {
                throw new Error(`Scene manager operation failed: ${error.message}`);
            }
        },
    },
];
//# sourceMappingURL=scene_tools.js.map