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
  const [installType, setInstallType] = useState<'github' | 'npx' | 'npm' | 'local'>('github');
  const [isFetchingMetadata, setIsFetchingMetadata] = useState(false);
  const [newMcp, setNewMcp] = useState<Partial<MCP>>({
    name: '',
    description: '',
    version: '1.0.0',
    server: '',
    enabled: true,
    tools: [],
  });
  const [envVars, setEnvVars] = useState<Array<{ key: string; value: string }>>([]);
  const [syncProgress, setSyncProgress] = useState<{
    show: boolean;
    mcpName: string;
    status: string;
    progress: number;
  }>({ show: false, mcpName: '', status: '', progress: 0 });

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

  const fetchMcpMetadata = async () => {
    if (!newMcp.server?.trim()) {
      alert('Preencha o campo servidor/pacote primeiro');
      return;
    }

    setIsFetchingMetadata(true);
    try {
      let metadata: any = {};

      if (installType === 'npx' || installType === 'npm') {
        // Extrair nome do pacote do comando npx
        const packageName = newMcp.server.replace(/^npx\s+/, '').split(/\s+/)[0];
        
        // Buscar no NPM registry
        const npmRes = await fetch(`https://registry.npmjs.org/${packageName}`);
        if (npmRes.ok) {
          const npmData = await npmRes.json();
          metadata = {
            name: npmData.name || packageName,
            description: npmData.description || '',
            version: npmData['dist-tags']?.latest || '1.0.0',
          };
        }
      } else if (installType === 'github') {
        // Extrair owner/repo do URL ou formato username/repo
        const match = newMcp.server.match(/(?:github\.com\/)?([^\/]+)\/([^\/\s]+)/);
        if (match) {
          const [, owner, repo] = match;
          const cleanRepo = repo.replace(/\.git$/, '');
          
          // Buscar no GitHub API
          const githubRes = await fetch(`https://api.github.com/repos/${owner}/${cleanRepo}`);
          if (githubRes.ok) {
            const githubData = await githubRes.json();
            metadata = {
              name: githubData.name || cleanRepo,
              description: githubData.description || '',
              version: '1.0.0',
            };
            
            // Tentar buscar package.json para mais informações
            try {
              const pkgRes = await fetch(`https://raw.githubusercontent.com/${owner}/${cleanRepo}/main/package.json`);
              if (pkgRes.ok) {
                const pkgData = await pkgRes.json();
                metadata.name = pkgData.name || metadata.name;
                metadata.description = pkgData.description || metadata.description;
                metadata.version = pkgData.version || metadata.version;
              }
            } catch (e) {
              // Ignorar erro ao buscar package.json
            }
          }
        }
      }

      if (metadata.name) {
        setNewMcp({
          ...newMcp,
          name: metadata.name,
          description: metadata.description,
          version: metadata.version || '1.0.0',
        });
        alert('✅ Metadados carregados com sucesso!');
      } else {
        alert('⚠️ Não foi possível buscar metadados. Preencha manualmente.');
      }
    } catch (err) {
      console.error('Erro ao buscar metadados:', err);
      alert('❌ Erro ao buscar metadados. Preencha manualmente.');
    } finally {
      setIsFetchingMetadata(false);
    }
  };

  const handleCreate = async () => {
    if (!newMcp.name?.trim() || !newMcp.server?.trim()) {
      alert('Preencha nome e servidor do MCP');
      return;
    }

    try {
      // Converter envVars array para objeto
      const envVarsObj: Record<string, string> = {};
      envVars.forEach(({ key, value }) => {
        if (key.trim()) {
          envVarsObj[key.trim()] = value;
        }
      });

      const mcp = {
        ...newMcp,
        id: Date.now().toString(),
        installType,
        envVars: Object.keys(envVarsObj).length > 0 ? envVarsObj : undefined,
        metadata: {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      };

      const response = await fetch('http://localhost:3001/api/mcps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mcp),
      });

      if (response.ok) {
        const createdMcp = await response.json();
        
        // Fechar modal
        setShowCreateModal(false);
        setInstallType('github');
        setNewMcp({
          name: '',
          description: '',
          version: '1.0.0',
          server: '',
          enabled: true,
          tools: [],
        });
        setEnvVars([]);
        
        // Mostrar box de progresso
        setSyncProgress({
          show: true,
          mcpName: createdMcp.name || mcp.name,
          status: 'Conectando ao servidor MCP...',
          progress: 30,
        });
        
        // Simular progresso
        setTimeout(() => {
          setSyncProgress(prev => ({ ...prev, status: 'Extraindo ferramentas...', progress: 60 }));
        }, 1500);
        
        // Sincronizar automaticamente
        await handleSync(createdMcp.id);
        
        // Atualizar progresso final
        setSyncProgress(prev => ({ ...prev, status: 'Concluído!', progress: 100 }));
        
        // Fechar box após 2s
        setTimeout(() => {
          setSyncProgress({ show: false, mcpName: '', status: '', progress: 0 });
        }, 2000);
      }
      
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
      const response = await fetch(`http://localhost:3001/api/mcps/${id}/sync`, {
        method: 'POST',
      });
      const result = await response.json();
      
      if (response.ok) {
        const toolCount = result.toolsRegistered || result.tools?.length || 0;
        alert(`✅ MCP sincronizado com sucesso!\n\n${toolCount} ferramenta${toolCount !== 1 ? 's' : ''} disponível${toolCount !== 1 ? 'is' : ''} no Tool Registry.`);
      } else {
        throw new Error(result.error || 'Erro ao sincronizar');
      }
      
      await loadMcps();
    } catch (err: any) {
      console.error('Erro ao sincronizar MCP:', err);
      alert(`❌ Erro ao sincronizar MCP: ${err.message}`);
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

      {/* Sync Progress Box - Compacto */}
      {syncProgress.show && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm">
          <div 
            className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg shadow-xl p-4 border border-white/20 cursor-pointer hover:scale-102 transition-transform"
            onClick={() => setSyncProgress({ show: false, mcpName: '', status: '', progress: 0 })}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-white font-semibold text-sm">🔄 {syncProgress.mcpName}</h3>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setSyncProgress({ show: false, mcpName: '', status: '', progress: 0 });
                }}
                className="text-white/80 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>
            <p className="text-white/80 text-xs mb-2">{syncProgress.status}</p>
            
            {/* Progress Bar */}
            <div className="w-full bg-white/20 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-white h-full rounded-full transition-all duration-500 ease-out"
                style={{ width: `${syncProgress.progress}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Info Banner */}
        <div className="mb-6 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="text-3xl">💡</div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-white mb-2">
                Ferramentas MCP Automaticamente Integradas
              </h3>
              <p className="text-blue-200 text-sm">
                Quando você adiciona ou sincroniza um MCP, todas as suas ferramentas ficam 
                <strong className="text-white"> automaticamente disponíveis</strong> no 
                <strong className="text-white"> Tool Registry</strong>. 
                Você pode usá-las imediatamente ao criar automações, adicionando-as do painel de ferramentas.
              </p>
              <div className="mt-3 flex items-center gap-4 text-xs text-blue-300">
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                  <span>Auto-sync após instalação</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                  <span>Disponível no NodePalette</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
                  <span>Type-safe e validado</span>
                </div>
              </div>
            </div>
          </div>
        </div>

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
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs text-purple-400">Ferramentas disponíveis:</p>
                        <span className="flex items-center gap-1 text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full border border-green-500/30">
                          <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                          <span>No Tool Registry</span>
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {mcp.tools.slice(0, 5).map((tool) => (
                          <span
                            key={tool.id}
                            className="text-xs bg-purple-500/10 text-purple-300 px-2 py-1 rounded hover:bg-purple-500/20 transition cursor-pointer"
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
          <div className="bg-slate-800 rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-purple-500/20">
            <div className="p-6 border-b border-purple-500/20">
              <h2 className="text-2xl font-bold text-white">Adicionar Novo MCP</h2>
              <p className="text-sm text-purple-400 mt-1">
                Configure um Model Context Protocol para adicionar novas ferramentas
              </p>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Install Type Tabs */}
              <div>
                <label className="block text-sm font-medium text-purple-300 mb-3">
                  Tipo de Instalação
                </label>
                <div className="grid grid-cols-4 gap-2">
                  <button
                    onClick={() => setInstallType('github')}
                    className={`px-4 py-3 rounded-lg font-medium transition-all ${
                      installType === 'github'
                        ? 'bg-purple-600 text-white shadow-lg'
                        : 'bg-slate-700 text-purple-300 hover:bg-slate-600'
                    }`}
                  >
                    <div className="text-2xl mb-1">🐙</div>
                    <div className="text-xs">GitHub</div>
                  </button>
                  <button
                    onClick={() => setInstallType('npx')}
                    className={`px-4 py-3 rounded-lg font-medium transition-all ${
                      installType === 'npx'
                        ? 'bg-purple-600 text-white shadow-lg'
                        : 'bg-slate-700 text-purple-300 hover:bg-slate-600'
                    }`}
                  >
                    <div className="text-2xl mb-1">📦</div>
                    <div className="text-xs">NPX</div>
                  </button>
                  <button
                    onClick={() => setInstallType('npm')}
                    className={`px-4 py-3 rounded-lg font-medium transition-all ${
                      installType === 'npm'
                        ? 'bg-purple-600 text-white shadow-lg'
                        : 'bg-slate-700 text-purple-300 hover:bg-slate-600'
                    }`}
                  >
                    <div className="text-2xl mb-1">📚</div>
                    <div className="text-xs">NPM</div>
                  </button>
                  <button
                    onClick={() => setInstallType('local')}
                    className={`px-4 py-3 rounded-lg font-medium transition-all ${
                      installType === 'local'
                        ? 'bg-purple-600 text-white shadow-lg'
                        : 'bg-slate-700 text-purple-300 hover:bg-slate-600'
                    }`}
                  >
                    <div className="text-2xl mb-1">💻</div>
                    <div className="text-xs">Local</div>
                  </button>
                </div>
              </div>

              {/* GitHub */}
              {installType === 'github' && (
                <div className="space-y-4">
                  <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
                    <p className="text-sm text-purple-300">
                      <strong>GitHub MCP</strong>: Clone e execute um MCP diretamente de um repositório GitHub
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-purple-300 mb-2">
                      Repositório GitHub *
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newMcp.server}
                        onChange={(e) => setNewMcp({ ...newMcp, server: e.target.value })}
                        className="flex-1 bg-slate-900/50 border border-purple-500/20 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-sm"
                        placeholder="username/repository ou https://github.com/username/repository"
                      />
                      <button
                        type="button"
                        onClick={fetchMcpMetadata}
                        disabled={isFetchingMetadata || !newMcp.server}
                        className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition text-sm whitespace-nowrap"
                      >
                        {isFetchingMetadata ? '🔄 Buscando...' : '🔍 Auto'}
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-purple-300 mb-2">
                        Branch (opcional)
                      </label>
                      <input
                        type="text"
                        className="w-full bg-slate-900/50 border border-purple-500/20 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="main"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-purple-300 mb-2">
                        Subdiretório (opcional)
                      </label>
                      <input
                        type="text"
                        className="w-full bg-slate-900/50 border border-purple-500/20 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="packages/mcp-server"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* NPX */}
              {installType === 'npx' && (
                <div className="space-y-4">
                  <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
                    <p className="text-sm text-purple-300">
                      <strong>NPX</strong>: Execute um pacote NPM diretamente sem instalação permanente
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-purple-300 mb-2">
                      Pacote NPM *
                    </label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-400 font-mono text-sm">
                          npx
                        </span>
                        <input
                          type="text"
                          value={(newMcp.server || '').replace(/^npx\s+/, '')}
                          onChange={(e) => setNewMcp({ ...newMcp, server: `npx ${e.target.value}` })}
                          className="w-full bg-slate-900/50 border border-purple-500/20 rounded-lg pl-16 pr-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-sm"
                          placeholder="@modelcontextprotocol/server-github"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={fetchMcpMetadata}
                        disabled={isFetchingMetadata || !newMcp.server}
                        className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition text-sm whitespace-nowrap"
                      >
                        {isFetchingMetadata ? '🔄 Buscando...' : '🔍 Auto'}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-purple-300 mb-2">
                      Argumentos (opcional)
                    </label>
                    <input
                      type="text"
                      className="w-full bg-slate-900/50 border border-purple-500/20 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-sm"
                      placeholder="--port 3000 --token abc123"
                    />
                  </div>
                </div>
              )}

              {/* NPM */}
              {installType === 'npm' && (
                <div className="space-y-4">
                  <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
                    <p className="text-sm text-purple-300">
                      <strong>NPM</strong>: Instale permanentemente um pacote NPM
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-purple-300 mb-2">
                      Pacote NPM *
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newMcp.server}
                        onChange={(e) => setNewMcp({ ...newMcp, server: e.target.value })}
                        className="flex-1 bg-slate-900/50 border border-purple-500/20 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-sm"
                        placeholder="@modelcontextprotocol/server-github"
                      />
                      <button
                        type="button"
                        onClick={fetchMcpMetadata}
                        disabled={isFetchingMetadata || !newMcp.server}
                        className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition text-sm whitespace-nowrap"
                      >
                        {isFetchingMetadata ? '🔄 Buscando...' : '🔍 Auto'}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-purple-300 mb-2">
                      Comando de Start
                    </label>
                    <input
                      type="text"
                      className="w-full bg-slate-900/50 border border-purple-500/20 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-sm"
                      placeholder="mcp-server-github start"
                    />
                  </div>
                </div>
              )}

              {/* Local */}
              {installType === 'local' && (
                <div className="space-y-4">
                  <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
                    <p className="text-sm text-purple-300">
                      <strong>Local</strong>: Aponte para um servidor MCP já em execução localmente
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-purple-300 mb-2">
                      URL do Servidor *
                    </label>
                    <input
                      type="text"
                      value={newMcp.server}
                      onChange={(e) => setNewMcp({ ...newMcp, server: e.target.value })}
                      className="w-full bg-slate-900/50 border border-purple-500/20 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-sm"
                      placeholder="http://localhost:8080"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-purple-300 mb-2">
                      Caminho Executável (opcional)
                    </label>
                    <input
                      type="text"
                      className="w-full bg-slate-900/50 border border-purple-500/20 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-sm"
                      placeholder="/path/to/mcp-server"
                    />
                  </div>
                </div>
              )}

              {/* Common Fields */}
              <div className="border-t border-purple-500/20 pt-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-purple-300 mb-2">
                    Nome *
                  </label>
                  <input
                    type="text"
                    value={newMcp.name}
                    onChange={(e) => setNewMcp({ ...newMcp, name: e.target.value })}
                    className="w-full bg-slate-900/50 border border-purple-500/20 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Ex: GitHub MCP"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-purple-300 mb-2">
                    Descrição
                  </label>
                  <textarea
                    value={newMcp.description}
                    onChange={(e) => setNewMcp({ ...newMcp, description: e.target.value })}
                    className="w-full bg-slate-900/50 border border-purple-500/20 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                    placeholder="Breve descrição do MCP"
                    rows={2}
                  />
                </div>
              </div>

              {/* Environment Variables */}
              <div className="border-t border-purple-500/20 pt-4">
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-purple-300">
                    Variáveis de Ambiente (opcional)
                  </label>
                  <button
                    type="button"
                    onClick={() => setEnvVars([...envVars, { key: '', value: '' }])}
                    className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-medium transition flex items-center gap-1"
                  >
                    <span>+</span> ADD ENV
                  </button>
                </div>

                {envVars.length > 0 && (
                  <div className="space-y-2 mb-4">
                    {envVars.map((env, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={env.key}
                          onChange={(e) => {
                            const newEnvVars = [...envVars];
                            newEnvVars[index].key = e.target.value;
                            setEnvVars(newEnvVars);
                          }}
                          className="flex-1 bg-white border border-gray-300 rounded-lg px-3 py-2 text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                          placeholder="CHAVE"
                        />
                        <span className="text-purple-400">=</span>
                        <input
                          type="text"
                          value={env.value}
                          onChange={(e) => {
                            const newEnvVars = [...envVars];
                            newEnvVars[index].value = e.target.value;
                            setEnvVars(newEnvVars);
                          }}
                          className="flex-1 bg-white border border-gray-300 rounded-lg px-3 py-2 text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                          placeholder="valor"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const newEnvVars = envVars.filter((_, i) => i !== index);
                            setEnvVars(newEnvVars);
                          }}
                          className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition"
                          title="Remover"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
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
                onClick={() => {
                  setShowCreateModal(false);
                  setInstallType('github');
                }}
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
