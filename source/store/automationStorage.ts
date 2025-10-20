import Conf from 'conf';
import { nanoid } from 'nanoid';
import { Automation, AutomationExecution, AutomationSchema } from '../types/automation.js';

const config = new Conf({
  projectName: 'flui',
});

/**
 * Valida e normaliza uma automação antes de salvar
 * Garante que todos os campos obrigatórios existem com defaults apropriados
 */
function validateAndNormalizeAutomation(automation: any): Automation {
  console.log('🔍 [Storage] Validando automação:', automation.id || 'nova');
  
  // Garantir campos básicos
  const normalized: any = {
    id: automation.id || nanoid(),
    name: automation.name || 'Nova Automação',
    description: automation.description || '',
    nodes: Array.isArray(automation.nodes) ? automation.nodes : [],
    edges: Array.isArray(automation.edges) ? automation.edges : [],
    startNodeId: automation.startNodeId || (automation.nodes?.[0]?.id) || '',
    enabled: automation.enabled !== undefined ? automation.enabled : true,
    schedule: automation.schedule || undefined,
    version: automation.version || '2.0.0',
    createdAt: automation.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(), // Sempre atualiza
    lastRun: automation.lastRun || undefined,
    runCount: automation.runCount || 0,
    metadata: automation.metadata || {
      createdAt: automation.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  };
  
  // Garantir que cada node tem campos necessários
  normalized.nodes = normalized.nodes.map((node: any) => ({
    id: node.id || nanoid(),
    type: node.type || 'trigger',
    name: node.name || 'Node',
    description: node.description || '',
    config: node.config || {},
    position: node.position || { x: 0, y: 0 },
    nextNodes: Array.isArray(node.nextNodes) ? node.nextNodes : [],
  }));
  
  // Garantir que cada edge tem id
  normalized.edges = normalized.edges.map((edge: any, index: number) => ({
    id: edge.id || `edge-${index}`,
    source: edge.source || edge.from || '',
    target: edge.target || edge.to || '',
  }));
  
  // Validar com Zod
  try {
    return AutomationSchema.parse(normalized);
  } catch (error: any) {
    console.error('❌ [Storage] Erro de validação:', error);
    // Retornar versão normalizada mesmo com erro de validação
    // para evitar perda de dados
    return normalized as Automation;
  }
}

/**
 * Migra automação de schema antigo para novo
 * Garante compatibilidade com versões anteriores
 */
function migrateAutomation(automation: any): Automation {
  console.log('🔄 [Storage] Migrando automação:', automation.id);
  
  // Se já está na versão 2.0.0, apenas normaliza
  if (automation.version === '2.0.0') {
    return validateAndNormalizeAutomation(automation);
  }
  
  // Migration de versão 1.x para 2.0
  const migrated: any = {
    ...automation,
    version: '2.0.0',
    edges: automation.edges || automation.connections || [],
    startNodeId: automation.startNodeId || automation.nodes?.[0]?.id || '',
    metadata: automation.metadata || {
      createdAt: automation.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  };
  
  console.log('✅ [Storage] Migração concluída');
  return validateAndNormalizeAutomation(migrated);
}

// ============= AUTOMATIONS =============
export const getAutomations = (): Automation[] => {
  const automations = (config.get('automations') as any[]) || [];
  // Migrar cada automação ao carregar
  return automations.map(a => migrateAutomation(a));
};

export const getAutomation = (id: string): Automation | null => {
  const automations = config.get('automations') as any[];
  if (!automations) return null;
  
  const automation = automations.find((a) => a.id === id);
  if (!automation) return null;
  
  // Migrar ao carregar
  return migrateAutomation(automation);
};

export const saveAutomation = (automation: any): Automation => {
  console.log('💾 [Storage] Salvando automação:', automation.id || 'nova');
  
  // Validar e normalizar antes de salvar
  const validated = validateAndNormalizeAutomation(automation);
  
  const automations = (config.get('automations') as any[]) || [];
  const index = automations.findIndex((a) => a.id === validated.id);
  
  if (index >= 0) {
    console.log('📝 [Storage] Atualizando automação existente');
    automations[index] = validated;
  } else {
    console.log('✨ [Storage] Criando nova automação');
    automations.push(validated);
  }
  
  config.set('automations', automations);
  console.log('✅ [Storage] Automação salva com sucesso');
  
  return validated;
};

export const deleteAutomation = (id: string): void => {
  const automations = getAutomations();
  config.set(
    'automations',
    automations.filter((a) => a.id !== id)
  );
};

// ============= EXECUTIONS =============
export const getExecutions = (): AutomationExecution[] => {
  return (config.get('executions') as AutomationExecution[]) || [];
};

export const getExecution = (id: string): AutomationExecution | null => {
  const executions = getExecutions();
  return executions.find((e) => e.id === id) || null;
};

export const saveExecution = (execution: AutomationExecution): void => {
  const executions = getExecutions();
  const index = executions.findIndex((e) => e.id === execution.id);
  if (index >= 0) {
    executions[index] = execution;
  } else {
    executions.push(execution);
  }
  // Manter apenas últimas 100 execuções
  if (executions.length > 100) {
    executions.splice(0, executions.length - 100);
  }
  config.set('executions', executions);
};

export const getExecutionsByAutomation = (automationId: string): AutomationExecution[] => {
  const executions = getExecutions();
  return executions.filter((e) => e.automationId === automationId);
};
