import { z } from 'zod';

// ============= TEMAS =============
export const ThemeSchema = z.enum(['default', 'cyberpunk', 'minimal', 'ocean']);
export type Theme = z.infer<typeof ThemeSchema>;

export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
  success: string;
  error: string;
  warning: string;
  info: string;
  border: string;
}

// ============= CONFIGURAÇÕES =============
export const LLMConfigSchema = z.object({
  endpoint: z.string().url(),
  apiKey: z.string().min(1),
  model: z.string().default('gpt-4-turbo-preview'),
  temperature: z.number().min(0).max(2).default(0.7),
  maxTokens: z.number().positive().default(2000),
});

export type LLMConfig = z.infer<typeof LLMConfigSchema>;

export const ConfigSchema = z.object({
  llm: LLMConfigSchema,
  theme: ThemeSchema.default('default'),
  locale: z.string().default('pt-BR'),
});

export type Config = z.infer<typeof ConfigSchema>;

// ============= MCP (Model Context Protocol) =============
export const MCPToolSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  parameters: z.record(z.any()),
  handler: z.string(), // Referência para função handler
});

export type MCPTool = z.infer<typeof MCPToolSchema>;

export const MCPSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  version: z.string(),
  server: z.string().optional(),
  installType: z.enum(['npx', 'npm', 'github', 'local']).optional(),
  envVars: z.record(z.string()).optional(), // Variáveis de ambiente do MCP
  tools: z.array(MCPToolSchema),
  enabled: z.boolean().default(true),
  metadata: z.object({
    createdAt: z.string(),
    updatedAt: z.string(),
    lastSyncedAt: z.string().optional(),
  }).optional(),
});

export type MCP = z.infer<typeof MCPSchema>;

// ============= AGENTES =============
export const AgentSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  systemPrompt: z.string(),
  model: z.string().optional(), // Modelo específico do agente
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().optional(),
  tools: z.array(z.string()).optional().default([]), // IDs de ferramentas disponíveis
  mcpIds: z.array(z.string()).default([]), // MCPs associados
  createdAt: z.string(),
  updatedAt: z.string(),
  enabled: z.boolean().default(true),
  metadata: z.object({
    createdAt: z.string(),
    updatedAt: z.string(),
    executionCount: z.number().optional(),
  }).optional(),
});

export type Agent = z.infer<typeof AgentSchema>;

// ============= MENSAGENS =============
export const MessageRoleSchema = z.enum(['user', 'assistant', 'system', 'agent']);
export type MessageRole = z.infer<typeof MessageRoleSchema>;

export const MessageStatusSchema = z.enum(['pending', 'processing', 'completed', 'error']);
export type MessageStatus = z.infer<typeof MessageStatusSchema>;

export const MessageSchema = z.object({
  id: z.string(),
  role: MessageRoleSchema,
  content: z.string(),
  agentId: z.string().optional(),
  agentName: z.string().optional(),
  status: MessageStatusSchema.default('completed'),
  timestamp: z.string(),
  metadata: z.record(z.any()).optional(),
});

export type Message = z.infer<typeof MessageSchema>;

// ============= AUTOMAÇÕES =============
export const AutomationStepSchema = z.object({
  id: z.string(),
  type: z.enum(['agent', 'tool', 'condition', 'loop']),
  config: z.record(z.any()),
  next: z.array(z.string()).optional(),
});

export type AutomationStep = z.infer<typeof AutomationStepSchema>;

export const AutomationSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  steps: z.array(AutomationStepSchema),
  createdAt: z.string(),
  updatedAt: z.string(),
  enabled: z.boolean().default(true),
});

export type Automation = z.infer<typeof AutomationSchema>;

// ============= SESSÕES =============
export const SessionSchema = z.object({
  id: z.string(),
  name: z.string(),
  messages: z.array(MessageSchema),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Session = z.infer<typeof SessionSchema>;

// ============= COMANDOS =============
export interface Command {
  name: string;
  description: string;
  aliases?: string[];
  handler: (args: string[]) => Promise<void> | void;
}

// ============= VIEWS =============
export type View =
  | 'chat'
  | 'settings'
  | 'agents'
  | 'mcps'
  | 'automations'
  | 'sessions'
  | 'models'
  | 'theme';
