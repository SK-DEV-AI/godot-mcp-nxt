/**
 * Comprehensive test suite for the Godot MCP server
 * Tests all consolidated and advanced tools
 */
declare class GodotMCPTestSuite {
    private testResults;
    private testLogs;
    log(message: string): void;
    runTest(testName: string, testFn: () => Promise<void>): Promise<void>;
    testNodeManager(): Promise<void>;
    testScriptManager(): Promise<void>;
    testSceneManager(): Promise<void>;
    testAdvancedTools(): Promise<void>;
    testErrorHandling(): Promise<void>;
    testPerformanceTools(): Promise<void>;
    testAssetOptimization(): Promise<void>;
    testProjectValidation(): Promise<void>;
    runAllTests(): Promise<void>;
    generateTestReport(): void;
}
export { GodotMCPTestSuite };
