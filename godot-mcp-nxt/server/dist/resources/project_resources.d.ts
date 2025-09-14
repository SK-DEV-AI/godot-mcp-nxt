import { Resource, ResourceTemplate } from 'fastmcp';
/**
 * Resource that provides information about the Godot project structure
 */
export declare const projectStructureResource: Resource;
/**
 * Resource that provides project settings
 */
export declare const projectSettingsResource: Resource;
/**
 * Resource that provides a list of all project resources
 */
export declare const projectResourcesResource: Resource;
/**
 * Resource template for project file listings by type
 * URI pattern: godot/project/files/{type}
 * Supported types: scenes, scripts, textures, audio, models, resources, all
 */
export declare const projectFilesByTypeTemplate: ResourceTemplate;
