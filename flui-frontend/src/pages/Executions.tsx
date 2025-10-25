import { useState, useEffect } from 'react'
import { api } from '@/services/api'
import { useWebSocket } from '@/hooks/useWebSocket'
import { Button } from '@/components/ui/Button'
import { 
  Clock, CheckCircle2, XCircle, Loader2, Ban, RefreshCw, 
  Filter, Trash2, BarChart3 
} from 'lucide-react'
import { toast } from 'sonner'

interface Execution {
  id: string
  automationId: string
  automationName: string
  triggerType: 'manual' | 'webhook' | 'cron'
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
  priority: number
  createdAt: string
  startedAt?: string
  completedAt?: string
  retries: number
  maxRetries: number
  error?: string
  sandboxPath?: string
}

interface QueueStats {
  queued: number
  running: number
  completed: number
  maxConcurrency: number
}

export function Executions() {
  const [executions, setExecutions] = useState<Execution[]>([])
  const [stats, setStats] = useState<QueueStats>({ queued: 0, running: 0, completed: 0, maxConcurrency: 5 })
  const [isLoading, setIsLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterAutomation, setFilterAutomation] = useState<string>('')

  // WebSocket para updates em tempo real
  useWebSocket({
    onMessage: (message: any) => {
      if (message.type === 'execution-started' || 
          message.type === 'execution-completed' || 
          message.type === 'execution-failed') {
        loadExecutions()
        loadStats()
      }
    },
  })

  const loadExecutions = async () => {
    try {
      const params = new URLSearchParams()
      if (filterStatus !== 'all') params.append('status', filterStatus)
      if (filterAutomation) params.append('automationId', filterAutomation)
      params.append('limit', '50')

      const response: any = await api.get(`/api/executions?${params.toString()}`)
      setExecutions(response.executions || [])
    } catch (error: any) {
      console.error('Erro ao carregar execuções:', error)
      toast.error('Erro ao carregar execuções')
    } finally {
      setIsLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const response: any = await api.get('/api/executions-stats')
      setStats(response.stats || { queued: 0, running: 0, completed: 0, maxConcurrency: 5 })
    } catch (error: any) {
      console.error('Erro ao carregar estatísticas:', error)
    }
  }

  useEffect(() => {
    loadExecutions()
    loadStats()

    // Auto-refresh a cada 3 segundos
    const interval = setInterval(() => {
      loadExecutions()
      loadStats()
    }, 3000)

    return () => clearInterval(interval)
  }, [filterStatus, filterAutomation])

  const handleCancelExecution = async (id: string) => {
    try {
      await api.post(`/api/executions/${id}/cancel`)
      toast.success('Execução cancelada')
      loadExecutions()
    } catch (error: any) {
      toast.error('Erro ao cancelar', {
        description: error.response?.data?.error || error.message,
      })
    }
  }

  const handleClearCompleted = async () => {
    try {
      const response: any = await api.delete('/api/executions/completed')
      toast.success(`${response.cleared} execuções limpas`)
      loadExecutions()
    } catch (error: any) {
      toast.error('Erro ao limpar execuções')
    }
  }

  const getStatusIcon = (status: Execution['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-5 h-5 text-gray-400" />
      case 'running':
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />
      case 'cancelled':
        return <Ban className="w-5 h-5 text-gray-500" />
    }
  }

  const getStatusBadge = (status: Execution['status']) => {
    const colors = {
      pending: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
      running: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      completed: 'bg-green-500/10 text-green-400 border-green-500/20',
      failed: 'bg-red-500/10 text-red-400 border-red-500/20',
      cancelled: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
    }

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded border ${colors[status]}`}>
        {status.toUpperCase()}
      </span>
    )
  }

  const getTriggerBadge = (type: Execution['triggerType']) => {
    const colors = {
      manual: 'bg-purple-500/10 text-purple-400',
      webhook: 'bg-orange-500/10 text-orange-400',
      cron: 'bg-blue-500/10 text-blue-400',
    }

    const icons = {
      manual: '👆',
      webhook: '🔗',
      cron: '⏰',
    }

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded ${colors[type]}`}>
        {icons[type]} {type}
      </span>
    )
  }

  const formatDuration = (execution: Execution) => {
    if (!execution.startedAt) return '-'

    const end = execution.completedAt ? new Date(execution.completedAt) : new Date()
    const start = new Date(execution.startedAt)
    const duration = end.getTime() - start.getTime()

    if (duration < 1000) return `${duration}ms`
    if (duration < 60000) return `${(duration / 1000).toFixed(1)}s`
    return `${(duration / 60000).toFixed(1)}m`
  }

  return (
    <div className="flex-1 overflow-auto bg-background">
      <div className="max-w-7xl mx-auto p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Execuções</h1>
          <p className="text-muted-foreground">
            Monitore e gerencie todas as execuções de automações
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/20 rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Na Fila</span>
              <Clock className="w-5 h-5 text-blue-400" />
            </div>
            <p className="text-3xl font-bold text-blue-400">{stats.queued}</p>
          </div>

          <div className="bg-gradient-to-br from-orange-500/10 to-orange-600/10 border border-orange-500/20 rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Executando</span>
              <Loader2 className="w-5 h-5 text-orange-400 animate-spin" />
            </div>
            <p className="text-3xl font-bold text-orange-400">{stats.running}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Max: {stats.maxConcurrency}
            </p>
          </div>

          <div className="bg-gradient-to-br from-green-500/10 to-green-600/10 border border-green-500/20 rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Completas</span>
              <CheckCircle2 className="w-5 h-5 text-green-400" />
            </div>
            <p className="text-3xl font-bold text-green-400">{stats.completed}</p>
          </div>

          <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border border-purple-500/20 rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Taxa</span>
              <BarChart3 className="w-5 h-5 text-purple-400" />
            </div>
            <p className="text-3xl font-bold text-purple-400">
              {stats.running > 0 ? `${Math.round((stats.running / stats.maxConcurrency) * 100)}%` : '0%'}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Filtros:</span>
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 bg-background border border-input rounded-md text-sm"
          >
            <option value="all">Todos os status</option>
            <option value="pending">Pendentes</option>
            <option value="running">Executando</option>
            <option value="completed">Completas</option>
            <option value="failed">Falhas</option>
            <option value="cancelled">Canceladas</option>
          </select>

          <div className="flex-1"></div>

          <Button variant="outline" size="sm" onClick={loadExecutions}>
            <RefreshCw className="w-4 h-4 mr-1" />
            Atualizar
          </Button>

          <Button variant="outline" size="sm" onClick={handleClearCompleted}>
            <Trash2 className="w-4 h-4 mr-1" />
            Limpar Completas
          </Button>
        </div>

        {/* Executions List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : executions.length === 0 ? (
          <div className="text-center py-20">
            <Clock className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-lg text-muted-foreground">Nenhuma execução encontrada</p>
            <p className="text-sm text-muted-foreground mt-2">
              Execute uma automação para ver aqui
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {executions.map((execution) => (
              <div
                key={execution.id}
                className="bg-card border border-border rounded-lg p-4 hover:border-primary/50 transition-colors"
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className="pt-1">{getStatusIcon(execution.status)}</div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold truncate">{execution.automationName}</h3>
                      {getStatusBadge(execution.status)}
                      {getTriggerBadge(execution.triggerType)}
                    </div>

                    <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm text-muted-foreground">
                      <div>
                        <span className="font-mono text-xs">{execution.id}</span>
                      </div>
                      <div>
                        Criada: {new Date(execution.createdAt).toLocaleString('pt-BR')}
                      </div>

                      {execution.startedAt && (
                        <>
                          <div>Iniciada: {new Date(execution.startedAt).toLocaleString('pt-BR')}</div>
                          <div>Duração: {formatDuration(execution)}</div>
                        </>
                      )}

                      {execution.completedAt && (
                        <div>
                          Concluída: {new Date(execution.completedAt).toLocaleString('pt-BR')}
                        </div>
                      )}

                      {execution.retries > 0 && (
                        <div>
                          Tentativas: {execution.retries}/{execution.maxRetries}
                        </div>
                      )}

                      {execution.sandboxPath && (
                        <div className="col-span-2">
                          <span className="font-mono text-xs bg-muted px-2 py-1 rounded">
                            {execution.sandboxPath.split('/').pop()}
                          </span>
                        </div>
                      )}

                      {execution.error && (
                        <div className="col-span-2 text-red-400">
                          ❌ {execution.error}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    {execution.status === 'pending' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCancelExecution(execution.id)}
                      >
                        <Ban className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
