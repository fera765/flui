import { Tool, ToolParam, ToolResult, ExecutionContext } from '../core/types.js';

/**
 * Condition Flex Tool - Condição flexível com múltiplos caminhos
 * 
 * Permite criar condições personalizadas com N caminhos de saída
 * Cada caminho pode ser conectado a diferentes nodes no workflow
 * 
 * Exemplo de uso:
 * - Definir 3 caminhos: ["comprar", "vender", "ajuda"]
 * - Com base no resultado, segue para o caminho específico
 */

export const conditionFlexTool: Tool = {
  id: 'condition-flex',
  name: 'Condition Flex',
  description: 'Condição flexível com múltiplos caminhos de saída personalizáveis. Permite definir N caminhos e rotear o fluxo baseado em condições.',
  category: 'system',
  version: '1.0.0',
  
  params: [
    {
      name: 'value',
      key: 'value',
      type: 'string',
      description: 'Valor a ser avaliado (pode ser texto, número, ou resultado de node anterior)',
      required: true,
    },
    {
      name: 'paths',
      key: 'paths',
      type: 'array',
      description: 'Lista de caminhos possíveis (ex: ["comprar", "vender", "ajuda"])',
      required: true,
      default: ['caminho1', 'caminho2'],
    },
    {
      name: 'matchType',
      key: 'matchType',
      type: 'string',
      description: 'Tipo de comparação: exact (exato), contains (contém), regex (expressão regular)',
      required: false,
      default: 'exact',
      ui: {
        widgetType: 'select',
        options: [
          { label: 'Exato', value: 'exact' },
          { label: 'Contém', value: 'contains' },
          { label: 'Regex', value: 'regex' },
        ],
      },
    },
    {
      name: 'caseSensitive',
      key: 'caseSensitive',
      type: 'boolean',
      description: 'Diferenciar maiúsculas de minúsculas',
      required: false,
      default: false,
    },
    {
      name: 'defaultPath',
      key: 'defaultPath',
      type: 'string',
      description: 'Caminho padrão caso nenhuma condição seja atendida',
      required: false,
    },
  ],

  output: {
    type: 'object',
    description: 'Resultado da avaliação com caminho correspondido',
  },

  async execute(args: any, context: ExecutionContext): Promise<ToolResult> {
    try {
      const { value, paths, matchType = 'exact', caseSensitive = false, defaultPath } = args;

      if (!value) {
        throw new Error('Valor para avaliação não fornecido');
      }

      if (!paths || !Array.isArray(paths) || paths.length === 0) {
        throw new Error('Lista de caminhos inválida');
      }

      let matchedPath: string | null = null;
      let processedValue = caseSensitive ? value : value.toLowerCase();

      // Avaliar cada caminho
      for (const path of paths) {
        const processedPath = caseSensitive ? path : path.toLowerCase();

        switch (matchType) {
          case 'exact':
            if (processedValue === processedPath) {
              matchedPath = path;
            }
            break;

          case 'contains':
            if (processedValue.includes(processedPath)) {
              matchedPath = path;
            }
            break;

          case 'regex':
            try {
              const regex = new RegExp(processedPath, caseSensitive ? '' : 'i');
              if (regex.test(value)) {
                matchedPath = path;
              }
            } catch (e) {
              console.warn(`Regex inválido para caminho "${path}":`, e);
            }
            break;
        }

        if (matchedPath) break;
      }

      // Se não encontrou match, usar caminho padrão
      if (!matchedPath && defaultPath) {
        matchedPath = defaultPath;
      }

      return {
        success: true,
        result: {
          matchedPath,
          value: value,
          matched: matchedPath !== null,
          paths,
          matchType,
        },
        metadata: {
          nextPath: matchedPath,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Erro ao avaliar condição',
      };
    }
  },

  ui: {
    icon: 'GitBranch',
    color: '#06b6d4', // cyan
    tags: ['condition', 'routing', 'decision', 'flex'],
    category: 'Logic',
    group: 'Control Flow',
  },

  config: {
    timeout: 5000,
    sandbox: false,
  },
};
