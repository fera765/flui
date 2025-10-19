/**
 * FLUI - Tool Registry System
 * Core Types Definition
 * 
 * Sistema de registro dinâmico de ferramentas
 * Superior ao N8n e AgentBuilder
 */

import { z } from 'zod';

// ============= TOOL PARAMETER TYPES =============

export const ToolParamTypeSchema = z.enum([
  'string',
  'number',
  'boolean',
  'object',
  'array',
  'file',
  'json',
]);

export type ToolParamType = z.infer<typeof ToolParamTypeSchema>;

export const ToolParamSchema = z.object({
  name: z.string(),
  type: ToolParamTypeSchema,
  description: z.string(),
  required: z.boolean().default(false),
  default: z.any().optional(),
  validation: z.function().args(z.any()).returns(z.boolean()).optional(),
  placeholder: z.string().optional(),
  options: z.array(z.any()).optional(), // Para selects/enums
});

export type ToolParam = z.infer<typeof ToolParamSchema>;

// ============= TOOL OUTPUT TYPES =============

export const ToolOutputSchema = z.object({
  type: ToolParamTypeSchema,
  description: z.string(),
  schema: z.record(z.any()).optional(), // JSON Schema
});

export type ToolOutput = z.infer<typeof ToolOutputSchema>;

// ============= TOOL CATEGORY =============

export const ToolCategorySchema = z.enum([
  'system',     // Ferramentas de sistema (file, shell, etc)
  'mcp',        // MCPs dinâmicos
  'agent',      // Executores de agentes
  'custom',     // Código customizado
  'http',       // Requisições HTTP
  'data',       // Transformação de dados
  'ai',         // Ferramentas de IA
]);

export type ToolCategory = z.infer<typeof ToolCategorySchema>;

// ============= EXECUTION CONTEXT =============

export interface ExecutionContext {
  automationId: string;
  nodeId: string;
  sandboxPath?: string;
  previousResults: Record<string, any>;
  globalContext: Record<string, any>;
  timeout?: number;
  metadata?: Record<string, any>;
}

// ============= TOOL RESULT =============

export const ToolResultSchema = z.object({
  success: z.boolean(),
  result: z.any().optional(),
  error: z.string().optional(),
  metadata: z.record(z.any()).optional(),
  executionTime: z.number().optional(),
});

export type ToolResult = z.infer<typeof ToolResultSchema>;

// ============= TOOL DEFINITION =============

export interface Tool {
  // Identificação
  id: string;
  name: string;
  description: string;
  category: ToolCategory;
  version: string;
  
  // Parâmetros e saída
  params: ToolParam[];
  output: ToolOutput;
  
  // Função de execução
  execute: (args: any, context: ExecutionContext) => Promise<ToolResult>;
  
  // Validação de parâmetros (opcional, pode ser auto-gerada)
  validate?: (args: any) => { valid: boolean; errors?: string[] };
  
  // Metadados para UI
  ui: {
    icon?: string;
    color?: string;
    tags?: string[];
    examples?: Array<{
      title: string;
      description: string;
      params: any;
    }>;
  };
  
  // Configurações avançadas
  config?: {
    timeout?: number;          // Timeout padrão em ms
    retries?: number;          // Número de tentativas
    sandbox?: boolean;         // Requer sandbox?
    concurrent?: boolean;      // Pode ser executado concorrentemente?
    rateLimit?: {
      max: number;             // Máximo de chamadas
      window: number;          // Janela de tempo em ms
    };
  };
  
  // Hooks de lifecycle (opcional)
  hooks?: {
    beforeExecute?: (args: any, context: ExecutionContext) => Promise<void>;
    afterExecute?: (result: ToolResult, context: ExecutionContext) => Promise<void>;
    onError?: (error: Error, context: ExecutionContext) => Promise<void>;
  };
}

// ============= TOOL REGISTRY TYPES =============

export interface ToolRegistryOptions {
  maxTools?: number;
  allowDuplicateIds?: boolean;
  validateOnRegister?: boolean;
}

export interface ToolMetrics {
  executionCount: number;
  successCount: number;
  failureCount: number;
  averageExecutionTime: number;
  lastExecutedAt?: string;
}

export interface RegisteredTool extends Tool {
  registeredAt: string;
  metrics: ToolMetrics;
}

// ============= TOOL FILTER =============

export interface ToolFilter {
  category?: ToolCategory;
  search?: string;
  tags?: string[];
  enabled?: boolean;
}

// ============= EXECUTION OPTIONS =============

export interface ToolExecutionOptions {
  timeout?: number;
  retries?: number;
  sandbox?: boolean;
  context?: Partial<ExecutionContext>;
  onProgress?: (progress: number) => void;
  signal?: AbortSignal;
}

// ============= VALIDATION TYPES =============

export interface ValidationError {
  param: string;
  message: string;
  code: 'required' | 'invalid_type' | 'invalid_value' | 'custom';
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}
