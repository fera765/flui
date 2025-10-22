# 📋 TODO COMPLETO - TODAS AS TAREFAS

## ✅ FEATURES JÁ IMPLEMENTADAS
1. ✅ Aba MCPs/Tools ao criar agente (AgentsPage.tsx)
2. ✅ Componente ElegantNode criado
3. ✅ Componente ToolSelectionModal criado
4. ✅ Tool Condition Flex criada (backend)
5. ✅ ReturnPointManager criado (backend)

## 🔧 TAREFAS PENDENTES

### 1. Corrigir Switches na Aba Tools do Agente
- [ ] Fixar posição dos switches (está tudo no topo)
- [ ] Garantir que cada switch fique ao lado da tool correspondente
- [ ] Aplicar em criar E editar agente

### 2. Integrar ElegantNode no Workflow
- [ ] Substituir node padrão por ElegantNode em CreateAutomationV2
- [ ] Substituir em EditAutomation
- [ ] Configurar nodeTypes corretamente
- [ ] Testar no navegador

### 3. Integrar ToolSelectionModal
- [ ] Substituir modal padrão em CreateAutomationV2
- [ ] Substituir em EditAutomation
- [ ] Garantir 3 abas funcionando
- [ ] Scroll infinito em cada aba

### 4. Registrar Agentes como Tools (Backend)
- [ ] Criar endpoint GET /api/agents/as-tools
- [ ] Transformar agentes em formato Tool
- [ ] Incluir na listagem de /api/tools
- [ ] Testar via curl

### 5. Configurar Edges com Curvas
- [ ] Setar edgeType: 'smoothstep' ou 'bezier'
- [ ] Configurar em CreateAutomationV2
- [ ] Configurar em EditAutomation
- [ ] Testar visualmente

### 6. UI para Return Point
- [ ] Adicionar checkbox no modal de configuração
- [ ] Campo para selecionar node de retorno
- [ ] Salvar isReturnPoint e returnTo no node
- [ ] Mostrar badge laranja no node

### 7. UI para Condition Flex Paths
- [ ] Campo array para adicionar/remover paths
- [ ] Input para cada path
- [ ] Botão "Add Path" e "Remove"
- [ ] Validação mínima 2 paths

### 8. Testar API
- [ ] GET /api/tools (deve incluir agentes)
- [ ] POST /api/tools/condition-flex/execute
- [ ] GET /api/agents
- [ ] POST /api/agents

### 9. Testar Frontend no Navegador
- [ ] Criar agente com tools
- [ ] Criar automação com nodes elegantes
- [ ] Modal 3 abas funcionando
- [ ] Edges com curvas
- [ ] Configurar Condition Flex
- [ ] Marcar Return Point

## 🎯 PRIORIDADE DE EXECUÇÃO

1. Corrigir switches do agente (crítico)
2. Integrar ElegantNode (visual importante)
3. Integrar ToolSelectionModal (UX importante)
4. Registrar agentes como tools (funcionalidade)
5. Edges com curvas (visual)
6. UI Return Point (funcionalidade)
7. UI Condition paths (funcionalidade)
8. Testes API
9. Testes navegador

## 📝 CHECKLIST FINAL
- [ ] Todos switches funcionando
- [ ] Nodes elegantes em uso
- [ ] Modal 3 abas funcionando
- [ ] Agentes aparecem como tools
- [ ] Edges com curvas
- [ ] Return Point configurável
- [ ] Condition Flex configurável
- [ ] API testada
- [ ] Frontend testado no navegador
