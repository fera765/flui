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
 * Executa uma tool chamada pela LLM
 */
async function executeToolCall(
  toolCall: OpenAI.Chat.ChatCompletionMessageToolCall,
  context: ExecutionContext
): Promise<any> {
  const toolId = toolCall.function.name;
  const args = JSON.parse(toolCall.function.arguments);

  console.log(`🔧 [LLM] Executando tool: ${toolId}`, args);

  const result = await ToolExecutor.execute(toolId, args, context);

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

  if (!config || !config.llm.apiKey) {
    throw new Error('LLM não configurado. Use /settings para configurar.');
  }

  if (!openaiClient) {
    initializeLLM(config.llm.endpoint, config.llm.apiKey);
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

  // 🔥 NOVO: Carregar tools do agente
  const tools: OpenAI.Chat.ChatCompletionTool[] = [];
  const registry = getToolRegistry();

  if (agent && agent.tools && agent.tools.length > 0) {
    console.log(`🔧 [LLM] Carregando ${agent.tools.length} tools para o agente ${agent.name}`);
    
    for (const toolId of agent.tools) {
      const tool = registry.get(toolId);
      if (tool) {
        tools.push(convertToolToOpenAIFunction(tool));
        console.log(`  ✅ Tool carregada: ${tool.name} (${tool.id})`);
      } else {
        console.warn(`  ⚠️  Tool não encontrada: ${toolId}`);
      }
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
        requestParams.tool_choice = 'auto';
      }

      const response = await openaiClient.chat.completions.create(requestParams);

      const message = response.choices[0]?.message;
      if (!message) {
        throw new Error('Sem resposta do modelo');
      }

      // Adicionar mensagem do assistente ao histórico
      currentMessages.push(message);

      // Verificar se há tool calls
      if (message.tool_calls && message.tool_calls.length > 0) {
        console.log(`🔧 [LLM] ${message.tool_calls.length} tool call(s) detectada(s)`);

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
      const content = message.content;
      if (typeof content === 'string') {
        return content;
      } else if (content && Array.isArray(content)) {
        // Concatenar partes do conteúdo
        return (content as any[]).map((part: any) => 
          typeof part === 'string' ? part : 
          'text' in part ? part.text : ''
        ).join('');
      }
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
