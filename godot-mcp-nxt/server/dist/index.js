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
import { FastMCP } from 'fastmcp';
import { nodeTools } from './tools/node_tools.js';
import { scriptTools } from './tools/script_tools.js';
import { sceneTools } from './tools/scene_tools.js';
import { editorTools } from './tools/editor_tools.js';
import { cliTools } from './tools/cli_tools.js';
import { codeAnalysisTools } from './tools/code_analysis_tools.js';
import { performanceTools } from './tools/performance_tools.js';
import { advancedTools } from './tools/advanced_tools.js';
import { getGodotConnection } from './utils/godot_connection.js';
import { setupCacheCleanup } from './utils/cache.js';
// Import resources
import { sceneListResource, sceneStructureTemplate, currentSceneStructureResource } from './resources/scene_resources.js';
import { scriptContentTemplate, currentScriptContentResource, scriptListResource, scriptMetadataResource } from './resources/script_resources.js';
import { projectStructureResource, projectSettingsResource, projectResourcesResource, projectFilesByTypeTemplate } from './resources/project_resources.js';
import { editorStateResource, selectedNodeResource, currentScriptResource } from './resources/editor_resources.js';
/**
 * Main entry point for the Godot MCP server
 */
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var server, allTools, staticResources, resourceTemplates, cleanup;
        return __generator(this, function (_a) {
            console.error('Starting Godot MCP server...');
            server = new FastMCP({
                name: 'GodotMCP',
                version: '1.0.0',
            });
            allTools = __spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray([], nodeTools, true), scriptTools, true), sceneTools, true), editorTools, true), cliTools, true), codeAnalysisTools, true), performanceTools, true), advancedTools, true);
            console.error("Registering ".concat(allTools.length, " tools..."));
            allTools.forEach(function (tool, index) {
                try {
                    server.addTool(tool);
                    if (index % 10 === 0) { // Log progress every 10 tools
                        console.error("Registered ".concat(index + 1, "/").concat(allTools.length, " tools..."));
                    }
                }
                catch (error) {
                    console.error("Failed to register tool ".concat(tool.name, ":"), error);
                }
            });
            console.error("Successfully registered ".concat(allTools.length, " tools"));
            staticResources = [
                sceneListResource,
                currentSceneStructureResource,
                scriptListResource,
                currentScriptContentResource,
                projectStructureResource,
                projectSettingsResource,
                projectResourcesResource,
                editorStateResource,
                selectedNodeResource,
                currentScriptResource,
                scriptMetadataResource,
            ];
            staticResources.forEach(function (resource) {
                server.addResource(resource);
            });
            resourceTemplates = [
                sceneStructureTemplate,
                scriptContentTemplate,
                projectFilesByTypeTemplate,
            ];
            resourceTemplates.forEach(function (template) {
                server.addResourceTemplate(template);
            });
            // Note: WebSocket connection is lazy - only established when WebSocket tools are called
            // Set up cache cleanup
            setupCacheCleanup();
            // Start the server
            server.start({
                transportType: 'stdio',
            });
            console.error('Godot MCP server started');
            cleanup = function () {
                console.error('Shutting down Godot MCP server...');
                var godot = getGodotConnection();
                godot.disconnect();
                process.exit(0);
            };
            process.on('SIGINT', cleanup);
            process.on('SIGTERM', cleanup);
            return [2 /*return*/];
        });
    });
}
// Start the server
main().catch(function (error) {
    console.error('Failed to start Godot MCP server:', error);
    process.exit(1);
});
//# sourceMappingURL=index.js.map