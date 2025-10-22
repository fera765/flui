# 🧪 Teste Completo de Todas as Features

## 🎯 Checklist de Validação

Execute cada teste e marque ✅ ou ❌:

---

## ✅ Teste 1: Configuração LLM

### Passos:
1. [ ] Acessar: http://localhost:8080/agents
2. [ ] Clicar em "Configurar LLM" (botão com ícone Settings)
3. [ ] Verificar que modal abre
4. [ ] Verificar campos:
   - [ ] Endpoint (pré-preenchido com https://api.llm7.io/v1)
   - [ ] API Key (tipo password)
   - [ ] Botão "Mostrar/Ocultar"
   - [ ] Botão "Testar Conexão"
   - [ ] Botão "Carregar Modelos"
5. [ ] Preencher API Key: `sk-sua-chave-real`
6. [ ] Clicar "Carregar Modelos"
7. [ ] Verificar que select de modelos popula
8. [ ] Selecionar um modelo (ex: gpt-4)
9. [ ] Clicar "Salvar Configuração"
10. [ ] Modal fecha

**Resultado Esperado**: ✅ Configuração salva, modelos carregados

---

## ✅ Teste 2: Criar Agente com Modelos Dinâmicos

### Passos:
1. [ ] Ainda em /agents
2. [ ] Clicar "Novo Agente"
3. [ ] Verificar campo "Modelo":
   - [ ] Mostra modelos da API (não hardcoded)
   - [ ] Badge verde: "X modelo(s) disponível(is)"
   - [ ] Modelo padrão já selecionado
4. [ ] Preencher:
   - [ ] Nome: "Teste Feature"
   - [ ] Prompt: "Você é um assistente"
5. [ ] Salvar
6. [ ] Verificar agente criado na lista

**Resultado Esperado**: ✅ Agente criado com modelo da API

---

## ✅ Teste 3: Editar Node SEM Salvar Automação

### Passos:
1. [ ] Acessar: /automations/create
2. [ ] Nome: "Teste Sem Salvar"
3. [ ] Verificar badge amarelo "Não Salvo" aparece
4. [ ] Clicar "Adicionar Ferramenta"
5. [ ] Buscar "condition"
6. [ ] Adicionar "Condition Flex"
7. [ ] **SEM SALVAR**, clicar no node
8. [ ] Clicar "Configurar" ou ⚙️
9. [ ] Verificar modal abre SEM erro
10. [ ] Verificar campos aparecem:
    - [ ] value
    - [ ] paths
    - [ ] matchType
11. [ ] Preencher value: "teste"
12. [ ] Clicar "Salvar" no modal
13. [ ] Modal fecha
14. [ ] **SEM SALVAR AUTOMAÇÃO**, adicionar outro node
15. [ ] Adicionar agente (do Teste 2)
16. [ ] Clicar no agente
17. [ ] Configurar
18. [ ] Verificar modal abre SEM erro
19. [ ] Campos do agente aparecem (prompt, temperature, maxTokens)

**Resultado Esperado**: ✅ Ambos nodes configurados sem salvar automação

---

## ✅ Teste 4: Linkar Outputs SEM Salvar

### Passos:
1. [ ] Continuando do Teste 3 (ainda SEM salvar)
2. [ ] Abrir configuração do agente
3. [ ] No campo "prompt", clicar no ícone 🔗 (linker)
4. [ ] Verificar que mostra outputs do Condition Flex
5. [ ] Clicar em um output
6. [ ] Verificar que campo popula com `{{node-id.output}}`
7. [ ] Salvar config do agente
8. [ ] Verificar que link foi salvo

**Resultado Esperado**: ✅ Output linkado sem salvar automação

---

## ✅ Teste 5: Bloqueio de Execução

### Passos:
1. [ ] Continuando do Teste 4 (ainda SEM salvar)
2. [ ] Procurar botão "Executar"
3. [ ] Verificar que está DESABILITADO (cinza)
4. [ ] Passar mouse sobre botão
5. [ ] Verificar tooltip: "Salve a automação antes de executar"
6. [ ] Verificar badge "Não Salvo" ainda presente

**Resultado Esperado**: ✅ Execução bloqueada

---

## ✅ Teste 6: Salvar e Executar

### Passos:
1. [ ] Continuando do Teste 5
2. [ ] Clicar botão "Salvar" (azul, no topo)
3. [ ] Aguardar salvamento (2-3 segundos)
4. [ ] Verificar:
   - [ ] Badge "Não Salvo" DESAPARECE
   - [ ] Botão "Executar" HABILITA (verde)
5. [ ] Clicar "Executar"
6. [ ] Verificar que automação executa
7. [ ] Ver logs de execução

**Resultado Esperado**: ✅ Automação salva e executada

---

## ✅ Teste 7: Editar Automação Salva

### Passos:
1. [ ] Voltar para /automations
2. [ ] Clicar em "Editar" na automação criada no Teste 6
3. [ ] Verificar que nodes carregam corretamente
4. [ ] Clicar em um node
5. [ ] Abrir configuração
6. [ ] Verificar modal abre SEM erro
7. [ ] Editar algo
8. [ ] Salvar
9. [ ] Verificar que mudança persiste

**Resultado Esperado**: ✅ Edição de automação salva funciona

---

## ✅ Teste 8: Validação de Tipos de Node

### Passos:
1. [ ] Abrir DevTools (F12)
2. [ ] Ir para Console
3. [ ] Criar nova automação
4. [ ] Adicionar Condition Flex
5. [ ] Ver logs: deve mostrar `type: 'system'`
6. [ ] Adicionar Agent
7. [ ] Ver logs: deve mostrar `type: 'agent'`
8. [ ] Salvar automação
9. [ ] No backend, verificar storage/config.json
10. [ ] Verificar que nodes têm `"type": "agent"` e `"type": "system"`

**Resultado Esperado**: ✅ Tipos preservados corretamente

---

## 📊 Resumo de Resultados

### Testes Funcionais
- [ ] Teste 1: Configuração LLM
- [ ] Teste 2: Criar Agente
- [ ] Teste 3: Editar Node SEM Salvar
- [ ] Teste 4: Linkar Outputs
- [ ] Teste 5: Bloqueio de Execução
- [ ] Teste 6: Salvar e Executar
- [ ] Teste 7: Editar Salva
- [ ] Teste 8: Tipos de Node

### Esperado: 8/8 ✅

---

## 🐛 Se Algo Falhar

### Console Logs Importantes
```javascript
// No Console do Browser (F12), procurar:
[NodeConfigModalV2] Loading node data...
[NodeConfigModalV2] Usando dados locais (automação temp)
[NodeConfigModalV2] Carregando tool metadata
```

### LocalStorage
```javascript
// Ver configuração LLM salva:
JSON.parse(localStorage.getItem('llmConfig'))

// Deve retornar:
{
  endpoint: "https://api.llm7.io/v1",
  apiKey: "sk-...",
  defaultModel: "gpt-4"
}
```

### Backend Logs
```bash
tail -f /tmp/backend.log
```

---

## ✅ Critérios de Sucesso

### Para considerar 100% funcional:
- [ ] Modal LLM abre e funciona
- [ ] Modelos carregam da API
- [ ] Agentes usam modelos dinâmicos
- [ ] Nodes editam sem salvar automação
- [ ] Outputs linkam sem salvar
- [ ] Execução bloqueada até salvar
- [ ] Após salvar, tudo funciona
- [ ] Tipos de node preservados

### Total Esperado: 8/8 ✅

---

**Boa sorte com os testes! 🚀**
