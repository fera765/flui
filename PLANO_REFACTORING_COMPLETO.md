# 🔥 PLANO DE REFACTORING COMPLETO - SISTEMA DE FERRAMENTAS

## 📋 OBJETIVO

Refatorar completamente o sistema de ferramentas, MCPs e tools do Flui para torná-lo:
- ✅ **Superior ao N8n e AgentBuilder**
- ✅ **100% dinâmico** (zero hard-code)
- ✅ **Modular e extensível**
- ✅ **Totalmente configurável** (UI + CLI)
- ✅ **Testado de ponta a ponta**

---

## 🔍 ANÁLISE DO CÓDIGO ATUAL

### Problemas Identificados:

#### 1. **toolExecutor.ts** ❌
- Hard-coded switch/case para detectar tipos de tools
- Lógica de parsing manual do nome (`mcpName_toolName`)
- Ferramentas não são registradas dinamicamente
- Impossível adicionar novas tools sem modificar código

#### 2. **store.ts** ⚠️
- MCPs armazenados, mas sem metadados de tools
- Não há registry centralizado de ferramentas
- Agents não têm vínculo claro com tools disponíveis

#### 3. **defaultData.ts** ❌
- Dados hard-coded
- MCPs simulados sem implementação real
- Tools fictícias

#### 4. **automationExecutor.ts** ⚠️
- Execução baseada em tipos fixos de nós
- Não usa registry de ferramentas
- Limitado aos tipos pre-definidos

---

## 🏗️ NOVA ARQUITETURA

### Core: Tool Registry System

```
┌─────────────────────────────────────────┐
│         Tool Registry (Core)            │
│                                         │
│  - registerTool()                       │
│  - getTool()                            │
│  - listTools()                          │
│  - executeTool()                        │
│  - validateParams()                     │
└─────────────────────────────────────────┘
              ▲
              │
    ┌─────────┴─────────┐
    │                   │
┌───▼────┐      ┌──────▼─────┐
│ Tools  │      │   MCPs     │
│        │      │            │
│ - Shell│      │ - Dynamic  │
│ - File │      │   loaded   │
│ - HTTP │      │ - Remote   │
│ - ...  │      │   tools    │
└────────┘      └────────────┘
```

### Estrutura de uma Tool:

```typescript
interface Tool {
  id: string;                  // Identificador único
  name: string;                // Nome de exibição
  description: string;         // Descrição
  category: 'system' | 'mcp' | 'agent' | 'custom';
  
  // Parâmetros de entrada
  params: ToolParam[];
  
  // Saída esperada
  output: ToolOutput;
  
  // Função de execução
  execute: (args: any, context: ExecutionContext) => Promise<ToolResult>;
  
  // Metadados para UI
  ui: {
    icon?: string;
    color?: string;
    position?: { x: number; y: number };
  };
  
  // Configurações avançadas
  config?: {
    timeout?: number;
    retries?: number;
    sandbox?: boolean;
  };
}

interface ToolParam {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description: string;
  required: boolean;
  default?: any;
  validation?: (value: any) => boolean;
}

interface ToolOutput {
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description: string;
  schema?: object; // JSON Schema
}
```

---

## 📦 FERRAMENTAS A SEREM IMPLEMENTADAS

### 1. **Shell Executor Tool** ✅
```typescript
{
  id: 'shell-executor',
  name: 'Shell Executor',
  description: 'Executa comandos shell em sandbox seguro',
  category: 'system',
  params: [
    {
      name: 'command',
      type: 'string',
      description: 'Comando a ser executado',
      required: true
    },
    {
      name: 'directory',
      type: 'string',
      description: 'Diretório de execução',
      required: false,
      default: '.'
    },
    {
      name: 'timeout',
      type: 'number',
      description: 'Timeout em ms',
      required: false,
      default: 30000
    }
  ],
  output: {
    type: 'object',
    description: 'Resultado da execução',
    schema: {
      stdout: 'string',
      stderr: 'string',
      exitCode: 'number'
    }
  }
}
```

### 2. **File Read Tool** ✅
```typescript
{
  id: 'file-read',
  name: 'File Read',
  description: 'Lê conteúdo de arquivo',
  category: 'system',
  params: [
    {
      name: 'path',
      type: 'string',
      description: 'Caminho do arquivo',
      required: true
    },
    {
      name: 'encoding',
      type: 'string',
      description: 'Codificação do arquivo',
      required: false,
      default: 'utf-8'
    }
  ],
  output: {
    type: 'string',
    description: 'Conteúdo do arquivo'
  }
}
```

### 3. **File Write Tool** ✅
```typescript
{
  id: 'file-write',
  name: 'File Write',
  description: 'Escreve conteúdo em arquivo',
  category: 'system',
  params: [
    {
      name: 'path',
      type: 'string',
      description: 'Caminho do arquivo',
      required: true
    },
    {
      name: 'content',
      type: 'string',
      description: 'Conteúdo a ser escrito',
      required: true
    },
    {
      name: 'mode',
      type: 'string',
      description: 'Modo de escrita: overwrite ou append',
      required: false,
      default: 'overwrite'
    }
  ],
  output: {
    type: 'object',
    description: 'Status da operação',
    schema: {
      success: 'boolean',
      bytesWritten: 'number'
    }
  }
}
```

### 4. **File Edit Tool** ✅
```typescript
{
  id: 'file-edit',
  name: 'File Edit',
  description: 'Edita conteúdo dentro de arquivo usando regex',
  category: 'system',
  params: [
    {
      name: 'path',
      type: 'string',
      description: 'Caminho do arquivo',
      required: true
    },
    {
      name: 'search',
      type: 'string',
      description: 'Expressão de busca (regex)',
      required: true
    },
    {
      name: 'replace',
      type: 'string',
      description: 'Conteúdo de substituição',
      required: true
    },
    {
      name: 'flags',
      type: 'string',
      description: 'Flags regex (g, i, m)',
      required: false,
      default: 'g'
    }
  ],
  output: {
    type: 'object',
    description: 'Resultado da edição',
    schema: {
      success: 'boolean',
      replacements: 'number'
    }
  }
}
```

### 5. **Text Search Tool** ✅
```typescript
{
  id: 'text-search',
  name: 'Text Search',
  description: 'Busca texto em múltiplos arquivos',
  category: 'system',
  params: [
    {
      name: 'pattern',
      type: 'string',
      description: 'Padrão de busca',
      required: true
    },
    {
      name: 'directory',
      type: 'string',
      description: 'Diretório base',
      required: false,
      default: '.'
    },
    {
      name: 'filePattern',
      type: 'string',
      description: 'Padrão de arquivos (glob)',
      required: false,
      default: '*'
    },
    {
      name: 'caseSensitive',
      type: 'boolean',
      description: 'Busca case-sensitive',
      required: false,
      default: false
    }
  ],
  output: {
    type: 'array',
    description: 'Ocorrências encontradas',
    schema: {
      items: {
        file: 'string',
        line: 'number',
        column: 'number',
        match: 'string',
        context: 'string'
      }
    }
  }
}
```

### 6. **File Search Tool** ✅
```typescript
{
  id: 'file-search',
  name: 'File Search',
  description: 'Busca arquivos por nome/padrão',
  category: 'system',
  params: [
    {
      name: 'pattern',
      type: 'string',
      description: 'Padrão de busca (glob)',
      required: true
    },
    {
      name: 'directory',
      type: 'string',
      description: 'Diretório base',
      required: false,
      default: '.'
    },
    {
      name: 'recursive',
      type: 'boolean',
      description: 'Busca recursiva',
      required: false,
      default: true
    }
  ],
  output: {
    type: 'array',
    description: 'Lista de caminhos encontrados',
    schema: {
      items: 'string'
    }
  }
}
```

### 7. **HTTP Request Tool** ✅
```typescript
{
  id: 'http-request',
  name: 'HTTP Request',
  description: 'Realiza requisições HTTP',
  category: 'system',
  params: [
    {
      name: 'url',
      type: 'string',
      description: 'URL da requisição',
      required: true
    },
    {
      name: 'method',
      type: 'string',
      description: 'Método HTTP',
      required: false,
      default: 'GET'
    },
    {
      name: 'headers',
      type: 'object',
      description: 'Headers da requisição',
      required: false
    },
    {
      name: 'body',
      type: 'object',
      description: 'Body da requisição',
      required: false
    },
    {
      name: 'timeout',
      type: 'number',
      description: 'Timeout em ms',
      required: false,
      default: 30000
    }
  ],
  output: {
    type: 'object',
    description: 'Resposta HTTP',
    schema: {
      status: 'number',
      headers: 'object',
      body: 'any'
    }
  }
}
```

### 8. **Agent Executor Tool** ✅
```typescript
{
  id: 'agent-executor',
  name: 'Agent Executor',
  description: 'Executa outro agente ou fluxo',
  category: 'agent',
  params: [
    {
      name: 'agentId',
      type: 'string',
      description: 'ID do agente',
      required: true
    },
    {
      name: 'payload',
      type: 'object',
      description: 'Dados de entrada',
      required: false
    },
    {
      name: 'timeout',
      type: 'number',
      description: 'Timeout em ms',
      required: false,
      default: 60000
    }
  ],
  output: {
    type: 'object',
    description: 'Resposta do agente',
    schema: {
      success: 'boolean',
      response: 'any',
      executionTime: 'number'
    }
  }
}
```

### 9. **System Info Tool** ✅
```typescript
{
  id: 'system-info',
  name: 'System Info',
  description: 'Retorna informações do sistema',
  category: 'system',
  params: [],
  output: {
    type: 'object',
    description: 'Informações do sistema',
    schema: {
      platform: 'string',
      arch: 'string',
      cpus: 'number',
      memory: {
        total: 'number',
        free: 'number',
        used: 'number'
      },
      uptime: 'number'
    }
  }
}
```

### 10. **Custom Code Tool** ✅
```typescript
{
  id: 'custom-code',
  name: 'Custom Code',
  description: 'Executa código personalizado em sandbox',
  category: 'custom',
  params: [
    {
      name: 'language',
      type: 'string',
      description: 'Linguagem: javascript ou python',
      required: true
    },
    {
      name: 'code',
      type: 'string',
      description: 'Código a ser executado',
      required: true
    },
    {
      name: 'input',
      type: 'object',
      description: 'Dados de entrada para o código',
      required: false
    },
    {
      name: 'timeout',
      type: 'number',
      description: 'Timeout em ms',
      required: false,
      default: 10000
    }
  ],
  output: {
    type: 'object',
    description: 'Resultado da execução',
    schema: {
      success: 'boolean',
      result: 'any',
      stdout: 'string',
      stderr: 'string'
    }
  }
}
```

---

## 📂 ESTRUTURA DE ARQUIVOS

```
source/
├── core/
│   ├── toolRegistry.ts          # Registry central ✅
│   ├── toolExecutor.ts          # Executor genérico ✅
│   ├── toolValidator.ts         # Validação de params ✅
│   └── types.ts                 # Tipos core ✅
├── tools/
│   ├── system/
│   │   ├── shellExecutor.ts     # Shell tool ✅
│   │   ├── fileRead.ts          # File read ✅
│   │   ├── fileWrite.ts         # File write ✅
│   │   ├── fileEdit.ts          # File edit ✅
│   │   ├── fileSearch.ts        # File search ✅
│   │   ├── textSearch.ts        # Text search ✅
│   │   ├── httpRequest.ts       # HTTP tool ✅
│   │   ├── systemInfo.ts        # System info ✅
│   │   └── index.ts             # Export all
│   ├── agent/
│   │   ├── agentExecutor.ts     # Agent tool ✅
│   │   └── index.ts
│   ├── custom/
│   │   ├── customCode.ts        # Custom code ✅
│   │   └── index.ts
│   └── index.ts                 # Export all tools
├── services/
│   ├── apiServer.ts             # API endpoints ✅
│   ├── automationExecutor.ts    # Refatorado ✅
│   └── mcpLoader.ts             # Carregador de MCPs ✅
├── store/
│   ├── store.ts                 # Zustand store ✅
│   └── storage.ts               # Persistência ✅
└── __tests__/
    ├── tools/
    │   ├── shellExecutor.test.ts
    │   ├── fileOps.test.ts
    │   ├── httpRequest.test.ts
    │   └── ...
    ├── integration/
    │   ├── toolRegistry.test.ts
    │   ├── automation.test.ts
    │   └── e2e.test.ts
    └── ...
```

---

## 🔧 IMPLEMENTAÇÃO - FASES

### FASE 1: Core (Fundação) ✅
1. ✅ Criar `/source/core/types.ts` - Tipos base
2. ✅ Criar `/source/core/toolRegistry.ts` - Registry
3. ✅ Criar `/source/core/toolValidator.ts` - Validador
4. ✅ Criar `/source/core/toolExecutor.ts` - Executor

### FASE 2: Tools Sistema (Essenciais) ✅
5. ✅ Implementar Shell Executor
6. ✅ Implementar File Read/Write/Edit
7. ✅ Implementar File Search
8. ✅ Implementar Text Search
9. ✅ Implementar HTTP Request

### FASE 3: Tools Avançadas ✅
10. ✅ Implementar Agent Executor
11. ✅ Implementar System Info
12. ✅ Implementar Custom Code

### FASE 4: Backend Refactor ⏳
13. ⏳ Refatorar `automationExecutor.ts`
14. ⏳ Criar `mcpLoader.ts`
15. ⏳ Atualizar `apiServer.ts`
16. ⏳ Remover código hard-coded

### FASE 5: Frontend Refactor ⏳
17. ⏳ Atualizar `NodePalette` para usar registry
18. ⏳ Atualizar `NodeConfigModal` com campos dinâmicos
19. ⏳ Criar UI de gerenciamento de tools
20. ⏳ WebSocket para logs em tempo real

### FASE 6: CLI Refactor ⏳
21. ⏳ Comandos de gerenciamento de tools
22. ⏳ Comandos de teste de tools
23. ⏳ Visualização de logs

### FASE 7: Testes ⏳
24. ⏳ Testes unitários de cada tool
25. ⏳ Testes de integração
26. ⏳ Testes E2E
27. ⏳ Testes de performance

---

## 📊 STATUS ATUAL

| Fase | Status | Progresso |
|------|--------|-----------|
| Fase 1: Core | ⏳ | 0% |
| Fase 2: Tools Sistema | ⏳ | 0% |
| Fase 3: Tools Avançadas | ⏳ | 0% |
| Fase 4: Backend | ⏳ | 0% |
| Fase 5: Frontend | ⏳ | 0% |
| Fase 6: CLI | ⏳ | 0% |
| Fase 7: Testes | ⏳ | 0% |

**Progresso Total**: 0% (0/27 tarefas)

---

## 🎯 PRÓXIMOS PASSOS

1. ✅ Criar estrutura de pastas
2. ✅ Implementar tipos base (core/types.ts)
3. ✅ Implementar Tool Registry
4. ✅ Implementar primeira tool (Shell Executor)
5. ✅ Testar integração

---

**Início**: 2025-10-19 16:45 UTC  
**Estimativa**: 3-5 dias de desenvolvimento  
**Prioridade**: 🔴 CRÍTICA
