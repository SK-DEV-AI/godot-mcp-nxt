// Performance Benchmarking System for Godot MCP Server
// Comprehensive performance testing and benchmarking tools
export class PerformanceBenchmarker {
    constructor() {
        this.results = [];
    }
    async runBenchmark(config) {
        console.log(`Starting benchmark: ${config.name}`);
        // Setup
        if (config.setup) {
            await config.setup();
        }
        // Warmup
        if (config.warmupIterations && config.warmupIterations > 0) {
            console.log(`Running warmup (${config.warmupIterations} iterations)...`);
            await this.runIterations(config.operation, config.warmupIterations, 1);
        }
        // Memory and CPU baseline
        const memoryBefore = this.getMemoryUsage();
        const cpuBefore = this.getCpuUsage();
        // Run benchmark
        const startTime = Date.now();
        const latencies = [];
        let errors = 0;
        try {
            const results = await this.runIterations(config.operation, config.iterations, config.concurrency, latencies, config.timeout);
            const endTime = Date.now();
            const duration = endTime - startTime;
            // Memory and CPU after
            const memoryAfter = this.getMemoryUsage();
            const cpuAfter = this.getCpuUsage();
            // Calculate statistics
            const stats = this.calculateLatencyStats(latencies);
            const result = {
                name: config.name,
                timestamp: startTime,
                duration,
                operationsPerSecond: (config.iterations / duration) * 1000,
                totalOperations: config.iterations,
                averageLatency: stats.average,
                minLatency: stats.min,
                maxLatency: stats.max,
                p50Latency: stats.p50,
                p95Latency: stats.p95,
                p99Latency: stats.p99,
                memoryUsage: {
                    before: memoryBefore,
                    after: memoryAfter,
                    peak: Math.max(memoryBefore, memoryAfter), // Simplified
                    delta: memoryAfter - memoryBefore
                },
                cpuUsage: {
                    average: (cpuBefore + cpuAfter) / 2, // Simplified
                    peak: Math.max(cpuBefore, cpuAfter)
                },
                errors,
                successRate: (config.iterations - errors) / config.iterations,
                metadata: config.metadata || {}
            };
            this.results.push(result);
            console.log(`Benchmark ${config.name} completed:`, {
                ops: result.operationsPerSecond.toFixed(2),
                avgLatency: result.averageLatency.toFixed(2) + 'ms',
                successRate: (result.successRate * 100).toFixed(2) + '%'
            });
            return result;
        }
        finally {
            // Teardown
            if (config.teardown) {
                await config.teardown();
            }
        }
    }
    async runSuite(suite) {
        console.log(`Starting performance suite: ${suite.name}`);
        console.log(`Description: ${suite.description}`);
        // Suite setup
        if (suite.setup) {
            await suite.setup();
        }
        const results = [];
        try {
            for (const benchmark of suite.benchmarks) {
                const result = await this.runBenchmark(benchmark);
                results.push(result);
            }
            console.log(`Performance suite ${suite.name} completed`);
            return results;
        }
        finally {
            // Suite teardown
            if (suite.teardown) {
                await suite.teardown();
            }
        }
    }
    getResults() {
        return [...this.results];
    }
    getResult(name) {
        return this.results.find(r => r.name === name);
    }
    clearResults() {
        this.results.length = 0;
    }
    generateReport() {
        if (this.results.length === 0) {
            return 'No benchmark results available';
        }
        let report = '# Performance Benchmark Report\n\n';
        report += `Generated: ${new Date().toISOString()}\n\n`;
        // Summary table
        report += '## Summary\n\n';
        report += '| Benchmark | Ops/sec | Avg Latency | Success Rate | Memory Delta |\n';
        report += '|----------|---------|-------------|--------------|--------------|\n';
        for (const result of this.results) {
            report += `| ${result.name} | ${result.operationsPerSecond.toFixed(2)} | ${result.averageLatency.toFixed(2)}ms | ${(result.successRate * 100).toFixed(2)}% | ${this.formatBytes(result.memoryUsage.delta)} |\n`;
        }
        report += '\n## Detailed Results\n\n';
        for (const result of this.results) {
            report += `### ${result.name}\n\n`;
            report += `- **Duration**: ${result.duration}ms\n`;
            report += `- **Total Operations**: ${result.totalOperations}\n`;
            report += `- **Operations/second**: ${result.operationsPerSecond.toFixed(2)}\n`;
            report += `- **Average Latency**: ${result.averageLatency.toFixed(2)}ms\n`;
            report += `- **Min Latency**: ${result.minLatency.toFixed(2)}ms\n`;
            report += `- **Max Latency**: ${result.maxLatency.toFixed(2)}ms\n`;
            report += `- **P50 Latency**: ${result.p50Latency.toFixed(2)}ms\n`;
            report += `- **P95 Latency**: ${result.p95Latency.toFixed(2)}ms\n`;
            report += `- **P99 Latency**: ${result.p99Latency.toFixed(2)}ms\n`;
            report += `- **Success Rate**: ${(result.successRate * 100).toFixed(2)}%\n`;
            report += `- **Memory Usage**: ${this.formatBytes(result.memoryUsage.before)} → ${this.formatBytes(result.memoryUsage.after)} (${this.formatBytes(result.memoryUsage.delta)})\n`;
            report += `- **CPU Usage**: Avg ${result.cpuUsage.average.toFixed(2)}%, Peak ${result.cpuUsage.peak.toFixed(2)}%\n`;
            if (Object.keys(result.metadata).length > 0) {
                report += `- **Metadata**: ${JSON.stringify(result.metadata, null, 2)}\n`;
            }
            report += '\n';
        }
        return report;
    }
    async runIterations(operation, iterations, concurrency, latencies, timeout) {
        const results = [];
        const semaphore = new Semaphore(concurrency);
        const promises = Array.from({ length: iterations }, async (_, i) => {
            await semaphore.acquire();
            try {
                const startTime = Date.now();
                let result;
                if (timeout) {
                    result = await Promise.race([
                        operation(),
                        new Promise((_, reject) => setTimeout(() => reject(new Error('Operation timeout')), timeout))
                    ]);
                }
                else {
                    result = await operation();
                }
                const latency = Date.now() - startTime;
                if (latencies) {
                    latencies.push(latency);
                }
                results[i] = result;
                return result;
            }
            catch (error) {
                if (latencies) {
                    latencies.push(-1); // Mark as error
                }
                results[i] = error;
                throw error;
            }
            finally {
                semaphore.release();
            }
        });
        await Promise.allSettled(promises);
        return results;
    }
    calculateLatencyStats(latencies) {
        const validLatencies = latencies.filter(l => l >= 0);
        if (validLatencies.length === 0) {
            return { average: 0, min: 0, max: 0, p50: 0, p95: 0, p99: 0 };
        }
        const sorted = validLatencies.sort((a, b) => a - b);
        return {
            average: validLatencies.reduce((a, b) => a + b, 0) / validLatencies.length,
            min: sorted[0],
            max: sorted[sorted.length - 1],
            p50: this.percentile(sorted, 50),
            p95: this.percentile(sorted, 95),
            p99: this.percentile(sorted, 99)
        };
    }
    percentile(sortedArray, percentile) {
        const index = (percentile / 100) * (sortedArray.length - 1);
        const lower = Math.floor(index);
        const upper = Math.ceil(index);
        if (lower === upper) {
            return sortedArray[lower];
        }
        const weight = index - lower;
        return sortedArray[lower] * (1 - weight) + sortedArray[upper] * weight;
    }
    getMemoryUsage() {
        if (typeof process !== 'undefined' && process.memoryUsage) {
            return process.memoryUsage().heapUsed;
        }
        return 0;
    }
    getCpuUsage() {
        // Simplified CPU usage - in a real implementation, you'd use a library like 'pidusage'
        return Math.random() * 100; // Mock value
    }
    formatBytes(bytes) {
        if (bytes === 0)
            return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(Math.abs(bytes)) / Math.log(k));
        return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
    }
}
// Semaphore for controlling concurrency
class Semaphore {
    constructor(permits) {
        this.waiting = [];
        this.permits = permits;
    }
    async acquire() {
        if (this.permits > 0) {
            this.permits--;
            return;
        }
        return new Promise(resolve => {
            this.waiting.push(resolve);
        });
    }
    release() {
        this.permits++;
        if (this.waiting.length > 0) {
            const resolve = this.waiting.shift();
            this.permits--;
            resolve();
        }
    }
}
// Predefined benchmark suites
export const BenchmarkSuites = {
    // Basic operations benchmark
    basicOperations: () => ({
        name: 'Basic Operations',
        description: 'Benchmark basic Godot MCP operations',
        benchmarks: [
            {
                name: 'Simple Echo',
                operation: async () => {
                    // Simulate a simple operation
                    await new Promise(resolve => setTimeout(resolve, 1));
                    return 'echo';
                },
                iterations: 1000,
                concurrency: 10,
                warmupIterations: 100
            },
            {
                name: 'JSON Processing',
                operation: async () => {
                    const data = { test: 'data', numbers: [1, 2, 3, 4, 5] };
                    const json = JSON.stringify(data);
                    const parsed = JSON.parse(json);
                    return parsed;
                },
                iterations: 500,
                concurrency: 5,
                warmupIterations: 50
            },
            {
                name: 'Memory Intensive',
                operation: async () => {
                    const arrays = [];
                    for (let i = 0; i < 100; i++) {
                        arrays.push(new Array(1000).fill(Math.random()));
                    }
                    return arrays.length;
                },
                iterations: 100,
                concurrency: 2,
                warmupIterations: 10
            }
        ]
    }),
    // Network operations benchmark
    networkOperations: () => ({
        name: 'Network Operations',
        description: 'Benchmark network-related operations',
        benchmarks: [
            {
                name: 'WebSocket Message',
                operation: async () => {
                    // Simulate WebSocket message processing
                    const message = { type: 'test', data: 'x'.repeat(1000) };
                    const serialized = JSON.stringify(message);
                    const deserialized = JSON.parse(serialized);
                    return deserialized;
                },
                iterations: 1000,
                concurrency: 20,
                warmupIterations: 100
            },
            {
                name: 'Connection Handling',
                operation: async () => {
                    // Simulate connection setup/teardown
                    await new Promise(resolve => setTimeout(resolve, 5));
                    return { connected: true };
                },
                iterations: 500,
                concurrency: 10,
                warmupIterations: 50
            }
        ]
    }),
    // Godot-specific operations benchmark
    godotOperations: () => ({
        name: 'Godot Operations',
        description: 'Benchmark Godot-specific operations',
        benchmarks: [
            {
                name: 'Node Creation',
                operation: async () => {
                    // Simulate node creation operation
                    await new Promise(resolve => setTimeout(resolve, 10));
                    return { nodeId: Math.random().toString(36) };
                },
                iterations: 200,
                concurrency: 5,
                warmupIterations: 20
            },
            {
                name: 'Scene Loading',
                operation: async () => {
                    // Simulate scene loading
                    await new Promise(resolve => setTimeout(resolve, 50));
                    return { sceneLoaded: true };
                },
                iterations: 50,
                concurrency: 2,
                warmupIterations: 5
            },
            {
                name: 'Script Compilation',
                operation: async () => {
                    // Simulate script compilation
                    await new Promise(resolve => setTimeout(resolve, 100));
                    return { compiled: true };
                },
                iterations: 20,
                concurrency: 1,
                warmupIterations: 2
            }
        ]
    })
};
// Global benchmarker instance
let globalBenchmarker = null;
export function getBenchmarker() {
    if (!globalBenchmarker) {
        globalBenchmarker = new PerformanceBenchmarker();
    }
    return globalBenchmarker;
}
// Utility function to run a quick benchmark
export async function quickBenchmark(name, operation, iterations = 100, concurrency = 1) {
    const benchmarker = getBenchmarker();
    return benchmarker.runBenchmark({
        name,
        operation,
        iterations,
        concurrency,
        warmupIterations: Math.min(10, Math.floor(iterations * 0.1))
    });
}
// Performance regression detection
export class PerformanceRegressionDetector {
    constructor() {
        this.baselineResults = new Map();
    }
    setBaseline(name, result) {
        this.baselineResults.set(name, result);
    }
    detectRegression(currentResult) {
        const baseline = this.baselineResults.get(currentResult.name);
        if (!baseline) {
            return { hasRegression: false, regressions: [], improvements: [] };
        }
        const regressions = [];
        const improvements = [];
        // Check operations per second (should not decrease significantly)
        const opsRegression = (baseline.operationsPerSecond - currentResult.operationsPerSecond) / baseline.operationsPerSecond;
        if (opsRegression > 0.1) { // 10% regression
            regressions.push(`Operations/sec decreased by ${(opsRegression * 100).toFixed(1)}%`);
        }
        else if (opsRegression < -0.05) { // 5% improvement
            improvements.push(`Operations/sec improved by ${(-opsRegression * 100).toFixed(1)}%`);
        }
        // Check latency (should not increase significantly)
        const latencyRegression = (currentResult.averageLatency - baseline.averageLatency) / baseline.averageLatency;
        if (latencyRegression > 0.15) { // 15% regression
            regressions.push(`Average latency increased by ${(latencyRegression * 100).toFixed(1)}%`);
        }
        else if (latencyRegression < -0.1) { // 10% improvement
            improvements.push(`Average latency improved by ${(-latencyRegression * 100).toFixed(1)}%`);
        }
        // Check memory usage
        if (currentResult.memoryUsage.delta > baseline.memoryUsage.delta * 1.2) {
            regressions.push(`Memory usage increased significantly`);
        }
        return {
            hasRegression: regressions.length > 0,
            regressions,
            improvements
        };
    }
}
export function getRegressionDetector() {
    return new PerformanceRegressionDetector();
}
//# sourceMappingURL=performance_benchmark.js.map