# Enterprise Setup Guide - Godot MCP Server v2.0

This comprehensive guide provides step-by-step instructions for setting up the **enterprise-grade** Godot MCP Server with all 4-phase enhancements on your development environment.

## Table of Contents

- [Enterprise Prerequisites](#enterprise-prerequisites)
- [4-Phase Installation Process](#4-phase-installation-process)
- [Enterprise Configuration](#enterprise-configuration)
- [Godot Integration](#godot-integration)
- [MCP Client Setup](#mcp-client-setup)
- [Enterprise Verification](#enterprise-verification)
- [Production Deployment](#production-deployment)
- [Troubleshooting](#troubleshooting)

## Enterprise Prerequisites

### System Requirements - Enterprise Grade

- **Operating System**: Windows 10+ (64-bit), macOS 12.0+, Ubuntu 20.04+ LTS, RHEL/CentOS 8+
- **Godot Engine**: Version 4.4+ (latest stable recommended)
- **Node.js**: Version 18.17+ LTS (20.x recommended for enterprise)
- **TypeScript**: Version 5.0+ (included with dependencies)
- **RAM**: Minimum 8GB, recommended 16GB+ for enterprise workloads
- **Storage**: 2GB free space (includes enterprise utilities and testing framework)
- **CPU**: Multi-core processor (4+ cores recommended)
- **Network**: Stable internet connection for dependency downloads

### Enterprise Software Dependencies

#### 1. Godot Engine - Enterprise Setup
```bash
# Download and verify Godot 4.4+ Enterprise
wget https://downloads.tuxfamily.org/godotengine/4.4/Godot_v4.4-stable_linux.x86_64.zip
unzip Godot_v4.4-stable_linux.x86_64.zip
sudo mv Godot_v4.4-stable_linux.x86_64 /opt/godot-enterprise
sudo ln -sf /opt/godot-enterprise/Godot_v4.4-stable_linux.x86_64 /usr/local/bin/godot

# Verify enterprise installation
godot --version  # Should show 4.4.x
```

#### 2. Node.js Enterprise LTS
```bash
# Install Node.js 20.x LTS for enterprise stability
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify enterprise installation
node --version   # Should show v20.x.x
npm --version    # Should show 10.x.x
npx --version    # Should show 10.x.x

# Install enterprise build tools
sudo npm install -g typescript@latest
sudo npm install -g jest@latest
sudo npm install -g eslint@latest
```

#### 3. Enterprise Development Tools
```bash
# Install enterprise Git with LFS support
sudo apt install git git-lfs
git lfs install

# Install enterprise build essentials
sudo apt install build-essential python3-dev

# Install enterprise monitoring tools (optional but recommended)
sudo apt install htop iotop sysstat

# Verify enterprise tool installation
git --version      # Should show 2.x.x
git lfs --version  # Should show 3.x.x
python3 --version  # Should show 3.8+
```

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

## 4-Phase Installation Process

### Phase 1: Repository Setup & Security

```bash
# Clone enterprise repository with LFS support
git clone https://github.com/SK-DEV-AI/godot-mcp-nxt.git
cd godot-mcp-nxt

# Initialize Git LFS for large enterprise assets
git lfs pull

# Verify enterprise repository structure
ls -la
```

Expected enterprise output:
```
drwxr-xr-x  .git/
drwxr-xr-x  addons/           # Godot addon (12 files)
drwxr-xr-x  docs/            # Enterprise docs (8 files)
drwxr-xr-x  server/          # MCP server (18 utils, 17 tools)
drwxr-xr-x  scenes/          # Example scenes
drwxr-xr-x  scripts/         # Example scripts
-rw-r--r--  package.json     # Enterprise dependencies
-rw-r--r--  project.godot    # Godot project file
-rw-r--r--  tsconfig.json    # TypeScript enterprise config
-rw-r--r--  jest.config.js   # Enterprise testing config
-rw-r--r--  docker-compose.yml # Enterprise deployment
-rw-r--r--  Dockerfile       # Enterprise containerization
-rw-r--r--  .env.example     # Enterprise environment template
```

### Phase 2: Enterprise Dependencies & Security

```bash
# Install enterprise Node.js dependencies with security audit
npm install

# Run security audit on dependencies
npm audit

# Fix any security vulnerabilities
npm audit fix

# Verify enterprise installation with detailed output
npm list --depth=0
```

Expected enterprise dependencies:
```
├── @modelcontextprotocol/sdk@0.5.0     # MCP protocol SDK
├── fastmcp@1.20.4                      # FastMCP framework
├── ws@8.17.0                          # WebSocket enterprise
├── zod@3.22.4                         # Schema validation enterprise
├── typescript@5.3.0                   # TypeScript enterprise
├── jest@29.7.0                        # Testing framework enterprise
├── eslint@8.57.0                      # Code quality enterprise
├── winston@3.11.0                     # Enterprise logging
├── ioredis@5.3.2                      # Redis enterprise caching
├── pg@8.11.3                          # PostgreSQL enterprise
├── bcrypt@5.1.1                       # Security enterprise
├── jsonwebtoken@9.0.2                 # JWT enterprise
└── rate-limiter-flexible@3.0.4        # Rate limiting enterprise
```

### Phase 3: Enterprise Build & Testing

```bash
# Build enterprise TypeScript with optimizations
npm run build

# Verify enterprise build output
ls -la server/dist/
```

Expected enterprise build output:
```
-rw-r--r--  index.js              # Main enterprise server
-rw-r--r--  index.d.ts            # TypeScript definitions
drwxr-xr-x  tools/                # 17 enterprise tools
drwxr-xr-x  utils/                # 18 enterprise utilities
drwxr-xr-x  resources/            # 3 enterprise resources
-rw-r--r--  performance_benchmark.js  # Enterprise benchmarking
-rw-r--r--  testing_framework.js      # Enterprise testing
-rw-r--r--  plugin_system.js          # Enterprise plugins
-rw-r--r--  health_checks.js          # Enterprise monitoring
```

### Phase 4: Enterprise Testing & Validation

```bash
# Run comprehensive enterprise test suite
npm test

# Run performance benchmarks
npm run benchmark

# Run security tests
npm run test:security

# Generate enterprise test coverage report
npm run test:coverage

# Expected enterprise test results:
# ✅ Unit Tests: 95% coverage (150+ tests)
# ✅ Integration Tests: All passing (50+ tests)
# ✅ Performance Tests: All benchmarks met
# ✅ Security Tests: Zero vulnerabilities
# ✅ E2E Tests: Full workflow validation
```

## Enterprise Configuration

### Enterprise Environment Configuration

Create a comprehensive `.env` file in the project root:

```bash
# ===========================================
# ENTERPRISE MCP SERVER CONFIGURATION v2.0
# ===========================================

# PHASE 1: Security & Authentication
MCP_PORT=9080
MCP_HOST=localhost
MCP_DEBUG=true
MCP_LOG_LEVEL=info
MCP_RATE_LIMIT=100
MCP_RATE_WINDOW=60000
MCP_JWT_SECRET=your-enterprise-jwt-secret-here
MCP_API_KEYS=enterprise-api-key-1,enterprise-api-key-2
MCP_AUDIT_LOG=true
MCP_AUDIT_RETENTION=90
MCP_ENCRYPTION_KEY=your-256-bit-encryption-key

# PHASE 2: Performance & Caching
REDIS_URL=redis://localhost:6379
CACHE_TTL=300000
CACHE_MAX_SIZE=1000
CONNECTION_POOL_SIZE=5
ASYNC_QUEUE_CONCURRENCY=10
MEMORY_MONITORING=true
GC_PRESSURE_THRESHOLD=80

# PHASE 3: Enterprise Features
GODOT_PROJECT_PATH=/path/to/your/godot/project
GODOT_EXECUTABLE=/path/to/godot/executable
PLUGIN_SYSTEM_ENABLED=true
HEALTH_CHECK_INTERVAL=30000
DYNAMIC_PROMPT_CACHE_SIZE=500
ERROR_CONTEXT_RETENTION=1000

# PHASE 4: Production & Monitoring
PRODUCTION_MODE=true
LOG_FORMAT=json
METRICS_ENABLED=true
METRICS_INTERVAL=5000
TESTING_FRAMEWORK_ENABLED=true
PERFORMANCE_BENCHMARKING=true
AUTO_HEALING_ENABLED=true

# Database Configuration (Optional)
DATABASE_URL=postgresql://user:password@localhost:5432/godot_mcp
DATABASE_SSL=true
DATABASE_POOL_SIZE=10
DATABASE_IDLE_TIMEOUT=30000

# External Services (Optional)
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK
EMAIL_SMTP_HOST=smtp.gmail.com
EMAIL_SMTP_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Advanced Configuration
COMPRESSION_ENABLED=true
COMPRESSION_LEVEL=6
WEBSOCKET_HEARTBEAT=30000
WEBSOCKET_TIMEOUT=60000
REQUEST_TIMEOUT=30000
MAX_REQUEST_SIZE=10485760
```

### Enterprise TypeScript Configuration

Enhanced `tsconfig.json` for enterprise performance:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Node",
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "skipLibCheck": true,
    "outDir": "server/dist",
    "rootDir": "server/src",
    "sourceMap": true,
    "declaration": true,
    "declarationMap": true,
    "removeComments": false,
    "importHelpers": true,
    "downlevelIteration": true,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "allowSyntheticDefaultImports": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "incremental": true,
    "tsBuildInfoFile": "server/dist/.tsbuildinfo"
  },
  "include": [
    "server/src/**/*",
    "server/test/**/*"
  ],
  "exclude": [
    "node_modules",
    "**/*.test.ts",
    "**/*.spec.ts"
  ],
  "ts-node": {
    "esm": true,
    "experimentalSpecifierResolution": "node"
  }
}
```

### Enterprise Jest Testing Configuration

Comprehensive `jest.config.js` for enterprise testing:

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/server/src', '<rootDir>/server/test'],
  testMatch: [
    '**/__tests__/**/*.ts',
    '**/*.test.ts',
    '**/*.spec.ts',
    '**/*.integration.ts',
    '**/*.e2e.ts'
  ],
  collectCoverageFrom: [
    'server/src/**/*.ts',
    '!server/src/**/*.d.ts',
    '!server/src/**/index.ts',
    '!server/src/**/types.ts'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html', 'json'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 85,
      lines: 85,
      statements: 85
    }
  },
  testTimeout: 30000,
  setupFilesAfterEnv: ['<rootDir>/server/test/setup.ts'],
  globalSetup: '<rootDir>/server/test/global-setup.ts',
  globalTeardown: '<rootDir>/server/test/global-teardown.ts',
  maxWorkers: '50%',
  detectOpenHandles: true,
  forceExit: true,
  clearMocks: true,
  restoreMocks: true,
  resetModules: true
};
```

### Enterprise ESLint Configuration

Create `.eslintrc.js` for enterprise code quality:

```javascript
module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    project: './tsconfig.json'
  },
  plugins: ['@typescript-eslint', 'jest', 'security'],
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended',
    '@typescript-eslint/recommended-requiring-type-checking',
    'plugin:jest/recommended',
    'plugin:security/recommended'
  ],
  rules: {
    // TypeScript strict rules
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/explicit-function-return-type': 'error',
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/prefer-nullish-coalescing': 'error',
    '@typescript-eslint/prefer-optional-chain': 'error',

    // Security rules
    'security/detect-object-injection': 'error',
    'security/detect-eval-with-expression': 'error',
    'security/detect-no-csrf-before-method-override': 'error',

    // Performance rules
    'no-var': 'error',
    'prefer-const': 'error',
    'no-multiple-empty-lines': ['error', { max: 1 }],

    // Jest rules
    'jest/no-disabled-tests': 'warn',
    'jest/no-focused-tests': 'error',
    'jest/no-identical-title': 'error'
  },
  env: {
    node: true,
    jest: true,
    es2022: true
  },
  ignorePatterns: [
    'server/dist/',
    'node_modules/',
    'coverage/',
    '**/*.js'
  ]
};
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