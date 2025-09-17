# Developer Guide

This guide provides comprehensive information for developers who want to contribute to, extend, or maintain the Godot MCP Server codebase.

## Table of Contents

- [Getting Started](#getting-started)
- [Development Environment](#development-environment)
- [Project Structure](#project-structure)
- [Adding New Tools](#adding-new-tools)
- [Extending Godot Integration](#extending-godot-integration)
- [Testing](#testing)
- [Code Quality](#code-quality)
- [Performance Optimization](#performance-optimization)
- [Debugging](#debugging)
- [Contributing](#contributing)
- [Release Process](#release-process)

## Getting Started

### Prerequisites

Before contributing, ensure you have:

- **Node.js 18+** with npm
- **Godot 4.4+**
- **TypeScript 5.0+**
- **Git** for version control
- **VS Code** (recommended) with extensions:
  - TypeScript and JavaScript Language Features
  - Godot Tools
  - Prettier
  - ESLint

### Fork and Clone

```bash
# Fork the repository on GitHub
# Then clone your fork
git clone https://github.com/your-username/godot-mcp-nxt.git
cd godot-mcp-nxt

# Add upstream remote
git remote add upstream https://github.com/original-repo/godot-mcp-nxt.git

# Create development branch
git checkout -b feature/your-feature-name
```

### Initial Setup

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Run tests to ensure everything works
npm test

# Start development server
npm run dev
```

## Development Environment

### Recommended VS Code Configuration

Create `.vscode/settings.json`:

```json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "typescript.suggest.autoImports": true,
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "godot_tools.editor_path": "/path/to/godot/executable",
  "files.associations": {
    "*.gd": "godot",
    "*.tscn": "godot",
    "*.tres": "godot"
  }
}
```

### Environment Variables

Create `.env` file for development:

```bash
# Development configuration
MCP_PORT=9080
MCP_DEBUG=true
MCP_LOG_LEVEL=debug

# Godot paths (adjust to your system)
GODOT_PROJECT_PATH=/path/to/your/test/project
GODOT_EXECUTABLE=/Applications/Godot.app/Contents/MacOS/Godot

# Development features
ENABLE_HOT_RELOAD=true
ENABLE_DETAILED_LOGGING=true
ENABLE_PERFORMANCE_MONITORING=true
```

### Development Scripts

Key npm scripts for development:

```json
{
  "scripts": {
    "build": "tsc",
    "dev": "nodemon --watch src --exec \"tsc && node dist/index.js\"",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "lint": "eslint src/**/*.ts",
    "lint:fix": "eslint src/**/*.ts --fix",
    "format": "prettier --write src/**/*.ts",
    "type-check": "tsc --noEmit",
    "clean": "rm -rf dist coverage"
  }
}
```

## Project Structure

### Overall Architecture

```
godot-mcp-nxt/
├── server/                    # MCP Server (TypeScript)
│   ├── src/
│   │   ├── index.ts          # Main server entry point
│   │   ├── tools/            # MCP tool implementations
│   │   │   ├── node_tools.ts         # Node management
│   │   │   ├── script_tools.ts       # Script operations
│   │   │   ├── scene_tools.ts        # Scene management
│   │   │   ├── performance_tools.ts  # Performance monitoring
│   │   │   ├── error_recovery_tools.ts # Error handling
│   │   │   └── prompt_enhancement_tools.ts # AI assistance
│   │   ├── utils/            # Utility functions
│   │   │   ├── godot_connection.ts   # WebSocket connection
│   │   │   ├── enhanced_error_handler.ts # Error analysis
│   │   │   ├── dynamic_prompt_manager.ts # Prompt enhancement
│   │   │   ├── cache.ts              # Caching system
│   │   │   ├── retry.ts              # Retry logic
│   │   │   └── types.ts              # Type definitions
│   │   ├── resources/        # MCP resource definitions
│   │   └── tests/            # Test files
│   └── dist/                 # Compiled JavaScript
├── addons/
│   └── godot_mcp/            # Godot Editor Addon
│       ├── mcp_server.gd    # WebSocket server
│       ├── command_handler.gd # Command routing
│       ├── commands/         # Command processors
│       │   ├── base_command_processor.gd
│       │   ├── node_commands.gd
│       │   ├── script_commands.gd
│       │   ├── scene_commands.gd
│       │   └── advanced_commands.gd
│       ├── ui/               # Editor UI components
│       │   ├── mcp_panel.gd
│       │   ├── mcp_panel.tscn
│       │   ├── performance_monitor.gd
│       │   └── performance_monitor.tscn
│       └── utils/            # Utility scripts
│           ├── node_utils.gd
│           ├── resource_utils.gd
│           └── script_utils.gd
├── scenes/                   # Example Godot scenes
├── scripts/                  # Example GDScript files
├── docs/                     # Documentation
└── package.json              # Node.js configuration
```

### Key Design Patterns

#### 1. Tool Registry Pattern

```typescript
// server/src/utils/tool_registry.ts
export class ToolRegistry {
  private tools = new Map<string, MCPTool>();

  registerTool(tool: MCPTool, category: string): void {
    this.tools.set(tool.name, tool);
    // Register with category for organization
  }

  getTool(name: string): MCPTool | undefined {
    return this.tools.get(name);
  }

  getToolsByCategory(category: string): MCPTool[] {
    return Array.from(this.tools.values())
      .filter(tool => tool.category === category);
  }
}
```

#### 2. Command Processor Pattern

```gdscript
# addons/godot_mcp/commands/base_command_processor.gd
class_name MCPBaseCommandProcessor
extends Node

func process_command(client_id: int, command_type: String, params: Dictionary, command_id: String) -> bool:
  # Override in subclasses
  return false

func _send_success(client_id: int, result: Dictionary, command_id: String) -> void:
  # Standardized response format
  pass

func _send_error(client_id: int, message: String, command_id: String) -> void:
  # Standardized error format
  pass
```

#### 3. Connection Pool Pattern

```typescript
// server/src/utils/godot_connection.ts
export class ConnectionPool {
  private connections = new Map<string, GodotConnection>();

  async getConnection(projectPath: string): Promise<GodotConnection> {
    if (!this.connections.has(projectPath)) {
      const connection = new GodotConnection(projectPath);
      await connection.connect();
      this.connections.set(projectPath, connection);
    }
    return this.connections.get(projectPath)!;
  }
}
```

## Adding New Tools

### 1. Create Tool Implementation

```typescript
// server/src/tools/my_custom_tool.ts
import { z } from 'zod';
import { getGodotConnection } from '../utils/godot_connection.js';
import { MCPTool } from '../utils/types.js';

export const myCustomTool: MCPTool = {
  name: 'my_custom_tool',
  description: 'Description of what this tool does',
  parameters: z.object({
    param1: z.string().describe('Description of param1'),
    param2: z.number().optional().describe('Description of param2')
  }),
  execute: async (params: any): Promise<any> => {
    const godot = getGodotConnection();

    try {
      // Tool implementation
      const result = await godot.sendCommand('my_custom_command', params);
      return {
        status: 'success',
        result: result
      };
    } catch (error) {
      throw new Error(`Custom tool failed: ${(error as Error).message}`);
    }
  }
};
```

### 2. Register Tool

```typescript
// server/src/index.ts
import { myCustomTool } from './tools/my_custom_tool.js';

// In the tool registration section
const toolCategories = [
  // ... existing categories
  { name: 'custom', tools: [myCustomTool] }
];
```

### 3. Add Godot Command Handler (if needed)

```gdscript
# addons/godot_mcp/commands/custom_commands.gd
class_name MCPCustomCommands
extends MCPBaseCommandProcessor

func process_command(client_id: int, command_type: String, params: Dictionary, command_id: String) -> bool:
  match command_type:
    "my_custom_command":
      _handle_custom_command(client_id, params, command_id)
      return true
  return false

func _handle_custom_command(client_id: int, params: Dictionary, command_id: String) -> void:
  # Implement command logic
  var result = { "message": "Custom command executed" }
  _send_success(client_id, result, command_id)
```

### 4. Add Tests

```typescript
// server/src/tools/my_custom_tool.test.ts
import { myCustomTool } from './my_custom_tool.js';

describe('My Custom Tool', () => {
  it('should execute successfully', async () => {
    const result = await myCustomTool.execute({
      param1: 'test',
      param2: 42
    });

    expect(result.status).toBe('success');
    expect(result.result).toBeDefined();
  });

  it('should handle errors gracefully', async () => {
    await expect(myCustomTool.execute({
      param1: '', // Invalid parameter
    })).rejects.toThrow();
  });
});
```

## Extending Godot Integration

### Adding New Command Types

1. **Define command interface** in TypeScript
2. **Implement command processor** in GDScript
3. **Register processor** in command handler
4. **Add validation** and error handling

### UI Extensions

```gdscript
# addons/godot_mcp/ui/my_custom_panel.gd
@tool
extends Panel

func _ready():
  _setup_ui()
  _connect_signals()

func _setup_ui():
  # Create custom UI elements
  var button = Button.new()
  button.text = "My Custom Action"
  button.connect("pressed", Callable(self, "_on_custom_action"))
  add_child(button)

func _on_custom_action():
  # Handle custom action
  print("Custom action triggered")
```

### Performance Monitoring Extensions

```typescript
// server/src/utils/custom_performance_monitor.ts
export class CustomPerformanceMonitor {
  private metrics = new Map<string, number>();

  recordCustomMetric(name: string, value: number): void {
    this.metrics.set(name, value);

    // Check thresholds
    if (this.shouldAlert(name, value)) {
      this.triggerAlert(name, value);
    }
  }

  private shouldAlert(name: string, value: number): boolean {
    const threshold = this.getThreshold(name);
    return value > threshold;
  }

  private triggerAlert(name: string, value: number): void {
    // Send alert through MCP system
    console.warn(`Performance alert: ${name} = ${value}`);
  }
}
```

## Testing

### Unit Tests

```typescript
// server/src/tools/node_tools.test.ts
import { nodeTools } from './node_tools.js';
import { jest } from '@jest/globals';

describe('Node Tools', () => {
  let mockGodotConnection: any;

  beforeEach(() => {
    mockGodotConnection = {
      sendCommand: jest.fn()
    };
    // Mock the connection
  });

  describe('create node', () => {
    it('should create node successfully', async () => {
      mockGodotConnection.sendCommand.mockResolvedValue({
        node_path: '/root/TestNode'
      });

      const createTool = nodeTools.find(t => t.name === 'node_manager');
      const result = await createTool!.execute({
        operation: 'create',
        node_path: '/root',
        node_type: 'Node2D',
        node_name: 'TestNode'
      });

      expect(result.status).toBe('success');
      expect(result.result.node_path).toBe('/root/TestNode');
    });
  });
});
```

### Integration Tests

```typescript
// server/src/tests/integration.test.ts
describe('MCP Server Integration', () => {
  let server: FastMCP;
  let godotConnection: GodotConnection;

  beforeAll(async () => {
    // Start MCP server
    server = new FastMCP({ name: 'TestMCP' });

    // Connect to Godot
    godotConnection = new GodotConnection();
    await godotConnection.connect();
  });

  afterAll(async () => {
    await godotConnection.disconnect();
  });

  it('should handle node creation end-to-end', async () => {
    // Test complete workflow from MCP client to Godot
    const result = await server.processRequest({
      method: 'node_manager',
      params: {
        operation: 'create',
        node_path: '/root',
        node_type: 'Node2D',
        node_name: 'IntegrationTest'
      }
    });

    expect(result.success).toBe(true);
    expect(result.node_path).toContain('IntegrationTest');
  });
});
```

### Godot Addon Tests

```gdscript
# addons/godot_mcp/tests/test_node_commands.gd
extends GutTest

func test_create_node():
  var processor = MCPNodeCommands.new()
  var params = {
    "parent_path": "/root",
    "node_type": "Node2D",
    "node_name": "TestNode"
  }

  var result = processor.process_command(1, "create_node", params, "test_123")
  assert_true(result, "Node creation should succeed")

  # Verify node was created
  var test_node = get_node_or_null("/root/TestNode")
  assert_not_null(test_node, "Test node should exist")
```

## Code Quality

### TypeScript Best Practices

```typescript
// ✅ Good: Use interfaces for complex objects
interface NodeCreationParams {
  parent_path: string;
  node_type: string;
  node_name: string;
  position?: Vector2;
}

// ✅ Good: Use union types for constrained values
type NodeType = 'Node2D' | 'Sprite2D' | 'CharacterBody2D' | 'Area2D';

// ✅ Good: Use generics for type safety
async function sendCommand<T>(type: string, params: any): Promise<T> {
  // Implementation
}

// ❌ Bad: Avoid any types when possible
function processData(data: any): any {
  return data;
}
```

### GDScript Best Practices

```gdscript
# ✅ Good: Use type hints
func create_node(parent: Node, type: String, name: String) -> Node:
  var node = ClassDB.instantiate(type)
  node.name = name
  parent.add_child(node)
  return node

# ✅ Good: Use signals for communication
signal node_created(node: Node)
signal node_deleted(node_path: String)

# ✅ Good: Proper error handling
func validate_node_path(path: String) -> bool:
  if path.is_empty():
    push_error("Node path cannot be empty")
    return false
  return true
```

### Code Style

#### TypeScript
```json
// .eslintrc.json
{
  "extends": [
    "@typescript-eslint/recommended",
    "prettier"
  ],
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/explicit-function-return-type": "warn",
    "@typescript-eslint/no-explicit-any": "warn"
  }
}
```

#### GDScript
```gdscript
# Use consistent naming
const MAX_NODES = 1000
var node_count := 0

# Use signals for events
signal nodes_updated(count: int)

# Document complex functions
## Creates a new node with the specified parameters
## Returns the created node or null if creation failed
func create_node(type: String, name: String, parent: Node) -> Node:
```

## Performance Optimization

### Server-Side Optimizations

```typescript
// Use connection pooling
const connectionPool = new ConnectionPool();
const connection = await connectionPool.getConnection(projectPath);

// Implement caching
const cache = new CacheManager();
const cached = await cache.get(`node_${nodePath}`);
if (cached) return cached;

// Use streaming for large responses
const stream = new ReadableStream({
  start(controller) {
    // Stream processing logic
  }
});
```

### Godot-Side Optimizations

```gdscript
# Use deferred operations for heavy processing
func _process_heavy_operation():
  await get_tree().process_frame
  # Heavy operation here

# Pool reusable objects
var node_pool: Array[Node] = []

func get_pooled_node(type: String) -> Node:
  if node_pool.is_empty():
    return ClassDB.instantiate(type)
  return node_pool.pop_back()

func return_to_pool(node: Node):
  node_pool.append(node)
```

### Memory Management

```typescript
// Proper cleanup
class ResourceManager {
  private resources = new Set<Disposable>();

  add(resource: Disposable): void {
    this.resources.add(resource);
  }

  dispose(): void {
    for (const resource of this.resources) {
      resource.dispose();
    }
    this.resources.clear();
  }
}
```

## Debugging

### Server Debugging

```typescript
// Enable debug logging
const logger = new Logger({
  level: 'debug',
  transports: [
    new ConsoleTransport(),
    new FileTransport('logs/debug.log')
  ]
});

// Add debug breakpoints
await godot.sendCommand('debug_breakpoint', {
  file: 'res://player.gd',
  line: 42
});
```

### Godot Debugging

```gdscript
# Debug prints
func _debug_node_hierarchy(node: Node, depth: int = 0):
  var indent = "  ".repeat(depth)
  print("%s%s (%s)" % [indent, node.name, node.get_class()])

  for child in node.get_children():
    _debug_node_hierarchy(child, depth + 1)

# Performance debugging
func _debug_performance():
  var fps = Performance.get_monitor(Performance.TIME_FPS)
  var memory = Performance.get_monitor(Performance.MEMORY_STATIC)
  print("FPS: %.1f, Memory: %.1f MB" % [fps, memory / 1024 / 1024])
```

### Network Debugging

```bash
# Monitor WebSocket traffic
npm install -g wscat
wscat -c ws://localhost:9080

# Check network connectivity
telnet localhost 9080

# Monitor system resources
top -p $(pgrep -f "godot")
```

## Contributing

### Pull Request Process

1. **Create feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make changes and add tests**
   ```bash
   # Implement feature
   npm run build
   npm test
   ```

3. **Update documentation**
   ```bash
   # Update relevant docs
   # Add examples if needed
   ```

4. **Commit with clear message**
   ```bash
   git commit -m "feat: add new MCP tool for XYZ

   - Implements XYZ functionality
   - Adds comprehensive tests
   - Updates documentation
   - Follows established patterns"
   ```

5. **Create pull request**
   - Use PR template
   - Reference related issues
   - Request review from maintainers

### Code Review Guidelines

**Reviewers should check:**
- Code follows established patterns
- Tests are comprehensive and passing
- Documentation is updated
- Performance implications are considered
- Security concerns are addressed

**Contributors should:**
- Respond to review comments promptly
- Make requested changes
- Rebase and squash commits when appropriate
- Test thoroughly before requesting re-review

## Release Process

### Version Management

```bash
# Update version
npm version patch  # For bug fixes
npm version minor  # For new features
npm version major  # For breaking changes

# Build and test
npm run build
npm test

# Create release
git tag v$(node -p "require('./package.json').version")
git push origin --tags
```

### Release Checklist

- [ ] All tests passing
- [ ] Documentation updated
- [ ] Changelog updated
- [ ] Version bumped appropriately
- [ ] Breaking changes documented
- [ ] Release notes written
- [ ] CI/CD pipeline passing
- [ ] Manual testing completed

### Deployment

```bash
# Build production assets
npm run build:production

# Create release archive
tar -czf godot-mcp-v$(npm pkg get version | tr -d '"').tar.gz \
  server/dist/ \
  addons/godot_mcp/ \
  docs/ \
  package.json \
  README.md

# Upload to release
gh release create v$(npm pkg get version | tr -d '"') \
  --title "Godot MCP v$(npm pkg get version | tr -d '"')" \
  --notes-file RELEASE_NOTES.md \
  godot-mcp-v$(npm pkg get version | tr -d '"').tar.gz
```

## Support and Resources

### Getting Help

- **GitHub Issues**: For bug reports and feature requests
- **GitHub Discussions**: For questions and community support
- **Documentation**: Comprehensive guides and API reference
- **Discord**: Real-time community chat

### Development Resources

- **TypeScript Handbook**: [typescriptlang.org/docs](https://www.typescriptlang.org/docs/)
- **Godot Documentation**: [docs.godotengine.org](https://docs.godotengine.org/)
- **MCP Specification**: [modelcontextprotocol.io](https://modelcontextprotocol.io/)
- **Node.js Best Practices**: [github.com/goldbergyoni/nodebestpractices](https://github.com/goldbergyoni/nodebestpractices)

### Development Tools

- **VS Code Extensions**:
  - TypeScript Importer
  - Godot Tools
  - Prettier
  - ESLint
  - GitLens

- **Testing Tools**:
  - Jest for unit tests
  - Supertest for API testing
  - Artillery for load testing

- **Performance Tools**:
  - Chrome DevTools for Node.js profiling
  - Godot's built-in profiler
  - Clinic.js for performance analysis

This developer guide provides the foundation for contributing to the Godot MCP Server. Remember to always follow the established patterns, write comprehensive tests, and update documentation when making changes.