/**
 * ToolPalette - Paleta de ferramentas estilo N8n
 * Lista todas as ferramentas disponíveis organizadas por categoria
 */

import { useState, useEffect } from 'react';
import {
  Search,
  Terminal,
  FileText,
  Globe,
  Bot,
  Code,
  Monitor,
  Package,
  Filter,
  X,
} from 'lucide-react';

interface Tool {
  id: string;
  name: string;
  description: string;
  category: string;
  version: string;
  ui: {
    icon?: string;
    color?: string;
    tags?: string[];
  };
}

interface ToolPaletteProps {
  onAddTool: (tool: Tool) => void;
  onClose: () => void;
}

const categoryIcons: Record<string, any> = {
  system: Terminal,
  http: Globe,
  agent: Bot,
  custom: Code,
  mcp: Package,
  data: FileText,
  ai: Bot,
};

export default function ToolPalette({ onAddTool, onClose }: ToolPaletteProps) {
  const [tools, setTools] = useState<Tool[]>([]);
  const [filteredTools, setFilteredTools] = useState<Tool[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Carregar ferramentas da API
  useEffect(() => {
    fetchTools();
  }, []);

  // Filtrar ferramentas
  useEffect(() => {
    let filtered = tools;

    // Filtrar por categoria
    if (selectedCategory) {
      filtered = filtered.filter((tool) => tool.category === selectedCategory);
    }

    // Filtrar por busca
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (tool) =>
          tool.name.toLowerCase().includes(query) ||
          tool.description.toLowerCase().includes(query) ||
          tool.ui.tags?.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    setFilteredTools(filtered);
  }, [tools, searchQuery, selectedCategory]);

  async function fetchTools() {
    try {
      const response = await fetch('http://localhost:3001/api/tools');
      const result = await response.json();
      // API retorna { data: [...], pagination: {...} }
      const toolsArray = Array.isArray(result) ? result : (result.data || []);
      setTools(toolsArray);
      setFilteredTools(toolsArray);
    } catch (error) {
      console.error('Erro ao carregar ferramentas:', error);
      setTools([]);
      setFilteredTools([]);
    } finally {
      setLoading(false);
    }
  }

  // Obter categorias únicas - garantir que tools é um array
  const categories = Array.isArray(tools) ? Array.from(new Set(tools.map((t) => t.category))) : [];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl w-[800px] h-[600px] flex flex-col">
        {/* Header */}
        <div className="border-b px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Adicionar Ferramenta
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Selecione uma ferramenta para adicionar ao fluxo
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Search and Filter */}
        <div className="border-b px-6 py-4">
          <div className="flex gap-3">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar ferramentas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Category Filter */}
            <div className="relative">
              <select
                value={selectedCategory || ''}
                onChange={(e) =>
                  setSelectedCategory(e.target.value || null)
                }
                className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none pr-10"
              >
                <option value="">Todas as categorias</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Tools List */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
            </div>
          ) : filteredTools.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <Search className="w-16 h-16 mb-4 opacity-50" />
              <p className="text-lg font-medium">Nenhuma ferramenta encontrada</p>
              <p className="text-sm mt-2">
                Tente ajustar os filtros ou a busca
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {filteredTools.map((tool) => {
                const CategoryIcon = categoryIcons[tool.category] || Monitor;
                const color =
                  tool.ui.color || '#64748b';

                return (
                  <button
                    key={tool.id}
                    onClick={() => onAddTool(tool)}
                    className="text-left p-4 border-2 rounded-lg hover:border-blue-500 hover:shadow-md transition-all group"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="p-2 rounded-lg"
                        style={{ backgroundColor: `${color}20` }}
                      >
                        <CategoryIcon
                          className="w-6 h-6"
                          style={{ color }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors truncate">
                          {tool.name}
                        </h3>
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                          {tool.description}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <span
                            className="text-xs px-2 py-0.5 rounded"
                            style={{
                              backgroundColor: `${color}20`,
                              color: color,
                            }}
                          >
                            {tool.category}
                          </span>
                          <span className="text-xs text-gray-400">
                            v{tool.version}
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

        {/* Footer */}
        <div className="border-t px-6 py-4 bg-gray-50">
          <p className="text-sm text-gray-600">
            <strong>{filteredTools.length}</strong> ferramenta(s) disponível(is)
          </p>
        </div>
      </div>
    </div>
  );
}
