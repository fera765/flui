import OpenAI from 'openai';
import { useStore } from '../store/store.js';
import { Agent, MCP } from '../types/index.js';
import { initializeStreamingLLM, getStreamingLLMClient } from './streaming.js';
import { executeTool } from './toolExecutor.js';

let isInterrupted = false;

export const interruptStreaming = () => {
  isInterrupted = true;
};

const resetInterrupt = () => {
  isInterrupted = false;
};

export const sendStreamingMessageWithTools = async (
  content: string,
  agent: Agent | undefined,
  onChunk: (chunk: string) => void,
  onComplete: () => void,
  onError: (error: Error) => void,
  onToolCall?: (toolName: string, output?: string) => void
): Promise<void> => {
  resetInterrupt();
  const store = useStore.getState();
  const config = store.config;

  if (!config || !config.llm.apiKey) {
    onError(new Error('LLM não configurado. Use /settings para configurar.'));
    return;
  }

  let openaiClient = getStreamingLLMClient();
  if (!openaiClient) {
    initializeStreamingLLM(config.llm.endpoint, config.llm.apiKey);
    openaiClient = getStreamingLLMClient();
  }

  if (!openaiClient) {
    onError(new Error('Falha ao inicializar cliente LLM'));
    return;
  }

  // Preparar mensagens do contexto
  const messages = store.messages.slice(-10); // Últimas 10 mensagens
  const openaiMessages: OpenAI.Chat.ChatCompletionMessageParam[] = messages
    .filter((msg) => msg.role !== 'system')
    .map((msg) => ({
      role: msg.role === 'agent' ? 'assistant' : (msg.role as 'user' | 'assistant'),
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

  // Configurações do modelo
  const model = agent?.model || config.llm.model;
  const temperature = agent?.temperature ?? config.llm.temperature;

  // Registrar todas as MCPs como tools
  const mcps = store.mcps;
  const tools: OpenAI.Chat.ChatCompletionTool[] = mcps.flatMap((mcp) =>
    mcp.tools.map((tool) => ({
      type: 'function' as const,
      function: {
        name: `${mcp.name}_${tool.name}`,
        description: tool.description,
        parameters: tool.parameters || {
          type: 'object',
          properties: {},
        },
      },
    }))
  );

  try {
    const stream = await openaiClient.chat.completions.create({
      model: model,
      messages: openaiMessages,
      temperature: temperature,
      max_tokens: config.llm.maxTokens,
      stream: true,
      tools: tools.length > 0 ? tools : undefined,
      tool_choice: 'auto',
    });

    let toolCalls: any[] = [];
    let currentToolCall: any = null;

    for await (const chunk of stream) {
      if (isInterrupted) {
        return;
      }

      const delta = chunk.choices[0]?.delta;

      // Conteúdo de texto
      if (delta?.content) {
        onChunk(delta.content);
      }

      // Tool calls
      if (delta?.tool_calls) {
        for (const toolCallDelta of delta.tool_calls) {
          if (toolCallDelta.index !== undefined) {
            if (!toolCalls[toolCallDelta.index]) {
              toolCalls[toolCallDelta.index] = {
                id: toolCallDelta.id || '',
                type: 'function',
                function: {
                  name: toolCallDelta.function?.name || '',
                  arguments: toolCallDelta.function?.arguments || '',
                },
              };
            } else {
              if (toolCallDelta.function?.name) {
                toolCalls[toolCallDelta.index].function.name = toolCallDelta.function.name;
              }
              if (toolCallDelta.function?.arguments) {
                toolCalls[toolCallDelta.index].function.arguments += toolCallDelta.function.arguments;
              }
            }
          }
        }
      }
    }

    // Executar tool calls se houver
    if (toolCalls.length > 0) {
      for (const toolCall of toolCalls) {
        if (isInterrupted) {
          return;
        }

        const result = await executeTool(
          toolCall.function.name,
          JSON.parse(toolCall.function.arguments)
        );

        if (onToolCall) {
          onToolCall(
            toolCall.function.name,
            typeof result.result === 'string' ? result.result : JSON.stringify(result.result)
          );
        }

        // Enviar resultado de volta para LLM
        openaiMessages.push({
          role: 'assistant',
          content: null,
          tool_calls: [toolCall],
        } as any);

        openaiMessages.push({
          role: 'tool',
          content: JSON.stringify(result),
          tool_call_id: toolCall.id,
        } as any);
      }

      // Continuar a conversa com os resultados das tools
      const finalStream = await openaiClient.chat.completions.create({
        model: model,
        messages: openaiMessages,
        temperature: temperature,
        max_tokens: config.llm.maxTokens,
        stream: true,
      });

      for await (const chunk of finalStream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          onChunk(content);
        }
      }
    }

    onComplete();
  } catch (error: any) {
    onError(new Error(`Erro ao comunicar com LLM: ${error.message}`));
  }
};
