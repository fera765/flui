#!/bin/bash

echo "🧪 TESTE AUTOMÁTICO - Frontend Vite"
echo ""

# 1. Build
echo "📦 1. Building frontend..."
cd flui-frontend-vite
npm run build 2>&1 | tail -5
BUILD_EXIT=$?

if [ $BUILD_EXIT -eq 0 ]; then
    echo "✅ Build: OK"
else
    echo "❌ Build: FALHOU"
    exit 1
fi

echo ""

# 2. Iniciar dev server em background
echo "🚀 2. Iniciando Vite dev server..."
npm run dev > /tmp/vite.log 2>&1 &
VITE_PID=$!

echo "   PID: $VITE_PID"
sleep 5

# 3. Verificar se está rodando
echo ""
echo "🔍 3. Verificando server..."
if ps -p $VITE_PID > /dev/null; then
    echo "✅ Server: Rodando"
else
    echo "❌ Server: Não iniciou"
    exit 1
fi

# 4. Testar endpoint
echo ""
echo "🌐 4. Testando http://localhost:8080..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080 2>/dev/null)

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ HTTP: $HTTP_CODE OK"
else
    echo "❌ HTTP: $HTTP_CODE"
fi

# 5. Verificar logs de erro
echo ""
echo "📋 5. Verificando logs..."
if grep -i "error" /tmp/vite.log > /dev/null; then
    echo "⚠️  Erros encontrados:"
    grep -i "error" /tmp/vite.log | head -5
else
    echo "✅ Logs: Sem erros"
fi

# 6. Testar página específica
echo ""
echo "🎯 6. Testando /automations/create..."
HTTP_CREATE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/automations/create 2>/dev/null)

if [ "$HTTP_CREATE" = "200" ]; then
    echo "✅ Create page: $HTTP_CREATE OK"
else
    echo "❌ Create page: $HTTP_CREATE"
fi

# 7. Parar server
echo ""
echo "🛑 7. Parando server..."
kill $VITE_PID 2>/dev/null
sleep 1

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ TESTE COMPLETO!"
echo ""
echo "📝 Logs salvos em: /tmp/vite.log"
echo ""
echo "🌐 Para testar manualmente:"
echo "   cd flui-frontend-vite"
echo "   npm run dev"
echo "   Abra: http://localhost:8080"
echo ""

cd ..
