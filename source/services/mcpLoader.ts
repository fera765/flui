/**
 * FLUI - MCP Loader
 * 
 * Carregador dinâmico de MCPs (Model Context Protocols)
 * Registra automaticamente as tools de cada MCP no registry
 */

import { MCP } from '../types/index.js';
import { Tool, ToolParam, ExecutionContext, ToolResult } from '../core/types.js';
import { getToolRegistry } from '../core/toolRegistry.js';
import { useStore } from '../store/store.js';
import { executeTool as executeToolLegacy } from './toolExecutor.js';

export class MCPLoader {
  /**
   * Carrega e registra todos os MCPs do store
   */
  static async loadAllMCPs(): Promise<number> {
    const store = useStore.getState();
    const mcps = store.mcps;
    
    let registeredCount = 0;

    for (const mcp of mcps) {
      if (!mcp.enabled) continue;
      
      try {
        await this.loadMCP(mcp);
        registeredCount++;
      } catch (error: any) {
        console.error(`Erro ao carregar MCP '${mcp.name}': ${error.message}`);
      }
    }

    return registeredCount;
  }

  /**
   * Carrega e registra um MCP específico
   */
  static async loadMCP(mcp: MCP): Promise<void> {
    const registry = getToolRegistry();

    // Cada tool do MCP vira uma Tool no registry
    for (const mcpTool of mcp.tools) {
      // Normalizar ID da tool (remover caracteres especiais e lowercase)
      const normalizedToolId = mcpTool.id
        .toLowerCase()
        .replace(/[^a-z0-9-_]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
      
      const toolId = `mcp-${mcp.id}-${normalizedToolId}`;

      // Verificar se já está registrada
      if (registry.has(toolId)) {
        console.log(`Tool '${toolId}' já registrada, pulando...`);
        continue;
      }

      // Converter parâmetros do MCP para ToolParam
      const params: ToolParam[] = Object.entries(mcpTool.parameters).map(([name, type]) => ({
        name,
        type: this.mapMCPTypeToToolType(type as string),
        description: `Parâmetro ${name}`,
        required: true,
      }));

      // Criar Tool baseada no MCP Tool
      const tool: Tool = {
        id: toolId,
        name: `${mcp.name}: ${mcpTool.name}`,
        description: mcpTool.description,
        category: 'mcp',
        version: mcp.version,
        params,
        output: {
          type: 'object',
          description: 'Resultado da execução da tool MCP',
        },
        
        // Função de execução que delega para o handler do MCP
        async execute(args: any, context: ExecutionContext): Promise<ToolResult> {
          try {
            // Usar o executor legado que já sabe como executar MCPs
            const result = await executeToolLegacy(mcpTool.handler, args);
            
            return {
              success: result.success,
              result: result.result,
              error: result.error,
            };
          } catch (error: any) {
            return {
              success: false,
              error: `Erro ao executar tool MCP: ${error.message}`,
            };
          }
        },

        ui: {
          icon: 'Package',
          color: '#a855f7', // purple
          tags: ['mcp', mcp.name.toLowerCase()],
        },

        config: {
          timeout: 30000,
          sandbox: true,
        },
      };

      // Registrar no registry
      registry.register(tool);
      console.log(`✅ MCP Tool registrada: ${tool.name} (${toolId})`);
    }
  }

  /**
   * Remove um MCP e suas tools do registry
   */
  static async unloadMCP(mcpId: string): Promise<void> {
    const registry = getToolRegistry();
    const store = useStore.getState();
    const mcp = store.mcps.find((m) => m.id === mcpId);

    if (!mcp) {
      throw new Error(`MCP não encontrado: ${mcpId}`);
    }

    // Remover cada tool do MCP
    for (const mcpTool of mcp.tools) {
      const toolId = `mcp-${mcp.id}-${mcpTool.id}`;
      registry.unregister(toolId);
      console.log(`❌ MCP Tool removida: ${toolId}`);
    }
  }

  /**
   * Recarrega um MCP (útil quando MCP é atualizado)
   */
  static async reloadMCP(mcpId: string): Promise<void> {
    await this.unloadMCP(mcpId);
    
    const store = useStore.getState();
    const mcp = store.mcps.find((m) => m.id === mcpId);
    
    if (mcp) {
      await this.loadMCP(mcp);
    }
  }

  /**
   * Mapeia tipo do MCP para tipo da Tool
   */
  private static mapMCPTypeToToolType(mcpType: string): any {
    const typeMap: Record<string, any> = {
      'string': 'string',
      'number': 'number',
      'boolean': 'boolean',
      'object': 'object',
      'array': 'array',
    };

    return typeMap[mcpType] || 'string';
  }

  /**
   * Lista todas as tools registradas de MCPs
   */
  static listMCPTools(): Array<{ mcpId: string; mcpName: string; toolId: string; toolName: string }> {
    const registry = getToolRegistry();
    const mcpToolsResult = registry.list({ category: 'mcp' });
    
    return mcpToolsResult.tools.map((tool: any) => {
      // Extrair IDs do toolId (formato: mcp-{mcpId}-{toolId})
      const parts = tool.id.split('-');
      const mcpId = parts[1];
      const toolId = parts.slice(2).join('-');
      
      return {
        mcpId,
        mcpName: tool.name.split(':')[0].trim(),
        toolId: tool.id,
        toolName: tool.name,
      };
    });
  }
}

/**
 * Inicializa o sistema de MCPs
 * Deve ser chamado no startup da aplicação
 */
export async function initializeMCPs(): Promise<void> {
  console.log('\n🔌 Carregando MCPs...');
  
  try {
    const count = await MCPLoader.loadAllMCPs();
    console.log(`✅ ${count} MCPs carregados com sucesso\n`);
  } catch (error: any) {
    console.error(`❌ Erro ao carregar MCPs: ${error.message}\n`);
  }
}
