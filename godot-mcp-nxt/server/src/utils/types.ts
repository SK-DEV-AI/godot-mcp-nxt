import { z } from 'zod';

/**
 * Interface for FastMCP tool definition
 */
export interface MCPTool<T = any> {
  name: string;
  description: string;
  parameters: z.ZodType<T>;
  execute: (args: T, context?: { reportProgress?: any; streamContent?: any }) => Promise<any>;
  annotations?: {
    streamingHint?: boolean;
    readOnlyHint?: boolean;
    openWorldHint?: boolean;
    title?: string;
  };
}

/**
 * Generic response from a Godot command
 */
export interface CommandResult {
  [key: string]: any;
}

/**
 * Standard tool result format
 */
export interface ToolResult {
  content: Array<{ type: string; text: string }>;
}