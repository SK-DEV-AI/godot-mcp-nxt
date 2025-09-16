import { FastMCP } from 'fastmcp';
import { nodeTools } from './tools/node_tools.js';
import { scriptTools } from './tools/script_tools.js';
import { sceneTools } from './tools/scene_tools.js';
import { editorTools } from './tools/editor_tools.js';
import { cliTools } from './tools/cli_tools.js';
import { codeAnalysisTools } from './tools/code_analysis_tools.js';
import { performanceTools } from './tools/performance_tools.js';
import { advancedTools } from './tools/advanced_tools.js';
import { getGodotConnection } from './utils/godot_connection.js';
import { setupCacheCleanup } from './utils/cache.js';

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

  // Register all tools with improved organization
  const allTools = [
    ...nodeTools,
    ...scriptTools,
    ...sceneTools,
    ...editorTools,
    ...cliTools,
    ...codeAnalysisTools,
    ...performanceTools,
    ...advancedTools
  ];

  console.error(`Registering ${allTools.length} tools...`);

  allTools.forEach((tool, index) => {
    try {
      server.addTool(tool);
      if (index % 10 === 0) { // Log progress every 10 tools
        console.error(`Registered ${index + 1}/${allTools.length} tools...`);
      }
    } catch (error) {
      console.error(`Failed to register tool ${tool.name}:`, error);
    }
  });

  console.error(`Successfully registered ${allTools.length} tools`);

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
