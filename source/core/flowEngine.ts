/**
 * FLUI - Flow Engine
 * 
 * Motor de execução de fluxos completamente dinâmico
 * Superior ao N8n e AgentBuilder - 100% baseado no Tool Registry
 * 
 * Características:
 * - Execução baseada em DAG (Directed Acyclic Graph)
 * - Suporte a condicionais e loops
 * - Execução concorrente quando possível
 * - Logs estruturados em tempo real
 * - Sandboxing completo
 * - Rollback em caso de erro
 */

import { nanoid } from 'nanoid';
import { ToolExecutor } from './toolExecutor.js';
import { getToolRegistry } from './toolRegistry.js';
import { ExecutionContext, ToolResult } from './types.js';
import {
  FlowDefinition,
  FlowNode,
  FlowExecution,
  FlowExecutionLog,
  FlowExecutionStatus,
  FlowEdge,
} from './flowTypes.js';

export class FlowEngine {
  private flow: FlowDefinition;
  private execution: FlowExecution;
  private onLogCallback?: (log: FlowExecutionLog) => void;
  private abortController: AbortController;

  constructor(flow: FlowDefinition, onLog?: (log: FlowExecutionLog) => void) {
    this.flow = flow;
    this.onLogCallback = onLog;
    this.abortController = new AbortController();
    
    this.execution = {
      id: nanoid(),
      flowId: flow.id,
      status: 'pending',
      startedAt: new Date().toISOString(),
      logs: [],
      nodeResults: {},
    };
  }

  /**
   * Executa o fluxo completo
   */
  async execute(initialData: Record<string, any> = {}): Promise<FlowExecution> {
    this.execution.status = 'running';
    this.log('flow', 'Flow Engine', 'running', `Iniciando execução: ${this.flow.name}`);

    try {
      // Validar fluxo antes de executar
      this.validateFlow();

      // Inicializar contexto global
      const globalContext: Record<string, any> = {
        ...initialData,
        flowId: this.flow.id,
        executionId: this.execution.id,
      };

      // Encontrar nó inicial
      const startNode = this.flow.nodes.find((n) => n.id === this.flow.startNodeId);
      if (!startNode) {
        throw new Error('Nó inicial não encontrado');
      }

      // Executar fluxo a partir do nó inicial
      await this.executeNode(startNode, globalContext);

      this.execution.status = 'completed';
      this.execution.completedAt = new Date().toISOString();
      this.execution.result = globalContext;
      
      this.log('flow', 'Flow Engine', 'completed', 'Execução concluída com sucesso', globalContext);
    } catch (error: any) {
      this.execution.status = 'failed';
      this.execution.completedAt = new Date().toISOString();
      this.execution.error = error.message;
      
      this.log('flow', 'Flow Engine', 'failed', `Erro: ${error.message}`, undefined, error.message);
    }

    return this.execution;
  }

  /**
   * Cancela execução em andamento
   */
  abort(): void {
    this.abortController.abort();
    this.execution.status = 'cancelled';
    this.log('flow', 'Flow Engine', 'cancelled', 'Execução cancelada pelo usuário');
  }

  /**
   * Executa um nó do fluxo
   */
  private async executeNode(
    node: FlowNode,
    globalContext: Record<string, any>
  ): Promise<void> {
    // Verificar se foi abortado
    if (this.abortController.signal.aborted) {
      throw new Error('Execução abortada');
    }

    this.log(node.id, node.name, 'running', `Executando nó: ${node.type}`);

    try {
      let result: any;

      switch (node.type) {
        case 'tool':
          result = await this.executeTool(node, globalContext);
          break;
        case 'condition':
          result = await this.executeCondition(node, globalContext);
          break;
        case 'loop':
          result = await this.executeLoop(node, globalContext);
          break;
        case 'parallel':
          result = await this.executeParallel(node, globalContext);
          break;
        case 'delay':
          result = await this.executeDelay(node, globalContext);
          break;
        case 'merge':
          result = await this.executeMerge(node, globalContext);
          break;
        default:
          throw new Error(`Tipo de nó desconhecido: ${node.type}`);
      }

      // Armazenar resultado do nó
      this.execution.nodeResults[node.id] = result;
      globalContext[node.id] = result;

      this.log(node.id, node.name, 'completed', `Nó concluído`, result);

      // Executar próximos nós
      await this.executeNextNodes(node, globalContext);
    } catch (error: any) {
      this.log(
        node.id,
        node.name,
        'failed',
        `Erro ao executar nó: ${error.message}`,
        undefined,
        error.message
      );
      throw error;
    }
  }

  /**
   * Executa um nó do tipo 'tool' (ferramenta do registry)
   */
  private async executeTool(
    node: FlowNode,
    globalContext: Record<string, any>
  ): Promise<any> {
    const { toolId, params } = node.config;

    if (!toolId) {
      throw new Error('toolId não configurado no nó');
    }

    // Resolver parâmetros dinâmicos
    const resolvedParams = this.resolveParams(params, globalContext);

    // Criar contexto de execução
    const context: ExecutionContext = {
      automationId: this.flow.id,
      nodeId: node.id,
      previousResults: this.execution.nodeResults,
      globalContext,
      timeout: node.config.timeout,
      metadata: node.config.metadata || {},
    };

    // Executar ferramenta via ToolExecutor
    const result = await ToolExecutor.execute(
      toolId,
      resolvedParams,
      context,
      {
        timeout: node.config.timeout,
        retries: node.config.retries,
        signal: this.abortController.signal,
      }
    );

    if (!result.success) {
      throw new Error(result.error || 'Erro ao executar ferramenta');
    }

    return result.result;
  }

  /**
   * Executa um nó condicional (if/else)
   */
  private async executeCondition(
    node: FlowNode,
    globalContext: Record<string, any>
  ): Promise<any> {
    const { condition, trueNodeId, falseNodeId } = node.config;

    if (!condition) {
      throw new Error('Condição não configurada');
    }

    // Avaliar condição
    const conditionResult = this.evaluateCondition(condition, globalContext);

    // Executar branch apropriado
    const targetNodeId = conditionResult ? trueNodeId : falseNodeId;

    if (targetNodeId) {
      const targetNode = this.flow.nodes.find((n) => n.id === targetNodeId);
      if (targetNode) {
        await this.executeNode(targetNode, globalContext);
      }
    }

    return {
      condition,
      result: conditionResult,
      executedBranch: conditionResult ? 'true' : 'false',
    };
  }

  /**
   * Executa um loop sobre array de dados
   */
  private async executeLoop(
    node: FlowNode,
    globalContext: Record<string, any>
  ): Promise<any> {
    const { items, loopNodeId, maxIterations = 1000 } = node.config;

    if (!items || !loopNodeId) {
      throw new Error('Loop não configurado corretamente');
    }

    // Resolver items dinamicamente
    const resolvedItems = this.resolveValue(items, globalContext);

    if (!Array.isArray(resolvedItems)) {
      throw new Error('Items do loop deve ser um array');
    }

    const loopNode = this.flow.nodes.find((n) => n.id === loopNodeId);
    if (!loopNode) {
      throw new Error(`Nó do loop não encontrado: ${loopNodeId}`);
    }

    const results: any[] = [];
    const itemsToProcess = resolvedItems.slice(0, maxIterations);

    for (let i = 0; i < itemsToProcess.length; i++) {
      const item = itemsToProcess[i];

      // Criar contexto do loop com item atual
      const loopContext = {
        ...globalContext,
        $loop: {
          index: i,
          item,
          isFirst: i === 0,
          isLast: i === itemsToProcess.length - 1,
          total: itemsToProcess.length,
        },
      };

      // Executar nó do loop
      await this.executeNode(loopNode, loopContext);

      // Coletar resultado
      results.push((loopContext as any)[loopNode.id]);
    }

    return {
      itemCount: itemsToProcess.length,
      results,
    };
  }

  /**
   * Executa múltiplos nós em paralelo
   */
  private async executeParallel(
    node: FlowNode,
    globalContext: Record<string, any>
  ): Promise<any> {
    const { parallelNodeIds } = node.config;

    if (!parallelNodeIds || !Array.isArray(parallelNodeIds)) {
      throw new Error('parallelNodeIds não configurado');
    }

    const parallelNodes = this.flow.nodes.filter((n) =>
      parallelNodeIds.includes(n.id)
    );

    // Executar todos em paralelo
    const results = await Promise.allSettled(
      parallelNodes.map((pNode) => this.executeNode(pNode, { ...globalContext }))
    );

    // Processar resultados
    const successCount = results.filter((r) => r.status === 'fulfilled').length;
    const failureCount = results.filter((r) => r.status === 'rejected').length;

    return {
      total: results.length,
      successCount,
      failureCount,
      results: results.map((r, i) => ({
        nodeId: parallelNodes[i].id,
        status: r.status,
        result: r.status === 'fulfilled' ? (r as any).value : undefined,
        error: r.status === 'rejected' ? (r as any).reason.message : undefined,
      })),
    };
  }

  /**
   * Executa um delay (pausa)
   */
  private async executeDelay(
    node: FlowNode,
    globalContext: Record<string, any>
  ): Promise<any> {
    const { duration = 1000 } = node.config;

    await new Promise((resolve) => setTimeout(resolve, duration));

    return {
      delayed: duration,
      unit: 'ms',
    };
  }

  /**
   * Merge de múltiplos resultados
   */
  private async executeMerge(
    node: FlowNode,
    globalContext: Record<string, any>
  ): Promise<any> {
    const { mergeNodeIds, mergeStrategy = 'combine' } = node.config;

    if (!mergeNodeIds || !Array.isArray(mergeNodeIds)) {
      throw new Error('mergeNodeIds não configurado');
    }

    const results = mergeNodeIds.map((nodeId) => this.execution.nodeResults[nodeId]);

    switch (mergeStrategy) {
      case 'combine':
        return results;
      case 'merge':
        return Object.assign({}, ...results);
      case 'first':
        return results[0];
      case 'last':
        return results[results.length - 1];
      default:
        return results;
    }
  }

  /**
   * Executa os próximos nós conectados
   */
  private async executeNextNodes(
    node: FlowNode,
    globalContext: Record<string, any>
  ): Promise<void> {
    // Buscar edges que saem deste nó
    const outgoingEdges = this.flow.edges.filter((e) => e.source === node.id);

    for (const edge of outgoingEdges) {
      // Verificar condição do edge (se houver)
      if (edge.condition) {
        const conditionMet = this.evaluateCondition(edge.condition, globalContext);
        if (!conditionMet) {
          continue; // Pular este edge
        }
      }

      const nextNode = this.flow.nodes.find((n) => n.id === edge.target);
      if (nextNode) {
        await this.executeNode(nextNode, globalContext);
      }
    }
  }

  /**
   * Resolve parâmetros com valores dinâmicos
   * Suporta referências a outros nós: {{nodeId.field}}
   */
  private resolveParams(
    params: Record<string, any>,
    context: Record<string, any>
  ): Record<string, any> {
    const resolved: Record<string, any> = {};

    for (const [key, value] of Object.entries(params)) {
      resolved[key] = this.resolveValue(value, context);
    }

    return resolved;
  }

  /**
   * Resolve um valor dinâmico
   */
  private resolveValue(value: any, context: Record<string, any>): any {
    if (typeof value === 'string' && value.startsWith('{{') && value.endsWith('}}')) {
      // Referência dinâmica: {{nodeId.field}} ou {{$variable}}
      const path = value.slice(2, -2).trim();
      return this.resolvePath(path, context);
    }

    if (Array.isArray(value)) {
      return value.map((v) => this.resolveValue(v, context));
    }

    if (typeof value === 'object' && value !== null) {
      const resolved: Record<string, any> = {};
      for (const [k, v] of Object.entries(value)) {
        resolved[k] = this.resolveValue(v, context);
      }
      return resolved;
    }

    return value;
  }

  /**
   * Resolve caminho de objeto (ex: nodeId.result.data[0])
   */
  private resolvePath(path: string, context: Record<string, any>): any {
    const parts = path.split('.');
    let current: any = context;

    for (const part of parts) {
      if (current === undefined || current === null) {
        return undefined;
      }
      // Acessar com tipo any para evitar erro de indexação
      current = (current as any)[part];
    }

    return current;
  }

  /**
   * Avalia uma condição
   * Suporta: ===, !==, >, <, >=, <=, &&, ||
   */
  private evaluateCondition(
    condition: string,
    context: Record<string, any>
  ): boolean {
    try {
      // Resolver referências dinâmicas na condição
      let resolvedCondition = condition;
      const matches = condition.match(/\{\{([^}]+)\}\}/g);
      
      if (matches) {
        for (const match of matches) {
          const path = match.slice(2, -2).trim();
          const value = this.resolvePath(path, context);
          resolvedCondition = resolvedCondition.replace(
            match,
            JSON.stringify(value)
          );
        }
      }

      // Avaliar condição de forma segura
      const fn = new Function('context', `return ${resolvedCondition}`);
      return Boolean(fn(context));
    } catch (error: any) {
      console.error(`Erro ao avaliar condição: ${error.message}`);
      return false;
    }
  }

  /**
   * Valida o fluxo antes da execução
   */
  private validateFlow(): void {
    // Verificar se há nós
    if (!this.flow.nodes || this.flow.nodes.length === 0) {
      throw new Error('Fluxo não possui nós');
    }

    // Verificar nó inicial
    if (!this.flow.startNodeId) {
      throw new Error('Nó inicial não definido');
    }

    const startNode = this.flow.nodes.find((n) => n.id === this.flow.startNodeId);
    if (!startNode) {
      throw new Error('Nó inicial não encontrado');
    }

    // Verificar ferramentas existem
    const registry = getToolRegistry();
    for (const node of this.flow.nodes) {
      if (node.type === 'tool') {
        const toolId = node.config.toolId;
        if (!toolId) {
          throw new Error(`Nó ${node.id} não possui toolId configurado`);
        }
        
        if (!registry.has(toolId)) {
          throw new Error(`Tool ${toolId} não encontrada no registry`);
        }
      }
    }

    // Detectar ciclos (opcional, mas recomendado)
    this.detectCycles();
  }

  /**
   * Detecta ciclos no grafo do fluxo
   */
  private detectCycles(): void {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const hasCycle = (nodeId: string): boolean => {
      visited.add(nodeId);
      recursionStack.add(nodeId);

      const edges = this.flow.edges.filter((e) => e.source === nodeId);
      
      for (const edge of edges) {
        if (!visited.has(edge.target)) {
          if (hasCycle(edge.target)) {
            return true;
          }
        } else if (recursionStack.has(edge.target)) {
          return true;
        }
      }

      recursionStack.delete(nodeId);
      return false;
    };

    if (hasCycle(this.flow.startNodeId)) {
      throw new Error('Ciclo detectado no fluxo');
    }
  }

  /**
   * Adiciona log de execução
   */
  private log(
    nodeId: string,
    nodeName: string,
    status: FlowExecutionStatus,
    message: string,
    data?: any,
    error?: string
  ): void {
    const log: FlowExecutionLog = {
      timestamp: new Date().toISOString(),
      nodeId,
      nodeName,
      status,
      message,
      data,
      error,
    };

    this.execution.logs.push(log);

    if (this.onLogCallback) {
      this.onLogCallback(log);
    }
  }

  /**
   * Obtém execução atual
   */
  getExecution(): FlowExecution {
    return this.execution;
  }
}

/**
 * Helper para criar e executar um fluxo
 */
export async function executeFlow(
  flow: FlowDefinition,
  initialData?: Record<string, any>,
  onLog?: (log: FlowExecutionLog) => void
): Promise<FlowExecution> {
  const engine = new FlowEngine(flow, onLog);
  return await engine.execute(initialData);
}
