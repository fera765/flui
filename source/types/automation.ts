import { z } from 'zod';

// ============= AUTOMATION NODE =============
export const AutomationNodeTypeSchema = z.enum([
  'trigger',
  'agent',
  'mcp_tool',
  'condition',
  'loop',
  'delay',
  'http_request',
  'file_operation',
  'data_transform',
]);

export type AutomationNodeType = z.infer<typeof AutomationNodeTypeSchema>;

export const AutomationNodeSchema = z.object({
  id: z.string(),
  type: AutomationNodeTypeSchema,
  name: z.string(),
  config: z.record(z.any()),
  position: z.object({
    x: z.number(),
    y: z.number(),
  }).optional(),
  nextNodes: z.array(z.string()).default([]),
});

export type AutomationNode = z.infer<typeof AutomationNodeSchema>;

// ============= AUTOMATION =============
export const AutomationSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  nodes: z.array(AutomationNodeSchema),
  startNodeId: z.string(),
  enabled: z.boolean().default(true),
  schedule: z.string().optional(), // Cron expression
  createdAt: z.string(),
  updatedAt: z.string(),
  lastRun: z.string().optional(),
  runCount: z.number().default(0),
});

export type Automation = z.infer<typeof AutomationSchema>;

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
