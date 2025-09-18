import { z } from 'zod';
import { getGodotConnection } from '../utils/godot_connection.js';
// Unified Project Management Tool - Now uses WebSocket instead of CLI spawning
export const cliTools = [
    {
        name: 'project_manager',
        description: `🚀 UNIFIED PROJECT MANAGER - Complete Godot Project Lifecycle Management

USAGE WORKFLOW:
1. 📋 GET_INFO: Use operation="get_project_info" to get project details
2. 📂 LIST: Use operation="list_projects" to find Godot projects
3. ▶️ RUN: Use operation="run_project" to start project in debug mode
4. 🖥️ EDITOR: Use operation="launch_editor" to open in Godot Editor
5. 📊 HEALTH: Use operation="health_check" to validate project
6. 🆕 SETUP: Use operation="quick_setup" to create new projects
7. 🛑 STOP: Use operation="stop_project" to stop running projects
8. 📋 VERSION: Use operation="get_godot_version" to get version info

COMMON PITFALLS TO AVOID:
❌ DON'T forget projectPath for project-specific operations
❌ DON'T try operations without valid Godot project structure
❌ DON'T use invalid directory paths
❌ DON'T forget to handle async operations properly

EXAMPLES:
✅ Get project info: {operation: "get_project_info"}
✅ List projects: {operation: "list_projects", directory: "/home/user/projects", recursive: true}
✅ Run project: {operation: "run_project", projectPath: "/home/user/MyGame"}
✅ Launch editor: {operation: "launch_editor", projectPath: "/home/user/MyGame"}
✅ Health check: {operation: "health_check", projectPath: "/home/user/MyGame"}
✅ Quick setup: {operation: "quick_setup", projectPath: "/home/user/projects", projectName: "NewGame"}
✅ Get version: {operation: "get_godot_version"}

PREREQUISITES:
- Godot addon must be running and connected via WebSocket
- Valid project paths must exist for project operations
- Godot executable must be available in PATH for run/launch operations

ERROR PREVENTION:
- Always validate project paths before operations
- Check WebSocket connection status before sending commands
- Handle async operations with proper error handling
- Use absolute paths for maximum compatibility`,
        parameters: z.object({
            operation: z.enum(['get_project_info', 'list_projects', 'run_project', 'launch_editor', 'get_debug_output', 'stop_project', 'get_godot_version', 'health_check', 'quick_setup'])
                .describe('Type of project operation to perform'),
            projectPath: z.string().optional()
                .describe('Path to the Godot project directory (required for most operations)'),
            directory: z.string().optional()
                .describe('Directory to search for projects (required for list_projects)'),
            recursive: z.boolean().optional().default(false)
                .describe('Whether to search recursively for projects'),
            scene: z.string().optional()
                .describe('Specific scene to run (optional for run_project)'),
            waitForReady: z.boolean().optional().default(false)
                .describe('Wait for editor/project to be ready'),
            projectName: z.string().optional()
                .describe('Name for new project (required for quick_setup)'),
            template: z.enum(['2d', '3d', 'empty']).optional().default('2d')
                .describe('Project template to use'),
            includeDemo: z.boolean().optional().default(true)
                .describe('Include demo scene and script'),
            includeSystemInfo: z.boolean().optional().default(false)
                .describe('Include system information in responses'),
            includeDependencies: z.boolean().optional().default(true)
                .describe('Check for missing dependencies'),
            includeFileIntegrity: z.boolean().optional().default(true)
                .describe('Verify file integrity'),
            includePerformanceMetrics: z.boolean().optional().default(false)
                .describe('Include basic performance metrics')
        }),
        execute: async (params) => {
            const godot = getGodotConnection();
            try {
                switch (params.operation) {
                    case 'get_project_info': {
                        const result = await godot.sendCommand('get_project_info');
                        return `Project Info:\n${JSON.stringify(result, null, 2)}`;
                    }
                    case 'list_projects': {
                        if (!params.directory) {
                            throw new Error('directory is required for list_projects operation');
                        }
                        const result = await godot.sendCommand('list_projects', {
                            directory: params.directory,
                            recursive: params.recursive
                        });
                        return `Found ${result.length} Godot projects:\n${JSON.stringify(result, null, 2)}`;
                    }
                    case 'run_project': {
                        if (!params.projectPath) {
                            throw new Error('projectPath is required for run_project operation');
                        }
                        const result = await godot.sendCommand('run_project', {
                            projectPath: params.projectPath,
                            scene: params.scene
                        });
                        return result.message;
                    }
                    case 'launch_editor': {
                        if (!params.projectPath) {
                            throw new Error('projectPath is required for launch_editor operation');
                        }
                        const result = await godot.sendCommand('launch_editor', {
                            projectPath: params.projectPath,
                            waitForReady: params.waitForReady
                        });
                        return result.message;
                    }
                    case 'get_debug_output': {
                        const result = await godot.sendCommand('get_debug_output');
                        return result.message;
                    }
                    case 'stop_project': {
                        const result = await godot.sendCommand('stop_project');
                        return result.message;
                    }
                    case 'get_godot_version': {
                        const result = await godot.sendCommand('get_godot_version');
                        return `Godot Version: ${result.version}`;
                    }
                    case 'health_check': {
                        if (!params.projectPath) {
                            throw new Error('projectPath is required for health_check operation');
                        }
                        const result = await godot.sendCommand('health_check', {
                            projectPath: params.projectPath
                        });
                        return `Health Check Results:\n${JSON.stringify(result, null, 2)}`;
                    }
                    case 'quick_setup': {
                        if (!params.projectPath || !params.projectName) {
                            throw new Error('projectPath and projectName are required for quick_setup operation');
                        }
                        const result = await godot.sendCommand('quick_setup', {
                            projectPath: params.projectPath,
                            projectName: params.projectName,
                            template: params.template,
                            includeDemo: params.includeDemo
                        });
                        return result.message;
                    }
                    default:
                        throw new Error(`Unknown operation: ${params.operation}`);
                }
            }
            catch (error) {
                throw new Error(`Project manager operation failed: ${error.message}`);
            }
        },
    },
];
//# sourceMappingURL=cli_tools.js.map