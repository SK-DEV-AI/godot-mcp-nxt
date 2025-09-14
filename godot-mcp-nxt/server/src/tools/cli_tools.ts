import { z } from 'zod';
import { MCPTool } from '../utils/types.js';
import { fileURLToPath } from 'url';
import { join, dirname, normalize, basename } from 'path';
import { readdirSync, existsSync } from 'fs';
import { spawn } from 'child_process';
import { promisify } from 'util';
import { exec } from 'child_process';
import { getCachedGodotPath, getCachedProjectStructure } from '../utils/cache.js';
import { retryGodotOperation } from '../utils/retry.js';

const execAsync = promisify(exec);

// Derive __filename and __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Godot path detection and management
let godotPath: string | null = null;
let activeProcess: any = null;
let output: string[] = [];
let errors: string[] = [];

async function detectGodotPath() {
  if (godotPath && await isValidGodotPath(godotPath)) {
    return;
  }

  // Check environment variable
  if (process.env.GODOT_PATH) {
    const normalizedPath = normalize(process.env.GODOT_PATH);
    if (await isValidGodotPath(normalizedPath)) {
      godotPath = normalizedPath;
      return;
    }
  }

  // Auto-detect based on platform
  const osPlatform = process.platform;
  const possiblePaths: string[] = ['godot'];

  if (osPlatform === 'darwin') {
    possiblePaths.push(
      '/Applications/Godot.app/Contents/MacOS/Godot',
      '/Applications/Godot_4.app/Contents/MacOS/Godot'
    );
  } else if (osPlatform === 'win32') {
    possiblePaths.push(
      'C:\\Program Files\\Godot\\Godot.exe',
      'C:\\Program Files (x86)\\Godot\\Godot.exe'
    );
  } else if (osPlatform === 'linux') {
    possiblePaths.push(
      '/usr/bin/godot',
      '/usr/local/bin/godot'
    );
  }

  for (const path of possiblePaths) {
    const normalizedPath = normalize(path);
    if (await isValidGodotPath(normalizedPath)) {
      godotPath = normalizedPath;
      return;
    }
  }

  console.warn('[CLI] Could not find Godot executable');
}

async function isValidGodotPath(path: string): Promise<boolean> {
  try {
    const command = path === 'godot' ? 'godot --version' : `"${path}" --version`;
    await execAsync(command);
    return true;
  } catch {
    return false;
  }
}

async function executeOperation(operation: string, params: any, projectPath: string): Promise<{ stdout: string; stderr: string }> {
  // Use cached Godot path
  if (!godotPath) {
    godotPath = await getCachedGodotPath();
    if (!godotPath) {
      throw new Error('Could not find a valid Godot executable path');
    }
  }

  const operationsScriptPath = join(__dirname, '..', 'scripts', 'godot_operations.gd');
  const paramsJson = JSON.stringify(params);
  const escapedParams = paramsJson.replace(/'/g, "'\\''");

  const isWindows = process.platform === 'win32';
  const quotedParams = isWindows
    ? `\"${paramsJson.replace(/\"/g, '\\"')}\"`
    : `'${escapedParams}'`;

  const cmd = [
    `"${godotPath}"`,
    '--headless',
    '--path',
    `"${projectPath}"`,
    '--script',
    `"${operationsScriptPath}"`,
    operation,
    quotedParams,
  ].join(' ');

  try {
    const result = await retryGodotOperation(
      async () => {
        const { stdout, stderr } = await execAsync(cmd);
        return { stdout, stderr };
      },
      `Godot operation: ${operation}`,
      { maxAttempts: 2, initialDelay: 1000 }
    );
    return result;
  } catch (error: any) {
    if (error.stdout && error.stderr) {
      return { stdout: error.stdout, stderr: error.stderr };
    }
    throw error;
  }
}

function findGodotProjects(directory: string, recursive: boolean): Array<{ path: string; name: string }> {
  const projects: Array<{ path: string; name: string }> = [];

  try {
    const entries = readdirSync(directory, { withFileTypes: true });

    // Check if current directory is a project
    const projectFile = join(directory, 'project.godot');
    if (existsSync(projectFile)) {
      projects.push({
        path: directory,
        name: directory.split('/').pop() || 'Unknown',
      });
    }

    if (!recursive) {
      // Check immediate subdirectories
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const subdir = join(directory, entry.name);
          const subProjectFile = join(subdir, 'project.godot');
          if (existsSync(subProjectFile)) {
            projects.push({
              path: subdir,
              name: entry.name,
            });
          }
        }
      }
    } else {
      // Recursive search
      for (const entry of entries) {
        if (entry.isDirectory() && !entry.name.startsWith('.')) {
          const subdir = join(directory, entry.name);
          const subProjects = findGodotProjects(subdir, true);
          projects.push(...subProjects);
        }
      }
    }
  } catch (error) {
    console.error(`Error searching directory ${directory}:`, error);
  }

  return projects;
}

// Use the cached version from utils/cache.ts
const getProjectStructureAsync = getCachedProjectStructure;

// CLI-based tools
export const cliTools: MCPTool[] = [
  {
    name: 'launch_editor',
    description: 'Launch Godot editor for a specific project',
    parameters: z.object({
      projectPath: z.string().describe('Path to the Godot project directory'),
    }),
    execute: async ({ projectPath }) => {
      return await handleLaunchEditor({ projectPath });
    },
  },
  {
    name: 'run_project',
    description: 'Run the Godot project and capture output',
    parameters: z.object({
      projectPath: z.string().describe('Path to the Godot project directory'),
      scene: z.string().optional().describe('Optional: Specific scene to run'),
    }),
    execute: async ({ projectPath, scene }) => {
      return await handleRunProject({ projectPath, scene });
    },
  },
  {
    name: 'get_debug_output',
    description: 'Get the current debug output and errors',
    parameters: z.object({}),
    execute: async () => {
      const result = await handleGetDebugOutput();
      return result.content[0].text;
    },
  },
  {
    name: 'stop_project',
    description: 'Stop the currently running Godot project',
    parameters: z.object({}),
    execute: async () => {
      const result = await handleStopProject();
      return result.content[0].text;
    },
  },
  {
    name: 'get_godot_version',
    description: 'Get the installed Godot version',
    parameters: z.object({}),
    execute: async () => {
      const result = await handleGetGodotVersion();
      return result.content[0].text;
    },
  },
  {
    name: 'list_projects',
    description: 'List Godot projects in a directory',
    parameters: z.object({
      directory: z.string().describe('Directory to search for Godot projects'),
      recursive: z.boolean().optional().describe('Whether to search recursively (default: false)'),
    }),
    execute: async ({ directory, recursive }) => {
      const result = await handleListProjects({ directory, recursive });
      return result.content[0].text;
    },
  },
  {
    name: 'get_project_info',
    description: 'Retrieve metadata about a Godot project',
    parameters: z.object({
      projectPath: z.string().describe('Path to the Godot project directory'),
    }),
    execute: async ({ projectPath }) => {
      const result = await handleGetProjectInfo({ projectPath });
      return result.content[0].text;
    },
  },
  {
    name: 'create_scene_cli',
    description: 'Create a new Godot scene file (CLI version)',
    parameters: z.object({
      projectPath: z.string().describe('Path to the Godot project directory'),
      scenePath: z.string().describe('Path where the scene file will be saved (relative to project)'),
      rootNodeType: z.string().optional().default('Node2D').describe('Type of the root node (e.g., Node2D, Node3D)'),
    }),
    execute: async ({ projectPath, scenePath, rootNodeType }) => {
      const result = await handleCreateScene({ projectPath, scenePath, rootNodeType });
      return result.content[0].text;
    },
  },
  {
    name: 'add_node_cli',
    description: 'Add a node to an existing scene (CLI version)',
    parameters: z.object({
      projectPath: z.string().describe('Path to the Godot project directory'),
      scenePath: z.string().describe('Path to the scene file (relative to project)'),
      parentNodePath: z.string().optional().default('root').describe('Path to the parent node (e.g., "root" or "root/Player")'),
      nodeType: z.string().describe('Type of node to add (e.g., Sprite2D, CollisionShape2D)'),
      nodeName: z.string().describe('Name for the new node'),
      properties: z.record(z.any()).optional().describe('Optional properties to set on the node'),
    }),
    execute: async ({ projectPath, scenePath, parentNodePath, nodeType, nodeName, properties }) => {
      const result = await handleAddNode({ projectPath, scenePath, parentNodePath, nodeType, nodeName, properties });
      return result.content[0].text;
    },
  },
  {
    name: 'load_sprite_cli',
    description: 'Load a sprite into a Sprite2D node (CLI version)',
    parameters: z.object({
      projectPath: z.string().describe('Path to the Godot project directory'),
      scenePath: z.string().describe('Path to the scene file (relative to project)'),
      nodePath: z.string().describe('Path to the Sprite2D node (e.g., "root/Player/Sprite2D")'),
      texturePath: z.string().describe('Path to the texture file (relative to project)'),
    }),
    execute: async ({ projectPath, scenePath, nodePath, texturePath }) => {
      const result = await handleLoadSprite({ projectPath, scenePath, nodePath, texturePath });
      return result.content[0].text;
    },
  },
  {
    name: 'export_mesh_library_cli',
    description: 'Export a scene as a MeshLibrary resource (CLI version)',
    parameters: z.object({
      projectPath: z.string().describe('Path to the Godot project directory'),
      scenePath: z.string().describe('Path to the scene file (.tscn) to export'),
      outputPath: z.string().describe('Path where the mesh library (.res) will be saved'),
      meshItemNames: z.array(z.string()).optional().describe('Optional: Names of specific mesh items to include (defaults to all)'),
    }),
    execute: async ({ projectPath, scenePath, outputPath, meshItemNames }) => {
      const result = await handleExportMeshLibrary({ projectPath, scenePath, outputPath, meshItemNames });
      return result.content[0].text;
    },
  },
  {
    name: 'save_scene_cli',
    description: 'Save changes to a scene file (CLI version)',
    parameters: z.object({
      projectPath: z.string().describe('Path to the Godot project directory'),
      scenePath: z.string().describe('Path to the scene file (relative to project)'),
      newPath: z.string().optional().describe('Optional: New path to save the scene to (for creating variants)'),
    }),
    execute: async ({ projectPath, scenePath, newPath }) => {
      const result = await handleSaveScene({ projectPath, scenePath, newPath });
      return result.content[0].text;
    },
  },
  {
    name: 'get_uid_cli',
    description: 'Get the UID for a specific file in a Godot project (for Godot 4.4+)',
    parameters: z.object({
      projectPath: z.string().describe('Path to the Godot project directory'),
      filePath: z.string().describe('Path to the file (relative to project) for which to get the UID'),
    }),
    execute: async ({ projectPath, filePath }) => {
      const result = await handleGetUid({ projectPath, filePath });
      return result.content[0].text;
    },
  },
  {
    name: 'update_project_uids_cli',
    description: 'Update UID references in a Godot project by resaving resources (for Godot 4.4+)',
    parameters: z.object({
      projectPath: z.string().describe('Path to the Godot project directory'),
    }),
    annotations: {
      streamingHint: true,
    },
    execute: async (args: any, context?: { reportProgress?: any; streamContent?: any }) => {
      const result = await handleUpdateProjectUids(args, context);
      return result.content[0].text;
    },
  },
];
// Tool handlers - these will be called by the FastMCP server
export async function handleCliTool(name: string, args: any) {
  try {
    switch (name) {
      case 'launch_editor':
        return await handleLaunchEditor(args);
      case 'run_project':
        return await handleRunProject(args);
      case 'get_debug_output':
        return await handleGetDebugOutput();
      case 'stop_project':
        return await handleStopProject();
      case 'get_godot_version':
        return await handleGetGodotVersion();
      case 'list_projects':
        return await handleListProjects(args);
      case 'get_project_info':
        return await handleGetProjectInfo(args);
      case 'create_scene_cli':
        return await handleCreateScene(args);
      case 'add_node_cli':
        return await handleAddNode(args);
      case 'load_sprite_cli':
        return await handleLoadSprite(args);
      case 'export_mesh_library_cli':
        return await handleExportMeshLibrary(args);
      case 'save_scene_cli':
        return await handleSaveScene(args);
      case 'get_uid_cli':
        return await handleGetUid(args);
      case 'update_project_uids_cli':
        return await handleUpdateProjectUids(args);
      default:
        throw new Error(`Unknown CLI tool: ${name}`);
    }
  } catch (error) {
    console.error(`Error in CLI tool ${name}:`, error);
    throw error;
  }
}

async function handleLaunchEditor(args: any): Promise<string> {
  if (!args.projectPath) {
    throw new Error('Project path is required');
  }

  await detectGodotPath();
  if (!godotPath) {
    throw new Error('Could not find a valid Godot executable path');
  }

  const projectFile = join(args.projectPath, 'project.godot');
  if (!existsSync(projectFile)) {
    throw new Error(`Not a valid Godot project: ${args.projectPath}`);
  }

  // Launch editor in background
  spawn(godotPath, ['-e', '--path', args.projectPath], {
    stdio: 'ignore',
    detached: true
  });

  return `Godot editor launched successfully for project at ${args.projectPath}.`;
}

async function handleRunProject(args: any): Promise<string> {
  if (!args.projectPath) {
    throw new Error('Project path is required');
  }

  await detectGodotPath();
  if (!godotPath) {
    throw new Error('Could not find a valid Godot executable path');
  }

  const projectFile = join(args.projectPath, 'project.godot');
  if (!existsSync(projectFile)) {
    throw new Error(`Not a valid Godot project: ${args.projectPath}`);
  }

  // Kill any existing process
  if (activeProcess) {
    activeProcess.kill();
  }

  const cmdArgs = ['-d', '--path', args.projectPath];
  if (args.scene) {
    cmdArgs.push(args.scene);
  }

  const process = spawn(godotPath, cmdArgs, { stdio: 'pipe' });
  output.length = 0;
  errors.length = 0;

  process.stdout?.on('data', (data: Buffer) => {
    const lines = data.toString().split('\n');
    output.push(...lines);
  });

  process.stderr?.on('data', (data: Buffer) => {
    const lines = data.toString().split('\n');
    errors.push(...lines);
  });

  process.on('exit', () => {
    activeProcess = null;
  });

  activeProcess = process;

  return `Godot project started in debug mode. Use get_debug_output to see output.`;
}

async function handleGetDebugOutput() {
  if (!activeProcess) {
    throw new Error('No active Godot process.');
  }

  const result = JSON.stringify({ output, errors }, null, 2);
  return {
    content: [{ type: 'text', text: result }]
  };
}

async function handleStopProject() {
  if (!activeProcess) {
    throw new Error('No active Godot process to stop.');
  }

  activeProcess.kill();
  const finalOutput = [...output];
  const finalErrors = [...errors];
  activeProcess = null;

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        message: 'Godot project stopped',
        finalOutput,
        finalErrors
      }, null, 2)
    }]
  };
}

async function handleGetGodotVersion() {
  await detectGodotPath();
  if (!godotPath) {
    throw new Error('Could not find a valid Godot executable path');
  }

  const { stdout } = await execAsync(`"${godotPath}" --version`);
  return {
    content: [{ type: 'text', text: stdout.trim() }]
  };
}

async function handleListProjects(args: any) {
  if (!args.directory) {
    throw new Error('Directory is required');
  }

  if (!existsSync(args.directory)) {
    throw new Error(`Directory does not exist: ${args.directory}`);
  }

  const recursive = args.recursive === true;
  const projects = findGodotProjects(args.directory, recursive);

  return {
    content: [{ type: 'text', text: JSON.stringify(projects, null, 2) }]
  };
}

async function handleGetProjectInfo(args: any) {
  if (!args.projectPath) {
    throw new Error('Project path is required');
  }

  await detectGodotPath();
  if (!godotPath) {
    throw new Error('Could not find a valid Godot executable path');
  }

  const projectFile = join(args.projectPath, 'project.godot');
  if (!existsSync(projectFile)) {
    throw new Error(`Not a valid Godot project: ${args.projectPath}`);
  }

  const { stdout } = await execAsync(`"${godotPath}" --version`);
  const projectStructure = await getProjectStructureAsync(args.projectPath);

  let projectName = basename(args.projectPath);
  try {
    const fs = await import('fs');
    const projectFileContent = fs.readFileSync(projectFile, 'utf8');
    const configNameMatch = projectFileContent.match(/config\/name="([^"]+)"/);
    if (configNameMatch && configNameMatch[1]) {
      projectName = configNameMatch[1];
    }
  } catch (error) {
    // Continue with default project name
  }

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        name: projectName,
        path: args.projectPath,
        godotVersion: stdout.trim(),
        structure: projectStructure,
      }, null, 2)
    }]
  };
}

async function handleCreateScene(args: any) {
  if (!args.projectPath || !args.scenePath) {
    throw new Error('Project path and scene path are required');
  }

  const projectFile = join(args.projectPath, 'project.godot');
  if (!existsSync(projectFile)) {
    throw new Error(`Not a valid Godot project: ${args.projectPath}`);
  }

  const params = {
    scenePath: args.scenePath,
    rootNodeType: args.rootNodeType || 'Node2D',
  };

  const { stdout, stderr } = await executeOperation('create_scene', params, args.projectPath);

  if (stderr && stderr.includes('Failed to')) {
    throw new Error(`Failed to create scene: ${stderr}`);
  }

  return {
    content: [{ type: 'text', text: `Scene created successfully at: ${args.scenePath}\n\nOutput: ${stdout}` }]
  };
}

async function handleAddNode(args: any) {
  if (!args.projectPath || !args.scenePath || !args.nodeType || !args.nodeName) {
    throw new Error('Missing required parameters');
  }

  const projectFile = join(args.projectPath, 'project.godot');
  if (!existsSync(projectFile)) {
    throw new Error(`Not a valid Godot project: ${args.projectPath}`);
  }

  const scenePath = join(args.projectPath, args.scenePath);
  if (!existsSync(scenePath)) {
    throw new Error(`Scene file does not exist: ${args.scenePath}`);
  }

  const params: any = {
    scenePath: args.scenePath,
    nodeType: args.nodeType,
    nodeName: args.nodeName,
  };

  if (args.parentNodePath) params.parentNodePath = args.parentNodePath;
  if (args.properties) params.properties = args.properties;

  const { stdout, stderr } = await executeOperation('add_node', params, args.projectPath);

  if (stderr && stderr.includes('Failed to')) {
    throw new Error(`Failed to add node: ${stderr}`);
  }

  return {
    content: [{ type: 'text', text: `Node '${args.nodeName}' of type '${args.nodeType}' added successfully to '${args.scenePath}'.\n\nOutput: ${stdout}` }]
  };
}

async function handleLoadSprite(args: any) {
  if (!args.projectPath || !args.scenePath || !args.nodePath || !args.texturePath) {
    throw new Error('Missing required parameters');
  }

  const projectFile = join(args.projectPath, 'project.godot');
  if (!existsSync(projectFile)) {
    throw new Error(`Not a valid Godot project: ${args.projectPath}`);
  }

  const scenePath = join(args.projectPath, args.scenePath);
  if (!existsSync(scenePath)) {
    throw new Error(`Scene file does not exist: ${args.scenePath}`);
  }

  const texturePath = join(args.projectPath, args.texturePath);
  if (!existsSync(texturePath)) {
    throw new Error(`Texture file does not exist: ${args.texturePath}`);
  }

  const params = {
    scenePath: args.scenePath,
    nodePath: args.nodePath,
    texturePath: args.texturePath,
  };

  const { stdout, stderr } = await executeOperation('load_sprite', params, args.projectPath);

  if (stderr && stderr.includes('Failed to')) {
    throw new Error(`Failed to load sprite: ${stderr}`);
  }

  return {
    content: [{ type: 'text', text: `Sprite loaded successfully with texture: ${args.texturePath}\n\nOutput: ${stdout}` }]
  };
}

async function handleExportMeshLibrary(args: any) {
  if (!args.projectPath || !args.scenePath || !args.outputPath) {
    throw new Error('Missing required parameters');
  }

  const projectFile = join(args.projectPath, 'project.godot');
  if (!existsSync(projectFile)) {
    throw new Error(`Not a valid Godot project: ${args.projectPath}`);
  }

  const scenePath = join(args.projectPath, args.scenePath);
  if (!existsSync(scenePath)) {
    throw new Error(`Scene file does not exist: ${args.scenePath}`);
  }

  const params: any = {
    scenePath: args.scenePath,
    outputPath: args.outputPath,
  };

  if (args.meshItemNames) params.meshItemNames = args.meshItemNames;

  const { stdout, stderr } = await executeOperation('export_mesh_library', params, args.projectPath);

  if (stderr && stderr.includes('Failed to')) {
    throw new Error(`Failed to export mesh library: ${stderr}`);
  }

  return {
    content: [{ type: 'text', text: `MeshLibrary exported successfully to: ${args.outputPath}\n\nOutput: ${stdout}` }]
  };
}

async function handleSaveScene(args: any) {
  if (!args.projectPath || !args.scenePath) {
    throw new Error('Missing required parameters');
  }

  const projectFile = join(args.projectPath, 'project.godot');
  if (!existsSync(projectFile)) {
    throw new Error(`Not a valid Godot project: ${args.projectPath}`);
  }

  const scenePath = join(args.projectPath, args.scenePath);
  if (!existsSync(scenePath)) {
    throw new Error(`Scene file does not exist: ${args.scenePath}`);
  }

  const params: any = { scenePath: args.scenePath };
  if (args.newPath) params.newPath = args.newPath;

  const { stdout, stderr } = await executeOperation('save_scene', params, args.projectPath);

  if (stderr && stderr.includes('Failed to')) {
    throw new Error(`Failed to save scene: ${stderr}`);
  }

  const savePath = args.newPath || args.scenePath;
  return {
    content: [{ type: 'text', text: `Scene saved successfully to: ${savePath}\n\nOutput: ${stdout}` }]
  };
}

async function handleGetUid(args: any) {
  if (!args.projectPath || !args.filePath) {
    throw new Error('Missing required parameters');
  }

  await detectGodotPath();
  if (!godotPath) {
    throw new Error('Could not find a valid Godot executable path');
  }

  const projectFile = join(args.projectPath, 'project.godot');
  if (!existsSync(projectFile)) {
    throw new Error(`Not a valid Godot project: ${args.projectPath}`);
  }

  const filePath = join(args.projectPath, args.filePath);
  if (!existsSync(filePath)) {
    throw new Error(`File does not exist: ${args.filePath}`);
  }

  const { stdout: versionOutput } = await execAsync(`"${godotPath}" --version`);
  const version = versionOutput.trim();

  if (!isGodot44OrLater(version)) {
    throw new Error(`UIDs are only supported in Godot 4.4 or later. Current version: ${version}`);
  }

  const params = { filePath: args.filePath };
  const { stdout, stderr } = await executeOperation('get_uid', params, args.projectPath);

  if (stderr && stderr.includes('Failed to')) {
    throw new Error(`Failed to get UID: ${stderr}`);
  }

  return {
    content: [{ type: 'text', text: `UID for ${args.filePath}: ${stdout.trim()}` }]
  };
}

async function handleUpdateProjectUids(args: any, context?: { reportProgress?: any; streamContent?: any }) {
  if (!args.projectPath) {
    throw new Error('Project path is required');
  }

  await detectGodotPath();
  if (!godotPath) {
    throw new Error('Could not find a valid Godot executable path');
  }

  const projectFile = join(args.projectPath, 'project.godot');
  if (!existsSync(projectFile)) {
    throw new Error(`Not a valid Godot project: ${args.projectPath}`);
  }

  const { stdout: versionOutput } = await execAsync(`"${godotPath}" --version`);
  const version = versionOutput.trim();

  if (!isGodot44OrLater(version)) {
    throw new Error(`UIDs are only supported in Godot 4.4 or later. Current version: ${version}`);
  }

  // Report initial progress
  if (context?.reportProgress) {
    await context.reportProgress({ progress: 0, total: 100 });
  }

  if (context?.streamContent) {
    await context.streamContent({ type: 'text', text: 'Starting UID update process...\n' });
  }

  // Simulate progress for preparation
  if (context?.reportProgress) {
    await context.reportProgress({ progress: 10, total: 100 });
  }

  const params = { projectPath: args.projectPath };

  if (context?.streamContent) {
    await context.streamContent({ type: 'text', text: 'Scanning project files...\n' });
  }

  // Simulate progress for file scanning
  if (context?.reportProgress) {
    await context.reportProgress({ progress: 30, total: 100 });
  }

  const { stdout, stderr } = await executeOperation('resave_resources', params, args.projectPath);

  if (stderr && stderr.includes('Failed to')) {
    if (context?.streamContent) {
      await context.streamContent({ type: 'text', text: `Error: ${stderr}\n` });
    }
    throw new Error(`Failed to update project UIDs: ${stderr}`);
  }

  // Report completion
  if (context?.reportProgress) {
    await context.reportProgress({ progress: 100, total: 100 });
  }

  if (context?.streamContent) {
    await context.streamContent({ type: 'text', text: 'UID update completed successfully.\n' });
  }

  return {
    content: [{ type: 'text', text: `Project UIDs updated successfully.\n\nOutput: ${stdout}` }]
  };
}

function isGodot44OrLater(version: string): boolean {
  const match = version.match(/^(\d+)\.(\d+)/);
  if (match) {
    const major = parseInt(match[1], 10);
    const minor = parseInt(match[2], 10);
    return major > 4 || (major === 4 && minor >= 4);
  }
  return false;
}
