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
  description: 'Realiza requisições HTTP para APIs e serviços externos',
  category: 'http',
  version: '1.0.0',

  params: [
    {
      name: 'url',
      type: 'string',
      description: 'URL completa da requisição',
      required: true,
      placeholder: 'https://api.example.com/endpoint',
    },
    {
      name: 'method',
      type: 'string',
      description: 'Método HTTP',
      required: false,
      default: 'GET',
      options: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'],
    },
    {
      name: 'headers',
      type: 'object',
      description: 'Headers da requisição (objeto JSON)',
      required: false,
      default: {},
    },
    {
      name: 'body',
      type: 'object',
      description: 'Body da requisição (objeto JSON)',
      required: false,
    },
    {
      name: 'timeout',
      type: 'number',
      description: 'Timeout em milissegundos',
      required: false,
      default: 30000,
    },
    {
      name: 'followRedirects',
      type: 'boolean',
      description: 'Seguir redirecionamentos',
      required: false,
      default: true,
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

      const response = await fetch(args.url, options);
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

  ui: {
    icon: 'Globe',
    color: '#06b6d4', // cyan
    tags: ['http', 'api', 'request', 'fetch', 'rest'],
    examples: [
      {
        title: 'GET Request',
        description: 'Buscar dados de uma API',
        params: {
          url: 'https://api.github.com/users/octocat',
          method: 'GET',
        },
      },
      {
        title: 'POST Request',
        description: 'Enviar dados para API',
        params: {
          url: 'https://api.example.com/data',
          method: 'POST',
          headers: {
            'Authorization': 'Bearer token123',
          },
          body: {
            name: 'John Doe',
            email: 'john@example.com',
          },
        },
      },
      {
        title: 'Custom Headers',
        description: 'Requisição com headers customizados',
        params: {
          url: 'https://api.example.com/endpoint',
          method: 'GET',
          headers: {
            'X-API-Key': 'your-api-key',
            'Accept': 'application/json',
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
  },
};
