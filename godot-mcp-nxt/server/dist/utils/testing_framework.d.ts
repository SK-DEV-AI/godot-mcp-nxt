export interface TestCase {
    name: string;
    description: string;
    category: 'unit' | 'integration' | 'performance' | 'security' | 'e2e';
    setup?: () => Promise<void>;
    execute: () => Promise<TestResult>;
    teardown?: () => Promise<void>;
    timeout?: number;
    skip?: boolean;
    tags: string[];
}
export interface TestResult {
    success: boolean;
    duration: number;
    error?: Error;
    message?: string;
    data?: Record<string, any>;
    assertions: TestAssertion[];
}
export interface TestAssertion {
    description: string;
    success: boolean;
    expected?: any;
    actual?: any;
    error?: string;
}
export interface TestSuite {
    name: string;
    description: string;
    tests: TestCase[];
    setup?: () => Promise<void>;
    teardown?: () => Promise<void>;
    timeout?: number;
}
export interface TestReport {
    suiteName: string;
    timestamp: number;
    duration: number;
    results: TestResult[];
    summary: {
        total: number;
        passed: number;
        failed: number;
        skipped: number;
        successRate: number;
    };
    performance: {
        averageDuration: number;
        slowestTest: string;
        fastestTest: string;
    };
}
export declare class TestRunner {
    private results;
    runTest(testCase: TestCase): Promise<TestResult>;
    runSuite(suite: TestSuite): Promise<TestReport>;
    getResults(): TestResult[];
    clearResults(): void;
}
export declare class TestAssertions {
    private assertions;
    assertEqual<T>(actual: T, expected: T, description?: string): void;
    assertNotEqual<T>(actual: T, expected: T, description?: string): void;
    assertTrue(value: any, description?: string): void;
    assertFalse(value: any, description?: string): void;
    assertThrows(fn: () => any, expectedError?: string | RegExp, description?: string): void;
    assertGreaterThan(actual: number, expected: number, description?: string): void;
    assertLessThan(actual: number, expected: number, description?: string): void;
    assertContains(array: any[], item: any, description?: string): void;
    assertMatches(value: string, pattern: RegExp, description?: string): void;
    getAssertions(): TestAssertion[];
    hasFailedAssertions(): boolean;
    getFailedAssertions(): TestAssertion[];
}
export declare const TestSuites: {
    unitTests: () => TestSuite;
    securityTests: () => TestSuite;
    performanceTests: () => TestSuite;
    integrationTests: () => TestSuite;
};
export declare class TestUtils {
    static waitFor(condition: () => boolean, timeout?: number, interval?: number): Promise<void>;
    static measureExecutionTime<T>(fn: () => Promise<T>): Promise<{
        result: T;
        duration: number;
    }>;
    static generateTestData(size: number, type?: 'string' | 'number' | 'object'): any;
    static createMockWebSocket(): any;
    static createMockClient(id?: number): any;
}
export declare function getTestRunner(): TestRunner;
export declare function runQuickTest(name: string, testFn: () => Promise<void>, timeout?: number): Promise<TestResult>;
