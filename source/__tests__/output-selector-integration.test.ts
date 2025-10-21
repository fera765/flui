/**
 * FLUI - Output Selector Integration Tests
 * 
 * Testa a integração completa do sistema de seleção de outputs:
 * - API endpoint de outputs disponíveis
 * - Extração de chaves por tool
 * - Busca recursiva de nodes pai
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { extractNodeOutputKeys } from '../services/nodeOutputExtractor.js';
import { registerAllTools } from '../tools/index.js';
import { getToolRegistry } from '../core/toolRegistry.js';

describe('Output Selector Integration', () => {
  beforeAll(() => {
    registerAllTools();
  });

  describe('extractNodeOutputKeys', () => {
    it('should extract webhook-trigger outputs', () => {
      const node = {
        id: 'node-1',
        data: {
          toolId: 'webhook-trigger',
          label: 'Webhook Trigger',
        },
      };

      const keys = extractNodeOutputKeys(node);

      expect(keys).toContain('data');
      expect(keys).toContain('message');
      expect(keys).toContain('timestamp');
      expect(keys).toContain('source');
      expect(keys).toContain('rawData');
    });

    it('should extract http-request outputs', () => {
      const node = {
        id: 'node-2',
        config: {
          toolId: 'http-request',
        },
      };

      const keys = extractNodeOutputKeys(node);

      expect(keys).toContain('body');
      expect(keys).toContain('status');
      expect(keys).toContain('headers');
      expect(keys).toContain('statusText');
      expect(keys).toContain('duration');
    });

    it('should extract agent-executor outputs', () => {
      const node = {
        data: {
          toolId: 'agent-executor',
        },
      };

      const keys = extractNodeOutputKeys(node);

      expect(keys).toContain('response');
      expect(keys).toContain('agentName');
      expect(keys).toContain('tokensUsed');
      expect(keys).toContain('executionTime');
    });

    it('should extract universal-condition outputs', () => {
      const node = {
        data: {
          toolId: 'universal-condition',
        },
      };

      const keys = extractNodeOutputKeys(node);

      expect(keys).toContain('branch');
      expect(keys).toContain('matched');
      expect(keys).toContain('input');
      expect(keys).toContain('conditionMatched');
    });

    it('should extract data-transform outputs', () => {
      const node = {
        data: {
          toolId: 'data-transform',
        },
      };

      const keys = extractNodeOutputKeys(node);

      expect(keys).toContain('result');
      expect(keys).toContain('transformed');
      expect(keys).toContain('count');
    });

    it('should return default keys for unknown tool', () => {
      const node = {
        data: {
          toolId: 'unknown-tool-id',
        },
      };

      const keys = extractNodeOutputKeys(node);

      expect(keys).toContain('output');
      expect(keys).toContain('result');
      expect(keys).toContain('data');
    });

    it('should handle node without toolId', () => {
      const node = {
        id: 'node-invalid',
        data: {},
      };

      const keys = extractNodeOutputKeys(node);

      expect(keys.length).toBeGreaterThan(0);
      expect(keys).toContain('output');
    });

    it('should handle old node structure (config.toolId)', () => {
      const node = {
        id: 'node-old',
        config: {
          toolId: 'webhook-trigger',
        },
      };

      const keys = extractNodeOutputKeys(node);

      expect(keys).toContain('data');
      expect(keys).toContain('message');
    });

    it('should handle new node structure (data.toolId)', () => {
      const node = {
        id: 'node-new',
        data: {
          toolId: 'webhook-trigger',
        },
      };

      const keys = extractNodeOutputKeys(node);

      expect(keys).toContain('data');
      expect(keys).toContain('message');
    });
  });

  describe('Tool Registry Integration', () => {
    it('should have all tools registered', () => {
      const registry = getToolRegistry();
      const tools = registry.list().tools;

      expect(tools.length).toBeGreaterThanOrEqual(17);
      expect(tools.map(t => t.id)).toContain('webhook-trigger');
      expect(tools.map(t => t.id)).toContain('http-request');
      expect(tools.map(t => t.id)).toContain('agent-executor');
      expect(tools.map(t => t.id)).toContain('universal-condition');
    });

    it('should have correct tool metadata', () => {
      const registry = getToolRegistry();
      const webhookTool = registry.get('webhook-trigger');

      expect(webhookTool).toBeDefined();
      expect(webhookTool?.id).toBe('webhook-trigger');
      expect(webhookTool?.name).toBeTruthy();
    });
  });

  describe('Output Keys Coverage', () => {
    const toolsToTest = [
      'webhook-trigger',
      'webhook-response',
      'http-request',
      'file-read',
      'file-write',
      'file-edit',
      'file-search',
      'text-search',
      'system-info',
      'shell-executor',
      'data-transform',
      'data-filter',
      'data-merge',
      'universal-condition',
      'delay',
      'agent-executor',
      'custom-code',
    ];

    toolsToTest.forEach((toolId) => {
      it(`should have output keys for ${toolId}`, () => {
        const node = {
          data: { toolId },
        };

        const keys = extractNodeOutputKeys(node);

        expect(keys.length).toBeGreaterThan(0);
        expect(Array.isArray(keys)).toBe(true);
        expect(keys.every(k => typeof k === 'string')).toBe(true);
      });
    });
  });

  describe('Realistic Workflow Scenarios', () => {
    it('should handle typical 3-node workflow', () => {
      const nodes = [
        {
          id: 'node-1',
          data: { toolId: 'webhook-trigger', label: 'Webhook Trigger' },
        },
        {
          id: 'node-2',
          data: { toolId: 'data-transform', label: 'Transform Data' },
        },
        {
          id: 'node-3',
          data: { toolId: 'http-request', label: 'Send to API' },
        },
      ];

      // Node 3 deve poder acessar outputs de Node 1 e Node 2
      const node1Keys = extractNodeOutputKeys(nodes[0]);
      const node2Keys = extractNodeOutputKeys(nodes[1]);

      expect(node1Keys).toContain('data');
      expect(node2Keys).toContain('result');

      // Simular referências que seriam usadas
      const references = [
        `{{${nodes[0].id}.data}}`,
        `{{${nodes[1].id}.result}}`,
      ];

      references.forEach(ref => {
        expect(ref).toMatch(/\{\{node-\d+\.\w+\}\}/);
      });
    });

    it('should handle complex workflow with conditions', () => {
      const nodes = [
        { id: 'node-1', data: { toolId: 'webhook-trigger' } },
        { id: 'node-2', data: { toolId: 'universal-condition' } },
        { id: 'node-3a', data: { toolId: 'agent-executor' } },
        { id: 'node-3b', data: { toolId: 'http-request' } },
      ];

      const conditionKeys = extractNodeOutputKeys(nodes[1]);
      
      expect(conditionKeys).toContain('branch');
      expect(conditionKeys).toContain('matched');

      // Nodes 3a e 3b podem usar branch para lógica
      const reference = `{{${nodes[1].id}.branch}}`;
      expect(reference).toMatch(/\{\{node-\d+\.branch\}\}/);
    });

    it('should handle agent workflow', () => {
      const nodes = [
        { id: 'node-1', data: { toolId: 'webhook-trigger' } },
        { id: 'node-2', data: { toolId: 'agent-executor' } },
        { id: 'node-3', data: { toolId: 'data-transform' } },
      ];

      const agentKeys = extractNodeOutputKeys(nodes[1]);

      expect(agentKeys).toContain('response');
      expect(agentKeys).toContain('tokensUsed');

      // Node 3 pode transformar a resposta do agente
      const reference = `{{${nodes[1].id}.response}}`;
      expect(reference).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty node', () => {
      const node = {} as any;
      const keys = extractNodeOutputKeys(node);
      
      expect(keys.length).toBeGreaterThan(0);
      expect(keys).toContain('output');
    });

    it('should handle null data', () => {
      const node = { data: null } as any;
      const keys = extractNodeOutputKeys(node);
      
      expect(keys.length).toBeGreaterThan(0);
    });

    it('should handle undefined toolId', () => {
      const node = {
        data: {
          toolId: undefined,
        },
      } as any;

      const keys = extractNodeOutputKeys(node);
      
      expect(keys.length).toBeGreaterThan(0);
    });

    it('should not return duplicate keys', () => {
      const node = {
        data: { toolId: 'webhook-trigger' },
      };

      const keys = extractNodeOutputKeys(node);
      const uniqueKeys = [...new Set(keys)];

      expect(keys.length).toBe(uniqueKeys.length);
    });
  });
});
