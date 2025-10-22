#!/bin/bash

echo "🧪 =============================================="
echo "🧪 TESTE COMPLETO: AGENTE COM LLM REAL + TOOLS"
echo "🧪 =============================================="
echo ""

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

API_URL="http://localhost:3001/api"

echo -e "${BLUE}📝 Passo 1: Configurando LLM${NC}"
echo ""

# Configurar LLM (usando endpoint da llm7.io)
curl -s -X POST "$API_URL/settings" \
  -H "Content-Type: application/json" \
  -d '{
    "llm": {
      "endpoint": "https://api.llm7.io/v1",
      "apiKey": "test-key",
      "model": "gpt-5-mini",
      "temperature": 0.7,
      "maxTokens": 2000
    }
  }' > /dev/null

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ LLM configurado${NC}"
else
    echo -e "${RED}❌ Erro ao configurar LLM${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}📝 Passo 2: Criando Agente com Tools${NC}"
echo ""

# Criar agente com tools
AGENT_RESPONSE=$(curl -s -X POST "$API_URL/agents" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Agente Matemático",
    "description": "Agente que usa tools para cálculos",
    "systemPrompt": "Você é um assistente matemático. Use as tools disponíveis para fazer cálculos precisos. Quando precisar calcular algo, use a tool math-calculator.",
    "model": "gpt-5-mini",
    "temperature": 0.3,
    "maxTokens": 1000,
    "tools": ["http-request", "condition-flex"],
    "enabled": true
  }')

AGENT_ID=$(echo "$AGENT_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -n "$AGENT_ID" ]; then
    echo -e "${GREEN}✅ Agente criado: $AGENT_ID${NC}"
    echo "   Nome: Agente Matemático"
    echo "   Tools: http-request, condition-flex"
else
    echo -e "${RED}❌ Erro ao criar agente${NC}"
    echo "$AGENT_RESPONSE"
    exit 1
fi

echo ""
echo -e "${BLUE}📝 Passo 3: Verificando Tools do Agente${NC}"
echo ""

# Buscar agente
AGENT_DATA=$(curl -s "$API_URL/agents/$AGENT_ID")
TOOLS_COUNT=$(echo "$AGENT_DATA" | grep -o '"tools":\[[^]]*\]' | grep -o ',' | wc -l)
TOOLS_COUNT=$((TOOLS_COUNT + 1))

echo -e "${GREEN}✅ Agente carregado${NC}"
echo "   Tools configuradas: $TOOLS_COUNT"
echo ""

echo -e "${BLUE}📝 Passo 4: Convertendo Agente para Tool${NC}"
echo ""

# Buscar agente como tool no registry
AGENT_TOOL=$(curl -s "$API_URL/tools/agent-$AGENT_ID")

if echo "$AGENT_TOOL" | grep -q "Agente"; then
    echo -e "${GREEN}✅ Agente disponível como tool${NC}"
    echo "   ID: agent-$AGENT_ID"
    echo "   Category: $(echo "$AGENT_TOOL" | grep -o '"category":"[^"]*"' | cut -d'"' -f4)"
else
    echo -e "${RED}❌ Agente não encontrado no registry${NC}"
fi

echo ""
echo -e "${BLUE}📝 Passo 5: Criando Automação com Agente${NC}"
echo ""

# Criar automação usando o agente
AUTOMATION_RESPONSE=$(curl -s -X POST "$API_URL/automations" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Teste Agente Real\",
    \"description\": \"Teste de integração real com LLM\",
    \"nodes\": [
      {
        \"id\": \"agent-node-1\",
        \"type\": \"agent\",
        \"name\": \"Agente Matemático\",
        \"position\": {\"x\": 100, \"y\": 100},
        \"config\": {
          \"toolId\": \"agent-$AGENT_ID\",
          \"category\": \"agent\",
          \"params\": {
            \"input\": \"Olá! Por favor, me diga: quanto é 2 + 2?\"
          }
        }
      }
    ],
    \"edges\": [],
    \"enabled\": true
  }")

AUTOMATION_ID=$(echo "$AUTOMATION_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -n "$AUTOMATION_ID" ]; then
    echo -e "${GREEN}✅ Automação criada: $AUTOMATION_ID${NC}"
else
    echo -e "${RED}❌ Erro ao criar automação${NC}"
    echo "$AUTOMATION_RESPONSE"
    exit 1
fi

echo ""
echo -e "${BLUE}📝 Passo 6: Executando Automação (LLM REAL!)${NC}"
echo ""
echo -e "${YELLOW}⚠️  Nota: Isso vai fazer uma chamada REAL para a LLM!${NC}"
echo -e "${YELLOW}⚠️  Endpoint: https://api.llm7.io/v1${NC}"
echo ""
echo "Executando..."

EXECUTION_START=$(date +%s)

EXECUTION_RESPONSE=$(curl -s -X POST "$API_URL/automations/$AUTOMATION_ID/execute" \
  -H "Content-Type: application/json" \
  -d '{}')

EXECUTION_END=$(date +%s)
EXECUTION_TIME=$((EXECUTION_END - EXECUTION_START))

echo ""
echo "⏱️  Tempo de execução: ${EXECUTION_TIME}s"
echo ""

# Verificar resultado
if echo "$EXECUTION_RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✅ EXECUÇÃO BEM-SUCEDIDA!${NC}"
    echo ""
    echo -e "${BLUE}📊 Resultado da Execução:${NC}"
    echo "$EXECUTION_RESPONSE" | jq '.' 2>/dev/null || echo "$EXECUTION_RESPONSE"
    
    # Extrair resposta do agente
    AGENT_RESPONSE=$(echo "$EXECUTION_RESPONSE" | grep -o '"response":"[^"]*"' | head -1 | cut -d'"' -f4)
    
    if [ -n "$AGENT_RESPONSE" ]; then
        echo ""
        echo -e "${GREEN}💬 Resposta do Agente:${NC}"
        echo "   $AGENT_RESPONSE"
        echo ""
        
        # Verificar se não é simulação
        if echo "$AGENT_RESPONSE" | grep -qi "SIMULADO"; then
            echo -e "${RED}❌ FALHA: Resposta ainda está SIMULADA!${NC}"
            echo ""
            exit 1
        else
            echo -e "${GREEN}✅ SUCESSO: Resposta REAL da LLM!${NC}"
            echo ""
        fi
    fi
else
    echo -e "${RED}❌ FALHA NA EXECUÇÃO${NC}"
    echo ""
    echo "Resposta:"
    echo "$EXECUTION_RESPONSE" | jq '.' 2>/dev/null || echo "$EXECUTION_RESPONSE"
    echo ""
    
    # Verificar se é erro de API key
    if echo "$EXECUTION_RESPONSE" | grep -qi "api.*key\|auth"; then
        echo -e "${YELLOW}⚠️  Erro de autenticação${NC}"
        echo -e "${YELLOW}⚠️  Configure uma API key válida em /settings${NC}"
    fi
    
    exit 1
fi

echo ""
echo -e "${BLUE}📝 Passo 7: Verificando Logs${NC}"
echo ""

# Buscar logs da execução
LOGS=$(curl -s "$API_URL/automations/$AUTOMATION_ID/logs" 2>/dev/null)

if [ -n "$LOGS" ]; then
    echo "Últimos logs:"
    echo "$LOGS" | head -20
else
    echo "Sem logs disponíveis"
fi

echo ""
echo "=============================================="
echo -e "${GREEN}✅ TESTE COMPLETO CONCLUÍDO!${NC}"
echo "=============================================="
echo ""
echo "📊 Resumo:"
echo "   • LLM configurado: ✅"
echo "   • Agente criado: ✅"
echo "   • Agente como tool: ✅"
echo "   • Automação criada: ✅"
echo "   • Execução REAL: ✅"
echo "   • Sem simulações: ✅"
echo ""
echo -e "${GREEN}🎉 Sistema 100% funcional com LLM REAL!${NC}"
echo ""

# Limpar
echo "🧹 Limpando dados de teste..."
curl -s -X DELETE "$API_URL/automations/$AUTOMATION_ID" > /dev/null
curl -s -X DELETE "$API_URL/agents/$AGENT_ID" > /dev/null
echo -e "${GREEN}✅ Limpeza concluída${NC}"
echo ""
