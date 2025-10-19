#!/bin/bash

echo "════════════════════════════════════════════════════════════"
echo "  🔧 FLUI - CORREÇÃO TAILWIND v3.4.1"
echo "════════════════════════════════════════════════════════════"
echo ""

cd ~/flui/flui-frontend-vite || exit 1

echo "1️⃣  Removendo Tailwind v4..."
npm uninstall tailwindcss

echo ""
echo "2️⃣  Instalando Tailwind v3.4.1 (versão exata)..."
npm install --save-dev tailwindcss@3.4.1 --save-exact

echo ""
echo "3️⃣  Verificando versão instalada..."
TAILWIND_VERSION=$(npm list tailwindcss 2>/dev/null | grep tailwindcss@ | awk -F@ '{print $NF}')
echo "   📦 Versão: $TAILWIND_VERSION"

if [[ $TAILWIND_VERSION == "3.4.1" ]]; then
    echo "   ✅ Tailwind v3.4.1 instalado corretamente!"
else
    echo "   ⚠️  Atenção: Versão inesperada detectada"
fi

echo ""
echo "4️⃣  Limpando cache Vite..."
rm -rf .vite dist
echo "   ✅ Cache limpo"

echo ""
echo "5️⃣  Executando build..."
npm run build

if [ $? -eq 0 ]; then
    echo ""
    echo "════════════════════════════════════════════════════════════"
    echo "  ✅ BUILD SUCESSO!"
    echo "════════════════════════════════════════════════════════════"
    echo ""
    echo "  🚀 Para iniciar o servidor de desenvolvimento:"
    echo ""
    echo "     npm run dev"
    echo ""
    echo "  🌐 Depois abra no navegador:"
    echo ""
    echo "     http://localhost:8080"
    echo ""
    echo "════════════════════════════════════════════════════════════"
else
    echo ""
    echo "════════════════════════════════════════════════════════════"
    echo "  ❌ BUILD FALHOU"
    echo "════════════════════════════════════════════════════════════"
    echo ""
    echo "  Verifique os erros acima e tente:"
    echo ""
    echo "  1. Limpar tudo:"
    echo "     rm -rf node_modules package-lock.json"
    echo ""
    echo "  2. Reinstalar:"
    echo "     npm install"
    echo ""
    echo "  3. Tentar novamente:"
    echo "     bash ~/flui/COMANDOS_CORRECAO_FINAL.sh"
    echo ""
fi
