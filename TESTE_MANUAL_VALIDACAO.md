# ✅ TESTE MANUAL DE VALIDAÇÃO (QA-001)

## 🎯 Checklist Completo de Testes Manuais

**Data:** 2025-10-20  
**Status:** ✅ **PRONTO PARA EXECUTAR**

---

## 📋 CASOS DE TESTE OBRIGATÓRIOS

### ✅ TESTE 1: Simples (Node1 → Node2)

**Objetivo:** Validar encadeamento básico de 2 nodes

**Passos:**
1. Abrir http://localhost:5173
2. Clicar "Nova Automação"
3. Adicionar Node 1: Webhook Trigger
   - Configurar: `data: "Hello World"`
4. Adicionar Node 2: Data Transform
   - Configurar: `input: {{node-1.data}}`
5. Salvar automação (nome: "Teste Simples")
6. Recarregar página (F5)
7. Abrir automação "Teste Simples"
8. Verificar:
   - ✅ Node 1 existe com config preservada
   - ✅ Node 2 existe com referência `{{node-1.data}}` intacta
   - ✅ Edge conectando Node 1 → Node 2
9. Clicar "Executar"
10. Verificar:
    - ✅ Execução completa sem erros
    - ✅ Logs mostram ambos os nodes
    - ✅ Node 2 recebeu dados do Node 1

**Critério de Sucesso:** Automação salva, carregada e executada corretamente

---

### ✅ TESTE 2: Médio (Node1 → Node2 → Node3)

**Objetivo:** Validar encadeamento de 3 nodes

**Passos:**
1. Nova Automação
2. Adicionar Node 1: Webhook Trigger
   - Config: `message: "Start"`
3. Adicionar Node 2: Data Transform
   - Config: `input: {{node-1.message}}`
4. Adicionar Node 3: HTTP Request
   - Config: `body: {{node-2.result}}`
5. Salvar (nome: "Teste Encadeado")
6. Executar
7. Verificar logs:
   - ✅ Node 1 executado
   - ✅ Node 2 executado (recebeu message)
   - ✅ Node 3 executado (recebeu result)

**Critério de Sucesso:** Dados fluem corretamente pelos 3 nodes

---

### ✅ TESTE 3: Complexo (Branching)

**Objetivo:** Validar condições e branches

**Passos:**
1. Nova Automação
2. Adicionar Node 1: Webhook Trigger
3. Adicionar Node 2: Universal Condition
   - Config: `input: {{node-1.data}}`
4. Adicionar Node 3: Agent (Branch A)
   - Config: `prompt: {{node-1.data}}`
5. Adicionar Node 4: Agent (Branch B)
   - Config: `prompt: {{node-1.data}}`
6. Conectar:
   - Node 1 → Node 2
   - Node 2 → Node 3
   - Node 2 → Node 4
7. Salvar (nome: "Teste Branching")
8. Verificar estrutura salva
9. Recarregar
10. Verificar:
    - ✅ 4 nodes presentes
    - ✅ 3 edges presentes
    - ✅ Referências preservadas

**Critério de Sucesso:** Estrutura de branching preservada

---

### ✅ TESTE 4: Paralelo (Agregação)

**Objetivo:** Validar múltiplos pais → 1 filho

**Passos:**
1. Nova Automação
2. Adicionar Node 1: Webhook Trigger (Source 1)
   - Config: `data: "data1"`
3. Adicionar Node 2: Webhook Trigger (Source 2)
   - Config: `data: "data2"`
4. Adicionar Node 3: Data Merge (Aggregator)
   - Config: `input1: {{node-1.data}}`, `input2: {{node-2.data}}`
5. Conectar:
   - Node 1 → Node 3
   - Node 2 → Node 3
6. Salvar (nome: "Teste Paralelo")
7. Verificar no OutputSelector do Node 3:
   - ✅ Mostra outputs de Node 1 E Node 2
   - ✅ Permite selecionar de ambos

**Critério de Sucesso:** Múltiplas fontes de dados disponíveis

---

### ✅ TESTE 5: Erro (Node do meio falha)

**Objetivo:** Validar tratamento de erros

**Passos:**
1. Nova Automação
2. Adicionar Node 1: Webhook Trigger
3. Adicionar Node 2: HTTP Request
   - Config: `url: http://invalid-url-that-will-fail`
4. Adicionar Node 3: Data Transform
   - Config: `input: {{node-2.body}}`
5. Salvar (nome: "Teste Erro")
6. Executar
7. Verificar:
   - ✅ Node 1 completa
   - ✅ Node 2 falha com erro claro
   - ✅ Node 3 registra que não pode executar
   - ✅ Logs mostram stack de erro

**Critério de Sucesso:** Erro tratado gracefully, não quebra sistema

---

### ✅ TESTE 6: Persistência Após Restart

**Objetivo:** Validar que dados persistem após reiniciar serviço

**Passos:**
1. Criar automação "Teste Restart"
2. Adicionar 3 nodes com configs complexas
3. Salvar
4. **Parar a API** (Ctrl+C no terminal)
5. **Reiniciar a API** (`npm run start:api`)
6. Abrir frontend
7. Abrir automação "Teste Restart"
8. Verificar:
   - ✅ Todos os nodes presentes
   - ✅ Todas as configs preservadas
   - ✅ Todas as referências preservadas
9. Executar
10. Verificar:
    - ✅ Executa corretamente

**Critério de Sucesso:** Dados persistem mesmo após restart

---

### ✅ TESTE 7: Migration de Dados Antigos

**Objetivo:** Validar que dados em formato antigo são migrados

**Passos:**
1. No terminal, abrir console Node.js:
   ```bash
   node
   ```
2. Executar:
   ```javascript
   const Conf = require('conf');
   const config = new Conf({ projectName: 'flui' });
   const automations = config.get('automations') || [];
   
   // Adicionar automação no formato antigo
   automations.push({
     id: 'test-old-format',
     name: 'Old Format Test',
     nodes: [
       { id: 'n1', type: 'trigger', name: 'Start', config: {} }
     ],
     connections: [{ from: 'n1', to: 'n2' }], // Formato antigo!
     version: '1.0.0'
   });
   
   config.set('automations', automations);
   console.log('Automação antiga adicionada!');
   ```
3. Sair do console (Ctrl+D)
4. Abrir frontend
5. Verificar lista de automações
6. Abrir "Old Format Test"
7. Verificar:
   - ✅ Automação carregada
   - ✅ Version agora é '2.0.0'
   - ✅ Campo 'edges' existe (convertido de 'connections')
   - ✅ Edge tem source/target (convertido de from/to)

**Critério de Sucesso:** Migration automática funciona

---

### ✅ TESTE 8: Campos Ausentes (Validação)

**Objetivo:** Validar que campos ausentes recebem defaults

**Passos:**
1. Criar automação com campos mínimos:
   - Apenas name e nodes
2. Salvar
3. Recarregar
4. Inspecionar (console do browser):
   ```javascript
   // Na aba Network, ver payload da response
   ```
5. Verificar que a resposta contém:
   - ✅ `id` (gerado)
   - ✅ `description` (default '')
   - ✅ `nodes` (array)
   - ✅ `edges` (array, mesmo que vazio)
   - ✅ `enabled` (true)
   - ✅ `version` ('2.0.0')
   - ✅ `createdAt` (timestamp)
   - ✅ `updatedAt` (timestamp)
   - ✅ `metadata` (objeto completo)

**Critério de Sucesso:** Nenhum campo crítico é undefined

---

### ✅ TESTE 9: Múltiplas Atualizações

**Objetivo:** Validar que updates sucessivos funcionam

**Passos:**
1. Criar automação "Teste Updates"
2. Salvar (versão 1)
3. Adicionar mais 1 node
4. Salvar (versão 2)
5. Editar config de um node
6. Salvar (versão 3)
7. Recarregar
8. Verificar:
   - ✅ Última versão carregada
   - ✅ `createdAt` não mudou
   - ✅ `updatedAt` foi atualizado

**Critério de Sucesso:** Updates incrementais funcionam

---

### ✅ TESTE 10: OutputSelector (UI)

**Objetivo:** Validar que UI de seleção funciona

**Passos:**
1. Criar automação com 2 nodes
2. Configurar Node 2
3. Em um campo de texto, clicar no ícone 🔗
4. Verificar:
   - ✅ Dropdown abre
   - ✅ Mostra "Nome do Node 1"
   - ✅ Mostra keys disponíveis indentadas
   - ✅ Keys separadas por node
   - ✅ Visual claro (nome bold, keys indented)
5. Clicar em uma key
6. Verificar:
   - ✅ Campo preenchido com `{{node-1.key}}`
   - ✅ Indicador visual de referência ativa
7. Salvar config
8. Recarregar
9. Verificar:
   - ✅ Referência preservada
   - ✅ Indicador visual ainda presente

**Critério de Sucesso:** UI de binding funciona perfeitamente

---

## 📊 TEMPLATE DE RELATÓRIO

Após executar os testes, preencher:

```
DATA DO TESTE: _____________________
TESTADOR: __________________________

RESULTADOS:
[ ] TESTE 1: Simples         - PASSOU / FALHOU
[ ] TESTE 2: Médio           - PASSOU / FALHOU
[ ] TESTE 3: Complexo        - PASSOU / FALHOU
[ ] TESTE 4: Paralelo        - PASSOU / FALHOU
[ ] TESTE 5: Erro            - PASSOU / FALHOU
[ ] TESTE 6: Restart         - PASSOU / FALHOU
[ ] TESTE 7: Migration       - PASSOU / FALHOU
[ ] TESTE 8: Validação       - PASSOU / FALHOU
[ ] TESTE 9: Updates         - PASSOU / FALHOU
[ ] TESTE 10: UI             - PASSOU / FALHOU

BUGS ENCONTRADOS:
1. ___________________________________________
2. ___________________________________________
3. ___________________________________________

NOTAS:
_____________________________________________
_____________________________________________
_____________________________________________

APROVAÇÃO FINAL: SIM / NÃO
```

---

## ✅ CRITÉRIOS DE APROVAÇÃO

Para aprovar o sistema (QA-001 completo):
- ✅ Pelo menos 9 de 10 testes devem passar
- ✅ Nenhum bug crítico (perda de dados, crash)
- ✅ Performance aceitável (< 5s para salvar/carregar)
- ✅ UI responsiva e clara

---

## 🚀 COMO EXECUTAR

1. **Iniciar Sistema:**
   ```bash
   # Terminal 1: API
   npm run start:api
   
   # Terminal 2: Frontend
   cd flui-frontend-vite && npm run dev
   ```

2. **Abrir Browser:**
   - http://localhost:5173
   - Abrir DevTools (F12) para ver logs

3. **Executar Testes:**
   - Seguir cada teste em ordem
   - Marcar resultados no template
   - Anotar bugs encontrados

4. **Reportar:**
   - Preencher template
   - Criar issue para bugs
   - Aprovar ou reprovar

---

**Tempo Estimado:** 30-45 minutos  
**Pré-requisitos:** Sistema rodando (API + Frontend)  
**Responsável:** QA Team ou Desenvolvedor
