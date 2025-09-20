import { z } from 'zod';
import { getGodotConnection } from '../utils/godot_connection.js';
/**
 * Unified Node Management Tool - Consolidates all node-related operations
 */
export const nodeTools = [
    {
        name: 'node_manager',
        description: `🎯 UNIFIED NODE MANAGER - Complete Godot Node Lifecycle Management

USAGE WORKFLOW:
1. 📋 PREREQUISITE: Use scene_manager to create/open a scene first
2. ➕ CREATE: Use operation="create" with node_path="/root" (parent path, not full path)
3. 🎨 RESOURCES: Use create_shape/create_mesh to make collision shapes and visual meshes
4. 🔗 ASSIGN: Use assign_resource to link shapes/meshes to nodes
5. ⚙️ MODIFY: Use update_property to change node settings
6. 👁️ INSPECT: Use get_properties to examine current state
7. 📊 LIST: Use list_children to see child nodes
8. 🔄 BATCH: Use batch_update for multiple property changes

COMMON PITFALLS TO AVOID:
❌ DON'T use full node paths like "/root/TestPlayer" for creation - use "/root" as parent
❌ DON'T try node operations without an open scene in Godot Editor
❌ DON'T forget to specify node_type when creating nodes
❌ DON'T use invalid property names for your node type
❌ DON'T forget node_path for operations other than create
❌ DON'T create CollisionShape3D/MeshInstance3D without assigning shape/mesh resources

EXAMPLES:
✅ Create player: {operation: "create", node_path: "/root", node_type: "CharacterBody3D", node_name: "Player"}
✅ Create player with auto-resources: {operation: "create", node_path: "/root", node_type: "CharacterBody3D", node_name: "Player", autoCreateResources: true}
✅ Create collision shape: {operation: "create_shape", shapeType: "BoxShape3D", shapeParams: {size: {x: 1, y: 1, z: 1}}}
✅ Create visual mesh: {operation: "create_mesh", meshType: "BoxMesh", meshParams: {size: {x: 1, y: 1, z: 1}}}
✅ Assign shape to collision: {operation: "assign_resource", node_path: "/root/Player/CollisionShape3D", resourceType: "shape", resourceId: "shape_123"}
✅ Update position: {operation: "update_property", node_path: "/root/Player", property: "position", value: {x: 100, y: 200}}
✅ Get properties: {operation: "get_properties", node_path: "/root/Player"}
✅ List children: {operation: "list_children", node_path: "/root"}

PREREQUISITES:
- Scene must be open in Godot Editor (use scene_manager first)
- Valid node paths must exist for operations
- Node types must be valid Godot classes (Node2D, Sprite2D, CharacterBody2D, etc.)
- Parent nodes must exist for creation operations
- CollisionShape3D nodes require assigned Shape3D resources
- MeshInstance3D nodes require assigned Mesh resources

ERROR PREVENTION:
- Always check scene is open before node operations
- Use "/root" as parent path for top-level node creation
- Verify node types exist in your Godot version
- Test property names against Godot documentation
- Assign shapes to CollisionShape3D nodes to prevent "A shape must be provided" errors
- Assign meshes to MeshInstance3D nodes to prevent blank screens`,
        parameters: z.object({
            operation: z.enum(['create', 'delete', 'update_property', 'get_properties', 'list_children', 'batch_update', 'create_shape', 'create_mesh', 'assign_resource'])
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
            // Shape and mesh creation options
            shapeType: z.enum(['BoxShape3D', 'SphereShape3D', 'CapsuleShape3D', 'CylinderShape3D', 'ConvexPolygonShape3D']).optional()
                .describe('Type of shape to create (required for create_shape)'),
            meshType: z.enum(['BoxMesh', 'SphereMesh', 'CapsuleMesh', 'CylinderMesh', 'PlaneMesh']).optional()
                .describe('Type of mesh to create (required for create_mesh)'),
            shapeParams: z.object({
                size: z.object({ x: z.number(), y: z.number(), z: z.number() }).optional(),
                radius: z.number().optional(),
                height: z.number().optional(),
                points: z.array(z.object({ x: z.number(), y: z.number(), z: z.number() })).optional()
            }).optional()
                .describe('Parameters for shape creation'),
            meshParams: z.object({
                size: z.object({ x: z.number(), y: z.number(), z: z.number() }).optional(),
                radius: z.number().optional(),
                height: z.number().optional(),
                subdivisions: z.object({ radial: z.number(), rings: z.number() }).optional()
            }).optional()
                .describe('Parameters for mesh creation'),
            resourceType: z.enum(['shape', 'mesh']).optional()
                .describe('Type of resource to assign (required for assign_resource)'),
            resourceId: z.string().optional()
                .describe('ID of resource to assign (required for assign_resource)'),
            // Intelligent node creation with auto-resources
            autoCreateResources: z.boolean().optional().default(false)
                .describe('Whether to automatically create and assign basic shapes/meshes for CollisionShape3D/MeshInstance3D nodes'),
            // General options
            preview: z.boolean().optional().default(false)
                .describe('Whether to preview changes without applying them')
        }),
        execute: async (params) => {
            const godot = await getGodotConnection();
            try {
                switch (params.operation) {
                    case 'create': {
                        if (!params.node_path || !params.node_type || !params.node_name) {
                            throw new Error('node_path, node_type, and node_name are required for create operation');
                        }
                        // Use intelligent creation if context is provided
                        if (params.context || params.position || params.suggestedName) {
                            const result = await godot.sendCommand('intelligent_node_creation', {
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
                        }
                        else {
                            // Basic creation
                            const result = await godot.sendCommand('create_node', {
                                parent_path: params.node_path,
                                node_type: params.node_type,
                                node_name: params.node_name,
                            });
                            let response = `Created ${params.node_type} node named "${params.node_name}" at ${result.node_path}`;
                            // Auto-create resources for special node types
                            if (params.autoCreateResources) {
                                const nodePath = result.node_path;
                                if (params.node_type === 'CollisionShape3D') {
                                    // Create and assign a default BoxShape3D
                                    const shapeResult = await godot.sendCommand('create_shape_resource', {
                                        shapeType: 'BoxShape3D',
                                        parameters: { size: { x: 1, y: 1, z: 1 } }
                                    });
                                    await godot.sendCommand('assign_node_resource', {
                                        nodePath,
                                        resourceType: 'shape',
                                        resourceId: shapeResult.resourceId
                                    });
                                    response += `\n✅ Auto-assigned BoxShape3D (1x1x1) to prevent "A shape must be provided" errors`;
                                }
                                else if (params.node_type === 'MeshInstance3D') {
                                    // Create and assign a default BoxMesh
                                    const meshResult = await godot.sendCommand('create_mesh_resource', {
                                        meshType: 'BoxMesh',
                                        parameters: { size: { x: 1, y: 1, z: 1 } }
                                    });
                                    await godot.sendCommand('assign_node_resource', {
                                        nodePath,
                                        resourceType: 'mesh',
                                        resourceId: meshResult.resourceId
                                    });
                                    response += `\n✅ Auto-assigned BoxMesh (1x1x1) to prevent blank screen`;
                                }
                            }
                            return response;
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
                        const result = await godot.sendCommand('update_node_property', {
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
                        const result = await godot.sendCommand('get_node_properties', { node_path: params.node_path });
                        const formattedProperties = Object.entries(result.properties)
                            .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
                            .join('\n');
                        return `Properties of node at ${params.node_path}:\n\n${formattedProperties}`;
                    }
                    case 'list_children': {
                        if (!params.node_path) {
                            throw new Error('node_path is required for list_children operation');
                        }
                        const result = await godot.sendCommand('list_nodes', { parent_path: params.node_path });
                        if (result.children.length === 0) {
                            return `No child nodes found under ${params.node_path}`;
                        }
                        const formattedChildren = result.children
                            .map((child) => `${child.name} (${child.type}) - ${child.path}`)
                            .join('\n');
                        return `Children of node at ${params.node_path}:\n\n${formattedChildren}`;
                    }
                    case 'batch_update': {
                        if (!params.operations || !Array.isArray(params.operations)) {
                            throw new Error('operations array is required for batch_update operation');
                        }
                        const scenePath = params.node_path ? params.node_path.split('/').slice(0, -1).join('/') || 'res://' : 'res://';
                        const result = await godot.sendCommand('node_property_automation', {
                            scenePath,
                            operations: params.operations,
                            preview: params.preview
                        });
                        let response = params.preview ? 'PREVIEW MODE - No changes applied\n\n' : 'Batch changes applied successfully\n\n';
                        response += `Operations performed:\n`;
                        if (result.results && Array.isArray(result.results)) {
                            result.results.forEach((opResult, index) => {
                                const operation = opResult.operation || {};
                                response += `${index + 1}. ${operation.nodePattern || 'Unknown'} -> ${operation.property || 'Unknown'} = ${JSON.stringify(operation.value)}\n`;
                                response += `   Success: ${opResult.success ? 'Yes' : 'No'}\n`;
                                if (opResult.error)
                                    response += `   Error: ${opResult.error}\n`;
                                if (opResult.nodes_affected !== undefined)
                                    response += `   Affected nodes: ${opResult.nodes_affected}\n`;
                            });
                        }
                        if (result.warnings && result.warnings.length > 0) {
                            response += `\nWarnings:\n${result.warnings.map((w) => `- ${w}`).join('\n')}`;
                        }
                        return response;
                    }
                    case 'create_shape': {
                        if (!params.shapeType) {
                            throw new Error('shapeType is required for create_shape operation');
                        }
                        const result = await godot.sendCommand('create_shape_resource', {
                            shapeType: params.shapeType,
                            parameters: params.shapeParams || {}
                        });
                        return `Created ${params.shapeType} shape with ID: ${result.resourceId}`;
                    }
                    case 'create_mesh': {
                        if (!params.meshType) {
                            throw new Error('meshType is required for create_mesh operation');
                        }
                        const result = await godot.sendCommand('create_mesh_resource', {
                            meshType: params.meshType,
                            parameters: params.meshParams || {}
                        });
                        return `Created ${params.meshType} mesh with ID: ${result.resourceId}`;
                    }
                    case 'assign_resource': {
                        if (!params.nodePath || !params.resourceType || !params.resourceId) {
                            throw new Error('nodePath, resourceType, and resourceId are required for assign_resource operation');
                        }
                        const result = await godot.sendCommand('assign_node_resource', {
                            nodePath: params.nodePath,
                            resourceType: params.resourceType,
                            resourceId: params.resourceId
                        });
                        return `Assigned ${params.resourceType} resource to node at ${params.nodePath}`;
                    }
                    default:
                        throw new Error(`Unknown operation: ${params.operation}`);
                }
            }
            catch (error) {
                throw new Error(`Node manager operation failed: ${error.message}`);
            }
        },
    },
];
//# sourceMappingURL=node_tools.js.map