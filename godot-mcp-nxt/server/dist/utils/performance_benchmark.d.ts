export interface BenchmarkResult {
    name: string;
    timestamp: number;
    duration: number;
    operationsPerSecond: number;
    totalOperations: number;
    averageLatency: number;
    minLatency: number;
    maxLatency: number;
    p50Latency: number;
    p95Latency: number;
    p99Latency: number;
    memoryUsage: {
        before: number;
        after: number;
        peak: number;
        delta: number;
    };
    cpuUsage: {
        average: number;
        peak: number;
    };
    errors: number;
    successRate: number;
    metadata: Record<string, any>;
}
export interface BenchmarkConfig {
    name: string;
    operation: () => Promise<any>;
    setup?: () => Promise<void>;
    teardown?: () => Promise<void>;
    iterations: number;
    concurrency: number;
    warmupIterations?: number;
    timeout?: number;
    metadata?: Record<string, any>;
}
export interface PerformanceSuite {
    name: string;
    description: string;
    benchmarks: BenchmarkConfig[];
    setup?: () => Promise<void>;
    teardown?: () => Promise<void>;
}
export declare class PerformanceBenchmarker {
    private results;
    runBenchmark(config: BenchmarkConfig): Promise<BenchmarkResult>;
    runSuite(suite: PerformanceSuite): Promise<BenchmarkResult[]>;
    getResults(): BenchmarkResult[];
    getResult(name: string): BenchmarkResult | undefined;
    clearResults(): void;
    generateReport(): string;
    private runIterations;
    private calculateLatencyStats;
    private percentile;
    private getMemoryUsage;
    private getCpuUsage;
    private formatBytes;
}
export declare const BenchmarkSuites: {
    basicOperations: () => PerformanceSuite;
    networkOperations: () => PerformanceSuite;
    godotOperations: () => PerformanceSuite;
};
export declare function getBenchmarker(): PerformanceBenchmarker;
export declare function quickBenchmark(name: string, operation: () => Promise<any>, iterations?: number, concurrency?: number): Promise<BenchmarkResult>;
export declare class PerformanceRegressionDetector {
    private baselineResults;
    setBaseline(name: string, result: BenchmarkResult): void;
    detectRegression(currentResult: BenchmarkResult): {
        hasRegression: boolean;
        regressions: string[];
        improvements: string[];
    };
}
export declare function getRegressionDetector(): PerformanceRegressionDetector;
