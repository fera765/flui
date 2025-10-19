/**
 * FLUI - Node Palette (REFATORADO)
 * 
 * Carrega ferramentas dinamicamente do Tool Registry via API
 */

import { useState, useEffect } from 'react';
import { X, Search, Bot, Zap, Hammer, Webhook, Globe, Code, Terminal, Monitor } from 'lucide-react';

interface Tool {
  id: string;
  name: string;
  description: string;
  category: string;
  params: any[];
  ui: {
    icon?: string;
    color?: string;
    tags?: string[];
  };
}

interface NodePaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTool: (tool: any) => void;
}

const iconMap: Record<string, any> = {
  'Terminal': Terminal,
  'FileText': Zap,
  'FilePlus': Zap,
  'FileEdit': Zap,
  'Search': Zap,
  'FileSearch': Zap,
  'Globe': Globe,
  'Bot': Bot,
  'Monitor': Monitor,
  'Code': Code,
  'Package': Hammer,
  'Webhook': Webhook,
  'Hammer': Hammer,
};

export default function NodePaletteNew({ isOpen, onClose, onSelectTool }: NodePaletteProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [tools, setTools] = useState<Tool[]>([]);
  const [filteredTools, setFilteredTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    if (isOpen) {
      loadTools();
    }
  }, [isOpen]);

  const loadTools = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/tools');
      const allTools = await response.json();
      setTools(allTools);
      setFilteredTools(allTools);
    } catch (error) {
      console.error('Erro ao carregar ferramentas:', error);
      setTools([]);
      setFilteredTools([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let filtered = tools;

    // Filtrar por categoria
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(t => t.category === selectedCategory);
    }

    // Filtrar por busca
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.name.toLowerCase().includes(search) ||
          t.description.toLowerCase().includes(search) ||
          t.ui?.tags?.some(tag => tag.toLowerCase().includes(search))
      );
    }

    setFilteredTools(filtered);
  }, [searchTerm, tools, selectedCategory]);

  if (!isOpen) return null;

  const getTypeColor = (category: string) => {
    switch (category) {
      case 'agent': return 'bg-blue-500/20 border-blue-500/50 text-blue-400';
      case 'mcp': return 'bg-purple-500/20 border-purple-500/50 text-purple-400';
      case 'system': return 'bg-green-500/20 border-green-500/50 text-green-400';
      case 'http': return 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400';
      case 'custom': return 'bg-amber-500/20 border-amber-500/50 text-amber-400';
      default: return 'bg-gray-500/20 border-gray-500/50 text-gray-400';
    }
  };

  const getIcon = (iconName?: string) => {
    if (!iconName) return Zap;
    return iconMap[iconName] || Zap;
  };

  const categories = [
    { id: 'all', label: 'Todas' },
    { id: 'system', label: 'Sistema' },
    { id: 'agent', label: 'Agentes' },
    { id: 'http', label: 'HTTP' },
    { id: 'mcp', label: 'MCPs' },
    { id: 'custom', label: 'Custom' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-800 rounded-xl border border-purple-500/30 w-full max-w-4xl mt-4 mb-4 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-purple-500/20">
          <div>
            <h2 className="text-xl font-bold text-white">Adicionar Ferramenta</h2>
            <p className="text-sm text-purple-400 mt-1">
              {loading ? 'Carregando...' : `${filteredTools.length} ferramentas disponíveis`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-purple-300 hover:text-white transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-purple-500/20 space-y-3">
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

          {/* Categories */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition ${
                  selectedCategory === cat.id
                    ? 'bg-purple-500 text-white'
                    : 'bg-slate-700 text-purple-300 hover:bg-slate-600'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tools Grid */}
        <div className="p-4 max-h-[60vh] overflow-y-auto">
          {loading ? (
            <div className="text-center py-12">
              <p className="text-purple-400">Carregando ferramentas...</p>
            </div>
          ) : filteredTools.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-purple-400">
                {searchTerm ? 'Nenhuma ferramenta encontrada' : 'Nenhuma ferramenta disponível'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredTools.map((tool) => {
                const Icon = getIcon(tool.ui?.icon);
                return (
                  <button
                    key={tool.id}
                    onClick={() => {
                      onSelectTool({
                        id: tool.id,
                        name: tool.name,
                        type: tool.category,
                        description: tool.description,
                        icon: tool.ui?.icon,
                        config: tool,
                      });
                      onClose();
                    }}
                    className={`p-4 rounded-lg border-2 transition hover:scale-105 text-left ${getTypeColor(tool.category)}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-slate-900/50 rounded-lg">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-white mb-1 truncate">
                          {tool.name}
                        </h3>
                        <p className="text-sm opacity-80 line-clamp-2 mb-2">
                          {tool.description}
                        </p>
                        <div className="flex items-center gap-2">
                          <span className="inline-block text-xs px-2 py-1 bg-slate-900/50 rounded">
                            {tool.category.toUpperCase()}
                          </span>
                          <span className="text-xs opacity-70">
                            {tool.params.length} params
                          </span>
                        </div>
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
