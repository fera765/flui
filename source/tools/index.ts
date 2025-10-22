/**
 * FLUI - Tool Registry Index
 * 
 * Sistema de registro de ferramentas LIMPO e RECRIADO
 * Baseado no N8n mas SUPERIOR em arquitetura e performance
 */

import { getToolRegistry } from '../core/toolRegistry.js';
import { ToolRegistry } from '../core/toolRegistry.js';

// Importar os triggers e ferramentas principais
import { manualTrigger } from './triggers/manualTrigger.js';
import { cronTrigger } from './triggers/cronTrigger.js';
import { webhookTrigger } from './triggers/webhookTrigger.js';
import { conditionFlexTool } from './conditionFlexTool.js';

/**
 * Registra todos os agentes ativos como tools no registry
 * 🔥 INTEGRAÇÃO REAL - Agentes agora são tools executáveis
 */
async function registerAgentsAsTools(registry: ToolRegistry): Promise<void> {
  try {
    // Importar dinamicamente para evitar ciclos
    const { useStore } = await import('../store/store.js');
    const store = useStore.getState();
    const agents = store.agents.filter(a => a.enabled);
    
    if (agents.length === 0) {
      console.log('ℹ️  [FLUI] Nenhum agente ativo para registrar');
      return;
    }
    
    console.log(`🤖 [FLUI] Registrando ${agents.length} agente(s) como tools...`);
    
    // Importar conversor
    const { convertAgentToTool } = await import('../services/agentAsToolConverter.js');
    
    agents.forEach(agent => {
      try {
        const agentTool = convertAgentToTool(agent);
        
        // Verificar se já existe (pode ter sido registrado antes)
        if (registry.has(agentTool.id)) {
          console.log(`  ⚠️  Agente ${agent.name} já registrado, atualizando...`);
          registry.unregister(agentTool.id);
        }
        
        registry.register(agentTool);
        console.log(`  ✅ Agente registrado: ${agent.name} (${agentTool.id})`);
      } catch (error: any) {
        console.error(`  ❌ Erro ao registrar agente ${agent.name}:`, error.message);
      }
    });
    
    console.log(`✅ [FLUI] ${agents.length} agente(s) registrado(s) como tools`);
  } catch (error: any) {
    console.error('❌ [FLUI] Erro ao registrar agentes:', error);
  }
}

/**
 * Registra todas as ferramentas do sistema
 * NOVA ARQUITETURA - Apenas 3 Triggers Principais + Agentes Dinâmicos
 */
export async function registerAllTools(): Promise<void> {
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
    
    // 🔥 NOVO: Registrar agentes como tools
    await registerAgentsAsTools(registry);
    
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
