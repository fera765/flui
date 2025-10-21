/**
 * FLUI - Workflow Integration Test
 * 
 * Testa fluxo completo: Webhook -> Condição Universal -> Agente -> Webhook Response
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { registerAllTools } from '../tools/index.js';
import { ToolExecutor } from '../core/toolExecutor.js';
import { ExecutionContext } from '../core/types.js';
import { suggestConnections, autoFillParameters } from '../services/smartConnections.js';
import { useStore } from '../store/store.js';

describe('Workflow Integration - Webhook -> Condição -> Agente', () => {
  beforeAll(() => {
    registerAllTools();
    
    // Criar um agente de teste
    const store = useStore.getState();
    if (store.agents.length === 0) {
      store.createAgent({
        name: 'Agente de Vendas',
        systemPrompt: 'Você é um assistente de vendas amigável.',
        model: 'gpt-4',
        temperature: 0.7,
        maxTokens: 500,
      });
    }
  });

  describe('Webhook Trigger Tool', () => {
    it('should receive and process webhook data', async () => {
      const context: ExecutionContext = {
        automationId: 'test-automation',
        nodeId: 'webhook-node-1',
        globalContext: {},
        previousResults: {},
      };

      const result = await ToolExecutor.execute(
        'webhook-trigger',
        {
          webhookData: {
            message: 'Quero falar com vendas',
            user: 'João Silva',
            phone: '+5511999999999',
          },
          extractField: 'message',
        },
        context
      );

      expect(result.success).toBe(true);
      expect(result.result.data).toBe('Quero falar com vendas');
      expect(result.result.source).toBe('webhook');
    });

    it('should process full webhook data when no field extracted', async () => {
      const context: ExecutionContext = {
        automationId: 'test-automation',
        nodeId: 'webhook-node-1',
        globalContext: {},
        previousResults: {},
      };

      const result = await ToolExecutor.execute(
        'webhook-trigger',
        {
          webhookData: {
            event: 'new_message',
            message: 'Olá',
            user: 'Maria',
          },
        },
        context
      );

      expect(result.success).toBe(true);
      expect(result.result.data).toHaveProperty('message');
      expect(result.result.data.message).toBe('Olá');
    });
  });

  describe('Universal Condition Tool', () => {
    it('should evaluate simple yes/no condition', async () => {
      const context: ExecutionContext = {
        automationId: 'test-automation',
        nodeId: 'condition-node-1',
        globalContext: {},
        previousResults: {},
      };

      const result = await ToolExecutor.execute(
        'universal-condition',
        {
          input: 'sim',
          comparisonType: 'equals',
          caseSensitive: false,
          branches: [
            { name: 'aceito', condition: 'sim', description: 'Usuário aceitou' },
            { name: 'recusado', condition: 'não', description: 'Usuário recusou' },
          ],
        },
        context
      );

      expect(result.success).toBe(true);
      expect(result.result.matched).toBe(true);
      expect(result.result.branch).toBe('aceito');
    });

    it('should handle contains comparison', async () => {
      const context: ExecutionContext = {
        automationId: 'test-automation',
        nodeId: 'condition-node-1',
        globalContext: {},
        previousResults: {},
      };

      const result = await ToolExecutor.execute(
        'universal-condition',
        {
          input: 'Quero falar com vendas',
          comparisonType: 'contains',
          caseSensitive: false,
          branches: [
            { name: 'vendas', condition: 'venda', description: 'Direciona para vendas' },
            { name: 'suporte', condition: 'suporte', description: 'Direciona para suporte' },
            { name: 'geral', condition: '*', description: 'Atendimento geral' },
          ],
        },
        context
      );

      expect(result.success).toBe(true);
      expect(result.result.matched).toBe(true);
      expect(result.result.branch).toBe('vendas');
    });

    it('should use wildcard for unmatched conditions', async () => {
      const context: ExecutionContext = {
        automationId: 'test-automation',
        nodeId: 'condition-node-1',
        globalContext: {},
        previousResults: {},
      };

      const result = await ToolExecutor.execute(
        'universal-condition',
        {
          input: 'Algo diferente',
          comparisonType: 'equals',
          branches: [
            { name: 'sim', condition: 'sim' },
            { name: 'nao', condition: 'não' },
            { name: 'outro', condition: '*', description: 'Qualquer outra resposta' },
          ],
        },
        context
      );

      expect(result.success).toBe(true);
      expect(result.result.branch).toBe('outro');
    });

    it('should handle numeric comparisons', async () => {
      const context: ExecutionContext = {
        automationId: 'test-automation',
        nodeId: 'condition-node-1',
        globalContext: {},
        previousResults: {},
      };

      const result = await ToolExecutor.execute(
        'universal-condition',
        {
          input: '150',
          comparisonType: 'greaterThan',
          branches: [
            { name: 'alto', condition: '100', description: 'Valor alto' },
            { name: 'baixo', condition: '*', description: 'Valor baixo' },
          ],
        },
        context
      );

      expect(result.success).toBe(true);
      expect(result.result.branch).toBe('alto');
    });
  });

  describe('Webhook Response Tool', () => {
    it('should format text response', async () => {
      const context: ExecutionContext = {
        automationId: 'test-automation',
        nodeId: 'response-node-1',
        globalContext: {},
        previousResults: {},
      };

      const result = await ToolExecutor.execute(
        'webhook-response',
        {
          response: 'Obrigado! Nossa equipe entrará em contato.',
          format: 'text',
          statusCode: 200,
        },
        context
      );

      expect(result.success).toBe(true);
      expect(result.result.sent).toBe(true);
      expect(result.result.response).toBe('Obrigado! Nossa equipe entrará em contato.');
      expect(result.result.statusCode).toBe(200);
    });

    it('should format JSON response', async () => {
      const context: ExecutionContext = {
        automationId: 'test-automation',
        nodeId: 'response-node-1',
        globalContext: {},
        previousResults: {},
      };

      const result = await ToolExecutor.execute(
        'webhook-response',
        {
          response: '{"status": "success", "message": "Recebido"}',
          format: 'json',
        },
        context
      );

      expect(result.success).toBe(true);
      expect(result.result.sent).toBe(true);
      expect(result.result.format).toBe('json');
    });
  });

  describe('Smart Connections', () => {
    it('should suggest webhook to condition mapping', () => {
      const suggestion = suggestConnections(
        {
          nodeId: 'webhook-1',
          toolId: 'webhook-trigger',
          outputSchema: { data: 'any', timestamp: 'string' },
          lastResult: { data: 'teste' },
        },
        {
          nodeId: 'condition-1',
          toolId: 'universal-condition',
          params: [
            { name: 'input', key: 'input', type: 'string', required: true },
          ] as any,
        }
      );

      expect(suggestion.mappings.length).toBeGreaterThan(0);
      expect(suggestion.mappings[0].confidence).toBeGreaterThan(0.7);
    });

    it('should auto-fill parameters based on connection', () => {
      const suggestion = {
        sourceNodeId: 'node-1',
        targetNodeId: 'node-2',
        mappings: [
          {
            sourceField: 'data',
            targetParam: 'input',
            confidence: 1.0,
            reason: 'Match exato',
          },
        ],
      };

      const sourceData = {
        data: 'Mensagem de teste',
        timestamp: '2025-10-19',
      };

      const filled = autoFillParameters({}, suggestion, sourceData);

      expect(filled.input).toBe('Mensagem de teste');
    });
  });

  describe('Complete Workflow Integration', () => {
    it('should execute complete flow: Webhook -> Condition -> Response', async () => {
      const context: ExecutionContext = {
        automationId: 'test-automation',
        nodeId: 'test-node',
        globalContext: {},
        previousResults: {},
      };

      // Step 1: Webhook recebe dados
      const webhookResult = await ToolExecutor.execute(
        'webhook-trigger',
        {
          webhookData: {
            message: 'sim',
            user: 'Teste',
          },
          extractField: 'message',
        },
        context
      );

      expect(webhookResult.success).toBe(true);
      const message = webhookResult.result.data;

      // Step 2: Condição avalia mensagem
      const conditionResult = await ToolExecutor.execute(
        'universal-condition',
        {
          input: message,
          comparisonType: 'equals',
          caseSensitive: false,
          branches: [
            { name: 'aceito', condition: 'sim' },
            { name: 'recusado', condition: 'não' },
            { name: 'outro', condition: '*' },
          ],
        },
        context
      );

      expect(conditionResult.success).toBe(true);
      expect(conditionResult.result.branch).toBe('aceito');

      // Step 3: Responder baseado na branch
      const response = conditionResult.result.branch === 'aceito'
        ? 'Ótimo! Vamos prosseguir.'
        : 'Tudo bem, até mais.';

      const responseResult = await ToolExecutor.execute(
        'webhook-response',
        {
          response,
          format: 'text',
        },
        context
      );

      expect(responseResult.success).toBe(true);
      expect(responseResult.result.response).toBe('Ótimo! Vamos prosseguir.');
    });
  });
});
