/**
 * Centralized logging system for Godot MCP server
 * Supports configurable log levels via environment variables
 */
export declare enum LogLevel {
    ERROR = 0,
    WARN = 1,
    INFO = 2,
    DEBUG = 3,
    TRACE = 4
}
export interface LogContext {
    component?: string;
    operation?: string;
    userId?: string;
    sessionId?: string;
    [key: string]: any;
}
export declare class Logger {
    private component;
    private minLevel;
    constructor(component: string);
    private getConfiguredLevel;
    private shouldLog;
    private formatMessage;
    error(message: string, context?: LogContext): void;
    warn(message: string, context?: LogContext): void;
    info(message: string, context?: LogContext): void;
    debug(message: string, context?: LogContext): void;
    trace(message: string, context?: LogContext): void;
    private timers;
    startTimer(label: string): void;
    endTimer(label: string, context?: LogContext): number;
    logRequest(commandType: string, params: any, commandId: string): void;
    logResponse(commandType: string, result: any, commandId: string, duration?: number): void;
    logError(commandType: string, error: Error, commandId?: string): void;
    private truncateObject;
}
export declare const connectionLogger: Logger;
export declare const websocketLogger: Logger;
export declare const commandLogger: Logger;
export declare const performanceLogger: Logger;
export declare const toolLogger: Logger;
export declare const cacheLogger: Logger;
export declare const errorLogger: Logger;
export declare function createLogger(component: string): Logger;
export declare function isDebugEnabled(): boolean;
export declare function isTraceEnabled(): boolean;
declare const _default: Logger;
export default _default;
