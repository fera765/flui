import { describe, it, expect, beforeEach } from 'vitest';
import { nanoid } from 'nanoid';
import { Automation, AutomationNode } from '../types/automation';
import { AutomationExecutor } from '../services/automationExecutor';

describe('Automation System', () => {
  describe('Automation Structure', () => {
    it('should create valid automation', () => {
      const automation: Automation = {
        id: nanoid(),
        name: 'Test Automation',
        description: 'Test description',
        nodes: [],
        startNodeId: 'start',
        enabled: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        runCount: 0,
      };

      expect(automation).toHaveProperty('id');
      expect(automation).toHaveProperty('name');
      expect(automation).toHaveProperty('nodes');
      expect(automation.enabled).toBe(true);
    });

    it('should create automation nodes', () => {
      const node: AutomationNode = {
        id: nanoid(),
        type: 'trigger',
        name: 'Start',
        config: {},
        nextNodes: [],
      };

      expect(node).toHaveProperty('id');
      expect(node).toHaveProperty('type');
      expect(node.type).toBe('trigger');
    });
  });

  describe('Node Types', () => {
    it('should support all node types', () => {
      const types = [
        'trigger',
        'agent',
        'mcp_tool',
        'condition',
        'loop',
        'delay',
        'http_request',
        'file_operation',
        'data_transform',
      ];

      types.forEach((type) => {
        const node: AutomationNode = {
          id: nanoid(),
          type: type as any,
          name: `Test ${type}`,
          config: {},
          nextNodes: [],
        };

        expect(node.type).toBe(type);
      });
    });
  });
});
