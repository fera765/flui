# 🚀 FLUI - Sistema de Automação CLI

Sistema revolucionário de automação com agentes AI, Tool Registry dinâmico e interface híbrida CLI + Web.

## 📦 Instalação

```bash
cd ~/flui
npm install
```

## 🔨 Build

```bash
npm run build
```

## ▶️ Executar

```bash
npm start
```

## 🌐 Frontend

```bash
cd flui-frontend-vite
npm install
npm run dev
```

Abrir: http://localhost:8080

## 🧪 Testes

```bash
npm test
```

## 📚 Comandos CLI

- `/tools list` - Listar ferramentas
- `/tools info <id>` - Ver detalhes
- `/agents` - Gerenciar agentes
- `/automations` - Gerenciar automações
- `/settings` - Configurações
- `/help` - Ajuda

## 🔧 Sistema

- **10 Ferramentas Built-in**: Shell, File Operations, HTTP, Agent Executor, Custom Code
- **API REST**: http://localhost:3001
- **Tool Registry Dinâmico**: Zero hard-code
- **MCPs**: Suporte completo
- **Frontend Visual**: Workflow drag-and-drop

## 📊 Estrutura

```
flui/
├── source/           # Código backend/CLI
│   ├── core/         # Tool Registry System
│   ├── tools/        # 10 ferramentas built-in
│   ├── services/     # API, Automação, MCPs
│   └── components/   # UI CLI (Ink)
└── flui-frontend-vite/ # Frontend React
    └── src/
        ├── pages/      # Páginas
        └── components/ # Componentes UI
```

## ✅ Validar Funcionamento

Após `npm start`, deve mostrar:

```
🔧 Inicializando FLUI Tool Registry System...
📦 Total de ferramentas registradas: 10
✅ Sistema inicializado!
API rodando em http://localhost:3001
```

Digite `/tools list` para ver todas as ferramentas disponíveis.

---

**Versão**: 2.0.0  
**Status**: ✅ Pronto para uso
