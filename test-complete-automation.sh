#!/bin/bash

echo "🧪 ============================================"
echo "🧪 TESTE COMPLETO DE AUTOMAÇÃO COM AGENTES REAIS"
echo "🧪 ============================================"
echo ""

API_URL="http://localhost:3001/api"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função para verificar se API está rodando
check_api() {
  echo "🔍 Verificando se API está rodando..."
  if curl -s "${API_URL}/agents" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ API está rodando${NC}"
    return 0
  else
    echo -e "${RED}❌ API não está rodando. Inicie com: npm run api${NC}"
    return 1
  fi
}

# Função para configurar LLM no backend
configure_llm() {
  echo ""
  echo "⚙️  Configurando LLM no backend..."
  
  LLM_CONFIG=$(cat <<EOF
{
  "endpoint": "https://api.llm7.io/v1",
  "apiKey": "",
  "model": "gpt-4-turbo-preview",
  "temperature": 0.7,
  "maxTokens": 2000
}
EOF
)
  
  RESPONSE=$(curl -s -X POST "${API_URL}/llm/config" \
    -H "Content-Type: application/json" \
    -d "$LLM_CONFIG")
  
  if echo "$RESPONSE" | grep -q "success"; then
    echo -e "${GREEN}✅ LLM configurado com sucesso${NC}"
    return 0
  else
    echo -e "${YELLOW}⚠️  Aviso ao configurar LLM (pode já estar configurado)${NC}"
    return 0 # Não falhar se já estiver configurado
  fi
}

# Função para obter modelos disponíveis
get_models() {
  echo ""
  echo "📡 Obtendo modelos disponíveis..."
  
  # Tentar do backend primeiro (usa configuração do backend)
  MODELS=$(curl -s "${API_URL}/models" | grep -o '"id":"[^"]*"' | cut -d'"' -f4 | head -5)
  
  # Se falhou, tentar diretamente do endpoint
  if [ -z "$MODELS" ]; then
    echo "  Tentando endpoint direto..."
    MODELS=$(curl -s "https://api.llm7.io/v1/models" | grep -o '"id":"[^"]*"' | cut -d'"' -f4 | head -5)
  fi
  
  if [ -z "$MODELS" ]; then
    echo -e "${RED}❌ Nenhum modelo encontrado${NC}"
    return 1
  fi
  
  echo -e "${GREEN}✅ Modelos disponíveis:${NC}"
  echo "$MODELS" | nl
  
  # Pegar o primeiro modelo disponível
  SELECTED_MODEL=$(echo "$MODELS" | head -1)
  echo ""
  echo -e "${GREEN}🎯 Modelo selecionado: ${SELECTED_MODEL}${NC}"
  return 0
}

# Função para criar um agente
create_agent() {
  echo ""
  echo "🤖 Criando agente de teste..."
  
  AGENT_ID="test-agent-$(date +%s)"
  
  AGENT_DATA=$(cat <<EOF
{
  "id": "${AGENT_ID}",
  "name": "Test Agent $(date +%H:%M:%S)",
  "description": "Agente de teste criado automaticamente",
  "model": "${SELECTED_MODEL}",
  "systemPrompt": "Você é um assistente útil e eficiente.",
  "temperature": 0.7,
  "maxTokens": 1000,
  "enabled": true,
  "tools": []
}
EOF
)
  
  RESPONSE=$(curl -s -X POST "${API_URL}/agents" \
    -H "Content-Type: application/json" \
    -d "$AGENT_DATA")
  
  if echo "$RESPONSE" | grep -q "success"; then
    echo -e "${GREEN}✅ Agente criado com sucesso: ${AGENT_ID}${NC}"
    return 0
  else
    echo -e "${RED}❌ Erro ao criar agente:${NC}"
    echo "$RESPONSE"
    return 1
  fi
}

# Função para criar uma automação
create_automation() {
  echo ""
  echo "⚙️  Criando automação de teste..."
  
  AUTO_ID="test-automation-$(date +%s)"
  
  AUTOMATION_DATA=$(cat <<EOF
{
  "id": "${AUTO_ID}",
  "name": "Test Automation $(date +%H:%M:%S)",
  "description": "Automação de teste com gatilho manual e agente",
  "version": "2.0.0",
  "nodes": [
    {
      "id": "node-trigger",
      "type": "tool",
      "name": "Manual Trigger",
      "description": "Gatilho manual",
      "config": {
        "toolId": "manual-trigger",
        "category": "system",
        "params": {
          "triggerMessage": "Test automation started",
          "debugMode": true
        }
      },
      "position": { "x": 100, "y": 100 }
    },
    {
      "id": "node-agent",
      "type": "agent",
      "name": "Test Agent Node",
      "description": "Executa o agente de teste",
      "config": {
        "toolId": "agent-${AGENT_ID}",
        "category": "agent",
        "params": {
          "prompt": "Olá! Por favor, responda com uma saudação curta."
        }
      },
      "position": { "x": 400, "y": 100 }
    }
  ],
  "edges": [
    {
      "id": "edge-1",
      "source": "node-trigger",
      "target": "node-agent"
    }
  ],
  "startNodeId": "node-trigger",
  "enabled": true
}
EOF
)
  
  RESPONSE=$(curl -s -X POST "${API_URL}/automations" \
    -H "Content-Type: application/json" \
    -d "$AUTOMATION_DATA")
  
  if echo "$RESPONSE" | grep -q "success"; then
    echo -e "${GREEN}✅ Automação criada com sucesso: ${AUTO_ID}${NC}"
    return 0
  else
    echo -e "${RED}❌ Erro ao criar automação:${NC}"
    echo "$RESPONSE"
    return 1
  fi
}

# Função para executar a automação
execute_automation() {
  echo ""
  echo "🚀 Executando automação..."
  
  RESPONSE=$(curl -s -X POST "${API_URL}/automations/${AUTO_ID}/execute" \
    -H "Content-Type: application/json" \
    -d '{"debugMode": true, "initialData": {}}')
  
  echo ""
  echo "📊 Resultado da execução:"
  echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"
  
  if echo "$RESPONSE" | grep -q '"success":true'; then
    echo ""
    echo -e "${GREEN}✅ Automação executada com SUCESSO!${NC}"
    
    # Extrair informações importantes
    STATUS=$(echo "$RESPONSE" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
    DURATION=$(echo "$RESPONSE" | grep -o '"duration":[0-9]*' | cut -d':' -f2)
    
    echo ""
    echo "📈 Estatísticas:"
    echo "  Status: $STATUS"
    echo "  Duração: ${DURATION}ms"
    
    return 0
  else
    echo ""
    echo -e "${RED}❌ Automação falhou${NC}"
    return 1
  fi
}

# Função principal
main() {
  # 1. Verificar API
  check_api || exit 1
  
  # 2. Configurar LLM
  configure_llm || exit 1
  
  # 3. Obter modelos
  get_models || exit 1
  
  # 4. Criar agente
  create_agent || exit 1
  
  # 5. Criar automação
  create_automation || exit 1
  
  # 6. Executar automação
  execute_automation || exit 1
  
  echo ""
  echo -e "${GREEN}🎉 ============================================${NC}"
  echo -e "${GREEN}🎉 TESTE COMPLETO EXECUTADO COM SUCESSO!${NC}"
  echo -e "${GREEN}🎉 ============================================${NC}"
  echo ""
  echo "📝 Recursos criados:"
  echo "   Agente: ${AGENT_ID}"
  echo "   Automação: ${AUTO_ID}"
  echo ""
  echo "🌐 Acesse o frontend em http://localhost:5173 para testar a interface"
}

# Executar
main
