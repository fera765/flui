/**
 * MCP Sandbox Manager
 * 
 * Manages isolated sandboxes for MCP execution:
 * - Sandbox lifecycle (create, prepare, execute, release, destroy)
 * - Resource pooling and reuse
 * - Environment isolation
 * - Resource limits and quotas
 * - Health checks and garbage collection
 */

import { generateId } from '../utils/id.js';
import { spawn, ChildProcess } from 'child_process';
import { mkdir, writeFile, readFile, rm } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { existsSync } from 'fs';

export interface SandboxConfig {
  mcpId: string;
  env: Record<string, string>;
  workDir?: string;
  limits?: ResourceLimits;
  persistent?: boolean;
}

export interface ResourceLimits {
  maxCpu?: number; // CPU limit (percentage)
  maxMemory?: number; // Memory limit in MB
  maxDisk?: number; // Disk limit in MB
  maxExecutionTime?: number; // Max execution time in ms
  networkAccess?: 'none' | 'restricted' | 'full';
}

export interface MCPSandbox {
  id: string;
  mcpId: string;
  workDir: string;
  env: Record<string, string>;
  state: 'preparing' | 'ready' | 'executing' | 'idle' | 'error' | 'destroyed';
  createdAt: Date;
  lastUsedAt: Date;
  executionCount: number;
  process?: ChildProcess;
  limits: ResourceLimits;
}

export interface ExecutionRequest {
  mcpId: string;
  toolId: string;
  params: Record<string, any>;
  context: {
    executionId: string;
    traceId: string;
    nodeId: string;
  };
  timeout?: number;
}

export interface ExecutionResponse {
  success: boolean;
  output: any;
  error?: string;
  exitCode?: number;
  sandboxId: string;
  resourceUsage?: {
    cpu: number;
    memory: number;
    disk: number;
  };
  logs?: string[];
}

export interface PoolConfig {
  minSize: number;
  maxSize: number;
  idleTimeout: number; // Time before destroying idle sandbox
  warmupOnStartup: boolean;
}

export class MCPSandboxManager {
  private sandboxes: Map<string, MCPSandbox> = new Map();
  private pool: Map<string, string[]> = new Map(); // mcpId -> sandboxIds
  private poolConfig: PoolConfig;
  private baseDir: string;
  private cleanupInterval?: NodeJS.Timeout;

  constructor(config?: {
    baseDir?: string;
    poolConfig?: Partial<PoolConfig>;
  }) {
    this.baseDir = config?.baseDir || join(tmpdir(), 'flui-mcp-sandboxes');
    this.poolConfig = {
      minSize: config?.poolConfig?.minSize || 0,
      maxSize: config?.poolConfig?.maxSize || 10,
      idleTimeout: config?.poolConfig?.idleTimeout || 300000, // 5min
      warmupOnStartup: config?.poolConfig?.warmupOnStartup || false,
    };

    // Start cleanup job
    this.startCleanupJob();
  }

  /**
   * Execute a tool in an MCP sandbox
   */
  async execute(request: ExecutionRequest): Promise<ExecutionResponse> {
    const startTime = Date.now();
    let sandbox: MCPSandbox | null = null;

    try {
      // Get or create sandbox
      sandbox = await this.acquireSandbox(request.mcpId);
      
      if (!sandbox) {
        throw new Error(`Failed to acquire sandbox for MCP: ${request.mcpId}`);
      }

      // Update state
      sandbox.state = 'executing';
      sandbox.lastUsedAt = new Date();
      sandbox.executionCount++;

      // Execute in sandbox
      const result = await this.executeInSandbox(sandbox, request);
      
      // Update state
      sandbox.state = 'idle';

      return {
        ...result,
        sandboxId: sandbox.id,
      };
    } catch (error: any) {
      if (sandbox) {
        sandbox.state = 'error';
      }

      throw error;
    } finally {
      // Release sandbox back to pool
      if (sandbox) {
        this.releaseSandbox(sandbox);
      }
    }
  }

  /**
   * Acquire a sandbox from pool or create new one
   */
  private async acquireSandbox(mcpId: string): Promise<MCPSandbox> {
    // Try to get from pool
    const pooled = this.getFromPool(mcpId);
    if (pooled && pooled.state === 'ready') {
      return pooled;
    }

    // Create new sandbox
    return await this.createSandbox(mcpId);
  }

  /**
   * Get sandbox from pool
   */
  private getFromPool(mcpId: string): MCPSandbox | null {
    const pooledIds = this.pool.get(mcpId) || [];
    
    for (const sandboxId of pooledIds) {
      const sandbox = this.sandboxes.get(sandboxId);
      if (sandbox && sandbox.state === 'idle') {
        sandbox.state = 'ready';
        return sandbox;
      }
    }

    return null;
  }

  /**
   * Create a new sandbox
   */
  private async createSandbox(mcpId: string): Promise<MCPSandbox> {
    const sandboxId = generateId();
    const workDir = join(this.baseDir, sandboxId);

    // Create work directory
    await mkdir(workDir, { recursive: true });

    // Load MCP configuration (from store or config)
    const mcpConfig = await this.loadMCPConfig(mcpId);

    const sandbox: MCPSandbox = {
      id: sandboxId,
      mcpId,
      workDir,
      env: mcpConfig.env || {},
      state: 'preparing',
      createdAt: new Date(),
      lastUsedAt: new Date(),
      executionCount: 0,
      limits: mcpConfig.limits || {},
    };

    // Store sandbox
    this.sandboxes.set(sandboxId, sandbox);

    // Add to pool
    if (!this.pool.has(mcpId)) {
      this.pool.set(mcpId, []);
    }
    this.pool.get(mcpId)!.push(sandboxId);

    // Prepare sandbox (load env, install deps, etc)
    await this.prepareSandbox(sandbox);

    sandbox.state = 'ready';
    return sandbox;
  }

  /**
   * Load MCP configuration
   */
  private async loadMCPConfig(mcpId: string): Promise<{
    env: Record<string, string>;
    limits: ResourceLimits;
  }> {
    // TODO: Load from actual MCP store
    // For now, return defaults
    return {
      env: {},
      limits: {
        maxMemory: 512,
        maxExecutionTime: 30000,
        networkAccess: 'restricted',
      },
    };
  }

  /**
   * Prepare sandbox environment
   */
  private async prepareSandbox(sandbox: MCPSandbox): Promise<void> {
    // Write environment file
    const envFile = join(sandbox.workDir, '.env');
    const envContent = Object.entries(sandbox.env)
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');
    
    await writeFile(envFile, envContent);

    // TODO: Install MCP dependencies if needed
    // TODO: Load MCP tools/functions
  }

  /**
   * Execute tool in sandbox
   */
  private async executeInSandbox(
    sandbox: MCPSandbox,
    request: ExecutionRequest
  ): Promise<Omit<ExecutionResponse, 'sandboxId'>> {
    const timeout = request.timeout || sandbox.limits.maxExecutionTime || 30000;
    const startTime = Date.now();

    return new Promise((resolve, reject) => {
      const logs: string[] = [];
      let stdout = '';
      let stderr = '';

      // Prepare execution payload
      const payload = JSON.stringify({
        toolId: request.toolId,
        params: request.params,
        context: request.context,
      });

      // Spawn isolated process
      const child = spawn('node', [
        '-e',
        `
        const toolId = '${request.toolId}';
        const params = ${JSON.stringify(request.params)};
        
        // Mock execution - replace with actual MCP client call
        console.log(JSON.stringify({
          success: true,
          output: { result: 'executed', toolId, params },
          logs: ['Executed in sandbox ${sandbox.id}']
        }));
        `
      ], {
        cwd: sandbox.workDir,
        env: { ...process.env, ...sandbox.env },
        timeout,
      });

      // Capture output
      child.stdout?.on('data', (data) => {
        const output = data.toString();
        stdout += output;
        logs.push(`[stdout] ${output}`);
      });

      child.stderr?.on('data', (data) => {
        const output = data.toString();
        stderr += output;
        logs.push(`[stderr] ${output}`);
      });

      // Handle completion
      child.on('close', (code) => {
        const duration = Date.now() - startTime;

        try {
          // Parse result from stdout
          const result = JSON.parse(stdout.trim());
          
          resolve({
            success: result.success || code === 0,
            output: result.output,
            error: result.error || (code !== 0 ? stderr : undefined),
            exitCode: code || 0,
            logs,
            resourceUsage: {
              cpu: 0, // TODO: Measure actual CPU usage
              memory: 0, // TODO: Measure actual memory usage
              disk: 0,
            },
          });
        } catch (error: any) {
          resolve({
            success: false,
            output: null,
            error: `Failed to parse execution result: ${error.message}`,
            exitCode: code || -1,
            logs,
          });
        }
      });

      child.on('error', (error) => {
        reject(error);
      });

      // Timeout handler
      setTimeout(() => {
        if (!child.killed) {
          child.kill('SIGTERM');
          reject(new Error(`Execution timeout after ${timeout}ms`));
        }
      }, timeout);
    });
  }

  /**
   * Release sandbox back to pool
   */
  private releaseSandbox(sandbox: MCPSandbox): void {
    if (sandbox.state === 'error') {
      // Don't reuse errored sandboxes
      this.destroySandbox(sandbox.id);
      return;
    }

    sandbox.state = 'idle';
    sandbox.lastUsedAt = new Date();
  }

  /**
   * Destroy a sandbox
   */
  private async destroySandbox(sandboxId: string): Promise<void> {
    const sandbox = this.sandboxes.get(sandboxId);
    if (!sandbox) return;

    // Kill process if running
    if (sandbox.process && !sandbox.process.killed) {
      sandbox.process.kill('SIGTERM');
    }

    // Remove work directory
    try {
      if (existsSync(sandbox.workDir)) {
        await rm(sandbox.workDir, { recursive: true, force: true });
      }
    } catch (error) {
      console.error(`Failed to remove sandbox work dir: ${error}`);
    }

    // Remove from pool
    const pooledIds = this.pool.get(sandbox.mcpId) || [];
    this.pool.set(
      sandbox.mcpId,
      pooledIds.filter(id => id !== sandboxId)
    );

    // Remove from sandboxes
    this.sandboxes.delete(sandboxId);
    
    sandbox.state = 'destroyed';
  }

  /**
   * Cleanup idle sandboxes
   */
  private cleanupIdleSandboxes(): void {
    const now = Date.now();
    const idleTimeout = this.poolConfig.idleTimeout;

    for (const [sandboxId, sandbox] of this.sandboxes.entries()) {
      if (sandbox.state === 'idle') {
        const idleTime = now - sandbox.lastUsedAt.getTime();
        
        if (idleTime > idleTimeout) {
          console.log(`Destroying idle sandbox: ${sandboxId}`);
          this.destroySandbox(sandboxId);
        }
      }
    }
  }

  /**
   * Start cleanup job
   */
  private startCleanupJob(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanupIdleSandboxes();
    }, 60000); // Run every minute
  }

  /**
   * Get sandbox statistics
   */
  getStats(): {
    total: number;
    byState: Record<string, number>;
    byMCP: Record<string, number>;
  } {
    const stats = {
      total: this.sandboxes.size,
      byState: {} as Record<string, number>,
      byMCP: {} as Record<string, number>,
    };

    for (const sandbox of this.sandboxes.values()) {
      stats.byState[sandbox.state] = (stats.byState[sandbox.state] || 0) + 1;
      stats.byMCP[sandbox.mcpId] = (stats.byMCP[sandbox.mcpId] || 0) + 1;
    }

    return stats;
  }

  /**
   * Cleanup all sandboxes
   */
  async cleanup(): Promise<void> {
    // Stop cleanup job
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    // Destroy all sandboxes
    const destroyPromises = Array.from(this.sandboxes.keys()).map(id =>
      this.destroySandbox(id)
    );

    await Promise.all(destroyPromises);
  }
}
