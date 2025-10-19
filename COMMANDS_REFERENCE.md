# 📖 FLUI - Referência Rápida de Comandos

**Versão**: 2.1.0

---

## 🚀 Instalação e Build

```bash
# Clone e instale
git clone https://github.com/your-org/flui.git
cd flui
npm install

# Build
npm run build

# Validação completa
./scripts/full-validate.sh
```

---

## 💻 Inicialização

### CLI
```bash
npm start
# ou após build
flui
# ou
node dist/cli.js
```

### Frontend
```bash
cd flui-frontend-vite
npm install
npm run dev
# Acesse: http://localhost:5173
```

### API Server
```bash
# Já inicia com npm start
# Acesse: http://localhost:3001
```

---

## 🎮 Comandos CLI

### Navegação Básica
```bash
/                    # Mostrar comandos disponíveis
/help               # Ajuda completa
/clear              # Limpar tela
/exit               # Sair
```

### Ferramentas (Tools)
```bash
/tools list                                    # Listar todas
/tools list --category=http                    # Filtrar por categoria
/tools list --search=request                   # Buscar por nome
/tools list --page=2 --page-size=10           # Paginação

/tools info http-request                       # Detalhes da tool
/tools categories                              # Listar categorias

# Testar tool
/tools test condition '{"mode":"if-else","branches":[{"name":"adult","condition":"data.age >= 18"}],"inputValue":{"age":25}}'
```

### Automações
```bash
/automations        # Abrir gerenciador
/flow               # Gerenciar fluxos
```

### Sistema
```bash
/settings           # Configurações
/status             # Status do sistema
/test               # Testar conexão LLM
/agents             # Gerenciar agentes
/mcps               # Gerenciar MCPs
/theme              # Trocar tema
/sessions           # Ver sessões
```

### Agentes
```bash
@agente-nome sua mensagem    # Conversar com agente
```

---

## 🔧 Criar Node Customizado

```bash
# Opção 1: Via npm script
npm run create-node meu-node

# Opção 2: Via CLI
flui --create-node meu-node

# Opção 3: Após build
node dist/cli.js --create-node meu-node

# Ver ajuda
flui --help
```

### Estrutura Criada
```
flui-node-meu-node/
├── src/index.ts           # Código do node
├── __tests__/             # Testes
├── scripts/               # Build e package
├── package.json
├── README.md
├── DOC.md
└── CHANGELOG.md
```

### Workflow do Node
```bash
cd flui-node-meu-node

# Instalar
npm install

# Testar
npm test

# Build
npm run build

# Package
npm run package
# Cria: @flui-node-meu-node-v1.0.0.zip

# Upload
flui --upload-node ./package.zip
```

---

## 🌐 API REST

### Base URL
```
http://localhost:3001/api
```

### Tools

#### Listar Tools
```bash
# Todas
curl http://localhost:3001/api/tools

# Com filtros
curl "http://localhost:3001/api/tools?page=1&pageSize=20&category=http&search=request"
```

#### Detalhes de Tool
```bash
curl http://localhost:3001/api/tools/http-request
```

#### Categorias
```bash
curl http://localhost:3001/api/tools/categories
```

#### Testar Node
```bash
curl -X POST http://localhost:3001/api/nodes/test \
  -H "Content-Type: application/json" \
  -d '{
    "toolId": "condition",
    "params": {
      "mode": "if-else",
      "inputValue": {"age": 25},
      "branches": [
        {"name": "adult", "condition": "data.age >= 18"}
      ]
    }
  }'
```

### Automations

#### Listar
```bash
curl http://localhost:3001/api/automations
```

#### Criar
```bash
curl -X POST http://localhost:3001/api/automations \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Minha Automação",
    "description": "Descrição",
    "nodes": [...],
    "edges": [...]
  }'
```

#### Executar
```bash
curl -X POST http://localhost:3001/api/automations/123/execute
```

---

## 🧪 Testes

```bash
# Todos os testes
npm test

# Watch mode
npm run test:watch

# Com UI
npm run test:ui

# Teste específico
npm test -- source/__tests__/condition.test.ts
```

---

## 🎨 Frontend - Criar Automação

### Via Interface
1. Acesse http://localhost:5173
2. Click "Nova Automação"
3. Click "+" para adicionar tool
4. Selecione tool da lista
5. Arraste para conectar nodes
6. Click ⚙️ para configurar
7. Click "Executar" para testar
8. Click "Salvar"

### Atalhos
- `Space` - Abrir paleta de tools
- `Delete` - Remover node selecionado
- `Ctrl/Cmd + S` - Salvar
- `Ctrl/Cmd + E` - Executar

---

## 📊 Exemplos de Uso

### 1. HTTP Request Simples
```typescript
{
  toolId: "http-request",
  config: {
    url: "https://api.github.com/users/octocat",
    method: "GET"
  }
}
```

### 2. Condition Multi-Branch
```typescript
{
  toolId: "condition",
  config: {
    mode: "multi-branch",
    inputValue: { score: 85, premium: true },
    branches: [
      { name: "high", condition: "data.score > 80" },
      { name: "premium", condition: "data.premium === true" }
    ],
    allowMultipleMatches: true
  }
}
```

### 3. Data Transform
```typescript
{
  toolId: "data-transform",
  config: {
    input: { users: [{name: "john"}, {name: "jane"}] },
    transform: "return { names: data.users.map(u => u.name.toUpperCase()) };"
  }
}
```

### 4. Delay
```typescript
{
  toolId: "delay",
  config: {
    duration: 5,
    unit: "seconds",
    message: "Aguardando rate limit..."
  }
}
```

### 5. Workflow Completo
```yaml
Nodes:
  - HTTP Request → Buscar dados
  - Condition → Verificar status
    ├─ success → Data Transform → Processar
    └─ error → Delay → Retry

Edges:
  - http → condition
  - condition.success → transform
  - condition.error → delay
  - delay → http (retry)
```

---

## 🔍 Troubleshooting

### Limpar Build
```bash
rm -rf dist node_modules
npm install
npm run build
```

### Ver Logs
```bash
npm start 2>&1 | tee flui.log
```

### Debug Mode
```bash
DEBUG=* npm start
```

### Verificar Porta
```bash
# Porta 3001 (API)
lsof -i :3001

# Porta 5173 (Frontend)
lsof -i :5173

# Matar processo
kill -9 <PID>
```

---

## 📚 Tools Disponíveis (15)

### System & Control Flow
1. `shell-executor` - Executar comandos
2. `file-read` - Ler arquivo
3. `file-write` - Escrever arquivo
4. `file-edit` - Editar com regex
5. `file-search` - Buscar arquivos (glob)
6. `text-search` - Grep em arquivos
7. `http-request` - Requisições HTTP
8. `system-info` - Info do sistema
9. `condition` - Fluxos condicionais (4 modos!)
10. `delay` - Pausas controladas

### Data Transformation
11. `data-transform` - Transformar com JS
12. `data-filter` - Filtrar arrays
13. `data-merge` - Combinar dados

### Agent
14. `agent-executor` - Executar agente LLM

### Custom
15. `custom-code` - Código JavaScript

---

## 🎯 Modos da Tool Condition

### 1. if-else
```typescript
mode: "if-else"
// Comportamento: Para na primeira condição verdadeira
```

### 2. switch
```typescript
mode: "switch"
// Comportamento: Switch/case style
```

### 3. multi-branch (INOVADOR!)
```typescript
mode: "multi-branch",
allowMultipleMatches: true
// Comportamento: Múltiplas rotas simultâneas!
```

### 4. score-based (ÚNICO!)
```typescript
mode: "score-based"
// Comportamento: Escolhe branch com maior score
```

---

## 🔐 Variáveis de Ambiente

```bash
# .env file
OPENAI_API_KEY=sk-...
API_PORT=3001
API_HOST=localhost
FRONTEND_PORT=3000
STORAGE_PATH=./data
```

---

## 📖 Documentação

- `README.md` - Overview
- `DOCUMENTATION.md` - Docs completas (800+ linhas)
- `QUICK_START.md` - Guia rápido
- `CORRECTIONS_APPLIED.md` - Correções
- `FINAL_REPORT.md` - Relatório final
- `COMMANDS_REFERENCE.md` - Este arquivo

---

## 🚀 Links Úteis

- **Repositório**: https://github.com/your-org/flui
- **Issues**: https://github.com/your-org/flui/issues
- **Discord**: https://discord.gg/flui
- **Email**: support@flui.dev

---

**Versão**: 2.1.0  
**Status**: ✅ Produção
