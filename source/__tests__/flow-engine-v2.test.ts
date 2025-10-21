/**
 * FLUI - Flow Engine V2 Tests
 * 
 * Testa o novo padrão universal de Input/Output
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { FlowEngineV2 } from '../core/flowEngineV2.js';
import { registerAllTools } from '../tools/index.js';
import { FlowDefinition } from '../core/flowTypes.js';
import {
  createNodeDataItem,
  createInitialOutput,
  extractAvailableKeys,
  applyInputMappings,
  validateNodeOutput,
  convertLegacyOutput,
} from '../core/nodeDataTypes.js';

describe('Flow Engine V2 - Padrão Universal', () => {
  beforeAll(() => {
    registerAllTools();
  });

  describe('NodeDataTypes - Helpers', () => {
    it('should create node data item with correct format', () => {
      const item = createNodeDataItem(
        { message: 'teste', value: 123 },
        'node-1',
        'Test Node',
        'exec-1'
      );

      expect(item).toHaveProperty('json');
      expect(item).toHaveProperty('meta');
      expect(item.json).toEqual({ message: 'teste', value: 123 });
      expect(item.meta.nodeId).toBe('node-1');
      expect(item.meta.nodeName).toBe('Test Node');
      expect(item.meta.executionId).toBe('exec-1');
      expect(item.meta.timestamp).toBeGreaterThan(0);
    });

    it('should create initial output', () => {
      const output = createInitialOutput('start-node', 'Start');

      expect(Array.isArray(output)).toBe(true);
      expect(output.length).toBe(1);
      expect(output[0].json).toEqual({ init: true });
      expect(output[0].meta.nodeId).toBe('start-node');
    });

    it('should extract available keys from output', () => {
      const output = [
        createNodeDataItem({ name: 'John', age: 30 }, 'node-1'),
        createNodeDataItem({ name: 'Jane', city: 'NYC' }, 'node-1'),
      ];

      const keys = extractAvailableKeys(output);

      expect(keys).toContain('name');
      expect(keys).toContain('age');
      expect(keys).toContain('city');
      expect(keys.length).toBe(3);
    });

    it('should validate correct output', () => {
      const output = [
        createNodeDataItem({ test: true }, 'node-1'),
      ];

      const validation = validateNodeOutput(output);

      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should detect invalid output', () => {
      const invalidOutput = [
        { json: { test: true } }, // Missing meta
      ];

      const validation = validateNodeOutput(invalidOutput);

      expect(validation.valid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });

    it('should convert legacy output to new format', () => {
      const legacy = { result: 'success', value: 42 };

      const converted = convertLegacyOutput(legacy, 'node-1', 'Legacy Node');

      expect(Array.isArray(converted)).toBe(true);
      expect(converted[0].json).toEqual({ result: 'success', value: 42 });
      expect(converted[0].meta.nodeId).toBe('node-1');
    });

    it('should apply input mappings correctly', () => {
      const previousResults = {
        'node-1': [createNodeDataItem({ message: 'Hello', user: 'John' }, 'node-1')],
        'node-2': [createNodeDataItem({ status: 'ok', code: 200 }, 'node-2')],
      };

      const inputConfig = {
        mappings: [
          {
            sourceNodeId: 'node-1',
            selectedKeys: ['message', 'user'],
          },
          {
            sourceNodeId: 'node-2',
            selectedKeys: ['status'],
          },
        ],
        mergeStrategy: 'replace' as const,
      };

      const result = applyInputMappings(previousResults, inputConfig);

      expect(result).toEqual({
        message: 'Hello',
        user: 'John',
        status: 'ok',
      });
    });

    it('should apply input mappings with array strategy', () => {
      const previousResults = {
        'node-1': [
          createNodeDataItem({ value: 10 }, 'node-1'),
          createNodeDataItem({ value: 20 }, 'node-1'),
        ],
      };

      const inputConfig = {
        mappings: [
          {
            sourceNodeId: 'node-1',
            selectedKeys: ['value'],
          },
        ],
        mergeStrategy: 'array' as const,
      };

      const result = applyInputMappings(previousResults, inputConfig);

      expect(result.value).toEqual([10, 20]);
    });
  });

  describe('Flow Engine V2 - Execution', () => {
    it('should execute simple flow with new format', async () => {
      const flow: FlowDefinition = {
        id: 'test-flow-1',
        name: 'Test Flow',
        description: 'Test flow with universal format',
        version: '2.0.0',
        startNodeId: 'node-1',
        nodes: [
          {
            id: 'node-1',
            type: 'tool',
            name: 'Delay Test',
            config: {
              toolId: 'delay',
              duration: 100,
              unit: 'milliseconds',
            },
          },
        ],
        edges: [],
      };

      const engine = new FlowEngineV2(flow);
      const execution = await engine.execute();

      expect(execution.status).toBe('completed');
      expect(execution.nodeResults['node-1']).toBeDefined();
      
      const output = execution.nodeResults['node-1'];
      expect(Array.isArray(output)).toBe(true);
      expect(output[0]).toHaveProperty('json');
      expect(output[0]).toHaveProperty('meta');
    });

    it('should execute flow with chained nodes', async () => {
      const flow: FlowDefinition = {
        id: 'test-flow-2',
        name: 'Chained Flow',
        description: 'Test flow with two nodes',
        version: '2.0.0',
        startNodeId: 'node-1',
        nodes: [
          {
            id: 'node-1',
            type: 'tool',
            name: 'First',
            config: {
              toolId: 'delay',
              duration: 50,
              unit: 'milliseconds',
              message: 'First node',
            },
          },
          {
            id: 'node-2',
            type: 'tool',
            name: 'Second',
            config: {
              toolId: 'delay',
              duration: 50,
              unit: 'milliseconds',
              message: 'Second node',
            },
          },
        ],
        edges: [
          { id: 'edge-1-2', source: 'node-1', target: 'node-2' },
        ],
      };

      const engine = new FlowEngineV2(flow);
      const execution = await engine.execute();

      expect(execution.status).toBe('completed');
      expect(execution.nodeResults['node-1']).toBeDefined();
      expect(execution.nodeResults['node-2']).toBeDefined();
      
      // Verificar que ambos os outputs estão no formato correto
      const output1 = execution.nodeResults['node-1'];
      const output2 = execution.nodeResults['node-2'];
      
      expect(Array.isArray(output1)).toBe(true);
      expect(Array.isArray(output2)).toBe(true);
      expect(output1[0]).toHaveProperty('json');
      expect(output1[0]).toHaveProperty('meta');
      expect(output2[0]).toHaveProperty('json');
      expect(output2[0]).toHaveProperty('meta');
    });

    it('should get available keys from node', async () => {
      const flow: FlowDefinition = {
        id: 'test-flow-3',
        name: 'Keys Test',
        description: 'Test key extraction',
        version: '2.0.0',
        startNodeId: 'node-1',
        nodes: [
          {
            id: 'node-1',
            type: 'tool',
            name: 'Data Source',
            config: {
              toolId: 'delay',
              duration: 100,
              unit: 'milliseconds',
              message: 'Test message',
            },
          },
        ],
        edges: [],
      };

      const engine = new FlowEngineV2(flow);
      await engine.execute();

      const keys = engine.getAvailableKeys('node-1');

      expect(keys.length).toBeGreaterThan(0);
      // Delay tool retorna várias chaves como duration, completedAt, etc
      expect(keys).toContain('duration');
    });
  });

  describe('Flow Engine V2 - Chaining', () => {
    it('should chain multiple nodes with input mapping', async () => {
      const flow: FlowDefinition = {
        id: 'test-flow-4',
        name: 'Chained Flow',
        description: 'Test node chaining',
        version: '2.0.0',
        startNodeId: 'node-1',
        nodes: [
          {
            id: 'node-1',
            type: 'tool',
            name: 'Start',
            config: {
              toolId: 'webhook-trigger',
              webhookData: { message: 'test data' },
            },
          },
          {
            id: 'node-2',
            type: 'tool',
            name: 'Process',
            config: {
              toolId: 'delay',
              duration: 100,
              unit: 'milliseconds',
              inputConfig: {
                mappings: [
                  {
                    sourceNodeId: 'node-1',
                    selectedKeys: ['data'],
                  },
                ],
              },
            },
          },
        ],
        edges: [
          { id: 'edge-1-2', source: 'node-1', target: 'node-2' },
        ],
      };

      const engine = new FlowEngineV2(flow);
      const execution = await engine.execute();

      expect(execution.status).toBe('completed');
      expect(execution.nodeResults['node-1']).toBeDefined();
      expect(execution.nodeResults['node-2']).toBeDefined();
    });
  });
});
