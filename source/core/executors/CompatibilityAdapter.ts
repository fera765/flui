/**
 * Compatibility Adapter
 * 
 * Provides backward compatibility for existing API while using new architecture
 * Allows gradual migration without breaking existing clients
 */

import { ExecutionOrchestrator } from './ExecutionOrchestrator.js';
import { LocalNodeExecutor } from './LocalNodeExecutor.js';
import { MCPNodeExecutor } from './MCPNodeExecutor.js';
import { MCPSandboxManager } from '../../services/MCPSandboxManager.js';
import { FeatureFlags } from './types.js';

/**
 * Legacy execution interface (matches current apiServer.ts)
 */
export interface LegacyExecutionRequest {
  nodeId: string;
  nodeType: string;
  config: Record<string, any>;
  params?: Record<string, any>;
  automationId?: string;
  initialData?: Record<string, any>;
}

export interface LegacyExecutionResult {
  success: boolean;
  result?: any;
  error?: string;
  duration?: number;
  logs?: string[];
}

/**
 * Adapter that bridges legacy API to new architecture
 */
export class CompatibilityAdapter {
  private orchestrator: ExecutionOrchestrator | null = null;
  private featureFlags: FeatureFlags;
  private sandboxManager?: MCPSandboxManager;

  constructor(featureFlags?: FeatureFlags) {
    this.featureFlags = featureFlags || this.getDefaultFeatureFlags();
    
    // Initialize orchestrator if hybrid architecture is enabled
    if (this.featureFlags.useHybridArchitecture) {
      this.initializeOrchestrator();
    }
  }

  /**
   * Execute node using appropriate architecture (legacy or hybrid)
   */
  async execute(request: LegacyExecutionRequest): Promise<LegacyExecutionResult> {
    // Check if hybrid architecture is enabled for this execution
    if (!this.shouldUseHybridArchitecture(request)) {
      // Use legacy path (return null to let caller use old logic)
      return {
        success: false,
        error: 'LEGACY_PATH',
      };
    }

    // Use new architecture
    if (!this.orchestrator) {
      return {
        success: false,
        error: 'Orchestrator not initialized',
      };
    }

    try {
      const result = await this.orchestrator.executeNode(
        request.nodeType,
        request.config,
        request.params || {},
        {
          nodeId: request.nodeId,
          automationId: request.automationId || 'unknown',
        }
      );

      return {
        success: result.success,
        result: result.output,
        error: result.error,
        duration: result.duration,
        logs: result.metadata?.logs,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Check if hybrid architecture should be used for this request
   */
  private shouldUseHybridArchitecture(request: LegacyExecutionRequest): boolean {
    if (!this.featureFlags.useHybridArchitecture) {
      return false;
    }

    // Check specific workflow whitelist
    if (this.featureFlags.enabledForWorkflows) {
      if (!request.automationId) return false;
      if (!this.featureFlags.enabledForWorkflows.includes(request.automationId)) {
        return false;
      }
    }

    // Check rollout percentage
    if (this.featureFlags.rolloutPercentage !== undefined) {
      const roll = Math.random() * 100;
      if (roll > this.featureFlags.rolloutPercentage) {
        return false;
      }
    }

    return true;
  }

  /**
   * Initialize orchestrator with executors
   */
  private initializeOrchestrator(): void {
    const executors = [];

    // Always add local executor
    executors.push(new LocalNodeExecutor());

    // Add MCP executor if enabled
    if (this.featureFlags.mcpSandboxEnabled) {
      this.sandboxManager = new MCPSandboxManager({
        poolConfig: {
          minSize: 0,
          maxSize: 10,
          idleTimeout: 300000,
          warmupOnStartup: false,
        },
      });

      executors.push(new MCPNodeExecutor({
        sandboxManager: this.sandboxManager,
        defaultTimeout: 30000,
        maxRetries: 2,
      }));
    }

    this.orchestrator = new ExecutionOrchestrator({
      executors,
      featureFlags: this.featureFlags,
      retryPolicy: {
        maxRetries: 2,
        initialDelay: 1000,
        maxDelay: 10000,
        backoffMultiplier: 2,
      },
      circuitBreaker: {
        failureThreshold: 5,
        successThreshold: 2,
        timeout: 60000,
        resetTimeout: 30000,
      },
    });
  }

  /**
   * Get default feature flags
   */
  private getDefaultFeatureFlags(): FeatureFlags {
    // Read from environment variables
    return {
      useHybridArchitecture: process.env.USE_HYBRID_ARCHITECTURE === 'true',
      mcpSandboxEnabled: process.env.MCP_SANDBOX_ENABLED === 'true',
      sandboxPoolingEnabled: process.env.SANDBOX_POOLING_ENABLED === 'true',
      rolloutPercentage: process.env.HYBRID_ROLLOUT_PERCENTAGE 
        ? parseInt(process.env.HYBRID_ROLLOUT_PERCENTAGE, 10)
        : undefined,
      enabledForWorkflows: process.env.HYBRID_ENABLED_WORKFLOWS
        ? process.env.HYBRID_ENABLED_WORKFLOWS.split(',')
        : undefined,
    };
  }

  /**
   * Update feature flags at runtime
   */
  updateFeatureFlags(flags: Partial<FeatureFlags>): void {
    this.featureFlags = { ...this.featureFlags, ...flags };
    
    // Reinitialize orchestrator if architecture changed
    if (flags.useHybridArchitecture !== undefined) {
      if (flags.useHybridArchitecture && !this.orchestrator) {
        this.initializeOrchestrator();
      }
    }
  }

  /**
   * Get current feature flags
   */
  getFeatureFlags(): FeatureFlags {
    return { ...this.featureFlags };
  }

  /**
   * Get orchestrator stats
   */
  getStats(): {
    enabled: boolean;
    circuitBreakers?: Record<string, string>;
    sandboxes?: any;
  } {
    if (!this.orchestrator) {
      return { enabled: false };
    }

    return {
      enabled: true,
      circuitBreakers: this.orchestrator.getCircuitBreakerStates(),
      sandboxes: this.sandboxManager?.getStats(),
    };
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    if (this.orchestrator) {
      await this.orchestrator.cleanup();
    }
    
    if (this.sandboxManager) {
      await this.sandboxManager.cleanup();
    }
  }
}

// Global singleton instance
let globalAdapter: CompatibilityAdapter | null = null;

/**
 * Get or create global adapter instance
 */
export function getCompatibilityAdapter(): CompatibilityAdapter {
  if (!globalAdapter) {
    globalAdapter = new CompatibilityAdapter();
  }
  return globalAdapter;
}

/**
 * Reset global adapter (for testing)
 */
export function resetCompatibilityAdapter(): void {
  if (globalAdapter) {
    globalAdapter.cleanup();
  }
  globalAdapter = null;
}
