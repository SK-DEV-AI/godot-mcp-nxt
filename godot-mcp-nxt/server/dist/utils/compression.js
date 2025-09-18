/**
 * Compression utilities for MCP server payloads
 * Provides compression for large JSON responses and resource data
 */
import { promisify } from 'util';
import { gzip, gunzip, brotliCompress, brotliDecompress } from 'zlib';
const gzipAsync = promisify(gzip);
const gunzipAsync = promisify(gunzip);
const brotliCompressAsync = promisify(brotliCompress);
const brotliDecompressAsync = promisify(brotliDecompress);
/**
 * Compress data if it meets the size threshold
 */
export async function compressData(data, options = {}) {
    const { algorithm = 'gzip', minSize = 1024, // 1KB
    level = 6 } = options;
    const inputBuffer = Buffer.isBuffer(data) ? data : Buffer.from(data, 'utf8');
    const originalSize = inputBuffer.length;
    // Don't compress if below minimum size
    if (originalSize < minSize) {
        return {
            compressed: false,
            algorithm: 'none',
            originalSize,
            compressedSize: originalSize,
            data: data
        };
    }
    try {
        let compressedBuffer;
        if (algorithm === 'brotli') {
            compressedBuffer = await brotliCompressAsync(inputBuffer);
        }
        else {
            compressedBuffer = await gzipAsync(inputBuffer, { level });
        }
        const compressedSize = compressedBuffer.length;
        // Only use compression if it actually reduces size
        if (compressedSize >= originalSize) {
            return {
                compressed: false,
                algorithm: 'none',
                originalSize,
                compressedSize: originalSize,
                data: data
            };
        }
        return {
            compressed: true,
            algorithm,
            originalSize,
            compressedSize,
            data: compressedBuffer
        };
    }
    catch (error) {
        console.warn('Compression failed, using uncompressed data:', error);
        return {
            compressed: false,
            algorithm: 'none',
            originalSize,
            compressedSize: originalSize,
            data: data
        };
    }
}
/**
 * Decompress data
 */
export async function decompressData(compressedData) {
    if (!compressedData.compressed) {
        return compressedData.data;
    }
    try {
        const inputBuffer = Buffer.isBuffer(compressedData.data)
            ? compressedData.data
            : Buffer.from(compressedData.data, 'base64');
        if (compressedData.algorithm === 'brotli') {
            return await brotliDecompressAsync(inputBuffer);
        }
        else {
            return await gunzipAsync(inputBuffer);
        }
    }
    catch (error) {
        console.error('Decompression failed:', error);
        throw new Error('Failed to decompress data');
    }
}
/**
 * Check if data should be compressed based on size and content type
 */
export function shouldCompress(data, minSize = 1024) {
    if (typeof data === 'string') {
        return data.length >= minSize;
    }
    if (Buffer.isBuffer(data)) {
        return data.length >= minSize;
    }
    // For objects, estimate JSON size
    if (typeof data === 'object') {
        try {
            const jsonString = JSON.stringify(data);
            return jsonString.length >= minSize;
        }
        catch {
            return false;
        }
    }
    return false;
}
/**
 * Compress JSON data for MCP responses
 */
export async function compressJsonResponse(data, options = {}) {
    if (!shouldCompress(data, options.minSize)) {
        return { data };
    }
    try {
        const jsonString = JSON.stringify(data);
        const compressed = await compressData(jsonString, options);
        if (compressed.compressed) {
            // Return compressed data with metadata
            return {
                data: {
                    _compressed: true,
                    _algorithm: compressed.algorithm,
                    _originalSize: compressed.originalSize,
                    _compressedSize: compressed.compressedSize,
                    _data: compressed.data.toString('base64')
                },
                compressionInfo: compressed
            };
        }
        return { data };
    }
    catch (error) {
        console.warn('JSON compression failed:', error);
        return { data };
    }
}
/**
 * Decompress JSON response
 */
export async function decompressJsonResponse(data) {
    if (typeof data === 'object' && data._compressed) {
        try {
            const compressedData = {
                compressed: true,
                algorithm: data._algorithm,
                originalSize: data._originalSize,
                compressedSize: data._compressedSize,
                data: Buffer.from(data._data, 'base64')
            };
            const decompressed = await decompressData(compressedData);
            return JSON.parse(decompressed.toString());
        }
        catch (error) {
            console.error('JSON decompression failed:', error);
            throw new Error('Failed to decompress response');
        }
    }
    return data;
}
/**
 * Get compression statistics
 */
export function getCompressionStats(compressedData) {
    if (!compressedData.compressed) {
        return { ratio: 1, savings: 0, savingsPercent: 0 };
    }
    const ratio = compressedData.compressedSize / compressedData.originalSize;
    const savings = compressedData.originalSize - compressedData.compressedSize;
    const savingsPercent = (savings / compressedData.originalSize) * 100;
    return { ratio, savings, savingsPercent };
}
//# sourceMappingURL=compression.js.map