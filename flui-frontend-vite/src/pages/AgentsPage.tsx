import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, Bot, Play, Pause, Edit, Trash2, ArrowLeft, MessageSquare } from 'lucide-react';

interface Agent {
  id: string;
  name: string;
  description: string;
  model: string;
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
  enabled: boolean;
  tools: string[];
  metadata?: {
    createdAt: string;
    updatedAt: string;
    executionCount?: number;
  };
}

export default function AgentsPage() {
  const navigate = useNavigate();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newAgent, setNewAgent] = useState<Partial<Agent>>({
    name: '',
    description: '',
    model: 'gpt-4',
    systemPrompt: '',
    temperature: 0.7,
    maxTokens: 2000,
    enabled: true,
    tools: [],
  });
  const [availableTools, setAvailableTools] = useState<any[]>([]);
  const [availableMcps, setAvailableMcps] = useState<any[]>([]);
  const [createModalTab, setCreateModalTab] = useState<'basic' | 'tools'>('basic');

  useEffect(() => {
    loadAgents();
    loadToolsAndMcps();
  }, []);

  const loadToolsAndMcps = async () => {
    try {
      const [toolsRes, mcpsRes] = await Promise.all([
        fetch('http://localhost:3001/api/tools'),
        fetch('http://localhost:3001/api/mcps'),
      ]);
      const toolsData = await toolsRes.json();
      const mcpsData = await mcpsRes.json();
      setAvailableTools(Array.isArray(toolsData) ? toolsData : []);
      setAvailableMcps(Array.isArray(mcpsData) ? mcpsData : []);
    } catch (error) {
      console.error('Erro ao carregar tools e MCPs:', error);
    }
  };

  const loadAgents = async () => {
    try {
      setLoading(true);
      const res = await fetch('http://localhost:3001/api/agents');
      const data = await res.json();
      setAgents(data);
      setError(null);
    } catch (err) {
      setError('Erro ao carregar agentes');
      console.error('Erro ao carregar agentes:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newAgent.name?.trim() || !newAgent.systemPrompt?.trim()) {
      alert('Preencha nome e prompt do sistema');
      return;
    }

    try {
      const agent = {
        ...newAgent,
        id: Date.now().toString(),
        metadata: {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          executionCount: 0,
        },
      };

      await fetch('http://localhost:3001/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(agent),
      });
      
      setShowCreateModal(false);
      setNewAgent({
        name: '',
        description: '',
        model: 'gpt-4',
        systemPrompt: '',
        temperature: 0.7,
        maxTokens: 2000,
        enabled: true,
        tools: [],
      });
      await loadAgents();
    } catch (err) {
      console.error('Erro ao criar agente:', err);
      alert('Erro ao criar agente');
    }
  };

  const handleToggleEnabled = async (id: string, enabled: boolean) => {
    try {
      await fetch(`http://localhost:3001/api/agents/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !enabled }),
      });
      await loadAgents();
    } catch (err) {
      console.error('Erro ao atualizar agente:', err);
      alert('Erro ao atualizar agente');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este agente?')) {
      return;
    }

    try {
      await fetch(`http://localhost:3001/api/agents/${id}`, {
        method: 'DELETE',
      });
      await loadAgents();
    } catch (err) {
      console.error('Erro ao excluir agente:', err);
      alert('Erro ao excluir agente');
    }
  };

  const handleChat = (agentId: string) => {
    navigate(`/agents/${agentId}/chat`);
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
                <Bot className="w-8 h-8 text-pink-400" />
                <div>
                  <h1 className="text-2xl font-bold text-white">Agentes IA</h1>
                  <p className="text-sm text-purple-400">Gerencie seus agentes inteligentes</p>
                </div>
              </div>
            </div>
            
            <button 
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-6 py-3 rounded-lg font-semibold transition shadow-lg shadow-purple-500/50"
            >
              <PlusCircle className="w-5 h-5" />
              Novo Agente
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
              onClick={loadAgents}
              className="mt-4 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg transition"
            >
              Tentar novamente
            </button>
          </div>
        ) : agents.length === 0 ? (
          <div className="bg-slate-800/30 border-2 border-dashed border-purple-500/30 rounded-xl p-12 text-center">
            <Bot className="w-16 h-16 text-purple-500/50 mx-auto mb-4" />
            <p className="text-purple-300 mb-4">Nenhum agente criado ainda</p>
            <button 
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 px-6 py-3 rounded-lg transition"
            >
              <PlusCircle className="w-5 h-5" />
              Criar Primeiro Agente
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {agents.map(agent => (
              <div 
                key={agent.id}
                className="bg-slate-800/50 backdrop-blur-sm border border-purple-500/20 rounded-xl overflow-hidden hover:border-purple-500/50 transition group"
              >
                {/* Card Header */}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="bg-pink-500/20 p-3 rounded-lg group-hover:bg-pink-500/30 transition">
                      <Bot className="w-6 h-6 text-pink-400" />
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      agent.enabled 
                        ? 'bg-green-500/20 text-green-400' 
                        : 'bg-gray-500/20 text-gray-400'
                    }`}>
                      {agent.enabled ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-white mb-2">{agent.name}</h3>
                  <p className="text-purple-300/70 text-sm mb-4 line-clamp-2">
                    {agent.description || 'Sem descrição'}
                  </p>
                  
                  <div className="space-y-2 text-sm text-purple-400">
                    <div className="flex items-center justify-between">
                      <span>Modelo:</span>
                      <span className="font-mono text-purple-300">{agent.model}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Temperatura:</span>
                      <span className="font-mono text-purple-300">{agent.temperature}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Ferramentas:</span>
                      <span className="font-mono text-purple-300">{agent.tools?.length || 0}</span>
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="px-6 py-3 bg-slate-900/50 flex items-center justify-between border-t border-purple-500/10">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleEnabled(agent.id, agent.enabled)}
                      className={`p-2 rounded-lg transition ${
                        agent.enabled
                          ? 'text-green-400 hover:bg-green-500/10'
                          : 'text-gray-400 hover:bg-gray-500/10'
                      }`}
                      title={agent.enabled ? 'Pausar' : 'Ativar'}
                    >
                      {agent.enabled ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>
                    
                    <button
                      onClick={() => handleChat(agent.id)}
                      className="p-2 text-blue-400 hover:bg-blue-500/10 rounded-lg transition"
                      title="Chat"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </button>
                    
                    <button
                      onClick={() => navigate(`/agents/${agent.id}/edit`)}
                      className="p-2 text-purple-400 hover:bg-purple-500/10 rounded-lg transition"
                      title="Editar"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <button
                    onClick={() => handleDelete(agent.id)}
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
          <div className="bg-slate-800 rounded-xl max-w-3xl w-full max-h-[90vh] overflow-hidden border border-purple-500/20 flex flex-col">
            <div className="p-6 border-b border-purple-500/20">
              <h2 className="text-2xl font-bold text-white">Criar Novo Agente</h2>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-purple-500/20 bg-slate-900/30">
              <button
                onClick={() => setCreateModalTab('basic')}
                className={`flex-1 px-6 py-3 font-medium transition ${
                  createModalTab === 'basic'
                    ? 'bg-purple-500/20 text-white border-b-2 border-purple-500'
                    : 'text-purple-400 hover:text-purple-300 hover:bg-purple-500/5'
                }`}
              >
                Configurações Básicas
              </button>
              <button
                onClick={() => setCreateModalTab('tools')}
                className={`flex-1 px-6 py-3 font-medium transition ${
                  createModalTab === 'tools'
                    ? 'bg-purple-500/20 text-white border-b-2 border-purple-500'
                    : 'text-purple-400 hover:text-purple-300 hover:bg-purple-500/5'
                }`}
              >
                Ferramentas & MCPs ({newAgent.tools?.length || 0})
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-4">{createModalTab === 'basic' ? (
              // Aba Configurações Básicas
              <>
              <div>
                <label className="block text-sm font-medium text-purple-300 mb-2">
                  Nome *
                </label>
                <input
                  type="text"
                  value={newAgent.name}
                  onChange={(e) => setNewAgent({ ...newAgent, name: e.target.value })}
                  className="w-full bg-slate-900/50 border border-purple-500/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Ex: Assistente de Vendas"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-purple-300 mb-2">
                  Descrição
                </label>
                <input
                  type="text"
                  value={newAgent.description}
                  onChange={(e) => setNewAgent({ ...newAgent, description: e.target.value })}
                  className="w-full bg-slate-900/50 border border-purple-500/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Breve descrição do agente"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-purple-300 mb-2">
                  Modelo
                </label>
                <select
                  value={newAgent.model}
                  onChange={(e) => setNewAgent({ ...newAgent, model: e.target.value })}
                  className="w-full bg-slate-900/50 border border-purple-500/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="gpt-4">GPT-4</option>
                  <option value="gpt-4-turbo">GPT-4 Turbo</option>
                  <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                  <option value="claude-3-opus">Claude 3 Opus</option>
                  <option value="claude-3-sonnet">Claude 3 Sonnet</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-purple-300 mb-2">
                  System Prompt *
                </label>
                <textarea
                  value={newAgent.systemPrompt}
                  onChange={(e) => setNewAgent({ ...newAgent, systemPrompt: e.target.value })}
                  rows={6}
                  className="w-full bg-slate-900/50 border border-purple-500/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-sm"
                  placeholder="Você é um assistente útil e especializado em..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-purple-300 mb-2">
                    Temperatura
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="2"
                    step="0.1"
                    value={newAgent.temperature}
                    onChange={(e) => setNewAgent({ ...newAgent, temperature: parseFloat(e.target.value) })}
                    className="w-full bg-slate-900/50 border border-purple-500/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-purple-300 mb-2">
                    Max Tokens
                  </label>
                  <input
                    type="number"
                    min="100"
                    max="8000"
                    step="100"
                    value={newAgent.maxTokens}
                    onChange={(e) => setNewAgent({ ...newAgent, maxTokens: parseInt(e.target.value) })}
                    className="w-full bg-slate-900/50 border border-purple-500/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
              </>
            ) : (
              // Aba Tools & MCPs
              <>
                <div className="mb-4">
                  <p className="text-sm text-purple-400 mb-4">
                    Selecione as ferramentas e MCPs que este agente poderá utilizar:
                  </p>
                </div>

                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                  {availableTools.map((tool) => {
                    const isSelected = newAgent.tools?.includes(tool.id) || false;
                    
                    return (
                      <label
                        key={tool.id}
                        className="flex items-center gap-3 p-3 bg-slate-900/30 hover:bg-slate-900/50 rounded-lg border border-purple-500/10 cursor-pointer transition group"
                      >
                        <div className="relative flex-shrink-0">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              const currentTools = newAgent.tools || [];
                              const updatedTools = e.target.checked
                                ? [...currentTools, tool.id]
                                : currentTools.filter((t) => t !== tool.id);
                              setNewAgent({ ...newAgent, tools: updatedTools });
                            }}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-slate-700 peer-focus:ring-2 peer-focus:ring-purple-500 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-white text-sm truncate group-hover:text-purple-200 transition">
                            {tool.name}
                          </div>
                          <div className="text-xs text-purple-400 truncate mt-0.5">
                            {tool.description}
                          </div>
                        </div>
                        <span className={`px-2 py-1 ${
                          tool.category === 'mcp' ? 'bg-purple-500/20 text-purple-300' :
                          tool.category === 'system' ? 'bg-blue-500/20 text-blue-300' :
                          tool.category === 'agent' ? 'bg-pink-500/20 text-pink-300' :
                          'bg-gray-500/20 text-gray-300'
                        } rounded text-xs font-medium flex-shrink-0`}>
                          {tool.category}
                        </span>
                      </label>
                    );
                  })}

                  {availableMcps.length > 0 && (
                    <div className="pt-4 mt-4 border-t border-purple-500/10">
                      <h4 className="text-sm font-semibold text-white mb-3">MCPs Disponíveis</h4>
                      {availableMcps.map((mcp) => (
                        <div key={mcp.id} className="mb-2 p-3 bg-purple-500/5 rounded-lg border border-purple-500/10">
                          <div className="font-medium text-purple-300 text-sm mb-1">{mcp.name}</div>
                          <div className="text-xs text-purple-400">{mcp.tools?.length || 0} ferramentas disponíveis</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}</div>

            <div className="p-6 border-t border-purple-500/20 flex items-center justify-end gap-3 bg-slate-900/30">
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
                Criar Agente
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
