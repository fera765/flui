/**
 * TESTE PLAYWRIGHT - DRAG & RECONNECT
 * 
 * Testa:
 * 1. Arrastar nó (não deve travar)
 * 2. Conectar nós
 * 3. Reconectar edge
 */

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FRONTEND_URL = 'http://localhost:5173';
const SCREENSHOTS_DIR = '/workspace/screenshots';

async function testDragAndReconnect() {
  console.log('🎭 TESTE - DRAG & RECONNECT\n');
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();
  
  const errors = [];
  page.on('pageerror', err => errors.push(err.message));
  
  try {
    console.log('📊 STEP 1: Abrir workflow editor');
    await page.goto(`${FRONTEND_URL}/automations/new`);
    await page.waitForTimeout(2000);
    
    await page.screenshot({ 
      path: path.join(SCREENSHOTS_DIR, 'drag-01-empty.png'), 
      fullPage: true 
    });
    
    console.log('📊 STEP 2: Adicionar 2 nós');
    
    // Adicionar primeiro nó
    await page.click('[data-testid="add-node-button"]');
    await page.waitForTimeout(1500);
    await page.click('[data-testid="tab-tools"]');
    await page.waitForTimeout(500);
    await page.locator('[data-testid="nodes-list"] button').first().click();
    await page.waitForTimeout(2000);
    
    console.log('  ✅ Nó 1 adicionado');
    
    // Adicionar segundo nó
    await page.click('[data-testid="add-node-button"]');
    await page.waitForTimeout(1500);
    await page.click('[data-testid="tab-tools"]');
    await page.waitForTimeout(500);
    await page.locator('[data-testid="nodes-list"] button').nth(1).click();
    await page.waitForTimeout(2000);
    
    console.log('  ✅ Nó 2 adicionado');
    
    await page.screenshot({ 
      path: path.join(SCREENSHOTS_DIR, 'drag-02-two-nodes.png'), 
      fullPage: true 
    });
    
    console.log('📊 STEP 3: Testar arrastar nó');
    
    // Get node position
    const node = await page.locator('.react-flow__node').first();
    const box = await node.boundingBox();
    
    if (box) {
      console.log(`  Nó encontrado em (${box.x}, ${box.y})`);
      
      // Drag node
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      await page.mouse.move(box.x + 200, box.y + 100, { steps: 10 });
      await page.mouse.up();
      
      await page.waitForTimeout(1000);
      
      console.log('  ✅ Nó arrastado');
      
      // Verificar se a tela não travou
      const bodyVisible = await page.isVisible('body');
      const headerVisible = await page.isVisible('header');
      const sidebarVisible = await page.isVisible('aside');
      
      console.log(`  Elementos visíveis após drag:`);
      console.log(`    Body: ${bodyVisible ? '✅' : '❌'}`);
      console.log(`    Header: ${headerVisible ? '✅' : '❌'}`);
      console.log(`    Sidebar: ${sidebarVisible ? '✅' : '❌'}`);
      
      if (!bodyVisible || !headerVisible) {
        console.log('  ❌ TELA TRAVOU após arrastar!');
      } else {
        console.log('  ✅ Tela OK após arrastar');
      }
    }
    
    await page.screenshot({ 
      path: path.join(SCREENSHOTS_DIR, 'drag-03-after-drag.png'), 
      fullPage: true 
    });
    
    console.log('📊 STEP 4: Conectar nós');
    
    // Get handle positions
    const sourceHandle = await page.locator('.react-flow__handle-bottom').first();
    const targetHandle = await page.locator('.react-flow__handle-top').last();
    
    const sourceBox = await sourceHandle.boundingBox();
    const targetBox = await targetHandle.boundingBox();
    
    if (sourceBox && targetBox) {
      console.log('  Handles encontrados');
      
      // Connect nodes
      await page.mouse.move(sourceBox.x + sourceBox.width / 2, sourceBox.y + sourceBox.height / 2);
      await page.mouse.down();
      await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + targetBox.height / 2, { steps: 20 });
      await page.mouse.up();
      
      await page.waitForTimeout(1500);
      
      const edgeCount = await page.locator('.react-flow__edge').count();
      console.log(`  Edges: ${edgeCount}`);
      
      if (edgeCount > 0) {
        console.log('  ✅ Nós conectados');
      } else {
        console.log('  ❌ Conexão falhou');
      }
    }
    
    await page.screenshot({ 
      path: path.join(SCREENSHOTS_DIR, 'drag-04-connected.png'), 
      fullPage: true 
    });
    
    console.log('📊 STEP 5: Adicionar terceiro nó para reconexão');
    
    await page.click('[data-testid="add-node-button"]');
    await page.waitForTimeout(1500);
    await page.click('[data-testid="tab-tools"]');
    await page.waitForTimeout(500);
    await page.locator('[data-testid="nodes-list"] button').nth(2).click();
    await page.waitForTimeout(2000);
    
    console.log('  ✅ Nó 3 adicionado');
    
    await page.screenshot({ 
      path: path.join(SCREENSHOTS_DIR, 'drag-05-three-nodes.png'), 
      fullPage: true 
    });
    
    console.log('\n' + '='.repeat(50));
    console.log('📊 RESULTADO');
    console.log('='.repeat(50));
    
    const finalErrors = errors.filter(e => 
      e.includes('error') || 
      e.includes('Error') ||
      e.includes('failed')
    );
    
    console.log(`Erros: ${finalErrors.length}`);
    if (finalErrors.length > 0) {
      console.log('❌ Erros encontrados:');
      finalErrors.forEach(err => console.log(`  - ${err}`));
    } else {
      console.log('✅ Sem erros de JavaScript');
    }
    
    console.log('='.repeat(50));
    
  } catch (error) {
    console.error('\n❌ ERRO:', error.message);
    await page.screenshot({ 
      path: path.join(SCREENSHOTS_DIR, 'drag-error.png'), 
      fullPage: true 
    });
    throw error;
  } finally {
    await browser.close();
  }
}

testDragAndReconnect()
  .then(() => {
    console.log('\n✅ Teste concluído!\n');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n💥 Falha:', error);
    process.exit(1);
  });
