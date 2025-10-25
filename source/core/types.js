"use strict";
/**
 * FLUI - Tool Registry System
 * Core Types Definition
 *
 * Sistema de registro dinâmico de ferramentas
 * Superior ao N8n e AgentBuilder
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ToolResultSchema = exports.ToolCategorySchema = exports.ToolOutputSchema = exports.PortSchema = exports.ToolParamSchema = exports.UIConfigSchema = exports.WidgetTypeSchema = exports.ToolParamTypeSchema = void 0;
var zod_1 = require("zod");
// ============= TOOL PARAMETER TYPES =============
exports.ToolParamTypeSchema = zod_1.z.enum([
    'string',
    'number',
    'boolean',
    'object',
    'array',
    'file',
    'json',
]);
// Widget types para renderização dinâmica no frontend
exports.WidgetTypeSchema = zod_1.z.enum([
    'textInput', // Input de texto simples
    'textArea', // Textarea para texto longo
    'number', // Input numérico
    'select', // Select/Dropdown
    'multiSelect', // Select múltiplo
    'checkbox', // Checkbox
    'toggle', // Toggle switch
    'keyValue', // Editor de chave-valor (headers, params)
    'codeEditor', // Editor de código com syntax highlight
    'jsonEditor', // Editor JSON com validação
    'filePicker', // Seletor de arquivo
    'datePicker', // Seletor de data
    'timePicker', // Seletor de hora
    'colorPicker', // Seletor de cor
    'slider', // Slider numérico
    'radio', // Radio buttons
]);
// UI Configuration para cada parâmetro
exports.UIConfigSchema = zod_1.z.object({
    widgetType: exports.WidgetTypeSchema,
    placeholder: zod_1.z.string().optional(),
    helperText: zod_1.z.string().optional(),
    options: zod_1.z.array(zod_1.z.union([
        zod_1.z.string(),
        zod_1.z.object({
            label: zod_1.z.string(),
            value: zod_1.z.any(),
            description: zod_1.z.string().optional(),
            icon: zod_1.z.string().optional(),
        })
    ])).optional(),
    validation: zod_1.z.object({
        min: zod_1.z.number().optional(),
        max: zod_1.z.number().optional(),
        minLength: zod_1.z.number().optional(),
        maxLength: zod_1.z.number().optional(),
        pattern: zod_1.z.string().optional(), // regex pattern
        customValidator: zod_1.z.string().optional(), // nome da função de validação customizada
    }).optional(),
    advanced: zod_1.z.boolean().optional(), // Se true, só mostra em modo avançado
    dependsOn: zod_1.z.string().optional(), // Nome do campo do qual este depende
    showIf: zod_1.z.string().optional(), // Expressão condicional para mostrar o campo
    codeLanguage: zod_1.z.string().optional(), // Para codeEditor (js, python, etc)
    allowExpressions: zod_1.z.boolean().optional(), // Permite drag-and-drop de expressões
    multiline: zod_1.z.boolean().optional(),
    rows: zod_1.z.number().optional(),
});
exports.ToolParamSchema = zod_1.z.object({
    name: zod_1.z.string(),
    key: zod_1.z.string().optional(), // Key usado no objeto de configuração (defaults to name)
    type: exports.ToolParamTypeSchema,
    description: zod_1.z.string(),
    required: zod_1.z.boolean().default(false),
    default: zod_1.z.any().optional(),
    placeholder: zod_1.z.string().optional(),
    options: zod_1.z.array(zod_1.z.any()).optional(), // Para selects/enums (backward compatibility)
    ui: exports.UIConfigSchema.optional(), // Optional, will be inferred from type if not provided
    validation: zod_1.z.function().args(zod_1.z.any()).returns(zod_1.z.boolean()).optional(), // Custom validation function
});
// ============= TOOL INPUT/OUTPUT PORTS =============
exports.PortSchema = zod_1.z.object({
    name: zod_1.z.string(),
    key: zod_1.z.string(),
    type: exports.ToolParamTypeSchema,
    description: zod_1.z.string().optional(),
    required: zod_1.z.boolean().default(false),
});
// ============= TOOL OUTPUT TYPES =============
exports.ToolOutputSchema = zod_1.z.object({
    type: exports.ToolParamTypeSchema,
    description: zod_1.z.string(),
    schema: zod_1.z.record(zod_1.z.any()).optional(), // JSON Schema
});
// ============= TOOL CATEGORY =============
exports.ToolCategorySchema = zod_1.z.enum([
    'system', // Ferramentas de sistema (file, shell, etc)
    'mcp', // MCPs dinâmicos
    'agent', // Executores de agentes
    'custom', // Código customizado
    'http', // Requisições HTTP
    'data', // Transformação de dados
    'ai', // Ferramentas de IA
]);
// ============= TOOL RESULT =============
exports.ToolResultSchema = zod_1.z.object({
    success: zod_1.z.boolean(),
    result: zod_1.z.any().optional(),
    error: zod_1.z.string().optional(),
    metadata: zod_1.z.record(zod_1.z.any()).optional(),
    executionTime: zod_1.z.number().optional(),
});
