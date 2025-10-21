/**
 * FLUI - Pollinations AI MCP Test Script
 * 
 * Script de teste manual para validar a integração completa do MCP da Pollinations AI
 * 
 * Uso:
 *   npm run test:pollinations
 *   ou
 *   tsx scripts/test-pollinations-mcp.ts
 */

import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';

interface TestResult {
  step: string;
  success: boolean;
  message: string;
  data?: any;
}

const results: TestResult[] = [];

function logStep(step: string, success: boolean, message: string, data?: any) {
  const emoji = success ? '✅' : '❌';
  console.log(`${emoji} ${step}: ${message}`);
  if (data) {
    console.log('   Dados:', JSON.stringify(data, null, 2).substring(0, 200));
  }
  results.push({ step, success, message, data });
}

async function testPollinationsMCP() {
  console.log('\n🚀 Iniciando teste do Pollinations AI MCP\n');
  console.log('=' .repeat(60));

  let mcpId: string | null = null;

  try {
    // ETAPA 1: Verificar se API está rodando
    console.log('\n📡 ETAPA 1: Verificando API Server...');
    try {
      const healthCheck = await axios.get(`${API_BASE_URL}/tools`);
      logStep(
        'API Server',
        true,
        `API online com ${healthCheck.data.length || 0} tools`
      );
    } catch (error) {
      logStep('API Server', false, 'API não está respondendo');
      console.error('\n❌ ERRO: API Server não está rodando!');
      console.log('💡 Execute: npm run start:api\n');
      return;
    }

    // ETAPA 2: Criar MCP no backend
    console.log('\n📦 ETAPA 2: Criando MCP da Pollinations AI...');
    try {
      const createResponse = await axios.post(`${API_BASE_URL}/mcps`, {
        id: `pollinations-mcp-${Date.now()}`,
        name: 'Pollinations AI',
        description: 'MCP para geração de imagens e texto com IA',
        version: '1.0.0',
        server: '@pollinations/model-context-protocol',
        installType: 'npx',
        enabled: true,
        tools: [],
        metadata: {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      });

      mcpId = createResponse.data.id;
      logStep('Criar MCP', true, `MCP criado com ID: ${mcpId}`);
    } catch (error: any) {
      logStep(
        'Criar MCP',
        false,
        error.response?.data?.error || error.message
      );
      throw error;
    }

    // ETAPA 3: Sincronizar MCP (executar e extrair tools)
    console.log('\n🔄 ETAPA 3: Sincronizando MCP (executando via NPX)...');
    console.log('⏳ Isso pode demorar alguns minutos na primeira vez...');
    try {
      const syncResponse = await axios.post(
        `${API_BASE_URL}/mcps/${mcpId}/sync`,
        {},
        { timeout: 120000 } // 2 minutos de timeout
      );

      const toolsFound = syncResponse.data.toolsFound || 0;
      const tools = syncResponse.data.tools || [];

      logStep(
        'Sincronizar MCP',
        true,
        `${toolsFound} tools encontradas`,
        { tools: tools.map((t: any) => t.name) }
      );

      if (toolsFound === 0) {
        console.log('⚠️  Nenhuma tool encontrada. O MCP pode não estar expondo tools corretamente.');
      }
    } catch (error: any) {
      logStep(
        'Sincronizar MCP',
        false,
        error.response?.data?.error || error.message
      );
      console.error('Detalhes do erro:', error.response?.data);
    }

    // ETAPA 4: Testar MCP
    console.log('\n🧪 ETAPA 4: Testando MCP...');
    try {
      const testResponse = await axios.post(
        `${API_BASE_URL}/mcps/${mcpId}/test`,
        {},
        { timeout: 30000 }
      );

      logStep(
        'Testar MCP',
        testResponse.data.success,
        testResponse.data.message,
        { toolsFound: testResponse.data.toolsFound }
      );
    } catch (error: any) {
      logStep(
        'Testar MCP',
        false,
        error.response?.data?.error || error.message
      );
    }

    // ETAPA 5: Verificar MCP no store
    console.log('\n📋 ETAPA 5: Verificando MCP registrado...');
    try {
      const mcpResponse = await axios.get(`${API_BASE_URL}/mcps/${mcpId}`);
      const mcp = mcpResponse.data;

      logStep(
        'Verificar MCP',
        true,
        `MCP encontrado: ${mcp.name}`,
        {
          version: mcp.version,
          enabled: mcp.enabled,
          toolsCount: mcp.tools?.length || 0,
        }
      );
    } catch (error: any) {
      logStep(
        'Verificar MCP',
        false,
        error.response?.data?.error || error.message
      );
    }

    // ETAPA 6: Verificar tools no Tool Registry
    console.log('\n🔧 ETAPA 6: Verificando tools no Tool Registry...');
    try {
      const toolsResponse = await axios.get(`${API_BASE_URL}/tools`);
      const allTools = toolsResponse.data;
      const mcpTools = allTools.filter(
        (t: any) => t.category === 'mcp' && t.name.includes('Pollinations')
      );

      logStep(
        'Verificar Tools',
        mcpTools.length > 0,
        `${mcpTools.length} tools da Pollinations no registry`,
        { tools: mcpTools.map((t: any) => ({ id: t.id, name: t.name })) }
      );

      if (mcpTools.length === 0) {
        console.log('⚠️  As tools do MCP não foram registradas no Tool Registry.');
        console.log('💡 Tente reiniciar o servidor da API.');
      }
    } catch (error: any) {
      logStep(
        'Verificar Tools',
        false,
        error.response?.data?.error || error.message
      );
    }

    // ETAPA 7: Listar todos os MCPs
    console.log('\n📚 ETAPA 7: Listando todos os MCPs...');
    try {
      const mcpsResponse = await axios.get(`${API_BASE_URL}/mcps`);
      const mcps = mcpsResponse.data;

      logStep(
        'Listar MCPs',
        true,
        `${mcps.length} MCP(s) registrado(s)`,
        { mcps: mcps.map((m: any) => ({ id: m.id, name: m.name })) }
      );
    } catch (error: any) {
      logStep(
        'Listar MCPs',
        false,
        error.response?.data?.error || error.message
      );
    }

  } catch (error: any) {
    console.error('\n❌ Erro fatal durante o teste:', error.message);
  } finally {
    // RESUMO
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMO DO TESTE\n');

    const successful = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    console.log(`✅ Sucesso: ${successful}/${results.length}`);
    console.log(`❌ Falhas:  ${failed}/${results.length}`);

    if (failed > 0) {
      console.log('\n⚠️  Falhas detectadas:');
      results
        .filter((r) => !r.success)
        .forEach((r) => {
          console.log(`   • ${r.step}: ${r.message}`);
        });
    }

    if (successful === results.length) {
      console.log('\n🎉 TESTE COMPLETO COM SUCESSO!');
      console.log('✅ O MCP da Pollinations AI está funcionando corretamente.');
    } else {
      console.log('\n⚠️  Teste concluído com algumas falhas.');
      console.log('📝 Revise os logs acima para mais detalhes.');
    }

    // Instruções para limpeza
    if (mcpId) {
      console.log('\n🧹 Para remover o MCP de teste:');
      console.log(`   curl -X DELETE ${API_BASE_URL}/mcps/${mcpId}`);
    }

    console.log('\n' + '='.repeat(60));
  }
}

// Executar teste
testPollinationsMCP().catch((error) => {
  console.error('\n❌ Erro fatal:', error);
  process.exit(1);
});
