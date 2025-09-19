import { z } from 'zod';
import { getGodotConnection } from '../utils/godot_connection.js';
/**
 * Advanced editor tools for enhanced Godot development workflow
 */
export const advancedEditorTools = [
    {
        name: 'execute_editor_script',
        description: 'Execute arbitrary GDScript code in the Godot editor context with full access to editor APIs',
        parameters: z.object({
            script_code: z.string()
                .describe('The GDScript code to execute in the editor context'),
            timeout: z.number().max(120000).default(30000)
                .describe('Execution timeout in milliseconds (max 2 minutes)'),
            capture_output: z.boolean().default(true)
                .describe('Whether to capture print() statements and return values'),
            include_stack_trace: z.boolean().default(true)
                .describe('Include stack trace in error responses')
        }),
        execute: async ({ script_code, timeout, capture_output, include_stack_trace }) => {
            const godot = await getGodotConnection();
            try {
                const result = await godot.sendCommand('execute_editor_script', {
                    script_code,
                    timeout,
                    capture_output,
                    include_stack_trace
                });
                if (!result || result.status === 'error') {
                    const errorMsg = result?.error || 'Script execution failed';
                    const stackTrace = result?.stack_trace ? `\n\nStack Trace:\n${result.stack_trace}` : '';
                    return `❌ **Script Execution Failed**\n\n**Error:** ${errorMsg}${stackTrace}\n\n🔧 **Troubleshooting:**\n- Check GDScript syntax\n- Verify editor APIs are available\n- Ensure script has proper permissions\n- Test with simpler code first`;
                }
                let response = `✅ **Script Executed Successfully**\n\n`;
                if (result.output && result.output.length > 0) {
                    response += `📝 **Output:**\n\`\`\`\n${result.output.join('\n')}\n\`\`\`\n\n`;
                }
                if (result.return_value !== null && result.return_value !== undefined) {
                    response += `↳ **Return Value:** \`${JSON.stringify(result.return_value)}\`\n\n`;
                }
                response += `⏱️ **Execution Time:** ${result.execution_time || 'unknown'}ms\n`;
                if (result.warnings && result.warnings.length > 0) {
                    response += `\n⚠️ **Warnings:**\n${result.warnings.map((w) => `- ${w}`).join('\n')}`;
                }
                return response;
            }
            catch (error) {
                const errorMessage = `Failed to execute editor script: ${error.message}`;
                return `${errorMessage}\n\n🔧 **Common Issues:**\n- Godot Editor may not be running\n- Script contains syntax errors\n- Editor APIs not accessible\n- Timeout exceeded (${timeout}ms)\n\nTry testing with a simple script first:\n\`\`\`gdscript\nprint("Hello from editor!")\nreturn "success"\n\`\`\``;
            }
        },
    },
    {
        name: 'clear_output_logs',
        description: 'Clear the Godot editor output console and error logs',
        parameters: z.object({
            clear_errors: z.boolean().default(true)
                .describe('Clear error messages from the console'),
            clear_warnings: z.boolean().default(true)
                .describe('Clear warning messages from the console'),
            clear_info: z.boolean().default(false)
                .describe('Clear informational messages from the console'),
            preserve_recent: z.boolean().default(false)
                .describe('Keep the most recent messages (last 10 lines)')
        }),
        execute: async ({ clear_errors, clear_warnings, clear_info, preserve_recent }) => {
            const godot = await getGodotConnection();
            try {
                const result = await godot.sendCommand('clear_output_logs', {
                    clear_errors,
                    clear_warnings,
                    clear_info,
                    preserve_recent
                });
                let response = `🧹 **Output Console Cleared**\n\n`;
                if (result.cleared_counts) {
                    const counts = result.cleared_counts;
                    response += `**Cleared Messages:**\n`;
                    if (counts.errors > 0)
                        response += `- Errors: ${counts.errors}\n`;
                    if (counts.warnings > 0)
                        response += `- Warnings: ${counts.warnings}\n`;
                    if (counts.info > 0)
                        response += `- Info: ${counts.info}\n`;
                    response += `- Total: ${counts.total}\n\n`;
                }
                if (preserve_recent && result.preserved_lines) {
                    response += `📄 **Preserved Recent Messages:**\n`;
                    result.preserved_lines.forEach((line, index) => {
                        response += `${index + 1}. ${line}\n`;
                    });
                    response += '\n';
                }
                response += `✨ **Console is now clean and ready for new output!**`;
                return response;
            }
            catch (error) {
                return `❌ Failed to clear output logs: ${error.message}\n\n🔧 **Troubleshooting:**\n- Ensure Godot Editor is running\n- Check if console is accessible\n- Try restarting the editor if issues persist`;
            }
        },
    },
    {
        name: 'get_editor_logs',
        description: 'Retrieve recent messages from the Godot editor output console',
        parameters: z.object({
            lines: z.number().max(500).default(50)
                .describe('Number of recent lines to retrieve (max 500)'),
            filter_type: z.enum(['all', 'errors', 'warnings', 'info']).default('all')
                .describe('Filter messages by type'),
            include_timestamps: z.boolean().default(true)
                .describe('Include timestamps with each message'),
            search_pattern: z.string().optional()
                .describe('Optional regex pattern to search for in messages')
        }),
        execute: async ({ lines, filter_type, include_timestamps, search_pattern }) => {
            const godot = await getGodotConnection();
            try {
                const result = await godot.sendCommand('get_editor_logs', {
                    lines,
                    filter_type,
                    include_timestamps,
                    search_pattern
                });
                if (!result || !result.logs || result.logs.length === 0) {
                    return `📭 **No log messages found**\n\nThe console appears to be empty or no messages match your criteria.`;
                }
                let response = `📋 **Editor Console Logs**\n\n`;
                response += `**Filter:** ${filter_type.toUpperCase()}\n`;
                response += `**Lines:** ${result.logs.length}\n`;
                if (search_pattern) {
                    response += `**Search Pattern:** \`${search_pattern}\`\n`;
                }
                response += `\n**Messages:**\n\`\`\`\n`;
                result.logs.forEach((log, index) => {
                    let line = '';
                    if (include_timestamps && log.timestamp) {
                        line += `[${log.timestamp}] `;
                    }
                    line += `${log.level.toUpperCase()}: ${log.message}`;
                    response += line + '\n';
                });
                response += `\`\`\`\n`;
                if (result.truncated) {
                    response += `\n⚠️ **Note:** Output was truncated. Showing last ${lines} messages.\n`;
                }
                return response;
            }
            catch (error) {
                return `❌ Failed to retrieve editor logs: ${error.message}\n\n🔧 **Troubleshooting:**\n- Ensure Godot Editor is running\n- Check console accessibility\n- Try with fewer lines or no filter`;
            }
        },
    },
    {
        name: 'export_scene_screenshot',
        description: 'Export a high-quality screenshot of the current scene with custom settings',
        parameters: z.object({
            output_path: z.string()
                .describe('Output path for the screenshot (res:// prefix for project files)'),
            resolution_scale: z.number().min(0.1).max(4.0).default(1.0)
                .describe('Resolution multiplier (1.0 = viewport size, 2.0 = 2x resolution)'),
            format: z.enum(['png', 'jpg', 'webp']).default('png')
                .describe('Image format for export'),
            quality: z.number().min(1).max(100).default(95)
                .describe('Quality setting for lossy formats (JPG/WebP)'),
            include_ui: z.boolean().default(false)
                .describe('Include editor UI elements in the screenshot'),
            transparent_background: z.boolean().default(false)
                .describe('Use transparent background (PNG/WebP only)')
        }),
        execute: async ({ output_path, resolution_scale, format, quality, include_ui, transparent_background }) => {
            const godot = await getGodotConnection();
            try {
                const result = await godot.sendCommand('export_scene_screenshot', {
                    output_path,
                    resolution_scale,
                    format,
                    quality,
                    include_ui,
                    transparent_background
                });
                let response = `📸 **Scene Screenshot Exported**\n\n`;
                response += `📁 **Output:** \`${result.output_path || output_path}\`\n`;
                response += `📐 **Resolution:** ${result.width || 'unknown'} × ${result.height || 'unknown'}`;
                if (resolution_scale !== 1.0) {
                    response += ` (${resolution_scale}x scale)`;
                }
                response += `\n🎨 **Format:** ${result.format || format}\n`;
                response += `📊 **File Size:** ${result.file_size ? Math.round(result.file_size / 1024) + ' KB' : 'unknown'}\n`;
                if (result.quality) {
                    response += `⚙️ **Quality:** ${result.quality}%\n`;
                }
                response += `\n✅ **Export completed successfully!**\n\n`;
                response += `💡 **Usage Tips:**\n`;
                response += `- Use high resolution for marketing materials\n`;
                response += `- PNG for lossless quality with transparency\n`;
                response += `- JPG for smaller files when quality loss is acceptable\n`;
                response += `- WebP for web-optimized images with transparency support`;
                return response;
            }
            catch (error) {
                const errorMessage = `Failed to export scene screenshot: ${error.message}`;
                return `${errorMessage}\n\n🔧 **Troubleshooting:**\n- Check output path permissions\n- Ensure scene is currently open\n- Verify format compatibility\n- Try with default settings first\n\n**Supported formats:** PNG, JPG, WebP`;
            }
        },
    },
    {
        name: 'analyze_project_structure',
        description: 'Analyze the Godot project structure and provide insights about organization and potential improvements',
        parameters: z.object({
            include_file_sizes: z.boolean().default(false)
                .describe('Include file size information in analysis'),
            check_script_errors: z.boolean().default(true)
                .describe('Check for script compilation errors'),
            analyze_dependencies: z.boolean().default(true)
                .describe('Analyze script and scene dependencies'),
            generate_report: z.boolean().default(true)
                .describe('Generate a detailed analysis report')
        }),
        execute: async ({ include_file_sizes, check_script_errors, analyze_dependencies, generate_report }) => {
            const godot = await getGodotConnection();
            try {
                const result = await godot.sendCommand('analyze_project_structure', {
                    include_file_sizes,
                    check_script_errors,
                    analyze_dependencies,
                    generate_report
                });
                let response = `📊 **Project Structure Analysis**\n\n`;
                if (result.summary) {
                    const summary = result.summary;
                    response += `📁 **Project Overview:**\n`;
                    response += `- Scenes: ${summary.scene_count || 0}\n`;
                    response += `- Scripts: ${summary.script_count || 0}\n`;
                    response += `- Resources: ${summary.resource_count || 0}\n`;
                    response += `- Total Files: ${summary.total_files || 0}\n\n`;
                }
                if (result.issues && result.issues.length > 0) {
                    response += `⚠️ **Issues Found:**\n`;
                    result.issues.forEach((issue, index) => {
                        response += `${index + 1}. **${issue.type}**: ${issue.message}\n`;
                        if (issue.file)
                            response += `   File: \`${issue.file}\`\n`;
                        if (issue.suggestion)
                            response += `   💡 ${issue.suggestion}\n`;
                    });
                    response += '\n';
                }
                if (result.recommendations && result.recommendations.length > 0) {
                    response += `💡 **Recommendations:**\n`;
                    result.recommendations.forEach((rec, index) => {
                        response += `${index + 1}. ${rec.message}\n`;
                    });
                    response += '\n';
                }
                if (result.file_analysis && include_file_sizes) {
                    response += `📈 **File Size Analysis:**\n`;
                    response += `- Largest Files: ${result.file_analysis.largest_files?.join(', ') || 'N/A'}\n`;
                    response += `- Total Size: ${result.file_analysis.total_size ? Math.round(result.file_analysis.total_size / 1024 / 1024) + ' MB' : 'unknown'}\n\n`;
                }
                if (generate_report && result.report_path) {
                    response += `📄 **Detailed Report:** \`${result.report_path}\`\n\n`;
                }
                response += `🎯 **Next Steps:**\n`;
                response += `- Review and address any issues found\n`;
                response += `- Consider the recommendations for improvement\n`;
                response += `- Run this analysis periodically to track project health`;
                return response;
            }
            catch (error) {
                return `❌ Failed to analyze project structure: ${error.message}\n\n🔧 **Troubleshooting:**\n- Ensure project files are accessible\n- Check file permissions\n- Try with fewer analysis options`;
            }
        },
    }
];
//# sourceMappingURL=advanced_editor_tools.js.map