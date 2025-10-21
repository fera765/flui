#!/bin/bash

# Script para executar validação completa com Playwright
# Salva screenshots em cada etapa e gera relatório final

echo "🚀 INICIANDO VALIDAÇÃO COMPLETA 100%" > /tmp/complete-validation.log
echo "========================================" >> /tmp/complete-validation.log
echo "Data: $(date)" >> /tmp/complete-validation.log
echo "" >> /tmp/complete-validation.log

# Criar diretório de screenshots
mkdir -p /workspace/screenshots-validation
echo "📁 Diretório de screenshots criado" >> /tmp/complete-validation.log

# Iniciar API em background
echo "📍 Iniciando API backend..." >> /tmp/complete-validation.log
cd /workspace
npm run start:api > /tmp/api-validation.log 2>&1 &
API_PID=$!
echo "✅ API iniciada (PID: $API_PID)" >> /tmp/complete-validation.log

# Aguardar API inicializar
echo "⏳ Aguardando API inicializar (15s)..." >> /tmp/complete-validation.log
sleep 15

# Verificar se API está respondendo
API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/tools || echo "ERRO")
echo "📡 Status da API: $API_STATUS" >> /tmp/complete-validation.log

if [ "$API_STATUS" != "200" ]; then
  echo "❌ API não está respondendo!" >> /tmp/complete-validation.log
  echo "📋 Últimas linhas do log:" >> /tmp/complete-validation.log
  tail -30 /tmp/api-validation.log >> /tmp/complete-validation.log
  kill $API_PID 2>/dev/null
  exit 1
fi

echo "" >> /tmp/complete-validation.log

# Executar teste completo
echo "🧪 Executando validação completa..." >> /tmp/complete-validation.log
cd /workspace/flui-frontend-vite

timeout 300 npx playwright test complete-validation --reporter=line > /tmp/validation-test.log 2>&1
TEST_EXIT=$?

echo "📊 Resultado do teste: Exit Code $TEST_EXIT" >> /tmp/complete-validation.log

if [ $TEST_EXIT -eq 0 ]; then
  echo "✅ VALIDAÇÃO COMPLETA PASSOU!" >> /tmp/complete-validation.log
else
  echo "❌ VALIDAÇÃO FALHOU (Exit: $TEST_EXIT)" >> /tmp/complete-validation.log
fi

# Extrair logs do teste
echo "" >> /tmp/complete-validation.log
echo "📋 Últimas 50 linhas do teste:" >> /tmp/complete-validation.log
tail -50 /tmp/validation-test.log >> /tmp/complete-validation.log

# Contar screenshots
SCREENSHOT_COUNT=$(ls -1 /workspace/screenshots-validation/*.png 2>/dev/null | wc -l)
echo "" >> /tmp/complete-validation.log
echo "📸 Screenshots capturados: $SCREENSHOT_COUNT" >> /tmp/complete-validation.log

if [ $SCREENSHOT_COUNT -gt 0 ]; then
  echo "📁 Lista de screenshots:" >> /tmp/complete-validation.log
  ls -1 /workspace/screenshots-validation/*.png | head -20 >> /tmp/complete-validation.log
fi

# Finalizar API
echo "" >> /tmp/complete-validation.log
echo "🛑 Finalizando API backend..." >> /tmp/complete-validation.log
kill $API_PID 2>/dev/null

# Resumo final
echo "" >> /tmp/complete-validation.log
echo "========================================" >> /tmp/complete-validation.log
echo "📊 RESUMO FINAL" >> /tmp/complete-validation.log
echo "========================================" >> /tmp/complete-validation.log
echo "Status do Teste: $([ $TEST_EXIT -eq 0 ] && echo '✅ PASSOU' || echo '❌ FALHOU')" >> /tmp/complete-validation.log
echo "Screenshots: $SCREENSHOT_COUNT arquivos" >> /tmp/complete-validation.log
echo "Data de conclusão: $(date)" >> /tmp/complete-validation.log
echo "" >> /tmp/complete-validation.log

# Exibir resultado
cat /tmp/complete-validation.log

exit $TEST_EXIT
