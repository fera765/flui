/**
 * FLUI - Webhook Manager
 * Gerencia webhooks persistentes com rotas dinâmicas
 */

import { getConfig, setConfig } from '../store/storage.js';
import { generateId } from '../utils/id.js';
import crypto from 'crypto';

export interface WebhookField {
  key: string;
  type: 'string' | 'number' | 'boolean' | 'json' | 'array' | 'object';
  required: boolean;
  description?: string;
  default?: any;
}

export interface WebhookConfig {
  id: string;
  automationId: string;
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'ANY';
  secretToken: string;
  jsonSchema?: {
    fields: WebhookField[];
  };
  enabled: boolean;
  createdAt: string;
  lastTriggeredAt?: string;
  triggerCount: number;
  rateLimit?: number;
  responseMode?: 'immediate' | 'wait' | 'custom';
}

class WebhookManager {
  private webhooks: Map<string, WebhookConfig> = new Map();
  private pathToWebhookId: Map<string, string> = new Map();

  constructor() {
    this.loadFromStorage();
  }

  /**
   * Carrega webhooks do storage
   */
  private loadFromStorage(): void {
    try {
      const config = getConfig();
      const webhooksData = (config as any).webhooks || {};
      
      Object.values(webhooksData).forEach((webhook: any) => {
        this.webhooks.set(webhook.id, webhook);
        this.pathToWebhookId.set(webhook.path, webhook.id);
      });
      
      console.log(`✅ [WebhookManager] ${this.webhooks.size} webhooks carregados`);
    } catch (error) {
      console.error('❌ [WebhookManager] Erro ao carregar webhooks:', error);
    }
  }

  /**
   * Salva webhooks no storage
   */
  private saveToStorage(): void {
    try {
      const config = getConfig();
      const webhooksData: Record<string, WebhookConfig> = {};
      
      this.webhooks.forEach((webhook, id) => {
        webhooksData[id] = webhook;
      });
      
      setConfig({
        ...config,
        webhooks: webhooksData,
      });
      
      console.log(`💾 [WebhookManager] ${this.webhooks.size} webhooks salvos`);
    } catch (error) {
      console.error('❌ [WebhookManager] Erro ao salvar webhooks:', error);
    }
  }

  /**
   * Cria novo webhook
   */
  createWebhook(params: {
    automationId: string;
    path?: string;
    method?: string;
    requireAuth?: boolean;
    secretToken?: string;
    jsonSchema?: { fields: WebhookField[] };
    enabled?: boolean;
    rateLimit?: number;
    responseMode?: string;
  }): WebhookConfig {
    const id = `webhook-${generateId()}`;
    
    // Gerar path se não fornecido
    let path = params.path;
    if (!path || path.trim() === '') {
      path = `/webhook/${id}`;
    } else if (!path.startsWith('/')) {
      path = `/${path}`;
    }
    
    // Verificar se path já existe
    if (this.pathToWebhookId.has(path)) {
      throw new Error(`Webhook com path ${path} já existe`);
    }
    
    // Gerar token secreto
    const secretToken = params.secretToken || crypto.randomBytes(32).toString('hex');
    
    const webhook: WebhookConfig = {
      id,
      automationId: params.automationId,
      path,
      method: (params.method?.toUpperCase() as any) || 'POST',
      secretToken,
      jsonSchema: params.jsonSchema,
      enabled: params.enabled !== false,
      createdAt: new Date().toISOString(),
      triggerCount: 0,
      rateLimit: params.rateLimit,
      responseMode: (params.responseMode as any) || 'immediate',
    };
    
    this.webhooks.set(id, webhook);
    this.pathToWebhookId.set(path, id);
    this.saveToStorage();
    
    console.log(`✅ [WebhookManager] Webhook criado: ${path} → automation ${params.automationId}`);
    
    return webhook;
  }

  /**
   * Atualiza webhook existente
   */
  updateWebhook(id: string, updates: Partial<WebhookConfig>): WebhookConfig {
    const webhook = this.webhooks.get(id);
    if (!webhook) {
      throw new Error(`Webhook ${id} não encontrado`);
    }
    
    // Se mudar path, atualizar mapeamento
    if (updates.path && updates.path !== webhook.path) {
      this.pathToWebhookId.delete(webhook.path);
      this.pathToWebhookId.set(updates.path, id);
    }
    
    const updated = { ...webhook, ...updates };
    this.webhooks.set(id, updated);
    this.saveToStorage();
    
    console.log(`✅ [WebhookManager] Webhook ${id} atualizado`);
    
    return updated;
  }

  /**
   * Regenera token secreto
   */
  regenerateToken(id: string): WebhookConfig {
    const webhook = this.webhooks.get(id);
    if (!webhook) {
      throw new Error(`Webhook ${id} não encontrado`);
    }
    
    const newToken = crypto.randomBytes(32).toString('hex');
    return this.updateWebhook(id, { secretToken: newToken });
  }

  /**
   * Busca webhook por ID
   */
  getWebhook(id: string): WebhookConfig | undefined {
    return this.webhooks.get(id);
  }

  /**
   * Busca webhook por path
   */
  getWebhookByPath(path: string): WebhookConfig | undefined {
    const id = this.pathToWebhookId.get(path);
    return id ? this.webhooks.get(id) : undefined;
  }

  /**
   * Lista webhooks de uma automação
   */
  getWebhooksByAutomation(automationId: string): WebhookConfig[] {
    return Array.from(this.webhooks.values()).filter(
      (w) => w.automationId === automationId
    );
  }

  /**
   * Lista todos os webhooks
   */
  getAllWebhooks(): WebhookConfig[] {
    return Array.from(this.webhooks.values());
  }

  /**
   * Remove webhook
   */
  deleteWebhook(id: string): boolean {
    const webhook = this.webhooks.get(id);
    if (!webhook) {
      return false;
    }
    
    this.webhooks.delete(id);
    this.pathToWebhookId.delete(webhook.path);
    this.saveToStorage();
    
    console.log(`🗑️  [WebhookManager] Webhook ${id} removido`);
    
    return true;
  }

  /**
   * Remove todos os webhooks de uma automação
   */
  deleteWebhooksByAutomation(automationId: string): number {
    const webhooks = this.getWebhooksByAutomation(automationId);
    
    webhooks.forEach((webhook) => {
      this.webhooks.delete(webhook.id);
      this.pathToWebhookId.delete(webhook.path);
    });
    
    this.saveToStorage();
    
    console.log(`🗑️  [WebhookManager] ${webhooks.length} webhooks removidos da automação ${automationId}`);
    
    return webhooks.length;
  }

  /**
   * Valida payload contra JSON schema
   */
  validatePayload(webhookId: string, payload: any): { valid: boolean; errors?: string[] } {
    const webhook = this.webhooks.get(webhookId);
    if (!webhook) {
      return { valid: false, errors: ['Webhook não encontrado'] };
    }
    
    if (!webhook.jsonSchema || !webhook.jsonSchema.fields) {
      return { valid: true }; // Sem schema = aceita tudo
    }
    
    const errors: string[] = [];
    
    webhook.jsonSchema.fields.forEach((field) => {
      const value = payload[field.key];
      
      // Verificar required
      if (field.required && (value === undefined || value === null)) {
        errors.push(`Campo obrigatório ausente: ${field.key}`);
        return;
      }
      
      // Verificar tipo
      if (value !== undefined && value !== null) {
        const actualType = Array.isArray(value) ? 'array' : typeof value;
        const expectedType = field.type === 'json' ? 'object' : field.type;
        
        if (actualType !== expectedType) {
          errors.push(`Campo ${field.key}: esperado ${expectedType}, recebido ${actualType}`);
        }
      }
    });
    
    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  /**
   * Registra trigger do webhook
   */
  recordTrigger(id: string): void {
    const webhook = this.webhooks.get(id);
    if (!webhook) {
      return;
    }
    
    webhook.triggerCount++;
    webhook.lastTriggeredAt = new Date().toISOString();
    
    this.webhooks.set(id, webhook);
    
    // Salvar a cada 10 triggers (otimização)
    if (webhook.triggerCount % 10 === 0) {
      this.saveToStorage();
    }
  }
}

// Singleton
let webhookManagerInstance: WebhookManager | null = null;

export function getWebhookManager(): WebhookManager {
  if (!webhookManagerInstance) {
    webhookManagerInstance = new WebhookManager();
  }
  return webhookManagerInstance;
}
