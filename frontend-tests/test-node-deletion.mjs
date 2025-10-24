/**
 * Test: Node Deletion Focused Test
 * 
 * Testa especificamente a deleção de nós
 */

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const FRONTEND_URL = 'http://localhost:5173';
const SCREENSHOTS_DIR = '/workspace/screenshots';

if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testNodeDeletion() {
  console.log('🎭 Playwright Test: Node Deletion\n');
  console.log('='.repeat(70));
  
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  
  const page = await context.newPage();
  
  const consoleLogs = [];
  
  page.on('console', msg => {
    const text = msg.text();
    consoleLogs.push(text);
    
    if (text.includes('Deleting node') || text.includes('deleted')) {
      console.log(`  📝 ${text}`);
    }
  });
  
  try {
    await page.goto(FRONTEND_URL, { waitUntil: 'networkidle', timeout: 30000 });
    await sleep(2000);
    
    console.log('\n📍 Opening WorkflowEditor');
    await page.click('a[href="/automations"]');
    await sleep(2000);
    await page.click('button:has-text("New Automation")');
    await sleep(3000);
    
    console.log('\n📍 Adding nodes to test deletion');
    
    // Add 3 nodes using keyboard and force
    for (let i = 1; i <= 3; i++) {
      console.log(`  Adding node ${i}...`);
      
      // Close any open modals first
      await page.keyboard.press('Escape');
      await sleep(500);
      
      const addBtn = await page.locator('button[data-testid="add-node-button"]');
      await addBtn.click({ force: true });
      await sleep(1000);
      
      // Select first available item (any tab)
      const firstItem = await page.locator('button[data-testid^="node-item-"]').first();
      if (await firstItem.count() > 0) {
        await firstItem.click({ force: true });
        await sleep(1500);
        console.log(`  ✅ Node ${i} added`);
      }
    }
    
    await page.screenshot({ 
      path: path.join(SCREENSHOTS_DIR, 'deletion-01-nodes-added.png'), 
      fullPage: true 
    });
    
    const nodeCount = await page.locator('.react-flow__node').count();
    console.log(`\n📊 Nodes on canvas: ${nodeCount}`);
    
    // Try deletion using different methods
    console.log('\n📍 Testing deletion methods');
    
    // Method 1: Click delete button with force
    console.log('  Method 1: Click delete button (force)');
    const deleteBtn = await page.locator('button[data-testid="node-delete-button"]').first();
    if (await deleteBtn.count() > 0) {
      await deleteBtn.click({ force: true });
      await sleep(2000);
      
      const afterDelete1 = await page.locator('.react-flow__node').count();
      console.log(`  📊 After force click: ${afterDelete1} nodes (was ${nodeCount})`);
      
      await page.screenshot({ 
        path: path.join(SCREENSHOTS_DIR, 'deletion-02-after-click.png'), 
        fullPage: true 
      });
    }
    
    // Method 2: Select node and press Delete key
    console.log('\n  Method 2: Select node and press Delete key');
    const node = await page.locator('.react-flow__node').first();
    if (await node.count() > 0) {
      await node.click({ force: true });
      await sleep(500);
      await page.keyboard.press('Delete');
      await sleep(2000);
      
      const afterDelete2 = await page.locator('.react-flow__node').count();
      console.log(`  📊 After Delete key: ${afterDelete2} nodes`);
      
      await page.screenshot({ 
        path: path.join(SCREENSHOTS_DIR, 'deletion-03-after-delete-key.png'), 
        fullPage: true 
      });
    }
    
    console.log('\n📊 DELETION TEST RESULTS:');
    console.log(`  Initial nodes: ${nodeCount}`);
    const finalCount = await page.locator('.react-flow__node').count();
    console.log(`  Final nodes: ${finalCount}`);
    console.log(`  Deletion working: ${finalCount < nodeCount ? '✅ YES' : '❌ NO'}\n`);
    
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    await page.screenshot({ 
      path: path.join(SCREENSHOTS_DIR, 'deletion-error.png'), 
      fullPage: true 
    });
  } finally {
    await browser.close();
  }
}

testNodeDeletion()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
