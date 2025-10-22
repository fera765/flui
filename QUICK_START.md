# 🚀 Quick Start - Validar Correção

## Teste Rápido (30 segundos)

```bash
# 1. Iniciar backend (se não estiver rodando)
cd /workspace && npm run start:api &

# 2. Rodar teste backend
/workspace/test-complete-flow.sh
```

**Resultado Esperado**:
```
✅ ALL TESTS PASSED!
✅ Condition node has correct toolId
✅ Agent node has correct toolId
✅ Automation executed successfully
```

---

## Teste Completo com Navegador (2 minutos)

```bash
# 1. Criar automação de teste
/workspace/test-complete-flow.sh

# 2. Iniciar frontend
cd /workspace/flui-frontend-vite
npm run dev &

# 3. Rodar Playwright (com navegador visível)
npx playwright test tests/e2e/real-ui-test.spec.ts --headed --project=chromium
```

**Resultado Esperado**:
```
✅ Condition node: Configuration opened WITHOUT errors
✅ Agent node: Configuration opened WITHOUT errors
✅ Automation saved successfully
✅ Automation executed
✅ 1 passed (33.3s)
```

---

## Teste Manual no Navegador

1. **Abrir**: http://localhost:8080

2. **Ir para**: http://localhost:8080/automations/test-complete-flow/edit

3. **Verificar**:
   - ✅ 2 nodes no canvas (Condition + Agent)
   - ✅ Clicar no Condition → Configurar → Abre sem erro
   - ✅ Clicar no Agent → Configurar → Abre sem erro

---

## Screenshots da Evidência

Verificar screenshots criados pelo Playwright:

```bash
ls -lh /tmp/*.png
```

Arquivos esperados:
- `/tmp/01-page-loaded.png` - Canvas carregado
- `/tmp/06-condition-config.png` - Condition configurado
- `/tmp/10-agent-config.png` - Agent configurado
- `/tmp/13-final.png` - Execução completa

---

## Verificar Logs

```bash
# Backend
tail -f /tmp/backend.log

# Frontend
tail -f /tmp/frontend.log
```

---

## Limpar Dados de Teste

```bash
curl -X DELETE http://localhost:3001/api/automations/test-complete-flow
curl -X DELETE http://localhost:3001/api/agents/{AGENT_ID}
```

---

**✅ Se todos os testes passarem, a correção está 100% funcional!**
