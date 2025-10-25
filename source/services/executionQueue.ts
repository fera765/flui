/**
 * FLUI - Execution Queue
 * Fila de execuções com sandboxes isolados e concorrência controlada
 */

import { FlowEngineV2 } from '../core/flowEngineV2.js';
import { generateId } from '../utils/id.js';
import { EventEmitter } from 'events';

export interface QueuedExecution {
  id: string;
  automationId: string;
  automationName: string;
  triggerType: 'manual' | 'webhook' | 'cron';
  triggerData: any;
  priority: number;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  result?: any;
  error?: string;
  retries: number;
  maxRetries: number;
  sandboxPath?: string;
}

interface ExecutionQueueConfig {
  maxConcurrency: number;
  defaultRetries: number;
  retryDelay: number;
}

class ExecutionQueue extends EventEmitter {
  private queue: QueuedExecution[] = [];
  private running: Map<string, QueuedExecution> = new Map();
  private completed: Map<string, QueuedExecution> = new Map();
  private config: ExecutionQueueConfig;

  constructor(config: Partial<ExecutionQueueConfig> = {}) {
    super();
    this.config = {
      maxConcurrency: config.maxConcurrency || 5,
      defaultRetries: config.defaultRetries || 2,
      retryDelay: config.retryDelay || 5000,
    };

    console.log(`✅ [ExecutionQueue] Inicializada (concurrency: ${this.config.maxConcurrency})`);
  }

  /**
   * Adiciona execução à fila
   */
  async enqueue(params: {
    automationId: string;
    automationName: string;
    triggerType: 'manual' | 'webhook' | 'cron';
    triggerData?: any;
    priority?: number;
    maxRetries?: number;
  }): Promise<string> {
    const executionId = `exec-${Date.now()}-${generateId().substring(0, 8)}`;

    const execution: QueuedExecution = {
      id: executionId,
      automationId: params.automationId,
      automationName: params.automationName,
      triggerType: params.triggerType,
      triggerData: params.triggerData || {},
      priority: params.priority || 0,
      status: 'pending',
      createdAt: new Date().toISOString(),
      retries: 0,
      maxRetries: params.maxRetries !== undefined ? params.maxRetries : this.config.defaultRetries,
    };

    this.queue.push(execution);

    // Ordenar por prioridade (maior primeiro)
    this.queue.sort((a, b) => b.priority - a.priority);

    console.log(`📥 [ExecutionQueue] Enfileirada: ${executionId} (${params.automationName})`);
    console.log(`   Queue size: ${this.queue.length}, Running: ${this.running.size}`);

    this.emit('enqueued', execution);

    // Tentar processar
    this.processQueue();

    return executionId;
  }

  /**
   * Processa fila
   */
  private async processQueue(): Promise<void> {
    // Verificar se pode processar mais
    if (this.running.size >= this.config.maxConcurrency) {
      console.log(`⏸️  [ExecutionQueue] Limite de concorrência atingido (${this.running.size}/${this.config.maxConcurrency})`);
      return;
    }

    if (this.queue.length === 0) {
      return;
    }

    // Pegar próxima execução
    const execution = this.queue.shift();
    if (!execution) {
      return;
    }

    // Marcar como running
    execution.status = 'running';
    execution.startedAt = new Date().toISOString();
    this.running.set(execution.id, execution);

    console.log(`🚀 [ExecutionQueue] Iniciando: ${execution.id}`);
    this.emit('started', execution);

    // Executar em background (não bloqueia)
    this.executeAutomation(execution)
      .then(() => {
        this.processQueue(); // Processar próxima
      })
      .catch((error) => {
        console.error(`❌ [ExecutionQueue] Erro crítico ao executar ${execution.id}:`, error);
        this.processQueue(); // Processar próxima mesmo com erro
      });

    // Processar próxima se tiver espaço
    if (this.running.size < this.config.maxConcurrency && this.queue.length > 0) {
      // Pequeno delay para não processar todas de uma vez
      setTimeout(() => this.processQueue(), 100);
    }
  }

  /**
   * Executa automação
   */
  private async executeAutomation(execution: QueuedExecution): Promise<void> {
    try {
      console.log(`▶️  [ExecutionQueue] Executando ${execution.id} (tentativa ${execution.retries + 1}/${execution.maxRetries + 1})`);

      // Carregar automação
      const { getAutomations } = await import('../store/automationStorage.js');
      const automations = getAutomations();
      const automationsList = Object.values(automations);
      const automation = automationsList.find((a: any) => a.id === execution.automationId);

      if (!automation) {
        throw new Error(`Automação ${execution.automationId} não encontrada`);
      }

      // Criar sandbox isolado
      const { getSandboxManager } = await import('./sandboxManager.js');
      const sandboxManager = getSandboxManager();

      execution.sandboxPath = await sandboxManager.createSandbox({
        automationId: execution.id, // ✅ Usar executionId para isolamento
        mcpEnvVars: {},
        customEnvVars: {},
      });

      console.log(`📦 [ExecutionQueue] Sandbox criado: ${execution.sandboxPath}`);

      // Mapear nodes
      const executionFlow = {
        id: automation.id,
        name: automation.name,
        description: automation.description || '',
        version: automation.version || '1.0',
        nodes: automation.nodes.map((node: any) => ({
          id: node.id,
          type: node.toolId || node.type || 'tool',
          name: node.name,
          config: node.config || {},
          position: node.position,
          ...(node.agentId && { agentId: node.agentId }),
          ...(node.toolId && { toolId: node.toolId }),
          ...(node.mcpId && { mcpId: node.mcpId }),
          ...(node.mcpToolId && { mcpToolId: node.mcpToolId }),
        })),
        edges: automation.edges || [],
        startNodeId: automation.startNodeId || automation.nodes[0]?.id,
      };

      // Executar
      const engine = new FlowEngineV2(executionFlow, (log) => {
        // Broadcast log via WebSocket
        this.emit('log', execution.id, log);
      });

      const result = await engine.execute({
        executionId: execution.id,
        triggerType: execution.triggerType,
        triggerData: execution.triggerData,
        timestamp: new Date().toISOString(),
      });

      // Sucesso
      execution.status = 'completed';
      execution.completedAt = new Date().toISOString();
      execution.result = result;

      this.running.delete(execution.id);
      this.completed.set(execution.id, execution);

      console.log(`✅ [ExecutionQueue] Concluída: ${execution.id} (${result.status})`);
      this.emit('completed', execution);

      // Limpar completed antigas (manter últimas 100)
      if (this.completed.size > 100) {
        const toDelete = Array.from(this.completed.keys()).slice(0, this.completed.size - 100);
        toDelete.forEach((id) => this.completed.delete(id));
      }
    } catch (error: any) {
      console.error(`❌ [ExecutionQueue] Erro em ${execution.id}:`, error.message);

      // Verificar se deve tentar novamente
      if (execution.retries < execution.maxRetries) {
        execution.retries++;
        execution.status = 'pending';

        console.log(`🔄 [ExecutionQueue] Recolocando ${execution.id} na fila (tentativa ${execution.retries + 1}/${execution.maxRetries + 1})`);

        // Recolocar na fila com delay
        this.running.delete(execution.id);
        
        setTimeout(() => {
          this.queue.unshift(execution); // Adicionar no início
          this.processQueue();
        }, this.config.retryDelay);

        this.emit('retry', execution);
      } else {
        // Falhou definitivamente
        execution.status = 'failed';
        execution.completedAt = new Date().toISOString();
        execution.error = error.message;

        this.running.delete(execution.id);
        this.completed.set(execution.id, execution);

        console.log(`💀 [ExecutionQueue] Falha definitiva: ${execution.id}`);
        this.emit('failed', execution);
      }
    }
  }

  /**
   * Cancela execução
   */
  cancelExecution(executionId: string): boolean {
    // Verificar se está na fila
    const queueIndex = this.queue.findIndex((e) => e.id === executionId);
    if (queueIndex >= 0) {
      const execution = this.queue[queueIndex];
      execution.status = 'cancelled';
      execution.completedAt = new Date().toISOString();
      this.queue.splice(queueIndex, 1);
      this.completed.set(executionId, execution);
      console.log(`🚫 [ExecutionQueue] Cancelada (fila): ${executionId}`);
      this.emit('cancelled', execution);
      return true;
    }

    // Se está running, não podemos cancelar (já iniciou)
    if (this.running.has(executionId)) {
      console.log(`⚠️  [ExecutionQueue] Não é possível cancelar execução em andamento: ${executionId}`);
      return false;
    }

    return false;
  }

  /**
   * Busca execução
   */
  getExecution(executionId: string): QueuedExecution | undefined {
    // Verificar na fila
    const queued = this.queue.find((e) => e.id === executionId);
    if (queued) return queued;

    // Verificar em execução
    const running = this.running.get(executionId);
    if (running) return running;

    // Verificar completas
    return this.completed.get(executionId);
  }

  /**
   * Lista execuções
   */
  listExecutions(filters?: {
    automationId?: string;
    status?: QueuedExecution['status'];
    limit?: number;
  }): QueuedExecution[] {
    let all: QueuedExecution[] = [
      ...this.queue,
      ...Array.from(this.running.values()),
      ...Array.from(this.completed.values()),
    ];

    // Aplicar filtros
    if (filters?.automationId) {
      all = all.filter((e) => e.automationId === filters.automationId);
    }

    if (filters?.status) {
      all = all.filter((e) => e.status === filters.status);
    }

    // Ordenar por data (mais recentes primeiro)
    all.sort((a, b) => {
      const dateA = new Date(b.createdAt).getTime();
      const dateB = new Date(a.createdAt).getTime();
      return dateA - dateB;
    });

    // Limitar
    if (filters?.limit) {
      all = all.slice(0, filters.limit);
    }

    return all;
  }

  /**
   * Estatísticas da fila
   */
  getStats(): {
    queued: number;
    running: number;
    completed: number;
    maxConcurrency: number;
  } {
    return {
      queued: this.queue.length,
      running: this.running.size,
      completed: this.completed.size,
      maxConcurrency: this.config.maxConcurrency,
    };
  }

  /**
   * Limpa execuções completadas
   */
  clearCompleted(): number {
    const count = this.completed.size;
    this.completed.clear();
    console.log(`🗑️  [ExecutionQueue] ${count} execuções completadas removidas`);
    return count;
  }
}

// Singleton
let executionQueueInstance: ExecutionQueue | null = null;

export function getExecutionQueue(): ExecutionQueue {
  if (!executionQueueInstance) {
    executionQueueInstance = new ExecutionQueue({
      maxConcurrency: parseInt(process.env.MAX_CONCURRENT_EXECUTIONS || '5'),
      defaultRetries: parseInt(process.env.DEFAULT_EXECUTION_RETRIES || '2'),
      retryDelay: parseInt(process.env.EXECUTION_RETRY_DELAY || '5000'),
    });
  }
  return executionQueueInstance;
}
