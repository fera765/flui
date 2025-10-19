# 🚨 LEIA ANTES DE RODAR O FRONTEND

## ❌ PROBLEMA ATUAL

**Erro PostCSS**:
```
It looks like you're trying to use `tailwindcss` directly as a PostCSS plugin.
```

**Causa**: Tailwind v4 instalado no `node_modules/`, mas projeto configurado para v3

---

## ✅ SOLUÇÃO (2 MINUTOS)

### Execute EXATAMENTE estes comandos:

```bash
npm uninstall tailwindcss

npm install --save-dev tailwindcss@3.4.1 --save-exact

npm list tailwindcss
```

**Verifique**: A última linha DEVE mostrar:
```
└── tailwindcss@3.4.1
```

Se mostrar v4.x, REPITA os comandos acima!

### Depois limpe o cache:

```bash
rm -rf .vite dist
```

### Agora pode rodar:

```bash
npm run build

npm run dev
```

---

## 🌐 ABRA NO NAVEGADOR

```
http://localhost:8080
```

**Deve ver**:
- ✅ Gradiente roxo → rosa no fundo
- ✅ Cores vibrantes
- ✅ Console (F12) sem erros

---

## ⚙️ ARQUIVOS JÁ CONFIGURADOS

Não precisa alterar nada:

✅ `package.json` - v3.4.1 especificado  
✅ `postcss.config.js` - Configuração correta  
✅ `tailwind.config.ts` - Paths OK  
✅ `src/index.css` - Directives OK  

**Só precisa instalar a versão correta!**

---

## 📋 CHECKLIST

Antes de abrir issue, verifique:

- [ ] `npm list tailwindcss` mostra **3.4.1** (não 4.x)
- [ ] Cache limpo (`.vite` e `dist` removidos)
- [ ] Build passou sem erros
- [ ] Dev server sem erros PostCSS
- [ ] Browser mostra gradiente

---

**Data**: 2025-10-19  
**Status**: Arquivos OK, aguarda instalação v3.4.1
