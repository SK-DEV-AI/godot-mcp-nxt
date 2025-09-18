import { getGodotConnection } from '../utils/godot_connection.js';
/**
 * Resource template for individual script content
 * URI pattern: godot/script/{script_path}
 */
export const scriptContentTemplate = {
    uriTemplate: 'godot/script/{script_path}',
    name: 'Godot Script Content',
    description: 'Source code content of a specific Godot script file',
    mimeType: 'text/plain',
    arguments: [
        {
            name: 'script_path',
            description: 'Path to the script file (e.g., "res://scripts/player.gd")',
        },
    ],
    async load(args) {
        const godot = getGodotConnection();
        try {
            // Call the Godot command to get script content
            const result = await godot.sendCommand('get_script', {
                script_path: args.script_path
            });
            return {
                text: result.content,
                metadata: {
                    path: result.script_path,
                    language: args.script_path.endsWith('.gd') ? 'gdscript' :
                        args.script_path.endsWith('.cs') ? 'csharp' : 'unknown'
                }
            };
        }
        catch (error) {
            console.error('Error fetching script content:', error);
            throw error;
        }
    }
};
/**
 * Resource that provides the content of the currently edited script
 */
export const currentScriptContentResource = {
    uri: 'godot/script/current',
    name: 'Godot Current Script Content',
    mimeType: 'text/plain',
    async load() {
        const godot = getGodotConnection();
        try {
            const result = await godot.sendCommand('get_current_script', {});
            if (result.script_found) {
                return {
                    text: result.content,
                    metadata: {
                        path: result.script_path,
                        language: result.script_path.endsWith('.gd') ? 'gdscript' :
                            result.script_path.endsWith('.cs') ? 'csharp' : 'unknown'
                    }
                };
            }
            else {
                return {
                    text: 'No script is currently being edited',
                    metadata: {
                        script_found: false
                    }
                };
            }
        }
        catch (error) {
            console.error('Error fetching current script content:', error);
            throw error;
        }
    }
};
/**
 * Resource that provides a list of all scripts in the project
 */
export const scriptListResource = {
    uri: 'godot/scripts',
    name: 'Godot Script List',
    mimeType: 'application/json',
    async load() {
        const godot = getGodotConnection();
        try {
            // Call a command on the Godot side to list all scripts
            const result = await godot.sendCommand('list_project_files', {
                extensions: ['.gd', '.cs']
            });
            if (result && result.files) {
                return {
                    text: JSON.stringify({
                        scripts: result.files,
                        count: result.files.length,
                        gdscripts: result.files.filter((f) => f.endsWith('.gd')),
                        csharp_scripts: result.files.filter((f) => f.endsWith('.cs'))
                    })
                };
            }
            else {
                return {
                    text: JSON.stringify({
                        scripts: [],
                        count: 0,
                        gdscripts: [],
                        csharp_scripts: []
                    })
                };
            }
        }
        catch (error) {
            console.error('Error fetching script list:', error);
            throw error;
        }
    }
};
/**
 * Resource that provides metadata for a specific script, including classes and methods
 */
export const scriptMetadataResource = {
    uri: 'godot/script/metadata',
    name: 'Godot Script Metadata',
    mimeType: 'application/json',
    async load() {
        const godot = getGodotConnection();
        // Use a fixed script path
        let scriptPath = 'res://default_script.gd';
        try {
            // Call a command on the Godot side to get script metadata
            const result = await godot.sendCommand('get_script_metadata', {
                path: scriptPath
            });
            return {
                text: JSON.stringify(result)
            };
        }
        catch (error) {
            console.error('Error fetching script metadata:', error);
            throw error;
        }
    }
};
//# sourceMappingURL=script_resources.js.map