/**
 * FLUI - Tool Registry
 * 
 * Registro central dinâmico de todas as ferramentas do sistema
 * Permite adicionar, remover e executar ferramentas dinamicamente
 */

import {
  Tool,
  RegisteredTool,
  ToolFilter,
  ToolCategory,
  ToolMetrics,
  ToolRegistryOptions,
} from './types.js';
import { validateToolMetadata, prepareToolMetadata } from './toolMetadataValidator.js';

export class ToolRegistry {
  private tools: Map<string, RegisteredTool> = new Map();
  private options: ToolRegistryOptions;

  constructor(options: ToolRegistryOptions = {}) {
    this.options = {
      maxTools: options.maxTools || 1000,
      allowDuplicateIds: options.allowDuplicateIds || false,
      validateOnRegister: options.validateOnRegister !== false,
    };
  }

  /**
   * Registra uma nova ferramenta
   */
  register(tool: Tool): void {
    // Validar ID único
    if (!this.options.allowDuplicateIds && this.tools.has(tool.id)) {
      throw new Error(`Tool com ID '${tool.id}' já está registrada`);
    }

    // Validar limite
    if (this.tools.size >= (this.options.maxTools || 1000)) {
      throw new Error(`Limite de ferramentas atingido: ${this.options.maxTools}`);
    }

    // Validar estrutura e metadados se necessário
    if (this.options.validateOnRegister) {
      this.validateToolStructure(tool);
      
      // Validar metadados usando JSON Schema
      const validation = validateToolMetadata(tool);
      if (!validation.valid) {
        throw new Error(
          `Metadados inválidos para tool '${tool.id}':\n` + 
          validation.errors?.join('\n')
        );
      }
      
      // Log warnings
      if (validation.warnings && validation.warnings.length > 0) {
        console.warn(`⚠️  Avisos para tool '${tool.id}':`);
        validation.warnings.forEach((w) => console.warn(`   - ${w}`));
      }
    }

    // Preparar metadados (adicionar defaults)
    const preparedMetadata = prepareToolMetadata(tool);

    // Criar RegisteredTool com métricas, preservando execute e validate do tool original
    const registeredTool: RegisteredTool = {
      ...preparedMetadata,
      execute: tool.execute, // Preservar função de execução
      validate: tool.validate, // Preservar função de validação (se existir)
      hooks: tool.hooks, // Preservar hooks (se existirem)
      registeredAt: new Date().toISOString(),
      metrics: {
        executionCount: 0,
        successCount: 0,
        failureCount: 0,
        averageExecutionTime: 0,
      },
    };

    this.tools.set(tool.id, registeredTool);
  }

  /**
   * Remove uma ferramenta do registro
   */
  unregister(toolId: string): boolean {
    return this.tools.delete(toolId);
  }

  /**
   * Obtém uma ferramenta por ID
   */
  get(toolId: string): RegisteredTool | undefined {
    return this.tools.get(toolId);
  }

  /**
   * Lista todas as ferramentas (com filtros opcionais e paginação)
   */
  list(filter?: ToolFilter & { page?: number; pageSize?: number }): {
    tools: RegisteredTool[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  } {
    let tools = Array.from(this.tools.values());

    // Aplicar filtros
    if (filter) {
      // Filtrar por categoria
      if (filter.category) {
        tools = tools.filter((t) => t.category === filter.category);
      }

      // Filtrar por busca (nome ou descrição)
      if (filter.search) {
        const search = filter.search.toLowerCase();
        tools = tools.filter(
          (t) =>
            t.name.toLowerCase().includes(search) ||
            t.description.toLowerCase().includes(search) ||
            t.id.toLowerCase().includes(search)
        );
      }

      // Filtrar por tags
      if (filter.tags && filter.tags.length > 0) {
        tools = tools.filter((t) =>
          filter.tags!.some((tag) => t.ui.tags?.includes(tag))
        );
      }
    }

    const total = tools.length;
    
    // Aplicar paginação
    const page = filter?.page || 1;
    const pageSize = filter?.pageSize || 50;
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    
    const paginatedTools = tools.slice(startIndex, endIndex);
    const totalPages = Math.ceil(total / pageSize);

    return {
      tools: paginatedTools,
      total,
      page,
      pageSize,
      totalPages,
    };
  }

  /**
   * Lista todas as categorias disponíveis
   */
  getCategories(): ToolCategory[] {
    const categories = new Set<ToolCategory>();
    for (const tool of this.tools.values()) {
      categories.add(tool.category);
    }
    return Array.from(categories);
  }

  /**
   * Obtém métricas de uma ferramenta
   */
  getMetrics(toolId: string): ToolMetrics | undefined {
    return this.tools.get(toolId)?.metrics;
  }

  /**
   * Atualiza métricas após execução
   */
  updateMetrics(
    toolId: string,
    success: boolean,
    executionTime: number
  ): void {
    const tool = this.tools.get(toolId);
    if (!tool) return;

    const metrics = tool.metrics;
    
    metrics.executionCount++;
    if (success) {
      metrics.successCount++;
    } else {
      metrics.failureCount++;
    }

    // Atualizar tempo médio de execução (moving average)
    if (metrics.executionCount === 1) {
      metrics.averageExecutionTime = executionTime;
    } else {
      metrics.averageExecutionTime =
        (metrics.averageExecutionTime * (metrics.executionCount - 1) +
          executionTime) /
        metrics.executionCount;
    }

    metrics.lastExecutedAt = new Date().toISOString();
  }

  /**
   * Verifica se uma ferramenta existe
   */
  has(toolId: string): boolean {
    return this.tools.has(toolId);
  }

  /**
   * Obtém o total de ferramentas registradas
   */
  count(): number {
    return this.tools.size;
  }

  /**
   * Limpa todas as ferramentas
   */
  clear(): void {
    this.tools.clear();
  }

  /**
   * Exporta todas as ferramentas (para backup/debug)
   */
  export(): RegisteredTool[] {
    return Array.from(this.tools.values());
  }

  /**
   * Valida a estrutura de uma ferramenta
   */
  private validateToolStructure(tool: Tool): void {
    if (!tool.id || typeof tool.id !== 'string') {
      throw new Error('Tool ID é obrigatório e deve ser string');
    }

    if (!tool.name || typeof tool.name !== 'string') {
      throw new Error('Tool name é obrigatório e deve ser string');
    }

    if (!tool.description || typeof tool.description !== 'string') {
      throw new Error('Tool description é obrigatório e deve ser string');
    }

    if (typeof tool.execute !== 'function') {
      throw new Error('Tool execute deve ser uma função');
    }

    if (!Array.isArray(tool.params)) {
      throw new Error('Tool params deve ser um array');
    }

    // Validar cada parâmetro
    for (const param of tool.params) {
      if (!param.name || typeof param.name !== 'string') {
        throw new Error(`Parâmetro inválido: name é obrigatório`);
      }
      if (!param.type) {
        throw new Error(`Parâmetro '${param.name}': type é obrigatório`);
      }
    }
  }
}

// Instância global do registry (singleton)
let globalRegistry: ToolRegistry | null = null;

/**
 * Obtém a instância global do registry
 */
export function getToolRegistry(): ToolRegistry {
  if (!globalRegistry) {
    globalRegistry = new ToolRegistry();
  }
  return globalRegistry;
}

/**
 * Inicializa o registry com opções customizadas
 */
export function initializeToolRegistry(options?: ToolRegistryOptions): ToolRegistry {
  globalRegistry = new ToolRegistry(options);
  return globalRegistry;
}

/**
 * Reseta o registry global (útil para testes)
 */
export function resetToolRegistry(): void {
  globalRegistry = null;
}
