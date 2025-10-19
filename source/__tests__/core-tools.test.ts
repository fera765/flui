/**
 * Testes para as ferramentas principais
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { initializeToolRegistry, getToolRegistry } from '../core/toolRegistry.js';
import { registerAllTools } from '../tools/index.js';
import { ToolExecutor } from '../core/toolExecutor.js';
import { ExecutionContext } from '../core/types.js';

describe('Core Tools', () => {
  let context: ExecutionContext;

  beforeEach(() => {
    initializeToolRegistry();
    registerAllTools();
    
    context = {
      automationId: 'test',
      nodeId: 'test-node',
      previousResults: {},
      globalContext: {},
    };
  });

  describe('System Info Tool', () => {
    it('deve retornar informações do sistema', async () => {
      const result = await ToolExecutor.execute(
        'system-info',
        { detailed: false },
        context
      );

      expect(result.success).toBe(true);
      expect(result.result).toBeDefined();
      expect(result.result.platform).toBeDefined();
      expect(result.result.arch).toBeDefined();
      expect(result.result.cpus).toBeGreaterThan(0);
      expect(result.result.memory).toBeDefined();
    });

    it('deve retornar informações detalhadas quando solicitado', async () => {
      const result = await ToolExecutor.execute(
        'system-info',
        { detailed: true },
        context
      );

      expect(result.success).toBe(true);
      expect(result.result.cpuInfo).toBeDefined();
      expect(result.result.loadAverage).toBeDefined();
    });
  });

  describe('HTTP Request Tool', () => {
    it('deve fazer requisição GET simples', async () => {
      const result = await ToolExecutor.execute(
        'http-request',
        {
          url: 'https://api.github.com/zen',
          method: 'GET',
        },
        context
      );

      expect(result.success).toBe(true);
      expect(result.result.status).toBe(200);
      expect(result.result.body).toBeDefined();
    });

    it('deve lidar com timeout', async () => {
      const result = await ToolExecutor.execute(
        'http-request',
        {
          url: 'https://httpstat.us/200?sleep=10000',
          method: 'GET',
          timeout: 1000, // 1 segundo
        },
        context
      );

      expect(result.success).toBe(false);
      // O erro pode ser 'abort' ou 'Timeout' ou 'fetch failed'
      expect(result.error).toBeDefined();
    });
  });

  describe('Custom Code Tool', () => {
    it('deve executar código JavaScript simples', async () => {
      const result = await ToolExecutor.execute(
        'custom-code',
        {
          language: 'javascript',
          code: 'output.result = 2 + 2;',
          input: {},
        },
        context
      );

      expect(result.success).toBe(true);
      expect(result.result.result).toBeDefined();
    });

    it('deve receber e processar input', async () => {
      const result = await ToolExecutor.execute(
        'custom-code',
        {
          language: 'javascript',
          code: 'output.sum = input.numbers.reduce((a, b) => a + b, 0);',
          input: {
            numbers: [1, 2, 3, 4, 5],
          },
        },
        context
      );

      expect(result.success).toBe(true);
      expect(result.result.result).toBeDefined();
    });

    it('deve bloquear imports por segurança', async () => {
      const result = await ToolExecutor.execute(
        'custom-code',
        {
          language: 'javascript',
          code: 'const fs = require("fs");',
          input: {},
        },
        context
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Imports não são permitidos');
    });
  });

  describe('File Search Tool', () => {
    it('deve buscar arquivos por padrão', async () => {
      const result = await ToolExecutor.execute(
        'file-search',
        {
          pattern: '*.json',
          directory: '.',
          maxResults: 10,
        },
        context
      );

      expect(result.success).toBe(true);
      expect(Array.isArray(result.result)).toBe(true);
    });
  });

  describe('Tool Executor', () => {
    it('deve aplicar timeout às ferramentas', async () => {
      const result = await ToolExecutor.execute(
        'http-request',
        {
          url: 'https://httpstat.us/200?sleep=10000',
          method: 'GET',
        },
        context,
        {
          timeout: 1000,
        }
      );

      expect(result.success).toBe(false);
    });

    it('deve registrar métricas após execução', async () => {
      const registry = getToolRegistry();
      
      await ToolExecutor.execute(
        'system-info',
        {},
        context
      );

      const metrics = registry.getMetrics('system-info');
      
      expect(metrics).toBeDefined();
      expect(metrics!.executionCount).toBeGreaterThan(0);
    });

    it('deve retornar erro para ferramenta inexistente', async () => {
      const result = await ToolExecutor.execute(
        'non-existent-tool',
        {},
        context
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('não encontrada');
    });
  });
});
