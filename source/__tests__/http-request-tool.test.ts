/**
 * Testes para HTTPRequestTool
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { HTTPRequestTool } from '../tools/system/httpRequest.js';
import { ExecutionContext } from '../core/types.js';

describe('HTTPRequestTool', () => {
  let context: ExecutionContext;

  beforeEach(() => {
    context = {
      automationId: 'test',
      nodeId: 'test-node',
      previousResults: {},
      globalContext: {},
    };
  });

  describe('Metadata', () => {
    it('deve ter ID correto', () => {
      expect(HTTPRequestTool.id).toBe('http-request');
    });

    it('deve ter categoria http', () => {
      expect(HTTPRequestTool.category).toBe('http');
    });

    it('deve ter versão semver válida', () => {
      expect(HTTPRequestTool.version).toMatch(/^\d+\.\d+\.\d+$/);
    });

    it('deve ter parâmetros obrigatórios', () => {
      const urlParam = HTTPRequestTool.params.find(p => p.key === 'url');
      expect(urlParam).toBeDefined();
      expect(urlParam?.required).toBe(true);
    });

    it('deve ter capabilities corretas', () => {
      expect(HTTPRequestTool.capabilities?.requiresNetwork).toBe(true);
      expect(HTTPRequestTool.capabilities?.isAsync).toBe(true);
    });

    it('deve ter exemplos', () => {
      expect(HTTPRequestTool.ui.examples).toBeDefined();
      expect(HTTPRequestTool.ui.examples!.length).toBeGreaterThan(0);
    });

    it('deve ter UI config para todos os parâmetros', () => {
      HTTPRequestTool.params.forEach(param => {
        expect(param.ui).toBeDefined();
        expect(param.ui.widgetType).toBeDefined();
      });
    });
  });

  describe('Execution', () => {
    it('deve fazer GET request simples', async () => {
      const args = {
        url: 'https://api.github.com/zen',
        method: 'GET',
      };

      const result = await HTTPRequestTool.execute(args, context);
      
      expect(result.success).toBe(true);
      expect(result.result).toBeDefined();
      expect(result.result.status).toBe(200);
    }, 10000);

    it('deve adicionar query params à URL', async () => {
      const args = {
        url: 'https://httpbin.org/get',
        method: 'GET',
        queryParams: {
          foo: 'bar',
          test: '123',
        },
      };

      const result = await HTTPRequestTool.execute(args, context);
      
      expect(result.success).toBe(true);
      expect(result.result.body.args).toEqual({
        foo: 'bar',
        test: '123',
      });
    }, 10000);

    it('deve enviar headers customizados', async () => {
      const args = {
        url: 'https://httpbin.org/headers',
        method: 'GET',
        headers: {
          'X-Custom-Header': 'test-value',
        },
      };

      const result = await HTTPRequestTool.execute(args, context);
      
      expect(result.success).toBe(true);
      expect(result.result.body.headers['X-Custom-Header']).toBe('test-value');
    }, 10000);

    it('deve fazer POST com body JSON', async () => {
      const args = {
        url: 'https://httpbin.org/post',
        method: 'POST',
        body: {
          name: 'Test',
          value: 123,
        },
      };

      const result = await HTTPRequestTool.execute(args, context);
      
      expect(result.success).toBe(true);
      expect(result.result.body.json).toEqual({
        name: 'Test',
        value: 123,
      });
    }, 10000);

    it('deve retornar erro em timeout', async () => {
      const args = {
        url: 'https://httpbin.org/delay/5',
        method: 'GET',
        timeout: 1000, // 1 segundo
      };

      const result = await HTTPRequestTool.execute(args, context);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Erro HTTP');
    }, 15000);

    it('deve retornar erro para URL inválida', async () => {
      const args = {
        url: 'invalid-url',
        method: 'GET',
      };

      const result = await HTTPRequestTool.execute(args, context);
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('deve incluir duração na resposta', async () => {
      const args = {
        url: 'https://httpbin.org/get',
        method: 'GET',
      };

      const result = await HTTPRequestTool.execute(args, context);
      
      expect(result.success).toBe(true);
      expect(result.result.duration).toBeGreaterThan(0);
    }, 10000);
  });

  describe('Validation', () => {
    it('deve ter função de validação se definida', () => {
      if (HTTPRequestTool.validate) {
        const validArgs = {
          url: 'https://example.com',
          method: 'GET',
        };
        
        const result = HTTPRequestTool.validate(validArgs);
        expect(result.valid).toBe(true);
      }
    });
  });
});
