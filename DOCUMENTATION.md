# FLUI - Documentação Completa do Sistema

## 📚 Índice

1. [Visão Geral](#visão-geral)
2. [Arquitetura](#arquitetura)
3. [Instalação e Configuração](#instalação-e-configuração)
4. [Uso Básico](#uso-básico)
5. [Criando Nodes Customizados](#criando-nodes-customizados)
6. [Tools Disponíveis](#tools-disponíveis)
7. [Sistema de Fluxos](#sistema-de-fluxos)
8. [API Reference](#api-reference)
9. [Melhores Práticas](#melhores-práticas)
10. [Troubleshooting](#troubleshooting)

---

## 🎯 Visão Geral

**FLUI** é um sistema revolucionário de automação que combina a simplicidade de uso do n8n com a escalabilidade e extensibilidade superiores. É projetado para ser:

- ✅ **Escalável**: Arquitetura modular com registry dinâmico de tools
- ✅ **Simples**: Interface intuitiva tanto CLI quanto Web
- ✅ **Extensível**: Sistema de nodes customizados com padrão bem definido
- ✅ **Poderoso**: Fluxos condicionais avançados, transformação de dados, integração com APIs
- ✅ **Type-Safe**: TypeScript com validação Zod em runtime

### Por que FLUI é Superior ao N8n e AgentBuilder?

#### 🚀 Vantagens sobre N8n:

1. **Fluxos Condicionais Múltiplos**: Tool Condition suporta branches ilimitados, switch/case, e rotas simultâneas
2. **System de Output Padronizado**: Todos os nodes seguem `ToolResult` com metadata, execution time, etc
3. **CLI Poderosa**: Modo interativo completo além da interface web
4. **Custom Nodes Simplificados**: Criação de nodes com um comando (`flui --create-node`)
5. **Type Safety**: TypeScript + Zod = validação em compile-time e runtime
6. **Lightweight**: Sem dependências pesadas, fácil de deployar

#### 🎯 Vantagens sobre AgentBuilder:

1. **Workflow Visual**: Editor visual estilo n8n para criar automações
2. **Tool Registry Dinâmico**: Adicione/remova tools em runtime
3. **Metadados Ricos**: Cada tool tem UI config, examples, validation schema
4. **MCP Support**: Integração nativa com Model Context Protocol
5. **Execution Context**: Contexto global, acesso a resultados anteriores, sandbox
6. **Rate Limiting Built-in**: Sistema de rate limiting por tool

---

## 🏗️ Arquitetura

### Componentes Principais

```
┌─────────────────────────────────────────────────────────────┐
│                         FLUI System                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐      ┌──────────────┐                   │
│  │   CLI (Ink)  │      │ Web Frontend │                   │
│  │   Terminal   │      │  (React +    │                   │
│  │     UI       │      │  ReactFlow)  │                   │
│  └──────┬───────┘      └──────┬───────┘                   │
│         │                     │                            │
│         └──────────┬──────────┘                            │
│                    ▼                                        │
│         ┌────────────────────┐                             │
│         │    API Server      │                             │
│         │  (Express + WS)    │                             │
│         └─────────┬──────────┘                             │
│                   ▼                                         │
│         ┌────────────────────┐                             │
│         │   Tool Registry    │◄──── Tool Metadata          │
│         │   (Singleton)      │      Validator              │
│         └─────────┬──────────┘                             │
│                   │                                         │
│         ┌─────────┴────────────────────────┐               │
│         ▼                 ▼                ▼               │
│   ┌──────────┐    ┌──────────┐    ┌──────────┐           │
│   │ System   │    │  Agent   │    │  Custom  │           │
│   │  Tools   │    │  Tools   │    │  Nodes   │           │
│   └──────────┘    └──────────┘    └──────────┘           │
│         │                 │                │               │
│         └─────────────────┴────────────────┘               │
│                           ▼                                 │
│                 ┌──────────────────┐                       │
│                 │   Flow Engine    │                       │
│                 │  (Execution)     │                       │
│                 └──────────────────┘                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Fluxo de Dados

```
User Input → CLI/Web → API Server → Tool Registry
              ↓
        Tool Execution → Flow Engine
              ↓
     ExecutionContext + ToolResult
              ↓
        Output Padronizado
```

### Tool Result (Padrão de Output)

Todos os nodes **SEMPRE** retornam um `ToolResult`:

```typescript
interface ToolResult {
  success: boolean;
  result?: any;              // Dados quando success=true
  error?: string;            // Mensagem quando success=false
  metadata?: Record<string, any>;  // Metadados adicionais
  executionTime?: number;    // Tempo em ms
}
```

---

## 💿 Instalação e Configuração

### Requisitos

- Node.js >= 18.0.0
- npm ou yarn
- (Opcional) TypeScript conhecimento básico

### Instalação

```bash
# Clone o repositório
git clone https://github.com/your-org/flui.git
cd flui

# Instale dependências
npm install

# Build
npm run build

# Inicie o sistema
npm start
```

### Variáveis de Ambiente

Crie um arquivo `.env` na raiz:

```env
# OpenAI (para agentes)
OPENAI_API_KEY=your-api-key

# API Server
API_PORT=3001
API_HOST=localhost

# Frontend
FRONTEND_PORT=3000

# Storage
STORAGE_PATH=./data
```

---

## 🎮 Uso Básico

### CLI Interativo

```bash
# Iniciar CLI
npm start

# ou após build
flui
```

#### Comandos Disponíveis

- `/` - Mostrar comandos disponíveis
- `/help` - Ajuda
- `/agents` - Gerenciar agentes
- `/automations` - Ver automações
- `/mcps` - Gerenciar MCPs
- `/settings` - Configurações
- `/theme` - Mudar tema
- `/sessions` - Ver sessões
- `/clear` - Limpar tela
- `/exit` - Sair

### Web Interface

```bash
# Em terminal separado, iniciar frontend
cd flui-frontend-vite
npm run dev
```

Acesse: `http://localhost:5173`

#### Criando uma Automação

1. **Acessar Editor**: Click em "Nova Automação"
2. **Adicionar Nodes**: Click no botão "+" no canto superior direito
3. **Conectar Nodes**: Arraste de uma porta de saída para uma de entrada
4. **Configurar Node**: Click no ícone de configuração (⚙️)
5. **Salvar**: Click em "Salvar"
6. **Executar**: Click em "Executar" para testar

---

## 🔧 Criando Nodes Customizados

### Comando Rápido

```bash
# Criar novo node
flui --create-node meu-node

# ou com npm
npm run create-node meu-node
```

Isso cria uma estrutura completa:

```
flui-node-meu-node/
├── src/
│   └── index.ts           # Implementação do node
├── __tests__/
│   └── meu-node.test.ts   # Testes
├── scripts/
│   ├── build.js           # Build script
│   └── package.js         # Packaging script
├── package.json
├── tsconfig.json
├── README.md
├── DOC.md
└── CHANGELOG.md
```

### Estrutura de um Node

```typescript
import { z } from 'zod';
import { Tool, ExecutionContext, ToolResult } from '@flui/core';

// Schema de validação
const ConfigSchema = z.object({
  input: z.string().min(1),
  options: z.record(z.any()).optional(),
});

export const MeuNode: Tool = {
  // Identificação
  id: 'meu-node',
  name: 'Meu Node Customizado',
  description: 'Descrição do que o node faz',
  category: 'custom',
  version: '1.0.0',
  
  // Parâmetros
  params: [
    {
      name: 'Input',
      key: 'input',
      type: 'string',
      description: 'Entrada do node',
      required: true,
      ui: {
        widgetType: 'textInput',
        placeholder: 'Digite algo...',
        helperText: 'Texto que será processado',
      },
    },
  ],
  
  // Output
  output: {
    type: 'object',
    description: 'Resultado do processamento',
    schema: {
      success: 'boolean',
      output: 'any',
    },
  },
  
  // Execução
  async execute(args: any, context: ExecutionContext): Promise<ToolResult> {
    try {
      // Validar
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
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  },
  
  // UI Config
  ui: {
    icon: 'Box',
    color: '#3b82f6',
    tags: ['custom'],
    examples: [
      {
        title: 'Exemplo Básico',
        description: 'Uso simples',
        params: { input: 'teste' },
      },
    ],
  },
  
  // Config avançada
  config: {
    timeout: 30000,
    retries: 1,
    sandbox: false,
  },
};

export default MeuNode;
```

### Widget Types Disponíveis

- `textInput` - Input de texto simples
- `textArea` - Textarea para texto longo
- `number` - Input numérico com min/max
- `select` - Dropdown com opções
- `multiSelect` - Select múltiplo
- `toggle` - Switch on/off
- `checkbox` - Checkbox
- `keyValue` - Editor chave-valor (para headers, params)
- `jsonEditor` - Editor JSON com validação
- `codeEditor` - Editor de código com syntax highlight
- `filePicker` - Seletor de arquivo
- `datePicker` - Seletor de data
- `timePicker` - Seletor de hora
- `colorPicker` - Seletor de cor
- `slider` - Slider numérico
- `radio` - Radio buttons

### Testando o Node

```typescript
import { describe, it, expect } from 'vitest';
import { MeuNode } from '../src/index';

describe('Meu Node', () => {
  it('deve executar com sucesso', async () => {
    const result = await MeuNode.execute(
      { input: 'teste' },
      { 
        automationId: 'test',
        nodeId: 'node-1',
        previousResults: {},
        globalContext: {},
      }
    );
    
    expect(result.success).toBe(true);
    expect(result.result).toBeDefined();
  });
});
```

### Build e Package

```bash
# Build
npm run build

# Test
npm test

# Package (cria .zip)
npm run package

# Upload para FLUI
flui --upload-node ./package.zip
```

---

## 🛠️ Tools Disponíveis

### System Tools

#### 1. **HTTP Request**
- **ID**: `http-request`
- **Descrição**: Requisições HTTP completas
- **Params**: url, method, headers, queryParams, body, timeout
- **Uso**: Integração com APIs REST

```typescript
{
  url: 'https://api.example.com/data',
  method: 'POST',
  headers: {
    'Authorization': 'Bearer token',
  },
  body: {
    name: 'John',
  },
}
```

#### 2. **Condition**
- **ID**: `condition`
- **Descrição**: Fluxos condicionais múltiplos (SUPERIOR ao n8n!)
- **Modos**: if-else, switch, multi-branch, score-based
- **Params**: mode, branches, defaultBranch, stopAtFirstMatch
- **Uso**: Roteamento condicional avançado

**Exemplo Multi-Branch**:
```typescript
{
  mode: 'multi-branch',
  branches: [
    { name: 'high_priority', condition: 'data.priority === "high"' },
    { name: 'premium_user', condition: 'data.premium === true' },
    { name: 'brazil', condition: 'data.country === "BR"' },
  ],
  allowMultipleMatches: true,
}
// Pode ativar múltiplas rotas simultaneamente!
```

#### 3. **Delay**
- **ID**: `delay`
- **Descrição**: Pausas controladas
- **Params**: duration, unit (ms/s/min)
- **Uso**: Rate limiting, esperar processamento

#### 4. **File Operations**
- **file-read**: Ler arquivo
- **file-write**: Escrever arquivo
- **file-edit**: Editar com regex
- **file-search**: Buscar arquivos (glob)
- **text-search**: Buscar texto em arquivos

#### 5. **Shell Executor**
- **ID**: `shell-executor`
- **Descrição**: Executar comandos shell
- **Params**: command, cwd, timeout
- **⚠️ Atenção**: Use com cuidado, pode ser perigoso

### Data Transformation Tools

#### 1. **Data Transform**
- **ID**: `data-transform`
- **Descrição**: Transformar dados com JavaScript
- **Params**: input, transform (código JS)

```javascript
// Transform code
return {
  name: data.user.toUpperCase(),
  isAdult: data.age >= 18,
  timestamp: new Date().toISOString(),
};
```

#### 2. **Data Filter**
- **ID**: `data-filter`
- **Descrição**: Filtrar arrays
- **Params**: array, condition

```javascript
// Condition
return item.age >= 18 && item.active === true;
```

#### 3. **Data Merge**
- **ID**: `data-merge`
- **Descrição**: Combinar objetos/arrays
- **Modes**: object, array, array-unique

### Agent Tools

#### **Agent Executor**
- **ID**: `agent-executor`
- **Descrição**: Executar agentes com LLM
- **Params**: prompt, temperature, maxTokens, tools

---

## 🔄 Sistema de Fluxos

### Flow Definition

```typescript
interface FlowDefinition {
  id: string;
  name: string;
  description: string;
  nodes: FlowNode[];
  edges: FlowEdge[];
  startNodeId: string;
  variables?: Record<string, any>;
}
```

### Flow Node Types

- `tool` - Executa uma ferramenta do registry
- `condition` - Condicional (if/else)
- `loop` - Loop sobre array
- `parallel` - Execução paralela
- `delay` - Pausa
- `merge` - Merge de resultados

### Execution Context

Cada node recebe um contexto:

```typescript
interface ExecutionContext {
  automationId: string;        // ID da automação
  nodeId: string;              // ID do node atual
  previousResults: Record<string, any>;  // Resultados anteriores
  globalContext: Record<string, any>;    // Contexto global
  sandboxPath?: string;        // Path do sandbox
  timeout?: number;            // Timeout específico
}
```

### Acessando Dados Anteriores

Dentro de nodes (Transform, Condition, etc):

```javascript
// Resultado do node anterior direto
previous.nodeId.result

// Contexto global
context.variavel

// Dados de entrada
data.field
```

---

## 📖 API Reference

### Tool Registry API

```typescript
import { getToolRegistry } from './core/toolRegistry';

const registry = getToolRegistry();

// Registrar tool
registry.register(myTool);

// Buscar tool
const tool = registry.get('tool-id');

// Listar tools
const { tools, total } = registry.list({
  category: 'system',
  search: 'http',
  page: 1,
  pageSize: 20,
});

// Executar tool
const result = await tool.execute(params, context);

// Metrics
const metrics = registry.getMetrics('tool-id');
```

### API Server Endpoints

#### Tools

- `GET /api/tools` - Listar tools
- `GET /api/tools/:id` - Buscar tool
- `GET /api/tools/categories` - Listar categorias

#### Automations

- `GET /api/automations` - Listar automações
- `POST /api/automations` - Criar automação
- `GET /api/automations/:id` - Buscar automação
- `PUT /api/automations/:id` - Atualizar
- `DELETE /api/automations/:id` - Deletar
- `POST /api/automations/:id/execute` - Executar

#### Nodes

- `POST /api/nodes/:id/test` - Testar node
- `POST /api/nodes/upload` - Upload de custom node

#### WebSocket

```javascript
const ws = new WebSocket('ws://localhost:3001');

// Eventos
ws.on('execution:start', (data) => {});
ws.on('execution:progress', (data) => {});
ws.on('execution:complete', (data) => {});
ws.on('execution:error', (data) => {});
```

---

## 🎯 Melhores Práticas

### 1. Sempre Use Tool Result Helper

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
```

### 2. Valide Sempre com Zod

```typescript
const Schema = z.object({
  email: z.string().email(),
  age: z.number().min(0).max(150),
});

// Validar
const validated = Schema.parse(args);
```

### 3. Use Metadata para Debug

```typescript
return {
  success: true,
  result: data,
  metadata: {
    source: 'api',
    processedItems: 10,
    skippedItems: 2,
    warnings: ['Some warning'],
  },
};
```

### 4. Timeout e Retries

```typescript
const tool: Tool = {
  // ...
  config: {
    timeout: 30000,      // 30s
    retries: 3,          // 3 tentativas
    sandbox: true,       // Rodar em sandbox
    concurrent: false,   // Não permitir execução paralela
  },
};
```

### 5. UI Examples

Sempre forneça exemplos práticos:

```typescript
ui: {
  examples: [
    {
      title: 'Caso Básico',
      description: 'Uso mais simples',
      params: { input: 'simple' },
      expectedOutput: { result: 'SIMPLE' },
    },
    {
      title: 'Caso Avançado',
      description: 'Com todas as opções',
      params: { 
        input: 'advanced',
        options: { transform: true },
      },
    },
  ],
}
```

---

## 🐛 Troubleshooting

### Tool não aparece no frontend

1. Verificar se está registrado: `registry.has('tool-id')`
2. Verificar logs de registro: procurar por ❌ ou ✅
3. Validar metadados com: `validateToolMetadata(tool)`

### Erro de validação

```
Metadados inválidos para tool 'my-tool':
- params[0].ui is required
```

**Solução**: Adicionar campo `ui` em todos os params

### Execução trava

- Verificar timeout: pode estar muito baixo
- Verificar loops infinitos em transforms
- Verificar se tool suporta concurrency

### Output não aparece

- Verificar se `ToolResult` está correto
- Verificar `success: true` e `result` definido
- Verificar no metadata se há erros ocultos

---

## 🚀 Próximos Passos

1. **Criar seu primeiro node customizado**
   ```bash
   flui --create-node meu-primeiro-node
   ```

2. **Explorar exemplos**
   - Veja os exemplos em cada tool na UI
   - Clone e modifique para seu caso de uso

3. **Contribuir**
   - Fork o repositório
   - Crie nodes úteis
   - Compartilhe com a comunidade

4. **Integrar APIs**
   - Use HTTP Request tool
   - Crie nodes específicos para APIs que você usa

5. **Criar Workflows Complexos**
   - Use Condition para routing
   - Use Data Transform para processamento
   - Use Delay para rate limiting

---

## 📞 Suporte

- **Documentação**: `/docs`
- **GitHub Issues**: `https://github.com/your-org/flui/issues`
- **Discord**: `https://discord.gg/flui`
- **Email**: `support@flui.dev`

---

## 📄 Licença

MIT License - veja LICENSE para detalhes.

---

## 🙏 Agradecimentos

Inspirado por:
- n8n (workflow visual)
- AgentBuilder (agent systems)
- Zapier (simplicidade)

Mas construído para ser **superior em todos os aspectos**! 🚀
