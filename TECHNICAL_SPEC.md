# FLUI - Especificação Técnica Completa

**Versão**: 2.0.0  
**Data**: 2025-10-19  
**Status**: Implementado

---

## 1. Visão Geral

O FLUI é um sistema de automação inteligente que combina:
- Tool Registry modular e dinâmico
- Editor visual de workflows (estilo n8n)
- Painéis de configuração gerados automaticamente
- API REST completa com paginação
- CLI poderosa com comandos de gerenciamento
- Validação automática de metadados

### 1.1 Objetivos Principais

1. **Zero Hard-code**: Todas as ferramentas são registradas dinamicamente
2. **UX Superior**: Usuários configuram nós sem editar JSON
3. **Validação Rigorosa**: Metadados validados via JSON Schema
4. **Testabilidade**: Cobertura de testes de 90%+
5. **Feedback em Português**: Todos os logs e mensagens em PT-BR

---

## 2. Arquitetura do Sistema

### 2.1 Componentes Principais

```
┌─────────────────────────────────────────────────────────┐
│                      FRONTEND (React)                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Workflow     │  │ NodeConfig   │  │ Tools List   │  │
│  │ Editor       │  │ Panel        │  │ Page         │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
                            │
                            │ REST API (HTTP)
                            │
┌─────────────────────────────────────────────────────────┐
│                    BACKEND (Node.js)                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ API Server   │  │ Tool         │  │ Flow         │  │
│  │ (Express)    │  │ Registry     │  │ Engine       │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Tool         │  │ Sandbox      │  │ CLI          │  │
│  │ Validator    │  │ Executor     │  │ Commands     │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
                            │
                            │
                            ▼
                    ┌───────────────┐
                    │  Storage      │
                    │  (JSON/DB)    │
                    └───────────────┘
```

### 2.2 Fluxo de Dados

1. **Usuário adiciona nó no editor**
   - Frontend carrega metadados via `GET /api/tools/:id`
   - NodeConfigPanel renderiza formulário dinamicamente

2. **Usuário configura nó**
   - Campos validados em tempo real
   - "Testar Nó" executa via `POST /api/nodes/:nodeId/test`
   - Resultado exibido no painel

3. **Usuário salva workflow**
   - Enviado via `PUT /api/workflows/:id/save`
   - Backend cria nova versão
   - Workflow armazenado com timestamp

4. **Execução do workflow**
   - Flow Engine processa nós sequencialmente
   - Tool Executor chama ferramentas via registry
   - Logs transmitidos via WebSocket

---

## 3. Tool Registry System

### 3.1 Estrutura de Metadados

```typescript
interface Tool {
  // Identificação
  id: string;                    // Único, kebab-case
  name: string;                  // Nome amigável
  description: string;           // Min 10 caracteres
  category: ToolCategory;        // Categoria técnica
  version: string;               // Semver (x.y.z)
  
  // Parâmetros
  params: ToolParam[];           // Array de parâmetros
  output: ToolOutput;            // Schema de saída
  
  // Portas (opcional)
  inputs?: Port[];               // Portas de entrada
  outputs?: Port[];              // Portas de saída
  
  // Capacidades
  capabilities?: {
    requiresAuth?: boolean;
    runsInSandbox?: boolean;
    isAsync?: boolean;
    supportsStreaming?: boolean;
    canBeCached?: boolean;
    isStateful?: boolean;
    requiresNetwork?: boolean;
    requiresFileSystem?: boolean;
  };
  
  // UI
  ui: {
    icon?: string;
    color?: string;               // Hex (#RRGGBB)
    tags?: string[];
    examples?: Example[];
    category?: string;            // Categoria visual
    group?: string;               // Grupo dentro da categoria
  };
  
  // Configuração
  config?: {
    timeout?: number;
    retries?: number;
    sandbox?: boolean;
    concurrent?: boolean;
    rateLimit?: {
      max: number;
      window: number;
    };
  };
  
  // Execução
  execute: (args: any, context: ExecutionContext) => Promise<ToolResult>;
  validate?: (args: any) => ValidationResult;
  
  // Hooks (opcional)
  hooks?: {
    beforeExecute?: (args, context) => Promise<void>;
    afterExecute?: (result, context) => Promise<void>;
    onError?: (error, context) => Promise<void>;
  };
}
```

### 3.2 Parâmetros com UI Config

```typescript
interface ToolParam {
  name: string;                  // Nome exibido
  key: string;                   // Chave no objeto config
  type: ToolParamType;           // string | number | boolean | object | array | file | json
  description: string;
  required: boolean;
  default?: any;
  
  ui: {
    widgetType: WidgetType;      // textInput | select | keyValue | etc
    placeholder?: string;
    helperText?: string;
    options?: Option[];          // Para select/multiSelect
    validation?: {
      min?: number;
      max?: number;
      minLength?: number;
      maxLength?: number;
      pattern?: string;          // Regex
    };
    advanced?: boolean;          // Se true, só mostra em modo avançado
    dependsOn?: string;          // Campo dependente
    showIf?: string;             // Expressão condicional
    codeLanguage?: string;       // Para codeEditor
    allowExpressions?: boolean;  // Permite drag-drop de valores
    multiline?: boolean;
    rows?: number;
  };
}
```

### 3.3 Widgets Disponíveis

| Widget         | Uso                              | Props Especiais            |
|----------------|----------------------------------|----------------------------|
| textInput      | Texto simples                    | placeholder, pattern       |
| textArea       | Texto longo                      | rows, multiline            |
| number         | Numérico                         | min, max                   |
| select         | Dropdown                         | options                    |
| multiSelect    | Seleção múltipla                 | options                    |
| toggle         | On/Off                           | -                          |
| checkbox       | Checkbox                         | -                          |
| keyValue       | Chave-valor (headers, params)    | allowExpressions           |
| jsonEditor     | JSON com validação               | -                          |
| codeEditor     | Código com highlight             | codeLanguage               |
| filePicker     | Seletor de arquivo               | -                          |
| datePicker     | Seleção de data                  | -                          |
| colorPicker    | Seleção de cor                   | -                          |
| slider         | Slider numérico                  | min, max                   |
| radio          | Radio buttons                    | options                    |

---

## 4. Validação de Metadados

### 4.1 Regras Obrigatórias

✅ **ID**: Apenas letras minúsculas, números, hífens e underscores  
✅ **Nome**: Não vazio  
✅ **Descrição**: Mínimo 10 caracteres  
✅ **Versão**: Semver válido (x.y.z)  
✅ **Categoria**: Enum válido  
✅ **Params**: Keys únicas  
✅ **UI Color**: Hex válido (#RRGGBB) se fornecido  

### 4.2 Warnings (não bloqueantes)

⚠️ Nenhum exemplo fornecido  
⚠️ Parâmetros obrigatórios sem placeholder  
⚠️ Ferramentas assíncronas sem timeout  
⚠️ Ferramentas de rede sem timeout  

### 4.3 Processo de Validação

```typescript
// 1. Validar schema básico (Zod)
ToolMetadataSchema.parse(metadata);

// 2. Validações customizadas
- Keys de params únicas
- Expressões showIf válidas
- Cores em formato hex

// 3. Preparar metadados
- Adicionar defaults
- Inferir UI config se ausente
- Normalizar estrutura

// 4. Registrar no registry
registry.register(preparedTool);
```

---

## 5. API REST

### 5.1 Endpoints de Ferramentas

#### GET /api/tools
Listar ferramentas com paginação

**Query Params:**
- `page` (number): Página atual (default: 1)
- `pageSize` (number): Itens por página (default: 20)
- `category` (string): Filtrar por categoria
- `search` (string): Busca por nome/descrição/ID
- `tags` (string): Tags separadas por vírgula

**Response:**
```json
{
  "data": [Tool],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 50,
    "totalPages": 3
  },
  "links": {
    "first": "...",
    "last": "...",
    "next": "...",
    "prev": "..."
  }
}
```

#### GET /api/tools/:id
Obter detalhes de uma ferramenta

**Response:**
```json
{
  "id": "http-request",
  "name": "HTTP Request",
  "description": "...",
  "params": [...],
  "metrics": {
    "executionCount": 42,
    "successCount": 40,
    "failureCount": 2,
    "averageExecutionTime": 523.5
  },
  ...
}
```

#### POST /api/tools
Registrar nova ferramenta (via módulo/CLI)

#### PUT /api/tools/:id
Atualizar ferramenta existente

#### DELETE /api/tools/:id
Deletar ferramenta

**Query Params:**
- `force` (boolean): Forçar exclusão mesmo se em uso

#### POST /api/nodes/:nodeId/test
Testar execução de um nó

**Body:**
```json
{
  "toolId": "http-request",
  "params": {
    "url": "https://api.github.com/zen",
    "method": "GET"
  },
  "context": {
    "automationId": "test",
    "nodeId": "node-1",
    ...
  }
}
```

**Response:**
```json
{
  "nodeId": "node-1",
  "toolId": "http-request",
  "result": {
    "success": true,
    "result": {...},
    "executionTime": 234
  },
  "executionTime": 234,
  "sandbox": false,
  "timestamp": "2025-10-19T..."
}
```

### 5.2 Endpoints de Workflows

#### GET /api/workflows
Listar workflows

#### GET /api/workflows/:id
Obter workflow específico

#### PUT /api/workflows/:id/save
Salvar alterações com versionamento

**Body:**
```json
{
  "name": "Meu Workflow",
  "description": "...",
  "nodes": [...],
  "edges": [...]
}
```

**Response:**
```json
{
  "success": true,
  "id": "wf-123",
  "version": "v1729370000000",
  "message": "Workflow salvo com sucesso"
}
```

#### POST /api/flows/execute
Executar workflow

---

## 6. Frontend - NodeConfigPanel

### 6.1 Renderização Dinâmica

```typescript
// 1. Carregar metadados
const tool = await fetch(`/api/tools/${toolId}`);

// 2. Renderizar campos
tool.params.forEach(param => {
  const Widget = getWidget(param.ui.widgetType);
  return (
    <Widget
      value={config[param.key]}
      onChange={value => updateConfig(param.key, value)}
      {...param.ui}
    />
  );
});
```

### 6.2 Validação em Tempo Real

```typescript
// Validar ao mudar valor
const validate = (param, value) => {
  // 1. Verificar required
  if (param.required && !value) {
    return 'Campo obrigatório';
  }
  
  // 2. Aplicar validações
  const { validation } = param.ui;
  if (validation) {
    if (validation.min && value < validation.min) {
      return `Valor mínimo: ${validation.min}`;
    }
    if (validation.pattern && !new RegExp(validation.pattern).test(value)) {
      return 'Formato inválido';
    }
  }
  
  return null;
};
```

### 6.3 Modo Básico vs Avançado

```typescript
// Campos básicos sempre visíveis
const basicParams = params.filter(p => !p.ui.advanced);

// Campos avançados só quando ativado
const advancedParams = params.filter(p => p.ui.advanced);

return (
  <>
    {basicParams.map(renderParam)}
    
    <button onClick={() => setShowAdvanced(!showAdvanced)}>
      Opções Avançadas
    </button>
    
    {showAdvanced && advancedParams.map(renderParam)}
  </>
);
```

### 6.4 Teste de Nó

```typescript
const handleTest = async () => {
  // 1. Validar config
  if (!validateConfig()) return;
  
  // 2. Executar teste
  const result = await fetch(`/api/nodes/${nodeId}/test`, {
    method: 'POST',
    body: JSON.stringify({ toolId, params: config })
  });
  
  // 3. Exibir resultado
  setTestResult(result);
};
```

---

## 7. CLI - Comandos

### 7.1 Tools

```bash
# Listar com paginação
/tools list --page=2 --page-size=10

# Detalhes
/tools info http-request

# Testar
/tools test http-request '{"url":"https://api.github.com/zen","method":"GET"}'

# Deletar
/tools delete custom-tool-1

# Categorias
/tools categories
```

### 7.2 Implementação

```typescript
// Parsing de argumentos
const pageArg = args.find(a => a.startsWith('--page='));
const page = pageArg ? parseInt(pageArg.split('=')[1]) : 1;

// Chamar registry
const result = registry.list({ page, pageSize });

// Formatar output
const output = formatToolsList(result);
store.addMessage({ role: 'system', content: output });
```

---

## 8. Testes

### 8.1 Cobertura

- **Unitários**: 90%+ das funções críticas
  - Tool Registry
  - Metadata Validator
  - Tool Executor
  - HTTP Request Tool
  - File Operations Tools

- **Integração**: Endpoints da API
  - GET /api/tools (paginação)
  - POST /api/nodes/:nodeId/test
  - PUT /api/workflows/:id/save

- **E2E**: 3 workflows exemplo
  - Agência de marketing
  - Atendimento WhatsApp
  - Processamento de dados

### 8.2 Estrutura de Testes

```typescript
describe('HTTPRequestTool', () => {
  describe('Metadata', () => {
    it('deve ter ID correto');
    it('deve ter categoria http');
    it('deve ter UI config para todos os params');
  });
  
  describe('Execution', () => {
    it('deve fazer GET request simples');
    it('deve adicionar query params');
    it('deve enviar headers customizados');
    it('deve fazer POST com body JSON');
    it('deve retornar erro em timeout');
  });
});
```

---

## 9. Script de Validação

### 9.1 Etapas do full-validate.sh

1. ✅ Verificar ambiente (Node.js, npm)
2. 📦 Instalar dependências (backend + frontend)
3. 🔨 Build do backend/CLI
4. 🎨 Build do frontend
5. 🧪 Executar testes unitários
6. 🔍 Smoke test da CLI
7. ✅ Validar Tool Registry
8. 📋 Analisar logs

### 9.2 Critérios de Sucesso

✅ Todos os builds concluídos  
✅ Testes unitários passando  
✅ Tool Registry com 10+ ferramentas  
✅ Nenhum erro crítico nos logs  
✅ CLI executando corretamente  

### 9.3 Output

```
╔═══════════════════════════════════════════════════════════╗
║   ✅ BUILD E VALIDAÇÃO: SUCESSO                           ║
║   Nenhum erro detectado.                                  ║
║   Sistema pronto para uso em produção.                    ║
║   Build ID: 1729370000                                    ║
╚═══════════════════════════════════════════════════════════╝

📝 Próximos passos:
   1. Revisar avisos (se houver): 2
   2. Iniciar backend: npm start
   3. Iniciar frontend: cd flui-frontend-vite && npm run dev
   4. Acessar: http://localhost:8080
```

---

## 10. Decisões de Design

### 10.1 Por que Metadados Ricos?

**Problema**: N8n e AgentBuilder forçam usuários a editar JSON para configurar nós.

**Solução**: Metadados com UI config permitem gerar formulários automaticamente.

**Benefícios**:
- UX superior
- Menos erros
- Validação em tempo real
- Documentação integrada (helperText)

### 10.2 Por que Paginação Obrigatória?

**Problema**: Listagens grandes travam o frontend.

**Solução**: Paginação nativa na API e UI.

**Benefícios**:
- Performance consistente
- Escalabilidade
- Melhor UX

### 10.3 Por que Versionamento de Workflows?

**Problema**: Sobrescrever workflows causa perda de trabalho.

**Solução**: Nova versão a cada save, permitir reverter.

**Benefícios**:
- Segurança
- Auditoria
- Colaboração facilitada

### 10.4 Por que Script de Validação?

**Problema**: Desenvolvedores esquecem de testar antes de commit.

**Solução**: Script único que faz tudo.

**Benefícios**:
- CI/CD simplificado
- Qualidade garantida
- Feedback claro em português

---

## 11. Roadmap Futuro

### Fase 2 (Próxima)

- 🔐 Sandbox robusto com containers
- 🤝 Modo colaborativo (WebSocket)
- 📊 Dashboard de métricas
- 🔌 Plugin system
- 🌐 I18n (suporte multi-idioma)

### Fase 3

- ☁️ Deploy na nuvem
- 🔄 Sincronização cross-device
- 📱 App mobile
- 🤖 AI-powered workflow suggestions

---

## 12. Referências

- N8n Documentation: https://docs.n8n.io/
- OpenAI Agent Builder: https://platform.openai.com/docs/assistants
- React Flow: https://reactflow.dev/
- Zod: https://zod.dev/

---

**Documento Mantido Por**: Equipe FLUI  
**Última Atualização**: 2025-10-19  
**Próxima Revisão**: 2025-11-19
