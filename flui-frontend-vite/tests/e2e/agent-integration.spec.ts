import { test, expect } from '@playwright/test';

/**
 * E2E Integration Tests: Agent Creation and Editing
 * 
 * These tests validate the complete flow of:
 * 1. Creating an agent
 * 2. Adding it to an automation
 * 3. Editing the agent configuration
 * 4. Verifying the fix for "Node não encontrado" error
 */

const API_BASE_URL = 'http://localhost:3001/api';

test.describe('Agent Integration Tests', () => {
  let agentId: string;
  let automationId: string;

  test.beforeAll(async ({ request }) => {
    // Verify backend is running
    const response = await request.get(`${API_BASE_URL}/automations`);
    expect(response.ok()).toBeTruthy();
  });

  test('should create a new agent', async ({ page }) => {
    await page.goto('/agents');
    
    // Wait for page to load
    await page.waitForSelector('text=Agentes', { timeout: 10000 });
    
    // Click "New Agent" button
    await page.click('button:has-text("Novo Agente"), button:has-text("Create Agent")');
    
    // Fill agent form
    await page.fill('input[name="name"], input[placeholder*="nome" i]', 'Agente Teste E2E');
    await page.fill('textarea[name="systemPrompt"], textarea[placeholder*="prompt" i]', 'Você é um assistente de testes E2E');
    
    // Select model
    const modelSelect = page.locator('select[name="model"], select').first();
    await modelSelect.selectOption({ label: /gpt-4/i });
    
    // Save agent
    await page.click('button:has-text("Salvar"), button:has-text("Save")');
    
    // Wait for success message or redirect
    await page.waitForTimeout(2000);
    
    // Verify we're back on the agents list page
    await expect(page.locator('text=Agente Teste E2E').first()).toBeVisible({ timeout: 10000 });
    
    // Extract agent ID from the page or API
    const agentsResponse = await page.request.get(`${API_BASE_URL}/agents`);
    const agents = await agentsResponse.json();
    const createdAgent = agents.find((a: any) => a.name === 'Agente Teste E2E');
    expect(createdAgent).toBeDefined();
    agentId = createdAgent.id;
    
    console.log('✅ Agent created with ID:', agentId);
  });

  test('should create automation with the agent', async ({ page }) => {
    await page.goto('/automations/create');
    
    // Wait for canvas to load
    await page.waitForSelector('text=Adicionar Ferramenta, text=Add Tool', { timeout: 10000 });
    
    // Set automation name
    await page.fill('input[placeholder*="nome" i], input[placeholder*="name" i]', 'Automação Teste E2E');
    
    // Click "Add Tool" button
    await page.click('button:has-text("Adicionar Ferramenta"), button:has-text("Add Tool")');
    
    // Wait for tool selection modal
    await page.waitForSelector('text=Agentes, text=Agents', { timeout: 10000 });
    
    // Click on Agents tab
    await page.click('button:has-text("Agentes"), button:has-text("Agents")');
    
    // Wait for agent to appear
    await expect(page.locator('text=Agente Teste E2E').first()).toBeVisible({ timeout: 10000 });
    
    // Click on the agent to add it
    await page.click('text=Agente Teste E2E');
    
    // Wait for node to appear on canvas
    await page.waitForTimeout(1000);
    
    // Verify node is on canvas
    await expect(page.locator('text=Agente Teste E2E').first()).toBeVisible();
    
    // Save automation
    await page.click('button:has-text("Salvar"), button:has-text("Save")');
    
    // Wait for save to complete
    await page.waitForTimeout(2000);
    
    // Get automation ID from URL or API
    const automationsResponse = await page.request.get(`${API_BASE_URL}/automations`);
    const automations = await automationsResponse.json();
    const createdAutomation = automations.find((a: any) => a.name === 'Automação Teste E2E');
    expect(createdAutomation).toBeDefined();
    automationId = createdAutomation.id;
    
    console.log('✅ Automation created with ID:', automationId);
  });

  test('should edit agent node configuration without "Node não encontrado" error', async ({ page }) => {
    // Navigate to automation editor
    await page.goto(`/automations/edit/${automationId}`);
    
    // Wait for canvas to load
    await page.waitForSelector('text=Agente Teste E2E', { timeout: 10000 });
    
    // Find and click on the agent node to configure it
    const agentNode = page.locator('text=Agente Teste E2E').first();
    await agentNode.click();
    
    // Look for configure button (might be a settings icon or gear icon)
    // Try multiple selectors as the UI might vary
    const configButtons = [
      'button[title*="configurar" i]',
      'button[title*="config" i]',
      'button[aria-label*="config" i]',
      'button:has-text("⚙")',
      'button:has-text("Configurar")',
    ];
    
    let clicked = false;
    for (const selector of configButtons) {
      try {
        await page.click(selector, { timeout: 2000 });
        clicked = true;
        break;
      } catch (e) {
        // Try next selector
      }
    }
    
    // If no button found, try double-clicking the node
    if (!clicked) {
      await agentNode.dblclick();
    }
    
    // Wait for configuration modal to open
    await page.waitForSelector('text=Configurar, text=Configure', { timeout: 10000 });
    
    // 🔥 CRITICAL: Verify that the error "Node não encontrado" does NOT appear
    const errorText = page.locator('text=Node não encontrado, text=Node not found');
    await expect(errorText).not.toBeVisible({ timeout: 5000 });
    
    // Verify the modal loaded successfully with agent fields
    await expect(page.locator('text=prompt, input[name="prompt"]').first()).toBeVisible({ timeout: 5000 });
    
    // Fill in the prompt field
    await page.fill('textarea[name="prompt"], textarea[placeholder*="prompt" i]', 'Olá, este é um teste E2E!');
    
    // Save configuration
    await page.click('button:has-text("Salvar"), button:has-text("Save")');
    
    // Wait for modal to close
    await page.waitForTimeout(1000);
    
    // Verify modal is closed
    await expect(page.locator('text=Configurar Nó, text=Configure Node')).not.toBeVisible();
    
    console.log('✅ Agent configuration edited successfully without errors!');
  });

  test('should edit condition node configuration', async ({ page }) => {
    // Navigate to automation editor
    await page.goto(`/automations/edit/${automationId}`);
    
    // Wait for canvas to load
    await page.waitForTimeout(2000);
    
    // Add a condition node
    await page.click('button:has-text("Adicionar Ferramenta"), button:has-text("Add Tool")');
    
    // Wait for tool selection modal
    await page.waitForSelector('text=Ferramentas, text=Tools', { timeout: 10000 });
    
    // Search for condition tool
    const searchInput = page.locator('input[placeholder*="search" i], input[placeholder*="buscar" i]').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill('condition');
    }
    
    // Click on Condition Flex tool
    await page.click('text=Condition Flex, text=condition-flex');
    
    // Wait for node to appear
    await page.waitForTimeout(1000);
    
    // Click on the condition node to configure it
    const conditionNode = page.locator('text=Condition Flex, text=condition-flex').first();
    await conditionNode.click();
    
    // Try to open configuration
    try {
      await page.click('button[title*="configurar" i]', { timeout: 2000 });
    } catch {
      await conditionNode.dblclick();
    }
    
    // Wait for configuration modal
    await page.waitForSelector('text=Configurar, text=Configure', { timeout: 10000 });
    
    // 🔥 CRITICAL: Verify that the error "Node não encontrado" does NOT appear
    const errorText = page.locator('text=Node não encontrado, text=Node not found');
    await expect(errorText).not.toBeVisible({ timeout: 5000 });
    
    // Verify condition fields are visible
    await expect(page.locator('input[name="value"], text=value').first()).toBeVisible({ timeout: 5000 });
    
    console.log('✅ Condition configuration opened successfully without errors!');
    
    // Close modal
    await page.click('button:has-text("Cancelar"), button:has-text("Cancel")');
  });

  test.afterAll(async ({ request }) => {
    // Cleanup: Delete test data
    if (automationId) {
      await request.delete(`${API_BASE_URL}/automations/${automationId}`);
      console.log('🧹 Deleted test automation');
    }
    
    if (agentId) {
      await request.delete(`${API_BASE_URL}/agents/${agentId}`);
      console.log('🧹 Deleted test agent');
    }
  });
});
