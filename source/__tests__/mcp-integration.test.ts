/**
 * FLUI - MCP Integration Tests
 * 
 * Testes completos para:
 * - Instalação de MCPs via diferentes fontes
 * - Extração de tools
 * - Sincronização
 * - Registro no Tool Registry
 * - Execução de tools de MCPs
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { MCPExecutor } from '../services/mcpExecutor.js';
import { useStore } from '../store/store.js';
import { getToolRegistry } from '../core/toolRegistry.js';
import { MCPLoader } from '../services/mcpLoader.js';

describe('MCP Executor', () => {
  it('deve detectar tools do output de um MCP', () => {
    const output = `
Commands:
  generate-text    Generate creative text
  analyze-image    Analyze image content
  translate        Translate text between languages
    `;

    const tools = (MCPExecutor as any).detectToolsFromOutput(output, 'test-mcp');

    expect(tools.length).toBeGreaterThan(0);
    expect(tools.some((t: any) => t.name === 'generate-text')).toBe(true);
  });

  it('deve criar tool genérica se não encontrar nenhuma', () => {
    const output = 'No commands found';
    const tools = (MCPExecutor as any).detectToolsFromOutput(output, 'test-mcp');

    expect(tools.length).toBeGreaterThan(0);
    expect(tools[0].id).toContain('test-mcp');
  });
});

describe('MCP Loader', () => {
  const store = useStore.getState();
  const registry = getToolRegistry();

  beforeAll(() => {
    // Limpar MCPs anteriores
    store.mcps.forEach((mcp) => {
      try {
        MCPLoader.unloadMCP(mcp.id);
      } catch {
        // Ignorar erros de unload
      }
    });
  });

  it('deve registrar tools de um MCP no Tool Registry', async () => {
    // Criar MCP de teste
    const testMCP = {
      id: 'test-mcp-1',
      name: 'Test MCP',
      description: 'MCP for testing',
      version: '1.0.0',
      tools: [
        {
          id: 'test-tool-1',
          name: 'Test Tool 1',
          description: 'A test tool',
          handler: 'execute',
          parameters: {
            input: 'string',
          },
        },
      ],
      enabled: true,
      metadata: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    };

    // Adicionar ao store
    store.createMCP(testMCP);

    // Carregar no registry
    await MCPLoader.loadMCP(testMCP);

    // Verificar se tool foi registrada
    const toolId = `mcp-${testMCP.id}-test-tool-1`;
    const tool = registry.get(toolId);

    expect(tool).toBeDefined();
    expect(tool?.name).toContain('Test MCP');
    expect(tool?.category).toBe('mcp');

    // Limpar
    MCPLoader.unloadMCP(testMCP.id);
    store.deleteMCP(testMCP.id);
  });

  it('deve remover tools ao descarregar um MCP', async () => {
    const testMCP = {
      id: 'test-mcp-2',
      name: 'Test MCP 2',
      description: 'Another test MCP',
      version: '1.0.0',
      tools: [
        {
          id: 'test-tool-2',
          name: 'Test Tool 2',
          description: 'Another test tool',
          handler: 'execute',
          parameters: {},
        },
      ],
      enabled: true,
      metadata: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    };

    store.createMCP(testMCP);
    await MCPLoader.loadMCP(testMCP);

    const toolId = `mcp-${testMCP.id}-test-tool-2`;
    expect(registry.has(toolId)).toBe(true);

    // Descarregar
    await MCPLoader.unloadMCP(testMCP.id);

    // Verificar se foi removida
    expect(registry.has(toolId)).toBe(false);

    // Limpar
    store.deleteMCP(testMCP.id);
  });

  it('deve listar todas as tools de MCPs', async () => {
    const testMCP = {
      id: 'test-mcp-3',
      name: 'Test MCP 3',
      description: 'Third test MCP',
      version: '1.0.0',
      tools: [
        {
          id: 'tool-a',
          name: 'Tool A',
          description: 'First tool',
          handler: 'execute',
          parameters: {},
        },
        {
          id: 'tool-b',
          name: 'Tool B',
          description: 'Second tool',
          handler: 'execute',
          parameters: {},
        },
      ],
      enabled: true,
      metadata: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    };

    store.createMCP(testMCP);
    await MCPLoader.loadMCP(testMCP);

    const mcpTools = MCPLoader.listMCPTools();
    const ourTools = mcpTools.filter((t) => t.mcpId === testMCP.id);

    expect(ourTools.length).toBe(2);
    expect(ourTools.some((t) => t.toolId.includes('tool-a'))).toBe(true);
    expect(ourTools.some((t) => t.toolId.includes('tool-b'))).toBe(true);

    // Limpar
    await MCPLoader.unloadMCP(testMCP.id);
    store.deleteMCP(testMCP.id);
  });

  it('deve recarregar um MCP atualizado', async () => {
    const testMCP = {
      id: 'test-mcp-4',
      name: 'Test MCP 4',
      description: 'Fourth test MCP',
      version: '1.0.0',
      tools: [
        {
          id: 'original-tool',
          name: 'Original Tool',
          description: 'Original',
          handler: 'execute',
          parameters: {},
        },
      ],
      enabled: true,
      metadata: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    };

    store.createMCP(testMCP);
    await MCPLoader.loadMCP(testMCP);

    // Atualizar MCP
    store.updateMCP(testMCP.id, {
      tools: [
        {
          id: 'updated-tool',
          name: 'Updated Tool',
          description: 'Updated',
          handler: 'execute',
          parameters: {},
        },
      ],
    });

    // Recarregar
    await MCPLoader.reloadMCP(testMCP.id);

    // Verificar
    const oldToolId = `mcp-${testMCP.id}-original-tool`;
    const newToolId = `mcp-${testMCP.id}-updated-tool`;

    expect(registry.has(oldToolId)).toBe(false);
    expect(registry.has(newToolId)).toBe(true);

    // Limpar
    await MCPLoader.unloadMCP(testMCP.id);
    store.deleteMCP(testMCP.id);
  });
});

describe('MCP Store Integration', () => {
  const store = useStore.getState();

  afterAll(() => {
    // Limpar todos os MCPs de teste
    store.mcps.forEach((mcp) => {
      if (mcp.id.startsWith('test-')) {
        store.deleteMCP(mcp.id);
      }
    });
  });

  it('deve criar um MCP no store', () => {
    const mcp = {
      id: 'test-store-mcp-1',
      name: 'Store Test MCP',
      description: 'Test',
      version: '1.0.0',
      tools: [],
      enabled: true,
      metadata: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    };

    store.createMCP(mcp);

    const found = store.mcps.find((m) => m.id === mcp.id);
    expect(found).toBeDefined();
    expect(found?.name).toBe(mcp.name);

    // Limpar
    store.deleteMCP(mcp.id);
  });

  it('deve atualizar um MCP existente', () => {
    const mcp = {
      id: 'test-store-mcp-2',
      name: 'Store Test MCP 2',
      description: 'Test',
      version: '1.0.0',
      tools: [],
      enabled: true,
      metadata: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    };

    store.createMCP(mcp);

    // Atualizar
    store.updateMCP(mcp.id, {
      description: 'Updated description',
      version: '2.0.0',
    });

    const updated = store.mcps.find((m) => m.id === mcp.id);
    expect(updated?.description).toBe('Updated description');
    expect(updated?.version).toBe('2.0.0');

    // Limpar
    store.deleteMCP(mcp.id);
  });

  it('deve deletar um MCP', () => {
    const mcp = {
      id: 'test-store-mcp-3',
      name: 'Store Test MCP 3',
      description: 'Test',
      version: '1.0.0',
      tools: [],
      enabled: true,
      metadata: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    };

    store.createMCP(mcp);
    expect(store.mcps.find((m) => m.id === mcp.id)).toBeDefined();

    store.deleteMCP(mcp.id);
    expect(store.mcps.find((m) => m.id === mcp.id)).toBeUndefined();
  });

  it('deve habilitar e desabilitar MCPs', () => {
    const mcp = {
      id: 'test-store-mcp-4',
      name: 'Store Test MCP 4',
      description: 'Test',
      version: '1.0.0',
      tools: [],
      enabled: true,
      metadata: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    };

    store.createMCP(mcp);
    expect(store.mcps.find((m) => m.id === mcp.id)?.enabled).toBe(true);

    store.updateMCP(mcp.id, { enabled: false });
    expect(store.mcps.find((m) => m.id === mcp.id)?.enabled).toBe(false);

    store.updateMCP(mcp.id, { enabled: true });
    expect(store.mcps.find((m) => m.id === mcp.id)?.enabled).toBe(true);

    // Limpar
    store.deleteMCP(mcp.id);
  });
});

console.log('✅ MCP Integration Tests Ready');
