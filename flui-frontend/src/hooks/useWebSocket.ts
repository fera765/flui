import { useEffect, useRef, useState } from 'react'

export interface WebSocketMessage {
  type: 'execution-log' | 'execution-complete' | string
  automationId?: string
  log?: any
  result?: any
  [key: string]: any
}

interface UseWebSocketOptions {
  onMessage?: (message: WebSocketMessage) => void
  reconnectDelay?: number
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const { onMessage, reconnectDelay = 3000 } = options
  const [isConnected, setIsConnected] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>()
  
  // ✅ FIX: Usar useRef para onMessage evitar reconexão infinita
  const onMessageRef = useRef(onMessage)
  
  // Atualizar ref quando onMessage mudar (sem causar reconexão)
  useEffect(() => {
    onMessageRef.current = onMessage
  }, [onMessage])

  useEffect(() => {
    const connect = () => {
      // Determinar URL do WebSocket baseado no ambiente
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      const host = window.location.hostname
      const port = (import.meta as any).env?.VITE_API_PORT || '3001'
      const wsUrl = `${protocol}//${host}:${port}`

      console.log('[WebSocket] Conectando a:', wsUrl)

      const ws = new WebSocket(wsUrl)

      ws.onopen = () => {
        console.log('[WebSocket] ✅ Conectado')
        setIsConnected(true)
        
        // Limpar timeout de reconexão se houver
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current)
        }
      }

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as WebSocketMessage
          console.log('[WebSocket] 📨 Mensagem recebida:', message.type)
          
          // ✅ Usar ref em vez de closure
          if (onMessageRef.current) {
            onMessageRef.current(message)
          }
        } catch (error) {
          console.error('[WebSocket] ❌ Erro ao parsear mensagem:', error)
        }
      }

      ws.onerror = (error) => {
        console.error('[WebSocket] ❌ Erro:', error)
      }

      ws.onclose = () => {
        console.log('[WebSocket] 🔌 Desconectado')
        setIsConnected(false)
        
        // Tentar reconectar após delay
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log('[WebSocket] 🔄 Tentando reconectar...')
          connect()
        }, reconnectDelay)
      }

      wsRef.current = ws
    }

    connect()

    // Cleanup
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      
      if (wsRef.current) {
        console.log('[WebSocket] 🔌 Fechando conexão')
        wsRef.current.close()
      }
    }
  }, [reconnectDelay])  // ✅ FIX: Remover onMessage das dependencies

  return { isConnected, ws: wsRef.current }
}
