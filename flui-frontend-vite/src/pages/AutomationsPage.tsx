import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PlusCircle, Workflow, Play, Pause, Edit, Trash2, Copy, ArrowLeft } from 'lucide-react';

interface Automation {
  id: string;
  name: string;
  description: string;
  nodes: any[];
  edges: any[];
  enabled: boolean;
  version: string;
  metadata?: {
    createdAt: string;
    updatedAt: string;
  };
}

export default function AutomationsPage() {
  const navigate = useNavigate();
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAutomations();
  }, []);

  const loadAutomations = async () => {
    try {
      setLoading(true);
      const res = await fetch('http://localhost:3001/api/automations');
      const data = await res.json();
      setAutomations(data);
      setError(null);
    } catch (err) {
      setError('Erro ao carregar automações');
      console.error('Erro ao carregar automações:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleEnabled = async (id: string, enabled: boolean) => {
    try {
      await fetch(`http://localhost:3001/api/automations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !enabled }),
      });
      await loadAutomations();
    } catch (err) {
      console.error('Erro ao atualizar automação:', err);
      alert('Erro ao atualizar automação');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta automação?')) {
      return;
    }

    try {
      await fetch(`http://localhost:3001/api/automations/${id}`, {
        method: 'DELETE',
      });
      await loadAutomations();
    } catch (err) {
      console.error('Erro ao excluir automação:', err);
      alert('Erro ao excluir automação');
    }
  };

  const handleDuplicate = async (automation: Automation) => {
    try {
      const newAutomation = {
        ...automation,
        id: Date.now().toString(),
        name: `${automation.name} (cópia)`,
        enabled: false,
        metadata: {
          ...automation.metadata,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      };

      await fetch('http://localhost:3001/api/automations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAutomation),
      });
      
      await loadAutomations();
    } catch (err) {
      console.error('Erro ao duplicar automação:', err);
      alert('Erro ao duplicar automação');
    }
  };

  const [executingId, setExecutingId] = useState<string | null>(null);

  const handleExecute = async (id: string) => {
    try {
      setExecutingId(id);
      const res = await fetch(`http://localhost:3001/api/automations/${id}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ debugMode: true }),
      });
      const result = await res.json();
      
      if (result.success || result.status === 'completed') {
        alert(`✅ Execução concluída!\n\nDuração: ${result.duration}ms\nStatus: ${result.status}\nNodes executados: ${result.nodes?.length || 0}`);
      } else {
        alert(`❌ Erro na execução!\n\n${result.error || 'Erro desconhecido'}`);
      }
    } catch (err: any) {
      console.error('Erro ao executar automação:', err);
      alert(`❌ Erro ao executar:\n\n${err.message}`);
    } finally {
      setExecutingId(null);
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
                <Workflow className="w-8 h-8 text-purple-400" />
                <div>
                  <h1 className="text-2xl font-bold text-white">Automações</h1>
                  <p className="text-sm text-purple-400">Gerencie suas automações</p>
                </div>
              </div>
            </div>
            
            <Link 
              to="/automations/create"
              className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-6 py-3 rounded-lg font-semibold transition shadow-lg shadow-purple-500/50"
            >
              <PlusCircle className="w-5 h-5" />
              Nova Automação
            </Link>
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
              onClick={loadAutomations}
              className="mt-4 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg transition"
            >
              Tentar novamente
            </button>
          </div>
        ) : automations.length === 0 ? (
          <div className="bg-slate-800/30 border-2 border-dashed border-purple-500/30 rounded-xl p-12 text-center">
            <Workflow className="w-16 h-16 text-purple-500/50 mx-auto mb-4" />
            <p className="text-purple-300 mb-4">Nenhuma automação criada ainda</p>
            <Link 
              to="/automations/create"
              className="inline-flex items-center gap-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 px-6 py-3 rounded-lg transition"
            >
              <PlusCircle className="w-5 h-5" />
              Criar Primeira Automação
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {automations.map(auto => (
              <div 
                key={auto.id}
                className="bg-slate-800/50 backdrop-blur-sm border border-purple-500/20 rounded-xl overflow-hidden hover:border-purple-500/50 transition group"
              >
                {/* Card Header */}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="bg-purple-500/20 p-3 rounded-lg group-hover:bg-purple-500/30 transition">
                      <Workflow className="w-6 h-6 text-purple-400" />
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      auto.enabled 
                        ? 'bg-green-500/20 text-green-400' 
                        : 'bg-gray-500/20 text-gray-400'
                    }`}>
                      {auto.enabled ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-white mb-2">{auto.name}</h3>
                  <p className="text-purple-300/70 text-sm mb-4 line-clamp-2">
                    {auto.description || 'Sem descrição'}
                  </p>
                  
                  <div className="flex items-center gap-4 text-sm text-purple-400">
                    <span>{auto.nodes?.length || 0} nós</span>
                    <span>{auto.edges?.length || 0} conexões</span>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="px-6 py-3 bg-slate-900/50 flex items-center justify-between border-t border-purple-500/10">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleEnabled(auto.id, auto.enabled)}
                      className={`p-2 rounded-lg transition ${
                        auto.enabled
                          ? 'text-green-400 hover:bg-green-500/10'
                          : 'text-gray-400 hover:bg-gray-500/10'
                      }`}
                      title={auto.enabled ? 'Pausar' : 'Ativar'}
                    >
                      {auto.enabled ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>
                    
                    <button
                      onClick={() => navigate(`/automations/${auto.id}/edit`)}
                      className="p-2 text-blue-400 hover:bg-blue-500/10 rounded-lg transition"
                      title="Editar"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    
                    <button
                      onClick={() => handleDuplicate(auto)}
                      className="p-2 text-purple-400 hover:bg-purple-500/10 rounded-lg transition"
                      title="Duplicar"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleExecute(auto.id)}
                      disabled={executingId === auto.id}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        executingId === auto.id
                          ? 'bg-blue-500/30 text-blue-200 cursor-wait animate-pulse'
                          : 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30 text-purple-300 hover:text-white shadow-lg hover:shadow-purple-500/50'
                      }`}
                    >
                      {executingId === auto.id ? '⏳ Executando...' : '▶️ Executar'}
                    </button>
                    
                    <button
                      onClick={() => handleDelete(auto.id)}
                      className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition"
                      title="Excluir"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
