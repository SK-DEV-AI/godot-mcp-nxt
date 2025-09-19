import { z } from 'zod';
import { getGodotConnection } from '../utils/godot_connection.js';
/**
 * Performance monitoring and analysis tools for Godot MCP server
 */
export const performanceTools = [
    {
        name: 'performance_monitor',
        description: `🎯 PERFORMANCE MONITOR - Real-time Godot Engine Performance Analysis

USAGE WORKFLOW:
1. 📊 GET_METRICS: Use operation="get_metrics" to retrieve current performance data
2. 📈 ANALYZE: Use operation="analyze_performance" for detailed analysis and recommendations
3. ⚠️ ALERTS: Use operation="set_alerts" to configure performance thresholds
4. 📊 HISTORY: Use operation="get_history" to review performance trends
5. 🔧 OPTIMIZE: Use operation="optimize_suggestions" for performance improvement recommendations

COMMON PERFORMANCE ISSUES TO MONITOR:
❌ LOW FPS (< 30): Indicates rendering or physics bottlenecks
❌ HIGH MEMORY (> 500MB): Potential memory leaks or large scenes
❌ PHYSICS SPIKES: Excessive collision calculations
❌ RENDER OBJECTS: Too many objects in frame

EXAMPLES:
✅ Get current metrics: {operation: "get_metrics"}
✅ Analyze performance: {operation: "analyze_performance", include_history: true}
✅ Set FPS alert: {operation: "set_alerts", fps_threshold: 30.0}
✅ Get performance history: {operation: "get_history", hours: 1}
✅ Get optimization suggestions: {operation: "optimize_suggestions"}

PERFORMANCE METRICS TRACKED:
- FPS (Frames Per Second)
- Frame Time (Processing time per frame)
- Memory Usage (Static + Dynamic)
- Physics Processing Time
- Render Objects Count
- Scene Complexity
- Active Node Count

ALERT THRESHOLDS (CONFIGURABLE):
- FPS: < 30 (default)
- Memory: > 500MB (default)
- Physics Time: > 16ms (default)

PERFORMANCE ANALYSIS FEATURES:
- Trend analysis over time
- Bottleneck identification
- Optimization recommendations
- Memory leak detection
- Scene complexity assessment`,
        parameters: z.object({
            operation: z.enum(['get_metrics', 'analyze_performance', 'set_alerts', 'get_history', 'optimize_suggestions'])
                .describe('Type of performance operation to perform'),
            // Analysis options
            include_history: z.boolean().optional().default(false)
                .describe('Include historical performance data in analysis'),
            detailed_analysis: z.boolean().optional().default(false)
                .describe('Perform detailed performance analysis with recommendations'),
            // Alert configuration
            fps_threshold: z.number().optional()
                .describe('FPS threshold for alerts (default: 30)'),
            memory_threshold: z.number().optional()
                .describe('Memory usage threshold in MB for alerts (default: 500)'),
            physics_threshold: z.number().optional()
                .describe('Physics processing time threshold in ms for alerts (default: 16)'),
            // History options
            hours: z.number().optional().default(1)
                .describe('Number of hours of history to retrieve'),
            // Optimization options
            focus_area: z.enum(['rendering', 'physics', 'memory', 'scene', 'all']).optional().default('all')
                .describe('Specific area to focus optimization suggestions on')
        }),
        execute: async (params) => {
            const godot = await getGodotConnection();
            try {
                switch (params.operation) {
                    case 'get_metrics': {
                        const result = await godot.sendCommand('get_performance_metrics', {});
                        return formatPerformanceMetrics(result.metrics);
                    }
                    case 'analyze_performance': {
                        const result = await godot.sendCommand('analyze_performance', {
                            include_history: params.include_history,
                            detailed: params.detailed_analysis
                        });
                        return formatPerformanceAnalysis(result.analysis);
                    }
                    case 'set_alerts': {
                        const thresholds = {
                            fps: params.fps_threshold || 30.0,
                            memory_mb: params.memory_threshold || 500.0,
                            physics_ms: params.physics_threshold || 16.0
                        };
                        const result = await godot.sendCommand('set_performance_alerts', {
                            thresholds
                        });
                        return `Performance alerts configured:\n${formatAlertThresholds(thresholds)}`;
                    }
                    case 'get_history': {
                        const result = await godot.sendCommand('get_performance_history', {
                            hours: params.hours
                        });
                        return formatPerformanceHistory(result.history);
                    }
                    case 'optimize_suggestions': {
                        const result = await godot.sendCommand('get_optimization_suggestions', {
                            focus_area: params.focus_area
                        });
                        return formatOptimizationSuggestions(result.suggestions);
                    }
                    default:
                        throw new Error(`Unknown operation: ${params.operation}`);
                }
            }
            catch (error) {
                throw new Error(`Performance monitor operation failed: ${error.message}`);
            }
        },
    },
    {
        name: 'performance_profiler',
        description: `🔬 PERFORMANCE PROFILER - Advanced Godot Performance Profiling

PROFILING WORKFLOW:
1. 🎯 START: Use operation="start_profiling" to begin performance capture
2. 📊 CAPTURE: Let the profiler run during performance-critical operations
3. 🛑 STOP: Use operation="stop_profiling" to end capture and get results
4. 📈 ANALYZE: Use operation="analyze_profile" for detailed bottleneck analysis

PROFILING FEATURES:
- Frame-by-frame performance breakdown
- Function call timing analysis
- Memory allocation tracking
- Physics simulation profiling
- Rendering pipeline analysis

PROFILING MODES:
- realtime: Continuous profiling with minimal overhead
- detailed: Comprehensive analysis with higher overhead
- memory: Focus on memory allocations and leaks
- physics: Detailed physics simulation analysis

EXAMPLES:
✅ Start profiling: {operation: "start_profiling", mode: "realtime"}
✅ Stop and analyze: {operation: "stop_profiling", include_analysis: true}
✅ Memory profiling: {operation: "start_profiling", mode: "memory"}
✅ Physics analysis: {operation: "analyze_profile", focus: "physics"}`,
        parameters: z.object({
            operation: z.enum(['start_profiling', 'stop_profiling', 'analyze_profile', 'get_profile_status'])
                .describe('Type of profiling operation to perform'),
            mode: z.enum(['realtime', 'detailed', 'memory', 'physics']).optional().default('realtime')
                .describe('Profiling mode to use'),
            duration: z.number().optional()
                .describe('Duration in seconds for profiling (0 = manual stop)'),
            include_analysis: z.boolean().optional().default(true)
                .describe('Include automatic analysis when stopping profiling'),
            focus: z.enum(['rendering', 'physics', 'memory', 'script', 'all']).optional().default('all')
                .describe('Specific area to focus analysis on')
        }),
        execute: async (params) => {
            const godot = await getGodotConnection();
            try {
                switch (params.operation) {
                    case 'start_profiling': {
                        const result = await godot.sendCommand('start_performance_profiling', {
                            mode: params.mode,
                            duration: params.duration || 0
                        });
                        return `Performance profiling started in ${params.mode} mode\nProfile ID: ${result.profile_id}`;
                    }
                    case 'stop_profiling': {
                        const result = await godot.sendCommand('stop_performance_profiling', {
                            include_analysis: params.include_analysis
                        });
                        return formatProfilingResults(result.profile_data);
                    }
                    case 'analyze_profile': {
                        const result = await godot.sendCommand('analyze_performance_profile', {
                            focus: params.focus
                        });
                        return formatProfileAnalysis(result.analysis);
                    }
                    case 'get_profile_status': {
                        const result = await godot.sendCommand('get_profiling_status', {});
                        return formatProfileStatus(result.status);
                    }
                    default:
                        throw new Error(`Unknown profiling operation: ${params.operation}`);
                }
            }
            catch (error) {
                throw new Error(`Performance profiler operation failed: ${error.message}`);
            }
        },
    }
];
/**
 * Helper functions for formatting performance data
 */
function formatPerformanceMetrics(metrics) {
    let output = "📊 **Current Performance Metrics**\n\n";
    output += `🎮 **Rendering**\n`;
    output += `  • FPS: ${metrics.fps?.toFixed(1) || 'N/A'}\n`;
    output += `  • Frame Time: ${metrics.frame_time?.toFixed(2) || 'N/A'} ms\n`;
    output += `  • Render Objects: ${metrics.render_objects || 'N/A'}\n\n`;
    output += `⚡ **Physics**\n`;
    output += `  • Physics Time: ${metrics.physics_time?.toFixed(2) || 'N/A'} ms\n`;
    output += `  • Active Objects: ${metrics.physics_2d_active || 0} (2D) + ${metrics.physics_3d_active || 0} (3D)\n\n`;
    output += `💾 **Memory**\n`;
    output += `  • Total Usage: ${metrics.memory_total?.toFixed(1) || 'N/A'} MB\n`;
    output += `  • Static: ${metrics.memory_static?.toFixed(1) || 'N/A'} MB\n`;
    output += `  • Dynamic: ${metrics.memory_dynamic?.toFixed(1) || 'N/A'} MB\n\n`;
    output += `🌳 **Scene**\n`;
    output += `  • Complexity: ${metrics.scene_complexity || 'N/A'}\n`;
    output += `  • Active Nodes: ${metrics.active_nodes || 'N/A'}\n`;
    return output;
}
function formatPerformanceAnalysis(analysis) {
    let output = "🔍 **Performance Analysis Report**\n\n";
    if (analysis.bottlenecks && analysis.bottlenecks.length > 0) {
        output += "🚨 **Bottlenecks Detected**\n";
        analysis.bottlenecks.forEach((bottleneck, index) => {
            output += `${index + 1}. ${bottleneck.description}\n`;
            output += `   Impact: ${bottleneck.impact}\n`;
            output += `   Recommendation: ${bottleneck.recommendation}\n\n`;
        });
    }
    if (analysis.recommendations && analysis.recommendations.length > 0) {
        output += "💡 **Optimization Recommendations**\n";
        analysis.recommendations.forEach((rec, index) => {
            output += `${index + 1}. ${rec.description}\n`;
            output += `   Expected Impact: ${rec.expected_impact}\n\n`;
        });
    }
    if (analysis.trends) {
        output += "📈 **Performance Trends**\n";
        Object.entries(analysis.trends).forEach(([metric, trend]) => {
            output += `  • ${metric}: ${trend.direction} (${trend.change_percent?.toFixed(1) || 'N/A'}%)\n`;
        });
    }
    return output;
}
function formatAlertThresholds(thresholds) {
    return Object.entries(thresholds)
        .map(([metric, value]) => `  • ${metric}: ${value}`)
        .join('\n');
}
function formatPerformanceHistory(history) {
    if (!history || history.length === 0) {
        return "📊 No performance history available";
    }
    let output = "📈 **Performance History**\n\n";
    output += "| Time | FPS | Memory | Physics |\n";
    output += "|------|-----|--------|--------|\n";
    history.slice(-20).forEach(entry => {
        const timestamp = new Date(entry.timestamp * 1000).toLocaleTimeString();
        output += `| ${timestamp} | ${entry.metrics.fps?.toFixed(1) || 'N/A'} | ${entry.metrics.memory_total?.toFixed(1) || 'N/A'}MB | ${entry.metrics.physics_time?.toFixed(2) || 'N/A'}ms |\n`;
    });
    return output;
}
function formatOptimizationSuggestions(suggestions) {
    if (!suggestions || suggestions.length === 0) {
        return "✅ No optimization suggestions available - performance looks good!";
    }
    let output = "🚀 **Optimization Suggestions**\n\n";
    suggestions.forEach((suggestion, index) => {
        output += `${index + 1}. **${suggestion.title}**\n`;
        output += `   ${suggestion.description}\n`;
        output += `   **Impact:** ${suggestion.impact}\n`;
        output += `   **Difficulty:** ${suggestion.difficulty}\n\n`;
        if (suggestion.steps && suggestion.steps.length > 0) {
            output += `   **Steps:**\n`;
            suggestion.steps.forEach((step, stepIndex) => {
                output += `   ${stepIndex + 1}. ${step}\n`;
            });
            output += "\n";
        }
    });
    return output;
}
function formatProfilingResults(profileData) {
    let output = "🔬 **Profiling Results**\n\n";
    output += `**Profile Duration:** ${profileData.duration?.toFixed(2) || 'N/A'} seconds\n`;
    output += `**Total Frames:** ${profileData.total_frames || 'N/A'}\n`;
    output += `**Average FPS:** ${profileData.average_fps?.toFixed(1) || 'N/A'}\n\n`;
    if (profileData.frame_times && profileData.frame_times.length > 0) {
        output += "**Frame Time Analysis**\n";
        output += `  • Average: ${profileData.frame_times_avg?.toFixed(2) || 'N/A'} ms\n`;
        output += `  • Min: ${profileData.frame_times_min?.toFixed(2) || 'N/A'} ms\n`;
        output += `  • Max: ${profileData.frame_times_max?.toFixed(2) || 'N/A'} ms\n`;
        output += `  • 95th Percentile: ${profileData.frame_times_95p?.toFixed(2) || 'N/A'} ms\n\n`;
    }
    if (profileData.bottlenecks && profileData.bottlenecks.length > 0) {
        output += "**Top Bottlenecks**\n";
        profileData.bottlenecks.slice(0, 5).forEach((bottleneck, index) => {
            output += `${index + 1}. ${bottleneck.function || 'Unknown'} (${bottleneck.time?.toFixed(2) || 'N/A'} ms)\n`;
        });
    }
    return output;
}
function formatProfileAnalysis(analysis) {
    let output = "📊 **Profile Analysis**\n\n";
    if (analysis.hotspots && analysis.hotspots.length > 0) {
        output += "**Performance Hotspots**\n";
        analysis.hotspots.forEach((hotspot, index) => {
            output += `${index + 1}. ${hotspot.name}\n`;
            output += `   Time: ${hotspot.total_time?.toFixed(2) || 'N/A'} ms\n`;
            output += `   Calls: ${hotspot.call_count || 'N/A'}\n`;
            output += `   Avg Time: ${hotspot.avg_time?.toFixed(2) || 'N/A'} ms\n\n`;
        });
    }
    if (analysis.recommendations && analysis.recommendations.length > 0) {
        output += "**Optimization Recommendations**\n";
        analysis.recommendations.forEach((rec, index) => {
            output += `${index + 1}. ${rec.description}\n`;
        });
    }
    return output;
}
function formatProfileStatus(status) {
    let output = "📊 **Profiling Status**\n\n";
    output += `**Status:** ${status.is_profiling ? 'Active' : 'Inactive'}\n`;
    if (status.is_profiling) {
        output += `**Mode:** ${status.mode || 'Unknown'}\n`;
        output += `**Duration:** ${status.elapsed_time?.toFixed(2) || 'N/A'} seconds\n`;
        output += `**Frames Captured:** ${status.frames_captured || 0}\n`;
    }
    if (status.last_profile) {
        output += `**Last Profile:** ${status.last_profile.duration?.toFixed(2) || 'N/A'} seconds\n`;
        output += `**Average FPS:** ${status.last_profile.average_fps?.toFixed(1) || 'N/A'}\n`;
    }
    return output;
}
//# sourceMappingURL=performance_tools.js.map