/**
 * FLUI - Flow Engine Types
 * 
 * Tipos para o sistema de fluxos dinâmicos
 */

import { z } from 'zod';

// ============= FLOW NODE TYPES =============

export const FlowNodeTypeSchema = z.enum([
  'tool',            // Executa uma ferramenta do registry
  'agent',           // ✅ Executa um agente com LLM
  'condition',       // Condicional (if/else)
  'loop',            // Loop sobre array
  'parallel',        // Execução paralela
  'delay',           // Pausa/delay
  'merge',           // Merge de resultados
  'manual-trigger',  // Trigger manual
  'cron-trigger',    // Trigger agendado
  'webhook-trigger', // Trigger via HTTP
]);

export type FlowNodeType = z.infer<typeof FlowNodeTypeSchema>;

export const FlowNodeSchema = z.object({
  id: z.string(),
  type: FlowNodeTypeSchema,
  name: z.string(),
  description: z.string().optional(),
  config: z.record(z.any()),
  position: z.object({
    x: z.number(),
    y: z.number(),
  }).optional(),
});

export type FlowNode = z.infer<typeof FlowNodeSchema>;

// ============= FLOW EDGE =============

export const FlowEdgeSchema = z.object({
  id: z.string(),
  source: z.string(), // ID do nó de origem
  target: z.string(), // ID do nó de destino
  condition: z.string().optional(), // Condição para seguir este edge
  label: z.string().optional(),
});

export type FlowEdge = z.infer<typeof FlowEdgeSchema>;

// ============= FLOW DEFINITION =============

export const FlowDefinitionSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  version: z.string().default('1.0.0'),
  nodes: z.array(FlowNodeSchema),
  edges: z.array(FlowEdgeSchema),
  startNodeId: z.string(),
  variables: z.record(z.any()).optional(), // Variáveis globais do fluxo
  settings: z.object({
    timeout: z.number().optional(),
    maxConcurrency: z.number().optional(),
    retryPolicy: z.object({
      maxRetries: z.number(),
      backoff: z.enum(['linear', 'exponential']),
    }).optional(),
  }).optional(),
  metadata: z.object({
    createdAt: z.string(),
    updatedAt: z.string(),
    author: z.string().optional(),
    tags: z.array(z.string()).optional(),
  }).optional(),
});

export type FlowDefinition = z.infer<typeof FlowDefinitionSchema>;

// ============= EXECUTION STATUS =============

export const FlowExecutionStatusSchema = z.enum([
  'pending',
  'running',
  'completed',
  'failed',
  'cancelled',
]);

export type FlowExecutionStatus = z.infer<typeof FlowExecutionStatusSchema>;

// ============= EXECUTION LOG =============

export const FlowExecutionLogSchema = z.object({
  timestamp: z.string(),
  nodeId: z.string(),
  nodeName: z.string(),
  status: FlowExecutionStatusSchema,
  message: z.string(),
  data: z.any().optional(),
  error: z.string().optional(),
});

export type FlowExecutionLog = z.infer<typeof FlowExecutionLogSchema>;

// ============= FLOW EXECUTION =============

export const FlowExecutionSchema = z.object({
  id: z.string(),
  flowId: z.string(),
  status: FlowExecutionStatusSchema,
  startedAt: z.string(),
  completedAt: z.string().optional(),
  logs: z.array(FlowExecutionLogSchema),
  nodeResults: z.record(z.any()),
  result: z.any().optional(),
  error: z.string().optional(),
});

export type FlowExecution = z.infer<typeof FlowExecutionSchema>;

// ============= FLOW VALIDATION =============

export interface FlowValidationResult {
  valid: boolean;
  errors: Array<{
    nodeId?: string;
    message: string;
    severity: 'error' | 'warning';
  }>;
}

// ============= FLOW EXPORT/IMPORT =============

export interface FlowExportFormat {
  version: string;
  format: 'json' | 'yaml';
  flow: FlowDefinition;
  dependencies?: string[]; // IDs de ferramentas necessárias
}
