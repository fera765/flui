#!/bin/bash
echo "╔══════════════════════════════════════════════════════════╗"
echo "║     ✅ VALIDAÇÃO FINAL - MCPs                            ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

curl -s http://localhost:3001/api/mcps | python3 << 'EOF'
import sys, json
mcps = json.load(sys.stdin)
print(f'✅ Total de MCPs: {len(mcps)}\n')
for i, mcp in enumerate(mcps, 1):
    print(f'{i}. {mcp["name"]}')
    print(f'   Server: {mcp.get("server")}')
    print(f'   Tools: {len(mcp.get("tools", []))}')
    print()
EOF

echo ""
curl -s http://localhost:3001/api/tools | python3 << 'EOF'
import sys, json
tools = json.load(sys.stdin)
mcp_tools = [t for t in tools if t.get('category') == 'mcp']
print(f'✅ Tools MCP no registry: {len(mcp_tools)}')
EOF
