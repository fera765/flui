/**
 * FLUI - Delay Tool
 * 
 * Ferramenta para adicionar pausas/delays em automações
 * Útil para rate limiting, esperar processamento, etc.
 */

import { Tool, ExecutionContext, ToolResult } from '../../core/types.js';

export const DelayTool: Tool = {
  id: 'delay',
  name: 'Delay (Pausa)',
  description: 'Adiciona uma pausa/delay na execução do workflow. Útil para rate limiting, aguardar processamento ou sincronização temporal.',
  category: 'system',
  version: '1.0.0',

  params: [
    {
      name: 'Duração (ms)',
      key: 'duration',
      type: 'number',
      description: 'Tempo de pausa em milissegundos',
      required: true,
      default: 1000,
      ui: {
        widgetType: 'number',
        placeholder: '1000',
        helperText: '1000ms = 1 segundo',
        validation: {
          min: 0,
          max: 300000, // 5 minutos max
        },
      },
    },
    {
      name: 'Unidade',
      key: 'unit',
      type: 'string',
      description: 'Unidade de tempo',
      required: false,
      default: 'milliseconds',
      ui: {
        widgetType: 'select',
        options: [
          { label: 'Milissegundos', value: 'milliseconds' },
          { label: 'Segundos', value: 'seconds' },
          { label: 'Minutos', value: 'minutes' },
        ],
        helperText: 'Converte automaticamente para milissegundos',
      },
    },
    {
      name: 'Mensagem',
      key: 'message',
      type: 'string',
      description: 'Mensagem opcional para log',
      required: false,
      ui: {
        widgetType: 'textInput',
        placeholder: 'Aguardando processamento...',
        helperText: 'Mensagem que aparecerá nos logs durante a pausa',
        advanced: true,
      },
    },
  ],

  output: {
    type: 'object',
    description: 'Informações sobre o delay executado',
    schema: {
      duration: 'number',
      unit: 'string',
      startedAt: 'string',
      completedAt: 'string',
    },
  },

  async execute(args: any, context: ExecutionContext): Promise<ToolResult> {
    const startTime = Date.now();
    const startedAt = new Date().toISOString();

    try {
      // Converter duração para milissegundos
      let durationMs = args.duration;
      
      if (args.unit === 'seconds') {
        durationMs = args.duration * 1000;
      } else if (args.unit === 'minutes') {
        durationMs = args.duration * 60 * 1000;
      }

      // Validar duração
      if (durationMs < 0) {
        return {
          success: false,
          error: 'Duração não pode ser negativa',
        };
      }

      if (durationMs > 300000) {
        return {
          success: false,
          error: 'Duração máxima é 5 minutos (300000ms)',
        };
      }

      // Executar delay
      await new Promise((resolve) => setTimeout(resolve, durationMs));

      const completedAt = new Date().toISOString();
      const executionTime = Date.now() - startTime;

      return {
        success: true,
        result: {
          duration: durationMs,
          unit: 'milliseconds',
          originalDuration: args.duration,
          originalUnit: args.unit || 'milliseconds',
          message: args.message || `Pausa de ${durationMs}ms concluída`,
          startedAt,
          completedAt,
        },
        metadata: {
          message: args.message,
        },
        executionTime,
      };
    } catch (error: any) {
      return {
        success: false,
        error: `Erro no delay: ${error.message}`,
        executionTime: Date.now() - startTime,
      };
    }
  },

  capabilities: {
    requiresAuth: false,
    runsInSandbox: false,
    isAsync: true,
    supportsStreaming: false,
    canBeCached: false,
    isStateful: false,
    requiresNetwork: false,
    requiresFileSystem: false,
  },

  ui: {
    icon: 'Clock',
    color: '#f59e0b', // amber
    tags: ['delay', 'wait', 'pause', 'sleep', 'timeout'],
    category: 'Controle de Fluxo',
    group: 'Temporização',
    examples: [
      {
        title: '1 Segundo',
        description: 'Pausar por 1 segundo',
        params: {
          duration: 1000,
          unit: 'milliseconds',
        },
      },
      {
        title: '5 Segundos',
        description: 'Aguardar 5 segundos',
        params: {
          duration: 5,
          unit: 'seconds',
          message: 'Aguardando API rate limit...',
        },
      },
      {
        title: '30 Segundos',
        description: 'Pausa longa para processamento',
        params: {
          duration: 30,
          unit: 'seconds',
          message: 'Aguardando processamento de background...',
        },
      },
    ],
  },

  config: {
    timeout: 310000, // 5min + 10s buffer
    retries: 0,
    sandbox: false,
    concurrent: true,
  },
};
