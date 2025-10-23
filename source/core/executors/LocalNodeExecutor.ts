/**
 * Local Node Executor
 * 
 * Executes nodes in the global automation sandbox
 * This is the default executor for most nodes
 */

import { NodeExecutor, ExecutionInput, ExecutionResult, ExecutionContext } from './types.js';
import { ToolExecutor } from '../toolExecutor.js';
import { getToolRegistry } from '../toolRegistry.js';

export class LocalNodeExecutor implements NodeExecutor {
  private toolExecutor: ToolExecutor;

  constructor() {
    this.toolExecutor = new ToolExecutor();
  }

  async execute(input: ExecutionInput): Promise<ExecutionResult> {
    const startTime = Date.now();
    
    try {
      // Extract tool ID from params
      const toolId = input.params.toolId || input.params.type;
      
      if (!toolId) {
        throw new Error('Tool ID not specified in execution input');
      }

      // Build execution context for tool executor
      const toolContext = {
        executionId: input.context.executionId,
        traceId: input.context.traceId,
        nodeId: input.context.nodeId,
        previousResults: input.previousOutputs || {},
        globalContext: {},
      };

      // Execute tool using static method
      const registry = getToolRegistry();
      const tool = registry.get(toolId);
      
      if (!tool) {
        throw new Error(`Tool not found: ${toolId}`);
      }

      const toolResult = await this.toolExecutor.executeTool(
        tool,
        input.params.params || input.params,
        toolContext
      );

      const duration = Date.now() - startTime;

      return {
        success: toolResult.success,
        output: toolResult.result,
        error: toolResult.error,
        duration,
        metadata: {
          logs: toolResult.logs,
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

  canExecute(nodeType: string): boolean {
    // Local executor can handle most node types
    // Except those explicitly marked for MCP execution
    return !nodeType.startsWith('mcp:');
  }

  getName(): string {
    return 'LocalNodeExecutor';
  }

  async cleanup(): Promise<void> {
    // No cleanup needed for local executor
  }
}
