/**
 * Teste Completo do Sistema de Linker
 * 
 * Este teste valida:
 * 1. Adicionar 2 nodes
 * 2. Conectar nodes (edge)
 * 3. Abrir config do segundo node
 * 4. Clicar no botão de linker
 * 5. Verificar se existem outputs disponíveis
 * 6. Fazer o linker
 * 7. Salvar
 * 8. Reabrir e validar persistência
 * 9. Verificar cor do texto (preto)
 */

import { chromium } from 'playwright';

async function testLinkerSystem() {
  console.log('🚀 TESTE COMPLETO DO SISTEMA DE LINKER\n');
  console.log('='.repeat(70));

  const browser = await chromium.launch({ headless: true, slowMo: 100 });
  const context = await browser.newContext();
  const page = await context.newPage();

  const results = [];
  let testPassed = false;

  try {
    // Capturar logs do console
    page.on('console', msg => {
      if (msg.text().includes('[NodeConfigModalV2]') || 
          msg.text().includes('availableOutputs') ||
          msg.text().includes('Parent nodes')) {
        console.log('📋 Browser:', msg.text());
      }
    });

    // 1. Navegar
    console.log('\n📍 ETAPA 1: Navegação');
    await page.goto('http://localhost:8080/automations/create', {
      waitUntil: 'networkidle',
      timeout: 30000,
    });
    await page.waitForTimeout(2000);
    results.push({ step: 'Navegação', status: '✅' });

    // 2. Adicionar primeiro node
    console.log('\n📦 ETAPA 2: Adicionar primeiro node (Manual Trigger)');
    const paletteBtn = page.locator('button').filter({ hasText: /Tools|Adicionar|\+/ }).first();
    await paletteBtn.click();
    await page.waitForTimeout(1000);
    
    const firstTool = page.locator('button').filter({ hasText: /Trigger|Manual/ }).first();
    await firstTool.click();
    await page.waitForTimeout(1500);
    
    let nodeCount = await page.locator('.react-flow__node').count();
    console.log('   Nodes:', nodeCount);
    results.push({ step: 'Adicionar Node 1', status: nodeCount === 1 ? '✅' : '❌' });

    // 3. Adicionar segundo node
    console.log('\n📦 ETAPA 3: Adicionar segundo node (Cron Trigger)');
    await paletteBtn.click();
    await page.waitForTimeout(1000);
    
    const secondTool = page.locator('button').filter({ hasText: /Cron/ }).first();
    await secondTool.click();
    await page.waitForTimeout(1500);
    
    nodeCount = await page.locator('.react-flow__node').count();
    console.log('   Nodes:', nodeCount);
    results.push({ step: 'Adicionar Node 2', status: nodeCount === 2 ? '✅' : '❌' });

    // 4. Conectar nodes (criar edge manualmente via ReactFlow)
    console.log('\n🔗 ETAPA 4: Conectar nodes');
    
    // Encontrar handles dos nodes
    const nodes = await page.locator('.react-flow__node').all();
    if (nodes.length >= 2) {
      // Pegar primeiro node
      const sourceHandle = nodes[0].locator('.react-flow__handle-right').first();
      const targetHandle = nodes[1].locator('.react-flow__handle-left').first();
      
      // Simular drag & drop
      const sourceBox = await sourceHandle.boundingBox();
      const targetBox = await targetHandle.boundingBox();
      
      if (sourceBox && targetBox) {
        await page.mouse.move(sourceBox.x + sourceBox.width / 2, sourceBox.y + sourceBox.height / 2);
        await page.mouse.down();
        await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + targetBox.height / 2, { steps: 10 });
        await page.mouse.up();
        await page.waitForTimeout(1000);
        
        const edgeCount = await page.locator('.react-flow__edge').count();
        console.log('   Edges criadas:', edgeCount);
        results.push({ step: 'Conectar Nodes', status: edgeCount > 0 ? '✅' : '❌' });
      } else {
        console.log('   ⚠️ Não foi possível obter bounding boxes dos handles');
        results.push({ step: 'Conectar Nodes', status: '⚠️' });
      }
    }

    // 5. Abrir configuração do segundo node
    console.log('\n⚙️ ETAPA 5: Abrir configuração do segundo node');
    const configButtons = await page.locator('button[title="Configurar nó"]').all();
    if (configButtons.length >= 2) {
      await configButtons[1].click();
      await page.waitForTimeout(2000);
      
      const modalVisible = await page.locator('h2').filter({ hasText: /Configurar/ }).isVisible();
      console.log('   Modal visível:', modalVisible ? '✅' : '❌');
      results.push({ step: 'Abrir Modal', status: modalVisible ? '✅' : '❌' });

      if (!modalVisible) {
        throw new Error('Modal não abriu!');
      }

      // 6. Verificar cor do texto dos inputs
      console.log('\n🎨 ETAPA 6: Verificar cor do texto dos inputs');
      const firstInput = page.locator('input[type="text"]').first();
      if (await firstInput.count() > 0) {
        const textColor = await firstInput.evaluate((el) => {
          const styles = window.getComputedStyle(el);
          return styles.color;
        });
        console.log('   Cor do texto:', textColor);
        
        // rgb(17, 24, 39) é text-gray-900
        const isBlack = textColor.includes('rgb(17, 24, 39)') || textColor.includes('rgb(0, 0, 0)');
        console.log('   Cor é preta/escura?', isBlack ? '✅' : '❌');
        results.push({ step: 'Cor do Texto', status: isBlack ? '✅' : '⚠️' });
      }

      // 7. Procurar campo com botão de linker
      console.log('\n🔗 ETAPA 7: Procurar botão de linker');
      const linkerButtons = await page.locator('button[title="Linkar campo"]').all();
      console.log('   Botões de linker encontrados:', linkerButtons.length);
      
      if (linkerButtons.length > 0) {
        results.push({ step: 'Botões de Linker', status: '✅' });
        
        // 8. Clicar no primeiro botão de linker
        console.log('\n🖱️ ETAPA 8: Clicar no botão de linker');
        await linkerButtons[0].click();
        await page.waitForTimeout(1500);
        
        // 9. Verificar se há outputs disponíveis
        console.log('\n📋 ETAPA 9: Verificar outputs disponíveis');
        
        // Verificar mensagem de "nenhum output"
        const noOutputMsg = await page.locator('text=/Nenhum output/i').count();
        
        if (noOutputMsg > 0) {
          console.log('   ❌ "Nenhum output disponível" ainda aparece!');
          results.push({ step: 'Outputs Disponíveis', status: '❌' });
          
          await page.screenshot({ path: '/workspace/linker-no-outputs.png', fullPage: true });
        } else {
          // Procurar lista de outputs
          const outputItems = await page.locator('button').filter({ hasText: /output|result|data/ }).count();
          console.log('   Outputs disponíveis:', outputItems);
          
          if (outputItems > 0) {
            console.log('   ✅ Outputs encontrados!');
            results.push({ step: 'Outputs Disponíveis', status: '✅' });
            
            // 10. Fazer o linker
            console.log('\n🔗 ETAPA 10: Fazer o linker');
            const firstOutput = page.locator('button').filter({ hasText: /result|output/ }).first();
            await firstOutput.click();
            await page.waitForTimeout(1000);
            
            // Verificar se campo ficou verde/linkado
            const linkedField = await page.locator('.bg-green-50').count();
            console.log('   Campo linkado (verde)?', linkedField > 0 ? '✅' : '❌');
            results.push({ step: 'Fazer Linker', status: linkedField > 0 ? '✅' : '❌' });
            
            // 11. Salvar
            console.log('\n💾 ETAPA 11: Salvar configuração');
            const saveBtn = page.locator('button:has-text("Salvar")');
            await saveBtn.click();
            await page.waitForTimeout(2000);
            
            // Modal deve fechar
            const modalClosed = !(await page.locator('h2').filter({ hasText: /Configurar/ }).isVisible());
            console.log('   Modal fechou:', modalClosed ? '✅' : '❌');
            results.push({ step: 'Salvar Config', status: modalClosed ? '✅' : '❌' });
            
            // 12. Reabrir e verificar persistência
            console.log('\n🔄 ETAPA 12: Reabrir e verificar persistência');
            await page.waitForTimeout(1000);
            await configButtons[1].click();
            await page.waitForTimeout(2000);
            
            // Verificar se campo ainda está linkado (verde)
            const stillLinked = await page.locator('.bg-green-50').count();
            console.log('   Linker persistiu?', stillLinked > 0 ? '✅' : '❌');
            results.push({ step: 'Persistência', status: stillLinked > 0 ? '✅' : '❌' });
            
            await page.screenshot({ path: '/workspace/linker-success.png', fullPage: true });
            
            if (stillLinked > 0) {
              testPassed = true;
            }
          } else {
            console.log('   ⚠️ Nenhum output encontrado na lista');
            results.push({ step: 'Outputs Disponíveis', status: '⚠️' });
            await page.screenshot({ path: '/workspace/linker-empty-list.png', fullPage: true });
          }
        }
      } else {
        console.log('   ❌ Nenhum botão de linker encontrado');
        results.push({ step: 'Botões de Linker', status: '❌' });
      }
    } else {
      console.log('   ❌ Menos de 2 nodes para configurar');
      results.push({ step: 'Abrir Modal', status: '❌' });
    }

  } catch (error) {
    console.error('\n❌ Erro:', error.message);
    await page.screenshot({ path: '/workspace/linker-error.png', fullPage: true });
    results.push({ step: 'Erro Fatal', status: '❌', error: error.message });
  } finally {
    await browser.close();
  }

  // Relatório Final
  console.log('\n' + '='.repeat(70));
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
  
  if (testPassed) {
    console.log('\n🎉🎉🎉 SISTEMA DE LINKER FUNCIONANDO! 🎉🎉🎉');
  } else if (failCount === 0) {
    console.log('\n✅ Todos os testes passaram!');
  } else {
    console.log('\n⚠️  Alguns testes falharam. Verifique os detalhes acima.');
  }
  
  console.log('\n' + '='.repeat(70));
}

testLinkerSystem().catch(console.error);
