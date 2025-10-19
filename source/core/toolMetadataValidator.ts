/**
 * FLUI - Tool Metadata Validator
 * 
 * Valida metadados de ferramentas usando JSON Schema
 * Garante que todas as ferramentas registradas sigam o padrão correto
 */

import { z } from 'zod';
import {
  ToolParamSchema,
  ToolOutputSchema,
  PortSchema,
  ToolCategorySchema,
} from './types.js';

// Schema completo de validação de metadados de Tool
export const ToolMetadataSchema = z.object({
  id: z.string().regex(/^[a-z0-9-_]+$/, 'ID deve conter apenas letras minúsculas, números, hífens e underscores'),
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().min(10, 'Descrição deve ter pelo menos 10 caracteres'),
  category: ToolCategorySchema,
  version: z.string().regex(/^\d+\.\d+\.\d+$/, 'Versão deve seguir semver (x.y.z)'),
  
  params: z.array(ToolParamSchema).min(0),
  output: ToolOutputSchema,
  
  inputs: z.array(PortSchema).optional(),
  outputs: z.array(PortSchema).optional(),
  
  capabilities: z.object({
    requiresAuth: z.boolean().optional(),
    runsInSandbox: z.boolean().optional(),
    isAsync: z.boolean().optional(),
    supportsStreaming: z.boolean().optional(),
    canBeCached: z.boolean().optional(),
    isStateful: z.boolean().optional(),
    requiresNetwork: z.boolean().optional(),
    requiresFileSystem: z.boolean().optional(),
  }).optional(),
  
  ui: z.object({
    icon: z.string().optional(),
    color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Cor deve ser um hex válido (#RRGGBB)').optional(),
    tags: z.array(z.string()).optional(),
    examples: z.array(z.object({
      title: z.string(),
      description: z.string(),
      params: z.record(z.any()),
      expectedOutput: z.any().optional(),
    })).optional(),
    category: z.string().optional(),
    group: z.string().optional(),
  }),
  
  config: z.object({
    timeout: z.number().positive().optional(),
    retries: z.number().nonnegative().optional(),
    sandbox: z.boolean().optional(),
    concurrent: z.boolean().optional(),
    rateLimit: z.object({
      max: z.number().positive(),
      window: z.number().positive(),
    }).optional(),
  }).optional(),
});

export type ToolMetadata = z.infer<typeof ToolMetadataSchema>;

/**
 * Valida metadados de uma ferramenta
 */
export function validateToolMetadata(metadata: any): {
  valid: boolean;
  errors?: string[];
  warnings?: string[];
} {
  const warnings: string[] = [];
  
  try {
    // Validar schema básico
    ToolMetadataSchema.parse(metadata);
    
    // Validações adicionais
    
    // 1. Verificar se params tem keys únicas
    const paramKeys = new Set<string>();
    for (const param of metadata.params || []) {
      if (paramKeys.has(param.key)) {
        return {
          valid: false,
          errors: [`Parâmetro com key duplicada: ${param.key}`],
        };
      }
      paramKeys.add(param.key);
    }
    
    // 2. Verificar se há exemplos (warning se não houver)
    if (!metadata.ui?.examples || metadata.ui.examples.length === 0) {
      warnings.push('Recomenda-se adicionar pelo menos um exemplo de uso');
    }
    
    // 3. Verificar se params obrigatórios têm placeholder
    for (const param of metadata.params || []) {
      if (param.required && !param.ui?.placeholder) {
        warnings.push(`Parâmetro obrigatório '${param.name}' deveria ter um placeholder`);
      }
    }
    
    // 4. Verificar se ferramentas assíncronas têm timeout configurado
    if (metadata.capabilities?.isAsync && !metadata.config?.timeout) {
      warnings.push('Ferramentas assíncronas devem definir um timeout padrão');
    }
    
    // 5. Verificar se ferramentas que requerem rede têm timeout
    if (metadata.capabilities?.requiresNetwork && !metadata.config?.timeout) {
      warnings.push('Ferramentas que requerem rede devem definir um timeout');
    }
    
    return {
      valid: true,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map((err) => {
        const path = err.path.join('.');
        return `${path}: ${err.message}`;
      });
      
      return {
        valid: false,
        errors,
      };
    }
    
    return {
      valid: false,
      errors: [`Erro inesperado na validação: ${error.message}`],
    };
  }
}

/**
 * Valida e prepara metadados para registro
 * Adiciona valores padrão e normaliza estrutura
 */
export function prepareToolMetadata(metadata: any): ToolMetadata {
  // Adicionar valores padrão
  const prepared = {
    ...metadata,
    inputs: metadata.inputs || [],
    outputs: metadata.outputs || [],
    capabilities: metadata.capabilities || {},
    config: {
      timeout: 30000,
      retries: 0,
      sandbox: false,
      concurrent: true,
      ...metadata.config,
    },
    ui: {
      tags: [],
      examples: [],
      ...metadata.ui,
    },
  };
  
  // Garantir que cada param tem ui config
  if (prepared.params) {
    prepared.params = prepared.params.map((param: any) => ({
      ...param,
      key: param.key || param.name,
      ui: param.ui || inferUIConfig(param),
    }));
  }
  
  return prepared;
}

/**
 * Infere configuração de UI com base no tipo do parâmetro
 */
function inferUIConfig(param: any): any {
  const baseConfig: any = {
    placeholder: param.placeholder || `Digite ${param.name}...`,
    helperText: param.description,
    allowExpressions: true, // Por padrão permite expressões
  };
  
  // Inferir widgetType com base no type
  switch (param.type) {
    case 'string':
      baseConfig.widgetType = param.options ? 'select' : 'textInput';
      if (param.options) {
        baseConfig.options = param.options.map((opt: any) => 
          typeof opt === 'string' ? { label: opt, value: opt } : opt
        );
      }
      break;
      
    case 'number':
      baseConfig.widgetType = 'number';
      break;
      
    case 'boolean':
      baseConfig.widgetType = 'toggle';
      break;
      
    case 'object':
      // Se tiver keys específicas, usar keyValue, senão jsonEditor
      baseConfig.widgetType = param.name.includes('header') || param.name.includes('param') 
        ? 'keyValue' 
        : 'jsonEditor';
      break;
      
    case 'array':
      baseConfig.widgetType = 'multiSelect';
      break;
      
    case 'json':
      baseConfig.widgetType = 'jsonEditor';
      baseConfig.codeLanguage = 'json';
      break;
      
    case 'file':
      baseConfig.widgetType = 'filePicker';
      break;
      
    default:
      baseConfig.widgetType = 'textInput';
  }
  
  return baseConfig;
}
