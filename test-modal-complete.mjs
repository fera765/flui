/**
 * Teste Completo do Modal - Validação de Todas as Funcionalidades
 */

import { chromium } from 'playwright';

async function testCompleteModal() {
  console.log('🚀 TESTE COMPLETO DO MODAL DE CONFIGURAÇÃO\n');
  console.log('=' .repeat(60));

  const browser = await chromium.launch({ headless: true, slowMo: 100 });
  const context = await browser.newContext();
  const page = await context.newPage();

  const results = [];

  try {
    // 1. Navegar
    console.log('\n📍 ETAPA 1: Navegação');
    await page.goto('http://localhost:8080/automations/create', {
      waitUntil: 'networkidle',
      timeout: 30000,
    });
    await page.waitForTimeout(2000);
    results.push({ step: 'Navegação', status: '✅' });

    // 2. Adicionar node
    console.log('\n📦 ETAPA 2: Adicionar Node');
    const paletteBtn = page.locator('button').filter({ hasText: /Tools|Adicionar|\+/ }).first();
    await paletteBtn.click();
    await page.waitForTimeout(1000);
    
    const firstTool = page.locator('button').filter({ hasText: /Trigger|Manual/ }).first();
    await firstTool.click();
    await page.waitForTimeout(1500);
    
    const nodeCount = await page.locator('.react-flow__node').count();
    console.log('   Nodes adicionados:', nodeCount);
    results.push({ step: 'Adicionar Node', status: nodeCount > 0 ? '✅' : '❌' });

    // 3. Abrir Modal
    console.log('\n🎨 ETAPA 3: Abrir Modal');
    const configBtn = page.locator('button[title="Configurar nó"]').first();
    await configBtn.click();
    await page.waitForTimeout(2000);
    
    const modalVisible = await page.locator('h2:has-text("Configurar Nó")').isVisible();
    console.log('   Modal visível:', modalVisible ? '✅' : '❌');
    results.push({ step: 'Abrir Modal', status: modalVisible ? '✅' : '❌' });

    if (!modalVisible) {
      throw new Error('Modal não abriu!');
    }

    // 4. Verificar Campos
    console.log('\n📝 ETAPA 4: Verificar Campos');
    
    // Verificar título da tool
    const toolName = await page.locator('h2:has-text("Configurar Nó")').textContent();
    console.log('   Tool:', toolName);
    
    // Verificar campos do Manual Trigger
    const fields = {
      triggerMessage: await page.locator('label:has-text("triggerMessage")').count() > 0,
      initialData: await page.locator('label:has-text("initialData")').count() > 0,
      debugMode: await page.locator('label:has-text("debugMode")').count() > 0,
    };
    
    console.log('   Campos encontrados:');
    console.log('     - triggerMessage:', fields.triggerMessage ? '✅' : '❌');
    console.log('     - initialData:', fields.initialData ? '✅' : '❌');
    console.log('     - debugMode:', fields.debugMode ? '✅' : '❌');
    
    const allFieldsFound = Object.values(fields).every(v => v);
    results.push({ step: 'Verificar Campos', status: allFieldsFound ? '✅' : '❌' });

    // 5. Testar Toggle (debugMode)
    console.log('\n🔘 ETAPA 5: Testar Toggle');
    const toggle = page.locator('input[type="checkbox"]').first();
    const toggleExists = await toggle.count() > 0;
    
    if (toggleExists) {
      const wasCheked = await toggle.isChecked();
      await toggle.click();
      await page.waitForTimeout(300);
      const nowChecked = await toggle.isChecked();
      const toggled = wasCheked !== nowChecked;
      console.log('   Toggle funcionou:', toggled ? '✅' : '❌');
      results.push({ step: 'Testar Toggle', status: toggled ? '✅' : '❌' });
    } else {
      console.log('   Toggle não encontrado');
      results.push({ step: 'Testar Toggle', status: '⚠️' });
    }

    // 6. Testar Input de Texto
    console.log('\n✏️ ETAPA 6: Testar Input de Texto');
    const textInput = page.locator('input[type="text"]').first();
    const inputExists = await textInput.count() > 0;
    
    if (inputExists) {
      await textInput.fill('Teste de mensagem');
      await page.waitForTimeout(300);
      const value = await textInput.inputValue();
      const filled = value === 'Teste de mensagem';
      console.log('   Input preenchido:', filled ? '✅' : '❌');
      results.push({ step: 'Testar Input', status: filled ? '✅' : '❌' });
    } else {
      console.log('   Input não encontrado');
      results.push({ step: 'Testar Input', status: '⚠️' });
    }

    // 7. Verificar Botões de Linker
    console.log('\n🔗 ETAPA 7: Verificar Botões de Linker');
    const linkerButtons = page.locator('button[title="Linkar campo"]');
    const linkerCount = await linkerButtons.count();
    console.log('   Botões de linker:', linkerCount);
    results.push({ step: 'Botões de Linker', status: linkerCount > 0 ? '✅' : '❌' });

    // 8. Testar Botões do Modal
    console.log('\n🔘 ETAPA 8: Testar Botões do Modal');
    const saveBtn = await page.locator('button:has-text("Salvar")').count() > 0;
    const cancelBtn = await page.locator('button:has-text("Cancelar")').count() > 0;
    const closeBtn = await page.locator('button').filter({ has: page.locator('svg') }).first().count() > 0;
    
    console.log('   Botão Salvar:', saveBtn ? '✅' : '❌');
    console.log('   Botão Cancelar:', cancelBtn ? '✅' : '❌');
    console.log('   Botão Fechar (X):', closeBtn ? '✅' : '❌');
    
    const allButtonsExist = saveBtn && cancelBtn && closeBtn;
    results.push({ step: 'Botões do Modal', status: allButtonsExist ? '✅' : '❌' });

    // 9. Testar Fechar Modal
    console.log('\n❌ ETAPA 9: Testar Fechar Modal');
    await page.locator('button:has-text("Cancelar")').click();
    await page.waitForTimeout(1000);
    
    const modalClosed = !(await page.locator('h2:has-text("Configurar Nó")').isVisible().catch(() => false));
    console.log('   Modal fechou:', modalClosed ? '✅' : '❌');
    results.push({ step: 'Fechar Modal', status: modalClosed ? '✅' : '❌' });

    // 10. Reabrir Modal
    console.log('\n🔁 ETAPA 10: Reabrir Modal');
    await page.locator('button[title="Configurar nó"]').first().click();
    await page.waitForTimeout(2000);
    
    const modalReopened = await page.locator('h2:has-text("Configurar Nó")').isVisible();
    console.log('   Modal reabriu:', modalReopened ? '✅' : '❌');
    results.push({ step: 'Reabrir Modal', status: modalReopened ? '✅' : '❌' });

    // Screenshot final
    await page.screenshot({ path: '/workspace/modal-test-complete.png', fullPage: true });
    console.log('\n📸 Screenshot: /workspace/modal-test-complete.png');

  } catch (error) {
    console.error('\n❌ Erro:', error.message);
    await page.screenshot({ path: '/workspace/modal-test-error.png', fullPage: true });
    results.push({ step: 'Erro Fatal', status: '❌', error: error.message });
  } finally {
    await browser.close();
  }

  // Relatório Final
  console.log('\n' + '=' .repeat(60));
  console.log('📊 RELATÓRIO FINAL\n');
  
  results.forEach((result, i) => {
    console.log(`${i + 1}. ${result.step}: ${result.status}`);
    if (result.error) {
      console.log(`   Erro: ${result.error}`);
    }
  });
  
  const successCount = results.filter(r => r.status === '✅').length;
  const failCount = results.filter(r => r.status === '❌').length;
  const warnCount = results.filter(r => r.status === '⚠️').length;
  
  console.log('\n📈 ESTATÍSTICAS:');
  console.log(`   ✅ Sucesso: ${successCount}/${results.length}`);
  console.log(`   ❌ Falhas: ${failCount}/${results.length}`);
  console.log(`   ⚠️  Avisos: ${warnCount}/${results.length}`);
  
  const successRate = (successCount / results.length * 100).toFixed(1);
  console.log(`\n   Taxa de sucesso: ${successRate}%`);
  
  if (failCount === 0) {
    console.log('\n🎉🎉🎉 TODOS OS TESTES PASSARAM! 🎉🎉🎉');
  } else {
    console.log('\n⚠️  Alguns testes falharam. Verifique os detalhes acima.');
  }
  
  console.log('\n' + '=' .repeat(60));
}

testCompleteModal().catch(console.error);
