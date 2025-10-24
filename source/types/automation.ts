import { z } from 'zod';

// ============= AUTOMATION NODE =============
// ✅ ALIGNED WITH FlowNodeTypeSchema from core/flowTypes.ts
export const AutomationNodeTypeSchema = z.enum([
  // Core node types
  'tool',              // Executa uma ferramenta do registry
  'agent',             // Executa um agente LLM
  'condition',         // Condicional (if/else)
  'loop',              // Loop sobre array
  'parallel',          // Execução paralela
  'delay',             // Pausa/delay
  'merge',             // Merge de resultados
  
  // Trigger types
  'manual-trigger',    // Trigger manual
  'cron-trigger',      // Trigger agendado (cron)
  'webhook-trigger',   // Trigger via HTTP webhook
  
  // Legacy types (mantidos para compatibilidade)
  'trigger',           // Trigger genérico (legacy)
  'mcp_tool',          // Tool de MCP (legacy)
  'http_request',      // HTTP request (legacy)
  'file_operation',    // File operation (legacy)
  'data_transform',    // Data transform (legacy)
  'webhook',           // Webhook genérico (legacy)
  'system',            // System node (legacy)
]);

export type AutomationNodeType = z.infer<typeof AutomationNodeTypeSchema>;

export const AutomationNodeSchema = z.object({
  id: z.string(),
  type: AutomationNodeTypeSchema,
  name: z.string(),
  description: z.string().optional(),
  config: z.record(z.any()),
  position: z.object({
    x: z.number(),
    y: z.number(),
  }).optional(),
  nextNodes: z.array(z.string()).default([]),
});

export type AutomationNode = z.infer<typeof AutomationNodeSchema>;

// ============= AUTOMATION =============
export const AutomationEdgeSchema = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
});

export type AutomationEdge = z.infer<typeof AutomationEdgeSchema>;

export const AutomationSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  nodes: z.array(AutomationNodeSchema),
  edges: z.array(AutomationEdgeSchema).optional().default([]),
  startNodeId: z.string(),
  enabled: z.boolean().default(true),
  continuousExecution: z.boolean().optional(), // 🔁 Execução contínua
  schedule: z.string().optional(), // Cron expression
  version: z.string().optional().default('2.0.0'),
  createdAt: z.string(),
  updatedAt: z.string(),
  lastRun: z.string().optional(),
  runCount: z.number().default(0),
  metadata: z.object({
    createdAt: z.string(),
    updatedAt: z.string(),
    lastRunAt: z.string().optional(),
  }).optional(),
});

export type Automation = z.infer<typeof AutomationSchema> & {
  runMode?: 'once' | 'continuous'; // Legacy support para views CLI
};

// ============= EXECUTION =============
export const ExecutionStatusSchema = z.enum([
  'pending',
  'running',
  'completed',
  'failed',
  'cancelled',
]);

export type ExecutionStatus = z.infer<typeof ExecutionStatusSchema>;

export const ExecutionLogSchema = z.object({
  timestamp: z.string(),
  nodeId: z.string(),
  nodeName: z.string(),
  status: ExecutionStatusSchema,
  message: z.string(),
  data: z.any().optional(),
  error: z.string().optional(),
});

export type ExecutionLog = z.infer<typeof ExecutionLogSchema>;

export const AutomationExecutionSchema = z.object({
  id: z.string(),
  automationId: z.string(),
  status: ExecutionStatusSchema,
  startedAt: z.string(),
  completedAt: z.string().optional(),
  logs: z.array(ExecutionLogSchema),
  result: z.any().optional(),
  error: z.string().optional(),
  success: z.boolean().optional(),
  executionTime: z.number().optional(),
});

export type AutomationExecution = z.infer<typeof AutomationExecutionSchema>;

// ============= TRIGGER TYPES =============
export const TriggerTypeSchema = z.enum([
  'manual',
  'schedule',
  'webhook',
  'file_watch',
  'email',
]);

export type TriggerType = z.infer<typeof TriggerTypeSchema>;

export const TriggerConfigSchema = z.object({
  type: TriggerTypeSchema,
  config: z.record(z.any()),
});

export type TriggerConfig = z.infer<typeof TriggerConfigSchema>;
