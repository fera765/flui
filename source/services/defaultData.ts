import { Agent, MCP } from '../types/index.js';
import { nanoid } from 'nanoid';

// ============= AGENTES PADRÃO =============
export const getDefaultAgents = (): Omit<Agent, 'id' | 'createdAt' | 'updatedAt'>[] => {
  return [
    {
      name: 'CodeAssistant',
      description: 'Especialista em programação e desenvolvimento de software',
      systemPrompt: `Você é um assistente de programação especializado. Seu objetivo é ajudar desenvolvedores a:
- Escrever código limpo e eficiente
- Debug de problemas
- Explicar conceitos técnicos
- Sugerir melhores práticas
- Revisar código e dar feedback construtivo

Sempre forneça exemplos práticos e explicações claras.`,
      mcpIds: [],
      enabled: true,
    },
    {
      name: 'DataAnalyst',
      description: 'Analista de dados e visualização',
      systemPrompt: `Você é um analista de dados especializado. Suas capacidades incluem:
- Análise exploratória de dados
- Criação de visualizações e gráficos
- Estatísticas e insights
- Recomendações baseadas em dados
- Limpeza e transformação de dados

Sempre apresente insights acionáveis e visualizações quando apropriado.`,
      mcpIds: [],
      enabled: true,
    },
    {
      name: 'AutomationExpert',
      description: 'Especialista em automação e workflows',
      systemPrompt: `Você é um especialista em automação de processos. Você ajuda a:
- Criar workflows eficientes
- Automatizar tarefas repetitivas
- Integrar sistemas e ferramentas
- Otimizar processos
- Desenvolver scripts e automações

Sempre busque a solução mais eficiente e escalável.`,
      mcpIds: [],
      enabled: true,
    },
    {
      name: 'MarketAnalyst',
      description: 'Analista de mercado e tendências',
      systemPrompt: `Você é um analista de mercado especializado. Você fornece:
- Análise de tendências de mercado
- Insights competitivos
- Estratégias de precificação
- Previsões e projeções
- Recomendações estratégicas

Sempre baseie suas análises em dados concretos e forneça recomendações acionáveis.`,
      mcpIds: [],
      enabled: true,
    },
    {
      name: 'ContentWriter',
      description: 'Redator de conteúdo profissional',
      systemPrompt: `Você é um redator de conteúdo especializado. Você cria:
- Artigos SEO otimizados
- Copy persuasivo
- Conteúdo educacional
- Posts para redes sociais
- Emails marketing

Sempre adapte o tom e estilo ao público-alvo e objetivo do conteúdo.`,
      mcpIds: [],
      enabled: true,
    },
    {
      name: 'ResearchAgent',
      description: 'Agente de pesquisa e curadoria',
      systemPrompt: `Você é um agente de pesquisa especializado. Você:
- Realiza pesquisas profundas sobre tópicos
- Coleta e organiza informações relevantes
- Identifica fontes confiáveis
- Cria outlines e estruturas
- Sintetiza informações complexas

Sempre cite fontes e organize informações de forma clara.`,
      mcpIds: [],
      enabled: true,
    },
    {
      name: 'CommunicationAgent',
      description: 'Especialista em comunicação',
      systemPrompt: `Você é um especialista em comunicação. Você cria:
- Emails profissionais e persuasivos
- Apresentações impactantes
- Comunicados oficiais
- Mensagens para diferentes públicos
- Estratégias de comunicação

Sempre considere o contexto, público e objetivo da comunicação.`,
      mcpIds: [],
      enabled: true,
    },
  ];
};

// ============= MCPs PADRÃO =============
export const getDefaultMCPs = (): Omit<MCP, 'id'>[] => {
  return [
    {
      name: 'FileSystem MCP',
      description: 'Operações com sistema de arquivos',
      version: '1.0.0',
      tools: [
        {
          id: 'fs-read',
          name: 'readFile',
          description: 'Ler conteúdo de um arquivo',
          parameters: {
            path: 'string',
          },
          handler: 'filesystem.readFile',
        },
        {
          id: 'fs-write',
          name: 'writeFile',
          description: 'Escrever conteúdo em um arquivo',
          parameters: {
            path: 'string',
            content: 'string',
          },
          handler: 'filesystem.writeFile',
        },
        {
          id: 'fs-list',
          name: 'listDirectory',
          description: 'Listar arquivos em um diretório',
          parameters: {
            path: 'string',
          },
          handler: 'filesystem.listDirectory',
        },
      ],
      enabled: true,
    },
    {
      name: 'Web MCP',
      description: 'Operações web e HTTP',
      version: '1.0.0',
      tools: [
        {
          id: 'web-fetch',
          name: 'fetchURL',
          description: 'Fazer requisição HTTP GET',
          parameters: {
            url: 'string',
          },
          handler: 'web.fetch',
        },
        {
          id: 'web-search',
          name: 'searchWeb',
          description: 'Buscar informações na web',
          parameters: {
            query: 'string',
            maxResults: 'number',
          },
          handler: 'web.search',
        },
      ],
      enabled: true,
    },
    {
      name: 'Code Execution MCP',
      description: 'Executar código em diferentes linguagens',
      version: '1.0.0',
      tools: [
        {
          id: 'exec-python',
          name: 'executePython',
          description: 'Executar código Python',
          parameters: {
            code: 'string',
          },
          handler: 'execution.python',
        },
        {
          id: 'exec-js',
          name: 'executeJavaScript',
          description: 'Executar código JavaScript',
          parameters: {
            code: 'string',
          },
          handler: 'execution.javascript',
        },
        {
          id: 'exec-shell',
          name: 'executeShell',
          description: 'Executar comando shell',
          parameters: {
            command: 'string',
          },
          handler: 'execution.shell',
        },
      ],
      enabled: true,
    },
    {
      name: 'Database MCP',
      description: 'Operações com bancos de dados',
      version: '1.0.0',
      tools: [
        {
          id: 'db-query',
          name: 'queryDatabase',
          description: 'Executar query SQL',
          parameters: {
            query: 'string',
            database: 'string',
          },
          handler: 'database.query',
        },
        {
          id: 'db-insert',
          name: 'insertData',
          description: 'Inserir dados no banco',
          parameters: {
            table: 'string',
            data: 'object',
          },
          handler: 'database.insert',
        },
      ],
      enabled: true,
    },
    {
      name: 'AI Image MCP',
      description: 'Geração de imagens com IA',
      version: '1.0.0',
      tools: [
        {
          id: 'ai-img-gen',
          name: 'generateImages',
          description: 'Gerar imagens com IA',
          parameters: {
            prompts: 'array',
            style: 'string',
            count: 'number',
          },
          handler: 'ai.generateImages',
        },
      ],
      enabled: true,
    },
    {
      name: 'Audio MCP',
      description: 'Processamento de áudio',
      version: '1.0.0',
      tools: [
        {
          id: 'audio-tts',
          name: 'textToSpeech',
          description: 'Converter texto em áudio',
          parameters: {
            text: 'string',
            voice: 'string',
            speed: 'number',
            output: 'string',
          },
          handler: 'audio.textToSpeech',
        },
      ],
      enabled: true,
    },
    {
      name: 'Email MCP',
      description: 'Envio de emails',
      version: '1.0.0',
      tools: [
        {
          id: 'email-send',
          name: 'sendEmail',
          description: 'Enviar email',
          parameters: {
            to: 'string',
            subject: 'string',
            body: 'string',
            attachments: 'array',
          },
          handler: 'email.send',
        },
        {
          id: 'email-bulk',
          name: 'sendBulkEmail',
          description: 'Enviar email em massa',
          parameters: {
            to: 'array',
            subject: 'string',
            body: 'string',
            attachments: 'array',
          },
          handler: 'email.sendBulk',
        },
      ],
      enabled: true,
    },
    {
      name: 'Document MCP',
      description: 'Manipulação de documentos',
      version: '1.0.0',
      tools: [
        {
          id: 'doc-pdf',
          name: 'convertToPDF',
          description: 'Converter documento para PDF',
          parameters: {
            input: 'string',
            output: 'string',
          },
          handler: 'document.convertToPDF',
        },
      ],
      enabled: true,
    },
  ];
};
