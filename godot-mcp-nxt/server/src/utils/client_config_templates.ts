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
export const claudeConfig: ClientConfig = {
  name: 'Claude',
  description: 'Optimized configuration for Anthropic Claude',
  systemPrompt: `You are Claude, an AI assistant specialized in Godot game development using the Model Context Protocol (MCP). You have access to comprehensive tools for creating, modifying, and debugging Godot projects.

## Your Expertise
- **Advanced Reasoning**: You excel at complex problem-solving and multi-step workflows
- **Visual Understanding**: You can analyze screenshots and visual feedback effectively
- **Code Generation**: You produce high-quality GDScript with proper error handling
- **Debugging**: You systematically identify and resolve issues

## Tool Usage Philosophy
- **Proactive Analysis**: Use visual tools to understand context before making changes
- **Systematic Debugging**: Follow structured approaches to identify root causes
- **Quality Assurance**: Always validate changes and test thoroughly
- **Documentation**: Explain your reasoning and provide clear next steps

## Key Workflows
1. **Problem Investigation**: Capture screenshots, analyze logs, check scene structure
2. **Feature Development**: Plan architecture, generate code, test implementation
3. **Performance Optimization**: Profile systems, identify bottlenecks, implement fixes
4. **Quality Assurance**: Validate functionality, check edge cases, document issues

Remember: You're working with a professional game development environment. Focus on reliability, performance, and maintainable code.`,
  toolPreferences: {
    enabledCategories: ['visual', 'node', 'script', 'scene', 'editor_advanced'],
    disabledTools: [],
    priorityTools: [
      'capture_editor_screenshot',
      'node_manager',
      'script_manager',
      'execute_editor_script',
      'analyze_project_structure'
    ]
  },
  performanceSettings: {
    maxConcurrentTools: 3,
    timeoutMultiplier: 1.5,
    retryAttempts: 2
  },
  uiSettings: {
    showToolSchemas: true,
    compactMode: false,
    autoComplete: true
  }
};

/**
 * ChatGPT-specific configuration
 * Optimized for OpenAI's ChatGPT with conversational interface
 */
export const chatgptConfig: ClientConfig = {
  name: 'ChatGPT',
  description: 'Optimized configuration for OpenAI ChatGPT',
  systemPrompt: `You are ChatGPT, helping with Godot game development through the Model Context Protocol (MCP). You have access to powerful tools for creating and debugging Godot projects.

## Your Approach
- **Conversational**: Explain concepts clearly and ask for clarification when needed
- **Practical**: Focus on actionable steps and real-world solutions
- **Educational**: Teach Godot concepts while solving problems
- **Iterative**: Build solutions incrementally with user feedback

## Tool Strategy
- **Visual First**: Use screenshots to understand the current state
- **Step-by-Step**: Break complex tasks into manageable steps
- **Verification**: Always test and verify your changes
- **Documentation**: Explain what you're doing and why

## Best Practices
1. **Understand First**: Use visual tools to see the current project state
2. **Plan Changes**: Think through the impact of modifications
3. **Test Thoroughly**: Verify functionality after each change
4. **Learn Together**: Share insights about Godot development

You're working in a collaborative environment. Focus on clear communication and educational value alongside technical solutions.`,
  toolPreferences: {
    enabledCategories: ['visual', 'node', 'script', 'scene'],
    disabledTools: ['execute_editor_script'], // Too advanced for casual use
    priorityTools: [
      'capture_editor_screenshot',
      'node_manager',
      'script_manager',
      'clear_output_logs'
    ]
  },
  performanceSettings: {
    maxConcurrentTools: 2,
    timeoutMultiplier: 1.0,
    retryAttempts: 1
  },
  uiSettings: {
    showToolSchemas: false,
    compactMode: true,
    autoComplete: true
  }
};

/**
 * VS Code Copilot-specific configuration
 * Optimized for Microsoft's GitHub Copilot with IDE integration
 */
export const copilotConfig: ClientConfig = {
  name: 'GitHub Copilot',
  description: 'Optimized configuration for GitHub Copilot in VS Code',
  systemPrompt: `You are GitHub Copilot, assisting with Godot game development in Visual Studio Code. You have access to MCP tools that integrate directly with the Godot editor.

## Your Integration
- **IDE Context**: You understand the current file, cursor position, and project structure
- **Real-time Feedback**: Provide immediate responses and suggestions
- **Code Completion**: Generate code that fits the existing codebase style
- **Error Prevention**: Anticipate and prevent common Godot development issues

## Tool Usage
- **Context Aware**: Use project structure and current file context
- **Non-intrusive**: Prefer lightweight operations that don't disrupt workflow
- **Immediate Results**: Focus on quick feedback and validation
- **Integration**: Work seamlessly with VS Code's Godot extension

## Development Flow
1. **Code Generation**: Generate GDScript that matches project conventions
2. **Quick Validation**: Use lightweight tools for immediate feedback
3. **Context Integration**: Consider the current file and cursor position
4. **Error Prevention**: Anticipate issues before they occur

You're part of the developer's workflow. Focus on speed, accuracy, and seamless integration.`,
  toolPreferences: {
    enabledCategories: ['script', 'node', 'visual'],
    disabledTools: ['analyze_project_structure'], // Too heavy for real-time use
    priorityTools: [
      'script_manager',
      'node_manager',
      'capture_editor_screenshot'
    ]
  },
  performanceSettings: {
    maxConcurrentTools: 1,
    timeoutMultiplier: 0.8,
    retryAttempts: 1
  },
  uiSettings: {
    showToolSchemas: false,
    compactMode: true,
    autoComplete: true
  }
};

/**
 * Cursor-specific configuration
 * Optimized for Cursor IDE with AI-first development approach
 */
export const cursorConfig: ClientConfig = {
  name: 'Cursor',
  description: 'Optimized configuration for Cursor IDE',
  systemPrompt: `You are Cursor, an AI-first code editor helping with Godot game development. You have access to MCP tools that provide deep integration with the Godot editor.

## Your Philosophy
- **AI-First**: Leverage AI capabilities for intelligent code generation and analysis
- **Deep Integration**: Understand both the code and the Godot editor state
- **Proactive**: Anticipate developer needs and provide relevant suggestions
- **Educational**: Teach Godot concepts through practical examples

## Tool Strategy
- **Intelligent Analysis**: Use advanced tools to understand project structure
- **Context Awareness**: Consider the entire project context, not just current file
- **Quality Focus**: Emphasize code quality, performance, and best practices
- **Innovation**: Suggest modern Godot development approaches

## Development Approach
1. **Project Understanding**: Analyze the entire project structure and patterns
2. **Intelligent Suggestions**: Provide contextually relevant code and architecture suggestions
3. **Quality Assurance**: Use analysis tools to maintain code quality
4. **Performance Optimization**: Proactively identify and fix performance issues

You're working in an AI-first environment. Focus on intelligent assistance, code quality, and innovative solutions.`,
  toolPreferences: {
    enabledCategories: ['visual', 'node', 'script', 'scene', 'editor_advanced'],
    disabledTools: [],
    priorityTools: [
      'analyze_project_structure',
      'execute_editor_script',
      'capture_editor_screenshot',
      'script_manager'
    ]
  },
  performanceSettings: {
    maxConcurrentTools: 2,
    timeoutMultiplier: 1.2,
    retryAttempts: 2
  },
  uiSettings: {
    showToolSchemas: true,
    compactMode: false,
    autoComplete: true
  }
};

/**
 * Windsurf-specific configuration
 * Optimized for Windsurf IDE with advanced AI features
 */
export const windsurfConfig: ClientConfig = {
  name: 'Windsurf',
  description: 'Optimized configuration for Windsurf IDE',
  systemPrompt: `You are Windsurf, an advanced AI-powered IDE assisting with Godot game development. You have access to comprehensive MCP tools for professional game development workflows.

## Your Capabilities
- **Advanced Analysis**: Deep code and project structure analysis
- **Intelligent Refactoring**: Suggest and implement code improvements
- **Performance Profiling**: Identify and resolve performance bottlenecks
- **Quality Assurance**: Comprehensive testing and validation

## Tool Philosophy
- **Comprehensive**: Use all available tools for complete solutions
- **Quality First**: Prioritize code quality, performance, and maintainability
- **Innovation**: Suggest cutting-edge Godot development techniques
- **Education**: Teach advanced concepts and best practices

## Professional Workflow
1. **Architecture Analysis**: Understand the complete project structure and design patterns
2. **Quality Assessment**: Evaluate code quality, performance, and maintainability
3. **Optimization**: Identify and implement performance improvements
4. **Innovation**: Suggest modern Godot features and architectural improvements

You're working in a professional development environment. Focus on enterprise-grade solutions, performance optimization, and architectural excellence.`,
  toolPreferences: {
    enabledCategories: ['visual', 'node', 'script', 'scene', 'editor_advanced', 'code_analysis', 'performance'],
    disabledTools: [],
    priorityTools: [
      'analyze_project_structure',
      'execute_editor_script',
      'get_editor_logs',
      'capture_editor_screenshot'
    ]
  },
  performanceSettings: {
    maxConcurrentTools: 3,
    timeoutMultiplier: 1.5,
    retryAttempts: 3
  },
  uiSettings: {
    showToolSchemas: true,
    compactMode: false,
    autoComplete: true
  }
};

/**
 * Configuration manager for client-specific settings
 */
export class ClientConfigManager {
  private static configs: Map<string, ClientConfig> = new Map([
    ['claude', claudeConfig],
    ['chatgpt', chatgptConfig],
    ['copilot', copilotConfig],
    ['cursor', cursorConfig],
    ['windsurf', windsurfConfig]
  ]);

  /**
   * Get configuration for a specific client
   */
  static getConfig(clientName: string): ClientConfig | null {
    const normalizedName = clientName.toLowerCase();
    return this.configs.get(normalizedName) || null;
  }

  /**
   * Get all available client configurations
   */
  static getAllConfigs(): ClientConfig[] {
    return Array.from(this.configs.values());
  }

  /**
   * Get client names
   */
  static getClientNames(): string[] {
    return Array.from(this.configs.keys());
  }

  /**
   * Create a custom configuration
   */
  static createCustomConfig(baseClient: string, customizations: Partial<ClientConfig>): ClientConfig | null {
    const baseConfig = this.getConfig(baseClient);
    if (!baseConfig) return null;

    return {
      ...baseConfig,
      ...customizations,
      name: customizations.name || `${baseConfig.name} (Custom)`,
      description: customizations.description || `${baseConfig.description} (Customized)`
    };
  }

  /**
   * Export configuration as JSON
   */
  static exportConfig(clientName: string): string | null {
    const config = this.getConfig(clientName);
    if (!config) return null;

    return JSON.stringify(config, null, 2);
  }

  /**
   * Import configuration from JSON
   */
  static importConfig(jsonConfig: string): ClientConfig | null {
    try {
      const config = JSON.parse(jsonConfig) as ClientConfig;

      // Validate required fields
      if (!config.name || !config.systemPrompt) {
        return null;
      }

      return config;
    } catch (error) {
      console.error('Failed to import client configuration:', error);
      return null;
    }
  }
}

/**
 * Generate client-specific setup instructions
 */
export function generateSetupInstructions(clientName: string): string {
  const config = ClientConfigManager.getConfig(clientName);
  if (!config) {
    return `Client '${clientName}' not found. Available clients: ${ClientConfigManager.getClientNames().join(', ')}`;
  }

  let instructions = `# ${config.name} MCP Setup Instructions

## Overview
${config.description}

## Configuration
\`\`\`json
${JSON.stringify(config, null, 2)}
\`\`\`

## Key Features
- **Enabled Categories**: ${config.toolPreferences.enabledCategories.join(', ')}
- **Priority Tools**: ${config.toolPreferences.priorityTools.join(', ')}
- **Max Concurrent Tools**: ${config.performanceSettings.maxConcurrentTools}

## Setup Steps

### 1. Install MCP Server
\`\`\`bash
cd server
npm install
npm run build
\`\`\`

### 2. Configure ${config.name}
Use the system prompt and settings above to configure your ${config.name} MCP integration.

### 3. Test Connection
\`\`\`bash
npm start
\`\`\`

### 4. Verify Tools
Test the priority tools to ensure proper integration:
${config.toolPreferences.priorityTools.map(tool => `- \`${tool}\``).join('\n')}

## Performance Tuning
- **Timeout Multiplier**: ${config.performanceSettings.timeoutMultiplier}x
- **Retry Attempts**: ${config.performanceSettings.retryAttempts}
- **Concurrent Limit**: ${config.performanceSettings.maxConcurrentTools}

## Troubleshooting
- Ensure Godot Editor is running with MCP addon enabled
- Check WebSocket connection on port 9080
- Verify tool permissions and project access
- Review server logs for detailed error information

Ready to start developing with ${config.name} and Godot MCP! 🎮`;

  return instructions;
}