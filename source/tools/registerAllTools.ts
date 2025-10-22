import { ToolRegistry } from '../core/toolRegistry.js';
import { manualTrigger } from './triggers/manualTrigger.js';
import { cronTrigger } from './triggers/cronTrigger.js';
import { webhookTrigger } from './triggers/webhookTrigger.js';
import { conditionFlexTool } from './conditionFlexTool.js';

/**
 * Registra todas as ferramentas do sistema
 * @param registry - Instância do ToolRegistry
 */
export function registerAllSystemTools(registry: ToolRegistry) {
  console.log('🔧 Registrando ferramentas do sistema...');
  
  // Triggers
  registry.register(manualTrigger);
  registry.register(cronTrigger);
  registry.register(webhookTrigger);
  
  // Control Flow
  registry.register(conditionFlexTool);
  
  console.log(`✅ ${registry.count()} ferramentas do sistema registradas`);
  
  return registry;
}
