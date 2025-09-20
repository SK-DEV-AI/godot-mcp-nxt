import { z } from 'zod';
import { getGodotConnection } from '../utils/godot_connection.js';
/**
 * Screenshot tools for visual grounding capabilities
 */
export const screenshotTools = [
    {
        name: 'capture_editor_screenshot',
        description: 'Capture screenshot of Godot editor viewport for AI context and debugging',
        parameters: z.object({
            format: z.enum(['png', 'jpg']).default('png')
                .describe('Image format for the screenshot'),
            quality: z.number().min(1).max(100).default(90)
                .describe('Quality setting for JPEG format (1-100)'),
            include_metadata: z.boolean().default(true)
                .describe('Include metadata like dimensions, timestamp, and format info')
        }),
        execute: async ({ format = 'png', quality = 90, include_metadata = true }) => {
            const godot = await getGodotConnection();
            try {
                const result = await godot.sendCommand('capture_editor_screenshot', {
                    format,
                    quality,
                    include_metadata
                });
                if (!result || !result.image_data) {
                    throw new Error('Screenshot capture failed - no image data received');
                }
                // Image data is already base64 encoded from Godot
                const base64Data = result.image_data;
                let response = `Editor screenshot captured successfully\n\n`;
                response += `📷 **Screenshot Details:**\n`;
                response += `- Format: ${result.format || format}\n`;
                response += `- Dimensions: ${result.width || 'unknown'} × ${result.height || 'unknown'}\n`;
                response += `- Size: ${result.size_bytes ? Math.round(result.size_bytes / 1024) + ' KB' : 'unknown'}\n`;
                response += `- Quality: ${result.quality || quality}%\n`;
                response += `- Timestamp: ${result.timestamp ? new Date(result.timestamp * 1000).toISOString() : 'unknown'}\n\n`;
                response += `🖼️ **Base64 Image Data:**\n`;
                response += `\`\`\`\n${base64Data}\n\`\`\`\n\n`;
                response += `💡 **Usage Tips:**\n`;
                response += `- Use this image data to provide visual context to AI assistants\n`;
                response += `- The image shows the current state of the Godot editor\n`;
                response += `- Useful for debugging UI issues or demonstrating editor workflows\n`;
                return response;
            }
            catch (error) {
                const errorMessage = `Failed to capture editor screenshot: ${error.message}`;
                // Provide troubleshooting suggestions
                const suggestions = [
                    'Ensure Godot Editor is running and visible',
                    'Check that the editor window is not minimized',
                    'Verify the MCP addon is properly loaded',
                    'Try restarting the Godot Editor if issues persist'
                ];
                return `${errorMessage}\n\n🔧 **Troubleshooting Suggestions:**\n${suggestions.map(s => `- ${s}`).join('\n')}`;
            }
        },
    },
    {
        name: 'capture_game_screenshot',
        description: 'Capture screenshot of running Godot game for AI context and debugging',
        parameters: z.object({
            format: z.enum(['png', 'jpg']).default('png')
                .describe('Image format for the screenshot'),
            quality: z.number().min(1).max(100).default(90)
                .describe('Quality setting for JPEG format (1-100)'),
            include_metadata: z.boolean().default(true)
                .describe('Include metadata like dimensions, timestamp, and format info')
        }),
        execute: async ({ format = 'png', quality = 90, include_metadata = true }) => {
            const godot = await getGodotConnection();
            try {
                const result = await godot.sendCommand('capture_game_screenshot', {
                    format,
                    quality,
                    include_metadata
                });
                if (!result || !result.image_data) {
                    throw new Error('Screenshot capture failed - no image data received');
                }
                // Image data is already base64 encoded from Godot
                const base64Data = result.image_data;
                let response = `Game screenshot captured successfully\n\n`;
                response += `🎮 **Screenshot Details:**\n`;
                response += `- Format: ${result.format || format}\n`;
                response += `- Dimensions: ${result.width || 'unknown'} × ${result.height || 'unknown'}\n`;
                response += `- Size: ${result.size_bytes ? Math.round(result.size_bytes / 1024) + ' KB' : 'unknown'}\n`;
                response += `- Quality: ${result.quality || quality}%\n`;
                response += `- Timestamp: ${result.timestamp ? new Date(result.timestamp * 1000).toISOString() : 'unknown'}\n\n`;
                response += `🖼️ **Base64 Image Data:**\n`;
                response += `\`\`\`\n${base64Data}\n\`\`\`\n\n`;
                response += `💡 **Usage Tips:**\n`;
                response += `- Use this image data to provide visual context of the running game\n`;
                response += `- Useful for debugging gameplay issues or demonstrating game states\n`;
                response += `- Can help AI assistants understand visual feedback and UI elements\n`;
                return response;
            }
            catch (error) {
                const errorMessage = `Failed to capture game screenshot: ${error.message}`;
                // Provide troubleshooting suggestions
                const suggestions = [
                    'Ensure a game scene is currently running in Godot',
                    'Check that the game window is visible and not minimized',
                    'Verify the game is not paused or in a loading state',
                    'Try running the game first if no scene is active'
                ];
                return `${errorMessage}\n\n🔧 **Troubleshooting Suggestions:**\n${suggestions.map(s => `- ${s}`).join('\n')}`;
            }
        },
    },
    {
        name: 'get_screenshot_formats',
        description: 'Get list of supported screenshot formats and their capabilities',
        parameters: z.object({}),
        execute: async () => {
            const godot = await getGodotConnection();
            try {
                const result = await godot.sendCommand('get_supported_screenshot_formats', {});
                const formats = result.supported_formats || ['png', 'jpg', 'jpeg'];
                let response = `📋 **Supported Screenshot Formats:**\n\n`;
                formats.forEach((format) => {
                    response += `**${format.toUpperCase()}:**\n`;
                    if (format === 'png') {
                        response += `- Lossless compression\n`;
                        response += `- Supports transparency\n`;
                        response += `- Larger file size but perfect quality\n`;
                        response += `- Best for editor screenshots and debugging\n`;
                    }
                    else if (format === 'jpg' || format === 'jpeg') {
                        response += `- Lossy compression with adjustable quality\n`;
                        response += `- Smaller file size\n`;
                        response += `- No transparency support\n`;
                        response += `- Good for game screenshots where size matters\n`;
                    }
                    response += '\n';
                });
                response += `🎯 **Recommendations:**\n`;
                response += `- Use **PNG** for editor screenshots and debugging\n`;
                response += `- Use **JPG** for game screenshots when file size is important\n`;
                response += `- Quality setting (1-100) only affects JPG format\n`;
                return response;
            }
            catch (error) {
                return `Failed to get supported formats: ${error.message}\n\nUsing default formats: PNG, JPG, JPEG`;
            }
        },
    },
];
//# sourceMappingURL=screenshot_tools.js.map