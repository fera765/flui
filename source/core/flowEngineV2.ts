/**
 * FLUI - Flow Engine V2 (com padrão universal de Input/Output)
 * 
 * Motor de execução completamente refatorado para suportar:
 * - Padrão universal de dados entre nodes
 * - Mapeamento dinâmico de inputs
 * - Rastreabilidade completa
 * - Conexão automática e inteligente
 */

import { generateId } from '../utils/id.js';
import { ToolExecutor } from './toolExecutor.js';
import { getToolRegistry } from './toolRegistry.js';
import { ExecutionContext } from './types.js';
import {
  FlowDefinition,
  FlowNode,
  FlowExecution,
  FlowExecutionLog,
  FlowEdge,
} from './flowTypes.js';
import {
  NodeOutput,
  NodeInputConfig,
  createInitialOutput,
  createNodeDataItem,
  applyInputMappings,
  validateNodeOutput,
  convertLegacyOutput,
  extractAvailableKeys,
} from './nodeDataTypes.js';
import { resolveReferences, validateReferences, hasReferences } from './referenceResolver.js';

export class FlowEngineV2 {
  private flow: FlowDefinition;
  private execution: FlowExecution;
  private onLogCallback?: (log: FlowExecutionLog) => void;
  private abortController: AbortController;
  
  // Armazena outputs de cada node no formato padronizado
  private nodeOutputs: Map<string, NodeOutput> = new Map();

  constructor(flow: FlowDefinition, onLog?: (log: FlowExecutionLog) => void) {
    this.flow = flow;
    this.onLogCallback = onLog;
    this.abortController = new AbortController();
    
    this.execution = {
      id: generateId(),
      flowId: flow.id,
      status: 'pending',
      startedAt: new Date().toISOString(),
      logs: [],
      nodeResults: {},
    };
  }

  /**
   * Executar fluxo até um node específico (para testes)
   */
  async executeUntilNode(targetNodeId: string, initialData: Record<string, any> = {}): Promise<FlowExecution> {
    console.log('🎯 [FlowEngineV2] Executando até node:', targetNodeId);
    
    this.execution.status = 'running';
    this.execution.startedAt = new Date().toISOString();
    this.log('flow', 'Flow Engine V2', 'running', `Iniciando execução até node: ${targetNodeId}`);

    try {
      // Validar fluxo
      this.validateFlow();
      
      const executionOrder = this.getExecutionOrder();
      console.log('📋 [FlowEngineV2] Ordem de execução:', executionOrder);
      
      // Encontrar índice do node alvo
      const targetIndex = executionOrder.indexOf(targetNodeId);
      if (targetIndex === -1) {
        throw new Error(`Node ${targetNodeId} não encontrado na ordem de execução`);
      }
      
      // Executar apenas até o node alvo (incluindo ele)
      const nodesToExecute = executionOrder.slice(0, targetIndex + 1);
      console.log('🎯 [FlowEngineV2] Executando nodes:', nodesToExecute);

      for (const nodeId of nodesToExecute) {
        // Verificar se foi cancelado
        if (this.abortController.signal.aborted) {
          throw new Error('Execução cancelada');
        }
        
        const node = this.flow.nodes.find((n) => n.id === nodeId);
        if (!node) {
          this.log(nodeId, 'Unknown', 'failed', `Node ${nodeId} não encontrado`);
          continue;
        }

        await this.executeNodeV2(node);
      }

      this.execution.status = 'completed';
      this.execution.completedAt = new Date().toISOString();
      
      // Resultado é o output do node testado
      this.execution.result = this.nodeOutputs.get(targetNodeId);
      
      this.log('flow', 'Flow Engine V2', 'completed', `Fluxo executado até node ${targetNodeId} com sucesso`);
    } catch (error: any) {
      this.execution.status = 'failed';
      this.execution.completedAt = new Date().toISOString();
      this.execution.error = error.message;
      this.log('flow', 'Flow Engine V2', 'failed', `Erro: ${error.message}`, undefined, error.message);
    }

    return this.execution;
  }

  /**
   * Executa o fluxo completo com novo padrão
   */
  async execute(initialData: Record<string, any> = {}): Promise<FlowExecution> {
    this.execution.status = 'running';
    this.log('flow', 'Flow Engine V2', 'running', `Iniciando execução: ${this.flow.name}`);

    try {
      // Validar fluxo
      this.validateFlow();

      // Obter ordem de execução (topological sort)
      const executionOrder = this.getExecutionOrder();

      // Executar nodes em ordem
      for (const nodeId of executionOrder) {
        // Verificar se foi cancelado
        if (this.abortController.signal.aborted) {
          throw new Error('Execução cancelada');
        }
        
        const node = this.flow.nodes.find((n) => n.id === nodeId);
        if (!node) continue;
        
        // Para o node inicial, injetar dados iniciais
        if (nodeId === this.flow.startNodeId && Object.keys(initialData).length > 0) {
          // Adicionar dados iniciais ao config temporariamente
          node.config = { ...node.config, ...initialData };
        }
        
        await this.executeNodeV2(node);
      }

      this.execution.status = 'completed';
      this.execution.completedAt = new Date().toISOString();
      
      // Resultado final é o output do último node
      const lastNodeId = executionOrder[executionOrder.length - 1];
      this.execution.result = this.nodeOutputs.get(lastNodeId);
      
      this.log('flow', 'Flow Engine V2', 'completed', 'Execução concluída com sucesso');
    } catch (error: any) {
      this.execution.status = 'failed';
      this.execution.completedAt = new Date().toISOString();
      this.execution.error = error.message;
      
      this.log('flow', 'Flow Engine V2', 'failed', `Erro: ${error.message}`, undefined, error.message);
    }

    return this.execution;
  }

  /**
   * Executa um node individual com novo padrão
   */
  private async executeNodeV2(node: FlowNode): Promise<void> {
    this.log(node.id, node.name, 'running', `Executando node: ${node.name}`);
    
    const startTime = Date.now();

    try {
      // Obter nodes anteriores
      const previousNodes = this.getPreviousNodes(node.id);
      
      // Preparar dados de entrada usando mapeamentos
      const inputData = this.prepareInputData(node, previousNodes);
      
      // Executar node baseado no tipo
      let output: NodeOutput;
      
      if (node.type === 'tool') {
        output = await this.executeToolNode(node, inputData);
      } else if (node.type === 'condition') {
        output = await this.executeConditionNode(node, inputData);
      } else if (node.type === 'loop') {
        output = await this.executeLoopNode(node, inputData);
      } else if (node.type === 'manual-trigger' || node.type === 'cron-trigger' || node.type === 'webhook-trigger') {
        // Triggers são nodes especiais que apenas iniciam o fluxo
        output = {
          success: true,
          triggered: true,
          timestamp: new Date().toISOString(),
          triggerType: node.type,
          triggerData: inputData || {},
          message: node.config.triggerMessage || `Trigger ${node.type} ativado`
        };
      } else {
        throw new Error(`Tipo de node não suportado: ${node.type}`);
      }
      
      // Validar output
      const validation = validateNodeOutput(output);
      if (!validation.valid) {
        throw new Error(`Output inválido: ${validation.errors.join(', ')}`);
      }
      
      // Armazenar output
      this.nodeOutputs.set(node.id, output);
      this.execution.nodeResults[node.id] = output;
      
      const duration = Date.now() - startTime;
      this.log(
        node.id,
        node.name,
        'completed',
        `Node executado com sucesso (${duration}ms)`,
        { output, availableKeys: extractAvailableKeys(output) }
      );
    } catch (error: any) {
      this.log(node.id, node.name, 'failed', `Erro ao executar node: ${error.message}`, undefined, error.message);
      throw error;
    }
  }

  /**
   * Executa um node do tipo "tool"
   */
  private async executeToolNode(node: FlowNode, inputData: Record<string, any>): Promise<NodeOutput> {
    const toolId = node.config.toolId as string;
    if (!toolId) {
      throw new Error('toolId não especificado no config');
    }
    
    // 🆕 RESOLVER REFERÊNCIAS no config antes de executar
    let resolvedConfig = { ...node.config };
    
    if (hasReferences(node.config)) {
      const validation = validateReferences(node.config, {
        nodeOutputs: this.nodeOutputs,
      });
      
      if (!validation.valid) {
        console.warn('⚠️  Referências inválidas encontradas:', validation.errors);
      }
      
      resolvedConfig = resolveReferences(node.config, {
        nodeOutputs: this.nodeOutputs,
      });
      
      this.log(
        node.id,
        node.name,
        'running',
        'Referências resolvidas',
        { original: node.config, resolved: resolvedConfig }
      );
    }
    
    // Merge inputData com config resolvido
    const finalInput = { ...inputData, ...resolvedConfig };
    
    // Remover campos internos que não devem ser passados para a tool
    delete finalInput.inputConfig;
    delete finalInput.nodeId;
    
    // Criar contexto de execução
    const context: ExecutionContext = {
      automationId: this.flow.id,
      nodeId: node.id,
      globalContext: {},
      previousResults: Object.fromEntries(this.nodeOutputs),
      sandboxPath: node.config.sandboxPath || finalInput.sandboxPath,
    };
    
    // Executar tool
    const result = await ToolExecutor.execute(toolId, finalInput, context);
    
    if (!result.success) {
      throw new Error(result.error || 'Tool execution failed');
    }
    
    // Converter resultado para formato padronizado
    return [createNodeDataItem(result.result || {}, node.id, node.name, this.execution.id)];
  }

  /**
   * Executa um node do tipo "condition"
   */
  private async executeConditionNode(node: FlowNode, inputData: Record<string, any>): Promise<NodeOutput> {
    // Implementação de condicional
    const condition = node.config.condition as string;
    const result = this.evaluateCondition(condition, inputData);
    
    return [createNodeDataItem({ conditionResult: result, ...inputData }, node.id, node.name, this.execution.id)];
  }

  /**
   * Executa um node do tipo "loop"
   */
  private async executeLoopNode(node: FlowNode, inputData: Record<string, any>): Promise<NodeOutput> {
    // Implementação de loop
    const arrayKey = node.config.arrayKey as string;
    const array = inputData[arrayKey];
    
    if (!Array.isArray(array)) {
      throw new Error(`${arrayKey} não é um array`);
    }
    
    const results: NodeOutput = [];
    
    for (let i = 0; i < array.length; i++) {
      results.push(createNodeDataItem({ item: array[i], index: i }, node.id, node.name, this.execution.id));
    }
    
    return results;
  }

  /**
   * Prepara dados de entrada baseado em mapeamentos configurados
   */
  private prepareInputData(node: FlowNode, previousNodes: string[]): Record<string, any> {
    const inputConfig = node.config.inputConfig as NodeInputConfig | undefined;
    
    // Se não tem configuração de input, usar dados de todos os nodes anteriores
    if (!inputConfig || !inputConfig.mappings || inputConfig.mappings.length === 0) {
      return this.getDefaultInputData(previousNodes);
    }
    
    // Aplicar mapeamentos configurados
    const previousResults: Record<string, NodeOutput> = {};
    previousNodes.forEach((nodeId) => {
      const output = this.nodeOutputs.get(nodeId);
      if (output) {
        previousResults[nodeId] = output;
      }
    });
    
    return applyInputMappings(previousResults, inputConfig);
  }

  /**
   * Obtém dados de entrada padrão (merge de todos os nodes anteriores)
   */
  private getDefaultInputData(previousNodes: string[]): Record<string, any> {
    const result: Record<string, any> = {};
    
    previousNodes.forEach((nodeId) => {
      const output = this.nodeOutputs.get(nodeId);
      if (output && output.length > 0) {
        // Merge do json de todos os items
        output.forEach((item) => {
          Object.assign(result, item.json);
        });
      }
    });
    
    return result;
  }

  /**
   * Obtém IDs dos nodes anteriores
   */
  private getPreviousNodes(nodeId: string): string[] {
    return this.flow.edges
      .filter((edge) => edge.target === nodeId)
      .map((edge) => edge.source);
  }

  /**
   * Obtém ordem de execução (topological sort)
   */
  private getExecutionOrder(): string[] {
    const visited = new Set<string>();
    const order: string[] = [];
    
    const visit = (nodeId: string) => {
      if (visited.has(nodeId)) return;
      visited.add(nodeId);
      
      // Visitar dependências primeiro
      const previousNodes = this.getPreviousNodes(nodeId);
      previousNodes.forEach(visit);
      
      order.push(nodeId);
    };
    
    // Começar do node inicial
    visit(this.flow.startNodeId);
    
    // Visitar nodes restantes
    this.flow.nodes.forEach((node) => visit(node.id));
    
    return order;
  }

  /**
   * Valida o fluxo
   */
  private validateFlow(): void {
    if (!this.flow.nodes || this.flow.nodes.length === 0) {
      throw new Error('Fluxo não contém nodes');
    }
    
    if (!this.flow.startNodeId) {
      throw new Error('Node inicial não definido');
    }
    
    const startNode = this.flow.nodes.find((n) => n.id === this.flow.startNodeId);
    if (!startNode) {
      throw new Error('Node inicial não encontrado');
    }
  }

  /**
   * Avalia uma condição
   */
  private evaluateCondition(condition: string, data: Record<string, any>): boolean {
    try {
      const func = new Function('data', `return ${condition}`);
      return func(data);
    } catch {
      return false;
    }
  }

  /**
   * Registra um log
   */
  private log(
    nodeId: string,
    nodeName: string,
    status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled',
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
   * Cancela execução
   */
  abort(): void {
    this.abortController.abort();
    this.execution.status = 'cancelled';
    this.log('flow', 'Flow Engine V2', 'cancelled', 'Execução cancelada pelo usuário');
  }

  /**
   * Obtém output de um node específico
   */
  getNodeOutput(nodeId: string): NodeOutput | undefined {
    return this.nodeOutputs.get(nodeId);
  }

  /**
   * Obtém todas as chaves disponíveis de um node
   */
  getAvailableKeys(nodeId: string): string[] {
    const output = this.nodeOutputs.get(nodeId);
    if (!output) return [];
    return extractAvailableKeys(output);
  }
}

/**
 * Função helper para executar um fluxo V2
 */
export async function executeFlow(
  flow: FlowDefinition,
  initialData?: Record<string, any>,
  onLog?: (log: FlowExecutionLog) => void
): Promise<FlowExecution> {
  const engine = new FlowEngineV2(flow, onLog);
  return engine.execute(initialData);
}
