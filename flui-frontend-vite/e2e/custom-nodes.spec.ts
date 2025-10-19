/**
 * FLUI Custom Nodes E2E Tests with Playwright
 * 
 * Testa o fluxo completo de custom nodes na interface:
 * - Navegar até página de custom nodes
 * - Visualizar nodes instalados
 * - Upload de novo node
 * - Validação de feedback visual
 * - Atualização de node existente
 * - Remoção de node
 */

import { test, expect } from '@playwright/test';
import { readFile } from 'fs/promises';
import { join } from 'path';

test.describe('Custom Nodes Management', () => {
  test.beforeEach(async ({ page }) => {
    // Navegar até home
    await page.goto('/');
  });

  test('deve navegar até página de custom nodes', async ({ page }) => {
    // Verificar se existe link/botão para custom nodes
    const customNodesLink = page.getByRole('link', { name: /custom nodes/i });
    
    if (await customNodesLink.count() > 0) {
      await customNodesLink.click();
      await expect(page).toHaveURL(/\/custom-nodes/);
      await expect(page.getByRole('heading', { name: /custom nodes/i })).toBeVisible();
    } else {
      // Navegar diretamente se não houver link visível
      await page.goto('/custom-nodes');
      await expect(page.getByRole('heading', { name: /custom nodes/i })).toBeVisible();
    }
  });

  test('deve exibir estado vazio quando não há nodes', async ({ page }) => {
    await page.goto('/custom-nodes');
    
    // Aguardar carregamento
    await page.waitForLoadState('networkidle');
    
    // Verificar mensagem de estado vazio ou lista de nodes
    const emptyState = page.getByText(/nenhum custom node/i);
    const nodesList = page.getByRole('article'); // Cards de nodes
    
    const hasNodes = await nodesList.count() > 0;
    
    if (!hasNodes) {
      await expect(emptyState).toBeVisible();
      await expect(page.getByRole('button', { name: /upload/i })).toBeVisible();
    }
  });

  test('deve abrir modal de upload', async ({ page }) => {
    await page.goto('/custom-nodes');
    
    // Clicar no botão de upload
    const uploadButton = page.getByRole('button', { name: /upload node/i });
    await uploadButton.click();
    
    // Verificar se modal abriu
    await expect(page.getByRole('heading', { name: /upload custom node/i })).toBeVisible();
    await expect(page.getByText(/selecionar arquivo/i)).toBeVisible();
  });

  test('deve validar tipo de arquivo no upload', async ({ page }) => {
    await page.goto('/custom-nodes');
    
    // Abrir modal
    await page.getByRole('button', { name: /upload node/i }).click();
    
    // Localizar input de arquivo
    const fileInput = page.locator('input[type="file"]');
    
    // Tentar fazer upload de arquivo não-zip (deve ser rejeitado pelo navegador/backend)
    // Como o input tem accept=".zip", apenas arquivos .zip serão aceitos
    await expect(fileInput).toHaveAttribute('accept', '.zip');
  });

  test('deve exibir informações dos nodes instalados', async ({ page }) => {
    await page.goto('/custom-nodes');
    await page.waitForLoadState('networkidle');
    
    // Verificar se há nodes instalados
    const nodeCards = page.locator('[data-testid="node-card"]').or(
      page.locator('.bg-slate-800\\/50').filter({ has: page.getByText(/versão:/i) })
    );
    
    const count = await nodeCards.count();
    
    if (count > 0) {
      const firstNode = nodeCards.first();
      
      // Verificar informações exibidas
      await expect(firstNode).toContainText(/versão:/i);
      await expect(firstNode).toContainText(/categoria:/i);
      await expect(firstNode).toContainText(/autor:/i);
      
      // Verificar ações disponíveis
      await expect(firstNode.getByRole('button', { name: /remover|delete|trash/i })).toBeVisible();
    }
  });

  test('deve filtrar/pesquisar nodes', async ({ page }) => {
    await page.goto('/custom-nodes');
    await page.waitForLoadState('networkidle');
    
    // Verificar se há campo de busca
    const searchInput = page.getByPlaceholder(/buscar|search/i);
    
    if (await searchInput.count() > 0) {
      await searchInput.fill('test');
      
      // Aguardar filtros aplicarem
      await page.waitForTimeout(500);
      
      // Verificar se lista foi filtrada
      const nodeCards = page.locator('.bg-slate-800\\/50');
      const count = await nodeCards.count();
      
      // Se houver resultado, deve conter "test" no nome/descrição
      if (count > 0) {
        await expect(nodeCards.first()).toContainText(/test/i);
      }
    }
  });

  test('deve exibir feedback visual ao remover node', async ({ page }) => {
    await page.goto('/custom-nodes');
    await page.waitForLoadState('networkidle');
    
    const nodeCards = page.locator('.bg-slate-800\\/50').filter({ 
      has: page.getByText(/versão:/i) 
    });
    
    const count = await nodeCards.count();
    
    if (count > 0) {
      // Interceptar dialog de confirmação
      page.on('dialog', dialog => dialog.accept());
      
      // Clicar no botão de remover do primeiro node
      const deleteButton = nodeCards.first().getByRole('button', { name: /remover|delete|trash/i });
      await deleteButton.click();
      
      // Aguardar requisição completar
      await page.waitForResponse(response => 
        response.url().includes('/api/custom-nodes/') && 
        response.request().method() === 'DELETE'
      );
      
      // Verificar se node foi removido (lista atualizada)
      await page.waitForTimeout(1000);
      const newCount = await nodeCards.count();
      expect(newCount).toBe(count - 1);
    }
  });

  test('deve exibir detalhes completos do node', async ({ page }) => {
    await page.goto('/custom-nodes');
    await page.waitForLoadState('networkidle');
    
    const nodeCards = page.locator('.bg-slate-800\\/50').filter({ 
      has: page.getByText(/versão:/i) 
    });
    
    if (await nodeCards.count() > 0) {
      const firstNode = nodeCards.first();
      
      // Verificar metadados exibidos
      await expect(firstNode).toContainText(/versão:/i);
      await expect(firstNode).toContainText(/categoria:/i);
      await expect(firstNode).toContainText(/autor:/i);
      await expect(firstNode).toContainText(/tamanho:/i);
      await expect(firstNode).toContainText(/licença:/i);
      
      // Verificar fingerprint parcial
      await expect(firstNode).toContainText(/🔑/);
    }
  });

  test('deve ter responsividade em mobile', async ({ page }) => {
    // Definir viewport mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/custom-nodes');
    await page.waitForLoadState('networkidle');
    
    // Verificar se header está visível
    await expect(page.getByRole('heading', { name: /custom nodes/i })).toBeVisible();
    
    // Verificar se botão de upload está acessível
    await expect(page.getByRole('button', { name: /upload/i })).toBeVisible();
    
    // Se houver nodes, verificar se cards estão em coluna única
    const nodeCards = page.locator('.bg-slate-800\\/50');
    
    if (await nodeCards.count() > 1) {
      const firstCardBox = await nodeCards.first().boundingBox();
      const secondCardBox = await nodeCards.nth(1).boundingBox();
      
      if (firstCardBox && secondCardBox) {
        // Em mobile, cards devem estar empilhados verticalmente
        expect(secondCardBox.y).toBeGreaterThan(firstCardBox.y + firstCardBox.height);
      }
    }
  });

  test('deve exibir loading state durante carregamento', async ({ page }) => {
    await page.goto('/custom-nodes');
    
    // Verificar se há indicador de loading
    const loadingSpinner = page.locator('.animate-spin');
    
    // Loading pode aparecer brevemente
    // Se não aparecer, significa que carregou muito rápido (ok)
    const isVisible = await loadingSpinner.isVisible().catch(() => false);
    
    if (isVisible) {
      // Aguardar desaparecer
      await loadingSpinner.waitFor({ state: 'hidden', timeout: 5000 });
    }
    
    // Verificar se conteúdo foi carregado
    await expect(
      page.getByText(/nenhum custom node/i).or(page.locator('.bg-slate-800\\/50').first())
    ).toBeVisible();
  });

  test('deve ter navegação de volta funcionando', async ({ page }) => {
    await page.goto('/custom-nodes');
    
    // Clicar no botão de voltar
    const backButton = page.getByRole('button', { name: /voltar|back|arrow/i });
    
    if (await backButton.count() > 0) {
      await backButton.click();
      
      // Deve voltar para home ou página anterior
      await expect(page).not.toHaveURL(/\/custom-nodes/);
    }
  });
});

test.describe('Custom Nodes Integration with Workflow', () => {
  test('nodes customizados devem aparecer na tool palette', async ({ page }) => {
    // Navegar para criação de automação
    await page.goto('/');
    
    // Procurar botão de criar automação
    const createButton = page.getByRole('button', { name: /nova automação|create automation/i });
    
    if (await createButton.count() > 0) {
      await createButton.click();
      
      // Abrir tool palette
      await page.getByRole('button', { name: /adicionar|add tool/i }).click();
      
      // Tool palette deve mostrar todos os tools incluindo custom nodes
      await expect(page.getByText(/ferramentas|tools/i)).toBeVisible();
      
      // Verificar se custom nodes aparecem (se houver algum instalado)
      // A paleta deve ter categoria "custom" ou mostrar nodes personalizados
      const customCategory = page.getByText(/custom/i);
      
      if (await customCategory.count() > 0) {
        await expect(customCategory).toBeVisible();
      }
    }
  });
});

test.describe('Custom Nodes API Integration', () => {
  test('deve fazer requisições corretas à API', async ({ page }) => {
    // Interceptar requisições
    const requests: string[] = [];
    
    page.on('request', request => {
      if (request.url().includes('/api/custom-nodes')) {
        requests.push(request.method() + ' ' + request.url());
      }
    });
    
    await page.goto('/custom-nodes');
    await page.waitForLoadState('networkidle');
    
    // Deve ter feito GET /api/custom-nodes
    expect(requests.some(r => r.includes('GET') && r.includes('/api/custom-nodes'))).toBe(true);
  });

  test('deve tratar erros de API graciosamente', async ({ page }) => {
    // Simular erro de rede
    await page.route('**/api/custom-nodes', route => {
      route.abort('failed');
    });
    
    await page.goto('/custom-nodes');
    
    // Deve exibir mensagem de erro
    await expect(page.getByText(/erro/i)).toBeVisible();
    
    // Deve ter opção de tentar novamente
    const retryButton = page.getByRole('button', { name: /tentar novamente|retry/i });
    await expect(retryButton).toBeVisible();
  });
});
