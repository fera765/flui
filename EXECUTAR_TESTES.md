# Guia Rápido: Como Executar os Testes do Playwright

## ✅ PRÉ-REQUISITOS

### 1. Servidores Rodando

**Terminal 1 - Backend:**
```bash
cd /workspace
npm install  # Se ainda não instalou
npm run build  # Compilar TypeScript
npm run start:api  # Iniciar backend na porta 3001
```

**Terminal 2 - Frontend:**
```bash
cd /workspace/flui-frontend-vite
npm install  # Se ainda não instalou
npm run dev  # Iniciar frontend na porta 8080
```

### 2. Verificar Serviços

```bash
# Backend deve responder
curl http://localhost:3001/api/tools

# Frontend deve responder
curl http://localhost:8080
```

---

## 🧪 EXECUTAR TESTES

### Opção 1: Todos os Testes
```bash
cd /workspace/flui-frontend-vite
npm run test:e2e
```

### Opção 2: Por Bloco

**BLOCO 1 - Automação Simples (COMPLETO ✅):**
```bash
cd /workspace/flui-frontend-vite
npm run test:bloco1
```

**BLOCO 2 - MCP Integration (EM PROGRESSO ⚠️):**
```bash
cd /workspace/flui-frontend-vite
npm run test:bloco2
```

**BLOCO 3 - Logs Melhorados (PLANEJADO ⏳):**
```bash
cd /workspace/flui-frontend-vite
npm run test:bloco3
```

### Opção 3: Modo Interativo (UI)
```bash
cd /workspace/flui-frontend-vite
npm run test:e2e:ui
```

### Opção 4: Com Browser Visível (requer X11/display)
```bash
cd /workspace/flui-frontend-vite
npm run test:e2e:headed
```

---

## 📊 VER RELATÓRIOS

Após executar os testes:

```bash
cd /workspace/flui-frontend-vite
npm run test:report
```

Isso abrirá um servidor web com o relatório HTML completo.

---

## 🐛 DEBUG

### Ver Screenshots de Falhas:
```bash
ls -la /workspace/flui-frontend-vite/test-results/
```

### Executar Teste Específico:
```bash
cd /workspace/flui-frontend-vite
npx playwright test bloco1-automacao-simples --headed --timeout=60000
```

### Ver Logs Detalhados:
```bash
cd /workspace/flui-frontend-vite
npx playwright test --reporter=line
```

---

## ✅ RESULTADO ESPERADO

### BLOCO 1:
```
✅ 2 passed (35.9s)

Testes:
1. ✅ deve criar automação, configurar nós com linkers tipados e validar execução
2. ✅ deve validar que linkers mostram apenas outputs compatíveis por tipo
```

### BLOCO 2:
```
⚠️ 1 failed, 1 passed (~3min)

- Necessita correção na persistência de MCPs
```

### BLOCO 3:
```
⏳ Não executado ainda

- Aguarda implementação de chatbox e abas
```

---

## 📝 ESTRUTURA DOS TESTES

```
flui-frontend-vite/
├── e2e/
│   ├── bloco1-automacao-simples.spec.ts      ✅ Completo
│   ├── bloco2-mcp-integration.spec.ts         ⚠️ Em progresso
│   ├── bloco3-logs-melhorados.spec.ts         ⏳ Planejado
│   ├── custom-nodes.spec.ts                   📝 Existente
│   ├── node-config-modal.spec.ts              📝 Existente
│   └── node-config-debug.spec.ts              📝 Existente
├── playwright.config.ts                       ✅ Configurado
├── package.json                               ✅ Scripts adicionados
└── playwright-report/                         📊 Relatórios
```

---

## 🔧 TROUBLESHOOTING

### Erro: "Page timeout"
- Verificar se backend e frontend estão rodando
- Aumentar timeout: `--timeout=120000`

### Erro: "Tool não encontrada"
- Verificar se API `/api/tools` retorna ferramentas
- Tools disponíveis: Manual Trigger, Cron Trigger, Webhook Trigger

### Erro: "No routes matched"
- Verificar se está usando rota correta: `/automations/create`
- Não `/create-automation-v2`

### Browser não abre (headed mode)
- Rodar em headless (padrão)
- Ou usar xvfb: `xvfb-run npm run test:e2e:headed`

---

## 📞 SUPORTE

Ver documentação completa em:
- `/workspace/RESULTADOS_TESTES_BLOCOS.md`
- `/workspace/flui-frontend-vite/GUIA-USO-COMPLETO.md`

