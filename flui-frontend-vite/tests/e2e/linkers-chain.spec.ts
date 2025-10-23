import { test, expect, Page } from '@playwright/test';

/**
 * TESTE E2E: Linkers em Cadeia
 * 
 * Valida que:
 * 1. Linkers mostram TODOS os nodes anteriores
 * 2. Não mostram apenas o parent direto
 * 3. Funciona com N nodes (testando com 5)
 * 4. Menu expansivo por node funciona
 */

const API_URL = 'http://localhost:3001/api';

test.describe('Linkers em Cadeia Completa', () => {
  let agentIds: string[] = [];
  let automationId: string;

  test.beforeAll(async () => {
    // Criar 3 agentes diferentes
    for (let i = 1; i <= 3; i++) {
      const response = await fetch(`${API_URL}/agents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: `e2e-linker-agent-${i}-${Date.now()}`,
          name: `Linker Agent ${i}`,
          model: 'deepseek-v3.1',
          systemPrompt: `Agente ${i} para teste de linkers`,
          temperature: 0.5 + (i * 0.1),
          maxTokens: 50,
          enabled: true,
          tools: []
        })
      });
      const data = await response.json();
      agentIds.push(data.id);
    }
    console.log('✅ 3 Agentes criados:', agentIds);
  });

  test('1. Criar cadeia de 5 nodes', async ({ page }) => {
    await page.goto('/automations/create');
    
    // Nome
    await page.fill('input[placeholder*="nome"]', 'E2E Linker Chain Test');
    
    // Adicionar 5 nodes
    for (let i = 0; i < 5; i++) {
      await page.click('button:has-text("Adicionar Ferramenta")');
      const agentIndex = i % 3; // Usar 3 agentes de forma rotativa
      await page.click(`text=${agentIds[agentIndex]}`);
      await page.waitForTimeout(500);
    }
    
    // Validar que 5 nodes foram criados
    const nodeCount = await page.locator('[data-id]').count();
    expect(nodeCount).toBe(5);
    
    console.log('✅ 5 nodes criados com sucesso');
  });

  test('2. Node 2 deve ver linkers de Node 1', async ({ page }) => {
    await page.goto(`/automations/${automationId}/edit`);
    
    // Abrir config do 2º node
    const node2 = page.locator('[data-id]').nth(1);
    await node2.click();
    
    // Clicar no botão de linker
    await page.click('button[title*="linker"], button:has-text("🔗")');
    
    // Validar que Node 1 aparece
    const linkersMenu = page.locator('[role="menu"], [data-linkers]');
    await expect(linkersMenu).toContainText('Node 1', { timeout: 5000 });
    
    console.log('✅ Node 2 vê linkers de Node 1');
  });

  test('3. Node 3 deve ver linkers de Nodes 1 E 2', async ({ page }) => {
    await page.goto(`/automations/${automationId}/edit`);
    
    // Abrir config do 3º node
    const node3 = page.locator('[data-id]').nth(2);
    await node3.click();
    
    // Clicar no botão de linker
    await page.click('button[title*="linker"], button:has-text("🔗")');
    
    // Validar que Nodes 1 E 2 aparecem
    const linkersMenu = page.locator('[role="menu"], [data-linkers]');
    await expect(linkersMenu).toContainText('Node 1');
    await expect(linkersMenu).toContainText('Node 2');
    
    console.log('✅ Node 3 vê linkers de Nodes 1 e 2');
  });

  test('4. Node 5 deve ver linkers de Nodes 1, 2, 3 E 4', async ({ page }) => {
    await page.goto(`/automations/${automationId}/edit`);
    
    // Abrir config do 5º node
    const node5 = page.locator('[data-id]').nth(4);
    await node5.click();
    
    // Clicar no botão de linker
    await page.click('button[title*="linker"], button:has-text("🔗")');
    
    // Validar que TODOS os 4 nodes anteriores aparecem
    const linkersMenu = page.locator('[role="menu"], [data-linkers]');
    await expect(linkersMenu).toContainText('Node 1');
    await expect(linkersMenu).toContainText('Node 2');
    await expect(linkersMenu).toContainText('Node 3');
    await expect(linkersMenu).toContainText('Node 4');
    
    // Validar que NÃO mostra Node 5 (ele mesmo)
    await expect(linkersMenu).not.toContainText('Node 5');
    
    console.log('✅ Node 5 vê linkers de TODOS os 4 nodes anteriores');
  });

  test('5. Linkers agrupados por node (menu expansivo)', async ({ page }) => {
    await page.goto(`/automations/${automationId}/edit`);
    
    const node5 = page.locator('[data-id]').nth(4);
    await node5.click();
    
    await page.click('button[title*="linker"], button:has-text("🔗")');
    
    // Validar que cada node tem sua seção
    const sections = page.locator('[data-node-section], .node-outputs-section');
    const sectionCount = await sections.count();
    
    // Deve ter pelo menos 4 seções (um por cada predecessor)
    expect(sectionCount).toBeGreaterThanOrEqual(4);
    
    console.log(`✅ Menu expansivo com ${sectionCount} seções de nodes`);
  });

  test('6. Selecionar linker e inserir no campo', async ({ page }) => {
    await page.goto(`/automations/${automationId}/edit`);
    
    const node3 = page.locator('[data-id]').nth(2);
    await node3.click();
    
    // Limpar campo prompt
    await page.fill('input[name="prompt"]', '');
    
    // Abrir linkers
    await page.click('button[title*="linker"], button:has-text("🔗")');
    
    // Selecionar output do Node 1
    await page.click('text=Node 1');
    await page.click('text=response'); // Output comum
    
    // Validar que linker foi inserido
    const promptValue = await page.inputValue('input[name="prompt"]');
    expect(promptValue).toContain('{{');
    expect(promptValue).toContain('node-1'); // ID do Node 1
    
    console.log('✅ Linker inserido corretamente:', promptValue);
  });

  test('7. Linker persiste após salvar', async ({ page }) => {
    await page.goto(`/automations/${automationId}/edit`);
    
    const node4 = page.locator('[data-id]').nth(3);
    await node4.click();
    
    // Inserir linker
    await page.fill('input[name="prompt"]', 'Usar output: ');
    await page.click('button:has-text("🔗")');
    await page.click('text=Node 2');
    await page.click('text=response');
    
    // Salvar
    await page.click('button:has-text("Salvar Configuração")');
    await page.click('button:has-text("Salvar Automação")');
    
    // Recarregar
    await page.reload();
    
    // Validar
    await node4.click();
    const promptValue = await page.inputValue('input[name="prompt"]');
    expect(promptValue).toContain('{{');
    expect(promptValue).toContain('node-2');
    
    console.log('✅ Linker persiste após salvar e recarregar');
  });
});
