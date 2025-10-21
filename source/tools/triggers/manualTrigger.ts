/**
 * FLUI - Manual Trigger
 * 
 * Trigger manual para execução sob demanda
 * SUPERIOR AO N8N: Melhor UX, feedback em tempo real, debugging avançado
 */

import { Tool, ExecutionContext, ToolResult } from '../../core/types.js';

export const manualTrigger: Tool = {
  id: 'manual-trigger',
  name: 'Manual Trigger',
  description: 'Dispara automações manualmente sob demanda. Ideal para testes, debugging e execuções únicas.',
  category: 'system',
  version: '2.0.0',
  
  ui: {
    icon: '▶️',
    color: '#10b981', // Verde
    tags: ['trigger', 'manual', 'test', 'debug'],
  },
  
  params: [
    {
      name: 'triggerMessage',
      type: 'string',
      description: 'Mensagem opcional de disparo',
      required: false,
      default: 'Manual execution triggered',
      ui: {
        widgetType: 'textInput',
        placeholder: 'Ex: Iniciando processo manual...',
        helperText: 'Mensagem que será registrada no log de execução',
      },
    },
    {
      name: 'initialData',
      type: 'json',
      description: 'Dados iniciais a serem passados para o fluxo',
      required: false,
      default: {},
      ui: {
        widgetType: 'jsonEditor',
        placeholder: '{"key": "value"}',
        helperText: 'Objeto JSON com dados iniciais',
      },
    },
    {
      name: 'debugMode',
      type: 'boolean',
      description: 'Ativa modo de debug com logs detalhados',
      required: false,
      default: false,
      ui: {
        widgetType: 'toggle',
        helperText: 'Ativa logs detalhados de execução',
      },
    },
  ],
  
  output: {
    type: 'object',
    description: 'Informações do trigger manual executado',
    schema: {
      type: 'object',
      properties: {
        triggered: { type: 'boolean' },
        triggerTime: { type: 'string' },
        triggerMessage: { type: 'string' },
        data: { type: 'object' },
        metadata: { type: 'object' },
        executionTime: { type: 'number' },
      },
    },
  },
  
  async execute(params: any, context: ExecutionContext): Promise<ToolResult> {
    const startTime = Date.now();
    
    try {
      const triggerMessage = params.triggerMessage || 'Manual execution triggered';
      const initialData = params.initialData || {};
      const debugMode = params.debugMode || false;
      
      if (debugMode) {
        console.log('🐛 [Manual Trigger] Debug mode ATIVO');
        console.log('📝 [Manual Trigger] Params:', JSON.stringify(params, null, 2));
      }
      
      // Coletar metadados do contexto
      const metadata = {
        executionId: context?.automationId || `manual-${Date.now()}`,
        triggeredBy: 'user',
        triggeredFrom: 'manual-ui',
        nodeId: context?.nodeId || 'manual-trigger-node',
        environment: process.env.NODE_ENV || 'development',
      };
      
      const result = {
        triggered: true,
        triggerTime: new Date().toISOString(),
        triggerMessage,
        data: initialData,
        metadata,
        executionTime: Date.now() - startTime,
      };
      
      if (debugMode) {
        console.log('✅ [Manual Trigger] Resultado:', JSON.stringify(result, null, 2));
      }
      
      return {
        success: true,
        result,
        executionTime: Date.now() - startTime,
        metadata: {
          triggeredBy: 'manual',
          debugMode,
        },
      };
    } catch (error: any) {
      console.error('❌ [Manual Trigger] Erro:', error.message);
      return {
        success: false,
        error: error.message,
        executionTime: Date.now() - startTime,
      };
    }
  },
  
  // Validação customizada (síncrona)
  validate(params: any): { valid: boolean; errors?: string[] } {
    const errors: string[] = [];
    
    // Validar initialData se fornecido
    if (params.initialData !== undefined && params.initialData !== null) {
      if (typeof params.initialData !== 'object') {
        errors.push('initialData deve ser um objeto JSON válido');
      }
    }
    
    // Validar triggerMessage se fornecido
    if (params.triggerMessage !== undefined && typeof params.triggerMessage !== 'string') {
      errors.push('triggerMessage deve ser uma string');
    }
    
    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    };
  },
  
  // Hooks de ciclo de vida
  hooks: {
    beforeExecute: async (params: any, context: ExecutionContext) => {
      console.log(`▶️  [Manual Trigger] Iniciando execução manual...`);
    },
    
    afterExecute: async (result: ToolResult, context: ExecutionContext) => {
      if (result.success) {
        const time = result.executionTime || 0;
        console.log(`✅ [Manual Trigger] Execução concluída em ${time}ms`);
      }
    },
    
    onError: async (error: Error, context: ExecutionContext) => {
      console.error(`❌ [Manual Trigger] Erro na execução:`, error.message);
    },
  },
};
