import { getGodotConnection } from '../utils/godot_connection.js';
/**
 * Resource that provides information about the Godot project structure
 */
export const projectStructureResource = {
    uri: 'godot/project/structure',
    name: 'Godot Project Structure',
    mimeType: 'application/json',
    async load() {
        const godot = getGodotConnection();
        try {
            // Call a command on the Godot side to get project structure
            const result = await godot.sendCommand('get_project_structure');
            return {
                text: JSON.stringify(result)
            };
        }
        catch (error) {
            console.error('Error fetching project structure:', error);
            throw error;
        }
    }
};
/**
 * Resource that provides project settings
 */
export const projectSettingsResource = {
    uri: 'godot/project/settings',
    name: 'Godot Project Settings',
    mimeType: 'application/json',
    async load() {
        const godot = getGodotConnection();
        try {
            // Call a command on the Godot side to get project settings
            const result = await godot.sendCommand('get_project_settings');
            return {
                text: JSON.stringify(result)
            };
        }
        catch (error) {
            console.error('Error fetching project settings:', error);
            throw error;
        }
    }
};
/**
 * Resource that provides a list of all project resources
 */
export const projectResourcesResource = {
    uri: 'godot/project/resources',
    name: 'Godot Project Resources',
    mimeType: 'application/json',
    async load() {
        const godot = getGodotConnection();
        try {
            // Call a command on the Godot side to get a list of all resources
            const result = await godot.sendCommand('list_project_resources');
            return {
                text: JSON.stringify(result)
            };
        }
        catch (error) {
            console.error('Error fetching project resources:', error);
            throw error;
        }
    }
};
/**
 * Resource template for project file listings by type
 * URI pattern: godot/project/files/{type}
 * Supported types: scenes, scripts, textures, audio, models, resources, all
 */
export const projectFilesByTypeTemplate = {
    uriTemplate: 'godot/project/files/{type}',
    name: 'Godot Project Files by Type',
    description: 'List of project files filtered by type (scenes, scripts, textures, audio, models, resources, all)',
    mimeType: 'application/json',
    arguments: [
        {
            name: 'type',
            description: 'Type of files to list: scenes, scripts, textures, audio, models, resources, or all',
        },
    ],
    async load(args) {
        const godot = getGodotConnection();
        try {
            // Get all project resources
            const result = await godot.sendCommand('list_project_resources');
            if (!result) {
                return {
                    text: JSON.stringify({ files: [], count: 0, type: args.type })
                };
            }
            let files = [];
            const type = args.type.toLowerCase();
            // Filter by type
            switch (type) {
                case 'scenes':
                    files = result.scenes || [];
                    break;
                case 'scripts':
                    files = result.scripts || [];
                    break;
                case 'textures':
                    files = result.textures || [];
                    break;
                case 'audio':
                    files = result.audio || [];
                    break;
                case 'models':
                    files = result.models || [];
                    break;
                case 'resources':
                    files = result.resources || [];
                    break;
                case 'all':
                    // Combine all file types
                    files = [
                        ...(result.scenes || []),
                        ...(result.scripts || []),
                        ...(result.textures || []),
                        ...(result.audio || []),
                        ...(result.models || []),
                        ...(result.resources || [])
                    ];
                    break;
                default:
                    throw new Error(`Unsupported file type: ${type}. Supported types: scenes, scripts, textures, audio, models, resources, all`);
            }
            return {
                text: JSON.stringify({
                    files: files,
                    count: files.length,
                    type: args.type,
                    description: `Project files of type: ${args.type}`
                }, null, 2)
            };
        }
        catch (error) {
            console.error('Error fetching project files by type:', error);
            throw error;
        }
    }
};
//# sourceMappingURL=project_resources.js.map