# 📝 TESTE MANUAL - CLI Limpeza de Sessões

## 🧪 Como Testar a Correção

### 1. Iniciar CLI
```bash
npm start
```

**Esperado**: 
- ✅ Tela limpa
- ✅ Header único "FLUI · chat"
- ✅ Mensagem "Digite /help para começar"

---

### 2. Criar Nova Sessão
```bash
# Na CLI, digite:
/sessions
# Pressione 'N' para nova sessão
# Digite nome: "Teste 1"
```

**Esperado**:
- ✅ Tela LIMPA antes de mostrar nova sessão
- ✅ Apenas mensagem: "✅ Nova sessão criada: Teste 1"
- ✅ SEM mensagens antigas
- ✅ SEM duplicação de header

---

### 3. Enviar Mensagem
```bash
# Digite:
oi
```

**Esperado**:
- ✅ Mostra "> oi"
- ✅ Resposta do LLM
- ✅ Tela limpa, sem duplicações

---

### 4. Criar Segunda Sessão
```bash
/sessions
# Pressione 'N'
# Digite: "Teste 2"
```

**Esperado**:
- ✅ Tela LIMPA COMPLETAMENTE
- ✅ Apenas: "✅ Nova sessão criada: Teste 2"
- ✅ Mensagens da "Teste 1" NÃO aparecem
- ✅ Timeline vazia da nova sessão

---

### 5. Trocar Entre Sessões
```bash
/sessions
# Selecione "Teste 1" com setas
# Pressione Enter
```

**Esperado**:
- ✅ Tela LIMPA
- ✅ Carrega mensagens da "Teste 1"
- ✅ Mensagens da "Teste 2" NÃO aparecem

---

## ✅ CHECKLIST DE VALIDAÇÃO

Após seguir os passos acima, verificar:

- [ ] Tela sempre limpa ao criar sessão
- [ ] Tela sempre limpa ao trocar sessão
- [ ] Zero mensagens duplicadas
- [ ] Zero headers duplicados
- [ ] Apenas mensagens da sessão atual aparecem
- [ ] Transição suave entre sessões

---

## 🐛 SE AINDA HOUVER PROBLEMAS

### Sintoma: Mensagens duplicadas
**Solução**: 
1. Parar CLI (Ctrl+C)
2. Limpar storage: `rm -rf ~/.config/flui-cli/`
3. Rebuild: `npm run build`
4. Reiniciar: `npm start`

### Sintoma: Tela não limpa
**Causa**: Terminal não suporta ANSI escape
**Solução**: Use terminal compatível (bash, zsh, não sh básico)

### Sintoma: Headers multiplicando
**Causa**: Re-renders múltiplos
**Solução**: Já corrigido com `initRef`

---

## 📊 RESULTADO ESPERADO

**ANTES**:
```
FLUI · chat
✅ Nova sessão criada: Sessão 3
> oi
Olá! 😄
FLUI · chat  # ❌ DUPLICADO
✅ Nova sessão criada: Sessão 2  # ❌ SESSÃO ANTIGA
```

**DEPOIS**:
```
FLUI · chat  # ✅ ÚNICO
✅ Nova sessão criada: Sessão 3  # ✅ APENAS ATUAL
> oi
Olá! 😄
```

---

**Correções Aplicadas**: ✅  
**Testes Necessários**: Manual (Cursor Agent não suporta stdin)  
**Data**: 19/10/2025

