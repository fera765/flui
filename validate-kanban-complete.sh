#!/bin/bash

###############################################################################
# FLUI - Script de Validação Completa do Kanban (QA-001)
#
# Executa todos os testes e validações necessárias para aprovar o Kanban
###############################################################################

set -e

echo "╔═══════════════════════════════════════════════════════════════════════════╗"
echo "║                                                                            ║"
echo "║        🧪 VALIDAÇÃO COMPLETA DO KANBAN - QA-001 🧪                        ║"
echo "║                                                                            ║"
echo "╚═══════════════════════════════════════════════════════════════════════════╝"
echo ""

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

function run_test() {
  local test_name="$1"
  local test_command="$2"
  
  echo -e "${YELLOW}▶ Executando: $test_name${NC}"
  
  if eval "$test_command" > /tmp/test_output.log 2>&1; then
    echo -e "${GREEN}✅ $test_name: PASSOU${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
  else
    echo -e "${RED}❌ $test_name: FALHOU${NC}"
    echo "   Logs: /tmp/test_output.log"
    tail -10 /tmp/test_output.log | sed 's/^/   /'
    FAILED_TESTS=$((FAILED_TESTS + 1))
  fi
  
  TOTAL_TESTS=$((TOTAL_TESTS + 1))
  echo ""
}

echo "═══════════════════════════════════════════════════════════════════════════"
echo "📦 FASE 1: Build e Compilação"
echo "═══════════════════════════════════════════════════════════════════════════"
echo ""

run_test "Build Backend (TypeScript)" "cd /workspace && npm run build"
run_test "Build Frontend (Vite)" "cd /workspace/flui-frontend-vite && npm run build"

echo "═══════════════════════════════════════════════════════════════════════════"
echo "🧪 FASE 2: Testes Unitários de Persistência (Card B-001, B-002)"
echo "═══════════════════════════════════════════════════════════════════════════"
echo ""

run_test "Testes de Persistência (15 testes)" "cd /workspace && npx vitest run source/__tests__/persistence.test.ts --reporter=verbose"

echo "═══════════════════════════════════════════════════════════════════════════"
echo "🧪 FASE 3: Testes E2E de Workflow (Card QA-001)"
echo "═══════════════════════════════════════════════════════════════════════════"
echo ""

run_test "Testes E2E de Workflow (7 testes)" "cd /workspace && npx vitest run source/__tests__/e2e-workflow.test.ts --reporter=verbose"

echo "═══════════════════════════════════════════════════════════════════════════"
echo "🧪 FASE 4: Testes de Sistema (Cards F-001, B-004)"
echo "═══════════════════════════════════════════════════════════════════════════"
echo ""

run_test "Flow Engine V2 (12 testes)" "cd /workspace && npx vitest run source/__tests__/flow-engine-v2.test.ts --reporter=verbose"
run_test "Reference Resolver (21 testes)" "cd /workspace && npx vitest run source/__tests__/reference-resolver.test.ts --reporter=verbose"
run_test "Output Selector Integration (35 testes)" "cd /workspace && npx vitest run source/__tests__/output-selector-integration.test.ts --reporter=verbose"
run_test "Local Output Extractor (13 testes)" "cd /workspace && npx vitest run source/__tests__/local-output-extractor.test.ts --reporter=verbose"

echo "═══════════════════════════════════════════════════════════════════════════"
echo "🔍 FASE 5: Validação de Estrutura"
echo "═══════════════════════════════════════════════════════════════════════════"
echo ""

run_test "Verificar arquivo OutputSelector" "test -f /workspace/flui-frontend-vite/src/components/OutputSelector.tsx"
run_test "Verificar arquivo localOutputExtractor" "test -f /workspace/flui-frontend-vite/src/utils/localOutputExtractor.ts"
run_test "Verificar arquivo FlowEngineV2" "test -f /workspace/source/core/flowEngineV2.ts"
run_test "Verificar arquivo referenceResolver" "test -f /workspace/source/core/referenceResolver.ts"
run_test "Verificar arquivo nodeOutputExtractor" "test -f /workspace/source/services/nodeOutputExtractor.ts"
run_test "Verificar arquivo automationStorage" "test -f /workspace/source/store/automationStorage.ts"

echo "═══════════════════════════════════════════════════════════════════════════"
echo "🌐 FASE 6: Validação de API"
echo "═══════════════════════════════════════════════════════════════════════════"
echo ""

# Iniciar API temporariamente se não estiver rodando
API_RUNNING=false
if curl -s http://localhost:3001/api/tools > /dev/null 2>&1; then
  echo "✅ API já está rodando"
  API_RUNNING=true
else
  echo "🚀 Iniciando API temporariamente..."
  cd /workspace && npm run start:api > /tmp/api-test.log 2>&1 &
  API_PID=$!
  sleep 5
fi

run_test "API Health Check" "curl -s http://localhost:3001/api/tools | grep -q '\['"
run_test "API Endpoint: GET /api/automations" "curl -s http://localhost:3001/api/automations | grep -q '\['"

# Criar automação via API
TEST_ID="test-$(date +%s)"
cat > /tmp/test-automation.json << EOFAUTOMATION
{
  "name": "API Test Automation",
  "description": "Test via API",
  "nodes": [
    {"id": "n1", "type": "trigger", "name": "Start", "config": {"toolId": "webhook-trigger"}}
  ],
  "edges": []
}
EOFAUTOMATION

run_test "API Endpoint: POST /api/automations" "curl -s -X POST http://localhost:3001/api/automations -H 'Content-Type: application/json' -d @/tmp/test-automation.json | grep -q '\"success\":true'"

# Parar API se foi iniciada por este script
if [ "$API_RUNNING" = false ]; then
  kill $API_PID 2>/dev/null || true
fi

echo "═══════════════════════════════════════════════════════════════════════════"
echo "📊 RESULTADO FINAL"
echo "═══════════════════════════════════════════════════════════════════════════"
echo ""
echo "Total de Testes: $TOTAL_TESTS"
echo -e "${GREEN}Passaram: $PASSED_TESTS${NC}"
echo -e "${RED}Falharam: $FAILED_TESTS${NC}"
echo ""

PASS_RATE=$((PASSED_TESTS * 100 / TOTAL_TESTS))
echo "Taxa de Sucesso: $PASS_RATE%"
echo ""

if [ $FAILED_TESTS -eq 0 ]; then
  echo "╔═══════════════════════════════════════════════════════════════════════════╗"
  echo "║                                                                            ║"
  echo "║         ✅✅✅ VALIDAÇÃO COMPLETA - 100% SUCESSO! ✅✅✅               ║"
  echo "║                                                                            ║"
  echo "║  🎉 Todos os testes passaram!                                             ║"
  echo "║  🚀 Sistema aprovado para produção!                                       ║"
  echo "║                                                                            ║"
  echo "╚═══════════════════════════════════════════════════════════════════════════╝"
  exit 0
else
  echo "╔═══════════════════════════════════════════════════════════════════════════╗"
  echo "║                                                                            ║"
  echo "║         ⚠️  VALIDAÇÃO PARCIAL - ALGUNS TESTES FALHARAM ⚠️               ║"
  echo "║                                                                            ║"
  echo "║  Verifique os logs acima e corrija os problemas                           ║"
  echo "║                                                                            ║"
  echo "╚═══════════════════════════════════════════════════════════════════════════╝"
  exit 1
fi
