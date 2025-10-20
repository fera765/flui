/**
 * FLUI - Reference Resolver
 * 
 * Resolve referências {{nodeId.key}} nos inputs dos nodes
 * Suporta:
 * - Referências simples: {{node-1.email}}
 * - Referências aninhadas: {{node-1.user.name}}
 * - Múltiplas referências: "Olá {{node-1.nome}}, email: {{node-1.email}}"
 * - Arrays e objetos recursivos
 */

import { NodeOutput } from './nodeDataTypes.js';

export interface ResolverContext {
  nodeOutputs: Map<string, NodeOutput>;
}

/**
 * Resolve todas as referências em um objeto de configuração
 */
export function resolveReferences(
  config: Record<string, any>,
  context: ResolverContext
): Record<string, any> {
  const resolved: Record<string, any> = {};

  for (const [key, value] of Object.entries(config)) {
    // Não resolver campos internos ou metadados
    if (key === 'inputConfig' || key === 'toolId' || key === 'nodeId') {
      resolved[key] = value;
      continue;
    }
    
    resolved[key] = resolveValue(value, context);
  }

  return resolved;
}

/**
 * Resolve um valor individual (string, object, array, etc)
 */
function resolveValue(value: any, context: ResolverContext): any {
  if (typeof value === 'string') {
    return resolveString(value, context);
  }

  if (Array.isArray(value)) {
    return value.map((item) => resolveValue(item, context));
  }

  if (typeof value === 'object' && value !== null) {
    const resolved: Record<string, any> = {};
    for (const [k, v] of Object.entries(value)) {
      resolved[k] = resolveValue(v, context);
    }
    return resolved;
  }

  return value;
}

/**
 * Resolve referências em uma string
 * Formato: {{nodeId.key}} ou múltiplas
 */
function resolveString(str: string, context: ResolverContext): any {
  // Se é apenas uma referência (sem texto ao redor), retornar o valor direto
  const singleRefMatch = str.match(/^\{\{([^}]+)\}\}$/);
  if (singleRefMatch) {
    return resolveReference(singleRefMatch[1], context);
  }

  // Se tem múltiplas referências ou texto ao redor, substituir todas
  if (str.includes('{{')) {
    return str.replace(/\{\{([^}]+)\}\}/g, (match, ref) => {
      const resolved = resolveReference(ref, context);
      return String(resolved);
    });
  }

  return str;
}

/**
 * Resolve uma referência específica: "nodeId.key.subkey"
 */
function resolveReference(ref: string, context: ResolverContext): any {
  const parts = ref.trim().split('.');
  if (parts.length < 2) {
    console.warn(`⚠️  Referência inválida (formato esperado: nodeId.key): ${ref}`);
    return `{{${ref}}}`;
  }

  const [nodeId, ...keyPath] = parts;

  // Buscar output do node
  const nodeOutput = context.nodeOutputs.get(nodeId);
  if (!nodeOutput || nodeOutput.length === 0) {
    console.warn(`⚠️  Node não encontrado ou sem output: ${nodeId}`);
    return `{{${ref}}}`;
  }

  // Pegar o último item do output (mais recente)
  const outputData = nodeOutput[nodeOutput.length - 1].json;

  // Navegar pelo caminho de chaves
  let value: any = outputData;
  for (const key of keyPath) {
    if (value && typeof value === 'object' && key in value) {
      value = value[key];
    } else {
      console.warn(`⚠️  Chave não encontrada: ${keyPath.join('.')} em node ${nodeId}`);
      return `{{${ref}}}`;
    }
  }

  return value;
}

/**
 * Verifica se um valor contém referências
 */
export function hasReferences(value: any): boolean {
  if (typeof value === 'string') {
    return /\{\{[^}]+\}\}/.test(value);
  }

  if (Array.isArray(value)) {
    return value.some(hasReferences);
  }

  if (typeof value === 'object' && value !== null) {
    return Object.values(value).some(hasReferences);
  }

  return false;
}

/**
 * Extrai todas as referências de um valor
 */
export function extractReferences(value: any): string[] {
  const refs: string[] = [];

  if (typeof value === 'string') {
    const matches = value.matchAll(/\{\{([^}]+)\}\}/g);
    for (const match of matches) {
      refs.push(match[1]);
    }
  } else if (Array.isArray(value)) {
    for (const item of value) {
      refs.push(...extractReferences(item));
    }
  } else if (typeof value === 'object' && value !== null) {
    for (const v of Object.values(value)) {
      refs.push(...extractReferences(v));
    }
  }

  return refs;
}

/**
 * Valida se todas as referências podem ser resolvidas
 */
export function validateReferences(
  config: Record<string, any>,
  context: ResolverContext
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const refs = extractReferences(config);

  for (const ref of refs) {
    const parts = ref.trim().split('.');
    if (parts.length < 2) {
      errors.push(`Referência inválida (formato esperado: nodeId.key): ${ref}`);
      continue;
    }

    const [nodeId] = parts;
    const nodeOutput = context.nodeOutputs.get(nodeId);
    if (!nodeOutput || nodeOutput.length === 0) {
      errors.push(`Node não encontrado: ${nodeId} (referência: ${ref})`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
