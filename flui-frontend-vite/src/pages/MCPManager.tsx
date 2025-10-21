/**
 * FLUI - MCP Manager
 * 
 * Gerenciamento completo de MCPs (Model Context Protocol)
 * ✅ Listar MCPs instalados
 * ✅ Adicionar novos MCPs (NPX, NPM, GitHub, Local)
 * ✅ Testar MCPs
 * ✅ Ver tools de cada MCP
 * ✅ Sincronizar tools
 * ✅ Habilitar/Desabilitar
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Package,
  CheckCircle,
  XCircle,
  Loader2,
  RefreshCw,
  TestTube,
  Trash2,
  Eye,
  EyeOff,
} from 'lucide-react';
import MCPInstallModal from '../components/MCPInstallModal';
import {
  listMCPs,
  deleteMCP,
  updateMCP,
  type MCPInstallation,
} from '../services/mcpService';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';

export default function MCPManager() {
  const navigate = useNavigate();
  const [mcps, setMcps] = useState<MCPInstallation[]>([]);
  const [loading, setLoading] = useState(true);
  const [installModalOpen, setInstallModalOpen] = useState(false);
  const [testingMCP, setTestingMCP] = useState<string | null>(null);
  const [syncingMCP, setSyncingMCP] = useState<string | null>(null);
  const [expandedMCP, setExpandedMCP] = useState<string | null>(null);
  const [mcpTools, setMcpTools] = useState<Record<string, any[]>>({});

  useEffect(() => {
    loadMCPs();
  }, []);

  const loadMCPs = async () => {
    try {
      setLoading(true);
      const data = await listMCPs();
      setMcps(data);

      // Carregar tools de cada MCP
      const toolsMap: Record<string, any[]> = {};
      for (const mcp of data) {
        toolsMap[mcp.id!] = mcp.tools || [];
      }
      setMcpTools(toolsMap);
    } catch (error) {
      console.error('❌ Erro ao carregar MCPs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTestMCP = async (mcpId: string) => {
    try {
      setTestingMCP(mcpId);
      const response = await axios.post(`${API_BASE_URL}/mcps/${mcpId}/test`);

      if (response.data.success) {
        alert(`✅ MCP testado com sucesso!\n${response.data.message}`);
      } else {
        alert(`❌ Erro no teste:\n${response.data.message}`);
      }
    } catch (error: any) {
      console.error('❌ Erro ao testar MCP:', error);
      alert(`❌ Erro ao testar MCP:\n${error.response?.data?.error || error.message}`);
    } finally {
      setTestingMCP(null);
    }
  };

  const handleSyncMCP = async (mcpId: string) => {
    try {
      setSyncingMCP(mcpId);
      const response = await axios.post(`${API_BASE_URL}/mcps/${mcpId}/sync`);

      if (response.data.success) {
        alert(
          `✅ MCP sincronizado!\n${response.data.toolsFound} tools encontradas`
        );

        // Atualizar tools localmente
        setMcpTools((prev) => ({
          ...prev,
          [mcpId]: response.data.tools || [],
        }));

        // Recarregar MCPs
        await loadMCPs();
      } else {
        alert(`❌ Erro na sincronização`);
      }
    } catch (error: any) {
      console.error('❌ Erro ao sincronizar MCP:', error);
      alert(`❌ Erro ao sincronizar:\n${error.response?.data?.error || error.message}`);
    } finally {
      setSyncingMCP(null);
    }
  };

  const handleToggleEnable = async (mcp: MCPInstallation) => {
    try {
      await updateMCP(mcp.id!, { enabled: !mcp.enabled });
      await loadMCPs();
    } catch (error) {
      console.error('❌ Erro ao atualizar MCP:', error);
      alert('Erro ao atualizar MCP');
    }
  };

  const handleDeleteMCP = async (mcpId: string, mcpName: string) => {
    if (!confirm(`Tem certeza que deseja remover o MCP "${mcpName}"?`)) {
      return;
    }

    try {
      await deleteMCP(mcpId);
      await loadMCPs();
    } catch (error) {
      console.error('❌ Erro ao deletar MCP:', error);
      alert('Erro ao deletar MCP');
    }
  };

  const handleInstallSuccess = async () => {
    await loadMCPs();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      {/* Header */}
      <div className="bg-black/20 border-b border-purple-500/20 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/')}
                className="text-purple-300 hover:text-white transition p-2 hover:bg-purple-500/10 rounded-lg"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold">Gerenciador de MCPs</h1>
                <p className="text-sm text-purple-300">
                  Model Context Protocol - Adicione e gerencie ferramentas externas
                </p>
              </div>
            </div>
            <button
              onClick={() => setInstallModalOpen(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-3 rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg"
            >
              <Plus className="w-5 h-5" />
              Adicionar MCP
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-12 h-12 text-purple-400 animate-spin mb-4" />
            <p className="text-purple-300">Carregando MCPs...</p>
          </div>
        ) : mcps.length === 0 ? (
          <div className="text-center py-20">
            <Package className="w-20 h-20 text-purple-400 mx-auto mb-6 opacity-50" />
            <h2 className="text-2xl font-bold text-white mb-3">
              Nenhum MCP instalado
            </h2>
            <p className="text-purple-300 mb-6 max-w-md mx-auto">
              Adicione MCPs para expandir as funcionalidades do sistema com
              ferramentas externas
            </p>
            <button
              onClick={() => setInstallModalOpen(true)}
              className="bg-gradient-to-r from-purple-600 to-pink-600 px-8 py-4 rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg"
            >
              <Plus className="w-5 h-5 inline-block mr-2" />
              Adicionar Primeiro MCP
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {mcps.map((mcp) => {
              const tools = mcpTools[mcp.id!] || [];
              const isExpanded = expandedMCP === mcp.id;

              return (
                <div
                  key={mcp.id}
                  className="bg-slate-800/50 border-2 border-purple-500/20 rounded-2xl overflow-hidden hover:border-purple-500/40 transition-all"
                >
                  {/* MCP Header */}
                  <div className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      {/* Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Package className="w-6 h-6 text-purple-400" />
                          <h3 className="text-xl font-bold text-white">
                            {mcp.name}
                          </h3>
                          {mcp.enabled ? (
                            <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs font-semibold rounded-lg flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" />
                              Ativo
                            </span>
                          ) : (
                            <span className="px-2 py-1 bg-gray-500/20 text-gray-400 text-xs font-semibold rounded-lg flex items-center gap-1">
                              <XCircle className="w-3 h-3" />
                              Inativo
                            </span>
                          )}
                        </div>
                        <p className="text-purple-300 text-sm mb-3">
                          {mcp.description || 'Sem descrição'}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-gray-400">
                          <span>v{mcp.version}</span>
                          <span>•</span>
                          <span>{(mcp as any).installType || 'npx'}</span>
                          <span>•</span>
                          <span>{tools.length} tools</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleTestMCP(mcp.id!)}
                          disabled={testingMCP === mcp.id}
                          className="p-3 text-blue-400 hover:bg-blue-500/10 rounded-xl transition-colors disabled:opacity-50"
                          title="Testar MCP"
                        >
                          {testingMCP === mcp.id ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <TestTube className="w-5 h-5" />
                          )}
                        </button>

                        <button
                          onClick={() => handleSyncMCP(mcp.id!)}
                          disabled={syncingMCP === mcp.id}
                          className="p-3 text-purple-400 hover:bg-purple-500/10 rounded-xl transition-colors disabled:opacity-50"
                          title="Sincronizar tools"
                        >
                          {syncingMCP === mcp.id ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <RefreshCw className="w-5 h-5" />
                          )}
                        </button>

                        <button
                          onClick={() => handleToggleEnable(mcp)}
                          className="p-3 text-yellow-400 hover:bg-yellow-500/10 rounded-xl transition-colors"
                          title={mcp.enabled ? 'Desabilitar' : 'Habilitar'}
                        >
                          {mcp.enabled ? (
                            <EyeOff className="w-5 h-5" />
                          ) : (
                            <Eye className="w-5 h-5" />
                          )}
                        </button>

                        <button
                          onClick={() =>
                            setExpandedMCP(isExpanded ? null : mcp.id!)
                          }
                          className="p-3 text-gray-400 hover:bg-gray-500/10 rounded-xl transition-colors"
                          title="Ver tools"
                        >
                          <Package className="w-5 h-5" />
                        </button>

                        <button
                          onClick={() => handleDeleteMCP(mcp.id!, mcp.name)}
                          className="p-3 text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
                          title="Remover MCP"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Tools List (Expandable) */}
                  {isExpanded && (
                    <div className="border-t border-purple-500/20 bg-slate-900/50 p-6">
                      <h4 className="text-sm font-semibold text-purple-300 mb-4">
                        Tools Disponíveis ({tools.length})
                      </h4>
                      {tools.length === 0 ? (
                        <p className="text-sm text-gray-400">
                          Nenhuma tool encontrada. Tente sincronizar o MCP.
                        </p>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {tools.map((tool, index) => (
                            <div
                              key={index}
                              className="bg-slate-800/50 border border-purple-500/20 rounded-xl p-4"
                            >
                              <h5 className="text-sm font-semibold text-white mb-1">
                                {tool.name}
                              </h5>
                              <p className="text-xs text-gray-400 mb-2">
                                {tool.description || 'Sem descrição'}
                              </p>
                              <code className="text-xs bg-slate-900 px-2 py-1 rounded text-purple-300">
                                {tool.id}
                              </code>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Install Modal */}
      <MCPInstallModal
        isOpen={installModalOpen}
        onClose={() => setInstallModalOpen(false)}
        onSuccess={handleInstallSuccess}
      />
    </div>
  );
}
