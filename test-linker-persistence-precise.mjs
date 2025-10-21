/**
 * TESTE PRECISO - Persistência de Linker
 * 
 * Objetivo: Validar que dados de linker persistem após salvar e reabrir modal
 */

import { chromium } from 'playwright';

async function testLinkerPersistence() {
  console.log('🎯 TESTE PRECISO - PERSISTÊNCIA DE LINKER\n');
  console.log('='.repeat(80));

  const browser = await chromium.launch({ 
    headless: true, 
    slowMo: 100 
  });
  const context = await browser.newContext();
  const page = await context.newPage();

  let testPassed = false;
  let linkedValue = '';
  let persistedValue = '';

  try {
    // Capturar logs importantes
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('availableOutputs') || text.includes('Parent nodes') || text.includes('Salvando config')) {
        console.log('📋', text);
      }
    });

    // ==================================================================
    // PASSO 1: NAVEGAR E CARREGAR
    // ==================================================================
    console.log('\n📍 PASSO 1: Navegando para página...');
    await page.goto('http://localhost:8080/automations/create', { 
      waitUntil: 'networkidle', 
      timeout: 30000 
    });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: '/workspace/test-step1-loaded.png', fullPage: true });
    console.log('✅ Página carregada');

    // ==================================================================
    // PASSO 2: ADICIONAR PRIMEIRO NODE
    // ==================================================================
    console.log('\n📍 PASSO 2: Adicionando primeiro node...');
    await page.locator('button:has-text("Adicionar Ferramenta")').click();
    await page.waitForTimeout(1000);
    await page.locator('button').filter({ hasText: /Manual Trigger/i }).first().click();
    await page.waitForTimeout(2000);
    
    let nodeCount = await page.locator('.react-flow__node').count();
    console.log(`✅ Node 1 adicionado (total: ${nodeCount})`);
    await page.screenshot({ path: '/workspace/test-step2-node1.png', fullPage: true });

    // ==================================================================
    // PASSO 3: ADICIONAR SEGUNDO NODE
    // ==================================================================
    console.log('\n📍 PASSO 3: Adicionando segundo node...');
    await page.locator('button:has-text("Adicionar Ferramenta")').click();
    await page.waitForTimeout(1000);
    await page.locator('button').filter({ hasText: /Cron Trigger/i }).first().click();
    await page.waitForTimeout(2000);
    
    nodeCount = await page.locator('.react-flow__node').count();
    console.log(`✅ Node 2 adicionado (total: ${nodeCount})`);
    await page.screenshot({ path: '/workspace/test-step3-node2.png', fullPage: true });

    if (nodeCount < 2) {
      throw new Error('Não foi possível adicionar 2 nodes');
    }

    // ==================================================================
    // PASSO 4: CONECTAR NODES
    // ==================================================================
    console.log('\n📍 PASSO 4: Conectando nodes...');
    const nodes = await page.locator('.react-flow__node').all();
    const box1 = await nodes[0].boundingBox();
    const box2 = await nodes[1].boundingBox();
    
    if (box1 && box2) {
      await page.mouse.move(box1.x + box1.width / 2, box1.y + box1.height / 2);
      await page.mouse.down();
      await page.mouse.move(box2.x + box2.width / 2, box2.y + box2.height / 2, { steps: 20 });
      await page.mouse.up();
      await page.waitForTimeout(2000);
      
      const edgeCount = await page.locator('.react-flow__edge').count();
      console.log(`✅ Nodes conectados (edges: ${edgeCount})`);
      await page.screenshot({ path: '/workspace/test-step4-connected.png', fullPage: true });
    }

    // ==================================================================
    // PASSO 5: ABRIR MODAL DO SEGUNDO NODE
    // ==================================================================
    console.log('\n📍 PASSO 5: Abrindo modal do segundo node...');
    const configButtons = await page.locator('button[title="Configurar nó"]').all();
    console.log(`   Botões de config encontrados: ${configButtons.length}`);
    
    if (configButtons.length < 2) {
      throw new Error('Menos de 2 botões de configuração encontrados');
    }

    await configButtons[1].evaluate(btn => btn.click());
    await page.waitForTimeout(3000);
    
    const modalVisible = await page.locator('h2').filter({ hasText: /Configurar/i }).isVisible();
    console.log(`✅ Modal aberto: ${modalVisible}`);
    await page.screenshot({ path: '/workspace/test-step5-modal-open.png', fullPage: true });

    if (!modalVisible) {
      throw new Error('Modal não abriu');
    }

    // ==================================================================
    // PASSO 6: CLICAR NO BOTÃO DE LINKER
    // ==================================================================
    console.log('\n📍 PASSO 6: Clicando no botão de linker...');
    const linkerBtn = page.locator('button[title="Linkar campo"]').first();
    const hasLinkerBtn = await linkerBtn.count() > 0;
    console.log(`   Botão de linker encontrado: ${hasLinkerBtn}`);
    
    if (!hasLinkerBtn) {
      throw new Error('Botão de linker não encontrado');
    }

    await linkerBtn.evaluate(btn => btn.click());
    await page.waitForTimeout(2000);
    await page.screenshot({ path: '/workspace/test-step6-linker-open.png', fullPage: true });

    // ==================================================================
    // PASSO 7: VERIFICAR OUTPUTS DISPONÍVEIS (AGRUPADOS POR NODE)
    // ==================================================================
    console.log('\n📍 PASSO 7: Verificando outputs disponíveis...');
    
    // Verificar se há cabeçalhos de nodes (nova UI)
    const nodeHeaders = await page.locator('h5').filter({ hasText: /.+/i }).count();
    console.log(`   Cabeçalhos de nodes (agrupamento): ${nodeHeaders}`);
    
    // Contar outputs disponíveis
    const outputButtons = await page.locator('button').filter({ hasText: /result|output|data|trigger/i }).count();
    console.log(`   Outputs disponíveis: ${outputButtons}`);
    
    if (outputButtons === 0) {
      console.log('❌ NENHUM OUTPUT DISPONÍVEL!');
      throw new Error('Nenhum output disponível para linkar');
    }

    // ==================================================================
    // PASSO 8: FAZER LINKER
    // ==================================================================
    console.log('\n📍 PASSO 8: Fazendo linker...');
    const firstOutput = page.locator('button').filter({ hasText: /result/i }).first();
    await firstOutput.click();
    await page.waitForTimeout(1500);

    // Verificar se campo ficou verde (linkado)
    const linkedFields = await page.locator('.bg-green-50').count();
    console.log(`   Campos linkados (verde): ${linkedFields}`);
    
    if (linkedFields === 0) {
      console.log('❌ Campo não ficou verde após linkar!');
      throw new Error('Linker não funcionou - campo não ficou verde');
    }

    // Capturar valor linkado
    const inputField = page.locator('.bg-green-50').first();
    linkedValue = await inputField.inputValue();
    console.log(`✅ Valor linkado: "${linkedValue}"`);
    await page.screenshot({ path: '/workspace/test-step8-linked.png', fullPage: true });

    // Validar formato
    if (!linkedValue.includes('{{') || !linkedValue.includes('}}')) {
      console.log(`❌ Formato inválido: ${linkedValue}`);
      throw new Error('Formato de linker inválido - esperado {{node.field}}');
    }

    // ==================================================================
    // PASSO 9: SALVAR CONFIGURAÇÃO
    // ==================================================================
    console.log('\n📍 PASSO 9: Salvando configuração...');
    const saveBtn = page.locator('button:has-text("Salvar Configuração")');
    await saveBtn.click();
    await page.waitForTimeout(3000);

    // Verificar se modal fechou
    const modalClosed = !(await page.locator('h2').filter({ hasText: /Configurar/i }).isVisible().catch(() => false));
    console.log(`✅ Modal fechou: ${modalClosed}`);
    await page.screenshot({ path: '/workspace/test-step9-saved.png', fullPage: true });

    if (!modalClosed) {
      console.log('⚠️ Modal não fechou após salvar');
    }

    // ==================================================================
    // PASSO 10: REABRIR MODAL (CRÍTICO PARA VALIDAR PERSISTÊNCIA)
    // ==================================================================
    console.log('\n📍 PASSO 10: Reabrindo modal para validar persistência...');
    await page.waitForTimeout(2000);
    
    // Garantir que modal está fechado
    await page.keyboard.press('Escape');
    await page.waitForTimeout(1000);
    
    // Reabrir
    const configButtons2 = await page.locator('button[title="Configurar nó"]').all();
    if (configButtons2.length >= 2) {
      await configButtons2[1].evaluate(btn => btn.click());
      await page.waitForTimeout(3000);
      
      const modalReopened = await page.locator('h2').filter({ hasText: /Configurar/i }).isVisible();
      console.log(`✅ Modal reaberto: ${modalReopened}`);
      await page.screenshot({ path: '/workspace/test-step10-reopened.png', fullPage: true });

      if (!modalReopened) {
        throw new Error('Não foi possível reabrir modal');
      }

      // ==================================================================
      // PASSO 11: VALIDAR PERSISTÊNCIA (MOMENTO DA VERDADE!)
      // ==================================================================
      console.log('\n📍 PASSO 11: VALIDANDO PERSISTÊNCIA...');
      console.log('-'.repeat(80));
      
      // Verificar se campo ainda está verde
      const stillLinkedFields = await page.locator('.bg-green-50').count();
      console.log(`   Campos linkados após reabrir: ${stillLinkedFields}`);
      
      // Capturar valor persistido
      if (stillLinkedFields > 0) {
        const persistedField = page.locator('.bg-green-50').first();
        persistedValue = await persistedField.inputValue();
        console.log(`   Valor persistido: "${persistedValue}"`);
        
        // COMPARAR VALORES
        const valuesMatch = linkedValue === persistedValue;
        console.log(`   Valores coincidem: ${valuesMatch}`);
        
        if (valuesMatch && persistedValue.includes('{{') && persistedValue.includes('}}')) {
          console.log('\n✅✅✅ SUCESSO TOTAL! ✅✅✅');
          console.log('   ✅ Campo está verde');
          console.log(`   ✅ Valor correto: ${persistedValue}`);
          console.log('   ✅ Formato válido: {{node.field}}');
          console.log('   ✅ DADOS PERSISTIDOS COM SUCESSO!');
          testPassed = true;
        } else {
          console.log('\n❌ FALHA NA PERSISTÊNCIA');
          console.log(`   Valor original: ${linkedValue}`);
          console.log(`   Valor persistido: ${persistedValue}`);
          console.log('   Os valores não coincidem!');
        }
      } else {
        console.log('\n❌ FALHA CRÍTICA NA PERSISTÊNCIA');
        console.log('   Campo não está mais verde');
        console.log('   Linker foi PERDIDO após reabrir modal');
      }

      await page.screenshot({ path: '/workspace/test-step11-validation.png', fullPage: true });
    }

  } catch (error) {
    console.error('\n❌ ERRO NO TESTE:', error.message);
    await page.screenshot({ path: '/workspace/test-error.png', fullPage: true });
  } finally {
    await browser.close();
  }

  // ==================================================================
  // RELATÓRIO FINAL
  // ==================================================================
  console.log('\n' + '='.repeat(80));
  console.log('📊 RELATÓRIO FINAL\n');
  console.log(`Valor linkado:    "${linkedValue}"`);
  console.log(`Valor persistido: "${persistedValue}"`);
  console.log(`Persistência:     ${testPassed ? '✅ FUNCIONANDO' : '❌ FALHOU'}`);
  console.log('\n' + '='.repeat(80));

  if (testPassed) {
    console.log('\n🎉🎉🎉 TESTE PASSOU - PERSISTÊNCIA FUNCIONA! 🎉🎉🎉');
  } else {
    console.log('\n❌❌❌ TESTE FALHOU - PERSISTÊNCIA NÃO FUNCIONA ❌❌❌');
    console.log('\n🔍 INVESTIGAR:');
    console.log('   1. handleSaveNodeConfig está salvando?');
    console.log('   2. Backend está persistindo?');
    console.log('   3. loadNodeData está carregando config?');
  }

  console.log('\n📸 Screenshots salvos em:');
  console.log('   /workspace/test-step*.png');
  console.log('   /workspace/test-error.png (se houve erro)');
}

testLinkerPersistence().catch(console.error);
