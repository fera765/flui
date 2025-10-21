import { test, expect } from '@playwright/test';

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

test('debug - adicionar nó e verificar renderização', async ({ page }) => {
  await page.goto('/automations/create');
  await page.waitForLoadState('networkidle');
  await wait(3000);
  
  console.log('\n🔘 Clicando em Adicionar Ferramenta...');
  await page.click('button:has-text("Adicionar Ferramenta")');
  await wait(2000);
  
  console.log('\n📋 Procurando Manual Trigger...');
  const tool = page.locator('button').filter({ has: page.locator('h3:has-text("Manual Trigger")') }).first();
  const toolExists = await tool.count() > 0;
  console.log(`   Tool encontrada: ${toolExists}`);
  
  if (toolExists) {
    console.log('\n🖱️  Clicando na tool...');
    await tool.click();
    await wait(3000);
    
    // Verificar diferentes seletores
    console.log('\n🔍 Verificando seletores de nós...');
    const selectors = [
      '[data-type="tool"]',
      '.react-flow__node',
      '[class*="react-flow__node"]',
      'div[data-id]',
      '[data-testid="tool-node"]',
    ];
    
    for (const selector of selectors) {
      const count = await page.locator(selector).count();
      console.log(`   ${selector}: ${count} elementos`);
    }
    
    // Ver todos os nós no ReactFlow
    const nodes = await page.evaluate(() => {
      const rfInstance = (window as any).__reactFlowInstance;
      return rfInstance?.getNodes() || [];
    });
    
    console.log(`\n⚛️  Nós no ReactFlow state: ${nodes.length}`);
    console.log('   Dados:', JSON.stringify(nodes, null, 2).substring(0, 500));
    
    // Ver HTML do canvas
    const canvasHtml = await page.locator('.react-flow').innerHTML();
    console.log(`\n📄 HTML do canvas (primeiros 500 chars):`);
    console.log(canvasHtml.substring(0, 500));
    
    // Screenshot
    await page.screenshot({ path: 'debug-add-node.png', fullPage: true });
    console.log('\n📸 Screenshot salvo');
  }
});
