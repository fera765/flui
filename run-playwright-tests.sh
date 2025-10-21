#!/bin/bash

# Script para executar testes Playwright em background com logs
# REGRA SUPREMA: Rodar comandos em background coletando logs em arquivos

echo "🚀 INICIANDO VALIDAÇÃO COMPLETA COM PLAYWRIGHT" > /tmp/playwright-execution.log
echo "========================================" >> /tmp/playwright-execution.log
echo "Data: $(date)" >> /tmp/playwright-execution.log
echo "" >> /tmp/playwright-execution.log

# ETAPA 0: Verificar ambiente
echo "📍 ETAPA 0 - CONFIGURAÇÃO INICIAL" >> /tmp/playwright-execution.log
echo "✅ Playwright instalado: $(cd /workspace/flui-frontend-vite && npx playwright --version)" >> /tmp/playwright-execution.log
echo "✅ Node.js: $(node --version)" >> /tmp/playwright-execution.log
echo "✅ NPM: $(npm --version)" >> /tmp/playwright-execution.log
echo "" >> /tmp/playwright-execution.log

# Iniciar API em background
echo "📍 Iniciando API backend..." >> /tmp/playwright-execution.log
cd /workspace
npm run start:api > /tmp/api-backend.log 2>&1 &
API_PID=$!
echo "✅ API iniciada (PID: $API_PID)" >> /tmp/playwright-execution.log

# Aguardar API inicializar
echo "⏳ Aguardando API inicializar..." >> /tmp/playwright-execution.log
sleep 10

# Verificar se API está respondendo
API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/tools || echo "ERRO")
echo "📡 Status da API: $API_STATUS" >> /tmp/playwright-execution.log

if [ "$API_STATUS" != "200" ]; then
  echo "⚠️  API não está respondendo corretamente" >> /tmp/playwright-execution.log
  echo "📋 Últimas linhas do log da API:" >> /tmp/playwright-execution.log
  tail -20 /tmp/api-backend.log >> /tmp/playwright-execution.log
fi

echo "" >> /tmp/playwright-execution.log

# ETAPA 1: Executar BLOCO 1 - Automação Simples
echo "📍 ETAPA 1 - TESTE DE AUTOMAÇÃO SIMPLES" >> /tmp/playwright-execution.log
cd /workspace/flui-frontend-vite

echo "🧪 Executando BLOCO 1..." >> /tmp/playwright-execution.log
timeout 120 npm run test:bloco1 -- --reporter=line > /tmp/bloco1-test.log 2>&1
BLOCO1_EXIT=$?

echo "📊 Resultado BLOCO 1: Exit Code $BLOCO1_EXIT" >> /tmp/playwright-execution.log
if [ $BLOCO1_EXIT -eq 0 ]; then
  echo "✅ BLOCO 1 PASSOU" >> /tmp/playwright-execution.log
else
  echo "❌ BLOCO 1 FALHOU" >> /tmp/playwright-execution.log
fi

# Extrair logs importantes
echo "📋 Últimas 30 linhas do BLOCO 1:" >> /tmp/playwright-execution.log
tail -30 /tmp/bloco1-test.log >> /tmp/playwright-execution.log
echo "" >> /tmp/playwright-execution.log

# ETAPA 2: Executar BLOCO 2 - MCP Integration
echo "📍 ETAPA 2 - TESTE DE INTEGRAÇÃO MCP" >> /tmp/playwright-execution.log

echo "🧪 Executando BLOCO 2..." >> /tmp/playwright-execution.log
timeout 120 npm run test:bloco2 -- --reporter=line > /tmp/bloco2-test.log 2>&1
BLOCO2_EXIT=$?

echo "📊 Resultado BLOCO 2: Exit Code $BLOCO2_EXIT" >> /tmp/playwright-execution.log
if [ $BLOCO2_EXIT -eq 0 ]; then
  echo "✅ BLOCO 2 PASSOU" >> /tmp/playwright-execution.log
else
  echo "❌ BLOCO 2 FALHOU" >> /tmp/playwright-execution.log
fi

echo "📋 Últimas 30 linhas do BLOCO 2:" >> /tmp/playwright-execution.log
tail -30 /tmp/bloco2-test.log >> /tmp/playwright-execution.log
echo "" >> /tmp/playwright-execution.log

# ETAPA 3: Executar BLOCO 3 - Logs Melhorados
echo "📍 ETAPA 3 - TESTE DE LOGS MELHORADOS" >> /tmp/playwright-execution.log

echo "🧪 Executando BLOCO 3..." >> /tmp/playwright-execution.log
timeout 120 npm run test:bloco3 -- --reporter=line > /tmp/bloco3-test.log 2>&1
BLOCO3_EXIT=$?

echo "📊 Resultado BLOCO 3: Exit Code $BLOCO3_EXIT" >> /tmp/playwright-execution.log
if [ $BLOCO3_EXIT -eq 0 ]; then
  echo "✅ BLOCO 3 PASSOU" >> /tmp/playwright-execution.log
else
  echo "❌ BLOCO 3 FALHOU" >> /tmp/playwright-execution.log
fi

echo "📋 Últimas 30 linhas do BLOCO 3:" >> /tmp/playwright-execution.log
tail -30 /tmp/bloco3-test.log >> /tmp/playwright-execution.log
echo "" >> /tmp/playwright-execution.log

# Finalizar API
echo "🛑 Finalizando API backend..." >> /tmp/playwright-execution.log
kill $API_PID 2>/dev/null

# RESUMO FINAL
echo "========================================" >> /tmp/playwright-execution.log
echo "📊 RESUMO DOS TESTES" >> /tmp/playwright-execution.log
echo "========================================" >> /tmp/playwright-execution.log
echo "BLOCO 1 (Automação Simples): $([ $BLOCO1_EXIT -eq 0 ] && echo '✅ PASSOU' || echo '❌ FALHOU')" >> /tmp/playwright-execution.log
echo "BLOCO 2 (MCP Integration):   $([ $BLOCO2_EXIT -eq 0 ] && echo '✅ PASSOU' || echo '❌ FALHOU')" >> /tmp/playwright-execution.log
echo "BLOCO 3 (Logs Melhorados):   $([ $BLOCO3_EXIT -eq 0 ] && echo '✅ PASSOU' || echo '❌ FALHOU')" >> /tmp/playwright-execution.log
echo "" >> /tmp/playwright-execution.log

# Calcular taxa de sucesso
TOTAL_TESTS=3
PASSED_TESTS=0
[ $BLOCO1_EXIT -eq 0 ] && PASSED_TESTS=$((PASSED_TESTS + 1))
[ $BLOCO2_EXIT -eq 0 ] && PASSED_TESTS=$((PASSED_TESTS + 1))
[ $BLOCO3_EXIT -eq 0 ] && PASSED_TESTS=$((PASSED_TESTS + 1))

SUCCESS_RATE=$((PASSED_TESTS * 100 / TOTAL_TESTS))
echo "📈 Taxa de Sucesso: $SUCCESS_RATE% ($PASSED_TESTS/$TOTAL_TESTS testes passaram)" >> /tmp/playwright-execution.log
echo "" >> /tmp/playwright-execution.log

echo "✅ EXECUÇÃO FINALIZADA" >> /tmp/playwright-execution.log
echo "Data: $(date)" >> /tmp/playwright-execution.log

# Exibir resultado
cat /tmp/playwright-execution.log

# Retornar código de saída apropriado
if [ $SUCCESS_RATE -eq 100 ]; then
  exit 0
else
  exit 1
fi
