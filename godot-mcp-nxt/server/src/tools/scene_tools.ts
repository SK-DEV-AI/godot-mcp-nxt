import { z } from 'zod';
import { getGodotConnection } from '../utils/godot_connection.js';
import { MCPTool, CommandResult } from '../utils/types.js';

/**
 * Type definitions for scene tool parameters
 */
interface SaveSceneParams {
  path?: string;
}

interface OpenSceneParams {
  path: string;
}

interface CreateSceneParams {
  path: string;
  root_node_type?: string;
}

interface CreateResourceParams {
  resource_type: string;
  resource_path: string;
  properties?: Record<string, any>;
}

interface LiveSceneEditParams {
  scenePath: string;
  operations: Array<{
    type: 'create_node' | 'modify_property' | 'delete_node' | 'move_node' | 'add_script' | 'set_signal';
    target?: string;
    parameters: any;
  }>;
  autoSave?: boolean;
}

interface BatchSceneOperationParams {
  operations: Array<{
    scenePath: string;
    operation: LiveSceneEditParams['operations'][0];
  }>;
  autoSave?: boolean;
}

/**
 * Unified Scene Management Tool - Consolidates all scene and resource operations
 */
export const sceneTools: MCPTool[] = [
  {
    name: 'scene_manager',
    description: 'Unified tool for all scene operations: create, save, open, edit, and resource management',
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
    execute: async (params: any): Promise<string> => {
      const godot = getGodotConnection();

      try {
        switch (params.operation) {
          case 'create_scene': {
            if (!params.path) {
              throw new Error('path is required for create_scene operation');
            }
            const result = await godot.sendCommand<CommandResult>('create_scene', {
              path: params.path,
              root_node_type: params.root_node_type
            });
            return `Created new scene at ${result.scene_path} with root node type ${result.root_node_type}`;
          }

          case 'save_scene': {
            const result = await godot.sendCommand<CommandResult>('save_scene', { path: params.path });
            return `Saved scene to ${result.scene_path}`;
          }

          case 'open_scene': {
            if (!params.path) {
              throw new Error('path is required for open_scene operation');
            }
            const result = await godot.sendCommand<CommandResult>('open_scene', { path: params.path });
            return `Opened scene at ${result.scene_path}`;
          }

          case 'get_current_scene': {
            const result = await godot.sendCommand<CommandResult>('get_current_scene', {});
            return `Current scene: ${result.scene_path}\nRoot node: ${result.root_node_name} (${result.root_node_type})`;
          }

          case 'get_project_info': {
            const result = await godot.sendCommand<CommandResult>('get_project_info', {});
            const godotVersion = `${result.godot_version.major}.${result.godot_version.minor}.${result.godot_version.patch}`;

            let output = `Project Name: ${result.project_name}\n`;
            output += `Project Version: ${result.project_version}\n`;
            output += `Project Path: ${result.project_path}\n`;
            output += `Godot Version: ${godotVersion}\n`;

            if (result.current_scene) {
              output += `Current Scene: ${result.current_scene}`;
            } else {
              output += "No scene is currently open";
            }

            return output;
          }

          case 'create_resource': {
            if (!params.resource_type || !params.path) {
              throw new Error('resource_type and path are required for create_resource operation');
            }
            const result = await godot.sendCommand<CommandResult>('create_resource', {
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

            const results: string[] = [];
            let operationCount = 0;

            for (const operation of params.operations) {
              operationCount++;
              const result = await godot.sendCommand<CommandResult>('live_scene_edit', {
                scenePath: params.path,
                operation,
                operationIndex: operationCount
              });
              results.push(`${operation.type}: ${result.message || 'Success'}`);
            }

            if (params.autoSave) {
              await godot.sendCommand<CommandResult>('save_scene', { path: params.path });
              results.push('Scene auto-saved');
            }

            return `Scene editing completed:\n${results.map((r, i) => `${i + 1}. ${r}`).join('\n')}`;
          }

          case 'batch_edit': {
            if (!params.batch_operations || !Array.isArray(params.batch_operations)) {
              throw new Error('batch_operations array is required for batch_edit operation');
            }

            const results: string[] = [];
            const sceneResults = new Map<string, string[]>();

            for (const { scenePath, operation } of params.batch_operations) {
              if (!sceneResults.has(scenePath)) {
                sceneResults.set(scenePath, []);
              }

              const result = await godot.sendCommand<CommandResult>('live_scene_edit', {
                scenePath,
                operation
              });

              sceneResults.get(scenePath)!.push(`${operation.type}: ${result.message || 'Success'}`);
            }

            if (params.autoSave) {
              for (const scenePath of Array.from(sceneResults.keys())) {
                await godot.sendCommand<CommandResult>('save_scene', { path: scenePath });
                sceneResults.get(scenePath)!.push('Scene saved');
              }
            }

            for (const [scenePath, sceneOps] of Array.from(sceneResults.entries())) {
              results.push(`${scenePath}:\n${sceneOps.map((op: string) => `  - ${op}`).join('\n')}`);
            }

            return `Batch operations completed:\n${results.join('\n\n')}`;
          }

          default:
            throw new Error(`Unknown operation: ${params.operation}`);
        }
      } catch (error) {
        throw new Error(`Scene manager operation failed: ${(error as Error).message}`);
      }
    },
  },
];