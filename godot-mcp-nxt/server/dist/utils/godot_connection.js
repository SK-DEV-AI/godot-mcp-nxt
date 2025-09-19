import WebSocket from 'ws';
/**
 * Manages WebSocket connection to the Godot editor
 */
export class GodotConnection {
    /**
     * Creates a new Godot connection
     * @param url WebSocket URL for the Godot server
     * @param timeout Command timeout in ms
     * @param maxRetries Maximum number of connection retries
     * @param retryDelay Delay between retries in ms
     */
    constructor(url = 'ws://localhost:9080', timeout = 20000, maxRetries = 3, retryDelay = 2000) {
        this.url = url;
        this.timeout = timeout;
        this.maxRetries = maxRetries;
        this.retryDelay = retryDelay;
        this.ws = null;
        this.connected = false;
        this.commandQueue = new Map();
        this.commandId = 0;
    }
    /**
     * Connects to the Godot WebSocket server
     */
    async connect() {
        if (this.connected)
            return;
        let retries = 0;
        const tryConnect = () => {
            return new Promise((resolve, reject) => {
                console.error(`Connecting to Godot WebSocket server at ${this.url}... (Attempt ${retries + 1}/${this.maxRetries + 1})`);
                // Use protocol option to match Godot's supported_protocols
                this.ws = new WebSocket(this.url, {
                    protocol: 'json',
                    handshakeTimeout: 8000, // Increase handshake timeout
                    perMessageDeflate: false // Disable compression for compatibility
                });
                this.ws.on('open', () => {
                    this.connected = true;
                    console.error('Connected to Godot WebSocket server');
                    resolve();
                });
                this.ws.on('message', (data) => {
                    try {
                        const response = JSON.parse(data.toString());
                        console.error('Received response:', response);
                        // Handle command responses
                        if ('commandId' in response) {
                            const commandId = response.commandId;
                            const pendingCommand = this.commandQueue.get(commandId);
                            if (pendingCommand) {
                                clearTimeout(pendingCommand.timeout);
                                this.commandQueue.delete(commandId);
                                if (response.status === 'success') {
                                    pendingCommand.resolve(response.result);
                                }
                                else {
                                    pendingCommand.reject(new Error(response.message || 'Unknown error'));
                                }
                            }
                        }
                    }
                    catch (error) {
                        console.error('Error parsing response:', error);
                    }
                });
                this.ws.on('error', (error) => {
                    const err = error;
                    console.error('WebSocket error:', err);
                    // Don't terminate the connection on error - let the timeout handle it
                    // Just log the error and allow retry mechanism to work
                });
                this.ws.on('close', () => {
                    if (this.connected) {
                        console.error('Disconnected from Godot WebSocket server');
                        this.connected = false;
                    }
                });
                // Set connection timeout
                const connectionTimeout = setTimeout(() => {
                    if (this.ws?.readyState !== WebSocket.OPEN) {
                        if (this.ws) {
                            this.ws.terminate();
                            this.ws = null;
                        }
                        reject(new Error('Connection timeout'));
                    }
                }, this.timeout);
                this.ws.on('open', () => {
                    clearTimeout(connectionTimeout);
                });
            });
        };
        // Try connecting with retries
        while (retries <= this.maxRetries) {
            try {
                await tryConnect();
                return;
            }
            catch (error) {
                retries++;
                if (retries <= this.maxRetries) {
                    console.error(`Connection attempt failed. Retrying in ${this.retryDelay}ms...`);
                    await new Promise(resolve => setTimeout(resolve, this.retryDelay));
                }
                else {
                    throw error;
                }
            }
        }
    }
    /**
     * Sends a command to Godot and waits for a response
     * @param type Command type
     * @param params Command parameters
     * @returns Promise that resolves with the command result
     */
    async sendCommand(type, params = {}) {
        if (!this.ws || !this.connected) {
            try {
                await this.connect();
            }
            catch (error) {
                throw new Error(`Failed to connect: ${error.message}`);
            }
        }
        return new Promise((resolve, reject) => {
            const commandId = `cmd_${this.commandId++}`;
            const command = {
                type,
                params,
                commandId
            };
            // Set timeout for command
            const timeoutId = setTimeout(() => {
                if (this.commandQueue.has(commandId)) {
                    this.commandQueue.delete(commandId);
                    reject(new Error(`Command timed out: ${type}`));
                }
            }, this.timeout);
            // Store the promise resolvers
            this.commandQueue.set(commandId, {
                resolve,
                reject,
                timeout: timeoutId
            });
            // Send the command
            if (this.ws?.readyState === WebSocket.OPEN) {
                this.ws.send(JSON.stringify(command));
            }
            else {
                clearTimeout(timeoutId);
                this.commandQueue.delete(commandId);
                reject(new Error('WebSocket not connected'));
            }
        });
    }
    /**
     * Disconnects from the Godot WebSocket server
     */
    disconnect() {
        if (this.ws) {
            // Clear all pending commands
            this.commandQueue.forEach((command, commandId) => {
                clearTimeout(command.timeout);
                command.reject(new Error('Connection closed'));
                this.commandQueue.delete(commandId);
            });
            this.ws.close();
            this.ws = null;
            this.connected = false;
        }
    }
    /**
     * Checks if connected to Godot
     */
    isConnected() {
        return this.connected;
    }
}
// Connection Pool for managing multiple Godot connections
export class ConnectionPool {
    constructor(maxConnections = 5) {
        this.pool = new Map();
        this.activeConnections = 0;
        this.maxConnections = 5;
        this.connectionTimeouts = new Map();
        this.maxConnections = maxConnections;
    }
    async getConnection(url = 'ws://localhost:9080') {
        // Check if we already have a connection for this URL
        if (this.pool.has(url)) {
            const connection = this.pool.get(url);
            if (connection.isConnected()) {
                console.log(`Reusing existing connection for ${url}`);
                return connection;
            }
            // Remove stale connection
            this.pool.delete(url);
            this.activeConnections--;
        }
        // Check connection limit
        if (this.activeConnections >= this.maxConnections) {
            throw new Error(`Connection pool exhausted (max: ${this.maxConnections})`);
        }
        // Create new connection
        console.log(`Creating new connection for ${url}`);
        const connection = new GodotConnection(url);
        await connection.connect();
        this.pool.set(url, connection);
        this.activeConnections++;
        // Set up automatic cleanup on disconnect
        const cleanupTimeout = setTimeout(() => {
            if (this.pool.has(url) && !this.pool.get(url).isConnected()) {
                this.releaseConnection(url);
            }
        }, 30000); // 30 seconds
        this.connectionTimeouts.set(url, cleanupTimeout);
        return connection;
    }
    releaseConnection(url) {
        if (this.pool.has(url)) {
            const connection = this.pool.get(url);
            if (!connection.isConnected()) {
                console.log(`Cleaning up disconnected connection for ${url}`);
                this.pool.delete(url);
                this.activeConnections--;
                // Clear cleanup timeout
                const timeout = this.connectionTimeouts.get(url);
                if (timeout) {
                    clearTimeout(timeout);
                    this.connectionTimeouts.delete(url);
                }
            }
        }
    }
    getStats() {
        return {
            activeConnections: this.activeConnections,
            totalConnections: this.pool.size,
            maxConnections: this.maxConnections
        };
    }
    async closeAll() {
        console.log('Closing all connections in pool...');
        // Clear all timeouts
        for (const timeout of this.connectionTimeouts.values()) {
            clearTimeout(timeout);
        }
        this.connectionTimeouts.clear();
        // Close all connections
        const closePromises = Array.from(this.pool.values()).map(async (connection) => {
            try {
                connection.disconnect();
            }
            catch (error) {
                console.error('Error closing connection:', error);
            }
        });
        await Promise.all(closePromises);
        this.pool.clear();
        this.activeConnections = 0;
        console.log('All connections closed');
    }
}
// Global connection pool instance
let globalConnectionPool = null;
/**
 * Gets the global connection pool instance
 */
export function getConnectionPool() {
    if (!globalConnectionPool) {
        globalConnectionPool = new ConnectionPool();
    }
    return globalConnectionPool;
}
/**
 * Gets a Godot connection from the pool (legacy compatibility)
 */
export async function getGodotConnection() {
    const pool = getConnectionPool();
    return pool.getConnection();
}
/**
 * Synchronous wrapper for backward compatibility
 * Note: This will create a new connection each time - use getGodotConnection() for pooling
 */
export function getGodotConnectionSync() {
    return new GodotConnection();
}
// Singleton instance for backward compatibility
let connectionInstance = null;
/**
 * Gets the singleton instance of GodotConnection (deprecated - use pool instead)
 */
export function getLegacyGodotConnection() {
    if (!connectionInstance) {
        connectionInstance = new GodotConnection();
    }
    return connectionInstance;
}
//# sourceMappingURL=godot_connection.js.map