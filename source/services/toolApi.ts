/**
 * FLUI - Tool API Service
 * 
 * Serviço unificado para execução de tools
 * Compatível com frontend e CLI
 */

import { ToolExecutor } from '../core/toolExecutor.js';
import { getToolRegistry } from '../core/toolRegistry.js';
import { ExecutionContext, ToolResult } from '../core/types.js';
import { applySandboxDefaults } from './sandboxDefaults.js';
import { useStore } from '../store/store.js';

export interface ToolExecutionRequest {
  nodeId?: string;
  toolId: string;
  params: any;
  context?: Partial<ExecutionContext>;
  sandbox?: boolean;
}

export interface ToolExecutionResponse {
  nodeId?: string;
  toolId: string;
  result: ToolResult;
  executionTime: number;
  sandbox: boolean;
  timestamp: string;
}

/**
 * Executa uma tool com contexto completo
 */
export async function executeTool(
  request: ToolExecutionRequest
): Promise<ToolExecutionResponse> {
  const startTime = Date.now();

  try {
    // Obter tool do registry
    const registry = getToolRegistry();
    const tool = registry.get(request.toolId);

    if (!tool) {
      return {
        nodeId: request.nodeId,
        toolId: request.toolId,
        result: {
          success: false,
          error: `Tool '${request.toolId}' não encontrada`,
        },
        executionTime: 0,
        sandbox: false,
        timestamp: new Date().toISOString(),
      };
    }

    // Aplicar defaults de sandbox se necessário
    let params = { ...request.params };
    if (tool.config?.sandbox) {
      params = await applySandboxDefaults(request.toolId, params);
    }

    // Construir contexto completo
    const context: ExecutionContext = {
      automationId: request.context?.automationId || 'test-automation',
      nodeId: request.nodeId || 'test-node',
      sandboxPath: request.context?.sandboxPath,
      globalContext: request.context?.globalContext || {},
      previousResults: request.context?.previousResults || {},
    };

    // Para agent-executor, popular opções de agentes dinamicamente
    if (request.toolId === 'agent-executor') {
      const store = useStore.getState();
      const agents = store.agents;
      
      // Se não tem agentId, validar que existem agentes
      if (!params.agentId) {
        if (agents.length === 0) {
          return {
            nodeId: request.nodeId,
            toolId: request.toolId,
            result: {
              success: false,
              error: 'Nenhum agente disponível. Crie um agente primeiro.',
            },
            executionTime: Date.now() - startTime,
            sandbox: false,
            timestamp: new Date().toISOString(),
          };
        }
        // Usar primeiro agente como padrão
        params.agentId = agents[0].id;
      }
    }

    // Executar tool
    const result = await ToolExecutor.executeTool(
      tool,
      params,
      context,
      {
        timeout: request.context?.timeout,
      }
    );

    const executionTime = Date.now() - startTime;

    return {
      nodeId: request.nodeId,
      toolId: request.toolId,
      result,
      executionTime,
      sandbox: tool.config?.sandbox || false,
      timestamp: new Date().toISOString(),
    };
  } catch (error: any) {
    return {
      nodeId: request.nodeId,
      toolId: request.toolId,
      result: {
        success: false,
        error: `Erro ao executar tool: ${error.message}`,
      },
      executionTime: Date.now() - startTime,
      sandbox: false,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Lista todas as tools disponíveis com metadata
 */
export function listTools() {
  const registry = getToolRegistry();
  const result = registry.list();

  return result.tools.map((tool: any) => ({
    id: tool.id,
    name: tool.name,
    description: tool.description,
    category: tool.category,
    version: tool.version,
    params: tool.params.map((p: any) => ({
      name: p.name,
      key: p.key,
      type: p.type,
      required: p.required,
      default: p.default,
      description: p.description,
      ui: p.ui,
    })),
    ui: tool.ui,
    capabilities: tool.capabilities,
    config: tool.config,
  }));
}

/**
 * Obtém metadata de uma tool específica
 */
export function getToolMetadata(toolId: string) {
  const registry = getToolRegistry();
  const tool = registry.get(toolId);

  if (!tool) {
    return null;
  }

  // Enriquecer params com opções dinâmicas
  const enrichedParams = tool.params.map((param) => {
    const enriched = { ...param };

    // Para agent selector, adicionar agentes disponíveis
    if (toolId === 'agent-executor' && param.key === 'agentId') {
      const store = useStore.getState();
      const agents = store.agents;
      const existingUi = enriched.ui || { widgetType: 'select' as const };
      enriched.ui = {
        ...existingUi,
        options: agents.map((agent: any) => ({
          label: agent.name,
          value: agent.id,
          description: agent.systemPrompt.substring(0, 100) + '...',
        })),
      };
    }

    return enriched;
  });

  return {
    ...tool,
    params: enrichedParams,
  };
}

/**
 * Testa uma tool com parâmetros específicos
 */
export async function testTool(
  toolId: string,
  params: any
): Promise<ToolResult> {
  const response = await executeTool({
    toolId,
    params,
    context: {
      automationId: 'test',
      nodeId: 'test-node',
    },
  });

  return response.result;
}
