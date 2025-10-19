/**
 * FLUI - Automation Executor (REFATORADO)
 * 
 * Executor de automações usando o novo Tool Registry System
 * Sistema 100% dinâmico, sem hard-code
 */

import { nanoid } from 'nanoid';
import {
  Automation,
  AutomationExecution,
  AutomationNode,
  ExecutionLog,
  ExecutionStatus,
} from '../types/automation.js';
import { ToolExecutor } from '../core/toolExecutor.js';
import { getToolRegistry } from '../core/toolRegistry.js';
import { ExecutionContext } from '../core/types.js';

export class AutomationExecutorNew {
  private automation: Automation;
  private execution: AutomationExecution;
  private onLog: (log: ExecutionLog) => void;
  private globalContext: Record<string, any> = {};

  constructor(automation: Automation, onLog: (log: ExecutionLog) => void) {
    this.automation = automation;
    this.onLog = onLog;
    this.execution = {
      id: nanoid(),
      automationId: automation.id,
      status: 'pending',
      startedAt: new Date().toISOString(),
      logs: [],
    };
  }

  private log(
    nodeId: string,
    nodeName: string,
    status: ExecutionStatus,
    message: string,
    data?: any,
    error?: string
  ): void {
    const log: ExecutionLog = {
      timestamp: new Date().toISOString(),
      nodeId,
      nodeName,
      status,
      message,
      data,
      error,
    };
    this.execution.logs.push(log);
    this.onLog(log);
  }

  async execute(): Promise<AutomationExecution> {
    this.execution.status = 'running';
    this.log('root', 'Automação', 'running', `Iniciando: ${this.automation.name}`);

    try {
      // Encontrar nó inicial
      const startNode = this.automation.nodes.find((n) => n.id === this.automation.startNodeId);
      if (!startNode) {
        throw new Error('Nó inicial não encontrado');
      }

      // Executar a partir do nó inicial
      await this.executeNode(startNode);

      this.execution.status = 'completed';
      this.execution.completedAt = new Date().toISOString();
      this.execution.result = this.globalContext;
      this.log('root', 'Automação', 'completed', 'Concluída com sucesso');
    } catch (error: any) {
      this.execution.status = 'failed';
      this.execution.completedAt = new Date().toISOString();
      this.execution.error = error.message;
      this.log('root', 'Automação', 'failed', `Erro: ${error.message}`, undefined, error.message);
    }

    return this.execution;
  }

  private async executeNode(node: AutomationNode): Promise<void> {
    this.log(node.id, node.name, 'running', `Executando: ${node.type}`);

    try {
      // Criar contexto de execução para este nó
      const context: ExecutionContext = {
        automationId: this.automation.id,
        nodeId: node.id,
        previousResults: this.globalContext,
        globalContext: this.globalContext,
        timeout: node.config.timeout,
      };

      // Executar baseado no tipo
      let result: any;

      if (node.type === 'trigger') {
        // Trigger é especial, apenas inicializa
        result = {
          triggered: true,
          timestamp: new Date().toISOString(),
          data: node.config.data || {},
        };
      } else {
        // Todos os outros tipos usam o Tool Registry
        const toolId = this.mapNodeTypeToToolId(node.type, node.config);
        
        if (!toolId) {
          throw new Error(`Tipo de nó não mapeado: ${node.type}`);
        }

        // Preparar argumentos
        const args = this.prepareToolArgs(node);

        // Executar tool via registry
        const toolResult = await ToolExecutor.execute(toolId, args, context);

        if (!toolResult.success) {
          throw new Error(toolResult.error || 'Falha na execução da tool');
        }

        result = toolResult.result;
      }

      // Armazenar resultado no contexto global
      this.globalContext[node.id] = result;

      this.log(node.id, node.name, 'completed', `Concluído: ${node.type}`, result);

      // Executar próximos nós
      for (const nextNodeId of node.nextNodes) {
        const nextNode = this.automation.nodes.find((n) => n.id === nextNodeId);
        if (nextNode) {
          await this.executeNode(nextNode);
        }
      }
    } catch (error: any) {
      this.log(
        node.id,
        node.name,
        'failed',
        `Erro: ${error.message}`,
        undefined,
        error.message
      );
      throw error;
    }
  }

  /**
   * Mapeia tipo de nó antigo para Tool ID
   */
  private mapNodeTypeToToolId(nodeType: string, config: any): string | null {
    const registry = getToolRegistry();

    switch (nodeType) {
      case 'agent':
        return 'agent-executor';
      
      case 'http_request':
      case 'webhook':
        return 'http-request';
      
      case 'file_operation':
        // Determinar qual file tool usar baseado na operação
        const operation = config.operation || 'read';
        if (operation === 'read') return 'file-read';
        if (operation === 'write') return 'file-write';
        if (operation === 'edit') return 'file-edit';
        return 'file-read';
      
      case 'mcp_tool':
        // MCPs serão tools registradas dinamicamente
        // ID será: mcp-{mcpId}-{toolId}
        return config.toolId || null;
      
      case 'custom_code':
        return 'custom-code';
      
      case 'shell':
        return 'shell-executor';
      
      case 'system_info':
        return 'system-info';
      
      // Tipos legados que ainda precisam de implementação especial
      case 'condition':
      case 'loop':
      case 'delay':
      case 'data_transform':
        // Estes serão convertidos em tools depois
        return null;
      
      default:
        // Tentar buscar diretamente no registry
        if (registry.has(nodeType)) {
          return nodeType;
        }
        return null;
    }
  }

  /**
   * Prepara argumentos para a tool baseado no nó
   */
  private prepareToolArgs(node: AutomationNode): any {
    const args: any = { ...node.config };

    // Resolver referências a resultados anteriores
    if (node.config.inputFrom) {
      args.input = this.globalContext[node.config.inputFrom];
    }

    // Remover campos de metadados que não são argumentos da tool
    delete args.inputFrom;
    delete args.timeout;
    delete args.toolId; // Usado apenas para mapeamento

    return args;
  }
}

/**
 * Função helper para executar automação
 */
export const executeAutomationNew = async (
  automation: Automation,
  onLog: (log: ExecutionLog) => void
): Promise<AutomationExecution> => {
  const executor = new AutomationExecutorNew(automation, onLog);
  return await executor.execute();
};
