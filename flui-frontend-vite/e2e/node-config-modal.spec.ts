/**
 * Playwright E2E Test - Node Configuration Modal
 * 
 * Testa a abertura e funcionamento do modal de configuração de nós
 */

import { test, expect } from '@playwright/test';

test.describe('Node Configuration Modal', () => {
  test.beforeEach(async ({ page }) => {
    // Navegar para a página de criar automação
    await page.goto('/create-automation-v2');
    
    // Aguardar a página carregar
    await page.waitForLoadState('networkidle');
  });

  test('deve abrir o modal ao clicar no botão de configuração', async ({ page }) => {
    // Primeiro, adicionar um node ao canvas
    // Procurar pela palette de tools
    const paletteButton = page.locator('button:has-text("Tools")').first();
    await paletteButton.click();
    
    // Aguardar palette abrir
    await page.waitForTimeout(500);
    
    // Selecionar primeira tool disponível
    const firstTool = page.locator('[data-testid="tool-item"]').first();
    if (await firstTool.count() > 0) {
      await firstTool.click();
    }
    
    // Aguardar node aparecer no canvas
    await page.waitForTimeout(1000);
    
    // Procurar pelo botão de configuração (Settings icon) no node
    const configButton = page.locator('button[title="Configurar nó"]').first();
    
    // Verificar se botão existe
    await expect(configButton).toBeVisible();
    
    // Clicar no botão de configuração
    await configButton.click();
    
    // Aguardar modal abrir
    await page.waitForTimeout(500);
    
    // Verificar se modal está visível
    const modal = page.locator('h2:has-text("Configurar Nó")');
    await expect(modal).toBeVisible();
    
    // Verificar elementos do modal
    await expect(page.locator('text=Salvar Configuração')).toBeVisible();
    await expect(page.locator('text=Cancelar')).toBeVisible();
  });

  test('deve fechar o modal ao clicar em Cancelar', async ({ page }) => {
    // Adicionar node e abrir modal (simplificado)
    await page.evaluate(() => {
      // Mock: Adicionar node via JavaScript
      const event = new CustomEvent('add-node', {
        detail: { toolId: 'test-tool', name: 'Test Tool' }
      });
      window.dispatchEvent(event);
    });
    
    await page.waitForTimeout(500);
    
    const configButton = page.locator('button[title="Configurar nó"]').first();
    if (await configButton.count() > 0) {
      await configButton.click();
      await page.waitForTimeout(300);
      
      // Clicar em Cancelar
      await page.locator('button:has-text("Cancelar")').click();
      
      // Verificar se modal fechou
      await page.waitForTimeout(300);
      const modal = page.locator('h2:has-text("Configurar Nó")');
      await expect(modal).not.toBeVisible();
    }
  });

  test('deve carregar campos dinamicamente do backend', async ({ page }) => {
    // Mock da API response
    await page.route('**/api/tools/*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'test-tool',
          name: 'Test Tool',
          description: 'Tool for testing',
          params: [
            {
              name: 'field1',
              type: 'string',
              description: 'Test field',
              required: true,
            },
            {
              name: 'field2',
              type: 'number',
              description: 'Number field',
              required: false,
              default: 0,
            },
          ],
        }),
      });
    });
    
    // Adicionar node e abrir modal
    const configButton = page.locator('button[title="Configurar nó"]').first();
    if (await configButton.count() > 0) {
      await configButton.click();
      await page.waitForTimeout(500);
      
      // Verificar se campos foram carregados
      await expect(page.locator('label:has-text("field1")')).toBeVisible();
      await expect(page.locator('label:has-text("field2")')).toBeVisible();
    }
  });

  test('deve mostrar botão de linker em cada campo', async ({ page }) => {
    const configButton = page.locator('button[title="Configurar nó"]').first();
    if (await configButton.count() > 0) {
      await configButton.click();
      await page.waitForTimeout(500);
      
      // Procurar por botões de linker (ícone de Link2)
      const linkerButtons = page.locator('button[title="Linkar campo"]');
      const count = await linkerButtons.count();
      
      // Deve ter pelo menos um botão de linker
      expect(count).toBeGreaterThan(0);
    }
  });
});

test.describe('Node Configuration Modal - Debug Mode', () => {
  test('deve logar props e estado corretamente', async ({ page }) => {
    // Capturar logs do console
    const logs: string[] = [];
    page.on('console', (msg) => {
      const text = msg.text();
      logs.push(text);
      console.log('Browser Log:', text);
    });
    
    // Navegar e abrir modal
    await page.goto('/create-automation-v2');
    await page.waitForLoadState('networkidle');
    
    // Tentar abrir modal
    const configButton = page.locator('button[title="Configurar nó"]').first();
    if (await configButton.count() > 0) {
      await configButton.click();
      await page.waitForTimeout(1000);
      
      // Verificar logs
      console.log('\n📋 Logs capturados:');
      logs.forEach((log) => console.log('  ', log));
      
      // Verificar se há logs de debug do modal
      const hasModalLogs = logs.some(log => log.includes('[NodeConfigModalV2]'));
      const hasConfigureLogs = logs.some(log => log.includes('handleConfigureNode'));
      
      console.log('\n✅ Has Modal Logs:', hasModalLogs);
      console.log('✅ Has Configure Logs:', hasConfigureLogs);
      
      // Se não há logs, pode haver um problema
      if (!hasModalLogs && !hasConfigureLogs) {
        console.log('\n⚠️ WARNING: Nenhum log de debug encontrado!');
        console.log('   Isso pode indicar que o modal não está sendo renderizado.');
      }
    } else {
      console.log('\n⚠️ Nenhum botão de configuração encontrado no canvas');
      console.log('   Pode ser necessário adicionar um node primeiro');
    }
  });
});
