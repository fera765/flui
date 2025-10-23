import { test, expect, Page } from '@playwright/test';

/**
 * TESTE E2E: Persistência de Configurações de Nodes
 * 
 * Valida que:
 * 1. Configurações são salvas ao editar node
 * 2. Configurações persistem após salvar automação
 * 3. Configurações persistem após recarregar página
 * 4. Configurações persistem após executar automação
 */

const API_URL = 'http://localhost:3001/api';

test.describe('Persistência de Configurações de Nodes', () => {
  let agentId: string;
  let automationId: string;

  test.beforeAll(async () => {
    // Criar agente para testes
    const response = await fetch(`${API_URL}/agents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: `e2e-agent-${Date.now()}`,
        name: 'E2E Test Agent',
        model: 'deepseek-v3.1',
        systemPrompt: 'Assistente de teste E2E',
        temperature: 0.7,
        maxTokens: 50,
        enabled: true,
        tools: []
      })
    });
    const data = await response.json();
    agentId = data.id;
    console.log('✅ Agente criado:', agentId);
  });

  test('1. Config persiste ao editar node sem salvar automação', async ({ page }) => {
    await page.goto('/automations');
    
    // Criar nova automação
    await page.click('text=Nova Automação');
    await page.waitForURL(/\/automations\/create/);
    
    // Adicionar node
    await page.click('button:has-text("Adicionar Ferramenta")');
    await page.click('text=Agentes');
    await page.click(`text=${agentId.replace('e2e-agent-', 'E2E Test Agent')}`);
    
    // Aguardar node aparecer
    await page.waitForSelector('[data-id]', { timeout: 5000 });
    
    // Abrir configuração do node
    const node = page.locator('[data-id]').first();
    await node.click();
    
    // Preencher config
    await page.fill('input[name="prompt"]', 'Config persistente teste 1');
    await page.fill('input[name="temperature"]', '0.9');
    
    // Salvar config
    await page.click('button:has-text("Salvar")');
    
    // Reabrir modal
    await node.click();
    
    // Validar que config foi salvo
    const promptValue = await page.inputValue('input[name="prompt"]');
    expect(promptValue).toBe('Config persistente teste 1');
    
    console.log('✅ Teste 1 passou: Config persiste sem salvar automação');
  });

  test('2. Config persiste após salvar automação', async ({ page }) => {
    await page.goto('/automations/create');
    
    // Preencher nome
    await page.fill('input[placeholder*="nome"]', 'E2E Test Automation');
    
    // Adicionar node
    await page.click('button:has-text("Adicionar Ferramenta")');
    await page.click(`text=${agentId}`);
    
    // Configurar node
    const node = page.locator('[data-id]').first();
    await node.click();
    await page.fill('input[name="prompt"]', 'Config salvo com automação');
    await page.click('button:has-text("Salvar Configuração")');
    
    // Salvar automação
    await page.click('button:has-text("Salvar Automação")');
    await page.waitForURL(/\/automations$/);
    
    // Pegar ID da automação
    const url = page.url();
    automationId = url.split('/').pop()!;
    
    // Reabrir automação
    await page.goto(`/automations/${automationId}/edit`);
    
    // Abrir config
    await node.click();
    
    // Validar
    const promptValue = await page.inputValue('input[name="prompt"]');
    expect(promptValue).toBe('Config salvo com automação');
    
    console.log('✅ Teste 2 passou: Config persiste após salvar');
  });

  test('3. Config persiste após F5 (reload)', async ({ page }) => {
    // Assumir que já existe automação do teste anterior
    await page.goto(`/automations/${automationId}/edit`);
    
    // Editar config
    const node = page.locator('[data-id]').first();
    await node.click();
    await page.fill('input[name="prompt"]', 'Config após reload');
    await page.click('button:has-text("Salvar Configuração")');
    await page.click('button:has-text("Salvar Automação")');
    
    // Recarregar página (F5)
    await page.reload();
    
    // Validar
    await node.click();
    const promptValue = await page.inputValue('input[name="prompt"]');
    expect(promptValue).toBe('Config após reload');
    
    console.log('✅ Teste 3 passou: Config persiste após F5');
  });

  test('4. Config persiste após executar automação', async ({ page }) => {
    await page.goto(`/automations/${automationId}/edit`);
    
    // Editar config
    const node = page.locator('[data-id]').first();
    await node.click();
    await page.fill('input[name="prompt"]', 'Config antes de executar');
    await page.click('button:has-text("Salvar Configuração")');
    await page.click('button:has-text("Salvar Automação")');
    
    // Executar automação
    await page.click('button:has-text("Executar")');
    await page.waitForTimeout(2000); // Aguardar execução
    
    // Reabrir config
    await node.click();
    const promptValue = await page.inputValue('input[name="prompt"]');
    expect(promptValue).toBe('Config antes de executar');
    
    console.log('✅ Teste 4 passou: Config persiste após execução');
  });

  test('5. Múltiplas edições preservadas', async ({ page }) => {
    await page.goto(`/automations/${automationId}/edit`);
    
    const node = page.locator('[data-id]').first();
    
    // Edição 1
    await node.click();
    await page.fill('input[name="prompt"]', 'Edição 1');
    await page.click('button:has-text("Salvar Configuração")');
    
    // Edição 2
    await node.click();
    await page.fill('input[name="prompt"]', 'Edição 2');
    await page.click('button:has-text("Salvar Configuração")');
    
    // Edição 3
    await node.click();
    await page.fill('input[name="prompt"]', 'Edição 3 FINAL');
    await page.click('button:has-text("Salvar Configuração")');
    
    // Salvar automação
    await page.click('button:has-text("Salvar Automação")');
    
    // Recarregar
    await page.reload();
    
    // Validar última edição
    await node.click();
    const promptValue = await page.inputValue('input[name="prompt"]');
    expect(promptValue).toBe('Edição 3 FINAL');
    
    console.log('✅ Teste 5 passou: Múltiplas edições preservadas');
  });
});
