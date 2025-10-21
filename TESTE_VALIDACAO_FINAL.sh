#!/bin/bash

echo "======================================"
echo "  VALIDAÇÃO FINAL DO SISTEMA FLUI"
echo "======================================"
echo ""

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

# Função de teste
test_endpoint() {
    local name=$1
    local url=$2
    local expected=$3
    
    echo -n "🧪 Testando $name... "
    response=$(curl -s "$url")
    
    if echo "$response" | grep -q "$expected"; then
        echo -e "${GREEN}✅ OK${NC}"
        return 0
    else
        echo -e "${RED}❌ FALHOU${NC}"
        return 1
    fi
}

# Testes
echo "📡 TESTANDO API BACKEND (porta 3001)"
echo "------------------------------------"
test_endpoint "Listar MCPs" "http://localhost:3001/api/mcps" "Pollinations MCP"
test_endpoint "Listar Tools" "http://localhost:3001/api/tools" "manual-trigger"
test_endpoint "Listar Automações" "http://localhost:3001/api/automations" "\["

echo ""
echo "🎨 TESTANDO FRONTEND (porta 8080)"
echo "--------------------------------"
test_endpoint "Página Principal" "http://localhost:8080" "Flui"

echo ""
echo "📊 ESTATÍSTICAS"
echo "---------------"
mcps_count=$(curl -s http://localhost:3001/api/mcps | python3 -c "import sys,json; print(len(json.load(sys.stdin)))")
tools_count=$(curl -s http://localhost:3001/api/tools | python3 -c "import sys,json; print(len(json.load(sys.stdin)))")

echo "MCPs cadastrados: $mcps_count"
echo "Tools registradas: $tools_count"

echo ""
echo "======================================"
echo "  ✅ VALIDAÇÃO CONCLUÍDA!"
echo "======================================"
echo ""
echo "🌐 Acesse o sistema:"
echo "   - Frontend: http://localhost:8080"
echo "   - API: http://localhost:3001"
echo "   - MCPs: http://localhost:8080/mcps"
echo "   - Tools: http://localhost:8080/tools"
echo ""
