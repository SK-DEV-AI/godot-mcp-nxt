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
import { nodeTools } from '../tools/node_tools.js';
import { sceneTools } from '../tools/scene_tools.js';
import { performanceTools } from '../tools/performance_tools.js';
import { advancedTools } from '../tools/advanced_tools.js';
/**
 * Comprehensive test suite for the Godot MCP server
 * Tests all consolidated and advanced tools
 */
var GodotMCPTestSuite = /** @class */ (function () {
    function GodotMCPTestSuite() {
        this.testResults = {};
        this.testLogs = [];
    }
    GodotMCPTestSuite.prototype.log = function (message) {
        console.log("[TEST] ".concat(message));
        this.testLogs.push(message);
    };
    GodotMCPTestSuite.prototype.runTest = function (testName, testFn) {
        return __awaiter(this, void 0, void 0, function () {
            var error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        this.log("Running ".concat(testName, "..."));
                        return [4 /*yield*/, testFn()];
                    case 1:
                        _a.sent();
                        this.testResults[testName] = true;
                        this.log("\u2705 ".concat(testName, " PASSED"));
                        return [3 /*break*/, 3];
                    case 2:
                        error_1 = _a.sent();
                        this.testResults[testName] = false;
                        this.log("\u274C ".concat(testName, " FAILED: ").concat(error_1.message));
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    GodotMCPTestSuite.prototype.testNodeManager = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.runTest('Node Manager - Create Node', function () { return __awaiter(_this, void 0, void 0, function () {
                            var createTool, result;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        createTool = nodeTools.find(function (t) { return t.name === 'node_manager'; });
                                        if (!createTool)
                                            throw new Error('node_manager tool not found');
                                        return [4 /*yield*/, createTool.execute({
                                                operation: 'create',
                                                node_path: '/root/TestNode',
                                                node_type: 'Node2D',
                                                node_name: 'TestNode'
                                            })];
                                    case 1:
                                        result = _a.sent();
                                        if (!result.includes('Created node')) {
                                            throw new Error('Node creation failed');
                                        }
                                        return [2 /*return*/];
                                }
                            });
                        }); })];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, this.runTest('Node Manager - Batch Operations', function () { return __awaiter(_this, void 0, void 0, function () {
                                var batchTool, result;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0:
                                            batchTool = advancedTools.find(function (t) { return t.name === 'batch_operations'; });
                                            if (!batchTool)
                                                throw new Error('batch_operations tool not found');
                                            return [4 /*yield*/, batchTool.execute({
                                                    operations: [
                                                        {
                                                            tool: 'create_node',
                                                            parameters: { node_path: '/root/BatchTest', node_type: 'Sprite2D' }
                                                        }
                                                    ],
                                                    rollbackOnError: true
                                                })];
                                        case 1:
                                            result = _a.sent();
                                            if (!result.includes('Batch operations completed')) {
                                                throw new Error('Batch operations failed');
                                            }
                                            return [2 /*return*/];
                                    }
                                });
                            }); })];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    GodotMCPTestSuite.prototype.testScriptManager = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.runTest('Script Manager - Generate Complete Script', function () { return __awaiter(_this, void 0, void 0, function () {
                            var scriptTool, result;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        scriptTool = advancedTools.find(function (t) { return t.name === 'generate_complete_scripts'; });
                                        if (!scriptTool)
                                            throw new Error('generate_complete_scripts tool not found');
                                        return [4 /*yield*/, scriptTool.execute({
                                                description: 'Create a simple player controller with movement',
                                                scriptType: 'character',
                                                complexity: 'simple',
                                                features: ['movement']
                                            })];
                                    case 1:
                                        result = _a.sent();
                                        if (!result.includes('Generated')) {
                                            throw new Error('Script generation failed');
                                        }
                                        return [2 /*return*/];
                                }
                            });
                        }); })];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, this.runTest('Script Manager - Refactor Code', function () { return __awaiter(_this, void 0, void 0, function () {
                                var refactorTool, result;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0:
                                            refactorTool = advancedTools.find(function (t) { return t.name === 'refactor_existing_code'; });
                                            if (!refactorTool)
                                                throw new Error('refactor_existing_code tool not found');
                                            return [4 /*yield*/, refactorTool.execute({
                                                    scriptPath: 'res://test_script.gd',
                                                    refactoringType: 'extract_method',
                                                    parameters: { method_name: 'extracted_function' }
                                                })];
                                        case 1:
                                            result = _a.sent();
                                            if (!result.includes('Refactored')) {
                                                throw new Error('Code refactoring failed');
                                            }
                                            return [2 /*return*/];
                                    }
                                });
                            }); })];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    GodotMCPTestSuite.prototype.testSceneManager = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.runTest('Scene Manager - Create Scene', function () { return __awaiter(_this, void 0, void 0, function () {
                            var sceneTool, result;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        sceneTool = sceneTools.find(function (t) { return t.name === 'scene_manager'; });
                                        if (!sceneTool)
                                            throw new Error('scene_manager tool not found');
                                        return [4 /*yield*/, sceneTool.execute({
                                                operation: 'create_scene',
                                                path: 'res://test_scene.tscn',
                                                root_node_type: 'Node2D'
                                            })];
                                    case 1:
                                        result = _a.sent();
                                        if (!result.includes('Created scene')) {
                                            throw new Error('Scene creation failed');
                                        }
                                        return [2 /*return*/];
                                }
                            });
                        }); })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    GodotMCPTestSuite.prototype.testAdvancedTools = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.runTest('Character System Creation', function () { return __awaiter(_this, void 0, void 0, function () {
                            var charTool, result;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        charTool = advancedTools.find(function (t) { return t.name === 'create_character_system'; });
                                        if (!charTool)
                                            throw new Error('create_character_system tool not found');
                                        return [4 /*yield*/, charTool.execute({
                                                characterType: 'player',
                                                movementType: 'platformer',
                                                features: ['health', 'movement']
                                            })];
                                    case 1:
                                        result = _a.sent();
                                        if (!result.includes('Created')) {
                                            throw new Error('Character system creation failed');
                                        }
                                        return [2 /*return*/];
                                }
                            });
                        }); })];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, this.runTest('Level Generation', function () { return __awaiter(_this, void 0, void 0, function () {
                                var levelTool, result;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0:
                                            levelTool = advancedTools.find(function (t) { return t.name === 'generate_level'; });
                                            if (!levelTool)
                                                throw new Error('generate_level tool not found');
                                            return [4 /*yield*/, levelTool.execute({
                                                    levelType: 'platformer',
                                                    difficulty: 'easy',
                                                    theme: 'forest',
                                                    dimensions: { width: 20, height: 15 },
                                                    features: ['enemies']
                                                })];
                                        case 1:
                                            result = _a.sent();
                                            if (!result.includes('Generated')) {
                                                throw new Error('Level generation failed');
                                            }
                                            return [2 /*return*/];
                                    }
                                });
                            }); })];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, this.runTest('Project Template Application', function () { return __awaiter(_this, void 0, void 0, function () {
                                var templateTool, result;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0:
                                            templateTool = advancedTools.find(function (t) { return t.name === 'apply_project_template'; });
                                            if (!templateTool)
                                                throw new Error('apply_project_template tool not found');
                                            return [4 /*yield*/, templateTool.execute({
                                                    templateType: '2d_platformer',
                                                    projectName: 'TestPlatformer',
                                                    features: ['player_controller']
                                                })];
                                        case 1:
                                            result = _a.sent();
                                            if (!result.includes('Applied')) {
                                                throw new Error('Template application failed');
                                            }
                                            return [2 /*return*/];
                                    }
                                });
                            }); })];
                    case 3:
                        _a.sent();
                        return [4 /*yield*/, this.runTest('Game Development Workflow', function () { return __awaiter(_this, void 0, void 0, function () {
                                var workflowTool, result;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0:
                                            workflowTool = advancedTools.find(function (t) { return t.name === 'game_development_workflow'; });
                                            if (!workflowTool)
                                                throw new Error('game_development_workflow tool not found');
                                            return [4 /*yield*/, workflowTool.execute({
                                                    gameConcept: 'Simple 2D platformer game',
                                                    targetPlatform: 'desktop',
                                                    gameType: 'action',
                                                    scope: 'prototype',
                                                    features: ['player_movement', 'enemies']
                                                })];
                                        case 1:
                                            result = _a.sent();
                                            if (!result.includes('Workflow Initiated')) {
                                                throw new Error('Workflow orchestration failed');
                                            }
                                            return [2 /*return*/];
                                    }
                                });
                            }); })];
                    case 4:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    GodotMCPTestSuite.prototype.testErrorHandling = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.runTest('Error Handling - Invalid Parameters', function () { return __awaiter(_this, void 0, void 0, function () {
                            var scriptTool, error_2, errorMsg;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        scriptTool = advancedTools.find(function (t) { return t.name === 'generate_complete_scripts'; });
                                        if (!scriptTool)
                                            throw new Error('generate_complete_scripts tool not found');
                                        _a.label = 1;
                                    case 1:
                                        _a.trys.push([1, 3, , 4]);
                                        return [4 /*yield*/, scriptTool.execute({
                                                description: '', // Invalid: empty description
                                                scriptType: 'character'
                                            })];
                                    case 2:
                                        _a.sent();
                                        throw new Error('Should have thrown validation error');
                                    case 3:
                                        error_2 = _a.sent();
                                        errorMsg = error_2.message;
                                        if (!errorMsg.includes('must be at least 10 characters')) {
                                            throw new Error('Expected validation error message');
                                        }
                                        return [3 /*break*/, 4];
                                    case 4: return [2 /*return*/];
                                }
                            });
                        }); })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    GodotMCPTestSuite.prototype.testPerformanceTools = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.runTest('Performance Analysis', function () { return __awaiter(_this, void 0, void 0, function () {
                            var perfTool, result;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        perfTool = performanceTools.find(function (t) { return t.name === 'analyze_scene_performance'; });
                                        if (!perfTool)
                                            throw new Error('analyze_scene_performance tool not found');
                                        return [4 /*yield*/, perfTool.execute({
                                                scene_path: 'res://test_scene.tscn'
                                            })];
                                    case 1:
                                        result = _a.sent();
                                        if (!result.includes('Performance analysis')) {
                                            throw new Error('Performance analysis failed');
                                        }
                                        return [2 /*return*/];
                                }
                            });
                        }); })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    GodotMCPTestSuite.prototype.testAssetOptimization = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.runTest('Texture Atlas Optimization', function () { return __awaiter(_this, void 0, void 0, function () {
                            var textureTool, result;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        textureTool = advancedTools.find(function (t) { return t.name === 'optimize_texture_atlas'; });
                                        if (!textureTool)
                                            throw new Error('optimize_texture_atlas tool not found');
                                        return [4 /*yield*/, textureTool.execute({
                                                projectPath: 'res://',
                                                maxTextureSize: 2048,
                                                compression: 'auto',
                                                preview: true
                                            })];
                                    case 1:
                                        result = _a.sent();
                                        if (!result.includes('PREVIEW MODE')) {
                                            throw new Error('Texture optimization preview failed');
                                        }
                                        return [2 /*return*/];
                                }
                            });
                        }); })];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, this.runTest('Audio Asset Management', function () { return __awaiter(_this, void 0, void 0, function () {
                                var audioTool, result;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0:
                                            audioTool = advancedTools.find(function (t) { return t.name === 'manage_audio_assets'; });
                                            if (!audioTool)
                                                throw new Error('manage_audio_assets tool not found');
                                            return [4 /*yield*/, audioTool.execute({
                                                    operation: 'analyze',
                                                    audioFiles: ['res://audio/test.wav']
                                                })];
                                        case 1:
                                            result = _a.sent();
                                            if (!result.includes('Audio analyze completed')) {
                                                throw new Error('Audio analysis failed');
                                            }
                                            return [2 /*return*/];
                                    }
                                });
                            }); })];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    GodotMCPTestSuite.prototype.testProjectValidation = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.runTest('Project Structure Validation', function () { return __awaiter(_this, void 0, void 0, function () {
                            var validationTool, result;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        validationTool = advancedTools.find(function (t) { return t.name === 'validate_project_structure'; });
                                        if (!validationTool)
                                            throw new Error('validate_project_structure tool not found');
                                        return [4 /*yield*/, validationTool.execute({
                                                checkScripts: true,
                                                checkScenes: true,
                                                fixIssues: false
                                            })];
                                    case 1:
                                        result = _a.sent();
                                        if (!result.includes('Project Structure Validation')) {
                                            throw new Error('Project validation failed');
                                        }
                                        return [2 /*return*/];
                                }
                            });
                        }); })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    GodotMCPTestSuite.prototype.runAllTests = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.log('🚀 Starting Godot MCP Server Comprehensive Test Suite');
                        this.log('==================================================');
                        // Test consolidated tools
                        return [4 /*yield*/, this.testNodeManager()];
                    case 1:
                        // Test consolidated tools
                        _a.sent();
                        return [4 /*yield*/, this.testScriptManager()];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, this.testSceneManager()];
                    case 3:
                        _a.sent();
                        // Test advanced game development tools
                        return [4 /*yield*/, this.testAdvancedTools()];
                    case 4:
                        // Test advanced game development tools
                        _a.sent();
                        // Test error handling
                        return [4 /*yield*/, this.testErrorHandling()];
                    case 5:
                        // Test error handling
                        _a.sent();
                        // Test performance and optimization tools
                        return [4 /*yield*/, this.testPerformanceTools()];
                    case 6:
                        // Test performance and optimization tools
                        _a.sent();
                        return [4 /*yield*/, this.testAssetOptimization()];
                    case 7:
                        _a.sent();
                        // Test project management
                        return [4 /*yield*/, this.testProjectValidation()];
                    case 8:
                        // Test project management
                        _a.sent();
                        // Generate test report
                        this.generateTestReport();
                        return [2 /*return*/];
                }
            });
        });
    };
    GodotMCPTestSuite.prototype.generateTestReport = function () {
        var _this = this;
        var totalTests = Object.keys(this.testResults).length;
        var passedTests = Object.values(this.testResults).filter(function (result) { return result; }).length;
        var failedTests = totalTests - passedTests;
        this.log('\n==================================================');
        this.log('📊 TEST RESULTS SUMMARY');
        this.log('==================================================');
        this.log("Total Tests: ".concat(totalTests));
        this.log("\u2705 Passed: ".concat(passedTests));
        this.log("\u274C Failed: ".concat(failedTests));
        this.log("\uD83D\uDCC8 Success Rate: ".concat(((passedTests / totalTests) * 100).toFixed(1), "%"));
        if (failedTests > 0) {
            this.log('\n❌ Failed Tests:');
            Object.entries(this.testResults)
                .filter(function (_a) {
                var _ = _a[0], result = _a[1];
                return !result;
            })
                .forEach(function (_a) {
                var testName = _a[0], _ = _a[1];
                _this.log("  - ".concat(testName));
            });
        }
        this.log('\n📋 Test Logs:');
        this.testLogs.forEach(function (log) {
            console.log(log);
        });
        if (passedTests === totalTests) {
            this.log('\n🎉 ALL TESTS PASSED! Godot MCP Server is fully functional.');
        }
        else {
            this.log('\n⚠️  Some tests failed. Please review the implementation.');
        }
    };
    return GodotMCPTestSuite;
}());
// Export for use in test runner
export { GodotMCPTestSuite };
// Run tests if this file is executed directly
if (import.meta.url === "file://".concat(process.argv[1])) {
    var testSuite = new GodotMCPTestSuite();
    testSuite.runAllTests().catch(function (error) {
        console.error('Test suite failed:', error);
        process.exit(1);
    });
}
//# sourceMappingURL=comprehensive_test.js.map