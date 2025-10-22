/**
 * Converte Agentes em Tools para uso em workflows
 */

import { Agent } from '../types/index.js';

export function convertAgentToTool(agent: Agent): any {
  return {
    id: `agent-${agent.id}`,
    name: agent.name,
    description: agent.description || `Agente usando ${agent.model}`,
    category: 'agent',
    version: '1.0.0',
    
    params: [
      {
        name: 'input',
        key: 'input',
        type: 'string',
        description: 'Entrada/pergunta para o agente',
        required: true,
      },
      {
        name: 'context',
        key: 'context',
        type: 'object',
        description: 'Contexto adicional (opcional)',
        required: false,
      },
    ],

    output: {
      type: 'object',
      description: 'Resposta do agente',
    },

    async execute(args: any, context: any) {
      // TODO: Implementar execução real do agente
      return {
        success: true,
        result: {
          response: `Agente ${agent.name} processando: ${args.input}`,
          model: agent.model,
          temperature: agent.temperature,
        },
      };
    },

    ui: {
      icon: 'Bot',
      color: '#3b82f6',
      tags: ['agent', 'ai', agent.model],
    },

    config: {
      timeout: 60000,
      sandbox: false,
    },
  };
}

export function convertAgentsToTools(agents: Agent[]): any[] {
  return agents.filter(a => a.enabled).map(convertAgentToTool);
}
