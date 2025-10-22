#!/bin/bash
cd /workspace/flui-frontend-vite

# Fix MCPsPage.tsx - server possibly undefined
sed -i 's/server: newMcp.server,/server: newMcp.server || "",/g' src/pages/MCPsPage.tsx

# Fix LogsPage.tsx - buildContextualPrompt não usado
sed -i 's/const buildContextualPrompt/\/\/ const buildContextualPrompt/g' src/pages/LogsPage.tsx

# Fix ToolsListPage.tsx - setActiveTab e mcps não usados
sed -i 's/const \[activeTab, setActiveTab\]/const [activeTab] \/\/ , setActiveTab/g' src/pages/ToolsListPage.tsx
sed -i 's/const \[mcps, setMcps\]/\/\/ const [mcps, setMcps]/g' src/pages/ToolsListPage.tsx

echo "Erros corrigidos!"
