/**
 * Playwright Debug Test - Node Configuration Modal
 * 
 * Teste focado em debugar o problema do modal não abrir
 */

import { test, expect } from '@playwright/test';

test.describe('Node Configuration Modal - Debug', () => {
  test('verificar se página carrega corretamente', async ({ page }) => {
    // Capturar logs e erros
    const logs: string[] = [];
    const errors: string[] = [];
    
    page.on('console', (msg) => {
      const text = msg.text();
      logs.push(text);
      if (msg.type() === 'error') {
        errors.push(text);
      }
    });
    
    page.on('pageerror', (error) => {
      errors.push(error.message);
    });
    
    // Navegar para a página
    console.log('\n🚀 Navegando para /create-automation-v2...');
    const response = await page.goto('/create-automation-v2');
    
    if (!response || !response.ok()) {
      console.log('❌ Erro ao carregar página:', response?.status());
      return;
    }
    
    console.log('✅ Página carregada com sucesso');
    
    // Aguardar React carregar
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    
    // Verificar se há erros
    if (errors.length > 0) {
      console.log('\n❌ ERROS ENCONTRADOS:');
      errors.forEach(err => console.log('  ', err));
    } else {
      console.log('\n✅ Nenhum erro de console/página');
    }
    
    // Verificar estrutura da página
    const title = await page.title();
    console.log('\n📄 Título da página:', title);
    
    // Verificar se ReactFlow está renderizado
    const reactFlow = page.locator('.react-flow');
    const hasReactFlow = await reactFlow.count() > 0;
    console.log('🎨 ReactFlow renderizado:', hasReactFlow);
    
    // Procurar por nodes no canvas
    const nodes = page.locator('.react-flow__node');
    const nodeCount = await nodes.count();
    console.log('📦 Nodes no canvas:', nodeCount);
    
    // Verificar botões de ação
    const addButton = page.locator('button:has-text("Tools")').or(page.locator('button:has-text("Adicionar")'));
    const hasAddButton = await addButton.count() > 0;
    console.log('➕ Botão de adicionar encontrado:', hasAddButton);
    
    // Verificar logs relevantes
    const configLogs = logs.filter(log => 
      log.includes('handleConfigureNode') || 
      log.includes('NodeConfigModalV2') ||
      log.includes('ConfigPanel')
    );
    
    if (configLogs.length > 0) {
      console.log('\n📋 Logs de configuração encontrados:');
      configLogs.forEach(log => console.log('  ', log));
    }
    
    // Resumo
    console.log('\n📊 RESUMO:');
    console.log('  ✅ Logs capturados:', logs.length);
    console.log('  ❌ Erros:', errors.length);
    console.log('  🎨 ReactFlow OK:', hasReactFlow);
    console.log('  📦 Nodes:', nodeCount);
    
    // Assertions
    expect(response?.ok()).toBeTruthy();
    expect(errors.length).toBe(0);
  });
  
  test('simular clique no botão de configuração', async ({ page }) => {
    const logs: string[] = [];
    const errors: string[] = [];
    
    page.on('console', (msg) => {
      logs.push(msg.text());
    });
    
    page.on('pageerror', (error) => {
      errors.push(error.message);
    });
    
    await page.goto('/create-automation-v2');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    console.log('\n🔍 Procurando por nodes existentes...');
    
    // Verificar se há algum node
    const nodes = page.locator('.react-flow__node');
    const nodeCount = await nodes.count();
    console.log('📦 Nodes encontrados:', nodeCount);
    
    if (nodeCount === 0) {
      console.log('\n⚠️ Nenhum node no canvas. Vamos tentar adicionar um...');
      
      // Tentar adicionar node via JavaScript
      await page.evaluate(() => {
        // Verificar se há um botão de adicionar tool
        const buttons = document.querySelectorAll('button');
        for (const btn of buttons) {
          if (btn.textContent?.includes('Tools') || btn.textContent?.includes('Adicionar')) {
            btn.click();
            console.log('🔘 Clicou no botão:', btn.textContent);
            break;
          }
        }
      });
      
      await page.waitForTimeout(1000);
    }
    
    // Procurar botão de configuração
    console.log('\n🔍 Procurando botão de configuração...');
    const configButtons = page.locator('button[title="Configurar nó"]');
    const configButtonCount = await configButtons.count();
    console.log('⚙️ Botões de configuração encontrados:', configButtonCount);
    
    if (configButtonCount > 0) {
      console.log('\n✅ Botão encontrado! Clicando...');
      
      // Clicar no primeiro botão
      await configButtons.first().click();
      
      // Aguardar
      await page.waitForTimeout(1000);
      
      // Verificar se modal abriu
      const modal = page.locator('h2:has-text("Configurar Nó")');
      const modalVisible = await modal.isVisible().catch(() => false);
      
      console.log('🎨 Modal visível:', modalVisible);
      
      // Verificar logs após clique
      const postClickLogs = logs.filter(log => 
        log.includes('handleConfigureNode') || 
        log.includes('NodeConfigModalV2')
      );
      
      console.log('\n📋 Logs após clique:');
      if (postClickLogs.length > 0) {
        postClickLogs.forEach(log => console.log('  ', log));
      } else {
        console.log('  ⚠️ Nenhum log relevante encontrado');
      }
      
      // Verificar estado do componente
      const modalState = await page.evaluate(() => {
        const modalElement = document.querySelector('h2');
        if (modalElement?.textContent?.includes('Configurar')) {
          return {
            exists: true,
            visible: modalElement.offsetParent !== null,
            display: window.getComputedStyle(modalElement.parentElement || modalElement).display,
          };
        }
        return { exists: false };
      });
      
      console.log('\n🔍 Estado do modal:', JSON.stringify(modalState, null, 2));
      
      // Se modal não abriu, investigar
      if (!modalVisible) {
        console.log('\n❌ PROBLEMA: Modal não abriu após clique!');
        console.log('\n🔍 Investigando possíveis causas:');
        
        // 1. Verificar se estado foi atualizado
        console.log('  1. Verificando logs de estado...');
        const stateLogs = logs.filter(log => 
          log.includes('isOpen') || 
          log.includes('configPanelOpen') ||
          log.includes('selectedNode')
        );
        if (stateLogs.length > 0) {
          stateLogs.forEach(log => console.log('     ', log));
        } else {
          console.log('     ⚠️ Nenhum log de estado encontrado');
        }
        
        // 2. Verificar se há erros
        if (errors.length > 0) {
          console.log('\n  2. Erros encontrados:');
          errors.forEach(err => console.log('     ❌', err));
        }
        
        // 3. Verificar props do modal
        const modalProps = await page.evaluate(() => {
          // Tentar acessar React DevTools ou propriedades do componente
          const modalRoot = document.querySelector('[class*="fixed"][class*="inset"]');
          return {
            modalRootExists: !!modalRoot,
            modalRootDisplay: modalRoot ? window.getComputedStyle(modalRoot).display : 'N/A',
          };
        });
        console.log('\n  3. Props/Estado do modal:', JSON.stringify(modalProps, null, 2));
      } else {
        console.log('\n✅ Modal abriu com sucesso!');
      }
    } else {
      console.log('\n⚠️ Nenhum botão de configuração encontrado');
      console.log('   Isso pode indicar que:');
      console.log('   1. Nenhum node foi adicionado ao canvas');
      console.log('   2. Os nodes não têm o callback onConfigure');
      console.log('   3. O ToolNode não está renderizando o botão');
    }
    
    // Logs finais
    console.log('\n📊 RESUMO FINAL:');
    console.log('  📋 Total de logs:', logs.length);
    console.log('  ❌ Total de erros:', errors.length);
    console.log('  📦 Nodes no canvas:', nodeCount);
    console.log('  ⚙️ Botões de config:', configButtonCount);
  });
});
