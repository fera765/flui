import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Zap } from 'lucide-react';

interface MCP {
  id: string;
  name: string;
  description: string;
  host: string;
  port: number;
  enabled: boolean;
  protocol: string;
  authentication?: {
    type: string;
    credentials: any;
  };
}

export default function EditMCP() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [mcp, setMcp] = useState<MCP | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (id) {
      loadMCP(id);
    }
  }, [id]);

  const loadMCP = async (mcpId: string) => {
    try {
      setLoading(true);
      const res = await fetch(`http://localhost:3001/api/mcps/${mcpId}`);
      
      if (!res.ok) {
        throw new Error('MCP não encontrado');
      }

      const data = await res.json();
      setMcp(data);
    } catch (err) {
      console.error('Erro ao carregar MCP:', err);
      alert('Erro ao carregar MCP');
      navigate('/mcps');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!mcp || !id) return;

    if (!mcp.name.trim() || !mcp.host.trim()) {
      alert('Preencha nome e host');
      return;
    }

    setSaving(true);
    try {
      await fetch(`http://localhost:3001/api/mcps/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mcp),
      });
      
      alert('✅ MCP atualizado com sucesso!');
      navigate('/mcps');
    } catch (err) {
      console.error('Erro ao salvar MCP:', err);
      alert('❌ Erro ao salvar MCP');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-purple-300">Carregando MCP...</p>
        </div>
      </div>
    );
  }

  if (!mcp) {
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
                onClick={() => navigate('/mcps')}
                className="text-purple-300 hover:text-white transition"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <div className="flex items-center gap-3">
                <Zap className="w-8 h-8 text-cyan-400" />
                <div>
                  <h1 className="text-2xl font-bold text-white">Editar MCP</h1>
                  <p className="text-sm text-purple-400">{mcp.name}</p>
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
              Nome do MCP
            </label>
            <input
              type="text"
              value={mcp.name}
              onChange={(e) => setMcp({ ...mcp, name: e.target.value })}
              className="w-full bg-slate-900/50 border border-purple-500/30 rounded-lg px-4 py-3 text-white placeholder-purple-400/50 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 outline-none transition"
              placeholder="Ex: MCP File System"
            />
          </div>

          {/* Descrição */}
          <div className="bg-slate-800/50 backdrop-blur-sm border border-purple-500/20 rounded-xl p-6">
            <label className="block text-purple-300 text-sm font-medium mb-2">
              Descrição
            </label>
            <textarea
              value={mcp.description}
              onChange={(e) => setMcp({ ...mcp, description: e.target.value })}
              className="w-full bg-slate-900/50 border border-purple-500/30 rounded-lg px-4 py-3 text-white placeholder-purple-400/50 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 outline-none transition"
              placeholder="Descreva o MCP"
              rows={3}
            />
          </div>

          {/* Host e Porta */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-800/50 backdrop-blur-sm border border-purple-500/20 rounded-xl p-6">
              <label className="block text-purple-300 text-sm font-medium mb-2">
                Host
              </label>
              <input
                type="text"
                value={mcp.host}
                onChange={(e) => setMcp({ ...mcp, host: e.target.value })}
                className="w-full bg-slate-900/50 border border-purple-500/30 rounded-lg px-4 py-3 text-white placeholder-purple-400/50 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 outline-none transition"
                placeholder="localhost"
              />
            </div>

            <div className="bg-slate-800/50 backdrop-blur-sm border border-purple-500/20 rounded-xl p-6">
              <label className="block text-purple-300 text-sm font-medium mb-2">
                Porta
              </label>
              <input
                type="number"
                value={mcp.port}
                onChange={(e) => setMcp({ ...mcp, port: parseInt(e.target.value) || 0 })}
                className="w-full bg-slate-900/50 border border-purple-500/30 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 outline-none transition"
                placeholder="3000"
              />
            </div>
          </div>

          {/* Protocolo */}
          <div className="bg-slate-800/50 backdrop-blur-sm border border-purple-500/20 rounded-xl p-6">
            <label className="block text-purple-300 text-sm font-medium mb-2">
              Protocolo
            </label>
            <select
              value={mcp.protocol}
              onChange={(e) => setMcp({ ...mcp, protocol: e.target.value })}
              className="w-full bg-slate-900/50 border border-purple-500/30 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 outline-none transition"
            >
              <option value="http">HTTP</option>
              <option value="https">HTTPS</option>
              <option value="ws">WebSocket</option>
              <option value="grpc">gRPC</option>
            </select>
          </div>

          {/* Enabled */}
          <div className="bg-slate-800/50 backdrop-blur-sm border border-purple-500/20 rounded-xl p-6">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={mcp.enabled}
                onChange={(e) => setMcp({ ...mcp, enabled: e.target.checked })}
                className="w-4 h-4 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
              />
              <span className="text-purple-300 text-sm">
                MCP ativo e disponível
              </span>
            </label>
          </div>
        </div>
      </main>
    </div>
  );
}
