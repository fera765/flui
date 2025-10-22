# ⚡ Guia Rápido de Teste - 5 Minutos

## 🎯 Objetivo
Validar que agentes e condition nodes podem ser editados SEM erro.

## 📋 Pré-requisitos
- ✅ Backend rodando: http://localhost:3001
- ✅ Frontend rodando: http://localhost:8080
- ✅ Automação de teste criada

## 🚀 Passo a Passo (5 minutos)

### 1. Criar Dados de Teste (30 segundos)
```bash
/workspace/test-complete-flow.sh
```
Deve mostrar: `✅ ALL TESTS PASSED`

### 2. Abrir Navegador (10 segundos)
Acesse: **http://localhost:8080/automations/edit/test-complete-flow**

### 3. Testar Condition (1 minuto)
1. Clique no node "Condition Flex"
2. Clique em "Configurar" ou ⚙️
3. **VERIFICAR**: Modal abre SEM erro ✅ ou COM erro ❌?

### 4. Testar Agent (1 minuto)
1. Clique no node "Agent Node"  
2. Clique em "Configurar" ou ⚙️
3. **VERIFICAR**: Modal abre SEM erro ✅ ou COM erro ❌?

### 5. Reportar Resultado (30 segundos)

#### Se FUNCIONAR ✅
```
✅ SUCESSO!
- Condition: Modal abriu sem erro
- Agent: Modal abriu sem erro
```

#### Se DER ERRO ❌
1. Abra DevTools (F12)
2. Vá para aba Console
3. Copie TODOS os logs que começam com `[NodeConfigModalV2]`
4. Tire screenshot do erro
5. Compartilhe

## 🔍 O Que Procurar

### ✅ CORRETO (Esperado)
- Modal abre
- Campos aparecem (value, paths, prompt, etc.)
- Pode editar e salvar

### ❌ ERRO (Problema)
- Mensagem: "Erro ao carregar configurações do node: Node não encontrado"
- Modal não abre
- Campos não aparecem

## 📞 Debug Rápido

Se der erro, execute no console do browser:
```javascript
// Ver nodes no canvas
const nodes = document.querySelectorAll('.react-flow__node');
console.log('Nodes no canvas:', nodes.length);

// Ver se React Flow carregou
console.log('React Flow:', document.querySelector('.react-flow'));
```

## 🧹 Limpeza (Opcional)
```bash
curl -X DELETE http://localhost:3001/api/automations/test-complete-flow
```

---
**Tempo Total**: 5 minutos  
**Dificuldade**: Fácil  
**Requer**: Navegador web
