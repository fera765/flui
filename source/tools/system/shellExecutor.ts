/**
 * FLUI - Shell Executor Tool
 * 
 * Executa comandos shell em sandbox seguro
 */

import { Tool, ExecutionContext, ToolResult } from '../../core/types.js';
import { createSandbox } from '../../services/sandbox.js';

export const ShellExecutorTool: Tool = {
  id: 'shell-executor',
  name: 'Shell Executor',
  description: 'Executa comandos shell em ambiente isolado e seguro',
  category: 'system',
  version: '1.0.0',

  params: [
    {
      name: 'command',
      type: 'string',
      description: 'Comando shell a ser executado',
      required: true,
      placeholder: 'ls -la',
    },
    {
      name: 'directory',
      type: 'string',
      description: 'Diretório de trabalho (opcional)',
      required: false,
      default: '.',
    },
    {
      name: 'timeout',
      type: 'number',
      description: 'Timeout em milissegundos',
      required: false,
      default: 30000,
    },
    {
      name: 'env',
      type: 'object',
      description: 'Variáveis de ambiente adicionais',
      required: false,
      default: {},
    },
  ],

  output: {
    type: 'object',
    description: 'Resultado da execução do comando',
    schema: {
      stdout: 'string',
      stderr: 'string',
      exitCode: 'number',
      success: 'boolean',
    },
  },

  async execute(args: any, context: ExecutionContext): Promise<ToolResult> {
    const sandbox = await createSandbox();

    try {
      await sandbox.initialize();

      // Executar comando
      const result = await sandbox.executeShell(args.command, {
        timeout: args.timeout,
        env: args.env,
      });

      return {
        success: result.success,
        result: {
          stdout: result.output,
          stderr: result.error || '',
          exitCode: result.success ? 0 : 1,
          success: result.success,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: `Erro ao executar comando shell: ${error.message}`,
      };
    } finally {
      await sandbox.cleanup();
    }
  },

  ui: {
    icon: 'Terminal',
    color: '#10b981', // green
    tags: ['shell', 'command', 'terminal', 'bash'],
    examples: [
      {
        title: 'Listar arquivos',
        description: 'Lista todos os arquivos no diretório',
        params: {
          command: 'ls -la',
        },
      },
      {
        title: 'Criar diretório',
        description: 'Cria um novo diretório',
        params: {
          command: 'mkdir novo-diretorio',
        },
      },
      {
        title: 'Executar script',
        description: 'Executa um script bash',
        params: {
          command: 'bash script.sh',
        },
      },
    ],
  },

  config: {
    timeout: 30000,
    retries: 1,
    sandbox: true,
    concurrent: false,
  },
};
