# 📖 GUIA DE USO COMPLETO - SISTEMA FLUI

## 🎯 VISÃO GERAL

Este guia cobre o uso completo do sistema FLUI, incluindo:
1. **Configuração de Nós** - Novo modal visual simplificado
2. **Sistema de Linkers** - Conexões type-safe entre nodes
3. **Instalação de MCPs** - Adicionar ferramentas via NPX, NPM, GitHub, Local

---

## 📦 **1. CONFIGURAÇÃO DE NÓS**

### **Como Abrir:**
1. Criar/editar automação
2. Adicionar node ao canvas
3. Clicar no botão "⚙️ Configurar" no node

### **Tipos de Campos:**

#### **Boolean (Liga/Desliga)**
- Visual: Toggle verde/cinza
- Estados:
  - ✅ Ativado (verde)
  - ⭕ Desativado (cinza)
- Click no toggle para alternar

#### **String (Texto)**
- Input simples para textos curtos
- Textarea para textos longos
- Placeholder indica o que digitar

#### **Number (Número)**
- Input numérico
- Aceita decimais
- Pode ter min/max configurados

#### **Array (Lista)**
- Lista de itens
- Cada item em um input separado
- Botões:
  - ➕ Adicionar Item
  - 🗑️ Remover Item

#### **Object/JSON (Chave-Valor)**
- Grid com 2 colunas
- Coluna esquerda: chave
- Coluna direita: valor
- Botões:
  - ➕ Adicionar Propriedade
  - 🗑️ Remover Propriedade

---

## 🔗 **2. SISTEMA DE LINKERS**

### **O que são Linkers?**
Linkers conectam um campo de um node ao output de um node pai, permitindo que dados fluam automaticamente entre nodes.

### **Como Usar:**

#### **Passo 1: Verificar Nodes Pais**
- Banner azul mostra quantos nodes pais disponíveis
- Lista os nomes dos nodes que você pode conectar

#### **Passo 2: Clicar no Botão de Link**
- Cada campo tem um botão 🔗 (azul)
- Click abre modal de seleção

#### **Passo 3: Selecionar Output**
- Modal mostra apenas outputs **compatíveis com o tipo**
- Exemplo: Campo `number` só mostra outputs `number`
- Click no output desejado para conectar

#### **Passo 4: Confirmar Conexão**
- Campo vira um **card verde**
- Mostra:
  - 📦 Nome do node pai
  - → Campo conectado
  - `{{nodeId.fieldKey}}` referência

#### **Passo 5: Desconectar (Opcional)**
- Click no botão vermelho 🔓 "Desconectar"
- Campo volta ao estado normal

### **Type-Safety:**

| Tipo de Campo | Aceita Outputs |
|--------------|----------------|
| `string` | Qualquer tipo (converte automaticamente) |
| `number` | Apenas `number` |
| `boolean` | Apenas `boolean` |
| `object` | `object` ou `json` |
| `array` | `array` |

---

## 💾 **3. PERSISTÊNCIA**

### **Como Funciona:**

#### **Ao Salvar:**
```typescript
// Configs salvos no formato:
{
  fieldName: "valor normal",
  linkedField: "{{nodeId.fieldKey}}", // ✅ Linker preservado
  arrayField: ["item1", "item2"],
  objectField: { key: "value" }
}
```

#### **Ao Reabrir:**
1. Sistema detecta padrão `{{nodeId.fieldKey}}`
2. Busca informações do node linkado
3. Reconstrói card verde
4. Tudo volta como estava!

### **Garantias:**
- ✅ Linkers preservados
- ✅ Valores normais preservados
- ✅ Arrays preservados
- ✅ Objects preservados
- ✅ Nenhum dado perdido

---

## 🔧 **4. INSTALAÇÃO DE MCPs**

### **O que são MCPs?**
Model Context Protocols são servidores que expõem ferramentas (tools) que podem ser usadas em automações.

### **Como Instalar:**

#### **Passo 1: Abrir Modal**
1. Ir para `/mcps`
2. Click em "Instalar MCP"

#### **Passo 2: Escolher Tipo**

**🐙 GitHub:**
- Para MCPs hospedados no GitHub
- Formato: `owner/repository`
- Exemplo: `modelcontextprotocol/servers`

**📦 NPX:**
- Para executar pacote NPM sem instalar
- Formato: nome do pacote
- Exemplo: `@modelcontextprotocol/server-github`

**📚 NPM:**
- Para instalar pacote NPM permanentemente
- Formato: nome do pacote
- Exemplo: `@modelcontextprotocol/server-github`

**💻 Local:**
- Para MCP já rodando localmente
- Formato: URL ou caminho
- Exemplo: `http://localhost:8080`

#### **Passo 3: Buscar Metadados**
1. Digitar servidor/pacote
2. Click em "🔍 Auto"
3. Nome, descrição e versão preenchidos automaticamente

#### **Passo 4: Instalar e Testar**
1. Click em "Instalar e Testar"
2. Acompanhar progresso:
   - 📦 Instalando...
   - 🔄 Sincronizando tools...
   - 🧪 Testando...
   - 📋 Registrando no Tool Registry...
3. Ver resultado:
   - ✅ Sucesso!
   - Lista de tools disponíveis

#### **Passo 5: Usar Tools**
1. Criar automação
2. Click em "Adicionar Ferramenta"
3. Filtrar por categoria "MCPs"
4. Tools do MCP aparecem automaticamente! 🎉

---

## 🧪 **5. EXEMPLOS PRÁTICOS**

### **Exemplo 1: Conectar Campos**

**Cenário:** Node A gera um `userId` (string), Node B precisa usar esse `userId`

1. **Configurar Node B:**
   - Abrir configurações
   - Ver campo `userId`
   - Click no botão 🔗

2. **No Modal de Linker:**
   - Ver "Node A" listado
   - Ver output "userId" (tipo: string)
   - Click para conectar

3. **Resultado:**
   - Campo vira card verde
   - Mostra: "📦 Node A → userId"
   - Valor: `{{nodeA.userId}}`

4. **Salvar e Testar:**
   - Salvar configuração
   - Executar automação
   - Node B recebe automaticamente o `userId` do Node A!

### **Exemplo 2: Instalar MCP do GitHub**

**Cenário:** Instalar MCP de servidores da Anthropic

1. **Abrir Modal:**
   - Ir para `/mcps`
   - Click "Instalar MCP"

2. **Configurar:**
   - Tipo: GitHub 🐙
   - Repositório: `modelcontextprotocol/servers`
   - Click "🔍 Auto"

3. **Resultado:**
   - Nome: "servers"
   - Descrição: automaticamente preenchida
   - Versão: "1.0.0"

4. **Instalar:**
   - Click "Instalar e Testar"
   - Ver progresso
   - Sucesso! Tools disponíveis

5. **Usar:**
   - Criar automação
   - Adicionar ferramenta
   - Tools do MCP aparecem na lista!

---

## ⚠️ **6. TROUBLESHOOTING**

### **Problema: Linker não aparece ao reabrir**

**Solução:**
1. Verificar que salvou corretamente
2. Abrir DevTools → Console
3. Ver logs: `✅ Linker detectado: ...`
4. Se não aparece, o formato pode estar errado

**Formato correto:** `{{nodeId.fieldKey}}`

### **Problema: Não vejo nodes pais no linker**

**Causas:**
1. Node não tem nodes anteriores conectados
2. Edges não estão configurados
3. Node está tentando linkar com ele mesmo (não permitido)

**Solução:**
1. Verificar que há nodes conectados ANTES deste node
2. Ver banner azul: deve mostrar quantidade de nodes pais
3. Se aparecer "0 Nodes Pais", conectar outros nodes primeiro

### **Problema: MCP não instala**

**Causas:**
1. Pacote não existe
2. URL incorreta
3. Backend não está rodando

**Solução:**
1. Verificar nome do pacote no npmjs.com
2. Verificar que URL do GitHub está correta
3. Ver logs de erro no modal
4. Verificar backend em http://localhost:3001

---

## 🎓 **7. BOAS PRÁTICAS**

### **Configuração de Nós:**
1. ✅ Use nomes descritivos nos campos
2. ✅ Preencha descrições para ajudar outros usuários
3. ✅ Use linkers sempre que possível (mais seguro)
4. ✅ Teste antes de salvar

### **Linkers:**
1. ✅ Sempre prefira linkers a valores fixos
2. ✅ Verifique tipo antes de conectar
3. ✅ Use campos compatíveis (string aceita tudo)
4. ✅ Documente fluxo de dados

### **MCPs:**
1. ✅ Teste MCPs em ambiente de dev primeiro
2. ✅ Verifique se tools aparecem no registry
3. ✅ Use versões estáveis em produção
4. ✅ Mantenha MCPs atualizados

---

## 📞 **8. SUPORTE**

### **Logs Úteis:**

**Console do Browser:**
```
🔗 Parent Nodes: [...]
✅ Linker detectado: fieldName -> nodeId.fieldKey
💾 Salvando config: {...}
📦 Instalando MCP: ...
✅ MCP instalado: id
```

### **DevTools:**
1. Abrir Chrome DevTools (F12)
2. Aba Console
3. Ver logs em tempo real
4. Emojis ajudam a identificar etapas

---

## ✨ **9. FEATURES AVANÇADAS**

### **Arrays Complexos:**
```json
[
  "item simples",
  "outro item",
  "{{nodeId.dynamicValue}}" // ✅ Pode linkar array inteiro
]
```

### **Objects Complexos:**
```json
{
  "staticKey": "valor fixo",
  "dynamicKey": "{{nodeId.value}}", // ✅ Pode linkar valores individuais
  "nestedObject": { ... }
}
```

### **Conversões Automáticas:**
- `number` → `string`: "123"
- `boolean` → `string`: "true"/"false"
- `object` → `string`: JSON.stringify()

---

## 🚀 **10. CONCLUSÃO**

**Sistema completo e funcional!**

- ✅ Modal visual e intuitivo
- ✅ Linkers type-safe
- ✅ Persistência garantida
- ✅ MCPs instaláveis
- ✅ Tools no registry
- ✅ Para não-técnicos

**Divirta-se automatizando! 🎊**
