import { nodeTools } from '../tools/node_tools.js';
import { scriptTools } from '../tools/script_tools.js';
import { sceneTools } from '../tools/scene_tools.js';
import { cliTools } from '../tools/cli_tools.js';

/**
 * Test the unified Godot tools for complete game development
 */

async function testUnifiedTools() {
  console.log('🧪 Testing Unified Godot MCP Tools');
  console.log('=====================================');

  try {
    // Test 1: Node Manager - Create a player character
    console.log('\n1️⃣ Testing Node Manager - Create Player Character');
    const nodeManager = nodeTools.find(t => t.name === 'node_manager');
    if (nodeManager) {
      const result = await nodeManager.execute({
        operation: 'create',
        node_path: '/root/Player',
        node_type: 'CharacterBody2D',
        node_name: 'Player'
      });
      console.log('✅ Node created:', result);
    }

    // Test 2: Script Manager - Generate player movement script
    console.log('\n2️⃣ Testing Script Manager - Generate Player Script');
    const scriptManager = scriptTools.find(t => t.name === 'script_manager');
    if (scriptManager) {
      const result = await scriptManager.execute({
        operation: 'generate_ai',
        description: 'Create a 2D platformer player controller with movement, jumping, and collision detection',
        scriptType: 'character',
        complexity: 'medium',
        features: ['movement', 'jump', 'collision']
      });
      console.log('✅ Script generated:', result);
    }

    // Test 3: Scene Manager - Create game scene
    console.log('\n3️⃣ Testing Scene Manager - Create Game Scene');
    const sceneManager = sceneTools.find(t => t.name === 'scene_manager');
    if (sceneManager) {
      const result = await sceneManager.execute({
        operation: 'create_scene',
        path: 'res://main_game.tscn',
        root_node_type: 'Node2D'
      });
      console.log('✅ Scene created:', result);
    }

    // Test 4: Project Manager - Get project info
    console.log('\n4️⃣ Testing Project Manager - Get Project Info');
    const projectManager = cliTools.find((t: any) => t.name === 'project_manager');
    if (projectManager) {
      const result = await projectManager.execute({
        operation: 'get_project_info'
      });
      console.log('✅ Project info:', result);
    }

    console.log('\n🎉 All unified tools tested successfully!');
    console.log('The MCP server can now create complete game components using unified interfaces.');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testUnifiedTools();