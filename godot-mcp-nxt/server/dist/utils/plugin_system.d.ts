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
    server: any;
    config: Record<string, any>;
    logger: PluginLogger;
    cache: any;
    queue: any;
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
export declare class PluginManager {
    private server;
    private logger;
    private plugins;
    private pluginContexts;
    private pluginMetadata;
    private eventListeners;
    private commandHandlers;
    private pluginHealth;
    constructor(server: any, logger: PluginLogger);
    loadPlugin(pluginPath: string, config?: Record<string, any>): Promise<void>;
    unloadPlugin(pluginName: string): Promise<void>;
    handleCommand(command: string, params: any): Promise<any>;
    emitEvent(event: string, data: any): Promise<void>;
    getPlugin(pluginName: string): MCPPlugin | undefined;
    getAllPlugins(): Array<{
        name: string;
        version: string;
        status: string;
    }>;
    getPluginHealth(): Record<string, PluginHealthStatus>;
    private createPluginContext;
    private loadPluginModule;
    private loadPluginMetadata;
    private validatePluginInterface;
    private getPluginStatus;
    private startHealthMonitoring;
    private stopHealthMonitoring;
}
export declare class PluginLoader {
    private pluginDirectories;
    constructor(pluginDirs?: string[]);
    discoverPlugins(): Promise<Array<{
        path: string;
        metadata: PluginMetadata;
    }>>;
    private scanDirectory;
    installPlugin(packageName: string): Promise<void>;
    updatePlugin(pluginName: string): Promise<void>;
}
export declare function getPluginManager(server?: any, logger?: PluginLogger): PluginManager;
export declare function getPluginLoader(): PluginLoader;
export declare abstract class BasePlugin implements MCPPlugin {
    abstract name: string;
    abstract version: string;
    abstract description: string;
    abstract author: string;
    abstract capabilities: string[];
    protected context: PluginContext;
    initialize(context: PluginContext): Promise<void>;
    abstract handleCommand(command: string, params: any): Promise<any>;
    handleEvent(event: string, data: any): Promise<void>;
    cleanup(): Promise<void>;
    getHealthStatus(): Promise<PluginHealthStatus>;
}
