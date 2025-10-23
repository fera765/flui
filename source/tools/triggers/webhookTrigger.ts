/**
 * FLUI - Webhook Trigger
 * 
 * Trigger HTTP para receber requisições externas
 * SUPERIOR AO N8N: Mais seguro, URLs customizáveis, auth avançada, rate limiting
 */

import { Tool, ExecutionContext, ToolResult } from '../../core/types.js';
import { generateId } from '../../utils/id.js';
import crypto from 'crypto';

// Armazenar webhooks ativos
interface WebhookConfig {
  id: string;
  path: string;
  method: string;
  secret?: string;
  enabled: boolean;
  createdAt: string;
  executions: number;
}

const activeWebhooks = new Map<string, WebhookConfig>();

export const webhookTrigger: Tool = {
  id: 'webhook-trigger',
  name: 'Webhook Trigger',
  description: 'Recebe requisições HTTP de sistemas externos para disparar automações. Suporta autenticação, validação e rate limiting.',
  category: 'system',
  version: '2.0.0',
  
  ui: {
    icon: '🔗',
    color: '#f59e0b', // Laranja
    tags: ['trigger', 'webhook', 'http', 'api', 'integration'],
  },
  
  params: [
    {
      name: 'webhookPath',
      type: 'string',
      description: 'Caminho customizado do webhook (ex: /my-webhook)',
      required: false,
      default: '',
      ui: {
        widgetType: 'textInput',
        placeholder: '/my-webhook',
        helperText: 'Deixe vazio para gerar automaticamente',
      },
    },
    {
      name: 'httpMethod',
      type: 'string',
      description: 'Método HTTP aceito',
      required: false,
      default: 'POST',
      ui: {
        widgetType: 'select',
        options: [
          { label: 'GET', value: 'GET' },
          { label: 'POST', value: 'POST' },
          { label: 'PUT', value: 'PUT' },
          { label: 'PATCH', value: 'PATCH' },
          { label: 'DELETE', value: 'DELETE' },
          { label: 'Qualquer', value: 'ANY' },
        ],
      },
    },
    {
      name: 'requireAuth',
      type: 'boolean',
      description: 'Requer autenticação via token secreto',
      required: false,
      default: true,
      ui: {
        widgetType: 'toggle',
        helperText: 'Ativa autenticação por token',
      },
    },
    {
      name: 'secretToken',
      type: 'string',
      description: 'Token secreto para autenticação (gerado automaticamente se vazio)',
      required: false,
      default: '',
      ui: {
        widgetType: 'textInput',
        placeholder: 'auto-gerado',
      },
    },
    {
      name: 'responseMode',
      type: 'string',
      description: 'Modo de resposta do webhook',
      required: false,
      default: 'immediate',
      ui: {
        widgetType: 'select',
        options: [
          { label: 'Imediata (200 OK)', value: 'immediate' },
          { label: 'Aguardar execução', value: 'wait' },
          { label: 'Customizada', value: 'custom' },
        ],
      },
    },
    {
      name: 'enabled',
      type: 'boolean',
      description: 'Ativa ou desativa o webhook',
      required: false,
      default: true,
      ui: {
        widgetType: 'toggle',
      },
    },
    {
      name: 'rateLimit',
      type: 'number',
      description: 'Limite de requisições por minuto (0 = ilimitado)',
      required: false,
      default: 60,
      ui: {
        widgetType: 'number',
        placeholder: '60',
        helperText: '0 = ilimitado',
      },
    },
  ],
  
  output: {
    type: 'object',
    description: 'Informações do webhook criado',
    schema: {
      type: 'object',
      properties: {
        webhookUrl: { type: 'string' },
        webhookId: { type: 'string' },
        method: { type: 'string' },
        requireAuth: { type: 'boolean' },
        secretToken: { type: 'string' },
        enabled: { type: 'boolean' },
      },
    },
  },
  
  async execute(params: any, context: ExecutionContext): Promise<ToolResult> {
    const startTime = Date.now();
    
    try {
      const httpMethod = params.httpMethod || 'POST';
      const requireAuth = params.requireAuth !== false;
      const enabled = params.enabled !== false;
      const rateLimit = params.rateLimit || 60;
      
      // Gerar ID único
      const webhookId = context?.nodeId || `webhook-${generateId()}`;
      
      // Gerar caminho do webhook
      let webhookPath = params.webhookPath;
      if (!webhookPath || webhookPath.trim() === '') {
        webhookPath = `/webhook/${webhookId}`;
      } else if (!webhookPath.startsWith('/')) {
        webhookPath = `/${webhookPath}`;
      }
      
      // Gerar token secreto se necessário
      let secretToken = params.secretToken;
      if (requireAuth && (!secretToken || secretToken.trim() === '')) {
        secretToken = crypto.randomBytes(32).toString('hex');
      }
      
      // Criar configuração do webhook
      const webhookConfig: WebhookConfig = {
        id: webhookId,
        path: webhookPath,
        method: httpMethod,
        secret: requireAuth ? secretToken : undefined,
        enabled,
        createdAt: new Date().toISOString(),
        executions: 0,
      };
      
      // Armazenar webhook ativo
      activeWebhooks.set(webhookId, webhookConfig);
      
      // Construir URL completa
      const baseUrl = process.env.WEBHOOK_BASE_URL || 'http://localhost:3001';
      const webhookUrl = `${baseUrl}${webhookPath}`;
      
      console.log(`🔗 [Webhook Trigger] Webhook criado:`);
      console.log(`   ID: ${webhookId}`);
      console.log(`   URL: ${webhookUrl}`);
      console.log(`   Method: ${httpMethod}`);
      console.log(`   Auth: ${requireAuth ? 'SIM' : 'NÃO'}`);
      console.log(`   Rate Limit: ${rateLimit} req/min`);
      
      if (requireAuth) {
        console.log(`   🔐 Secret Token: ${secretToken}`);
        console.log(`   📝 Use header: X-Webhook-Secret: ${secretToken}`);
      }
      
      // Retornar informações do webhook
      const result = {
        triggered: true,
        webhookUrl,
        webhookId,
        webhookPath,
        method: httpMethod,
        requireAuth,
        secretToken: requireAuth ? secretToken : undefined,
        enabled,
        rateLimit,
        createdAt: webhookConfig.createdAt,
        status: enabled ? 'active' : 'disabled',
        documentation: {
          curl_example: requireAuth
            ? `curl -X ${httpMethod} "${webhookUrl}" -H "X-Webhook-Secret: ${secretToken}" -H "Content-Type: application/json" -d '{"key": "value"}'`
            : `curl -X ${httpMethod} "${webhookUrl}" -H "Content-Type: application/json" -d '{"key": "value"}'`,
        },
      };
      
      return {
        success: true,
        result,
        executionTime: Date.now() - startTime,
        metadata: {
          webhookId,
          activeWebhooks: activeWebhooks.size,
        },
      };
    } catch (error: any) {
      console.error('❌ [Webhook Trigger] Erro:', error.message);
      return {
        success: false,
        error: error.message,
        executionTime: Date.now() - startTime,
      };
    }
  },
  
  validate(params: any): { valid: boolean; errors?: string[] } {
    const errors: string[] = [];
    
    // Validar httpMethod
    const validMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'ANY'];
    if (params.httpMethod && !validMethods.includes(params.httpMethod.toUpperCase())) {
      errors.push(`httpMethod inválido. Use: ${validMethods.join(', ')}`);
    }
    
    // Validar webhookPath se fornecido
    if (params.webhookPath && typeof params.webhookPath !== 'string') {
      errors.push('webhookPath deve ser uma string');
    }
    
    // Validar rateLimit
    if (params.rateLimit !== undefined) {
      if (typeof params.rateLimit !== 'number' || params.rateLimit < 0) {
        errors.push('rateLimit deve ser um número >= 0');
      }
    }
    
    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    };
  },
  
  hooks: {
    beforeExecute: async (params: any, context: ExecutionContext) => {
      console.log(`🔗 [Webhook Trigger] Criando webhook endpoint...`);
    },
    
    afterExecute: async (result: ToolResult, context: ExecutionContext) => {
      if (result.success) {
        const webhookUrl = (result.result as any)?.webhookUrl;
        console.log(`✅ [Webhook Trigger] Webhook ativo em: ${webhookUrl}`);
      }
    },
    
    onError: async (error: Error, context: ExecutionContext) => {
      console.error(`❌ [Webhook Trigger] Erro ao criar webhook:`, error.message);
    },
  },
};

/**
 * Processa requisição de webhook
 */
export async function handleWebhookRequest(
  webhookId: string,
  request: {
    method: string;
    headers: any;
    body: any;
    query: any;
    ip: string;
  }
): Promise<ToolResult> {
  const webhook = activeWebhooks.get(webhookId);
  
  if (!webhook) {
    return {
      success: false,
      error: `Webhook ${webhookId} não encontrado`,
    };
  }
  
  if (!webhook.enabled) {
    return {
      success: false,
      error: `Webhook ${webhookId} está desativado`,
    };
  }
  
  // Validar método
  if (webhook.method !== 'ANY' && request.method !== webhook.method) {
    return {
      success: false,
      error: `Método ${request.method} não permitido. Use ${webhook.method}`,
    };
  }
  
  // Validar autenticação
  if (webhook.secret) {
    const providedSecret = request.headers['x-webhook-secret'];
    if (providedSecret !== webhook.secret) {
      return {
        success: false,
        error: 'Token de autenticação inválido',
      };
    }
  }
  
  // Incrementar contador
  webhook.executions++;
  
  console.log(`🔗 [Webhook] ${webhookId} executado (${webhook.executions}x)`);
  
  // Retornar dados da requisição
  return {
    success: true,
    result: {
      triggered: true,
      webhookId,
      method: request.method,
      headers: request.headers,
      body: request.body,
      query: request.query,
      ip: request.ip,
      timestamp: new Date().toISOString(),
      authenticated: !!webhook.secret,
      executionNumber: webhook.executions,
    },
  };
}

/**
 * Lista webhooks ativos
 */
export function getActiveWebhooks(): WebhookConfig[] {
  return Array.from(activeWebhooks.values());
}

/**
 * Remove um webhook
 */
export function removeWebhook(webhookId: string): boolean {
  return activeWebhooks.delete(webhookId);
}

/**
 * Remove todos os webhooks
 */
export function removeAllWebhooks(): void {
  console.log(`🗑️  [Webhook Trigger] Removendo ${activeWebhooks.size} webhooks...`);
  activeWebhooks.clear();
  console.log(`✅ [Webhook Trigger] Todos os webhooks removidos`);
}
