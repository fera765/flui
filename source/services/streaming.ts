import OpenAI from 'openai';
import { useStore } from '../store/store.js';
import { Agent } from '../types/index.js';

let openaiClient: OpenAI | null = null;

export const initializeStreamingLLM = (endpoint: string, apiKey: string): void => {
  openaiClient = new OpenAI({
    baseURL: endpoint,
    apiKey: apiKey,
  });
};

export const getStreamingLLMClient = (): OpenAI | null => {
  return openaiClient;
};

export const sendStreamingMessage = async (
  content: string,
  agent: Agent | undefined,
  onChunk: (chunk: string) => void,
  onComplete: () => void,
  onError: (error: Error) => void
): Promise<void> => {
  const store = useStore.getState();
  const config = store.config;

  if (!config || !config.llm.apiKey) {
    onError(new Error('LLM não configurado. Use /settings para configurar.'));
    return;
  }

  if (!openaiClient) {
    initializeStreamingLLM(config.llm.endpoint, config.llm.apiKey);
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

  try {
    const stream = await openaiClient.chat.completions.create({
      model: model,
      messages: openaiMessages,
      temperature: temperature,
      max_tokens: config.llm.maxTokens,
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        onChunk(content);
      }
    }

    onComplete();
  } catch (error: any) {
    onError(new Error(`Erro ao comunicar com LLM: ${error.message}`));
  }
};

export const listModelsStreaming = async (): Promise<string[]> => {
  const store = useStore.getState();
  const config = store.config;

  if (!config || !config.llm.apiKey) {
    throw new Error('LLM não configurado.');
  }

  if (!openaiClient) {
    initializeStreamingLLM(config.llm.endpoint, config.llm.apiKey);
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

export const testLLMConnection = async (): Promise<{ success: boolean; message: string; models?: string[] }> => {
  const store = useStore.getState();
  const config = store.config;

  if (!config || !config.llm.apiKey) {
    return {
      success: false,
      message: 'LLM não configurado. Configure em /settings',
    };
  }

  if (!openaiClient) {
    initializeStreamingLLM(config.llm.endpoint, config.llm.apiKey);
  }

  if (!openaiClient) {
    return {
      success: false,
      message: 'Falha ao inicializar cliente LLM',
    };
  }

  try {
    // Testar listagem de modelos
    const response = await openaiClient.models.list();
    const models = response.data.map((model) => model.id);
    
    if (models.length === 0) {
      return {
        success: false,
        message: 'Nenhum modelo disponível no endpoint',
      };
    }

    return {
      success: true,
      message: `Conexão bem-sucedida! ${models.length} modelos disponíveis`,
      models,
    };
  } catch (error: any) {
    return {
      success: false,
      message: `Erro de conexão: ${error.message}`,
    };
  }
};
