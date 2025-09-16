import { MCPTool } from '../utils/types.js';
export declare const cliTools: MCPTool[];
export declare function handleCliTool(name: string, args: any): Promise<string | {
    content: {
        type: string;
        text: string;
    }[];
}>;
