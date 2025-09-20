# 🔧 Godot MCP Debug System

A comprehensive, environment-controlled logging system for debugging the Godot MCP server.

## 🚀 Quick Start

1. **Copy the environment template:**
   ```bash
   cp server/.env.example server/.env
   ```

2. **Enable debug mode:**
   ```bash
   # In server/.env
   LOG_LEVEL=DEBUG
   DEBUG=true
   ```

3. **Run the server:**
   ```bash
   npm start
   ```

## 📋 Environment Variables

### Global Settings

| Variable | Default | Description |
|----------|---------|-------------|
| `LOG_LEVEL` | `INFO` | Global log level (ERROR, WARN, INFO, DEBUG, TRACE) |
| `DEBUG` | `false` | Enable debug mode (shortcut for LOG_LEVEL=DEBUG) |

### Component-Specific Settings

Override global log level for specific components:

```bash
LOG_LEVEL_CONNECTION=DEBUG      # WebSocket connections
LOG_LEVEL_WEBSOCKET=TRACE       # WebSocket message tracing
LOG_LEVEL_COMMAND=INFO          # MCP command processing
LOG_LEVEL_PERFORMANCE=DEBUG     # Performance monitoring
LOG_LEVEL_TOOL=INFO             # Tool execution
LOG_LEVEL_CACHE=WARN            # Cache operations
LOG_LEVEL_ERROR=ERROR           # Error handling
```

### Debug Features

```bash
# Performance monitoring
ENABLE_PERFORMANCE_MONITORING=true

# Detailed error reporting
ENABLE_DETAILED_ERRORS=true

# Request/response logging
ENABLE_REQUEST_LOGGING=false

# WebSocket message tracing
ENABLE_WS_TRACING=false
```

## 🎯 Log Levels

| Level | Description | Use Case |
|-------|-------------|----------|
| `ERROR` | Critical errors | Application crashes, data loss |
| `WARN` | Warning conditions | Deprecated features, potential issues |
| `INFO` | General information | Startup messages, important events |
| `DEBUG` | Debug information | Variable values, function calls |
| `TRACE` | Detailed tracing | Message contents, performance timing |

## 📝 Usage Examples

### Basic Logging

```typescript
import { connectionLogger } from './utils/logger.js';

// Simple messages
connectionLogger.info('Server started on port 9080');
connectionLogger.error('Failed to connect to Godot');

// With context
connectionLogger.debug('Processing command', {
  commandId: 'cmd_123',
  commandType: 'create_node',
  userId: 'user_456'
});
```

### Performance Timing

```typescript
const timerId = connectionLogger.startTimer('websocket_handshake');
// ... do work ...
connectionLogger.endTimer('websocket_handshake');
```

### Request/Response Logging

```typescript
connectionLogger.logRequest('create_node', { nodeType: 'Sprite2D' }, 'cmd_123');

// Later...
connectionLogger.logResponse('create_node', { nodePath: '/root/Sprite2D' }, 'cmd_123', 150);
```

## 🔍 Debug Scenarios

### WebSocket Connection Issues

```bash
# Enable detailed WebSocket logging
LOG_LEVEL_WEBSOCKET=TRACE
ENABLE_WS_TRACING=true
```

### Command Processing Problems

```bash
# Debug command routing and execution
LOG_LEVEL_COMMAND=DEBUG
LOG_LEVEL_CONNECTION=DEBUG
ENABLE_REQUEST_LOGGING=true
```

### Performance Bottlenecks

```bash
# Monitor performance and timing
LOG_LEVEL_PERFORMANCE=DEBUG
ENABLE_PERFORMANCE_MONITORING=true
```

### Memory and Cache Issues

```bash
# Debug memory usage and caching
LOG_LEVEL_CACHE=DEBUG
LOG_LEVEL_PERFORMANCE=DEBUG
```

## 🛠️ Advanced Configuration

### Custom Log Levels per Component

```bash
# Fine-grained control
LOG_LEVEL_CONNECTION=INFO        # Basic connection info
LOG_LEVEL_WEBSOCKET=DEBUG        # WebSocket details
LOG_LEVEL_COMMAND=TRACE          # Full command tracing
LOG_LEVEL_PERFORMANCE=WARN       # Only performance warnings
```

### Production vs Development

**Production (.env):**
```bash
LOG_LEVEL=ERROR
ENABLE_PERFORMANCE_MONITORING=true
ENABLE_DETAILED_ERRORS=true
```

**Development (.env):**
```bash
LOG_LEVEL=DEBUG
DEBUG=true
ENABLE_REQUEST_LOGGING=true
ENABLE_WS_TRACING=true
```

## 📊 Log Output Format

```
[2025-09-20T08:00:00.000Z] INFO [connection] Server started on port 9080
[2025-09-20T08:00:01.123Z] DEBUG [websocket] WebSocket message received {"type":"ping"}
[2025-09-20T08:00:01.456Z] ERROR [command] Command failed: create_node {"error":"Invalid node type"}
```

Format: `[timestamp] LEVEL [component] message [context]`

## 🔄 Automatic Migration

The system includes an automatic migration script to convert existing `console.log/error` calls:

```bash
# Run migration script
cd server
node scripts/migrate-to-logger.js
```

This script:
- Adds logger imports to all TypeScript files
- Replaces `console.log` → `logger.info`
- Replaces `console.error` → `logger.error`
- Replaces `console.warn` → `logger.warn`

## 🎨 GDScript Integration

For Godot GDScript files, use the built-in logging system:

```gdscript
# Basic logging (goes to Godot console)
print("Debug message")

# Warning (yellow in console)
push_warning("Warning message")

# Error (red in console)
push_error("Error message")

# For structured logging, use the MCP panel
# (accessible via the Godot editor UI)
```

## 📈 Monitoring and Analysis

### Real-time Monitoring

The debug system integrates with the performance monitor panel in the Godot editor UI, providing:

- Live log streaming
- Performance metrics
- Error rate monitoring
- Connection status

### Log Analysis

Use these commands to analyze logs:

```bash
# Filter by component
grep "\[connection\]" logs/app.log

# Filter by level
grep "ERROR" logs/app.log

# Count errors by component
grep "ERROR" logs/app.log | sed 's/.*\[\([^]]*\)\].*/\1/' | sort | uniq -c
```

## 🚨 Troubleshooting

### Logs Not Appearing

1. Check log level: `LOG_LEVEL=DEBUG`
2. Verify component name in logger import
3. Ensure `.env` file is loaded

### Performance Impact

- `ERROR`/`WARN`: Minimal impact (always enabled)
- `INFO`: Low impact (recommended for production)
- `DEBUG`: Moderate impact (development only)
- `TRACE`: High impact (detailed debugging only)

### Common Issues

**Logger not found:**
```typescript
// Wrong
import { logger } from './utils/logger.js';

// Correct
import { connectionLogger } from './utils/logger.js';
```

**Context object issues:**
```typescript
// Wrong - will be treated as string
logger.debug('Message', context);

// Correct - pass as second parameter
logger.debug('Message', context);
```

## 📚 API Reference

### Logger Methods

```typescript
interface Logger {
  error(message: string, context?: LogContext): void;
  warn(message: string, context?: LogContext): void;
  info(message: string, context?: LogContext): void;
  debug(message: string, context?: LogContext): void;
  trace(message: string, context?: LogContext): void;

  // Performance timing
  startTimer(label: string): void;
  endTimer(label: string, context?: LogContext): number;

  // MCP-specific
  logRequest(commandType: string, params: any, commandId: string): void;
  logResponse(commandType: string, result: any, commandId: string, duration?: number): void;
  logError(commandType: string, error: Error, commandId?: string): void;
}
```

### Pre-configured Loggers

- `connectionLogger` - WebSocket connections
- `websocketLogger` - WebSocket message handling
- `commandLogger` - MCP command processing
- `performanceLogger` - Performance monitoring
- `toolLogger` - Tool execution
- `cacheLogger` - Cache operations
- `errorLogger` - Error handling

## 🎯 Best Practices

1. **Use appropriate log levels** - Don't use DEBUG for production-critical messages
2. **Include context** - Add relevant IDs, parameters, and metadata
3. **Avoid sensitive data** - Don't log passwords, tokens, or personal information
4. **Use timers for performance** - Track slow operations automatically
5. **Component-specific loggers** - Use the correct logger for each module
6. **Structured logging** - Use context objects for searchable data

## 🔐 Security Considerations

- Never log sensitive information (passwords, API keys, tokens)
- Be cautious with user data in logs
- Consider log rotation to prevent disk space issues
- Use appropriate log levels in production

---

**Need help?** Check the [Troubleshooting Guide](../docs/TROUBLESHOOTING.md) or create an issue with your debug logs.