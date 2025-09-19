// Plugin Architecture for Godot MCP Server
// Enables modular extensions and third-party integrations
export class PluginManager {
    constructor(server, logger) {
        this.server = server;
        this.logger = logger;
        this.plugins = new Map();
        this.pluginContexts = new Map();
        this.pluginMetadata = new Map();
        this.eventListeners = new Map(); // event -> Set of plugin names
        this.commandHandlers = new Map();
        this.pluginHealth = new Map();
    }
    async loadPlugin(pluginPath, config = {}) {
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
                this.eventListeners.get(capability).add(plugin.name);
            }
            console.log(`Plugin ${plugin.name} v${plugin.version} loaded successfully`);
            // Start health monitoring
            this.startHealthMonitoring(plugin.name);
        }
        catch (error) {
            console.error(`Failed to load plugin from ${pluginPath}:`, error);
            throw error;
        }
    }
    async unloadPlugin(pluginName) {
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
        }
        catch (error) {
            console.error(`Error unloading plugin ${pluginName}:`, error);
            throw error;
        }
    }
    async handleCommand(command, params) {
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
    async emitEvent(event, data) {
        const listeners = this.eventListeners.get(event);
        if (!listeners)
            return;
        const promises = Array.from(listeners).map(async (pluginName) => {
            const plugin = this.plugins.get(pluginName);
            if (plugin) {
                try {
                    await plugin.handleEvent(event, data);
                }
                catch (error) {
                    console.error(`Plugin ${pluginName} failed to handle event ${event}:`, error);
                }
            }
        });
        await Promise.all(promises);
    }
    getPlugin(pluginName) {
        return this.plugins.get(pluginName);
    }
    getAllPlugins() {
        return Array.from(this.plugins.entries()).map(([name, plugin]) => ({
            name,
            version: plugin.version,
            status: this.getPluginStatus(name)
        }));
    }
    getPluginHealth() {
        const health = {};
        for (const [name, status] of this.pluginHealth.entries()) {
            health[name] = status;
        }
        return health;
    }
    createPluginContext(plugin, config) {
        return {
            server: this.server,
            config,
            logger: this.logger,
            cache: null, // Would be injected
            queue: null, // Would be injected
            emitEvent: (event, data) => this.emitEvent(event, data),
            registerCommand: (command, handler) => {
                this.commandHandlers.set(command, { plugin: plugin.name, handler });
            },
            unregisterCommand: (command) => {
                const handlerInfo = this.commandHandlers.get(command);
                if (handlerInfo?.plugin === plugin.name) {
                    this.commandHandlers.delete(command);
                }
            }
        };
    }
    async loadPluginModule(pluginPath) {
        // In Node.js environment
        if (typeof require !== 'undefined') {
            return require(pluginPath);
        }
        // In browser environment or with ES modules
        try {
            // Use dynamic import syntax
            return await (new Function('path', 'return import(path)'))(pluginPath);
        }
        catch (e) {
            throw new Error('ES modules not supported in this environment');
        }
        throw new Error('Cannot load plugin: no module loading mechanism available');
    }
    async loadPluginMetadata(pluginPath) {
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
        }
        catch (error) {
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
    validatePluginInterface(plugin) {
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
    getPluginStatus(pluginName) {
        const health = this.pluginHealth.get(pluginName);
        if (!health)
            return 'unknown';
        switch (health.status) {
            case 'healthy': return 'running';
            case 'degraded': return 'degraded';
            case 'unhealthy': return 'error';
            default: return 'unknown';
        }
    }
    startHealthMonitoring(pluginName) {
        const checkHealth = async () => {
            const plugin = this.plugins.get(pluginName);
            if (!plugin)
                return;
            try {
                const health = await plugin.getHealthStatus();
                this.pluginHealth.set(pluginName, {
                    ...health,
                    lastCheck: Date.now()
                });
            }
            catch (error) {
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
        this[`healthInterval_${pluginName}`] = interval;
    }
    stopHealthMonitoring(pluginName) {
        const interval = this[`healthInterval_${pluginName}`];
        if (interval) {
            clearInterval(interval);
            delete this[`healthInterval_${pluginName}`];
        }
    }
}
// Plugin discovery and loading utilities
export class PluginLoader {
    constructor(pluginDirs = []) {
        this.pluginDirectories = [];
        this.pluginDirectories = pluginDirs.length > 0
            ? pluginDirs
            : ['./plugins', './node_modules/@godot-mcp-plugins/'];
    }
    async discoverPlugins() {
        const plugins = [];
        for (const dir of this.pluginDirectories) {
            try {
                const discovered = await this.scanDirectory(dir);
                plugins.push(...discovered);
            }
            catch (error) {
                console.warn(`Failed to scan plugin directory ${dir}:`, error);
            }
        }
        return plugins;
    }
    async scanDirectory(dir) {
        // This would implement directory scanning logic
        // For now, return empty array
        return [];
    }
    async installPlugin(packageName) {
        // This would implement plugin installation from npm or other registries
        console.log(`Installing plugin: ${packageName}`);
        // Implementation would use npm, yarn, or other package manager
    }
    async updatePlugin(pluginName) {
        // This would implement plugin updates
        console.log(`Updating plugin: ${pluginName}`);
        // Implementation would check for updates and install new version
    }
}
// Global plugin manager instance
let globalPluginManager = null;
export function getPluginManager(server, logger) {
    if (!globalPluginManager) {
        if (!server || !logger) {
            throw new Error('Server and logger required for first PluginManager initialization');
        }
        globalPluginManager = new PluginManager(server, logger);
    }
    return globalPluginManager;
}
export function getPluginLoader() {
    return new PluginLoader();
}
// Base plugin class for easier plugin development
export class BasePlugin {
    async initialize(context) {
        this.context = context;
        this.context.logger.info(`Initializing plugin ${this.name} v${this.version}`);
    }
    async handleEvent(event, data) {
        // Default implementation - plugins can override
        this.context.logger.debug(`Plugin ${this.name} received event: ${event}`);
    }
    async cleanup() {
        this.context.logger.info(`Cleaning up plugin ${this.name}`);
    }
    async getHealthStatus() {
        return {
            status: 'healthy',
            message: 'Plugin is running normally',
            lastCheck: Date.now(),
            metrics: {}
        };
    }
}
//# sourceMappingURL=plugin_system.js.map