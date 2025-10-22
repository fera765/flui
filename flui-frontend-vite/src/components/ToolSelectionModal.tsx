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

  const systemTools = tools.filter(t => t.category === 'system');

  const filteredSystemTools = systemTools.filter(t =>
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

        {/* Tabs */}
        <div className="flex border-b border-purple-500/20 bg-slate-900/50">
          <button
            onClick={() => setActiveTab('system')}
            className={`flex-1 px-6 py-4 font-semibold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'system'
                ? 'bg-purple-500/20 text-white border-b-3 border-purple-500'
                : 'text-purple-400 hover:text-purple-300 hover:bg-purple-500/5'
            }`}
          >
            <Wrench className="w-4 h-4" />
            System Tools ({filteredSystemTools.length})
          </button>
          <button
            onClick={() => setActiveTab('agents')}
            className={`flex-1 px-6 py-4 font-semibold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'agents'
                ? 'bg-purple-500/20 text-white border-b-3 border-purple-500'
                : 'text-purple-400 hover:text-purple-300 hover:bg-purple-500/5'
            }`}
          >
            <Bot className="w-4 h-4" />
            Agentes ({filteredAgents.length})
          </button>
          <button
            onClick={() => setActiveTab('mcps')}
            className={`flex-1 px-6 py-4 font-semibold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'mcps'
                ? 'bg-purple-500/20 text-white border-b-3 border-purple-500'
                : 'text-purple-400 hover:text-purple-300 hover:bg-purple-500/5'
            }`}
          >
            <Package className="w-4 h-4" />
            MCPs ({filteredMcps.length})
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
                  {filteredSystemTools.map(tool => (
                    <button
                      key={tool.id}
                      onClick={() => {
                        onSelect(tool, 'tool');
                        onClose();
                      }}
                      className="p-4 bg-slate-800/50 border border-purple-500/20 rounded-xl hover:border-purple-500/50 hover:bg-slate-800/70 transition-all text-left group"
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-purple-500/20 rounded-lg group-hover:bg-purple-500/30 transition">
                          <Wrench className="w-5 h-5 text-purple-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-white truncate">{tool.name}</h3>
                          <p className="text-sm text-purple-400 line-clamp-2 mt-1">{tool.description}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {activeTab === 'agents' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredAgents.map(agent => (
                    <button
                      key={agent.id}
                      onClick={() => {
                        onSelect(agent as any, 'agent');
                        onClose();
                      }}
                      className="p-4 bg-slate-800/50 border border-blue-500/20 rounded-xl hover:border-blue-500/50 hover:bg-slate-800/70 transition-all text-left group"
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-blue-500/20 rounded-lg group-hover:bg-blue-500/30 transition">
                          <Bot className="w-5 h-5 text-blue-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-white truncate">{agent.name}</h3>
                          <p className="text-sm text-blue-400 line-clamp-2 mt-1">{agent.description}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs text-gray-400">{agent.model}</span>
                            {agent.enabled && (
                              <span className="px-2 py-0.5 bg-green-500/20 text-green-400 rounded-full text-xs">Ativo</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {activeTab === 'mcps' && (
                <div className="space-y-6">
                  {filteredMcps.map(mcp => (
                    <div key={mcp.id} className="bg-slate-800/30 border border-purple-500/20 rounded-xl overflow-hidden">
                      <div className="p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-b border-purple-500/20">
                        <div className="flex items-center gap-3">
                          <Package className="w-6 h-6 text-purple-400" />
                          <div>
                            <h3 className="font-bold text-white">{mcp.name}</h3>
                            <p className="text-sm text-purple-400">{mcp.description}</p>
                          </div>
                          <span className="ml-auto px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-sm font-semibold">
                            {mcp.tools?.length || 0} tools
                          </span>
                        </div>
                      </div>
                      <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                        {mcp.tools?.map(tool => (
                          <button
                            key={tool.id}
                            onClick={() => {
                              onSelect({ ...tool, category: 'mcp' }, 'tool');
                              onClose();
                            }}
                            className="p-3 bg-slate-900/50 border border-purple-500/10 rounded-lg hover:border-purple-500/30 hover:bg-slate-900/70 transition-all text-left group"
                          >
                            <h4 className="font-medium text-white text-sm truncate group-hover:text-purple-200">
                              {tool.name}
                            </h4>
                            <p className="text-xs text-purple-400 line-clamp-1 mt-1">
                              {tool.description}
                            </p>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
