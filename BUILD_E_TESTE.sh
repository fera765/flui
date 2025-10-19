#!/bin/bash

echo "╔══════════════════════════════════════════════════════════╗"
echo "║                                                          ║"
echo "║  🚀 FLUI - BUILD E TESTE DO NOVO WORKFLOW               ║"
echo "║                                                          ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# Ir para diretório do frontend
cd ~/flui/flui-frontend-vite || exit 1

echo "1️⃣  Verificando versão Tailwind..."
echo ""
TAILWIND_VERSION=$(npm list tailwindcss 2>/dev/null | grep tailwindcss@ | awk -F@ '{print $NF}')
echo "   📦 Tailwind: $TAILWIND_VERSION"

if [[ $TAILWIND_VERSION != "3.4.1" ]]; then
    echo "   ⚠️  Instalando Tailwind v3.4.1..."
    npm uninstall tailwindcss
    npm install --save-dev tailwindcss@3.4.1 --save-exact
fi

echo ""
echo "2️⃣  Limpando cache..."
rm -rf .vite dist
echo "   ✅ Cache limpo"

echo ""
echo "3️⃣  Building frontend..."
echo ""
npm run build

if [ $? -eq 0 ]; then
    echo ""
    echo "╔══════════════════════════════════════════════════════════╗"
    echo "║  ✅ BUILD SUCESSO!                                       ║"
    echo "╚══════════════════════════════════════════════════════════╝"
    echo ""
    echo "🚀 Próximos passos:"
    echo ""
    echo "   Terminal 1 (Backend + CLI):"
    echo "   cd ~/flui"
    echo "   npm start"
    echo ""
    echo "   Terminal 2 (Frontend):"
    echo "   cd ~/flui/flui-frontend-vite"
    echo "   npm run dev"
    echo ""
    echo "   Navegador:"
    echo "   http://localhost:8080"
    echo ""
    echo "╔══════════════════════════════════════════════════════════╗"
    echo "║  📋 TESTE O NOVO WORKFLOW:                               ║"
    echo "╚══════════════════════════════════════════════════════════╝"
    echo ""
    echo "   1. Clicar 'Nova Automação'"
    echo "   2. Digitar nome: 'Meu Workflow'"
    echo "   3. Clicar 'Adicionar Nó'"
    echo "   4. Selecionar um agente"
    echo "   5. Clicar no nó para configurar"
    echo "   6. Adicionar mais nós"
    echo "   7. Conectar nós (arrastar)"
    echo "   8. Clicar 'Salvar'"
    echo ""
    echo "   Tudo deve funcionar perfeitamente! 🎉"
    echo ""
else
    echo ""
    echo "╔══════════════════════════════════════════════════════════╗"
    echo "║  ❌ BUILD FALHOU                                         ║"
    echo "╚══════════════════════════════════════════════════════════╝"
    echo ""
    echo "   Verifique os erros acima"
    echo ""
fi
