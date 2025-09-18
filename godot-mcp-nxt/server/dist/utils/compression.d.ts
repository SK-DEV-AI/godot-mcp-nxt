/**
 * Compression utilities for MCP server payloads
 * Provides compression for large JSON responses and resource data
 */
export interface CompressionOptions {
    algorithm?: 'gzip' | 'brotli';
    minSize?: number;
    level?: number;
}
export interface CompressedData {
    compressed: boolean;
    algorithm: string;
    originalSize: number;
    compressedSize: number;
    data: Buffer | string;
}
/**
 * Compress data if it meets the size threshold
 */
export declare function compressData(data: string | Buffer, options?: CompressionOptions): Promise<CompressedData>;
/**
 * Decompress data
 */
export declare function decompressData(compressedData: CompressedData): Promise<string | Buffer>;
/**
 * Check if data should be compressed based on size and content type
 */
export declare function shouldCompress(data: any, minSize?: number): boolean;
/**
 * Compress JSON data for MCP responses
 */
export declare function compressJsonResponse(data: any, options?: CompressionOptions): Promise<{
    data: any;
    compressionInfo?: CompressedData;
}>;
/**
 * Decompress JSON response
 */
export declare function decompressJsonResponse(data: any): Promise<any>;
/**
 * Get compression statistics
 */
export declare function getCompressionStats(compressedData: CompressedData): {
    ratio: number;
    savings: number;
    savingsPercent: number;
};
