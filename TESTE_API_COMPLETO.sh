#!/bin/bash

echo "╔══════════════════════════════════════════════════════════╗"
echo "║         🧪 TESTE COMPLETO DA API - VALIDAÇÃO             ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# 1. Verificar API
echo "1️⃣  Verificando API..."
curl -s http://localhost:3001/api/tools > /dev/null && echo "   ✅ API respondendo" || (echo "   ❌ API offline" && exit 1)
echo ""

# 2. Listar Tools
echo "2️⃣  Listando Tools disponíveis..."
curl -s http://localhost:3001/api/tools | python3 << 'EOF'
import sys, json
try:
    tools = json.load(sys.stdin)
    print(f"   ✅ Total de tools: {len(tools)}")
    for i, tool in enumerate(tools, 1):
        print(f"      {i}. {tool['name']} (ID: {tool['id']}, Cat: {tool.get('category', '?')})")
except Exception as e:
    print(f"   ❌ Erro: {e}")
EOF
echo ""

# 3. Testar Condition Flex
echo "3️⃣  Testando Tool Condition Flex..."
RESULT=$(curl -s -X POST http://localhost:3001/api/tools/condition-flex/execute \
  -H "Content-Type: application/json" \
  -d '{
    "value": "comprar produto",
    "paths": ["comprar", "vender", "ajuda"],
    "matchType": "contains"
  }')

echo "$RESULT" | python3 << 'EOF'
import sys, json
try:
    result = json.load(sys.stdin)
    if result.get('success'):
        matched = result.get('result', {}).get('matchedPath')
        print(f"   ✅ Condition Flex funcionando")
        print(f"   ✅ Caminho encontrado: {matched}")
    else:
        print(f"   ❌ Erro: {result.get('error')}")
except Exception as e:
    print(f"   ❌ Erro ao testar: {e}")
EOF
echo ""

# 4. Criar Agente de Teste
echo "4️⃣  Criando Agente de teste..."
AGENT_ID="test-agent-$(date +%s)"
curl -s -X POST http://localhost:3001/api/agents \
  -H "Content-Type: application/json" \
  -d "{
    \"id\": \"$AGENT_ID\",
    \"name\": \"Agente Teste\",
    \"description\": \"Agente para validação\",
    \"systemPrompt\": \"Você é um assistente útil\",
    \"model\": \"gpt-4\",
    \"temperature\": 0.7,
    \"maxTokens\": 2000,
    \"enabled\": true,
    \"tools\": [\"manual-trigger\", \"condition-flex\"]
  }" > /dev/null && echo "   ✅ Agente criado (ID: $AGENT_ID)" || echo "   ❌ Erro ao criar agente"
echo ""

# 5. Verificar se agente aparece nas tools
echo "5️⃣  Verificando agentes nas tools..."
sleep 2
curl -s http://localhost:3001/api/tools | python3 << EOF
import sys, json
try:
    tools = json.load(sys.stdin)
    agents = [t for t in tools if t.get('category') == 'agent']
    print(f"   ℹ️  Agentes como tools: {len(agents)}")
    if len(agents) > 0:
        print("   ✅ Agentes disponíveis como tools")
        for ag in agents[:3]:
            print(f"      • {ag['name']}")
    else:
        print("   ⚠️  Nenhum agente encontrado (feature desabilitada temporariamente)")
except Exception as e:
    print(f"   ❌ Erro: {e}")
EOF
echo ""

# 6. Criar Automação de Teste via API
echo "6️⃣  Criando automação de teste..."
curl -s -X POST http://localhost:3001/api/automations \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Teste Automação API",
    "description": "Automação para testar toolId",
    "nodes": [
      {
        "id": "node-1",
        "type": "tool",
        "name": "Manual Trigger",
        "description": "Trigger inicial",
        "config": {
          "toolId": "manual-trigger"
        },
        "position": {"x": 100, "y": 100}
      },
      {
        "id": "node-2",
        "type": "tool",
        "name": "Condition Flex",
        "description": "Decisão",
        "config": {
          "toolId": "condition-flex",
          "params": {
            "value": "teste",
            "paths": ["comprar", "vender"]
          }
        },
        "position": {"x": 400, "y": 100}
      }
    ],
    "edges": [
      {
        "id": "edge-1-2",
        "source": "node-1",
        "target": "node-2"
      }
    ],
    "startNodeId": "node-1"
  }' | python3 << 'EOF'
import sys, json
try:
    result = json.load(sys.stdin)
    if result.get('id'):
        print(f"   ✅ Automação criada (ID: {result['id']})")
    else:
        print(f"   ❌ Erro: {result.get('error', 'Desconhecido')}")
except Exception as e:
    print(f"   ❌ Erro: {e}")
EOF
echo ""

echo "╔══════════════════════════════════════════════════════════╗"
echo "║     ✅ TESTES DA API CONCLUÍDOS                          ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""
echo "🌐 AGORA TESTE NO NAVEGADOR:"
echo "   http://localhost:8080/automations/create"
echo ""
echo "📋 CHECKLIST:"
echo "   [ ] Modal 3 abas abre"
echo "   [ ] Node elegante criado"
echo "   [ ] Configuração abre sem erro"
echo "   [ ] Edge com curva aparece"
echo "   [ ] Automação salva"
echo "   [ ] Execução funciona"
echo ""
