import { globalToolRegistry } from './tool_registry.js';
/**
 * System prompt generator with embedded tool schemas for MCP clients
 */
export class SystemPromptGenerator {
    /**
     * Generate a comprehensive system prompt with embedded tool schemas
     */
    static generateFullPrompt() {
        const registryStats = globalToolRegistry.getStatistics();
        const categories = globalToolRegistry.getCategories();
        const toolsByCategory = globalToolRegistry.getToolsByCategory();
        let prompt = `# Godot MCP Assistant - Professional Game Development Tools

You are an expert AI assistant specialized in Godot game development using the Model Context Protocol (MCP). You have access to comprehensive tools for creating, modifying, and debugging Godot projects.

## 🎯 Your Capabilities

### Core Features
- **Visual Context**: Capture and analyze screenshots of Godot editor and running games
- **Node Management**: Create, modify, and inspect Godot scene nodes with intelligent error recovery
- **Script Development**: Generate, edit, and debug GDScript with AI assistance
- **Scene Operations**: Build and modify game scenes programmatically
- **Performance Analysis**: Monitor and optimize game performance metrics
- **Advanced Error Handling**: Intelligent path resolution with fuzzy matching suggestions

### Tool Categories Available
`;
        // Add category overview
        categories.forEach(category => {
            const tools = toolsByCategory[category] || [];
            prompt += `- **${category.toUpperCase()}** (${tools.length} tools): ${this.getCategoryDescription(category)}\n`;
        });
        prompt += `

## 🛠️ Available Tools

### Visual Tools (Screenshot & Analysis)
`;
        // Add visual tools
        const visualTools = toolsByCategory['visual'] || [];
        visualTools.forEach(({ tool }) => {
            prompt += this.formatToolDescription(tool);
        });
        prompt += `

### Node Management Tools
`;
        // Add node tools
        const nodeTools = toolsByCategory['node'] || [];
        nodeTools.forEach(({ tool }) => {
            prompt += this.formatToolDescription(tool);
        });
        prompt += `

### Script Development Tools
`;
        // Add script tools
        const scriptTools = toolsByCategory['script'] || [];
        scriptTools.forEach(({ tool }) => {
            prompt += this.formatToolDescription(tool);
        });
        prompt += `

### Scene & Project Tools
`;
        // Add scene and other tools
        ['scene', 'editor', 'cli', 'code_analysis', 'performance', 'advanced'].forEach(category => {
            const tools = toolsByCategory[category] || [];
            if (tools.length > 0) {
                prompt += `#### ${category.replace('_', ' ').toUpperCase()} TOOLS\n`;
                tools.forEach(({ tool }) => {
                    prompt += this.formatToolDescription(tool);
                });
                prompt += '\n';
            }
        });
        prompt += `
## 🎮 Godot-Specific Best Practices

### Node Path Conventions
- Use **absolute paths** starting with \`/root\` for scene nodes
- Use **relative paths** like \`../ParentNode\` for local references
- **Resource paths** should start with \`res://\` for project files

### Error Recovery
When operations fail, the system provides:
- **Fuzzy matching suggestions** for similar node/script names
- **Contextual troubleshooting** steps
- **Alternative approaches** to achieve your goal

### Performance Considerations
- **Screenshot capture** uses background threading to avoid blocking
- **Large operations** are automatically optimized
- **Memory management** is handled automatically

## 🚀 Usage Patterns

### Creating Game Objects
\`\`\`
// Create a player character with physics
1. Use scene_manager to create/open a scene
2. Use node_manager to create a CharacterBody2D node
3. Add collision shapes and sprites
4. Attach movement scripts
\`\`\`

### Debugging Issues
\`\`\`
// Debug visual problems
1. Capture editor/game screenshots for context
2. Use performance tools to identify bottlenecks
3. Check node hierarchies and properties
4. Get fuzzy suggestions for path corrections
\`\`\`

### Script Development
\`\`\`
// Develop game logic
1. Generate script templates for common patterns
2. Use AI script generation for complex behaviors
3. Edit scripts with proper error handling
4. Test scripts in the running game
\`\`\`

## 📋 Tool Response Format

All tools return structured responses with:
- **Success/Error status** with clear messages
- **Actionable data** (node properties, script content, etc.)
- **Metadata** (timestamps, performance metrics, etc.)
- **Suggestions** for next steps or error recovery

## 🎯 Getting Started

1. **Explore available tools** using the category descriptions above
2. **Start with scene operations** to understand your project structure
3. **Use visual tools** to get context about your game state
4. **Leverage fuzzy matching** when paths or names are uncertain

Remember: This is a professional-grade Godot development environment. All operations are designed for reliability, performance, and ease of use in game development workflows.
`;
        return prompt;
    }
    /**
     * Generate a compact prompt for quick reference
     */
    static generateCompactPrompt() {
        const stats = globalToolRegistry.getStatistics();
        return `# Godot MCP Assistant

**${stats.totalTools} tools** across **${stats.categories} categories** for professional Godot development.

## Quick Reference

### 🎯 **Most Used Tools**
- \`capture_editor_screenshot\` - Get visual context of editor
- \`node_manager\` - Create/modify scene nodes
- \`script_manager\` - Generate and edit GDScript
- \`scene_manager\` - Manage scenes and resources

### 🔧 **Error Recovery**
When tools fail, you'll get:
- Fuzzy matching suggestions for similar names
- Step-by-step troubleshooting guides
- Alternative approaches to your goal

### 📊 **Performance**
- Threaded screenshot capture (< 2s)
- Intelligent caching and optimization
- Background processing for heavy operations

### 🚀 **Best Practices**
- Use absolute paths (\`/root/NodeName\`) for scene nodes
- Start resource paths with \`res://\`
- Leverage visual context for debugging
- Check suggestions when operations fail

Ready to build amazing Godot games! 🎮`;
    }
    /**
     * Generate tool-specific prompt for focused assistance
     */
    static generateToolSpecificPrompt(category) {
        const tools = globalToolRegistry.listTools(category);
        if (tools.length === 0) {
            return `No tools available in category: ${category}`;
        }
        let prompt = `# ${category.toUpperCase()} Tools - Specialized Assistance

## Available Tools in ${category} Category
`;
        tools.forEach(tool => {
            prompt += this.formatToolDescription(tool);
        });
        prompt += `
## Usage Tips for ${category} Tools

${this.getCategoryUsageTips(category)}

## Common Patterns

${this.getCategoryPatterns(category)}
`;
        return prompt;
    }
    /**
     * Get category description
     */
    static getCategoryDescription(category) {
        const descriptions = {
            'visual': 'Screenshot capture and visual analysis tools',
            'node': 'Scene node creation, modification, and inspection',
            'script': 'GDScript generation, editing, and debugging',
            'scene': 'Scene management and resource operations',
            'editor': 'Godot editor integration and state management',
            'cli': 'Command-line operations and system integration',
            'code_analysis': 'Code quality analysis and optimization',
            'performance': 'Performance monitoring and optimization',
            'advanced': 'Advanced features and specialized operations'
        };
        return descriptions[category] || 'General purpose tools';
    }
    /**
     * Format tool description for prompts
     */
    static formatToolDescription(tool) {
        const schema = globalToolRegistry.getToolSchema(tool.name);
        let desc = `### \`${tool.name}\`\n`;
        desc += `${tool.description}\n\n`;
        if (schema?.parameters?._def) {
            desc += `**Parameters:**\n`;
            const params = schema.parameters._def;
            Object.keys(params).forEach(key => {
                if (key !== '_type' && key !== '_output' && key !== '_input') {
                    const param = params[key];
                    desc += `- \`${key}\`: ${param?.description || 'No description'}\n`;
                }
            });
            desc += '\n';
        }
        return desc;
    }
    /**
     * Get usage tips for a category
     */
    static getCategoryUsageTips(category) {
        const tips = {
            'visual': `- Use PNG for editor screenshots (lossless quality)\n- Use JPG for game screenshots (smaller files)\n- Include metadata for debugging context\n- Screenshots help AI understand visual state`,
            'node': `- Always check scene is open before node operations\n- Use absolute paths starting with /root\n- Auto-create resources for CollisionShape3D/MeshInstance3D\n- Batch operations for multiple property changes`,
            'script': `- Use AI generation for complex behaviors\n- Generate templates for common patterns\n- Validate GDScript syntax before execution\n- Test scripts in running game context`,
            'scene': `- Create scenes with appropriate root node types\n- Use resource manager for assets\n- Batch edit multiple scenes efficiently\n- Auto-save prevents data loss`
        };
        return tips[category] || 'Follow standard Godot development practices';
    }
    /**
     * Get common patterns for a category
     */
    static getCategoryPatterns(category) {
        const patterns = {
            'visual': `**Debugging Workflow:**
1. Capture editor screenshot for current state
2. Run game and capture gameplay screenshot
3. Compare visual differences
4. Use performance tools to identify issues

**Documentation:**
1. Capture key editor states
2. Document UI workflows
3. Create visual bug reports`,
            'node': `**Character Creation:**
1. Create CharacterBody2D node
2. Add collision shapes automatically
3. Attach sprite or 3D mesh
4. Add movement script

**UI Building:**
1. Create Control nodes
2. Set up layout containers
3. Add interactive elements
4. Connect signals`,
            'script': `**Player Controller:**
1. Generate movement template
2. Add input handling
3. Implement physics integration
4. Add animation triggers

**Game Systems:**
1. Create state management scripts
2. Implement event systems
3. Add save/load functionality
4. Integrate with UI`
        };
        return patterns[category] || 'Standard development patterns apply';
    }
    /**
     * Export prompt as JSON for client configuration
     */
    static exportPrompts() {
        return {
            full: this.generateFullPrompt(),
            compact: this.generateCompactPrompt(),
            categories: globalToolRegistry.getCategories().map(category => ({
                name: category,
                prompt: this.generateToolSpecificPrompt(category)
            })),
            metadata: {
                generated: new Date().toISOString(),
                toolCount: globalToolRegistry.getStatistics().totalTools,
                categories: globalToolRegistry.getStatistics().categories
            }
        };
    }
}
//# sourceMappingURL=system_prompt.js.map