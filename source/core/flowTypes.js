"use strict";
/**
 * FLUI - Flow Engine Types
 *
 * Tipos para o sistema de fluxos dinâmicos
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.FlowExecutionSchema = exports.FlowExecutionLogSchema = exports.FlowExecutionStatusSchema = exports.FlowDefinitionSchema = exports.FlowEdgeSchema = exports.FlowNodeSchema = exports.FlowNodeTypeSchema = void 0;
var zod_1 = require("zod");
// ============= FLOW NODE TYPES =============
exports.FlowNodeTypeSchema = zod_1.z.enum([
    'tool', // Executa uma ferramenta do registry
    'condition', // Condicional (if/else)
    'loop', // Loop sobre array
    'parallel', // Execução paralela
    'delay', // Pausa/delay
    'merge', // Merge de resultados
    'manual-trigger', // Trigger manual
    'cron-trigger', // Trigger agendado
    'webhook-trigger', // Trigger via HTTP
]);
exports.FlowNodeSchema = zod_1.z.object({
    id: zod_1.z.string(),
    type: exports.FlowNodeTypeSchema,
    name: zod_1.z.string(),
    description: zod_1.z.string().optional(),
    config: zod_1.z.record(zod_1.z.any()),
    position: zod_1.z.object({
        x: zod_1.z.number(),
        y: zod_1.z.number(),
    }).optional(),
});
// ============= FLOW EDGE =============
exports.FlowEdgeSchema = zod_1.z.object({
    id: zod_1.z.string(),
    source: zod_1.z.string(), // ID do nó de origem
    target: zod_1.z.string(), // ID do nó de destino
    condition: zod_1.z.string().optional(), // Condição para seguir este edge
    label: zod_1.z.string().optional(),
});
// ============= FLOW DEFINITION =============
exports.FlowDefinitionSchema = zod_1.z.object({
    id: zod_1.z.string(),
    name: zod_1.z.string(),
    description: zod_1.z.string(),
    version: zod_1.z.string().default('1.0.0'),
    nodes: zod_1.z.array(exports.FlowNodeSchema),
    edges: zod_1.z.array(exports.FlowEdgeSchema),
    startNodeId: zod_1.z.string(),
    variables: zod_1.z.record(zod_1.z.any()).optional(), // Variáveis globais do fluxo
    settings: zod_1.z.object({
        timeout: zod_1.z.number().optional(),
        maxConcurrency: zod_1.z.number().optional(),
        retryPolicy: zod_1.z.object({
            maxRetries: zod_1.z.number(),
            backoff: zod_1.z.enum(['linear', 'exponential']),
        }).optional(),
    }).optional(),
    metadata: zod_1.z.object({
        createdAt: zod_1.z.string(),
        updatedAt: zod_1.z.string(),
        author: zod_1.z.string().optional(),
        tags: zod_1.z.array(zod_1.z.string()).optional(),
    }).optional(),
});
// ============= EXECUTION STATUS =============
exports.FlowExecutionStatusSchema = zod_1.z.enum([
    'pending',
    'running',
    'completed',
    'failed',
    'cancelled',
]);
// ============= EXECUTION LOG =============
exports.FlowExecutionLogSchema = zod_1.z.object({
    timestamp: zod_1.z.string(),
    nodeId: zod_1.z.string(),
    nodeName: zod_1.z.string(),
    status: exports.FlowExecutionStatusSchema,
    message: zod_1.z.string(),
    data: zod_1.z.any().optional(),
    error: zod_1.z.string().optional(),
});
// ============= FLOW EXECUTION =============
exports.FlowExecutionSchema = zod_1.z.object({
    id: zod_1.z.string(),
    flowId: zod_1.z.string(),
    status: exports.FlowExecutionStatusSchema,
    startedAt: zod_1.z.string(),
    completedAt: zod_1.z.string().optional(),
    logs: zod_1.z.array(exports.FlowExecutionLogSchema),
    nodeResults: zod_1.z.record(zod_1.z.any()),
    result: zod_1.z.any().optional(),
    error: zod_1.z.string().optional(),
});
