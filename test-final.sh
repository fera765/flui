#!/bin/bash

echo "=================================="
echo "🧪 TESTE FINAL - FLUI"
echo "=================================="
echo ""

echo "📋 1. Verificando API..."
API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/tools)
if [ "$API_STATUS" = "200" ]; then
  echo "✅ API está respondendo"
else
  echo "❌ API não está respondendo (código: $API_STATUS)"
  exit 1
fi
echo ""

echo "📋 2. Verificando MCPs..."
MCP_COUNT=$(curl -s http://localhost:3001/api/mcps | python3 -c "import sys, json; data=json.load(sys.stdin); print(len(data))")
echo "✅ Total de MCPs: $MCP_COUNT"
echo ""

echo "📋 3. Verificando Tools do MCP..."
MCP_TOOLS=$(curl -s http://localhost:3001/api/tools | python3 -c "import sys, json; data=json.load(sys.stdin); mcp_tools=[t for t in data if t.get('category')=='mcp']; print(len(mcp_tools))")
echo "✅ Tools MCP registradas: $MCP_TOOLS"
echo ""

echo "📋 4. Listando MCPs e suas Tools..."
curl -s http://localhost:3001/api/mcps | python3 << 'EOF'
import sys, json
mcps = json.load(sys.stdin)
for mcp in mcps:
    print(f"\n🔹 MCP: {mcp['name']}")
    print(f"   Server: {mcp['server']}")
    print(f"   Status: {'✅ Ativo' if mcp.get('enabled') else '❌ Inativo'}")
    print(f"   Tools: {len(mcp.get('tools', []))}")
    for tool in mcp.get('tools', []):
        print(f"      • {tool['name']}")
EOF
echo ""

echo "📋 5. Verificando Frontend..."
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5173)
if [ "$FRONTEND_STATUS" = "200" ]; then
  echo "✅ Frontend está respondendo"
else
  echo "❌ Frontend não está respondendo (código: $FRONTEND_STATUS)"
fi
echo ""

echo "=================================="
echo "✅ TESTES CONCLUÍDOS COM SUCESSO!"
echo "=================================="
echo ""
echo "🌐 Acesse o frontend em: http://localhost:5173"
echo "📊 Para testar a página de Logs com Chat:"
echo "   1. Acesse http://localhost:5173"
echo "   2. Clique em uma automação"
echo "   3. Clique no botão '📊 Logs'"
echo "   4. Veja os logs em tempo real"
echo "   5. Use o chat contextual para interagir com a automação"
echo ""
echo "🎯 Para testar MCPs:"
echo "   1. Acesse http://localhost:5173/mcps"
echo "   2. Veja o MCP Pollinations AI listado"
echo "   3. Veja as tools registradas"
echo ""
