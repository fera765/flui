#!/usr/bin/env node

/**
 * Test: Node Data Linking and Persistence
 * 
 * Tests the following scenarios:
 * 1. Node data linking - clicking on output values should link
 * 2. Node data persistence - editing text should persist
 * 3. After saving automation, configuration should still work
 */

import puppeteer from 'puppeteer'

const BASE_URL = 'http://localhost:5173'
const TIMEOUT = 30000

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function testNodeLinkingAndPersistence() {
  console.log('🚀 Starting Node Linking and Persistence Test...\n')

  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1920, height: 1080 }
  })

  try {
    const page = await browser.newPage()
    await page.goto(BASE_URL, { waitUntil: 'networkidle0' })

    console.log('✅ Page loaded')

    // Create a new automation
    await page.waitForSelector('a[href="/automations"]', { timeout: TIMEOUT })
    await page.click('a[href="/automations"]')
    await delay(1000)

    console.log('✅ Navigated to automations')

    // Click "New Automation"
    await page.waitForSelector('a[href="/automations/new/edit"]', { timeout: TIMEOUT })
    await page.click('a[href="/automations/new/edit"]')
    await delay(2000)

    console.log('✅ Created new automation')

    // Add first node (Agent)
    await page.waitForSelector('[data-testid="add-node-button"]', { timeout: TIMEOUT })
    await page.click('[data-testid="add-node-button"]')
    await delay(1000)

    // Select Agent node type
    await page.waitForSelector('button:has-text("Agent")', { timeout: TIMEOUT })
    await page.click('button:has-text("Agent")')
    await delay(500)

    // Select first agent from the list (if any)
    const agentOptions = await page.$$('[data-testid^="agent-option-"]')
    if (agentOptions.length > 0) {
      await agentOptions[0].click()
      console.log('✅ Selected agent')
    } else {
      console.log('⚠️  No agents available, skipping agent selection')
      await browser.close()
      return
    }

    await delay(2000)

    // Add second node (Tool)
    await page.click('[data-testid="add-node-button"]')
    await delay(1000)

    await page.waitForSelector('button:has-text("Tool")', { timeout: TIMEOUT })
    await page.click('button:has-text("Tool")')
    await delay(500)

    // Select first tool
    const toolOptions = await page.$$('[data-testid^="tool-option-"]')
    if (toolOptions.length > 0) {
      await toolOptions[0].click()
      console.log('✅ Added tool node')
    }

    await delay(2000)

    // TEST 1: Configure first node with text input
    console.log('\n📝 TEST 1: Text Input Persistence')
    const nodes = await page.$$('[data-testid="node-config-button"]')
    if (nodes.length > 0) {
      await nodes[0].click()
      await delay(1000)

      // Type some text
      const input = await page.$('[data-testid^="input-"]')
      if (input) {
        await input.type('This is a test message')
        console.log('✅ Entered text: "This is a test message"')
        
        // Save
        await page.click('[data-testid="save-node-config"]')
        await delay(1000)
        console.log('✅ Saved configuration')

        // Reopen and verify
        await nodes[0].click()
        await delay(1000)
        
        const savedValue = await page.$eval('[data-testid^="input-"]', el => el.value)
        if (savedValue === 'This is a test message') {
          console.log('✅ TEXT PERSISTENCE: PASSED ✓')
        } else {
          console.log(`❌ TEXT PERSISTENCE: FAILED - Expected "This is a test message", got "${savedValue}"`)
        }

        await page.click('button:has-text("Cancel")')
        await delay(1000)
      }
    }

    // TEST 2: Link output from first node to second node
    console.log('\n🔗 TEST 2: Output Linking')
    if (nodes.length > 1) {
      await nodes[1].click()
      await delay(1000)

      // Click the linker button
      const linkerButton = await page.$('[data-testid^="linker-"]')
      if (linkerButton) {
        await linkerButton.click()
        await delay(1000)
        console.log('✅ Opened linker modal')

        // Expand first node
        const firstNode = await page.$('[data-testid^="linker-node-"]')
        if (firstNode) {
          await firstNode.click()
          await delay(500)

          // Click on an output
          const outputButton = await page.$('[data-testid^="linker-output-"]')
          if (outputButton) {
            await outputButton.click()
            await delay(1000)
            console.log('✅ Selected output link')

            // Check if the input now shows the linked value
            const linkedValue = await page.$eval('[data-testid^="input-"]', el => el.value)
            if (linkedValue.includes('{{') && linkedValue.includes('}}')) {
              console.log(`✅ OUTPUT LINKING: PASSED ✓ - Value: ${linkedValue}`)
              
              // Save and verify persistence
              await page.click('[data-testid="save-node-config"]')
              await delay(1000)
              
              // Reopen and check
              await nodes[1].click()
              await delay(1000)
              
              const persistedLink = await page.$eval('[data-testid^="input-"]', el => el.value)
              if (persistedLink === linkedValue) {
                console.log('✅ LINK PERSISTENCE: PASSED ✓')
              } else {
                console.log(`❌ LINK PERSISTENCE: FAILED - Expected "${linkedValue}", got "${persistedLink}"`)
              }

              await page.click('button:has-text("Cancel")')
              await delay(1000)
            } else {
              console.log(`❌ OUTPUT LINKING: FAILED - Value is not a link: "${linkedValue}"`)
            }
          }
        }
      }
    }

    // TEST 3: Save automation and reload
    console.log('\n💾 TEST 3: Configuration After Save')
    await page.click('button:has-text("Save")')
    await delay(2000)
    console.log('✅ Saved automation')

    // Get the automation ID from URL
    const url = await page.url()
    const automationId = url.match(/automations\/([^\/]+)\/edit/)?.[1]
    
    if (automationId && automationId !== 'new') {
      console.log(`✅ Automation ID: ${automationId}`)
      
      // Reload the page
      await page.reload({ waitUntil: 'networkidle0' })
      await delay(3000)
      console.log('✅ Page reloaded')

      // Try to configure nodes again
      const reloadedNodes = await page.$$('[data-testid="node-config-button"]')
      if (reloadedNodes.length > 0) {
        await reloadedNodes[0].click()
        await delay(1000)

        // Check if input field is present and has value
        const configInput = await page.$('[data-testid^="input-"]')
        if (configInput) {
          const value = await page.evaluate(el => el.value, configInput)
          console.log(`✅ Configuration available after reload, value: "${value}"`)
          
          if (value) {
            console.log('✅ CONFIGURATION AFTER SAVE: PASSED ✓')
          } else {
            console.log('⚠️  CONFIGURATION AFTER SAVE: Field present but empty')
          }
        } else {
          console.log('❌ CONFIGURATION AFTER SAVE: FAILED - No input fields found')
        }
      } else {
        console.log('❌ CONFIGURATION AFTER SAVE: FAILED - No nodes found after reload')
      }
    }

    console.log('\n✅ All tests completed!')

  } catch (error) {
    console.error('\n❌ Test failed with error:', error.message)
    throw error
  } finally {
    await delay(3000)
    await browser.close()
  }
}

// Run the test
testNodeLinkingAndPersistence()
  .then(() => {
    console.log('\n✅ Test suite completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Test suite failed:', error)
    process.exit(1)
  })
