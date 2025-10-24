import { chromium } from 'playwright';

async function screenshot() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  
  console.log('📸 Screenshot 1: Tools page com Pollinations');
  await page.goto('http://localhost:5173/tools');
  await page.waitForTimeout(2000);
  await page.fill('input[placeholder*="Search"]', 'pollinations');
  await page.waitForTimeout(1000);
  await page.screenshot({ 
    path: '/workspace/screenshots/FINAL-mcp-tools.png', 
    fullPage: true 
  });
  console.log('  ✅ FINAL-mcp-tools.png');
  
  console.log('📸 Screenshot 2: MCPs page');
  await page.goto('http://localhost:5173/mcps');
  await page.waitForTimeout(2000);
  await page.screenshot({ 
    path: '/workspace/screenshots/FINAL-mcps.png', 
    fullPage: true 
  });
  console.log('  ✅ FINAL-mcps.png');
  
  await browser.close();
  console.log('\n✅ Screenshots finais concluídos!');
}

screenshot().catch(console.error);
