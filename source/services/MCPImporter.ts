/**
 * MCP Importer Service
 * 
 * Imports MCPs from multiple sources:
 * - NPM packages
 * - NPX execution
 * - GitHub repositories
 * - HTTP endpoints
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { mkdir, writeFile, rm } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { nanoid } from 'nanoid';
import { MCP, MCPTool } from '../types/index.js';

const execAsync = promisify(exec);

export interface NPMImportConfig {
  package: string;
  version?: string;
  registry?: string;
}

export interface NPXImportConfig {
  package: string;
  args?: string[];
  env?: Record<string, string>;
}

export interface GitHubImportConfig {
  repo: string;
  path?: string;
  ref?: string;
  token?: string;
}

export interface URLImportConfig {
  endpoint: string;
  auth?: {
    type: 'bearer' | 'basic' | 'api-key';
    token?: string;
    username?: string;
    password?: string;
  };
  headers?: Record<string, string>;
}

export interface ImportResult {
  success: boolean;
  mcp?: MCP;
  error?: string;
}

export interface ToolDiscoveryResult {
  success: boolean;
  tools?: MCPTool[];
  error?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings?: string[];
}

export class MCPImporter {
  private cacheDir: string;

  constructor(cacheDir?: string) {
    this.cacheDir = cacheDir || join(tmpdir(), 'flui-mcp-cache');
  }

  /**
   * Import MCP from NPM package
   */
  async importFromNPM(config: NPMImportConfig): Promise<ImportResult> {
    try {
      const version = config.version || 'latest';
      const packageSpec = `${config.package}@${version}`;

      // Install package to cache
      const installDir = join(this.cacheDir, nanoid());
      await mkdir(installDir, { recursive: true });

      console.log(`📦 Installing ${packageSpec}...`);
      
      const installCmd = config.registry
        ? `npm install ${packageSpec} --registry=${config.registry}`
        : `npm install ${packageSpec}`;

      await execAsync(installCmd, {
        cwd: installDir,
        timeout: 120000, // 2 minutes
      });

      // Discover tools from package
      const tools = await this.discoverToolsFromPackage(installDir, config.package);

      const mcp: MCP = {
        id: nanoid(),
        name: config.package,
        description: `MCP from npm: ${config.package}`,
        version,
        server: config.package,
        installType: 'npm',
        tools,
        enabled: true,
        metadata: {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          importedFrom: 'npm',
          installDir,
        },
      };

      return {
        success: true,
        mcp,
      };
    } catch (error: any) {
      return {
        success: false,
        error: `Failed to import from NPM: ${error.message}`,
      };
    }
  }

  /**
   * Import MCP via NPX
   */
  async importFromNPX(config: NPXImportConfig): Promise<ImportResult> {
    try {
      const mcp: MCP = {
        id: nanoid(),
        name: config.package,
        description: `MCP via npx: ${config.package}`,
        version: 'latest',
        server: config.package,
        installType: 'npx',
        envVars: config.env,
        tools: [],
        enabled: true,
        metadata: {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          importedFrom: 'npx',
          args: config.args,
        },
      };

      // Discover tools by executing npx
      const discoveryResult = await this.discoverToolsFromNPX(config);
      if (discoveryResult.success && discoveryResult.tools) {
        mcp.tools = discoveryResult.tools;
      }

      return {
        success: true,
        mcp,
      };
    } catch (error: any) {
      return {
        success: false,
        error: `Failed to import from NPX: ${error.message}`,
      };
    }
  }

  /**
   * Import MCP from GitHub repository
   */
  async importFromGitHub(config: GitHubImportConfig): Promise<ImportResult> {
    try {
      const cloneDir = join(this.cacheDir, nanoid());
      await mkdir(cloneDir, { recursive: true });

      // Build git clone URL
      const repoUrl = config.token
        ? `https://${config.token}@github.com/${config.repo}.git`
        : `https://github.com/${config.repo}.git`;

      const ref = config.ref || 'main';

      console.log(`📥 Cloning ${config.repo}...`);

      await execAsync(`git clone --depth 1 --branch ${ref} ${repoUrl} ${cloneDir}`, {
        timeout: 120000,
      });

      const serverPath = config.path ? join(cloneDir, config.path) : cloneDir;

      // Install dependencies
      console.log(`📦 Installing dependencies...`);
      await execAsync('npm install', {
        cwd: serverPath,
        timeout: 180000,
      });

      // Discover tools
      const tools = await this.discoverToolsFromPath(serverPath);

      const mcp: MCP = {
        id: nanoid(),
        name: config.repo.split('/').pop() || 'github-mcp',
        description: `MCP from GitHub: ${config.repo}`,
        version: ref,
        server: serverPath,
        installType: 'github',
        tools,
        enabled: true,
        metadata: {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          importedFrom: 'github',
          repo: config.repo,
          ref,
        },
      };

      return {
        success: true,
        mcp,
      };
    } catch (error: any) {
      return {
        success: false,
        error: `Failed to import from GitHub: ${error.message}`,
      };
    }
  }

  /**
   * Import MCP from HTTP endpoint
   */
  async importFromURL(config: URLImportConfig): Promise<ImportResult> {
    try {
      // Build headers
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...config.headers,
      };

      if (config.auth) {
        if (config.auth.type === 'bearer' && config.auth.token) {
          headers['Authorization'] = `Bearer ${config.auth.token}`;
        } else if (config.auth.type === 'basic' && config.auth.username) {
          const credentials = Buffer.from(
            `${config.auth.username}:${config.auth.password || ''}`
          ).toString('base64');
          headers['Authorization'] = `Basic ${credentials}`;
        } else if (config.auth.type === 'api-key' && config.auth.token) {
          headers['X-API-Key'] = config.auth.token;
        }
      }

      // Discover MCP capabilities
      console.log(`🌐 Connecting to ${config.endpoint}...`);
      
      const response = await fetch(`${config.endpoint}/mcp/info`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const mcpInfo: any = await response.json();

      const mcp: MCP = {
        id: nanoid(),
        name: mcpInfo.name || 'url-mcp',
        description: mcpInfo.description || `MCP from ${config.endpoint}`,
        version: mcpInfo.version || '1.0.0',
        server: config.endpoint,
        installType: 'url',
        tools: mcpInfo.tools || [],
        enabled: true,
        metadata: {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          importedFrom: 'url',
          endpoint: config.endpoint,
          authType: config.auth?.type,
        },
      };

      return {
        success: true,
        mcp,
      };
    } catch (error: any) {
      return {
        success: false,
        error: `Failed to import from URL: ${error.message}`,
      };
    }
  }

  /**
   * Discover tools from installed NPM package
   */
  private async discoverToolsFromPackage(
    installDir: string,
    packageName: string
  ): Promise<MCPTool[]> {
    try {
      // Try to load package and discover tools
      const packagePath = join(installDir, 'node_modules', packageName);
      return await this.discoverToolsFromPath(packagePath);
    } catch (error) {
      console.warn(`Could not discover tools: ${error}`);
      return [];
    }
  }

  /**
   * Discover tools from NPX execution
   */
  private async discoverToolsFromNPX(config: NPXImportConfig): Promise<ToolDiscoveryResult> {
    try {
      const args = config.args || [];
      const envStr = config.env
        ? Object.entries(config.env).map(([k, v]) => `${k}=${v}`).join(' ')
        : '';

      const cmd = `${envStr} npx ${config.package} ${args.join(' ')} --list-tools`;

      const { stdout } = await execAsync(cmd, {
        timeout: 30000,
      });

      const tools = JSON.parse(stdout);

      return {
        success: true,
        tools,
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to discover tools: ${error}`,
      };
    }
  }

  /**
   * Discover tools from local path
   */
  private async discoverToolsFromPath(path: string): Promise<MCPTool[]> {
    try {
      // Try to load package.json
      const packageJson = await import(join(path, 'package.json'));
      
      // Try to load main file and discover exports
      // This is a simplified version - real implementation would
      // need to analyze the package exports
      return [
        {
          id: nanoid(),
          name: packageJson.name || 'unknown',
          description: packageJson.description || '',
          parameters: {},
          handler: 'main',
        },
      ];
    } catch (error) {
      return [];
    }
  }

  /**
   * Discover tools from MCP ID
   */
  async discoverTools(mcpId: string): Promise<ToolDiscoveryResult> {
    // Placeholder for dynamic tool discovery
    return {
      success: true,
      tools: [],
    };
  }

  /**
   * Validate MCP configuration
   */
  async validateMCP(mcp: Partial<MCP>): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!mcp.name) {
      errors.push('MCP name is required');
    }

    if (!mcp.tools || mcp.tools.length === 0) {
      warnings.push('MCP has no tools');
    }

    // Validate tools
    if (mcp.tools) {
      for (const tool of mcp.tools) {
        if (!tool.id) {
          errors.push(`Tool missing id: ${tool.name}`);
        }
        if (!tool.name) {
          errors.push(`Tool missing name: ${tool.id}`);
        }
        if (!tool.handler) {
          errors.push(`Tool missing handler: ${tool.id}`);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Cleanup cache directory
   */
  async cleanup(): Promise<void> {
    try {
      await rm(this.cacheDir, { recursive: true, force: true });
    } catch (error) {
      console.warn(`Failed to cleanup cache: ${error}`);
    }
  }
}
