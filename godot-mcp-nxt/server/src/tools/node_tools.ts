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
 * Unified Node Management Tool - Consolidates all node-related operations
 */
export const nodeTools: MCPTool[] = [
  {
    name: 'node_manager',
    description: 'Unified tool for all node operations: create, delete, update properties, inspect, and batch operations',
    parameters: z.object({
      operation: z.enum(['create', 'delete', 'update_property', 'get_properties', 'list_children', 'batch_update'])
        .describe('Type of node operation to perform'),
      node_path: z.string().optional()
        .describe('Path to the target node (required for most operations)'),
      node_type: z.string().optional()
        .describe('Type of node to create (required for create operation)'),
      node_name: z.string().optional()
        .describe('Name for new node (required for create operation)'),
      property: z.string().optional()
        .describe('Property name to update (required for update_property)'),
      value: z.any().optional()
        .describe('New value for property (required for update_property)'),
      // Batch operations
      operations: z.array(z.object({
        nodePattern: z.string().describe('Pattern to match nodes'),
        property: z.string().describe('Property to modify'),
        value: z.any().describe('New value for the property'),
        condition: z.string().optional().describe('Optional condition to filter nodes')
      })).optional()
        .describe('Array of property operations for batch_update'),
      // Intelligent creation options
      context: z.string().optional()
        .describe('Context description for intelligent placement'),
      position: z.object({ x: z.number(), y: z.number() }).optional()
        .describe('Specific position for the node'),
      autoPosition: z.boolean().optional().default(true)
        .describe('Whether to automatically determine optimal position'),
      suggestedName: z.string().optional()
        .describe('Suggested name for the node'),
      // General options
      preview: z.boolean().optional().default(false)
        .describe('Whether to preview changes without applying them')
    }),
    execute: async (params: any): Promise<string> => {
      const godot = getGodotConnection();

      try {
        switch (params.operation) {
          case 'create': {
            if (!params.node_path || !params.node_type || !params.node_name) {
              throw new Error('node_path, node_type, and node_name are required for create operation');
            }

            // Use intelligent creation if context is provided
            if (params.context || params.position || params.suggestedName) {
              const result = await godot.sendCommand<CommandResult>('intelligent_node_creation', {
                scenePath: params.node_path.split('/').slice(0, -1).join('/') || 'res://',
                nodeType: params.node_type,
                context: params.context,
                position: params.position,
                autoPosition: params.autoPosition,
                suggestedName: params.suggestedName || params.node_name
              });

              let response = `Created ${params.node_type} node "${result.node_name}" at ${result.node_path}`;
              if (result.position) {
                response += `\nPosition: (${result.position.x}, ${result.position.y})`;
              }
              return response;
            } else {
              // Basic creation
              const result = await godot.sendCommand<CommandResult>('create_node', {
                parent_path: params.node_path,
                node_type: params.node_type,
                node_name: params.node_name,
              });
              return `Created ${params.node_type} node named "${params.node_name}" at ${result.node_path}`;
            }
          }

          case 'delete': {
            if (!params.node_path) {
              throw new Error('node_path is required for delete operation');
            }
            await godot.sendCommand('delete_node', { node_path: params.node_path });
            return `Deleted node at ${params.node_path}`;
          }

          case 'update_property': {
            if (!params.node_path || !params.property) {
              throw new Error('node_path and property are required for update_property operation');
            }
            const result = await godot.sendCommand<CommandResult>('update_node_property', {
              node_path: params.node_path,
              property: params.property,
              value: params.value,
            });
            return `Updated property "${params.property}" of node at ${params.node_path} to ${JSON.stringify(params.value)}`;
          }

          case 'get_properties': {
            if (!params.node_path) {
              throw new Error('node_path is required for get_properties operation');
            }
            const result = await godot.sendCommand<CommandResult>('get_node_properties', { node_path: params.node_path });
            const formattedProperties = Object.entries(result.properties)
              .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
              .join('\n');
            return `Properties of node at ${params.node_path}:\n\n${formattedProperties}`;
          }

          case 'list_children': {
            if (!params.node_path) {
              throw new Error('node_path is required for list_children operation');
            }
            const result = await godot.sendCommand<CommandResult>('list_nodes', { parent_path: params.node_path });
            if (result.children.length === 0) {
              return `No child nodes found under ${params.node_path}`;
            }
            const formattedChildren = result.children
              .map((child: any) => `${child.name} (${child.type}) - ${child.path}`)
              .join('\n');
            return `Children of node at ${params.node_path}:\n\n${formattedChildren}`;
          }

          case 'batch_update': {
            if (!params.operations || !Array.isArray(params.operations)) {
              throw new Error('operations array is required for batch_update operation');
            }

            const scenePath = params.node_path ? params.node_path.split('/').slice(0, -1).join('/') || 'res://' : 'res://';
            const result = await godot.sendCommand<CommandResult>('node_property_automation', {
              scenePath,
              operations: params.operations,
              preview: params.preview
            });

            let response = params.preview ? 'PREVIEW MODE - No changes applied\n\n' : 'Batch changes applied successfully\n\n';
            response += `Operations performed:\n`;

            if (result.results && Array.isArray(result.results)) {
              result.results.forEach((opResult: any, index: number) => {
                const operation = opResult.operation || {};
                response += `${index + 1}. ${operation.nodePattern || 'Unknown'} -> ${operation.property || 'Unknown'} = ${JSON.stringify(operation.value)}\n`;
                response += `   Success: ${opResult.success ? 'Yes' : 'No'}\n`;
                if (opResult.error) response += `   Error: ${opResult.error}\n`;
                if (opResult.nodes_affected !== undefined) response += `   Affected nodes: ${opResult.nodes_affected}\n`;
              });
            }

            if (result.warnings && result.warnings.length > 0) {
              response += `\nWarnings:\n${result.warnings.map((w: string) => `- ${w}`).join('\n')}`;
            }

            return response;
          }

          default:
            throw new Error(`Unknown operation: ${params.operation}`);
        }
      } catch (error) {
        throw new Error(`Node manager operation failed: ${(error as Error).message}`);
      }
    },
  },
];