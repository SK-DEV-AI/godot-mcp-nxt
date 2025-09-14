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

