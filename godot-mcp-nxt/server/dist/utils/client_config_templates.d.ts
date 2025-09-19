/**
 * Client-specific configuration templates for different MCP clients
 * Provides optimized settings and prompts for various AI assistants
 */
export interface ClientConfig {
    name: string;
    description: string;
    systemPrompt: string;
    toolPreferences: {
        enabledCategories: string[];
        disabledTools: string[];
        priorityTools: string[];
    };
    performanceSettings: {
        maxConcurrentTools: number;
        timeoutMultiplier: number;
        retryAttempts: number;
    };
    uiSettings: {
        showToolSchemas: boolean;
        compactMode: boolean;
        autoComplete: boolean;
    };
}
/**
 * Claude-specific configuration
 * Optimized for Anthropic's Claude with advanced reasoning capabilities
 */
export declare const claudeConfig: ClientConfig;
/**
 * ChatGPT-specific configuration
 * Optimized for OpenAI's ChatGPT with conversational interface
 */
export declare const chatgptConfig: ClientConfig;
/**
 * VS Code Copilot-specific configuration
 * Optimized for Microsoft's GitHub Copilot with IDE integration
 */
export declare const copilotConfig: ClientConfig;
/**
 * Cursor-specific configuration
 * Optimized for Cursor IDE with AI-first development approach
 */
export declare const cursorConfig: ClientConfig;
/**
 * Windsurf-specific configuration
 * Optimized for Windsurf IDE with advanced AI features
 */
export declare const windsurfConfig: ClientConfig;
/**
 * Configuration manager for client-specific settings
 */
export declare class ClientConfigManager {
    private static configs;
    /**
     * Get configuration for a specific client
     */
    static getConfig(clientName: string): ClientConfig | null;
    /**
     * Get all available client configurations
     */
    static getAllConfigs(): ClientConfig[];
    /**
     * Get client names
     */
    static getClientNames(): string[];
    /**
     * Create a custom configuration
     */
    static createCustomConfig(baseClient: string, customizations: Partial<ClientConfig>): ClientConfig | null;
    /**
     * Export configuration as JSON
     */
    static exportConfig(clientName: string): string | null;
    /**
     * Import configuration from JSON
     */
    static importConfig(jsonConfig: string): ClientConfig | null;
}
/**
 * Generate client-specific setup instructions
 */
export declare function generateSetupInstructions(clientName: string): string;
