# Setup Guide

This guide provides comprehensive instructions for setting up the Godot MCP Server on your development environment.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Godot Integration](#godot-integration)
- [MCP Client Setup](#mcp-client-setup)
- [Verification](#verification)
- [Troubleshooting](#troubleshooting)

## Prerequisites

### System Requirements

- **Operating System**: Windows 10+, macOS 10.15+, or Linux (Ubuntu 18.04+)
- **Godot Engine**: Version 4.4 or later
- **Node.js**: Version 18.0 or later
- **TypeScript**: Version 5.0 or later (included with dependencies)
- **RAM**: Minimum 4GB, recommended 8GB+
- **Storage**: 500MB free space for installation and build artifacts

### Required Software

#### 1. Godot Engine
Download and install Godot 4.4+ from the official website:

```bash
# Linux (Ubuntu/Debian)
sudo apt update
sudo apt install godot3  # Note: This installs Godot 3, download Godot 4 manually

# Or download manually from:
# https://godotengine.org/download/linux/
```

**Important**: Ensure you're using Godot 4.4 or later for full compatibility with all MCP features.

#### 2. Node.js and npm
Download and install Node.js 18+:

```bash
# Using Node Version Manager (recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 18
nvm use 18

# Verify installation
node --version  # Should show v18.x.x
npm --version   # Should show 8.x.x
```

#### 3. Git
```bash
# Linux
sudo apt install git

# macOS (using Homebrew)
brew install git

# Windows: Download from https://git-scm.com/
```

## Installation

### Step 1: Clone the Repository

```bash
# Clone the repository
git clone https://github.com/your-repo/godot-mcp-nxt.git
cd godot-mcp-nxt

# Verify the clone
ls -la
```

Expected output:
```
drwxr-xr-x  .git/
drwxr-xr-x  addons/
drwxr-xr-x  docs/
drwxr-xr-x  scenes/
drwxr-xr-x  scripts/
drwxr-xr-x  server/
-rw-r--r--  package.json
-rw-r--r--  project.godot
-rw-r--r--  tsconfig.json
```

### Step 2: Install Dependencies

```bash
# Install Node.js dependencies
npm install

# Verify installation
npm list --depth=0
```

Expected output includes:
- `fastmcp`: MCP server framework
- `ws`: WebSocket library
- `zod`: Schema validation
- `typescript`: TypeScript compiler
- `jest`: Testing framework

### Step 3: Build the MCP Server

```bash
# Build the TypeScript code
npm run build

# Verify build output
ls -la server/dist/
```

Expected output:
```
-rw-r--r--  index.js
-rw-r--r--  index.d.ts
-rw-r--r--  tools/
-rw-r--r--  utils/
-rw-r--r--  resources/
```

### Step 4: Verify Build

```bash
# Test the build
npm test

# Expected: All tests pass
```

## Configuration

### MCP Server Configuration

The MCP server uses environment variables and configuration files:

#### Environment Variables

Create a `.env` file in the project root:

```bash
# MCP Server Configuration
MCP_PORT=9080
MCP_HOST=localhost
MCP_DEBUG=true
MCP_LOG_LEVEL=info

# Godot Integration
GODOT_PROJECT_PATH=/path/to/your/godot/project
GODOT_EXECUTABLE=/path/to/godot/executable

# Performance Monitoring
PERFORMANCE_UPDATE_INTERVAL=1000
PERFORMANCE_HISTORY_SIZE=1000
PERFORMANCE_ALERT_FPS_THRESHOLD=30
PERFORMANCE_ALERT_MEMORY_THRESHOLD=500

# Error Recovery
ERROR_RECOVERY_ENABLED=true
ERROR_HISTORY_SIZE=100
ERROR_LEARNING_ENABLED=true
```

#### TypeScript Configuration

The `tsconfig.json` is pre-configured for optimal performance:

```json
{
  "compilerOptions": {
    "module": "ESNext",
    "moduleResolution": "node",
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "strict": true,
    "skipLibCheck": true,
    "outDir": "server/dist",
    "rootDir": "server/src",
    "sourceMap": true,
    "declaration": true
  },
  "include": ["server/src/**/*"],
  "exclude": ["node_modules", "**/*.test.ts"]
}
```

### Jest Testing Configuration

The `jest.config.js` is configured for comprehensive testing:

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/server/src'],
  testMatch: ['**/__tests__/**/*.ts', '**/*.test.ts'],
  collectCoverageFrom: [
    'server/src/**/*.ts',
    '!server/src/**/*.d.ts',
    '!server/src/**/index.ts'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html']
};
```

## Godot Integration

### Step 1: Install the Addon

1. **Copy the addon to your Godot project**:
   ```bash
   # From your Godot project directory
   cp -r /path/to/godot-mcp-nxt/addons/godot_mcp addons/
   ```

2. **Verify addon structure**:
   ```
   addons/godot_mcp/
   ├── mcp_server.gd
   ├── command_handler.gd
   ├── plugin.cfg
   ├── commands/
   ├── ui/
   └── utils/
   ```

### Step 2: Enable the Addon

1. **Open your Godot project**
2. **Go to**: Project → Project Settings → Plugins
3. **Find**: "Godot MCP"
4. **Check**: Enable the plugin
5. **Restart**: Godot editor

### Step 3: Configure the Addon

The addon is pre-configured but can be customized:

```gdscript
# addons/godot_mcp/mcp_server.gd
var port := 9080
var debug_mode := true
var log_detailed := true
```

### Step 4: Verify Integration

1. **Check Godot console** for startup messages:
   ```
   === MCP SERVER STARTING ===
   Listening on port 9080
   === MCP SERVER INITIALIZED ===
   ```

2. **Check for MCP Panel** in Godot's bottom panel

## MCP Client Setup

### Claude Code

1. **Install Claude Code**:
   ```bash
   npm install -g @anthropic/claude-code
   ```

2. **Configure MCP server**:
   ```bash
   claude mcp add godot-mcp \
     --command "cd /path/to/godot-mcp-nxt && npm start"
   ```

3. **Test connection**:
   ```bash
   claude mcp list
   # Should show: godot-mcp (running)
   ```

### VS Code with MCP Extension

1. **Install VS Code MCP extension**
2. **Configure settings.json**:
   ```json
   {
     "mcp.server.godot-mcp": {
       "command": "npm",
       "args": ["start"],
       "cwd": "/path/to/godot-mcp-nxt",
       "env": {
         "MCP_PORT": "9080"
       }
     }
   }
   ```

### Cursor

1. **Open Cursor settings**
2. **Add MCP server configuration**:
   ```json
   {
     "mcpServers": {
       "godot-mcp": {
         "command": "npm",
         "args": ["start"],
         "cwd": "/path/to/godot-mcp-nxt"
       }
     }
   }
   ```

## Verification

### Test MCP Server

```bash
# Start the server
npm start

# Expected output:
# Starting Godot MCP server...
# Connected to Godot WebSocket server
# Successfully registered X tools in Y categories
# Godot MCP server started
```

### Test Godot Integration

1. **Open Godot project** with MCP addon
2. **Check console** for connection messages
3. **Verify MCP Panel** is visible and functional

### Test MCP Client Connection

```bash
# Test with Claude Code
claude "Show me the available Godot MCP tools"

# Expected: List of available tools and their descriptions
```

### Run Integration Tests

```bash
# Run all tests
npm test

# Run specific test suites
npm test -- --testNamePattern="integration"
npm test -- --testNamePattern="performance"
npm test -- --testNamePattern="error_recovery"
```

## Troubleshooting

### Common Issues

#### 1. Port Already in Use
```bash
# Find process using port 9080
lsof -i :9080

# Kill the process
kill -9 <PID>

# Or change port in configuration
export MCP_PORT=9081
```

#### 2. Godot Addon Not Loading
- **Check**: Godot version (must be 4.4+)
- **Verify**: Addon files are in correct location
- **Check**: Plugin is enabled in Project Settings
- **Restart**: Godot editor completely

#### 3. WebSocket Connection Failed
```bash
# Check if Godot is running
ps aux | grep godot

# Verify port configuration
netstat -tlnp | grep 9080

# Check firewall settings
sudo ufw status
```

#### 4. Build Errors
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear TypeScript cache
rm -rf server/dist
npm run build
```

#### 5. Permission Errors
```bash
# Fix npm permissions
sudo chown -R $(whoami) ~/.npm
sudo chown -R $(whoami) /usr/local/lib/node_modules
```

### Debug Mode

Enable detailed logging for troubleshooting:

```bash
# Environment variables
export MCP_DEBUG=true
export MCP_LOG_LEVEL=debug

# Restart server
npm start
```

### Performance Issues

If experiencing performance problems:

1. **Reduce monitoring frequency**:
   ```bash
   export PERFORMANCE_UPDATE_INTERVAL=2000
   ```

2. **Disable detailed logging**:
   ```bash
   export MCP_LOG_LEVEL=warn
   ```

3. **Limit history size**:
   ```bash
   export PERFORMANCE_HISTORY_SIZE=500
   ```

### Getting Help

- **Check logs**: `tail -f server/logs/mcp-server.log`
- **Enable debug mode**: Set `MCP_DEBUG=true`
- **Test individual components**: Use the test suites
- **Community support**: Check GitHub issues and discussions

## Advanced Configuration

### Custom Tool Development

1. **Create new tool** in `server/src/tools/`
2. **Register in tool registry** in `server/src/index.ts`
3. **Add Godot command handler** if needed
4. **Update documentation**

### Performance Tuning

```javascript
// server/src/utils/godot_connection.ts
export class GodotConnection {
  constructor(
    private url: string = 'ws://localhost:9080',
    private timeout: number = 10000, // Reduced from 20000
    private maxRetries: number = 3,
    private retryDelay: number = 1000 // Reduced from 2000
  ) {}
}
```

### Security Considerations

For production deployments:

1. **Use secure WebSocket** (WSS)
2. **Implement connection limits**
3. **Add request validation**
4. **Monitor resource usage**
5. **Regular security updates**

## Next Steps

After successful setup:

1. **[Read the User Guide](USER_GUIDE.md)** for feature usage
2. **[Explore API Reference](API_REFERENCE.md)** for development
3. **[Check Architecture Guide](ARCHITECTURE.md)** for deep understanding
4. **[Join the community](https://github.com/your-repo/godot-mcp-nxt/discussions)**

---

**🎉 Setup Complete!** Your Godot MCP Server is now ready for intelligent AI-powered development assistance.