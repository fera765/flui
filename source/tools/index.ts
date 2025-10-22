/**
 * FLUI - Tool Registry Index
 * 
 * Sistema de registro de ferramentas LIMPO e RECRIADO
 * Baseado no N8n mas SUPERIOR em arquitetura e performance
 */

import { getToolRegistry } from '../core/toolRegistry.js';

// Importar os triggers e ferramentas principais
import { manualTrigger } from './triggers/manualTrigger.js';
import { cronTrigger } from './triggers/cronTrigger.js';
import { webhookTrigger } from './triggers/webhookTrigger.js';
import { conditionFlexTool } from './conditionFlexTool.js';

/**
 * Registra todas as ferramentas do sistema
 * NOVA ARQUITETURA - Apenas 3 Triggers Principais
 */
export function registerAllTools(): void {
  const registry = getToolRegistry();
  
  console.log('🧹 [FLUI] Limpando registry antigo...');
  registry.clear();
  
  console.log('🚀 [FLUI] Registrando ferramentas do sistema...');
  
  try {
    // Registrar Triggers
    registry.register(manualTrigger);
    console.log('✅ [FLUI] Manual Trigger registrado');
    
    registry.register(cronTrigger);
    console.log('✅ [FLUI] Cron Trigger registrado');
    
    registry.register(webhookTrigger);
    console.log('✅ [FLUI] Webhook Trigger registrado');
    
    // Registrar Control Flow Tools
    registry.register(conditionFlexTool);
    console.log('✅ [FLUI] Condition Flex Tool registrado');
    
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
