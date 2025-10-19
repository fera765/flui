# 📚 Flui - Exemplos de Uso

## 🚀 Guia de Início Rápido

### 1. Primeira Execução

```bash
$ flui

┌─────────────────────────────────────────────────┐
│ ⚡ FLUI - Sistema de Automação com Agentes      │
│ View: chat | Sessão: Nova Sessão | Mensagens: 1 │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ 📝 Timeline de Execução                          │
│                                                  │
│ [12:00:00] ℹ️ SYSTEM                            │
│   ⚡ Bem-vindo ao Flui!                          │
│                                                  │
│   Sistema CLI revolucionário de automação...    │
│                                                  │
│   🚀 Primeiros passos:                          │
│   1. Configure seu LLM com /settings            │
│   2. Explore os agentes com /agents             │
│   3. Veja os MCPs disponíveis com /mcps         │
│   4. Mude o tema com /theme <nome>             │
│   5. Digite /help para ver todos os comandos    │
│                                                  │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ ▶ █                                              │
│ / comandos | @ mencionar agente | Enter enviar  │
└─────────────────────────────────────────────────┘
```

### 2. Configurar LLM

```bash
▶ /settings

┌─────────────────────────────────────────────────┐
│ ⚙️ CONFIGURAÇÕES                                 │
│                                                  │
│ ┌─────────────────────────────────────────────┐ │
│ │ ▶ Endpoint LLM:     https://api.openai.com/v1│ │
│ │   API Key:          ••••••••••                │ │
│ │   Modelo:           gpt-4-turbo-preview       │ │
│ │   Temperature:      0.7                       │ │
│ │   Max Tokens:       2000                      │ │
│ │   Tema:             default                   │ │
│ └─────────────────────────────────────────────┘ │
│                                                  │
│ 💡 Temas disponíveis: default, cyberpunk,       │
│    minimal, ocean                                │
│                                                  │
│ ↑↓ Navegar | Enter editar | Esc voltar          │
└─────────────────────────────────────────────────┘
```

## 💬 Exemplos de Conversação

### Conversa Simples

```bash
▶ Como faço para criar uma API REST em Node.js?

[12:05:23] 👤 USER
  Como faço para criar uma API REST em Node.js?

[12:05:25] 🤖 ASSISTANT
  Vou te ajudar a criar uma API REST em Node.js! Aqui está um guia passo a passo:

  1. Instale as dependências:
  ```bash
  npm init -y
  npm install express
  ```

  2. Crie um arquivo server.js:
  ```javascript
  const express = require('express');
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  app.get('/api/users', (req, res) => {
    res.json({ users: [] });
  });

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
  ```

  3. Execute:
  ```bash
  node server.js
  ```

  Isso cria uma API básica com um endpoint GET!
```

### Usando Agente Específico

```bash
▶ @CodeAssistant revise este código e sugira melhorias

[12:10:15] 👤 USER
  @CodeAssistant revise este código e sugira melhorias
  
  function calc(a, b) {
    return a + b;
  }

[12:10:17] ⚙️ CODEASSISTANT 🔄
  Processando...

[12:10:19] ⚙️ CODEASSISTANT
  Aqui está uma revisão do seu código:

  Melhorias sugeridas:
  1. Adicionar tipos (TypeScript)
  2. Validação de entrada
  3. Documentação JSDoc
  4. Tratamento de edge cases

  Código melhorado:
  ```typescript
  /**
   * Soma dois números
   * @param {number} a - Primeiro número
   * @param {number} b - Segundo número
   * @returns {number} Soma de a e b
   * @throws {TypeError} Se os parâmetros não forem números
   */
  function calculate(a: number, b: number): number {
    if (typeof a !== 'number' || typeof b !== 'number') {
      throw new TypeError('Parâmetros devem ser números');
    }
    return a + b;
  }
  ```

  🔧 Tools: codeAnalysis, linting
```

## 🎨 Mudança de Tema

### Tema Cyberpunk

```bash
▶ /theme cyberpunk

[12:15:30] ℹ️ SYSTEM
  ✨ Tema alterado para: cyberpunk

# A interface muda instantaneamente para cores neon (magenta, cyan, amarelo)
```

### Tema Ocean

```bash
▶ /theme ocean

[12:16:00] ℹ️ SYSTEM
  ✨ Tema alterado para: ocean

# Interface muda para tons de azul (oceano profundo)
```

## 🤖 Gerenciamento de Agentes

### Listar Agentes

```bash
▶ /agents

┌─────────────────────────────────────────────────┐
│ 🤖 GERENCIAR AGENTES (3 agentes)                 │
│                                                  │
│ ┌─────────────────────────────────────────────┐ │
│ │ ▶ CodeAssistant - Especialista em programação│ │
│ │   📝 Prompt: Você é um assistente de...      │ │
│ │   🤖 Modelo: gpt-4-turbo-preview             │ │
│ │   🔧 MCPs: 2                                 │ │
│ │                                               │ │
│ │   DataAnalyst - Analista de dados            │ │
│ │   AutomationExpert - Especialista em...      │ │
│ └─────────────────────────────────────────────┘ │
│                                                  │
│ ↑↓ Navegar | n Novo | Enter Editar | d Deletar  │
└─────────────────────────────────────────────────┘
```

### Criar Novo Agente

```bash
▶ /agents
# Pressionar 'n'

┌─────────────────────────────────────────────────┐
│ ➕ CRIAR AGENTE                                  │
│                                                  │
│ ┌─────────────────────────────────────────────┐ │
│ │ ▶ Nome: DevOpsExpert█                        │ │
│ │                                               │ │
│ │   Descrição:                                  │ │
│ │   System Prompt:                              │ │
│ │   Modelo (opcional):                          │ │
│ └─────────────────────────────────────────────┘ │
│                                                  │
│ Tab/↑↓ Navegar | Digite para preencher          │
│ Enter salvar | Esc cancelar                     │
└─────────────────────────────────────────────────┘
```

## 🔌 MCPs (Model Context Protocols)

### Listar MCPs

```bash
▶ /mcps

┌─────────────────────────────────────────────────┐
│ 🔌 MODEL CONTEXT PROTOCOLS (MCPs) (4 MCPs)      │
│                                                  │
│ ┌─────────────────────────────────────────────┐ │
│ │ ▶ FileSystem MCP v1.0.0 ✓                    │ │
│ │   Operações com sistema de arquivos          │ │
│ │   🔧 Tools disponíveis:                       │ │
│ │     • readFile - Ler conteúdo de um arquivo  │ │
│ │     • writeFile - Escrever conteúdo...       │ │
│ │     • listDirectory - Listar arquivos...     │ │
│ │                                               │ │
│ │   Web MCP v1.0.0 ✓                           │ │
│ │   Operações web e HTTP                        │ │
│ │                                               │ │
│ │   Code Execution MCP v1.0.0 ✓               │ │
│ │   Executar código em diferentes linguagens   │ │
│ │                                               │ │
│ │   Database MCP v1.0.0 ✓                      │ │
│ │   Operações com bancos de dados              │ │
│ └─────────────────────────────────────────────┘ │
│                                                  │
│ ↑↓ Navegar | Esc Voltar                         │
└─────────────────────────────────────────────────┘
```

## 📊 Status do Sistema

```bash
▶ /status

[12:25:00] ℹ️ SYSTEM
  📊 Status do Sistema:
  - Agentes: 3
  - MCPs: 4
  - Sessões: 2
  - Tema: cyberpunk
  - Modelo: gpt-4-turbo-preview
```

## 🔄 Sessões

### Criar Nova Sessão

```bash
▶ /new Projeto React

[12:30:00] ℹ️ SYSTEM
  ✅ Nova sessão criada: Projeto React

# Agora você está em uma nova sessão vazia
```

### Alternar Sessões

```bash
▶ /sessions

# Lista todas as sessões e permite alternar entre elas
```

## 📝 Comandos com Autocomplete

### Digitando "/"

```bash
▶ /█

┌─────────────────────────────────────────────────┐
│ 💡 Comandos Disponíveis                          │
│                                                  │
│ ▶ /help - Mostra todos os comandos              │
│   /settings - Abre as configurações              │
│   /agents - Gerenciar agentes                    │
│   /mcps - Gerenciar MCPs                         │
│   /models - Selecionar modelo LLM                │
│   /automations - Gerenciar automações            │
│   /sessions - Gerenciar sessões                  │
│   /theme - Alterar tema da interface             │
│   /clear - Limpar timeline                       │
│   /new - Criar nova sessão                       │
│   /status - Mostra status do sistema             │
│   /chat - Voltar para o chat                     │
│                                                  │
│ ↑↓ Navegar | Enter Selecionar | Esc Cancelar    │
└─────────────────────────────────────────────────┘
```

### Filtrar Comandos

```bash
▶ /ag█

┌─────────────────────────────────────────────────┐
│ 💡 Comandos Disponíveis                          │
│                                                  │
│ ▶ /agents - Gerenciar agentes                    │
│                                                  │
│ ↑↓ Navegar | Enter Selecionar | Esc Cancelar    │
└─────────────────────────────────────────────────┘
```

## 🎯 Mencionando Agentes

### Digitando "@"

```bash
▶ @█

┌─────────────────────────────────────────────────┐
│ 🤖 Mencionar Agente                              │
│                                                  │
│ ▶ @CodeAssistant - Especialista em programação  │
│   🔧 MCPs: 2                                     │
│                                                  │
│   @DataAnalyst - Analista de dados              │
│   @AutomationExpert - Especialista em...        │
│                                                  │
│ ↑↓ Navegar | Enter Selecionar | Esc Cancelar    │
└─────────────────────────────────────────────────┘
```

### Filtrar Agentes

```bash
▶ @Code█

┌─────────────────────────────────────────────────┐
│ 🤖 Mencionar Agente                              │
│                                                  │
│ ▶ @CodeAssistant - Especialista em programação  │
│   🔧 MCPs: 2                                     │
│                                                  │
│ ↑↓ Navegar | Enter Selecionar | Esc Cancelar    │
└─────────────────────────────────────────────────┘
```

## 🔧 Casos de Uso Avançados

### 1. Análise de Dados

```bash
▶ @DataAnalyst analise os dados de vendas do último trimestre

[13:00:00] 👤 USER
  @DataAnalyst analise os dados de vendas do último trimestre

[13:00:02] ⚙️ DATAANALYST
  Vou analisar os dados de vendas. Primeiro, preciso acessar os dados.
  
  Posso ajudar a:
  1. Carregar dados de arquivo CSV/Excel
  2. Conectar a banco de dados
  3. Gerar visualizações
  4. Calcular métricas-chave (revenue, growth, etc.)
  5. Identificar tendências e anomalias
  
  🔧 Tools: readFile, queryDatabase, dataAnalysis
  
  Como você gostaria de prosseguir?
```

### 2. Automação de Deploy

```bash
▶ @AutomationExpert crie um workflow de deploy automático

[13:15:00] 👤 USER
  @AutomationExpert crie um workflow de deploy automático

[13:15:03] ⚙️ AUTOMATIONEXPERT
  Vou criar um workflow de deploy automático. Aqui está a estrutura:

  Workflow: Deploy Automático
  
  1. Build & Test
     - Executar testes
     - Build da aplicação
     - Lint & Code quality
  
  2. Deploy Staging
     - Push para staging
     - Smoke tests
     - Health checks
  
  3. Deploy Production
     - Backup atual
     - Deploy gradual (canary)
     - Monitoramento
     - Rollback automático se erro
  
  Gostaria que eu crie os scripts para este workflow?
  
  🔧 Tools: executeShell, gitOps, monitoring
```

### 3. Code Review

```bash
▶ @CodeAssistant faça code review deste PR

[13:30:00] 👤 USER
  @CodeAssistant faça code review deste PR
  [link do PR]

[13:30:05] ⚙️ CODEASSISTANT
  Revisando o Pull Request...

  ✅ Pontos Positivos:
  - Código bem estruturado
  - Testes adicionados
  - Documentação atualizada

  ⚠️ Sugestões de Melhoria:
  1. Adicionar tratamento de erro na linha 42
  2. Refatorar função `processData()` - muito longa
  3. Adicionar tipos TypeScript em `helpers.js`
  4. Considerar usar async/await ao invés de Promises
  
  🔴 Issues Críticos:
  1. Vazamento de memória potencial no loop linha 156
  2. SQL Injection vulnerability na query linha 89
  
  🔧 Tools: codeAnalysis, securityScan, performanceCheck
  
  Recomendação: Aprovar após corrigir issues críticos.
```

## 🌈 Exemplos dos Temas

### Default (Tema Padrão)
```
Cores: Ciano, Roxo, Rosa
Estilo: Moderno, Dark
Uso: Geral, uso prolongado
```

### Cyberpunk (Neon)
```
Cores: Magenta, Ciano, Amarelo
Estilo: Futurístico, Vibrante
Uso: Quando você quer se sentir no futuro
```

### Minimal (Claro)
```
Cores: Preto, Cinza, Branco
Estilo: Limpo, Minimalista
Uso: Foco em conteúdo, apresentações
```

### Ocean (Oceano)
```
Cores: Azul escuro, Azul claro, Ciano
Estilo: Calmo, Relaxante
Uso: Sessões longas, menos cansativo
```

## 🎓 Dicas Pro

### 1. Atalhos de Teclado
- `Ctrl+C` - Sair do Flui
- `↑↓` - Navegar em listas
- `Enter` - Selecionar/Confirmar
- `Esc` - Cancelar/Voltar
- `Tab` - Próximo campo (em formulários)

### 2. Comandos Rápidos
- `/h` - Alias para /help
- `/cfg` - Alias para /settings
- `/auto` - Alias para /automations

### 3. Produtividade
1. Use `/clear` para limpar timeline quando ficar muito longa
2. Crie sessões diferentes para projetos diferentes
3. Use agentes específicos para tarefas específicas
4. Combine múltiplos MCPs para workflows complexos

### 4. Melhores Práticas
1. Configure seu LLM antes de começar
2. Teste diferentes temperaturas para diferentes tarefas
3. Use system prompts específicos em agentes
4. Organize sessões por projeto/contexto
5. Experimente os diferentes temas para ver qual você prefere

---

**Flui** - Transformando automação em simplicidade. ⚡
