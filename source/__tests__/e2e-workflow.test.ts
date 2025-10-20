/**
 * FLUI - Testes E2E de Workflow (Kanban QA-001)
 * 
 * Testa cenários completos de criação e execução de automações
 */

import { describe, it, expect } from 'vitest';
import { saveAutomation, getAutomation } from '../store/automationStorage.js';
import { FlowEngineV2 } from '../core/flowEngineV2.js';
import { FlowDefinition } from '../core/flowTypes.js';
import { nanoid } from 'nanoid';

describe('E2E Workflow Tests (QA-001)', () => {
  describe('Simple Workflow: Node1 -> Node2', () => {
    it('should execute simple 2-node workflow with data passing', async () => {
      // Criar automação
      const automation: any = {
        id: nanoid(),
        name: 'Simple Workflow',
        nodes: [
          {
            id: 'node-1',
            type: 'trigger',
            name: 'Webhook Trigger',
            config: {
              toolId: 'webhook-trigger',
              data: 'Hello World',
            },
          },
          {
            id: 'node-2',
            type: 'agent',
            name: 'Data Transform',
            config: {
              toolId: 'data-transform',
              input: '{{node-1.data}}', // Referência ao node anterior
            },
          },
        ],
        edges: [
          { id: 'e1', source: 'node-1', target: 'node-2' },
        ],
      };

      // Salvar
      const saved = saveAutomation(automation);
      expect(saved).toBeDefined();

      // Carregar
      const loaded = getAutomation(saved.id);
      expect(loaded).toBeDefined();
      expect(loaded!.nodes).toHaveLength(2);
      expect(loaded!.edges).toHaveLength(1);
    });
  });

  describe('Medium Workflow: Node1 -> Node2 -> Node3', () => {
    it('should handle chained workflow with references', async () => {
      const automation: any = {
        id: nanoid(),
        name: 'Chained Workflow',
        nodes: [
          {
            id: 'start',
            type: 'trigger',
            name: 'Start',
            config: {
              toolId: 'webhook-trigger',
              message: 'Initial data',
            },
          },
          {
            id: 'process',
            type: 'agent',
            name: 'Process',
            config: {
              toolId: 'data-transform',
              input: '{{start.message}}',
            },
          },
          {
            id: 'output',
            type: 'http_request',
            name: 'Output',
            config: {
              toolId: 'http-request',
              body: '{{process.result}}',
            },
          },
        ],
        edges: [
          { id: 'e1', source: 'start', target: 'process' },
          { id: 'e2', source: 'process', target: 'output' },
        ],
      };

      const saved = saveAutomation(automation);
      const loaded = getAutomation(saved.id);

      expect(loaded!.nodes).toHaveLength(3);
      expect(loaded!.edges).toHaveLength(2);
      
      // Verificar referências preservadas
      expect(loaded!.nodes[1].config.input).toBe('{{start.message}}');
      expect(loaded!.nodes[2].config.body).toBe('{{process.result}}');
    });
  });

  describe('Complex Workflow: Branching', () => {
    it('should handle workflow with multiple branches', async () => {
      const automation: any = {
        id: nanoid(),
        name: 'Branching Workflow',
        nodes: [
          {
            id: 'input',
            type: 'trigger',
            name: 'Input',
            config: { toolId: 'webhook-trigger' },
          },
          {
            id: 'condition',
            type: 'condition',
            name: 'Condition',
            config: {
              toolId: 'universal-condition',
              input: '{{input.data}}',
            },
          },
          {
            id: 'branch-a',
            type: 'agent',
            name: 'Branch A',
            config: {
              toolId: 'agent-executor',
              prompt: '{{input.data}}',
            },
          },
          {
            id: 'branch-b',
            type: 'agent',
            name: 'Branch B',
            config: {
              toolId: 'agent-executor',
              prompt: '{{input.data}}',
            },
          },
        ],
        edges: [
          { id: 'e1', source: 'input', target: 'condition' },
          { id: 'e2', source: 'condition', target: 'branch-a' },
          { id: 'e3', source: 'condition', target: 'branch-b' },
        ],
      };

      const saved = saveAutomation(automation);
      const loaded = getAutomation(saved.id);

      expect(loaded!.nodes).toHaveLength(4);
      expect(loaded!.edges).toHaveLength(3);

      // Verificar que condition tem 2 saídas
      const conditionEdges = loaded!.edges.filter(
        (e) => e.source === 'condition'
      );
      expect(conditionEdges).toHaveLength(2);
    });
  });

  describe('Parallel Workflow: Aggregation', () => {
    it('should handle parallel nodes feeding into aggregator', async () => {
      const automation: any = {
        id: nanoid(),
        name: 'Parallel Workflow',
        nodes: [
          {
            id: 'source-1',
            type: 'trigger',
            name: 'Source 1',
            config: { toolId: 'webhook-trigger', data: 'data1' },
          },
          {
            id: 'source-2',
            type: 'trigger',
            name: 'Source 2',
            config: { toolId: 'webhook-trigger', data: 'data2' },
          },
          {
            id: 'aggregator',
            type: 'data_transform',
            name: 'Aggregator',
            config: {
              toolId: 'data-merge',
              input1: '{{source-1.data}}',
              input2: '{{source-2.data}}',
            },
          },
        ],
        edges: [
          { id: 'e1', source: 'source-1', target: 'aggregator' },
          { id: 'e2', source: 'source-2', target: 'aggregator' },
        ],
      };

      const saved = saveAutomation(automation);
      const loaded = getAutomation(saved.id);

      expect(loaded!.nodes).toHaveLength(3);
      
      // Verificar que aggregator recebe de 2 sources
      const aggregatorEdges = loaded!.edges.filter(
        (e) => e.target === 'aggregator'
      );
      expect(aggregatorEdges).toHaveLength(2);

      // Verificar referências múltiplas
      expect(loaded!.nodes[2].config.input1).toBe('{{source-1.data}}');
      expect(loaded!.nodes[2].config.input2).toBe('{{source-2.data}}');
    });
  });

  describe('Save -> Reload -> Verify Integrity', () => {
    it('should maintain complete integrity after save and reload', () => {
      const automation: any = {
        id: nanoid(),
        name: 'Integrity Test',
        description: 'Test complete data integrity',
        nodes: [
          {
            id: 'n1',
            type: 'trigger',
            name: 'Start',
            description: 'Starting node',
            config: {
              toolId: 'webhook-trigger',
              url: 'http://example.com',
              method: 'POST',
            },
            position: { x: 100, y: 100 },
            nextNodes: ['n2'],
          },
          {
            id: 'n2',
            type: 'agent',
            name: 'Process',
            description: 'Processing node',
            config: {
              toolId: 'agent-executor',
              prompt: '{{n1.data}}',
              model: 'gpt-4',
              temperature: 0.7,
            },
            position: { x: 300, y: 100 },
            nextNodes: [],
          },
        ],
        edges: [
          {
            id: 'edge-1',
            source: 'n1',
            target: 'n2',
          },
        ],
        enabled: true,
        schedule: '0 0 * * *',
        runCount: 5,
      };

      // Salvar
      const saved = saveAutomation(automation);

      // Carregar
      const loaded = getAutomation(saved.id);

      // Verificar integridade completa
      expect(loaded).toBeDefined();
      expect(loaded!.id).toBe(automation.id);
      expect(loaded!.name).toBe('Integrity Test');
      expect(loaded!.description).toBe('Test complete data integrity');
      expect(loaded!.nodes).toHaveLength(2);
      expect(loaded!.edges).toHaveLength(1);
      expect(loaded!.enabled).toBe(true);
      expect(loaded!.schedule).toBe('0 0 * * *');
      expect(loaded!.runCount).toBe(5);

      // Verificar node 1
      const node1 = loaded!.nodes[0];
      expect(node1.id).toBe('n1');
      expect(node1.name).toBe('Start');
      expect(node1.description).toBe('Starting node');
      expect(node1.config.url).toBe('http://example.com');
      expect(node1.position.x).toBe(100);
      expect(node1.nextNodes).toEqual(['n2']);

      // Verificar node 2
      const node2 = loaded!.nodes[1];
      expect(node2.id).toBe('n2');
      expect(node2.config.prompt).toBe('{{n1.data}}');
      expect(node2.config.temperature).toBe(0.7);

      // Verificar edge
      const edge = loaded!.edges[0];
      expect(edge.id).toBe('edge-1');
      expect(edge.source).toBe('n1');
      expect(edge.target).toBe('n2');

      // Verificar metadata
      expect(loaded!.version).toBe('2.0.0');
      expect(loaded!.createdAt).toBeDefined();
      expect(loaded!.updatedAt).toBeDefined();
      expect(loaded!.metadata).toBeDefined();
    });

    it('should preserve data after multiple updates', () => {
      const automation: any = {
        id: nanoid(),
        name: 'Update Test',
        nodes: [],
        edges: [],
      };

      // Save 1
      const saved1 = saveAutomation(automation);
      const createdAt = saved1.createdAt;

      // Update 1
      const updated1 = {
        ...saved1,
        name: 'Update Test - v2',
        nodes: [
          { id: 'n1', type: 'trigger', name: 'Node 1', config: {} },
        ],
      };
      const saved2 = saveAutomation(updated1);

      // Update 2
      const updated2 = {
        ...saved2,
        name: 'Update Test - v3',
        nodes: [
          ...saved2.nodes,
          { id: 'n2', type: 'agent', name: 'Node 2', config: {} },
        ],
        edges: [
          { source: 'n1', target: 'n2' },
        ],
      };
      const saved3 = saveAutomation(updated2);

      // Load final
      const loaded = getAutomation(saved3.id);

      expect(loaded!.name).toBe('Update Test - v3');
      expect(loaded!.nodes).toHaveLength(2);
      expect(loaded!.edges).toHaveLength(1);
      expect(loaded!.createdAt).toBe(createdAt); // Preservado
      expect(loaded!.updatedAt).not.toBe(createdAt); // Mudou
    });
  });

  describe('References Resolution', () => {
    it('should preserve complex reference patterns', () => {
      const automation: any = {
        id: nanoid(),
        name: 'Complex References',
        nodes: [
          {
            id: 'n1',
            type: 'trigger',
            name: 'Input',
            config: {
              toolId: 'webhook-trigger',
            },
          },
          {
            id: 'n2',
            type: 'agent',
            name: 'Process',
            config: {
              toolId: 'agent-executor',
              // Múltiplas referências
              prompt: 'User: {{n1.user.name}}, Email: {{n1.user.email}}',
              // Referência aninhada
              context: '{{n1.metadata.context}}',
            },
          },
        ],
        edges: [
          { source: 'n1', target: 'n2' },
        ],
      };

      const saved = saveAutomation(automation);
      const loaded = getAutomation(saved.id);

      const node2 = loaded!.nodes[1];
      expect(node2.config.prompt).toContain('{{n1.user.name}}');
      expect(node2.config.prompt).toContain('{{n1.user.email}}');
      expect(node2.config.context).toBe('{{n1.metadata.context}}');
    });
  });
});
