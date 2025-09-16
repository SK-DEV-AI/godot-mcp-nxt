/**
 * Retry utility for handling failed operations with exponential backoff
 */
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
var RetryError = /** @class */ (function (_super) {
    __extends(RetryError, _super);
    function RetryError(message, attempts, lastError) {
        var _this = _super.call(this, message) || this;
        _this.attempts = attempts;
        _this.lastError = lastError;
        _this.name = 'RetryError';
        return _this;
    }
    return RetryError;
}(Error));
export { RetryError };
/**
 * Retry a function with exponential backoff
 */
export function withRetry(fn_1) {
    return __awaiter(this, arguments, void 0, function (fn, options) {
        var _a, maxAttempts, _b, initialDelay, _c, maxDelay, _d, backoffMultiplier, _e, retryCondition, lastError, delay, attempt, error_1;
        if (options === void 0) { options = {}; }
        return __generator(this, function (_f) {
            switch (_f.label) {
                case 0:
                    _a = options.maxAttempts, maxAttempts = _a === void 0 ? 3 : _a, _b = options.initialDelay, initialDelay = _b === void 0 ? 1000 : _b, _c = options.maxDelay, maxDelay = _c === void 0 ? 30000 : _c, _d = options.backoffMultiplier, backoffMultiplier = _d === void 0 ? 2 : _d, _e = options.retryCondition, retryCondition = _e === void 0 ? function () { return true; } : _e;
                    delay = initialDelay;
                    attempt = 1;
                    _f.label = 1;
                case 1:
                    if (!(attempt <= maxAttempts)) return [3 /*break*/, 7];
                    _f.label = 2;
                case 2:
                    _f.trys.push([2, 4, , 6]);
                    return [4 /*yield*/, fn()];
                case 3: return [2 /*return*/, _f.sent()];
                case 4:
                    error_1 = _f.sent();
                    lastError = error_1;
                    // Don't retry if we've exhausted attempts or condition fails
                    if (attempt === maxAttempts || !retryCondition(error_1)) {
                        throw new RetryError("Operation failed after ".concat(attempt, " attempts"), attempt, lastError);
                    }
                    console.warn("Attempt ".concat(attempt, " failed, retrying in ").concat(delay, "ms:"), error_1.message);
                    // Wait before retrying
                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, delay); })];
                case 5:
                    // Wait before retrying
                    _f.sent();
                    // Calculate next delay with exponential backoff
                    delay = Math.min(delay * backoffMultiplier, maxDelay);
                    return [3 /*break*/, 6];
                case 6:
                    attempt++;
                    return [3 /*break*/, 1];
                case 7: 
                // This should never be reached, but TypeScript needs it
                throw new RetryError("Operation failed after ".concat(maxAttempts, " attempts"), maxAttempts, lastError);
            }
        });
    });
}
/**
 * Retry wrapper specifically for Godot operations
 */
export function retryGodotOperation(operation_1, operationName_1) {
    return __awaiter(this, arguments, void 0, function (operation, operationName, options) {
        var defaultOptions, mergedOptions, error_2;
        if (options === void 0) { options = {}; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    defaultOptions = {
                        maxAttempts: 3,
                        initialDelay: 2000,
                        maxDelay: 10000,
                        backoffMultiplier: 1.5,
                        retryCondition: function (error) {
                            var _a;
                            // Retry on network errors, timeouts, but not on validation errors
                            var message = ((_a = error.message) === null || _a === void 0 ? void 0 : _a.toLowerCase()) || '';
                            return message.includes('timeout') ||
                                message.includes('connection') ||
                                message.includes('network') ||
                                message.includes('econnrefused') ||
                                message.includes('enotfound');
                        }
                    };
                    mergedOptions = __assign(__assign({}, defaultOptions), options);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, withRetry(operation, mergedOptions)];
                case 2: return [2 /*return*/, _a.sent()];
                case 3:
                    error_2 = _a.sent();
                    if (error_2 instanceof RetryError) {
                        console.error("".concat(operationName, " failed after ").concat(error_2.attempts, " attempts. Last error:"), error_2.lastError);
                        throw error_2.lastError; // Throw the original error
                    }
                    throw error_2;
                case 4: return [2 /*return*/];
            }
        });
    });
}
/**
 * Circuit breaker pattern for operations that frequently fail
 */
var CircuitBreaker = /** @class */ (function () {
    function CircuitBreaker(failureThreshold, recoveryTimeout, // 1 minute
    monitoringPeriod // 5 minutes
    ) {
        if (failureThreshold === void 0) { failureThreshold = 5; }
        if (recoveryTimeout === void 0) { recoveryTimeout = 60000; }
        if (monitoringPeriod === void 0) { monitoringPeriod = 300000; }
        this.failureThreshold = failureThreshold;
        this.recoveryTimeout = recoveryTimeout;
        this.monitoringPeriod = monitoringPeriod;
        this.failures = 0;
        this.lastFailureTime = 0;
        this.state = 'closed';
    }
    CircuitBreaker.prototype.execute = function (operation) {
        return __awaiter(this, void 0, void 0, function () {
            var result, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (this.state === 'open') {
                            if (Date.now() - this.lastFailureTime > this.recoveryTimeout) {
                                this.state = 'half-open';
                            }
                            else {
                                throw new Error('Circuit breaker is open');
                            }
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, operation()];
                    case 2:
                        result = _a.sent();
                        this.onSuccess();
                        return [2 /*return*/, result];
                    case 3:
                        error_3 = _a.sent();
                        this.onFailure();
                        throw error_3;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    CircuitBreaker.prototype.onSuccess = function () {
        this.failures = 0;
        this.state = 'closed';
    };
    CircuitBreaker.prototype.onFailure = function () {
        this.failures++;
        this.lastFailureTime = Date.now();
        if (this.failures >= this.failureThreshold) {
            this.state = 'open';
        }
    };
    CircuitBreaker.prototype.getState = function () {
        return {
            state: this.state,
            failures: this.failures,
            lastFailureTime: this.lastFailureTime
        };
    };
    return CircuitBreaker;
}());
export { CircuitBreaker };
// Global circuit breaker for Godot operations
export var godotCircuitBreaker = new CircuitBreaker();
//# sourceMappingURL=retry.js.map