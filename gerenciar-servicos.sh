#!/bin/bash

# Script para gerenciar Backend e Frontend

case "$1" in
  start)
    echo "🚀 Iniciando serviços..."
    echo ""
    echo "📡 Backend (http://localhost:3001)..."
    cd /workspace && npx tsx source/startApi.ts > /tmp/api-server.log 2>&1 &
    echo $! > /tmp/api-server.pid
    echo "   PID: $(cat /tmp/api-server.pid)"
    
    sleep 2
    
    echo ""
    echo "🎨 Frontend (http://localhost:5173)..."
    cd /workspace/flui-frontend-vite && npm run dev > /tmp/frontend.log 2>&1 &
    echo $! > /tmp/frontend.pid
    echo "   PID: $(cat /tmp/frontend.pid)"
    
    sleep 3
    
    echo ""
    echo "✅ Serviços iniciados!"
    echo ""
    echo "Para ver logs:"
    echo "  Backend:  tail -f /tmp/api-server.log"
    echo "  Frontend: tail -f /tmp/frontend.log"
    ;;
    
  stop)
    echo "🛑 Parando serviços..."
    
    if [ -f /tmp/api-server.pid ]; then
      kill $(cat /tmp/api-server.pid) 2>/dev/null
      rm /tmp/api-server.pid
      echo "   ✓ Backend parado"
    fi
    
    if [ -f /tmp/frontend.pid ]; then
      kill $(cat /tmp/frontend.pid) 2>/dev/null
      rm /tmp/frontend.pid
      echo "   ✓ Frontend parado"
    fi
    
    # Garantir que processos foram terminados
    pkill -f "tsx source/startApi.ts" 2>/dev/null
    pkill -f "vite" 2>/dev/null
    
    echo ""
    echo "✅ Serviços parados!"
    ;;
    
  status)
    echo "📊 Status dos serviços:"
    echo ""
    
    # Backend
    if curl -s http://localhost:3001/api/tools > /dev/null 2>&1; then
      echo "  Backend:  ✅ ATIVO (http://localhost:3001)"
      TOOLS=$(curl -s http://localhost:3001/api/tools | grep -o '"id"' | wc -l)
      echo "            $TOOLS ferramentas registradas"
    else
      echo "  Backend:  ❌ INATIVO"
    fi
    
    # Frontend
    if curl -s http://localhost:5173 > /dev/null 2>&1; then
      echo "  Frontend: ✅ ATIVO (http://localhost:5173)"
    else
      echo "  Frontend: ❌ INATIVO"
    fi
    ;;
    
  test)
    echo "🧪 Executando testes de validação..."
    echo ""
    node /workspace/test-validacao-completa.mjs
    ;;
    
  logs)
    echo "📋 Logs dos serviços:"
    echo ""
    echo "=== BACKEND ==="
    tail -20 /tmp/api-server.log 2>/dev/null || echo "Sem logs"
    echo ""
    echo "=== FRONTEND ==="
    tail -20 /tmp/frontend.log 2>/dev/null || echo "Sem logs"
    ;;
    
  *)
    echo "Uso: $0 {start|stop|status|test|logs}"
    echo ""
    echo "Comandos:"
    echo "  start   - Inicia Backend e Frontend"
    echo "  stop    - Para todos os serviços"
    echo "  status  - Verifica status dos serviços"
    echo "  test    - Executa testes de validação"
    echo "  logs    - Mostra logs dos serviços"
    exit 1
    ;;
esac
