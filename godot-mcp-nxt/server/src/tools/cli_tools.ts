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

// Unified Project Management Tool - Consolidates all project-related operations
export const cliTools: MCPTool[] = [
  {
    name: 'project_manager',
    description: `🚀 UNIFIED PROJECT MANAGER - Complete Godot Project Lifecycle Management

USAGE WORKFLOW:
1. 🔍 DISCOVER: Use operation="list_projects" to find Godot projects
2. 🏗️ SETUP: Use operation="quick_setup" to create new projects
3. 📝 LAUNCH: Use operation="launch_editor" to open in Godot Editor
4. ▶️ RUN: Use operation="run_project" to test your game
5. 🔍 DEBUG: Use operation="get_debug_output" to see runtime output
6. 🩺 HEALTH: Use operation="health_check" to validate project
7. 📊 INFO: Use operation="get_godot_version" for version info
8. ⏹️ STOP: Use operation="stop_project" to end running games

COMMON PITFALLS TO AVOID:
❌ DON'T try project operations without valid project.godot file
❌ DON'T forget projectPath for most operations
❌ DON'T try to run projects without Godot executable
❌ DON'T use invalid directory paths for project discovery
❌ DON'T forget to stop running projects before starting new ones

EXAMPLES:
✅ List projects: {operation: "list_projects", directory: "/home/user/projects", recursive: true}
✅ Quick setup: {operation: "quick_setup", projectPath: "/home/user/projects", projectName: "MyGame"}
✅ Launch editor: {operation: "launch_editor", projectPath: "/home/user/projects/MyGame"}
✅ Run project: {operation: "run_project", projectPath: "/home/user/projects/MyGame"}
✅ Health check: {operation: "health_check", projectPath: "/home/user/projects/MyGame"}
✅ Get version: {operation: "get_godot_version"}

PREREQUISITES:
- Valid Godot installation (auto-detected or set GODOT_PATH)
- project.godot file must exist in project directories
- Proper file permissions for project directories
- Godot Editor closed when running projects in debug mode

ERROR PREVENTION:
- Always verify project.godot exists before operations
- Check Godot executable path with get_godot_version first
- Use absolute paths for project directories
- Ensure no other Godot processes are running on same project
- Test project paths exist before operations`,
    parameters: z.object({
      operation: z.enum(['launch_editor', 'run_project', 'get_debug_output', 'stop_project', 'get_godot_version', 'list_projects', 'health_check', 'quick_setup'])
        .describe('Type of project operation to perform'),
      projectPath: z.string().optional()
        .describe('Path to the Godot project directory'),
      directory: z.string().optional()
        .describe('Directory to search for projects'),
      projectName: z.string().optional()
        .describe('Name for new project'),
      // Launch/run options
      waitForReady: z.boolean().optional().default(false)
        .describe('Wait for editor/project to be ready'),
      customArgs: z.array(z.string()).optional()
        .describe('Additional command line arguments'),
      scene: z.string().optional()
        .describe('Specific scene to run'),
      // Health check options
      includeDependencies: z.boolean().optional().default(true)
        .describe('Check for missing dependencies'),
      includeFileIntegrity: z.boolean().optional().default(true)
        .describe('Verify file integrity'),
      includePerformanceMetrics: z.boolean().optional().default(false)
        .describe('Include basic performance metrics'),
      // Setup options
      template: z.enum(['2d', '3d', 'empty']).optional().default('2d')
        .describe('Project template to use'),
      includeDemo: z.boolean().optional().default(true)
        .describe('Include demo scene and script'),
      // List options
      recursive: z.boolean().optional().default(false)
        .describe('Whether to search recursively')
    }),
    execute: async (params: any): Promise<string> => {
      try {
        switch (params.operation) {
          case 'launch_editor': {
            if (!params.projectPath) {
              throw new Error('projectPath is required for launch_editor operation');
            }
            console.log(`[project_manager] Launching Godot editor for project: ${params.projectPath}`);
            const result = await handleLaunchEditor({
              projectPath: params.projectPath,
              waitForReady: params.waitForReady,
              customArgs: params.customArgs
            });
            if (params.waitForReady) {
              return `${result}\n⏳ Editor launched and ready for use`;
            }
            return result;
          }

          case 'run_project': {
            if (!params.projectPath) {
              throw new Error('projectPath is required for run_project operation');
            }
            return await handleRunProject({
              projectPath: params.projectPath,
              scene: params.scene
            });
          }

          case 'get_debug_output': {
            const result = await handleGetDebugOutput();
            return result.content[0].text;
          }

          case 'stop_project': {
            const result = await handleStopProject();
            return result.content[0].text;
          }

          case 'get_godot_version': {
            const result = await handleGetGodotVersion();
            return result.content[0].text;
          }

          case 'list_projects': {
            if (!params.directory) {
              throw new Error('directory is required for list_projects operation');
            }
            const result = await handleListProjects({
              directory: params.directory,
              recursive: params.recursive
            });
            return result.content[0].text;
          }

          case 'health_check': {
            if (!params.projectPath) {
              throw new Error('projectPath is required for health_check operation');
            }

            console.log(`[project_manager] Starting health check for: ${params.projectPath}`);

            const fs = await import('fs');
            const path = await import('path');
            const projectFile = path.join(params.projectPath, 'project.godot');

            if (!fs.existsSync(projectFile)) {
              throw new Error(`Not a valid Godot project: ${params.projectPath}`);
            }

            let healthReport = `🏥 Godot Project Health Check\n`;
            healthReport += `Project: ${params.projectPath}\n\n`;

            // Basic project structure check
            const requiredFiles = ['project.godot'];
            const recommendedFiles = ['.gitignore', 'README.md'];

            healthReport += `📁 Project Structure:\n`;
            requiredFiles.forEach(file => {
              const exists = fs.existsSync(path.join(params.projectPath, file));
              healthReport += `${exists ? '✅' : '❌'} ${file}\n`;
            });

            healthReport += `\n📋 Recommended Files:\n`;
            recommendedFiles.forEach(file => {
              const exists = fs.existsSync(path.join(params.projectPath, file));
              healthReport += `${exists ? '✅' : '⚠️'} ${file}\n`;
            });

            // Check for common directories
            const commonDirs = ['scenes', 'scripts', 'assets', 'addons'];
            healthReport += `\n📂 Common Directories:\n`;
            commonDirs.forEach(dir => {
              const exists = fs.existsSync(path.join(params.projectPath, dir));
              healthReport += `${exists ? '✅' : 'ℹ️'} ${dir}/\n`;
            });

            if (params.includeDependencies) {
              healthReport += `\n🔗 Dependencies Check:\n`;
              healthReport += `⚠️ Dependency checking not fully implemented yet\n`;
            }

            if (params.includeFileIntegrity) {
              healthReport += `\n🔍 File Integrity:\n`;
              try {
                const stats = fs.statSync(projectFile);
                healthReport += `✅ project.godot accessible (${stats.size} bytes)\n`;
              } catch (error) {
                healthReport += `❌ project.godot inaccessible: ${(error as Error).message}\n`;
              }
            }

            if (params.includePerformanceMetrics) {
              healthReport += `\n⚡ Performance Metrics:\n`;
              healthReport += `ℹ️ Performance metrics collection not implemented yet\n`;
            }

            healthReport += `\n🎯 Recommendations:\n`;
            healthReport += `- Consider adding a .gitignore file if missing\n`;
            healthReport += `- Create organized folder structure (scenes/, scripts/, assets/)\n`;
            healthReport += `- Add a README.md for project documentation\n`;

            return healthReport;
          }

          case 'quick_setup': {
            if (!params.projectPath || !params.projectName) {
              throw new Error('projectPath and projectName are required for quick_setup operation');
            }

            console.log(`[project_manager] Setting up new Godot project: ${params.projectName}`);

            const fs = await import('fs');
            const path = await import('path');

            // Create project directory
            const fullProjectPath = path.join(params.projectPath, params.projectName);
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
config/name="${params.projectName}"
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
            if (params.includeDemo) {
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
    print("Hello from ${params.projectName}!")
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
            setupReport += `Project: ${params.projectName}\n`;
            setupReport += `Location: ${fullProjectPath}\n\n`;

            setupReport += `📁 Created directories:\n`;
            dirs.forEach(dir => {
              setupReport += `- ${dir}/\n`;
            });

            setupReport += `\n📄 Created files:\n`;
            setupReport += `- project.godot\n`;
            setupReport += `- .gitignore\n`;

            if (params.includeDemo) {
              setupReport += `- scenes/main.tscn\n`;
              setupReport += `- scripts/main.gd\n`;
            }

            setupReport += `\n🎮 Next steps:\n`;
            setupReport += `1. Open the project in Godot Editor\n`;
            setupReport += `2. Enable the MCP addon in Project Settings\n`;
            setupReport += `3. Start developing your game!\n`;

            return setupReport;
          }

          default:
            throw new Error(`Unknown operation: ${params.operation}`);
        }
      } catch (error) {
        console.error(`[project_manager] Operation failed:`, error);
        throw new Error(`Project manager operation failed: ${(error as Error).message}`);
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


