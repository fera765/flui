#!/bin/bash

echo "🚀 FLUI v3.5 - Script de Execução para Termux"
echo ""
echo "📋 IMPORTANTE: Use VITE, não Next.js!"
echo ""

# Terminal 1: Backend + CLI
echo "▶️  Iniciando Backend + CLI..."
echo ""
npm start &
BACKEND_PID=$!

sleep 3

echo ""
echo "✅ Backend rodando (PID: $BACKEND_PID)"
echo "✅ CLI disponível no terminal"
echo "✅ API rodando em http://localhost:3001"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🌐 Para iniciar o frontend:"
echo ""
echo "  Em outro terminal, execute:"
echo "  $ cd flui-frontend-vite"
echo "  $ npm run dev"
echo ""
echo "  Acesse: http://localhost:8080"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🛑 Para parar: Ctrl+C"
echo ""

wait $BACKEND_PID
