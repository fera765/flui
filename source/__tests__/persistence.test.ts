/**
 * FLUI - Testes de Persistência (Kanban QA-001)
 * 
 * Testa save/load de automações com validação completa
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { saveAutomation, getAutomation, getAutomations } from '../store/automationStorage.js';
import { nanoid } from 'nanoid';

describe('Persistence Tests (QA-001)', () => {
  describe('Save and Load Automation', () => {
    it('should save automation with all required fields', () => {
      const automation: any = {
        id: nanoid(),
        name: 'Test Automation',
        description: 'Test description',
        nodes: [
          {
            id: 'node-1',
            type: 'trigger',
            name: 'Webhook',
            config: { url: 'http://test.com' },
          },
        ],
        edges: [],
      };

      const saved = saveAutomation(automation);

      expect(saved.id).toBe(automation.id);
      expect(saved.name).toBe('Test Automation');
      expect(saved.description).toBe('Test description');
      expect(saved.nodes).toHaveLength(1);
      expect(saved.version).toBe('2.0.0');
      expect(saved.createdAt).toBeDefined();
      expect(saved.updatedAt).toBeDefined();
    });

    it('should apply defaults for missing fields', () => {
      const automation: any = {
        // Apenas campos mínimos
        nodes: [],
        edges: [],
      };

      const saved = saveAutomation(automation);

      expect(saved.id).toBeDefined(); // ID gerado
      expect(saved.name).toBe('Nova Automação'); // Default
      expect(saved.description).toBe(''); // Default
      expect(saved.enabled).toBe(true); // Default
      expect(saved.version).toBe('2.0.0'); // Default
      expect(saved.startNodeId).toBe(''); // Default quando não há nodes
    });

    it('should load automation with all fields intact', () => {
      const automation: any = {
        id: nanoid(),
        name: 'Persist Test',
        nodes: [
          { id: 'n1', type: 'trigger', name: 'Start', config: {} },
          { id: 'n2', type: 'agent', name: 'Process', config: { prompt: 'test' } },
        ],
        edges: [
          { source: 'n1', target: 'n2' },
        ],
      };

      const saved = saveAutomation(automation);
      const loaded = getAutomation(saved.id);

      expect(loaded).toBeDefined();
      expect(loaded!.id).toBe(saved.id);
      expect(loaded!.name).toBe('Persist Test');
      expect(loaded!.nodes).toHaveLength(2);
      expect(loaded!.edges).toHaveLength(1);
    });

    it('should preserve node configurations', () => {
      const automation: any = {
        id: nanoid(),
        name: 'Config Test',
        nodes: [
          {
            id: 'node-1',
            type: 'agent',
            name: 'Agent',
            config: {
              prompt: '{{node-0.data}}',
              model: 'gpt-4',
              temperature: 0.7,
            },
          },
        ],
        edges: [],
      };

      const saved = saveAutomation(automation);
      const loaded = getAutomation(saved.id);

      expect(loaded!.nodes[0].config.prompt).toBe('{{node-0.data}}');
      expect(loaded!.nodes[0].config.model).toBe('gpt-4');
      expect(loaded!.nodes[0].config.temperature).toBe(0.7);
    });
  });

  describe('Migration Tests', () => {
    it('should migrate automation with connections to edges', () => {
      const oldFormat: any = {
        id: nanoid(),
        name: 'Old Format',
        nodes: [{ id: 'n1', type: 'trigger', name: 'Start', config: {} }],
        connections: [{ from: 'n1', to: 'n2' }], // Old format
        version: '1.0.0',
      };

      const saved = saveAutomation(oldFormat);
      const loaded = getAutomation(saved.id);

      expect(loaded!.version).toBe('2.0.0');
      expect(loaded!.edges).toBeDefined();
      expect(loaded!.edges).toHaveLength(1);
      expect(loaded!.edges[0].source).toBe('n1');
      expect(loaded!.edges[0].target).toBe('n2');
    });

    it('should add missing metadata', () => {
      const automation: any = {
        id: nanoid(),
        name: 'No Metadata',
        nodes: [],
        edges: [],
        // Sem metadata
      };

      const saved = saveAutomation(automation);

      expect(saved.metadata).toBeDefined();
      expect(saved.metadata.createdAt).toBeDefined();
      expect(saved.metadata.updatedAt).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty nodes array', () => {
      const automation: any = {
        id: nanoid(),
        name: 'Empty',
        nodes: [],
        edges: [],
      };

      const saved = saveAutomation(automation);
      const loaded = getAutomation(saved.id);

      expect(loaded!.nodes).toEqual([]);
      expect(loaded!.edges).toEqual([]);
    });

    it('should handle nodes without positions', () => {
      const automation: any = {
        id: nanoid(),
        name: 'No Position',
        nodes: [
          { id: 'n1', type: 'trigger', name: 'Start', config: {} },
          // Sem position
        ],
        edges: [],
      };

      const saved = saveAutomation(automation);

      expect(saved.nodes[0].position).toBeDefined();
      expect(saved.nodes[0].position.x).toBe(0);
      expect(saved.nodes[0].position.y).toBe(0);
    });

    it('should auto-generate edge IDs', () => {
      const automation: any = {
        id: nanoid(),
        name: 'No Edge IDs',
        nodes: [
          { id: 'n1', type: 'trigger', name: 'Start', config: {} },
          { id: 'n2', type: 'agent', name: 'Process', config: {} },
        ],
        edges: [
          { source: 'n1', target: 'n2' }, // Sem ID
        ],
      };

      const saved = saveAutomation(automation);

      expect(saved.edges[0].id).toBeDefined();
    });

    it('should handle multiple saves (update)', () => {
      const automation: any = {
        id: nanoid(),
        name: 'Version 1',
        nodes: [],
        edges: [],
      };

      const saved1 = saveAutomation(automation);
      const createdAt1 = saved1.createdAt;

      // Simular delay
      const updated = {
        ...saved1,
        name: 'Version 2',
      };

      const saved2 = saveAutomation(updated);

      expect(saved2.name).toBe('Version 2');
      expect(saved2.createdAt).toBe(createdAt1); // Preserva createdAt
      expect(saved2.updatedAt).not.toBe(saved1.updatedAt); // updatedAt muda
    });
  });

  describe('Validation Tests', () => {
    it('should ensure arrays are never undefined', () => {
      const automation: any = {
        id: nanoid(),
        name: 'Arrays Test',
        // nodes: undefined, // Propositalmente ausente
        // edges: undefined, // Propositalmente ausente
      };

      const saved = saveAutomation(automation);

      expect(Array.isArray(saved.nodes)).toBe(true);
      expect(Array.isArray(saved.edges)).toBe(true);
    });

    it('should ensure startNodeId is set', () => {
      const automation: any = {
        id: nanoid(),
        name: 'StartNode Test',
        nodes: [
          { id: 'first-node', type: 'trigger', name: 'Start', config: {} },
        ],
        edges: [],
      };

      const saved = saveAutomation(automation);

      expect(saved.startNodeId).toBe('first-node');
    });

    it('should handle nodes with all required fields', () => {
      const automation: any = {
        id: nanoid(),
        name: 'Complete Node',
        nodes: [
          {
            id: 'node-complete',
            type: 'agent',
            name: 'AI Agent',
            description: 'Agent description',
            config: {
              model: 'gpt-4',
              prompt: 'Test prompt',
            },
            position: { x: 100, y: 200 },
            nextNodes: ['node-2'],
          },
        ],
        edges: [],
      };

      const saved = saveAutomation(automation);
      const loaded = getAutomation(saved.id);

      const node = loaded!.nodes[0];
      expect(node.id).toBe('node-complete');
      expect(node.type).toBe('agent');
      expect(node.name).toBe('AI Agent');
      expect(node.description).toBe('Agent description');
      expect(node.config.model).toBe('gpt-4');
      expect(node.position.x).toBe(100);
      expect(node.nextNodes).toEqual(['node-2']);
    });
  });

  describe('List Automations', () => {
    it('should return all saved automations', () => {
      // Salvar algumas automações
      const auto1: any = {
        id: nanoid(),
        name: 'Auto 1',
        nodes: [],
        edges: [],
      };
      const auto2: any = {
        id: nanoid(),
        name: 'Auto 2',
        nodes: [],
        edges: [],
      };

      saveAutomation(auto1);
      saveAutomation(auto2);

      const all = getAutomations();

      const savedIds = [auto1.id, auto2.id];
      const found = all.filter((a) => savedIds.includes(a.id));

      expect(found.length).toBeGreaterThanOrEqual(2);
    });

    it('should migrate all automations when listing', () => {
      const oldAuto: any = {
        id: nanoid(),
        name: 'Old in List',
        nodes: [],
        connections: [], // Old format
        version: '1.0.0',
      };

      saveAutomation(oldAuto);

      const all = getAutomations();
      const found = all.find((a) => a.id === oldAuto.id);

      expect(found).toBeDefined();
      expect(found!.version).toBe('2.0.0');
      expect(found!.edges).toBeDefined();
    });
  });
});
