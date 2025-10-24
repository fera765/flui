/**
 * Test Script: Workflow Editor Loop Fix Validation
 * 
 * This script validates the fix for the "Maximum update depth exceeded" error
 * in the WorkflowEditor component caused by infinite re-renders.
 * 
 * Test Focus:
 * - Navigate to WorkflowEditor
 * - Monitor console for "Maximum update depth exceeded" errors
 * - Monitor ReactFlow StoreUpdater component behavior
 * - Capture detailed DevTools logs
 * - Validate that the component renders without infinite loops
 */

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const FRONTEND_URL = 'http://localhost:5173';
const SCREENSHOTS_DIR = '/workspace/screenshots';

// Ensure screenshots directory exists
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testWorkflowLoopFix() {
  console.log('🎭 Playwright Test: Workflow Editor Loop Fix Validation\n');
  console.log('='.repeat(70));
  console.log('🎯 OBJECTIVE: Validate fix for "Maximum update depth exceeded" error');
  console.log('='.repeat(70) + '\n');
  
  const browser = await chromium.launch({
    headless: true, // Run in headless mode (no GUI needed)
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  
  const page = await context.newPage();
  
  // Collect all console logs and categorize them
  const consoleLogs = [];
  const consoleErrors = [];
  const consoleWarnings = [];
  const reactFlowLogs = [];
  const maxUpdateDepthErrors = [];
  
  page.on('console', msg => {
    const text = msg.text();
    const type = msg.type();
    const timestamp = new Date().toISOString();
    
    const logEntry = { timestamp, type, text };
    consoleLogs.push(logEntry);
    
    // Categorize logs
    if (type === 'error') {
      consoleErrors.push(logEntry);
      console.log(`  🔴 [ERROR] ${text}`);
      
      // Check for "Maximum update depth exceeded"
      if (text.includes('Maximum update depth exceeded')) {
        maxUpdateDepthErrors.push(logEntry);
        console.log(`  ⚠️  ⚠️  ⚠️  CRITICAL: Maximum update depth error detected!`);
      }
    } else if (type === 'warning') {
      consoleWarnings.push(logEntry);
      console.log(`  🟡 [WARNING] ${text}`);
    } else if (text.includes('reactflow') || text.includes('ReactFlow') || text.includes('StoreUpdater')) {
      reactFlowLogs.push(logEntry);
      console.log(`  🔵 [REACTFLOW] ${text}`);
    } else {
      console.log(`  ⚪ [${type.toUpperCase()}] ${text}`);
    }
  });
  
  page.on('pageerror', error => {
    const errorEntry = {
      timestamp: new Date().toISOString(),
      message: error.message,
      stack: error.stack
    };
    consoleErrors.push(errorEntry);
    console.error(`  🔴 [PAGE ERROR] ${error.message}`);
    
    // Check for "Maximum update depth exceeded"
    if (error.message.includes('Maximum update depth exceeded')) {
      maxUpdateDepthErrors.push(errorEntry);
      console.log(`  ⚠️  ⚠️  ⚠️  CRITICAL: Maximum update depth error detected!`);
    }
  });
  
  try {
    console.log('\n📍 STEP 1: Loading Frontend Homepage');
    console.log('-'.repeat(70));
    await page.goto(FRONTEND_URL, { waitUntil: 'networkidle', timeout: 30000 });
    await sleep(2000);
    await page.screenshot({ 
      path: path.join(SCREENSHOTS_DIR, 'workflow-fix-01-homepage.png'), 
      fullPage: true 
    });
    console.log('  ✅ Homepage loaded successfully');
    console.log('  📸 Screenshot saved: workflow-fix-01-homepage.png\n');
    
    console.log('📍 STEP 2: Navigating to Automations Page');
    console.log('-'.repeat(70));
    await page.locator('a[href="/automations"]').click();
    await sleep(2000);
    await page.screenshot({ 
      path: path.join(SCREENSHOTS_DIR, 'workflow-fix-02-automations.png'), 
      fullPage: true 
    });
    console.log('  ✅ Automations page loaded');
    console.log('  📸 Screenshot saved: workflow-fix-02-automations.png\n');
    
    console.log('📍 STEP 3: Opening Workflow Editor (CRITICAL TEST)');
    console.log('-'.repeat(70));
    console.log('  🔍 Monitoring for infinite loop errors...');
    
    // Clear previous error counts
    const errorsBefore = consoleErrors.length;
    const maxUpdateErrorsBefore = maxUpdateDepthErrors.length;
    
    // Click "New Automation" to open Workflow Editor
    const newAutoBtn = await page.locator('button:has-text("New Automation")');
    await newAutoBtn.click();
    
    console.log('  ⏳ Waiting for WorkflowEditor to render...');
    await sleep(5000); // Give time for any errors to manifest
    
    // Take screenshot
    await page.screenshot({ 
      path: path.join(SCREENSHOTS_DIR, 'workflow-fix-03-editor-loaded.png'), 
      fullPage: true 
    });
    console.log('  📸 Screenshot saved: workflow-fix-03-editor-loaded.png');
    
    // Check if React Flow canvas is visible
    const reactFlowCanvas = await page.locator('.react-flow').count();
    console.log(`  📊 React Flow canvas visible: ${reactFlowCanvas > 0 ? '✅ YES' : '❌ NO'}`);
    
    // Check for new errors
    const errorsAfter = consoleErrors.length;
    const maxUpdateErrorsAfter = maxUpdateDepthErrors.length;
    const newErrors = errorsAfter - errorsBefore;
    const newMaxUpdateErrors = maxUpdateErrorsAfter - maxUpdateErrorsBefore;
    
    console.log(`  📊 New console errors: ${newErrors}`);
    console.log(`  📊 New "Maximum update depth" errors: ${newMaxUpdateErrors}`);
    
    if (newMaxUpdateErrors > 0) {
      console.log('  ❌ CRITICAL: Infinite loop error still present!\n');
    } else {
      console.log('  ✅ SUCCESS: No infinite loop errors detected!\n');
    }
    
    console.log('📍 STEP 4: Interacting with Workflow Editor');
    console.log('-'.repeat(70));
    
    // Try to add a node to test interaction
    const addNodeBtn = await page.locator('button[data-testid="add-node-button"]');
    if (await addNodeBtn.count() > 0) {
      console.log('  🔘 Clicking "Add Node" button...');
      await addNodeBtn.click();
      await sleep(2000);
      
      await page.screenshot({ 
        path: path.join(SCREENSHOTS_DIR, 'workflow-fix-04-add-node-modal.png'), 
        fullPage: true 
      });
      console.log('  ✅ Add Node modal opened');
      console.log('  📸 Screenshot saved: workflow-fix-04-add-node-modal.png');
      
      // Close modal
      const closeBtn = await page.locator('button:has-text("Cancel"), button[aria-label="Close"]').first();
      if (await closeBtn.count() > 0) {
        await closeBtn.click();
        await sleep(1000);
        console.log('  ✅ Modal closed\n');
      }
    } else {
      console.log('  ⚠️  Add Node button not found\n');
    }
    
    console.log('📍 STEP 5: Monitoring React Component Behavior');
    console.log('-'.repeat(70));
    
    // Monitor for a few more seconds to catch any delayed errors
    console.log('  ⏳ Monitoring for 10 seconds...');
    for (let i = 1; i <= 10; i++) {
      await sleep(1000);
      const currentErrors = maxUpdateDepthErrors.length;
      if (currentErrors > maxUpdateErrorsAfter) {
        console.log(`  ❌ New infinite loop error detected at ${i}s!`);
      }
      process.stdout.write(`  ⏱️  ${i}s... `);
      if (i % 5 === 0) console.log('');
    }
    console.log('\n  ✅ Monitoring complete\n');
    
    // Final screenshot
    await page.screenshot({ 
      path: path.join(SCREENSHOTS_DIR, 'workflow-fix-05-final.png'), 
      fullPage: true 
    });
    console.log('  📸 Screenshot saved: workflow-fix-05-final.png\n');
    
    // Generate comprehensive report
    console.log('\n' + '='.repeat(70));
    console.log('📊 TEST RESULTS SUMMARY');
    console.log('='.repeat(70));
    
    const testPassed = maxUpdateDepthErrors.length === 0;
    
    console.log(`\n🎯 PRIMARY OBJECTIVE: Fix "Maximum update depth exceeded" error`);
    console.log(`   Status: ${testPassed ? '✅ PASSED' : '❌ FAILED'}\n`);
    
    console.log('📈 DETAILED METRICS:');
    console.log(`   Total Console Logs: ${consoleLogs.length}`);
    console.log(`   Total Errors: ${consoleErrors.length}`);
    console.log(`   Total Warnings: ${consoleWarnings.length}`);
    console.log(`   ReactFlow Related Logs: ${reactFlowLogs.length}`);
    console.log(`   "Maximum update depth" Errors: ${maxUpdateDepthErrors.length} ${maxUpdateDepthErrors.length === 0 ? '✅' : '❌'}`);
    console.log(`   React Flow Canvas Visible: ${reactFlowCanvas > 0 ? 'YES ✅' : 'NO ❌'}\n`);
    
    if (maxUpdateDepthErrors.length > 0) {
      console.log('🔴 INFINITE LOOP ERRORS DETECTED:');
      console.log('-'.repeat(70));
      maxUpdateDepthErrors.forEach((err, i) => {
        console.log(`\n  Error ${i + 1}:`);
        console.log(`  Timestamp: ${err.timestamp}`);
        console.log(`  Message: ${err.message || err.text}`);
        if (err.stack) {
          console.log(`  Stack: ${err.stack.substring(0, 200)}...`);
        }
      });
      console.log('');
    }
    
    if (consoleWarnings.length > 0) {
      console.log('🟡 WARNINGS DETECTED:');
      console.log('-'.repeat(70));
      const uniqueWarnings = [...new Set(consoleWarnings.map(w => w.text))];
      uniqueWarnings.forEach((warning, i) => {
        console.log(`  ${i + 1}. ${warning}`);
      });
      console.log('');
    }
    
    // Save detailed JSON report
    const report = {
      testName: 'Workflow Editor Loop Fix Validation',
      timestamp: new Date().toISOString(),
      testPassed,
      metrics: {
        totalConsoleLogs: consoleLogs.length,
        totalErrors: consoleErrors.length,
        totalWarnings: consoleWarnings.length,
        reactFlowLogs: reactFlowLogs.length,
        maxUpdateDepthErrors: maxUpdateDepthErrors.length,
        reactFlowCanvasVisible: reactFlowCanvas > 0
      },
      consoleLogs,
      consoleErrors,
      consoleWarnings,
      reactFlowLogs,
      maxUpdateDepthErrors,
      screenshots: [
        'workflow-fix-01-homepage.png',
        'workflow-fix-02-automations.png',
        'workflow-fix-03-editor-loaded.png',
        'workflow-fix-04-add-node-modal.png',
        'workflow-fix-05-final.png'
      ]
    };
    
    const reportPath = path.join(SCREENSHOTS_DIR, 'workflow-loop-fix-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`📄 Detailed JSON report saved: ${reportPath}\n`);
    
    console.log('='.repeat(70));
    console.log(`\n🏁 TEST CONCLUSION: ${testPassed ? '✅ FIX VALIDATED SUCCESSFULLY' : '❌ FIX NEEDS REVISION'}\n`);
    
    if (!testPassed) {
      throw new Error('Infinite loop error still present - fix needs revision');
    }
    
  } catch (error) {
    console.error('\n❌ TEST EXECUTION FAILED:', error.message);
    await page.screenshot({ 
      path: path.join(SCREENSHOTS_DIR, 'workflow-fix-error.png'), 
      fullPage: true 
    });
    console.log('  📸 Error screenshot saved: workflow-fix-error.png\n');
    throw error;
  } finally {
    console.log('🔚 Closing browser...\n');
    await browser.close();
  }
}

// Run the test
testWorkflowLoopFix()
  .then(() => {
    console.log('🎉 Test completed successfully!\n');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Test failed:', error.message);
    process.exit(1);
  });
