import { nodeTools } from '../tools/node_tools.js';
import { scriptTools } from '../tools/script_tools.js';
import { sceneTools } from '../tools/scene_tools.js';
import { editorTools } from '../tools/editor_tools.js';
import { cliTools } from '../tools/cli_tools.js';
import { codeAnalysisTools } from '../tools/code_analysis_tools.js';
import { performanceTools } from '../tools/performance_tools.js';
import { advancedTools } from '../tools/advanced_tools.js';

/**
 * Comprehensive test suite for the Godot MCP server
 * Tests all consolidated and advanced tools
 */

class GodotMCPTestSuite {
  private testResults: { [key: string]: boolean } = {};
  private testLogs: string[] = [];

  log(message: string) {
    console.log(`[TEST] ${message}`);
    this.testLogs.push(message);
  }

  async runTest(testName: string, testFn: () => Promise<void>) {
    try {
      this.log(`Running ${testName}...`);
      await testFn();
      this.testResults[testName] = true;
      this.log(`✅ ${testName} PASSED`);
    } catch (error) {
      this.testResults[testName] = false;
      this.log(`❌ ${testName} FAILED: ${(error as Error).message}`);
    }
  }

  async testNodeManager() {
    await this.runTest('Node Manager - Create Node', async () => {
      // Test node creation
      const createTool = nodeTools.find(t => t.name === 'node_manager');
      if (!createTool) throw new Error('node_manager tool not found');

      // This would normally connect to Godot, but we'll test the interface
      const result = await createTool.execute({
        operation: 'create',
        node_path: '/root/TestNode',
        node_type: 'Node2D',
        node_name: 'TestNode'
      });

      if (!result.includes('Created node')) {
        throw new Error('Node creation failed');
      }
    });

    await this.runTest('Node Manager - Batch Operations', async () => {
      const batchTool = advancedTools.find(t => t.name === 'batch_operations');
      if (!batchTool) throw new Error('batch_operations tool not found');

      const result = await batchTool.execute({
        operations: [
          {
            tool: 'create_node',
            parameters: { node_path: '/root/BatchTest', node_type: 'Sprite2D' }
          }
        ],
        rollbackOnError: true
      });

      if (!result.includes('Batch operations completed')) {
        throw new Error('Batch operations failed');
      }
    });
  }

  async testScriptManager() {
    await this.runTest('Script Manager - Generate Complete Script', async () => {
      const scriptTool = advancedTools.find(t => t.name === 'generate_complete_scripts');
      if (!scriptTool) throw new Error('generate_complete_scripts tool not found');

      const result = await scriptTool.execute({
        description: 'Create a simple player controller with movement',
        scriptType: 'character',
        complexity: 'simple',
        features: ['movement']
      });

      if (!result.includes('Generated')) {
        throw new Error('Script generation failed');
      }
    });

    await this.runTest('Script Manager - Refactor Code', async () => {
      const refactorTool = advancedTools.find(t => t.name === 'refactor_existing_code');
      if (!refactorTool) throw new Error('refactor_existing_code tool not found');

      const result = await refactorTool.execute({
        scriptPath: 'res://test_script.gd',
        refactoringType: 'extract_method',
        parameters: { method_name: 'extracted_function' }
      });

      if (!result.includes('Refactored')) {
        throw new Error('Code refactoring failed');
      }
    });
  }

  async testSceneManager() {
    await this.runTest('Scene Manager - Create Scene', async () => {
      const sceneTool = sceneTools.find(t => t.name === 'scene_manager');
      if (!sceneTool) throw new Error('scene_manager tool not found');

      const result = await sceneTool.execute({
        operation: 'create_scene',
        path: 'res://test_scene.tscn',
        root_node_type: 'Node2D'
      });

      if (!result.includes('Created scene')) {
        throw new Error('Scene creation failed');
      }
    });
  }

  async testAdvancedTools() {
    await this.runTest('Character System Creation', async () => {
      const charTool = advancedTools.find(t => t.name === 'create_character_system');
      if (!charTool) throw new Error('create_character_system tool not found');

      const result = await charTool.execute({
        characterType: 'player',
        movementType: 'platformer',
        features: ['health', 'movement']
      });

      if (!result.includes('Created')) {
        throw new Error('Character system creation failed');
      }
    });

    await this.runTest('Level Generation', async () => {
      const levelTool = advancedTools.find(t => t.name === 'generate_level');
      if (!levelTool) throw new Error('generate_level tool not found');

      const result = await levelTool.execute({
        levelType: 'platformer',
        difficulty: 'easy',
        theme: 'forest',
        dimensions: { width: 20, height: 15 },
        features: ['enemies']
      });

      if (!result.includes('Generated')) {
        throw new Error('Level generation failed');
      }
    });

    await this.runTest('Project Template Application', async () => {
      const templateTool = advancedTools.find(t => t.name === 'apply_project_template');
      if (!templateTool) throw new Error('apply_project_template tool not found');

      const result = await templateTool.execute({
        templateType: '2d_platformer',
        projectName: 'TestPlatformer',
        features: ['player_controller']
      });

      if (!result.includes('Applied')) {
        throw new Error('Template application failed');
      }
    });

    await this.runTest('Game Development Workflow', async () => {
      const workflowTool = advancedTools.find(t => t.name === 'game_development_workflow');
      if (!workflowTool) throw new Error('game_development_workflow tool not found');

      const result = await workflowTool.execute({
        gameConcept: 'Simple 2D platformer game',
        targetPlatform: 'desktop',
        gameType: 'action',
        scope: 'prototype',
        features: ['player_movement', 'enemies']
      });

      if (!result.includes('Workflow Initiated')) {
        throw new Error('Workflow orchestration failed');
      }
    });
  }

  async testErrorHandling() {
    await this.runTest('Error Handling - Invalid Parameters', async () => {
      const scriptTool = advancedTools.find(t => t.name === 'generate_complete_scripts');
      if (!scriptTool) throw new Error('generate_complete_scripts tool not found');

      try {
        await scriptTool.execute({
          description: '', // Invalid: empty description
          scriptType: 'character'
        });
        throw new Error('Should have thrown validation error');
      } catch (error) {
        const errorMsg = (error as Error).message;
        if (!errorMsg.includes('must be at least 10 characters')) {
          throw new Error('Expected validation error message');
        }
      }
    });
  }

  async testPerformanceTools() {
    await this.runTest('Performance Analysis', async () => {
      const perfTool = performanceTools.find(t => t.name === 'analyze_scene_performance');
      if (!perfTool) throw new Error('analyze_scene_performance tool not found');

      const result = await perfTool.execute({
        scene_path: 'res://test_scene.tscn'
      });

      if (!result.includes('Performance analysis')) {
        throw new Error('Performance analysis failed');
      }
    });
  }

  async testAssetOptimization() {
    await this.runTest('Texture Atlas Optimization', async () => {
      const textureTool = advancedTools.find(t => t.name === 'optimize_texture_atlas');
      if (!textureTool) throw new Error('optimize_texture_atlas tool not found');

      const result = await textureTool.execute({
        projectPath: 'res://',
        maxTextureSize: 2048,
        compression: 'auto',
        preview: true
      });

      if (!result.includes('PREVIEW MODE')) {
        throw new Error('Texture optimization preview failed');
      }
    });

    await this.runTest('Audio Asset Management', async () => {
      const audioTool = advancedTools.find(t => t.name === 'manage_audio_assets');
      if (!audioTool) throw new Error('manage_audio_assets tool not found');

      const result = await audioTool.execute({
        operation: 'analyze',
        audioFiles: ['res://audio/test.wav']
      });

      if (!result.includes('Audio analyze completed')) {
        throw new Error('Audio analysis failed');
      }
    });
  }

  async testProjectValidation() {
    await this.runTest('Project Structure Validation', async () => {
      const validationTool = advancedTools.find(t => t.name === 'validate_project_structure');
      if (!validationTool) throw new Error('validate_project_structure tool not found');

      const result = await validationTool.execute({
        checkScripts: true,
        checkScenes: true,
        fixIssues: false
      });

      if (!result.includes('Project Structure Validation')) {
        throw new Error('Project validation failed');
      }
    });
  }

  async runAllTests() {
    this.log('🚀 Starting Godot MCP Server Comprehensive Test Suite');
    this.log('==================================================');

    // Test consolidated tools
    await this.testNodeManager();
    await this.testScriptManager();
    await this.testSceneManager();

    // Test advanced game development tools
    await this.testAdvancedTools();

    // Test error handling
    await this.testErrorHandling();

    // Test performance and optimization tools
    await this.testPerformanceTools();
    await this.testAssetOptimization();

    // Test project management
    await this.testProjectValidation();

    // Generate test report
    this.generateTestReport();
  }

  generateTestReport() {
    const totalTests = Object.keys(this.testResults).length;
    const passedTests = Object.values(this.testResults).filter(result => result).length;
    const failedTests = totalTests - passedTests;

    this.log('\n==================================================');
    this.log('📊 TEST RESULTS SUMMARY');
    this.log('==================================================');
    this.log(`Total Tests: ${totalTests}`);
    this.log(`✅ Passed: ${passedTests}`);
    this.log(`❌ Failed: ${failedTests}`);
    this.log(`📈 Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

    if (failedTests > 0) {
      this.log('\n❌ Failed Tests:');
      Object.entries(this.testResults)
        .filter(([_, result]) => !result)
        .forEach(([testName, _]) => {
          this.log(`  - ${testName}`);
        });
    }

    this.log('\n📋 Test Logs:');
    this.testLogs.forEach(log => {
      console.log(log);
    });

    if (passedTests === totalTests) {
      this.log('\n🎉 ALL TESTS PASSED! Godot MCP Server is fully functional.');
    } else {
      this.log('\n⚠️  Some tests failed. Please review the implementation.');
    }
  }
}

// Export for use in test runner
export { GodotMCPTestSuite };

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const testSuite = new GodotMCPTestSuite();
  testSuite.runAllTests().catch(error => {
    console.error('Test suite failed:', error);
    process.exit(1);
  });
}