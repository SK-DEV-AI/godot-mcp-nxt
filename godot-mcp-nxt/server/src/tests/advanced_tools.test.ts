/** @jest-environment node */
import { advancedTools } from '../tools/advanced_tools.js';
import { getGodotConnection } from '../utils/godot_connection.js';

// Mock the Godot connection
jest.mock('../utils/godot_connection.js');
const mockGetGodotConnection = getGodotConnection as jest.MockedFunction<typeof getGodotConnection>;

describe('Advanced Tools Tests', () => {
  let mockGodotConnection: any;

  beforeEach(() => {
    mockGodotConnection = {
      sendCommand: jest.fn()
    };
    mockGetGodotConnection.mockReturnValue(mockGodotConnection);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generate_complete_scripts', () => {
    it('should generate a script from natural language description', async () => {
      const mockResult = {
        scriptType: 'character',
        scriptName: 'PlayerController',
        scriptPath: 'res://scripts/player_controller.gd',
        complexity: 'medium',
        features: ['movement', 'jumping'],
        code: 'extends CharacterBody2D\n\nfunc _physics_process(delta):\n    # Movement logic',
        explanation: 'Generated a basic character controller with movement and jumping',
        suggestions: ['Add collision detection', 'Implement animation states']
      };

      mockGodotConnection.sendCommand.mockResolvedValue(mockResult);

      const tool = advancedTools.find(t => t.name === 'generate_complete_scripts');
      expect(tool).toBeDefined();

      const result = await tool!.execute({
        description: 'Create a player controller with movement and jumping',
        scriptType: 'character',
        complexity: 'medium',
        features: ['movement', 'jumping']
      });

      expect(mockGodotConnection.sendCommand).toHaveBeenCalledWith('generate_complete_scripts', {
        description: 'Create a player controller with movement and jumping',
        scriptType: 'character',
        complexity: 'medium',
        features: ['movement', 'jumping'],
        targetScene: undefined
      });

      expect(result).toContain('Generated character script: PlayerController');
      expect(result).toContain('Path: res://scripts/player_controller.gd');
      expect(result).toContain('Generated Code:');
    });

    it('should validate description length', async () => {
      const tool = advancedTools.find(t => t.name === 'generate_complete_scripts');
      expect(tool).toBeDefined();

      await expect(tool!.execute({
        description: 'short'
      })).rejects.toThrow('Script description must be at least 10 characters long');
    });

    it('should handle errors with recovery suggestions', async () => {
      mockGodotConnection.sendCommand.mockRejectedValue(new Error('Connection failed'));

      const tool = advancedTools.find(t => t.name === 'generate_complete_scripts');
      expect(tool).toBeDefined();

      await expect(tool!.execute({
        description: 'Create a player controller with movement and jumping mechanics'
      })).rejects.toThrow('Troubleshooting suggestions:');
    });
  });

  describe('refactor_existing_code', () => {
    it('should refactor code using specified pattern', async () => {
      const mockResult = {
        changes: [
          { description: 'Converted to state machine pattern' },
          { description: 'Extracted movement logic to separate function' }
        ],
        refactoredCode: 'extends Node\n\n# Refactored code with state machine',
        benefits: ['Better maintainability', 'Easier to extend']
      };

      mockGodotConnection.sendCommand.mockResolvedValue(mockResult);

      const tool = advancedTools.find(t => t.name === 'refactor_existing_code');
      expect(tool).toBeDefined();

      const result = await tool!.execute({
        scriptPath: 'res://scripts/player.gd',
        refactoringType: 'state_machine',
        parameters: { states: ['idle', 'moving', 'jumping'] }
      });

      expect(result).toContain('Refactored res://scripts/player.gd using state_machine');
      expect(result).toContain('Changes made:');
      expect(result).toContain('Benefits:');
    });
  });

  describe('optimize_texture_atlas', () => {
    it('should optimize textures and create atlas', async () => {
      const mockResult = {
        atlasesCreated: [
          { name: 'characters_atlas.png', textures: 5, size: 512 }
        ],
        texturesOptimized: [
          { name: 'player.png', originalSize: 256, optimizedSize: 128, savings: '50%' }
        ],
        totalSpaceSaved: 1024,
        performanceImprovement: '30%'
      };

      mockGodotConnection.sendCommand.mockResolvedValue(mockResult);

      const tool = advancedTools.find(t => t.name === 'optimize_texture_atlas');
      expect(tool).toBeDefined();

      const result = await tool!.execute({
        projectPath: '/path/to/project',
        maxTextureSize: 2048,
        compression: 'auto',
        createAtlas: true,
        preview: false
      });

      expect(result).toContain('Texture optimization completed');
      expect(result).toContain('Atlases created:');
      expect(result).toContain('Textures optimized:');
      expect(result).toContain('Total space saved: 1024 KB');
    });

    it('should work in preview mode', async () => {
      const mockResult = {
        atlasesCreated: [],
        texturesOptimized: [],
        totalSpaceSaved: 0,
        performanceImprovement: '0%'
      };

      mockGodotConnection.sendCommand.mockResolvedValue(mockResult);

      const tool = advancedTools.find(t => t.name === 'optimize_texture_atlas');
      expect(tool).toBeDefined();

      const result = await tool!.execute({
        projectPath: '/path/to/project',
        preview: true
      });

      expect(result).toContain('PREVIEW MODE - No changes applied');
    });
  });

  describe('manage_audio_assets', () => {
    it('should analyze audio files', async () => {
      const mockResult = {
        analysis: {
          totalFiles: 10,
          totalSize: 50,
          formats: ['ogg', 'mp3'],
          qualityIssues: []
        }
      };

      mockGodotConnection.sendCommand.mockResolvedValue(mockResult);

      const tool = advancedTools.find(t => t.name === 'manage_audio_assets');
      expect(tool).toBeDefined();

      const result = await tool!.execute({
        operation: 'analyze'
      });

      expect(result).toContain('Audio analyze completed');
      expect(result).toContain('Analysis Results:');
      expect(result).toContain('Total files: 10');
    });

    it('should optimize audio files', async () => {
      const mockResult = {
        optimizations: [
          { file: 'background_music.mp3', originalSize: 5000, optimizedSize: 3000, savings: '40%' }
        ],
        totalSpaceSaved: 2000
      };

      mockGodotConnection.sendCommand.mockResolvedValue(mockResult);

      const tool = advancedTools.find(t => t.name === 'manage_audio_assets');
      expect(tool).toBeDefined();

      const result = await tool!.execute({
        operation: 'optimize',
        audioFiles: ['background_music.mp3']
      });

      expect(result).toContain('Audio optimize completed');
      expect(result).toContain('Optimizations Applied:');
      expect(result).toContain('Total space saved: 2000 MB');
    });
  });

  describe('apply_project_template', () => {
    it('should apply project template', async () => {
      const mockResult = {
        filesCreated: ['res://scenes/main.tscn', 'res://scripts/player.gd'],
        foldersCreated: ['res://assets', 'res://scripts'],
        scenesCreated: ['res://scenes/main.tscn'],
        scriptsCreated: ['res://scripts/player.gd'],
        nextSteps: ['Add your game assets', 'Configure input settings']
      };

      mockGodotConnection.sendCommand.mockResolvedValue(mockResult);

      const tool = advancedTools.find(t => t.name === 'apply_project_template');
      expect(tool).toBeDefined();

      const result = await tool!.execute({
        templateType: '2d_platformer',
        projectName: 'MyPlatformer',
        features: ['player_movement', 'enemies'],
        structure: 'standard'
      });

      expect(result).toContain('Applied 2d_platformer template to project "MyPlatformer"');
      expect(result).toContain('Files created:');
      expect(result).toContain('Next steps:');
    });
  });

  describe('automated_optimization', () => {
    it('should run automated optimizations', async () => {
      const mockResult = {
        performanceOptimization: {
          changes: ['Reduced draw calls by 40%', 'Optimized texture usage'],
          improvement: '35% better performance'
        },
        memoryOptimization: {
          changes: ['Implemented object pooling', 'Reduced texture memory'],
          improvement: '25% less memory usage'
        },
        overallImprovement: '45% overall improvement'
      };

      mockGodotConnection.sendCommand.mockResolvedValue(mockResult);

      const tool = advancedTools.find(t => t.name === 'automated_optimization');
      expect(tool).toBeDefined();

      const result = await tool!.execute({
        projectPath: '/path/to/project',
        optimizationTypes: ['performance', 'memory'],
        aggressive: false,
        preview: false
      });

      expect(result).toContain('Automated optimization completed');
      expect(result).toContain('PERFORMANCE Optimization:');
      expect(result).toContain('MEMORY Optimization:');
      expect(result).toContain('Overall improvement: 45% overall improvement');
    });
  });

  describe('create_character_system', () => {
    it('should create a complete character system', async () => {
      const mockResult = {
        scriptPath: 'res://scripts/player_controller.gd',
        scenePath: 'res://scenes/player.tscn',
        additionalScripts: ['res://scripts/player_health.gd'],
        controls: ['WASD: Movement', 'SPACE: Jump', 'SHIFT: Sprint']
      };

      mockGodotConnection.sendCommand.mockResolvedValue(mockResult);

      const tool = advancedTools.find(t => t.name === 'create_character_system');
      expect(tool).toBeDefined();

      const result = await tool!.execute({
        characterType: 'player',
        movementType: 'platformer',
        features: ['health', 'inventory'],
        createScene: true
      });

      expect(result).toContain('Created player character system (platformer)');
      expect(result).toContain('Main script: res://scripts/player_controller.gd');
      expect(result).toContain('Demo scene: res://scenes/player.tscn');
      expect(result).toContain('Features included: health, inventory');
      expect(result).toContain('Controls:');
    });
  });

  describe('generate_level', () => {
    it('should generate a procedural level', async () => {
      const mockResult = {
        scenePath: 'res://scenes/generated_level.tscn',
        dimensions: { width: 50, height: 30 },
        elements: [
          { type: 'platforms', count: 25, description: 'Various sized platforms' },
          { type: 'enemies', count: 8, description: 'Patrolling enemies' },
          { type: 'collectibles', count: 15, description: 'Coins and power-ups' }
        ],
        objectives: ['Collect all coins', 'Defeat enemies', 'Reach the exit'],
        difficultySettings: {
          enemySpeed: 'medium',
          platformGaps: 'moderate',
          timeLimit: '5 minutes'
        }
      };

      mockGodotConnection.sendCommand.mockResolvedValue(mockResult);

      const tool = advancedTools.find(t => t.name === 'generate_level');
      expect(tool).toBeDefined();

      const result = await tool!.execute({
        levelType: 'platformer',
        difficulty: 'medium',
        theme: 'forest',
        dimensions: { width: 50, height: 30 },
        features: ['enemies', 'collectibles']
      });

      expect(result).toContain('Generated platformer level (medium difficulty, forest theme)');
      expect(result).toContain('Level scene: res://scenes/generated_level.tscn');
      expect(result).toContain('Dimensions: 50 x 30');
      expect(result).toContain('Level elements:');
      expect(result).toContain('Objectives:');
    });
  });

  describe('apply_smart_suggestion', () => {
    it('should apply smart suggestions', async () => {
      const mockResult = {
        analysis: 'Found 3 performance bottlenecks in the scene',
        suggestions: [
          { description: 'Use texture atlas for sprites', confidence: 95 },
          { description: 'Implement object pooling for enemies', confidence: 87 },
          { description: 'Reduce physics calculations', confidence: 76 }
        ],
        applied: ['Use texture atlas for sprites'],
        benefits: ['Reduced draw calls by 40%', 'Improved frame rate']
      };

      mockGodotConnection.sendCommand.mockResolvedValue(mockResult);

      const tool = advancedTools.find(t => t.name === 'apply_smart_suggestion');
      expect(tool).toBeDefined();

      const result = await tool!.execute({
        suggestionType: 'performance',
        target: 'res://scenes/main.tscn',
        autoApply: true
      });

      expect(result).toContain('Smart suggestion for performance on res://scenes/main.tscn');
      expect(result).toContain('Analysis: Found 3 performance bottlenecks in the scene');
      expect(result).toContain('Suggestions found:');
      expect(result).toContain('Changes applied:');
      expect(result).toContain('Expected benefits:');
    });

    it('should work in preview mode', async () => {
      const mockResult = {
        analysis: 'Scene structure analysis complete',
        suggestions: [
          { description: 'Reorganize node hierarchy', confidence: 82 }
        ],
        preview: ['Move UI elements to separate canvas layer']
      };

      mockGodotConnection.sendCommand.mockResolvedValue(mockResult);

      const tool = advancedTools.find(t => t.name === 'apply_smart_suggestion');
      expect(tool).toBeDefined();

      const result = await tool!.execute({
        suggestionType: 'architecture',
        target: 'res://scenes/main.tscn',
        autoApply: false
      });

      expect(result).toContain('Preview of changes:');
      expect(result).toContain('Run with autoApply=true to apply these changes');
    });
  });

  describe('Error Handling', () => {
    it('should handle connection errors gracefully', async () => {
      mockGodotConnection.sendCommand.mockRejectedValue(new Error('Connection timeout'));

      const tool = advancedTools.find(t => t.name === 'generate_complete_scripts');
      expect(tool).toBeDefined();

      await expect(tool!.execute({
        description: 'Create a simple script'
      })).rejects.toThrow('Connection timeout');
    });

    it('should validate input parameters', async () => {
      const tool = advancedTools.find(t => t.name === 'generate_complete_scripts');
      expect(tool).toBeDefined();

      await expect(tool!.execute({
        description: '' // Invalid empty description
      })).rejects.toThrow('Script description must be at least 10 characters long');
    });
  });
});