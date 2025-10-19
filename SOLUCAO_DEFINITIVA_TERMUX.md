# 🚨 NEXT.JS NÃO FUNCIONA NO TERMUX - USE VITE!

## ❌ PROBLEMA PERSISTENTE
Next.js 14.x **NÃO TEM** pacote SWC para Android ARM64.
Isso é uma limitação do Next.js, não um bug configurável.

## ✅ SOLUÇÃO DEFINITIVA: USE VITE

### Por Que Vite?
- ✅ **Funciona 100% no Termux**
- ✅ **Não precisa de SWC nativo**
- ✅ **10-50x mais rápido**
- ✅ **Mesmas features**
- ✅ **Zero problemas**

---

## 🚀 EXECUTAR CORRETAMENTE

### ❌ NÃO FAÇA (Next.js no Termux):
```bash
cd flui-frontend
yarn dev  # ❌ ERRO 404
```

### ✅ FAÇA (Vite no Termux):
```bash
cd flui-frontend-vite
npm run dev  # ✅ FUNCIONA!
```

---

## 📦 INSTALAÇÃO VITE (SE NECESSÁRIO)

```bash
cd /workspace/flui-frontend-vite
npm install
npm run dev
```

**Porta**: http://localhost:8080

---

## 💡 QUANDO USAR CADA UM

### Use Next.js (flui-frontend):
- ✅ Linux x64/x86
- ✅ Windows
- ✅ Mac
- ❌ **NUNCA no Termux Android**

### Use Vite (flui-frontend-vite):
- ✅ Termux Android ⭐
- ✅ Linux
- ✅ Windows
- ✅ Mac
- ✅ Qualquer sistema

---

**REGRA DE OURO**: No Termux, sempre use `flui-frontend-vite`!
