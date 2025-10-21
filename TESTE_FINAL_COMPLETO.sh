#!/bin/bash

echo "╔══════════════════════════════════════════════════════════╗"
echo "║     🧪 TESTE FINAL COMPLETO - TODAS AS FEATURES         ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# 1. Testar API
echo "1️⃣  Testando API..."
curl -s http://localhost:3001/api/tools > /dev/null && echo "   ✅ API respondendo" || echo "   ❌ API offline"
echo ""

# 2. Adicionar MCP com variáveis de ambiente
echo "2️⃣  Adicionando MCP com variáveis de ambiente..."
RESPONSE=$(curl -s -X POST http://localhost:3001/api/mcps \
  -H "Content-Type: application/json" \
  -d '{
    "id": "test-mcp-final",
    "name": "Test MCP with ENV",
    "description": "MCP de teste com variáveis de ambiente",
    "version": "1.0.0",
    "server": "@pollinations/model-context-protocol",
    "installType": "npx",
    "enabled": true,
    "envVars": {
      "API_KEY": "test-key-123",
      "ENDPOINT": "https://api.test.com",
      "DEBUG": "true"
    }
  }')

echo "$RESPONSE" | python3 -c "import sys, json; r=json.load(sys.stdin); print(f'   ✅ MCP criado: {r.get(\"id\", \"N/A\")}') if r.get('success') else print('   ❌ Erro')" 2>/dev/null || echo "   ⚠️  Resposta não esperada"
echo ""

# 3. Aguardar sincronização e verificar tools
echo "3️⃣  Aguardando sincronização (15s)..."
sleep 15

curl -s http://localhost:3001/api/mcps/test-mcp-final | python3 << 'EOF'
import sys, json
try:
    mcp = json.load(sys.stdin)
    print(f"   ✅ MCP: {mcp['name']}")
    print(f"   📦 Tools: {len(mcp.get('tools', []))}")
    print(f"   🔑 ENV Vars: {len(mcp.get('envVars', {}))}")
    
    if mcp.get('envVars'):
        print("\n   Variáveis de Ambiente configuradas:")
        for k, v in mcp.get('envVars', {}).items():
            print(f"      • {k} = {v}")
    
    if mcp.get('tools'):
        print(f"\n   Tools extraídas:")
        for i, t in enumerate(mcp.get('tools', [])[:5], 1):
            print(f"      {i}. {t['name']}")
        if len(mcp.get('tools', [])) > 5:
            print(f"      ... e mais {len(mcp.get('tools', [])) - 5} tools")
except Exception as e:
    print(f"   ⚠️  Erro: {e}")
EOF
echo ""

# 4. Verificar Tools no Registry
echo "4️⃣  Verificando Tools no Registry..."
curl -s http://localhost:3001/api/tools | python3 << 'EOF'
import sys, json
try:
    tools = json.load(sys.stdin)
    mcp_tools = [t for t in tools if t.get('category') == 'mcp']
    print(f"   ✅ Total de tools: {len(tools)}")
    print(f"   ✅ Tools MCP: {len(mcp_tools)}")
    
    # Verificar se têm defaults
    with_defaults = sum(1 for t in mcp_tools if any(p.get('default') is not None for p in t.get('params', [])))
    print(f"   ✅ Tools com defaults: {with_defaults}")
except Exception as e:
    print(f"   ⚠️  Erro: {e}")
EOF
echo ""

# 5. Criar agente de teste
echo "5️⃣  Criando agente de teste..."
curl -s -X POST http://localhost:3001/api/agents \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Agente Teste",
    "description": "Agente para testes",
    "systemPrompt": "Você é um assistente útil",
    "model": "gpt-4",
    "temperature": 0.7,
    "maxTokens": 2000,
    "enabled": true,
    "tools": ["manual-trigger"]
  }' > /dev/null && echo "   ✅ Agente criado" || echo "   ⚠️  Erro ao criar agente"
echo ""

# 6. Verificar Frontend
echo "6️⃣  Verificando Frontend..."
FRONTEND=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080 2>/dev/null)
if [ "$FRONTEND" = "200" ]; then
  echo "   ✅ Frontend rodando em http://localhost:8080"
else
  echo "   ⚠️  Frontend pode não estar rodando"
fi
echo ""

echo "╔══════════════════════════════════════════════════════════╗"
echo "║     ✅ TESTES CONCLUÍDOS                                  ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""
echo "🎯 PRÓXIMOS PASSOS - TESTE NO NAVEGADOR:"
echo ""
echo "1️⃣  Testar Variáveis de Ambiente:"
echo "   • Acesse: http://localhost:8080/mcps"
echo "   • Clique em 'Novo MCP'"
echo "   • Clique em 'ADD ENV' (botão verde)"
echo "   • Observe inputs BRANCOS com texto PRETO"
echo "   • Adicione variáveis e salve"
echo ""
echo "2️⃣  Testar Box de Progresso:"
echo "   • Ao criar MCP, modal fecha"
echo "   • Box roxo aparece no topo"
echo "   • Barra de progresso 0% → 100%"
echo "   • Fecha automaticamente"
echo ""
echo "3️⃣  Testar Tools para Agente:"
echo "   • Acesse: http://localhost:8080/agents"
echo "   • Edite um agente"
echo "   • Veja seção 'Ferramentas Disponíveis'"
echo "   • Use switches para habilitar/desabilitar tools"
echo ""
echo "4️⃣  Testar Aba de MCPs:"
echo "   • Acesse: http://localhost:8080/tools"
echo "   • Clique na aba 'Tools por MCP'"
echo "   • Veja tools agrupadas por MCP"
echo ""
echo "🌐 URLs:"
echo "   Frontend: http://localhost:8080"
echo "   API: http://localhost:3001"
echo ""
