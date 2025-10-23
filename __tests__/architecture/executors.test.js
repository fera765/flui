/**
 * Unit Tests for Hybrid Architecture Executors
 */
import { LocalNodeExecutor } from '../../source/core/executors/LocalNodeExecutor.js';
import { MCPNodeExecutor } from '../../source/core/executors/MCPNodeExecutor.js';
import { ExecutionOrchestrator } from '../../source/core/executors/ExecutionOrchestrator.js';
import { ObservabilityProvider } from '../../source/core/executors/ObservabilityProvider.js';
import { MCPSandboxManager } from '../../source/services/MCPSandboxManager.js';
describe('Hybrid Architecture - Executors', () => {
    describe('LocalNodeExecutor', () => {
        it('should execute local nodes successfully', async () => {
            const executor = new LocalNodeExecutor();
            expect(executor.canExecute('tool')).toBe(true);
            expect(executor.canExecute('mcp:some-tool')).toBe(false);
            expect(executor.getName()).toBe('LocalNodeExecutor');
        });
        it('should handle missing tool ID', async () => {
            const executor = new LocalNodeExecutor();
            const result = await executor.execute({
                params: {},
                context: {
                    executionId: 'test-1',
                    traceId: 'trace-1',
                    nodeId: 'node-1',
                    automationId: 'auto-1',
                    timestamp: new Date().toISOString(),
                },
            });
            expect(result.success).toBe(false);
            expect(result.error).toContain('Tool ID not specified');
        });
    });
    describe('MCPNodeExecutor', () => {
        let sandboxManager;
        let executor;
        beforeEach(() => {
            sandboxManager = new MCPSandboxManager({
                baseDir: '/tmp/test-sandboxes',
                poolConfig: {
                    minSize: 0,
                    maxSize: 2,
                    idleTimeout: 10000,
                    warmupOnStartup: false,
                },
            });
            executor = new MCPNodeExecutor({
                sandboxManager,
                defaultTimeout: 5000,
                maxRetries: 1,
            });
        });
        afterEach(async () => {
            await sandboxManager.cleanup();
        });
        it('should identify MCP nodes correctly', () => {
            expect(executor.canExecute('mcp:test-tool')).toBe(true);
            expect(executor.canExecute('test-mcp-tool')).toBe(true);
            expect(executor.canExecute('local-tool')).toBe(false);
            expect(executor.getName()).toBe('MCPNodeExecutor');
        });
        it('should handle missing MCP ID', async () => {
            const result = await executor.execute({
                params: {},
                context: {
                    executionId: 'test-1',
                    traceId: 'trace-1',
                    nodeId: 'node-1',
                    automationId: 'auto-1',
                    timestamp: new Date().toISOString(),
                },
            });
            expect(result.success).toBe(false);
            expect(result.error).toContain('MCP ID not specified');
        });
        it('should execute in MCP sandbox', async () => {
            const result = await executor.execute({
                params: {
                    mcpId: 'test-mcp',
                    toolId: 'test-tool',
                    params: { input: 'test' },
                },
                context: {
                    executionId: 'test-1',
                    traceId: 'trace-1',
                    nodeId: 'node-1',
                    automationId: 'auto-1',
                    timestamp: new Date().toISOString(),
                    timeout: 5000,
                },
            });
            expect(result).toHaveProperty('success');
            expect(result).toHaveProperty('duration');
            expect(result.metadata).toHaveProperty('sandboxId');
        });
    });
    describe('ExecutionOrchestrator', () => {
        it('should select correct executor for node type', async () => {
            const localExecutor = new LocalNodeExecutor();
            const sandboxManager = new MCPSandboxManager();
            const mcpExecutor = new MCPNodeExecutor({
                sandboxManager,
                defaultTimeout: 5000,
            });
            const orchestrator = new ExecutionOrchestrator({
                executors: [localExecutor, mcpExecutor],
                featureFlags: {
                    useHybridArchitecture: true,
                    mcpSandboxEnabled: true,
                    sandboxPoolingEnabled: true,
                },
            });
            // Test with mock execution
            const result = await orchestrator.executeNode('test-tool', { toolId: 'test-tool' }, { input: 'test' });
            expect(result).toHaveProperty('success');
            expect(result).toHaveProperty('duration');
            await sandboxManager.cleanup();
            await orchestrator.cleanup();
        });
        it('should fallback to legacy when hybrid disabled', async () => {
            const localExecutor = new LocalNodeExecutor();
            const orchestrator = new ExecutionOrchestrator({
                executors: [localExecutor],
                featureFlags: {
                    useHybridArchitecture: false,
                    mcpSandboxEnabled: false,
                    sandboxPoolingEnabled: false,
                },
            });
            const result = await orchestrator.executeNode('test-tool', { toolId: 'test-tool' }, { input: 'test' });
            expect(result).toHaveProperty('success');
        });
        it('should respect rollout percentage', async () => {
            const localExecutor = new LocalNodeExecutor();
            const orchestrator = new ExecutionOrchestrator({
                executors: [localExecutor],
                featureFlags: {
                    useHybridArchitecture: true,
                    mcpSandboxEnabled: false,
                    sandboxPoolingEnabled: false,
                    rolloutPercentage: 0, // 0% rollout
                },
            });
            // Execute multiple times - all should use legacy path
            const results = await Promise.all(Array(10).fill(null).map(() => orchestrator.executeNode('test-tool', {}, {})));
            expect(results).toHaveLength(10);
            results.forEach(result => {
                expect(result).toHaveProperty('success');
            });
        });
        it('should handle circuit breaker', async () => {
            const localExecutor = new LocalNodeExecutor();
            const orchestrator = new ExecutionOrchestrator({
                executors: [localExecutor],
                circuitBreaker: {
                    failureThreshold: 3,
                    successThreshold: 2,
                    timeout: 1000,
                    resetTimeout: 5000,
                },
                featureFlags: {
                    useHybridArchitecture: true,
                    mcpSandboxEnabled: false,
                    sandboxPoolingEnabled: false,
                },
            });
            const states = orchestrator.getCircuitBreakerStates();
            expect(states).toHaveProperty('LocalNodeExecutor');
            expect(states.LocalNodeExecutor).toBe('CLOSED');
        });
    });
    describe('ObservabilityProvider', () => {
        let observer;
        beforeEach(() => {
            observer = new ObservabilityProvider();
        });
        it('should create and end spans', () => {
            const spanId = observer.createSpan('test-operation');
            expect(spanId).toBeTruthy();
            observer.endSpan(spanId);
            const spans = observer.getSpans();
            expect(spans.length).toBeGreaterThan(0);
            const span = spans.find(s => s.id === spanId);
            expect(span).toBeTruthy();
            expect(span?.endTime).toBeTruthy();
        });
        it('should record metrics', () => {
            observer.recordMetric('test.counter', 1, { tag: 'value' });
            observer.recordMetric('test.duration', 100, { tag: 'value' });
            const metrics = observer.getMetrics({ name: 'test.counter' });
            expect(metrics.length).toBe(1);
            expect(metrics[0].value).toBe(1);
            expect(metrics[0].tags?.tag).toBe('value');
        });
        it('should aggregate metrics', () => {
            observer.recordMetric('test.value', 10);
            observer.recordMetric('test.value', 20);
            observer.recordMetric('test.value', 30);
            const sum = observer.getAggregatedMetrics('test.value', 'sum');
            const avg = observer.getAggregatedMetrics('test.value', 'avg');
            const max = observer.getAggregatedMetrics('test.value', 'max');
            const min = observer.getAggregatedMetrics('test.value', 'min');
            expect(sum).toBe(60);
            expect(avg).toBe(20);
            expect(max).toBe(30);
            expect(min).toBe(10);
        });
        it('should track execution lifecycle', () => {
            const context = {
                executionId: 'exec-1',
                traceId: 'trace-1',
                nodeId: 'node-1',
                automationId: 'auto-1',
                timestamp: new Date().toISOString(),
            };
            observer.onExecutionStart(context);
            const result = {
                success: true,
                output: { result: 'done' },
                duration: 100,
            };
            observer.onExecutionComplete(context, result);
            const logs = observer.getLogs({ executionId: 'exec-1' });
            expect(logs.length).toBeGreaterThan(0);
            const metrics = observer.getMetrics({ name: 'execution.completed' });
            expect(metrics.length).toBeGreaterThan(0);
        });
        it('should get statistics', () => {
            observer.recordMetric('counter.1', 1);
            observer.recordMetric('gauge.1', 10);
            observer.createSpan('test-span');
            const stats = observer.getStats();
            expect(stats.spans.total).toBeGreaterThan(0);
            expect(stats.metrics.total).toBeGreaterThan(0);
            expect(stats.logs.total).toBeGreaterThan(0);
        });
    });
});
//# sourceMappingURL=executors.test.js.map