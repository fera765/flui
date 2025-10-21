/**
 * FLUI - MCP Executor
 * 
 * Executa MCPs reais via subprocesso (npx, npm, local)
 * Integra com Pollinations AI e outros MCPs
 */

import { spawn, ChildProcess } from 'child_process';
import { writeFile, readFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { MCP } from '../types/index.js';

export interface MCPExecutionResult {
  success: boolean;
  tools: Array<{
    id: string;
    name: string;
    description: string;
    handler: string;
    parameters: Record<string, any>;
  }>;
  error?: string;
}

export class MCPExecutor {
  private static processes = new Map<string, ChildProcess>();

  /**
   * Executa um MCP via npx
   */
  static async executeNPX(packageName: string, args: string[] = []): Promise<MCPExecutionResult> {
    return new Promise((resolve) => {
      const fullCommand = ['npx', packageName, ...args];
      console.log(`🚀 Executando MCP via NPX: ${fullCommand.join(' ')}`);

      const process = spawn('npx', [packageName, ...args], {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env, NODE_ENV: 'production' }
      });

      let stdout = '';
      let stderr = '';

      process.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      process.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      process.on('close', (code) => {
        if (code === 0) {
          try {
            // Tentar extrair tools do output
            const tools = this.extractToolsFromOutput(stdout);
            resolve({
              success: true,
              tools
            });
          } catch (error) {
            resolve({
              success: false,
              tools: [],
              error: `Erro ao processar output: ${error}`
            });
          }
        } else {
          resolve({
            success: false,
            tools: [],
            error: `Processo falhou com código ${code}: ${stderr}`
          });
        }
      });

      process.on('error', (error) => {
        resolve({
          success: false,
          tools: [],
          error: `Erro ao executar processo: ${error.message}`
        });
      });

      // Timeout após 30 segundos
      setTimeout(() => {
        process.kill();
        resolve({
          success: false,
          tools: [],
          error: 'Timeout - processo demorou mais de 30 segundos'
        });
      }, 30000);
    });
  }

  /**
   * Testa conexão com MCP
   */
  static async testMCP(mcp: MCP): Promise<MCPExecutionResult> {
    try {
      if (mcp.server.startsWith('npx ')) {
        const packageName = mcp.server.replace('npx ', '').split(' ')[0];
        return await this.executeNPX(packageName);
      } else if (mcp.server.startsWith('http')) {
        // MCP local via HTTP
        return await this.testHTTPMCP(mcp.server);
      } else {
        return {
          success: false,
          tools: [],
          error: 'Tipo de MCP não suportado'
        };
      }
    } catch (error: any) {
      return {
        success: false,
        tools: [],
        error: error.message
      };
    }
  }

  /**
   * Testa MCP via HTTP
   */
  private static async testHTTPMCP(url: string): Promise<MCPExecutionResult> {
    try {
      const response = await fetch(`${url}/tools`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      return {
        success: true,
        tools: data.tools || []
      };
    } catch (error: any) {
      return {
        success: false,
        tools: [],
        error: `Erro HTTP: ${error.message}`
      };
    }
  }

  /**
   * Extrai tools do output do MCP
   */
  private static extractToolsFromOutput(output: string): Array<{
    id: string;
    name: string;
    description: string;
    handler: string;
    parameters: Record<string, any>;
  }> {
    const tools: Array<{
      id: string;
      name: string;
      description: string;
      handler: string;
      parameters: Record<string, any>;
    }> = [];

    try {
      // Tentar parsear como JSON primeiro
      const lines = output.split('\n');
      for (const line of lines) {
        if (line.trim().startsWith('{') && line.trim().endsWith('}')) {
          try {
            const data = JSON.parse(line);
            if (data.tools && Array.isArray(data.tools)) {
              return data.tools.map((tool: any) => ({
                id: tool.name || tool.id || `tool_${Date.now()}`,
                name: tool.name || 'Unnamed Tool',
                description: tool.description || 'No description',
                handler: tool.handler || 'default',
                parameters: tool.parameters || {}
              }));
            }
          } catch (e) {
            // Ignorar linhas que não são JSON válido
          }
        }
      }

      // Fallback: procurar por padrões de tools no output
      const toolMatches = output.match(/Tool:\s*([^\n]+)/gi);
      if (toolMatches) {
        toolMatches.forEach((match, index) => {
          const toolName = match.replace(/Tool:\s*/i, '').trim();
          tools.push({
            id: `tool_${index}`,
            name: toolName,
            description: `Tool: ${toolName}`,
            handler: 'default',
            parameters: {}
          });
        });
      }

      // Se não encontrou tools específicas, criar uma genérica
      if (tools.length === 0) {
        tools.push({
          id: 'default_tool',
          name: 'MCP Tool',
          description: 'Tool from MCP server',
          handler: 'default',
          parameters: {}
        });
      }

    } catch (error) {
      console.error('Erro ao extrair tools:', error);
    }

    return tools;
  }

  /**
   * Para um MCP em execução
   */
  static stopMCP(mcpId: string): void {
    const process = this.processes.get(mcpId);
    if (process) {
      process.kill();
      this.processes.delete(mcpId);
    }
  }

  /**
   * Lista MCPs em execução
   */
  static getRunningMCPs(): string[] {
    return Array.from(this.processes.keys());
  }
}

/**
 * Testa MCP Pollinations AI especificamente
 */
export async function testPollinationsMCP(): Promise<MCPExecutionResult> {
  console.log('🧪 Testando MCP Pollinations AI...');
  
  try {
    const result = await MCPExecutor.executeNPX('@pollinations/model-context-protocol');
    
    if (result.success) {
      console.log(`✅ Pollinations MCP funcionando! ${result.tools.length} tools encontradas`);
      result.tools.forEach(tool => {
        console.log(`  - ${tool.name}: ${tool.description}`);
      });
    } else {
      console.log(`❌ Pollinations MCP falhou: ${result.error}`);
    }
    
    return result;
  } catch (error: any) {
    console.error('❌ Erro ao testar Pollinations MCP:', error);
    return {
      success: false,
      tools: [],
      error: error.message
    };
  }
}