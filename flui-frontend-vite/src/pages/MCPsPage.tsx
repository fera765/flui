import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, Zap, Play, Pause, Edit, Trash2, ArrowLeft, Package, RefreshCw } from 'lucide-react';

interface MCPTool {
  id: string;
  name: string;
  description: string;
  handler: string;
  parameters: Record<string, string>;
}

interface MCP {
  id: string;
  name: string;
  description: string;
  version: string;
  server: string;
  enabled: boolean;
  tools: MCPTool[];
  metadata?: {
    createdAt: string;
    updatedAt: string;
    lastSyncedAt?: string;
  };
}

export default function MCPsPage() {
  const navigate = useNavigate();
  const [mcps, setMcps] = useState<MCP[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newMcp, setNewMcp] = useState<Partial<MCP>>({
    name: '',
    description: '',
    version: '1.0.0',
    server: '',
    enabled: true,
    tools: [],
  });

  useEffect(() => {
    loadMcps();
  }, []);

  const loadMcps = async () => {
    try {
      setLoading(true);
      const res = await fetch('http://localhost:3001/api/mcps');
      const data = await res.json();
      setMcps(data);
      setError(null);
    } catch (err) {
      setError('Erro ao carregar MCPs');
      console.error('Erro ao carregar MCPs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newMcp.name?.trim() || !newMcp.server?.trim()) {
      alert('Preencha nome e servidor do MCP');
      return;
    }

    try {
      const mcp = {
        ...newMcp,
        id: Date.now().toString(),
        metadata: {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      };

      await fetch('http://localhost:3001/api/mcps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mcp),
      });
      
      setShowCreateModal(false);
      setNewMcp({
        name: '',
        description: '',
        version: '1.0.0',
        server: '',
        enabled: true,
        tools: [],
      });
      await loadMcps();
    } catch (err) {
      console.error('Erro ao criar MCP:', err);
      alert('Erro ao criar MCP');
    }
  };

  const handleToggleEnabled = async (id: string, enabled: boolean) => {
    try {
      await fetch(`http://localhost:3001/api/mcps/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !enabled }),
      });
      await loadMcps();
    } catch (err) {
      console.error('Erro ao atualizar MCP:', err);
      alert('Erro ao atualizar MCP');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este MCP?')) {
      return;
    }

    try {
      await fetch(`http://localhost:3001/api/mcps/${id}`, {
        method: 'DELETE',
      });
      await loadMcps();
    } catch (err) {
      console.error('Erro ao excluir MCP:', err);
      alert('Erro ao excluir MCP');
    }
  };

  const handleSync = async (id: string) => {
    try {
      await fetch(`http://localhost:3001/api/mcps/${id}/sync`, {
        method: 'POST',
      });
      alert('MCP sincronizado com sucesso!');
      await loadMcps();
    } catch (err) {
      console.error('Erro ao sincronizar MCP:', err);
      alert('Erro ao sincronizar MCP');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="border-b border-purple-500/20 bg-slate-900/50 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/')}
                className="text-purple-300 hover:text-white transition"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <div className="flex items-center gap-3">
                <Zap className="w-8 h-8 text-cyan-400" />
                <div>
                  <h1 className="text-2xl font-bold text-white">Model Context Protocol</h1>
                  <p className="text-sm text-purple-400">Gerencie seus MCPs</p>
                </div>
              </div>
            </div>
            
            <button 
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-6 py-3 rounded-lg font-semibold transition shadow-lg shadow-purple-500/50"
            >
              <PlusCircle className="w-5 h-5" />
              Novo MCP
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
          </div>
        ) : error ? (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6 text-center">
            <p className="text-red-400">{error}</p>
            <button
              onClick={loadMcps}
              className="mt-4 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg transition"
            >
              Tentar novamente
            </button>
          </div>
        ) : mcps.length === 0 ? (
          <div className="bg-slate-800/30 border-2 border-dashed border-purple-500/30 rounded-xl p-12 text-center">
            <Package className="w-16 h-16 text-purple-500/50 mx-auto mb-4" />
            <p className="text-purple-300 mb-4">Nenhum MCP configurado ainda</p>
            <button 
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 px-6 py-3 rounded-lg transition"
            >
              <PlusCircle className="w-5 h-5" />
              Adicionar Primeiro MCP
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mcps.map(mcp => (
              <div 
                key={mcp.id}
                className="bg-slate-800/50 backdrop-blur-sm border border-purple-500/20 rounded-xl overflow-hidden hover:border-purple-500/50 transition group"
              >
                {/* Card Header */}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="bg-cyan-500/20 p-3 rounded-lg group-hover:bg-cyan-500/30 transition">
                      <Package className="w-6 h-6 text-cyan-400" />
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      mcp.enabled 
                        ? 'bg-green-500/20 text-green-400' 
                        : 'bg-gray-500/20 text-gray-400'
                    }`}>
                      {mcp.enabled ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-white mb-2">{mcp.name}</h3>
                  <p className="text-purple-300/70 text-sm mb-4 line-clamp-2">
                    {mcp.description || 'Sem descrição'}
                  </p>
                  
                  <div className="space-y-2 text-sm text-purple-400">
                    <div className="flex items-center justify-between">
                      <span>Versão:</span>
                      <span className="font-mono text-purple-300">{mcp.version}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Ferramentas:</span>
                      <span className="font-mono text-purple-300">{mcp.tools?.length || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Servidor:</span>
                      <span className="font-mono text-purple-300 text-xs truncate max-w-[150px]" title={mcp.server}>
                        {mcp.server}
                      </span>
                    </div>
                  </div>

                  {/* Tools List */}
                  {mcp.tools && mcp.tools.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-purple-500/10">
                      <p className="text-xs text-purple-400 mb-2">Ferramentas disponíveis:</p>
                      <div className="flex flex-wrap gap-1">
                        {mcp.tools.slice(0, 5).map((tool) => (
                          <span
                            key={tool.id}
                            className="text-xs bg-purple-500/10 text-purple-300 px-2 py-1 rounded"
                            title={tool.description}
                          >
                            {tool.name}
                          </span>
                        ))}
                        {mcp.tools.length > 5 && (
                          <span className="text-xs text-purple-400">
                            +{mcp.tools.length - 5} mais
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Card Actions */}
                <div className="px-6 py-3 bg-slate-900/50 flex items-center justify-between border-t border-purple-500/10">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleEnabled(mcp.id, mcp.enabled)}
                      className={`p-2 rounded-lg transition ${
                        mcp.enabled
                          ? 'text-green-400 hover:bg-green-500/10'
                          : 'text-gray-400 hover:bg-gray-500/10'
                      }`}
                      title={mcp.enabled ? 'Desativar' : 'Ativar'}
                    >
                      {mcp.enabled ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>
                    
                    <button
                      onClick={() => handleSync(mcp.id)}
                      className="p-2 text-blue-400 hover:bg-blue-500/10 rounded-lg transition"
                      title="Sincronizar ferramentas"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                    
                    <button
                      onClick={() => navigate(`/mcps/${mcp.id}/edit`)}
                      className="p-2 text-purple-400 hover:bg-purple-500/10 rounded-lg transition"
                      title="Editar"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <button
                    onClick={() => handleDelete(mcp.id)}
                    className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition"
                    title="Excluir"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-purple-500/20">
            <div className="p-6 border-b border-purple-500/20">
              <h2 className="text-2xl font-bold text-white">Adicionar Novo MCP</h2>
              <p className="text-sm text-purple-400 mt-1">
                Configure um Model Context Protocol para adicionar novas ferramentas
              </p>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-purple-300 mb-2">
                  Nome *
                </label>
                <input
                  type="text"
                  value={newMcp.name}
                  onChange={(e) => setNewMcp({ ...newMcp, name: e.target.value })}
                  className="w-full bg-slate-900/50 border border-purple-500/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Ex: GitHub MCP"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-purple-300 mb-2">
                  Descrição
                </label>
                <input
                  type="text"
                  value={newMcp.description}
                  onChange={(e) => setNewMcp({ ...newMcp, description: e.target.value })}
                  className="w-full bg-slate-900/50 border border-purple-500/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Breve descrição do MCP"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-purple-300 mb-2">
                  Servidor *
                </label>
                <input
                  type="text"
                  value={newMcp.server}
                  onChange={(e) => setNewMcp({ ...newMcp, server: e.target.value })}
                  className="w-full bg-slate-900/50 border border-purple-500/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-sm"
                  placeholder="http://localhost:8080 ou npx @modelcontextprotocol/server-github"
                />
                <p className="text-xs text-purple-400/70 mt-1">
                  URL do servidor MCP ou comando para iniciar o servidor
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-purple-300 mb-2">
                  Versão
                </label>
                <input
                  type="text"
                  value={newMcp.version}
                  onChange={(e) => setNewMcp({ ...newMcp, version: e.target.value })}
                  className="w-full bg-slate-900/50 border border-purple-500/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="1.0.0"
                />
              </div>

              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                <p className="text-sm text-blue-300">
                  💡 <strong>Dica:</strong> Após criar o MCP, ele será sincronizado automaticamente 
                  para buscar as ferramentas disponíveis no servidor.
                </p>
              </div>
            </div>

            <div className="p-6 border-t border-purple-500/20 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-purple-300 hover:bg-purple-500/10 rounded-lg transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreate}
                className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg font-semibold transition"
              >
                Adicionar MCP
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
