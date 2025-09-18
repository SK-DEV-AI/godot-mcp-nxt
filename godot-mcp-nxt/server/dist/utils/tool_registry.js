/**
 * Centralized tool registry for managing MCP tools with categorization
 */
export class MCPToolRegistry {
    constructor() {
        this.tools = new Map();
        this.categories = new Map();
        this.toolMetadata = new Map();
    }
    /**
     * Register a tool with optional categorization
     */
    registerTool(tool, category = 'general', metadata) {
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
        const categoryTools = this.categories.get(category);
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
    unregisterTool(toolName) {
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
    getTool(name) {
        return this.tools.get(name);
    }
    /**
     * List all tools or tools in a specific category
     */
    listTools(category) {
        if (category) {
            const categoryTools = this.categories.get(category) || [];
            return categoryTools
                .map(name => this.tools.get(name))
                .filter((tool) => tool !== undefined);
        }
        return Array.from(this.tools.values());
    }
    /**
     * Get tool schema for validation/documentation
     */
    getToolSchema(name) {
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
    getCategories() {
        return Array.from(this.categories.keys());
    }
    /**
     * Get tools by category with metadata
     */
    getToolsByCategory() {
        const result = {};
        for (const [category, toolNames] of this.categories.entries()) {
            result[category] = toolNames
                .map(name => ({
                tool: this.tools.get(name),
                metadata: this.toolMetadata.get(name)
            }))
                .filter(item => item.tool !== undefined);
        }
        return result;
    }
    /**
     * Search tools by name or description
     */
    searchTools(query) {
        const lowercaseQuery = query.toLowerCase();
        const results = [];
        for (const tool of this.tools.values()) {
            if (tool.name.toLowerCase().includes(lowercaseQuery) ||
                tool.description.toLowerCase().includes(lowercaseQuery)) {
                results.push(tool);
            }
        }
        return results;
    }
    /**
     * Get tool statistics
     */
    getStatistics() {
        const toolsByCategory = {};
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
    validateDependencies() {
        const issues = [];
        for (const [toolName, metadata] of this.toolMetadata.entries()) {
            const missingDeps = [];
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
    exportRegistry() {
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
    clear() {
        this.tools.clear();
        this.categories.clear();
        this.toolMetadata.clear();
        console.log('🧹 Tool registry cleared');
    }
}
// Global registry instance
export const globalToolRegistry = new MCPToolRegistry();
//# sourceMappingURL=tool_registry.js.map