# 🚀 FLUI - Sistema de Automação Inteligente

## ✨ v2.0.0 - Sistema Completo e Aprimorado (2025-10-19)

**🎉 TODAS AS MELHORIAS IMPLEMENTADAS COM SUCESSO!**

### 🎯 Novidades Principais
- ✅ **Lista Dinâmica de Agentes** - Selecione agentes automaticamente, sem erros
- ✅ **Condição Universal** - 13 tipos de comparação, simples e poderosa
- ✅ **Smart Connections** - Auto-detecção e auto-fill de parâmetros
- ✅ **Webhook Integration** - Trigger + Response completos
- ✅ **17 Tools Validadas** - 100% testadas e funcionando

**📚 Documentação Completa:** Veja [`INDEX.md`](INDEX.md) para guias e exemplos

---

Sistema revolucionário de automação com **Tool Registry modular**, **editor de workflows visual** e **painéis de configuração dinâmicos**. Interface híbrida CLI + Web com suporte completo a metadados de ferramentas e validação automática.

## 🌟 Principais Funcionalidades

- ✨ **NodeConfigPanel Dinâmico**: Configuração de nós com formulários gerados automaticamente (sem JSON manual)
- 🔧 **Tool Registry Modular**: Registro e validação de ferramentas com metadados ricos
- 📄 **Paginação Completa**: APIs e listagens com paginação e filtros avançados
- 🎨 **Editor Visual de Workflows**: Drag-and-drop estilo n8n com suporte a múltiplas conexões
- 🧪 **Teste de Nós**: Teste ferramentas diretamente no editor com feedback em tempo real
- 📦 **Versionamento de Workflows**: Salvamento automático com histórico de versões
- 🔐 **Validação de Metadados**: JSON Schema para garantir qualidade das ferramentas
- 🚀 **Script de Validação Completo**: Build + Test + Validate em um único comando

## 📦 Instalação Rápida

```bash
cd /workspace
npm install

cd flui-frontend-vite
npm install
```

## 🔨 Build e Validação

### Validação Completa (Recomendado)

Execute o script completo que faz build, testes e validação:

```bash
./scripts/full-validate.sh
```

Este script executa:
1. ✅ Verificação de ambiente (Node.js, npm)
2. 📦 Instalação de dependências
3. 🔨 Build do backend/CLI
4. 🎨 Build do frontend
5. 🧪 Testes unitários
6. 🔍 Smoke tests da CLI
7. ✅ Validação do Tool Registry
8. 📋 Análise de logs

**Resultado esperado:**
```
╔═══════════════════════════════════════════════════════════╗
║   ✅ BUILD E VALIDAÇÃO: SUCESSO                           ║
║   Nenhum erro detectado.                                  ║
║   Sistema pronto para uso em produção.                    ║
╚═══════════════════════════════════════════════════════════╝
```

### Build Manual

```bash
# Backend/CLI
npm run build

# Frontend
cd flui-frontend-vite
npm run build
```

## ▶️ Executar o Sistema

### Backend + CLI

```bash
npm start
```

### API Server

```bash
node dist/cli.js --api
```

Acesso: http://localhost:3001

### Frontend (Dev Mode)

```bash
cd flui-frontend-vite
npm run dev
```

Acesso: http://localhost:8080

## 🧪 Testes

```bash
# Todos os testes
npm test

# Testes em watch mode
npm run test:watch

# Testes com UI
npm run test:ui
```

## 📚 Comandos CLI

### Ferramentas (Tools)

```bash
/tools list                              # Listar todas as ferramentas
/tools list --page=2 --page-size=10      # Com paginação
/tools info <tool-id>                    # Detalhes de uma ferramenta
/tools test <tool-id> '{"key":"value"}'  # Testar ferramenta
/tools delete <tool-id>                  # Deletar ferramenta
/tools categories                        # Listar categorias
```

### Workflows

```bash
/automations                 # Abrir gerenciador de workflows
/flow                        # Gerenciar fluxos
```

### Sistema

```bash
/help                        # Ajuda
/settings                    # Configurações
/status                      # Status do sistema
/test                        # Testar conexão LLM
/clear                       # Limpar timeline
```

## 🔌 API REST

### Ferramentas

```bash
# Listar ferramentas (com paginação)
GET /api/tools?page=1&pageSize=20&category=http&search=request

# Detalhes de uma ferramenta
GET /api/tools/:id

# Registrar nova ferramenta
POST /api/tools

# Atualizar ferramenta
PUT /api/tools/:id

# Deletar ferramenta
DELETE /api/tools/:id

# Testar execução de nó
POST /api/nodes/:nodeId/test
```

### Workflows

```bash
# Listar workflows
GET /api/workflows

# Obter workflow específico
GET /api/workflows/:id

# Salvar workflow (com versionamento)
PUT /api/workflows/:id/save

# Executar workflow
POST /api/flows/execute
```

### Categorias

```bash
GET /api/tools/categories
```

## 🎨 NodeConfigPanel Dinâmico

O painel de configuração de nós é gerado automaticamente com base nos metadados da ferramenta:

### Widgets Suportados

- **TextInput**: Entrada de texto simples
- **TextArea**: Texto longo/multilinha
- **Number**: Entrada numérica com validação
- **Select**: Dropdown com opções
- **MultiSelect**: Seleção múltipla
- **Toggle**: Switch on/off
- **KeyValue**: Editor chave-valor (headers, params)
- **JsonEditor**: Editor JSON com validação
- **CodeEditor**: Editor de código com syntax highlight

### Exemplo de Metadados

```typescript
{
  name: 'URL',
  key: 'url',
  type: 'string',
  required: true,
  ui: {
    widgetType: 'textInput',
    placeholder: 'https://api.example.com',
    helperText: 'URL completa incluindo protocolo',
    validation: {
      pattern: '^https?://.+',
    },
    allowExpressions: true,
  }
}
```

## 🔧 Ferramentas Built-in

### System
- **File Read** - Ler arquivos
- **File Write** - Escrever arquivos
- **File Edit** - Editar com regex
- **File Search** - Buscar arquivos (glob)
- **Text Search** - Buscar texto em arquivos
- **Shell Executor** - Executar comandos shell
- **System Info** - Informações do sistema

### HTTP
- **HTTP Request** - Requisições HTTP completas (GET, POST, PUT, DELETE, PATCH)
  - Query params
  - Headers customizados
  - Body JSON
  - Autenticação
  - Timeout configurável

### Agent
- **Agent Executor** - Executar agentes AI

### Custom
- **Custom Code** - Executar código customizado

## 📊 Estrutura do Projeto

```
flui/
├── source/                      # Backend/CLI
│   ├── core/                    # Core System
│   │   ├── types.ts            # Tipos e interfaces
│   │   ├── toolRegistry.ts     # Registry de ferramentas
│   │   ├── toolMetadataValidator.ts  # Validação de metadados
│   │   ├── toolExecutor.ts     # Executor de ferramentas
│   │   └── flowEngine.ts       # Engine de fluxos
│   ├── tools/                   # Ferramentas
│   │   ├── system/             # Ferramentas de sistema
│   │   ├── agent/              # Executores de agentes
│   │   └── custom/             # Código customizado
│   ├── services/                # Serviços
│   │   ├── apiServer.ts        # API REST
│   │   ├── sandbox.ts          # Sandbox de execução
│   │   └── ...
│   ├── commands/                # Comandos CLI
│   └── __tests__/              # Testes
│
├── flui-frontend-vite/          # Frontend React
│   └── src/
│       ├── pages/              # Páginas
│       │   ├── Home.tsx
│       │   ├── CreateAutomationV2.tsx
│       │   └── ToolsListPage.tsx
│       └── components/          # Componentes
│           ├── NodeConfigPanel.tsx  # ⭐ Painel dinâmico
│           ├── ToolNode.tsx
│           └── ToolPalette.tsx
│
└── scripts/
    └── full-validate.sh         # Script de validação completa
```

## ✅ Checklist de Validação

Antes de fazer commit/PR, execute:

```bash
./scripts/full-validate.sh
```

Requisitos para aprovação:
- ✅ Build do Flui sem erros
- ✅ Build do Frontend sem erros
- ✅ Testes unitários passando
- ✅ Tool Registry validado (10+ ferramentas)
- ✅ Logs sem erros críticos
- ✅ Smoke tests da CLI OK

## 🎯 Casos de Uso

### 1. Criar Workflow HTTP Request

1. Abra o editor: http://localhost:8080/create
2. Clique em "Adicionar Ferramenta"
3. Selecione "HTTP Request"
4. Configure usando o painel dinâmico:
   - URL: `https://api.github.com/users/octocat`
   - Método: `GET`
5. Clique em "Testar Nó" para validar
6. Salve o workflow

### 2. Testar Ferramenta via CLI

```bash
/tools test http-request '{"url": "https://api.github.com/zen", "method": "GET"}'
```

### 3. Listar Ferramentas por Categoria

```bash
/tools list --category=http
```

## 📖 Documentação Técnica

### Metadados de Ferramenta

Cada ferramenta deve seguir o schema:

```typescript
{
  id: string,                    // ID único (kebab-case)
  name: string,                  // Nome amigável
  description: string,           // Descrição (min 10 chars)
  category: ToolCategory,        // system | http | agent | custom | mcp | data | ai
  version: string,               // Semver (x.y.z)
  params: ToolParam[],           // Parâmetros com UI config
  output: ToolOutput,            // Schema de saída
  inputs?: Port[],               // Portas de entrada
  outputs?: Port[],              // Portas de saída
  capabilities?: {               // Capabilities
    requiresAuth?: boolean,
    runsInSandbox?: boolean,
    isAsync?: boolean,
    requiresNetwork?: boolean,
  },
  ui: {                          // Metadados visuais
    icon?: string,
    color?: string,
    tags?: string[],
    examples?: Example[],
  },
  config?: {                     // Configurações
    timeout?: number,
    retries?: number,
    sandbox?: boolean,
  }
}
```

### Adicionando Nova Ferramenta

1. Criar arquivo em `source/tools/<category>/<tool-name>.ts`
2. Implementar interface `Tool`
3. Adicionar metadados completos com UI config
4. Registrar em `source/tools/index.ts`
5. Criar testes em `source/__tests__/`
6. Executar `./scripts/full-validate.sh`

## 🐛 Troubleshooting

### Build falha

```bash
# Limpar e reconstruir
rm -rf dist node_modules
npm install
npm run build
```

### Testes falhando

```bash
# Ver logs detalhados
npm test -- --reporter=verbose
```

### API não responde

```bash
# Verificar se porta 3001 está livre
lsof -i :3001

# Matar processo se necessário
kill -9 <PID>
```

## 🤝 Contribuindo

1. Fork o repositório
2. Crie uma branch: `git checkout -b feature/nova-funcionalidade`
3. Faça as alterações
4. Execute `./scripts/full-validate.sh`
5. Commit: `git commit -m "feat: adiciona nova funcionalidade"`
6. Push: `git push origin feature/nova-funcionalidade`
7. Abra um Pull Request com evidências (logs, screenshots)

## 📝 Changelog

### v2.0.0 (2025-10-19)

- ✨ NodeConfigPanel dinâmico com widgets
- 🔧 Tool Registry modular com validação
- 📄 Paginação em todas as APIs
- 🎨 Editor de workflows melhorado
- 🧪 Suite de testes completa
- 📦 Versionamento de workflows
- 🚀 Script full-validate.sh

---

**Versão**: 2.0.0  
**Status**: ✅ Produção  
**Última Validação**: 2025-10-19
