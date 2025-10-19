/**
 * FLUI - Condição Universal
 * 
 * Ferramenta única e simples para criar fluxos condicionais
 * Substitui as ferramentas antigas de condição com uma interface intuitiva
 * 
 * Características:
 * - Simples e fácil de usar
 * - Conecta com qualquer fonte: Agentes, Webhooks, APIs, LLMs
 * - Suporte a múltiplas ramificações
 * - Auto-detecção de tipos de dados
 */

import { Tool, ExecutionContext, ToolResult } from '../../core/types.js';

export interface ConditionalBranch {
  name: string;         // Nome da ramificação (ex: "sim", "não", "erro")
  condition: string;    // Condição a avaliar
  description?: string; // Descrição opcional
}

export const UniversalConditionTool: Tool = {
  id: 'universal-condition',
  name: 'Condição Universal',
  description: 'Ferramenta simples e poderosa para criar fluxos condicionais. Conecta com Agentes, Webhooks, APIs e LLMs para direcionar automaticamente o fluxo baseado em condições.',
  category: 'system',
  version: '2.0.0',

  params: [
    {
      name: 'Valor de Entrada',
      key: 'input',
      type: 'string',
      description: 'Valor ou dados recebidos para avaliar (texto, número, JSON)',
      required: true,
      placeholder: 'Digite ou conecte com saída anterior',
      ui: {
        widgetType: 'textArea',
        placeholder: 'Digite o valor ou use {{ data.campo }} para conectar',
        helperText: 'Valor que será avaliado pelas condições. Pode ser texto, número ou JSON.',
        allowExpressions: true,
        rows: 3,
      },
    },
    {
      name: 'Tipo de Comparação',
      key: 'comparisonType',
      type: 'string',
      description: 'Como comparar o valor',
      required: false,
      default: 'equals',
      ui: {
        widgetType: 'select',
        options: [
          { label: 'Igual a (=)', value: 'equals', description: 'Valor exatamente igual' },
          { label: 'Diferente de (≠)', value: 'notEquals', description: 'Valor diferente' },
          { label: 'Contém', value: 'contains', description: 'Texto contém substring' },
          { label: 'Não Contém', value: 'notContains', description: 'Texto não contém substring' },
          { label: 'Começa com', value: 'startsWith', description: 'Texto inicia com' },
          { label: 'Termina com', value: 'endsWith', description: 'Texto termina com' },
          { label: 'Maior que (>)', value: 'greaterThan', description: 'Número maior que' },
          { label: 'Menor que (<)', value: 'lessThan', description: 'Número menor que' },
          { label: 'Maior ou igual (≥)', value: 'greaterOrEqual', description: 'Número maior ou igual' },
          { label: 'Menor ou igual (≤)', value: 'lessOrEqual', description: 'Número menor ou igual' },
          { label: 'Regex', value: 'regex', description: 'Expressão regular' },
          { label: 'Vazio', value: 'isEmpty', description: 'Valor vazio ou null' },
          { label: 'Não Vazio', value: 'isNotEmpty', description: 'Valor não vazio' },
        ],
        helperText: 'Selecione como deseja comparar o valor de entrada',
      },
    },
    {
      name: 'Condições (Ramificações)',
      key: 'branches',
      type: 'array',
      description: 'Lista de condições e suas ramificações',
      required: true,
      ui: {
        widgetType: 'jsonEditor',
        placeholder: '[\n  {\n    "name": "sim",\n    "condition": "sim",\n    "description": "Usuário respondeu sim"\n  },\n  {\n    "name": "nao",\n    "condition": "não",\n    "description": "Usuário respondeu não"\n  },\n  {\n    "name": "outro",\n    "condition": "*",\n    "description": "Qualquer outra resposta"\n  }\n]',
        helperText: 'Array de objetos com name (nome da saída), condition (valor a comparar) e description (opcional). Use "*" para capturar qualquer outro valor.',
        codeLanguage: 'json',
        rows: 12,
      },
    },
    {
      name: 'Case Sensitive',
      key: 'caseSensitive',
      type: 'boolean',
      description: 'Diferenciar maiúsculas/minúsculas',
      required: false,
      default: false,
      ui: {
        widgetType: 'toggle',
        helperText: 'Se ativado, "Sim" é diferente de "sim"',
        advanced: true,
      },
    },
    {
      name: 'Ramificação Padrão',
      key: 'defaultBranch',
      type: 'string',
      description: 'Nome da ramificação padrão quando nenhuma condição corresponder',
      required: false,
      default: 'default',
      placeholder: 'default',
      ui: {
        widgetType: 'textInput',
        placeholder: 'default',
        helperText: 'Ramificação usada quando nenhuma condição é satisfeita',
        advanced: true,
      },
    },
  ],

  output: {
    type: 'object',
    description: 'Resultado da avaliação condicional',
    schema: {
      matched: 'boolean',
      branch: 'string',
      input: 'any',
      comparisonType: 'string',
      conditionMatched: 'string',
    },
  },

  async execute(args: any, context: ExecutionContext): Promise<ToolResult> {
    const startTime = Date.now();

    try {
      // Validar branches
      if (!args.branches || !Array.isArray(args.branches) || args.branches.length === 0) {
        return {
          success: false,
          error: 'É necessário fornecer pelo menos uma condição em "branches"',
          executionTime: Date.now() - startTime,
        };
      }

      const input = String(args.input);
      const inputValue = args.caseSensitive ? input : input.toLowerCase();
      const comparisonType = args.comparisonType || 'equals';

      // Avaliar cada branch
      for (const branch of args.branches) {
        if (!branch.name || !branch.condition) {
          continue;
        }

        // Condição wildcard (captura qualquer valor)
        if (branch.condition === '*') {
          return {
            success: true,
            result: {
              matched: true,
              branch: branch.name,
              input: args.input,
              comparisonType,
              conditionMatched: branch.condition,
              description: branch.description,
            },
            executionTime: Date.now() - startTime,
          };
        }

        const condition = String(branch.condition);
        const conditionValue = args.caseSensitive ? condition : condition.toLowerCase();

        let matches = false;

        switch (comparisonType) {
          case 'equals':
            matches = inputValue === conditionValue;
            break;

          case 'notEquals':
            matches = inputValue !== conditionValue;
            break;

          case 'contains':
            matches = inputValue.includes(conditionValue);
            break;

          case 'notContains':
            matches = !inputValue.includes(conditionValue);
            break;

          case 'startsWith':
            matches = inputValue.startsWith(conditionValue);
            break;

          case 'endsWith':
            matches = inputValue.endsWith(conditionValue);
            break;

          case 'greaterThan':
            matches = parseFloat(inputValue) > parseFloat(conditionValue);
            break;

          case 'lessThan':
            matches = parseFloat(inputValue) < parseFloat(conditionValue);
            break;

          case 'greaterOrEqual':
            matches = parseFloat(inputValue) >= parseFloat(conditionValue);
            break;

          case 'lessOrEqual':
            matches = parseFloat(inputValue) <= parseFloat(conditionValue);
            break;

          case 'regex':
            try {
              const regex = new RegExp(condition);
              matches = regex.test(input);
            } catch {
              matches = false;
            }
            break;

          case 'isEmpty':
            matches = !input || input.trim() === '' || input === 'null' || input === 'undefined';
            break;

          case 'isNotEmpty':
            matches = Boolean(input && input.trim() !== '' && input !== 'null' && input !== 'undefined');
            break;

          default:
            matches = inputValue === conditionValue;
        }

        if (matches) {
          return {
            success: true,
            result: {
              matched: true,
              branch: branch.name,
              input: args.input,
              comparisonType,
              conditionMatched: branch.condition,
              description: branch.description,
            },
            executionTime: Date.now() - startTime,
          };
        }
      }

      // Nenhuma condição correspondeu, usar branch padrão
      return {
        success: true,
        result: {
          matched: false,
          branch: args.defaultBranch || 'default',
          input: args.input,
          comparisonType,
          conditionMatched: null,
          description: 'Nenhuma condição correspondeu',
        },
        executionTime: Date.now() - startTime,
      };
    } catch (error: any) {
      return {
        success: false,
        error: `Erro na avaliação condicional: ${error.message}`,
        executionTime: Date.now() - startTime,
      };
    }
  },

  capabilities: {
    requiresAuth: false,
    runsInSandbox: false,
    isAsync: true,
    supportsStreaming: false,
    canBeCached: false,
    isStateful: false,
    requiresNetwork: false,
    requiresFileSystem: false,
  },

  ui: {
    icon: 'GitBranch',
    color: '#10b981', // green
    tags: ['condition', 'if', 'switch', 'branch', 'route', 'logic', 'flow', 'webhook', 'agent'],
    category: 'Controle de Fluxo',
    group: 'Lógica',
    examples: [
      {
        title: 'Sim/Não Simples',
        description: 'Direciona fluxo baseado em resposta do usuário',
        params: {
          input: 'sim',
          comparisonType: 'equals',
          caseSensitive: false,
          branches: [
            { name: 'aceito', condition: 'sim', description: 'Usuário aceitou' },
            { name: 'recusado', condition: 'não', description: 'Usuário recusou' },
            { name: 'outro', condition: '*', description: 'Outra resposta' },
          ],
        },
        expectedOutput: {
          matched: true,
          branch: 'aceito',
          input: 'sim',
        },
      },
      {
        title: 'Atendimento Automático',
        description: 'Direciona usuário para departamento correto',
        params: {
          input: 'quero falar com vendas',
          comparisonType: 'contains',
          caseSensitive: false,
          branches: [
            { name: 'vendas', condition: 'venda', description: 'Direciona para vendas' },
            { name: 'suporte', condition: 'suporte', description: 'Direciona para suporte' },
            { name: 'financeiro', condition: 'financeiro', description: 'Direciona para financeiro' },
            { name: 'geral', condition: '*', description: 'Atendimento geral' },
          ],
        },
      },
      {
        title: 'Verificação Numérica',
        description: 'Verifica se valor está dentro do range',
        params: {
          input: '150',
          comparisonType: 'greaterThan',
          branches: [
            { name: 'alto', condition: '100', description: 'Valor alto' },
            { name: 'medio', condition: '50', description: 'Valor médio' },
            { name: 'baixo', condition: '*', description: 'Valor baixo' },
          ],
        },
      },
      {
        title: 'Validação de Campo',
        description: 'Verifica se campo está preenchido',
        params: {
          input: '',
          comparisonType: 'isEmpty',
          branches: [
            { name: 'vazio', condition: '', description: 'Campo não preenchido' },
          ],
          defaultBranch: 'preenchido',
        },
      },
    ],
  },

  config: {
    timeout: 5000,
    retries: 0,
    sandbox: false,
    concurrent: true,
  },
};
