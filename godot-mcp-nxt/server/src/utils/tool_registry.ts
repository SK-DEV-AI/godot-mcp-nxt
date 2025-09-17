import { MCPTool } from './types.js';

/**
 * Centralized tool registry for managing MCP tools with categorization
 */
export class MCPToolRegistry {
  private tools = new Map<string, MCPTool>();
  private categories = new Map<string, string[]>();
  private toolMetadata = new Map<string, {
    category: string;
    version: string;
    dependencies: string[];
    lastModified: Date;
  }>();

  /**
   * Register a tool with optional categorization
   */
  registerTool(
    tool: MCPTool,
    category: string = 'general',
    metadata?: {
      version?: string;
      dependencies?: string[];
    }
  ): void {
    // Validate tool structure
    if (!tool.name || !tool.description || !tool.parameters || !tool.execute) {
      throw new Error(`Invalid tool structure for ${tool.name || 'unnamed tool'}`);
    }

    // Check for duplicate registration
    if (this.tools.has(tool.name)) {
      console.warn(`Tool ${tool.name} is being re-registered, replacing existing version`);
    }

    // Register the tool
    this.tools.set(tool.name, tool);

    // Update category mapping
    if (!this.categories.has(category)) {
      this.categories.set(category, []);
    }

    const categoryTools = this.categories.get(category)!;
    if (!categoryTools.includes(tool.name)) {
      categoryTools.push(tool.name);
    }

    // Store metadata
    this.toolMetadata.set(tool.name, {
      category,
      version: metadata?.version || '1.0.0',
      dependencies: metadata?.dependencies || [],
      lastModified: new Date()
    });

    console.log(`✅ Registered tool: ${tool.name} in category: ${category}`);
  }

  /**
   * Unregister a tool
   */
  unregisterTool(toolName: string): boolean {
    if (!this.tools.has(toolName)) {
      return false;
    }

    // Remove from tools map
    this.tools.delete(toolName);

    // Remove from category mapping
    for (const [category, tools] of this.categories.entries()) {
      const index = tools.indexOf(toolName);
      if (index !== -1) {
        tools.splice(index, 1);
        // Remove empty categories
        if (tools.length === 0) {
          this.categories.delete(category);
        }
        break;
      }
    }

    // Remove metadata
    this.toolMetadata.delete(toolName);

    console.log(`🗑️ Unregistered tool: ${toolName}`);
    return true;
  }

  /**
   * Get a tool by name
   */
  getTool(name: string): MCPTool | undefined {
    return this.tools.get(name);
  }

  /**
   * List all tools or tools in a specific category
   */
  listTools(category?: string): MCPTool[] {
    if (category) {
      const categoryTools = this.categories.get(category) || [];
      return categoryTools
        .map(name => this.tools.get(name))
        .filter((tool): tool is MCPTool => tool !== undefined);
    }

    return Array.from(this.tools.values());
  }

  /**
   * Get tool schema for validation/documentation
   */
  getToolSchema(name: string): any {
    const tool = this.tools.get(name);
    if (!tool) {
      return null;
    }

    return {
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters._def,
      annotations: tool.annotations || {},
      metadata: this.toolMetadata.get(name)
    };
  }

  /**
   * Get all available categories
   */
  getCategories(): string[] {
    return Array.from(this.categories.keys());
  }

  /**
   * Get tools by category with metadata
   */
  getToolsByCategory(): Record<string, Array<{ tool: MCPTool; metadata: any }>> {
    const result: Record<string, Array<{ tool: MCPTool; metadata: any }>> = {};

    for (const [category, toolNames] of this.categories.entries()) {
      result[category] = toolNames
        .map(name => ({
          tool: this.tools.get(name)!,
          metadata: this.toolMetadata.get(name)
        }))
        .filter(item => item.tool !== undefined);
    }

    return result;
  }

  /**
   * Search tools by name or description
   */
  searchTools(query: string): MCPTool[] {
    const lowercaseQuery = query.toLowerCase();
    const results: MCPTool[] = [];

    for (const tool of this.tools.values()) {
      if (
        tool.name.toLowerCase().includes(lowercaseQuery) ||
        tool.description.toLowerCase().includes(lowercaseQuery)
      ) {
        results.push(tool);
      }
    }

    return results;
  }

  /**
   * Get tool statistics
   */
  getStatistics(): {
    totalTools: number;
    categories: number;
    toolsByCategory: Record<string, number>;
    averageToolsPerCategory: number;
  } {
    const toolsByCategory: Record<string, number> = {};
    let totalTools = 0;

    for (const [category, tools] of this.categories.entries()) {
      toolsByCategory[category] = tools.length;
      totalTools += tools.length;
    }

    return {
      totalTools,
      categories: this.categories.size,
      toolsByCategory,
      averageToolsPerCategory: this.categories.size > 0 ? totalTools / this.categories.size : 0
    };
  }

  /**
   * Validate tool dependencies
   */
  validateDependencies(): Array<{ tool: string; missing: string[] }> {
    const issues: Array<{ tool: string; missing: string[] }> = [];

    for (const [toolName, metadata] of this.toolMetadata.entries()) {
      const missingDeps: string[] = [];

      for (const dep of metadata.dependencies) {
        if (!this.tools.has(dep)) {
          missingDeps.push(dep);
        }
      }

      if (missingDeps.length > 0) {
        issues.push({ tool: toolName, missing: missingDeps });
      }
    }

    return issues;
  }

  /**
   * Export registry as JSON for debugging/documentation
   */
  exportRegistry(): any {
    const exportData = {
      timestamp: new Date().toISOString(),
      statistics: this.getStatistics(),
      categories: Array.from(this.categories.entries()),
      tools: Array.from(this.tools.entries()).map(([name, tool]) => ({
        name,
        description: tool.description,
        schema: this.getToolSchema(name),
        metadata: this.toolMetadata.get(name)
      })),
      dependencyIssues: this.validateDependencies()
    };

    return exportData;
  }

  /**
   * Clear all tools and categories
   */
  clear(): void {
    this.tools.clear();
    this.categories.clear();
    this.toolMetadata.clear();
    console.log('🧹 Tool registry cleared');
  }
}

// Global registry instance
export const globalToolRegistry = new MCPToolRegistry();