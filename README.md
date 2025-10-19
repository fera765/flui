# ⚡ Flui

**Flui** é um sistema CLI revolucionário de automação com agentes inteligentes, construído 100% com React e Ink.

## 🚀 Características Inovadoras

### 🤖 Sistema de Agentes
- Crie agentes personalizados com prompts específicos
- Cada agente pode ter seu próprio modelo LLM
- Mencione agentes usando `@nomeAgente` para tarefas específicas
- Gerenciamento completo de ciclo de vida dos agentes

### 🔌 Model Context Protocol (MCP)
- Sistema extensível de plugins
- Cada MCP contém múltiplas ferramentas (tools)
- Agentes podem usar MCPs para expandir suas capacidades
- MCPs padrão incluídos: FileSystem, Web, Code Execution, Database

### 💬 Timeline Interativa
- Visualização em tempo real da execução
- Estados de mensagens: pending, processing, completed, error
- Contexto completo das conversas
- Histórico persistente por sessão

### 🎨 Sistema de Temas
- 4 temas únicos: Default, Cyberpunk, Minimal, Ocean
- Mudança em tempo real com `/theme <nome>`
- Cores otimizadas para legibilidade
- Suporte a customização futura

### ⚙️ Configurações Avançadas
- Endpoint LLM customizável
- Suporte a qualquer API compatível com OpenAI
- Configuração de temperatura e max tokens
- Seleção dinâmica de modelos
- Persistência automática de todas as configurações

### 🎯 Interface Inteligente
- Comandos com `/` e autocomplete
- Menções de agentes com `@` e busca inteligente
- Navegação por teclado em todas as telas
- Input área fixada no bottom

## 📦 Instalação

```bash
# Instalar dependências
npm install

# Build do projeto
npm run build

# Executar
npm start
# ou
flui
```

## 🎮 Comandos Disponíveis

- `/help` - Mostra todos os comandos
- `/settings` - Abre configurações
- `/agents` - Gerenciar agentes
- `/mcps` - Gerenciar MCPs
- `/models` - Selecionar modelo LLM
- `/automations` - Gerenciar automações
- `/sessions` - Gerenciar sessões
- `/theme <nome>` - Alterar tema
- `/clear` - Limpar timeline
- `/new <nome>` - Criar nova sessão
- `/status` - Status do sistema
- `/chat` - Voltar ao chat

## 🤖 Agentes Padrão

### CodeAssistant
Especialista em programação e desenvolvimento de software

### DataAnalyst
Analista de dados e visualização

### AutomationExpert
Especialista em automação e workflows

## 🔌 MCPs Padrão

### FileSystem MCP
- `readFile` - Ler arquivo
- `writeFile` - Escrever arquivo
- `listDirectory` - Listar diretório

### Web MCP
- `fetchURL` - Requisição HTTP
- `searchWeb` - Buscar na web

### Code Execution MCP
- `executePython` - Executar Python
- `executeJavaScript` - Executar JS
- `executeShell` - Executar Shell

### Database MCP
- `queryDatabase` - Executar query SQL
- `insertData` - Inserir dados

## 🎨 Temas

- **default** - Tema escuro moderno com cores vibrantes
- **cyberpunk** - Inspirado em estética cyberpunk com neons
- **minimal** - Tema claro minimalista
- **ocean** - Tons de azul inspirados no oceano

## 🧪 Testes

```bash
# Executar testes
npm test

# Modo watch
npm run test:watch

# UI de testes
npm run test:ui
```

## 🏗️ Arquitetura

```
source/
├── components/      # Componentes React/Ink
├── views/          # Telas da aplicação
├── store/          # State management (Zustand)
├── services/       # Serviços (LLM, MCPs)
├── commands/       # Sistema de comandos
├── themes/         # Temas da interface
├── types/          # TypeScript types
└── __tests__/      # Testes unitários
```

## 🔒 Persistência

Todos os dados são persistidos localmente usando `conf`:
- Configurações LLM
- Agentes criados
- MCPs instalados
- Sessões e histórico
- Preferências de tema

## 📝 Uso com Agentes

```bash
# Mencionar um agente específico
Você: @CodeAssistant crie uma função para validar email

# O agente CodeAssistant responderá com seu contexto especializado
```

## 🌐 Configuração LLM

1. Execute `/settings`
2. Configure seu endpoint (ex: https://api.openai.com/v1)
3. Adicione sua API Key
4. Selecione o modelo com `/models`
5. Ajuste temperature e max tokens conforme necessário

## 🎯 Diferencial Competitivo

### vs n8n
- ✅ 100% na CLI (mais leve e rápido)
- ✅ Agentes com contexto personalizado
- ✅ Sistema MCP extensível
- ✅ Timeline interativa em tempo real

### vs Agent Build
- ✅ Interface mais intuitiva
- ✅ Comandos com autocomplete
- ✅ Múltiplos temas
- ✅ Persistência local
- ✅ Totalmente open source

## 🚀 Roadmap

- [ ] Implementação de automações visuais
- [ ] Marketplace de MCPs
- [ ] Execução de workflows paralelos
- [ ] Integração com Git
- [ ] Export/Import de agentes e automações
- [ ] Dashboard de métricas
- [ ] Plugin para VS Code

## 📄 Licença

MIT

## 👥 Contribuindo

Contribuições são bem-vindas! Este é um projeto inovador e estamos construindo o futuro da automação CLI.

---

**Flui** - O futuro da automação está na CLI. ⚡
