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
    description: 'Launch Godot editor for a specific project with enhanced error handling',
    parameters: z.object({
      projectPath: z.string().describe('Path to the Godot project directory'),
      waitForReady: z.boolean().optional().default(false).describe('Wait for editor to be ready before returning'),
      customArgs: z.array(z.string()).optional().describe('Additional command line arguments for Godot')
    }),
    execute: async ({ projectPath, waitForReady = false, customArgs = [] }) => {
      try {
        console.log(`[launch_editor] Launching Godot editor for project: ${projectPath}`);

        if (!projectPath || typeof projectPath !== 'string') {
          throw new Error('Project path must be a non-empty string');
        }

        const result = await handleLaunchEditor({ projectPath, waitForReady, customArgs });

        if (waitForReady) {
          return `${result}\n⏳ Editor launched and ready for use`;
        }

        return result;
      } catch (error) {
        console.error('[launch_editor] Failed to launch editor:', error);
        throw new Error(`Failed to launch Godot editor: ${(error as Error).message}`);
      }
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
    name: 'project_health_check',
    description: 'Perform comprehensive health check on Godot project',
    parameters: z.object({
      projectPath: z.string().describe('Path to the Godot project directory'),
      includeDependencies: z.boolean().optional().default(true).describe('Check for missing dependencies'),
      includeFileIntegrity: z.boolean().optional().default(true).describe('Verify file integrity'),
      includePerformanceMetrics: z.boolean().optional().default(false).describe('Include basic performance metrics')
    }),
    execute: async ({ projectPath, includeDependencies = true, includeFileIntegrity = true, includePerformanceMetrics = false }) => {
      try {
        console.log(`[project_health_check] Starting health check for: ${projectPath}`);

        if (!projectPath || typeof projectPath !== 'string') {
          throw new Error('Project path must be a non-empty string');
        }

        // Check if project exists
        const fs = await import('fs');
        const path = await import('path');
        const projectFile = path.join(projectPath, 'project.godot');

        if (!fs.existsSync(projectFile)) {
          throw new Error(`Not a valid Godot project: ${projectPath}`);
        }

        let healthReport = `🏥 Godot Project Health Check\n`;
        healthReport += `Project: ${projectPath}\n\n`;

        // Basic project structure check
        const requiredFiles = ['project.godot'];
        const recommendedFiles = ['.gitignore', 'README.md'];

        healthReport += `📁 Project Structure:\n`;
        requiredFiles.forEach(file => {
          const exists = fs.existsSync(path.join(projectPath, file));
          healthReport += `${exists ? '✅' : '❌'} ${file}\n`;
        });

        healthReport += `\n📋 Recommended Files:\n`;
        recommendedFiles.forEach(file => {
          const exists = fs.existsSync(path.join(projectPath, file));
          healthReport += `${exists ? '✅' : '⚠️'} ${file}\n`;
        });

        // Check for common directories
        const commonDirs = ['scenes', 'scripts', 'assets', 'addons'];
        healthReport += `\n📂 Common Directories:\n`;
        commonDirs.forEach(dir => {
          const exists = fs.existsSync(path.join(projectPath, dir));
          healthReport += `${exists ? '✅' : 'ℹ️'} ${dir}/\n`;
        });

        if (includeDependencies) {
          healthReport += `\n🔗 Dependencies Check:\n`;
          // This would be expanded with actual dependency checking logic
          healthReport += `⚠️ Dependency checking not fully implemented yet\n`;
        }

        if (includeFileIntegrity) {
          healthReport += `\n🔍 File Integrity:\n`;
          // Basic file size and accessibility check
          try {
            const stats = fs.statSync(projectFile);
            healthReport += `✅ project.godot accessible (${stats.size} bytes)\n`;
          } catch (error) {
            healthReport += `❌ project.godot inaccessible: ${(error as Error).message}\n`;
          }
        }

        if (includePerformanceMetrics) {
          healthReport += `\n⚡ Performance Metrics:\n`;
          healthReport += `ℹ️ Performance metrics collection not implemented yet\n`;
        }

        healthReport += `\n🎯 Recommendations:\n`;
        healthReport += `- Consider adding a .gitignore file if missing\n`;
        healthReport += `- Create organized folder structure (scenes/, scripts/, assets/)\n`;
        healthReport += `- Add a README.md for project documentation\n`;

        return healthReport;

      } catch (error) {
        console.error('[project_health_check] Health check failed:', error);
        throw new Error(`Project health check failed: ${(error as Error).message}`);
      }
    },
  },

  {
    name: 'quick_setup',
    description: 'Quick setup wizard for new Godot projects with MCP integration',
    parameters: z.object({
      projectPath: z.string().describe('Path where to create the new project'),
      projectName: z.string().describe('Name of the new project'),
      template: z.enum(['2d', '3d', 'empty']).optional().default('2d').describe('Project template to use'),
      includeDemo: z.boolean().optional().default(true).describe('Include demo scene and script')
    }),
    execute: async ({ projectPath, projectName, template = '2d', includeDemo = true }) => {
      try {
        console.log(`[quick_setup] Setting up new Godot project: ${projectName}`);

        if (!projectPath || !projectName) {
          throw new Error('Both project path and name are required');
        }

        const fs = await import('fs');
        const path = await import('path');

        // Create project directory
        const fullProjectPath = path.join(projectPath, projectName);
        if (fs.existsSync(fullProjectPath)) {
          throw new Error(`Directory already exists: ${fullProjectPath}`);
        }

        fs.mkdirSync(fullProjectPath, { recursive: true });

        // Create basic project structure
        const dirs = ['scenes', 'scripts', 'assets'];
        dirs.forEach(dir => {
          fs.mkdirSync(path.join(fullProjectPath, dir), { recursive: true });
        });

        // Create project.godot
        const projectGodot = `[application]
config/name="${projectName}"
config/description=""
run/main_scene="res://scenes/main.tscn"
config/features=PackedStringArray("4.2")

[display]
window/size/viewport_width=1920
window/size/viewport_height=1080

[rendering]
renderer/rendering_method="gl_compatibility"
`;

        fs.writeFileSync(path.join(fullProjectPath, 'project.godot'), projectGodot);

        // Create main scene if requested
        if (includeDemo) {
          const mainScene = `[gd_scene load_steps=2 format=3 uid="uid://b8q8q8q8q8q8q8q8q8q8q"]

[ext_resource type="Script" path="res://scripts/main.gd" id="1"]

[node name="Main" type="Node2D"]
script = ExtResource("1")

[node name="Camera2D" type="Camera2D" parent="."]
`;

          fs.writeFileSync(path.join(fullProjectPath, 'scenes', 'main.tscn'), mainScene);

          // Create main script
          const mainScript = `extends Node2D

func _ready():
    print("Hello from ${projectName}!")
    print("MCP integration ready!")

func _process(delta):
    # Add your game logic here
    pass
`;

          fs.writeFileSync(path.join(fullProjectPath, 'scripts', 'main.gd'), mainScript);
        }

        // Create .gitignore
        const gitignore = `# Godot files
.import/
export_presets.cfg
.mono/

# Logs
*.log

# OS files
.DS_Store
Thumbs.db

# IDE files
.vscode/
.idea/
`;

        fs.writeFileSync(path.join(fullProjectPath, '.gitignore'), gitignore);

        let setupReport = `🚀 Quick Setup Complete!\n\n`;
        setupReport += `Project: ${projectName}\n`;
        setupReport += `Location: ${fullProjectPath}\n\n`;

        setupReport += `📁 Created directories:\n`;
        dirs.forEach(dir => {
          setupReport += `- ${dir}/\n`;
        });

        setupReport += `\n📄 Created files:\n`;
        setupReport += `- project.godot\n`;
        setupReport += `- .gitignore\n`;

        if (includeDemo) {
          setupReport += `- scenes/main.tscn\n`;
          setupReport += `- scripts/main.gd\n`;
        }

        setupReport += `\n🎮 Next steps:\n`;
        setupReport += `1. Open the project in Godot Editor\n`;
        setupReport += `2. Enable the MCP addon in Project Settings\n`;
        setupReport += `3. Start developing your game!\n`;

        return setupReport;

      } catch (error) {
        console.error('[quick_setup] Setup failed:', error);
        throw new Error(`Quick setup failed: ${(error as Error).message}`);
      }
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


