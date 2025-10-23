/**
 * AgentChat - Página de chat interativo com agentes
 * 
 * ✅ Interface completa de chat em tempo real
 * ✅ Suporte a ferramentas injetadas
 * ✅ Exibição de arquivos gerados
 * ✅ Exibição de links gerados
 * ✅ Streaming de respostas
 * ✅ Histórico de conversa
 */

import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Send, Bot, User, FileText, Link as LinkIcon, Loader2, Download, ExternalLink, Trash2 } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  files?: Array<{
    name: string;
    content: string;
    type: string;
  }>;
  links?: Array<{
    url: string;
    title: string;
    description?: string;
  }>;
  tools?: Array<{
    name: string;
    result: any;
  }>;
}

interface Agent {
  id: string;
  name: string;
  description: string;
  model: string;
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
  enabled: boolean;
  tools: string[];
}

export default function AgentChat() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'chat' | 'files' | 'links'>('chat');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll para última mensagem
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Carregar agente
  useEffect(() => {
    if (id) {
      loadAgent(id);
    }
  }, [id]);

  const loadAgent = async (agentId: string) => {
    try {
      const res = await fetch(`http://localhost:3001/api/agents/${agentId}`);
      
      if (!res.ok) {
        throw new Error('Agente não encontrado');
      }

      const data = await res.json();
      setAgent(data);
      
      // Adicionar mensagem de boas-vindas
      const welcomeMessage: Message = {
        id: 'welcome',
        role: 'assistant',
        content: `Olá! Sou o ${data.name}. ${data.description || 'Como posso ajudá-lo hoje?'}`,
        timestamp: new Date().toISOString(),
      };
      setMessages([welcomeMessage]);
    } catch (err) {
      console.error('Erro ao carregar agente:', err);
      setError('Erro ao carregar agente');
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || !agent || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setIsTyping(true);
    setError(null);

    try {
      // Enviar mensagem para o agente via API
      const response = await fetch(`http://localhost:3001/api/agents/${agent.id}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.content,
          history: messages.slice(-10), // Últimas 10 mensagens para contexto
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Simular streaming da resposta
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Resposta não suporta streaming');
      }

      let assistantContent = '';
      let files: Message['files'] = [];
      let links: Message['links'] = [];
      let tools: Message['tools'] = [];

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '',
        timestamp: new Date().toISOString(),
        files: [],
        links: [],
        tools: [],
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Ler chunks da resposta
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = new TextDecoder().decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.type === 'content') {
                assistantContent += data.content;
                setMessages(prev => 
                  prev.map(msg => 
                    msg.id === assistantMessage.id 
                      ? { ...msg, content: assistantContent }
                      : msg
                  )
                );
              } else if (data.type === 'file') {
                files.push({
                  name: data.name,
                  content: data.content,
                  type: data.fileType || 'text',
                });
                setMessages(prev => 
                  prev.map(msg => 
                    msg.id === assistantMessage.id 
                      ? { ...msg, files: [...files] }
                      : msg
                  )
                );
              } else if (data.type === 'link') {
                links.push({
                  url: data.url,
                  title: data.title,
                  description: data.description,
                });
                setMessages(prev => 
                  prev.map(msg => 
                    msg.id === assistantMessage.id 
                      ? { ...msg, links: [...links] }
                      : msg
                  )
                );
              } else if (data.type === 'tool') {
                tools.push({
                  name: data.toolName,
                  result: data.result,
                });
                setMessages(prev => 
                  prev.map(msg => 
                    msg.id === assistantMessage.id 
                      ? { ...msg, tools: [...tools] }
                      : msg
                  )
                );
              }
            } catch (e) {
              console.warn('Erro ao processar chunk:', e);
            }
          }
        }
      }

      // Finalizar mensagem
      setMessages(prev => 
        prev.map(msg => 
          msg.id === assistantMessage.id 
            ? { 
                ...msg, 
                content: assistantContent,
                files: files,
                links: links,
                tools: tools,
              }
            : msg
        )
      );

    } catch (err: any) {
      console.error('Erro ao enviar mensagem:', err);
      setError(err.message || 'Erro ao enviar mensagem');
      
      // Adicionar mensagem de erro
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Desculpe, ocorreu um erro: ${err.message}`,
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const clearChat = () => {
    if (window.confirm('Tem certeza que deseja limpar o chat?')) {
      setMessages([]);
      if (agent) {
        const welcomeMessage: Message = {
          id: 'welcome',
          role: 'assistant',
          content: `Olá! Sou o ${agent.name}. ${agent.description || 'Como posso ajudá-lo hoje?'}`,
          timestamp: new Date().toISOString(),
        };
        setMessages([welcomeMessage]);
      }
    }
  };

  const downloadFile = (file: Message['files'][0]) => {
    const blob = new Blob([file.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const openLink = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Coletar todos os arquivos e links de todas as mensagens
  const allFiles = messages.flatMap(msg => msg.files || []);
  const allLinks = messages.flatMap(msg => msg.links || []);

  if (!agent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-purple-300">Carregando agente...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col">
      {/* Header */}
      <header className="border-b border-purple-500/20 bg-slate-900/50 backdrop-blur-xl sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/agents')}
                className="text-purple-300 hover:text-white transition"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <div className="flex items-center gap-3">
                <Bot className="w-8 h-8 text-pink-400" />
                <div>
                  <h1 className="text-2xl font-bold text-white">{agent.name}</h1>
                  <p className="text-sm text-purple-400">{agent.model} • {agent.tools?.length || 0} ferramentas</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={clearChat}
                className="flex items-center gap-2 text-red-400 hover:text-red-300 px-4 py-2 rounded-lg hover:bg-red-500/10 transition"
                title="Limpar chat"
              >
                <Trash2 className="w-4 h-4" />
                <span className="hidden sm:inline">Limpar</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="border-b border-purple-500/20 bg-slate-900/30">
        <div className="container mx-auto px-4">
          <div className="flex">
            <button
              onClick={() => setActiveTab('chat')}
              className={`px-6 py-3 font-medium transition ${
                activeTab === 'chat'
                  ? 'text-white border-b-2 border-purple-500 bg-purple-500/10'
                  : 'text-purple-400 hover:text-purple-300'
              }`}
            >
              💬 Chat ({messages.length})
            </button>
            <button
              onClick={() => setActiveTab('files')}
              className={`px-6 py-3 font-medium transition ${
                activeTab === 'files'
                  ? 'text-white border-b-2 border-purple-500 bg-purple-500/10'
                  : 'text-purple-400 hover:text-purple-300'
              }`}
            >
              📁 Arquivos ({allFiles.length})
            </button>
            <button
              onClick={() => setActiveTab('links')}
              className={`px-6 py-3 font-medium transition ${
                activeTab === 'links'
                  ? 'text-white border-b-2 border-purple-500 bg-purple-500/10'
                  : 'text-purple-400 hover:text-purple-300'
              }`}
            >
              🔗 Links ({allLinks.length})
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 flex flex-col">
        {activeTab === 'chat' && (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div className={`flex gap-3 max-w-3xl ${
                    message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                  }`}>
                    {/* Avatar */}
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                      message.role === 'user' 
                        ? 'bg-blue-500' 
                        : 'bg-pink-500'
                    }`}>
                      {message.role === 'user' ? (
                        <User className="w-4 h-4 text-white" />
                      ) : (
                        <Bot className="w-4 h-4 text-white" />
                      )}
                    </div>

                    {/* Message Content */}
                    <div className={`flex-1 ${
                      message.role === 'user' ? 'text-right' : 'text-left'
                    }`}>
                      <div className={`inline-block p-4 rounded-2xl ${
                        message.role === 'user'
                          ? 'bg-blue-500 text-white'
                          : 'bg-slate-800 text-white border border-purple-500/20'
                      }`}>
                        <div className="whitespace-pre-wrap">{message.content}</div>
                        
                        {/* Tools used */}
                        {message.tools && message.tools.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-purple-500/20">
                            <div className="text-xs text-purple-400 mb-2">🔧 Ferramentas utilizadas:</div>
                            {message.tools.map((tool, idx) => (
                              <div key={idx} className="text-xs bg-purple-500/20 rounded px-2 py-1 mb-1">
                                {tool.name}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      <div className={`text-xs text-purple-400 mt-1 ${
                        message.role === 'user' ? 'text-right' : 'text-left'
                      }`}>
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {isTyping && (
                <div className="flex gap-3 justify-start">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-pink-500 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-slate-800 text-white border border-purple-500/20 p-4 rounded-2xl">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-purple-400">Digitando...</span>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t border-purple-500/20 bg-slate-900/50 p-4">
              <div className="max-w-4xl mx-auto">
                <div className="flex gap-3">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Digite sua mensagem..."
                    disabled={isLoading}
                    className="flex-1 bg-slate-800 border border-purple-500/30 rounded-xl px-4 py-3 text-white placeholder-purple-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 outline-none transition resize-none"
                    rows={1}
                    style={{ minHeight: '48px', maxHeight: '120px' }}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!input.trim() || isLoading}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-6 py-3 rounded-xl font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </button>
                </div>
                
                {error && (
                  <div className="mt-2 text-red-400 text-sm">
                    ❌ {error}
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {activeTab === 'files' && (
          <div className="flex-1 overflow-y-auto p-4">
            {allFiles.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-purple-500/50 mx-auto mb-4" />
                <p className="text-purple-300">Nenhum arquivo gerado ainda</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {allFiles.map((file, idx) => (
                  <div key={idx} className="bg-slate-800/50 border border-purple-500/20 rounded-xl p-4 hover:border-purple-500/50 transition">
                    <div className="flex items-start justify-between mb-2">
                      <FileText className="w-5 h-5 text-purple-400 flex-shrink-0 mt-1" />
                      <button
                        onClick={() => downloadFile(file)}
                        className="text-purple-400 hover:text-purple-300 transition"
                        title="Baixar arquivo"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                    <h3 className="font-semibold text-white mb-2 truncate">{file.name}</h3>
                    <p className="text-xs text-purple-400 mb-3">Tipo: {file.type}</p>
                    <div className="text-xs text-gray-400 bg-slate-900/50 rounded p-2 max-h-20 overflow-y-auto">
                      {file.content.substring(0, 200)}
                      {file.content.length > 200 && '...'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'links' && (
          <div className="flex-1 overflow-y-auto p-4">
            {allLinks.length === 0 ? (
              <div className="text-center py-12">
                <LinkIcon className="w-16 h-16 text-purple-500/50 mx-auto mb-4" />
                <p className="text-purple-300">Nenhum link gerado ainda</p>
              </div>
            ) : (
              <div className="space-y-3">
                {allLinks.map((link, idx) => (
                  <div key={idx} className="bg-slate-800/50 border border-purple-500/20 rounded-xl p-4 hover:border-purple-500/50 transition">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-white mb-1 truncate">{link.title}</h3>
                        {link.description && (
                          <p className="text-sm text-purple-300 mb-2">{link.description}</p>
                        )}
                        <p className="text-xs text-purple-400 truncate">{link.url}</p>
                      </div>
                      <button
                        onClick={() => openLink(link.url)}
                        className="text-purple-400 hover:text-purple-300 transition ml-2 flex-shrink-0"
                        title="Abrir link"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}