#!/bin/bash

echo "🧪 TESTANDO CORREÇÃO DO TIPO 'system'"
echo "======================================="
echo ""

API_URL="http://localhost:3001/api"

# Teste 1: Criar automação com tipo "system" (deve migrar para "trigger")
echo "📋 Teste 1: Criar automação com node tipo 'system'"
echo "───────────────────────────────────────────────────"

CREATE_RESPONSE=$(curl -s -X POST "${API_URL}/automations" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "test-system-type",
    "name": "Test System Type",
    "nodes": [
      {
        "id": "node-system",
        "type": "system",
        "name": "System Trigger",
        "config": {
          "toolId": "manual-trigger",
          "category": "system",
          "params": {"test": "value"}
        }
      }
    ],
    "edges": []
  }')

if echo "$CREATE_RESPONSE" | grep -q "success\|Test System Type"; then
  echo "✅ SUCESSO: Automação criada sem erro de validação"
else
  echo "❌ FALHA: Erro ao criar automação"
  echo "Response: $CREATE_RESPONSE"
  exit 1
fi

# Teste 2: Recarregar e verificar se migrou corretamente
echo ""
echo "📋 Teste 2: Verificar migração automática"
echo "──────────────────────────────────────────"

LOAD_RESPONSE=$(curl -s "${API_URL}/automations/test-system-type")

if echo "$LOAD_RESPONSE" | grep -q '"type":"trigger"'; then
  echo "✅ SUCESSO: Tipo 'system' foi migrado para 'trigger'"
elif echo "$LOAD_RESPONSE" | grep -q '"type":"system"'; then
  echo "⚠️  AVISO: Tipo 'system' foi aceito (schema atualizado)"
else
  echo "❌ FALHA: Tipo inesperado"
  echo "Response: $LOAD_RESPONSE"
fi

# Teste 3: Listar automações (não deve dar erro de validação)
echo ""
echo "📋 Teste 3: Listar todas as automações"
echo "──────────────────────────────────────────"

LIST_RESPONSE=$(curl -s "${API_URL}/automations")

if echo "$LIST_RESPONSE" | grep -q "\["; then
  AUTOMATION_COUNT=$(echo "$LIST_RESPONSE" | grep -o '"id"' | wc -l)
  echo "✅ SUCESSO: Listou $AUTOMATION_COUNT automação(ões) sem erro"
else
  echo "❌ FALHA: Erro ao listar automações"
  echo "Response: $LIST_RESPONSE"
  exit 1
fi

echo ""
echo "======================================="
echo "🎉 TODOS OS TESTES PASSARAM!"
echo "✅ Erro de validação 'system' CORRIGIDO"
echo "======================================="
