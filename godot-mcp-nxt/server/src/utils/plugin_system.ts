// Plugin Architecture for Godot MCP Server
// Enables modular extensions and third-party integrations

export interface MCPPlugin {
  name: string;
  version: string;
  description: string;
  author: string;
  capabilities: string[];
  dependencies?: string[];

  initialize(context: PluginContext): Promise<void>;
  handleCommand(command: string, params: any): Promise<any>;
  handleEvent(event: string, data: any): Promise<void>;
  cleanup(): Promise<void>;
  getHealthStatus(): Promise<PluginHealthStatus>;
}

export interface PluginContext {
  server: any; // Reference to main server
  config: Record<string, any>;
  logger: PluginLogger;
  cache: any; // Cache system reference
  queue: any; // Queue system reference
  emitEvent: (event: string, data: any) => Promise<void>;
  registerCommand: (command: string, handler: Function) => void;
  unregisterCommand: (command: string) => void;
}

export interface PluginLogger {
  debug: (message: string, meta?: any) => void;
  info: (message: string, meta?: any) => void;
  warn: (message: string, meta?: any) => void;
  error: (message: string, meta?: any) => void;
}

export interface PluginHealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  message: string;
  lastCheck: number;
  metrics: Record<string, any>;
}

export interface PluginMetadata {
  name: string;
  version: string;
  description: string;
  author: string;
  homepage?: string;
  repository?: string;
  license?: string;
  capabilities: string[];
  dependencies: string[];
  configSchema?: Record<string, any>;
}

export class PluginManager {
  private plugins = new Map<string, MCPPlugin>();
  private pluginContexts = new Map<string, PluginContext>();
  private pluginMetadata = new Map<string, PluginMetadata>();
  private eventListeners = new Map<string, Set<string>>(); // event -> Set of plugin names
  private commandHandlers = new Map<string, { plugin: string; handler: Function }>();
  private pluginHealth = new Map<string, PluginHealthStatus>();

  constructor(private server: any, private logger: PluginLogger) {}

  async loadPlugin(pluginPath: string, config: Record<string, any> = {}): Promise<void> {
    try {
      console.log(`Loading plugin from: ${pluginPath}`);

      // Load plugin module
      const pluginModule = await this.loadPluginModule(pluginPath);
      const PluginClass = pluginModule.default || pluginModule;

      // Create plugin instance
      const plugin = new PluginClass();

      // Validate plugin interface
      this.validatePluginInterface(plugin);

      // Load plugin metadata
      const metadata = await this.loadPluginMetadata(pluginPath);
      this.pluginMetadata.set(plugin.name, metadata);

      // Create plugin context
      const context = this.createPluginContext(plugin, config);
      this.pluginContexts.set(plugin.name, context);

      // Initialize plugin
      await plugin.initialize(context);

      // Register plugin
      this.plugins.set(plugin.name, plugin);

      // Register event listeners
      for (const capability of plugin.capabilities) {
        if (!this.eventListeners.has(capability)) {
          this.eventListeners.set(capability, new Set());
        }
        this.eventListeners.get(capability)!.add(plugin.name);
      }

      console.log(`Plugin ${plugin.name} v${plugin.version} loaded successfully`);

      // Start health monitoring
      this.startHealthMonitoring(plugin.name);

    } catch (error) {
      console.error(`Failed to load plugin from ${pluginPath}:`, error);
      throw error;
    }
  }

  async unloadPlugin(pluginName: string): Promise<void> {
    const plugin = this.plugins.get(pluginName);
    if (!plugin) {
      throw new Error(`Plugin ${pluginName} not found`);
    }

    try {
      // Stop health monitoring
      this.stopHealthMonitoring(pluginName);

      // Cleanup plugin
      await plugin.cleanup();

      // Unregister event listeners
      for (const capability of plugin.capabilities) {
        const listeners = this.eventListeners.get(capability);
        if (listeners) {
          listeners.delete(pluginName);
          if (listeners.size === 0) {
            this.eventListeners.delete(capability);
          }
        }
      }

      // Unregister commands
      for (const [command, handlerInfo] of this.commandHandlers.entries()) {
        if (handlerInfo.plugin === pluginName) {
          this.commandHandlers.delete(command);
        }
      }

      // Remove plugin
      this.plugins.delete(pluginName);
      this.pluginContexts.delete(pluginName);
      this.pluginMetadata.delete(pluginName);
      this.pluginHealth.delete(pluginName);

      console.log(`Plugin ${pluginName} unloaded successfully`);

    } catch (error) {
      console.error(`Error unloading plugin ${pluginName}:`, error);
      throw error;
    }
  }

  async handleCommand(command: string, params: any): Promise<any> {
    // Check if command is handled by a plugin
    const handlerInfo = this.commandHandlers.get(command);
    if (handlerInfo) {
      const plugin = this.plugins.get(handlerInfo.plugin);
      if (plugin) {
        return await plugin.handleCommand(command, params);
      }
    }

    // Check if any plugin can handle this command
    for (const plugin of this.plugins.values()) {
      if (plugin.capabilities.includes(`command:${command}`)) {
        return await plugin.handleCommand(command, params);
      }
    }

    throw new Error(`No plugin can handle command: ${command}`);
  }

  async emitEvent(event: string, data: any): Promise<void> {
    const listeners = this.eventListeners.get(event);
    if (!listeners) return;

    const promises = Array.from(listeners).map(async (pluginName) => {
      const plugin = this.plugins.get(pluginName);
      if (plugin) {
        try {
          await plugin.handleEvent(event, data);
        } catch (error) {
          console.error(`Plugin ${pluginName} failed to handle event ${event}:`, error);
        }
      }
    });

    await Promise.all(promises);
  }

  getPlugin(pluginName: string): MCPPlugin | undefined {
    return this.plugins.get(pluginName);
  }

  getAllPlugins(): Array<{ name: string; version: string; status: string }> {
    return Array.from(this.plugins.entries()).map(([name, plugin]) => ({
      name,
      version: plugin.version,
      status: this.getPluginStatus(name)
    }));
  }

  getPluginHealth(): Record<string, PluginHealthStatus> {
    const health: Record<string, PluginHealthStatus> = {};
    for (const [name, status] of this.pluginHealth.entries()) {
      health[name] = status;
    }
    return health;
  }

  private createPluginContext(plugin: MCPPlugin, config: Record<string, any>): PluginContext {
    return {
      server: this.server,
      config,
      logger: this.logger,
      cache: null, // Would be injected
      queue: null, // Would be injected
      emitEvent: (event: string, data: any) => this.emitEvent(event, data),
      registerCommand: (command: string, handler: Function) => {
        this.commandHandlers.set(command, { plugin: plugin.name, handler });
      },
      unregisterCommand: (command: string) => {
        const handlerInfo = this.commandHandlers.get(command);
        if (handlerInfo?.plugin === plugin.name) {
          this.commandHandlers.delete(command);
        }
      }
    };
  }

  private async loadPluginModule(pluginPath: string): Promise<any> {
    // In Node.js environment
    if (typeof require !== 'undefined') {
      return require(pluginPath);
    }

    // In browser environment or with ES modules
    try {
      // Use dynamic import syntax
      return await (new Function('path', 'return import(path)'))(pluginPath);
    } catch (e) {
      throw new Error('ES modules not supported in this environment');
    }

    throw new Error('Cannot load plugin: no module loading mechanism available');
  }

  private async loadPluginMetadata(pluginPath: string): Promise<PluginMetadata> {
    try {
      const packageJsonPath = pluginPath.replace(/\.js$/, '/package.json');
      const packageJson = await this.loadPluginModule(packageJsonPath);

      return {
        name: packageJson.name,
        version: packageJson.version,
        description: packageJson.description,
        author: packageJson.author,
        homepage: packageJson.homepage,
        repository: packageJson.repository,
        license: packageJson.license,
        capabilities: packageJson.mcpCapabilities || [],
        dependencies: packageJson.dependencies || [],
        configSchema: packageJson.mcpConfigSchema
      };
    } catch (error) {
      // Fallback metadata
      return {
        name: 'unknown',
        version: '0.0.0',
        description: 'Plugin loaded without metadata',
        author: 'unknown',
        capabilities: [],
        dependencies: []
      };
    }
  }

  private validatePluginInterface(plugin: any): void {
    const requiredMethods = ['initialize', 'handleCommand', 'handleEvent', 'cleanup', 'getHealthStatus'];
    const requiredProperties = ['name', 'version', 'capabilities'];

    for (const prop of requiredProperties) {
      if (!(prop in plugin)) {
        throw new Error(`Plugin missing required property: ${prop}`);
      }
    }

    for (const method of requiredMethods) {
      if (typeof plugin[method] !== 'function') {
        throw new Error(`Plugin missing required method: ${method}`);
      }
    }
  }

  private getPluginStatus(pluginName: string): string {
    const health = this.pluginHealth.get(pluginName);
    if (!health) return 'unknown';

    switch (health.status) {
      case 'healthy': return 'running';
      case 'degraded': return 'degraded';
      case 'unhealthy': return 'error';
      default: return 'unknown';
    }
  }

  private startHealthMonitoring(pluginName: string): void {
    const checkHealth = async () => {
      const plugin = this.plugins.get(pluginName);
      if (!plugin) return;

      try {
        const health = await plugin.getHealthStatus();
        this.pluginHealth.set(pluginName, {
          ...health,
          lastCheck: Date.now()
        });
      } catch (error) {
        this.pluginHealth.set(pluginName, {
          status: 'unhealthy',
          message: `Health check failed: ${error instanceof Error ? error.message : String(error)}`,
          lastCheck: Date.now(),
          metrics: {}
        });
      }
    };

    // Initial health check
    checkHealth();

    // Schedule periodic health checks (every 30 seconds)
    const interval = setInterval(checkHealth, 30000);

    // Store interval for cleanup
    (this as any)[`healthInterval_${pluginName}`] = interval;
  }

  private stopHealthMonitoring(pluginName: string): void {
    const interval = (this as any)[`healthInterval_${pluginName}`];
    if (interval) {
      clearInterval(interval);
      delete (this as any)[`healthInterval_${pluginName}`];
    }
  }
}

// Plugin discovery and loading utilities
export class PluginLoader {
  private pluginDirectories: string[] = [];

  constructor(pluginDirs: string[] = []) {
    this.pluginDirectories = pluginDirs.length > 0
      ? pluginDirs
      : ['./plugins', './node_modules/@godot-mcp-plugins/'];
  }

  async discoverPlugins(): Promise<Array<{ path: string; metadata: PluginMetadata }>> {
    const plugins: Array<{ path: string; metadata: PluginMetadata }> = [];

    for (const dir of this.pluginDirectories) {
      try {
        const discovered = await this.scanDirectory(dir);
        plugins.push(...discovered);
      } catch (error) {
        console.warn(`Failed to scan plugin directory ${dir}:`, error);
      }
    }

    return plugins;
  }

  private async scanDirectory(dir: string): Promise<Array<{ path: string; metadata: PluginMetadata }>> {
    // This would implement directory scanning logic
    // For now, return empty array
    return [];
  }

  async installPlugin(packageName: string): Promise<void> {
    // This would implement plugin installation from npm or other registries
    console.log(`Installing plugin: ${packageName}`);
    // Implementation would use npm, yarn, or other package manager
  }

  async updatePlugin(pluginName: string): Promise<void> {
    // This would implement plugin updates
    console.log(`Updating plugin: ${pluginName}`);
    // Implementation would check for updates and install new version
  }
}

// Global plugin manager instance
let globalPluginManager: PluginManager | null = null;

export function getPluginManager(server?: any, logger?: PluginLogger): PluginManager {
  if (!globalPluginManager) {
    if (!server || !logger) {
      throw new Error('Server and logger required for first PluginManager initialization');
    }
    globalPluginManager = new PluginManager(server, logger);
  }
  return globalPluginManager;
}

export function getPluginLoader(): PluginLoader {
  return new PluginLoader();
}

// Base plugin class for easier plugin development
export abstract class BasePlugin implements MCPPlugin {
  abstract name: string;
  abstract version: string;
  abstract description: string;
  abstract author: string;
  abstract capabilities: string[];

  protected context!: PluginContext;

  async initialize(context: PluginContext): Promise<void> {
    this.context = context;
    this.context.logger.info(`Initializing plugin ${this.name} v${this.version}`);
  }

  abstract handleCommand(command: string, params: any): Promise<any>;

  async handleEvent(event: string, data: any): Promise<void> {
    // Default implementation - plugins can override
    this.context.logger.debug(`Plugin ${this.name} received event: ${event}`);
  }

  async cleanup(): Promise<void> {
    this.context.logger.info(`Cleaning up plugin ${this.name}`);
  }

  async getHealthStatus(): Promise<PluginHealthStatus> {
    return {
      status: 'healthy',
      message: 'Plugin is running normally',
      lastCheck: Date.now(),
      metrics: {}
    };
  }
}