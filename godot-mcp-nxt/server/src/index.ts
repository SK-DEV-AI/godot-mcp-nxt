import { FastMCP } from 'fastmcp';
import { nodeTools } from './tools/node_tools.js';
import { scriptTools } from './tools/script_tools.js';
import { sceneTools } from './tools/scene_tools.js';
import { editorTools } from './tools/editor_tools.js';
import { cliTools } from './tools/cli_tools.js';
import { codeAnalysisTools } from './tools/code_analysis_tools.js';
import { performanceTools } from './tools/performance_tools.js';
import { errorRecoveryTools } from './tools/error_recovery_tools.js';
import { promptEnhancementTools } from './tools/prompt_enhancement_tools.js';
import { advancedTools } from './tools/advanced_tools.js';
import { screenshotTools } from './tools/screenshot_tools.js';
import { advancedEditorTools } from './tools/advanced_editor_tools.js';
import { getGodotConnection } from './utils/godot_connection.js';
import { setupCacheCleanup } from './utils/cache.js';
import { globalToolRegistry } from './utils/tool_registry.js';

// Import resources
import {
  sceneListResource,
  sceneStructureTemplate,
  currentSceneStructureResource
} from './resources/scene_resources.js';
import {
  scriptContentTemplate,
  currentScriptContentResource,
  scriptListResource,
  scriptMetadataResource
} from './resources/script_resources.js';
import {
  projectStructureResource,
  projectSettingsResource,
  projectResourcesResource,
  projectFilesByTypeTemplate
} from './resources/project_resources.js';
import { 
  editorStateResource,
  selectedNodeResource,
  currentScriptResource 
} from './resources/editor_resources.js';

/**
 * Main entry point for the Godot MCP server
 */
async function main() {
  console.error('Starting Godot MCP server...');

  // Create FastMCP instance
  const server = new FastMCP({
    name: 'GodotMCP',
    version: '1.0.0',
  });

  // Register all tools using centralized registry system
  console.error('Initializing tool registry...');

  // Register tools by category
  const toolCategories = [
    { name: 'node', tools: nodeTools },
    { name: 'script', tools: scriptTools },
    { name: 'scene', tools: sceneTools },
    { name: 'editor', tools: editorTools },
    { name: 'cli', tools: cliTools },
    { name: 'code_analysis', tools: codeAnalysisTools },
    { name: 'performance', tools: performanceTools },
    { name: 'error_recovery', tools: errorRecoveryTools },
    { name: 'prompt_enhancement', tools: promptEnhancementTools },
    { name: 'advanced', tools: advancedTools },
    { name: 'visual', tools: screenshotTools },
    { name: 'editor_advanced', tools: advancedEditorTools }
  ];

  let totalToolsRegistered = 0;

  for (const category of toolCategories) {
    for (const tool of category.tools) {
      try {
        globalToolRegistry.registerTool(tool, category.name);
        server.addTool(tool);
        totalToolsRegistered++;

        if (totalToolsRegistered % 10 === 0) {
          console.error(`Registered ${totalToolsRegistered} tools...`);
        }
      } catch (error) {
        console.error(`Failed to register tool ${tool.name}:`, error);
      }
    }
  }

  console.error(`Successfully registered ${totalToolsRegistered} tools in ${toolCategories.length} categories`);

  // Log registry statistics
  const stats = globalToolRegistry.getStatistics();
  console.error(`Registry Statistics: ${stats.totalTools} tools across ${stats.categories} categories`);

  // Register static resources
  const staticResources = [
    sceneListResource,
    currentSceneStructureResource,
    scriptListResource,
    currentScriptContentResource,
    projectStructureResource,
    projectSettingsResource,
    projectResourcesResource,
    editorStateResource,
    selectedNodeResource,
    currentScriptResource,
    scriptMetadataResource,
  ];

  staticResources.forEach(resource => {
    server.addResource(resource);
  });

  // Register resource templates
  const resourceTemplates = [
    sceneStructureTemplate,
    scriptContentTemplate,
    projectFilesByTypeTemplate,
  ];

  resourceTemplates.forEach(template => {
    server.addResourceTemplate(template);
  });

  // Note: WebSocket connection is lazy - only established when WebSocket tools are called

  // Set up cache cleanup
  setupCacheCleanup();

  // Start the server
  server.start({
    transportType: 'stdio',
  });

  console.error('Godot MCP server started');

  // Handle cleanup
  const cleanup = () => {
    console.error('Shutting down Godot MCP server...');
    const godot = getGodotConnection();
    godot.disconnect();
    process.exit(0);
  };

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
}

// Start the server
main().catch(error => {
  console.error('Failed to start Godot MCP server:', error);
  process.exit(1);
});
