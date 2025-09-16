import { Resource, ResourceTemplate } from 'fastmcp';
/**
 * Resource that provides a list of all scenes in the project
 */
export declare const sceneListResource: Resource;
/**
 * Resource template for individual scene structures
 * URI pattern: godot/scene/{scene_path}
 */
export declare const sceneStructureTemplate: ResourceTemplate;
/**
 * Resource that provides detailed information about the currently edited scene
 */
export declare const currentSceneStructureResource: Resource;
