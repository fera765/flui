import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Terminal, 
  MessageCircle, 
  Send, 
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Info
} from 'lucide-react';

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'success' | 'warning' | 'error';
  message: string;
  nodeId?: string;
  nodeName?: string;
  data?: any;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface AutomationExecution {
  id: string;
  automationId: string;
  automationName: string;
  status: 'running' | 'completed' | 'failed';
  startedAt: string;
  completedAt?: string;
  logs: LogEntry[];
  context: {
    nodes: any[];
    edges: any[];
    results: Record<string, any>;
    globalContext: Record<string, any>;
  };
}

export default function LogsPage() {
  const { executionId } = useParams<{ executionId: string }>();
  const navigate = useNavigate();
  const [execution, setExecution] = useState<AutomationExecution | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadExecutionData();
    // Atualizar logs em tempo real
    const interval = setInterval(loadExecutionData, 2000);
    return () => clearInterval(interval);
  }, [executionId]);

  useEffect(() => {
    // Auto-scroll nos logs
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [execution?.logs]);

  useEffect(() => {
    // Auto-scroll no chat
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const loadExecutionData = async () => {
    try {
      // Chamada real à API
      const response = await fetch(`http://localhost:3001/api/automations/${executionId}/logs`);
      if (!response.ok) {
        throw new Error('Erro ao carregar logs');
      }
      
      const data = await response.json();
      setExecution(data);
      setIsLoading(false);
    } catch (error) {
      console.error('Erro ao carregar execução:', error);
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isSendingMessage) return;

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: inputMessage,
      timestamp: new Date().toISOString()
    };

    setChatMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsSendingMessage(true);

    try {
      // Chamada real à API de chat com contexto
      const response = await fetch(`http://localhost:3001/api/automations/${executionId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: inputMessage,
          context: execution?.context 
        })
      });
      
      if (!response.ok) {
        throw new Error('Erro ao enviar mensagem');
      }
      
      const data = await response.json();
      
      const assistantMessage: ChatMessage = {
        id: `msg-${Date.now()}-assistant`,
        role: 'assistant',
        content: data.response,
        timestamp: data.timestamp
      };

      setChatMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      
      // Fallback para resposta local
      const assistantMessage: ChatMessage = {
        id: `msg-${Date.now()}-assistant`,
        role: 'assistant',
        content: getContextualResponse(inputMessage),
        timestamp: new Date().toISOString()
      };
      setChatMessages(prev => [...prev, assistantMessage]);
    } finally {
      setIsSendingMessage(false);
    }
  };

  const buildContextualPrompt = (userMessage: string): string => {
    if (!execution) return userMessage;

    return `
Você é um assistente integrado a uma automação em execução. 
Use o contexto abaixo para responder à pergunta do usuário de forma precisa e útil.

**Contexto da Automação:**
- Nome: ${execution.automationName}
- Status: ${execution.status}
- Iniciada em: ${execution.startedAt}
- Total de logs: ${execution.logs.length}
- Último log: ${execution.logs[execution.logs.length - 1]?.message || 'N/A'}

**Resultados dos Nodes:**
${JSON.stringify(execution.context.results, null, 2)}

**Pergunta do usuário:**
${userMessage}

Responda de forma clara e direta, focando nas informações relevantes do contexto da automação.
    `.trim();
  };

  const getContextualResponse = (userMessage: string): string => {
    if (!execution) return 'Desculpe, não consegui acessar o contexto da automação.';

    const msg = userMessage.toLowerCase();

    if (msg.includes('status') || msg.includes('como está')) {
      return `A automação "${execution.automationName}" está atualmente **${execution.status}**. Ela foi iniciada em ${new Date(execution.startedAt).toLocaleString()} e já possui ${execution.logs.length} eventos registrados.`;
    }

    if (msg.includes('erro') || msg.includes('problema')) {
      const errors = execution.logs.filter(log => log.level === 'error');
      if (errors.length === 0) {
        return 'Até o momento, não foram detectados erros na execução desta automação. Tudo está funcionando conforme esperado! ✅';
      }
      return `Foram detectados ${errors.length} erro(s) durante a execução:\n\n${errors.map(e => `• ${e.message}`).join('\n')}`;
    }

    if (msg.includes('último') || msg.includes('ultima') || msg.includes('recente')) {
      const lastLog = execution.logs[execution.logs.length - 1];
      if (!lastLog) return 'Ainda não há logs registrados.';
      return `O último evento foi: "${lastLog.message}" (${lastLog.level}) registrado em ${new Date(lastLog.timestamp).toLocaleTimeString()}.`;
    }

    if (msg.includes('node') || msg.includes('nó')) {
      const nodeNames = [...new Set(execution.logs.map(log => log.nodeName).filter(Boolean))];
      return `Os seguintes nodes foram executados até agora:\n\n${nodeNames.map(n => `• ${n}`).join('\n')}`;
    }

    // Resposta genérica contextual
    return `Com base no contexto atual da automação "${execution.automationName}", posso informar que ela está ${execution.status === 'running' ? 'em execução' : execution.status}. Você pode me perguntar sobre status, erros, nodes executados ou eventos específicos.`;
  };

  const getLevelIcon = (level: LogEntry['level']) => {
    switch (level) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-400" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
      default:
        return <Info className="w-4 h-4 text-blue-400" />;
    }
  };

  const getLevelColor = (level: LogEntry['level']) => {
    switch (level) {
      case 'success':
        return 'bg-green-500/10 border-green-500/20 text-green-300';
      case 'error':
        return 'bg-red-500/10 border-red-500/20 text-red-300';
      case 'warning':
        return 'bg-yellow-500/10 border-yellow-500/20 text-yellow-300';
      default:
        return 'bg-blue-500/10 border-blue-500/20 text-blue-300';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-purple-500 animate-spin" />
      </div>
    );
  }

  if (!execution) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-lg mb-4">Execução não encontrada</p>
          <button
            onClick={() => navigate('/automations')}
            className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition"
          >
            Voltar para Automações
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="border-b border-purple-500/20 bg-slate-900/50 backdrop-blur-xl sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/automations')}
                className="text-purple-300 hover:text-white transition"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <div className="flex items-center gap-3">
                <Terminal className="w-8 h-8 text-cyan-400" />
                <div>
                  <h1 className="text-2xl font-bold text-white">{execution.automationName}</h1>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                      execution.status === 'running' 
                        ? 'bg-blue-500/20 text-blue-400'
                        : execution.status === 'completed'
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-red-500/20 text-red-400'
                    }`}>
                      {execution.status === 'running' ? '🔄 Em Execução' : 
                       execution.status === 'completed' ? '✅ Concluída' : '❌ Falhou'}
                    </span>
                    <span className="text-sm text-purple-400">
                      <Clock className="w-3 h-3 inline mr-1" />
                      Iniciada em {new Date(execution.startedAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Split Layout */}
      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-180px)]">
          {/* Logs Panel */}
          <div className="bg-slate-800/50 backdrop-blur-sm border border-purple-500/20 rounded-xl overflow-hidden flex flex-col">
            <div className="p-4 border-b border-purple-500/20 bg-slate-900/50">
              <div className="flex items-center gap-2">
                <Terminal className="w-5 h-5 text-purple-400" />
                <h2 className="text-lg font-semibold text-white">Logs de Execução</h2>
                <span className="ml-auto text-sm text-purple-400">
                  {execution.logs.length} eventos
                </span>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-2 font-mono text-sm">
              {execution.logs.map((log) => (
                <div
                  key={log.id}
                  className={`p-3 rounded-lg border ${getLevelColor(log.level)}`}
                >
                  <div className="flex items-start gap-2">
                    {getLevelIcon(log.level)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs opacity-70">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                        {log.nodeName && (
                          <span className="text-xs bg-purple-500/20 px-2 py-0.5 rounded">
                            {log.nodeName}
                          </span>
                        )}
                      </div>
                      <p className="break-words">{log.message}</p>
                      {log.data && (
                        <details className="mt-2">
                          <summary className="cursor-pointer text-xs opacity-70 hover:opacity-100">
                            Ver dados
                          </summary>
                          <pre className="mt-2 text-xs bg-slate-900/50 p-2 rounded overflow-x-auto">
                            {JSON.stringify(log.data, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={logsEndRef} />
            </div>
          </div>

          {/* Chat Panel */}
          <div className="bg-slate-800/50 backdrop-blur-sm border border-purple-500/20 rounded-xl overflow-hidden flex flex-col">
            <div className="p-4 border-b border-purple-500/20 bg-slate-900/50">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-cyan-400" />
                <h2 className="text-lg font-semibold text-white">Chat Contextual</h2>
              </div>
              <p className="text-xs text-purple-400 mt-1">
                Converse sobre esta execução com contexto completo
              </p>
            </div>
            
            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {chatMessages.length === 0 ? (
                <div className="text-center text-purple-400 py-12">
                  <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">Inicie uma conversa sobre esta automação</p>
                  <p className="text-xs mt-2 opacity-70">
                    Pergunte sobre status, erros, resultados ou qualquer informação da execução
                  </p>
                </div>
              ) : (
                chatMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-3 ${
                        msg.role === 'user'
                          ? 'bg-purple-500/20 text-purple-100 border border-purple-500/30'
                          : 'bg-slate-700/50 text-slate-100 border border-slate-600/30'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      <span className="text-xs opacity-60 mt-1 block">
                        {new Date(msg.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                ))
              )}
              {isSendingMessage && (
                <div className="flex justify-start">
                  <div className="bg-slate-700/50 border border-slate-600/30 rounded-lg p-3">
                    <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Chat Input */}
            <div className="p-4 border-t border-purple-500/20 bg-slate-900/50">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Pergunte sobre status, erros, resultados..."
                  className="flex-1 bg-slate-800 border border-purple-500/20 rounded-lg px-4 py-2 text-white placeholder-purple-400/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  disabled={isSendingMessage}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || isSendingMessage}
                  className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white rounded-lg transition"
                >
                  {isSendingMessage ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
