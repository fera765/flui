/**
 * FLUI - Webhook Routes
 * Rotas de API para gerenciar webhooks
 */

import { Router, Request, Response } from 'express';
import { getWebhookManager } from './webhookManager.js';
import { FlowEngineV2 } from '../core/flowEngineV2.js';
import { getAutomations } from '../store/automationStorage.js';

const router = Router();

/**
 * POST /api/webhooks - Criar novo webhook
 */
router.post('/webhooks', async (req: Request, res: Response) => {
  try {
    const { automationId, path, method, requireAuth, secretToken, jsonSchema, enabled, rateLimit, responseMode } = req.body;
    
    if (!automationId) {
      return res.status(400).json({ error: 'automationId é obrigatório' });
    }
    
    // Verificar se automação existe
    const automations = getAutomations();
    const automation = automations[automationId];
    if (!automation) {
      return res.status(404).json({ error: `Automação ${automationId} não encontrada` });
    }
    
    const manager = getWebhookManager();
    const webhook = manager.createWebhook({
      automationId,
      path,
      method,
      requireAuth,
      secretToken,
      jsonSchema,
      enabled,
      rateLimit,
      responseMode,
    });
    
    const baseUrl = process.env.WEBHOOK_BASE_URL || `http://localhost:${process.env.PORT || 3001}`;
    
    res.json({
      success: true,
      webhook: {
        ...webhook,
        url: `${baseUrl}${webhook.path}`,
        curlExample: webhook.method === 'POST'
          ? `curl -X POST "${baseUrl}${webhook.path}" -H "X-Webhook-Secret: ${webhook.secretToken}" -H "Content-Type: application/json" -d '{"key": "value"}'`
          : `curl -X GET "${baseUrl}${webhook.path}?key=value" -H "X-Webhook-Secret: ${webhook.secretToken}"`,
      },
    });
  } catch (error: any) {
    console.error('❌ [API] Erro ao criar webhook:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/webhooks - Listar todos os webhooks
 */
router.get('/webhooks', async (_req: Request, res: Response) => {
  try {
    const manager = getWebhookManager();
    const webhooks = manager.getAllWebhooks();
    
    const baseUrl = process.env.WEBHOOK_BASE_URL || `http://localhost:${process.env.PORT || 3001}`;
    
    const webhooksWithUrl = webhooks.map((webhook) => ({
      ...webhook,
      url: `${baseUrl}${webhook.path}`,
    }));
    
    res.json({ webhooks: webhooksWithUrl });
  } catch (error: any) {
    console.error('❌ [API] Erro ao listar webhooks:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/webhooks/:id - Buscar webhook por ID
 */
router.get('/webhooks/:id', async (req: Request, res: Response) => {
  try {
    const manager = getWebhookManager();
    const webhook = manager.getWebhook(req.params.id);
    
    if (!webhook) {
      return res.status(404).json({ error: 'Webhook não encontrado' });
    }
    
    const baseUrl = process.env.WEBHOOK_BASE_URL || `http://localhost:${process.env.PORT || 3001}`;
    
    res.json({
      webhook: {
        ...webhook,
        url: `${baseUrl}${webhook.path}`,
      },
    });
  } catch (error: any) {
    console.error('❌ [API] Erro ao buscar webhook:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/webhooks/automation/:automationId - Buscar webhooks de uma automação
 */
router.get('/webhooks/automation/:automationId', async (req: Request, res: Response) => {
  try {
    const manager = getWebhookManager();
    const webhooks = manager.getWebhooksByAutomation(req.params.automationId);
    
    const baseUrl = process.env.WEBHOOK_BASE_URL || `http://localhost:${process.env.PORT || 3001}`;
    
    const webhooksWithUrl = webhooks.map((webhook) => ({
      ...webhook,
      url: `${baseUrl}${webhook.path}`,
    }));
    
    res.json({ webhooks: webhooksWithUrl });
  } catch (error: any) {
    console.error('❌ [API] Erro ao buscar webhooks:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/webhooks/:id - Atualizar webhook
 */
router.put('/webhooks/:id', async (req: Request, res: Response) => {
  try {
    const manager = getWebhookManager();
    const webhook = manager.updateWebhook(req.params.id, req.body);
    
    const baseUrl = process.env.WEBHOOK_BASE_URL || `http://localhost:${process.env.PORT || 3001}`;
    
    res.json({
      success: true,
      webhook: {
        ...webhook,
        url: `${baseUrl}${webhook.path}`,
      },
    });
  } catch (error: any) {
    console.error('❌ [API] Erro ao atualizar webhook:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/webhooks/:id/regenerate-token - Regenerar token secreto
 */
router.post('/webhooks/:id/regenerate-token', async (req: Request, res: Response) => {
  try {
    const manager = getWebhookManager();
    const webhook = manager.regenerateToken(req.params.id);
    
    res.json({
      success: true,
      webhook: {
        id: webhook.id,
        secretToken: webhook.secretToken,
      },
    });
  } catch (error: any) {
    console.error('❌ [API] Erro ao regenerar token:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/webhooks/:id - Deletar webhook
 */
router.delete('/webhooks/:id', async (req: Request, res: Response) => {
  try {
    const manager = getWebhookManager();
    const deleted = manager.deleteWebhook(req.params.id);
    
    if (!deleted) {
      return res.status(404).json({ error: 'Webhook não encontrado' });
    }
    
    res.json({ success: true });
  } catch (error: any) {
    console.error('❌ [API] Erro ao deletar webhook:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /webhook/* - Rota dinâmica para receber webhooks
 * Esta rota captura TODAS as requisições que começam com /webhook/
 */
export function handleWebhookTrigger(req: Request, res: Response): void {
  (async () => {
    try {
      const path = req.path; // Ex: /webhook/xxx ou /webhook/my-custom-path
      console.log(`🔗 [Webhook] Recebida requisição: ${req.method} ${path}`);
      
      const manager = getWebhookManager();
      const webhook = manager.getWebhookByPath(path);
      
      if (!webhook) {
        console.log(`❌ [Webhook] Path ${path} não encontrado`);
        return res.status(404).json({ error: `Webhook ${path} não encontrado` });
      }
      
      // Verificar se está habilitado
      if (!webhook.enabled) {
        console.log(`⏸️  [Webhook] Webhook ${webhook.id} está desabilitado`);
        return res.status(403).json({ error: 'Webhook desabilitado' });
      }
      
      // Verificar método HTTP
      if (webhook.method !== 'ANY' && req.method !== webhook.method) {
        console.log(`❌ [Webhook] Método ${req.method} não permitido (esperado: ${webhook.method})`);
        return res.status(405).json({ error: `Método ${req.method} não permitido. Use ${webhook.method}` });
      }
      
      // Verificar autenticação
      const providedToken = req.headers['x-webhook-secret'] as string;
      if (providedToken !== webhook.secretToken) {
        console.log(`🔐 [Webhook] Token inválido`);
        return res.status(401).json({ error: 'Token de autenticação inválido' });
      }
      
      // Validar payload contra JSON schema
      const payload = req.body;
      const validation = manager.validatePayload(webhook.id, payload);
      
      if (!validation.valid) {
        console.log(`❌ [Webhook] Payload inválido:`, validation.errors);
        return res.status(400).json({ error: 'Payload inválido', details: validation.errors });
      }
      
      // Registrar trigger
      manager.recordTrigger(webhook.id);
      
      console.log(`✅ [Webhook] ${webhook.id} validado - Executando automação ${webhook.automationId}`);
      
      // ✅ EXECUTAR AUTOMAÇÃO
      const automations = getAutomations();
      const automationsList = Object.values(automations);
      const automation = automationsList.find((a: any) => a.id === webhook.automationId);
      
      if (!automation) {
        console.log(`❌ [Webhook] Automação ${webhook.automationId} não encontrada`);
        return res.status(404).json({ error: 'Automação não encontrada' });
      }
      
      // Resposta imediata (não aguarda execução)
      if (webhook.responseMode === 'immediate') {
        res.json({
          success: true,
          message: 'Webhook recebido e automação iniciada',
          webhookId: webhook.id,
          automationId: webhook.automationId,
          timestamp: new Date().toISOString(),
        });
        
        // Executar automação em background (não aguarda)
        executeAutomationInBackground(automation, payload, webhook.id).catch((error) => {
          console.error(`❌ [Webhook] Erro ao executar automação:`, error);
        });
      } else {
        // Aguardar execução
        const result = await executeAutomationInBackground(automation, payload, webhook.id);
        
        res.json({
          success: true,
          message: 'Automação executada',
          webhookId: webhook.id,
          automationId: webhook.automationId,
          result: result.status,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error: any) {
      console.error('❌ [Webhook] Erro ao processar webhook:', error);
      res.status(500).json({ error: error.message });
    }
  })();
}

/**
 * Executa automação em background
 */
async function executeAutomationInBackground(automation: any, triggerData: any, webhookId: string) {
  try {
    console.log(`🚀 [Webhook] Executando automação ${automation.id}...`);
    
    const { getSandboxManager } = await import('./sandboxManager.js');
    const sandboxManager = getSandboxManager();
    
    // Criar sandbox único para esta execução
    const executionId = `exec-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const sandboxPath = await sandboxManager.createSandbox({
      automationId: executionId, // ✅ Usar executionId ao invés de automationId
      mcpEnvVars: {},
      customEnvVars: {},
    });
    
    console.log(`📦 [Webhook] Sandbox criado: ${sandboxPath}`);
    
    // Mapear nodes
    const executionFlow = {
      id: automation.id,
      name: automation.name,
      description: automation.description || '',
      version: automation.version || '1.0',
      nodes: automation.nodes.map((node: any) => ({
        id: node.id,
        type: node.toolId || node.type || 'tool',
        name: node.name,
        config: node.config || {},
        position: node.position,
        ...(node.agentId && { agentId: node.agentId }),
        ...(node.toolId && { toolId: node.toolId }),
        ...(node.mcpId && { mcpId: node.mcpId }),
        ...(node.mcpToolId && { mcpToolId: node.mcpToolId }),
      })),
      edges: automation.edges || [],
      startNodeId: automation.startNodeId || automation.nodes[0]?.id,
    };
    
    const engine = new FlowEngineV2(executionFlow);
    
    // Executar com dados do webhook
    const result = await engine.execute({
      webhookId,
      webhookData: triggerData,
      triggeredBy: 'webhook',
      timestamp: new Date().toISOString(),
    });
    
    console.log(`✅ [Webhook] Automação ${automation.id} executada:`, result.status);
    
    return result;
  } catch (error: any) {
    console.error(`❌ [Webhook] Erro na execução:`, error);
    throw error;
  }
}

export default router;
