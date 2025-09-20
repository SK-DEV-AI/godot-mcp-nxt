/**
 * System prompt generator with embedded tool schemas for MCP clients
 */
export declare class SystemPromptGenerator {
    /**
     * Generate a comprehensive system prompt with embedded tool schemas
     */
    static generateFullPrompt(): string;
    /**
     * Generate a compact prompt for quick reference
     */
    static generateCompactPrompt(): string;
    /**
     * Generate tool-specific prompt for focused assistance
     */
    static generateToolSpecificPrompt(category: string): string;
    /**
     * Get category description
     */
    private static getCategoryDescription;
    /**
     * Format tool description for prompts
     */
    private static formatToolDescription;
    /**
     * Get usage tips for a category
     */
    private static getCategoryUsageTips;
    /**
     * Get common patterns for a category
     */
    private static getCategoryPatterns;
    /**
     * Export prompt as JSON for client configuration
     */
    static exportPrompts(): any;
}
