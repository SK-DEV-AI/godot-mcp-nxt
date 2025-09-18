import { MCPTool } from './types.js';
/**
 * Centralized tool registry for managing MCP tools with categorization
 */
export declare class MCPToolRegistry {
    private tools;
    private categories;
    private toolMetadata;
    /**
     * Register a tool with optional categorization
     */
    registerTool(tool: MCPTool, category?: string, metadata?: {
        version?: string;
        dependencies?: string[];
    }): void;
    /**
     * Unregister a tool
     */
    unregisterTool(toolName: string): boolean;
    /**
     * Get a tool by name
     */
    getTool(name: string): MCPTool | undefined;
    /**
     * List all tools or tools in a specific category
     */
    listTools(category?: string): MCPTool[];
    /**
     * Get tool schema for validation/documentation
     */
    getToolSchema(name: string): any;
    /**
     * Get all available categories
     */
    getCategories(): string[];
    /**
     * Get tools by category with metadata
     */
    getToolsByCategory(): Record<string, Array<{
        tool: MCPTool;
        metadata: any;
    }>>;
    /**
     * Search tools by name or description
     */
    searchTools(query: string): MCPTool[];
    /**
     * Get tool statistics
     */
    getStatistics(): {
        totalTools: number;
        categories: number;
        toolsByCategory: Record<string, number>;
        averageToolsPerCategory: number;
    };
    /**
     * Validate tool dependencies
     */
    validateDependencies(): Array<{
        tool: string;
        missing: string[];
    }>;
    /**
     * Export registry as JSON for debugging/documentation
     */
    exportRegistry(): any;
    /**
     * Clear all tools and categories
     */
    clear(): void;
}
export declare const globalToolRegistry: MCPToolRegistry;
