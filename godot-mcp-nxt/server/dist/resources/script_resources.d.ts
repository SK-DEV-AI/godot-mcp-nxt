import { Resource, ResourceTemplate } from 'fastmcp';
/**
 * Resource template for individual script content
 * URI pattern: godot/script/{script_path}
 */
export declare const scriptContentTemplate: ResourceTemplate;
/**
 * Resource that provides the content of the currently edited script
 */
export declare const currentScriptContentResource: Resource;
/**
 * Resource that provides a list of all scripts in the project
 */
export declare const scriptListResource: Resource;
/**
 * Resource that provides metadata for a specific script, including classes and methods
 */
export declare const scriptMetadataResource: Resource;
