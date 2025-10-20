/**
 * FLUI - Tool Registry Index
 * 
 * Sistema de registro de ferramentas LIMPO e RECRIADO
 * Baseado no N8n mas SUPERIOR em arquitetura e performance
 */

import { getToolRegistry } from '../core/toolRegistry.js';

// Importar os 3 triggers principais
import { manualTrigger } from './triggers/manualTrigger.js';
import { cronTrigger } from './triggers/cronTrigger.js';
import { webhookTrigger } from './triggers/webhookTrigger.js';

/**
 * Registra todas as ferramentas do sistema
 * NOVA ARQUITETURA - Apenas 3 Triggers Principais
 */
export function registerAllTools(): void {
  const registry = getToolRegistry();
  
  console.log('🧹 [FLUI] Limpando registry antigo...');
  registry.clear();
  
  console.log('🚀 [FLUI] Registrando 3 TRIGGERS SUPERIORES ao N8n...');
  
  try {
    // Registrar Manual Trigger
    registry.register(manualTrigger);
    console.log('✅ [FLUI] Manual Trigger registrado');
    
    // Registrar Cron Trigger
    registry.register(cronTrigger);
    console.log('✅ [FLUI] Cron Trigger registrado');
    
    // Registrar Webhook Trigger
    registry.register(webhookTrigger);
    console.log('✅ [FLUI] Webhook Trigger registrado');
    
    console.log(`\n🎉 [FLUI] ${registry.count()} ferramentas registradas com sucesso!\n`);
  } catch (error) {
    console.error('❌ [FLUI] Erro ao registrar ferramentas:', error);
    throw error;
  }
}

/**
 * Obtém lista de todas as ferramentas registradas
 */
export function listAllTools() {
  const registry = getToolRegistry();
  return registry.list();
}

/**
 * Obtém uma ferramenta específica por ID
 */
export function getTool(toolId: string) {
  const registry = getToolRegistry();
  return registry.get(toolId);
}
