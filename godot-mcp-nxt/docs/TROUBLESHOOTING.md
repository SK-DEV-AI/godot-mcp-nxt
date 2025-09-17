# Troubleshooting Guide

This guide helps you diagnose and resolve common issues with the Godot MCP Server.

## Table of Contents

- [Quick Diagnosis](#quick-diagnosis)
- [Connection Issues](#connection-issues)
- [Performance Problems](#performance-problems)
- [Error Recovery Issues](#error-recovery-issues)
- [Godot Integration Problems](#godot-integration-problems)
- [MCP Client Issues](#mcp-client-issues)
- [Build and Development Issues](#build-and-development-issues)
- [Advanced Debugging](#advanced-debugging)
- [Getting Help](#getting-help)

## Quick Diagnosis

### Health Check Script

Run this quick diagnostic script:

```bash
#!/bin/bash
echo "=== Godot MCP Server Health Check ==="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version $NODE_VERSION is too old. Need 18+."
    exit 1
fi
echo "✅ Node.js version: $(node --version)"

# Check if Godot is accessible
if ! command -v godot &> /dev/null && [ ! -f "/Applications/Godot.app/Contents/MacOS/Godot" ]; then
    echo "⚠️  Godot executable not found in PATH. Make sure Godot is installed."
else
    echo "✅ Godot found"
fi

# Check if port 9080 is available
if lsof -Pi :9080 -sTCP:LISTEN -t >/dev/null ; then
    echo "❌ Port 9080 is already in use"
    lsof -i :9080
else
    echo "✅ Port 9080 is available"
fi

# Check project structure
if [ -f "package.json" ] && [ -d "server/src" ] && [ -d "addons/godot_mcp" ]; then
    echo "✅ Project structure looks good"
else
    echo "❌ Project structure incomplete"
fi

echo "=== Health Check Complete ==="
```

### System Information

Gather system information for debugging:

```bash
# System info
uname -a
echo "Node.js: $(node --version)"
echo "npm: $(npm --version)"
echo "Godot: $(godot --version 2>/dev/null || echo 'Not in PATH')"

# Network info
netstat -tlnp | grep 9080 || echo "Port 9080 not listening"
ps aux | grep -E "(godot|mcp)" | grep -v grep
```

## Connection Issues

### WebSocket Connection Failed

**Symptoms:**
- "Connection timeout" errors
- "WebSocket connection failed" messages
- MCP clients can't connect to server

**Solutions:**

1. **Check if MCP server is running:**
   ```bash
   # Start the server
   npm start

   # Check if it's listening on port 9080
   netstat -tlnp | grep 9080
   ```

2. **Verify port availability:**
   ```bash
   # Find what's using port 9080
   lsof -i :9080

   # Kill conflicting process
   kill -9 <PID>
   ```

3. **Check firewall settings:**
   ```bash
   # Linux
   sudo ufw status
   sudo ufw allow 9080

   # macOS
   sudo pfctl -s
   ```

4. **Test WebSocket connection:**
   ```bash
   # Install WebSocket client for testing
   npm install -g wscat
   wscat -c ws://localhost:9080
   ```

### Godot Addon Connection Issues

**Symptoms:**
- Godot console shows connection errors
- MCP Panel shows "Disconnected" status
- Commands fail with "No connection" errors

**Solutions:**

1. **Verify addon is enabled:**
   ```
   Godot → Project → Project Settings → Plugins
   Find "Godot MCP" → Check "Enable"
   Restart Godot
   ```

2. **Check Godot console for errors:**
   ```
   Godot → Editor → Editor Log
   Look for MCP-related messages
   ```

3. **Verify addon files:**
   ```bash
   ls -la addons/godot_mcp/
   # Should contain: mcp_server.gd, command_handler.gd, plugin.cfg
   ```

4. **Check Godot version compatibility:**
   ```bash
   godot --version
   # Should be 4.4 or later
   ```

## Performance Problems

### High CPU Usage

**Symptoms:**
- MCP server uses excessive CPU
- Godot editor becomes unresponsive
- Performance monitoring shows high CPU usage

**Solutions:**

1. **Reduce monitoring frequency:**
   ```bash
   export PERFORMANCE_UPDATE_INTERVAL=2000
   ```

2. **Disable detailed logging:**
   ```bash
   export MCP_LOG_LEVEL=warn
   ```

3. **Limit concurrent connections:**
   ```typescript
   // server/src/utils/godot_connection.ts
   export class GodotConnection {
     private maxRetries = 2; // Reduce from 3
     private timeout = 15000; // Reduce from 20000
   }
   ```

4. **Profile the application:**
   ```bash
   # Use clinic.js for Node.js profiling
   npm install -g clinic
   clinic doctor -- node dist/index.js
   ```

### Memory Leaks

**Symptoms:**
- Memory usage continuously increases
- Out of memory errors
- Performance degrades over time

**Solutions:**

1. **Check for connection leaks:**
   ```typescript
   // server/src/utils/godot_connection.ts
   export class GodotConnection {
     disconnect(): void {
       if (this.ws) {
         this.ws.close();
         this.ws = null;
       }
       this.commandQueue.clear(); // Clear pending commands
     }
   }
   ```

2. **Implement connection pooling limits:**
   ```typescript
   export class ConnectionPool {
     private maxConnections = 5; // Limit concurrent connections

     async getConnection(projectPath: string): Promise<GodotConnection> {
       if (this.connections.size >= this.maxConnections) {
         throw new Error('Connection limit reached');
       }
       // ... rest of implementation
     }
   }
   ```

3. **Monitor memory usage:**
   ```bash
   # Monitor Node.js memory
   node --expose-gc --inspect dist/index.js

   # In Chrome DevTools, go to Memory tab
   # Take heap snapshots to identify leaks
   ```

### Slow Response Times

**Symptoms:**
- MCP commands take long to execute
- Godot operations are slow
- UI becomes unresponsive

**Solutions:**

1. **Enable caching:**
   ```typescript
   // server/src/utils/cache.ts
   export class CacheManager {
     private ttl = 300000; // 5 minutes cache

     async get<T>(key: string): Promise<T | null> {
       const entry = this.cache.get(key);
       if (entry && Date.now() - entry.timestamp < this.ttl) {
         return entry.data as T;
       }
       return null;
     }
   }
   ```

2. **Optimize database queries:**
   ```typescript
   // Use indexed lookups
   const errorRecord = this.errorHistory.find(r => r.id === errorId);
   // Instead of filtering entire array
   ```

3. **Implement request batching:**
   ```typescript
   export class BatchProcessor {
     private batch: any[] = [];
     private batchTimeout: NodeJS.Timeout | null = null;

     addRequest(request: any): void {
       this.batch.push(request);

       if (this.batch.length >= 10) {
         this.processBatch();
       } else if (!this.batchTimeout) {
         this.batchTimeout = setTimeout(() => this.processBatch(), 100);
       }
     }
   }
   ```

## Error Recovery Issues

### Error Analysis Fails

**Symptoms:**
- Error analyzer returns generic responses
- Pattern matching doesn't work
- Recovery suggestions are inaccurate

**Solutions:**

1. **Check error pattern database:**
   ```typescript
   // server/src/utils/enhanced_error_handler.ts
   export class EnhancedErrorHandler {
     private errorPatterns: Map<string, ErrorPattern> = new Map();

     // Ensure patterns are loaded
     private loadErrorPatterns(): void {
       this.errorPatterns.set('script_error', {
         regex: /Undefined variable: (\w+)/,
         category: 'script_errors',
         severity: 'medium',
         suggestions: [
           {
             strategy: 'create_variable',
             description: 'Create the missing variable',
             confidence: 0.8
           }
         ]
       });
     }
   }
   ```

2. **Update pattern matching logic:**
   ```typescript
   private findMatchingPattern(error: ErrorContext): ErrorPattern | null {
     for (const [key, pattern] of this.errorPatterns) {
       if (pattern.regex.test(error.message)) {
         return pattern;
       }
     }
     return null;
   }
   ```

3. **Test pattern matching:**
   ```typescript
   // Add test cases
   describe('Error Pattern Matching', () => {
     it('should match undefined variable errors', () => {
       const error = { message: "Undefined variable: player" };
       const pattern = errorHandler.findMatchingPattern(error);
       expect(pattern).toBeDefined();
       expect(pattern?.category).toBe('script_errors');
     });
   });
   ```

### Recovery Strategies Fail

**Symptoms:**
- Recovery suggestions don't work
- Applying recovery fails with errors
- Godot operations fail during recovery

**Solutions:**

1. **Validate recovery prerequisites:**
   ```typescript
   private async validateRecoveryPrerequisites(
     errorId: string,
     strategyIndex: number
   ): Promise<boolean> {
     const errorRecord = this.errorHistory.find(r => r.id === errorId);
     if (!errorRecord) return false;

     const strategy = errorRecord.analysis.suggestions[strategyIndex];
     if (!strategy) return false;

     // Check if Godot is connected
     const godot = getGodotConnection();
     if (!godot.isConnected()) return false;

     // Check if required scene is open
     const sceneCheck = await godot.sendCommand('validate_scene', {
       scene_path: strategy.requiredScene
     });

     return sceneCheck.result?.valid || false;
   }
   ```

2. **Implement rollback mechanisms:**
   ```typescript
   private async applyRecoveryWithRollback(
     errorId: string,
     strategyIndex: number
   ): Promise<RecoveryResult> {
     const snapshot = await this.createSnapshot();

     try {
       const result = await this.applyRecoveryStrategy(errorId, strategyIndex);
       return result;
     } catch (error) {
       await this.rollbackToSnapshot(snapshot);
       throw error;
     }
   }
   ```

3. **Add recovery validation:**
   ```typescript
   private async validateRecoveryResult(
     originalError: ErrorContext,
     recoveryResult: any
   ): Promise<boolean> {
     // Test if the original error condition is resolved
     const testResult = await this.testErrorCondition(originalError);

     // Verify no new errors were introduced
     const newErrors = await this.checkForNewErrors();

     return testResult.resolved && newErrors.length === 0;
   }
   ```

## Godot Integration Problems

### Addon Won't Load

**Symptoms:**
- Godot shows "Failed to load addon" error
- MCP Panel doesn't appear in editor
- Console shows GDScript errors

**Solutions:**

1. **Check addon structure:**
   ```bash
   tree addons/godot_mcp/
   # Should show proper directory structure
   ```

2. **Validate plugin.cfg:**
   ```ini
   [plugin]
   name="Godot MCP"
   description="Godot integration with Claude AI via MCP"
   author="Your Name"
   version="1.0.0"
   script="mcp_server.gd"
   ```

3. **Check GDScript syntax:**
   ```bash
   # Use Godot to validate scripts
   godot --script addons/godot_mcp/mcp_server.gd --check-only
   ```

4. **Verify Godot version compatibility:**
   ```gdscript
   # addons/godot_mcp/mcp_server.gd
   @tool
   extends EditorPlugin

   func _enter_tree():
       # Check Godot version
       var version = Engine.get_version_info()
       if version.major < 4 or (version.major == 4 and version.minor < 4):
           push_error("Godot MCP requires Godot 4.4 or later")
           return
   ```

### Scene Operations Fail

**Symptoms:**
- Node creation fails
- Scene loading errors
- Property updates don't work

**Solutions:**

1. **Check scene editing state:**
   ```gdscript
   # addons/godot_mcp/commands/node_commands.gd
   func _get_editor_interface() -> EditorInterface:
       var plugin = Engine.get_meta("GodotMCPPlugin")
       if not plugin:
           push_error("GodotMCPPlugin not found")
           return null
       return plugin.get_editor_interface()
   ```

2. **Validate node paths:**
   ```gdscript
   func _validate_node_path(path: String) -> bool:
       if path.is_empty() or not path.begins_with("/"):
           return false

       # Check for invalid characters
       var invalid_chars = ["\\", ":", "*", "?", "\"", "<", ">", "|"]
       for char in invalid_chars:
           if char in path:
               return false

       return true
   ```

3. **Handle scene state properly:**
   ```gdscript
   func _ensure_scene_is_editable() -> bool:
       var editor_interface = _get_editor_interface()
       var edited_scene_root = editor_interface.get_edited_scene_root()

       if not edited_scene_root:
           _send_error(client_id, "No scene is currently open in the editor", command_id)
           return false

       return true
   ```

## MCP Client Issues

### Claude Code Connection Problems

**Symptoms:**
- Claude Code can't connect to MCP server
- "Connection refused" errors
- Tools not available in Claude

**Solutions:**

1. **Configure Claude Code properly:**
   ```bash
   # Add MCP server to Claude
   claude mcp add godot-mcp \
     --command "cd /path/to/godot-mcp-nxt && npm start"

   # List configured servers
   claude mcp list

   # Test connection
   claude mcp test godot-mcp
   ```

2. **Check Claude Code version:**
   ```bash
   claude --version
   # Should be latest version
   ```

3. **Verify MCP server is running:**
   ```bash
   # Check if server is listening
   curl -I http://localhost:9080/health 2>/dev/null || echo "Server not responding"

   # Check server logs
   tail -f server/logs/mcp-server.log
   ```

### VS Code Extension Issues

**Symptoms:**
- MCP tools not appearing in VS Code
- Extension shows connection errors
- Commands fail to execute

**Solutions:**

1. **Configure VS Code settings:**
   ```json
   {
     "mcp.server.godot-mcp": {
       "command": "npm",
       "args": ["start"],
       "cwd": "/path/to/godot-mcp-nxt",
       "env": {
         "MCP_PORT": "9080",
         "MCP_DEBUG": "true"
       }
     }
   }
   ```

2. **Restart VS Code and extension:**
   ```
   VS Code → View → Command Palette → Developer: Reload Window
   ```

3. **Check extension logs:**
   ```
   VS Code → View → Output → MCP (Godot)
   ```

4. **Update extension:**
   ```
   VS Code → Extensions → Find MCP extension → Update
   ```

## Build and Development Issues

### TypeScript Compilation Errors

**Symptoms:**
- Build fails with TypeScript errors
- Type checking fails
- IntelliSense not working

**Solutions:**

1. **Check TypeScript configuration:**
   ```json
   // tsconfig.json
   {
     "compilerOptions": {
       "target": "ES2020",
       "module": "ESNext",
       "strict": true,
       "esModuleInterop": true,
       "skipLibCheck": true,
       "forceConsistentCasingInFileNames": true
     }
   }
   ```

2. **Fix common type errors:**
   ```typescript
   // Instead of 'any', use proper types
   interface CommandResult {
     success: boolean;
     data?: any;
     error?: string;
   }

   // Use union types for constrained values
   type NodeType = 'Node2D' | 'Sprite2D' | 'CharacterBody2D';

   // Add return type annotations
   async function processCommand(params: any): Promise<CommandResult> {
     // implementation
   }
   ```

3. **Update type definitions:**
   ```typescript
   // server/src/utils/types.ts
   export interface MCPTool<T = any> {
     name: string;
     description: string;
     parameters: z.ZodType<T>;
     execute: (args: T) => Promise<any>;
   }
   ```

### GDScript Compilation Errors

**Symptoms:**
- Godot shows script errors
- Addon fails to load
- Runtime errors in Godot

**Solutions:**

1. **Check GDScript syntax:**
   ```gdscript
   # Use proper type hints
   func process_command(client_id: int, command_type: String, params: Dictionary, command_id: String) -> bool:
       return false

   # Use signals properly
   signal command_processed(result: Dictionary)

   # Handle null checks
   if node != null:
       node.do_something()
   ```

2. **Fix common GDScript issues:**
   ```gdscript
   # Use @export for editor-exposed properties
   @export var speed: float = 100.0

   # Use @onready for node references
   @onready var sprite = $Sprite2D

   # Use proper signal connections
   func _ready():
       button.connect("pressed", Callable(self, "_on_button_pressed"))
   ```

3. **Validate with Godot:**
   ```bash
   # Check script syntax
   godot --script addons/godot_mcp/mcp_server.gd --check-only
   ```

### Test Failures

**Symptoms:**
- Unit tests failing
- Integration tests failing
- Build fails due to test errors

**Solutions:**

1. **Fix test setup:**
   ```typescript
   // server/src/tests/setup.ts
   import { jest } from '@jest/globals';

   // Mock Godot connection
   jest.mock('../utils/godot_connection', () => ({
     getGodotConnection: jest.fn(() => ({
       sendCommand: jest.fn(),
       isConnected: jest.fn(() => true)
     }))
   }));
   ```

2. **Update test expectations:**
   ```typescript
   describe('Node Tools', () => {
     it('should create node successfully', async () => {
       const mockConnection = {
         sendCommand: jest.fn().mockResolvedValue({
           node_path: '/root/TestNode'
         })
       };

       // Test implementation
       const result = await createNode(mockConnection, params);
       expect(result.success).toBe(true);
     });
   });
   ```

3. **Run tests with debugging:**
   ```bash
   # Run specific test
   npm test -- --testNamePattern="node_tools"

   # Run with coverage
   npm run test:coverage

   # Debug failing test
   npm test -- --verbose --testNamePattern="failing_test"
   ```

## Advanced Debugging

### Enable Debug Logging

```bash
# Environment variables
export MCP_DEBUG=true
export MCP_LOG_LEVEL=debug
export GODOT_DEBUG=true

# Restart services
npm restart
# Restart Godot
```

### Network Traffic Analysis

```bash
# Monitor WebSocket traffic
npm install -g wscat
wscat -c ws://localhost:9080 -l

# Use Wireshark for detailed analysis
# Filter: websocket
```

### Performance Profiling

```bash
# Profile Node.js application
npm install -g clinic
clinic doctor -- node dist/index.js

# Profile Godot application
# Godot → Debug → Profiler
```

### Memory Analysis

```bash
# Monitor Node.js memory
node --expose-gc --inspect dist/index.js
# Open chrome://inspect in Chrome

# Monitor Godot memory
# Godot → Debug → Monitor
```

### Database Debugging

```bash
# Check error history database
sqlite3 error_history.db "SELECT * FROM errors LIMIT 10;"

# Analyze performance metrics
sqlite3 performance.db "SELECT AVG(fps) FROM metrics WHERE timestamp > datetime('now', '-1 hour');"
```

## Getting Help

### Community Support

1. **GitHub Issues:**
   - Check existing issues first
   - Use issue templates
   - Provide detailed information

2. **GitHub Discussions:**
   - Ask questions
   - Share solutions
   - Get community help

3. **Discord Community:**
   - Real-time chat
   - Developer discussions
   - Troubleshooting help

### Professional Support

1. **Enterprise Support:**
   - Contact maintainers for commercial support
   - Priority bug fixes
   - Custom feature development

2. **Consulting Services:**
   - Integration assistance
   - Performance optimization
   - Custom development

### Documentation Resources

- **[Setup Guide](SETUP.md)**: Installation and configuration
- **[User Guide](USER_GUIDE.md)**: Feature usage and examples
- **[API Reference](API_REFERENCE.md)**: Complete API documentation
- **[Architecture Guide](ARCHITECTURE.md)**: System design and patterns
- **[Developer Guide](DEVELOPER_GUIDE.md)**: Contributing and development

### Diagnostic Information

When seeking help, provide:

```bash
# System information
uname -a
node --version
npm --version
godot --version

# Project information
git log --oneline -5
npm list --depth=0

# Error logs
tail -50 server/logs/mcp-server.log
tail -50 godot_console.log

# Configuration
cat .env
cat package.json
```

This comprehensive troubleshooting guide should help resolve most issues. If you encounter problems not covered here, please check the documentation or seek help from the community.