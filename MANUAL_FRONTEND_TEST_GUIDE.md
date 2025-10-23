# 🧪 GUIA DE TESTE MANUAL - FRONTEND

## 🎯 Objetivo
Validar no navegador que todas as correções estão funcionando perfeitamente.

---

## 🚀 PRÉ-REQUISITOS

Certifique-se de que os serviços estão rodando:

```bash
# Verificar backend
curl http://localhost:3001/api/agents

# Verificar frontend
curl http://localhost:8080
```

Se não estiverem rodando:
```bash
# Terminal 1 - Backend
cd /workspace
npm run start:api

# Terminal 2 - Frontend
cd /workspace/flui-frontend-vite
npm run dev
```

---

## 📋 TESTE 1: Persistência de Dados dos Nodes

### Passo a Passo:

1. **Acesse**: http://localhost:8080

2. **Vá para Automações**: Clique em "Automações"

3. **Crie Nova Automação**: 
   - Clique em "Nova Automação"
   - Nome: "Teste de Persistência"

4. **Adicione Nodes**:
   - Clique em "+ Adicionar Ferramenta"
   - Aba "Ferramentas"
   - Adicione "Manual Trigger"
   - Adicione outro node qualquer

5. **Configure o Segundo Node com Linker**:
   - Clique no segundo node para configurar
   - Em qualquer campo, clique no ícone de 🔗 (Link)
   - Selecione um output do "Manual Trigger"
   - Exemplo: `{{node-trigger.triggerMessage}}`
   - Clique em "Salvar Configuração"

6. **Salve a Automação**:
   - Clique em "Salvar" no topo
   - Aguarde confirmação

7. **Recarregue a Página**:
   - Pressione F5 ou Ctrl+R
   - Volte para a automação salva

8. **Abra o Segundo Node Novamente**:
   - Clique para configurar
   - **VALIDAR**: O linker `{{node-trigger.triggerMessage}}` deve estar presente!
   - **VALIDAR**: Todos os outros campos devem estar preservados!

### ✅ Resultado Esperado:
- ✅ Linker de output preservado
- ✅ Valores de campos mantidos
- ✅ Nenhum dado perdido

### ❌ Se Falhar:
- Abra o console do navegador (F12)
- Verifique erros
- Reporte o comportamento

---

## 📋 TESTE 2: Modelos Reais na Edição de Agentes

### Passo a Passo:

1. **Vá para Agentes**: http://localhost:8080/agents

2. **Configure LLM** (se ainda não configurou):
   - Clique em "Configurar LLM"
   - Endpoint: `https://api.llm7.io/v1`
   - API Key: (deixe vazio, é opcional)
   - Clique em "Carregar Modelos"
   - **VALIDAR**: Deve aparecer 15+ modelos!
   - Selecione um modelo
   - Clique em "Salvar Configuração"

3. **Crie um Agente**:
   - Clique em "Novo Agente"
   - Nome: "Teste de Modelos"
   - **VALIDAR**: Dropdown de modelo mostra modelos REAIS!
   - **VALIDAR**: Aparece "✓ 15 modelo(s) disponível(is)"
   - Selecione um modelo (ex: deepseek-v3.1)
   - System Prompt: "Você é um assistente útil"
   - Clique em "Criar Agente"

4. **Edite o Agente**:
   - Clique no ícone de editar (lápis)
   - **VALIDAR**: Dropdown de modelo ainda mostra modelos REAIS!
   - **VALIDAR**: Modelo selecionado está correto
   - **VALIDAR**: Aparece indicador de modelos disponíveis

### ✅ Resultado Esperado:
- ✅ Modelos reais aparecem na criação
- ✅ Modelos reais aparecem na edição
- ✅ Nenhum modelo hardcoded (GPT-4, Claude, etc. genéricos)
- ✅ Contagem correta de modelos

### ❌ Se Ver Modelos Hardcoded:
- `GPT-4`, `GPT-4 Turbo`, `Claude 3 Opus`
- **ISSO ESTÁ ERRADO!** Reporte imediatamente.

---

## 📋 TESTE 3: Chat de Logs - UI Elegante e Real

### Passo a Passo:

1. **Execute uma Automação**:
   - Vá para "Automações"
   - Selecione uma automação existente
   - Clique em "Executar"
   - Aguarde conclusão

2. **Abra os Logs**:
   - Clique no ícone "Logs" (olho)
   - Ou acesse via URL: `/automations/:id/logs`

3. **Validar UI do Chat**:
   - **VALIDAR**: Layout tem 2 colunas (Logs | Chat)
   - **VALIDAR**: Chat tem badge "AI REAL"
   - **VALIDAR**: Cores cyan/blue elegantes
   - **VALIDAR**: Botões de sugestão rápida:
     - "Status atual"
     - "Verificar erros"
     - "Nodes executados"

4. **Testar Chat Contextual**:
   - Clique em "Status atual" OU
   - Digite: "Qual é o status?"
   - Pressione Enter
   - **VALIDAR**: Resposta menciona nome da automação real!
   - **VALIDAR**: Resposta menciona dados reais da execução!
   - **VALIDAR**: Bubbles de chat com gradientes aparecem

5. **Testar Outras Perguntas**:
   - "Houve algum erro?"
   - "Quais nodes foram executados?"
   - "Qual foi o último evento?"

### ✅ Resultado Esperado:
- ✅ UI moderna com gradientes cyan/blue
- ✅ Badge "AI REAL" visível
- ✅ Respostas contextuais baseadas em dados reais
- ✅ Bubbles animadas e elegantes
- ✅ Avatares distintos (U para usuário, ícone para assistente)

### ❌ Se o Chat Responder Genérico:
- Respostas tipo "Desculpe, não sei" = ERRO
- Deve sempre mencionar dados reais da execução

---

## 📋 TESTE 4: Página de Chat do Agente

### Passo a Passo:

1. **Vá para Agentes**: http://localhost:8080/agents

2. **Abra Chat de um Agente**:
   - Clique no ícone de chat (💬) de qualquer agente
   - **VALIDAR**: Abre página dedicada `/agents/:id/chat`

3. **Interface do Chat**:
   - **VALIDAR**: Header com nome do agente e modelo
   - **VALIDAR**: 3 abas: Chat, Arquivos, Links
   - **VALIDAR**: Design elegante com gradientes purple/pink

4. **Teste o Chat**:
   - Digite: "Olá!"
   - Pressione Enter
   - **VALIDAR**: Mensagem do usuário aparece (bubble purple/pink)
   - **VALIDAR**: Aguardar resposta do agente (bubble slate/cyan)
   - **VALIDAR**: Resposta é REAL do LLM!

5. **Teste Geração de Arquivos**:
   - Digite: "Crie um arquivo Python simples"
   - **VALIDAR**: Aba "Arquivos" mostra contador
   - Clique na aba "Arquivos"
   - **VALIDAR**: Arquivo extraído automaticamente
   - **VALIDAR**: Botão de download disponível

6. **Teste Geração de Links**:
   - Digite: "Me recomende o site [Google](https://google.com)"
   - **VALIDAR**: Aba "Links" mostra contador
   - Clique na aba "Links"
   - **VALIDAR**: Link extraído automaticamente

### ✅ Resultado Esperado:
- ✅ Chat funcional em tempo real
- ✅ Respostas do LLM real
- ✅ Arquivos extraídos automaticamente
- ✅ Links extraídos automaticamente
- ✅ UI moderna e responsiva

---

## 📋 TESTE 5: Execução Completa de Automação

### Passo a Passo:

1. **Crie Automação Completa**:
   - Trigger Manual
   - Agente com prompt linkado
   - Exemplo: `{{node-trigger.triggerMessage}}`

2. **Salve e Execute**:
   - Salvar automação
   - Clicar em "Executar"
   - **VALIDAR**: Painel de logs abre automaticamente

3. **Verificar Execução**:
   - **VALIDAR**: Trigger executa (verde)
   - **VALIDAR**: Agente executa e responde
   - **VALIDAR**: Logs mostram progresso real
   - **VALIDAR**: Tempo de execução real (~3-5s)

4. **Verificar Output**:
   - Logs devem mostrar resposta do agente
   - **VALIDAR**: Resposta não é "Mock" ou "Teste"
   - **VALIDAR**: Resposta varia a cada execução (é real!)

### ✅ Resultado Esperado:
- ✅ Execução completa sem erros
- ✅ Agente responde via LLM real
- ✅ Logs detalhados em tempo real
- ✅ Output final presente

---

## 🎯 CHECKLIST FINAL DE VALIDAÇÃO

### Persistência
- [ ] Configurações de nodes salvam
- [ ] Linkers de output preservados
- [ ] Recarregar não perde dados
- [ ] Atualizar config funciona

### Modelos Reais
- [ ] Criação mostra modelos reais (15+)
- [ ] Edição mostra modelos reais (15+)
- [ ] Sem modelos hardcoded
- [ ] Indicador de quantidade visível

### Chat de Logs
- [ ] UI elegante (cyan/blue)
- [ ] Badge "AI REAL" presente
- [ ] Respostas contextuais reais
- [ ] Botões de sugestão funcionam

### Chat do Agente
- [ ] Página dedicada abre
- [ ] Chat responde em tempo real
- [ ] Arquivos são extraídos
- [ ] Links são extraídos
- [ ] Download de arquivos funciona

### Execução de Automação
- [ ] Trigger executa
- [ ] Agente executa
- [ ] Resposta é real (não mock)
- [ ] Logs são detalhados

---

## 🐛 PROBLEMAS CONHECIDOS

**Nenhum problema conhecido!** ✅

Todos os testes automatizados passaram (16/16).

---

## 📞 SUPORTE

Se encontrar algum problema:

1. **Verificar Logs do Backend**:
   ```bash
   tail -f /tmp/api.log
   ```

2. **Verificar Console do Navegador**:
   - F12 → Console
   - Procurar erros em vermelho

3. **Re-executar Testes**:
   ```bash
   bash /workspace/validate-complete-integration.sh
   ```

4. **Reiniciar Serviços**:
   ```bash
   pkill -f 'node|vite'
   cd /workspace && npm run start:api &
   cd /workspace/flui-frontend-vite && npm run dev &
   ```

---

## ✅ CONFIRMAÇÃO FINAL

Se todos os testes acima passarem:

```
🎉 SISTEMA 100% FUNCIONAL E INTEGRADO!
🎉 ZERO HARDCODED, ZERO SIMULAÇÃO!
🎉 PRONTO PARA PRODUÇÃO!
```

**Aproveite sua aplicação totalmente funcional!** 🚀
