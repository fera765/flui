import { useState, useEffect } from 'react';
import { X, Search, Package, Wrench, Bot } from 'lucide-react';
import axios from 'axios';

interface Tool {
  id: string;
  name: string;
  description: string;
  category: string;
  version?: string;
}

interface Agent {
  id: string;
  name: string;
  description: string;
  model: string;
  enabled: boolean;
}

interface MCP {
  id: string;
  name: string;
  description: string;
  server: string;
  tools: Tool[];
}

interface ToolSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (tool: Tool | Agent, type: 'tool' | 'agent') => void;
}

export default function ToolSelectionModal({ isOpen, onClose, onSelect }: ToolSelectionModalProps) {
  const [activeTab, setActiveTab] = useState<'system' | 'agents' | 'mcps'>('system');
  const [searchTerm, setSearchTerm] = useState('');
  const [tools, setTools] = useState<Tool[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [mcps, setMcps] = useState<MCP[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [toolsRes, agentsRes, mcpsRes] = await Promise.all([
        axios.get('http://localhost:3001/api/tools'),
        axios.get('http://localhost:3001/api/agents'),
        axios.get('http://localhost:3001/api/mcps'),
      ]);

      setTools(toolsRes.data || []);
      setAgents(agentsRes.data || []);
      setMcps(mcpsRes.data || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  // Não filtrar por categoria - mostrar TODAS as ferramentas
  const filteredSystemTools = tools.filter(t =>
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredAgents = agents.filter(a =>
    a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredMcps = mcps.filter(m =>
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl max-w-4xl w-full max-h-[85vh] overflow-hidden border-2 border-purple-500/20 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-purple-500/20 bg-gradient-to-r from-purple-900/30 to-pink-900/30">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <Wrench className="w-7 h-7 text-purple-400" />
              Selecionar Ferramenta
            </h2>
            <button
              onClick={onClose}
              className="text-purple-300 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar ferramentas, agentes ou MCPs..."
              className="w-full pl-11 pr-4 py-3 bg-slate-900/50 border border-purple-500/30 rounded-xl text-white placeholder-purple-400/50 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
            />
          </div>
        </div>

        {/* Tabs - Design Moderno */}
        <div className="flex border-b-2 border-purple-500/30 bg-gradient-to-r from-slate-900/80 to-slate-800/80">
          <button
            onClick={() => setActiveTab('system')}
            className={`flex-1 px-6 py-4 font-bold transition-all flex items-center justify-center gap-2 relative ${
              activeTab === 'system'
                ? 'bg-gradient-to-r from-purple-600/30 to-pink-600/30 text-white'
                : 'text-purple-300 hover:text-white hover:bg-purple-500/10'
            }`}
          >
            <Wrench className="w-5 h-5" />
            <span className="hidden sm:inline">Ferramentas</span>
            <span className="px-2 py-0.5 bg-purple-500/40 text-purple-100 rounded-full text-xs font-bold ml-1">
              {filteredSystemTools.length}
            </span>
            {activeTab === 'system' && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-pink-500"></div>
            )}
          </button>
          <button
            onClick={() => setActiveTab('agents')}
            className={`flex-1 px-6 py-4 font-bold transition-all flex items-center justify-center gap-2 relative ${
              activeTab === 'agents'
                ? 'bg-gradient-to-r from-blue-600/30 to-cyan-600/30 text-white'
                : 'text-blue-300 hover:text-white hover:bg-blue-500/10'
            }`}
          >
            <Bot className="w-5 h-5" />
            <span className="hidden sm:inline">Agentes</span>
            <span className="px-2 py-0.5 bg-blue-500/40 text-blue-100 rounded-full text-xs font-bold ml-1">
              {filteredAgents.length}
            </span>
            {activeTab === 'agents' && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-cyan-500"></div>
            )}
          </button>
          <button
            onClick={() => setActiveTab('mcps')}
            className={`flex-1 px-6 py-4 font-bold transition-all flex items-center justify-center gap-2 relative ${
              activeTab === 'mcps'
                ? 'bg-gradient-to-r from-green-600/30 to-emerald-600/30 text-white'
                : 'text-green-300 hover:text-white hover:bg-green-500/10'
            }`}
          >
            <Package className="w-5 h-5" />
            <span className="hidden sm:inline">MCPs</span>
            <span className="px-2 py-0.5 bg-green-500/40 text-green-100 rounded-full text-xs font-bold ml-1">
              {filteredMcps.length}
            </span>
            {activeTab === 'mcps' && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500 to-emerald-500"></div>
            )}
          </button>
        </div>

        {/* Content - Com scroll infinito */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
            </div>
          ) : (
            <>
              {activeTab === 'system' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredSystemTools.length === 0 ? (
                    <div className="col-span-2 text-center py-12">
                      <Wrench className="w-16 h-16 text-gray-600 mx-auto mb-4 opacity-50" />
                      <p className="text-gray-400">Nenhuma ferramenta encontrada</p>
                    </div>
                  ) : (
                    filteredSystemTools.map(tool => {
                      const categoryColor = tool.category === 'system' 
                        ? 'purple' 
                        : tool.category === 'mcp' 
                        ? 'green' 
                        : 'blue';
                      
                      return (
                        <button
                          key={tool.id}
                          onClick={() => {
                            onSelect(tool, 'tool');
                            onClose();
                          }}
                          className={`p-5 bg-gradient-to-br from-slate-800/80 to-slate-900/80 border-2 border-${categoryColor}-500/30 rounded-xl hover:border-${categoryColor}-500/70 hover:shadow-xl hover:shadow-${categoryColor}-500/20 transition-all text-left group transform hover:scale-105`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`p-3 bg-gradient-to-br from-${categoryColor}-500/20 to-${categoryColor}-600/30 rounded-xl group-hover:from-${categoryColor}-500/30 group-hover:to-${categoryColor}-600/40 transition-all`}>
                              <Wrench className={`w-6 h-6 text-${categoryColor}-400 group-hover:text-${categoryColor}-300`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-bold text-white truncate group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-purple-300 group-hover:to-pink-300">
                                  {tool.name}
                                </h3>
                                {tool.category && (
                                  <span className={`px-2 py-0.5 bg-${categoryColor}-500/20 text-${categoryColor}-300 rounded text-xs font-semibold uppercase tracking-wide`}>
                                    {tool.category}
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-400 line-clamp-2 group-hover:text-gray-300">
                                {tool.description}
                              </p>
                              {tool.version && (
                                <p className="text-xs text-gray-500 mt-2">v{tool.version}</p>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              )}

              {activeTab === 'agents' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredAgents.length === 0 ? (
                    <div className="col-span-2 text-center py-12">
                      <Bot className="w-16 h-16 text-gray-600 mx-auto mb-4 opacity-50" />
                      <p className="text-gray-400">Nenhum agente encontrado</p>
                    </div>
                  ) : (
                    filteredAgents.map(agent => (
                      <button
                        key={agent.id}
                        onClick={() => {
                          onSelect(agent as any, 'agent');
                          onClose();
                        }}
                        className="p-5 bg-gradient-to-br from-slate-800/80 to-slate-900/80 border-2 border-blue-500/30 rounded-xl hover:border-blue-500/70 hover:shadow-xl hover:shadow-blue-500/20 transition-all text-left group transform hover:scale-105"
                      >
                        <div className="flex items-start gap-3">
                          <div className="p-3 bg-gradient-to-br from-blue-500/20 to-blue-600/30 rounded-xl group-hover:from-blue-500/30 group-hover:to-blue-600/40 transition-all">
                            <Bot className="w-6 h-6 text-blue-400 group-hover:text-blue-300" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-bold text-white truncate group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-blue-300 group-hover:to-cyan-300">
                                {agent.name}
                              </h3>
                              {agent.enabled && (
                                <span className="px-2 py-0.5 bg-green-500/30 text-green-300 rounded-full text-xs font-semibold flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                                  Ativo
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-400 line-clamp-2 group-hover:text-gray-300">
                              {agent.description}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded text-xs font-semibold">
                                {agent.model}
                              </span>
                            </div>
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'mcps' && (
                <div className="space-y-6">
                  {filteredMcps.length === 0 ? (
                    <div className="text-center py-12">
                      <Package className="w-16 h-16 text-gray-600 mx-auto mb-4 opacity-50" />
                      <p className="text-gray-400">Nenhum MCP encontrado</p>
                    </div>
                  ) : (
                    filteredMcps.map(mcp => (
                      <div key={mcp.id} className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-2 border-green-500/30 rounded-2xl overflow-hidden hover:border-green-500/60 transition-all shadow-lg hover:shadow-green-500/20">
                        <div className="p-5 bg-gradient-to-r from-green-600/20 to-emerald-600/20 border-b-2 border-green-500/30">
                          <div className="flex items-start gap-4">
                            <div className="p-3 bg-green-500/20 rounded-xl">
                              <Package className="w-7 h-7 text-green-400" />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-bold text-white text-lg mb-1">{mcp.name}</h3>
                              <p className="text-sm text-green-300">{mcp.description}</p>
                            </div>
                            <span className="px-3 py-1.5 bg-green-500/30 text-green-200 rounded-full text-sm font-bold border border-green-400/30">
                              {mcp.tools?.length || 0} tools
                            </span>
                          </div>
                        </div>
                        <div className="p-5">
                          {!mcp.tools || mcp.tools.length === 0 ? (
                            <p className="text-center text-gray-500 py-4">Nenhuma tool disponível neste MCP</p>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {mcp.tools.map(tool => (
                                <button
                                  key={tool.id}
                                  onClick={() => {
                                    onSelect({ ...tool, category: 'mcp' }, 'tool');
                                    onClose();
                                  }}
                                  className="p-4 bg-slate-900/60 border-2 border-green-500/20 rounded-xl hover:border-green-500/50 hover:bg-slate-900/80 hover:shadow-lg hover:shadow-green-500/10 transition-all text-left group transform hover:scale-105"
                                >
                                  <h4 className="font-semibold text-white text-sm truncate group-hover:text-green-300 transition-colors">
                                    {tool.name}
                                  </h4>
                                  <p className="text-xs text-gray-400 line-clamp-2 mt-1.5 group-hover:text-gray-300">
                                    {tool.description}
                                  </p>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
