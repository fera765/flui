/**
 * Test: Settings Page Validation
 * 
 * Valida que a página de Settings está funcionando corretamente:
 * - Endpoint configurável
 * - Carregamento de modelos do LLM7
 * - Select dropdown funcional
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

async function testSettingsPage() {
  console.log('🎭 Playwright Test: Settings Page Validation\n');
  console.log('='.repeat(70));
  console.log('🎯 OBJECTIVE: Validate Settings page is working correctly');
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
  const testResults = [];
  
  page.on('console', msg => {
    const text = msg.text();
    consoleLogs.push({ type: msg.type(), text, timestamp: new Date().toISOString() });
  });
  
  try {
    // ========================================================================
    // TEST: Settings Page
    // ========================================================================
    console.log('📍 TEST: Settings Page Load and Functionality');
    console.log('-'.repeat(70));
    
    await page.goto(FRONTEND_URL, { waitUntil: 'networkidle', timeout: 30000 });
    await sleep(2000);
    
    // Navigate to Settings
    console.log('  📍 Navigating to Settings...');
    await page.click('a[href="/settings"]');
    await sleep(3000); // Wait for page and models to load
    
    await page.screenshot({ 
      path: path.join(SCREENSHOTS_DIR, 'settings-page-loaded.png'), 
      fullPage: true 
    });
    console.log('  ✅ Settings page loaded');
    
    // Check if "Coming soon" text exists (should NOT exist)
    const comingSoonExists = await page.locator('text=/coming soon/i').count();
    const noComingSoon = comingSoonExists === 0;
    console.log(`  📊 No "Coming soon" placeholder: ${noComingSoon ? '✅' : '❌'}`);
    testResults.push({ name: 'Settings: No placeholder', passed: noComingSoon });
    
    // Check if page title exists
    const titleExists = await page.locator('h1:has-text("Configurações")').count() > 0 ||
                        await page.locator('h1:has-text("Settings")').count() > 0;
    console.log(`  📊 Settings title exists: ${titleExists ? '✅' : '❌'}`);
    testResults.push({ name: 'Settings: Title Present', passed: titleExists });
    
    // Check for LLM Configuration section
    const llmConfigExists = await page.locator('text=/Configuração LLM/i, text=/LLM Configuration/i').count() > 0;
    console.log(`  📊 LLM Configuration section: ${llmConfigExists ? '✅' : '❌'}`);
    testResults.push({ name: 'Settings: LLM Config Section', passed: llmConfigExists });
    
    // Check for input fields
    console.log('\n  🔍 Checking for form fields...');
    await sleep(2000); // Extra wait for React Hook Form
    
    // Try multiple selectors for inputs
    const allInputs = await page.locator('input[type="text"], input[type="url"], input[type="password"], input[type="number"]').count();
    console.log(`  📊 Total input fields: ${allInputs}`);
    const hasInputs = allInputs >= 4; // endpoint, apiKey, temperature, maxTokens
    console.log(`  📊 Required input fields present: ${hasInputs ? '✅' : '❌'}`);
    testResults.push({ name: 'Settings: Input Fields', passed: hasInputs });
    
    // Check for model select or input
    const modelSelect = await page.locator('select').count();
    const modelInput = await page.locator('input[placeholder*="model" i], input[placeholder*="modelo" i]').count();
    const hasModelField = modelSelect > 0 || modelInput > 0;
    console.log(`  📊 Model select/input exists: ${hasModelField ? '✅' : '❌'}`);
    console.log(`    → Selects: ${modelSelect}, Inputs: ${modelInput}`);
    testResults.push({ name: 'Settings: Model Field', passed: hasModelField });
    
    // If select exists, check for models
    if (modelSelect > 0) {
      await sleep(2000); // Wait for models to load from API
      const options = await page.locator('select option').count();
      console.log(`  📊 Models in dropdown: ${options}`);
      const hasModels = options > 0;
      console.log(`  📊 Models loaded: ${hasModels ? '✅' : '❌'}`);
      testResults.push({ name: 'Settings: Models Loaded', passed: hasModels });
      
      if (hasModels) {
        // Get first 3 models
        const modelTexts = [];
        for (let i = 0; i < Math.min(3, options); i++) {
          const text = await page.locator('select option').nth(i).textContent();
          modelTexts.push(text);
        }
        console.log(`  📊 Sample models: ${modelTexts.join(', ')}`);
        
        // Check if LLM7 models are present
        const allModelsText = modelTexts.join(' ');
        const hasLLM7Models = allModelsText.includes('deepseek') || 
                             allModelsText.includes('gemini') || 
                             allModelsText.includes('gpt-5');
        console.log(`  📊 LLM7 models detected: ${hasLLM7Models ? '✅' : '⚠️'}`);
        testResults.push({ name: 'Settings: LLM7 Models', passed: hasLLM7Models });
      }
    }
    
    // Check for Save button
    const saveButton = await page.locator('button:has-text("Salvar"), button:has-text("Save")').count();
    console.log(`  📊 Save button exists: ${saveButton > 0 ? '✅' : '❌'}`);
    testResults.push({ name: 'Settings: Save Button', passed: saveButton > 0 });
    
    // Check for Test button
    const testButton = await page.locator('button:has-text("Testar"), button:has-text("Test")').count();
    console.log(`  📊 Test connection button: ${testButton > 0 ? '✅' : '❌'}`);
    testResults.push({ name: 'Settings: Test Button', passed: testButton > 0 });
    
    await page.screenshot({ 
      path: path.join(SCREENSHOTS_DIR, 'settings-page-complete.png'), 
      fullPage: true 
    });
    console.log('  ✅ TEST COMPLETED\n');
    
    // ========================================================================
    // FINAL SUMMARY
    // ========================================================================
    console.log('\n' + '='.repeat(70));
    console.log('📊 TEST RESULTS SUMMARY');
    console.log('='.repeat(70) + '\n');
    
    const totalTests = testResults.length;
    const passedTests = testResults.filter(t => t.passed).length;
    const failedTests = totalTests - passedTests;
    const successRate = ((passedTests / totalTests) * 100).toFixed(1);
    
    console.log(`Total Tests: ${totalTests}`);
    console.log(`Passed: ${passedTests} ✅`);
    console.log(`Failed: ${failedTests} ${failedTests > 0 ? '❌' : '✅'}`);
    console.log(`Success Rate: ${successRate}%\n`);
    
    console.log('DETAILED RESULTS:');
    console.log('-'.repeat(70));
    testResults.forEach((test, idx) => {
      const status = test.passed ? '✅ PASS' : '❌ FAIL';
      console.log(`  ${idx + 1}. ${test.name}: ${status}`);
    });
    console.log('');
    
    // Save report
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalTests,
        passedTests,
        failedTests,
        successRate: parseFloat(successRate),
      },
      tests: testResults,
      consoleLogs,
      screenshots: [
        'settings-page-loaded.png',
        'settings-page-complete.png',
      ],
    };
    
    const reportPath = path.join(SCREENSHOTS_DIR, 'settings-page-test-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`📄 Report saved: ${reportPath}\n`);
    
    console.log('='.repeat(70));
    const overallSuccess = failedTests === 0;
    console.log(`\n🏁 FINAL RESULT: ${overallSuccess ? '✅ ALL TESTS PASSED' : '⚠️  SOME TESTS FAILED'}\n`);
    
    if (!overallSuccess && failedTests > 0) {
      throw new Error(`${failedTests} test(s) failed`);
    }
    
  } catch (error) {
    console.error('\n❌ TEST EXECUTION FAILED:', error.message);
    await page.screenshot({ 
      path: path.join(SCREENSHOTS_DIR, 'settings-test-error.png'), 
      fullPage: true 
    });
    console.log('  📸 Error screenshot saved\n');
    throw error;
  } finally {
    console.log('🔚 Closing browser...\n');
    await browser.close();
  }
}

// Run test
testSettingsPage()
  .then(() => {
    console.log('🎉 Settings page test completed successfully!\n');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Test failed:', error.message);
    process.exit(1);
  });
