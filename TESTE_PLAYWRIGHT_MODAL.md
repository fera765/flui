# 🎭 TESTE DO MODAL COM PLAYWRIGHT

## ✅ Script de Teste Criado

Criei um script automatizado que usa Playwright para:
- ✅ Abrir o navegador (headless)
- ✅ Navegar para a página
- ✅ Verificar estrutura da página
- ✅ Procurar botão de configuração (⚙️)
- ✅ Clicar no botão
- ✅ Verificar se modal abre
- ✅ Capturar logs do console
- ✅ Tirar screenshots

**Arquivo:** `/workspace/test-modal-playwright.mjs`

---

## 🚀 COMO EXECUTAR O TESTE

### Passo 1: Iniciar Servidores

**Terminal 1 - Backend:**
```bash
cd /workspace
npm run start:api
```

**Terminal 2 - Frontend:**
```bash
cd /workspace/flui-frontend-vite
npm run dev
```

**Aguarde até ver:**
```
API Server rodando em http://localhost:3001
Local:   http://localhost:5173/
```

### Passo 2: Executar Teste Playwright

**Terminal 3 - Teste:**
```bash
cd /workspace
node test-modal-playwright.mjs
```

---

## 📊 O QUE O TESTE FAZ

### 1. Navegação
```
📍 Navegando para http://localhost:5173/create-automation-v2...
✅ Página carregada
```

### 2. Verificação de Componentes
```
📄 Título: Flui - Create Automation
🎨 ReactFlow: ✅
📦 Nodes: 1
```

### 3. Procura do Botão
```
🔍 Procurando botão ⚙️...
⚙️ Botões encontrados: 1
```

### 4. Clique e Verificação
```
✅ Botão encontrado! Clicando...
🖱️ Clicado!
⏳ Aguardando modal...
```

### 5. Resultado
```
📊 RESULTADO:
==================================================
🎨 Modal visível: ✅ SIM
==================================================

🎉🎉🎉 SUCESSO! Modal abriu! 🎉🎉🎉
```

---

## 🐛 SE O MODAL NÃO ABRIR

O teste vai capturar informações detalhadas:

### 1. **Logs do Console**
```
📋 Logs importantes:
  - 🔧 [CreateAutomationV2] handleConfigureNode called with nodeId: xxx
  - 🔧 [CreateAutomationV2] Found node: {...}
  - ✅ [CreateAutomationV2] Modal should open now
  - 🎨 [NodeConfigModalV2] Props changed: {...}
  - ⚠️ [NodeConfigModalV2] Conditions not met  ← PROBLEMA AQUI
```

### 2. **Estrutura dos Nodes**
```
📦 Informações dos nodes:
  Node 0:
    Botões: 2
    Títulos: Configurar nó, Excluir nó
```

### 3. **Estado CSS do Modal**
```
🎨 CSS: {
  display: 'none',  ← Modal existe mas está oculto
  visibility: 'visible',
  opacity: '1',
  zIndex: '50'
}
```

### 4. **Screenshots**
- ✅ Sucesso: `/workspace/modal-success.png`
- ❌ Falha: `/workspace/modal-failed.png`
- ⚠️ Sem botão: `/workspace/debug-no-button.png`
- 🐛 Erro: `/workspace/error.png`

---

## 📸 SCREENSHOTS GERADOS

O teste tira screenshots automaticamente:

### Se Funcionar:
```
📸 Screenshot: /workspace/modal-success.png
```
![Modal aberto com sucesso]

### Se Falhar:
```
📸 Screenshot: /workspace/modal-failed.png
```
![Modal não abriu - debug visual]

### Se Não Houver Botão:
```
📸 Screenshot: /workspace/debug-no-button.png
```
![Canvas sem botão de configuração]

---

## 🔧 TROUBLESHOOTING

### Erro: "ERR_CONNECTION_REFUSED"
```
❌ Erro: net::ERR_CONNECTION_REFUSED at http://localhost:5173
```
**Solução:** Frontend não está rodando
```bash
cd /workspace/flui-frontend-vite
npm run dev
```

### Erro: "API not responding"
```
❌ Erro ao carregar: Failed to fetch http://localhost:3001
```
**Solução:** Backend não está rodando
```bash
cd /workspace
npm run start:api
```

### Modal existe mas não está visível
```
📦 Modal existe no DOM: true
🎨 CSS: { display: 'none' }
```
**Causa Possível:**
- Condição `isOpen` está false
- `automationId` está undefined
- CSS com z-index errado

**Verificar logs:**
```
🎨 [NodeConfigModalV2] Props changed: {
  isOpen: true,
  automationId: undefined,  ← PROBLEMA!
  nodeId: 'node-xxx'
}
```

---

## 📋 CORREÇÕES JÁ APLICADAS

### 1. ID Temporário
```typescript
// CreateAutomationV2.tsx
const [automationId, setAutomationId] = useState(() => `temp-${Date.now()}`);
```

### 2. Logs de Debug
```typescript
console.log('🔧 [CreateAutomationV2] handleConfigureNode called...');
console.log('🎨 [NodeConfigModalV2] Props changed:', { isOpen, automationId, nodeId });
```

### 3. Atributos Duplicados Removidos
- ❌ `onSave` duplicado em EditAutomation
- ❌ `onSave` duplicado em CreateAutomationV2
- ❌ `onTest` que não existe no modal

---

## 🎯 RESULTADO ESPERADO

Quando tudo estiver funcionando, o teste mostrará:

```
🚀 Iniciando teste do modal com Playwright...

📍 Navegando para http://localhost:5173/create-automation-v2...
✅ Página carregada

📄 Título: Flui
🎨 ReactFlow: ✅
📦 Nodes: 1

🔍 Procurando botão ⚙️...
⚙️ Botões encontrados: 1

✅ Botão encontrado! Clicando...
🖱️ Clicado!

⏳ Aguardando modal...

📊 RESULTADO:
==================================================
🎨 Modal visível: ✅ SIM
==================================================

🎉🎉🎉 SUCESSO! Modal abriu! 🎉🎉🎉

📋 Elementos:
  Salvar: ✅
  Cancelar: ✅

📸 Screenshot: /workspace/modal-success.png

⏳ Aguardando 5s...

🔚 Fechando navegador...

✅ Teste concluído!
```

---

## 📊 CHECKLIST DE VALIDAÇÃO

Após executar o teste, verificar:

- [ ] Teste executou sem erros de conexão
- [ ] Página carregou corretamente
- [ ] ReactFlow foi encontrado
- [ ] Pelo menos 1 node no canvas
- [ ] Botão ⚙️ foi encontrado
- [ ] Clique foi executado
- [ ] Modal abriu (visível)
- [ ] Botões Salvar e Cancelar presentes
- [ ] Screenshot gerado
- [ ] Logs do console mostram fluxo correto

---

## 🎭 MCP DO PLAYWRIGHT

O Playwright tem um MCP oficial: `@playwright/mcp`

Para usar via MCP:
```bash
npx @playwright/mcp --browser chrome
```

Isso inicia um servidor MCP que expõe ferramentas do Playwright como:
- `playwright_navigate` - Navegar para URL
- `playwright_click` - Clicar em elemento
- `playwright_screenshot` - Tirar screenshot
- `playwright_evaluate` - Executar JavaScript

---

## 🔗 PRÓXIMOS PASSOS

1. **Execute o teste** com servidores rodando
2. **Veja os screenshots** gerados
3. **Analise os logs** se houver falha
4. **Reporte o resultado** com screenshot

---

## 📞 SUPORTE

Se o teste falhar:

1. **Capture a saída completa** do teste
2. **Veja os screenshots** em `/workspace/*.png`
3. **Verifique os logs** no console do navegador
4. **Confirme** que correções foram aplicadas:
   - `CreateAutomationV2.tsx` tem `temp-${Date.now()}`
   - Sem atributos duplicados
   - Logs de debug presentes

---

*Script de teste criado em: 2025-10-21*  
*Arquivo: test-modal-playwright.mjs*
