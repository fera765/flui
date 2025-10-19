# 🧪 TESTE DO NOVO WORKFLOW - FLUI

## 📋 CHECKLIST COMPLETO

### 🏗️ BUILD
```bash
cd ~/flui/flui-frontend-vite
npm run build
```

**Esperado**: ✅ Build sem erros TypeScript

---

### 🚀 EXECUTAR

#### 1. Iniciar Backend (Terminal 1):
```bash
cd ~/flui
npm start
```

**Esperado**:
```
API rodando em http://localhost:3001
FLUI CLI rodando...
```

#### 2. Iniciar Frontend (Terminal 2):
```bash
cd ~/flui/flui-frontend-vite
npm run dev
```

**Esperado**:
```
VITE v7.x.x  ready in XXXms
➜  Local:   http://localhost:8080/
```

---

### 🌐 TESTAR NO NAVEGADOR

#### Desktop (Computador):

**1. Home Page**:
```
http://localhost:8080
```

✅ Verificar:
- [ ] Logo FLUI visível
- [ ] Estatísticas (Automações, Agentes, MCPs)
- [ ] Botão "Nova Automação"
- [ ] Lista de automações (vazia inicialmente)

**2. Criar Automação**:
```
Clicar em "Nova Automação"
```

✅ Verificar:
- [ ] URL: `http://localhost:8080/automations/create`
- [ ] Header com 2 inputs (Nome, Descrição)
- [ ] Botão "Voltar"
- [ ] Botão "Salvar" (desabilitado)
- [ ] Canvas vazio com mensagem "Nenhum nó adicionado"
- [ ] Botão "Adicionar Nó" centralizado no topo

**3. Adicionar Primeiro Nó**:
```
1. Digitar nome: "Teste Workflow"
2. Clicar "Adicionar Nó"
```

✅ Verificar Modal:
- [ ] Modal aparece com fundo escuro
- [ ] Input de pesquisa com foco
- [ ] Grid de ferramentas:
  - [ ] Agentes (azul)
  - [ ] MCPs (roxo)
  - [ ] Webhook (amarelo)
  - [ ] HTTP Request (cyan)
  - [ ] Condição (cyan)
  - [ ] Loop (cyan)
  - [ ] Delay (cyan)
- [ ] Cada card tem ícone + nome + descrição + badge tipo
- [ ] Botão X para fechar

**4. Selecionar Ferramenta**:
```
Clicar em qualquer agente (ex: "Assistente Geral")
```

✅ Verificar:
- [ ] Modal fecha automaticamente
- [ ] Nó aparece no canvas
- [ ] Nó tem:
  - [ ] Cor azul (agente)
  - [ ] Ícone Bot
  - [ ] Nome "Assistente Geral"
  - [ ] Descrição
  - [ ] Badge "AGENT"
  - [ ] Botão ⚙️ (Configurar)
  - [ ] Handles esquerdo/direito (roxos)
- [ ] Panel info mostra "Nós: 1"

**5. Configurar Nó**:
```
Clicar no nó (ou no botão ⚙️)
```

✅ Verificar Modal Config:
- [ ] Modal aparece
- [ ] Título "Configurar Nó"
- [ ] Subtítulo com nome e ID
- [ ] Campos específicos do agente:
  - [ ] Prompt (textarea)
  - [ ] Temperatura (number 0-1)
  - [ ] Max Tokens (number)
- [ ] Botão "Cancelar"
- [ ] Botão "Salvar"

**6. Salvar Configuração**:
```
1. Preencher prompt: "Você é um assistente"
2. Clicar "Salvar"
```

✅ Verificar:
- [ ] Modal fecha
- [ ] Nó agora tem badge verde "Configurado"

**7. Adicionar Segundo Nó**:
```
1. Clicar "Adicionar Nó" novamente
2. Selecionar "Webhook"
```

✅ Verificar:
- [ ] Novo nó aparece à direita do primeiro (300px)
- [ ] Nó tem cor amarela
- [ ] Badge "WEBHOOK"

**8. Conectar Nós**:
```
1. Arrastar do handle direito do Agente
2. Soltar no handle esquerdo do Webhook
```

✅ Verificar:
- [ ] Linha roxa conecta os nós
- [ ] Linha é animada
- [ ] Panel info mostra "Conexões: 1"

**9. Adicionar Terceiro Nó**:
```
1. Adicionar "HTTP Request"
2. Conectar Webhook → HTTP Request
```

✅ Verificar:
- [ ] Nó aparece à direita
- [ ] Cor cyan
- [ ] Conectado ao Webhook
- [ ] Panel: "Nós: 3, Conexões: 2"

**10. Testar Pesquisa**:
```
1. Clicar "Adicionar Nó"
2. Digitar "http" no campo de busca
```

✅ Verificar:
- [ ] Apenas "HTTP Request" aparece
- [ ] Outros itens filtrados

**11. Salvar Automação**:
```
1. Verificar nome preenchido ("Teste Workflow")
2. Clicar "Salvar"
```

✅ Verificar:
- [ ] Redirecionamento para home (/)
- [ ] Automação aparece na lista
- [ ] Card mostra:
  - [ ] Nome "Teste Workflow"
  - [ ] "3 nós"
  - [ ] Status "Ativo"

---

#### Mobile (Tela Pequena):

**Usar DevTools**:
```
F12 → Toggle Device Toolbar (Ctrl+Shift+M)
Selecionar: iPhone SE (375x667)
```

**1. Home Mobile**:
✅ Verificar:
- [ ] Stats em coluna única
- [ ] Botão "Nova Automação" full width
- [ ] Cards responsivos

**2. Create Automation Mobile**:
✅ Verificar:
- [ ] Inputs stack vertical
- [ ] Botões full width
- [ ] "Adicionar Nó" mostra só "Adicionar"
- [ ] Canvas ocupa tela toda
- [ ] Zoom com pinch funciona
- [ ] Controles compactos

**3. Modal NodePalette Mobile**:
✅ Verificar:
- [ ] 1 coluna de cards
- [ ] Scroll funciona
- [ ] Touch funciona

**4. Modal Config Mobile**:
✅ Verificar:
- [ ] Campos full width
- [ ] Scroll interno
- [ ] Botões acessíveis

**5. Drag Mobile**:
✅ Verificar:
- [ ] Touch drag de nós funciona
- [ ] Touch drag para conectar funciona
- [ ] Zoom com dois dedos funciona

---

### 📸 SCREENSHOTS

Tirar screenshots de:

1. **Home Desktop** - Lista vazia
2. **Create Desktop** - Canvas vazio
3. **Modal Palette** - Grid ferramentas
4. **Canvas com 3 nós** - Conectados
5. **Modal Config** - Campos agente
6. **Home com automação** - Card salvo
7. **Mobile Create** - Layout responsivo

---

### 🐛 VERIFICAR ERROS

#### Console do Navegador (F12):

✅ **SEM erros de**:
- [ ] TypeScript
- [ ] React
- [ ] ReactFlow
- [ ] Fetch/API

✅ **SEM warnings de**:
- [ ] Hooks
- [ ] Keys
- [ ] Props

#### Network Tab:

✅ Verificar requests:
- [ ] GET `/api/agents` → 200 OK
- [ ] GET `/api/mcps` → 200 OK
- [ ] POST `/api/automations` → 200 OK

---

### ⚡ TESTES DE PERFORMANCE

1. **Adicionar 10 nós**:
   - [ ] UI permanece fluida
   - [ ] Zoom funciona
   - [ ] Drag funciona

2. **Pesquisar 100x**:
   - [ ] Busca instantânea
   - [ ] Sem lag

3. **Abrir/fechar modal 20x**:
   - [ ] Animações suaves
   - [ ] Sem memory leak

---

### 🎨 TESTES VISUAIS

#### Cores:
- [ ] Agente: Azul vibrante
- [ ] MCP: Roxo vibrante
- [ ] Webhook: Amarelo vibrante
- [ ] Tool: Cyan vibrante
- [ ] Fundo: Slate escuro
- [ ] Conexões: Roxo (#8b5cf6)

#### Animações:
- [ ] Hover nó: Scale 1.05
- [ ] Hover botão: Mudança cor
- [ ] Conexão: Linha animada
- [ ] Modal: Fade in/out

#### Typography:
- [ ] Headers: Bold, branco
- [ ] Descrições: Menor, semi-transparente
- [ ] Badges: Uppercase, xs

---

## 🔄 INTEGRAÇÃO CLI + FRONTEND

### Testar Sincronização:

**1. Criar automação no Frontend**:
```
1. Criar "Workflow A" com 2 nós
2. Salvar
```

**2. Verificar no CLI**:
```
Na CLI do Flui:
/automations
```

✅ Verificar:
- [ ] "Workflow A" aparece na lista

**3. Criar automação no CLI** (se possível):
```
Criar manualmente via store
```

**4. Verificar no Frontend**:
```
Recarregar home
```

✅ Verificar:
- [ ] Nova automação aparece

---

## ✅ RESULTADO ESPERADO

### Desktop:
- 🟢 Todas funcionalidades funcionando
- 🟢 UI elegante e fluida
- 🟢 Drag & drop preciso
- 🟢 Modais responsivos
- 🟢 Persistência 100%

### Mobile:
- 🟢 Layout adaptado
- 🟢 Touch funciona
- 🟢 Zoom funciona
- 🟢 Scroll funciona
- 🟢 Modais full screen

### API:
- 🟢 Agentes carregados
- 🟢 MCPs carregados
- 🟢 Automação salva
- 🟢 Sem erros 500/400

---

## 📞 REPORTAR BUGS

Se encontrar problemas, reportar:

### Template:
```
❌ BUG ENCONTRADO

**Onde**: [Desktop/Mobile/Ambos]
**Ação**: [O que estava fazendo]
**Esperado**: [O que deveria acontecer]
**Aconteceu**: [O que realmente aconteceu]
**Console**: [Erros do F12]
**Screenshot**: [Se possível]
```

---

**Status**: 🟢 Pronto para teste  
**Data**: 2025-10-19 16:20 UTC  
**Executor**: Usuário manual (browser)
