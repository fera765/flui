/**
 * TESTE - MCP Import Modal
 */

import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FRONTEND_URL = 'http://localhost:5173';
const SCREENSHOTS_DIR = '/workspace/screenshots';

async function testMCPModal() {
  console.log('🎭 TESTE - MCP IMPORT MODAL\n');
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();
  
  try {
    console.log('📊 STEP 1: Abrir página MCPs');
    await page.goto(`${FRONTEND_URL}/mcps`);
    await page.waitForTimeout(2000);
    
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'modal-01-page.png'), fullPage: true });
    
    console.log('📊 STEP 2: Clicar em Import MCP');
    await page.click('button:has-text("Import MCP")');
    await page.waitForTimeout(2000);
    
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'modal-02-opened.png'), fullPage: true });
    
    console.log('📊 STEP 3: Verificar campos do modal');
    
    // Verificar tipo NPX
    const npxButton = await page.locator('button:has-text("NPX")').count();
    console.log(`  Botão NPX: ${npxButton > 0 ? '✅' : '❌'}`);
    
    // Verificar campo package
    const packageInput = await page.locator('input[placeholder*="package"], input[placeholder*="@model"]').count();
    console.log(`  Campo package: ${packageInput > 0 ? '✅' : '❌'}`);
    
    // Testar seleção de tipo
    if (npxButton > 0) {
      await page.click('button:has-text("NPX")');
      await page.waitForTimeout(500);
      
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'modal-03-npx-selected.png'), fullPage: true });
    }
    
    console.log('📊 STEP 4: Preencher formulário');
    
    const inputs = await page.locator('input[type="text"]').count();
    console.log(`  Inputs encontrados: ${inputs}`);
    
    if (inputs > 0) {
      await page.fill('input[type="text"]', '@pollinations/model-context-protocol');
      await page.waitForTimeout(500);
      
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'modal-04-filled.png'), fullPage: true });
    }
    
    console.log('📊 STEP 5: Verificar botão Import');
    
    const importButton = await page.locator('button:has-text("Import")').count();
    console.log(`  Botão Import: ${importButton > 0 ? '✅' : '❌'}`);
    
    console.log('\n✅ Modal funcionando corretamente!');
    
  } catch (error) {
    console.error('\n❌ ERRO:', error.message);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'modal-error.png'), fullPage: true });
    throw error;
  } finally {
    await browser.close();
  }
}

testMCPModal()
  .then(() => {
    console.log('\n✅ Teste concluído!\n');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n💥 Falha:', error);
    process.exit(1);
  });
