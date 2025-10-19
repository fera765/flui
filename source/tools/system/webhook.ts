/**
 * FLUI - Webhook Tool
 * 
 * Ferramenta para receber e enviar dados via webhooks
 * Perfeita para integração com sistemas externos, chatbots, APIs
 */

import { Tool, ExecutionContext, ToolResult } from '../../core/types.js';

export const WebhookTriggerTool: Tool = {
  id: 'webhook-trigger',
  name: 'Webhook Trigger',
  description: 'Recebe dados de webhooks externos e inicia o fluxo de automação. Use para integrar com chatbots, APIs, formulários e sistemas externos.',
  category: 'http',
  version: '1.0.0',

  params: [
    {
      name: 'Webhook Data',
      key: 'webhookData',
      type: 'object',
      description: 'Dados recebidos do webhook',
      required: false,
      default: {},
      ui: {
        widgetType: 'jsonEditor',
        placeholder: '{\n  "message": "Olá",\n  "user": "João",\n  "timestamp": "2025-10-19T20:00:00Z"\n}',
        helperText: 'Dados recebidos do webhook. Este campo é preenchido automaticamente quando o webhook é chamado.',
        codeLanguage: 'json',
        allowExpressions: false,
      },
    },
    {
      name: 'Extrair Campo',
      key: 'extractField',
      type: 'string',
      description: 'Nome do campo a extrair dos dados (opcional)',
      required: false,
      placeholder: 'message',
      ui: {
        widgetType: 'textInput',
        placeholder: 'message',
        helperText: 'Se preenchido, extrai apenas este campo dos dados recebidos (ex: "message" extrai webhookData.message)',
        advanced: true,
        allowExpressions: false,
      },
    },
  ],

  output: {
    type: 'object',
    description: 'Dados do webhook processados',
    schema: {
      data: 'any',
      timestamp: 'string',
      source: 'string',
    },
  },

  async execute(args: any, context: ExecutionContext): Promise<ToolResult> {
    const startTime = Date.now();

    try {
      let result: any = args.webhookData || {};

      // Se deve extrair um campo específico
      if (args.extractField && result[args.extractField] !== undefined) {
        result = result[args.extractField];
      }

      return {
        success: true,
        result: {
          data: result,
          timestamp: new Date().toISOString(),
          source: 'webhook',
          rawData: args.webhookData,
        },
        executionTime: Date.now() - startTime,
      };
    } catch (error: any) {
      return {
        success: false,
        error: `Erro ao processar webhook: ${error.message}`,
        executionTime: Date.now() - startTime,
      };
    }
  },

  capabilities: {
    requiresAuth: false,
    runsInSandbox: false,
    isAsync: true,
    supportsStreaming: false,
    canBeCached: false,
    isStateful: false,
    requiresNetwork: true,
    requiresFileSystem: false,
  },

  ui: {
    icon: 'Webhook',
    color: '#f59e0b', // amber
    tags: ['webhook', 'trigger', 'http', 'api', 'integration', 'chatbot'],
    category: 'Integração',
    group: 'Webhook',
    examples: [
      {
        title: 'Receber Mensagem de Chatbot',
        description: 'Recebe mensagem de usuário via webhook',
        params: {
          webhookData: {
            message: 'Olá, quero falar com vendas',
            user: 'João Silva',
            phone: '+5511999999999',
          },
          extractField: 'message',
        },
        expectedOutput: {
          data: 'Olá, quero falar com vendas',
          source: 'webhook',
        },
      },
      {
        title: 'Dados Completos do Webhook',
        description: 'Processa todos os dados recebidos',
        params: {
          webhookData: {
            event: 'new_order',
            order_id: '12345',
            customer: 'Maria',
            amount: 150.00,
          },
        },
      },
    ],
  },

  config: {
    timeout: 10000,
    retries: 0,
    sandbox: false,
    concurrent: true,
  },
};

export const WebhookResponseTool: Tool = {
  id: 'webhook-response',
  name: 'Webhook Response',
  description: 'Envia resposta de volta para o webhook que iniciou o fluxo. Use para responder chatbots, APIs e sistemas externos.',
  category: 'http',
  version: '1.0.0',

  params: [
    {
      name: 'Resposta',
      key: 'response',
      type: 'string',
      description: 'Texto ou dados a enviar como resposta',
      required: true,
      placeholder: 'Digite a resposta ou conecte com saída de agente',
      ui: {
        widgetType: 'textArea',
        placeholder: 'Digite a resposta ou use {{ data.campo }}',
        helperText: 'Resposta que será enviada de volta ao webhook. Pode ser texto simples ou JSON.',
        allowExpressions: true,
        rows: 4,
      },
    },
    {
      name: 'Formato',
      key: 'format',
      type: 'string',
      description: 'Formato da resposta',
      required: false,
      default: 'text',
      ui: {
        widgetType: 'select',
        options: [
          { label: 'Texto', value: 'text' },
          { label: 'JSON', value: 'json' },
          { label: 'HTML', value: 'html' },
        ],
        helperText: 'Formato da resposta a ser enviada',
      },
    },
    {
      name: 'Status Code',
      key: 'statusCode',
      type: 'number',
      description: 'Código HTTP de status',
      required: false,
      default: 200,
      ui: {
        widgetType: 'number',
        placeholder: '200',
        helperText: 'Código HTTP (200 = sucesso, 400 = erro cliente, 500 = erro servidor)',
        validation: {
          min: 100,
          max: 599,
        },
        advanced: true,
      },
    },
  ],

  output: {
    type: 'object',
    description: 'Status do envio da resposta',
    schema: {
      sent: 'boolean',
      response: 'string',
      format: 'string',
      statusCode: 'number',
    },
  },

  async execute(args: any, context: ExecutionContext): Promise<ToolResult> {
    const startTime = Date.now();

    try {
      let responseData: any = args.response;

      // Se formato é JSON, tentar parsear
      if (args.format === 'json' && typeof responseData === 'string') {
        try {
          responseData = JSON.parse(responseData);
        } catch {
          // Manter como string se não for JSON válido
        }
      }

      return {
        success: true,
        result: {
          sent: true,
          response: responseData,
          format: args.format || 'text',
          statusCode: args.statusCode || 200,
          timestamp: new Date().toISOString(),
        },
        executionTime: Date.now() - startTime,
      };
    } catch (error: any) {
      return {
        success: false,
        error: `Erro ao enviar resposta webhook: ${error.message}`,
        executionTime: Date.now() - startTime,
      };
    }
  },

  capabilities: {
    requiresAuth: false,
    runsInSandbox: false,
    isAsync: true,
    supportsStreaming: false,
    canBeCached: false,
    isStateful: false,
    requiresNetwork: true,
    requiresFileSystem: false,
  },

  ui: {
    icon: 'Send',
    color: '#06b6d4', // cyan
    tags: ['webhook', 'response', 'http', 'api', 'integration', 'reply'],
    category: 'Integração',
    group: 'Webhook',
    examples: [
      {
        title: 'Responder Chatbot',
        description: 'Envia resposta para chatbot',
        params: {
          response: 'Obrigado! Nossa equipe de vendas entrará em contato em breve.',
          format: 'text',
        },
      },
      {
        title: 'Resposta JSON',
        description: 'Envia dados estruturados',
        params: {
          response: '{"status": "success", "message": "Pedido recebido", "order_id": "12345"}',
          format: 'json',
          statusCode: 200,
        },
      },
    ],
  },

  config: {
    timeout: 10000,
    retries: 1,
    sandbox: false,
    concurrent: false,
  },
};
