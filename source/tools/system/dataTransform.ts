/**
 * FLUI - Data Transform Tools
 * 
 * Ferramentas para transformação e manipulação de dados
 * - Transform: Transformar dados com JavaScript
 * - Filter: Filtrar arrays
 * - Map: Mapear arrays
 * - Merge: Combinar objetos/arrays
 * - Extract: Extrair campos específicos
 */

import { Tool, ExecutionContext, ToolResult } from '../../core/types.js';

// =================== TRANSFORM ===================

export const DataTransformTool: Tool = {
  id: 'data-transform',
  name: 'Data Transform',
  description: 'Transforma dados usando JavaScript. Acesse os dados via "data" e retorne o resultado transformado.',
  category: 'data',
  version: '1.0.0',

  params: [
    {
      name: 'Dados de Entrada',
      key: 'input',
      type: 'object',
      description: 'Dados a serem transformados',
      required: true,
      ui: {
        widgetType: 'jsonEditor',
        placeholder: '{\n  "user": "john",\n  "age": 30\n}',
        helperText: 'Dados que serão acessíveis via variável "data"',
        allowExpressions: true,
      },
    },
    {
      name: 'Código de Transformação',
      key: 'transform',
      type: 'string',
      description: 'Código JavaScript para transformar os dados',
      required: true,
      ui: {
        widgetType: 'codeEditor',
        placeholder: 'return {\n  name: data.user.toUpperCase(),\n  isAdult: data.age >= 18\n};',
        helperText: 'Use "data" para acessar entrada. Use "return" para retornar resultado.',
        codeLanguage: 'javascript',
        rows: 8,
      },
    },
  ],

  output: {
    type: 'object',
    description: 'Dados transformados',
  },

  async execute(args: any, context: ExecutionContext): Promise<ToolResult> {
    const startTime = Date.now();

    try {
      // Criar função de transformação
      const transformFn = new Function('data', 'context', 'previous', args.transform);

      // Executar transformação
      const result = transformFn(
        args.input,
        context.globalContext || {},
        context.previousResults || {}
      );

      const executionTime = Date.now() - startTime;

      return {
        success: true,
        result,
        metadata: {
          inputType: typeof args.input,
          outputType: typeof result,
        },
        executionTime,
      };
    } catch (error: any) {
      return {
        success: false,
        error: `Erro na transformação: ${error.message}`,
        executionTime: Date.now() - startTime,
      };
    }
  },

  capabilities: {
    requiresAuth: false,
    runsInSandbox: true,
    isAsync: true,
    supportsStreaming: false,
    canBeCached: true,
    isStateful: false,
    requiresNetwork: false,
    requiresFileSystem: false,
  },

  ui: {
    icon: 'RefreshCw',
    color: '#3b82f6', // blue
    tags: ['transform', 'map', 'javascript', 'code', 'data'],
    category: 'Dados',
    group: 'Transformação',
    examples: [
      {
        title: 'Uppercase Nome',
        description: 'Converter nome para maiúsculas',
        params: {
          input: { user: 'john', age: 30 },
          transform: 'return { name: data.user.toUpperCase(), age: data.age };',
        },
        expectedOutput: {
          name: 'JOHN',
          age: 30,
        },
      },
      {
        title: 'Calcular Total',
        description: 'Somar valores de array',
        params: {
          input: { items: [10, 20, 30, 40] },
          transform: 'return { total: data.items.reduce((a, b) => a + b, 0) };',
        },
        expectedOutput: {
          total: 100,
        },
      },
      {
        title: 'Extrair Campos',
        description: 'Extrair apenas campos específicos',
        params: {
          input: {
            id: 1,
            name: 'Product',
            price: 99.99,
            internal_id: 'abc123',
            warehouse: 'WH1',
          },
          transform: 'return { id: data.id, name: data.name, price: data.price };',
        },
      },
    ],
  },

  config: {
    timeout: 5000,
    retries: 0,
    sandbox: true,
    concurrent: true,
  },
};

// =================== FILTER ===================

export const DataFilterTool: Tool = {
  id: 'data-filter',
  name: 'Data Filter',
  description: 'Filtra items de um array baseado em condição. Use "item" para acessar cada elemento.',
  category: 'data',
  version: '1.0.0',

  params: [
    {
      name: 'Array de Entrada',
      key: 'array',
      type: 'array',
      description: 'Array a ser filtrado',
      required: true,
      ui: {
        widgetType: 'jsonEditor',
        placeholder: '[1, 2, 3, 4, 5]',
        helperText: 'Array que será filtrado',
      },
    },
    {
      name: 'Condição de Filtro',
      key: 'condition',
      type: 'string',
      description: 'Expressão JavaScript que retorna true/false',
      required: true,
      ui: {
        widgetType: 'codeEditor',
        placeholder: 'return item > 3;',
        helperText: 'Use "item" para acessar cada elemento. Retorne true para manter.',
        codeLanguage: 'javascript',
        rows: 3,
      },
    },
  ],

  output: {
    type: 'array',
    description: 'Array filtrado',
  },

  async execute(args: any, context: ExecutionContext): Promise<ToolResult> {
    const startTime = Date.now();

    try {
      if (!Array.isArray(args.array)) {
        return {
          success: false,
          error: 'Entrada deve ser um array',
        };
      }

      const filterFn = new Function('item', 'index', 'array', args.condition);

      const filtered = args.array.filter((item: any, index: any, array: any) => {
        try {
          return filterFn(item, index, array);
        } catch (error) {
          return false;
        }
      });

      const executionTime = Date.now() - startTime;

      return {
        success: true,
        result: filtered,
        metadata: {
          originalLength: args.array.length,
          filteredLength: filtered.length,
          removed: args.array.length - filtered.length,
        },
        executionTime,
      };
    } catch (error: any) {
      return {
        success: false,
        error: `Erro no filtro: ${error.message}`,
        executionTime: Date.now() - startTime,
      };
    }
  },

  ui: {
    icon: 'Filter',
    color: '#10b981', // green
    tags: ['filter', 'array', 'condition'],
    category: 'Dados',
    group: 'Array',
    examples: [
      {
        title: 'Filtrar Maiores que 3',
        description: 'Manter apenas números > 3',
        params: {
          array: [1, 2, 3, 4, 5, 6],
          condition: 'return item > 3;',
        },
        expectedOutput: [4, 5, 6],
      },
      {
        title: 'Filtrar Objetos',
        description: 'Filtrar por propriedade',
        params: {
          array: [
            { name: 'John', age: 25 },
            { name: 'Jane', age: 30 },
            { name: 'Bob', age: 20 },
          ],
          condition: 'return item.age >= 25;',
        },
      },
    ],
  },

  config: {
    timeout: 10000,
    sandbox: true,
    concurrent: true,
  },
};

// =================== MERGE ===================

export const DataMergeTool: Tool = {
  id: 'data-merge',
  name: 'Data Merge',
  description: 'Combina múltiplos objetos ou arrays em um único resultado',
  category: 'data',
  version: '1.0.0',

  params: [
    {
      name: 'Tipo de Merge',
      key: 'mode',
      type: 'string',
      description: 'Como combinar os dados',
      required: true,
      default: 'object',
      ui: {
        widgetType: 'select',
        options: [
          { label: 'Objetos (merge)', value: 'object' },
          { label: 'Arrays (concat)', value: 'array' },
          { label: 'Arrays (unique)', value: 'array-unique' },
        ],
      },
    },
    {
      name: 'Dados A',
      key: 'dataA',
      type: 'object',
      description: 'Primeiro conjunto de dados',
      required: true,
      ui: {
        widgetType: 'jsonEditor',
        allowExpressions: true,
      },
    },
    {
      name: 'Dados B',
      key: 'dataB',
      type: 'object',
      description: 'Segundo conjunto de dados',
      required: true,
      ui: {
        widgetType: 'jsonEditor',
        allowExpressions: true,
      },
    },
  ],

  output: {
    type: 'object',
    description: 'Dados combinados',
  },

  async execute(args: any, context: ExecutionContext): Promise<ToolResult> {
    const startTime = Date.now();

    try {
      let result: any;

      if (args.mode === 'object') {
        result = { ...args.dataA, ...args.dataB };
      } else if (args.mode === 'array') {
        if (!Array.isArray(args.dataA) || !Array.isArray(args.dataB)) {
          return {
            success: false,
            error: 'Para modo array, ambos os dados devem ser arrays',
          };
        }
        result = [...args.dataA, ...args.dataB];
      } else if (args.mode === 'array-unique') {
        if (!Array.isArray(args.dataA) || !Array.isArray(args.dataB)) {
          return {
            success: false,
            error: 'Para modo array, ambos os dados devem ser arrays',
          };
        }
        result = Array.from(new Set([...args.dataA, ...args.dataB]));
      }

      const executionTime = Date.now() - startTime;

      return {
        success: true,
        result,
        metadata: {
          mode: args.mode,
        },
        executionTime,
      };
    } catch (error: any) {
      return {
        success: false,
        error: `Erro no merge: ${error.message}`,
        executionTime: Date.now() - startTime,
      };
    }
  },

  ui: {
    icon: 'Combine',
    color: '#8b5cf6', // purple
    tags: ['merge', 'combine', 'concat'],
    category: 'Dados',
    group: 'Combinação',
    examples: [
      {
        title: 'Merge Objetos',
        description: 'Combina dois objetos em um',
        params: {
          mode: 'object',
          dataA: { a: 1, b: 2 },
          dataB: { c: 3, d: 4 },
        },
        expectedOutput: { a: 1, b: 2, c: 3, d: 4 },
      },
      {
        title: 'Concatenar Arrays',
        description: 'Junta dois arrays',
        params: {
          mode: 'array',
          dataA: [1, 2, 3],
          dataB: [4, 5, 6],
        },
        expectedOutput: [1, 2, 3, 4, 5, 6],
      },
      {
        title: 'Merge Arrays Únicos',
        description: 'Combina arrays removendo duplicatas',
        params: {
          mode: 'array-unique',
          dataA: [1, 2, 3],
          dataB: [3, 4, 5],
        },
        expectedOutput: [1, 2, 3, 4, 5],
      },
    ],
  },

  config: {
    timeout: 5000,
    sandbox: false,
    concurrent: true,
  },
};
