"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TriggerConfigSchema = exports.TriggerTypeSchema = exports.AutomationExecutionSchema = exports.ExecutionLogSchema = exports.ExecutionStatusSchema = exports.AutomationSchema = exports.AutomationEdgeSchema = exports.AutomationNodeSchema = exports.AutomationNodeTypeSchema = void 0;
var zod_1 = require("zod");
// ============= AUTOMATION NODE =============
// ✅ ALIGNED WITH FlowNodeTypeSchema from core/flowTypes.ts
exports.AutomationNodeTypeSchema = zod_1.z.enum([
    // Core node types
    'tool', // Executa uma ferramenta do registry
    'agent', // Executa um agente LLM
    'condition', // Condicional (if/else)
    'loop', // Loop sobre array
    'parallel', // Execução paralela
    'delay', // Pausa/delay
    'merge', // Merge de resultados
    // Trigger types
    'manual-trigger', // Trigger manual
    'cron-trigger', // Trigger agendado (cron)
    'webhook-trigger', // Trigger via HTTP webhook
    // Legacy types (mantidos para compatibilidade)
    'trigger', // Trigger genérico (legacy)
    'mcp_tool', // Tool de MCP (legacy)
    'http_request', // HTTP request (legacy)
    'file_operation', // File operation (legacy)
    'data_transform', // Data transform (legacy)
    'webhook', // Webhook genérico (legacy)
    'system', // System node (legacy)
]);
exports.AutomationNodeSchema = zod_1.z.object({
    id: zod_1.z.string(),
    type: exports.AutomationNodeTypeSchema,
    name: zod_1.z.string(),
    description: zod_1.z.string().optional(),
    config: zod_1.z.record(zod_1.z.any()),
    position: zod_1.z.object({
        x: zod_1.z.number(),
        y: zod_1.z.number(),
    }).optional(),
    nextNodes: zod_1.z.array(zod_1.z.string()).default([]),
    // ✅ FIX: Node identifiers for configuration
    agentId: zod_1.z.string().optional(),
    toolId: zod_1.z.string().optional(),
    mcpId: zod_1.z.string().optional(),
    mcpToolId: zod_1.z.string().optional(),
});
// ============= AUTOMATION =============
exports.AutomationEdgeSchema = zod_1.z.object({
    id: zod_1.z.string(),
    source: zod_1.z.string(),
    target: zod_1.z.string(),
});
exports.AutomationSchema = zod_1.z.object({
    id: zod_1.z.string(),
    name: zod_1.z.string(),
    description: zod_1.z.string(),
    nodes: zod_1.z.array(exports.AutomationNodeSchema),
    edges: zod_1.z.array(exports.AutomationEdgeSchema).optional().default([]),
    startNodeId: zod_1.z.string(),
    enabled: zod_1.z.boolean().default(true),
    continuousExecution: zod_1.z.boolean().optional(), // 🔁 Execução contínua
    schedule: zod_1.z.string().optional(), // Cron expression
    version: zod_1.z.string().optional().default('2.0.0'),
    createdAt: zod_1.z.string(),
    updatedAt: zod_1.z.string(),
    lastRun: zod_1.z.string().optional(),
    runCount: zod_1.z.number().default(0),
    metadata: zod_1.z.object({
        createdAt: zod_1.z.string(),
        updatedAt: zod_1.z.string(),
        lastRunAt: zod_1.z.string().optional(),
    }).optional(),
});
// ============= EXECUTION =============
exports.ExecutionStatusSchema = zod_1.z.enum([
    'pending',
    'running',
    'completed',
    'failed',
    'cancelled',
]);
exports.ExecutionLogSchema = zod_1.z.object({
    timestamp: zod_1.z.string(),
    nodeId: zod_1.z.string(),
    nodeName: zod_1.z.string(),
    status: exports.ExecutionStatusSchema,
    message: zod_1.z.string(),
    data: zod_1.z.any().optional(),
    error: zod_1.z.string().optional(),
});
exports.AutomationExecutionSchema = zod_1.z.object({
    id: zod_1.z.string(),
    automationId: zod_1.z.string(),
    status: exports.ExecutionStatusSchema,
    startedAt: zod_1.z.string(),
    completedAt: zod_1.z.string().optional(),
    logs: zod_1.z.array(exports.ExecutionLogSchema),
    result: zod_1.z.any().optional(),
    error: zod_1.z.string().optional(),
    success: zod_1.z.boolean().optional(),
    executionTime: zod_1.z.number().optional(),
});
// ============= TRIGGER TYPES =============
exports.TriggerTypeSchema = zod_1.z.enum([
    'manual',
    'schedule',
    'webhook',
    'file_watch',
    'email',
]);
exports.TriggerConfigSchema = zod_1.z.object({
    type: exports.TriggerTypeSchema,
    config: zod_1.z.record(zod_1.z.any()),
});
