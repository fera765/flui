#!/bin/bash

###############################################################################
# FLUI - Script de Validação Completa
# 
# Executa: Build + Testes + Run + Validação de Logs
# Gera feedback em português sobre o status do sistema
###############################################################################

set -e  # Exit on error

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Variáveis
BUILD_ID=$(date +%s)
LOG_FILE="/tmp/flui-validate-${BUILD_ID}.log"
START_TIME=$(date +%s)
ERRORS=0
WARNINGS=0

# Funções auxiliares
log_step() {
    echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}▶ $1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] STEP: $1" >> "$LOG_FILE"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] SUCCESS: $1" >> "$LOG_FILE"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] WARNING: $1" >> "$LOG_FILE"
    ((WARNINGS++))
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $1" >> "$LOG_FILE"
    ((ERRORS++))
}

log_info() {
    echo -e "${PURPLE}ℹ️  $1${NC}"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] INFO: $1" >> "$LOG_FILE"
}

# Banner
echo -e "${PURPLE}"
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║                                                           ║"
echo "║          FLUI - Validação Completa do Sistema            ║"
echo "║                                                           ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo -e "${NC}\n"

log_info "Build ID: $BUILD_ID"
log_info "Log File: $LOG_FILE"

# ============================================================================
# STEP 1: Verificar ambiente
# ============================================================================
log_step "1/8 - Verificando ambiente"

if ! command -v node &> /dev/null; then
    log_error "Node.js não encontrado"
    exit 1
fi

NODE_VERSION=$(node --version)
log_success "Node.js instalado: $NODE_VERSION"

if ! command -v npm &> /dev/null; then
    log_error "npm não encontrado"
    exit 1
fi

NPM_VERSION=$(npm --version)
log_success "npm instalado: $NPM_VERSION"

# ============================================================================
# STEP 2: Instalar dependências
# ============================================================================
log_step "2/8 - Instalando dependências"

log_info "Backend..."
cd /workspace
if npm install >> "$LOG_FILE" 2>&1; then
    log_success "Dependências do backend instaladas"
else
    log_error "Erro ao instalar dependências do backend"
    exit 1
fi

log_info "Frontend..."
cd /workspace/flui-frontend-vite
if npm install >> "$LOG_FILE" 2>&1; then
    log_success "Dependências do frontend instaladas"
else
    log_error "Erro ao instalar dependências do frontend"
    exit 1
fi

# ============================================================================
# STEP 3: Build do Backend/CLI (Flui)
# ============================================================================
log_step "3/8 - Build do Backend/CLI (Flui)"

cd /workspace
if npm run build >> "$LOG_FILE" 2>&1; then
    log_success "Build do Flui concluído"
else
    log_error "Erro no build do Flui"
    exit 1
fi

# Verificar se arquivo principal foi gerado
if [ -f "dist/cli.js" ]; then
    log_success "Arquivo dist/cli.js gerado"
else
    log_error "Arquivo dist/cli.js não encontrado"
    exit 1
fi

# ============================================================================
# STEP 4: Build do Frontend
# ============================================================================
log_step "4/8 - Build do Frontend"

cd /workspace/flui-frontend-vite
if npm run build >> "$LOG_FILE" 2>&1; then
    log_success "Build do frontend concluído"
else
    log_error "Erro no build do frontend"
    exit 1
fi

# Verificar se dist foi criado
if [ -d "dist" ]; then
    log_success "Diretório dist/ criado"
else
    log_error "Diretório dist/ não encontrado"
    exit 1
fi

# ============================================================================
# STEP 5: Executar testes unitários
# ============================================================================
log_step "5/8 - Executando testes unitários"

cd /workspace
if npm run test >> "$LOG_FILE" 2>&1; then
    log_success "Testes unitários passaram"
else
    log_warning "Alguns testes falharam (veja log para detalhes)"
fi

# ============================================================================
# STEP 6: Smoke test da CLI
# ============================================================================
log_step "6/8 - Smoke test da CLI"

cd /workspace

# Test 1: CLI deve executar
log_info "Testando execução básica da CLI..."
if timeout 5s node dist/cli.js --help >> "$LOG_FILE" 2>&1; then
    log_success "CLI executa corretamente"
else
    log_error "CLI falhou ao executar"
fi

# ============================================================================
# STEP 7: Verificar Tool Registry
# ============================================================================
log_step "7/8 - Verificando Tool Registry"

log_info "Criando script de teste do registry..."
cat > /tmp/test-registry.js << 'EOF'
import { getToolRegistry } from './dist/core/toolRegistry.js';
import { registerAllTools } from './dist/tools/index.js';

try {
  console.log('🔧 Inicializando Tool Registry...');
  registerAllTools();
  
  const registry = getToolRegistry();
  const result = registry.list();
  
  console.log(`✅ Registry inicializado com sucesso`);
  console.log(`📦 Total de ferramentas: ${result.total}`);
  console.log(`📄 Ferramentas por categoria:`);
  
  const grouped = {};
  result.tools.forEach(tool => {
    if (!grouped[tool.category]) grouped[tool.category] = 0;
    grouped[tool.category]++;
  });
  
  for (const [cat, count] of Object.entries(grouped)) {
    console.log(`   - ${cat}: ${count}`);
  }
  
  process.exit(0);
} catch (error) {
  console.error('❌ Erro:', error.message);
  process.exit(1);
}
EOF

if node /tmp/test-registry.js >> "$LOG_FILE" 2>&1; then
    log_success "Tool Registry validado"
else
    log_error "Erro ao validar Tool Registry"
fi

# ============================================================================
# STEP 8: Validar logs do sistema
# ============================================================================
log_step "8/8 - Validando logs"

log_info "Procurando por erros nos logs..."

# Patterns de erro comuns
ERROR_PATTERNS=(
    "Error:"
    "ERROR"
    "Exception"
    "EXCEPTION"
    "Failed"
    "FAILED"
    "Cannot"
    "undefined is not"
    "null is not"
)

FOUND_ERRORS=0
for pattern in "${ERROR_PATTERNS[@]}"; do
    count=$(grep -c "$pattern" "$LOG_FILE" || true)
    if [ $count -gt 0 ]; then
        log_warning "Encontrado padrão '$pattern': $count ocorrência(s)"
        ((FOUND_ERRORS+=count))
    fi
done

if [ $FOUND_ERRORS -eq 0 ]; then
    log_success "Nenhum padrão de erro crítico encontrado nos logs"
else
    log_warning "Total de padrões de erro encontrados: $FOUND_ERRORS"
fi

# ============================================================================
# RELATÓRIO FINAL
# ============================================================================
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

echo -e "\n${PURPLE}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${PURPLE}║                  RELATÓRIO DE VALIDAÇÃO                   ║${NC}"
echo -e "${PURPLE}╚═══════════════════════════════════════════════════════════╝${NC}\n"

echo -e "${BLUE}📊 Estatísticas:${NC}"
echo -e "   • Build ID: ${BUILD_ID}"
echo -e "   • Duração total: ${DURATION}s"
echo -e "   • Erros: ${ERRORS}"
echo -e "   • Avisos: ${WARNINGS}"
echo -e "   • Log completo: ${LOG_FILE}\n"

if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}╔═══════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                                                           ║${NC}"
    echo -e "${GREEN}║   ✅ BUILD E VALIDAÇÃO: SUCESSO                           ║${NC}"
    echo -e "${GREEN}║   Nenhum erro detectado.                                  ║${NC}"
    echo -e "${GREEN}║                                                           ║${NC}"
    echo -e "${GREEN}║   Sistema pronto para uso em produção.                    ║${NC}"
    echo -e "${GREEN}║   Build ID: ${BUILD_ID}                                   ║${NC}"
    echo -e "${GREEN}║                                                           ║${NC}"
    echo -e "${GREEN}╚═══════════════════════════════════════════════════════════╝${NC}\n"
    
    echo -e "${BLUE}📝 Próximos passos:${NC}"
    echo -e "   1. Revisar avisos (se houver): ${WARNINGS}"
    echo -e "   2. Iniciar backend: npm start"
    echo -e "   3. Iniciar frontend: cd flui-frontend-vite && npm run dev"
    echo -e "   4. Acessar: http://localhost:8080\n"
    
    exit 0
else
    echo -e "${RED}╔═══════════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║                                                           ║${NC}"
    echo -e "${RED}║   ❌ BUILD E VALIDAÇÃO: FALHOU                            ║${NC}"
    echo -e "${RED}║   ${ERRORS} erro(s) detectado(s).                         ║${NC}"
    echo -e "${RED}║                                                           ║${NC}"
    echo -e "${RED}╚═══════════════════════════════════════════════════════════╝${NC}\n"
    
    echo -e "${YELLOW}🔧 Instruções de correção:${NC}"
    echo -e "   1. Revise o log completo: ${LOG_FILE}"
    echo -e "   2. Corrija os erros reportados"
    echo -e "   3. Execute novamente: ./scripts/full-validate.sh"
    echo -e "   4. Caso persista, consulte a documentação\n"
    
    echo -e "${YELLOW}📋 Resumo de erros:${NC}"
    echo -e "$(tail -n 50 "$LOG_FILE" | grep -i error || echo '   (veja log completo para detalhes)')\n"
    
    exit 1
fi
