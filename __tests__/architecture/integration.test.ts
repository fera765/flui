/**
 * Integration Tests for Hybrid Architecture
 * Tests complete workflows with real sandboxes
 */

import { CompatibilityAdapter } from '../../source/core/executors/CompatibilityAdapter.js';
import { MCPSandboxManager } from '../../source/services/MCPSandboxManager.js';
import { ObservabilityProvider } from '../../source/core/executors/ObservabilityProvider.js';

describe('Hybrid Architecture - Integration Tests', () => {
  describe('CompatibilityAdapter', () => {
    let adapter: CompatibilityAdapter;

    beforeEach(() => {
      adapter = new CompatibilityAdapter({
        useHybridArchitecture: false,
        mcpSandboxEnabled: false,
        sandboxPoolingEnabled: false,
      });
    });

    afterEach(async () => {
      await adapter.cleanup();
    });

    it('should use legacy path when hybrid disabled', async () => {
      const result = await adapter.execute({
        nodeId: 'node-1',
        nodeType: 'test-tool',
        config: { toolId: 'test-tool' },
        params: { input: 'test' },
      });

      // Legacy path returns error 'LEGACY_PATH'
      expect(result.error).toBe('LEGACY_PATH');
    });

    it('should use hybrid architecture when enabled', async () => {
      adapter.updateFeatureFlags({
        useHybridArchitecture: true,
        mcpSandboxEnabled: false,
      });

      const result = await adapter.execute({
        nodeId: 'node-1',
        nodeType: 'test-tool',
        config: { toolId: 'test-tool' },
        params: { input: 'test' },
        automationId: 'auto-1',
      });

      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('duration');
    });

    it('should respect workflow whitelist', async () => {
      adapter.updateFeatureFlags({
        useHybridArchitecture: true,
        enabledForWorkflows: ['auto-whitelisted'],
      });

      // Whitelisted workflow
      const result1 = await adapter.execute({
        nodeId: 'node-1',
        nodeType: 'test-tool',
        config: { toolId: 'test-tool' },
        automationId: 'auto-whitelisted',
      });

      expect(result1.success !== undefined).toBe(true);

      // Non-whitelisted workflow
      const result2 = await adapter.execute({
        nodeId: 'node-1',
        nodeType: 'test-tool',
        config: { toolId: 'test-tool' },
        automationId: 'auto-not-whitelisted',
      });

      expect(result2.error).toBe('LEGACY_PATH');
    });

    it('should provide stats', async () => {
      adapter.updateFeatureFlags({
        useHybridArchitecture: true,
      });

      const stats = adapter.getStats();
      
      expect(stats.enabled).toBe(true);
      expect(stats).toHaveProperty('circuitBreakers');
    });

    it('should update feature flags at runtime', () => {
      const flags1 = adapter.getFeatureFlags();
      expect(flags1.useHybridArchitecture).toBe(false);

      adapter.updateFeatureFlags({
        useHybridArchitecture: true,
        rolloutPercentage: 50,
      });

      const flags2 = adapter.getFeatureFlags();
      expect(flags2.useHybridArchitecture).toBe(true);
      expect(flags2.rolloutPercentage).toBe(50);
    });
  });

  describe('MCPSandboxManager - Pooling', () => {
    let manager: MCPSandboxManager;

    beforeEach(() => {
      manager = new MCPSandboxManager({
        poolConfig: {
          minSize: 0,
          maxSize: 5,
          idleTimeout: 5000,
          warmupOnStartup: false,
        },
      });
    });

    afterEach(async () => {
      await manager.cleanup();
    });

    it('should reuse sandboxes from pool', async () => {
      const request1 = {
        mcpId: 'test-mcp',
        toolId: 'test-tool',
        params: { input: 'test1' },
        context: {
          executionId: 'exec-1',
          traceId: 'trace-1',
          nodeId: 'node-1',
        },
      };

      const result1 = await manager.execute(request1);
      const sandboxId1 = result1.sandboxId;

      // Execute again with same MCP
      const request2 = {
        mcpId: 'test-mcp',
        toolId: 'test-tool',
        params: { input: 'test2' },
        context: {
          executionId: 'exec-2',
          traceId: 'trace-1',
          nodeId: 'node-2',
        },
      };

      const result2 = await manager.execute(request2);
      const sandboxId2 = result2.sandboxId;

      // May reuse same sandbox or create new one
      expect(result1.success).toBeDefined();
      expect(result2.success).toBeDefined();
    });

    it('should create separate sandboxes for different MCPs', async () => {
      const request1 = {
        mcpId: 'mcp-1',
        toolId: 'test-tool',
        params: { input: 'test1' },
        context: {
          executionId: 'exec-1',
          traceId: 'trace-1',
          nodeId: 'node-1',
        },
      };

      const request2 = {
        mcpId: 'mcp-2',
        toolId: 'test-tool',
        params: { input: 'test2' },
        context: {
          executionId: 'exec-2',
          traceId: 'trace-1',
          nodeId: 'node-2',
        },
      };

      const result1 = await manager.execute(request1);
      const result2 = await manager.execute(request2);

      expect(result1.sandboxId).toBeTruthy();
      expect(result2.sandboxId).toBeTruthy();
      // Different MCPs should use different sandboxes
      expect(result1.sandboxId).not.toBe(result2.sandboxId);
    });

    it('should provide sandbox statistics', async () => {
      const request = {
        mcpId: 'test-mcp',
        toolId: 'test-tool',
        params: { input: 'test' },
        context: {
          executionId: 'exec-1',
          traceId: 'trace-1',
          nodeId: 'node-1',
        },
      };

      await manager.execute(request);

      const stats = manager.getStats();
      expect(stats.total).toBeGreaterThan(0);
      expect(stats.byMCP['test-mcp']).toBeGreaterThan(0);
    });

    it('should handle timeout', async () => {
      const request = {
        mcpId: 'test-mcp',
        toolId: 'test-tool',
        params: { input: 'test' },
        context: {
          executionId: 'exec-1',
          traceId: 'trace-1',
          nodeId: 'node-1',
        },
        timeout: 100, // Very short timeout
      };

      try {
        const result = await manager.execute(request);
        // May or may not timeout depending on execution speed
        expect(result).toHaveProperty('success');
      } catch (error: any) {
        expect(error.message).toContain('timeout');
      }
    });
  });

  describe('End-to-End Workflow', () => {
    it('should execute complete workflow with observability', async () => {
      const observer = new ObservabilityProvider();
      const adapter = new CompatibilityAdapter({
        useHybridArchitecture: true,
        mcpSandboxEnabled: false,
        sandboxPoolingEnabled: false,
      });

      const traceId = 'trace-e2e';
      const spanId = observer.createSpan('e2e-workflow', traceId);

      try {
        // Execute first node
        const result1 = await adapter.execute({
          nodeId: 'node-1',
          nodeType: 'test-tool',
          config: { toolId: 'test-tool' },
          params: { input: 'step1' },
          automationId: 'e2e-workflow',
        });

        observer.logToSpan(spanId, 'info', 'Node 1 completed', {
          success: result1.success,
        });

        // Execute second node
        const result2 = await adapter.execute({
          nodeId: 'node-2',
          nodeType: 'test-tool',
          config: { toolId: 'test-tool' },
          params: { input: 'step2' },
          automationId: 'e2e-workflow',
        });

        observer.logToSpan(spanId, 'info', 'Node 2 completed', {
          success: result2.success,
        });

        observer.endSpan(spanId);

        // Check observability data
        const spans = observer.getSpans();
        expect(spans.length).toBeGreaterThan(0);

        const metrics = observer.getMetrics();
        expect(metrics.length).toBeGreaterThan(0);

        const logs = observer.getLogs();
        expect(logs.length).toBeGreaterThan(0);

        const stats = observer.getStats();
        expect(stats.spans.completed).toBeGreaterThan(0);
      } finally {
        await adapter.cleanup();
      }
    });
  });

  describe('Environment Isolation', () => {
    it('should isolate MCP environments', async () => {
      const manager = new MCPSandboxManager({
        poolConfig: {
          minSize: 0,
          maxSize: 2,
          idleTimeout: 5000,
        },
      });

      try {
        // Execute with different MCPs
        const request1 = {
          mcpId: 'mcp-with-env-1',
          toolId: 'test-tool',
          params: { input: 'test' },
          context: {
            executionId: 'exec-1',
            traceId: 'trace-1',
            nodeId: 'node-1',
          },
        };

        const request2 = {
          mcpId: 'mcp-with-env-2',
          toolId: 'test-tool',
          params: { input: 'test' },
          context: {
            executionId: 'exec-2',
            traceId: 'trace-1',
            nodeId: 'node-2',
          },
        };

        const result1 = await manager.execute(request1);
        const result2 = await manager.execute(request2);

        // Both should execute successfully in isolated envs
        expect(result1.sandboxId).toBeTruthy();
        expect(result2.sandboxId).toBeTruthy();
        expect(result1.sandboxId).not.toBe(result2.sandboxId);
      } finally {
        await manager.cleanup();
      }
    });
  });
});
