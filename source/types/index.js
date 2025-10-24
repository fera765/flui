"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionSchema = exports.AutomationSchema = exports.AutomationEdgeSchema = exports.AutomationNodeSchema = exports.MessageSchema = exports.MessageStatusSchema = exports.MessageRoleSchema = exports.AgentSchema = exports.MCPSchema = exports.MCPToolSchema = exports.ConfigSchema = exports.LLMConfigSchema = exports.ThemeSchema = void 0;
var zod_1 = require("zod");
// ============= TEMAS =============
exports.ThemeSchema = zod_1.z.enum(['default', 'cyberpunk', 'minimal', 'ocean']);
// ============= CONFIGURAÇÕES =============
exports.LLMConfigSchema = zod_1.z.object({
    endpoint: zod_1.z.string().url(),
    apiKey: zod_1.z.string().min(1),
    model: zod_1.z.string().default('gpt-4-turbo-preview'),
    temperature: zod_1.z.number().min(0).max(2).default(0.7),
    maxTokens: zod_1.z.number().positive().default(2000),
});
exports.ConfigSchema = zod_1.z.object({
    llm: exports.LLMConfigSchema,
    theme: exports.ThemeSchema.default('default'),
    locale: zod_1.z.string().default('pt-BR'),
});
// ============= MCP (Model Context Protocol) =============
exports.MCPToolSchema = zod_1.z.object({
    id: zod_1.z.string(),
    name: zod_1.z.string(),
    description: zod_1.z.string(),
    parameters: zod_1.z.record(zod_1.z.any()),
    handler: zod_1.z.string(), // Referência para função handler
});
exports.MCPSchema = zod_1.z.object({
    id: zod_1.z.string(),
    name: zod_1.z.string(),
    description: zod_1.z.string(),
    version: zod_1.z.string(),
    server: zod_1.z.string().optional(),
    installType: zod_1.z.enum(['npx', 'npm', 'github', 'local', 'url']).optional(),
    envVars: zod_1.z.record(zod_1.z.string()).optional(), // Variáveis de ambiente do MCP
    tools: zod_1.z.array(exports.MCPToolSchema),
    enabled: zod_1.z.boolean().default(true),
    metadata: zod_1.z.object({
        createdAt: zod_1.z.string(),
        updatedAt: zod_1.z.string(),
        lastSyncedAt: zod_1.z.string().optional(),
        importedFrom: zod_1.z.string().optional(),
        installDir: zod_1.z.string().optional(),
        repo: zod_1.z.string().optional(),
        ref: zod_1.z.string().optional(),
        endpoint: zod_1.z.string().optional(),
        authType: zod_1.z.string().optional(),
        args: zod_1.z.array(zod_1.z.string()).optional(),
    }).optional(),
});
// ============= AGENTES =============
exports.AgentSchema = zod_1.z.object({
    id: zod_1.z.string(),
    name: zod_1.z.string(),
    description: zod_1.z.string(),
    systemPrompt: zod_1.z.string(),
    model: zod_1.z.string().optional(), // Modelo específico do agente
    temperature: zod_1.z.number().min(0).max(2).optional(),
    maxTokens: zod_1.z.number().optional(),
    tools: zod_1.z.array(zod_1.z.string()).optional().default([]), // IDs de ferramentas disponíveis
    mcpIds: zod_1.z.array(zod_1.z.string()).default([]), // MCPs associados
    createdAt: zod_1.z.string(),
    updatedAt: zod_1.z.string(),
    enabled: zod_1.z.boolean().default(true),
    metadata: zod_1.z.object({
        createdAt: zod_1.z.string(),
        updatedAt: zod_1.z.string(),
        executionCount: zod_1.z.number().optional(),
    }).optional(),
});
// ============= MENSAGENS =============
exports.MessageRoleSchema = zod_1.z.enum(['user', 'assistant', 'system', 'agent']);
exports.MessageStatusSchema = zod_1.z.enum(['pending', 'processing', 'completed', 'error']);
exports.MessageSchema = zod_1.z.object({
    id: zod_1.z.string(),
    role: exports.MessageRoleSchema,
    content: zod_1.z.string(),
    agentId: zod_1.z.string().optional(),
    agentName: zod_1.z.string().optional(),
    status: exports.MessageStatusSchema.default('completed'),
    timestamp: zod_1.z.string(),
    metadata: zod_1.z.record(zod_1.z.any()).optional(),
});
// ============= AUTOMAÇÕES =============
exports.AutomationNodeSchema = zod_1.z.object({
    id: zod_1.z.string(),
    type: zod_1.z.string(),
    name: zod_1.z.string(),
    description: zod_1.z.string().optional(),
    config: zod_1.z.record(zod_1.z.any()).optional(),
    position: zod_1.z.object({
        x: zod_1.z.number(),
        y: zod_1.z.number(),
    }).optional(),
    nextNodes: zod_1.z.array(zod_1.z.string()).optional(),
    data: zod_1.z.record(zod_1.z.any()).optional(),
});
exports.AutomationEdgeSchema = zod_1.z.object({
    id: zod_1.z.string(),
    source: zod_1.z.string(),
    target: zod_1.z.string(),
    sourceHandle: zod_1.z.string().optional(),
    targetHandle: zod_1.z.string().optional(),
});
exports.AutomationSchema = zod_1.z.object({
    id: zod_1.z.string(),
    name: zod_1.z.string(),
    description: zod_1.z.string(),
    nodes: zod_1.z.array(exports.AutomationNodeSchema),
    edges: zod_1.z.array(exports.AutomationEdgeSchema),
    startNodeId: zod_1.z.string().optional(),
    enabled: zod_1.z.boolean().default(true),
    continuousExecution: zod_1.z.boolean().optional(),
    schedule: zod_1.z.string().optional(),
    version: zod_1.z.string().optional(),
    createdAt: zod_1.z.string(),
    updatedAt: zod_1.z.string(),
    lastRun: zod_1.z.string().optional(),
    runCount: zod_1.z.number().optional(),
    metadata: zod_1.z.object({
        createdAt: zod_1.z.string(),
        updatedAt: zod_1.z.string(),
        lastRunAt: zod_1.z.string().optional(),
    }).optional(),
});
// ============= SESSÕES =============
exports.SessionSchema = zod_1.z.object({
    id: zod_1.z.string(),
    name: zod_1.z.string(),
    messages: zod_1.z.array(exports.MessageSchema),
    createdAt: zod_1.z.string(),
    updatedAt: zod_1.z.string(),
});
