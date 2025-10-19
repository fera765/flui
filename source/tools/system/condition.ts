/**
 * FLUI - Condition Tool
 * 
 * Ferramenta poderosa para fluxos condicionais múltiplos
 * Superior ao n8n: suporta múltiplas condições e rotas dinâmicas
 * 
 * Características:
 * - Múltiplas condições (não apenas if/else)
 * - Rotas nomeadas (route1, route2, route3, etc)
 * - Expressões JavaScript avançadas
 * - Acesso a resultados anteriores
 * - Switch/case style com default
 */

import { Tool, ExecutionContext, ToolResult } from '../../core/types.js';

export interface ConditionBranch {
  name: string;
  condition: string;
  description?: string;
  output?: string; // Nome da saída/porta
}

export interface ConditionConfig {
  // Tipo de condição
  mode: 'if-else' | 'switch' | 'multi-branch' | 'score-based';
  
  // Branches/condições
  branches: ConditionBranch[];
  
  // Default branch (se nenhuma condição for verdadeira)
  defaultBranch?: string;
  
  // Opções avançadas
  stopAtFirstMatch?: boolean; // Parar na primeira condição verdadeira
  allowMultipleMatches?: boolean; // Permitir múltiplas rotas simultâneas
  
  // Context para avaliação
  useGlobalContext?: boolean;
  usePreviousResults?: boolean;
}

export const ConditionTool: Tool = {
  id: 'condition',
  name: 'Condition (Fluxo Condicional)',
  description: 'Cria fluxos condicionais com múltiplas rotas. Superior ao n8n: suporta branches ilimitados, switch/case, e rotas simultâneas.',
  category: 'system',
  version: '2.0.0',

  params: [
    {
      name: 'Modo',
      key: 'mode',
      type: 'string',
      description: 'Tipo de lógica condicional',
      required: true,
      default: 'if-else',
      ui: {
        widgetType: 'select',
        helperText: 'Selecione o tipo de lógica condicional',
        options: [
          { 
            label: 'If-Else', 
            value: 'if-else',
            description: 'Condições simples: if, else if, else'
          },
          { 
            label: 'Switch', 
            value: 'switch',
            description: 'Switch/case: comparar valor com múltiplas opções'
          },
          { 
            label: 'Multi-Branch', 
            value: 'multi-branch',
            description: 'Múltiplas condições independentes (permite rotas simultâneas)'
          },
          { 
            label: 'Score-Based', 
            value: 'score-based',
            description: 'Avalia todas as condições e escolhe a de maior score'
          },
        ],
      },
    },
    {
      name: 'Valor de Entrada',
      key: 'inputValue',
      type: 'string',
      description: 'Valor ou expressão a ser avaliado',
      required: false,
      ui: {
        widgetType: 'textArea',
        placeholder: 'data.status',
        helperText: 'Expressão JavaScript para acessar dados: data, context, previous',
        allowExpressions: true,
        rows: 2,
      },
    },
    {
      name: 'Condições/Branches',
      key: 'branches',
      type: 'array',
      description: 'Lista de condições e suas rotas',
      required: true,
      ui: {
        widgetType: 'jsonEditor',
        placeholder: '[\n  {\n    "name": "route1",\n    "condition": "data.age >= 18",\n    "description": "Maior de idade"\n  },\n  {\n    "name": "route2",\n    "condition": "data.age < 18",\n    "description": "Menor de idade"\n  }\n]',
        helperText: 'Array de objetos com: name (nome da rota), condition (expressão JS), description (opcional)',
        codeLanguage: 'json',
        rows: 10,
      },
    },
    {
      name: 'Branch Padrão',
      key: 'defaultBranch',
      type: 'string',
      description: 'Nome da rota padrão (se nenhuma condição for verdadeira)',
      required: false,
      default: 'default',
      ui: {
        widgetType: 'textInput',
        placeholder: 'default',
        helperText: 'Rota usada quando nenhuma condição é satisfeita',
      },
    },
    {
      name: 'Parar na Primeira Correspondência',
      key: 'stopAtFirstMatch',
      type: 'boolean',
      description: 'Parar de avaliar após primeira condição verdadeira',
      required: false,
      default: true,
      ui: {
        widgetType: 'toggle',
        helperText: 'Útil para otimizar performance em listas longas',
        advanced: true,
      },
    },
    {
      name: 'Permitir Múltiplas Rotas',
      key: 'allowMultipleMatches',
      type: 'boolean',
      description: 'Permitir que múltiplas condições sejam verdadeiras simultaneamente',
      required: false,
      default: false,
      ui: {
        widgetType: 'toggle',
        helperText: 'Apenas para modo Multi-Branch: ativa múltiplas rotas ao mesmo tempo',
        advanced: true,
        showIf: "mode === 'multi-branch'",
      },
    },
    {
      name: 'Usar Contexto Global',
      key: 'useGlobalContext',
      type: 'boolean',
      description: 'Incluir contexto global nas avaliações',
      required: false,
      default: true,
      ui: {
        widgetType: 'toggle',
        helperText: 'Permite acessar variáveis globais da automação',
        advanced: true,
      },
    },
    {
      name: 'Usar Resultados Anteriores',
      key: 'usePreviousResults',
      type: 'boolean',
      description: 'Incluir resultados de nodes anteriores',
      required: false,
      default: true,
      ui: {
        widgetType: 'toggle',
        helperText: 'Permite acessar outputs de nodes anteriores',
        advanced: true,
      },
    },
  ],

  output: {
    type: 'object',
    description: 'Resultado da avaliação condicional',
    schema: {
      matchedBranches: 'array', // Rotas que foram ativadas
      defaultUsed: 'boolean',
      evaluationResults: 'array', // Detalhes de cada condição avaliada
      selectedRoute: 'string', // Rota principal selecionada
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

      // Preparar contexto de avaliação
      const evalContext: any = {
        data: args.inputValue || {},
      };

      if (args.useGlobalContext) {
        evalContext.context = context.globalContext || {};
      }

      if (args.usePreviousResults) {
        evalContext.previous = context.previousResults || {};
      }

      const evaluationResults: Array<{
        branch: string;
        condition: string;
        matched: boolean;
        error?: string;
        score?: number;
      }> = [];

      const matchedBranches: string[] = [];

      // Avaliar cada condição
      for (const branch of args.branches) {
        if (!branch.name || !branch.condition) {
          evaluationResults.push({
            branch: branch.name || 'unnamed',
            condition: branch.condition || 'none',
            matched: false,
            error: 'Branch inválido: faltam name ou condition',
          });
          continue;
        }

        try {
          // Criar função de avaliação com contexto seguro
          const evaluator = new Function(
            'data',
            'context',
            'previous',
            `with({ data, context, previous }) { return ${branch.condition}; }`
          );

          const result = evaluator(
            evalContext.data,
            evalContext.context,
            evalContext.previous
          );

          let matched = false;
          let score: number | undefined;

          // Para score-based, converter resultado em número
          if (args.mode === 'score-based') {
            score = typeof result === 'number' ? result : (result ? 1 : 0);
            matched = score > 0;
          } else {
            matched = Boolean(result);
          }

          evaluationResults.push({
            branch: branch.name,
            condition: branch.condition,
            matched,
            score,
          });

          if (matched) {
            matchedBranches.push(branch.name);

            // Parar na primeira correspondência se configurado
            if (args.stopAtFirstMatch && args.mode !== 'multi-branch') {
              break;
            }

            // Para multi-branch, continuar apenas se permitir múltiplas
            if (args.mode === 'multi-branch' && !args.allowMultipleMatches) {
              break;
            }
          }
        } catch (error: any) {
          evaluationResults.push({
            branch: branch.name,
            condition: branch.condition,
            matched: false,
            error: `Erro ao avaliar: ${error.message}`,
          });
        }
      }

      // Determinar rota selecionada
      let selectedRoute: string;
      let defaultUsed = false;

      if (args.mode === 'score-based') {
        // Escolher branch com maior score
        const withScores = evaluationResults
          .filter(r => r.matched && r.score !== undefined)
          .sort((a, b) => (b.score || 0) - (a.score || 0));

        if (withScores.length > 0) {
          selectedRoute = withScores[0].branch;
        } else {
          selectedRoute = args.defaultBranch || 'default';
          defaultUsed = true;
        }
      } else if (matchedBranches.length > 0) {
        selectedRoute = matchedBranches[0]; // Primeira rota matched
      } else {
        selectedRoute = args.defaultBranch || 'default';
        defaultUsed = true;
      }

      const executionTime = Date.now() - startTime;

      return {
        success: true,
        result: {
          mode: args.mode,
          matchedBranches,
          selectedRoute,
          defaultUsed,
          evaluationResults,
          totalBranches: args.branches.length,
        },
        metadata: {
          mode: args.mode,
          branchesEvaluated: evaluationResults.length,
          branchesMatched: matchedBranches.length,
        },
        executionTime,
      };
    } catch (error: any) {
      return {
        success: false,
        error: `Erro na avaliação condicional: ${error.message}`,
        executionTime: Date.now() - startTime,
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
    requiresNetwork: false,
    requiresFileSystem: false,
  },

  ui: {
    icon: 'GitBranch',
    color: '#a855f7', // purple
    tags: ['condition', 'if', 'switch', 'branch', 'route', 'logic', 'flow'],
    category: 'Controle de Fluxo',
    group: 'Lógica',
    examples: [
      {
        title: 'If-Else Simples',
        description: 'Verifica idade para maioridade',
        params: {
          mode: 'if-else',
          inputValue: '{ "age": 20 }',
          branches: [
            {
              name: 'maior',
              condition: 'data.age >= 18',
              description: 'Maior de idade',
            },
            {
              name: 'menor',
              condition: 'data.age < 18',
              description: 'Menor de idade',
            },
          ],
        },
        expectedOutput: {
          selectedRoute: 'maior',
          matchedBranches: ['maior'],
          defaultUsed: false,
        },
      },
      {
        title: 'Switch por Status',
        description: 'Rotear baseado em status HTTP',
        params: {
          mode: 'switch',
          inputValue: '{ "status": 200 }',
          branches: [
            { name: 'success', condition: 'data.status >= 200 && data.status < 300' },
            { name: 'redirect', condition: 'data.status >= 300 && data.status < 400' },
            { name: 'client_error', condition: 'data.status >= 400 && data.status < 500' },
            { name: 'server_error', condition: 'data.status >= 500' },
          ],
          defaultBranch: 'unknown',
        },
      },
      {
        title: 'Multi-Branch (Rotas Simultâneas)',
        description: 'Ativar múltiplas rotas ao mesmo tempo',
        params: {
          mode: 'multi-branch',
          inputValue: '{ "score": 85, "premium": true, "country": "BR" }',
          branches: [
            { name: 'high_score', condition: 'data.score > 80' },
            { name: 'premium_user', condition: 'data.premium === true' },
            { name: 'brazil', condition: 'data.country === "BR"' },
          ],
          allowMultipleMatches: true,
        },
        expectedOutput: {
          selectedRoute: 'high_score',
          matchedBranches: ['high_score', 'premium_user', 'brazil'],
        },
      },
      {
        title: 'Score-Based (Melhor Match)',
        description: 'Escolher rota com maior pontuação',
        params: {
          mode: 'score-based',
          branches: [
            { name: 'urgent', condition: 'data.priority === "high" ? 10 : 0' },
            { name: 'important', condition: 'data.category === "important" ? 8 : 0' },
            { name: 'normal', condition: '5' },
          ],
        },
      },
      {
        title: 'Condição com Context',
        description: 'Usar contexto global e resultados anteriores',
        params: {
          mode: 'if-else',
          useGlobalContext: true,
          usePreviousResults: true,
          branches: [
            { 
              name: 'admin_path',
              condition: 'context.user.role === "admin" && previous.auth.success === true'
            },
            { 
              name: 'user_path',
              condition: 'context.user.role === "user"'
            },
          ],
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
