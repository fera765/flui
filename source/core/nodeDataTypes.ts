/**
 * FLUI - Node Data Types (Padrão Universal)
 * 
 * Sistema padronizado de Input/Output para todos os nodes
 * Garante comunicação consistente e rastreável entre nodes
 */

import { z } from 'zod';

// ============= PADRÃO BASE DE DADOS =============

/**
 * Metadados obrigatórios para rastreabilidade
 */
export const NodeMetaSchema = z.object({
  nodeId: z.string(),
  nodeName: z.string().optional(),
  timestamp: z.number(),
  executionId: z.string().optional(),
});

export type NodeMeta = z.infer<typeof NodeMetaSchema>;

/**
 * Estrutura padrão de dados de um node
 * 
 * Formato universal:
 * [
 *   {
 *     json: { chave1: valor1, chave2: valor2, ... },
 *     meta: { nodeId: "abc", timestamp: 123456789 }
 *   }
 * ]
 */
export const NodeDataItemSchema = z.object({
  json: z.record(z.any()), // Dados livres e dinâmicos
  meta: NodeMetaSchema,    // Metadados obrigatórios
});

export type NodeDataItem = z.infer<typeof NodeDataItemSchema>;

/**
 * Formato padrão de saída de qualquer node
 * Sempre um array de itens
 */
export const NodeOutputSchema = z.array(NodeDataItemSchema);

export type NodeOutput = z.infer<typeof NodeOutputSchema>;

// ============= MAPEAMENTO DE INPUTS =============

/**
 * Configuração de mapeamento de inputs
 * Define quais chaves de quais nodes anteriores serão consumidas
 */
export interface InputMapping {
  sourceNodeId: string;      // ID do node de origem
  sourceNodeName?: string;   // Nome do node de origem (para UI)
  selectedKeys: string[];    // Chaves selecionadas do json
  mapTo?: string;            // Campo de destino (opcional)
}

/**
 * Configuração completa de inputs de um node
 */
export interface NodeInputConfig {
  mappings: InputMapping[];  // Lista de mapeamentos
  mergeStrategy?: 'merge' | 'replace' | 'array'; // Como combinar múltiplos inputs
}

// ============= HELPERS =============

/**
 * Cria um NodeDataItem padrão
 */
export function createNodeDataItem(
  json: Record<string, any>,
  nodeId: string,
  nodeName?: string,
  executionId?: string
): NodeDataItem {
  return {
    json,
    meta: {
      nodeId,
      nodeName,
      timestamp: Date.now(),
      executionId,
    },
  };
}

/**
 * Cria output inicial de um node
 */
export function createInitialOutput(nodeId: string, nodeName?: string): NodeOutput {
  return [
    createNodeDataItem({ init: true }, nodeId, nodeName || 'Start Node'),
  ];
}

/**
 * Extrai todas as chaves disponíveis de um NodeOutput
 */
export function extractAvailableKeys(output: NodeOutput): string[] {
  const allKeys = new Set<string>();
  
  output.forEach((item) => {
    Object.keys(item.json).forEach((key) => allKeys.add(key));
  });
  
  return Array.from(allKeys).sort();
}

/**
 * Aplica mapeamentos de input para criar dados de entrada de um node
 */
export function applyInputMappings(
  previousResults: Record<string, NodeOutput>,
  inputConfig: NodeInputConfig
): Record<string, any> {
  const result: Record<string, any> = {};
  
  inputConfig.mappings.forEach((mapping) => {
    const sourceOutput = previousResults[mapping.sourceNodeId];
    
    if (!sourceOutput || sourceOutput.length === 0) {
      console.warn(`Output do node ${mapping.sourceNodeId} não encontrado`);
      return;
    }
    
    // Para cada item do output do node anterior
    sourceOutput.forEach((item) => {
      mapping.selectedKeys.forEach((key) => {
        if (item.json[key] !== undefined) {
          const targetKey = mapping.mapTo || key;
          
          if (inputConfig.mergeStrategy === 'array') {
            if (!result[targetKey]) result[targetKey] = [];
            result[targetKey].push(item.json[key]);
          } else if (inputConfig.mergeStrategy === 'merge') {
            if (typeof item.json[key] === 'object' && !Array.isArray(item.json[key])) {
              result[targetKey] = { ...result[targetKey], ...item.json[key] };
            } else {
              result[targetKey] = item.json[key];
            }
          } else {
            // replace (default)
            result[targetKey] = item.json[key];
          }
        }
      });
    });
  });
  
  return result;
}

/**
 * Valida se um output está no formato correto
 */
export function validateNodeOutput(output: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!Array.isArray(output)) {
    errors.push('Output deve ser um array');
    return { valid: false, errors };
  }
  
  output.forEach((item, index) => {
    if (!item.json) {
      errors.push(`Item ${index}: campo 'json' obrigatório`);
    }
    if (!item.meta) {
      errors.push(`Item ${index}: campo 'meta' obrigatório`);
    } else {
      if (!item.meta.nodeId) {
        errors.push(`Item ${index}: meta.nodeId obrigatório`);
      }
      if (!item.meta.timestamp) {
        errors.push(`Item ${index}: meta.timestamp obrigatório`);
      }
    }
  });
  
  return { valid: errors.length === 0, errors };
}

/**
 * Converte output antigo para novo formato
 * (Compatibilidade com código legado)
 */
export function convertLegacyOutput(
  legacyOutput: any,
  nodeId: string,
  nodeName?: string
): NodeOutput {
  // Se já está no formato correto, retornar
  if (Array.isArray(legacyOutput) && legacyOutput.length > 0 && legacyOutput[0].json && legacyOutput[0].meta) {
    return legacyOutput as NodeOutput;
  }
  
  // Se é um objeto simples, converter
  if (typeof legacyOutput === 'object' && !Array.isArray(legacyOutput)) {
    return [createNodeDataItem(legacyOutput, nodeId, nodeName)];
  }
  
  // Se é um valor primitivo, encapsular
  return [createNodeDataItem({ result: legacyOutput }, nodeId, nodeName)];
}

/**
 * Mescla múltiplos outputs em um único output
 */
export function mergeNodeOutputs(outputs: NodeOutput[]): NodeOutput {
  return outputs.flat();
}

/**
 * Filtra output por chaves específicas
 */
export function filterOutputKeys(output: NodeOutput, keys: string[]): NodeOutput {
  return output.map((item) => ({
    json: Object.keys(item.json)
      .filter((key) => keys.includes(key))
      .reduce((obj, key) => {
        obj[key] = item.json[key];
        return obj;
      }, {} as Record<string, any>),
    meta: item.meta,
  }));
}
