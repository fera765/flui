import Conf from 'conf';
import { join } from 'path';
import { generateId } from '../utils/id.js';
import { Automation, AutomationExecution, AutomationSchema } from '../types/automation.js';

// 🎯 STORAGE CENTRALIZADO: workspace/storage/config.json
const STORAGE_PATH = join(process.cwd(), 'workspace', 'storage');

const config = new Conf({
  projectName: 'flui',
  cwd: STORAGE_PATH,
  configName: 'config',
});

// 🔧 INICIALIZAR STORAGE SE NÃO EXISTIR
if (!config.get('automations')) {
  config.set('automations', []);
}
if (!config.get('executions')) {
  config.set('executions', []);
}
console.log('✅ [AutomationStorage] Storage inicializado');

/**
 * Valida e normaliza uma automação antes de salvar
 * Garante que todos os campos obrigatórios existem com defaults apropriados
 */
function validateAndNormalizeAutomation(automation: any): Automation {
  // ✅ FIX: Reduzir logging verboso
  
  // Garantir campos básicos
  const normalized: any = {
    id: automation.id || generateId(),
    name: automation.name || 'Nova Automação',
    description: automation.description || '',
    nodes: Array.isArray(automation.nodes) ? automation.nodes : [],
    edges: Array.isArray(automation.edges) ? automation.edges : [],
    startNodeId: automation.startNodeId || (automation.nodes?.[0]?.id) || '',
    enabled: automation.enabled !== undefined ? automation.enabled : true,
    continuousExecution: automation.continuousExecution || false, // 🔁 Execução contínua
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
  normalized.nodes = normalized.nodes.map((node: any) => {
    // ✅ Node type já vem correto do frontend (manual-trigger, cron-trigger, etc)
    // Apenas garantir que existe um tipo válido
    let nodeType = node.type || 'tool';
    
    // ✅ REMOVIDO: Migração automática de tipos (causava problemas)
    // Os tipos agora são aceitos conforme definidos no AutomationNodeTypeSchema
    
    return {
      id: node.id || generateId(),
      type: nodeType,
      name: node.name || 'Node',
      description: node.description || '',
      config: node.config || {},
      position: node.position || { x: 0, y: 0 },
      nextNodes: Array.isArray(node.nextNodes) ? node.nextNodes : [],
      // ✅ FIX: Preserve node identifiers needed for configuration
      ...(node.agentId && { agentId: node.agentId }),
      ...(node.toolId && { toolId: node.toolId }),
      ...(node.mcpId && { mcpId: node.mcpId }),
      ...(node.mcpToolId && { mcpToolId: node.mcpToolId }),
    };
  });
  
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
function migrateAutomation(automation: any): any {
  // ✅ FIX: Se já está na versão 2.0.0, retornar sem validar novamente
  // validateAndNormalizeAutomation será chamada depois se necessário
  if (automation.version === '2.0.0') {
    return automation;
  }
  
  console.log('🔄 [Storage] Migrando automação:', automation.id, 'de versão', automation.version || '1.x', '→ 2.0.0');
  
  // Migration de versão 1.x para 2.0
  let edges = automation.edges || [];
  
  // Se não tem edges mas tem connections (formato antigo), converter
  if (edges.length === 0 && automation.connections) {
    console.log('🔄 [Storage] Convertendo connections → edges');
    edges = automation.connections.map((conn: any, index: number) => ({
      id: conn.id || `edge-${index}`,
      source: conn.from || conn.source,
      target: conn.to || conn.target,
    }));
  }
  
  const migrated: any = {
    ...automation,
    version: '2.0.0',
    edges,
    startNodeId: automation.startNodeId || automation.nodes?.[0]?.id || '',
    metadata: automation.metadata || {
      createdAt: automation.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  };
  
  // Remover campo 'connections' se existir
  delete migrated.connections;
  
  console.log('✅ [Storage] Migração concluída', { version: '2.0.0', edgesCount: edges.length });
  return migrated;
}

// ============= AUTOMATIONS =============
export const getAutomations = (): Automation[] => {
  const automations = (config.get('automations') as any[]) || [];
  // Migrar cada automação ao carregar (com tratamento de erro)
  return automations.map(a => {
    try {
      return migrateAutomation(a);
    } catch (error: any) {
      console.error(`❌ [Storage] Erro ao migrar automação ${a.id}:`, error.message);
      // Retornar automação sem migração em caso de erro
      return a as Automation;
    }
  }).filter(Boolean); // Remover nulls/undefineds
};

export const getAutomation = (id: string): Automation | null => {
  const automations = config.get('automations') as any[];
  if (!automations) return null;
  
  const automation = automations.find((a) => a.id === id);
  if (!automation) return null;
  
  console.log(`📖 [Storage] Loading automation ${id} - ${automation.nodes?.length || 0} nodes, ${automation.edges?.length || 0} edges`);
  
  // ✅ FIX: Migrar apenas se necessário
  let result = automation;
  if (automation.version !== '2.0.0') {
    result = migrateAutomation(automation);
  }
  
  // ✅ FIX: Validar UMA ÚNICA VEZ
  const validated = validateAndNormalizeAutomation(result);
  
  return validated;
};

export const saveAutomation = (automation: any): Automation => {
  console.log('💾 [Storage] Salvando automação:', automation.id || 'nova', '- Edges:', automation.edges?.length || 0);
  
  // ✅ FIX: Migrar apenas se necessário (versão antiga)
  let toSave = automation;
  if (automation.version !== '2.0.0') {
    toSave = migrateAutomation(automation);
  }
  
  // ✅ FIX: Validar e normalizar UMA ÚNICA VEZ
  const validated = validateAndNormalizeAutomation(toSave);
  
  const automations = (config.get('automations') as any[]) || [];
  const index = automations.findIndex((a) => a.id === validated.id);
  
  if (index >= 0) {
    console.log('✅ [Storage] Automação atualizada');
    automations[index] = validated;
  } else {
    console.log('✅ [Storage] Automação criada');
    automations.push(validated);
  }
  
  config.set('automations', automations);
  
  return validated;
};

export const deleteAutomation = (id: string): boolean => {
  const automations = getAutomations();
  const initialLength = automations.length;
  const filtered = automations.filter((a) => a.id !== id);
  config.set('automations', filtered);
  return filtered.length < initialLength;
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
