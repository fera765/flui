/**
 * FLUI - Node Output Extractor
 * 
 * Extrai chaves de output disponíveis de cada tipo de tool
 * Baseado em metadados reais das tools e execuções anteriores
 */

import { getToolRegistry } from '../core/toolRegistry.js';
import { Tool } from '../core/types.js';

/**
 * Extrai chaves de output de um node baseado em sua tool
 */
export function extractNodeOutputKeys(node: any): string[] {
  // Node pode ter estrutura antiga (data) ou nova (config diretamente)
  const nodeData = node.data || node;
  const toolId = nodeData.toolId || node.config?.toolId;
  
  if (!toolId) {
    return ['output', 'result', 'data'];
  }
  
  // Buscar tool no registry
  const registry = getToolRegistry();
  const tool = registry.get(toolId);
  
  if (!tool) {
    console.warn(`⚠️  Tool não encontrada: ${toolId}`);
    return ['output', 'result', 'data'];
  }
  
  // Tool pode ter metadados com outputs definidos
  // Por enquanto, usar padrões baseados no tipo
  return getDefaultOutputKeys(toolId);
}

/**
 * Outputs padrão por tipo de tool (baseado em implementações reais)
 */
function getDefaultOutputKeys(toolId: string): string[] {
  const defaults: Record<string, string[]> = {
    // Webhooks
    'webhook-trigger': ['data', 'message', 'timestamp', 'source', 'rawData'],
    'webhook-response': ['sent', 'statusCode', 'response'],
    
    // HTTP
    'http-request': ['body', 'status', 'headers', 'statusText', 'duration'],
    
    // File Operations
    'file-read': ['content', 'path', 'size', 'encoding'],
    'file-write': ['path', 'written', 'bytes'],
    'file-edit': ['path', 'modified', 'content'],
    'file-search': ['files', 'count', 'paths'],
    
    // Text Operations
    'text-search': ['matches', 'count', 'results', 'found'],
    
    // System
    'system-info': ['platform', 'arch', 'cpus', 'memory', 'uptime'],
    'shell-executor': ['stdout', 'stderr', 'exitCode', 'duration'],
    
    // Data Operations
    'data-transform': ['result', 'transformed', 'count'],
    'data-filter': ['filtered', 'count', 'items'],
    'data-merge': ['merged', 'result'],
    
    // Control Flow
    'universal-condition': ['branch', 'matched', 'input', 'conditionMatched'],
    'delay': ['delayed', 'duration', 'completedAt', 'message'],
    
    // AI/Agent
    'agent-executor': ['response', 'agentName', 'tokensUsed', 'executionTime', 'model'],
    
    // Custom
    'custom-code': ['output', 'result', 'logs', 'error'],
  };
  
  return defaults[toolId] || ['output', 'result', 'data'];
}

/**
 * Obtém exemplo de output de uma tool (para preview/documentação)
 */
export function getToolOutputExample(toolId: string): Record<string, any> {
  const examples: Record<string, Record<string, any>> = {
    'webhook-trigger': {
      data: 'Dados recebidos do webhook',
      message: 'Hello World',
      timestamp: 1234567890,
      source: 'external',
    },
    'http-request': {
      body: { success: true, data: [] },
      status: 200,
      headers: { 'content-type': 'application/json' },
      duration: 234,
    },
    'agent-executor': {
      response: 'Resposta do agente AI',
      agentName: 'GPT-4',
      tokensUsed: 150,
      executionTime: 1234,
    },
    'universal-condition': {
      branch: 'yes',
      matched: true,
      input: 'valor testado',
      conditionMatched: 'equals',
    },
    'data-transform': {
      result: { transformed: 'data' },
      transformed: true,
      count: 1,
    },
  };
  
  return examples[toolId] || { output: 'resultado', result: 'valor' };
}

/**
 * Obtém descrição de cada chave de output
 */
export function getOutputKeyDescriptions(toolId: string): Record<string, string> {
  const descriptions: Record<string, Record<string, string>> = {
    'webhook-trigger': {
      data: 'Dados principais recebidos',
      message: 'Mensagem do webhook',
      timestamp: 'Timestamp de recebimento',
      source: 'Origem do webhook',
    },
    'http-request': {
      body: 'Corpo da resposta',
      status: 'Código de status HTTP',
      headers: 'Cabeçalhos da resposta',
      duration: 'Duração da requisição (ms)',
    },
    'agent-executor': {
      response: 'Resposta gerada pelo agente',
      agentName: 'Nome do agente usado',
      tokensUsed: 'Tokens consumidos',
      executionTime: 'Tempo de execução (ms)',
    },
    'universal-condition': {
      branch: 'Branch que foi ativado',
      matched: 'Se a condição foi satisfeita',
      input: 'Valor de entrada testado',
      conditionMatched: 'Tipo de condição que matchou',
    },
  };
  
  return descriptions[toolId] || {};
}
