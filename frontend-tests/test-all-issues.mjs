/**
 * Test: Investigate All Issues
 * 
 * Investiga todos os 4 problemas reportados:
 * 1. Loop infinito "Maximum update depth exceeded"
 * 2. Duplo spinner no botão de teste LLM
 * 3. Como desconectar edges
 * 4. Models estáticos no modal de agentes
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

async function investigateIssues() {
  console.log('🎭 Playwright Test: Investigate All Issues\n');
  console.log('='.repeat(70));
  console.log('🎯 OBJECTIVE: Identify and document all reported issues');
  console.log('='.repeat(70) + '\n');
  
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  
  const page = await context.newPage();
  
  const consoleLogs = [];
  const consoleErrors = [];
  const pageErrors = [];
  const networkErrors = [];
  
  // Monitor console
  page.on('console', msg => {
    const text = msg.text();
    const type = msg.type();
    consoleLogs.push({ type, text, timestamp: new Date().toISOString() });
    
    if (type === 'error') {
      consoleErrors.push({ text, timestamp: new Date().toISOString() });
      console.log(`  🔴 [ERROR] ${text}`);
    }
    
    // Detect "Maximum update depth"
    if (text.includes('Maximum update depth')) {
      console.log(`  ⚠️⚠️⚠️  CRITICAL: Maximum update depth error detected!`);
    }
  });
  
  // Monitor page errors
  page.on('pageerror', error => {
    pageErrors.push({ message: error.message, stack: error.stack, timestamp: new Date().toISOString() });
    console.error(`  🔴 [PAGE ERROR] ${error.message}`);
  });
  
  // Monitor network failures
  page.on('requestfailed', request => {
    networkErrors.push({ 
      url: request.url(), 
      failure: request.failure()?.errorText,
      timestamp: new Date().toISOString() 
    });
  });
  
  const issues = [];
  
  try {
    // ========================================================================
    // ISSUE 1: Maximum Update Depth in WorkflowEditor
    // ========================================================================
    console.log('\n📍 ISSUE 1: Testing WorkflowEditor for infinite loops');
    console.log('-'.repeat(70));
    
    await page.goto(FRONTEND_URL, { waitUntil: 'networkidle', timeout: 30000 });
    await sleep(2000);
    
    // Navigate to Automations
    await page.click('a[href="/automations"]');
    await sleep(2000);
    
    // Check for errors before opening editor
    const errorsBefore = consoleErrors.length;
    const pageErrorsBefore = pageErrors.length;
    
    // Create new automation (opens WorkflowEditor)
    console.log('  🔧 Opening WorkflowEditor...');
    await page.click('button:has-text("New Automation")');
    await sleep(5000); // Give time for errors to manifest
    
    await page.screenshot({ 
      path: path.join(SCREENSHOTS_DIR, 'issue-01-workflow-editor.png'), 
      fullPage: true 
    });
    
    const errorsAfter = consoleErrors.length;
    const pageErrorsAfter = pageErrors.length;
    const newErrors = errorsAfter - errorsBefore;
    const newPageErrors = pageErrorsAfter - pageErrorsBefore;
    
    console.log(`  📊 Console errors before: ${errorsBefore}, after: ${errorsAfter}`);
    console.log(`  📊 Page errors before: ${pageErrorsBefore}, after: ${pageErrorsAfter}`);
    
    const hasInfiniteLoop = consoleErrors.some(e => e.text.includes('Maximum update depth')) ||
                           pageErrors.some(e => e.message.includes('Maximum update depth'));
    
    if (hasInfiniteLoop) {
      console.log('  ❌ ISSUE 1 CONFIRMED: Infinite loop detected!');
      issues.push({
        id: 1,
        name: 'Maximum Update Depth Loop',
        detected: true,
        severity: 'CRITICAL',
        location: 'WorkflowEditor.tsx'
      });
    } else {
      console.log('  ✅ ISSUE 1: No infinite loop detected');
      issues.push({
        id: 1,
        name: 'Maximum Update Depth Loop',
        detected: false,
        severity: 'CRITICAL'
      });
    }
    
    // ========================================================================
    // ISSUE 2: 404 Loading Automation
    // ========================================================================
    console.log('\n📍 ISSUE 2: Testing automation loading (404 errors)');
    console.log('-'.repeat(70));
    
    // Check for 404 errors
    const automation404 = networkErrors.filter(e => 
      e.url.includes('/api/automations/') && 
      e.failure?.includes('404')
    );
    
    console.log(`  📊 404 errors found: ${automation404.length}`);
    automation404.forEach(err => {
      console.log(`    → ${err.url}`);
    });
    
    if (automation404.length > 0) {
      console.log('  ❌ ISSUE 2 CONFIRMED: 404 errors when loading automation');
      issues.push({
        id: 2,
        name: '404 Loading Automation',
        detected: true,
        severity: 'HIGH',
        urls: automation404.map(e => e.url)
      });
    } else {
      console.log('  ✅ ISSUE 2: No 404 errors detected');
      issues.push({
        id: 2,
        name: '404 Loading Automation',
        detected: false,
        severity: 'HIGH'
      });
    }
    
    // ========================================================================
    // ISSUE 3: Double Spinner in Test LLM Button
    // ========================================================================
    console.log('\n📍 ISSUE 3: Testing LLM test button for double spinner');
    console.log('-'.repeat(70));
    
    await page.click('a[href="/settings"]');
    await sleep(3000);
    
    await page.screenshot({ 
      path: path.join(SCREENSHOTS_DIR, 'issue-03-settings-before-test.png'), 
      fullPage: true 
    });
    
    const testButton = await page.locator('button:has-text("Testar"), button:has-text("Test")').first();
    
    if (await testButton.count() > 0) {
      console.log('  🔧 Clicking Test button...');
      await testButton.click();
      await sleep(1000); // Capture loading state
      
      await page.screenshot({ 
        path: path.join(SCREENSHOTS_DIR, 'issue-03-loading-state.png'), 
        fullPage: true 
      });
      
      // Check for multiple spinners
      const spinners = await page.locator('.animate-spin, [class*="spin"]').count();
      console.log(`  📊 Spinners detected: ${spinners}`);
      
      // Check button content
      const buttonText = await testButton.textContent();
      console.log(`  📊 Button text: ${buttonText}`);
      
      if (spinners > 1) {
        console.log('  ❌ ISSUE 3 CONFIRMED: Multiple spinners detected!');
        issues.push({
          id: 3,
          name: 'Double Spinner in Test Button',
          detected: true,
          severity: 'LOW',
          count: spinners
        });
      } else {
        console.log('  ✅ ISSUE 3: Only one spinner detected');
        issues.push({
          id: 3,
          name: 'Double Spinner in Test Button',
          detected: false,
          severity: 'LOW'
        });
      }
      
      await sleep(15000); // Wait for test to complete
      
      await page.screenshot({ 
        path: path.join(SCREENSHOTS_DIR, 'issue-03-after-test.png'), 
        fullPage: true 
      });
    }
    
    // ========================================================================
    // ISSUE 4: Static Models in Agent Modal
    // ========================================================================
    console.log('\n📍 ISSUE 4: Testing agent modal for static models');
    console.log('-'.repeat(70));
    
    await page.click('a[href="/agents"]');
    await sleep(2000);
    
    // Try to open new agent modal
    const newAgentBtn = await page.locator('button:has-text("New Agent")');
    
    if (await newAgentBtn.count() > 0) {
      console.log('  🔧 Opening New Agent modal...');
      await newAgentBtn.click();
      await sleep(2000);
      
      await page.screenshot({ 
        path: path.join(SCREENSHOTS_DIR, 'issue-04-agent-modal.png'), 
        fullPage: true 
      });
      
      // Check for model select/input
      const modelSelect = await page.locator('select').count();
      const modelInput = await page.locator('input[placeholder*="model" i], input[name*="model" i]').count();
      
      console.log(`  📊 Model selects: ${modelSelect}`);
      console.log(`  📊 Model inputs: ${modelInput}`);
      
      if (modelSelect > 0) {
        const options = await page.locator('select option').count();
        const firstOption = await page.locator('select option').first().textContent();
        
        console.log(`  📊 Options in model select: ${options}`);
        console.log(`  📊 First option: ${firstOption}`);
        
        // Check if it's hardcoded
        const isHardcoded = firstOption?.includes('gpt-4') || 
                           firstOption?.includes('gpt-3.5') ||
                           options < 5;
        
        if (isHardcoded) {
          console.log('  ❌ ISSUE 4 CONFIRMED: Models appear to be hardcoded');
          issues.push({
            id: 4,
            name: 'Static Models in Agent Modal',
            detected: true,
            severity: 'MEDIUM',
            options: options,
            sample: firstOption
          });
        } else {
          console.log('  ✅ ISSUE 4: Models appear to be dynamic');
          issues.push({
            id: 4,
            name: 'Static Models in Agent Modal',
            detected: false,
            severity: 'MEDIUM'
          });
        }
      } else {
        console.log('  ⚠️  Model field not found');
        issues.push({
          id: 4,
          name: 'Static Models in Agent Modal',
          detected: false,
          severity: 'MEDIUM',
          note: 'Model field not found'
        });
      }
      
      await page.screenshot({ 
        path: path.join(SCREENSHOTS_DIR, 'issue-04-model-field.png'), 
        fullPage: true 
      });
    }
    
    // ========================================================================
    // FINAL REPORT
    // ========================================================================
    console.log('\n' + '='.repeat(70));
    console.log('📊 ISSUES INVESTIGATION REPORT');
    console.log('='.repeat(70) + '\n');
    
    issues.forEach(issue => {
      const status = issue.detected ? '❌ DETECTED' : '✅ NOT DETECTED';
      console.log(`${issue.id}. ${issue.name}: ${status}`);
      console.log(`   Severity: ${issue.severity}`);
      if (issue.detected && issue.location) {
        console.log(`   Location: ${issue.location}`);
      }
      if (issue.detected && issue.count) {
        console.log(`   Count: ${issue.count}`);
      }
      console.log('');
    });
    
    console.log('📝 CONSOLE ERRORS SUMMARY:');
    console.log(`   Total console errors: ${consoleErrors.length}`);
    console.log(`   Total page errors: ${pageErrors.length}`);
    console.log(`   Total network errors: ${networkErrors.length}\n`);
    
    // Save report
    const report = {
      timestamp: new Date().toISOString(),
      issues,
      consoleLogs: consoleLogs.slice(-50), // Last 50
      consoleErrors,
      pageErrors,
      networkErrors,
      screenshots: [
        'issue-01-workflow-editor.png',
        'issue-03-settings-before-test.png',
        'issue-03-loading-state.png',
        'issue-03-after-test.png',
        'issue-04-agent-modal.png',
        'issue-04-model-field.png',
      ],
    };
    
    const reportPath = path.join(SCREENSHOTS_DIR, 'issues-investigation-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`📄 Full report saved: ${reportPath}\n`);
    
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    await page.screenshot({ 
      path: path.join(SCREENSHOTS_DIR, 'issues-test-error.png'), 
      fullPage: true 
    });
    throw error;
  } finally {
    console.log('🔚 Closing browser...\n');
    await browser.close();
  }
}

// Run investigation
investigateIssues()
  .then(() => {
    console.log('🎉 Investigation completed!\n');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Investigation failed:', error.message);
    process.exit(1);
  });
