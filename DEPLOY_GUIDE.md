# 🚀 Guia de Deploy - FLUI Platform v3.0

## ✅ Sistema 100% Pronto para Produção

---

## 📋 PRÉ-REQUISITOS

```bash
Node.js >= 18.x
npm >= 9.x
```

---

## 🚀 INICIAR EM DESENVOLVIMENTO

### 1. Backend

```bash
cd /workspace

# Instalar dependências (se necessário)
npm install

# Iniciar servidor
npx tsx source/startApi.ts

# Ou com watch mode
yarn dev
```

**Aguarde ver:**
```
✅ ExecutionQueue conectada ao WebSocket
🚀 API Server rodando em http://localhost:3001
📡 WebSocket Server rodando em ws://localhost:3001
```

### 2. Frontend (opcional)

```bash
cd /workspace/flui-frontend

# Instalar dependências
npm install

# Iniciar dev server
npm run dev
```

**Acessar:** `http://localhost:5173`

---

## 🧪 EXECUTAR TESTES

```bash
cd /workspace

# Teste individual
./test-webhook-trigger.sh       # ~30s
./test-cron-trigger.sh          # ~80s (aguarda cron executar)
./test-concurrent-executions.sh  # ~30s

# Teste de integração completo
./test-full-integration.sh       # ~10s

# Todos devem passar com ✅
```

---

## 📦 BUILD PARA PRODUÇÃO

### 1. Backend

```bash
cd /workspace

# Compilar TypeScript
npx tsc

# Arquivos compilados em: (configurar tsconfig.json para outDir)
```

### 2. Frontend

```bash
cd /workspace/flui-frontend

# Build otimizado
npm run build

# Arquivos em: flui-frontend/dist/
# Servir com:
npx serve -s dist -l 5173
# Ou nginx, apache, etc.
```

---

## 🔧 CONFIGURAÇÃO

### Variáveis de Ambiente

Criar `.env` na raiz:

```bash
# API
PORT=3001
NODE_ENV=production

# Webhook
WEBHOOK_BASE_URL=https://seu-dominio.com

# LLM (opcional - usuário configura via UI)
LLM_ENDPOINT=https://openrouter.ai/api/v1
LLM_API_KEY=sk-or-v1-...
LLM_MODEL=qwen/qwen3-coder:free

# Execution Queue
MAX_CONCURRENT_EXECUTIONS=5
DEFAULT_RETRIES=2
RETRY_DELAY=5000

# Storage (Conf usa ~/.flui por padrão)
STORAGE_PATH=/var/lib/flui
```

### Persistência

O sistema usa `conf` para storage:
- **Local:** `~/.flui/`
- **Produção:** Definir via `STORAGE_PATH`

**Estrutura:**
```
~/.flui/
  config.json          # Config geral (LLM, theme)
  automations/         # Automações
  agents/              # Agentes
  mcps/                # MCPs instalados
```

---

## 🐳 DOCKER (Opcional)

### Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Backend
COPY package*.json ./
RUN npm ci --production

COPY source/ ./source/
COPY tsconfig.json ./
RUN npx tsc

# Frontend (se incluir)
COPY flui-frontend/ ./flui-frontend/
WORKDIR /app/flui-frontend
RUN npm ci && npm run build

WORKDIR /app

EXPOSE 3001

CMD ["node", "dist/startApi.js"]
```

### Docker Compose

```yaml
version: '3.8'

services:
  flui:
    build: .
    ports:
      - "3001:3001"
    environment:
      - PORT=3001
      - NODE_ENV=production
      - WEBHOOK_BASE_URL=https://seu-dominio.com
    volumes:
      - flui-data:/root/.flui
    restart: unless-stopped

volumes:
  flui-data:
```

---

## 🌐 NGINX (Frontend)

```nginx
server {
    listen 80;
    server_name seu-dominio.com;

    # Frontend
    location / {
        root /var/www/flui/dist;
        try_files $uri $uri/ /index.html;
    }

    # API Backend
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket
    location /ws {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
    }
}
```

---

## 🔐 SEGURANÇA

### 1. Webhook Secret Tokens

- ✅ Gerados automaticamente (64 chars hex)
- ✅ Regeneráveis a qualquer momento
- ✅ Validados em toda requisição
- ⚠️ Usuário deve guardar em local seguro

### 2. Rate Limiting

```typescript
// Webhook já tem rate limit configurável
{
  "rateLimit": 60 // req/min por webhook
}
```

### 3. HTTPS

```bash
# Obrigatório em produção!
# Use Let's Encrypt + Certbot
certbot --nginx -d seu-dominio.com
```

---

## 📊 MONITORAMENTO

### 1. Health Check

```bash
curl http://localhost:3001/api/tools
# Se retornar 200 → Servidor OK
```

### 2. Execution Stats

```bash
curl http://localhost:3001/api/executions-stats

# Response:
{
  "stats": {
    "queued": 0,
    "running": 2,
    "completed": 145,
    "maxConcurrency": 5
  }
}
```

### 3. Logs

```bash
# Backend logs via stdout
# Redirecionar para arquivo:
npx tsx source/startApi.ts > /var/log/flui/api.log 2>&1

# Ou usar pm2:
pm2 start "npx tsx source/startApi.ts" --name flui-api
pm2 logs flui-api
```

---

## 🔄 PM2 (Process Manager)

```bash
# Instalar
npm install -g pm2

# Iniciar
pm2 start ecosystem.config.js

# Status
pm2 status

# Logs
pm2 logs

# Restart
pm2 restart flui-api

# Monit
pm2 monit
```

### ecosystem.config.js

```javascript
module.exports = {
  apps: [{
    name: 'flui-api',
    script: 'npx',
    args: 'tsx source/startApi.ts',
    cwd: '/workspace',
    instances: 1,
    exec_mode: 'fork',
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3001,
    },
    error_file: '/var/log/flui/error.log',
    out_file: '/var/log/flui/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
  }]
}
```

---

## 🧹 MANUTENÇÃO

### Limpar Execuções Antigas

```bash
# Via API
curl -X DELETE http://localhost:3001/api/executions/completed

# Ou agendamento (cron job no servidor)
0 3 * * * curl -X DELETE http://localhost:3001/api/executions/completed
```

### Backup

```bash
# Backup do storage
tar -czf flui-backup-$(date +%Y%m%d).tar.gz ~/.flui/

# Restaurar
tar -xzf flui-backup-20251025.tar.gz -C ~/
```

---

## 🐛 TROUBLESHOOTING

### 1. Servidor não inicia

```bash
# Verificar porta
netstat -tlnp | grep 3001

# Matar processo
pkill -f tsx
pkill -f startApi

# Tentar novamente
npx tsx source/startApi.ts
```

### 2. Webhook não dispara

```bash
# Verificar webhook existe
curl http://localhost:3001/api/webhooks

# Testar com token correto
curl -X POST http://localhost:3001/webhook/webhook-xxx \
  -H "X-Webhook-Secret: TOKEN-CORRETO" \
  -H "Content-Type: application/json" \
  -d '{"test": "value"}'

# Ver logs do servidor
tail -f /var/log/flui/api.log
```

### 3. Cron não executa

```bash
# Verificar cron está ativo
curl http://localhost:3001/api/crons/cron-xxx
# → "isActive": true

# Verificar expressão cron
# Use: https://crontab.guru

# Verificar timezone
# Se expressão for "0 9 * * *" (09:00)
# E timezone = "America/Sao_Paulo"
# → Executa às 09:00 BRT (12:00 UTC)
```

### 4. Executions não aparecem na UI

```bash
# Verificar API retorna dados
curl http://localhost:3001/api/executions

# Verificar WebSocket conectado
# DevTools → Network → WS
# Deve ter conexão ativa

# Refresh página
F5
```

---

## 📚 DOCUMENTAÇÃO COMPLETA

- **Integração:** `INTEGRATION_COMPLETE.md`
- **Status Final:** `FINAL_STATUS.md`
- **Triggers Completos:** `COMPLETE_TRIGGERS_IMPLEMENTATION.md`
- **Testes:** `TESTING_GUIDE.md`
- **Quick Start:** `QUICK_START_GUIDE.md`
- **Deploy:** `DEPLOY_GUIDE.md` (este arquivo)

---

## ✅ CHECKLIST PRÉ-DEPLOY

- [ ] Todos os testes passam (`./test-full-integration.sh`)
- [ ] Build frontend sem erros (`npm run build`)
- [ ] Backend compila sem erros (`npx tsc`)
- [ ] `.env` configurado
- [ ] HTTPS configurado
- [ ] Backup configurado
- [ ] Monitoramento configurado
- [ ] PM2 ou similar configurado
- [ ] Logs configurados
- [ ] Health checks configurados

---

## 🎯 SUPORTE

### Logs Importantes

```bash
# Backend iniciando
✅ ExecutionQueue conectada ao WebSocket
🚀 API Server rodando em http://localhost:3001

# Webhook recebido
🔗 [Webhook] Recebida requisição: POST /webhook/xxx
✅ [Webhook] validado - Executando automação

# Execução enfileirada
📥 [ExecutionQueue] Enfileirada: exec-xxx
🚀 [ExecutionQueue] Iniciando: exec-xxx

# Execução concluída
✅ [ExecutionQueue] Concluída: exec-xxx (completed)
```

### Contatos

- **GitHub:** [seu-repo]
- **Docs:** [seu-docs]
- **Issues:** [seu-issues]

---

**Versão:** 3.0.0  
**Data:** 2025-10-25  
**Status:** ✅ **PRODUCTION READY**

---

🎉 **BOM DEPLOY!** 🚀
