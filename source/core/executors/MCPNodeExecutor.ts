/**
 * MCP Node Executor
 * 
 * Executes nodes in isolated MCP sandboxes
 * Each MCP has its own environment, dependencies, and resources
 */

import { NodeExecutor, ExecutionInput, ExecutionResult } from './types.js';
import { MCPSandboxManager } from '../../services/MCPSandboxManager.js';

export interface MCPExecutorConfig {
  sandboxManager: MCPSandboxManager;
  defaultTimeout?: number;
  maxRetries?: number;
}

export class MCPNodeExecutor implements NodeExecutor {
  private sandboxManager: MCPSandboxManager;
  private defaultTimeout: number;
  private maxRetries: number;

  constructor(config: MCPExecutorConfig) {
    this.sandboxManager = config.sandboxManager;
    this.defaultTimeout = config.defaultTimeout || 30000; // 30s
    this.maxRetries = config.maxRetries || 2;
  }

  async execute(input: ExecutionInput): Promise<ExecutionResult> {
    const startTime = Date.now();
    const timeout = input.context.timeout || this.defaultTimeout;

    try {
      // Extract MCP ID from node params
      const mcpId = this.extractMCPId(input.params);
      
      if (!mcpId) {
        throw new Error('MCP ID not specified in execution input');
      }

      // Prepare execution request for MCP sandbox
      const mcpRequest = {
        mcpId,
        toolId: input.params.toolId,
        params: input.params.params || input.params,
        context: {
          executionId: input.context.executionId,
          traceId: input.context.traceId,
          nodeId: input.context.nodeId,
        },
        timeout,
      };

      // Execute in MCP sandbox with retry logic
      const result = await this.executeWithRetry(mcpRequest);

      const duration = Date.now() - startTime;

      return {
        success: result.success,
        output: result.output,
        error: result.error,
        exitCode: result.exitCode,
        duration,
        metadata: {
          sandboxId: result.sandboxId,
          resourceUsage: result.resourceUsage,
          logs: result.logs,
        },
      };
    } catch (error: any) {
      const duration = Date.now() - startTime;
      
      return {
        success: false,
        output: null,
        error: error.message,
        duration,
      };
    }
  }

  private async executeWithRetry(request: any, attempt: number = 0): Promise<any> {
    try {
      return await this.sandboxManager.execute(request);
    } catch (error: any) {
      if (attempt < this.maxRetries && this.isRetryable(error)) {
        const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
        await this.sleep(delay);
        return this.executeWithRetry(request, attempt + 1);
      }
      throw error;
    }
  }

  private isRetryable(error: any): boolean {
    // Retry on transient errors
    const retryableErrors = [
      'ETIMEDOUT',
      'ECONNRESET',
      'SANDBOX_NOT_READY',
      'TEMPORARY_FAILURE',
    ];
    
    return retryableErrors.some(code => 
      error.code === code || error.message?.includes(code)
    );
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private extractMCPId(params: any): string | null {
    // Try different ways to get MCP ID
    return params.mcpId || params.mcp || params.serverId || null;
  }

  canExecute(nodeType: string): boolean {
    // MCP executor handles nodes with mcp: prefix
    return nodeType.startsWith('mcp:') || nodeType.includes('mcp-');
  }

  getName(): string {
    return 'MCPNodeExecutor';
  }

  async cleanup(): Promise<void> {
    // Cleanup handled by sandbox manager
    await this.sandboxManager.cleanup();
  }
}
