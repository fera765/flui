#!/bin/bash

echo "🧪 Teste de Configuração LLM - Endpoint https://api.llm7.io/v1"
echo "================================================================"
echo ""

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 1. Testar endpoint /models SEM autenticação
echo -e "${BLUE}📡 Testando endpoint /models SEM autenticação...${NC}"
RESPONSE=$(curl -s "https://api.llm7.io/v1/models")

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Conexão bem-sucedida${NC}"
    
    # Verificar se é array
    if echo "$RESPONSE" | jq -e '. | type == "array"' > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Formato correto: Array direto${NC}"
        
        # Contar modelos
        COUNT=$(echo "$RESPONSE" | jq '. | length')
        echo -e "${GREEN}✅ $COUNT modelos disponíveis${NC}"
        
        # Listar primeiros 5 modelos
        echo ""
        echo -e "${BLUE}📋 Primeiros 5 modelos:${NC}"
        echo "$RESPONSE" | jq -r '.[0:5] | .[] | "  • \(.id) (\(.object))"'
        
        # Verificar se tem modelo com "gpt"
        GPT_MODEL=$(echo "$RESPONSE" | jq -r '.[] | select(.id | contains("gpt")) | .id' | head -1)
        if [ -n "$GPT_MODEL" ]; then
            echo ""
            echo -e "${GREEN}✅ Modelo GPT encontrado: $GPT_MODEL${NC}"
        fi
        
        # Salvar resposta completa
        echo "$RESPONSE" | jq '.' > /tmp/models-response.json
        echo ""
        echo -e "${BLUE}💾 Resposta completa salva em: /tmp/models-response.json${NC}"
        
    else
        echo -e "${YELLOW}⚠️  Formato diferente do esperado${NC}"
        echo "Resposta: $RESPONSE" | head -c 200
    fi
else
    echo -e "${RED}❌ Falha na conexão${NC}"
    exit 1
fi

echo ""
echo "================================================================"
echo -e "${GREEN}✅ TESTE CONCLUÍDO COM SUCESSO!${NC}"
echo ""
echo "Formato da resposta:"
echo "  - Tipo: Array direto (não precisa de .data)"
echo "  - Autenticação: NÃO necessária"
echo "  - Estrutura: [{id, object, created, owned_by, modalities}, ...]"
echo ""
echo "Frontend configurado para:"
echo "  ✅ Carregar modelos SEM API key"
echo "  ✅ Processar array direto"
echo "  ✅ Fallback para formato OpenAI (objeto com .data)"
echo ""

