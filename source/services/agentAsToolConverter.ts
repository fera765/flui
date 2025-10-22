/**
 * Converte Agentes em Tools para uso em workflows
 * 🔥 INTEGRAÇÃO REAL COM LLM - SEM SIMULAÇÕES
 */

import { Agent } from '../types/index.js';
import { sendMessage } from './llm.js';
import { ExecutionContext } from '../core/types.js';

export function convertAgentToTool(agent: Agent): any {
  return {
    id: `agent-${agent.id}`,
    name: agent.name,
    description: agent.description || `Agente IA usando ${agent.model || 'modelo padrão'}`,
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
      description: 'Resposta do agente com conteúdo e metadados',
      properties: {
        response: {
          type: 'string',
          description: 'Resposta gerada pelo agente',
        },
        agentName: {
          type: 'string',
          description: 'Nome do agente que processou',
        },
        model: {
          type: 'string',
          description: 'Modelo LLM utilizado',
        },
        toolsUsed: {
          type: 'number',
          description: 'Número de tools disponíveis para o agente',
        },
      },
    },

    // 🔥 EXECUÇÃO REAL - Integrado com LLM
    async execute(args: any, context: ExecutionContext) {
      console.log(`🤖 [AgentTool] Executando agente: ${agent.name}`);
      console.log(`📝 [AgentTool] Input: ${args.input?.substring(0, 100)}${args.input?.length > 100 ? '...' : ''}`);
      
      if (!args.input) {
        return {
          success: false,
          error: 'Campo "input" é obrigatório',
        };
      }

      try {
        // 🔥 EXECUÇÃO REAL DO AGENTE COM LLM
        const response = await sendMessage(args.input, agent, context);
        
        console.log(`✅ [AgentTool] Agente ${agent.name} respondeu (${response.length} chars)`);
        
        return {
          success: true,
          result: {
            response: response,
            agentName: agent.name,
            agentId: agent.id,
            model: agent.model || 'padrão',
            systemPrompt: agent.systemPrompt,
            toolsUsed: agent.tools?.length || 0,
            temperature: agent.temperature,
            maxTokens: agent.maxTokens,
          },
        };
      } catch (error: any) {
        console.error(`❌ [AgentTool] Erro ao executar agente ${agent.name}:`, error);
        return {
          success: false,
          error: `Erro ao executar agente: ${error.message}`,
        };
      }
    },

    ui: {
      icon: 'Bot',
      color: '#3b82f6',
      tags: ['agent', 'ai', agent.model || 'llm', ...(agent.tools || []).slice(0, 3)],
    },

    config: {
      timeout: 120000, // 2 minutos para agentes (podem fazer múltiplos tool calls)
      sandbox: false, // Agentes não rodam em sandbox, mas as tools que eles chamam SIM
      retries: 1, // Permitir 1 retry em caso de falha
    },
    
    // Metadados do agente original
    metadata: {
      agentId: agent.id,
      model: agent.model,
      temperature: agent.temperature,
      maxTokens: agent.maxTokens,
      toolsCount: agent.tools?.length || 0,
      mcpsCount: agent.mcpIds?.length || 0,
    },
  };
}

export function convertAgentsToTools(agents: Agent[]): any[] {
  console.log(`🔄 [AgentConverter] Convertendo ${agents.length} agentes em tools`);
  const converted = agents.filter(a => a.enabled).map(convertAgentToTool);
  console.log(`✅ [AgentConverter] ${converted.length} agentes ativos convertidos`);
  return converted;
}
