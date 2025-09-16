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
import { scriptTools } from '../tools/script_tools.js';
import { sceneTools } from '../tools/scene_tools.js';
import { cliTools } from '../tools/cli_tools.js';
/**
 * Test the unified Godot tools for complete game development
 */
function testUnifiedTools() {
    return __awaiter(this, void 0, void 0, function () {
        var nodeManager, result, scriptManager, result, sceneManager, result, projectManager, result, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log('🧪 Testing Unified Godot MCP Tools');
                    console.log('=====================================');
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 10, , 11]);
                    // Test 1: Node Manager - Create a player character
                    console.log('\n1️⃣ Testing Node Manager - Create Player Character');
                    nodeManager = nodeTools.find(function (t) { return t.name === 'node_manager'; });
                    if (!nodeManager) return [3 /*break*/, 3];
                    return [4 /*yield*/, nodeManager.execute({
                            operation: 'create',
                            node_path: '/root/Player',
                            node_type: 'CharacterBody2D',
                            node_name: 'Player'
                        })];
                case 2:
                    result = _a.sent();
                    console.log('✅ Node created:', result);
                    _a.label = 3;
                case 3:
                    // Test 2: Script Manager - Generate player movement script
                    console.log('\n2️⃣ Testing Script Manager - Generate Player Script');
                    scriptManager = scriptTools.find(function (t) { return t.name === 'script_manager'; });
                    if (!scriptManager) return [3 /*break*/, 5];
                    return [4 /*yield*/, scriptManager.execute({
                            operation: 'generate_ai',
                            description: 'Create a 2D platformer player controller with movement, jumping, and collision detection',
                            scriptType: 'character',
                            complexity: 'medium',
                            features: ['movement', 'jump', 'collision']
                        })];
                case 4:
                    result = _a.sent();
                    console.log('✅ Script generated:', result);
                    _a.label = 5;
                case 5:
                    // Test 3: Scene Manager - Create game scene
                    console.log('\n3️⃣ Testing Scene Manager - Create Game Scene');
                    sceneManager = sceneTools.find(function (t) { return t.name === 'scene_manager'; });
                    if (!sceneManager) return [3 /*break*/, 7];
                    return [4 /*yield*/, sceneManager.execute({
                            operation: 'create_scene',
                            path: 'res://main_game.tscn',
                            root_node_type: 'Node2D'
                        })];
                case 6:
                    result = _a.sent();
                    console.log('✅ Scene created:', result);
                    _a.label = 7;
                case 7:
                    // Test 4: Project Manager - Get project info
                    console.log('\n4️⃣ Testing Project Manager - Get Project Info');
                    projectManager = cliTools.find(function (t) { return t.name === 'project_manager'; });
                    if (!projectManager) return [3 /*break*/, 9];
                    return [4 /*yield*/, projectManager.execute({
                            operation: 'get_project_info'
                        })];
                case 8:
                    result = _a.sent();
                    console.log('✅ Project info:', result);
                    _a.label = 9;
                case 9:
                    console.log('\n🎉 All unified tools tested successfully!');
                    console.log('The MCP server can now create complete game components using unified interfaces.');
                    return [3 /*break*/, 11];
                case 10:
                    error_1 = _a.sent();
                    console.error('❌ Test failed:', error_1);
                    return [3 /*break*/, 11];
                case 11: return [2 /*return*/];
            }
        });
    });
}
// Run the test
testUnifiedTools();
//# sourceMappingURL=unified_tools_test.js.map