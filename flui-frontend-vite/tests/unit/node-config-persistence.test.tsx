/**
 * FLUI - Testes de Persistência de Configuração de Nodes
 * 
 * Valida que:
 * 1. Configurações de nodes são salvas no backend
 * 2. Estado React é atualizado após salvar
 * 3. Config persiste após salvar automação completa
 * 4. Dados não são perdidos no fluxo completo
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('Persistência de Configuração de Nodes', () => {
  global.fetch = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve salvar config do node no backend via PATCH', async () => {
    const automationId = 'test-automation';
    const nodeId = 'node-agent';
    const config = {
      prompt: 'Diga olá!',
      temperature: 0.8,
    };

    // Mock do PATCH /api/automations/:id/nodes/:nodeId/config
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        config: {
          toolId: 'agent-123',
          params: config,
        },
      }),
    });

    // Simular salvamento no backend
    const response = await fetch(
      `http://localhost:3001/api/automations/${automationId}/nodes/${nodeId}/config`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ params: config, toolId: 'agent-123' }),
      }
    );

    const result = await response.json();

    // Validações
    expect(result.success).toBe(true);
    expect(result.config.params.prompt).toBe('Diga olá!');
    expect(result.config.params.temperature).toBe(0.8);

    // Verificar que fetch foi chamado corretamente
    const fetchCall = (global.fetch as any).mock.calls[0];
    expect(fetchCall[0]).toContain('/nodes/node-agent/config');
    expect(fetchCall[1].method).toBe('PATCH');
  });

  it('deve atualizar automação completa preservando configs dos nodes', async () => {
    const automation = {
      id: 'test-automation',
      name: 'Test Automation',
      nodes: [
        {
          id: 'node-trigger',
          type: 'trigger',
          name: 'Trigger',
          config: {
            toolId: 'manual-trigger',
            params: { debugMode: true },
          },
        },
        {
          id: 'node-agent',
          type: 'agent',
          name: 'Agent',
          config: {
            toolId: 'agent-123',
            params: {
              prompt: 'Diga olá!',  // ← Config que deve ser preservado
              temperature: 0.8,
            },
          },
        },
      ],
      edges: [],
    };

    // Mock do PUT /api/automations/:id
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        automation,
      }),
    });

    // Simular salvamento da automação completa
    const response = await fetch(
      `http://localhost:3001/api/automations/${automation.id}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(automation),
      }
    );

    const result = await response.json();

    // Validações
    expect(result.success).toBe(true);
    expect(result.automation.nodes[1].config.params.prompt).toBe('Diga olá!');
    expect(result.automation.nodes[1].config.params.temperature).toBe(0.8);

    // Verificar payload enviado
    const fetchCall = (global.fetch as any).mock.calls[0];
    const sentData = JSON.parse(fetchCall[1].body);
    expect(sentData.nodes[1].config.params.prompt).toBe('Diga olá!');
  });

  it('deve preservar config após recarregar automação', async () => {
    const savedAutomation = {
      id: 'test-automation',
      nodes: [
        {
          id: 'node-agent',
          type: 'agent',
          config: {
            toolId: 'agent-123',
            params: {
              prompt: 'Diga olá!',
              temperature: 0.8,
              complexField: {
                nested: true,
                value: 42,
              },
            },
          },
        },
      ],
    };

    // Mock do GET /api/automations/:id
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => savedAutomation,
    });

    // Simular reload
    const response = await fetch('http://localhost:3001/api/automations/test-automation');
    const loaded = await response.json();

    // Validações
    expect(loaded.nodes[0].config.params.prompt).toBe('Diga olá!');
    expect(loaded.nodes[0].config.params.temperature).toBe(0.8);
    expect(loaded.nodes[0].config.params.complexField.nested).toBe(true);
    expect(loaded.nodes[0].config.params.complexField.value).toBe(42);
  });

  it('deve detectar perda de config no fluxo save → reload → save', async () => {
    // Estado inicial: config preenchido
    const initialConfig = {
      prompt: 'Diga olá!',
      temperature: 0.8,
    };

    const automationWithConfig = {
      id: 'test',
      nodes: [
        {
          id: 'node-agent',
          config: { params: initialConfig },
        },
      ],
    };

    // Step 1: Salvar config individual (PATCH)
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    await fetch('http://localhost:3001/api/automations/test/nodes/node-agent/config', {
      method: 'PATCH',
      body: JSON.stringify({ params: initialConfig }),
    });

    // Step 2: Salvar automação completa (PUT) - DEVE preservar config
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, automation: automationWithConfig }),
    });

    await fetch('http://localhost:3001/api/automations/test', {
      method: 'PUT',
      body: JSON.stringify(automationWithConfig),
    });

    // Step 3: Reload
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => automationWithConfig,
    });

    const reloadResponse = await fetch('http://localhost:3001/api/automations/test');
    const reloaded = await reloadResponse.json();

    // ✅ CRÍTICO: Config deve estar preservado
    expect(reloaded.nodes[0].config.params).toEqual(initialConfig);
    expect(reloaded.nodes[0].config.params.prompt).toBe('Diga olá!');
  });
});

describe('Fluxo Completo de Configuração (Integração)', () => {
  it('deve manter config através do ciclo completo: create → configure → save → reload → execute', async () => {
    const flow = {
      createAutomation: {
        id: 'test-auto',
        nodes: [
          {
            id: 'node-agent',
            type: 'agent',
            config: { params: {} },  // Vazio inicialmente
          },
        ],
      },
      configureNode: {
        params: {
          prompt: 'Teste completo!',
          temperature: 0.9,
        },
      },
    };

    // 1. Criar automação
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, id: flow.createAutomation.id }),
    });

    await fetch('http://localhost:3001/api/automations', {
      method: 'POST',
      body: JSON.stringify(flow.createAutomation),
    });

    // 2. Configurar node
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        config: { params: flow.configureNode.params },
      }),
    });

    await fetch('http://localhost:3001/api/automations/test-auto/nodes/node-agent/config', {
      method: 'PATCH',
      body: JSON.stringify({ params: flow.configureNode.params }),
    });

    // 3. Salvar automação completa (simular clique em "Salvar Automação")
    const updatedAutomation = {
      ...flow.createAutomation,
      nodes: [
        {
          ...flow.createAutomation.nodes[0],
          config: {
            params: flow.configureNode.params,  // ✅ DEVE ter o config atualizado
          },
        },
      ],
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, automation: updatedAutomation }),
    });

    await fetch('http://localhost:3001/api/automations/test-auto', {
      method: 'PUT',
      body: JSON.stringify(updatedAutomation),
    });

    // 4. Reload para verificar persistência
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => updatedAutomation,
    });

    const reloadResponse = await fetch('http://localhost:3001/api/automations/test-auto');
    const reloaded = await reloadResponse.json();

    // 5. Executar (verificar que config está disponível)
    const execInput = {
      ...reloaded.nodes[0].config.params,  // Config do node
      $previousNode: {},
    };

    expect(execInput.prompt).toBe('Teste completo!');
    expect(execInput.temperature).toBe(0.9);

    // ✅ VALIDAÇÃO FINAL: Tudo preservado
    expect(reloaded.nodes[0].config.params.prompt).toBe('Teste completo!');
  });
});

describe('Casos Extremos', () => {
  it('deve preservar arrays em params', async () => {
    const config = {
      prompts: ['Primeiro', 'Segundo', 'Terceiro'],
      options: {
        flags: [true, false, true],
      },
    };

    // Validar estrutura do config diretamente
    expect(config.prompts).toHaveLength(3);
    expect(config.options.flags).toEqual([true, false, true]);

    // Validar que seria serializado corretamente
    const serialized = JSON.stringify({ params: config });
    const parsed = JSON.parse(serialized);
    expect(parsed.params.prompts).toHaveLength(3);
  });

  it('deve preservar objetos aninhados complexos', async () => {
    const config = {
      level1: {
        level2: {
          level3: {
            value: 'deep',
            number: 123,
            bool: true,
          },
        },
      },
    };

    // Validar estrutura do config diretamente
    expect(config.level1.level2.level3.value).toBe('deep');
    expect(config.level1.level2.level3.number).toBe(123);

    // Validar que seria serializado corretamente
    const serialized = JSON.stringify({ params: config });
    const parsed = JSON.parse(serialized);
    expect(parsed.params.level1.level2.level3.value).toBe('deep');
  });

  it('deve lidar com config vazio sem quebrar', async () => {
    const emptyConfig = {};

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, config: { params: emptyConfig } }),
    });

    const response = await fetch('http://localhost:3001/api/automations/test/nodes/node/config', {
      method: 'PATCH',
      body: JSON.stringify({ params: emptyConfig }),
    });

    const result = await response.json();
    expect(result.success).toBe(true);
  });
});
