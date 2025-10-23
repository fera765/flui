/**
 * FLUI - Agent Chat Page
 * 
 * Página dedicada para chat com agentes individuais
 * Suporta:
 * - Chat em tempo real
 * - Ferramentas injetadas
 * - Visualização de arquivos gerados
 * - Visualização de links gerados
 */

import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, 
  Send, 
  Bot, 
  User, 
  Loader2, 
  FileText, 
  Link as LinkIcon,
  Settings,
  Trash2,
  Download,
  ExternalLink
} from 'lucide-react';

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

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  toolCalls?: Array<{
    tool: string;
    input: any;
    output: any;
  }>;
}

interface GeneratedFile {
  id: string;
  name: string;
  content: string;
  type: string;
  timestamp: Date;
}

interface GeneratedLink {
  id: string;
  url: string;
  title: string;
  timestamp: Date;
}

export default function AgentChat() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'files' | 'links'>('chat');
  const [generatedFiles, setGeneratedFiles] = useState<GeneratedFile[]>([]);
  const [generatedLinks, setGeneratedLinks] = useState<GeneratedLink[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [llmConfig, setLLMConfig] = useState(() => {
    const saved = localStorage.getItem('llmConfig');
    return saved ? JSON.parse(saved) : {
      endpoint: 'https://api.llm7.io/v1',
      apiKey: '',
      defaultModel: 'gpt-4',
    };
  });

  useEffect(() => {
    if (id) {
      loadAgent(id);
    }
  }, [id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadAgent = async (agentId: string) => {
    try {
      setLoading(true);
      const res = await fetch(`http://localhost:3001/api/agents/${agentId}`);
      
      if (!res.ok) {
        throw new Error('Agente não encontrado');
      }

      const data = await res.json();
      setAgent(data);
    } catch (err) {
      console.error('Erro ao carregar agente:', err);
      alert('Erro ao carregar agente');
      navigate('/agents');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || !agent || sending) return;

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setSending(true);

    try {
      // Preparar headers
      const headers: any = {
        'Content-Type': 'application/json',
      };
      
      if (llmConfig.apiKey) {
        headers['Authorization'] = `Bearer ${llmConfig.apiKey}`;
      }

      // Preparar mensagens no formato da API
      const apiMessages = messages.map(m => ({
        role: m.role,
        content: m.content,
      }));
      apiMessages.push({
        role: 'user',
        content: userMessage.content,
      });

      // Adicionar system prompt
      const requestBody: any = {
        model: agent.model,
        messages: [
          { role: 'system', content: agent.systemPrompt },
          ...apiMessages,
        ],
        temperature: agent.temperature,
        max_tokens: agent.maxTokens,
      };

      // Adicionar tools se o agente tiver
      if (agent.tools && agent.tools.length > 0) {
        // Buscar metadados das tools
        const toolsMetadata = await Promise.all(
          agent.tools.map(async (toolId) => {
            try {
              const res = await fetch(`http://localhost:3001/api/tools/${toolId}`);
              return await res.json();
            } catch {
              return null;
            }
          })
        );

        // Converter para formato OpenAI tools
        requestBody.tools = toolsMetadata
          .filter(Boolean)
          .map((tool: any) => ({
            type: 'function',
            function: {
              name: tool.id,
              description: tool.description,
              parameters: {
                type: 'object',
                properties: tool.params?.reduce((acc: any, param: any) => {
                  acc[param.name] = {
                    type: param.type,
                    description: param.description,
                  };
                  return acc;
                }, {}),
                required: tool.params?.filter((p: any) => p.required).map((p: any) => p.name) || [],
              },
            },
          }));
      }

      // Chamar API
      const response = await fetch(`${llmConfig.endpoint}/chat/completions`, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Erro na resposta da API');
      }

      const data = await response.json();
      const assistantMessage = data.choices[0].message;

      // Extrair tool calls se houver
      const toolCalls = assistantMessage.tool_calls?.map((tc: any) => ({
        tool: tc.function.name,
        input: JSON.parse(tc.function.arguments),
        output: null, // TODO: executar tool e pegar output
      }));

      // Extrair arquivos e links do conteúdo
      extractFilesAndLinks(assistantMessage.content);

      const newMessage: Message = {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: assistantMessage.content,
        timestamp: new Date(),
        toolCalls,
      };

      setMessages(prev => [...prev, newMessage]);
    } catch (error: any) {
      console.error('❌ Erro ao enviar mensagem:', error);
      
      const errorMessage: Message = {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: `Erro: ${error.message}`,
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setSending(false);
    }
  };

  const extractFilesAndLinks = (content: string) => {
    // Extrair links (formato markdown [text](url))
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    let match;
    while ((match = linkRegex.exec(content)) !== null) {
      const [, title, url] = match;
      if (url.startsWith('http')) {
        setGeneratedLinks(prev => [...prev, {
          id: `link-${Date.now()}-${Math.random()}`,
          url,
          title,
          timestamp: new Date(),
        }]);
      }
    }

    // Extrair blocos de código (podem ser arquivos)
    const codeBlockRegex = /```(\w+)?\n([\s\S]+?)```/g;
    while ((match = codeBlockRegex.exec(content)) !== null) {
      const [, language, code] = match;
      setGeneratedFiles(prev => [...prev, {
        id: `file-${Date.now()}-${Math.random()}`,
        name: `file.${language || 'txt'}`,
        content: code,
        type: language || 'text',
        timestamp: new Date(),
      }]);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const clearChat = () => {
    if (window.confirm('Limpar todo o histórico de chat?')) {
      setMessages([]);
      setGeneratedFiles([]);
      setGeneratedLinks([]);
    }
  };

  const downloadFile = (file: GeneratedFile) => {
    const blob = new Blob([file.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-purple-300">Carregando agente...</p>
        </div>
      </div>
    );
  }

  if (!agent) {
    return null;
  }

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="border-b border-purple-500/20 bg-slate-900/50 backdrop-blur-xl">
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
                <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl">
                  <Bot className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">{agent.name}</h1>
                  <p className="text-sm text-purple-400">{agent.model}</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={clearChat}
                className="flex items-center gap-2 px-4 py-2 text-red-400 hover:bg-red-500/10 rounded-lg transition"
                title="Limpar chat"
              >
                <Trash2 className="w-4 h-4" />
                <span className="hidden sm:inline">Limpar</span>
              </button>
              
              <button
                onClick={() => navigate(`/agents/${agent.id}/edit`)}
                className="flex items-center gap-2 px-4 py-2 text-purple-300 hover:bg-purple-500/10 rounded-lg transition"
                title="Configurações"
              >
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline">Config</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="border-b border-purple-500/20 bg-slate-900/30">
        <div className="container mx-auto px-4">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab('chat')}
              className={`px-6 py-3 font-medium transition relative ${
                activeTab === 'chat'
                  ? 'text-white'
                  : 'text-purple-400 hover:text-purple-300'
              }`}
            >
              Chat
              {activeTab === 'chat' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 to-pink-500"></div>
              )}
            </button>
            
            <button
              onClick={() => setActiveTab('files')}
              className={`px-6 py-3 font-medium transition relative ${
                activeTab === 'files'
                  ? 'text-white'
                  : 'text-purple-400 hover:text-purple-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Arquivos
                {generatedFiles.length > 0 && (
                  <span className="px-2 py-0.5 bg-purple-500 text-white text-xs rounded-full">
                    {generatedFiles.length}
                  </span>
                )}
              </div>
              {activeTab === 'files' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 to-pink-500"></div>
              )}
            </button>
            
            <button
              onClick={() => setActiveTab('links')}
              className={`px-6 py-3 font-medium transition relative ${
                activeTab === 'links'
                  ? 'text-white'
                  : 'text-purple-400 hover:text-purple-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <LinkIcon className="w-4 h-4" />
                Links
                {generatedLinks.length > 0 && (
                  <span className="px-2 py-0.5 bg-purple-500 text-white text-xs rounded-full">
                    {generatedLinks.length}
                  </span>
                )}
              </div>
              {activeTab === 'links' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 to-pink-500"></div>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'chat' && (
          <div className="h-full flex flex-col">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div className="container mx-auto max-w-4xl">
                {messages.length === 0 ? (
                  <div className="text-center py-12">
                    <Bot className="w-16 h-16 text-purple-500/50 mx-auto mb-4" />
                    <p className="text-purple-300 mb-2">Nenhuma mensagem ainda</p>
                    <p className="text-purple-400/70 text-sm">
                      Comece uma conversa com {agent.name}
                    </p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex gap-3 mb-4 ${
                        message.role === 'user' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      {message.role === 'assistant' && (
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                            <Bot className="w-5 h-5 text-white" />
                          </div>
                        </div>
                      )}
                      
                      <div
                        className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                          message.role === 'user'
                            ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                            : 'bg-slate-800/50 text-purple-100 border border-purple-500/20'
                        }`}
                      >
                        <div className="whitespace-pre-wrap break-words">
                          {message.content}
                        </div>
                        
                        {message.toolCalls && message.toolCalls.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-purple-500/20">
                            <p className="text-xs text-purple-300 mb-1">🔧 Ferramentas usadas:</p>
                            {message.toolCalls.map((tc, idx) => (
                              <div key={idx} className="text-xs text-purple-400 bg-slate-900/50 rounded px-2 py-1 mb-1">
                                {tc.tool}
                              </div>
                            ))}
                          </div>
                        )}
                        
                        <div className="text-xs text-purple-400/70 mt-1">
                          {message.timestamp.toLocaleTimeString()}
                        </div>
                      </div>
                      
                      {message.role === 'user' && (
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                            <User className="w-5 h-5 text-white" />
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Input */}
            <div className="border-t border-purple-500/20 bg-slate-900/50 backdrop-blur-xl p-4">
              <div className="container mx-auto max-w-4xl">
                <div className="flex gap-2">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Digite sua mensagem... (Enter para enviar)"
                    rows={1}
                    disabled={sending}
                    className="flex-1 px-4 py-3 bg-slate-800/50 border border-purple-500/30 rounded-xl text-white placeholder-purple-400/50 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 outline-none transition resize-none"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!input.trim() || sending}
                    className="px-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg flex items-center gap-2"
                  >
                    {sending ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span className="hidden sm:inline">Enviando...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        <span className="hidden sm:inline">Enviar</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'files' && (
          <div className="h-full overflow-y-auto p-4">
            <div className="container mx-auto max-w-4xl">
              {generatedFiles.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 text-purple-500/50 mx-auto mb-4" />
                  <p className="text-purple-300 mb-2">Nenhum arquivo gerado ainda</p>
                  <p className="text-purple-400/70 text-sm">
                    Arquivos gerados durante o chat aparecerão aqui
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {generatedFiles.map((file) => (
                    <div
                      key={file.id}
                      className="bg-slate-800/50 border border-purple-500/20 rounded-xl p-4 hover:border-purple-500/50 transition"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <FileText className="w-5 h-5 text-purple-400" />
                          <span className="font-medium text-white">{file.name}</span>
                          <span className="text-xs text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded">
                            {file.type}
                          </span>
                        </div>
                        <button
                          onClick={() => downloadFile(file)}
                          className="flex items-center gap-1 px-3 py-1 text-purple-300 hover:bg-purple-500/10 rounded-lg transition text-sm"
                        >
                          <Download className="w-4 h-4" />
                          Download
                        </button>
                      </div>
                      <pre className="text-xs bg-slate-900/50 text-purple-100 p-3 rounded-lg overflow-x-auto">
                        {file.content}
                      </pre>
                      <div className="text-xs text-purple-400/70 mt-2">
                        {file.timestamp.toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'links' && (
          <div className="h-full overflow-y-auto p-4">
            <div className="container mx-auto max-w-4xl">
              {generatedLinks.length === 0 ? (
                <div className="text-center py-12">
                  <LinkIcon className="w-16 h-16 text-purple-500/50 mx-auto mb-4" />
                  <p className="text-purple-300 mb-2">Nenhum link gerado ainda</p>
                  <p className="text-purple-400/70 text-sm">
                    Links mencionados durante o chat aparecerão aqui
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {generatedLinks.map((link) => (
                    <a
                      key={link.id}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block bg-slate-800/50 border border-purple-500/20 rounded-xl p-4 hover:border-purple-500/50 transition group"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <LinkIcon className="w-5 h-5 text-purple-400 flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-white truncate group-hover:text-purple-300 transition">
                              {link.title}
                            </p>
                            <p className="text-xs text-purple-400 truncate">{link.url}</p>
                          </div>
                        </div>
                        <ExternalLink className="w-4 h-4 text-purple-400 flex-shrink-0 ml-2" />
                      </div>
                      <div className="text-xs text-purple-400/70 mt-2">
                        {link.timestamp.toLocaleString()}
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
