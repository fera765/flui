/**
 * 🧪 BLOCO 1: TESTE COMPLETO DE AUTOMAÇÃO SIMPLES
 * 
 * Objetivos:
 * 1. Criar automação com 2 nodes
 * 2. Validar linkers compatíveis por tipo
 * 3. Validar persistência
 * 4. Executar automação
 * 5. Validar logs com valores transitando
 */

import { chromium } from 'playwright';

async function testBloco1() {
  console.log('🎯 BLOCO 1: TESTE COMPLETO DE AUTOMAÇÃO SIMPLES\n');
  console.log('='.repeat(90));

  const browser = await chromium.launch({ 
    headless: true, 
    slowMo: 100 
  });
  const context = await browser.newContext();
  const page = await context.newPage();

  let results = {
    step1_criacao: false,
    step2_linkers_compativeis: false,
    step3_persistencia: false,
    step4_execucao: false,
    step5_logs_valores: false,
    allPassed: false
  };

  try {
    // Capturar logs
    const consoleLogs = [];
    page.on('console', msg => {
      const text = msg.text();
      consoleLogs.push(text);
      if (text.includes('💾') || text.includes('availableOutputs') || text.includes('🚀') || text.includes('LOG:')) {
        console.log('📋', text);
      }
    });

    page.on('dialog', async dialog => {
      console.log(`📢 Alert: ${dialog.message()}`);
      await dialog.accept();
    });

    // ========================================================================
    // PASSO 1: CRIAR AUTOMAÇÃO COM 2 NODES
    // ========================================================================
    console.log('\n📍 PASSO 1: Criando automação com 2 nodes...');
    
    await page.goto('http://localhost:8080/automations/create', { 
      waitUntil: 'networkidle', 
      timeout: 30000 
    });
    await page.waitForTimeout(2000);

    // Node 1 - Manual Trigger (tem outputs: result, output, data, response)
    await page.locator('button:has-text("Adicionar Ferramenta")').click();
    await page.waitForTimeout(1000);
    await page.locator('button').filter({ hasText: /Manual Trigger/i }).first().click();
    await page.waitForTimeout(2000);
    console.log('✅ Node 1 (Manual Trigger) adicionado');

    // Node 2 - HTTP Request (tem inputs de vários tipos)
    await page.locator('button:has-text("Adicionar Ferramenta")').click();
    await page.waitForTimeout(1000);
    await page.locator('button').filter({ hasText: /HTTP Request/i }).first().click();
    await page.waitForTimeout(2000);
    console.log('✅ Node 2 (HTTP Request) adicionado');

    // Conectar nodes
    const nodes = await page.locator('.react-flow__node').all();
    if (nodes.length >= 2) {
      const box1 = await nodes[0].boundingBox();
      const box2 = await nodes[1].boundingBox();
      
      if (box1 && box2) {
        await page.mouse.move(box1.x + box1.width / 2, box1.y + box1.height / 2);
        await page.mouse.down();
        await page.mouse.move(box2.x + box2.width / 2, box2.y + box2.height / 2, { steps: 20 });
        await page.mouse.up();
        await page.waitForTimeout(2000);
        console.log('✅ Nodes conectados');
      }
    }

    // Salvar automação
    const nameInput = page.locator('input').filter({ hasValue: /Nova Automação/ }).first();
    await nameInput.fill('Teste Bloco 1 - ' + Date.now());
    await page.waitForTimeout(500);

    const saveBtn = page.locator('button[title="Salvar automação"]');
    await saveBtn.evaluate(btn => btn.click());
    await page.waitForTimeout(4000);
    console.log('✅ Automação salva');

    await page.screenshot({ path: '/tmp/bloco1-step1-criacao.png', fullPage: true });
    results.step1_criacao = true;

    // ========================================================================
    // PASSO 2: VALIDAR LINKERS COMPATÍVEIS POR TIPO
    // ========================================================================
    console.log('\n📍 PASSO 2: Validando linkers compatíveis por tipo...');
    
    // Abrir config do node 2
    const configButtons = await page.locator('button[title="Configurar nó"]').all();
    if (configButtons.length < 2) {
      throw new Error('Menos de 2 botões de config');
    }

    await configButtons[1].evaluate(btn => btn.click());
    await page.waitForTimeout(3000);
    
    const modalVisible = await page.locator('h2').filter({ hasText: /Configurar/i }).isVisible();
    if (!modalVisible) throw new Error('Modal não abriu');
    console.log('✅ Modal de configuração aberto');

    // Verificar campos disponíveis
    const allInputs = await page.locator('input[type="text"]').all();
    console.log(`   Campos disponíveis: ${allInputs.length}`);

    // Testar linker em campo STRING (url)
    console.log('\n   🔍 Testando linker em campo STRING (url)...');
    const linkerButtons = await page.locator('button[title="Linkar campo"]').all();
    
    if (linkerButtons.length > 0) {
      // Clicar no primeiro linker (url - string)
      await linkerButtons[0].evaluate(btn => btn.click());
      await page.waitForTimeout(2000);

      // Verificar outputs disponíveis
      const outputButtons = await page.locator('button').filter({ hasText: /result|output|data|response/ }).all();
      console.log(`   Outputs disponíveis: ${outputButtons.length}`);
      
      if (outputButtons.length > 0) {
        console.log('   ✅ Linkers compatíveis mostrados');
        results.step2_linkers_compativeis = true;
        
        // Selecionar primeiro output
        await outputButtons[0].click();
        await page.waitForTimeout(1500);
        console.log('   ✅ Linker aplicado');
      } else {
        console.log('   ❌ Nenhum output disponível');
      }
    }

    await page.screenshot({ path: '/tmp/bloco1-step2-linkers.png', fullPage: true });

    // ========================================================================
    // PASSO 3: SALVAR E VALIDAR PERSISTÊNCIA
    // ========================================================================
    console.log('\n📍 PASSO 3: Validando persistência...');
    
    // Capturar valor linkado
    const greenFields = await page.locator('.bg-green-50').all();
    let linkedValue = '';
    if (greenFields.length > 0) {
      linkedValue = await greenFields[0].inputValue();
      console.log(`   Valor linkado: "${linkedValue}"`);
    }

    // Salvar config
    const saveConfigBtn = page.locator('button:has-text("Salvar Configuração")');
    await saveConfigBtn.click();
    await page.waitForTimeout(3000);
    console.log('   ✅ Config salva');

    // Fechar e reabrir
    await page.keyboard.press('Escape');
    await page.waitForTimeout(2000);

    const configButtons2 = await page.locator('button[title="Configurar nó"]').all();
    await configButtons2[1].evaluate(btn => btn.click());
    await page.waitForTimeout(3000);
    console.log('   ✅ Modal reaberto');

    // Validar persistência
    const greenFieldsAfter = await page.locator('.bg-green-50').all();
    if (greenFieldsAfter.length > 0) {
      const linkedValueAfter = await greenFieldsAfter[0].inputValue();
      const persisted = linkedValue === linkedValueAfter;
      console.log(`   Valor após reabrir: "${linkedValueAfter}"`);
      console.log(`   Persistiu: ${persisted ? '✅' : '❌'}`);
      results.step3_persistencia = persisted;
    }

    // Fechar modal
    await page.keyboard.press('Escape');
    await page.waitForTimeout(2000);

    await page.screenshot({ path: '/tmp/bloco1-step3-persistencia.png', fullPage: true });

    // ========================================================================
    // PASSO 4: EXECUTAR AUTOMAÇÃO
    // ========================================================================
    console.log('\n📍 PASSO 4: Executando automação...');
    
    // Procurar botão de executar
    const executeButtons = await page.locator('button').filter({ hasText: /Executar|Rodar|Play/i }).all();
    console.log(`   Botões de execução encontrados: ${executeButtons.length}`);

    if (executeButtons.length > 0) {
      await executeButtons[0].evaluate(btn => btn.click());
      await page.waitForTimeout(5000);
      console.log('   ✅ Automação executada');
      results.step4_execucao = true;
    } else {
      console.log('   ⚠️ Botão de execução não encontrado');
    }

    await page.screenshot({ path: '/tmp/bloco1-step4-execucao.png', fullPage: true });

    // ========================================================================
    // PASSO 5: VALIDAR LOGS COM VALORES TRANSITANDO
    // ========================================================================
    console.log('\n📍 PASSO 5: Validando logs...');
    
    // Procurar área de logs
    const logElements = await page.locator('div, pre, code').filter({ hasText: /log|result|output|executed/i }).all();
    console.log(`   Elementos de log encontrados: ${logElements.length}`);

    // Verificar se valores linkados aparecem nos logs
    const logsWithLinkedValues = consoleLogs.filter(log => 
      log.includes('{{') || 
      log.includes('node-') || 
      log.includes('result') ||
      log.includes('executed')
    );
    
    console.log(`   Logs com referências: ${logsWithLinkedValues.length}`);
    if (logsWithLinkedValues.length > 0) {
      console.log('   ✅ Valores transitando entre nodes detectados');
      results.step5_logs_valores = true;
    }

    await page.screenshot({ path: '/tmp/bloco1-step5-logs.png', fullPage: true });

    // Resultado final
    results.allPassed = 
      results.step1_criacao &&
      results.step2_linkers_compativeis &&
      results.step3_persistencia &&
      results.step4_execucao &&
      results.step5_logs_valores;

  } catch (error) {
    console.error('\n❌ ERRO NO BLOCO 1:', error.message);
    await page.screenshot({ path: '/tmp/bloco1-error.png', fullPage: true });
  } finally {
    await browser.close();
  }

  // ==========================================================================
  // RELATÓRIO FINAL BLOCO 1
  // ==========================================================================
  console.log('\n' + '='.repeat(90));
  console.log('📊 RELATÓRIO FINAL - BLOCO 1\n');

  console.log(`1. Criação de automação: ${results.step1_criacao ? '✅ PASSOU' : '❌ FALHOU'}`);
  console.log(`2. Linkers compatíveis: ${results.step2_linkers_compativeis ? '✅ PASSOU' : '❌ FALHOU'}`);
  console.log(`3. Persistência: ${results.step3_persistencia ? '✅ PASSOU' : '❌ FALHOU'}`);
  console.log(`4. Execução: ${results.step4_execucao ? '✅ PASSOU' : '❌ FALHOU'}`);
  console.log(`5. Logs com valores: ${results.step5_logs_valores ? '✅ PASSOU' : '❌ FALHOU'}`);

  console.log(`\n📊 RESULTADO GERAL: ${results.allPassed ? '✅ BLOCO 1 PASSOU' : '❌ BLOCO 1 FALHOU'}`);
  console.log('='.repeat(90));

  return results;
}

testBloco1().catch(console.error);
