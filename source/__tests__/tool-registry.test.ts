/**
 * Testes para o Tool Registry
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ToolRegistry, initializeToolRegistry } from '../core/toolRegistry.js';
import { Tool, ExecutionContext, ToolResult } from '../core/types.js';

describe('ToolRegistry', () => {
  let registry: ToolRegistry;

  beforeEach(() => {
    registry = initializeToolRegistry();
  });

  it('deve registrar uma ferramenta', () => {
    const tool: Tool = {
      id: 'test-tool',
      name: 'Test Tool',
      description: 'Ferramenta de teste',
      category: 'system',
      version: '1.0.0',
      params: [],
      output: {
        type: 'string',
        description: 'Resultado do teste',
      },
      async execute(args: any, context: ExecutionContext): Promise<ToolResult> {
        return {
          success: true,
          result: 'OK',
        };
      },
      ui: {
        icon: 'Test',
        color: '#000000',
      },
    };

    registry.register(tool);

    expect(registry.has('test-tool')).toBe(true);
    expect(registry.count()).toBe(1);
  });

  it('deve rejeitar ferramenta duplicada', () => {
    const tool: Tool = {
      id: 'test-tool',
      name: 'Test Tool',
      description: 'Ferramenta de teste',
      category: 'system',
      version: '1.0.0',
      params: [],
      output: {
        type: 'string',
        description: 'Resultado',
      },
      async execute(): Promise<ToolResult> {
        return { success: true };
      },
      ui: {},
    };

    registry.register(tool);

    expect(() => registry.register(tool)).toThrow(/já está registrada/);
  });

  it('deve listar ferramentas', () => {
    const tool1: Tool = {
      id: 'tool-1',
      name: 'Tool 1',
      description: 'Test',
      category: 'system',
      version: '1.0.0',
      params: [],
      output: { type: 'string', description: 'Result' },
      async execute(): Promise<ToolResult> {
        return { success: true };
      },
      ui: {},
    };

    const tool2: Tool = {
      id: 'tool-2',
      name: 'Tool 2',
      description: 'Test',
      category: 'http',
      version: '1.0.0',
      params: [],
      output: { type: 'string', description: 'Result' },
      async execute(): Promise<ToolResult> {
        return { success: true };
      },
      ui: {},
    };

    registry.register(tool1);
    registry.register(tool2);

    const allTools = registry.list();
    expect(allTools.length).toBe(2);

    const systemTools = registry.list({ category: 'system' });
    expect(systemTools.length).toBe(1);
    expect(systemTools[0].id).toBe('tool-1');
  });

  it('deve filtrar ferramentas por busca', () => {
    const tool1: Tool = {
      id: 'shell-tool',
      name: 'Shell Executor',
      description: 'Executa comandos shell',
      category: 'system',
      version: '1.0.0',
      params: [],
      output: { type: 'string', description: 'Result' },
      async execute(): Promise<ToolResult> {
        return { success: true };
      },
      ui: {},
    };

    const tool2: Tool = {
      id: 'http-tool',
      name: 'HTTP Request',
      description: 'Faz requisições HTTP',
      category: 'http',
      version: '1.0.0',
      params: [],
      output: { type: 'string', description: 'Result' },
      async execute(): Promise<ToolResult> {
        return { success: true };
      },
      ui: {},
    };

    registry.register(tool1);
    registry.register(tool2);

    const shellTools = registry.list({ search: 'shell' });
    expect(shellTools.length).toBe(1);
    expect(shellTools[0].id).toBe('shell-tool');

    const httpTools = registry.list({ search: 'http' });
    expect(httpTools.length).toBe(1);
    expect(httpTools[0].id).toBe('http-tool');
  });

  it('deve remover ferramenta', () => {
    const tool: Tool = {
      id: 'test-tool',
      name: 'Test',
      description: 'Test',
      category: 'system',
      version: '1.0.0',
      params: [],
      output: { type: 'string', description: 'Result' },
      async execute(): Promise<ToolResult> {
        return { success: true };
      },
      ui: {},
    };

    registry.register(tool);
    expect(registry.has('test-tool')).toBe(true);

    registry.unregister('test-tool');
    expect(registry.has('test-tool')).toBe(false);
  });

  it('deve obter categorias disponíveis', () => {
    const tool1: Tool = {
      id: 'tool-1',
      name: 'Tool 1',
      description: 'Test',
      category: 'system',
      version: '1.0.0',
      params: [],
      output: { type: 'string', description: 'Result' },
      async execute(): Promise<ToolResult> {
        return { success: true };
      },
      ui: {},
    };

    const tool2: Tool = {
      id: 'tool-2',
      name: 'Tool 2',
      description: 'Test',
      category: 'http',
      version: '1.0.0',
      params: [],
      output: { type: 'string', description: 'Result' },
      async execute(): Promise<ToolResult> {
        return { success: true };
      },
      ui: {},
    };

    registry.register(tool1);
    registry.register(tool2);

    const categories = registry.getCategories();
    expect(categories).toContain('system');
    expect(categories).toContain('http');
    expect(categories.length).toBe(2);
  });

  it('deve atualizar métricas após execução', () => {
    const tool: Tool = {
      id: 'test-tool',
      name: 'Test',
      description: 'Test',
      category: 'system',
      version: '1.0.0',
      params: [],
      output: { type: 'string', description: 'Result' },
      async execute(): Promise<ToolResult> {
        return { success: true };
      },
      ui: {},
    };

    registry.register(tool);

    // Simular execuções
    registry.updateMetrics('test-tool', true, 100);
    registry.updateMetrics('test-tool', true, 200);
    registry.updateMetrics('test-tool', false, 150);

    const metrics = registry.getMetrics('test-tool');
    
    expect(metrics).toBeDefined();
    expect(metrics!.executionCount).toBe(3);
    expect(metrics!.successCount).toBe(2);
    expect(metrics!.failureCount).toBe(1);
    expect(metrics!.averageExecutionTime).toBe(150); // (100 + 200 + 150) / 3
  });
});
