/**
 * Response from Godot server
 */
export interface GodotResponse {
    status: 'success' | 'error';
    result?: any;
    message?: string;
    commandId?: string;
}
/**
 * Command to send to Godot
 */
export interface GodotCommand {
    type: string;
    params: Record<string, any>;
    commandId: string;
}
/**
 * Manages WebSocket connection to the Godot editor
 */
export declare class GodotConnection {
    private url;
    private timeout;
    private maxRetries;
    private retryDelay;
    private ws;
    private connected;
    private commandQueue;
    private commandId;
    /**
     * Creates a new Godot connection
     * @param url WebSocket URL for the Godot server
     * @param timeout Command timeout in ms
     * @param maxRetries Maximum number of connection retries
     * @param retryDelay Delay between retries in ms
     */
    constructor(url?: string, timeout?: number, maxRetries?: number, retryDelay?: number);
    /**
     * Connects to the Godot WebSocket server
     */
    connect(): Promise<void>;
    /**
     * Sends a command to Godot and waits for a response
     * @param type Command type
     * @param params Command parameters
     * @returns Promise that resolves with the command result
     */
    sendCommand<T = any>(type: string, params?: Record<string, any>): Promise<T>;
    /**
     * Disconnects from the Godot WebSocket server
     */
    disconnect(): void;
    /**
     * Checks if connected to Godot
     */
    isConnected(): boolean;
}
export declare class ConnectionPool {
    private pool;
    private activeConnections;
    private maxConnections;
    private connectionTimeouts;
    constructor(maxConnections?: number);
    getConnection(url?: string): Promise<GodotConnection>;
    releaseConnection(url: string): void;
    getStats(): {
        activeConnections: number;
        totalConnections: number;
        maxConnections: number;
    };
    closeAll(): Promise<void>;
}
/**
 * Gets the global connection pool instance
 */
export declare function getConnectionPool(): ConnectionPool;
/**
 * Gets a Godot connection from the pool (legacy compatibility)
 */
export declare function getGodotConnection(): Promise<GodotConnection>;
/**
 * Synchronous wrapper for backward compatibility
 * Note: This will create a new connection each time - use getGodotConnection() for pooling
 */
export declare function getGodotConnectionSync(): GodotConnection;
/**
 * Gets the singleton instance of GodotConnection (deprecated - use pool instead)
 */
export declare function getLegacyGodotConnection(): GodotConnection;
