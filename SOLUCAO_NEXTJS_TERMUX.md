# 🔧 SOLUÇÃO: Next.js no Termux/Android

## ❌ PROBLEMA
```
Failed to download swc package @next/swc-android-arm64
Error: request failed with status 404
```

**Causa**: Next.js 14.0.4 não tem pacote SWC pré-compilado para Android ARM64

---

## ✅ SOLUÇÕES IMPLEMENTADAS

### 1. Atualizar Next.js
```json
"next": "14.2.0"  // Melhor suporte Android
```

### 2. Desabilitar SWC Nativo
```javascript
// next.config.js
const nextConfig = {
  swcMinify: false,  // Usar minificador alternativo
  experimental: {
    forceSwcTransforms: false,  // Babel como fallback
  },
}
```

### 3. Configurar .npmrc
```
legacy-peer-deps=true
optional=false  // Não instalar pacotes opcionais (SWC nativo)
```

### 4. Babel como Fallback
```json
// .babelrc
{
  "presets": ["next/babel"]
}
```

---

## 🚀 REINSTALAR

### Limpar tudo:
```bash
cd flui-frontend
rm -rf node_modules .next package-lock.json yarn.lock
```

### Reinstalar:
```bash
npm install --legacy-peer-deps --no-optional
```

### Executar:
```bash
npm run dev
```

---

## ⚡ ALTERNATIVA: Vite + React

Se Next.js continuar com problemas no Termux, usar Vite:

```bash
# Criar novo frontend com Vite
npm create vite@latest flui-frontend-vite -- --template react-ts

cd flui-frontend-vite
npm install
npm install reactflow axios zustand lucide-react
npm run dev
```

**Vantagens Vite**:
- ✅ Não precisa SWC nativo
- ✅ Mais rápido que Next.js
- ✅ Funciona perfeitamente no Termux
- ✅ Mesma funcionalidade

---

## 📊 STATUS APÓS FIX

### Se Next.js funcionar:
```
✅ Next.js com Babel fallback
✅ http://localhost:8080
✅ Drag-and-drop OK
```

### Se precisar Vite:
```
✅ Vite + React
✅ http://localhost:5173
✅ Mesma UI/UX
✅ Mais rápido
```

---

**Flui Frontend** - Funcionando no Termux! 🚀
