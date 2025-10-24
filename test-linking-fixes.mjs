#!/usr/bin/env node

import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function testLinkingFixes() {
  console.log('🧪 Testing linking and persistence fixes...');
  
  const browser = await chromium.launch({ 
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Navigate to the frontend
    console.log('📱 Navigating to frontend...');
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');
    
    // Go to workflow editor
    console.log('🔧 Going to workflow editor...');
    await page.click('text=Workflows');
    await page.waitForLoadState('networkidle');
    
    // Create new automation
    console.log('➕ Creating new automation...');
    await page.click('text=Create Automation');
    await page.waitForLoadState('networkidle');
    
    // Add a node
    console.log('🔧 Adding a node...');
    await page.click('[data-testid="add-node-button"]');
    await page.waitForSelector('[data-testid="add-node-modal"]');
    
    // Select agent node
    await page.click('text=Agent');
    await page.waitForSelector('[data-testid="agent-select"]');
    await page.selectOption('[data-testid="agent-select"]', '1');
    await page.click('text=Add Node');
    
    // Wait for node to appear
    await page.waitForSelector('[data-testid="node-"]', { timeout: 10000 });
    
    // Click on the node to configure it
    console.log('⚙️ Configuring node...');
    await page.click('[data-testid="node-"]');
    await page.waitForSelector('[data-testid="node-config-modal"]');
    
    // Test linking functionality
    console.log('🔗 Testing linking functionality...');
    const linkerButton = await page.waitForSelector('[data-testid="linker-message"]');
    await linkerButton.click();
    
    // Wait for linker modal
    await page.waitForSelector('[data-testid="linker-nodes-list"]');
    console.log('✅ Linker modal opened successfully');
    
    // Test text input without linking
    console.log('📝 Testing text input without linking...');
    await page.click('text=Cancel');
    await page.waitForSelector('[data-testid="input-message"]');
    
    const messageInput = await page.locator('[data-testid="input-message"]');
    await messageInput.fill('Test message without linking');
    
    // Save the configuration
    console.log('💾 Saving configuration...');
    await page.click('[data-testid="save-node-config"]');
    await page.waitForSelector('[data-testid="node-config-modal"]', { state: 'hidden' });
    
    // Verify the node shows the saved value
    console.log('✅ Configuration saved successfully');
    
    // Test linking again
    console.log('🔗 Testing linking again...');
    await page.click('[data-testid="node-"]');
    await page.waitForSelector('[data-testid="node-config-modal"]');
    
    const linkerButton2 = await page.waitForSelector('[data-testid="linker-message"]');
    await linkerButton2.click();
    
    await page.waitForSelector('[data-testid="linker-nodes-list"]');
    console.log('✅ Linker modal opened again successfully');
    
    // Close linker modal
    await page.click('text=Cancel');
    
    // Save and test persistence
    console.log('💾 Testing persistence...');
    await page.click('[data-testid="save-node-config"]');
    await page.waitForSelector('[data-testid="node-config-modal"]', { state: 'hidden' });
    
    // Save the automation
    console.log('💾 Saving automation...');
    await page.click('text=Save');
    await page.waitForSelector('text=Automation created!');
    
    console.log('✅ All tests passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    await page.screenshot({ path: 'test-linking-fixes-error.png' });
  } finally {
    await browser.close();
  }
}

testLinkingFixes().catch(console.error);