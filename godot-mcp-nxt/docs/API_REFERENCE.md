# API Reference

This comprehensive API reference documents all public interfaces, tools, and components of the Godot MCP Server.

## Table of Contents

- [MCP Tools](#mcp-tools)
- [Godot Addon APIs](#godot-addon-apis)
- [TypeScript Utilities](#typescript-utilities)
- [Configuration](#configuration)
- [Error Handling](#error-handling)
- [Events and Signals](#events-and-signals)

## MCP Tools

### Core Tools

#### Node Manager

**Tool Name:** `node_manager`

**Description:** Unified node lifecycle management for Godot scenes.

**Parameters:**
```typescript
{
  operation: 'create' | 'delete' | 'update_property' | 'get_properties' | 'list_children' | 'batch_update' | 'create_shape' | 'create_mesh' | 'assign_resource',
  node_path?: string,           // Required for most operations
  node_type?: string,           // Required for create
  node_name?: string,           // Required for create
  property?: string,            // Required for update_property
  value?: any,                  // Required for update_property
  operations?: BatchOperation[], // Required for batch_update
  shapeType?: ShapeType,        // Required for create_shape
  meshType?: MeshType,          // Required for create_mesh
  resourceType?: 'shape' | 'mesh', // Required for assign_resource
  resourceId?: string,          // Required for assign_resource
  autoCreateResources?: boolean, // Optional: auto-create shapes/meshes
  preview?: boolean             // Optional: preview mode
}
```

**Usage Examples:**
```typescript
// Create a node
await node_manager.execute({
  operation: 'create',
  node_path: '/root',
  node_type: 'CharacterBody2D',
  node_name: 'Player',
  autoCreateResources: true
});

// Update properties
await node_manager.execute({
  operation: 'update_property',
  node_path: '/root/Player',
  property: 'position',
  value: { x: 100, y: 200 }
});

// Batch operations
await node_manager.execute({
  operation: 'batch_update',
  operations: [
    {
      nodePattern: '*/Sprite2D',
      property: 'modulate',
      value: { r: 1, g: 0, b: 0, a: 1 }
    }
  ]
});
```

**Response Format:**
```typescript
{
  status: 'success' | 'error',
  result?: {
    node_path?: string,
    properties?: Record<string, any>,
    children?: NodeInfo[],
    resourceId?: string
  },
  message?: string
}
```

#### Script Manager

**Tool Name:** `script_manager`

**Description:** Complete GDScript lifecycle management.

**Parameters:**
```typescript
{
  operation: 'create' | 'edit' | 'read' | 'generate_template' | 'generate_ai',
  script_path?: string,        // Required for most operations
  content?: string,            // Required for create/edit
  node_path?: string,          // Optional: attach to node
  class_name?: string,         // Optional: for templates
  extends_type?: string,       // Optional: base class (default: 'Node')
  include_ready?: boolean,     // Optional: include _ready()
  include_process?: boolean,   // Optional: include _process()
  include_input?: boolean,     // Optional: include _input()
  include_physics?: boolean,   // Optional: include _physics_process()
  description?: string,        // Required for generate_ai
  scriptType?: ScriptType,     // Optional: character, ui, gameplay, utility
  complexity?: Complexity,     // Optional: simple, medium, complex
  features?: string[],         // Optional: specific features to include
  targetScene?: string         // Optional: target scene path
}
```

**Usage Examples:**
```typescript
// Create script
await script_manager.execute({
  operation: 'create',
  script_path: 'res://player.gd',
  content: 'extends CharacterBody2D\n\nfunc _ready():\n\tpass'
});

// Generate AI script
await script_manager.execute({
  operation: 'generate_ai',
  description: 'Create a 2D platformer player controller',
  scriptType: 'character',
  complexity: 'medium',
  features: ['movement', 'jump', 'collision']
});

// Generate template
await script_manager.execute({
  operation: 'generate_template',
  extends_type: 'Node2D',
  include_ready: true,
  include_process: true
});
```

#### Scene Manager

**Tool Name:** `scene_manager`

**Description:** Scene creation, loading, and management.

**Parameters:**
```typescript
{
  operation: 'create_scene' | 'load_scene' | 'save_scene' | 'get_scene_info' | 'optimize_scene',
  path?: string,               // Scene file path
  root_node_type?: string,     // Root node type for creation
  scene_data?: any,           // Scene data for creation
  optimization_level?: 'basic' | 'advanced' | 'aggressive'
}
```

### Performance Tools

#### Performance Analyzer

**Tool Name:** `analyze_scene_performance`

**Description:** Comprehensive scene performance analysis.

**Parameters:**
```typescript
{
  scene_path?: string,         // Optional: specific scene to analyze
  include_recommendations?: boolean, // Include optimization suggestions
  detail_level?: 'basic' | 'detailed' | 'comprehensive'
}
```

**Response:**
```typescript
{
  status: 'success',
  result: {
    fps: number,
    memory_usage: number,
    draw_calls: number,
    render_objects: number,
    physics_time: number,
    recommendations: string[],
    bottlenecks: BottleneckInfo[]
  }
}
```

#### Performance Monitor

**Tool Name:** `performance_monitor`

**Description:** Real-time performance monitoring and alerting.

**Parameters:**
```typescript
{
  operation: 'start' | 'stop' | 'get_metrics' | 'set_alerts' | 'export_data',
  duration?: number,           // Monitoring duration in seconds
  interval?: number,           // Sampling interval in ms
  alerts?: AlertConfig[],     // Alert configurations
  export_path?: string        // Export file path
}
```

### Error Recovery Tools

#### Error Analyzer

**Tool Name:** `error_analyzer`

**Description:** Intelligent error analysis and recovery suggestions.

**Parameters:**
```typescript
{
  operation: 'analyze' | 'suggest_recovery' | 'apply_recovery' | 'get_statistics',
  error_type?: string,         // Error category
  message?: string,            // Error message
  stack_trace?: string,        // Stack trace
  context?: any,              // Additional context
  error_id?: string,          // Error identifier
  strategy_index?: number,    // Recovery strategy to apply
  automatic_only?: boolean    // Only automatic strategies
}
```

**Response:**
```typescript
{
  status: 'success',
  result: {
    error_id: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    category: string,
    root_cause: string,
    suggestions: RecoverySuggestion[],
    confidence: number
  }
}
```

#### Fuzzy Matcher

**Tool Name:** `fuzzy_matcher`

**Description:** Intelligent path resolution and correction.

**Parameters:**
```typescript
{
  operation: 'find_matches' | 'validate_path' | 'suggest_corrections' | 'get_similarity_score',
  target_path?: string,        // Path to find matches for
  search_type?: PathType,     // node, file, script, resource
  max_results?: number,       // Maximum matches to return
  min_similarity?: number,    // Minimum similarity threshold
  path?: string,              // Path to validate
  incorrect_path?: string,    // Path to correct
  path1?: string,             // First path for comparison
  path2?: string             // Second path for comparison
}
```

### Prompt Enhancement Tools

#### Prompt Enhancer

**Tool Name:** `enhance_prompt`

**Description:** Context-aware prompt enhancement using Prompty patterns.

**Parameters:**
```typescript
{
  operation: 'enhance' | 'analyze' | 'suggest_improvements' | 'learn_from_feedback',
  prompt?: string,            // Prompt to enhance
  current_prompt?: string,    // Current prompt for suggestions
  operation_type?: string,    // Type of operation
  injection_id?: string,      // Previous injection ID
  effectiveness?: number,     // Feedback effectiveness (0-1)
  include_godot_context?: boolean,
  include_performance?: boolean,
  user_experience_level?: ExperienceLevel
}
```

#### Context-Aware Assistant

**Tool Name:** `context_aware_assistant`

**Description:** Intelligent development guidance and assistance.

**Parameters:**
```typescript
{
  operation: 'get_guidance' | 'analyze_project' | 'get_best_practices' | 'performance_guidance',
  context_type?: string,       // scripting, scene, performance
  focus_area?: string,         // Specific area to focus on
  category?: string,           // Best practices category
  current_fps?: number,        // Current FPS for guidance
  include_examples?: boolean,  // Include code examples
  detail_level?: DetailLevel   // Level of detail
}
```

## Godot Addon APIs

### MCP Server (GDScript)

**Class:** `MCPServer`

**Description:** Main WebSocket server for MCP communication.

**Methods:**
```gdscript
# Initialize server
func _enter_tree() -> void

# Handle connections
func _process(delta: float) -> void

# Send response to client
func send_response(client_id: int, response: Dictionary) -> int

# Get server status
func is_server_active() -> bool

# Stop server
func stop_server() -> void
```

**Signals:**
```gdscript
# Client connected
signal client_connected(id: int)

# Client disconnected
signal client_disconnected(id: int)

# Command received
signal command_received(client_id: int, command: Dictionary)
```

### Command Handler

**Class:** `MCPCommandHandler`

**Description:** Routes commands to appropriate processors.

**Methods:**
```gdscript
# Handle incoming command
func _handle_command(client_id: int, command: Dictionary) -> void

# Send success response
func _send_success(client_id: int, result: Dictionary, command_id: String) -> void

# Send error response
func _send_error(client_id: int, message: String, command_id: String) -> void
```

### Base Command Processor

**Class:** `MCPBaseCommandProcessor`

**Description:** Base class for all command processors.

**Methods:**
```gdscript
# Process command (implement in subclasses)
func process_command(client_id: int, command_type: String, params: Dictionary, command_id: String) -> bool

# Utility methods
func _get_editor_node(path: String) -> Node
func _mark_scene_modified() -> void
func _validate_node_path(path: String) -> bool
func _parse_property_value(value) -> Variant
```

### Node Commands

**Class:** `MCPNodeCommands`

**Description:** Handles all node-related operations.

**Supported Operations:**
- `create_node`: Create new nodes
- `delete_node`: Remove nodes
- `update_node_property`: Modify node properties
- `get_node_properties`: Retrieve node properties
- `list_nodes`: List child nodes
- `create_shape_resource`: Create collision shapes
- `create_mesh_resource`: Create mesh resources
- `assign_node_resource`: Assign resources to nodes

### Script Commands

**Class:** `MCPScriptCommands`

**Description:** Handles script-related operations.

**Supported Operations:**
- `create_script`: Create new scripts
- `edit_script`: Modify existing scripts
- `get_script`: Retrieve script content
- `delete_script`: Remove scripts

### Scene Commands

**Class:** `MCPSceneCommands`

**Description:** Handles scene operations.

**Supported Operations:**
- `create_scene`: Create new scenes
- `load_scene`: Load existing scenes
- `save_scene`: Save scene changes
- `get_scene_info`: Get scene metadata

## TypeScript Utilities

### Godot Connection

**Class:** `GodotConnection`

**Description:** Manages WebSocket connection to Godot editor.

**Methods:**
```typescript
// Connect to Godot
async connect(): Promise<void>

// Send command
async sendCommand<T>(type: string, params?: any): Promise<T>

// Disconnect
disconnect(): void

// Check connection status
isConnected(): boolean
```

**Configuration:**
```typescript
interface GodotConnectionConfig {
  url?: string;           // WebSocket URL (default: ws://localhost:9080)
  timeout?: number;       // Command timeout in ms (default: 20000)
  maxRetries?: number;    // Max connection retries (default: 3)
  retryDelay?: number;    // Delay between retries in ms (default: 2000)
}
```

### Enhanced Error Handler

**Class:** `EnhancedErrorHandler`

**Description:** Intelligent error analysis and recovery.

**Methods:**
```typescript
// Analyze error
async analyzeError(error: ErrorContext): Promise<ErrorAnalysis>

// Apply recovery strategy
async applyRecovery(errorId: string, strategyIndex: number): Promise<RecoveryResult>

// Get error statistics
getErrorStatistics(): ErrorStatistics

// Learn from successful resolution
learnFromResolution(errorRecord: ErrorRecord): void
```

**Types:**
```typescript
interface ErrorContext {
  id: string;
  type: string;
  message: string;
  stackTrace?: string;
  context?: any;
  timestamp: number;
}

interface ErrorAnalysis {
  error: ErrorContext;
  severity: ErrorSeverity;
  category: string;
  rootCause: string;
  suggestions: RecoverySuggestion[];
  similarErrors: ErrorRecord[];
  confidence: number;
}
```

### Dynamic Prompt Manager

**Class:** `DynamicPromptManager`

**Description:** Context-aware prompt enhancement system.

**Methods:**
```typescript
// Inject dynamic prompts
async injectPrompts(basePrompt: string, context: PromptContext): Promise<string>

// Get prompt suggestions
async getPromptSuggestions(currentPrompt: string, context: PromptContext): Promise<PromptSuggestion[]>

// Learn from feedback
learnFromSuccess(injectionId: string, effectiveness: number): void

// Get injection statistics
getInjectionStatistics(): InjectionStatistics
```

### Cache Manager

**Class:** `CacheManager`

**Description:** Intelligent caching system for performance optimization.

**Methods:**
```typescript
// Get cached value
async get<T>(key: string): Promise<T | null>

// Set cached value
async set(key: string, value: any, ttl?: number): Promise<void>

// Clear cache
async clear(): Promise<void>

// Get cache statistics
getStats(): CacheStats
```

### Retry Utility

**Class:** `RetryUtility`

**Description:** Intelligent retry logic with exponential backoff.

**Methods:**
```typescript
// Execute with retry
async executeWithRetry<T>(
  operation: () => Promise<T>,
  config?: RetryConfig
): Promise<T>

// Execute with circuit breaker
async executeWithCircuitBreaker<T>(
  operation: () => Promise<T>,
  config?: CircuitBreakerConfig
): Promise<T>
```

## Configuration

### Environment Variables

```bash
# MCP Server Configuration
MCP_PORT=9080
MCP_HOST=localhost
MCP_DEBUG=true
MCP_LOG_LEVEL=info

# Godot Integration
GODOT_PROJECT_PATH=/path/to/project
GODOT_EXECUTABLE=/path/to/godot

# Performance Monitoring
PERFORMANCE_UPDATE_INTERVAL=1000
PERFORMANCE_HISTORY_SIZE=1000
PERFORMANCE_ALERT_FPS_THRESHOLD=30
PERFORMANCE_ALERT_MEMORY_THRESHOLD=500

# Error Recovery
ERROR_RECOVERY_ENABLED=true
ERROR_HISTORY_SIZE=100
ERROR_LEARNING_ENABLED=true

# Caching
CACHE_ENABLED=true
CACHE_TTL=300000
CACHE_MAX_SIZE=1000

# Retry Configuration
RETRY_MAX_ATTEMPTS=3
RETRY_BASE_DELAY=1000
RETRY_MAX_DELAY=30000
```

### TypeScript Configuration

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
    "declaration": true,
    "resolveJsonModule": true,
    "allowSyntheticDefaultImports": true
  },
  "include": ["server/src/**/*"],
  "exclude": ["node_modules", "**/*.test.ts"]
}
```

### Jest Configuration

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
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['<rootDir>/server/src/tests/setup.ts']
};
```

## Error Handling

### Error Types

```typescript
enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

enum ErrorCategory {
  NODE_ERRORS = 'node_errors',
  SCRIPT_ERRORS = 'script_errors',
  SCENE_ERRORS = 'scene_errors',
  RESOURCE_ERRORS = 'resource_errors',
  PERFORMANCE_ERRORS = 'performance_errors',
  CONNECTION_ERRORS = 'connection_errors',
  VALIDATION_ERRORS = 'validation_errors'
}
```

### Error Response Format

```typescript
interface ErrorResponse {
  status: 'error';
  message: string;
  code?: string;
  details?: any;
  suggestions?: string[];
  commandId?: string;
}
```

### Custom Error Classes

```typescript
class GodotConnectionError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'GodotConnectionError';
  }
}

class ValidationError extends Error {
  constructor(message: string, public field: string, public value: any) {
    super(message);
    this.name = 'ValidationError';
  }
}

class TimeoutError extends Error {
  constructor(message: string, public timeout: number) {
    super(message);
    this.name = 'TimeoutError';
  }
}
```

## Events and Signals

### MCP Server Events

```typescript
// Server events
interface MCPServerEvents {
  'server:start': () => void;
  'server:stop': () => void;
  'client:connect': (clientId: number) => void;
  'client:disconnect': (clientId: number) => void;
  'command:received': (clientId: number, command: any) => void;
  'command:processed': (clientId: number, result: any) => void;
  'error:occurred': (error: ErrorContext) => void;
}
```

### Godot Addon Signals

```gdscript
# MCP Panel signals
signal performance_updated(metrics: Dictionary)
signal error_detected(error: Dictionary)
signal connection_status_changed(connected: bool)

# Command processor signals
signal command_completed(client_id: int, command_type: String, result: Dictionary, command_id: String)
signal command_failed(client_id: int, command_type: String, error: Dictionary, command_id: String)
```

### Performance Monitoring Events

```typescript
interface PerformanceEvents {
  'metrics:updated': (metrics: PerformanceMetrics) => void;
  'alert:triggered': (alert: AlertInfo) => void;
  'bottleneck:detected': (bottleneck: BottleneckInfo) => void;
  'optimization:suggested': (suggestion: OptimizationSuggestion) => void;
}
```

## Type Definitions

### Core Types

```typescript
// MCP Tool interface
interface MCPTool<T = any> {
  name: string;
  description: string;
  parameters: z.ZodType<T>;
  execute: (args: T) => Promise<any>;
  annotations?: ToolAnnotations;
}

// Command result
interface CommandResult {
  [key: string]: any;
}

// WebSocket message
interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: number;
}
```

### Godot Types

```typescript
// Node information
interface NodeInfo {
  name: string;
  type: string;
  path: string;
  properties?: Record<string, any>;
  children?: NodeInfo[];
}

// Scene information
interface SceneInfo {
  path: string;
  root_node: string;
  node_count: number;
  modified: boolean;
  last_saved?: number;
}

// Script information
interface ScriptInfo {
  path: string;
  language: 'GDScript' | 'C#';
  attached_to?: string[];
  last_modified: number;
  syntax_valid: boolean;
}
```

### Performance Types

```typescript
// Performance metrics
interface PerformanceMetrics {
  fps: number;
  memory_total: number;
  memory_used: number;
  draw_calls: number;
  render_objects: number;
  physics_time: number;
  timestamp: number;
}

// Alert configuration
interface AlertConfig {
  metric: string;
  threshold: number;
  operator: '>' | '<' | '>=' | '<=';
  enabled: boolean;
  cooldown: number;
}
```

This API reference provides comprehensive documentation for all public interfaces. For implementation examples and usage patterns, see the [User Guide](USER_GUIDE.md) and [Architecture Guide](ARCHITECTURE.md).