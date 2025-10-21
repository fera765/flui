import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, Wrench } from 'lucide-react';

interface Tool {
  id: string;
  name: string;
  description: string;
  category: string;
  version: string;
  params: any[];
}

interface MCP {
  id: string;
  name: string;
  description: string;
  server: string;
  tools: any[];
}

export default function ToolsPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'all' | 'mcps'>('all');
  const [tools, setTools] = useState<Tool[]>([]);
  const [mcps, setMcps] = useState<MCP[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [toolsRes, mcpsRes] = await Promise.all([
        fetch('http://localhost:3001/api/tools'),
        fetch('http://localhost:3001/api/mcps'),
      ]);

      const toolsData = await toolsRes.json();
      const mcpsData = await mcpsRes.json();

      setTools(Array.isArray(toolsData) ? toolsData : []);
      setMcps(Array.isArray(mcpsData) ? mcpsData : []);
      setLoading(false);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      setLoading(false);
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      system: 'bg-blue-500',
      mcp: 'bg-purple-500',
      agent: 'bg-pink-500',
      custom: 'bg-orange-500',
    };
    return colors[category] || 'bg-gray-500';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <header className="border-b border-purple-500/20 bg-slate-900/50 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="text-purple-300 hover:text-white transition"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white">Ferramentas</h1>
              <p className="text-sm text-purple-400">
                {tools.length} ferramentas disponíveis
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-purple-500/20">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-6 py-3 font-semibold transition-all ${
              activeTab === 'all'
                ? 'text-white border-b-2 border-purple-500'
                : 'text-purple-400 hover:text-purple-300'
            }`}
          >
            <Wrench className="w-4 h-4 inline mr-2" />
            Todas as Tools
          </button>
          <button
            onClick={() => setActiveTab('mcps')}
            className={`px-6 py-3 font-semibold transition-all ${
              activeTab === 'mcps'
                ? 'text-white border-b-2 border-purple-500'
                : 'text-purple-400 hover:text-purple-300'
            }`}
          >
            <Package className="w-4 h-4 inline mr-2" />
            Tools por MCP ({mcps.length})
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
          </div>
        ) : (
          <>
            {/* Aba: Todas as Tools */}
            {activeTab === 'all' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tools.map((tool) => (
                  <div
                    key={tool.id}
                    className="bg-slate-800/50 border border-purple-500/20 rounded-xl p-5 hover:border-purple-500/40 transition"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-white text-base truncate" title={tool.name}>
                          {tool.name}
                        </h3>
                        <p className="text-xs text-purple-400 mt-1 line-clamp-2">
                          {tool.description}
                        </p>
                      </div>
                      <span
                        className={`${getCategoryColor(
                          tool.category
                        )} px-2 py-1 rounded text-white text-xs font-semibold ml-2 flex-shrink-0`}
                      >
                        {tool.category}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-purple-400">
                      <span>v{tool.version}</span>
                      <span>•</span>
                      <span>{tool.params?.length || 0} params</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Aba: Tools por MCP */}
            {activeTab === 'mcps' && (
              <div className="space-y-6">
                {mcps.length === 0 ? (
                  <div className="text-center py-20">
                    <Package className="w-16 h-16 text-purple-500/50 mx-auto mb-4" />
                    <p className="text-purple-400">Nenhum MCP cadastrado ainda</p>
                  </div>
                ) : (
                  mcps.map((mcp) => (
                    <div
                      key={mcp.id}
                      className="bg-slate-800/50 border border-purple-500/20 rounded-xl overflow-hidden"
                    >
                      {/* MCP Header */}
                      <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 p-5 border-b border-purple-500/20">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-xl font-bold text-white mb-1">
                              {mcp.name}
                            </h3>
                            <p className="text-sm text-purple-300">{mcp.description}</p>
                            <p className="text-xs text-purple-400 mt-1 font-mono">
                              {mcp.server}
                            </p>
                          </div>
                          <span className="px-4 py-2 bg-purple-500/30 text-white rounded-full text-sm font-semibold">
                            {mcp.tools?.length || 0} tools
                          </span>
                        </div>
                      </div>

                      {/* MCP Tools */}
                      {mcp.tools && mcp.tools.length > 0 && (
                        <div className="p-5">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {mcp.tools.map((tool: any) => (
                              <div
                                key={tool.id}
                                className="bg-slate-900/50 border border-purple-500/10 rounded-lg p-4 hover:border-purple-500/30 hover:bg-slate-900/70 transition"
                              >
                                <div className="flex items-start gap-3">
                                  <div className="p-2 bg-purple-500/20 rounded-lg flex-shrink-0">
                                    <Wrench className="w-4 h-4 text-purple-300" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-semibold text-white text-sm mb-1 truncate" title={tool.name}>
                                      {tool.name}
                                    </h4>
                                    <p className="text-xs text-purple-400 line-clamp-2">
                                      {tool.description}
                                    </p>
                                    {Object.keys(tool.parameters || {}).length > 0 && (
                                      <div className="mt-2 flex flex-wrap gap-1">
                                        {Object.keys(tool.parameters).slice(0, 3).map((param) => (
                                          <span
                                            key={param}
                                            className="px-2 py-0.5 bg-purple-500/10 text-purple-300 rounded text-xs"
                                          >
                                            {param}
                                          </span>
                                        ))}
                                        {Object.keys(tool.parameters).length > 3 && (
                                          <span className="text-xs text-purple-400">
                                            +{Object.keys(tool.parameters).length - 3}
                                          </span>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
