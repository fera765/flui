# 📝 CHANGELOG - FLUI v2.0

## [2.0.0] - 2025-10-22

### 🎉 Grandes Mudanças

#### ✨ Nova Feature: Edição Sem Salvar
- **Adicionado**: Capacidade de configurar nodes sem salvar a automação
- **Adicionado**: Sistema de persistência local para automações temporárias
- **Adicionado**: Detecção automática de automações temp- vs salvas
- **Impacto**: Workflow muito mais fluído e rápido

#### ✨ Nova Feature: Configuração LLM
- **Adicionado**: Modal de configuração LLM com UI elegante
- **Adicionado**: Carregamento dinâmico de modelos via API
- **Adicionado**: Teste de conexão antes de salvar
- **Adicionado**: Persistência de configuração em localStorage
- **Endpoint**: https://api.llm7.io/v1
- **Models API**: https://api.llm7.io/v1/models

#### ✨ Nova Feature: Modelos Dinâmicos
- **Removido**: Lista hardcoded de modelos
- **Adicionado**: Carregamento de modelos via API GET /v1/models
- **Adicionado**: Seleção automática de modelo padrão
- **Adicionado**: Badge visual com contador de modelos

#### 🔒 Nova Feature: Bloqueio de Execução
- **Adicionado**: Execução bloqueada para automações não salvas
- **Adicionado**: Badge visual "Não Salvo" animado
- **Adicionado**: Tooltip explicativo no botão desabilitado
- **Impacto**: Maior segurança e clareza

### 🐛 Correções de Bugs

#### Bug: "Node não encontrado" ao Editar Agentes
- **Corrigido**: Tipos de node agora são preservados corretamente
- **Corrigido**: React Flow registra tipos agent e system
- **Corrigido**: Detecção múltipla de agentes (category, toolId, type)
- **Corrigido**: IDs de agentes respeitados da API
- **Arquivos**: NodeConfigurationModalV2.tsx, EditAutomation.tsx, CreateAutomationV2.tsx, store.ts

#### Bug: Condition Tool Não Editava
- **Corrigido**: Tipo 'system' agora reconhecido
- **Corrigido**: React Flow registra tipo system
- **Arquivos**: CreateAutomationV2.tsx, EditAutomation.tsx

#### Bug: IDs Inconsistentes
- **Corrigido**: Store agora respeita IDs fornecidos pela API
- **Arquivo**: store.ts

### 🔧 Melhorias Técnicas

#### NodeConfigurationModalV2
- **Modificado**: Assinatura de onSave aceita parâmetros opcionais
- **Modificado**: handleSave diferencia temp vs salvas
- **Adicionado**: Logs detalhados para debug

#### CreateAutomationV2
- **Modificado**: handleSaveNodeConfig com parâmetros opcionais
- **Adicionado**: Badge de status "Não Salvo"
- **Modificado**: Botão executar com disabled condicional
- **Modificado**: Preserva tipo real do node (não hardcoded)
- **Adicionado**: Tipos agent e system nos nodeTypes

#### EditAutomation
- **Modificado**: handleSaveNodeConfig com parâmetros opcionais
- **Modificado**: Preserva tipo do node ao carregar
- **Adicionado**: Tipos agent e system nos nodeTypes
- **Modificado**: Preserva tipo ao salvar

#### AgentsPage
- **Adicionado**: Import e integração do LLMConfigModal
- **Adicionado**: Estado llmConfig com localStorage
- **Adicionado**: Estado availableModels
- **Adicionado**: Função loadModels()
- **Adicionado**: Função handleSaveLLMConfig()
- **Adicionado**: Botão "Configurar LLM" no header
- **Modificado**: Select de modelos dinâmico
- **Adicionado**: Badge verde com contador
- **Adicionado**: Alerta se API key não configurada

### 📦 Novos Componentes

#### LLMConfigModal.tsx (NOVO)
- 345 linhas de código
- Modal completo de configuração
- Carregamento de modelos
- Teste de conexão
- Validação de campos
- UI moderna com gradientes

### 🧪 Testes

#### Scripts de Teste
- **Adicionado**: test-complete-flow.sh - Teste backend completo
- **Adicionado**: test-node-structure.sh - Validação estrutura
- **Adicionado**: START_SERVICES.sh - Iniciar serviços
- **Adicionado**: Testes E2E Playwright (3 arquivos)

#### Documentação
- **Adicionado**: COMPLETE_FIXES_REPORT.md
- **Adicionado**: FINAL_FIX_REPORT.md
- **Adicionado**: QUICK_START_GUIDE.md
- **Adicionado**: TEST_ALL_FEATURES.md
- **Adicionado**: RESUMO_FINAL_PT.md
- **Adicionado**: CHANGELOG.md (este arquivo)

---

## 🔄 Breaking Changes

### Nenhum!
- Todas as mudanças são retrocompatíveis
- Automações existentes continuam funcionando
- Apenas melhorias adicionadas

---

## 📊 Estatísticas

### Código
```
+345 linhas (LLMConfigModal)
+~200 linhas (modificações)
-~50 linhas (hardcoded models removidos)
= +~500 linhas NET
```

### Arquivos
```
1 criado
4 modificados
8 documentos criados
4 scripts de teste criados
```

### Build
```
Before: ~576 kB
After:  ~588 kB (+12 kB)
Increase: 2% (aceitável para novas features)
```

---

## 🎯 Roadmap Futuro

### Possíveis Melhorias
- [ ] Cache de modelos no localStorage
- [ ] Suporte a múltiplos endpoints LLM
- [ ] Perfis de configuração (dev, prod)
- [ ] Export/Import de configurações
- [ ] Logs de chamadas de API
- [ ] Métricas de uso de modelos

---

## 👥 Créditos

**Desenvolvido por**: Cursor AI Agent  
**Data**: 2025-10-22  
**Versão**: 2.0.0  
**Build**: ✅ Sucesso  

---

## 📞 Suporte

**Issues**: Reportar via feedback
**Docs**: Ver arquivos .md em /workspace/
**Logs**: /tmp/backend.log e /tmp/frontend.log

---

**Enjoy! 🎉**
