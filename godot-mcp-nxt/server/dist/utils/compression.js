/**
 * Compression utilities for MCP server payloads
 * Provides compression for large JSON responses and resource data
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import { promisify } from 'util';
import { gzip, gunzip, brotliCompress, brotliDecompress } from 'zlib';
var gzipAsync = promisify(gzip);
var gunzipAsync = promisify(gunzip);
var brotliCompressAsync = promisify(brotliCompress);
var brotliDecompressAsync = promisify(brotliDecompress);
/**
 * Compress data if it meets the size threshold
 */
export function compressData(data_1) {
    return __awaiter(this, arguments, void 0, function (data, options) {
        var _a, algorithm, _b, minSize, _c, level, inputBuffer, originalSize, compressedBuffer, compressedSize, error_1;
        if (options === void 0) { options = {}; }
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    _a = options.algorithm, algorithm = _a === void 0 ? 'gzip' : _a, _b = options.minSize, minSize = _b === void 0 ? 1024 : _b, _c = options.level, level = _c === void 0 ? 6 : _c;
                    inputBuffer = Buffer.isBuffer(data) ? data : Buffer.from(data, 'utf8');
                    originalSize = inputBuffer.length;
                    // Don't compress if below minimum size
                    if (originalSize < minSize) {
                        return [2 /*return*/, {
                                compressed: false,
                                algorithm: 'none',
                                originalSize: originalSize,
                                compressedSize: originalSize,
                                data: data
                            }];
                    }
                    _d.label = 1;
                case 1:
                    _d.trys.push([1, 6, , 7]);
                    compressedBuffer = void 0;
                    if (!(algorithm === 'brotli')) return [3 /*break*/, 3];
                    return [4 /*yield*/, brotliCompressAsync(inputBuffer)];
                case 2:
                    compressedBuffer = _d.sent();
                    return [3 /*break*/, 5];
                case 3: return [4 /*yield*/, gzipAsync(inputBuffer, { level: level })];
                case 4:
                    compressedBuffer = _d.sent();
                    _d.label = 5;
                case 5:
                    compressedSize = compressedBuffer.length;
                    // Only use compression if it actually reduces size
                    if (compressedSize >= originalSize) {
                        return [2 /*return*/, {
                                compressed: false,
                                algorithm: 'none',
                                originalSize: originalSize,
                                compressedSize: originalSize,
                                data: data
                            }];
                    }
                    return [2 /*return*/, {
                            compressed: true,
                            algorithm: algorithm,
                            originalSize: originalSize,
                            compressedSize: compressedSize,
                            data: compressedBuffer
                        }];
                case 6:
                    error_1 = _d.sent();
                    console.warn('Compression failed, using uncompressed data:', error_1);
                    return [2 /*return*/, {
                            compressed: false,
                            algorithm: 'none',
                            originalSize: originalSize,
                            compressedSize: originalSize,
                            data: data
                        }];
                case 7: return [2 /*return*/];
            }
        });
    });
}
/**
 * Decompress data
 */
export function decompressData(compressedData) {
    return __awaiter(this, void 0, void 0, function () {
        var inputBuffer, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!compressedData.compressed) {
                        return [2 /*return*/, compressedData.data];
                    }
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 6, , 7]);
                    inputBuffer = Buffer.isBuffer(compressedData.data)
                        ? compressedData.data
                        : Buffer.from(compressedData.data, 'base64');
                    if (!(compressedData.algorithm === 'brotli')) return [3 /*break*/, 3];
                    return [4 /*yield*/, brotliDecompressAsync(inputBuffer)];
                case 2: return [2 /*return*/, _a.sent()];
                case 3: return [4 /*yield*/, gunzipAsync(inputBuffer)];
                case 4: return [2 /*return*/, _a.sent()];
                case 5: return [3 /*break*/, 7];
                case 6:
                    error_2 = _a.sent();
                    console.error('Decompression failed:', error_2);
                    throw new Error('Failed to decompress data');
                case 7: return [2 /*return*/];
            }
        });
    });
}
/**
 * Check if data should be compressed based on size and content type
 */
export function shouldCompress(data, minSize) {
    if (minSize === void 0) { minSize = 1024; }
    if (typeof data === 'string') {
        return data.length >= minSize;
    }
    if (Buffer.isBuffer(data)) {
        return data.length >= minSize;
    }
    // For objects, estimate JSON size
    if (typeof data === 'object') {
        try {
            var jsonString = JSON.stringify(data);
            return jsonString.length >= minSize;
        }
        catch (_a) {
            return false;
        }
    }
    return false;
}
/**
 * Compress JSON data for MCP responses
 */
export function compressJsonResponse(data_1) {
    return __awaiter(this, arguments, void 0, function (data, options) {
        var jsonString, compressed, error_3;
        if (options === void 0) { options = {}; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!shouldCompress(data, options.minSize)) {
                        return [2 /*return*/, { data: data }];
                    }
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    jsonString = JSON.stringify(data);
                    return [4 /*yield*/, compressData(jsonString, options)];
                case 2:
                    compressed = _a.sent();
                    if (compressed.compressed) {
                        // Return compressed data with metadata
                        return [2 /*return*/, {
                                data: {
                                    _compressed: true,
                                    _algorithm: compressed.algorithm,
                                    _originalSize: compressed.originalSize,
                                    _compressedSize: compressed.compressedSize,
                                    _data: compressed.data.toString('base64')
                                },
                                compressionInfo: compressed
                            }];
                    }
                    return [2 /*return*/, { data: data }];
                case 3:
                    error_3 = _a.sent();
                    console.warn('JSON compression failed:', error_3);
                    return [2 /*return*/, { data: data }];
                case 4: return [2 /*return*/];
            }
        });
    });
}
/**
 * Decompress JSON response
 */
export function decompressJsonResponse(data) {
    return __awaiter(this, void 0, void 0, function () {
        var compressedData, decompressed, error_4;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!(typeof data === 'object' && data._compressed)) return [3 /*break*/, 4];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    compressedData = {
                        compressed: true,
                        algorithm: data._algorithm,
                        originalSize: data._originalSize,
                        compressedSize: data._compressedSize,
                        data: Buffer.from(data._data, 'base64')
                    };
                    return [4 /*yield*/, decompressData(compressedData)];
                case 2:
                    decompressed = _a.sent();
                    return [2 /*return*/, JSON.parse(decompressed.toString())];
                case 3:
                    error_4 = _a.sent();
                    console.error('JSON decompression failed:', error_4);
                    throw new Error('Failed to decompress response');
                case 4: return [2 /*return*/, data];
            }
        });
    });
}
/**
 * Get compression statistics
 */
export function getCompressionStats(compressedData) {
    if (!compressedData.compressed) {
        return { ratio: 1, savings: 0, savingsPercent: 0 };
    }
    var ratio = compressedData.compressedSize / compressedData.originalSize;
    var savings = compressedData.originalSize - compressedData.compressedSize;
    var savingsPercent = (savings / compressedData.originalSize) * 100;
    return { ratio: ratio, savings: savings, savingsPercent: savingsPercent };
}
//# sourceMappingURL=compression.js.map