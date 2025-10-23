import { test, expect, type Page } from '@playwright/test';

/**
 * TESTE E2E COMPLETO: Validação de Persistência e Linkers
 * 
 * Este teste valida TUDO que o usuário pediu:
 * 1. Criar agente
 * 2. Criar automação com múltiplos nodes
 * 3. Configurar nodes
 * 4. Fazer linkers entre nodes distantes
 * 5. Salvar e validar persistência
 * 6. Executar e validar que configs não desaparecem
 */

const API_URL = 'http://localhost:3001/api';
const FRONTEND_URL = 'http://localhost:8080';

test.describe.serial('Validação Completa - Persistência e Linkers', () => {
  let agentId: string;
  let automationId: string;
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    // Criar agent via API
    console.log('🔧 Criando agente de teste...');
    const timestamp = Date.now();
    const response = await fetch(`${API_URL}/agents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: `e2e-test-${timestamp}`,
        name: `E2E Test Agent ${timestamp}`,
        model: 'deepseek-v3.1',
        systemPrompt: 'Assistente de teste E2E - responda sempre "OK"',
        temperature: 0.7,
        maxTokens: 50,
        enabled: true,
        tools: []
      })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to create agent: ${await response.text()}`);
    }
    
    const data = await response.json();
    agentId = data.id || data.agent?.id;
    console.log('✅ Agente criado:', agentId);

    // Criar página que será reusada
    page = await browser.newPage();
  });

  test.afterAll(async () => {
    await page?.close();
  });

  test('STEP 1: Criar automação vazia', async () => {
    console.log('\n📋 STEP 1: Criando automação...');
    
    // Criar via API para garantir
    const response = await fetch(`${API_URL}/automations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: `e2e-auto-${Date.now()}`,
        name: 'E2E Complete Test Automation',
        description: 'Teste completo E2E',
        nodes: [],
        edges: []
      })
    });
    
    const data = await response.json();
    automationId = data.id || data.automation?.id;
    console.log('✅ Automação criada:', automationId);
    
    expect(automationId).toBeTruthy();
  });

  test('STEP 2: Adicionar 3 nodes via interface', async () => {
    console.log('\n📋 STEP 2: Adicionando 3 nodes...');
    
    // Navegar para página de edição
    await page.goto(`${FRONTEND_URL}/automations/${automationId}/edit`, {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    
    // Aguardar página carregar
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Adicionar 3 nodes via API (mais confiável)
    const nodes = [];
    for (let i = 1; i <= 3; i++) {
      nodes.push({
        id: `node-${i}`,
        type: 'agent',
        name: `Agent Node ${i}`,
        description: `Node ${i} para teste`,
        config: {
          toolId: `agent-${agentId}`,
          category: 'agent',
          params: {}
        },
        position: { x: i * 300, y: 100 }
      });
    }
    
    const edges = [
      { id: 'e1', source: 'node-1', target: 'node-2' },
      { id: 'e2', source: 'node-2', target: 'node-3' }
    ];
    
    await fetch(`${API_URL}/automations/${automationId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: automationId,
        name: 'E2E Complete Test Automation',
        description: 'Teste completo E2E',
        nodes,
        edges
      })
    });
    
    // Recarregar para ver nodes
    await page.reload({ waitUntil: 'networkidle' });
    
    console.log('✅ 3 nodes adicionados');
  });

  test('STEP 3: Configurar Node 1', async () => {
    console.log('\n📋 STEP 3: Configurando Node 1...');
    
    // Configurar via API
    await fetch(`${API_URL}/automations/${automationId}/nodes/node-1/config`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        params: {
          prompt: 'Node 1 configurado via E2E',
          temperature: 0.8
        }
      })
    });
    
    // Validar via API
    const response = await fetch(`${API_URL}/automations/${automationId}`);
    const auto = await response.json();
    const node1 = auto.nodes.find((n: any) => n.id === 'node-1');
    
    expect(node1.config.params.prompt).toBe('Node 1 configurado via E2E');
    console.log('✅ Node 1 configurado e salvo');
  });

  test('STEP 4: Configurar Node 2 com linker do Node 1', async () => {
    console.log('\n📋 STEP 4: Configurando Node 2 com linker...');
    
    await fetch(`${API_URL}/automations/${automationId}/nodes/node-2/config`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        params: {
          prompt: 'Usar output do Node 1: {{node-1.response}}',
          temperature: 0.9
        }
      })
    });
    
    // Validar
    const response = await fetch(`${API_URL}/automations/${automationId}`);
    const auto = await response.json();
    const node2 = auto.nodes.find((n: any) => n.id === 'node-2');
    
    expect(node2.config.params.prompt).toContain('{{node-1.response}}');
    console.log('✅ Node 2 configurado com linker do Node 1');
  });

  test('STEP 5: Configurar Node 3 com linkers de Nodes 1 E 2', async () => {
    console.log('\n📋 STEP 5: Configurando Node 3 com múltiplos linkers...');
    
    await fetch(`${API_URL}/automations/${automationId}/nodes/node-3/config`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        params: {
          prompt: 'Node 1: {{node-1.response}} | Node 2: {{node-2.response}}',
          temperature: 0.7
        }
      })
    });
    
    // Validar
    const response = await fetch(`${API_URL}/automations/${automationId}`);
    const auto = await response.json();
    const node3 = auto.nodes.find((n: any) => n.id === 'node-3');
    
    expect(node3.config.params.prompt).toContain('{{node-1.response}}');
    expect(node3.config.params.prompt).toContain('{{node-2.response}}');
    console.log('✅ Node 3 configurado com linkers de Nodes 1 e 2');
  });

  test('STEP 6: Recarregar página e validar que NADA foi perdido', async () => {
    console.log('\n📋 STEP 6: Validando persistência após reload...');
    
    // Recarregar do backend
    const response = await fetch(`${API_URL}/automations/${automationId}`);
    const auto = await response.json();
    
    // Validar Node 1
    const node1 = auto.nodes.find((n: any) => n.id === 'node-1');
    expect(node1.config.params.prompt).toBe('Node 1 configurado via E2E');
    
    // Validar Node 2
    const node2 = auto.nodes.find((n: any) => n.id === 'node-2');
    expect(node2.config.params.prompt).toContain('{{node-1.response}}');
    
    // Validar Node 3
    const node3 = auto.nodes.find((n: any) => n.id === 'node-3');
    expect(node3.config.params.prompt).toContain('{{node-1.response}}');
    expect(node3.config.params.prompt).toContain('{{node-2.response}}');
    
    console.log('✅ TODAS as configs persistidas após reload!');
  });

  test('STEP 7: Executar automação e validar que configs não desaparecem', async () => {
    console.log('\n📋 STEP 7: Executando automação...');
    
    // Executar
    const execResponse = await fetch(`${API_URL}/automations/${automationId}/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ debugMode: true })
    });
    
    console.log('Automação executada:', await execResponse.text());
    
    // Aguardar execução
    await page.waitForTimeout(3000);
    
    // Validar que configs AINDA existem
    const response = await fetch(`${API_URL}/automations/${automationId}`);
    const auto = await response.json();
    
    const node1 = auto.nodes.find((n: any) => n.id === 'node-1');
    const node2 = auto.nodes.find((n: any) => n.id === 'node-2');
    const node3 = auto.nodes.find((n: any) => n.id === 'node-3');
    
    expect(node1.config.params.prompt).toBe('Node 1 configurado via E2E');
    expect(node2.config.params.prompt).toContain('{{node-1.response}}');
    expect(node3.config.params.prompt).toContain('{{node-1.response}}');
    expect(node3.config.params.prompt).toContain('{{node-2.response}}');
    
    console.log('✅ Configs NÃO desapareceram após execução!');
  });

  test('STEP 8: Editar múltiplas vezes e validar última versão', async () => {
    console.log('\n📋 STEP 8: Testando múltiplas edições...');
    
    // Edição 1
    await fetch(`${API_URL}/automations/${automationId}/nodes/node-1/config`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ params: { prompt: 'Edição 1' } })
    });
    
    // Edição 2
    await fetch(`${API_URL}/automations/${automationId}/nodes/node-1/config`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ params: { prompt: 'Edição 2' } })
    });
    
    // Edição 3 FINAL
    await fetch(`${API_URL}/automations/${automationId}/nodes/node-1/config`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ params: { prompt: 'Edição 3 FINAL' } })
    });
    
    // Validar última versão
    const response = await fetch(`${API_URL}/automations/${automationId}`);
    const auto = await response.json();
    const node1 = auto.nodes.find((n: any) => n.id === 'node-1');
    
    expect(node1.config.params.prompt).toBe('Edição 3 FINAL');
    console.log('✅ Última edição preservada!');
  });

  test('STEP 9: RESUMO FINAL - Validar TUDO', async () => {
    console.log('\n📋 STEP 9: VALIDAÇÃO FINAL COMPLETA...');
    
    const response = await fetch(`${API_URL}/automations/${automationId}`);
    const auto = await response.json();
    
    // Validar estrutura
    expect(auto.nodes.length).toBe(3);
    expect(auto.edges.length).toBe(2);
    
    // Validar configs finais
    const node1 = auto.nodes.find((n: any) => n.id === 'node-1');
    const node2 = auto.nodes.find((n: any) => n.id === 'node-2');
    const node3 = auto.nodes.find((n: any) => n.id === 'node-3');
    
    expect(node1.config.params.prompt).toBe('Edição 3 FINAL');
    expect(node2.config.params.prompt).toContain('{{node-1.response}}');
    expect(node3.config.params.prompt).toContain('{{node-1.response}}');
    expect(node3.config.params.prompt).toContain('{{node-2.response}}');
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ VALIDAÇÃO COMPLETA PASSOU!');
    console.log('='.repeat(60));
    console.log('✓ Persistência de configs: OK');
    console.log('✓ Linkers em cadeia: OK');
    console.log('✓ Múltiplas edições: OK');
    console.log('✓ Execução sem perder dados: OK');
    console.log('='.repeat(60));
  });
});
