import WebSocket from 'ws';
import { connectionLogger } from './logger.js';
import { getConfig } from './config.js';

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
export class GodotConnection {
  private ws: WebSocket | null = null;
  private connected = false;
  private commandQueue: Map<string, { 
    resolve: (value: any) => void;
    reject: (reason: any) => void;
    timeout: NodeJS.Timeout;
  }> = new Map();
  private commandId = 0;
  
  /**
   * Creates a new Godot connection
   * @param url WebSocket URL for the Godot server
   * @param timeout Command timeout in ms
   * @param maxRetries Maximum number of connection retries
   * @param retryDelay Delay between retries in ms
   */
  constructor(
    private url: string = `ws://localhost:${getConfig().godotWsPort}`,
    private timeout: number = getConfig().connectionTimeout,
    private maxRetries: number = getConfig().maxRetries,
    private retryDelay: number = getConfig().retryDelay
  ) {
  }
  
  /**
   * Connects to the Godot WebSocket server
   */
  async connect(): Promise<void> {
    if (this.connected) return;
    
    let retries = 0;
    
    const tryConnect = (): Promise<void> => {
      return new Promise<void>((resolve, reject) => {
        connectionLogger.info(`Connecting to Godot WebSocket server`, { attempt: retries + 1, maxAttempts: this.maxRetries + 1, url: this.url });
        
        this.ws = new WebSocket(this.url);

        this.ws.on('open', () => {
          this.connected = true;
          resolve();
        });

        this.ws.on('message', (data: Buffer, isBinary: boolean) => {
          try {
            // Handle both Buffer and string messages (ws v8+ compatibility fix)
            let messageText: string;
            if (Buffer.isBuffer(data)) {
              messageText = data.toString('utf8');
            } else if (typeof data === 'string') {
              messageText = data;
            } else {
              connectionLogger.warn('Unknown message data type', { dataType: typeof data });
              return;
            }

            const response: GodotResponse = JSON.parse(messageText);

            // Handle command responses
            if ('commandId' in response) {
              const commandId = response.commandId as string;
              const pendingCommand = this.commandQueue.get(commandId);

              if (pendingCommand) {
                clearTimeout(pendingCommand.timeout);
                this.commandQueue.delete(commandId);

                if (response.status === 'success') {
                  pendingCommand.resolve(response.result);
                } else {
                  pendingCommand.reject(new Error(response.message || 'Unknown error'));
                }
              }
            }
          } catch (error) {
            connectionLogger.error('Error parsing WebSocket response', { error: (error as Error).message });
          }
        });

        this.ws.on('error', (error) => {
          console.error('WebSocket error:', error);
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
      } catch (error) {
        retries++;
        
        if (retries <= this.maxRetries) {
          console.error(`Connection attempt failed. Retrying in ${this.retryDelay}ms...`);
          await new Promise(resolve => setTimeout(resolve, this.retryDelay));
        } else {
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
  async sendCommand<T = any>(type: string, params: Record<string, any> = {}): Promise<T> {
    if (!this.ws || !this.connected) {
      try {
        await this.connect();
      } catch (error) {
        throw new Error(`Failed to connect: ${(error as Error).message}`);
      }
    }
    
    return new Promise<T>((resolve, reject) => {
      const commandId = `cmd_${this.commandId++}`;
      
      const command: GodotCommand = {
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
      } else {
        clearTimeout(timeoutId);
        this.commandQueue.delete(commandId);
        reject(new Error('WebSocket not connected'));
      }
    });
  }
  
  /**
   * Disconnects from the Godot WebSocket server
   */
  disconnect(): void {
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
  isConnected(): boolean {
    return this.connected;
  }
}

// Connection Pool for managing multiple Godot connections
export class ConnectionPool {
  private pool = new Map<string, GodotConnection>();
  private activeConnections = 0;
  private maxConnections = 5;
  private connectionTimeouts = new Map<string, NodeJS.Timeout>();

  constructor(maxConnections = 5) {
    this.maxConnections = maxConnections;
  }

  async getConnection(url: string = 'ws://localhost:9080'): Promise<GodotConnection> {
    // Check if we already have a connection for this URL
    if (this.pool.has(url)) {
      const connection = this.pool.get(url)!;
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
      if (this.pool.has(url) && !this.pool.get(url)!.isConnected()) {
        this.releaseConnection(url);
      }
    }, 30000); // 30 seconds

    this.connectionTimeouts.set(url, cleanupTimeout);

    return connection;
  }

  releaseConnection(url: string): void {
    if (this.pool.has(url)) {
      const connection = this.pool.get(url)!;
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

  getStats(): {
    activeConnections: number;
    totalConnections: number;
    maxConnections: number;
  } {
    return {
      activeConnections: this.activeConnections,
      totalConnections: this.pool.size,
      maxConnections: this.maxConnections
    };
  }

  async closeAll(): Promise<void> {
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
      } catch (error) {
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
let globalConnectionPool: ConnectionPool | null = null;

/**
 * Gets the global connection pool instance
 */
export function getConnectionPool(): ConnectionPool {
  if (!globalConnectionPool) {
    globalConnectionPool = new ConnectionPool();
  }
  return globalConnectionPool;
}

/**
 * Gets a Godot connection from the pool (legacy compatibility)
 */
export async function getGodotConnection(): Promise<GodotConnection> {
  const pool = getConnectionPool();
  return pool.getConnection();
}

/**
 * Synchronous wrapper for backward compatibility
 * Note: This will create a new connection each time - use getGodotConnection() for pooling
 */
export function getGodotConnectionSync(): GodotConnection {
  return new GodotConnection();
}

// Singleton instance for backward compatibility
let connectionInstance: GodotConnection | null = null;

/**
 * Gets the singleton instance of GodotConnection (deprecated - use pool instead)
 */
export function getLegacyGodotConnection(): GodotConnection {
  if (!connectionInstance) {
    connectionInstance = new GodotConnection();
  }
  return connectionInstance;
}