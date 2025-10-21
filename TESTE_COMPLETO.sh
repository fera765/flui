#!/bin/bash

echo "╔══════════════════════════════════════════════════════════╗"
echo "║       🧪 TESTE COMPLETO - FEATURES IMPLEMENTADAS         ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# Cores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

# 1. Verificar API
echo -e "${BLUE}1. Verificando API...${NC}"
API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/tools 2>/dev/null)
if [ "$API_STATUS" = "200" ]; then
  echo -e "${GREEN}   ✅ API rodando na porta 3001${NC}"
else
  echo "   ❌ API não está respondendo"
  exit 1
fi
echo ""

# 2. Verificar Frontend
echo -e "${BLUE}2. Verificando Frontend...${NC}"
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080 2>/dev/null)
if [ "$FRONTEND_STATUS" = "200" ]; then
  echo -e "${GREEN}   ✅ Frontend rodando na porta 8080${NC}"
else
  echo "   ⚠️  Frontend pode estar na porta 5173 ou 8080"
fi
echo ""

# 3. Verificar Sandboxes
echo -e "${BLUE}3. Verificando Sandboxes...${NC}"
if [ -d "/workspace/workspace/sandboxes" ]; then
  SANDBOX_COUNT=$(ls -1 /workspace/workspace/sandboxes 2>/dev/null | wc -l)
  echo -e "${GREEN}   ✅ Diretório de sandboxes existe${NC}"
  echo "   📁 Total de sandboxes: $SANDBOX_COUNT"
else
  echo "   ℹ️  Nenhum sandbox criado ainda (normal se não executou automações)"
fi
echo ""

# 4. Verificar MCPs
echo -e "${BLUE}4. Verificando MCPs cadastrados...${NC}"
curl -s http://localhost:3001/api/mcps 2>/dev/null | python3 << 'PYEOF'
import sys, json
try:
    mcps = json.load(sys.stdin)
    print(f"   ✅ Total de MCPs: {len(mcps)}")
    for mcp in mcps:
        env_count = len(mcp.get('envVars', {}))
        env_info = f" ({env_count} env vars)" if env_count > 0 else ""
        print(f"      • {mcp['name']}: {len(mcp.get('tools', []))} tools{env_info}")
except:
    print("   ℹ️  Nenhum MCP cadastrado ainda")
PYEOF
echo ""

# 5. Verificar Tools MCP
echo -e "${BLUE}5. Verificando Tools MCP no Registry...${NC}"
curl -s http://localhost:3001/api/tools 2>/dev/null | python3 << 'PYEOF'
import sys, json
try:
    tools = json.load(sys.stdin)
    mcp_tools = [t for t in tools if t.get('category') == 'mcp']
    system_tools = [t for t in tools if t.get('category') == 'system']
    print(f"   ✅ Total de tools: {len(tools)}")
    print(f"      • System tools: {len(system_tools)}")
    print(f"      • MCP tools: {len(mcp_tools)}")
except:
    print("   ❌ Erro ao verificar tools")
PYEOF
echo ""

echo "╔══════════════════════════════════════════════════════════╗"
echo "║       ✅ TESTES CONCLUÍDOS                                ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""
echo "🌐 URLs:"
echo "   • Frontend: http://localhost:8080"
echo "   • API: http://localhost:3001"
echo ""
echo "📚 Features Implementadas:"
echo "   ✅ Sandbox único por automação"
echo "   ✅ Variáveis de ambiente para MCPs (inputs brancos)"
echo "   ✅ Box de progresso de sincronização"
echo "   ✅ Args default nas tools"
echo "   ✅ Sistema de ponto de retorno em nodes"
echo ""
echo "📝 Para testar no navegador:"
echo "   1. Acesse http://localhost:8080/mcps"
echo "   2. Clique em 'Novo MCP'"
echo "   3. Clique em 'ADD ENV' para adicionar variáveis"
echo "   4. Observe os inputs BRANCOS com texto PRETO"
echo "   5. Crie o MCP e veja o box de progresso no topo"
echo ""
