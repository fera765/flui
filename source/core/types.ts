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

// Widget types para renderização dinâmica no frontend
export const WidgetTypeSchema = z.enum([
  'textInput',      // Input de texto simples
  'textArea',       // Textarea para texto longo
  'number',         // Input numérico
  'select',         // Select/Dropdown
  'multiSelect',    // Select múltiplo
  'checkbox',       // Checkbox
  'toggle',         // Toggle switch
  'keyValue',       // Editor de chave-valor (headers, params)
  'codeEditor',     // Editor de código com syntax highlight
  'jsonEditor',     // Editor JSON com validação
  'filePicker',     // Seletor de arquivo
  'datePicker',     // Seletor de data
  'timePicker',     // Seletor de hora
  'colorPicker',    // Seletor de cor
  'slider',         // Slider numérico
  'radio',          // Radio buttons
]);

export type WidgetType = z.infer<typeof WidgetTypeSchema>;

// UI Configuration para cada parâmetro
export const UIConfigSchema = z.object({
  widgetType: WidgetTypeSchema,
  placeholder: z.string().optional(),
  helperText: z.string().optional(),
  options: z.array(z.union([
    z.string(),
    z.object({
      label: z.string(),
      value: z.any(),
      description: z.string().optional(),
      icon: z.string().optional(),
    })
  ])).optional(),
  validation: z.object({
    min: z.number().optional(),
    max: z.number().optional(),
    minLength: z.number().optional(),
    maxLength: z.number().optional(),
    pattern: z.string().optional(), // regex pattern
    customValidator: z.string().optional(), // nome da função de validação customizada
  }).optional(),
  advanced: z.boolean().optional(), // Se true, só mostra em modo avançado
  dependsOn: z.string().optional(), // Nome do campo do qual este depende
  showIf: z.string().optional(), // Expressão condicional para mostrar o campo
  codeLanguage: z.string().optional(), // Para codeEditor (js, python, etc)
  allowExpressions: z.boolean().optional(), // Permite drag-and-drop de expressões
  multiline: z.boolean().optional(),
  rows: z.number().optional(),
});

export type UIConfig = z.infer<typeof UIConfigSchema>;

export const ToolParamSchema = z.object({
  name: z.string(),
  key: z.string(), // Key usado no objeto de configuração
  type: ToolParamTypeSchema,
  description: z.string(),
  required: z.boolean().default(false),
  default: z.any().optional(),
  placeholder: z.string().optional(),
  options: z.array(z.any()).optional(), // Para selects/enums (backward compatibility)
  ui: UIConfigSchema,
});

export type ToolParam = z.infer<typeof ToolParamSchema>;

// ============= TOOL INPUT/OUTPUT PORTS =============

export const PortSchema = z.object({
  name: z.string(),
  key: z.string(),
  type: ToolParamTypeSchema,
  description: z.string().optional(),
  required: z.boolean().default(false),
});

export type Port = z.infer<typeof PortSchema>;

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

// ============= TOOL CAPABILITIES =============

export interface ToolCapabilities {
  requiresAuth?: boolean;       // Requer autenticação
  runsInSandbox?: boolean;      // Executa em sandbox isolado
  isAsync?: boolean;            // É assíncrono
  supportsStreaming?: boolean;  // Suporta streaming
  canBeCached?: boolean;        // Resultado pode ser cacheado
  isStateful?: boolean;         // Mantém estado entre execuções
  requiresNetwork?: boolean;    // Requer acesso à rede
  requiresFileSystem?: boolean; // Requer acesso ao sistema de arquivos
}

// ============= TOOL DEFINITION =============

export interface Tool {
  // Identificação
  id: string;
  name: string;
  description: string;
  category: ToolCategory;
  version: string; // semver
  
  // Parâmetros e saída
  params: ToolParam[];
  output: ToolOutput;
  
  // Inputs/Outputs nomeados (portas de conexão)
  inputs?: Port[];
  outputs?: Port[];
  
  // Função de execução
  execute: (args: any, context: ExecutionContext) => Promise<ToolResult>;
  
  // Validação de parâmetros (opcional, pode ser auto-gerada)
  validate?: (args: any) => { valid: boolean; errors?: string[] };
  
  // Capabilities (capacidades da ferramenta)
  capabilities?: ToolCapabilities;
  
  // Metadados para UI
  ui: {
    icon?: string;
    color?: string;
    tags?: string[];
    examples?: Array<{
      title: string;
      description: string;
      params: any;
      expectedOutput?: any;
    }>;
    category?: string; // Categoria visual (pode ser diferente da categoria técnica)
    group?: string;    // Grupo dentro da categoria
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
