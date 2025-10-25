import { useState, useEffect, useRef } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Download, Send, FileText, Image as ImageIcon, Video, Link as LinkIcon, CheckCircle2, XCircle, Loader2 } from 'lucide-react'
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

interface ExecutionContext {
  automationName: string
  automationId: string
  status: 'running' | 'completed' | 'failed'
  nodesExecuted: number
  files: ExecutionFile[]
  logs: ExecutionLog[]
  duration?: number
  error?: string
}

interface ExecutionModalProps {
  isOpen: boolean
  onClose: () => void
  context: ExecutionContext
  onNodeStatusChange?: (nodeId: string, status: 'running' | 'success' | 'error') => void
}

export function ExecutionModal({ isOpen, onClose, context, onNodeStatusChange }: ExecutionModalProps) {
  const [activeTab, setActiveTab] = useState<'chat' | 'logs'>('chat')
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'assistant' | 'system'; content: string }>>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isSending, setIsSending] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)
  
  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])
  
  // Adicionar mensagem inicial quando execução começar
  useEffect(() => {
    if (context.status === 'running') {
      setChatMessages([{
        role: 'system',
        content: `🚀 Executando automação "${context.automationName}"...`
      }])
    }
  }, [context.status, context.automationName])
  
  // Adicionar logs ao chat em tempo real
  useEffect(() => {
    if (context.logs.length > chatMessages.filter(m => m.role === 'system').length) {
      const latestLog = context.logs[context.logs.length - 1]
      
      // Notificar mudança de status do nó
      if (onNodeStatusChange && latestLog) {
        if (latestLog.level === 'success') {
          onNodeStatusChange(latestLog.nodeId, 'success')
        } else if (latestLog.level === 'error') {
          onNodeStatusChange(latestLog.nodeId, 'error')
        } else if (latestLog.message.includes('Executando')) {
          onNodeStatusChange(latestLog.nodeId, 'running')
        }
      }
      
      // Adicionar ao chat se for relevante
      if (latestLog.level === 'success' || latestLog.level === 'error' || latestLog.message.includes('✅') || latestLog.message.includes('❌')) {
        const icon = latestLog.level === 'success' ? '✅' : latestLog.level === 'error' ? '❌' : 'ℹ️'
        setChatMessages(prev => [...prev, {
          role: 'system',
          content: `${icon} **${latestLog.nodeName}**: ${latestLog.message}`
        }])
      }
    }
  }, [context.logs])
  
  // Adicionar mensagem final
  useEffect(() => {
    if (context.status === 'completed') {
      const filesMsg = context.files.length > 0 
        ? `\n\n📁 **Arquivos gerados**: ${context.files.length}`
        : ''
      
      setChatMessages(prev => [...prev, {
        role: 'system',
        content: `✅ Automação concluída com sucesso! ${filesMsg}\n⏱️ Duração: ${context.duration}ms`
      }])
    } else if (context.status === 'failed') {
      setChatMessages(prev => [...prev, {
        role: 'system',
        content: `❌ Automação falhou: ${context.error || 'Erro desconhecido'}`
      }])
    }
  }, [context.status])
  
  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isSending) return
    
    const userMessage = inputMessage.trim()
    setInputMessage('')
    
    // Adicionar mensagem do usuário
    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }])
    
    setIsSending(true)
    
    try {
      // Chamar API de chat
      const response = await api.post(`/api/automations/${context.automationId}/chat`, {
        message: userMessage,
        executionContext: {
          status: context.status,
          duration: context.duration,
          nodesExecuted: context.nodesExecuted,
          files: context.files,
          logs: context.logs.slice(0, 10), // Últimos 10 logs
        },
      })
      
      // Adicionar resposta do assistente
      const apiResponse: any = response
      setChatMessages(prev => [...prev, {
        role: 'assistant',
        content: apiResponse.response || apiResponse.fallback || 'Desculpe, não consegui processar sua mensagem.'
      }])
      
    } catch (error: any) {
      toast.error('Erro ao enviar mensagem', {
        description: error.message
      })
      
      setChatMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Desculpe, ocorreu um erro ao processar sua mensagem. Verifique se a configuração do LLM está correta.'
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
      
      toast.success('Download iniciado', {
        description: file.name
      })
    } catch (error: any) {
      toast.error('Erro ao baixar arquivo', {
        description: error.message
      })
    }
  }
  
  const getFileIcon = (type: string) => {
    if (type.includes('image')) return <ImageIcon className="w-4 h-4" />
    if (type.includes('video')) return <Video className="w-4 h-4" />
    if (type.includes('text') || type.includes('markdown')) return <FileText className="w-4 h-4" />
    return <FileText className="w-4 h-4" />
  }
  
  const renderFilePreview = (file: ExecutionFile) => {
    if (file.type.includes('image') && file.url) {
      return (
        <div className="mt-2 rounded-lg overflow-hidden border border-border">
          <img src={file.url} alt={file.name} className="max-w-full max-h-48 object-contain" />
        </div>
      )
    }
    
    if (file.type.includes('text') || file.type.includes('markdown')) {
      return (
        <div className="mt-2 p-3 bg-muted rounded-lg text-sm font-mono max-h-32 overflow-auto">
          <pre className="whitespace-pre-wrap">{file.content?.substring(0, 200)}{(file.content?.length || 0) > 200 ? '...' : ''}</pre>
        </div>
      )
    }
    
    return null
  }
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Execução: ${context.automationName}`} size="xl">
      <div className="flex flex-col h-[600px]">
        {/* Tabs */}
        <div className="flex border-b border-border mb-4">
          <button
            onClick={() => setActiveTab('chat')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'chat'
                ? 'text-primary border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            💬 Chat
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'logs'
                ? 'text-primary border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            📋 Logs ({context.logs.length})
          </button>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'chat' ? (
            <div className="flex flex-col h-full">
              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                {chatMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] p-3 rounded-lg ${
                        msg.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : msg.role === 'system'
                          ? 'bg-muted text-muted-foreground text-sm'
                          : 'bg-accent text-accent-foreground'
                      }`}
                    >
                      <div className="whitespace-pre-wrap markdown-content">
                        {msg.content}
                      </div>
                      
                      {/* Renderizar arquivos se mencionados */}
                      {msg.role === 'system' && msg.content.includes('Arquivos gerados') && context.files.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {context.files.map((file, fileIdx) => (
                            <div
                              key={fileIdx}
                              className="flex items-center gap-2 p-2 bg-background rounded border border-border"
                            >
                              {getFileIcon(file.type)}
                              <span className="flex-1 text-sm">{file.name}</span>
                              <span className="text-xs text-muted-foreground">
                                {file.size ? `${(file.size / 1024).toFixed(1)}KB` : ''}
                              </span>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => downloadFile(file)}
                              >
                                <Download className="w-3 h-3" />
                              </Button>
                            </div>
                          ))}
                          
                          {/* Preview do primeiro arquivo se for imagem ou texto */}
                          {context.files[0] && renderFilePreview(context.files[0])}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                
                {isSending && (
                  <div className="flex justify-start">
                    <div className="bg-accent text-accent-foreground p-3 rounded-lg flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm">Pensando...</span>
                    </div>
                  </div>
                )}
                
                <div ref={chatEndRef} />
              </div>
              
              {/* Chat Input */}
              <div className="pt-4 border-t border-border">
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
                    placeholder="Pergunte sobre a automação..."
                    disabled={isSending || context.status === 'running'}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!inputMessage.trim() || isSending || context.status === 'running'}
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {context.status === 'running' 
                    ? '⏳ Aguarde a conclusão para fazer perguntas...'
                    : '💡 Pergunte sobre a execução, arquivos gerados, erros, etc.'}
                </p>
              </div>
            </div>
          ) : (
            <div className="h-full overflow-y-auto space-y-2">
              {context.logs.map((log, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-lg border ${
                    log.level === 'error'
                      ? 'bg-destructive/10 border-destructive/20'
                      : log.level === 'warn'
                      ? 'bg-yellow-500/10 border-yellow-500/20'
                      : log.level === 'success'
                      ? 'bg-green-500/10 border-green-500/20'
                      : 'bg-muted border-border'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {log.level === 'error' ? (
                      <XCircle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
                    ) : log.level === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                    ) : (
                      <div className="w-4 h-4 flex-shrink-0" />
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">{log.nodeName}</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-2">{log.message}</p>
                      
                      {/* Input/Output */}
                      {(log.input || log.output) && (
                        <div className="space-y-2 mt-2">
                          {log.input && (
                            <details className="text-xs">
                              <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                                📥 Input
                              </summary>
                              <pre className="mt-1 p-2 bg-background rounded border border-border overflow-auto max-h-32">
                                {JSON.stringify(log.input, null, 2)}
                              </pre>
                            </details>
                          )}
                          
                          {log.output && (
                            <details className="text-xs">
                              <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                                📤 Output
                              </summary>
                              <pre className="mt-1 p-2 bg-background rounded border border-border overflow-auto max-h-32">
                                {JSON.stringify(log.output, null, 2)}
                              </pre>
                            </details>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="pt-4 border-t border-border flex justify-between items-center">
          <div className="text-sm text-muted-foreground">
            {context.status === 'running' && (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Executando... ({context.nodesExecuted} nós)
              </span>
            )}
            {context.status === 'completed' && (
              <span className="text-green-500 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Concluído em {context.duration}ms
              </span>
            )}
            {context.status === 'failed' && (
              <span className="text-destructive flex items-center gap-2">
                <XCircle className="w-4 h-4" />
                Falhou
              </span>
            )}
          </div>
          
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </div>
    </Modal>
  )
}
