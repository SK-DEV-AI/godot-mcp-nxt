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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import { getGodotConnection } from '../utils/godot_connection.js';
/**
 * Resource that provides information about the Godot project structure
 */
export var projectStructureResource = {
    uri: 'godot/project/structure',
    name: 'Godot Project Structure',
    mimeType: 'application/json',
    load: function () {
        return __awaiter(this, void 0, void 0, function () {
            var godot, result, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        godot = getGodotConnection();
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, godot.sendCommand('get_project_structure')];
                    case 2:
                        result = _a.sent();
                        return [2 /*return*/, {
                                text: JSON.stringify(result)
                            }];
                    case 3:
                        error_1 = _a.sent();
                        console.error('Error fetching project structure:', error_1);
                        throw error_1;
                    case 4: return [2 /*return*/];
                }
            });
        });
    }
};
/**
 * Resource that provides project settings
 */
export var projectSettingsResource = {
    uri: 'godot/project/settings',
    name: 'Godot Project Settings',
    mimeType: 'application/json',
    load: function () {
        return __awaiter(this, void 0, void 0, function () {
            var godot, result, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        godot = getGodotConnection();
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, godot.sendCommand('get_project_settings')];
                    case 2:
                        result = _a.sent();
                        return [2 /*return*/, {
                                text: JSON.stringify(result)
                            }];
                    case 3:
                        error_2 = _a.sent();
                        console.error('Error fetching project settings:', error_2);
                        throw error_2;
                    case 4: return [2 /*return*/];
                }
            });
        });
    }
};
/**
 * Resource that provides a list of all project resources
 */
export var projectResourcesResource = {
    uri: 'godot/project/resources',
    name: 'Godot Project Resources',
    mimeType: 'application/json',
    load: function () {
        return __awaiter(this, void 0, void 0, function () {
            var godot, result, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        godot = getGodotConnection();
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, godot.sendCommand('list_project_resources')];
                    case 2:
                        result = _a.sent();
                        return [2 /*return*/, {
                                text: JSON.stringify(result)
                            }];
                    case 3:
                        error_3 = _a.sent();
                        console.error('Error fetching project resources:', error_3);
                        throw error_3;
                    case 4: return [2 /*return*/];
                }
            });
        });
    }
};
/**
 * Resource template for project file listings by type
 * URI pattern: godot/project/files/{type}
 * Supported types: scenes, scripts, textures, audio, models, resources, all
 */
export var projectFilesByTypeTemplate = {
    uriTemplate: 'godot/project/files/{type}',
    name: 'Godot Project Files by Type',
    description: 'List of project files filtered by type (scenes, scripts, textures, audio, models, resources, all)',
    mimeType: 'application/json',
    arguments: [
        {
            name: 'type',
            description: 'Type of files to list: scenes, scripts, textures, audio, models, resources, or all',
        },
    ],
    load: function (args) {
        return __awaiter(this, void 0, void 0, function () {
            var godot, result, files, type, error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        godot = getGodotConnection();
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, godot.sendCommand('list_project_resources')];
                    case 2:
                        result = _a.sent();
                        if (!result) {
                            return [2 /*return*/, {
                                    text: JSON.stringify({ files: [], count: 0, type: args.type })
                                }];
                        }
                        files = [];
                        type = args.type.toLowerCase();
                        // Filter by type
                        switch (type) {
                            case 'scenes':
                                files = result.scenes || [];
                                break;
                            case 'scripts':
                                files = result.scripts || [];
                                break;
                            case 'textures':
                                files = result.textures || [];
                                break;
                            case 'audio':
                                files = result.audio || [];
                                break;
                            case 'models':
                                files = result.models || [];
                                break;
                            case 'resources':
                                files = result.resources || [];
                                break;
                            case 'all':
                                // Combine all file types
                                files = __spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray([], (result.scenes || []), true), (result.scripts || []), true), (result.textures || []), true), (result.audio || []), true), (result.models || []), true), (result.resources || []), true);
                                break;
                            default:
                                throw new Error("Unsupported file type: ".concat(type, ". Supported types: scenes, scripts, textures, audio, models, resources, all"));
                        }
                        return [2 /*return*/, {
                                text: JSON.stringify({
                                    files: files,
                                    count: files.length,
                                    type: args.type,
                                    description: "Project files of type: ".concat(args.type)
                                }, null, 2)
                            }];
                    case 3:
                        error_4 = _a.sent();
                        console.error('Error fetching project files by type:', error_4);
                        throw error_4;
                    case 4: return [2 /*return*/];
                }
            });
        });
    }
};
//# sourceMappingURL=project_resources.js.map