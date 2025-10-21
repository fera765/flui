import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Bot } from 'lucide-react';

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
}

export default function EditAgent() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [availableTools, setAvailableTools] = useState<any[]>([]);
  const [showToolsTab, setShowToolsTab] = useState(false);

  useEffect(() => {
    if (id) {
      loadAgent(id);
      loadAvailableTools();
    }
  }, [id]);

  const loadAvailableTools = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/tools');
      const data = await res.json();
      setAvailableTools(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erro ao carregar tools:', error);
    }
  };

  const loadAgent = async (agentId: string) => {
    try {
      setLoading(true);
      const res = await fetch(`http://localhost:3001/api/agents/${agentId}`);
      
      if (!res.ok) {
        throw new Error('Agente não encontrado');
      }

      const data = await res.json();
      setAgent(data);
    } catch (err) {
      console.error('Erro ao carregar agente:', err);
      alert('Erro ao carregar agente');
      navigate('/agents');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!agent || !id) return;

    if (!agent.name.trim() || !agent.systemPrompt.trim()) {
      alert('Preencha nome e prompt do sistema');
      return;
    }

    setSaving(true);
    try {
      await fetch(`http://localhost:3001/api/agents/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(agent),
      });
      
      alert('✅ Agente atualizado com sucesso!');
      navigate('/agents');
    } catch (err) {
      console.error('Erro ao salvar agente:', err);
      alert('❌ Erro ao salvar agente');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-purple-300">Carregando agente...</p>
        </div>
      </div>
    );
  }

  if (!agent) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="border-b border-purple-500/20 bg-slate-900/50 backdrop-blur-xl sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/agents')}
                className="text-purple-300 hover:text-white transition"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <div className="flex items-center gap-3">
                <Bot className="w-8 h-8 text-purple-400" />
                <div>
                  <h1 className="text-2xl font-bold text-white">Editar Agente</h1>
                  <p className="text-sm text-purple-400">{agent.name}</p>
                </div>
              </div>
            </div>
            
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-6 py-3 rounded-lg font-semibold transition shadow-lg shadow-purple-500/50 disabled:opacity-50"
            >
              <Save className="w-5 h-5" />
              {saving ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </div>
      </header>

      {/* Form */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Nome */}
          <div className="bg-slate-800/50 backdrop-blur-sm border border-purple-500/20 rounded-xl p-6">
            <label className="block text-purple-300 text-sm font-medium mb-2">
              Nome do Agente
            </label>
            <input
              type="text"
              value={agent.name}
              onChange={(e) => setAgent({ ...agent, name: e.target.value })}
              className="w-full bg-slate-900/50 border border-purple-500/30 rounded-lg px-4 py-3 text-white placeholder-purple-400/50 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 outline-none transition"
              placeholder="Ex: Assistente de Código"
            />
          </div>

          {/* Descrição */}
          <div className="bg-slate-800/50 backdrop-blur-sm border border-purple-500/20 rounded-xl p-6">
            <label className="block text-purple-300 text-sm font-medium mb-2">
              Descrição
            </label>
            <textarea
              value={agent.description}
              onChange={(e) => setAgent({ ...agent, description: e.target.value })}
              className="w-full bg-slate-900/50 border border-purple-500/30 rounded-lg px-4 py-3 text-white placeholder-purple-400/50 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 outline-none transition"
              placeholder="Descreva o propósito do agente"
              rows={3}
            />
          </div>

          {/* Modelo */}
          <div className="bg-slate-800/50 backdrop-blur-sm border border-purple-500/20 rounded-xl p-6">
            <label className="block text-purple-300 text-sm font-medium mb-2">
              Modelo
            </label>
            <select
              value={agent.model}
              onChange={(e) => setAgent({ ...agent, model: e.target.value })}
              className="w-full bg-slate-900/50 border border-purple-500/30 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 outline-none transition"
            >
              <option value="gpt-4">GPT-4</option>
              <option value="gpt-4-turbo">GPT-4 Turbo</option>
              <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
              <option value="claude-3-opus">Claude 3 Opus</option>
              <option value="claude-3-sonnet">Claude 3 Sonnet</option>
            </select>
          </div>

          {/* System Prompt */}
          <div className="bg-slate-800/50 backdrop-blur-sm border border-purple-500/20 rounded-xl p-6">
            <label className="block text-purple-300 text-sm font-medium mb-2">
              System Prompt
            </label>
            <textarea
              value={agent.systemPrompt}
              onChange={(e) => setAgent({ ...agent, systemPrompt: e.target.value })}
              className="w-full bg-slate-900/50 border border-purple-500/30 rounded-lg px-4 py-3 text-white placeholder-purple-400/50 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 outline-none transition font-mono text-sm"
              placeholder="You are a helpful assistant..."
              rows={10}
            />
          </div>

          {/* Configurações */}
          <div className="bg-slate-800/50 backdrop-blur-sm border border-purple-500/20 rounded-xl p-6 space-y-4">
            <h3 className="text-white font-semibold mb-4">Configurações</h3>
            
            {/* Temperature */}
            <div>
              <label className="block text-purple-300 text-sm font-medium mb-2">
                Temperature: {agent.temperature}
              </label>
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={agent.temperature}
                onChange={(e) => setAgent({ ...agent, temperature: parseFloat(e.target.value) })}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-purple-400/70 mt-1">
                <span>Preciso (0)</span>
                <span>Criativo (2)</span>
              </div>
            </div>

            {/* Max Tokens */}
            <div>
              <label className="block text-purple-300 text-sm font-medium mb-2">
                Max Tokens
              </label>
              <input
                type="number"
                value={agent.maxTokens}
                onChange={(e) => setAgent({ ...agent, maxTokens: parseInt(e.target.value) })}
                className="w-full bg-slate-900/50 border border-purple-500/30 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 outline-none transition"
                min="100"
                max="32000"
              />
            </div>

            {/* Enabled */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={agent.enabled}
                onChange={(e) => setAgent({ ...agent, enabled: e.target.checked })}
                className="w-4 h-4 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
              />
              <label className="text-purple-300 text-sm">
                Agente ativo
              </label>
            </div>
          </div>

          {/* Tools Selection */}
          <div className="bg-slate-800/50 backdrop-blur-sm border border-purple-500/20 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold">🔧 Ferramentas Disponíveis</h3>
              <span className="text-sm text-purple-400">
                {agent.tools?.length || 0} / {availableTools.length} selecionadas
              </span>
            </div>
            
            <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
              {availableTools.length === 0 ? (
                <p className="text-center text-purple-400 py-4">Carregando ferramentas...</p>
              ) : (
                availableTools.map((tool) => {
                  const isSelected = agent.tools?.includes(tool.id) || false;
                  
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
                            const currentTools = agent.tools || [];
                            const newTools = e.target.checked
                              ? [...currentTools, tool.id]
                              : currentTools.filter((t) => t !== tool.id);
                            setAgent({ ...agent, tools: newTools });
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
                        'bg-gray-500/20 text-gray-300'
                      } rounded text-xs font-medium flex-shrink-0`}>
                        {tool.category}
                      </span>
                    </label>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
