# 🏗️ FLUI - Arquitetura do Sistema de Automação

## 📐 Visão Geral da Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                     FLUI Architecture                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐ │
│  │   Frontend   │───▶│  API Server  │───▶│  Tool Engine │ │
│  │  (React)     │◀───│  (Express)   │◀───│  (Registry)  │ │
│  └──────────────┘    └──────────────┘    └──────────────┘ │
│         │                    │                    │         │
│         │                    │                    ▼         │
│         │                    │            ┌──────────────┐ │
│         │                    │            │   17 Tools   │ │
│         │                    │            │   Registered │ │
│         │                    │            └──────────────┘ │
│         │                    ▼                              │
│         │            ┌──────────────┐                      │
│         └───────────▶│     CLI      │                      │
│                      │   (Ink.js)   │                      │
│                      └──────────────┘                      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔧 Componentes Principais

### 1. Tool Registry System

```typescript
ToolRegistry
├── register(tool)           // Registra nova tool
├── get(toolId)              // Busca tool por ID
├── list(filter)             // Lista com paginação
├── updateMetrics()          // Atualiza estatísticas
└── export()                 // Export para backup

Tool Structure
├── id                       // Identificador único
├── name                     // Nome amigável
├── description              // Descrição detalhada
├── category                 // Categoria
├── params[]                 // Parâmetros configuráveis
│   ├── name                 // Nome do parâmetro
│   ├── key                  // Chave no config
│   ├── type                 // Tipo (string, number, etc)
│   ├── required             // Se obrigatório
│   ├── default              // Valor padrão
│   └── ui                   // Configuração de UI
│       ├── widgetType       // Tipo de widget
│       ├── helperText       // Texto de ajuda
│       ├── placeholder      // Placeholder
│       ├── validation       // Regras de validação
│       └── advanced         // Se é campo avançado
├── execute()                // Função de execução
├── output                   // Schema de saída
├── ui                       // Configuração visual
│   ├── icon                 // Ícone do nó
│   ├── color                // Cor do nó
│   ├── tags[]               // Tags para busca
│   └── examples[]           // Exemplos de uso
├── capabilities             // Capacidades da tool
└── config                   // Configuração de execução
```

---

### 2. Smart Connections System

```typescript
SmartConnections
├── suggestConnections()     // Analisa e sugere conexões
│   ├── Analisa output do nó fonte
│   ├── Analisa inputs do nó alvo
│   ├── Match por nome
│   ├── Match por tipo
│   ├── Match por padrões comuns
│   └── Retorna com confidence (0-1)
│
├── autoFillParameters()     // Preenche automaticamente
│   ├── Aplica apenas se confidence >= 0.7
│   ├── Preserva valores já preenchidos
│   └── Gera template expressions
│
├── generateTemplateExpression()  // Gera {{ nodes.x.y }}
│
└── analyzeWorkflowConnections() // Analisa workflow completo
```

**Padrões Reconhecidos:**
```typescript
const patterns = {
  'webhook-trigger → universal-condition': {
    mapping: 'data → input',
    confidence: 1.0
  },
  'universal-condition → agent-executor': {
    mapping: 'input → prompt',
    confidence: 0.9
  },
  'agent-executor → webhook-response': {
    mapping: 'response → response',
    confidence: 1.0
  },
  'http-request → *': {
    mapping: 'body → input',
    confidence: 0.8
  }
};
```

---

### 3. Tool Execution Pipeline

```
┌─────────────────────────────────────────────────────────┐
│               Tool Execution Pipeline                    │
└─────────────────────────────────────────────────────────┘

1. Receive Request
   ├── toolId
   ├── params
   └── context

2. Get Tool from Registry
   └── registry.get(toolId)

3. Apply Defaults
   ├── Sandbox defaults (if sandbox tool)
   ├── Agent options (if agent tool)
   └── Standard defaults from tool definition

4. Validate Parameters
   ├── Check required params
   ├── Check types
   ├── Check ranges/patterns
   └── Custom validation functions

5. Execute Tool
   ├── beforeExecute hook
   ├── Execute with timeout
   ├── Retry on failure (if configured)
   └── afterExecute hook

6. Update Metrics
   ├── Execution count
   ├── Success/failure count
   └── Average execution time

7. Return Result
   ├── success: boolean
   ├── result: any
   ├── error?: string
   ├── executionTime: number
   └── metadata: any
```

---

### 4. Frontend Architecture

```
flui-frontend-vite/
├── pages/
│   ├── EditAutomation.tsx          // Editor principal
│   ├── CreateAutomationV2.tsx      // Criação de workflow
│   └── CustomNodesPage.tsx         // Gerenciar custom nodes
│
├── components/
│   ├── ToolNode.tsx                // Visual do nó
│   ├── NodeConfigPanel.tsx         // Modal de configuração
│   │   ├── Dynamic UI rendering
│   │   ├── Load agents dynamically
│   │   ├── Validation in real-time
│   │   └── Auto-fill from examples
│   │
│   ├── ToolPalette.tsx             // Paleta de tools
│   └── CustomNode.tsx              // Nós customizados
│
└── React Flow Integration
    ├── useNodesState               // Gerenciar nós
    ├── useEdgesState               // Gerenciar conexões
    ├── Custom node types           // ToolNode
    └── Connection handlers         // Auto-fill on connect
```

---

### 5. Backend Services

```
source/services/
├── toolApi.ts                 // API unificada de tools
│   ├── executeTool()          // Executa com contexto completo
│   ├── listTools()            // Lista todas as tools
│   ├── getToolMetadata()      // Metadata enriquecida
│   └── testTool()             // Teste rápido
│
├── smartConnections.ts        // Conexões inteligentes
│   ├── suggestConnections()
│   ├── autoFillParameters()
│   └── analyzeWorkflowConnections()
│
├── sandboxDefaults.ts         // Auto-preenchimento sandbox
│   ├── getSandboxInfo()
│   ├── applySandboxDefaults()
│   └── getSandboxExamples()
│
├── apiServer.ts               // Express API
│   ├── /api/tools             // Listar tools
│   ├── /api/tools/:id         // Metadata de tool
│   ├── /api/tools/:id/agents-options // Agentes disponíveis
│   ├── /api/agents            // CRUD de agentes
│   └── /api/automations       // CRUD de automações
│
└── automationExecutor.ts      // Executor de workflows
```

---

### 6. Core System

```
source/core/
├── toolRegistry.ts            // Registry central
│   ├── Singleton pattern
│   ├── Validation on register
│   ├── Metrics tracking
│   └── Category management
│
├── toolExecutor.ts            // Execution engine
│   ├── Timeout handling
│   ├── Retry logic
│   ├── Hooks support
│   └── Metrics update
│
├── toolValidator.ts           // Validation system
│   ├── Type checking
│   ├── Required validation
│   ├── Custom validators
│   └── Default application
│
├── flowEngine.ts              // Workflow execution
│   ├── Node execution order
│   ├── Branch handling
│   ├── Context passing
│   └── Error recovery
│
└── types.ts                   // Type definitions
    ├── Tool
    ├── ToolParam
    ├── ExecutionContext
    ├── ToolResult
    └── UIConfig
```

---

## 🎯 Data Flow

### Request Flow
```
User Action (Frontend)
    ↓
API Request
    ↓
API Server (/api/automations/:id/execute)
    ↓
Automation Executor
    ↓
Flow Engine
    ↓
For each node:
    ↓
Tool API (executeTool)
    ↓
Apply Sandbox Defaults (if applicable)
    ↓
Tool Executor
    ↓
Validate Parameters
    ↓
Execute Tool
    ↓
Update Metrics
    ↓
Return Result
    ↓
Next Node (using Smart Connections)
    ↓
... repeat ...
    ↓
Final Result
    ↓
Response to User
```

---

### Connection Flow
```
User Connects Two Nodes (Frontend)
    ↓
onConnect Event
    ↓
Smart Connections: suggestConnections()
    ↓
Analyze:
  - Source node output schema
  - Target node input params
  - Previous results (if available)
    ↓
Generate Mappings:
  - Match by exact name (confidence: 1.0)
  - Match by similar name (confidence: 0.8)
  - Match by type (confidence: 0.5)
  - Match by common patterns (confidence: 0.7-0.9)
    ↓
Auto-fill Parameters:
  - Apply mappings with confidence >= 0.7
  - Generate template expressions
  - Update target node config
    ↓
Visual Feedback
  - Show connected fields
  - Display confidence level
  - Highlight auto-filled params
```

---

## 🗃️ Data Models

### Tool Definition
```typescript
interface Tool {
  id: string;
  name: string;
  description: string;
  category: ToolCategory;
  version: string;
  params: ToolParam[];
  output: ToolOutput;
  execute: (args: any, context: ExecutionContext) => Promise<ToolResult>;
  capabilities?: ToolCapabilities;
  ui: ToolUI;
  config: ToolConfig;
  hooks?: ToolHooks;
}
```

### Workflow Node
```typescript
interface WorkflowNode {
  id: string;
  type: 'tool';
  position: { x: number; y: number };
  data: {
    label: string;
    description: string;
    toolId: string;
    category: string;
    color: string;
    icon: string;
    status: 'idle' | 'running' | 'completed' | 'failed';
    config: Record<string, any>;
    onConfigure: () => void;
    onDelete: () => void;
  };
}
```

### Connection/Edge
```typescript
interface WorkflowEdge {
  id: string;
  source: string;  // Source node ID
  target: string;  // Target node ID
  type: 'smoothstep';
  animated: boolean;
  data?: {
    mappings?: Array<{
      sourceField: string;
      targetParam: string;
      confidence: number;
    }>;
  };
}
```

---

## 🔐 Security & Sandboxing

### Sandbox Execution
```
Tools que rodam em Sandbox:
├── shell-executor          ✅ Isolated
├── file-write/edit         ✅ Isolated
├── custom-code             ✅ Isolated
└── data-transform          ✅ Isolated

Sandbox Features:
├── Isolated filesystem
├── Limited permissions
├── Timeout enforcement
├── Resource limits
└── Clean up after execution
```

### Validation Layers
```
1. Client-side (Frontend)
   └── UI validation (required, types, patterns)

2. API Layer
   └── Request validation (structure, auth)

3. Tool Validator
   └── Parameter validation (types, ranges, custom)

4. Execution Layer
   └── Runtime validation (timeouts, resources)
```

---

## 🚀 Performance Optimizations

### Caching
```typescript
// Sandbox info cached
cachedSandboxInfo: SandboxInfo | null

// Agents loaded once per session
agentsCache: Agent[]

// Tool metadata cached in registry
toolsCache: Map<string, RegisteredTool>
```

### Parallel Execution
```typescript
// Tools marcadas como concurrent: true podem executar em paralelo
const parallelTools = nodes.filter(n => 
  tools.get(n.toolId)?.config?.concurrent === true
);

await Promise.all(parallelTools.map(n => executeTool(n)));
```

### Lazy Loading
```typescript
// Frontend carrega tools sob demanda
const loadToolMetadata = async (toolId) => {
  if (!toolsCache[toolId]) {
    toolsCache[toolId] = await fetchToolMetadata(toolId);
  }
  return toolsCache[toolId];
};
```

---

## 🎨 UI Component Hierarchy

```
EditAutomation / CreateAutomationV2
│
├── ReactFlow Canvas
│   ├── Background (dots)
│   ├── Controls (zoom, pan)
│   ├── MiniMap
│   │
│   └── Nodes (ToolNode × N)
│       ├── Header (icon, title, buttons)
│       │   ├── Configure Button (Settings icon)
│       │   └── Delete Button (Trash icon)
│       │
│       ├── Body (description, status)
│       └── Handles (input/output ports)
│
├── ToolPalette (Modal)
│   ├── Search bar
│   ├── Category filters
│   └── Tool grid
│       └── Tool cards
│
└── NodeConfigPanel (Modal)
    ├── Header (tool name, close)
    │
    ├── Examples Section
    │   └── Example cards (clickable)
    │
    ├── Parameters Section
    │   ├── Basic params
    │   │   ├── Dynamic widget rendering
    │   │   │   ├── TextInput
    │   │   │   ├── TextArea
    │   │   │   ├── Select (with dynamic options)
    │   │   │   ├── Toggle
    │   │   │   ├── Number
    │   │   │   ├── KeyValue
    │   │   │   ├── CodeEditor
    │   │   │   └── JSONEditor
    │   │   │
    │   │   └── Real-time validation
    │   │
    │   └── Advanced params (collapsible)
    │
    └── Footer (cancel, test, save)
```

---

## 📊 State Management

### Frontend State (React)
```typescript
EditAutomation
├── nodes: Node[]                    // React Flow nodes
├── edges: Edge[]                    // React Flow edges
├── selectedNode: Node | null        // Node sendo configurado
├── configPanelOpen: boolean         // Modal aberto/fechado
├── showPalette: boolean             // Paleta aberta/fechada
└── executionLogs: any[]             // Logs de execução

NodeConfigPanel
├── tool: Tool | null                // Metadata da tool
├── config: any                      // Configuração atual
├── errors: Record<string, string>   // Erros de validação
├── isLoading: boolean               // Loading state
└── testResult: any                  // Resultado do teste
```

### Backend State (Zustand)
```typescript
useStore
├── agents: Agent[]                  // Agentes criados
├── mcps: MCP[]                      // MCPs configurados
├── sessions: Session[]              // Sessões ativas
├── messages: Message[]              // Histórico de mensagens
├── currentView: View                // View atual (chat, agents, etc)
├── input: string                    // Input do usuário
├── showCommandSuggestions: boolean  // Mostrar sugestões de /
└── showAgentMentions: boolean       // Mostrar menções @
```

---

## 🔄 Workflow Execution Flow

### Detailed Execution Steps

```
1. User clicks "Execute"
   ↓
2. Frontend: POST /api/automations/:id/execute
   ↓
3. API Server: Load automation from storage
   ↓
4. Automation Executor: Initialize execution
   ├── Create execution context
   ├── Initialize global variables
   └── Setup logging
   ↓
5. Flow Engine: Build execution graph
   ├── Topological sort of nodes
   ├── Identify start node
   └── Build dependency tree
   ↓
6. Execute Nodes in Order
   │
   For each node:
   │
   ├── 6.1. Load Tool
   │   └── registry.get(node.toolId)
   │
   ├── 6.2. Prepare Parameters
   │   ├── Resolve template expressions {{ }}
   │   ├── Apply sandbox defaults
   │   ├── Load dynamic options (agents)
   │   └── Apply tool defaults
   │
   ├── 6.3. Validate
   │   ├── Check required params
   │   ├── Check types
   │   ├── Check ranges
   │   └── Custom validators
   │
   ├── 6.4. Execute
   │   ├── beforeExecute hook
   │   ├── Run tool.execute()
   │   ├── Handle timeout
   │   ├── Handle retries
   │   └── afterExecute hook
   │
   ├── 6.5. Process Result
   │   ├── Save to previousResults
   │   ├── Update node status
   │   ├── Log execution
   │   └── Update metrics
   │
   └── 6.6. Determine Next Nodes
       ├── Check for conditional branches
       ├── Apply smart connections
       └── Queue next nodes
   ↓
7. Complete Execution
   ├── Collect all results
   ├── Generate summary
   └── Return to frontend
   ↓
8. Frontend: Display Results
   ├── Update node statuses
   ├── Show logs
   └── Highlight completed path
```

---

## 🧩 Plugin Architecture

### Adding New Tools

```typescript
// 1. Create tool definition
export const MyCustomTool: Tool = {
  id: 'my-custom-tool',
  name: 'My Tool',
  description: 'Does something amazing',
  category: 'custom',
  version: '1.0.0',
  
  params: [
    {
      name: 'Input',
      key: 'input',
      type: 'string',
      required: true,
      ui: {
        widgetType: 'textInput',
        helperText: 'Your input here',
      },
    },
  ],
  
  output: {
    type: 'string',
    description: 'Processed output',
  },
  
  async execute(args, context) {
    // Your logic here
    return {
      success: true,
      result: `Processed: ${args.input}`,
    };
  },
  
  ui: {
    icon: 'Star',
    color: '#ff00ff',
    tags: ['custom', 'awesome'],
    examples: [
      {
        title: 'Example',
        params: { input: 'test' },
      },
    ],
  },
  
  config: {
    timeout: 10000,
    sandbox: false,
  },
};

// 2. Register in tools/index.ts
import { MyCustomTool } from './custom/myCustomTool.js';

export const ALL_TOOLS: Tool[] = [
  ...existingTools,
  MyCustomTool, // ← Add here
];

// 3. That's it! Frontend auto-discovers it
```

---

## 📈 Scalability Considerations

### Current Capacity
- ✅ Suporta 1000+ tools (registry limit)
- ✅ Workflows com 100+ nodes
- ✅ Execução paralela de tools concurrent
- ✅ Cache eficiente

### Future Scaling
```
Horizontal Scaling:
├── Multiple API servers
├── Load balancer
├── Distributed tool registry
└── Shared cache (Redis)

Performance:
├── WebSocket for real-time updates
├── Server-sent events for logs
├── Background job queue
└── Result caching
```

---

## 🎯 Design Patterns Used

### Registry Pattern
- Central registry for all tools
- Dynamic registration
- Versioning support

### Factory Pattern
- Dynamic widget creation
- Node creation from tools
- Execution context creation

### Strategy Pattern
- Different comparison types in Condition
- Different widget types
- Different execution modes

### Observer Pattern
- React state updates
- Execution logging
- Metrics tracking

### Decorator Pattern
- Tool hooks (before/after execute)
- Validation decorators
- Metrics decorators

---

## 🔍 Debugging & Monitoring

### Debug Mode
```typescript
// Enable in tool execution
const result = await ToolExecutor.execute(
  toolId,
  params,
  context,
  { debug: true } // Logs detalhados
);
```

### Metrics Available
```typescript
tool.metrics = {
  executionCount: number,
  successCount: number,
  failureCount: number,
  averageExecutionTime: number,
  lastExecutedAt: string,
};
```

### Logging
```typescript
// Automatic logging em cada execução
console.log(`✅ Tool registrada: ${tool.name} (${tool.id})`);
console.log(`⚠️  Avisos: ${warnings.join(', ')}`);
console.log(`❌ Erro: ${error.message}`);
```

---

## 🎊 Conclusão

### Arquitetura Robusta e Escalável

**Características:**
- ✅ Modular e extensível
- ✅ Type-safe com TypeScript
- ✅ Testável (unit + integration)
- ✅ Documentada
- ✅ Performance otimizada
- ✅ Security-first
- ✅ User-friendly

**Pronto para:**
- 🚀 Produção imediata
- 📈 Escalar conforme necessário
- 🔧 Adicionar novas tools facilmente
- 🎨 Customização total
- 🌍 Deploy em qualquer ambiente

---

_FLUI - Flow Universal Interface_ 🚀
