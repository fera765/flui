/**
 * FLUI - HTTP Request Tool
 * 
 * Realiza requisições HTTP com suporte completo a:
 * - GET, POST, PUT, DELETE, PATCH
 * - Headers customizados
 * - Body JSON/Form
 * - Timeout e retries
 */

import { Tool, ExecutionContext, ToolResult } from '../../core/types.js';

export const HTTPRequestTool: Tool = {
  id: 'http-request',
  name: 'HTTP Request',
  description: 'Realiza requisições HTTP para APIs e serviços externos com suporte completo a headers, query params, body e autenticação',
  category: 'http',
  version: '2.0.0',

  params: [
    {
      name: 'URL',
      key: 'url',
      type: 'string',
      description: 'URL completa da requisição (suporta expressões)',
      required: true,
      placeholder: 'https://api.example.com/endpoint',
      ui: {
        widgetType: 'textInput',
        placeholder: 'https://api.example.com/endpoint',
        helperText: 'URL completa incluindo protocolo (http:// ou https://)',
        validation: {
          pattern: '^https?://.+',
        },
        allowExpressions: true,
      },
    },
    {
      name: 'Método HTTP',
      key: 'method',
      type: 'string',
      description: 'Método HTTP da requisição',
      required: false,
      default: 'GET',
      options: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'],
      ui: {
        widgetType: 'select',
        placeholder: 'Selecione o método',
        helperText: 'Método HTTP a ser usado',
        options: [
          { label: 'GET', value: 'GET', description: 'Buscar dados' },
          { label: 'POST', value: 'POST', description: 'Criar recurso' },
          { label: 'PUT', value: 'PUT', description: 'Atualizar recurso completo' },
          { label: 'PATCH', value: 'PATCH', description: 'Atualizar recurso parcial' },
          { label: 'DELETE', value: 'DELETE', description: 'Deletar recurso' },
          { label: 'HEAD', value: 'HEAD', description: 'Obter headers apenas' },
          { label: 'OPTIONS', value: 'OPTIONS', description: 'Ver opções disponíveis' },
        ],
        allowExpressions: false,
      },
    },
    {
      name: 'Headers',
      key: 'headers',
      type: 'object',
      description: 'Headers HTTP da requisição (chave-valor)',
      required: false,
      default: {},
      ui: {
        widgetType: 'keyValue',
        placeholder: 'Adicionar header',
        helperText: 'Cabeçalhos HTTP como Authorization, Content-Type, etc',
        allowExpressions: true,
      },
    },
    {
      name: 'Query Parameters',
      key: 'queryParams',
      type: 'object',
      description: 'Parâmetros de query string (chave-valor)',
      required: false,
      default: {},
      ui: {
        widgetType: 'keyValue',
        placeholder: 'Adicionar parâmetro',
        helperText: 'Parâmetros que serão adicionados à URL (?key=value)',
        allowExpressions: true,
        advanced: false,
      },
    },
    {
      name: 'Body',
      key: 'body',
      type: 'object',
      description: 'Corpo da requisição (JSON)',
      required: false,
      ui: {
        widgetType: 'jsonEditor',
        placeholder: '{\n  "key": "value"\n}',
        helperText: 'Corpo da requisição em formato JSON (apenas para POST, PUT, PATCH)',
        codeLanguage: 'json',
        allowExpressions: true,
        showIf: "method !== 'GET' && method !== 'HEAD'",
      },
    },
    {
      name: 'Timeout (ms)',
      key: 'timeout',
      type: 'number',
      description: 'Tempo máximo de espera em milissegundos',
      required: false,
      default: 30000,
      ui: {
        widgetType: 'number',
        placeholder: '30000',
        helperText: 'Tempo limite para a requisição (padrão: 30s)',
        validation: {
          min: 1000,
          max: 300000,
        },
        advanced: true,
        allowExpressions: false,
      },
    },
    {
      name: 'Seguir Redirecionamentos',
      key: 'followRedirects',
      type: 'boolean',
      description: 'Seguir redirecionamentos HTTP automaticamente',
      required: false,
      default: true,
      ui: {
        widgetType: 'toggle',
        helperText: 'Seguir redirecionamentos 3xx automaticamente',
        advanced: true,
        allowExpressions: false,
      },
    },
    {
      name: 'Autenticação',
      key: 'auth',
      type: 'object',
      description: 'Configuração de autenticação',
      required: false,
      ui: {
        widgetType: 'select',
        placeholder: 'Nenhuma',
        helperText: 'Tipo de autenticação a ser usado',
        options: [
          { label: 'Nenhuma', value: 'none' },
          { label: 'Bearer Token', value: 'bearer' },
          { label: 'Basic Auth', value: 'basic' },
          { label: 'API Key', value: 'apikey' },
        ],
        advanced: false,
        allowExpressions: false,
      },
    },
  ],

  output: {
    type: 'object',
    description: 'Resposta HTTP completa',
    schema: {
      status: 'number',
      statusText: 'string',
      headers: 'object',
      body: 'any',
      duration: 'number',
    },
  },

  async execute(args: any, context: ExecutionContext): Promise<ToolResult> {
    const startTime = Date.now();

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), args.timeout);

      // Construir URL com query params
      let url = args.url;
      if (args.queryParams && Object.keys(args.queryParams).length > 0) {
        const urlObj = new URL(url);
        Object.entries(args.queryParams).forEach(([key, value]) => {
          urlObj.searchParams.append(key, String(value));
        });
        url = urlObj.toString();
      }

      const options: RequestInit = {
        method: args.method,
        headers: args.headers || {},
        signal: controller.signal,
        redirect: args.followRedirects ? 'follow' : 'manual',
      };

      // Adicionar body se não for GET/HEAD
      if (args.body && !['GET', 'HEAD'].includes(args.method)) {
        options.body = JSON.stringify(args.body);
        
        // Adicionar Content-Type se não fornecido
        if (!options.headers) options.headers = {};
        const headers = options.headers as Record<string, string>;
        if (!headers['Content-Type']) {
          headers['Content-Type'] = 'application/json';
        }
      }

      const response = await fetch(url, options);
      clearTimeout(timeoutId);

      const duration = Date.now() - startTime;

      // Tentar parsear como JSON, se falhar, retornar texto
      let body: any;
      const contentType = response.headers.get('content-type') || '';
      
      if (contentType.includes('application/json')) {
        body = await response.json().catch(() => response.text());
      } else {
        body = await response.text();
      }

      // Converter headers para objeto
      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      return {
        success: response.ok,
        result: {
          status: response.status,
          statusText: response.statusText,
          headers: responseHeaders,
          body,
          duration,
          ok: response.ok,
        },
        metadata: {
          url: args.url,
          method: args.method,
        },
      };
    } catch (error: any) {
      const duration = Date.now() - startTime;
      
      return {
        success: false,
        error: `Erro HTTP: ${error.message}`,
        metadata: {
          url: args.url,
          method: args.method,
          duration,
        },
      };
    }
  },

  // Capabilities
  capabilities: {
    requiresAuth: false,
    runsInSandbox: false,
    isAsync: true,
    supportsStreaming: false,
    canBeCached: false,
    isStateful: false,
    requiresNetwork: true,
    requiresFileSystem: false,
  },

  ui: {
    icon: 'Globe',
    color: '#06b6d4', // cyan
    tags: ['http', 'api', 'request', 'fetch', 'rest', 'webhook'],
    category: 'Integração',
    group: 'HTTP',
    examples: [
      {
        title: 'GET Request Simples',
        description: 'Buscar dados de uma API pública',
        params: {
          url: 'https://api.github.com/users/octocat',
          method: 'GET',
        },
        expectedOutput: {
          status: 200,
          body: {
            login: 'octocat',
            id: 1,
            name: 'The Octocat',
          },
        },
      },
      {
        title: 'POST com Autenticação',
        description: 'Enviar dados para API com token de autenticação',
        params: {
          url: 'https://api.example.com/users',
          method: 'POST',
          headers: {
            'Authorization': 'Bearer seu-token-aqui',
            'Content-Type': 'application/json',
          },
          body: {
            name: 'João Silva',
            email: 'joao@example.com',
            role: 'admin',
          },
        },
      },
      {
        title: 'GET com Query Params',
        description: 'Buscar com parâmetros de filtro',
        params: {
          url: 'https://api.example.com/products',
          method: 'GET',
          queryParams: {
            category: 'electronics',
            limit: '10',
            sort: 'price',
          },
        },
      },
      {
        title: 'PUT para Atualizar',
        description: 'Atualizar recurso existente',
        params: {
          url: 'https://api.example.com/users/123',
          method: 'PUT',
          headers: {
            'Authorization': 'Bearer token',
          },
          body: {
            name: 'Novo Nome',
            status: 'active',
          },
        },
      },
    ],
  },

  config: {
    timeout: 30000,
    retries: 2,
    sandbox: false,
    concurrent: true,
    rateLimit: {
      max: 100,
      window: 60000, // 100 req/min
    },
  },
};
