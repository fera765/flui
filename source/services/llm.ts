import OpenAI from 'openai';
import { useStore } from '../store/store.js';
import { Message, Agent } from '../types/index.js';

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

export const sendMessage = async (
  content: string,
  agent?: Agent
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

  // Configurações do modelo
  const model = agent?.model || config.llm.model;
  const temperature = agent?.temperature ?? config.llm.temperature;

  try {
    const response = await openaiClient.chat.completions.create({
      model: model,
      messages: openaiMessages,
      temperature: temperature,
      max_tokens: config.llm.maxTokens,
    });

    return response.choices[0]?.message?.content || 'Sem resposta do modelo.';
  } catch (error: any) {
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
