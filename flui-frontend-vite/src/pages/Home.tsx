import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PlusCircle, Workflow, Bot, Zap } from 'lucide-react';

interface Automation {
  id: string;
  name: string;
  description: string;
  nodes: any[];
  enabled: boolean;
}

export default function Home() {
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [stats, setStats] = useState({
    automations: 0,
    agents: 0,
    mcps: 0,
    tools: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Carregar automações
      const autoRes = await fetch('http://localhost:3001/api/automations');
      const autoData = await autoRes.json();
      setAutomations(autoData);
      
      // Carregar agentes
      const agentsRes = await fetch('http://localhost:3001/api/agents');
      const agentsData = await agentsRes.json();
      
      // Carregar MCPs
      const mcpsRes = await fetch('http://localhost:3001/api/mcps');
      const mcpsData = await mcpsRes.json();
      
      // Carregar ferramentas
      const toolsRes = await fetch('http://localhost:3001/api/tools');
      const toolsData = await toolsRes.json();
      
      setStats({
        automations: autoData.length || 0,
        agents: agentsData.length || 0,
        mcps: mcpsData.length || 0,
        tools: Array.isArray(toolsData) ? toolsData.length : (toolsData.data?.length || 0),
      });
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="border-b border-purple-500/20 bg-slate-900/50 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-2 rounded-lg">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white">FLUI</h1>
              <span className="text-purple-400 text-sm">Workflow Studio</span>
            </div>
            
            <nav className="flex items-center gap-4">
              <Link to="/automations" className="text-purple-300 hover:text-white transition">
                Automações
              </Link>
              <Link to="/agents" className="text-purple-300 hover:text-white transition">
                Agentes
              </Link>
              <Link to="/mcps" className="text-purple-300 hover:text-white transition">
                MCPs
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-slate-800/50 backdrop-blur-sm border border-purple-500/20 rounded-xl p-6 hover:border-purple-500/40 transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-400 text-sm">Automações</p>
                <p className="text-3xl font-bold text-white">{stats.automations}</p>
              </div>
              <Workflow className="w-10 h-10 text-purple-500" />
            </div>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm border border-purple-500/20 rounded-xl p-6 hover:border-purple-500/40 transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-400 text-sm">Agentes</p>
                <p className="text-3xl font-bold text-white">{stats.agents}</p>
              </div>
              <Bot className="w-10 h-10 text-pink-500" />
            </div>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm border border-purple-500/20 rounded-xl p-6 hover:border-purple-500/40 transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-400 text-sm">MCPs</p>
                <p className="text-3xl font-bold text-white">{stats.mcps}</p>
              </div>
              <Zap className="w-10 h-10 text-cyan-500" />
            </div>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm border border-purple-500/20 rounded-xl p-6 hover:border-purple-500/40 transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-400 text-sm">Ferramentas</p>
                <p className="text-3xl font-bold text-white">{stats.tools}</p>
              </div>
              <Workflow className="w-10 h-10 text-green-500" />
            </div>
          </div>
        </div>

        {/* Automações */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">Suas Automações</h2>
          <Link 
            to="/automations/create"
            className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-6 py-3 rounded-lg font-semibold transition shadow-lg shadow-purple-500/50"
          >
            <PlusCircle className="w-5 h-5" />
            Nova Automação
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {automations.length === 0 ? (
            <div className="col-span-full bg-slate-800/30 border-2 border-dashed border-purple-500/30 rounded-xl p-12 text-center">
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
            automations.map(auto => (
              <div 
                key={auto.id}
                className="bg-slate-800/50 backdrop-blur-sm border border-purple-500/20 rounded-xl p-6 hover:border-purple-500/50 transition group"
              >
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
                <p className="text-purple-300/70 text-sm mb-4">{auto.description}</p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-purple-400">{auto.nodes.length} nós</span>
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/automations/${auto.id}/edit`}
                      onClick={(e) => e.stopPropagation()}
                      className="px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 hover:text-blue-200 rounded-lg transition-all text-xs font-medium"
                    >
                      ✏️ Editar
                    </Link>
                    <Link
                      to={`/automations/${auto.id}/logs`}
                      onClick={(e) => e.stopPropagation()}
                      className="px-3 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 hover:text-purple-200 rounded-lg transition-all text-xs font-medium"
                    >
                      📊 Logs
                    </Link>
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        try {
                          await fetch(`http://localhost:3001/api/automations/${auto.id}/execute`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ debugMode: true }),
                          });
                          alert('Automação executada!');
                        } catch (err) {
                          alert('Erro ao executar');
                        }
                      }}
                      className="px-3 py-1.5 bg-green-500/20 hover:bg-green-500/30 text-green-300 hover:text-green-200 rounded-lg transition-all text-xs font-medium"
                    >
                      ▶️ Executar
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
