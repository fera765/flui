#!/bin/bash

echo "🚀 FLUI - Sistema de Automação"
echo "================================"
echo ""
echo "📋 Este script executa todos os testes dos 3 blocos"
echo ""

# Verificar se serviços estão rodando
echo "🔍 Verificando serviços..."
if ! curl -s http://localhost:3001/api/tools > /dev/null; then
    echo "❌ Backend não está rodando na porta 3001"
    echo "   Execute: cd /workspace && npm run start:api"
    exit 1
fi

if ! curl -s http://localhost:8080 > /dev/null; then
    echo "❌ Frontend não está rodando na porta 8080"
    echo "   Execute: cd /workspace/flui-frontend-vite && npm run dev"
    exit 1
fi

echo "✅ Serviços rodando corretamente"
echo ""

# Executar testes
echo "🧪 Executando testes dos 3 blocos..."
echo "================================"
echo ""

cd /workspace/flui-frontend-vite

npm run test:e2e -- bloco1-automacao-simples bloco2-mcp-integration bloco3-logs-melhorados --reporter=line

echo ""
echo "================================"
echo "✅ EXECUÇÃO COMPLETA!"
echo ""
echo "📊 Veja o relatório completo em:"
echo "   /workspace/RELATORIO_FINAL_100_PORCENTO.md"
echo ""
echo "📄 Para ver relatório HTML:"
echo "   npm run test:report"
echo ""

