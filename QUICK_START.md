# 🚀 Guia de Início Rápido - FLUI

## 📋 Pré-requisitos

- Node.js 18+
- npm ou yarn
- OpenAI API Key (para agentes)

## ⚡ Instalação em 3 Passos

### 1. Clone e Instale

```bash
git clone https://github.com/your-org/flui.git
cd flui
npm install
```

### 2. Configure

```bash
# Crie arquivo .env
echo "OPENAI_API_KEY=sk-..." > .env
```

### 3. Build e Execute

```bash
npm run build
npm start
```

✅ Pronto! O FLUI está rodando.

---

## 🎯 Primeiros Passos

### 1. Explorar o CLI

```bash
npm start
```

Comandos básicos:
- Digite `/` para ver comandos disponíveis
- `/help` - Ajuda completa
- `/agents` - Gerenciar agentes
- `/automations` - Ver automações
- `@agente sua mensagem` - Conversar com agente

### 2. Criar Seu Primeiro Node

```bash
# Criar node customizado
npm run create-node meu-primeiro-node

# Navegar para a pasta
cd flui-node-meu-primeiro-node

# Instalar e testar
npm install
npm test

# Build e package
npm run build
npm run package
```

O node estará em `@flui-node-meu-primeiro-node-v1.0.0.zip`

### 3. Usar o Editor Visual

```bash
# Terminal 1: API Server (já roda com npm start)
npm start

# Terminal 2: Frontend
cd flui-frontend-vite
npm run dev
```

Acesse: http://localhost:5173

**Criar Automação:**
1. Click em "Nova Automação"
2. Click no botão "+" para adicionar tools
3. Arraste para conectar nodes
4. Click no ícone ⚙️ para configurar
5. Click "Executar" para testar

---

## 📚 Exemplos Rápidos

### Exemplo 1: HTTP Request

```typescript
// Configuração do node HTTP Request
{
  url: 'https://api.github.com/users/octocat',
  method: 'GET'
}

// Output
{
  success: true,
  result: {
    status: 200,
    body: { login: 'octocat', id: 1, ... }
  }
}
```

### Exemplo 2: Condition (Fluxo Condicional)

```typescript
// Multi-branch: Múltiplas rotas simultâneas!
{
  mode: 'multi-branch',
  inputValue: { score: 85, premium: true, country: 'BR' },
  branches: [
    { name: 'high_score', condition: 'data.score > 80' },
    { name: 'premium', condition: 'data.premium === true' },
    { name: 'brazil', condition: 'data.country === "BR"' }
  ],
  allowMultipleMatches: true
}

// Output: Todas as 3 rotas são ativadas!
{
  success: true,
  result: {
    matchedBranches: ['high_score', 'premium', 'brazil'],
    selectedRoute: 'high_score'
  }
}
```

### Exemplo 3: Data Transform

```typescript
// Transformar dados
{
  input: { 
    users: [
      { name: 'john', age: 25 },
      { name: 'jane', age: 30 }
    ]
  },
  transform: `
    return {
      names: data.users.map(u => u.name.toUpperCase()),
      avgAge: data.users.reduce((sum, u) => sum + u.age, 0) / data.users.length
    };
  `
}

// Output
{
  success: true,
  result: {
    names: ['JOHN', 'JANE'],
    avgAge: 27.5
  }
}
```

### Exemplo 4: Workflow Completo

```
┌─────────────┐
│ HTTP Request│ → Buscar dados de API
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Condition  │ → Verificar status
└──┬────────┬─┘
   │        │
   ▼        ▼
success   error
   │        │
   ▼        ▼
┌──────┐ ┌──────┐
│Filter│ │ Delay│ → Rate limit
└───┬──┘ └───┬──┘
    │        │
    ▼        ▼
┌─────────────┐
│  Transform  │ → Processar dados
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ HTTP Request│ → Enviar resultado
└─────────────┘
```

---

## 🔧 Tools Disponíveis

### System & Control Flow
- `http-request` - Requisições HTTP
- `condition` - Fluxos condicionais (SUPERIOR!)
- `delay` - Pausas controladas
- `file-read/write/edit` - Operações de arquivo
- `file-search` - Buscar arquivos (glob)
- `text-search` - Grep em arquivos
- `shell-executor` - Executar comandos

### Data Transformation
- `data-transform` - Transformar com JS
- `data-filter` - Filtrar arrays
- `data-merge` - Combinar dados

### Agent
- `agent-executor` - Executar agentes LLM

### Custom
- `custom-code` - Código JavaScript customizado

---

## 🎓 Próximos Passos

1. **Ler a documentação completa**: `DOCUMENTATION.md`
2. **Explorar exemplos**: Cada tool tem exemplos na UI
3. **Criar nodes customizados**: `npm run create-node`
4. **Integrar suas APIs**: Use HTTP Request tool
5. **Criar workflows complexos**: Combine tools

---

## 📞 Precisa de Ajuda?

- 📖 **Documentação**: `DOCUMENTATION.md`
- 🐛 **Issues**: GitHub Issues
- 💬 **Discord**: [Join Server]
- 📧 **Email**: support@flui.dev

---

## 🚀 Comandos Úteis

```bash
# CLI
npm start                          # Iniciar CLI
npm run dev                        # Dev mode com watch

# Build
npm run build                      # Build completo
npm test                           # Rodar testes
npm run lint                       # Lint código

# Custom Nodes
npm run create-node <name>         # Criar node
flui --create-node <name>          # Ou via CLI

# Frontend
cd flui-frontend-vite
npm run dev                        # Dev server
npm run build                      # Build produção
```

---

**Pronto para criar automações incríveis! 🎉**
