import { z } from 'zod';
import { MCPTool } from '../utils/types.js';
import { getGodotConnection } from '../utils/godot_connection.js';
import { compressJsonResponse } from '../utils/compression.js';

/**
 * Tool for analyzing scene performance metrics
 */
export const analyzeScenePerformanceTool: MCPTool = {
  name: 'analyze_scene_performance',
  description: 'Analyze Godot scene performance including node count, draw calls, and potential optimizations',
  parameters: z.object({
    scene_path: z.string().describe('Path to the scene file to analyze'),
    include_detailed_breakdown: z.boolean().optional().default(false).describe('Include detailed node-by-node performance breakdown'),
  }),
  annotations: {
    streamingHint: true,
  },
  execute: async (args: any, context?: { reportProgress?: any; streamContent?: any }) => {
    const { scene_path, include_detailed_breakdown } = args;
    const { reportProgress, streamContent } = context || {};
    const godot = getGodotConnection();

    try {
      if (streamContent) {
        await streamContent({ type: 'text', text: `Starting performance analysis for scene: ${scene_path}\n` });
      }

      if (reportProgress) {
        await reportProgress({ progress: 10, total: 100 });
      }

      // Get scene structure
      const sceneResult = await godot.sendCommand('get_scene_structure', {
        path: scene_path
      });

      if (streamContent) {
        await streamContent({ type: 'text', text: 'Retrieved scene structure, analyzing nodes...\n' });
      }

      if (reportProgress) {
        await reportProgress({ progress: 30, total: 100 });
      }

      // Analyze performance metrics
      const analysis = analyzeScenePerformance(sceneResult, include_detailed_breakdown);

      if (streamContent) {
        await streamContent({ type: 'text', text: 'Performance analysis complete.\n' });
      }

      if (reportProgress) {
        await reportProgress({ progress: 100, total: 100 });
      }

      // Compress large analysis results
      const { data: compressedAnalysis } = await compressJsonResponse(analysis, {
        minSize: 2048, // Compress if larger than 2KB
        algorithm: 'gzip'
      });

      return {
        content: [
          {
            type: 'text',
            text: `Performance analysis completed for ${scene_path}\n\nAnalysis Results:\n${JSON.stringify(compressedAnalysis, null, 2)}`
          }
        ]
      };
    } catch (error) {
      console.error('Error analyzing scene performance:', error);
      throw error;
    }
  }
};

/**
 * Tool for analyzing script performance
 */
export const analyzeScriptPerformanceTool: MCPTool = {
  name: 'analyze_script_performance',
  description: 'Analyze GDScript performance including function complexity, potential bottlenecks, and optimization suggestions',
  parameters: z.object({
    script_path: z.string().describe('Path to the script file to analyze'),
    include_complexity_analysis: z.boolean().optional().default(true).describe('Include cyclomatic complexity analysis'),
  }),
  execute: async ({ script_path, include_complexity_analysis }) => {
    const godot = getGodotConnection();

    try {
      // Get script content
      const scriptResult = await godot.sendCommand('get_script', {
        script_path: script_path
      });

      if (!scriptResult?.content) {
        throw new Error(`Script not found: ${script_path}`);
      }

      const analysis = analyzeScriptPerformance(scriptResult.content, script_path, include_complexity_analysis);

      return {
        content: [
          {
            type: 'text',
            text: `Script performance analysis completed for ${script_path}\n\nAnalysis Results:\n${JSON.stringify(analysis, null, 2)}`
          }
        ]
      };
    } catch (error) {
      console.error('Error analyzing script performance:', error);
      throw error;
    }
  }
};

/**
 * Tool for getting real-time performance metrics
 */
export const getRealtimePerformanceMetricsTool: MCPTool = {
  name: 'get_realtime_performance_metrics',
  description: 'Get current Godot engine performance metrics (FPS, memory usage, draw calls, etc.)',
  parameters: z.object({
    include_system_info: z.boolean().optional().default(false).describe('Include system information and hardware details'),
  }),
  execute: async ({ include_system_info }) => {
    const godot = getGodotConnection();

    try {
      const metricsResult = await godot.sendCommand('get_performance_metrics', {
        include_system_info
      });

      const metrics = {
        timestamp: new Date().toISOString(),
        fps: metricsResult.fps || 0,
        frame_time: metricsResult.frame_time || 0,
        memory_usage: metricsResult.memory_usage || 0,
        draw_calls: metricsResult.draw_calls || 0,
        objects_drawn: metricsResult.objects_drawn || 0,
        vertices_drawn: metricsResult.vertices_drawn || 0,
        system_info: include_system_info ? metricsResult.system_info : undefined
      };

      return {
        content: [
          {
            type: 'text',
            text: `Current performance metrics - FPS: ${metrics.fps}, Memory: ${Math.round(metrics.memory_usage / 1024 / 1024)}MB, Draw Calls: ${metrics.draw_calls}\n\nDetailed Metrics:\n${JSON.stringify(metrics, null, 2)}`
          }
        ]
      };
    } catch (error) {
      console.error('Error getting performance metrics:', error);
      throw error;
    }
  }
};

// Helper functions for performance analysis

function analyzeScenePerformance(sceneData: any, detailed: boolean) {
  const analysis = {
    scene_path: sceneData.scene_path || 'unknown',
    total_nodes: 0,
    performance_score: 0,
    issues: [] as any[],
    recommendations: [] as any[],
    breakdown: detailed ? [] as any[] : undefined
  };

  // Handle different response formats
  var sceneNodes;
  if (sceneData.nodes) {
    sceneNodes = sceneData.nodes;
  } else if (sceneData.structure) {
    sceneNodes = sceneData.structure;
  } else {
    analysis.issues.push({
      type: 'error',
      message: 'No scene data available for analysis'
    });
    return analysis;
  }

  // Analyze nodes recursively
  function analyzeNode(node: any, depth = 0): any {
    analysis.total_nodes++;

    const nodeAnalysis = {
      name: node.name,
      type: node.type,
      depth,
      issues: [] as string[],
      score: 100
    };

    // Check for performance issues
    if (node.type === 'Sprite2D' && !node.texture) {
      nodeAnalysis.issues.push('Sprite2D without texture');
      nodeAnalysis.score -= 20;
    }

    if (node.type === 'RigidBody2D' && node.children?.length > 10) {
      nodeAnalysis.issues.push('RigidBody2D with many children - consider optimization');
      nodeAnalysis.score -= 15;
    }

    if (node.type === 'AnimationPlayer' && node.animations?.length > 20) {
      nodeAnalysis.issues.push('Many animations - consider splitting into multiple players');
      nodeAnalysis.score -= 10;
    }

    // Analyze children
    if (node.children) {
      for (const child of node.children) {
        const childAnalysis = analyzeNode(child, depth + 1);
        nodeAnalysis.score = Math.min(nodeAnalysis.score, childAnalysis.score);
      }
    }

    if (detailed && nodeAnalysis.issues.length > 0) {
      analysis.breakdown!.push(nodeAnalysis);
    }

    return nodeAnalysis;
  }

  const rootAnalysis = analyzeNode(sceneNodes);
  analysis.performance_score = rootAnalysis.score;

  // Generate recommendations
  if (analysis.total_nodes > 1000) {
    analysis.recommendations.push({
      priority: 'high',
      message: 'Scene has many nodes - consider scene instancing or optimization'
    });
  }

  if (analysis.performance_score < 70) {
    analysis.recommendations.push({
      priority: 'medium',
      message: 'Performance score is low - review node structure and remove unnecessary elements'
    });
  }

  return analysis;
}

function analyzeScriptPerformance(content: string, filePath: string, includeComplexity: boolean) {
  const lines = content.split('\n');

  const analysis = {
    script_path: filePath,
    total_lines: lines.length,
    functions: [] as any[],
    complexity_score: 0,
    issues: [] as any[],
    recommendations: [] as any[]
  };

  let currentFunction: any = null;
  let braceDepth = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const originalLine = lines[i];

    // Function detection
    const funcMatch = line.match(/^func\s+(\w+)\s*\(/);
    if (funcMatch) {
      if (currentFunction) {
        // Finalize previous function
        currentFunction.end_line = i;
        currentFunction.complexity = calculateFunctionComplexity(currentFunction.lines);
        analysis.functions.push(currentFunction);
      }

      currentFunction = {
        name: funcMatch[1],
        start_line: i + 1,
        lines: [] as string[],
        complexity: 0
      };
    }

    // Track braces for function boundaries
    const openBraces = (line.match(/\{/g) || []).length;
    const closeBraces = (line.match(/\}/g) || []).length;
    braceDepth += openBraces - closeBraces;

    if (currentFunction && braceDepth > 0) {
      currentFunction.lines.push(originalLine);
    }

    // End of function
    if (currentFunction && braceDepth === 0 && currentFunction.lines.length > 0) {
      currentFunction.end_line = i + 1;
      currentFunction.complexity = calculateFunctionComplexity(currentFunction.lines);
      analysis.functions.push(currentFunction);
      currentFunction = null;
    }

    // Check for performance issues
    if (line.includes('get_node(') && line.includes('../')) {
      analysis.issues.push({
        line: i + 1,
        type: 'warning',
        message: 'Deep node path lookup - consider caching node reference'
      });
    }

    if (line.includes('find_node(') || line.includes('get_node(')) {
      analysis.issues.push({
        line: i + 1,
        type: 'info',
        message: 'Node lookup in _process or _physics_process - consider caching'
      });
    }
  }

  // Finalize last function
  if (currentFunction) {
    currentFunction.complexity = calculateFunctionComplexity(currentFunction.lines);
    analysis.functions.push(currentFunction);
  }

  // Calculate overall complexity
  if (includeComplexity) {
    analysis.complexity_score = analysis.functions.reduce((sum, func) => sum + func.complexity, 0);
  }

  // Generate recommendations
  const highComplexityFunctions = analysis.functions.filter(f => f.complexity > 10);
  if (highComplexityFunctions.length > 0) {
    analysis.recommendations.push({
      priority: 'high',
      message: `Functions with high complexity: ${highComplexityFunctions.map(f => f.name).join(', ')} - consider refactoring`
    });
  }

  if (analysis.issues.filter(i => i.type === 'warning').length > 5) {
    analysis.recommendations.push({
      priority: 'medium',
      message: 'Many performance warnings - review node access patterns'
    });
  }

  return analysis;
}

function calculateFunctionComplexity(lines: string[]): number {
  let complexity = 1; // Base complexity

  for (const line of lines) {
    const trimmed = line.trim();

    // Control structures increase complexity
    if (trimmed.startsWith('if ') || trimmed.startsWith('elif ')) {
      complexity++;
    }

    if (trimmed.startsWith('for ') || trimmed.startsWith('while ')) {
      complexity++;
    }

    if (trimmed.includes(' and ') || trimmed.includes(' or ')) {
      complexity++;
    }

    // Nested conditions (simple heuristic)
    const indentLevel = line.length - line.trimStart().length;
    if (indentLevel > 8 && (trimmed.startsWith('if ') || trimmed.startsWith('for ') || trimmed.startsWith('while '))) {
      complexity++;
    }
  }

  return complexity;
}

export const performanceTools: MCPTool[] = [
  analyzeScenePerformanceTool,
  analyzeScriptPerformanceTool,
  getRealtimePerformanceMetricsTool
];