/**
 * Execution Orchestrator
 * 
 * Coordinates node execution using different executors:
 * - Selects appropriate executor (Local vs MCP)
 * - Manages workflow state
 * - Implements resilience patterns (retry, circuit breaker)
 * - Provides observability hooks
 */

import { nanoid } from 'nanoid';
import {
  NodeExecutor,
  ExecutionInput,
  ExecutionResult,
  ExecutionContext,
  ExecutionStrategy,
  ExecutionObserver,
  FeatureFlags,
  RetryPolicy,
  CircuitBreakerState,
  CircuitBreakerConfig,
} from './types.js';

export interface OrchestratorConfig {
  executors: NodeExecutor[];
  strategy?: ExecutionStrategy;
  observer?: ExecutionObserver;
  featureFlags?: FeatureFlags;
  retryPolicy?: RetryPolicy;
  circuitBreaker?: CircuitBreakerConfig;
}

/**
 * Default strategy: use MCP executor for mcp: prefixed nodes
 */
class DefaultExecutionStrategy implements ExecutionStrategy {
  selectExecutor(
    nodeType: string,
    nodeConfig: any,
    availableExecutors: NodeExecutor[]
  ): NodeExecutor | null {
    // Try to find executor that can handle this node
    for (const executor of availableExecutors) {
      if (executor.canExecute(nodeType)) {
        return executor;
      }
    }
    
    // Fallback to first executor (usually LocalNodeExecutor)
    return availableExecutors[0] || null;
  }
}

/**
 * Circuit breaker for resilience
 */
class CircuitBreaker {
  private state: CircuitBreakerState = CircuitBreakerState.CLOSED;
  private failureCount = 0;
  private successCount = 0;
  private lastFailureTime?: number;
  private config: CircuitBreakerConfig;

  constructor(config: CircuitBreakerConfig) {
    this.config = config;
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === CircuitBreakerState.OPEN) {
      if (this.shouldAttemptReset()) {
        this.state = CircuitBreakerState.HALF_OPEN;
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failureCount = 0;
    
    if (this.state === CircuitBreakerState.HALF_OPEN) {
      this.successCount++;
      if (this.successCount >= this.config.successThreshold) {
        this.state = CircuitBreakerState.CLOSED;
        this.successCount = 0;
      }
    }
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    
    if (this.failureCount >= this.config.failureThreshold) {
      this.state = CircuitBreakerState.OPEN;
    }
  }

  private shouldAttemptReset(): boolean {
    if (!this.lastFailureTime) return false;
    
    const elapsed = Date.now() - this.lastFailureTime;
    return elapsed >= this.config.resetTimeout;
  }

  getState(): CircuitBreakerState {
    return this.state;
  }
}

export class ExecutionOrchestrator {
  private executors: NodeExecutor[];
  private strategy: ExecutionStrategy;
  private observer?: ExecutionObserver;
  private featureFlags: FeatureFlags;
  private retryPolicy?: RetryPolicy;
  private circuitBreakers: Map<string, CircuitBreaker> = new Map();

  constructor(config: OrchestratorConfig) {
    this.executors = config.executors;
    this.strategy = config.strategy || new DefaultExecutionStrategy();
    this.observer = config.observer;
    this.featureFlags = config.featureFlags || {
      useHybridArchitecture: false,
      mcpSandboxEnabled: false,
      sandboxPoolingEnabled: false,
    };
    this.retryPolicy = config.retryPolicy;

    // Initialize circuit breakers for each executor
    if (config.circuitBreaker) {
      for (const executor of this.executors) {
        this.circuitBreakers.set(
          executor.getName(),
          new CircuitBreaker(config.circuitBreaker)
        );
      }
    }
  }

  /**
   * Execute a node
   */
  async executeNode(
    nodeType: string,
    nodeConfig: any,
    params: Record<string, any>,
    context?: Partial<ExecutionContext>
  ): Promise<ExecutionResult> {
    // Check if hybrid architecture is enabled
    if (!this.featureFlags.useHybridArchitecture) {
      // Fallback to first executor (legacy behavior)
      return this.executors[0]?.execute({
        params: { ...nodeConfig, ...params },
        context: this.buildContext(context),
      }) || this.createErrorResult('No executor available');
    }

    // Check rollout percentage
    if (this.featureFlags.rolloutPercentage !== undefined) {
      const roll = Math.random() * 100;
      if (roll > this.featureFlags.rolloutPercentage) {
        // Use legacy executor
        return this.executors[0]?.execute({
          params: { ...nodeConfig, ...params },
          context: this.buildContext(context),
        }) || this.createErrorResult('No executor available');
      }
    }

    // Build execution context
    const execContext = this.buildContext(context);
    
    // Start observability span
    let spanId: string | undefined;
    if (this.observer) {
      spanId = this.observer.createSpan(`execute:${nodeType}`, context?.traceId);
      this.observer.onExecutionStart(execContext);
    }

    try {
      // Select executor
      const executor = this.strategy.selectExecutor(
        nodeType,
        nodeConfig,
        this.executors
      );

      if (!executor) {
        throw new Error(`No executor found for node type: ${nodeType}`);
      }

      // Build execution input
      const input: ExecutionInput = {
        params: { ...nodeConfig, ...params },
        context: execContext,
      };

      // Execute with circuit breaker and retry
      const result = await this.executeWithResilience(executor, input);

      // Record success metrics
      if (this.observer) {
        this.observer.onExecutionComplete(execContext, result);
        this.observer.recordMetric('execution.success', 1, {
          executor: executor.getName(),
          nodeType,
        });
        this.observer.recordMetric('execution.duration', result.duration, {
          executor: executor.getName(),
          nodeType,
        });
      }

      return result;
    } catch (error: any) {
      // Record error metrics
      if (this.observer) {
        this.observer.onExecutionError(execContext, error);
        this.observer.recordMetric('execution.error', 1, {
          nodeType,
          error: error.message,
        });
      }

      return this.createErrorResult(error.message);
    } finally {
      if (spanId && this.observer) {
        this.observer.endSpan(spanId);
      }
    }
  }

  /**
   * Execute with resilience patterns
   */
  private async executeWithResilience(
    executor: NodeExecutor,
    input: ExecutionInput
  ): Promise<ExecutionResult> {
    const circuitBreaker = this.circuitBreakers.get(executor.getName());

    const executeWithRetry = async (attempt = 0): Promise<ExecutionResult> => {
      try {
        // Execute with circuit breaker if available
        if (circuitBreaker) {
          return await circuitBreaker.execute(() => executor.execute(input));
        }
        
        return await executor.execute(input);
      } catch (error: any) {
        // Check if we should retry
        if (this.retryPolicy && attempt < this.retryPolicy.maxRetries) {
          if (this.isRetryable(error)) {
            const delay = this.calculateDelay(attempt);
            await this.sleep(delay);
            return executeWithRetry(attempt + 1);
          }
        }
        
        throw error;
      }
    };

    return executeWithRetry();
  }

  /**
   * Check if error is retryable
   */
  private isRetryable(error: any): boolean {
    if (!this.retryPolicy?.retryableErrors) {
      // Default retryable errors
      return ['ETIMEDOUT', 'ECONNRESET', 'TEMPORARY_FAILURE'].some(code =>
        error.code === code || error.message?.includes(code)
      );
    }

    return this.retryPolicy.retryableErrors.some(pattern =>
      error.code === pattern || error.message?.includes(pattern)
    );
  }

  /**
   * Calculate retry delay with exponential backoff
   */
  private calculateDelay(attempt: number): number {
    if (!this.retryPolicy) return 1000;

    const delay = this.retryPolicy.initialDelay *
      Math.pow(this.retryPolicy.backoffMultiplier, attempt);

    return Math.min(delay, this.retryPolicy.maxDelay);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Build execution context
   */
  private buildContext(partial?: Partial<ExecutionContext>): ExecutionContext {
    return {
      executionId: partial?.executionId || nanoid(),
      traceId: partial?.traceId || nanoid(),
      nodeId: partial?.nodeId || 'unknown',
      automationId: partial?.automationId || 'unknown',
      timestamp: partial?.timestamp || new Date().toISOString(),
      timeout: partial?.timeout,
      metadata: partial?.metadata,
    };
  }

  /**
   * Create error result
   */
  private createErrorResult(error: string): ExecutionResult {
    return {
      success: false,
      output: null,
      error,
      duration: 0,
    };
  }

  /**
   * Get circuit breaker states
   */
  getCircuitBreakerStates(): Record<string, CircuitBreakerState> {
    const states: Record<string, CircuitBreakerState> = {};
    
    for (const [name, breaker] of this.circuitBreakers.entries()) {
      states[name] = breaker.getState();
    }

    return states;
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    await Promise.all(
      this.executors.map(executor => executor.cleanup?.())
    );
  }
}
