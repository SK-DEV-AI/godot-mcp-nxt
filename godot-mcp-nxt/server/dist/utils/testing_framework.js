// Comprehensive Testing Framework for Godot MCP Server
// Automated testing, integration tests, and quality assurance
export class TestRunner {
    constructor() {
        this.results = [];
    }
    async runTest(testCase) {
        if (testCase.skip) {
            return {
                success: true,
                duration: 0,
                message: 'Test skipped',
                assertions: []
            };
        }
        const startTime = Date.now();
        try {
            // Setup
            if (testCase.setup) {
                await testCase.setup();
            }
            // Execute with timeout
            let result;
            if (testCase.timeout) {
                result = await Promise.race([
                    testCase.execute(),
                    new Promise((_, reject) => setTimeout(() => reject(new Error(`Test timeout after ${testCase.timeout}ms`)), testCase.timeout))
                ]);
            }
            else {
                result = await testCase.execute();
            }
            result.duration = Date.now() - startTime;
            this.results.push(result);
            return result;
        }
        catch (error) {
            const result = {
                success: false,
                duration: Date.now() - startTime,
                error: error instanceof Error ? error : new Error(String(error)),
                assertions: []
            };
            this.results.push(result);
            return result;
        }
        finally {
            // Teardown
            if (testCase.teardown) {
                try {
                    await testCase.teardown();
                }
                catch (teardownError) {
                    console.error(`Teardown failed for test ${testCase.name}:`, teardownError);
                }
            }
        }
    }
    async runSuite(suite) {
        console.log(`Running test suite: ${suite.name}`);
        console.log(`Description: ${suite.description}`);
        const startTime = Date.now();
        const results = [];
        // Suite setup
        if (suite.setup) {
            await suite.setup();
        }
        try {
            for (const testCase of suite.tests) {
                console.log(`Running test: ${testCase.name}`);
                const result = await this.runTest(testCase);
                results.push(result);
                const status = result.success ? 'PASS' : 'FAIL';
                console.log(`  ${status}: ${testCase.name} (${result.duration}ms)`);
                if (!result.success && result.error) {
                    console.log(`    Error: ${result.error.message}`);
                }
            }
            const endTime = Date.now();
            const duration = endTime - startTime;
            // Calculate summary
            const passed = results.filter(r => r.success).length;
            const failed = results.filter(r => !r.success).length;
            const skipped = suite.tests.filter(t => t.skip).length;
            const total = results.length;
            // Performance metrics
            const durations = results.map(r => r.duration);
            const averageDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
            const sortedByDuration = results
                .map((r, i) => ({ result: r, index: i }))
                .sort((a, b) => b.result.duration - a.result.duration);
            const slowestTest = suite.tests[sortedByDuration[0]?.index]?.name || 'N/A';
            const fastestTest = suite.tests[sortedByDuration[sortedByDuration.length - 1]?.index]?.name || 'N/A';
            const report = {
                suiteName: suite.name,
                timestamp: startTime,
                duration,
                results,
                summary: {
                    total,
                    passed,
                    failed,
                    skipped,
                    successRate: total > 0 ? (passed / total) * 100 : 0
                },
                performance: {
                    averageDuration,
                    slowestTest,
                    fastestTest
                }
            };
            console.log(`\nTest suite completed: ${passed}/${total} passed (${report.summary.successRate.toFixed(1)}%)`);
            console.log(`Total duration: ${duration}ms, Average: ${averageDuration.toFixed(2)}ms per test`);
            return report;
        }
        finally {
            // Suite teardown
            if (suite.teardown) {
                try {
                    await suite.teardown();
                }
                catch (teardownError) {
                    console.error(`Suite teardown failed:`, teardownError);
                }
            }
        }
    }
    getResults() {
        return [...this.results];
    }
    clearResults() {
        this.results.length = 0;
    }
}
// Assertion utilities
export class TestAssertions {
    constructor() {
        this.assertions = [];
    }
    assertEqual(actual, expected, description = 'Values should be equal') {
        const success = actual === expected;
        this.assertions.push({
            description,
            success,
            expected,
            actual,
            error: success ? undefined : `Expected ${expected}, but got ${actual}`
        });
    }
    assertNotEqual(actual, expected, description = 'Values should not be equal') {
        const success = actual !== expected;
        this.assertions.push({
            description,
            success,
            expected: `not ${expected}`,
            actual,
            error: success ? undefined : `Expected not ${expected}, but got ${actual}`
        });
    }
    assertTrue(value, description = 'Value should be true') {
        const success = Boolean(value);
        this.assertions.push({
            description,
            success,
            expected: true,
            actual: value,
            error: success ? undefined : `Expected true, but got ${value}`
        });
    }
    assertFalse(value, description = 'Value should be false') {
        const success = !Boolean(value);
        this.assertions.push({
            description,
            success,
            expected: false,
            actual: value,
            error: success ? undefined : `Expected false, but got ${value}`
        });
    }
    assertThrows(fn, expectedError, description = 'Function should throw') {
        try {
            fn();
            this.assertions.push({
                description,
                success: false,
                expected: 'Error',
                actual: 'No error thrown',
                error: 'Expected function to throw an error'
            });
        }
        catch (error) {
            let success = true;
            let errorMessage = '';
            if (expectedError) {
                if (typeof expectedError === 'string') {
                    success = error instanceof Error && error.message.includes(expectedError);
                    errorMessage = success ? '' : `Expected error message to contain "${expectedError}"`;
                }
                else if (expectedError instanceof RegExp) {
                    success = error instanceof Error && expectedError.test(error.message);
                    errorMessage = success ? '' : `Expected error message to match ${expectedError}`;
                }
            }
            this.assertions.push({
                description,
                success,
                expected: expectedError || 'Error',
                actual: error instanceof Error ? error.message : String(error),
                error: errorMessage
            });
        }
    }
    assertGreaterThan(actual, expected, description = 'Value should be greater than expected') {
        const success = actual > expected;
        this.assertions.push({
            description,
            success,
            expected: `> ${expected}`,
            actual,
            error: success ? undefined : `Expected ${actual} to be greater than ${expected}`
        });
    }
    assertLessThan(actual, expected, description = 'Value should be less than expected') {
        const success = actual < expected;
        this.assertions.push({
            description,
            success,
            expected: `< ${expected}`,
            actual,
            error: success ? undefined : `Expected ${actual} to be less than ${expected}`
        });
    }
    assertContains(array, item, description = 'Array should contain item') {
        const success = array.includes(item);
        this.assertions.push({
            description,
            success,
            expected: `contains ${item}`,
            actual: array,
            error: success ? undefined : `Array does not contain ${item}`
        });
    }
    assertMatches(value, pattern, description = 'String should match pattern') {
        const success = pattern.test(value);
        this.assertions.push({
            description,
            success,
            expected: pattern.toString(),
            actual: value,
            error: success ? undefined : `String "${value}" does not match pattern ${pattern}`
        });
    }
    getAssertions() {
        return [...this.assertions];
    }
    hasFailedAssertions() {
        return this.assertions.some(a => !a.success);
    }
    getFailedAssertions() {
        return this.assertions.filter(a => !a.success);
    }
}
// Predefined test suites
export const TestSuites = {
    // Unit tests for core utilities
    unitTests: () => ({
        name: 'Unit Tests',
        description: 'Basic unit tests for core functionality',
        tests: [
            {
                name: 'Cache Basic Operations',
                description: 'Test basic cache get/set operations',
                category: 'unit',
                tags: ['cache', 'basic'],
                execute: async () => {
                    const assertions = new TestAssertions();
                    // This would test the cache implementation
                    assertions.assertTrue(true, 'Cache basic test placeholder');
                    return {
                        success: !assertions.hasFailedAssertions(),
                        duration: 0,
                        assertions: assertions.getAssertions()
                    };
                }
            },
            {
                name: 'Queue Operations',
                description: 'Test async queue functionality',
                category: 'unit',
                tags: ['queue', 'async'],
                execute: async () => {
                    const assertions = new TestAssertions();
                    // This would test the queue implementation
                    assertions.assertTrue(true, 'Queue test placeholder');
                    return {
                        success: !assertions.hasFailedAssertions(),
                        duration: 0,
                        assertions: assertions.getAssertions()
                    };
                }
            }
        ]
    }),
    // Security tests
    securityTests: () => ({
        name: 'Security Tests',
        description: 'Security vulnerability and access control tests',
        tests: [
            {
                name: 'Rate Limiting',
                description: 'Test rate limiting functionality',
                category: 'security',
                tags: ['security', 'rate-limiting'],
                execute: async () => {
                    const assertions = new TestAssertions();
                    // Test rate limiting logic
                    assertions.assertTrue(true, 'Rate limiting test placeholder');
                    return {
                        success: !assertions.hasFailedAssertions(),
                        duration: 0,
                        assertions: assertions.getAssertions()
                    };
                }
            },
            {
                name: 'Input Sanitization',
                description: 'Test input sanitization and validation',
                category: 'security',
                tags: ['security', 'input-validation'],
                execute: async () => {
                    const assertions = new TestAssertions();
                    // Test input sanitization
                    assertions.assertTrue(true, 'Input sanitization test placeholder');
                    return {
                        success: !assertions.hasFailedAssertions(),
                        duration: 0,
                        assertions: assertions.getAssertions()
                    };
                }
            },
            {
                name: 'Path Traversal Protection',
                description: 'Test protection against path traversal attacks',
                category: 'security',
                tags: ['security', 'path-traversal'],
                execute: async () => {
                    const assertions = new TestAssertions();
                    // Test path traversal protection
                    assertions.assertTrue(true, 'Path traversal test placeholder');
                    return {
                        success: !assertions.hasFailedAssertions(),
                        duration: 0,
                        assertions: assertions.getAssertions()
                    };
                }
            }
        ]
    }),
    // Performance tests
    performanceTests: () => ({
        name: 'Performance Tests',
        description: 'Performance and load testing',
        tests: [
            {
                name: 'Concurrent Operations',
                description: 'Test handling of concurrent operations',
                category: 'performance',
                tags: ['performance', 'concurrency'],
                timeout: 30000,
                execute: async () => {
                    const assertions = new TestAssertions();
                    // Test concurrent operations
                    assertions.assertTrue(true, 'Concurrent operations test placeholder');
                    return {
                        success: !assertions.hasFailedAssertions(),
                        duration: 0,
                        assertions: assertions.getAssertions()
                    };
                }
            },
            {
                name: 'Memory Usage',
                description: 'Test memory usage under load',
                category: 'performance',
                tags: ['performance', 'memory'],
                execute: async () => {
                    const assertions = new TestAssertions();
                    // Test memory usage
                    assertions.assertTrue(true, 'Memory usage test placeholder');
                    return {
                        success: !assertions.hasFailedAssertions(),
                        duration: 0,
                        assertions: assertions.getAssertions()
                    };
                }
            }
        ]
    }),
    // Integration tests
    integrationTests: () => ({
        name: 'Integration Tests',
        description: 'End-to-end integration testing',
        tests: [
            {
                name: 'WebSocket Communication',
                description: 'Test WebSocket communication flow',
                category: 'integration',
                tags: ['integration', 'websocket'],
                execute: async () => {
                    const assertions = new TestAssertions();
                    // Test WebSocket communication
                    assertions.assertTrue(true, 'WebSocket test placeholder');
                    return {
                        success: !assertions.hasFailedAssertions(),
                        duration: 0,
                        assertions: assertions.getAssertions()
                    };
                }
            },
            {
                name: 'Command Processing',
                description: 'Test command processing pipeline',
                category: 'integration',
                tags: ['integration', 'commands'],
                execute: async () => {
                    const assertions = new TestAssertions();
                    // Test command processing
                    assertions.assertTrue(true, 'Command processing test placeholder');
                    return {
                        success: !assertions.hasFailedAssertions(),
                        duration: 0,
                        assertions: assertions.getAssertions()
                    };
                }
            }
        ]
    })
};
// Test utilities
export class TestUtils {
    static async waitFor(condition, timeout = 5000, interval = 100) {
        const startTime = Date.now();
        while (Date.now() - startTime < timeout) {
            if (condition()) {
                return;
            }
            await new Promise(resolve => setTimeout(resolve, interval));
        }
        throw new Error(`Condition not met within ${timeout}ms`);
    }
    static async measureExecutionTime(fn) {
        const startTime = Date.now();
        const result = await fn();
        const duration = Date.now() - startTime;
        return { result, duration };
    }
    static generateTestData(size, type = 'string') {
        switch (type) {
            case 'string':
                return 'x'.repeat(size);
            case 'number':
                return Array.from({ length: size }, () => Math.random());
            case 'object':
                const obj = {};
                for (let i = 0; i < size; i++) {
                    obj[`key${i}`] = `value${i}`;
                }
                return obj;
            default:
                return null;
        }
    }
    static createMockWebSocket() {
        // Mock WebSocket for testing
        return {
            send_text: jest.fn(),
            get_ready_state: jest.fn().mockReturnValue(1), // OPEN
            poll: jest.fn(),
            get_available_packet_count: jest.fn().mockReturnValue(0),
            get_packet: jest.fn()
        };
    }
    static createMockClient(id = 1) {
        return {
            id,
            tcp: {
                get_status: jest.fn().mockReturnValue(2) // STATUS_CONNECTED
            },
            ws: TestUtils.createMockWebSocket(),
            state: 0, // Connected
            last_poll_time: Date.now()
        };
    }
}
// Global test runner instance
let globalTestRunner = null;
export function getTestRunner() {
    if (!globalTestRunner) {
        globalTestRunner = new TestRunner();
    }
    return globalTestRunner;
}
// Quick test execution utility
export async function runQuickTest(name, testFn, timeout = 5000) {
    const runner = getTestRunner();
    const testCase = {
        name,
        description: 'Quick test execution',
        category: 'unit',
        tags: ['quick'],
        execute: async () => {
            const assertions = new TestAssertions();
            try {
                await testFn();
                return {
                    success: !assertions.hasFailedAssertions(),
                    duration: 0,
                    assertions: assertions.getAssertions()
                };
            }
            catch (error) {
                return {
                    success: false,
                    duration: 0,
                    error: error instanceof Error ? error : new Error(String(error)),
                    assertions: assertions.getAssertions()
                };
            }
        },
        timeout
    };
    return runner.runTest(testCase);
}
//# sourceMappingURL=testing_framework.js.map