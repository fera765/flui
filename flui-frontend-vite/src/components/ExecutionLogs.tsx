/**
 * FLUI - Execution Logs Component
 * 
 * Sistema de logs SUPERIOR ao N8n:
 * - Visualização detalhada de inputs/outputs de cada node
 * - Timeline de execução
 * - Filtros avançados
 * - Export de logs
 * - Diff entre execuções
 */

import { useState, useMemo } from 'react';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  ChevronDown, 
  ChevronRight,
  Download,
  Search,
  Zap,
} from 'lucide-react';

interface NodeExecutionResult {
  nodeId: string;
  nodeName: string;
  status: 'running' | 'completed' | 'failed' | 'skipped';
  startTime: string;
  endTime?: string;
  duration?: number;
  input: any;
  output: any;
  error?: string;
  metadata?: {
    retryCount?: number;
    cached?: boolean;
    parallel?: boolean;
  };
}

interface ExecutionLog {
  timestamp: string;
  level: 'debug' | 'info' | 'warning' | 'error';
  nodeId?: string;
  nodeName?: string;
  message: string;
  data?: any;
}

interface ExecutionLogsProps {
  nodes: NodeExecutionResult[];
  logs: ExecutionLog[];
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  duration?: number;
  onClose?: () => void;
}

export default function ExecutionLogs({
  nodes,
  logs,
  status,
  duration,
  onClose,
}: ExecutionLogsProps) {
  const [view, setView] = useState<'nodes' | 'logs' | 'timeline'>('nodes');
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState<string[]>([]);

  // Filtrar logs
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      if (searchQuery && !log.message.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      if (levelFilter.length > 0 && !levelFilter.includes(log.level)) {
        return false;
      }
      return true;
    });
  }, [logs, searchQuery, levelFilter]);

  // Toggle expand node
  const toggleNode = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  // Export logs
  const handleExport = () => {
    const data = {
      timestamp: new Date().toISOString(),
      status,
      duration,
      nodes,
      logs,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `execution-logs-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Get status icon and color
  const getStatusIcon = (nodeStatus: string) => {
    switch (nodeStatus) {
      case 'running':
        return <Clock className="w-5 h-5 text-blue-500 animate-spin" />;
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'skipped':
        return <AlertCircle className="w-5 h-5 text-gray-400" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getLogIcon = (level: string) => {
    switch (level) {
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'info':
        return <CheckCircle className="w-4 h-4 text-blue-500" />;
      case 'debug':
        return <Zap className="w-4 h-4 text-gray-400" />;
      default:
        return null;
    }
  };

  return (
    <div className="bg-white border-t shadow-lg" style={{ height: '500px', maxHeight: '70vh' }}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border-b bg-gradient-to-r from-gray-50 to-gray-100 gap-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 w-full sm:w-auto">
          <h3 className="font-bold text-gray-900 text-lg">📊 Logs de Execução</h3>
          
          {/* Tabs */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setView('nodes')}
              className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                view === 'nodes'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              Nodes ({nodes.length})
            </button>
            <button
              onClick={() => setView('logs')}
              className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                view === 'logs'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              Logs ({logs.length})
            </button>
            <button
              onClick={() => setView('timeline')}
              className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                view === 'timeline'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              Timeline
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Status badge */}
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            status === 'completed' ? 'bg-green-100 text-green-700' :
            status === 'failed' ? 'bg-red-100 text-red-700' :
            status === 'running' ? 'bg-blue-100 text-blue-700' :
            'bg-gray-100 text-gray-700'
          }`}>
            {status === 'completed' && '✓ Concluído'}
            {status === 'failed' && '✗ Falhou'}
            {status === 'running' && '⟳ Executando...'}
            {status === 'cancelled' && '⊘ Cancelado'}
          </div>

          {/* Duration */}
          {duration !== undefined && (
            <div className="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-600">
              {duration}ms
            </div>
          )}

          {/* Export button */}
          <button
            onClick={handleExport}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="Exportar logs"
          >
            <Download className="w-5 h-5" />
          </button>

          {/* Close button */}
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="overflow-y-auto" style={{ height: 'calc(100% - 64px)' }}>
        {/* Nodes View */}
        {view === 'nodes' && (
          <div className="p-4 space-y-3">
            {nodes.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Nenhum node executado ainda
              </div>
            ) : (
              nodes.map((node) => {
                const isExpanded = expandedNodes.has(node.nodeId);
                
                return (
                  <div
                    key={node.nodeId}
                    className="border rounded-lg overflow-hidden transition-all"
                  >
                    {/* Node Header */}
                    <div
                      className={`flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50 ${
                        node.status === 'failed' ? 'bg-red-50' : 'bg-white'
                      }`}
                      onClick={() => toggleNode(node.nodeId)}
                    >
                      <div className="flex items-center gap-3 flex-1">
                        {getStatusIcon(node.status)}
                        
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 truncate">
                            {node.nodeName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {node.nodeId}
                          </div>
                        </div>

                        {node.duration !== undefined && (
                          <div className="text-sm text-gray-500">
                            {node.duration}ms
                          </div>
                        )}

                        {node.metadata?.cached && (
                          <div className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs">
                            Cached
                          </div>
                        )}

                        {node.metadata?.retryCount !== undefined && node.metadata.retryCount > 0 && (
                          <div className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs">
                            Retry {node.metadata.retryCount}
                          </div>
                        )}
                      </div>

                      {isExpanded ? (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      )}
                    </div>

                    {/* Node Details (Expanded) */}
                    {isExpanded && (
                      <div className="border-t bg-gray-50 p-4 space-y-4">
                        {/* Input */}
                        <div>
                          <div className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                              INPUT
                            </span>
                          </div>
                          <pre className="bg-gradient-to-br from-blue-50 to-white p-4 rounded-lg border border-blue-200 text-sm overflow-x-auto text-gray-900 font-mono shadow-inner max-w-full">
                            {JSON.stringify(node.input, null, 2)}
                          </pre>
                        </div>

                        {/* Output */}
                        {node.output && (
                          <div>
                            <div className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                              <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs">
                                OUTPUT
                              </span>
                            </div>
                            <pre className="bg-gradient-to-br from-green-50 to-white p-4 rounded-lg border border-green-200 text-sm overflow-x-auto text-gray-900 font-mono shadow-inner max-w-full">
                              {JSON.stringify(node.output, null, 2)}
                            </pre>
                          </div>
                        )}

                        {/* Error */}
                        {node.error && (
                          <div>
                            <div className="text-sm font-medium text-red-700 mb-2 flex items-center gap-2">
                              <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs">
                                ERROR
                              </span>
                            </div>
                            <pre className="bg-red-50 p-3 rounded border border-red-200 text-xs overflow-x-auto text-red-700">
                              {node.error}
                            </pre>
                          </div>
                        )}

                        {/* Metadata */}
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <div>Start: {new Date(node.startTime).toLocaleTimeString()}</div>
                          {node.endTime && (
                            <div>End: {new Date(node.endTime).toLocaleTimeString()}</div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Logs View */}
        {view === 'logs' && (
          <div>
            {/* Filters */}
            <div className="p-4 border-b bg-gray-50 flex items-center gap-3">
              <div className="flex-1 relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar logs..."
                  className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="flex items-center gap-2">
                {['debug', 'info', 'warning', 'error'].map((level) => (
                  <button
                    key={level}
                    onClick={() => {
                      if (levelFilter.includes(level)) {
                        setLevelFilter(levelFilter.filter(l => l !== level));
                      } else {
                        setLevelFilter([...levelFilter, level]);
                      }
                    }}
                    className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                      levelFilter.includes(level)
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-600 hover:bg-gray-100 border'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            {/* Logs List */}
            <div className="p-4 space-y-2">
              {filteredLogs.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Nenhum log disponível
                </div>
              ) : (
                filteredLogs.map((log, i) => (
                  <div
                    key={i}
                    className={`flex items-start gap-3 p-3 rounded-lg ${
                      log.level === 'error' ? 'bg-red-50' :
                      log.level === 'warning' ? 'bg-yellow-50' :
                      log.level === 'info' ? 'bg-blue-50' :
                      'bg-gray-50'
                    }`}
                  >
                    {getLogIcon(log.level)}
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-gray-500">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                        {log.nodeName && (
                          <span className="text-xs font-medium text-gray-700">
                            {log.nodeName}
                          </span>
                        )}
                      </div>
                      
                      <div className="text-sm text-gray-900">
                        {log.message}
                      </div>

                      {log.data && (
                        <pre className="mt-2 text-xs bg-white p-2 rounded border overflow-x-auto text-gray-900 font-mono">
                          {JSON.stringify(log.data, null, 2)}
                        </pre>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Timeline View */}
        {view === 'timeline' && (
          <div className="p-4">
            <div className="space-y-4">
              {nodes.map((node, i) => (
                <div key={node.nodeId} className="flex items-start gap-4">
                  {/* Timeline line */}
                  <div className="flex flex-col items-center">
                    {getStatusIcon(node.status)}
                    {i < nodes.length - 1 && (
                      <div className="w-0.5 h-full bg-gray-300 my-2" style={{ minHeight: '40px' }}></div>
                    )}
                  </div>

                  {/* Node info */}
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{node.nodeName}</div>
                    <div className="text-sm text-gray-500">
                      {new Date(node.startTime).toLocaleTimeString()}
                      {node.duration && ` • ${node.duration}ms`}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
