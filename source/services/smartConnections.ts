/**
 * FLUI - Smart Connections System
 * 
 * Sistema inteligente para auto-detecção de tipos e conexões entre nós
 * Preenche automaticamente parâmetros baseado em outputs de nós anteriores
 */

import { getToolRegistry } from '../core/toolRegistry.js';

export interface NodeOutput {
  nodeId: string;
  toolId: string;
  outputSchema: any;
  lastResult?: any;
}

export interface NodeInput {
  nodeId: string;
  toolId: string;
  params: any[];
}

export interface ConnectionSuggestion {
  sourceNodeId: string;
  targetNodeId: string;
  mappings: Array<{
    sourceField: string;
    targetParam: string;
    confidence: number; // 0-1
    reason: string;
  }>;
}

/**
 * Analisa saídas de um nó e sugere mapeamentos para o próximo
 */
export function suggestConnections(
  sourceNode: NodeOutput,
  targetNode: NodeInput
): ConnectionSuggestion {
  const mappings: Array<{
    sourceField: string;
    targetParam: string;
    confidence: number;
    reason: string;
  }> = [];

  // Obter schema de saída do nó fonte
  const registry = getToolRegistry();
  const sourceTool = registry.get(sourceNode.toolId);
  const targetTool = registry.get(targetNode.toolId);

  if (!sourceTool || !targetTool) {
    return {
      sourceNodeId: sourceNode.nodeId,
      targetNodeId: targetNode.nodeId,
      mappings: [],
    };
  }

  // Analisar cada parâmetro do nó alvo
  for (const param of targetNode.params) {
    const paramKey = param.key || param.name;
    const paramType = param.type;

    // Buscar campos compatíveis no output do nó fonte
    const sourceSchema = sourceTool.output?.schema || {};

    // Regras de matching inteligente
    const suggestions = findCompatibleFields(
      sourceSchema,
      sourceNode.lastResult,
      paramKey,
      paramType,
      sourceNode.toolId,
      targetNode.toolId
    );

    if (suggestions.length > 0) {
      // Pegar a melhor sugestão
      const best = suggestions[0];
      mappings.push({
        sourceField: best.field,
        targetParam: paramKey,
        confidence: best.confidence,
        reason: best.reason,
      });
    }
  }

  return {
    sourceNodeId: sourceNode.nodeId,
    targetNodeId: targetNode.nodeId,
    mappings,
  };
}

/**
 * Encontra campos compatíveis entre source e target
 */
function findCompatibleFields(
  sourceSchema: any,
  sourceResult: any,
  targetParamKey: string,
  targetParamType: string,
  sourceToolId: string,
  targetToolId: string
): Array<{ field: string; confidence: number; reason: string }> {
  const suggestions: Array<{ field: string; confidence: number; reason: string }> = [];

  // Padrões especiais conhecidos
  const specialPatterns = getSpecialPatterns(sourceToolId, targetToolId);
  if (specialPatterns.length > 0) {
    return specialPatterns;
  }

  // Buscar em sourceSchema
  for (const [field, type] of Object.entries(sourceSchema)) {
    let confidence = 0;
    let reason = '';

    // Match exato de nome
    if (field.toLowerCase() === targetParamKey.toLowerCase()) {
      confidence = 1.0;
      reason = 'Nome exato';
    }
    // Match parcial de nome
    else if (field.toLowerCase().includes(targetParamKey.toLowerCase()) ||
             targetParamKey.toLowerCase().includes(field.toLowerCase())) {
      confidence = 0.8;
      reason = 'Nome similar';
    }
    // Match de tipo
    else if (type === targetParamType) {
      confidence = 0.5;
      reason = 'Tipo compatível';
    }

    // Bonus por padrões comuns
    if (isCommonPattern(field, targetParamKey)) {
      confidence += 0.2;
      reason += ' (padrão comum)';
    }

    if (confidence > 0) {
      suggestions.push({ field, confidence: Math.min(confidence, 1.0), reason });
    }
  }

  // Se houver resultado real, analisar também
  if (sourceResult && typeof sourceResult === 'object') {
    for (const field of Object.keys(sourceResult)) {
      if (!suggestions.find(s => s.field === field)) {
        let confidence = 0;
        let reason = '';

        if (field.toLowerCase() === targetParamKey.toLowerCase()) {
          confidence = 0.9;
          reason = 'Nome exato (resultado real)';
        } else if (field.toLowerCase().includes(targetParamKey.toLowerCase())) {
          confidence = 0.7;
          reason = 'Nome similar (resultado real)';
        }

        if (confidence > 0) {
          suggestions.push({ field, confidence, reason });
        }
      }
    }
  }

  // Ordenar por confidence
  return suggestions.sort((a, b) => b.confidence - a.confidence);
}

/**
 * Padrões especiais para tools específicas
 */
function getSpecialPatterns(
  sourceToolId: string,
  targetToolId: string
): Array<{ field: string; confidence: number; reason: string }> {
  const patterns: Array<{ field: string; confidence: number; reason: string }> = [];

  // Webhook -> Condição Universal
  if (sourceToolId === 'webhook-trigger' && targetToolId === 'universal-condition') {
    patterns.push({
      field: 'data',
      confidence: 1.0,
      reason: 'Webhook data para condição (padrão)',
    });
  }

  // Condição -> Agente (usar branch result)
  if (sourceToolId === 'universal-condition' && targetToolId === 'agent-executor') {
    patterns.push({
      field: 'input',
      confidence: 0.9,
      reason: 'Input da condição como contexto para agente',
    });
  }

  // Agente -> Webhook Response
  if (sourceToolId === 'agent-executor' && targetToolId === 'webhook-response') {
    patterns.push({
      field: 'response',
      confidence: 1.0,
      reason: 'Resposta do agente para webhook (padrão)',
    });
  }

  // HTTP Request -> qualquer tool (usar body)
  if (sourceToolId === 'http-request') {
    patterns.push({
      field: 'body',
      confidence: 0.8,
      reason: 'Corpo da resposta HTTP',
    });
  }

  return patterns;
}

/**
 * Verifica se é um padrão comum de nomenclatura
 */
function isCommonPattern(sourceField: string, targetField: string): boolean {
  const commonMappings: Record<string, string[]> = {
    'message': ['text', 'content', 'msg', 'response', 'input'],
    'response': ['output', 'result', 'answer', 'reply'],
    'data': ['input', 'payload', 'content'],
    'result': ['output', 'data'],
    'id': ['userId', 'agentId', 'nodeId'],
    'name': ['username', 'agentName', 'title'],
  };

  const lowerSource = sourceField.toLowerCase();
  const lowerTarget = targetField.toLowerCase();

  for (const [pattern, matches] of Object.entries(commonMappings)) {
    if (lowerSource.includes(pattern) && matches.some(m => lowerTarget.includes(m))) {
      return true;
    }
    if (lowerTarget.includes(pattern) && matches.some(m => lowerSource.includes(m))) {
      return true;
    }
  }

  return false;
}

/**
 * Aplica mapeamentos automáticos aos parâmetros de um nó
 */
export function autoFillParameters(
  targetParams: any,
  connectionSuggestion: ConnectionSuggestion,
  sourceNodeData: any
): any {
  const filled = { ...targetParams };

  for (const mapping of connectionSuggestion.mappings) {
    // Só aplicar se confidence >= 0.7 e parâmetro não está preenchido
    if (mapping.confidence >= 0.7 && !filled[mapping.targetParam]) {
      const value = getNestedValue(sourceNodeData, mapping.sourceField);
      if (value !== undefined) {
        filled[mapping.targetParam] = value;
      }
    }
  }

  return filled;
}

/**
 * Obtém valor aninhado de um objeto usando dot notation
 */
function getNestedValue(obj: any, path: string): any {
  if (!obj || typeof obj !== 'object') return undefined;
  
  const parts = path.split('.');
  let current = obj;
  
  for (const part of parts) {
    if (current[part] === undefined) return undefined;
    current = current[part];
  }
  
  return current;
}

/**
 * Gera expressão de template para conexão
 */
export function generateTemplateExpression(
  sourceNodeId: string,
  sourceField: string
): string {
  return `{{ nodes.${sourceNodeId}.${sourceField} }}`;
}

/**
 * Analisa todos os nós conectados e sugere auto-preenchimentos
 */
export function analyzeWorkflowConnections(
  nodes: Array<{ id: string; toolId: string; config?: any }>,
  edges: Array<{ source: string; target: string }>
): Map<string, any> {
  const suggestions = new Map<string, any>();

  for (const edge of edges) {
    const sourceNode = nodes.find(n => n.id === edge.source);
    const targetNode = nodes.find(n => n.id === edge.target);

    if (!sourceNode || !targetNode) continue;

    const registry = getToolRegistry();
    const targetTool = registry.get(targetNode.toolId);

    if (!targetTool) continue;

    const suggestion = suggestConnections(
      {
        nodeId: sourceNode.id,
        toolId: sourceNode.toolId,
        outputSchema: {},
        lastResult: sourceNode.config,
      },
      {
        nodeId: targetNode.id,
        toolId: targetNode.toolId,
        params: targetTool.params,
      }
    );

    if (suggestion.mappings.length > 0) {
      suggestions.set(targetNode.id, suggestion);
    }
  }

  return suggestions;
}
