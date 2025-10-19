# 📚 FLUI - Documentação Completa

**Versão**: 2.1.0  
**Status**: ✅ Produção  
**Última Atualização**: 2025-10-19

---

## 📖 Índice

1. [Visão Geral](#-visão-geral)
2. [Instalação](#-instalação)
3. [Início Rápido](#-início-rápido)
4. [Arquitetura](#-arquitetura)
5. [Tools Disponíveis](#-tools-disponíveis)
6. [Criar Nodes Customizados](#-criar-nodes-customizados)
7. [Sistema de Fluxos](#-sistema-de-fluxos)
8. [Interface CLI](#-interface-cli)
9. [Interface Web](#-interface-web)
10. [API REST](#-api-rest)
11. [Exemplos de Uso](#-exemplos-de-uso)
12. [Referência de Comandos](#-referência-de-comandos)
13. [Troubleshooting](#-troubleshooting)
14. [Melhores Práticas](#-melhores-práticas)

---

## 🎯 Visão Geral

**FLUI** é um sistema revolucionário de automação que combina a simplicidade do n8n com escalabilidade e extensibilidade superiores.

### 🏆 Diferenciais

#### vs n8n
- ✅ **Fluxos Condicionais Avançados**: 4 modos (if-else, switch, multi-branch, score-based)
- ✅ **Rotas Simultâneas**: Multi-branch permite múltiplas rotas ativas
- ✅ **Output Padronizado**: ToolResult consistente em todos os nodes
- ✅ **Type Safety**: TypeScript + Zod (compile-time e runtime)
- ✅ **CLI Poderosa**: Interface terminal moderna além do web
- ✅ **Lightweight**: Deploy rápido, sem dependências pesadas

#### vs AgentBuilder
- ✅ **Workflow Visual**: Editor estilo n8n com drag & drop
- ✅ **Tool Registry Dinâmico**: Adicionar/remover tools em runtime
- ✅ **Metadados Ricos**: UI config automática, exemplos, validação
- ✅ **MCP Support**: Integração nativa com Model Context Protocol
- ✅ **Execution Context**: Acesso a resultados anteriores e contexto global
- ✅ **15+ Tools Built-in**: Cobertura completa de casos de uso

### 🌟 Características Principais

- 🎨 **Interface Híbrida**: CLI (React + Ink) + Web (React + ReactFlow)
- 🔧 **Tool Registry Modular**: Sistema extensível de ferramentas
- 🌊 **Flow Engine**: Execução de workflows com contexto e metadados
- 🤖 **Sistema de Agentes**: Integração com LLMs (OpenAI, etc)
- 📦 **Custom Nodes**: Criar e compartilhar nodes facilmente
- 🔌 **MCP Protocol**: Carregar ferramentas de MCPs dinamicamente
- 💾 **Sistema de Sessões**: Histórico e múltiplas conversas
- 🎨 **Temas**: Cyberpunk, Oceanic, Sunset, Forest, etc
- ⚡ **Streaming**: Respostas LLM em tempo real
- 🧪 **Testes**: Suite completa de testes unitários

---

## 💿 Instalação

### Requisitos

- **Node.js**: >= 18.0.0
- **npm** ou **yarn**
- **Git**
- (Opcional) **OpenAI API Key** para agentes

### Passos

```bash
# 1. Clone o repositório
git clone https://github.com/your-org/flui.git
cd flui

# 2. Instale dependências
npm install

# 3. Configure variáveis de ambiente
echo "OPENAI_API_KEY=sk-your-key-here" > .env

# 4. Build
npm run build

# 5. Inicie o sistema
npm start
```

### Variáveis de Ambiente (.env)

```env
# OpenAI (para agentes)
OPENAI_API_KEY=sk-...

# API Server
API_PORT=3001
API_HOST=localhost

# Frontend
FRONTEND_PORT=3000

# Storage
STORAGE_PATH=./data
```

### Instalação Frontend

```bash
cd flui-frontend-vite
npm install
npm run dev
# Acesse: http://localhost:5173
```

---

## 🚀 Início Rápido

### 1. Primeira Execução

```bash
# Iniciar CLI
npm start

# Você verá:
# 🔧 Inicializando FLUI Tool Registry System...
# ✅ Tool registrada: HTTP Request
# ✅ Tool registrada: Condition
# ...
# 📦 Total de ferramentas registradas: 15
```

### 2. Comandos Básicos

```bash
# Listar comandos disponíveis
/

# Listar ferramentas
/tools list

# Ver ajuda
/help

# Limpar tela
/clear
```

### 3. Criar Seu Primeiro Node

```bash
# Criar node customizado
npm run create-node meu-primeiro-node

# Navegar para pasta
cd flui-node-meu-primeiro-node

# Instalar e testar
npm install
npm test

# Build e package
npm run build
npm run package
```

### 4. Criar Automação no Frontend

```bash
# Terminal 1: Backend (se não estiver rodando)
npm start

# Terminal 2: Frontend
cd flui-frontend-vite
npm run dev
```

**No navegador (http://localhost:5173):**
1. Click "Nova Automação"
2. Click "+" para adicionar tool
3. Selecione "HTTP Request"
4. Configure e conecte nodes
5. Click "Executar" para testar
6. Click "Salvar"

---

## 🏗️ Arquitetura

### Visão Geral

```
┌─────────────────────────────────────────────────────┐
│                    FLUI System                      │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌──────────┐           ┌──────────┐              │
│  │   CLI    │           │   Web    │              │
│  │  (Ink)   │           │ (React)  │              │
│  └────┬─────┘           └────┬─────┘              │
│       │                      │                     │
│       └──────────┬───────────┘                     │
│                  ▼                                  │
│        ┌──────────────────┐                        │
│        │   API Server     │                        │
│        │  (Express + WS)  │                        │
│        └────────┬─────────┘                        │
│                 ▼                                   │
│        ┌──────────────────┐                        │
│        │  Tool Registry   │                        │
│        │   (Singleton)    │                        │
│        └────────┬─────────┘                        │
│                 │                                   │
│       ┌─────────┼─────────┐                        │
│       ▼         ▼         ▼                        │
│   ┌───────┐ ┌───────┐ ┌────────┐                 │
│   │System │ │ Agent │ │ Custom │                 │
│   │ Tools │ │ Tools │ │ Nodes  │                 │
│   └───────┘ └───────┘ └────────┘                 │
│       │         │         │                        │
│       └─────────┴─────────┘                        │
│                 ▼                                   │
│        ┌──────────────────┐                        │
│        │   Flow Engine    │                        │
│        └──────────────────┘                        │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Componentes Principais

#### 1. Tool Registry
- **Função**: Registro central de todas as ferramentas
- **Características**: 
  - Singleton pattern
  - Validação de metadados com JSON Schema
  - Paginação e filtros
  - Métricas de execução
- **Localização**: `source/core/toolRegistry.ts`

#### 2. Flow Engine
- **Função**: Execução de workflows
- **Características**:
  - Suporte a nodes: tool, condition, loop, parallel, delay, merge
  - Contexto de execução compartilhado
  - Logs detalhados
- **Localização**: `source/core/flowEngine.ts`

#### 3. API Server
- **Função**: REST API + WebSocket
- **Endpoints**: Tools, Automations, Nodes, MCP
- **Porta**: 3001 (padrão)
- **Localização**: `source/services/apiServer.ts`

#### 4. CLI (Ink)
- **Função**: Interface terminal interativa
- **Framework**: React + Ink
- **Localização**: `source/cli.tsx`, `source/components/`

#### 5. Frontend Web
- **Função**: Editor visual de workflows
- **Framework**: React + ReactFlow + Tailwind
- **Localização**: `flui-frontend-vite/`

### Estrutura de Diretórios

```
flui/
├── source/                    # Backend/CLI
│   ├── core/                  # Core System
│   │   ├── types.ts          # Tipos TypeScript
│   │   ├── toolRegistry.ts   # Registry de tools
│   │   ├── toolMetadataValidator.ts
│   │   ├── toolResultHelper.ts
│   │   ├── flowEngine.ts     # Engine de fluxos
│   │   └── flowTypes.ts
│   ├── tools/                 # Ferramentas
│   │   ├── system/           # System tools
│   │   │   ├── condition.ts  # ⭐ Condition (4 modos)
│   │   │   ├── delay.ts
│   │   │   ├── dataTransform.ts
│   │   │   ├── httpRequest.ts
│   │   │   └── fileOperations.ts
│   │   ├── agent/            # Agent tools
│   │   └── custom/           # Custom code
│   ├── services/             # Serviços
│   │   ├── apiServer.ts      # API REST
│   │   ├── llm.ts            # LLM integration
│   │   └── sandbox.ts        # Sandbox execution
│   ├── components/           # CLI Components
│   │   ├── StableApp.tsx
│   │   ├── InputArea.tsx
│   │   └── CommandSuggestions.tsx
│   ├── commands/             # CLI Commands
│   │   ├── createNode.ts     # ⭐ Create node command
│   │   └── index.ts
│   └── __tests__/            # Testes unitários
│
├── flui-frontend-vite/       # Frontend React
│   └── src/
│       ├── pages/
│       │   ├── Home.tsx
│       │   ├── CreateAutomationV2.tsx  # ⭐ Editor
│       │   └── ToolsListPage.tsx
│       └── components/
│           ├── ToolNode.tsx           # Node component
│           ├── NodeConfigPanel.tsx    # ⭐ Config panel dinâmico
│           └── ToolPalette.tsx
│
├── package.json
├── tsconfig.json
├── README.md
└── DOC.md                    # Este arquivo
```

### Padrão de Output (ToolResult)

**TODOS os nodes retornam este formato:**

```typescript
interface ToolResult {
  success: boolean;            // true = sucesso, false = erro
  result?: any;                // Dados quando sucesso
  error?: string;              // Mensagem de erro
  metadata?: Record<string, any>;  // Metadados extras
  executionTime?: number;      // Tempo em ms
}
```

**Exemplo de sucesso:**
```typescript
{
  success: true,
  result: {
    status: 200,
    body: { data: "..." }
  },
  metadata: {
    url: "https://api.example.com"
  },
  executionTime: 234
}
```

**Exemplo de erro:**
```typescript
{
  success: false,
  error: "Connection timeout",
  metadata: {
    url: "https://api.example.com",
    attempts: 3
  },
  executionTime: 5000
}
```

---

## 🛠️ Tools Disponíveis

### System & Control Flow (10 tools)

#### 1. HTTP Request (`http-request`)
**Descrição**: Requisições HTTP completas com suporte a todos os métodos

**Parâmetros**:
- `url` (string, required): URL completa
- `method` (string): GET, POST, PUT, DELETE, PATCH
- `headers` (object): Headers HTTP
- `queryParams` (object): Query parameters
- `body` (object): Corpo da requisição (JSON)
- `timeout` (number): Timeout em ms (padrão: 30000)
- `followRedirects` (boolean): Seguir redirects (padrão: true)

**Exemplo**:
```typescript
{
  url: "https://api.github.com/users/octocat",
  method: "GET",
  headers: {
    "Accept": "application/json"
  }
}
```

#### 2. Condition (`condition`) ⭐ DESTAQUE
**Descrição**: Fluxos condicionais com 4 modos (SUPERIOR ao n8n!)

**Modos**:
1. **if-else**: Condições simples
2. **switch**: Switch/case style
3. **multi-branch**: Múltiplas rotas simultâneas ✨
4. **score-based**: Escolhe branch com maior pontuação ✨

**Parâmetros**:
- `mode` (string): if-else | switch | multi-branch | score-based
- `inputValue` (any): Dados de entrada
- `branches` (array): Lista de condições
- `defaultBranch` (string): Rota padrão
- `stopAtFirstMatch` (boolean): Parar na primeira match
- `allowMultipleMatches` (boolean): Permitir múltiplas rotas (multi-branch)

**Exemplo Multi-Branch**:
```typescript
{
  mode: "multi-branch",
  inputValue: { score: 85, premium: true, country: "BR" },
  branches: [
    { name: "high_score", condition: "data.score > 80" },
    { name: "premium_user", condition: "data.premium === true" },
    { name: "brazil", condition: "data.country === 'BR'" }
  ],
  allowMultipleMatches: true
}
// Output: Todas as 3 rotas são ativadas!
```

#### 3. Delay (`delay`)
**Descrição**: Pausa/delay controlado

**Parâmetros**:
- `duration` (number): Duração
- `unit` (string): milliseconds | seconds | minutes
- `message` (string): Mensagem para log

**Exemplo**:
```typescript
{
  duration: 5,
  unit: "seconds",
  message: "Aguardando rate limit..."
}
```

#### 4-8. File Operations
- **file-read**: Ler arquivo
- **file-write**: Escrever arquivo
- **file-edit**: Editar com regex
- **file-search**: Buscar arquivos (glob)
- **text-search**: Grep em arquivos

#### 9. Shell Executor (`shell-executor`)
**Descrição**: Executar comandos shell
⚠️ **Atenção**: Use com cuidado, pode ser perigoso

#### 10. System Info (`system-info`)
**Descrição**: Informações do sistema operacional

### Data Transformation (3 tools)

#### 11. Data Transform (`data-transform`)
**Descrição**: Transformar dados com JavaScript

**Parâmetros**:
- `input` (object): Dados de entrada
- `transform` (string): Código JavaScript

**Exemplo**:
```typescript
{
  input: { users: [{name: "john"}, {name: "jane"}] },
  transform: `
    return {
      names: data.users.map(u => u.name.toUpperCase()),
      count: data.users.length
    };
  `
}
```

#### 12. Data Filter (`data-filter`)
**Descrição**: Filtrar arrays com condições

**Exemplo**:
```typescript
{
  array: [1, 2, 3, 4, 5, 6],
  condition: "return item > 3;"
}
// Output: [4, 5, 6]
```

#### 13. Data Merge (`data-merge`)
**Descrição**: Combinar objetos ou arrays

**Modos**: object | array | array-unique

### Agent (1 tool)

#### 14. Agent Executor (`agent-executor`)
**Descrição**: Executar agente LLM com tools

**Parâmetros**:
- `prompt` (string): Prompt do agente
- `temperature` (number): 0-1
- `maxTokens` (number): Limite de tokens
- `tools` (array): Tools disponíveis

### Custom (1 tool)

#### 15. Custom Code (`custom-code`)
**Descrição**: Executar código JavaScript customizado

---

## 🎨 Criar Nodes Customizados

### Comando Rápido

```bash
# Criar novo node
npm run create-node meu-node

# ou via CLI
flui --create-node meu-node

# ou após build
node dist/cli.js --create-node meu-node
```

### Estrutura Criada

```
flui-node-meu-node/
├── src/
│   └── index.ts              # Implementação do node
├── __tests__/
│   └── meu-node.test.ts      # Testes
├── scripts/
│   ├── build.js              # Script de build
│   └── package.js            # Script de packaging
├── package.json
├── tsconfig.json
├── README.md
├── DOC.md
└── CHANGELOG.md
```

### Anatomia de um Node

```typescript
import { z } from 'zod';
import { Tool, ExecutionContext, ToolResult } from '@flui/core';

// 1. Schema de Validação (Zod)
const ConfigSchema = z.object({
  input: z.string().min(1, 'Input é obrigatório'),
  options: z.record(z.any()).optional(),
});

// 2. Definição do Node
export const MeuNode: Tool = {
  // === IDENTIFICAÇÃO ===
  id: 'meu-node',                    // ID único (kebab-case)
  name: 'Meu Node Customizado',      // Nome amigável
  description: 'O que o node faz',   // Descrição clara
  category: 'custom',                // Categoria
  version: '1.0.0',                  // Versão semver
  
  // === PARÂMETROS ===
  params: [
    {
      name: 'Input',                 // Nome do campo
      key: 'input',                  // Key no objeto config
      type: 'string',                // Tipo
      description: 'Descrição',
      required: true,
      ui: {
        widgetType: 'textInput',     // Widget no frontend
        placeholder: 'Digite...',
        helperText: 'Ajuda',
        validation: {
          minLength: 1,
          maxLength: 100,
        },
      },
    },
  ],
  
  // === OUTPUT ===
  output: {
    type: 'object',
    description: 'Resultado',
    schema: {
      success: 'boolean',
      output: 'any',
    },
  },
  
  // === EXECUÇÃO ===
  async execute(args: any, context: ExecutionContext): Promise<ToolResult> {
    const startTime = Date.now();
    
    try {
      // Validar entrada
      const validated = ConfigSchema.parse(args);
      
      // Sua lógica aqui
      const result = processData(validated.input);
      
      // Retornar resultado padronizado
      return {
        success: true,
        result,
        metadata: {
          timestamp: new Date().toISOString(),
        },
        executionTime: Date.now() - startTime,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        executionTime: Date.now() - startTime,
      };
    }
  },
  
  // === UI CONFIG ===
  ui: {
    icon: 'Box',                     // Ícone (Lucide)
    color: '#3b82f6',                // Cor
    tags: ['custom', 'data'],        // Tags
    examples: [                      // Exemplos
      {
        title: 'Exemplo Básico',
        description: 'Uso simples',
        params: { input: 'teste' },
        expectedOutput: { success: true }
      },
    ],
  },
  
  // === CONFIG AVANÇADA ===
  config: {
    timeout: 30000,                  // Timeout padrão
    retries: 1,                      // Tentativas
    sandbox: false,                  // Rodar em sandbox?
    concurrent: true,                // Permite execução paralela?
  },
};

export default MeuNode;
```

### Widget Types Disponíveis

| Widget | Uso |
|--------|-----|
| `textInput` | Input de texto simples |
| `textArea` | Textarea multilinha |
| `number` | Input numérico |
| `select` | Dropdown |
| `multiSelect` | Select múltiplo |
| `toggle` | Switch on/off |
| `checkbox` | Checkbox |
| `keyValue` | Editor chave-valor (headers) |
| `jsonEditor` | Editor JSON |
| `codeEditor` | Editor de código |
| `filePicker` | Seletor de arquivo |
| `datePicker` | Seletor de data |
| `timePicker` | Seletor de hora |
| `colorPicker` | Seletor de cor |
| `slider` | Slider numérico |
| `radio` | Radio buttons |

### Workflow do Node

```bash
cd flui-node-meu-node

# 1. Instalar dependências
npm install

# 2. Desenvolver
# Editar src/index.ts

# 3. Testar
npm test

# 4. Build
npm run build

# 5. Package
npm run package
# Cria: @flui-node-meu-node-v1.0.0.zip

# 6. Upload (opcional)
flui --upload-node ./package.zip
```

### Helpers de Output

```typescript
import {
  createSuccessResult,
  createErrorResult,
  executeWithStandardOutput,
} from './core/toolResultHelper';

// Wrapper automático
async execute(args, context) {
  return executeWithStandardOutput(async () => {
    // Sua lógica
    return processedData;
  }, {
    customMetadata: 'value',
  });
}

// Ou manual
return createSuccessResult(data, { timestamp: Date.now() });
return createErrorResult(error, { attempts: 3 });
```

---

## 🌊 Sistema de Fluxos

### Flow Definition

```typescript
interface FlowDefinition {
  id: string;
  name: string;
  description: string;
  version: string;
  nodes: FlowNode[];          // Lista de nodes
  edges: FlowEdge[];          // Conexões
  startNodeId: string;        // Node inicial
  variables?: Record<string, any>;  // Variáveis globais
}
```

### Flow Node Types

| Type | Descrição |
|------|-----------|
| `tool` | Executa uma ferramenta do registry |
| `condition` | Condicional (if/else) |
| `loop` | Loop sobre array |
| `parallel` | Execução paralela |
| `delay` | Pausa |
| `merge` | Merge de resultados |

### Execution Context

Cada node recebe um contexto:

```typescript
interface ExecutionContext {
  automationId: string;              // ID da automação
  nodeId: string;                    // ID do node atual
  previousResults: Record<string, any>;  // Resultados anteriores
  globalContext: Record<string, any>;    // Contexto global
  sandboxPath?: string;              // Path do sandbox
  timeout?: number;                  // Timeout
  metadata?: Record<string, any>;    // Metadados extras
}
```

### Acessando Dados em Expressões

```javascript
// Em Condition, Transform, etc:

// Dados de entrada
data.field
data.user.name

// Resultado do node anterior
previous.nodeId.result

// Contexto global
context.variavel
context.user.role

// Exemplo completo
data.age >= 18 && context.user.premium === true
```

### Exemplo de Workflow

```yaml
Workflow: Processar API e Notificar

Nodes:
  1. HTTP Request (id: fetch-data)
     - url: https://api.example.com/data
     - method: GET
     
  2. Condition (id: check-status)
     - mode: if-else
     - inputValue: previous.fetch-data.result.status
     - branches:
       - success: status >= 200 && status < 300
       - error: status >= 400
       
  3a. Data Transform (id: process-data)
      - input: previous.fetch-data.result.body
      - transform: "return { processed: data.map(x => x.id) }"
      
  3b. Delay (id: wait-retry)
      - duration: 5
      - unit: seconds
      
  4. HTTP Request (id: notify)
     - url: https://webhook.com/notify
     - method: POST
     - body: previous.process-data.result

Edges:
  - fetch-data → check-status
  - check-status.success → process-data
  - check-status.error → wait-retry
  - wait-retry → fetch-data (retry)
  - process-data → notify
```

---

## 💻 Interface CLI

### Inicialização

```bash
npm start
```

### Comandos Disponíveis

#### Navegação
```bash
/                    # Mostrar comandos
/help               # Ajuda completa
/clear              # Limpar tela
/exit               # Sair
```

#### Tools
```bash
/tools list                              # Listar todas
/tools list --category=http              # Filtrar
/tools list --search=request             # Buscar
/tools list --page=2 --page-size=10     # Paginar
/tools info <tool-id>                    # Detalhes
/tools categories                        # Categorias
/tools test <tool-id> '{"param":"val"}' # Testar
```

#### Automações
```bash
/automations        # Gerenciador
/flow               # Fluxos
```

#### Sistema
```bash
/settings           # Configurações
/agents             # Agentes
/mcps               # MCPs
/theme              # Temas
/sessions           # Sessões
/status             # Status
```

#### Sugestões Interativas

Digite `/` para ver sugestões:
- Use `↑` `↓` para navegar
- `Enter` para selecionar
- `Esc` para cancelar

### Conversar com Agentes

```bash
@nome-do-agente sua mensagem aqui
```

---

## 🌐 Interface Web

### Inicialização

```bash
cd flui-frontend-vite
npm run dev
# Acesse: http://localhost:5173
```

### Páginas

#### 1. Home (`/`)
- Lista de automações
- Cards com preview
- Busca e filtros

#### 2. Editor (`/create`)
- Canvas drag & drop
- Paleta de tools
- Config panel dinâmico
- Execução e logs

#### 3. Tools List (`/tools`)
- Lista todas as tools
- Filtros por categoria
- Busca por nome
- Detalhes e exemplos

### Criar Automação

1. **Adicionar Node**
   - Click no botão "+" (top-right)
   - Selecione tool da paleta
   - Node aparece no canvas

2. **Conectar Nodes**
   - Arraste de uma porta de saída (bottom)
   - Para porta de entrada (top)
   - Conexão criada automaticamente

3. **Configurar Node**
   - Click no ícone ⚙️ no node
   - Preencha campos no painel
   - Use exemplos como guia
   - Click "Salvar"

4. **Testar**
   - Click "Executar" (top)
   - Veja logs em tempo real
   - Status colorido nos nodes

5. **Salvar**
   - Digite nome e descrição
   - Click "Salvar" (top)

### Atalhos do Editor

| Atalho | Ação |
|--------|------|
| `Space` | Abrir paleta |
| `Delete` | Remover node |
| `Ctrl/Cmd + S` | Salvar |
| `Ctrl/Cmd + E` | Executar |
| `Ctrl/Cmd + Z` | Desfazer |

---

## 🔌 API REST

### Base URL
```
http://localhost:3001/api
```

### Endpoints

#### Tools

**Listar Tools**
```bash
GET /api/tools
Query params:
  - page: número da página (default: 1)
  - pageSize: itens por página (default: 50)
  - category: filtrar por categoria
  - search: buscar no nome/descrição
  
Response:
{
  tools: Tool[],
  total: number,
  page: number,
  pageSize: number,
  totalPages: number
}
```

**Detalhes de Tool**
```bash
GET /api/tools/:toolId

Response:
{
  id: string,
  name: string,
  description: string,
  params: ToolParam[],
  // ... metadados completos
}
```

**Categorias**
```bash
GET /api/tools/categories

Response:
{
  categories: string[]
}
```

**Testar Node**
```bash
POST /api/nodes/:nodeId/test
Body:
{
  toolId: string,
  params: Record<string, any>
}

Response: ToolResult
```

#### Automations

**Listar**
```bash
GET /api/automations
```

**Criar**
```bash
POST /api/automations
Body: FlowDefinition
```

**Buscar**
```bash
GET /api/automations/:id
```

**Atualizar**
```bash
PUT /api/automations/:id
Body: FlowDefinition
```

**Deletar**
```bash
DELETE /api/automations/:id
```

**Executar**
```bash
POST /api/automations/:id/execute
Body:
{
  input?: any,
  context?: Record<string, any>
}

Response:
{
  success: boolean,
  result?: any,
  logs: FlowExecutionLog[]
}
```

### WebSocket

```javascript
const ws = new WebSocket('ws://localhost:3001');

// Eventos
ws.on('execution:start', (data) => {
  // Execução iniciada
});

ws.on('execution:progress', (data) => {
  // Progresso (cada node)
});

ws.on('execution:complete', (data) => {
  // Execução completa
});

ws.on('execution:error', (data) => {
  // Erro
});
```

---

## 📝 Exemplos de Uso

### 1. HTTP Request + Condition

```typescript
// Workflow: Buscar usuário e verificar status

// Node 1: HTTP Request
{
  id: "fetch-user",
  toolId: "http-request",
  config: {
    url: "https://api.github.com/users/octocat",
    method: "GET"
  }
}

// Node 2: Condition
{
  id: "check-response",
  toolId: "condition",
  config: {
    mode: "if-else",
    inputValue: "previous['fetch-user'].result",
    branches: [
      {
        name: "success",
        condition: "data.status === 200"
      },
      {
        name: "error",
        condition: "data.status >= 400"
      }
    ]
  }
}

// Edges
[
  { source: "fetch-user", target: "check-response" }
]
```

### 2. Multi-Branch Condition

```typescript
// Condition node com múltiplas rotas

{
  toolId: "condition",
  config: {
    mode: "multi-branch",
    inputValue: {
      score: 85,
      premium: true,
      active: true,
      country: "BR"
    },
    branches: [
      { name: "high_score", condition: "data.score > 80" },
      { name: "is_premium", condition: "data.premium === true" },
      { name: "is_active", condition: "data.active === true" },
      { name: "brazil", condition: "data.country === 'BR'" }
    ],
    allowMultipleMatches: true
  }
}

// Resultado:
// matchedBranches: ["high_score", "is_premium", "is_active", "brazil"]
// Todas as 4 rotas são ativadas!
```

### 3. Data Transform

```typescript
{
  toolId: "data-transform",
  config: {
    input: {
      users: [
        { name: "John Doe", age: 25, city: "NYC" },
        { name: "Jane Smith", age: 30, city: "LA" },
        { name: "Bob Johnson", age: 35, city: "NYC" }
      ]
    },
    transform: `
      // Agrupar por cidade e calcular idade média
      const grouped = {};
      
      data.users.forEach(user => {
        if (!grouped[user.city]) {
          grouped[user.city] = { users: [], totalAge: 0 };
        }
        grouped[user.city].users.push(user.name);
        grouped[user.city].totalAge += user.age;
      });
      
      Object.keys(grouped).forEach(city => {
        grouped[city].avgAge = 
          grouped[city].totalAge / grouped[city].users.length;
        delete grouped[city].totalAge;
      });
      
      return grouped;
    `
  }
}

// Output:
// {
//   "NYC": { users: ["John Doe", "Bob Johnson"], avgAge: 30 },
//   "LA": { users: ["Jane Smith"], avgAge: 30 }
// }
```

### 4. Workflow Completo: ETL

```yaml
Nome: ETL - Extract, Transform, Load

Nodes:
  1. HTTP Request (extract-data)
     - Buscar dados de API externa
     
  2. Condition (validate-data)
     - Verificar se dados são válidos
     
  3. Data Transform (clean-data)
     - Limpar e normalizar dados
     
  4. Data Filter (filter-active)
     - Filtrar apenas registros ativos
     
  5. HTTP Request (load-data)
     - Enviar para sistema destino
     
  6. Delay (rate-limit)
     - Pausa entre requisições

Flow:
  extract-data → validate-data
  validate-data (success) → clean-data
  validate-data (error) → delay → extract-data (retry)
  clean-data → filter-active
  filter-active → load-data
  load-data → delay → extract-data (próximo batch)
```

---

## 📖 Referência de Comandos

### Build e Deploy

```bash
# Build completo
npm run build

# Build + Watch
npm run dev

# Testes
npm test
npm run test:watch
npm run test:ui

# Lint
npm run lint

# Format
npm run format
```

### CLI

```bash
# Iniciar
npm start
flui

# Help
flui --help

# Create node
npm run create-node <name>
flui --create-node <name>
```

### Frontend

```bash
cd flui-frontend-vite

# Dev
npm run dev

# Build
npm run build

# Preview
npm run preview
```

### Testes

```bash
# Todos
npm test

# Específico
npm test -- condition

# Coverage
npm test -- --coverage

# Watch
npm run test:watch
```

### Validação

```bash
# Script completo
./scripts/full-validate.sh

# Checklist:
# ✅ Build backend
# ✅ Build frontend  
# ✅ Testes unitários
# ✅ Tool registry
# ✅ Logs
```

---

## 🐛 Troubleshooting

### Build Falha

```bash
# Limpar tudo
rm -rf dist node_modules
npm install
npm run build
```

### Porta em Uso

```bash
# Verificar porta 3001
lsof -i :3001

# Matar processo
kill -9 <PID>
```

### Tools Não Aparecem

1. Verificar logs de registro
2. Validar metadados: `validateToolMetadata(tool)`
3. Verificar category válida
4. Rebuild: `npm run build`

### Modal Não Abre

1. Verificar console do browser (F12)
2. Verificar se tool tem params com ui config
3. Testar com outro node
4. Reload da página

### CLI Travado

- `Ctrl+C` para sair
- Verificar se não há loop infinito
- Verificar timeout nos tools

### Erros de TypeScript

```bash
# Verificar versão
tsc --version

# Reinstalar
npm install typescript@latest
```

---

## 🎯 Melhores Práticas

### 1. Validação com Zod

```typescript
import { z } from 'zod';

const Schema = z.object({
  email: z.string().email('Email inválido'),
  age: z.number().min(0).max(150),
  role: z.enum(['admin', 'user']),
});

// Usar sempre
const validated = Schema.parse(args);
```

### 2. Usar Tool Result Helper

```typescript
import { executeWithStandardOutput } from './core/toolResultHelper';

async execute(args, context) {
  return executeWithStandardOutput(async () => {
    // Lógica aqui
    return result;
  });
}
```

### 3. Metadata Rica

```typescript
return {
  success: true,
  result: data,
  metadata: {
    source: 'api',
    processedItems: 100,
    skippedItems: 5,
    warnings: ['Warning 1'],
    timestamp: Date.now(),
  },
  executionTime: Date.now() - startTime,
};
```

### 4. Exemplos Completos

```typescript
ui: {
  examples: [
    {
      title: 'Caso Básico',
      description: 'Uso mais simples',
      params: { input: 'test' },
      expectedOutput: { success: true }
    },
    {
      title: 'Caso Avançado',
      description: 'Com todas opções',
      params: { 
        input: 'advanced',
        options: { transform: true }
      }
    },
  ]
}
```

### 5. Error Handling

```typescript
try {
  // Lógica
  return createSuccessResult(result);
} catch (error: any) {
  // SEMPRE retornar, NUNCA throw
  return createErrorResult(error.message, {
    stack: error.stack,
    code: error.code,
  });
}
```

### 6. Timeout e Retries

```typescript
config: {
  timeout: 30000,      // 30s
  retries: 3,          // 3 tentativas
  sandbox: true,       // Isolar execução
  concurrent: false,   // Não permitir paralelo
}
```

### 7. UI Config Completa

```typescript
params: [
  {
    name: 'Campo',
    key: 'field',
    type: 'string',
    required: true,
    ui: {
      widgetType: 'textInput',
      placeholder: 'Digite...',
      helperText: 'Ajuda clara',
      validation: {
        minLength: 1,
        maxLength: 100,
      },
      allowExpressions: true,  // Permite usar previous, context
    },
  },
]
```

### 8. Testes Completos

```typescript
describe('MeuNode', () => {
  it('deve executar com sucesso', async () => {
    const result = await MeuNode.execute(
      { input: 'test' },
      mockContext
    );
    expect(result.success).toBe(true);
  });
  
  it('deve retornar erro para input inválido', async () => {
    const result = await MeuNode.execute({}, mockContext);
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
  
  it('deve validar params', () => {
    const validation = MeuNode.validate?.({ input: 'test' });
    expect(validation?.valid).toBe(true);
  });
});
```

---

## 🎓 Recursos Adicionais

### Documentação de Dependências

- **React**: https://react.dev
- **Ink**: https://github.com/vadimdemedes/ink
- **ReactFlow**: https://reactflow.dev
- **Zod**: https://zod.dev
- **OpenAI**: https://platform.openai.com/docs

### Comunidade

- **GitHub**: https://github.com/your-org/flui
- **Issues**: https://github.com/your-org/flui/issues
- **Discussions**: https://github.com/your-org/flui/discussions
- **Discord**: https://discord.gg/flui

### Contribuindo

1. Fork o repositório
2. Crie branch: `git checkout -b feature/nova-feature`
3. Desenvolva e teste
4. Commit: `git commit -m "feat: adiciona nova feature"`
5. Push: `git push origin feature/nova-feature`
6. Abra Pull Request

### Licença

MIT License - Veja LICENSE para detalhes

---

## 🎉 Conclusão

O FLUI é um sistema de automação **completo, escalável e superior** ao n8n e AgentBuilder.

**Principais Conquistas**:
- ✅ 15 ferramentas built-in
- ✅ Condition com 4 modos (multi-branch único!)
- ✅ Output padronizado (ToolResult)
- ✅ Type-safe (TypeScript + Zod)
- ✅ Interface híbrida (CLI + Web)
- ✅ Documentação completa
- ✅ Extensível (criar nodes facilmente)
- ✅ Produção-ready

**Próximos Passos**:
1. Explore os exemplos
2. Crie seu primeiro node
3. Construa workflows complexos
4. Contribua com a comunidade

**Comece agora**:
```bash
npm install
npm run build
npm start
```

---

**Versão**: 2.1.0  
**Status**: ✅ Produção  
**Documentação**: Completa  
**Qualidade**: ⭐⭐⭐⭐⭐

🚀 **Happy Automating!**
