import { useState, useEffect } from 'react';
import { X, Search, Bot, Zap, Hammer, Webhook } from 'lucide-react';

interface Tool {
  id: string;
  name: string;
  type: 'agent' | 'mcp' | 'tool' | 'webhook';
  description: string;
  icon: any;
  config?: any;
}

interface NodePaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTool: (tool: Tool) => void;
}

export default function NodePalette({ isOpen, onClose, onSelectTool }: NodePaletteProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [tools, setTools] = useState<Tool[]>([]);
  const [filteredTools, setFilteredTools] = useState<Tool[]>([]);

  useEffect(() => {
    // Carregar ferramentas do backend
    const loadTools = async () => {
      try {
        const [agentsRes, mcpsRes] = await Promise.all([
          fetch('http://localhost:3001/api/agents'),
          fetch('http://localhost:3001/api/mcps'),
        ]);

        const agents = await agentsRes.json();
        const mcps = await mcpsRes.json();

        const allTools: Tool[] = [
          // Agentes
          ...agents.map((agent: any) => ({
            id: agent.id,
            name: agent.name,
            type: 'agent' as const,
            description: agent.role || 'Agente personalizado',
            icon: Bot,
            config: agent,
          })),
          // MCPs
          ...mcps.map((mcp: any) => ({
            id: mcp.id,
            name: mcp.name,
            type: 'mcp' as const,
            description: `${mcp.tools?.length || 0} ferramentas disponíveis`,
            icon: Hammer,
            config: mcp,
          })),
          // Tools do sistema
          {
            id: 'webhook',
            name: 'Webhook',
            type: 'webhook' as const,
            description: 'Receber eventos HTTP externos',
            icon: Webhook,
          },
          {
            id: 'http_request',
            name: 'HTTP Request',
            type: 'tool' as const,
            description: 'Fazer requisição HTTP',
            icon: Zap,
          },
          {
            id: 'condition',
            name: 'Condição',
            type: 'tool' as const,
            description: 'Ramificação condicional',
            icon: Zap,
          },
          {
            id: 'loop',
            name: 'Loop',
            type: 'tool' as const,
            description: 'Executar ações em loop',
            icon: Zap,
          },
          {
            id: 'delay',
            name: 'Delay',
            type: 'tool' as const,
            description: 'Adicionar atraso',
            icon: Zap,
          },
        ];

        setTools(allTools);
        setFilteredTools(allTools);
      } catch (error) {
        console.error('Erro ao carregar ferramentas:', error);
      }
    };

    if (isOpen) {
      loadTools();
    }
  }, [isOpen]);

  useEffect(() => {
    if (searchTerm.trim()) {
      const filtered = tools.filter(tool =>
        tool.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tool.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredTools(filtered);
    } else {
      setFilteredTools(tools);
    }
  }, [searchTerm, tools]);

  if (!isOpen) return null;

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'agent': return 'bg-blue-500/20 border-blue-500/50 text-blue-400';
      case 'mcp': return 'bg-purple-500/20 border-purple-500/50 text-purple-400';
      case 'webhook': return 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400';
      default: return 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-800 rounded-xl border border-purple-500/30 w-full max-w-2xl mt-4 mb-4 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-purple-500/20">
          <h2 className="text-xl font-bold text-white">Adicionar Ferramenta</h2>
          <button
            onClick={onClose}
            className="text-purple-300 hover:text-white transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-purple-500/20">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-purple-400" />
            <input
              type="text"
              placeholder="Pesquisar ferramentas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-700 text-white pl-10 pr-4 py-3 rounded-lg border border-purple-500/30 focus:border-purple-500 outline-none"
              autoFocus
            />
          </div>
        </div>

        {/* Tools Grid */}
        <div className="p-4 max-h-[60vh] overflow-y-auto">
          {filteredTools.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-purple-400">Nenhuma ferramenta encontrada</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredTools.map((tool) => {
                const Icon = tool.icon;
                return (
                  <button
                    key={tool.id}
                    onClick={() => {
                      onSelectTool(tool);
                      onClose();
                    }}
                    className={`p-4 rounded-lg border-2 transition hover:scale-105 text-left ${getTypeColor(tool.type)}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-slate-900/50 rounded-lg">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-white mb-1 truncate">
                          {tool.name}
                        </h3>
                        <p className="text-sm opacity-80 line-clamp-2">
                          {tool.description}
                        </p>
                        <span className="inline-block mt-2 text-xs px-2 py-1 bg-slate-900/50 rounded">
                          {tool.type.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
