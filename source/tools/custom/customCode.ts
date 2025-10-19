/**
 * FLUI - Custom Code Tool
 * 
 * Executa código personalizado em sandbox isolado
 * Suporta JavaScript e Python
 */

import { Tool, ExecutionContext, ToolResult } from '../../core/types.js';
import { createSandbox } from '../../services/sandbox.js';

export const CustomCodeTool: Tool = {
  id: 'custom-code',
  name: 'Custom Code',
  description: 'Executa código JavaScript ou Python personalizado em sandbox isolado',
  category: 'custom',
  version: '1.0.0',

  params: [
    {
      name: 'language',
      type: 'string',
      description: 'Linguagem de programação',
      required: true,
      options: ['javascript', 'python', 'js', 'py'],
    },
    {
      name: 'code',
      type: 'string',
      description: 'Código a ser executado',
      required: true,
      placeholder: 'console.log("Hello World");',
    },
    {
      name: 'input',
      type: 'object',
      description: 'Dados de entrada disponíveis como variável "input"',
      required: false,
      default: {},
    },
    {
      name: 'timeout',
      type: 'number',
      description: 'Timeout em milissegundos',
      required: false,
      default: 10000,
    },
  ],

  output: {
    type: 'object',
    description: 'Resultado da execução',
    schema: {
      success: 'boolean',
      result: 'any',
      stdout: 'string',
      stderr: 'string',
      executionTime: 'number',
    },
  },

  async execute(args: any, context: ExecutionContext): Promise<ToolResult> {
    const startTime = Date.now();
    const sandbox = await createSandbox();

    try {
      await sandbox.initialize();

      // Normalizar linguagem
      let language = args.language.toLowerCase();
      if (language === 'js') language = 'javascript';
      if (language === 'py') language = 'python';

      let result: any;

      if (language === 'javascript') {
        // Preparar código com input
        const wrappedCode = `
          const input = ${JSON.stringify(args.input || {})};
          const output = {};
          
          ${args.code}
          
          // Retornar output se definido, senão undefined
          output;
        `;

        result = await sandbox.executeJavaScript(wrappedCode);
      } else if (language === 'python') {
        // Preparar código Python com input
        const wrappedCode = `
import json
input = ${JSON.stringify(args.input || {})}
output = {}

${args.code}

# Print output se existir
if output:
    print(json.dumps(output))
        `;

        result = await sandbox.executePython(wrappedCode);
      } else {
        return {
          success: false,
          error: `Linguagem não suportada: ${args.language}`,
        };
      }

      const executionTime = Date.now() - startTime;

      // Tentar parsear output como JSON
      let parsedOutput = result.output;
      if (typeof result.output === 'string' && result.output.trim()) {
        try {
          parsedOutput = JSON.parse(result.output);
        } catch {
          // Manter como string se não for JSON
        }
      }

      return {
        success: result.success,
        result: {
          success: result.success,
          result: parsedOutput,
          stdout: result.output || '',
          stderr: result.error || '',
          executionTime,
        },
      };
    } catch (error: any) {
      const executionTime = Date.now() - startTime;
      
      return {
        success: false,
        error: `Erro ao executar código: ${error.message}`,
        metadata: {
          executionTime,
        },
      };
    } finally {
      await sandbox.cleanup();
    }
  },

  ui: {
    icon: 'Code',
    color: '#f59e0b', // amber
    tags: ['code', 'javascript', 'python', 'custom', 'script'],
    examples: [
      {
        title: 'JavaScript simples',
        description: 'Executa código JavaScript',
        params: {
          language: 'javascript',
          code: 'output.result = input.numbers.reduce((a, b) => a + b, 0);',
          input: {
            numbers: [1, 2, 3, 4, 5],
          },
        },
      },
      {
        title: 'Python com processamento',
        description: 'Processa dados com Python',
        params: {
          language: 'python',
          code: `
for num in input['numbers']:
    output['sum'] = output.get('sum', 0) + num
          `,
          input: {
            numbers: [1, 2, 3, 4, 5],
          },
        },
      },
      {
        title: 'Transformação de dados',
        description: 'Transforma estrutura de dados',
        params: {
          language: 'javascript',
          code: `
output.users = input.data.map(user => ({
  id: user.id,
  name: user.name.toUpperCase(),
  active: true
}));
          `,
          input: {
            data: [
              { id: 1, name: 'john' },
              { id: 2, name: 'jane' },
            ],
          },
        },
      },
    ],
  },

  config: {
    timeout: 10000,
    retries: 0,
    sandbox: true,
    concurrent: false,
  },

  hooks: {
    beforeExecute: async (args, context) => {
      // Validar código antes de executar
      if (args.code.includes('require(') || args.code.includes('import ')) {
        throw new Error('Imports não são permitidos por segurança');
      }
    },
  },
};
