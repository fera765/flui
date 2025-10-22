/**
 * TESTE: Bug "Node não encontrado" ao editar agente
 * 
 * Reproduz o bug reportado pelo usuário:
 * 1. Criar agente
 * 2. Criar automação nova (não salva ainda)
 * 3. Adicionar agente à automação
 * 4. Tentar editar o agente
 * 
 * Comportamento esperado: Modal de configuração abre sem erros
 * Bug reportado: "Erro ao carregar configurações do node: Node não encontrado"
 */

import { test, expect, Page } from '@playwright/test';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';
const APP_URL = 'http://localhost:8080';

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

test.describe('Bug: Node não encontrado ao editar agente', () => {
  let agentId: string;
  
  test.beforeAll(async () => {
    // Criar agente via API
    const response = await axios.post(`${API_BASE_URL}/agents`, {
      name: 'Agente Teste Bug',
      description: 'Agente para reproduzir bug',
      model: 'gpt-4',
      systemPrompt: 'Você é um assistente de teste',
      enabled: true
    });
    
    agentId = response.data.id;
    console.log(`✅ Agente criado: ${agentId}`);
  });
  
  test('deve abrir modal de configuração sem erro ao editar agente em automação não salva', async ({ page }) => {
    console.log('\n🧪 Iniciando teste do bug...\n');
    
    // 1. Navegar para criar nova automação
    console.log('1️⃣  Acessando página de criar automação...');
    await page.goto(`${APP_URL}/automations/create`);
    await wait(2000);
    
    // Verificar se página carregou
    await expect(page.locator('text=Nova Automação')).toBeVisible({ timeout: 10000 });
    console.log('✅ Página carregada');
    
    // 2. Adicionar trigger manual
    console.log('\n2️⃣  Adicionando Manual Trigger...');
    await page.click('button:has-text("Adicionar Ferramenta")');
    await wait(1000);
    
    // Clicar em Manual Trigger
    const triggerButton = page.locator('button').filter({ 
      has: page.locator('h3:has-text("Manual Trigger")') 
    }).first();
    await triggerButton.click();
    await wait(2000);
    console.log('✅ Manual Trigger adicionado');
    
    // 3. Adicionar agente
    console.log('\n3️⃣  Adicionando agente...');
    await page.click('button:has-text("Adicionar Ferramenta")');
    await wait(1000);
    
    // Ir para aba "Agentes"
    await page.click('button:has-text("Agentes")');
    await wait(1000);
    
    // Clicar no agente
    const agentButton = page.locator('button').filter({ 
      has: page.locator('h3:has-text("Agente Teste Bug")') 
    }).first();
    
    const agentCount = await agentButton.count();
    console.log(`   🔍 Agentes encontrados: ${agentCount}`);
    
    if (agentCount === 0) {
      const allAgents = await page.locator('button h3').allTextContents();
      console.log(`   📋 Agentes disponíveis:`, allAgents);
      throw new Error('Agente não encontrado na interface');
    }
    
    await agentButton.click();
    await wait(2000);
    console.log('✅ Agente adicionado ao canvas');
    
    // 4. Verificar que temos 2 nodes no canvas
    const nodes = await page.locator('[data-id]').filter({ hasText: /Manual Trigger|Agente/ }).count();
    console.log(`   📊 Nodes no canvas: ${nodes}`);
    expect(nodes).toBeGreaterThanOrEqual(2);
    
    // 5. Tentar editar o agente (clicar no botão "Configurar" do node do agente)
    console.log('\n4️⃣  Tentando editar configuração do agente...');
    
    // Encontrar o node do agente e clicar em "Configurar"
    const agentNode = page.locator('[data-id]').filter({ hasText: 'Agente Teste Bug' }).first();
    await agentNode.hover();
    await wait(500);
    
    // Clicar no botão de configurar (pode ter ícone de engrenagem ou texto "Configurar")
    const configButton = agentNode.locator('button').filter({ 
      hasText: /Configurar|Config|⚙/i 
    }).first();
    
    await configButton.click();
    await wait(2000);
    
    console.log('🔍 Verificando se modal abriu...');
    
    // 6. VERIFICAR: Modal deve abrir SEM erro
    // Verificar se há mensagem de erro
    const errorMessage = page.locator('text=/Erro ao carregar.*Node não encontrado/i');
    const hasError = await errorMessage.isVisible().catch(() => false);
    
    if (hasError) {
      const errorText = await errorMessage.textContent();
      console.log(`❌ BUG REPRODUZIDO: ${errorText}`);
      
      // Tirar screenshot do erro
      await page.screenshot({ 
        path: 'test-results/bug-node-nao-encontrado.png',
        fullPage: true 
      });
      
      throw new Error(`BUG CONFIRMADO: ${errorText}`);
    }
    
    // Verificar se modal abriu com sucesso
    const modal = page.locator('[role="dialog"], .modal, text=Configuração').first();
    await expect(modal).toBeVisible({ timeout: 5000 });
    console.log('✅ Modal abriu sem erros!');
    
    // Verificar se campos do agente estão visíveis
    const promptField = page.locator('label:has-text("prompt"), input[placeholder*="prompt"]').first();
    const temperatureField = page.locator('label:has-text("temperature"), input[type="number"]').first();
    
    const hasPromptField = await promptField.isVisible().catch(() => false);
    const hasTemperatureField = await temperatureField.isVisible().catch(() => false);
    
    console.log(`   📋 Campos visíveis:`);
    console.log(`      - Prompt: ${hasPromptField ? '✅' : '❌'}`);
    console.log(`      - Temperature: ${hasTemperatureField ? '✅' : '❌'}`);
    
    if (!hasPromptField && !hasTemperatureField) {
      console.log('⚠️  Campos do agente não estão visíveis, mas modal abriu');
    }
    
    // 7. Fechar modal
    const closeButton = page.locator('button:has-text("Fechar"), button:has-text("Cancelar"), button[aria-label="Close"]').first();
    await closeButton.click().catch(() => console.log('   ℹ️  Não encontrou botão fechar'));
    
    console.log('\n✅ TESTE PASSOU: Modal abriu sem erro "Node não encontrado"!');
  });
  
  test('deve abrir modal de configuração sem erro ao editar Condition Flex', async ({ page }) => {
    console.log('\n🧪 Testando Condition Flex...\n');
    
    // 1. Navegar para criar nova automação
    await page.goto(`${APP_URL}/automations/create`);
    await wait(2000);
    
    // 2. Adicionar Condition Flex
    console.log('1️⃣  Adicionando Condition Flex...');
    await page.click('button:has-text("Adicionar Ferramenta")');
    await wait(1000);
    
    const conditionButton = page.locator('button').filter({ 
      has: page.locator('h3:has-text("Condition Flex")') 
    }).first();
    
    await conditionButton.click();
    await wait(2000);
    console.log('✅ Condition Flex adicionado');
    
    // 3. Tentar editar
    console.log('\n2️⃣  Tentando editar Condition Flex...');
    
    const conditionNode = page.locator('[data-id]').filter({ hasText: 'Condition Flex' }).first();
    await conditionNode.hover();
    await wait(500);
    
    const configButton = conditionNode.locator('button').filter({ 
      hasText: /Configurar|Config|⚙/i 
    }).first();
    
    await configButton.click();
    await wait(2000);
    
    // 4. Verificar se modal abriu sem erro
    const errorMessage = page.locator('text=/Erro ao carregar.*Node não encontrado/i');
    const hasError = await errorMessage.isVisible().catch(() => false);
    
    if (hasError) {
      const errorText = await errorMessage.textContent();
      console.log(`❌ BUG REPRODUZIDO com Condition Flex: ${errorText}`);
      
      await page.screenshot({ 
        path: 'test-results/bug-condition-nao-encontrado.png',
        fullPage: true 
      });
      
      throw new Error(`BUG CONFIRMADO: ${errorText}`);
    }
    
    const modal = page.locator('[role="dialog"], .modal, text=Configuração').first();
    await expect(modal).toBeVisible({ timeout: 5000 });
    console.log('✅ Modal do Condition Flex abriu sem erros!');
  });
});
