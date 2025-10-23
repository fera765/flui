/**
 * Hybrid Architecture - Executor Interfaces
 * 
 * Defines abstractions for node execution in the hybrid architecture:
 * - Global automation sandbox (workflow state/coordination)
 * - Isolated MCP sandboxes (per-MCP environments)
 */

export interface ExecutionContext {
  executionId: string;
  traceId: string;
  nodeId: string;
  automationId: string;
  timestamp: string;
  timeout?: number;
  metadata?: Record<string, any>;
}

export interface ExecutionInput {
  params: Record<string, any>;
  context: ExecutionContext;
  previousOutputs?: Record<string, any>;
}

export interface ExecutionResult {
  success: boolean;
  output: any;
  error?: string;
  exitCode?: number;
  duration: number;
  metadata?: {
    sandboxId?: string;
    resourceUsage?: ResourceUsage;
    logs?: string[];
  };
}

export interface ResourceUsage {
  cpu?: number; // CPU time in ms
  memory?: number; // Memory in bytes
  disk?: number; // Disk usage in bytes
  network?: {
    sent: number;
    received: number;
  };
}

/**
 * Abstract interface for node execution
 * Implementations: LocalNodeExecutor, MCPNodeExecutor
 */
export interface NodeExecutor {
  /**
   * Execute a node with given input
   */
  execute(input: ExecutionInput): Promise<ExecutionResult>;

  /**
   * Check if this executor can handle the given node type
   */
  canExecute(nodeType: string): boolean;

  /**
   * Get executor name for logging/debugging
   */
  getName(): string;

  /**
   * Cleanup resources if needed
   */
  cleanup?(): Promise<void>;
}

/**
 * Execution strategy selector
 * Decides which executor to use for a given node
 */
export interface ExecutionStrategy {
  selectExecutor(
    nodeType: string,
    nodeConfig: any,
    availableExecutors: NodeExecutor[]
  ): NodeExecutor | null;
}

/**
 * Feature flags for progressive rollout
 */
export interface FeatureFlags {
  useHybridArchitecture: boolean;
  mcpSandboxEnabled: boolean;
  sandboxPoolingEnabled: boolean;
  enabledForWorkflows?: string[]; // Specific workflow IDs
  enabledForMCPs?: string[]; // Specific MCP IDs
  rolloutPercentage?: number; // 0-100
}

/**
 * Observability interface for tracking execution
 */
export interface ExecutionObserver {
  onExecutionStart(context: ExecutionContext): void;
  onExecutionComplete(context: ExecutionContext, result: ExecutionResult): void;
  onExecutionError(context: ExecutionContext, error: Error): void;
  recordMetric(name: string, value: number, tags?: Record<string, string>): void;
  createSpan(name: string, parentSpan?: string): string;
  endSpan(spanId: string): void;
}

/**
 * Circuit breaker state for resilience
 */
export enum CircuitBreakerState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN',
}

export interface CircuitBreakerConfig {
  failureThreshold: number;
  successThreshold: number;
  timeout: number;
  resetTimeout: number;
}

/**
 * Retry policy configuration
 */
export interface RetryPolicy {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  retryableErrors?: string[];
}
