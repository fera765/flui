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
      name: 'agentId',
      type: 'string',
      description: 'ID do agente a ser executado',
      required: true,
    },
    {
      name: 'prompt',
      type: 'string',
      description: 'Prompt/instrução para o agente',
      required: true,
    },
    {
      name: 'payload',
      type: 'object',
      description: 'Dados de entrada para o agente',
      required: false,
      default: {},
    },
    {
      name: 'temperature',
      type: 'number',
      description: 'Temperatura do modelo (0-2)',
      required: false,
      validation: (value) => value >= 0 && value <= 2,
    },
    {
      name: 'maxTokens',
      type: 'number',
      description: 'Máximo de tokens na resposta',
      required: false,
    },
    {
      name: 'timeout',
      type: 'number',
      description: 'Timeout em milissegundos',
      required: false,
      default: 60000,
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
