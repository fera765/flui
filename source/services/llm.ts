import OpenAI from 'openai';
import { useStore } from '../store/store.js';
import { Message, Agent } from '../types/index.js';
import { getToolRegistry } from '../core/toolRegistry.js';
import { ToolExecutor } from '../core/toolExecutor.js';
import { ExecutionContext } from '../core/types.js';

let openaiClient: OpenAI | null = null;

export const initializeLLM = (endpoint: string, apiKey: string): void => {
  openaiClient = new OpenAI({
    baseURL: endpoint,
    apiKey: apiKey,
  });
};

export const getLLMClient = (): OpenAI | null => {
  return openaiClient;
};

/**
 * Converte tools do FLUI para formato OpenAI Function Calling
 */
function convertToolToOpenAIFunction(tool: any): OpenAI.Chat.ChatCompletionTool {
  const properties: Record<string, any> = {};
  const required: string[] = [];

  // Converter parâmetros
  tool.params.forEach((param: any) => {
    properties[param.key || param.name] = {
      type: param.type === 'number' ? 'number' : 
            param.type === 'boolean' ? 'boolean' :
            param.type === 'array' ? 'array' :
            param.type === 'object' ? 'object' : 'string',
      description: param.description || '',
      ...(param.enum ? { enum: param.enum } : {}),
      ...(param.items ? { items: param.items } : {}),
    };

    if (param.required) {
      required.push(param.key || param.name);
    }
  });

  return {
    type: 'function',
    function: {
      name: tool.id,
      description: tool.description || tool.name,
      parameters: {
        type: 'object',
        properties,
        required,
      },
    },
  };
}

/**
 * Executa uma tool chamada pela LLM (FLUI Tool ou MCP Tool)
 */
async function executeToolCall(
  toolCall: OpenAI.Chat.ChatCompletionMessageToolCall,
  context: ExecutionContext
): Promise<any> {
  const toolName = toolCall.function.name;
  const args = JSON.parse(toolCall.function.arguments);

  console.log(`🔧 [LLM] Executando tool: ${toolName}`, args);

  // ✅ Verificar se é uma MCP Tool (formato: mcpId__toolName)
  if (toolName.includes('__')) {
    const [mcpId, mcpToolName] = toolName.split('__');
    console.log(`📦 [LLM] Tool MCP detectada: ${mcpToolName} do MCP ${mcpId}`);
    
    // Executar tool MCP via MCPExecutor
    const { MCPExecutor } = await import('./mcpExecutor.js');
    const result = await MCPExecutor.executeMCPTool(mcpId, mcpToolName, args, context);
    
    if (!result.success) {
      throw new Error(result.error || 'MCP Tool execution failed');
    }
    
    return result.result;
  }
  
  // ✅ Tool FLUI (do registry)
  const result = await ToolExecutor.execute(toolName, args, context);

  if (!result.success) {
    throw new Error(result.error || 'Tool execution failed');
  }

  return result.result;
}

export const sendMessage = async (
  content: string,
  agent?: Agent,
  context?: ExecutionContext
): Promise<string> => {
  const store = useStore.getState();
  const config = store.config;

  // ✅ FIX: Endpoint https://api.llm7.io/v1 não requer API key
  const needsApiKey = config?.llm?.endpoint && !config.llm.endpoint.includes('llm7.io');
  
  if (!config || !config.llm) {
    throw new Error('LLM não configurado. Use /settings para configurar.');
  }
  
  if (needsApiKey && !config.llm.apiKey) {
    throw new Error('API Key é obrigatória para este endpoint. Configure em /settings.');
  }

  if (!openaiClient) {
    initializeLLM(config.llm.endpoint, config.llm.apiKey || '');
  }

  if (!openaiClient) {
    throw new Error('Falha ao inicializar cliente LLM');
  }

  // Preparar mensagens do contexto
  const messages = store.messages.slice(-10); // Últimas 10 mensagens
  const openaiMessages: OpenAI.Chat.ChatCompletionMessageParam[] = messages.map((msg) => ({
    role: msg.role === 'agent' ? 'assistant' : (msg.role as 'user' | 'assistant' | 'system'),
    content: msg.content,
  }));

  // Adicionar system prompt do agente se houver
  if (agent) {
    openaiMessages.unshift({
      role: 'system',
      content: agent.systemPrompt,
    });
  }

  // Adicionar mensagem do usuário
  openaiMessages.push({
    role: 'user',
    content: content,
  });

  // 🔥 NOVO: Carregar tools do agente (FLUI Tools + MCP Tools)
  const tools: OpenAI.Chat.ChatCompletionTool[] = [];
  const registry = getToolRegistry();

  if (agent) {
    // ✅ 1. Carregar FLUI Tools (tools do registry)
    if (agent.tools && agent.tools.length > 0) {
      console.log(`🔧 [LLM] Carregando ${agent.tools.length} FLUI tools para o agente ${agent.name}`);
      
      for (const toolId of agent.tools) {
        const tool = registry.get(toolId);
        if (tool) {
          tools.push(convertToolToOpenAIFunction(tool));
          console.log(`  ✅ FLUI Tool carregada: ${tool.name} (${tool.id})`);
        } else {
          console.warn(`  ⚠️  FLUI Tool não encontrada: ${toolId}`);
        }
      }
    }
    
    // ✅ 2. Carregar MCP Tools (tools dos MCPs associados)
    if (agent.mcpIds && agent.mcpIds.length > 0) {
      console.log(`🔧 [LLM] Carregando tools de ${agent.mcpIds.length} MCPs para o agente ${agent.name}`);
      
      for (const mcpId of agent.mcpIds) {
        const mcp = store.mcps.find(m => m.id === mcpId);
        if (mcp && mcp.tools) {
          console.log(`  📦 MCP: ${mcp.name} (${mcp.tools.length} tools)`);
          
          for (const mcpTool of mcp.tools) {
            // Converter tool MCP para formato OpenAI
            const openAITool: OpenAI.Chat.ChatCompletionTool = {
              type: 'function',
              function: {
                name: `${mcpId}__${mcpTool.name}`,  // Prefixo com MCP ID para evitar conflitos
                description: mcpTool.description || mcpTool.name,
                parameters: mcpTool.parameters || {
                  type: 'object',
                  properties: {},
                  required: []
                }
              }
            };
            
            tools.push(openAITool);
            console.log(`    ✅ MCP Tool carregada: ${mcpTool.name} (${mcp.name})`);
          }
        } else {
          console.warn(`  ⚠️  MCP não encontrado: ${mcpId}`);
        }
      }
    }
    
    if (tools.length > 0) {
      console.log(`🎯 [LLM] Total de ${tools.length} tools disponíveis para o agente`);
    }
  }

  // Configurações do modelo
  const model = agent?.model || config.llm.model;
  const temperature = agent?.temperature ?? config.llm.temperature;

  try {
    // 🔥 LOOP de Function Calling - até 10 iterações
    let currentMessages = [...openaiMessages];
    let iterationCount = 0;
    const maxIterations = 10;
    let fallbackExecuted = false;  // ✅ Evitar loop infinito no fallback

    while (iterationCount < maxIterations) {
      iterationCount++;

      console.log(`🔄 [LLM] Iteração ${iterationCount}/${maxIterations}`);

      const requestParams: OpenAI.Chat.ChatCompletionCreateParams = {
        model: model,
        messages: currentMessages,
        temperature: temperature,
        max_tokens: config.llm.maxTokens,
      };

      // Adicionar tools se disponíveis
      if (tools.length > 0) {
        requestParams.tools = tools;
        requestParams.tool_choice = 'auto';  // ✅ Deixar modelo decidir
        
        console.log(`🎯 [LLM] ${tools.length} tools disponíveis para function calling`);
      }

      console.log(`📤 [LLM] Enviando request para: ${config.llm.endpoint}`);
      console.log(`📤 [LLM] Model: ${model}, Messages: ${currentMessages.length}, Tools: ${tools.length}`);
      
      // ✅ DEBUG: Mostrar tools enviadas
      if (tools.length > 0) {
        console.log(`📤 [LLM] Tools enviadas:`, JSON.stringify(tools, null, 2));
        console.log(`📤 [LLM] tool_choice: ${requestParams.tool_choice}`);
      }

      let response;
      try {
        response = await openaiClient.chat.completions.create(requestParams);
      } catch (error: any) {
        console.error(`❌ [LLM] Erro na chamada da API:`, error);
        console.error(`❌ [LLM] Error response:`, error.response?.data);
        throw error;
      }

      const message = response.choices[0]?.message;
      if (!message) {
        throw new Error('Sem resposta do modelo');
      }
      
      console.log(`📥 [LLM] Resposta recebida:`, {
        finishReason: response.choices[0]?.finish_reason,
        hasToolCalls: !!message?.tool_calls,
        toolCallsCount: message?.tool_calls?.length || 0,
        contentPreview: message?.content?.toString().substring(0, 100),
      });
      
      // ✅ Aviso se não usou tools (Qwen3 deve usar function calling nativo)
      if (tools.length > 0 && !message.tool_calls && iterationCount === 1) {
        console.warn(`⚠️  [LLM] Modelo tinha ${tools.length} tools mas não usou na 1ª iteração`);
      }

      // Adicionar mensagem do assistente ao histórico
      currentMessages.push(message);

      // Verificar se há tool calls
      if (message.tool_calls && message.tool_calls.length > 0) {
        console.log(`🔧 [LLM] ${message.tool_calls.length} tool call(s) detectada(s)`, 
          message.tool_calls.map(tc => tc.function.name));

        // Executar cada tool call
        for (const toolCall of message.tool_calls) {
          try {
            const toolResult = await executeToolCall(
              toolCall,
              context || {
                automationId: 'chat',
                nodeId: 'chat-node',
                previousResults: {},
                globalContext: {},
              }
            );

            // Adicionar resultado da tool ao histórico
            currentMessages.push({
              role: 'tool',
              tool_call_id: toolCall.id,
              content: JSON.stringify(toolResult),
            });

            console.log(`✅ [LLM] Tool executada: ${toolCall.function.name}`);
          } catch (error: any) {
            console.error(`❌ [LLM] Erro ao executar tool ${toolCall.function.name}:`, error);
            
            // Adicionar erro ao histórico
            currentMessages.push({
              role: 'tool',
              tool_call_id: toolCall.id,
              content: JSON.stringify({ error: error.message }),
            });
          }
        }

        // Continuar o loop para obter resposta final
        continue;
      }

      // Se chegou aqui, não há mais tool calls - retornar resposta final
      console.log(`✅ [LLM] Resposta final recebida após ${iterationCount} iterações`);
      
      const content = message.content;
      if (typeof content === 'string') {
        console.log(`💬 [LLM] Conteúdo: ${content.substring(0, 100)}${content.length > 100 ? '...' : ''}`);
        return content;
      } else if (content && Array.isArray(content)) {
        // Concatenar partes do conteúdo
        const result = (content as any[]).map((part: any) => 
          typeof part === 'string' ? part : 
          'text' in part ? part.text : ''
        ).join('');
        console.log(`💬 [LLM] Conteúdo array: ${result.substring(0, 100)}${result.length > 100 ? '...' : ''}`);
        return result;
      }
      
      console.warn(`⚠️  [LLM] Sem conteúdo na resposta`);
      return 'Sem resposta do modelo.';
    }

    // Se chegou aqui, atingiu limite de iterações
    console.warn(`⚠️  [LLM] Limite de iterações atingido (${maxIterations})`);
    const lastMessage = currentMessages[currentMessages.length - 1];
    const lastContent = lastMessage?.content;
    
    if (typeof lastContent === 'string') {
      return lastContent;
    } else if (lastContent && Array.isArray(lastContent)) {
      return (lastContent as any[]).map((part: any) => 
        typeof part === 'string' ? part : 
        'text' in part ? part.text : ''
      ).join('');
    }
    return 'Limite de iterações atingido.';

  } catch (error: any) {
    console.error('❌ [LLM] Erro:', error);
    console.error('❌ [LLM] Error details:', {
      message: error.message,
      status: error.status,
      code: error.code,
    });
    if (error.stack) {
      console.error('❌ [LLM] Stack:', error.stack);
    }
    throw new Error(`Erro ao comunicar com LLM: ${error.message}`);
  }
};

export const listModels = async (): Promise<string[]> => {
  const store = useStore.getState();
  const config = store.config;

  if (!config || !config.llm.apiKey) {
    throw new Error('LLM não configurado.');
  }

  if (!openaiClient) {
    initializeLLM(config.llm.endpoint, config.llm.apiKey);
  }

  if (!openaiClient) {
    throw new Error('Falha ao inicializar cliente LLM');
  }

  try {
    const response = await openaiClient.models.list();
    return response.data.map((model) => model.id);
  } catch (error: any) {
    throw new Error(`Erro ao listar modelos: ${error.message}`);
  }
};

// Export LLM object for easy import
export const LLM = {
  initialize: initializeLLM,
  getClient: getLLMClient,
  chat: async (messages: Array<{ role: string; content: string }>) => {
    const store = useStore.getState();
    const config = store.config;
    
    if (!config || !config.llm) {
      throw new Error('LLM não configurado');
    }
    
    if (!openaiClient) {
      initializeLLM(config.llm.endpoint, config.llm.apiKey || '');
    }
    
    if (!openaiClient) {
      throw new Error('Falha ao inicializar cliente LLM');
    }
    
    const response = await openaiClient.chat.completions.create({
      model: config.llm.model,
      messages: messages as any,
      temperature: config.llm.temperature,
      max_tokens: config.llm.maxTokens,
    });
    
    return {
      content: response.choices[0]?.message?.content || '',
      model: response.model,
    };
  },
  sendMessage,
  listModels,
};
