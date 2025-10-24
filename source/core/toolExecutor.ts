/**
 * FLUI - Tool Executor
 * 
 * Executor genérico de ferramentas com suporte a:
 * - Timeout
 * - Retries
 * - Hooks de lifecycle
 * - Métricas automáticas
 */

import {
  Tool,
  ExecutionContext,
  ToolResult,
  ToolExecutionOptions,
} from './types.js';
import { getToolRegistry } from './toolRegistry.js';
import { ToolValidator } from './toolValidator.js';

export class ToolExecutor {
  /**
   * Executa uma ferramenta pelo ID
   */
  static async execute(
    toolId: string,
    args: any,
    context: ExecutionContext,
    options?: ToolExecutionOptions
  ): Promise<ToolResult> {
    const registry = getToolRegistry();
    
    // 🔥 SUPORTE A AGENTES: Se toolId começa com 'agent-', executar agente
    if (toolId.startsWith('agent-')) {
      return this.executeAgent(toolId, args, context, options);
    }
    
    const tool = registry.get(toolId);

    if (!tool) {
      return {
        success: false,
        error: `Ferramenta não encontrada: ${toolId}`,
      };
    }

    return this.executeTool(tool, args, context, options);
  }
  
  /**
   * Executa um agente dinamicamente com integração REAL ao LLM
   */
  private static async executeAgent(
    toolId: string,
    args: any,
    context: ExecutionContext,
    options?: ToolExecutionOptions
  ): Promise<ToolResult> {
    const startTime = Date.now();
    
    try {
      // Extrair ID do agente (remove 'agent-' prefix)
      const agentId = toolId.replace('agent-', '');
      
      // Importar store dinamicamente para evitar ciclos
      const { useStore } = await import('../store/store.js');
      const store = useStore.getState();
      
      // Buscar agente
      const agent = store.agents.find(a => a.id === agentId);
      
      if (!agent) {
        return {
          success: false,
          error: `Agente não encontrado: ${agentId}`,
          executionTime: Date.now() - startTime,
        };
      }
      
      console.log(`🤖 [AgentExecutor] Executando agente: ${agent.name}`);
      console.log(`📋 [AgentExecutor] Model: ${agent.model || 'padrão'}`);
      console.log(`🔧 [AgentExecutor] FLUI Tools: ${agent.tools?.length || 0}`);
      console.log(`🔧 [AgentExecutor] MCPs: ${agent.mcpIds?.length || 0}`);
      
      // Preparar input do usuário
      const userInput = args.input || args.prompt || args.message || '';
      
      if (!userInput) {
        return {
          success: false,
          error: 'Input é obrigatório para o agente',
          executionTime: Date.now() - startTime,
        };
      }
      
      // 🔥 EXECUÇÃO REAL: Usar sendMessage do llm.ts
      const { sendMessage } = await import('../services/llm.js');
      
      console.log(`💬 [AgentExecutor] Enviando mensagem para LLM: "${userInput.substring(0, 100)}${userInput.length > 100 ? '...' : ''}"`);
      
      const response = await sendMessage(userInput, agent, context);
      
      console.log(`✅ [AgentExecutor] Resposta recebida (${response.length} chars)`);
      
      return {
        success: true,
        result: {
          response: response,
          agentName: agent.name,
          agentId: agent.id,
          model: agent.model,
          systemPrompt: agent.systemPrompt,
          toolsUsed: agent.tools?.length || 0,
        },
        executionTime: Date.now() - startTime,
      };
    } catch (error: any) {
      console.error(`❌ [AgentExecutor] Erro ao executar agente:`, error);
      return {
        success: false,
        error: `Erro ao executar agente: ${error.message}`,
        executionTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Executa uma ferramenta diretamente
   */
  static async executeTool(
    tool: Tool,
    args: any,
    context: ExecutionContext,
    options?: ToolExecutionOptions
  ): Promise<ToolResult> {
    const startTime = Date.now();
    const registry = getToolRegistry();

    try {
      // 1. Validar e aplicar defaults
      const validation = ToolValidator.validateAndApplyDefaults(tool.params, args);
      
      if (!validation.valid) {
        const errorMessage = ToolValidator.formatErrors(validation.errors);
        return {
          success: false,
          error: errorMessage,
        };
      }

      const validatedArgs = validation.args;

      // 2. Hook: beforeExecute
      if (tool.hooks?.beforeExecute) {
        await tool.hooks.beforeExecute(validatedArgs, context);
      }

      // 3. Determinar configurações
      const timeout = options?.timeout || tool.config?.timeout || 30000;
      const retries = options?.retries ?? tool.config?.retries ?? 0;

      // 4. Executar com retry
      let lastError: Error | null = null;
      let attempt = 0;

      while (attempt <= retries) {
        try {
          // Executar com timeout
          const result = await this.executeWithTimeout(
            () => tool.execute(validatedArgs, context),
            timeout,
            options?.signal
          );

          // 5. Hook: afterExecute
          if (tool.hooks?.afterExecute) {
            await tool.hooks.afterExecute(result, context);
          }

          // 6. Atualizar métricas
          const executionTime = Date.now() - startTime;
          registry.updateMetrics(tool.id, result.success, executionTime);

          // Adicionar tempo de execução ao resultado
          return {
            ...result,
            executionTime,
          };
        } catch (error: any) {
          lastError = error;
          attempt++;

          if (attempt <= retries) {
            // Aguardar antes de retry (exponential backoff)
            await this.sleep(Math.pow(2, attempt) * 1000);
          }
        }
      }

      // Se chegou aqui, todas as tentativas falharam
      const executionTime = Date.now() - startTime;
      const errorMessage = lastError?.message || 'Erro desconhecido';

      // Hook: onError
      if (tool.hooks?.onError && lastError) {
        await tool.hooks.onError(lastError, context);
      }

      registry.updateMetrics(tool.id, false, executionTime);

      return {
        success: false,
        error: `Falha após ${attempt} tentativa(s): ${errorMessage}`,
        executionTime,
      };
    } catch (error: any) {
      const executionTime = Date.now() - startTime;
      registry.updateMetrics(tool.id, false, executionTime);

      return {
        success: false,
        error: error.message || 'Erro desconhecido',
        executionTime,
      };
    }
  }

  /**
   * Executa uma função com timeout
   */
  private static async executeWithTimeout<T>(
    fn: () => Promise<T>,
    timeout: number,
    signal?: AbortSignal
  ): Promise<T> {
    return new Promise<T>(async (resolve, reject) => {
      // Timeout
      const timeoutId = setTimeout(() => {
        reject(new Error(`Timeout após ${timeout}ms`));
      }, timeout);

      // AbortSignal
      let abortHandler: (() => void) | undefined;
      if (signal) {
        abortHandler = () => {
          clearTimeout(timeoutId);
          reject(new Error('Execução abortada'));
        };
        signal.addEventListener('abort', abortHandler);
      }

      try {
        const result = await fn();
        clearTimeout(timeoutId);
        if (abortHandler && signal) {
          signal.removeEventListener('abort', abortHandler);
        }
        resolve(result);
      } catch (error) {
        clearTimeout(timeoutId);
        if (abortHandler && signal) {
          signal.removeEventListener('abort', abortHandler);
        }
        reject(error);
      }
    });
  }

  /**
   * Aguarda um tempo específico
   */
  private static sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Executa múltiplas ferramentas em paralelo
   */
  static async executeMany(
    executions: Array<{
      toolId: string;
      args: any;
      context: ExecutionContext;
      options?: ToolExecutionOptions;
    }>
  ): Promise<ToolResult[]> {
    const promises = executions.map((exec) =>
      this.execute(exec.toolId, exec.args, exec.context, exec.options)
    );

    return Promise.all(promises);
  }

  /**
   * Executa ferramentas em sequência
   */
  static async executeSequence(
    executions: Array<{
      toolId: string;
      args: any;
      context: ExecutionContext;
      options?: ToolExecutionOptions;
    }>
  ): Promise<ToolResult[]> {
    const results: ToolResult[] = [];

    for (const exec of executions) {
      const result = await this.execute(
        exec.toolId,
        exec.args,
        exec.context,
        exec.options
      );
      results.push(result);

      // Se falhou e não tem retries, parar
      if (!result.success) {
        break;
      }
    }

    return results;
  }
}
