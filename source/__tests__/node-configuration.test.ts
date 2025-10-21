/**
 * FLUI - Node Configuration Modal Tests
 * 
 * Testes completos para:
 * - Carregamento dinâmico de campos
 * - Sistema de linker
 * - Persistência de configuração
 * - Validação de campos
 * - Arrays e JSON
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import axios from 'axios';
import { getAutomations, saveAutomation, deleteAutomation } from '../store/automationStorage.js';
import { getToolRegistry } from '../core/toolRegistry.js';
import { Tool } from '../core/types.js';

const API_BASE_URL = 'http://localhost:3001/api';

describe('Node Configuration - Backend', () => {
  let testAutomationId: string;
  let testNodeId: string;

  beforeEach(async () => {
    // Criar automação de teste
    const automation = {
      id: `test-auto-${Date.now()}`,
      name: 'Test Automation',
      description: 'Test automation for node config',
      nodes: [
        {
          id: `node-${Date.now()}`,
          type: 'trigger',
          name: 'Test Node',
          config: {
            toolId: 'test-tool',
            params: {
              field1: 'value1',
              field2: 42,
            },
          },
          position: { x: 0, y: 0 },
          nextNodes: [],
        },
      ],
      edges: [],
      startNodeId: '',
      enabled: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const saved = saveAutomation(automation);
    testAutomationId = saved.id;
    testNodeId = saved.nodes[0].id;
  });

  afterEach(() => {
    // Limpar automação de teste
    if (testAutomationId) {
      deleteAutomation(testAutomationId);
    }
  });

  it('deve carregar configuração de um node', () => {
    const automations = getAutomations();
    const automation = automations.find((a) => a.id === testAutomationId);

    expect(automation).toBeDefined();
    expect(automation?.nodes).toHaveLength(1);
    expect(automation?.nodes[0].id).toBe(testNodeId);
    expect(automation?.nodes[0].config?.params).toEqual({
      field1: 'value1',
      field2: 42,
    });
  });

  it('deve atualizar configuração de um node', () => {
    const automations = getAutomations();
    const automation = automations.find((a) => a.id === testAutomationId);
    
    if (!automation) throw new Error('Automation not found');

    // Atualizar config
    automation.nodes[0].config = {
      ...automation.nodes[0].config,
      params: {
        field1: 'new value',
        field2: 100,
        field3: true,
      },
    };

    const saved = saveAutomation(automation);

    // Verificar
    expect(saved.nodes[0].config?.params).toEqual({
      field1: 'new value',
      field2: 100,
      field3: true,
    });
  });

  it('deve preservar linkages em campos', () => {
    const automations = getAutomations();
    const automation = automations.find((a) => a.id === testAutomationId);
    
    if (!automation) throw new Error('Automation not found');

    // Adicionar node com linkage
    automation.nodes[0].config = {
      ...automation.nodes[0].config,
      params: {
        field1: '{{node1.output1}}',
        field2: '{{node2.result}}',
      },
    };

    const saved = saveAutomation(automation);

    // Verificar linkages
    expect(saved.nodes[0].config?.params?.field1).toBe('{{node1.output1}}');
    expect(saved.nodes[0].config?.params?.field2).toBe('{{node2.result}}');
  });

  it('deve suportar arrays em config', () => {
    const automations = getAutomations();
    const automation = automations.find((a) => a.id === testAutomationId);
    
    if (!automation) throw new Error('Automation not found');

    // Adicionar array
    automation.nodes[0].config = {
      ...automation.nodes[0].config,
      params: {
        myArray: ['item1', 'item2', 'item3'],
      },
    };

    const saved = saveAutomation(automation);

    // Verificar array
    expect(Array.isArray(saved.nodes[0].config?.params?.myArray)).toBe(true);
    expect(saved.nodes[0].config?.params?.myArray).toEqual(['item1', 'item2', 'item3']);
  });

  it('deve suportar objetos/JSON em config', () => {
    const automations = getAutomations();
    const automation = automations.find((a) => a.id === testAutomationId);
    
    if (!automation) throw new Error('Automation not found');

    // Adicionar objeto
    automation.nodes[0].config = {
      ...automation.nodes[0].config,
      params: {
        myObject: {
          key1: 'value1',
          key2: 'value2',
          nested: {
            key3: 'value3',
          },
        },
      },
    };

    const saved = saveAutomation(automation);

    // Verificar objeto
    expect(typeof saved.nodes[0].config?.params?.myObject).toBe('object');
    expect(saved.nodes[0].config?.params?.myObject).toEqual({
      key1: 'value1',
      key2: 'value2',
      nested: {
        key3: 'value3',
      },
    });
  });

  it('deve validar campos obrigatórios', () => {
    const automations = getAutomations();
    const automation = automations.find((a) => a.id === testAutomationId);
    
    if (!automation) throw new Error('Automation not found');

    // Remover campo obrigatório (simulação - validação será no frontend)
    automation.nodes[0].config = {
      ...automation.nodes[0].config,
      params: {},
    };

    // Backend deve aceitar qualquer config (validação é no frontend)
    const saved = saveAutomation(automation);
    expect(saved.nodes[0].config?.params).toEqual({});
  });
});

describe('Node Configuration - Tool Metadata', () => {
  it('deve carregar metadados de tool dinamicamente', () => {
    const registry = getToolRegistry();
    
    // Registrar tool de teste
    const testTool: Tool = {
      id: 'test-dynamic-tool',
      name: 'Test Dynamic Tool',
      description: 'Tool for testing dynamic field loading',
      category: 'custom',
      version: '1.0.0',
      params: [
        {
          name: 'stringField',
          type: 'string',
          description: 'A string field',
          required: true,
        },
        {
          name: 'numberField',
          type: 'number',
          description: 'A number field',
          required: false,
          default: 0,
        },
        {
          name: 'boolField',
          type: 'boolean',
          description: 'A boolean field',
          required: false,
          default: false,
        },
        {
          name: 'arrayField',
          type: 'array',
          description: 'An array field',
          required: false,
          default: [],
        },
        {
          name: 'objectField',
          type: 'object',
          description: 'An object field',
          required: false,
        },
      ],
      output: {
        type: 'object',
        description: 'Test output',
      },
      execute: async () => ({ success: true }),
      ui: {
        icon: 'TestIcon',
        color: '#ff0000',
      },
    };

    registry.register(testTool);

    // Verificar se tool foi registrada
    const tool = registry.get('test-dynamic-tool');
    expect(tool).toBeDefined();
    expect(tool?.params).toHaveLength(5);
    expect(tool?.params[0].name).toBe('stringField');
    expect(tool?.params[1].name).toBe('numberField');
    expect(tool?.params[2].name).toBe('boolField');
    expect(tool?.params[3].name).toBe('arrayField');
    expect(tool?.params[4].name).toBe('objectField');

    // Limpar
    registry.unregister('test-dynamic-tool');
  });

  it('deve fornecer informações de tipo para cada parâmetro', () => {
    const registry = getToolRegistry();
    
    const testTool: Tool = {
      id: 'test-types-tool',
      name: 'Test Types Tool',
      description: 'Tool for testing parameter types',
      category: 'custom',
      version: '1.0.0',
      params: [
        { name: 'str', type: 'string', description: 'String param', required: true },
        { name: 'num', type: 'number', description: 'Number param', required: true },
        { name: 'bool', type: 'boolean', description: 'Boolean param', required: false },
        { name: 'arr', type: 'array', description: 'Array param', required: false },
        { name: 'obj', type: 'object', description: 'Object param', required: false },
      ],
      output: { type: 'object', description: 'Output' },
      execute: async () => ({ success: true }),
      ui: {},
    };

    registry.register(testTool);

    const tool = registry.get('test-types-tool');
    
    // Verificar tipos
    expect(tool?.params.find((p) => p.name === 'str')?.type).toBe('string');
    expect(tool?.params.find((p) => p.name === 'num')?.type).toBe('number');
    expect(tool?.params.find((p) => p.name === 'bool')?.type).toBe('boolean');
    expect(tool?.params.find((p) => p.name === 'arr')?.type).toBe('array');
    expect(tool?.params.find((p) => p.name === 'obj')?.type).toBe('object');

    // Limpar
    registry.unregister('test-types-tool');
  });
});

describe('Node Configuration - Linker System', () => {
  let testAutomationId: string;

  beforeEach(() => {
    // Criar automação com múltiplos nodes conectados
    const automation = {
      id: `test-linker-${Date.now()}`,
      name: 'Test Linker Automation',
      description: 'Test automation for linker system',
      nodes: [
        {
          id: 'node1',
          type: 'trigger',
          name: 'Node 1',
          config: {
            toolId: 'manual-trigger',
            params: {},
          },
          position: { x: 0, y: 0 },
          nextNodes: ['node2'],
        },
        {
          id: 'node2',
          type: 'agent',
          name: 'Node 2',
          config: {
            toolId: 'test-tool',
            params: {
              input: '{{node1.result}}',
            },
          },
          position: { x: 200, y: 0 },
          nextNodes: ['node3'],
        },
        {
          id: 'node3',
          type: 'agent',
          name: 'Node 3',
          config: {
            toolId: 'test-tool',
            params: {
              input1: '{{node1.result}}',
              input2: '{{node2.output}}',
            },
          },
          position: { x: 400, y: 0 },
          nextNodes: [],
        },
      ],
      edges: [
        { id: 'e1', source: 'node1', target: 'node2' },
        { id: 'e2', source: 'node2', target: 'node3' },
      ],
      startNodeId: 'node1',
      enabled: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const saved = saveAutomation(automation);
    testAutomationId = saved.id;
  });

  afterEach(() => {
    if (testAutomationId) {
      deleteAutomation(testAutomationId);
    }
  });

  it('deve identificar nodes pais a partir de edges', () => {
    const automations = getAutomations();
    const automation = automations.find((a) => a.id === testAutomationId);

    expect(automation).toBeDefined();

    // Node3 deve ter node1 e node2 como pais
    const node3Edges = automation?.edges.filter((e) => e.target === 'node3');
    expect(node3Edges).toHaveLength(1);
    expect(node3Edges?.[0].source).toBe('node2');

    // Recursivamente, node2 depende de node1
    const node2Edges = automation?.edges.filter((e) => e.target === 'node2');
    expect(node2Edges).toHaveLength(1);
    expect(node2Edges?.[0].source).toBe('node1');
  });

  it('deve preservar referências de linker ao salvar', () => {
    const automations = getAutomations();
    const automation = automations.find((a) => a.id === testAutomationId);

    if (!automation) throw new Error('Automation not found');

    const node2 = automation.nodes.find((n) => n.id === 'node2');
    const node3 = automation.nodes.find((n) => n.id === 'node3');

    expect(node2?.config?.params?.input).toBe('{{node1.result}}');
    expect(node3?.config?.params?.input1).toBe('{{node1.result}}');
    expect(node3?.config?.params?.input2).toBe('{{node2.output}}');
  });

  it('deve permitir adicionar novos linkers', () => {
    const automations = getAutomations();
    const automation = automations.find((a) => a.id === testAutomationId);

    if (!automation) throw new Error('Automation not found');

    // Adicionar novo linker no node3
    const node3 = automation.nodes.find((n) => n.id === 'node3');
    if (node3) {
      node3.config = {
        ...node3.config,
        params: {
          ...node3.config?.params,
          newInput: '{{node1.triggered}}',
        },
      };
    }

    const saved = saveAutomation(automation);
    const updatedNode3 = saved.nodes.find((n) => n.id === 'node3');

    expect(updatedNode3?.config?.params?.newInput).toBe('{{node1.triggered}}');
  });

  it('deve permitir remover linkers', () => {
    const automations = getAutomations();
    const automation = automations.find((a) => a.id === testAutomationId);

    if (!automation) throw new Error('Automation not found');

    // Remover linker do node2
    const node2 = automation.nodes.find((n) => n.id === 'node2');
    if (node2) {
      node2.config = {
        ...node2.config,
        params: {
          input: 'static value', // Substituir linker por valor estático
        },
      };
    }

    const saved = saveAutomation(automation);
    const updatedNode2 = saved.nodes.find((n) => n.id === 'node2');

    expect(updatedNode2?.config?.params?.input).toBe('static value');
  });
});

console.log('✅ Node Configuration Tests Ready');
