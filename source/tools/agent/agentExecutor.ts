/**
 * FLUI - Agent Executor Tool
 * 
 * Executa outro agente ou fluxo de automação
 * Permite composição de agentes e workflows
 */

import { Tool, ExecutionContext, ToolResult } from '../../core/types.js';
import { useStore } from '../../store/store.js';
import { sendStreamingMessage } from '../../services/streaming.js';

export const AgentExecutorTool: Tool = {
  id: 'agent-executor',
  name: 'Agent Executor',
  description: 'Executa outro agente ou fluxo de automação',
  category: 'agent',
  version: '1.0.0',

  params: [
    {
      name: 'ID do Agente',
      key: 'agentId',
      type: 'string',
      description: 'ID do agente a ser executado',
      required: true,
      ui: {
        widgetType: 'select',
        placeholder: 'Selecione um agente',
        helperText: 'Agente que processará o prompt. Se não houver agentes, crie um primeiro.',
        allowExpressions: false,
        options: [], // Will be populated dynamically from store
      },
    },
    {
      name: 'Prompt',
      key: 'prompt',
      type: 'string',
      description: 'Prompt/instrução para o agente',
      required: true,
      ui: {
        widgetType: 'textArea',
        placeholder: 'Digite o prompt para o agente processar...',
        helperText: 'Instrução ou pergunta que será enviada ao agente',
        allowExpressions: true,
        rows: 4,
      },
    },
    {
      name: 'Dados de Entrada',
      key: 'payload',
      type: 'object',
      description: 'Dados de entrada para o agente',
      required: false,
      default: {},
      ui: {
        widgetType: 'jsonEditor',
        placeholder: '{\n  "key": "value"\n}',
        helperText: 'Dados adicionais que serão passados ao agente (opcional)',
        codeLanguage: 'json',
        allowExpressions: true,
        advanced: true,
      },
    },
    {
      name: 'Temperatura',
      key: 'temperature',
      type: 'number',
      description: 'Temperatura do modelo (0-2)',
      required: false,
      default: 0.7,
      validation: (value) => value >= 0 && value <= 2,
      ui: {
        widgetType: 'number',
        placeholder: '0.7',
        helperText: 'Controla a aleatoriedade das respostas: 0 (determinístico) a 2 (criativo)',
        validation: {
          min: 0,
          max: 2,
        },
        advanced: true,
      },
    },
    {
      name: 'Máximo de Tokens',
      key: 'maxTokens',
      type: 'number',
      description: 'Máximo de tokens na resposta',
      required: false,
      default: 2000,
      ui: {
        widgetType: 'number',
        placeholder: '2000',
        helperText: 'Limita o tamanho da resposta do agente',
        validation: {
          min: 100,
          max: 32000,
        },
        advanced: true,
      },
    },
    {
      name: 'Timeout (ms)',
      key: 'timeout',
      type: 'number',
      description: 'Timeout em milissegundos',
      required: false,
      default: 60000,
      ui: {
        widgetType: 'number',
        placeholder: '60000',
        helperText: 'Tempo máximo de espera pela resposta (padrão: 60s)',
        validation: {
          min: 5000,
          max: 300000,
        },
        advanced: true,
      },
    },
  ],

  output: {
    type: 'object',
    description: 'Resposta do agente',
    schema: {
      success: 'boolean',
      response: 'string',
      agentName: 'string',
      executionTime: 'number',
      tokensUsed: 'number',
    },
  },

  async execute(args: any, context: ExecutionContext): Promise<ToolResult> {
    const startTime = Date.now();

    try {
      const store = useStore.getState();
      const agent = store.agents.find((a) => a.id === args.agentId);

      if (!agent) {
        return {
          success: false,
          error: `Agente não encontrado: ${args.agentId}`,
        };
      }

      // Construir prompt completo
      const fullPrompt = args.payload && Object.keys(args.payload).length > 0
        ? `${args.prompt}\n\nDados de entrada:\n${JSON.stringify(args.payload, null, 2)}`
        : args.prompt;

      // Executar agente com streaming
      let response = '';
      let hasError = false;
      let errorMessage = '';

      await new Promise<void>((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          reject(new Error('Timeout na execução do agente'));
        }, args.timeout);

        sendStreamingMessage(
          fullPrompt,
          agent,
          (chunk) => {
            response += chunk;
          },
          () => {
            clearTimeout(timeoutId);
            resolve();
          },
          (error) => {
            clearTimeout(timeoutId);
            hasError = true;
            errorMessage = error.message;
            reject(error);
          }
        );
      });

      if (hasError) {
        return {
          success: false,
          error: `Erro ao executar agente: ${errorMessage}`,
        };
      }

      const executionTime = Date.now() - startTime;

      return {
        success: true,
        result: {
          success: true,
          response,
          agentName: agent.name,
          agentId: agent.id,
          executionTime,
          prompt: fullPrompt,
        },
      };
    } catch (error: any) {
      const executionTime = Date.now() - startTime;
      
      return {
        success: false,
        error: `Erro ao executar agente: ${error.message}`,
        metadata: {
          executionTime,
        },
      };
    }
  },

  ui: {
    icon: 'Bot',
    color: '#8b5cf6', // purple
    tags: ['agent', 'ai', 'llm', 'execution'],
    examples: [
      {
        title: 'Executar agente simples',
        description: 'Executa um agente com prompt',
        params: {
          agentId: 'agent-id-here',
          prompt: 'Analise estes dados e forneça insights',
        },
      },
      {
        title: 'Agente com payload',
        description: 'Executa agente passando dados',
        params: {
          agentId: 'agent-id-here',
          prompt: 'Processe estes dados',
          payload: {
            data: [1, 2, 3, 4, 5],
            operation: 'sum',
          },
        },
      },
    ],
  },

  config: {
    timeout: 60000,
    retries: 1,
    sandbox: false,
    concurrent: false,
  },
};
