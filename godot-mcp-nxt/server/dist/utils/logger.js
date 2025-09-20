/**
 * Centralized logging system for Godot MCP server
 * Supports configurable log levels via environment variables
 */
export var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["ERROR"] = 0] = "ERROR";
    LogLevel[LogLevel["WARN"] = 1] = "WARN";
    LogLevel[LogLevel["INFO"] = 2] = "INFO";
    LogLevel[LogLevel["DEBUG"] = 3] = "DEBUG";
    LogLevel[LogLevel["TRACE"] = 4] = "TRACE";
})(LogLevel || (LogLevel = {}));
export class Logger {
    constructor(component) {
        // Performance timing helpers
        this.timers = new Map();
        this.component = component;
        this.minLevel = this.getConfiguredLevel();
    }
    getConfiguredLevel() {
        // Check global log level
        const globalLevel = process.env.LOG_LEVEL || process.env.DEBUG_LEVEL || 'INFO';
        const componentLevel = process.env[`LOG_LEVEL_${this.component.toUpperCase()}`];
        // Component-specific level takes precedence
        const levelStr = componentLevel || globalLevel;
        switch (levelStr.toUpperCase()) {
            case 'ERROR': return LogLevel.ERROR;
            case 'WARN': return LogLevel.WARN;
            case 'INFO': return LogLevel.INFO;
            case 'DEBUG': return LogLevel.DEBUG;
            case 'TRACE': return LogLevel.TRACE;
            default: return LogLevel.INFO;
        }
    }
    shouldLog(level) {
        return level <= this.minLevel;
    }
    formatMessage(level, message, context) {
        const timestamp = new Date().toISOString();
        const component = this.component;
        const contextStr = context ? ` ${JSON.stringify(context)}` : '';
        return `[${timestamp}] ${level} [${component}] ${message}${contextStr}`;
    }
    error(message, context) {
        if (this.shouldLog(LogLevel.ERROR)) {
            console.error(this.formatMessage('ERROR', message, context));
        }
    }
    warn(message, context) {
        if (this.shouldLog(LogLevel.WARN)) {
            console.warn(this.formatMessage('WARN', message, context));
        }
    }
    info(message, context) {
        if (this.shouldLog(LogLevel.INFO)) {
            console.log(this.formatMessage('INFO', message, context));
        }
    }
    debug(message, context) {
        if (this.shouldLog(LogLevel.DEBUG)) {
            console.log(this.formatMessage('DEBUG', message, context));
        }
    }
    trace(message, context) {
        if (this.shouldLog(LogLevel.TRACE)) {
            console.log(this.formatMessage('TRACE', message, context));
        }
    }
    startTimer(label) {
        this.timers.set(label, Date.now());
        this.debug(`Timer started: ${label}`);
    }
    endTimer(label, context) {
        const startTime = this.timers.get(label);
        if (!startTime) {
            this.warn(`Timer '${label}' was not started`);
            return 0;
        }
        const duration = Date.now() - startTime;
        this.timers.delete(label);
        const contextWithDuration = { ...context, duration };
        this.debug(`Timer ended: ${label} (${duration}ms)`, contextWithDuration);
        return duration;
    }
    // Request/response logging for MCP protocol
    logRequest(commandType, params, commandId) {
        this.debug(`Processing command: ${commandType}`, {
            commandId,
            params: this.truncateObject(params)
        });
    }
    logResponse(commandType, result, commandId, duration) {
        const context = { commandId };
        if (duration !== undefined) {
            context.duration = duration;
        }
        this.debug(`Command completed: ${commandType}`, {
            ...context,
            result: this.truncateObject(result)
        });
    }
    logError(commandType, error, commandId) {
        this.error(`Command failed: ${commandType}`, {
            commandId,
            error: error.message,
            stack: error.stack
        });
    }
    // Utility to truncate large objects for logging
    truncateObject(obj, maxLength = 500) {
        if (typeof obj === 'string' && obj.length > maxLength) {
            return obj.substring(0, maxLength) + '...';
        }
        if (typeof obj === 'object' && obj !== null) {
            const truncated = {};
            for (const [key, value] of Object.entries(obj)) {
                if (typeof value === 'string' && value.length > maxLength) {
                    truncated[key] = value.substring(0, maxLength) + '...';
                }
                else if (typeof value === 'object' && value !== null) {
                    truncated[key] = this.truncateObject(value, maxLength);
                }
                else {
                    truncated[key] = value;
                }
            }
            return truncated;
        }
        return obj;
    }
}
// Global logger instances for different components
export const connectionLogger = new Logger('connection');
export const websocketLogger = new Logger('websocket');
export const commandLogger = new Logger('command');
export const performanceLogger = new Logger('performance');
export const toolLogger = new Logger('tool');
export const cacheLogger = new Logger('cache');
export const errorLogger = new Logger('error');
// Utility function to create component-specific loggers
export function createLogger(component) {
    return new Logger(component);
}
// Debug mode detection
export function isDebugEnabled() {
    return process.env.DEBUG === 'true' || process.env.LOG_LEVEL === 'DEBUG' || process.env.LOG_LEVEL === 'TRACE';
}
export function isTraceEnabled() {
    return process.env.LOG_LEVEL === 'TRACE';
}
// Export default logger for convenience
export default createLogger('default');
//# sourceMappingURL=logger.js.map