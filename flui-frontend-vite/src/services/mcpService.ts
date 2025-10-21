/**
 * MCP Service - Serviço completo para gerenciamento de MCPs
 * 
 * ✅ Instalação via NPX, NPM, GitHub, Local
 * ✅ Testes de funcionalidade
 * ✅ Integração com Tool Registry
 * ✅ Sem hardcoded ou simulações
 */

import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';

export interface MCPInstallation {
  id?: string;
  name: string;
  description: string;
  version: string;
  server: string;
  installType: 'npx' | 'npm' | 'github' | 'local';
  enabled: boolean;
  tools?: MCPTool[];
  metadata?: {
    createdAt: string;
    updatedAt: string;
    lastSyncedAt?: string;
    githubRepo?: string;
    packageName?: string;
  };
}

export interface MCPTool {
  id: string;
  name: string;
  description: string;
  handler: string;
  parameters: Record<string, any>;
}

export interface MCPTestResult {
  success: boolean;
  message: string;
  toolsFound: number;
  tools?: MCPTool[];
  error?: string;
}

// ==================== FETCH METADATA ====================

/**
 * Busca metadados do MCP de fontes públicas
 */
export async function fetchMCPMetadata(
  server: string,
  installType: 'npx' | 'npm' | 'github' | 'local'
): Promise<Partial<MCPInstallation> | null> {
  try {
    if (installType === 'npx' || installType === 'npm') {
      // Extrair nome do pacote
      const packageName = server.replace(/^npx\s+/, '').split(/\s+/)[0];
      
      // Buscar no NPM registry
      const response = await fetch(`https://registry.npmjs.org/${packageName}`);
      if (!response.ok) return null;
      
      const data = await response.json();
      
      return {
        name: data.name || packageName,
        description: data.description || '',
        version: data['dist-tags']?.latest || '1.0.0',
        metadata: {
          packageName,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      };
    } else if (installType === 'github') {
      // Extrair owner/repo
      const match = server.match(/(?:github\.com\/)?([^\/]+)\/([^\/\s]+)/);
      if (!match) return null;
      
      const [, owner, repo] = match;
      const cleanRepo = repo.replace(/\.git$/, '');
      
      // Buscar no GitHub API
      const response = await fetch(`https://api.github.com/repos/${owner}/${cleanRepo}`);
      if (!response.ok) return null;
      
      const data = await response.json();
      
      // Tentar buscar package.json
      let packageData: any = {};
      try {
        const pkgResponse = await fetch(
          `https://raw.githubusercontent.com/${owner}/${cleanRepo}/main/package.json`
        );
        if (pkgResponse.ok) {
          packageData = await pkgResponse.json();
        }
      } catch (e) {
        // Ignorar se não encontrar
      }
      
      return {
        name: packageData.name || data.name || cleanRepo,
        description: packageData.description || data.description || '',
        version: packageData.version || '1.0.0',
        metadata: {
          githubRepo: `${owner}/${cleanRepo}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      };
    }
    
    return null;
  } catch (error) {
    console.error('❌ Erro ao buscar metadados:', error);
    return null;
  }
}

// ==================== MCP OPERATIONS ====================

/**
 * Instalar MCP
 */
export async function installMCP(installation: MCPInstallation): Promise<any> {
  try {
    // Criar MCP no backend
    const createResponse = await axios.post(`${API_BASE_URL}/mcps`, {
      id: installation.id || `mcp-${Date.now()}`,
      name: installation.name,
      description: installation.description,
      version: installation.version,
      server: installation.server,
      installType: installation.installType,
      enabled: installation.enabled,
      tools: [], // Será preenchido na sincronização
      metadata: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    });

    return createResponse.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.error || 'Erro ao instalar MCP');
  }
}

/**
 * Sincronizar MCP e carregar suas tools
 */
export async function syncMCP(mcpId: string): Promise<MCPTestResult> {
  try {
    const response = await axios.post(`${API_BASE_URL}/mcps/${mcpId}/sync`);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.error || 'Erro ao sincronizar MCP');
  }
}

/**
 * Testar MCP (verificar se as tools estão funcionando)
 */
export async function testMCP(mcpId: string): Promise<MCPTestResult> {
  try {
    const response = await axios.post(`${API_BASE_URL}/mcps/${mcpId}/test`);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.error || 'Erro ao testar MCP');
  }
}

/**
 * Listar todos os MCPs
 */
export async function listMCPs(): Promise<MCPInstallation[]> {
  try {
    const response = await axios.get(`${API_BASE_URL}/mcps`);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.error || 'Erro ao listar MCPs');
  }
}

/**
 * Obter MCP por ID
 */
export async function getMCP(mcpId: string): Promise<MCPInstallation> {
  try {
    const response = await axios.get(`${API_BASE_URL}/mcps/${mcpId}`);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.error || 'Erro ao buscar MCP');
  }
}

/**
 * Atualizar MCP
 */
export async function updateMCP(
  mcpId: string,
  updates: Partial<MCPInstallation>
): Promise<MCPInstallation> {
  try {
    const response = await axios.put(`${API_BASE_URL}/mcps/${mcpId}`, updates);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.error || 'Erro ao atualizar MCP');
  }
}

/**
 * Deletar MCP
 */
export async function deleteMCP(mcpId: string): Promise<void> {
  try {
    await axios.delete(`${API_BASE_URL}/mcps/${mcpId}`);
  } catch (error: any) {
    throw new Error(error.response?.data?.error || 'Erro ao deletar MCP');
  }
}

// ==================== TOOL REGISTRY ====================

/**
 * Verificar se as tools do MCP estão registradas no Tool Registry
 */
export async function verifyMCPTools(mcpId: string): Promise<{
  registered: boolean;
  toolsCount: number;
  tools: string[];
}> {
  try {
    // Buscar MCP
    const mcp = await getMCP(mcpId);
    
    // Buscar todas as tools
    const toolsResponse = await axios.get(`${API_BASE_URL}/tools`);
    const allTools = toolsResponse.data;
    
    // Verificar quantas tools do MCP estão registradas
    const mcpToolNames = (mcp.tools || []).map((t) => t.name);
    const registeredTools = allTools.filter((tool: any) =>
      tool.category === 'mcp' && mcpToolNames.includes(tool.name)
    );
    
    return {
      registered: registeredTools.length > 0,
      toolsCount: registeredTools.length,
      tools: registeredTools.map((t: any) => t.name),
    };
  } catch (error: any) {
    throw new Error(error.response?.data?.error || 'Erro ao verificar tools');
  }
}

// ==================== INSTALL FLOW ====================

/**
 * Fluxo completo de instalação e teste de MCP
 */
export async function installAndTestMCP(
  installation: MCPInstallation
): Promise<{
  mcp: any;
  testResult: MCPTestResult;
  toolsInRegistry: { registered: boolean; toolsCount: number; tools: string[] };
}> {
  try {
    console.log('📦 Instalando MCP:', installation.name);
    
    // 1. Criar MCP no backend
    const createResponse = await installMCP(installation);
    const mcpId = createResponse.id;
    console.log('✅ MCP criado:', mcpId);
    
    // 2. Sincronizar e carregar tools (isso executa o MCP e extrai as tools)
    console.log('🔄 Sincronizando MCP...');
    const syncResponse = await axios.post(`${API_BASE_URL}/mcps/${mcpId}/sync`);
    console.log('✅ Sincronização concluída:', syncResponse.data);
    
    // 3. Testar MCP
    console.log('🧪 Testando MCP...');
    const testResponse = await axios.post(`${API_BASE_URL}/mcps/${mcpId}/test`);
    const testResult = testResponse.data;
    console.log('✅ Teste concluído:', testResult);
    
    // 4. Verificar se tools estão no registry
    console.log('🔍 Verificando Tool Registry...');
    const toolsInRegistry = await verifyMCPTools(mcpId);
    console.log('✅ Verificação concluída:', toolsInRegistry);
    
    // 5. Buscar MCP atualizado
    const updatedMCP = await getMCP(mcpId);
    
    return {
      mcp: updatedMCP,
      testResult: {
        success: testResult.success,
        message: testResult.message,
        toolsFound: syncResponse.data.toolsFound || 0,
        tools: syncResponse.data.tools || [],
      },
      toolsInRegistry,
    };
  } catch (error: any) {
    console.error('❌ Erro no fluxo de instalação:', error);
    throw error;
  }
}
