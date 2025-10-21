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

import { useState, useMemo, useEffect } from 'react';
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
  executionId?: string; // ID único da execução para persistir chat
  onClose?: () => void;
}

export default function ExecutionLogs({
  nodes,
  logs,
  status,
  duration,
  executionId,
  onClose,
}: ExecutionLogsProps) {
  const [view, setView] = useState<'nodes' | 'logs' | 'timeline' | 'files' | 'links' | 'chat'>('nodes');
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState<string[]>([]);
  const [chatMessages, setChatMessages] = useState<Array<{role: 'user' | 'assistant', content: string}>>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  // Carregar histórico de chat do localStorage ao montar
  useEffect(() => {
    if (executionId) {
      const storageKey = `chat-history-${executionId}`;
      const savedChat = localStorage.getItem(storageKey);
      if (savedChat) {
        try {
          const parsed = JSON.parse(savedChat);
          setChatMessages(parsed);
        } catch (e) {
          console.error('Erro ao carregar histórico de chat:', e);
        }
      }
    }
  }, [executionId]);

  // Salvar histórico de chat no localStorage quando mudar
  useEffect(() => {
    if (executionId && chatMessages.length > 0) {
      const storageKey = `chat-history-${executionId}`;
      localStorage.setItem(storageKey, JSON.stringify(chatMessages));
    }
  }, [chatMessages, executionId]);

  // Função para gerar contexto completo da automação
  const getExecutionContext = () => {
    const successfulNodes = nodes.filter(n => n.status === 'completed');
    const failedNodes = nodes.filter(n => n.status === 'failed');
    const errorLogs = logs.filter(l => l.level === 'error');
    const warningLogs = logs.filter(l => l.level === 'warning');
    
    // Extrair outputs gerados
    const filesGenerated = nodes.filter(n => n.output?.files || n.output?.file);
    const linksGenerated = nodes.filter(n => n.output?.url || n.output?.link || n.output?.links);
    
    return {
      totalNodes: nodes.length,
      successfulNodes: successfulNodes.length,
      failedNodes: failedNodes.length,
      status,
      duration,
      errorCount: errorLogs.length,
      warningCount: warningLogs.length,
      filesGenerated: filesGenerated.length,
      linksGenerated: linksGenerated.length,
      nodes,
      logs,
      errors: errorLogs,
      warnings: warningLogs,
    };
  };

  // Função para gerar resposta inteligente baseada no contexto
  const generateContextualResponse = (userQuestion: string): string => {
    const context = getExecutionContext();
    const question = userQuestion.toLowerCase();
    
    // Resumo geral
    if (question.includes('resumo') || question.includes('o que aconteceu') || question.includes('status')) {
      let response = `📊 **Resumo da Execução:**\n\n`;
      response += `✅ Status: ${context.status === 'completed' ? 'Concluída com sucesso' : context.status === 'failed' ? 'Falhou' : 'Em execução'}\n`;
      response += `⏱️ Duração: ${context.duration ? `${context.duration}ms` : 'N/A'}\n`;
      response += `📦 Nodes executados: ${context.totalNodes}\n`;
      response += `  - Sucesso: ${context.successfulNodes}\n`;
      response += `  - Falhas: ${context.failedNodes}\n`;
      
      if (context.errorCount > 0) {
        response += `\n❌ Erros encontrados: ${context.errorCount}`;
      }
      if (context.warningCount > 0) {
        response += `\n⚠️ Avisos: ${context.warningCount}`;
      }
      if (context.filesGenerated > 0) {
        response += `\n📎 Arquivos gerados: ${context.filesGenerated}`;
      }
      if (context.linksGenerated > 0) {
        response += `\n🔗 Links gerados: ${context.linksGenerated}`;
      }
      
      return response;
    }
    
    // Perguntas sobre erros
    if (question.includes('erro') || question.includes('falha') || question.includes('problema')) {
      if (context.errorCount === 0 && context.failedNodes === 0) {
        return '✅ Não foram encontrados erros nesta execução. Tudo correu bem!';
      }
      
      let response = `❌ **Análise de Erros:**\n\n`;
      response += `Total de erros: ${context.errorCount}\n`;
      response += `Nodes falhados: ${context.failedNodes}\n\n`;
      
      // Listar nodes com erro
      const failedNodesList = context.nodes.filter(n => n.status === 'failed');
      if (failedNodesList.length > 0) {
        response += `**Nodes que falharam:**\n`;
        failedNodesList.forEach(node => {
          response += `\n• **${node.nodeName}** (${node.nodeId})\n`;
          if (node.error) {
            response += `  Erro: ${node.error.substring(0, 200)}${node.error.length > 200 ? '...' : ''}\n`;
          }
        });
      }
      
      // Sugestões
      response += `\n💡 **Sugestões:**\n`;
      response += `- Verifique os parâmetros dos nodes que falharam\n`;
      response += `- Confira se todas as dependências estão configuradas\n`;
      response += `- Consulte a aba "Logs" para detalhes completos`;
      
      return response;
    }
    
    // Perguntas sobre duração/performance
    if (question.includes('tempo') || question.includes('duração') || question.includes('performance') || question.includes('demor')) {
      let response = `⏱️ **Análise de Performance:**\n\n`;
      response += `Duração total: ${context.duration ? `${context.duration}ms (${(context.duration / 1000).toFixed(2)}s)` : 'N/A'}\n`;
      
      // Node mais lento
      const nodesWithDuration = context.nodes.filter(n => n.duration !== undefined);
      if (nodesWithDuration.length > 0) {
        const slowestNode = nodesWithDuration.reduce((prev, current) => 
          (current.duration || 0) > (prev.duration || 0) ? current : prev
        );
        response += `\n🐌 Node mais lento: **${slowestNode.nodeName}** (${slowestNode.duration}ms)`;
        
        // Node mais rápido
        const fastestNode = nodesWithDuration.reduce((prev, current) => 
          (current.duration || 0) < (prev.duration || 0) ? current : prev
        );
        response += `\n⚡ Node mais rápido: **${fastestNode.nodeName}** (${fastestNode.duration}ms)`;
        
        // Média
        const avgDuration = nodesWithDuration.reduce((sum, n) => sum + (n.duration || 0), 0) / nodesWithDuration.length;
        response += `\n📊 Tempo médio por node: ${avgDuration.toFixed(2)}ms`;
      }
      
      return response;
    }
    
    // Perguntas sobre arquivos
    if (question.includes('arquivo') || question.includes('file') || question.includes('download')) {
      if (context.filesGenerated === 0) {
        return '📁 Esta execução não gerou nenhum arquivo.';
      }
      
      let response = `📎 **Arquivos Gerados:**\n\n`;
      response += `Total: ${context.filesGenerated} arquivo(s)\n\n`;
      
      const fileNodes = context.nodes.filter(n => n.output?.files || n.output?.file);
      fileNodes.forEach(node => {
        const files = node.output.files || [node.output.file];
        response += `**${node.nodeName}:**\n`;
        files.forEach((file: any) => {
          response += `  • ${file.name || file.filename || 'arquivo'}\n`;
          if (file.size) {
            response += `    Tamanho: ${(file.size / 1024).toFixed(2)} KB\n`;
          }
        });
      });
      
      response += `\n💡 Acesse a aba "📎 Arquivos" para baixar os arquivos gerados.`;
      
      return response;
    }
    
    // Perguntas sobre links
    if (question.includes('link') || question.includes('url') || question.includes('endereço')) {
      if (context.linksGenerated === 0) {
        return '🔗 Esta execução não gerou nenhum link.';
      }
      
      let response = `🔗 **Links Gerados:**\n\n`;
      const linkNodes = context.nodes.filter(n => n.output?.url || n.output?.link || n.output?.links);
      linkNodes.forEach(node => {
        const links = node.output.links || [node.output.url || node.output.link];
        response += `**${node.nodeName}:**\n`;
        links.forEach((link: any) => {
          const url = typeof link === 'string' ? link : link.url;
          response += `  • ${url}\n`;
        });
      });
      
      response += `\n💡 Acesse a aba "🔗 Links" para ver todos os links gerados.`;
      
      return response;
    }
    
    // Perguntas sobre nodes específicos
    if (question.includes('node') || question.includes('nó')) {
      let response = `📦 **Nodes da Execução:**\n\n`;
      context.nodes.forEach((node, idx) => {
        const statusIcon = node.status === 'completed' ? '✅' : node.status === 'failed' ? '❌' : '⏳';
        response += `${idx + 1}. ${statusIcon} **${node.nodeName}**\n`;
        response += `   Status: ${node.status}\n`;
        if (node.duration) {
          response += `   Duração: ${node.duration}ms\n`;
        }
      });
      
      return response;
    }
    
    // Resposta padrão mais útil
    return `Posso ajudar você com informações sobre esta execução!\n\n🔍 **Perguntas que você pode fazer:**\n\n• "Me dê um resumo" - Visão geral da execução\n• "Houve algum erro?" - Análise de erros e falhas\n• "Quanto tempo levou?" - Análise de performance\n• "Quais arquivos foram gerados?" - Lista de arquivos\n• "Quais links foram gerados?" - Lista de URLs\n• "Liste os nodes" - Detalhes de cada node\n\n📊 **Status atual:** ${context.status} | ${context.totalNodes} nodes | ${context.duration ? context.duration + 'ms' : 'N/A'}`;
  };

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
            <button
              onClick={() => setView('files')}
              className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                view === 'files'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              📎 Arquivos
            </button>
            <button
              onClick={() => setView('links')}
              className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                view === 'links'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              🔗 Links
            </button>
            <button
              onClick={() => setView('chat')}
              className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                view === 'chat'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              💬 Chat
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

        {/* Files View */}
        {view === 'files' && (
          <div className="p-4">
            <div className="space-y-3">
              {nodes.filter(n => n.output?.files || n.output?.file).length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <div className="text-6xl mb-4">📁</div>
                  <div className="font-medium">Nenhum arquivo gerado</div>
                  <div className="text-sm mt-2">Esta execução não gerou arquivos</div>
                </div>
              ) : (
                nodes.filter(n => n.output?.files || n.output?.file).map((node) => {
                  const files = node.output.files || [node.output.file];
                  return files.map((file: any, idx: number) => (
                    <div key={`${node.nodeId}-${idx}`} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="text-4xl">📄</div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-900 truncate">
                              {file.name || file.filename || `arquivo-${idx + 1}`}
                            </div>
                            <div className="text-sm text-gray-500 mt-1">
                              Gerado por: <span className="font-medium">{node.nodeName}</span>
                            </div>
                            {file.size && (
                              <div className="text-xs text-gray-400 mt-1">
                                Tamanho: {(file.size / 1024).toFixed(2)} KB
                              </div>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            // Download file
                            if (file.url || file.data) {
                              const url = file.url || `data:${file.type};base64,${file.data}`;
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = file.name || `download-${Date.now()}`;
                              a.click();
                            }
                          }}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                        >
                          <Download className="w-4 h-4 inline mr-2" />
                          Baixar
                        </button>
                      </div>
                    </div>
                  ));
                })
              )}
            </div>
          </div>
        )}

        {/* Links View */}
        {view === 'links' && (
          <div className="p-4">
            <div className="space-y-3">
              {nodes.filter(n => n.output?.url || n.output?.link || n.output?.links).length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <div className="text-6xl mb-4">🔗</div>
                  <div className="font-medium">Nenhum link gerado</div>
                  <div className="text-sm mt-2">Esta execução não gerou links</div>
                </div>
              ) : (
                nodes.filter(n => n.output?.url || n.output?.link || n.output?.links).map((node) => {
                  const links = node.output.links || [node.output.url || node.output.link];
                  return links.map((link: any, idx: number) => {
                    const url = typeof link === 'string' ? link : link.url;
                    const title = typeof link === 'object' ? link.title : url;
                    
                    return (
                      <div key={`${node.nodeId}-${idx}`} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-start gap-3">
                          <div className="text-3xl">🔗</div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-900 truncate">
                              {title}
                            </div>
                            <div className="text-sm text-blue-600 hover:underline mt-1 break-all">
                              <a href={url} target="_blank" rel="noopener noreferrer">
                                {url}
                              </a>
                            </div>
                            <div className="text-xs text-gray-500 mt-2">
                              Gerado por: <span className="font-medium">{node.nodeName}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  });
                })
              )}
            </div>
          </div>
        )}

        {/* Chat View */}
        {view === 'chat' && (
          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {chatMessages.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <div className="text-6xl mb-4">💬</div>
                  <div className="font-medium text-lg mb-3">Chat Interativo com a Automação</div>
                  <div className="text-sm mb-4">Converse sobre esta execução e obtenha insights detalhados</div>
                  
                  {/* Sugestões de perguntas */}
                  <div className="max-w-2xl mx-auto mt-6 space-y-2">
                    <p className="text-xs font-semibold text-gray-600 mb-2">💡 Perguntas sugeridas:</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {[
                        'Me dê um resumo',
                        'Houve algum erro?',
                        'Quanto tempo levou?',
                        'Quais arquivos foram gerados?',
                        'Liste os nodes',
                        'Análise de performance'
                      ].map((suggestion, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setChatInput(suggestion);
                          }}
                          className="text-left px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs transition-colors"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {chatMessages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-3 shadow-sm ${
                          msg.role === 'user'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gradient-to-br from-gray-50 to-gray-100 text-gray-900 border border-gray-200'
                        }`}
                      >
                        <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
                      </div>
                    </div>
                  ))}
                  {chatLoading && (
                    <div className="flex justify-start">
                      <div className="max-w-[80%] rounded-lg p-3 bg-gray-100 border border-gray-200">
                        <div className="flex items-center gap-2 text-gray-500">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                          <span className="text-sm">Analisando execução...</span>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
            <div className="border-t p-4 bg-white">
              {chatMessages.length > 0 && (
                <div className="mb-3 flex items-center justify-between">
                  <div className="text-xs text-gray-500">
                    💾 Chat salvo automaticamente
                  </div>
                  <button
                    onClick={() => {
                      if (window.confirm('Deseja limpar o histórico de chat desta execução?')) {
                        setChatMessages([]);
                        if (executionId) {
                          localStorage.removeItem(`chat-history-${executionId}`);
                        }
                      }
                    }}
                    className="text-xs text-red-600 hover:text-red-700 underline"
                  >
                    Limpar histórico
                  </button>
                </div>
              )}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!chatInput.trim() || chatLoading) return;
                  
                  const userMessage = chatInput;
                  
                  // Add user message
                  setChatMessages([...chatMessages, { role: 'user', content: userMessage }]);
                  setChatInput('');
                  setChatLoading(true);
                  
                  // Generate contextual response
                  setTimeout(() => {
                    const response = generateContextualResponse(userMessage);
                    setChatMessages(prev => [...prev, { role: 'assistant', content: response }]);
                    setChatLoading(false);
                  }, 500);
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Pergunte sobre a execução..."
                  className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <button
                  type="submit"
                  disabled={chatLoading || !chatInput.trim()}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {chatLoading ? '⏳' : 'Enviar'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
