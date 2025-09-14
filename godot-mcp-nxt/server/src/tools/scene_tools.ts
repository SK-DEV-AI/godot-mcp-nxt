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
 * Definition for scene tools - operations that manipulate Godot scenes
 */
export const sceneTools: MCPTool[] = [
  {
    name: 'create_scene',
    description: 'Create a new empty scene with optional root node type',
    parameters: z.object({
      path: z.string()
        .describe('Path where the new scene will be saved (e.g. "res://scenes/new_scene.tscn")'),
      root_node_type: z.string().optional()
        .describe('Type of root node to create (e.g. "Node2D", "Node3D", "Control"). Defaults to "Node" if not specified'),
    }),
    execute: async ({ path, root_node_type = "Node" }: CreateSceneParams): Promise<string> => {
      const godot = getGodotConnection();
      
      try {
        const result = await godot.sendCommand<CommandResult>('create_scene', { path, root_node_type });
        return `Created new scene at ${result.scene_path} with root node type ${result.root_node_type}`;
      } catch (error) {
        throw new Error(`Failed to create scene: ${(error as Error).message}`);
      }
    },
  },

  {
    name: 'save_scene',
    description: 'Save the current scene to disk',
    parameters: z.object({
      path: z.string().optional()
        .describe('Path where the scene will be saved (e.g. "res://scenes/main.tscn"). If not provided, uses current scene path.'),
    }),
    execute: async ({ path }: SaveSceneParams): Promise<string> => {
      const godot = getGodotConnection();
      
      try {
        const result = await godot.sendCommand<CommandResult>('save_scene', { path });
        return `Saved scene to ${result.scene_path}`;
      } catch (error) {
        throw new Error(`Failed to save scene: ${(error as Error).message}`);
      }
    },
  },

  {
    name: 'open_scene',
    description: 'Open a scene in the editor',
    parameters: z.object({
      path: z.string()
        .describe('Path to the scene file to open (e.g. "res://scenes/main.tscn")'),
    }),
    execute: async ({ path }: OpenSceneParams): Promise<string> => {
      const godot = getGodotConnection();
      
      try {
        const result = await godot.sendCommand<CommandResult>('open_scene', { path });
        return `Opened scene at ${result.scene_path}`;
      } catch (error) {
        throw new Error(`Failed to open scene: ${(error as Error).message}`);
      }
    },
  },

  {
    name: 'get_current_scene',
    description: 'Get information about the currently open scene',
    parameters: z.object({}),
    execute: async (): Promise<string> => {
      const godot = getGodotConnection();
      
      try {
        const result = await godot.sendCommand<CommandResult>('get_current_scene', {});
        
        return `Current scene: ${result.scene_path}\nRoot node: ${result.root_node_name} (${result.root_node_type})`;
      } catch (error) {
        throw new Error(`Failed to get current scene: ${(error as Error).message}`);
      }
    },
  },

  {
    name: 'get_project_info',
    description: 'Get information about the current Godot project',
    parameters: z.object({}),
    execute: async (): Promise<string> => {
      const godot = getGodotConnection();
      
      try {
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
      } catch (error) {
        throw new Error(`Failed to get project info: ${(error as Error).message}`);
      }
    },
  },

  {
    name: 'create_resource',
    description: 'Create a new resource in the project',
    parameters: z.object({
      resource_type: z.string()
        .describe('Type of resource to create (e.g. "ImageTexture", "AudioStreamMP3", "StyleBoxFlat")'),
      resource_path: z.string()
        .describe('Path where the resource will be saved (e.g. "res://resources/style.tres")'),
      properties: z.record(z.any()).optional()
        .describe('Dictionary of property values to set on the resource'),
    }),
    execute: async ({ resource_type, resource_path, properties = {} }: CreateResourceParams): Promise<string> => {
      const godot = getGodotConnection();

      try {
        const result = await godot.sendCommand<CommandResult>('create_resource', {
          resource_type,
          resource_path,
          properties,
        });

        return `Created ${resource_type} resource at ${result.resource_path}`;
      } catch (error) {
        throw new Error(`Failed to create resource: ${(error as Error).message}`);
      }
    },
  },

  {
    name: 'live_scene_editor',
    description: 'Edit scenes in real-time with immediate visual feedback and undo support',
    parameters: z.object({
      scenePath: z.string()
        .describe('Path to the scene file to edit (e.g. "res://scenes/main.tscn")'),
      operations: z.array(z.object({
        type: z.enum(['create_node', 'modify_property', 'delete_node', 'move_node', 'add_script', 'set_signal'])
          .describe('Type of operation to perform'),
        target: z.string().optional()
          .describe('Target node path for the operation (not needed for create_node)'),
        parameters: z.any()
          .describe('Parameters specific to the operation type')
      }))
        .describe('Array of operations to perform on the scene'),
      autoSave: z.boolean().optional().default(true)
        .describe('Whether to automatically save the scene after operations')
    }),
    execute: async ({ scenePath, operations, autoSave = true }: LiveSceneEditParams): Promise<string> => {
      const godot = getGodotConnection();

      try {
        const results: string[] = [];
        let operationCount = 0;

        for (const operation of operations) {
          operationCount++;
          const result = await godot.sendCommand<CommandResult>('live_scene_edit', {
            scenePath,
            operation,
            operationIndex: operationCount
          });

          results.push(`${operation.type}: ${result.message || 'Success'}`);
        }

        if (autoSave) {
          await godot.sendCommand<CommandResult>('save_scene', { path: scenePath });
          results.push('Scene auto-saved');
        }

        return `Live scene editing completed:\n${results.map((r, i) => `${i + 1}. ${r}`).join('\n')}`;
      } catch (error) {
        throw new Error(`Failed to perform live scene editing: ${(error as Error).message}`);
      }
    },
  },

  {
    name: 'batch_scene_operations',
    description: 'Apply operations across multiple scenes simultaneously',
    parameters: z.object({
      operations: z.array(z.object({
        scenePath: z.string()
          .describe('Path to the scene file'),
        operation: z.object({
          type: z.enum(['create_node', 'modify_property', 'delete_node', 'move_node', 'add_script', 'set_signal']),
          target: z.string().optional(),
          parameters: z.any()
        })
          .describe('Operation to perform on this scene')
      }))
        .describe('Array of scene operations to perform'),
      autoSave: z.boolean().optional().default(true)
        .describe('Whether to automatically save all scenes after operations')
    }),
    execute: async ({ operations, autoSave = true }: BatchSceneOperationParams): Promise<string> => {
      const godot = getGodotConnection();

      try {
        const results: string[] = [];
        const sceneResults = new Map<string, string[]>();

        for (const { scenePath, operation } of operations) {
          if (!sceneResults.has(scenePath)) {
            sceneResults.set(scenePath, []);
          }

          const result = await godot.sendCommand<CommandResult>('live_scene_edit', {
            scenePath,
            operation
          });

          sceneResults.get(scenePath)!.push(`${operation.type}: ${result.message || 'Success'}`);
        }

        if (autoSave) {
          for (const scenePath of Array.from(sceneResults.keys())) {
            await godot.sendCommand<CommandResult>('save_scene', { path: scenePath });
            sceneResults.get(scenePath)!.push('Scene saved');
          }
        }

        for (const [scenePath, sceneOps] of Array.from(sceneResults.entries())) {
          results.push(`${scenePath}:\n${sceneOps.map((op: string) => `  - ${op}`).join('\n')}`);
        }

        return `Batch operations completed:\n${results.join('\n\n')}`;
      } catch (error) {
        throw new Error(`Failed to perform batch scene operations: ${(error as Error).message}`);
      }
    },
  },
];