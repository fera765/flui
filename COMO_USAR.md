# 🚀 Como Usar o Flui v2.0

## 📋 Pré-requisitos

- Node.js >= 18.0.0
- npm
- Terminal com suporte a cores e Unicode
- API Key de uma LLM compatível com OpenAI SDK

---

## 🔧 Instalação e Build

```bash
# 1. Entre na pasta do projeto
cd /workspace

# 2. Instale as dependências (se necessário)
npm install

# 3. Faça o build
npm run build

# Build bem-sucedido aparecerá:
# > flui@1.0.0 build
# > tsc && chmod +x dist/cli.js
```

---

## ⚡ Executando o Flui

### Método 1: Via npm
```bash
npm start
```

### Método 2: Direto
```bash
./dist/cli.js
```

### Método 3: Node
```bash
node dist/cli.js
```

---

## 🎯 Primeira Execução

Ao executar, você verá:

```
╭────────────────────────────────────────────────────╮
│ ⚡ FLUI - Sistema de Automação com Agentes         │
╰────────────────────────────────────────────────────╯

╭────────────────────────────────────────────────────╮
│ ⚡ Bem-vindo ao Flui!                              │
│                                                    │
│ Sistema CLI revolucionário de automação com        │
│ agentes IA.                                        │
│                                                    │
│ 🚀 Primeiros passos:                              │
│   1. Configure LLM com /settings                   │
│   2. Selecione modelo com /models                  │
│   3. Escolha tema com /theme                       │
│   4. Execute automações com /automations           │
│   5. Digite /help para ver todos os comandos       │
│                                                    │
│ 💡 Use @ para mencionar agentes e / para comandos │
╰────────────────────────────────────────────────────╯

╭────────────────────────────────────────────────────╮
│ ▶ █                                                │
│ / comandos | @ mencionar agente | Enter enviar    │
╰────────────────────────────────────────────────────╯
```

---

## ⚙️ Passo 1: Configurar LLM

```
/settings
```

Navegue com ↑↓ e Enter para editar:

1. **Endpoint LLM**: Já configurado em `https://api.llm7.io/v1`
2. **API Key**: Cole sua chave da API
3. **Model**: Será selecionado no próximo passo
4. **Temperature**: 0.7 (padrão, ajuste se quiser)
5. **Max Tokens**: 2000 (padrão, ajuste se quiser)

Pressione **Esc** para voltar ao chat.

---

## 🤖 Passo 2: Selecionar Modelo

```
/models
```

A CLI buscará os modelos disponíveis no endpoint.

- Use **↑↓** para navegar
- **Enter** para selecionar
- **Esc** para voltar

Exemplo de modelos que podem aparecer:
- gpt-4-turbo-preview
- gpt-4
- gpt-3.5-turbo
- E outros disponíveis no endpoint

---

## 🎨 Passo 3: Escolher Tema (Opcional)

```
/theme
```

4 temas disponíveis:

1. **default** - Moderno escuro com cores vibrantes
2. **cyberpunk** - Neon futurista (magenta, cyan, amarelo)
3. **minimal** - Claro minimalista
4. **ocean** - Tons de azul relaxante

- Use **↑↓** para ver preview
- **Enter** para aplicar
- Mudança é instantânea!

---

## 💬 Passo 4: Conversar com Streaming

Agora você pode conversar normalmente!

```
> Explique o que é inteligência artificial em detalhes
```

A resposta aparecerá **em tempo real**, palavra por palavra, na timeline:

```
┌──────────────────────────────────────────┐
│ ▶ Explique o que é inteligência...     │
└──────────────────────────────────────────┘

  Inteligência artificial (IA) é um campo da 
  ciência da computação dedicado a criar sistemas
  [texto continua aparecendo em tempo real...]
```

---

## 🤖 Passo 5: Mencionar Agentes Específicos

Use **@** para mencionar um agente especializado:

```
> @CodeAssistant crie uma função Python para validar email
```

Agentes disponíveis:
- **@CodeAssistant** - Programação
- **@DataAnalyst** - Análise de dados
- **@AutomationExpert** - Automações
- **@MarketAnalyst** - Análise de mercado
- **@ContentWriter** - Redação
- **@ResearchAgent** - Pesquisa
- **@CommunicationAgent** - Comunicação

Para ver sugestões, digite **@** e use **↑↓** para navegar.

---

## 🔄 Passo 6: Executar Automações

```
/automations
```

Você verá 2 automações demo prontas:

### Automação 1: Monitor de Preços e Análise de Mercado
- Busca preços de produtos
- Analisa com agentes especializados
- Gera relatório PDF
- Envia email em massa

### Automação 2: Criação de Conteúdo Multimídia
- Pesquisa o tópico
- Escreve artigo completo
- Gera imagens com IA
- Cria áudio e vídeo
- Publica em 5 plataformas

**Para executar**:
- Navegue com **↑↓**
- Pressione **Enter**
- Veja a execução em tempo real na timeline!

---

## 📝 Comandos Disponíveis

Digite **/** para ver sugestões. Comandos principais:

```
/help           - Lista todos os comandos
/settings       - Configurações do sistema
/models         - Selecionar modelo LLM
/theme          - Escolher tema
/agents         - Gerenciar agentes
/mcps           - Ver MCPs disponíveis
/automations    - Executar automações
/sessions       - Gerenciar sessões
/new <nome>     - Criar nova sessão
/clear          - Limpar timeline
/status         - Status do sistema
/chat           - Voltar ao chat
```

---

## 🎨 Atalhos do Teclado

- **↑↓** - Navegar em listas
- **Enter** - Selecionar/Confirmar
- **Esc** - Voltar/Cancelar
- **Tab** - Próximo campo (em formulários)
- **Ctrl+C** - Sair do Flui

---

## 💡 Dicas Pro

### 1. Autocomplete de Comandos
```
/set█
```
Digite `/` e comece a digitar. Use **↑↓** para ver sugestões.

### 2. Autocomplete de Agentes
```
@Code█
```
Digite `@` e comece a digitar. Use **↑↓** para ver agentes.

### 3. Sessões Múltiplas
```
/new Projeto React
```
Crie sessões diferentes para projetos diferentes.

### 4. Ver Agentes Disponíveis
```
/agents
```
Veja todos os agentes, seus prompts e MCPs associados.

### 5. Ver Tools Disponíveis
```
/mcps
```
Veja todos os MCPs e suas ferramentas.

---

## 🔧 Gerenciamento Avançado

### Criar Novo Agente
```
/agents
```
Pressione **n** para criar novo agente.

### Ver Histórico de Execuções
Todas as execuções de automações são salvas automaticamente.

### Limpar Timeline
```
/clear
```
Limpa apenas a timeline visual, não apaga o histórico.

---

## 📊 Monitorando Automações

Quando uma automação executa, você verá na timeline:

```
┌──────────────────────────────────────┐
│ ▶ Execute análise de mercado        │
└──────────────────────────────────────┘

ℹ️ 🚀 Executando automação: Monitor de Preços...

ℹ️ 🔄 Automação em andamento:
    • Sandbox: Sandbox criado
    
ℹ️ 🔄 Automação em andamento:
    • Trigger Manual: Executando nó

ℹ️ ✅ Automação em andamento:
    • Trigger Manual: Nó concluído

[... cada step aparece em tempo real ...]

ℹ️ ✅ Automação concluída: Monitor de Preços...

Resultado: {...}
```

---

## 🐛 Troubleshooting

### Erro: "LLM não configurado"
**Solução**: Execute `/settings` e adicione sua API Key.

### Erro: "Modelo não selecionado"
**Solução**: Execute `/models` e selecione um modelo.

### Timeline não atualiza
**Solução**: Verifique se tem mensagens. Use `/status` para ver estado.

### Comando não funciona
**Solução**: Digite `/help` para ver comandos válidos.

### Streaming não aparece
**Solução**: Verifique se API Key está correta e modelo selecionado.

---

## 💾 Dados Persistidos

Tudo é salvo automaticamente em:
```
~/.config/flui/config.json
```

Dados salvos:
- ✅ Configurações LLM
- ✅ Tema selecionado
- ✅ Agentes criados
- ✅ MCPs instalados
- ✅ Sessões e histórico
- ✅ Automações
- ✅ Últimas 100 execuções

---

## 🚀 Exemplo de Fluxo Completo

```bash
# 1. Inicie o Flui
npm start

# 2. Configure (primeira vez)
/settings
# [Adicione API Key]
# [Esc para voltar]

# 3. Selecione modelo
/models
# [↑↓ para navegar]
# [Enter para selecionar]

# 4. Escolha tema
/theme
# [↑↓ para ver preview]
# [Enter para aplicar]

# 5. Converse normalmente
> Olá! Como você funciona?

# 6. Use agente especializado
> @CodeAssistant crie uma API REST em Node.js

# 7. Execute automação
/automations
# [↑↓ para navegar]
# [Enter para executar]

# 8. Saia quando quiser
# [Ctrl+C]
```

---

## 📚 Recursos Adicionais

- **README.md** - Visão geral do projeto
- **FEATURES.md** - Funcionalidades detalhadas
- **EXEMPLOS.md** - Exemplos de uso
- **FEEDBACK_FINAL_PT.md** - Features implementadas

---

## 🎉 Pronto!

Agora você está pronto para usar o **Flui v2.0**!

Explore, experimente e automatize! ⚡

---

**Flui v2.0** - Automação com IA reimaginada para a CLI.

Desenvolvido com ❤️ usando React + Ink + TypeScript
