import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  PlusCircle, Package, Upload, Trash2, ArrowLeft, Download, 
  CheckCircle, XCircle, AlertCircle, FileCode, Eye
} from 'lucide-react';

interface CustomNodeVersion {
  version: string;
  publishedAt: string;
  downloadUrl: string;
  checksum: string;
  size: number;
}

interface CustomNodeMetadata {
  fingerprint: {
    uuid: string;
    createdAt: string;
    author?: string;
    repository?: string;
  };
  name: string;
  displayName: string;
  description: string;
  version: string;
  category: string;
  tags: string[];
  author: {
    name: string;
    email?: string;
    url?: string;
  };
  license: string;
  icon?: string;
  color: string;
}

interface CustomNode {
  fingerprint: string;
  metadata: CustomNodeMetadata;
  versions: CustomNodeVersion[];
  stats: {
    downloads: number;
    stars: number;
    rating: number;
    reviews: number;
  };
  status: 'active' | 'deprecated' | 'archived';
  installedAt?: string;
  lastUpdated: string;
}

export default function CustomNodesPage() {
  const navigate = useNavigate();
  const [nodes, setNodes] = useState<CustomNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);

  useEffect(() => {
    loadNodes();
  }, []);

  const loadNodes = async () => {
    try {
      setLoading(true);
      const res = await fetch('http://localhost:3001/api/custom-nodes');
      const data = await res.json();
      setNodes(data);
      setError(null);
    } catch (err) {
      setError('Erro ao carregar custom nodes');
      console.error('Erro ao carregar custom nodes:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    if (!uploadFile) {
      alert('Selecione um arquivo .zip');
      return;
    }

    setUploading(true);
    setUploadResult(null);

    try {
      const formData = new FormData();
      formData.append('package', uploadFile);

      const res = await fetch('http://localhost:3001/api/custom-nodes/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await res.json();
      setUploadResult(result);

      if (result.success) {
        await loadNodes();
        setTimeout(() => {
          setShowUploadModal(false);
          setUploadFile(null);
          setUploadResult(null);
        }, 3000);
      }
    } catch (err: any) {
      setUploadResult({
        success: false,
        message: err.message,
        isUpdate: false,
        errors: [err.message],
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (fingerprint: string, name: string) => {
    if (!window.confirm(`Tem certeza que deseja remover o node "${name}"?`)) {
      return;
    }

    try {
      await fetch(`http://localhost:3001/api/custom-nodes/${fingerprint}`, {
        method: 'DELETE',
      });
      await loadNodes();
    } catch (err) {
      console.error('Erro ao excluir node:', err);
      alert('Erro ao excluir node');
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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
                <Package className="w-8 h-8 text-cyan-400" />
                <div>
                  <h1 className="text-2xl font-bold text-white">Custom Nodes</h1>
                  <p className="text-sm text-purple-400">Gerencie seus nodes personalizados</p>
                </div>
              </div>
            </div>
            
            <button 
              onClick={() => setShowUploadModal(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-6 py-3 rounded-lg font-semibold transition shadow-lg shadow-purple-500/50"
            >
              <Upload className="w-5 h-5" />
              Upload Node
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
              onClick={loadNodes}
              className="mt-4 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg transition"
            >
              Tentar novamente
            </button>
          </div>
        ) : nodes.length === 0 ? (
          <div className="bg-slate-800/30 border-2 border-dashed border-purple-500/30 rounded-xl p-12 text-center">
            <Package className="w-16 h-16 text-purple-500/50 mx-auto mb-4" />
            <p className="text-purple-300 mb-4">Nenhum custom node instalado</p>
            <button 
              onClick={() => setShowUploadModal(true)}
              className="inline-flex items-center gap-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 px-6 py-3 rounded-lg transition"
            >
              <Upload className="w-5 h-5" />
              Upload Primeiro Node
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {nodes.map(node => {
              const latestVersion = node.versions[node.versions.length - 1];
              
              return (
                <div 
                  key={node.fingerprint}
                  className="bg-slate-800/50 backdrop-blur-sm border border-purple-500/20 rounded-xl overflow-hidden hover:border-purple-500/50 transition group"
                >
                  {/* Card Header */}
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div 
                        className="p-3 rounded-lg group-hover:scale-110 transition-transform"
                        style={{ backgroundColor: `${node.metadata.color}20` }}
                      >
                        <FileCode 
                          className="w-6 h-6" 
                          style={{ color: node.metadata.color }}
                        />
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        node.status === 'active' 
                          ? 'bg-green-500/20 text-green-400' 
                          : node.status === 'deprecated'
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : 'bg-gray-500/20 text-gray-400'
                      }`}>
                        {node.status === 'active' ? 'Ativo' : 
                         node.status === 'deprecated' ? 'Obsoleto' : 'Arquivado'}
                      </span>
                    </div>
                    
                    <h3 className="text-lg font-semibold text-white mb-2">
                      {node.metadata.displayName}
                    </h3>
                    <p className="text-purple-300/70 text-sm mb-4 line-clamp-2">
                      {node.metadata.description}
                    </p>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between text-purple-400">
                        <span>Versão:</span>
                        <span className="font-mono text-purple-300">v{latestVersion.version}</span>
                      </div>
                      <div className="flex items-center justify-between text-purple-400">
                        <span>Categoria:</span>
                        <span className="text-purple-300">{node.metadata.category}</span>
                      </div>
                      <div className="flex items-center justify-between text-purple-400">
                        <span>Autor:</span>
                        <span className="text-purple-300 truncate max-w-[150px]" title={node.metadata.author.name}>
                          {node.metadata.author.name}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-purple-400">
                        <span>Tamanho:</span>
                        <span className="text-purple-300">{formatSize(latestVersion.size)}</span>
                      </div>
                      <div className="flex items-center justify-between text-purple-400">
                        <span>Licença:</span>
                        <span className="text-purple-300">{node.metadata.license}</span>
                      </div>
                    </div>

                    {/* Tags */}
                    {node.metadata.tags && node.metadata.tags.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-purple-500/10">
                        <div className="flex flex-wrap gap-1">
                          {node.metadata.tags.slice(0, 4).map((tag) => (
                            <span
                              key={tag}
                              className="text-xs bg-purple-500/10 text-purple-300 px-2 py-1 rounded"
                            >
                              {tag}
                            </span>
                          ))}
                          {node.metadata.tags.length > 4 && (
                            <span className="text-xs text-purple-400">
                              +{node.metadata.tags.length - 4}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Versions */}
                    {node.versions.length > 1 && (
                      <div className="mt-4 pt-4 border-t border-purple-500/10">
                        <p className="text-xs text-purple-400 mb-2">
                          {node.versions.length} versão(ões) disponível(is)
                        </p>
                      </div>
                    )}

                    {/* Install date */}
                    {node.installedAt && (
                      <div className="mt-4 pt-4 border-t border-purple-500/10">
                        <p className="text-xs text-purple-400">
                          Instalado em {formatDate(node.installedAt)}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Card Actions */}
                  <div className="px-6 py-3 bg-slate-900/50 flex items-center justify-between border-t border-purple-500/10">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-purple-400">
                        🔑 {node.fingerprint.slice(0, 8)}...
                      </span>
                    </div>
                    
                    <button
                      onClick={() => handleDelete(node.fingerprint, node.metadata.displayName)}
                      className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition"
                      title="Remover node"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 rounded-xl max-w-2xl w-full border border-purple-500/20">
            <div className="p-6 border-b border-purple-500/20">
              <h2 className="text-2xl font-bold text-white">Upload Custom Node</h2>
              <p className="text-sm text-purple-400 mt-1">
                Faça upload de um pacote .zip contendo seu custom node
              </p>
            </div>
            
            <div className="p-6">
              {!uploadResult ? (
                <>
                  <div className="border-2 border-dashed border-purple-500/30 rounded-lg p-8 text-center">
                    <Upload className="w-12 h-12 text-purple-400 mx-auto mb-4" />
                    <input
                      type="file"
                      accept=".zip"
                      onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                      className="hidden"
                      id="file-upload"
                    />
                    <label
                      htmlFor="file-upload"
                      className="inline-block px-6 py-3 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 rounded-lg cursor-pointer transition"
                    >
                      Selecionar Arquivo
                    </label>
                    {uploadFile && (
                      <div className="mt-4 text-sm text-purple-300">
                        <p className="font-medium">{uploadFile.name}</p>
                        <p className="text-purple-400">{formatSize(uploadFile.size)}</p>
                      </div>
                    )}
                  </div>

                  <div className="mt-6 bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                    <p className="text-sm text-blue-300">
                      <strong>💡 Dica:</strong> Use <code className="bg-slate-900/50 px-2 py-1 rounded">flui --create-node nome</code> para criar um novo custom node.
                    </p>
                  </div>
                </>
              ) : (
                <div className={`rounded-lg p-6 border ${
                  uploadResult.success 
                    ? 'bg-green-500/10 border-green-500/20' 
                    : 'bg-red-500/10 border-red-500/20'
                }`}>
                  <div className="flex items-center gap-3 mb-4">
                    {uploadResult.success ? (
                      <CheckCircle className="w-8 h-8 text-green-400" />
                    ) : (
                      <XCircle className="w-8 h-8 text-red-400" />
                    )}
                    <div>
                      <h3 className={`text-lg font-semibold ${
                        uploadResult.success ? 'text-green-300' : 'text-red-300'
                      }`}>
                        {uploadResult.success ? 'Upload Successful!' : 'Upload Failed'}
                      </h3>
                      <p className={`text-sm ${
                        uploadResult.success ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {uploadResult.message}
                      </p>
                    </div>
                  </div>
                  
                  {uploadResult.success && (
                    <div className="space-y-2 text-sm text-green-300 mt-4">
                      <div className="flex justify-between">
                        <span>Fingerprint:</span>
                        <code className="bg-slate-900/50 px-2 py-1 rounded">
                          {uploadResult.fingerprint?.slice(0, 16)}...
                        </code>
                      </div>
                      <div className="flex justify-between">
                        <span>Versão:</span>
                        <span className="font-mono">{uploadResult.newVersion}</span>
                      </div>
                      {uploadResult.isUpdate && (
                        <div className="flex justify-between">
                          <span>Versão anterior:</span>
                          <span className="font-mono">{uploadResult.previousVersion}</span>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {uploadResult.errors && uploadResult.errors.length > 0 && (
                    <div className="mt-4 space-y-1">
                      <p className="text-sm font-medium text-red-300">Errors:</p>
                      {uploadResult.errors.map((err: string, i: number) => (
                        <div key={i} className="flex items-start gap-2 text-sm text-red-400">
                          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          <span>{err}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-purple-500/20 flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setUploadFile(null);
                  setUploadResult(null);
                }}
                className="px-4 py-2 text-purple-300 hover:bg-purple-500/10 rounded-lg transition"
              >
                {uploadResult?.success ? 'Fechar' : 'Cancelar'}
              </button>
              {!uploadResult && (
                <button
                  onClick={handleUpload}
                  disabled={!uploadFile || uploading}
                  className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? 'Uploading...' : 'Upload'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
