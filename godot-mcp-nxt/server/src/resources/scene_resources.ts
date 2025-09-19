import { Resource, ResourceTemplate } from 'fastmcp';
import { getGodotConnection } from '../utils/godot_connection.js';
import { z } from 'zod';

/**
 * Resource that provides a list of all scenes in the project
 */
export const sceneListResource: Resource = {
  uri: 'godot/scenes',
  name: 'Godot Scene List',
  mimeType: 'application/json',
  async load() {
    const godot = await getGodotConnection();

    try {
      // Call a command on the Godot side to list all scenes
      const result = await godot.sendCommand('list_project_files', {
        extensions: ['.tscn', '.scn']
      });

      if (result && result.files) {
        return {
          text: JSON.stringify({
            scenes: result.files,
            count: result.files.length
          })
        };
      } else {
        return {
          text: JSON.stringify({
            scenes: [],
            count: 0
          })
        };
      }
    } catch (error) {
      console.error('Error fetching scene list:', error);
      throw error;
    }
  }
};

/**
 * Resource template for individual scene structures
 * URI pattern: godot/scene/{scene_path}
 */
export const sceneStructureTemplate: ResourceTemplate = {
  uriTemplate: 'godot/scene/{scene_path}',
  name: 'Godot Scene Structure',
  description: 'Detailed structure and hierarchy of a specific Godot scene',
  mimeType: 'application/json',
  arguments: [
    {
      name: 'scene_path',
      description: 'Path to the scene file (e.g., "res://scenes/main.tscn")',
    },
  ],
  async load(args) {
    const godot = await getGodotConnection();

    try {
      // Call the Godot command to get scene structure
      const result = await godot.sendCommand('get_scene_structure', {
        path: args.scene_path
      });

      return {
        text: JSON.stringify(result, null, 2)
      };
    } catch (error) {
      console.error('Error fetching scene structure:', error);
      throw error;
    }
  }
};

/**
 * Resource that provides detailed information about the currently edited scene
 */
export const currentSceneStructureResource: Resource = {
    uri: 'godot/scene/current',
    name: 'Godot Current Scene Structure',
    mimeType: 'application/json',
    async load() {
        const godot = await getGodotConnection();

        try {
            // Call a command on the Godot side to get current scene structure
            const result = await godot.sendCommand('get_current_scene', {});

            return {
                text: JSON.stringify(result)
            };
        } catch (error) {
            console.error('Error fetching current scene structure:', error);
            throw error;
        }
    }
};
