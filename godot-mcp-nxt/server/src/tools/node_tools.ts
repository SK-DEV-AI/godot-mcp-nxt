import { z } from 'zod';
import { getGodotConnection } from '../utils/godot_connection.js';
import { MCPTool, CommandResult } from '../utils/types.js';

/**
 * Type definitions for node tool parameters
 */
interface CreateNodeParams {
  parent_path: string;
  node_type: string;
  node_name: string;
}

interface DeleteNodeParams {
  node_path: string;
}

interface UpdateNodePropertyParams {
  node_path: string;
  property: string;
  value: any;
}

interface GetNodePropertiesParams {
  node_path: string;
}

interface ListNodesParams {
  parent_path: string;
}

interface IntelligentNodeCreationParams {
  scenePath: string;
  nodeType: string;
  context?: string;
  position?: { x: number; y: number };
  autoPosition?: boolean;
  suggestedName?: string;
}

interface NodePropertyAutomationParams {
  scenePath: string;
  operations: Array<{
    nodePattern: string; // Can be exact path or pattern like "*/Sprite*"
    property: string;
    value: any;
    condition?: string; // Optional condition to filter nodes
  }>;
  preview?: boolean;
}

/**
 * Definition for node tools - operations that manipulate nodes in the scene tree
 */
export const nodeTools: MCPTool[] = [
  {
    name: 'create_node',
    description: 'Create a new node in the Godot scene tree',
    parameters: z.object({
      parent_path: z.string()
        .describe('Path to the parent node where the new node will be created (e.g. "/root", "/root/MainScene")'),
      node_type: z.string()
        .describe('Type of node to create (e.g. "Node2D", "Sprite2D", "Label")'),
      node_name: z.string()
        .describe('Name for the new node'),
    }),
    execute: async ({ parent_path, node_type, node_name }: CreateNodeParams): Promise<string> => {
      const godot = getGodotConnection();
      
      try {
        const result = await godot.sendCommand<CommandResult>('create_node', {
          parent_path,
          node_type,
          node_name,
        });
        
        return `Created ${node_type} node named "${node_name}" at ${result.node_path}`;
      } catch (error) {
        throw new Error(`Failed to create node: ${(error as Error).message}`);
      }
    },
  },

  {
    name: 'delete_node',
    description: 'Delete a node from the Godot scene tree',
    parameters: z.object({
      node_path: z.string()
        .describe('Path to the node to delete (e.g. "/root/MainScene/Player")'),
    }),
    execute: async ({ node_path }: DeleteNodeParams): Promise<string> => {
      const godot = getGodotConnection();
      
      try {
        await godot.sendCommand('delete_node', { node_path });
        return `Deleted node at ${node_path}`;
      } catch (error) {
        throw new Error(`Failed to delete node: ${(error as Error).message}`);
      }
    },
  },

  {
    name: 'update_node_property',
    description: 'Update a property of a node in the Godot scene tree',
    parameters: z.object({
      node_path: z.string()
        .describe('Path to the node to update (e.g. "/root/MainScene/Player")'),
      property: z.string()
        .describe('Name of the property to update (e.g. "position", "text", "modulate")'),
      value: z.any()
        .describe('New value for the property'),
    }),
    execute: async ({ node_path, property, value }: UpdateNodePropertyParams): Promise<string> => {
      const godot = getGodotConnection();
      
      try {
        const result = await godot.sendCommand<CommandResult>('update_node_property', {
          node_path,
          property,
          value,
        });
        
        return `Updated property "${property}" of node at ${node_path} to ${JSON.stringify(value)}`;
      } catch (error) {
        throw new Error(`Failed to update node property: ${(error as Error).message}`);
      }
    },
  },

  {
    name: 'get_node_properties',
    description: 'Get all properties of a node in the Godot scene tree',
    parameters: z.object({
      node_path: z.string()
        .describe('Path to the node to inspect (e.g. "/root/MainScene/Player")'),
    }),
    execute: async ({ node_path }: GetNodePropertiesParams): Promise<string> => {
      const godot = getGodotConnection();
      
      try {
        const result = await godot.sendCommand<CommandResult>('get_node_properties', { node_path });
        
        // Format properties for display
        const formattedProperties = Object.entries(result.properties)
          .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
          .join('\n');
        
        return `Properties of node at ${node_path}:\n\n${formattedProperties}`;
      } catch (error) {
        throw new Error(`Failed to get node properties: ${(error as Error).message}`);
      }
    },
  },

  {
    name: 'list_nodes',
    description: 'List all child nodes under a parent node in the Godot scene tree',
    parameters: z.object({
      parent_path: z.string()
        .describe('Path to the parent node (e.g. "/root", "/root/MainScene")'),
    }),
    execute: async ({ parent_path }: ListNodesParams): Promise<string> => {
      const godot = getGodotConnection();

      try {
        const result = await godot.sendCommand<CommandResult>('list_nodes', { parent_path });

        if (result.children.length === 0) {
          return `No child nodes found under ${parent_path}`;
        }

        // Format children for display
        const formattedChildren = result.children
          .map((child: any) => `${child.name} (${child.type}) - ${child.path}`)
          .join('\n');

        return `Children of node at ${parent_path}:\n\n${formattedChildren}`;
      } catch (error) {
        throw new Error(`Failed to list nodes: ${(error as Error).message}`);
      }
    },
  },

  {
    name: 'intelligent_node_creation',
    description: 'Create nodes with smart positioning, naming, and context awareness',
    parameters: z.object({
      scenePath: z.string()
        .describe('Path to the scene file where the node will be created'),
      nodeType: z.string()
        .describe('Type of node to create (e.g. "Sprite2D", "CollisionShape2D", "Area2D")'),
      context: z.string().optional()
        .describe('Context description for intelligent placement (e.g. "player character", "background layer")'),
      position: z.object({
        x: z.number(),
        y: z.number()
      }).optional()
        .describe('Specific position for the node (optional - will be auto-calculated if not provided)'),
      autoPosition: z.boolean().optional().default(true)
        .describe('Whether to automatically determine optimal position'),
      suggestedName: z.string().optional()
        .describe('Suggested name for the node (optional - will be auto-generated)')
    }),
    execute: async ({ scenePath, nodeType, context, position, autoPosition = true, suggestedName }: IntelligentNodeCreationParams): Promise<string> => {
      const godot = getGodotConnection();

      try {
        const result = await godot.sendCommand<CommandResult>('intelligent_node_creation', {
          scenePath,
          nodeType,
          context,
          position,
          autoPosition,
          suggestedName
        });

        let response = `Created ${nodeType} node "${result.node_name}" at ${result.node_path}`;

        if (result.position) {
          response += `\nPosition: (${result.position.x}, ${result.position.y})`;
        }

        if (result.suggestions && result.suggestions.length > 0) {
          response += `\n\nSuggestions:\n${result.suggestions.map((s: string) => `- ${s}`).join('\n')}`;
        }

        return response;
      } catch (error) {
        throw new Error(`Failed to create node intelligently: ${(error as Error).message}`);
      }
    },
  },

  {
    name: 'node_property_automation',
    description: 'Apply property changes to multiple nodes based on patterns and conditions',
    parameters: z.object({
      scenePath: z.string()
        .describe('Path to the scene file to modify'),
      operations: z.array(z.object({
        nodePattern: z.string()
          .describe('Pattern to match nodes (e.g. "*/Sprite*", "/root/Player", "*Enemy*")'),
        property: z.string()
          .describe('Property to modify (e.g. "modulate", "position", "scale")'),
        value: z.any()
          .describe('New value for the property'),
        condition: z.string().optional()
          .describe('Optional condition to filter nodes (e.g. "visible == true")')
      }))
        .describe('Array of property operations to perform'),
      preview: z.boolean().optional().default(false)
        .describe('Whether to preview changes without applying them')
    }),
    execute: async ({ scenePath, operations, preview = false }: NodePropertyAutomationParams): Promise<string> => {
      const godot = getGodotConnection();

      try {
        const result = await godot.sendCommand<CommandResult>('node_property_automation', {
          scenePath,
          operations,
          preview
        });

        let response = preview ? 'PREVIEW MODE - No changes applied\n\n' : 'Changes applied successfully\n\n';

        response += `Operations performed:\n`;
        if (result.results && Array.isArray(result.results)) {
          result.results.forEach((opResult: any, index: number) => {
            const operation = opResult.operation || {};
            response += `${index + 1}. ${operation.nodePattern || 'Unknown'} -> ${operation.property || 'Unknown'} = ${JSON.stringify(operation.value)}\n`;
            response += `   Success: ${opResult.success ? 'Yes' : 'No'}\n`;
            if (opResult.error) {
              response += `   Error: ${opResult.error}\n`;
            }
            if (opResult.nodes_affected !== undefined) {
              response += `   Affected nodes: ${opResult.nodes_affected}\n`;
            }
          });
        }

        if (result.warnings && result.warnings.length > 0) {
          response += `\nWarnings:\n${result.warnings.map((w: string) => `- ${w}`).join('\n')}`;
        }

        return response;
      } catch (error) {
        throw new Error(`Failed to automate node properties: ${(error as Error).message}`);
      }
    },
  },
];