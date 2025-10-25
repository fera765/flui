/**
 * Teste: Atualização de Configuração LLM
 * 
 * Valida se todas as configurações são salvas e carregadas corretamente
 */

import { getConfig, setConfig } from './source/store/storage.js';

async function testConfigUpdate() {
  console.log('🧪 ========================================');
  console.log('🧪 TESTE: Atualização de Config LLM');
  console.log('🧪 ========================================\n');

  try {
    // 1. Ler config atual
    console.log('📖 [1/4] Lendo config atual...\n');
    const currentConfig = getConfig();
    console.log('Config atual:', JSON.stringify(currentConfig, null, 2));
    console.log();

    // 2. Atualizar config
    console.log('💾 [2/4] Atualizando config...\n');
    const newConfig = {
      llm: {
        endpoint: 'https://openrouter.ai/api/v1',
        apiKey: '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',
        model: 'qwen/qwen3-coder:free',
        temperature: 0.8,
        maxTokens: 4000,
      },
      theme: 'default' as const,
      locale: 'pt-BR',
    };

    console.log('Nova config:', JSON.stringify(newConfig, null, 2));
    setConfig(newConfig);
    console.log('✅ Config atualizada\n');

    // 3. Ler novamente para validar
    console.log('🔍 [3/4] Validando config salva...\n');
    const updatedConfig = getConfig();
    console.log('Config salva:', JSON.stringify(updatedConfig, null, 2));
    console.log();

    // 4. Verificar cada campo
    console.log('✅ [4/4] Validando campos:\n');
    const checks = [
      { name: 'endpoint', expected: newConfig.llm.endpoint, actual: updatedConfig?.llm?.endpoint },
      { name: 'apiKey', expected: newConfig.llm.apiKey, actual: updatedConfig?.llm?.apiKey },
      { name: 'model', expected: newConfig.llm.model, actual: updatedConfig?.llm?.model },
      { name: 'temperature', expected: newConfig.llm.temperature, actual: updatedConfig?.llm?.temperature },
      { name: 'maxTokens', expected: newConfig.llm.maxTokens, actual: updatedConfig?.llm?.maxTokens },
    ];

    let allPassed = true;

    checks.forEach(check => {
      const passed = check.expected === check.actual;
      const icon = passed ? '✅' : '❌';
      console.log(`${icon} ${check.name}:`);
      console.log(`   Esperado: ${check.expected}`);
      console.log(`   Atual:    ${check.actual}`);
      if (!passed) allPassed = false;
    });

    console.log();
    console.log('🧪 ========================================');
    if (allPassed) {
      console.log('✅ TODOS OS CAMPOS SALVOS CORRETAMENTE!');
    } else {
      console.log('❌ ALGUNS CAMPOS NÃO FORAM SALVOS!');
    }
    console.log('🧪 ========================================\n');

    return allPassed;

  } catch (error: any) {
    console.error('❌ Erro no teste:', error);
    return false;
  }
}

testConfigUpdate()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  });
