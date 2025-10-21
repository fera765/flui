# 🚀 GUIA RÁPIDO DE USO

## Sistema Completo - Modal de Configuração + MCP Integration

---

## ⚡ INÍCIO RÁPIDO

### 1. Instalar Dependências

```bash
# Backend
cd /workspace
npm install

# Frontend
cd /workspace/flui-frontend-vite
npm install
```

### 2. Iniciar Sistema

**Terminal 1 - API (Backend):**
```bash
cd /workspace
npm run start:api
```
> API rodará em: http://localhost:3001

**Terminal 2 - Frontend:**
```bash
cd /workspace/flui-frontend-vite
npm run dev
```
> Frontend rodará em: http://localhost:5173

---

## 🎯 USAR O MODAL DE CONFIGURAÇÃO DE NÓ

### Passo a Passo

1. **Criar/Editar Automação**
   - Acesse o editor de automação
   - Adicione nodes à sua automação

2. **Abrir Modal de Configuração**
   - Clique no ícone ⚙️ (configurar) no node
   - O modal abrirá automaticamente

3. **Configurar Campos**

   **Boolean (Liga/Desliga):**
   - Use o switch (toggle)
   - Ou clique no botão 🔗 para linkar a outro node

   **String/Texto:**
   - Digite o valor no input
   - Campos longos (prompt, code) usam textarea
   - Campos com opções usam dropdown

   **Number (Número):**
   - Digite o número
   - Ou use linker para valor dinâmico

   **Array (Lista):**
   - Clique em "+ Adicionar item" para novos itens
   - Preencha cada item
   - Clique no 🗑️ para remover

   **JSON/Object (Pares Chave-Valor):**
   - Clique em "+ Adicionar par chave-valor"
   - Digite a chave e o valor
   - Clique no 🗑️ para remover pares

4. **Usar Linkers (Conectar Campos)**
   - Clique no botão 🔗 em qualquer campo
   - Veja a lista de outputs disponíveis dos nodes anteriores
   - Clique em "Conectar" no output desejado
   - O campo ficará verde indicando que está linkado
   - Formato: `{{nodeId.fieldKey}}`

5. **Salvar Configuração**
   - Clique em "Salvar Configuração"
   - Os dados são salvos no backend
   - Ao reabrir, tudo estará como você deixou

### ✅ Campos Linkados - Como Funcionam

Quando você linka um campo, ele recebe o valor de outro node durante a execução:

```
Node 1 (Trigger) → output: { result: "Hello" }
Node 2 (Tool) → input linkado: {{node1.result}}
  → Durante execução, input = "Hello"
```

---

## 📦 GERENCIAR MCPs (Model Context Protocol)

### Adicionar Novo MCP

1. **Acessar MCP Manager**
   - (Adicione rota `/mcp-manager` ao router)
   - Ou acesse diretamente a página MCPManager

2. **Clicar em "Adicionar MCP"**
   - Modal de instalação abrirá

3. **Escolher Tipo de Instalação**
   - **NPX:** Para pacotes NPM executáveis
   - **NPM:** Para pacotes instalados globalmente
   - **GitHub:** Para repositórios do GitHub
   - **Local:** Para MCPs em seu filesystem

4. **Preencher Informações**

   **Exemplo - NPX (Pollinations AI):**
   ```
   Tipo: NPX
   Pacote: @pollinations/model-context-protocol
   Nome: Pollinations AI
   Descrição: Geração de imagens e texto com IA
   Versão: 1.0.0
   ```

   **Exemplo - GitHub:**
   ```
   Tipo: GitHub
   Repositório: owner/repository
   Nome: Meu MCP
   ```

5. **Instalar e Testar**
   - Clique em "Instalar e Testar"
   - Aguarde o processo (pode demorar)
   - O sistema irá:
     - Executar o MCP
     - Extrair as tools
     - Registrar no Tool Registry
     - Testar a conexão

6. **Usar as Tools**
   - As tools do MCP aparecerão automaticamente na palette
   - Arraste para a automação como qualquer outra tool

### Gerenciar MCPs Existentes

**Testar MCP:**
- Clique no ícone 🧪 (TestTube)
- Verifica se o MCP está funcionando

**Sincronizar Tools:**
- Clique no ícone 🔄 (RefreshCw)
- Atualiza a lista de tools do MCP

**Ver Tools:**
- Clique no ícone 📦 (Package)
- Expande para mostrar todas as tools

**Habilitar/Desabilitar:**
- Clique no ícone 👁️ (Eye)
- Ativa ou desativa o MCP

**Remover:**
- Clique no ícone 🗑️ (Trash)
- Remove o MCP do sistema

---

## 🧪 TESTAR POLLINATIONS AI MCP

### Teste Automatizado

```bash
# Certifique-se de que a API está rodando
npm run start:api

# Em outro terminal
npm run test:pollinations
```

**O que o teste faz:**
1. Verifica se API está online
2. Cria o MCP da Pollinations AI
3. Executa via NPX
4. Extrai as tools
5. Testa a conexão
6. Registra no Tool Registry
7. Gera relatório completo

### Teste Manual

1. **Acesse o MCP Manager**
2. **Clique em "Adicionar MCP"**
3. **Preencha:**
   - Tipo: NPX
   - Pacote: `@pollinations/model-context-protocol`
   - Nome: Pollinations AI
   - Descrição: Geração de imagens e texto com IA
4. **Clique em "Instalar e Testar"**
5. **Aguarde a instalação (1-3 minutos na primeira vez)**
6. **Verifique as tools na lista expandida**
7. **Use as tools na palette de ferramentas**

---

## 🎨 EXEMPLO COMPLETO DE USO

### Criar Automação com MCP

1. **Instalar Pollinations AI MCP**
   - Via MCP Manager
   - Aguardar sincronização

2. **Criar Nova Automação**
   - Adicionar Trigger (Manual)
   - Adicionar Node do Pollinations AI

3. **Configurar Trigger**
   - Abrir modal (⚙️)
   - Configurar mensagem inicial
   - Salvar

4. **Configurar Pollinations AI**
   - Abrir modal (⚙️)
   - Campo "prompt": Digite o prompt de geração
   - Ou linkar ao trigger: `{{trigger.triggerMessage}}`
   - Campo "style": Escolher estilo
   - Salvar

5. **Conectar Nodes**
   - Arrastar linha do Trigger para o Pollinations AI

6. **Executar**
   - Clicar em ▶️ (Play)
   - Ver resultados em tempo real

---

## 🔧 TROUBLESHOOTING

### Modal Não Abre
- Verifique se a API está rodando
- Verifique console do navegador
- Certifique-se de que o node tem toolId

### Campos Não Aparecem
- Verifique se a tool está registrada no backend
- Tente recarregar a página
- Verifique logs da API

### Linker Não Mostra Outputs
- Verifique se há nodes pais conectados
- Verifique se os nodes pais têm outputs definidos
- Recarregue a automação

### MCP Não Instala
- Verifique conexão com internet (para NPX/NPM)
- Verifique se o pacote existe no NPM
- Veja logs do terminal da API
- Tente aumentar timeout

### Tools do MCP Não Aparecem
- Sincronize o MCP (botão 🔄)
- Reinicie a API
- Verifique Tool Registry: `GET http://localhost:3001/api/tools`

---

## 📚 RECURSOS ADICIONAIS

### Endpoints da API

**Tools:**
```bash
GET  http://localhost:3001/api/tools
GET  http://localhost:3001/api/tools/:id
```

**MCPs:**
```bash
GET  http://localhost:3001/api/mcps
GET  http://localhost:3001/api/mcps/:id
POST http://localhost:3001/api/mcps
PUT  http://localhost:3001/api/mcps/:id
DELETE http://localhost:3001/api/mcps/:id
POST http://localhost:3001/api/mcps/:id/sync
POST http://localhost:3001/api/mcps/:id/test
```

**Nodes:**
```bash
GET  http://localhost:3001/api/automations/:automationId/nodes/:nodeId
PUT  http://localhost:3001/api/automations/:automationId/nodes/:nodeId
PATCH http://localhost:3001/api/automations/:automationId/nodes/:nodeId/config
GET  http://localhost:3001/api/automations/:automationId/nodes/:nodeId/available-outputs
```

### Testes

```bash
# Todos os testes
npm test

# Testes em watch mode
npm run test:watch

# Teste específico do Pollinations
npm run test:pollinations

# UI de testes
npm run test:ui
```

### Logs

**Backend (API):**
- Logs aparecem no terminal onde você rodou `npm run start:api`
- Procure por:
  - `✅` para sucessos
  - `❌` para erros
  - `🔄` para sincronizações
  - `📦` para carregamento de MCPs

**Frontend:**
- Abra DevTools do navegador (F12)
- Vá em Console
- Procure por logs de carregamento e salvamento

---

## 💡 DICAS

1. **Sempre salve antes de executar**
   - Configure o node
   - Salve a configuração
   - Depois execute a automação

2. **Use linkers para fluxos dinâmicos**
   - Conecte outputs a inputs
   - Crie pipelines de processamento
   - Reutilize dados entre nodes

3. **Teste MCPs antes de usar**
   - Use o botão de teste 🧪
   - Verifique se as tools aparecem
   - Sincronize se necessário

4. **Mantenha MCPs atualizados**
   - Sincronize periodicamente
   - Remova MCPs não utilizados
   - Monitore logs de erro

---

## ✅ CHECKLIST DE USO DIÁRIO

- [ ] API está rodando
- [ ] Frontend está rodando
- [ ] MCPs sincronizados
- [ ] Tools disponíveis na palette
- [ ] Configurações de nodes salvas
- [ ] Linkages funcionando
- [ ] Automações executando

---

## 📞 SUPORTE

Para problemas ou dúvidas:
1. Verifique os logs da API e do Frontend
2. Execute testes: `npm test`
3. Verifique documentação completa em `IMPLEMENTACAO_COMPLETA_MODAL_MCP.md`
4. Teste com Pollinations AI: `npm run test:pollinations`

---

*Guia criado para facilitar o uso do sistema*
*Última atualização: 2025-10-21*
