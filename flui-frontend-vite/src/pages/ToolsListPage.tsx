/**
 * ToolsListPage - Listagem de ferramentas com paginação
 * 
 * Mostra todas as ferramentas disponíveis com:
 * - Busca por texto
 * - Filtros por categoria e tags
 * - Paginação
 * - Ações rápidas (ativar, editar, duplicar, excluir)
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Plus,
  Edit,
  Trash2,
  Info,
} from 'lucide-react';
import axios from 'axios';

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
    category?: string;
    group?: string;
  };
  metrics: {
    executionCount: number;
    successCount: number;
    failureCount: number;
    averageExecutionTime: number;
  };
  registeredAt: string;
}

interface PaginatedResponse {
  data: Tool[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  links: {
    first: string;
    last: string;
    next?: string;
    prev?: string;
  };
}

const CATEGORIES = ['system', 'mcp', 'agent', 'custom', 'http', 'data', 'ai'];

export default function ToolsListPage() {
  const navigate = useNavigate();
  const [tools, setTools] = useState<Tool[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'mcps'>('all');
  const [mcps, setMcps] = useState<any[]>([]);

  useEffect(() => {
    loadTools();
    if (activeTab === 'mcps') {
      loadMcps();
    }
  }, [pagination.page, selectedCategory, activeTab]);

  const loadMcps = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/mcps');
      setMcps(response.data);
    } catch (error) {
      console.error('Erro ao carregar MCPs:', error);
    }
  };

  const loadTools = async () => {
    setLoading(true);
    try {
      const params: any = {
        page: pagination.page,
        pageSize: pagination.pageSize,
      };

      if (searchTerm) params.search = searchTerm;
      if (selectedCategory) params.category = selectedCategory;

      const response = await axios.get<PaginatedResponse>(
        'http://localhost:3001/api/tools',
        { params }
      );

      setTools(response.data.data);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Erro ao carregar ferramentas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPagination((prev) => ({ ...prev, page: 1 }));
    loadTools();
  };

  const handleDelete = async (toolId: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta ferramenta?')) {
      return;
    }

    try {
      await axios.delete(`http://localhost:3001/api/tools/${toolId}`);
      loadTools();
    } catch (error: any) {
      alert(`Erro ao excluir: ${error.response?.data?.error || error.message}`);
    }
  };

  const handlePageChange = (newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      system: 'bg-blue-500',
      http: 'bg-cyan-500',
      agent: 'bg-purple-500',
      custom: 'bg-orange-500',
      mcp: 'bg-green-500',
      data: 'bg-yellow-500',
      ai: 'bg-pink-500',
    };
    return colors[category] || 'bg-gray-500';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="border-b border-purple-500/20 bg-slate-900/50 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">Ferramentas</h1>
              <p className="text-purple-400 mt-1">
                {pagination.total} ferramentas disponíveis
              </p>
            </div>

            <button
              onClick={() => navigate('/tools/new')}
              className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition shadow-lg"
            >
              <Plus className="w-5 h-5" />
              Nova Ferramenta
            </button>
          </div>

          {/* Search & Filters */}
          <div className="mt-6 flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Buscar por nome, descrição ou ID..."
                className="w-full bg-slate-800 text-white pl-12 pr-4 py-3 rounded-lg border border-purple-500/30 focus:border-purple-500 outline-none transition"
              />
            </div>

            <button
              onClick={handleSearch}
              className="bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition"
            >
              Buscar
            </button>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition ${
                showFilters
                  ? 'bg-purple-600 text-white'
                  : 'bg-slate-800 text-purple-300 hover:bg-slate-700'
              }`}
            >
              <Filter className="w-5 h-5" />
              Filtros
            </button>

            <button
              onClick={loadTools}
              className="bg-slate-800 text-purple-300 p-3 rounded-lg hover:bg-slate-700 transition"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="mt-4 bg-slate-800 rounded-lg p-4 border border-purple-500/20">
              <h3 className="text-white font-semibold mb-3">Categoria</h3>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    setSelectedCategory('');
                    setPagination((prev) => ({ ...prev, page: 1 }));
                  }}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    selectedCategory === ''
                      ? 'bg-purple-600 text-white'
                      : 'bg-slate-700 text-purple-300 hover:bg-slate-600'
                  }`}
                >
                  Todas
                </button>
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => {
                      setSelectedCategory(cat);
                      setPagination((prev) => ({ ...prev, page: 1 }));
                    }}
                    className={`px-4 py-2 rounded-lg font-medium transition ${
                      selectedCategory === cat
                        ? 'bg-purple-600 text-white'
                        : 'bg-slate-700 text-purple-300 hover:bg-slate-600'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tools Grid */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-500"></div>
          </div>
        ) : tools.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400 text-lg">Nenhuma ferramenta encontrada</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tools.map((tool) => (
                <div
                  key={tool.id}
                  className="bg-slate-800 rounded-xl border border-purple-500/20 p-6 hover:border-purple-500/50 transition shadow-lg"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div
                      className={`${getCategoryColor(tool.category)} w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-xl`}
                      style={{ backgroundColor: tool.ui.color }}
                    >
                      {tool.name.charAt(0)}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => navigate(`/tools/${tool.id}`)}
                        className="text-purple-400 hover:text-purple-300 p-2 hover:bg-slate-700 rounded transition"
                        title="Ver detalhes"
                      >
                        <Info className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => navigate(`/tools/${tool.id}/edit`)}
                        className="text-blue-400 hover:text-blue-300 p-2 hover:bg-slate-700 rounded transition"
                        title="Editar"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(tool.id)}
                        className="text-red-400 hover:text-red-300 p-2 hover:bg-slate-700 rounded transition"
                        title="Excluir"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  <h3 className="text-white font-bold text-lg mb-2">{tool.name}</h3>
                  <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                    {tool.description}
                  </p>

                  <div className="flex items-center gap-2 mb-4">
                    <span
                      className={`${getCategoryColor(tool.category)} text-white text-xs px-3 py-1 rounded-full font-medium`}
                    >
                      {tool.category}
                    </span>
                    <span className="text-gray-500 text-xs">v{tool.version}</span>
                  </div>

                  {tool.ui.tags && tool.ui.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {tool.ui.tags.slice(0, 3).map((tag, idx) => (
                        <span
                          key={idx}
                          className="text-purple-400 text-xs px-2 py-1 bg-purple-500/10 rounded"
                        >
                          {tag}
                        </span>
                      ))}
                      {tool.ui.tags.length > 3 && (
                        <span className="text-gray-500 text-xs px-2 py-1">
                          +{tool.ui.tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="border-t border-slate-700 pt-4 mt-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Execuções</p>
                        <p className="text-white font-semibold">
                          {tool.metrics.executionCount}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Sucesso</p>
                        <p className="text-green-400 font-semibold">
                          {tool.metrics.successCount}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-8 bg-slate-800 rounded-lg p-4 border border-purple-500/20">
                <div className="text-gray-400 text-sm">
                  Mostrando {(pagination.page - 1) * pagination.pageSize + 1} a{' '}
                  {Math.min(pagination.page * pagination.pageSize, pagination.total)} de{' '}
                  {pagination.total} ferramentas
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-600 transition"
                  >
                    <ChevronLeft className="w-5 h-5" />
                    Anterior
                  </button>

                  <div className="flex items-center gap-2">
                    {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                      .filter(
                        (page) =>
                          page === 1 ||
                          page === pagination.totalPages ||
                          Math.abs(page - pagination.page) <= 1
                      )
                      .map((page, idx, arr) => (
                        <>
                          {idx > 0 && arr[idx - 1] !== page - 1 && (
                            <span key={`ellipsis-${page}`} className="text-gray-500">
                              ...
                            </span>
                          )}
                          <button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            className={`px-4 py-2 rounded-lg font-medium transition ${
                              pagination.page === page
                                ? 'bg-purple-600 text-white'
                                : 'bg-slate-700 text-purple-300 hover:bg-slate-600'
                            }`}
                          >
                            {page}
                          </button>
                        </>
                      ))}
                  </div>

                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.totalPages}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-600 transition"
                  >
                    Próxima
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
