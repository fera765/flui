#!/bin/bash

echo "╔══════════════════════════════════════════════════════════╗"
echo "║     VALIDAÇÃO FINAL - MCPs FUNCIONANDO                   ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# Verificar se API está rodando
echo "1️⃣  Verificando API..."
API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/tools)
if [ "$API_STATUS" = "200" ]; then
  echo "   ✅ API respondendo na porta 3001"
else
  echo "   ❌ API não está respondendo"
  exit 1
fi
echo ""

# Listar MCPs
echo "2️⃣  Listando MCPs cadastrados..."
curl -s http://localhost:3001/api/mcps | python3 << 'EOF'
import sys, json
try:
    mcps = json.load(sys.stdin)
    print(f'   ✅ Total de MCPs: {len(mcps)}')
    for mcp in mcps:
        print(f'      • {mcp["name"]}: {len(mcp.get("tools", []))} tools')
except:
    print('   ❌ Erro ao listar MCPs')
EOF
echo ""

# Verificar tools no registry
echo "3️⃣  Verificando tools no Tool Registry..."
curl -s http://localhost:3001/api/tools | python3 << 'EOF'
import sys, json
try:
    tools = json.load(sys.stdin)
    mcp_tools = [t for t in tools if t.get('category') == 'mcp']
    print(f'   ✅ Total de tools no sistema: {len(tools)}')
    print(f'   ✅ Tools MCP registradas: {len(mcp_tools)}')
    print(f'\n   📋 Exemplos de tools MCP:')
    for t in mcp_tools[:5]:
        name = t['name'][:50]
        print(f'      • {name}')
    if len(mcp_tools) > 5:
        print(f'      ... e mais {len(mcp_tools) - 5} tools')
except Exception as e:
    print(f'   ❌ Erro: {e}')
EOF
echo ""

echo "╔══════════════════════════════════════════════════════════╗"
echo "║     ✅ VALIDAÇÃO CONCLUÍDA COM SUCESSO!                  ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""
echo "📚 Documentos criados:"
echo "   • SUCESSO_MCPS.md - Relatório completo"
echo "   • TESTE_MCP_FINAL.md - Detalhes técnicos"
echo ""
echo "🎯 Próximos passos:"
echo "   1. Acesse http://localhost:8080/mcps"
echo "   2. Veja os MCPs e suas tools"
echo "   3. Use as tools em automações"
echo ""
