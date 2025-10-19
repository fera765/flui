#!/bin/bash

# FLUI - Script de Inicialização Completa
# Este script inicia todo o sistema FLUI

echo "════════════════════════════════════════════════════"
echo "         🚀 FLUI - Iniciando Sistema"
echo "════════════════════════════════════════════════════"
echo ""

# Verificar se está no diretório correto
if [ ! -f "package.json" ]; then
    echo "❌ Erro: Execute este script na raiz do projeto (/workspace)"
    exit 1
fi

echo "📦 Verificando builds..."
if [ ! -f "dist/cli.js" ]; then
    echo "⚙️  Build não encontrado. Construindo..."
    npm run build
fi

if [ ! -f "flui-frontend-vite/dist/index.html" ]; then
    echo "⚙️  Frontend build não encontrado. Construindo..."
    cd flui-frontend-vite
    npm run build
    cd ..
fi

echo "✅ Builds prontos!"
echo ""

echo "════════════════════════════════════════════════════"
echo "  Escolha como deseja iniciar o FLUI:"
echo "════════════════════════════════════════════════════"
echo ""
echo "  1) Iniciar API Server (backend)"
echo "  2) Iniciar Frontend (interface web)"
echo "  3) Iniciar CLI (terminal interativo)"
echo "  4) Iniciar TUDO (API + Frontend)"
echo "  5) Apenas rodar testes"
echo "  0) Sair"
echo ""
read -p "Escolha uma opção (1-5): " option

case $option in
    1)
        echo ""
        echo "🚀 Iniciando API Server..."
        echo "📍 Acesse: http://localhost:3001"
        echo ""
        npm start
        ;;
    2)
        echo ""
        echo "🚀 Iniciando Frontend..."
        echo "📍 Acesse: http://localhost:5173"
        echo ""
        cd flui-frontend-vite
        npm run dev
        ;;
    3)
        echo ""
        echo "🚀 Iniciando CLI..."
        echo "💡 Digite / para ver comandos"
        echo "💡 Digite @ para mencionar agentes"
        echo ""
        node dist/cli.js
        ;;
    4)
        echo ""
        echo "🚀 Iniciando API + Frontend..."
        echo "📍 API: http://localhost:3001"
        echo "📍 Frontend: http://localhost:5173"
        echo ""
        echo "⚠️  Abrindo em terminais separados..."
        
        # Iniciar API em background
        npm start &
        API_PID=$!
        
        # Aguardar API iniciar
        sleep 3
        
        # Iniciar Frontend
        cd flui-frontend-vite
        npm run dev
        
        # Cleanup quando frontend fechar
        kill $API_PID 2>/dev/null
        ;;
    5)
        echo ""
        echo "🧪 Rodando testes..."
        echo ""
        npm test
        ;;
    0)
        echo "👋 Até logo!"
        exit 0
        ;;
    *)
        echo "❌ Opção inválida"
        exit 1
        ;;
esac
