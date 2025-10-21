import { test, expect } from '@playwright/test';

test('debug - ver o que tem na página', async ({ page }) => {
  // Capturar console logs
  const logs: string[] = [];
  const errors: string[] = [];
  
  page.on('console', msg => {
    const text = msg.text();
    logs.push(`[${msg.type()}] ${text}`);
    if (msg.type() === 'error') {
      errors.push(text);
    }
  });
  
  console.log('\n🌐 Navegando para /automations/create...');
  await page.goto('/automations/create');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(5000); // Dar mais tempo para React renderizar
  
  // Verificar URL atual
  const currentUrl = page.url();
  console.log(`\n📍 URL atual: ${currentUrl}`);
  
  // Verificar se React/Vite carregou
  const reactRoot = await page.locator('#root').count();
  console.log(`\n⚛️ React root presente: ${reactRoot > 0 ? 'SIM' : 'NÃO'}`);
  
  // Ver conteúdo do root
  const rootContent = await page.locator('#root').textContent();
  console.log(`\n📄 Conteúdo do #root (primeiros 500 chars):`);
  console.log(rootContent?.substring(0, 500));
  
  // Procurar todos os botões
  const buttons = await page.locator('button').allTextContents();
  console.log(`\n🔘 BOTÕES ENCONTRADOS (${buttons.length}):`, buttons);
  
  // Procurar texto "Adicionar"
  const addButtons = await page.locator('button:has-text("Adicionar")').count();
  console.log(`\n➕ Botões com "Adicionar": ${addButtons}`);
  
  // Procurar por class react-flow
  const reactFlow = await page.locator('.react-flow').count();
  console.log(`\n🔀 ReactFlow presente: ${reactFlow > 0 ? 'SIM' : 'NÃO'}`);
  
  // Verificar Panel do ReactFlow
  const panel = await page.locator('[class*="react-flow__panel"]').count();
  console.log(`\n📦 ReactFlow Panel presente: ${panel > 0 ? 'SIM' : 'NÃO'}`);
  
  // Screenshot
  await page.screenshot({ path: 'debug-screenshot.png', fullPage: true });
  console.log('\n📸 Screenshot salvo em debug-screenshot.png');
  
  // Mostrar console logs
  console.log('\n📝 CONSOLE LOGS (últimos 20):');
  logs.slice(-20).forEach(log => console.log(`   ${log}`));
  
  // Mostrar erros
  if (errors.length > 0) {
    console.log('\n❌ ERROS NO CONSOLE:', errors);
  } else {
    console.log('\n✅ Nenhum erro no console');
  }
});
