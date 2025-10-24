import { useState, useEffect, useRef } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { 
  Download, Send, FileText, Image as ImageIcon, Video, Link as LinkIcon, 
  CheckCircle2, XCircle, Loader2, Play, Clock, Zap, AlertCircle 
} from 'lucide-react'
import { api } from '@/services/api'
import { toast } from 'sonner'

interface ExecutionLog {
  timestamp: string
  level: 'info' | 'warn' | 'error' | 'success'
  nodeId: string
  nodeName: string
  message: string
  input?: any
  output?: any
}

interface ExecutionFile {
  name: string
  type: string
  url?: string
  content?: string
  size?: number
}

interface ExecutionNode {
  id: string
  name: string
  type: string
  status: 'pending' | 'running' | 'success' | 'error' | 'skipped'
  startTime?: number
  endTime?: number
  duration?: number
  input?: any
  output?: any
  error?: string
}

interface ExecutionContext {
  automationName: string
  automationId: string
  status: 'running' | 'completed' | 'failed'
  nodesExecuted: number
  files: ExecutionFile[]
  logs: ExecutionLog[]
  duration?: number
  error?: string
  nodes?: ExecutionNode[]
}

interface ExecutionModalProps {
  isOpen: boolean
  onClose: () => void
  context: ExecutionContext
}

export function ExecutionModalV2({ isOpen, onClose, context }: ExecutionModalProps) {
  const [activeTab, setActiveTab] = useState<'timeline' | 'logs'>('timeline')
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'assistant' | 'system'; content: string; files?: ExecutionFile[] }>>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isSending, setIsSending] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const [executionNodes, setExecutionNodes] = useState<ExecutionNode[]>([])
  
  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])
  
  // Initialize nodes from context or create from logs
  useEffect(() => {
    if (context.nodes) {
      setExecutionNodes(context.nodes)
    } else {
      // Extract unique nodes from logs
      const nodeMap = new Map<string, ExecutionNode>()
      context.logs.forEach(log => {
        if (!nodeMap.has(log.nodeId)) {
          nodeMap.set(log.nodeId, {
            id: log.nodeId,
            name: log.nodeName,
            type: 'unknown',
            status: 'pending',
          })
        }
        
        const node = nodeMap.get(log.nodeId)!
        if (log.level === 'success') {
          node.status = 'success'
          node.output = log.output
        } else if (log.level === 'error') {
          node.status = 'error'
          node.error = log.message
        } else if (log.message.includes('Executando')) {
          node.status = 'running'
          node.input = log.input
        }
      })
      
      setExecutionNodes(Array.from(nodeMap.values()))
    }
  }, [context.logs, context.nodes])
  
  // Add initial welcome message
  useEffect(() => {
    if (context.status === 'running' && chatMessages.length === 0) {
      setChatMessages([{
        role: 'system',
        content: `🚀 Iniciando execução da automação **${context.automationName}**\n\nAcompanhe o progresso na timeline ao lado.`
      }])
    }
  }, [context.status, context.automationName])
  
  // Update chat with node execution status
  useEffect(() => {
    if (context.logs.length > 0) {
      const latestLog = context.logs[context.logs.length - 1]
      
      if (latestLog.level === 'success') {
        const newMessage: any = {
          role: 'system',
          content: `✅ **${latestLog.nodeName}** executado com sucesso`
        }
        
        // Check for files in output
        if (latestLog.output?.files) {
          newMessage.files = latestLog.output.files
          newMessage.content += `\n📁 ${latestLog.output.files.length} arquivo(s) gerado(s)`
        }
        
        // Check for links in output
        if (latestLog.output?.links || latestLog.output?.url) {
          const links = latestLog.output.links || [latestLog.output.url]
          newMessage.content += `\n🔗 ${links.length} link(s) gerado(s)`
        }
        
        setChatMessages(prev => {
          // Avoid duplicates
          if (prev[prev.length - 1]?.content === newMessage.content) return prev
          return [...prev, newMessage]
        })
      } else if (latestLog.level === 'error') {
        setChatMessages(prev => {
          const errorMsg = {
            role: 'system' as const,
            content: `❌ **${latestLog.nodeName}** falhou\n${latestLog.message}`
          }
          if (prev[prev.length - 1]?.content === errorMsg.content) return prev
          return [...prev, errorMsg]
        })
      }
    }
  }, [context.logs])
  
  // Add completion message
  useEffect(() => {
    if (context.status === 'completed') {
      const allFiles = context.files
      const duration = context.duration ? `${(context.duration / 1000).toFixed(2)}s` : 'N/A'
      
      const message: any = {
        role: 'system',
        content: `🎉 **Automação concluída com sucesso!**\n\n⏱️ Duração: ${duration}\n📦 Nós executados: ${context.nodesExecuted}` +
          (allFiles.length > 0 ? `\n📁 Arquivos gerados: ${allFiles.length}` : ''),
        files: allFiles.length > 0 ? allFiles : undefined
      }
      
      setChatMessages(prev => {
        if (prev[prev.length - 1]?.content.includes('concluída com sucesso')) return prev
        return [...prev, message]
      })
    } else if (context.status === 'failed') {
      setChatMessages(prev => {
        const failMsg = {
          role: 'system' as const,
          content: `💥 **Automação falhou**\n\n${context.error || 'Erro desconhecido'}`
        }
        if (prev[prev.length - 1]?.content.includes('Automação falhou')) return prev
        return [...prev, failMsg]
      })
    }
  }, [context.status])
  
  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isSending) return
    
    const userMessage = inputMessage.trim()
    setInputMessage('')
    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setIsSending(true)
    
    try {
      const response = await api.post(`/api/automations/${context.automationId}/chat`, {
        message: userMessage,
        executionContext: {
          status: context.status,
          duration: context.duration,
          nodesExecuted: context.nodesExecuted,
          files: context.files,
          logs: context.logs.slice(-10),
          nodes: executionNodes,
        },
      })
      
      setChatMessages(prev => [...prev, {
        role: 'assistant',
        content: response.response || response.fallback || 'Desculpe, não consegui processar sua mensagem.'
      }])
    } catch (error: any) {
      toast.error('Erro ao enviar mensagem')
      setChatMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Desculpe, ocorreu um erro. Verifique a configuração do LLM.'
      }])
    } finally {
      setIsSending(false)
    }
  }
  
  const downloadFile = (file: ExecutionFile) => {
    try {
      const blob = new Blob([file.content || ''], { type: file.type })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = file.name
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success(`Download iniciado: ${file.name}`)
    } catch (error) {
      toast.error('Erro ao baixar arquivo')
    }
  }
  
  const getStatusColor = (status: ExecutionNode['status']) => {
    switch (status) {
      case 'success': return 'text-green-500 border-green-500 bg-green-500/10'
      case 'error': return 'text-red-500 border-red-500 bg-red-500/10'
      case 'running': return 'text-blue-500 border-blue-500 bg-blue-500/10 animate-pulse'
      case 'pending': return 'text-gray-400 border-gray-400 bg-gray-400/10'
      case 'skipped': return 'text-yellow-500 border-yellow-500 bg-yellow-500/10'
    }
  }
  
  const getStatusIcon = (status: ExecutionNode['status']) => {
    switch (status) {
      case 'success': return <CheckCircle2 className="w-5 h-5" />
      case 'error': return <XCircle className="w-5 h-5" />
      case 'running': return <Loader2 className="w-5 h-5 animate-spin" />
      case 'pending': return <Clock className="w-5 h-5" />
      case 'skipped': return <AlertCircle className="w-5 h-5" />
    }
  }
  
  const getFileIcon = (type: string) => {
    if (type.includes('image')) return <ImageIcon className="w-4 h-4" />
    if (type.includes('video')) return <Video className="w-4 h-4" />
    return <FileText className="w-4 h-4" />
  }
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={context.automationName} size="xl">
      <div className="flex h-[700px] gap-4">
        {/* LEFT SIDE: Timeline */}
        <div className="w-80 flex flex-col border-r border-border pr-4">
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setActiveTab('timeline')}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === 'timeline'
                  ? 'bg-primary text-primary-foreground shadow-lg'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              ⚡ Timeline
            </button>
            <button
              onClick={() => setActiveTab('logs')}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === 'logs'
                  ? 'bg-primary text-primary-foreground shadow-lg'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              📋 Logs
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {activeTab === 'timeline' ? (
              <div className="space-y-2">
                {/* Status Header */}
                <div className={`p-3 rounded-lg border-2 ${
                  context.status === 'running' 
                    ? 'border-blue-500 bg-blue-500/10' 
                    : context.status === 'completed' 
                    ? 'border-green-500 bg-green-500/10' 
                    : 'border-red-500 bg-red-500/10'
                }`}>
                  <div className="flex items-center gap-2 mb-1">
                    {context.status === 'running' && <Loader2 className="w-4 h-4 animate-spin text-blue-500" />}
                    {context.status === 'completed' && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                    {context.status === 'failed' && <XCircle className="w-4 h-4 text-red-500" />}
                    <span className="font-bold">
                      {context.status === 'running' ? 'Executando...' : context.status === 'completed' ? 'Concluído' : 'Falhou'}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground space-y-0.5">
                    <div>⚡ {executionNodes.filter(n => n.status === 'success').length} / {executionNodes.length} nós</div>
                    {context.duration && <div>⏱️ {(context.duration / 1000).toFixed(2)}s</div>}
                  </div>
                </div>
                
                {/* Nodes Timeline */}
                <div className="relative space-y-3 pt-2">
                  {/* Vertical line */}
                  <div className="absolute left-[18px] top-0 bottom-0 w-0.5 bg-gradient-to-b from-gray-300 via-gray-200 to-transparent" />
                  
                  {executionNodes.map((node, idx) => (
                    <div key={node.id} className="relative pl-10">
                      {/* Node indicator */}
                      <div className={`absolute left-0 w-9 h-9 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${getStatusColor(node.status)}`}>
                        {getStatusIcon(node.status)}
                      </div>
                      
                      {/* Node card */}
                      <div className={`p-3 rounded-lg border transition-all duration-300 ${
                        node.status === 'running' 
                          ? 'border-blue-500 shadow-lg shadow-blue-500/20 scale-105' 
                          : node.status === 'success'
                          ? 'border-green-500/30 bg-green-500/5'
                          : node.status === 'error'
                          ? 'border-red-500/30 bg-red-500/5'
                          : 'border-border bg-muted/30'
                      }`}>
                        <div className="font-medium text-sm mb-1">{node.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {node.status === 'success' && node.duration && `✓ ${node.duration}ms`}
                          {node.status === 'error' && '✗ Erro'}
                          {node.status === 'running' && '⚡ Executando...'}
                          {node.status === 'pending' && '⏳ Aguardando...'}
                        </div>
                        
                        {/* Show error message */}
                        {node.error && (
                          <div className="mt-2 text-xs text-red-500 bg-red-500/10 p-2 rounded">
                            {node.error}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {context.logs.map((log, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg border text-xs ${
                      log.level === 'error'
                        ? 'bg-red-500/10 border-red-500/20'
                        : log.level === 'success'
                        ? 'bg-green-500/10 border-green-500/20'
                        : 'bg-muted border-border'
                    }`}
                  >
                    <div className="flex items-start gap-2 mb-1">
                      {log.level === 'error' && <XCircle className="w-3 h-3 text-red-500 flex-shrink-0 mt-0.5" />}
                      {log.level === 'success' && <CheckCircle2 className="w-3 h-3 text-green-500 flex-shrink-0 mt-0.5" />}
                      <span className="font-medium">{log.nodeName}</span>
                    </div>
                    <p className="text-muted-foreground mb-2">{log.message}</p>
                    
                    {(log.input || log.output) && (
                      <div className="space-y-1">
                        {log.input && (
                          <details className="cursor-pointer">
                            <summary className="text-muted-foreground hover:text-foreground">📥 Input</summary>
                            <pre className="mt-1 p-2 bg-background rounded text-[10px] overflow-auto max-h-24">
                              {JSON.stringify(log.input, null, 2)}
                            </pre>
                          </details>
                        )}
                        {log.output && (
                          <details className="cursor-pointer">
                            <summary className="text-muted-foreground hover:text-foreground">📤 Output</summary>
                            <pre className="mt-1 p-2 bg-background rounded text-[10px] overflow-auto max-h-24">
                              {JSON.stringify(log.output, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* RIGHT SIDE: Chat */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 overflow-y-auto space-y-3 mb-4">
            {chatMessages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] p-4 rounded-2xl ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-lg'
                      : msg.role === 'system'
                      ? 'bg-gradient-to-br from-gray-800 to-gray-900 text-gray-100 text-sm'
                      : 'bg-gradient-to-br from-purple-600 to-purple-700 text-white shadow-lg'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                  
                  {/* Files */}
                  {msg.files && msg.files.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {msg.files.map((file, fileIdx) => (
                        <div
                          key={fileIdx}
                          className="flex items-center gap-2 p-2 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20"
                        >
                          {getFileIcon(file.type)}
                          <span className="flex-1 text-sm truncate">{file.name}</span>
                          {file.size && (
                            <span className="text-xs opacity-75">
                              {(file.size / 1024).toFixed(1)}KB
                            </span>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2 hover:bg-white/20"
                            onClick={() => downloadFile(file)}
                          >
                            <Download className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {isSending && (
              <div className="flex justify-start">
                <div className="bg-gradient-to-br from-purple-600 to-purple-700 text-white p-4 rounded-2xl flex items-center gap-2 shadow-lg">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Pensando...</span>
                </div>
              </div>
            )}
            
            <div ref={chatEndRef} />
          </div>
          
          {/* Chat Input */}
          <div className="border-t border-border pt-3">
            <div className="flex gap-2">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSendMessage()
                  }
                }}
                placeholder={context.status === 'running' ? 'Aguarde conclusão...' : 'Pergunte sobre a execução...'}
                disabled={isSending || context.status === 'running'}
                className="flex-1"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isSending || context.status === 'running'}
                size="lg"
                className="px-6"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {context.status === 'running' 
                ? '⏳ Aguarde a conclusão para fazer perguntas'
                : '💡 Pergunte sobre resultados, erros, arquivos gerados, etc.'}
            </p>
          </div>
        </div>
      </div>
    </Modal>
  )
}
