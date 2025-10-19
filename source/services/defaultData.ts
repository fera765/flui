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
  ];
};
