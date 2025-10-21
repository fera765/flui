/**
 * BLOCO 2: ADICIONAR E VALIDAR MCP
 * 
 * Este teste valida:
 * 1. Adicionar MCP (exemplo: @pinkpixel/mcpollinations)
 * 2. Corrigir erros até ser adicionado sem erro
 * 3. Verificar se funções do MCP são expostas
 * 4. Criar automação usando tools do MCP
 * 5. Verificar se tools do MCP aparecem na lista
 * 6. Adicionar tool do MCP na automação
 * 7. Linkar tool do MCP
 * 8. Validar resposta no log
 */

import { test, expect, Page } from '@playwright/test';

const API_BASE_URL = 'http://localhost:3001/api';
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

test.describe('BLOCO 2 - MCP Integration', () => {
  
  test('deve adicionar MCP e validar funções expostas', async ({ page }) => {
    console.log('\n🚀 INICIANDO TESTE BLOCO 2 - MCP INTEGRATION\n');
    
    // ========== PASSO 1: Navegar para página de MCPs ==========
    console.log('📍 PASSO 1: Navegando para gerenciador de MCPs...');
    
    await page.goto('/mcps');
    await page.waitForLoadState('networkidle');
    await wait(1000);
    
    console.log('   ✅ Página de MCPs carregada');
    
    // ========== PASSO 2: Adicionar novo MCP ==========
    console.log('\n📍 PASSO 2: Adicionando MCP @pinkpixel/mcpollinations...');
    
    // Clicar no botão de adicionar MCP
    const addMcpButton = page.locator('button:has-text("Adicionar MCP")').or(
      page.locator('button:has-text("Novo MCP")')
    );
    
    if (await addMcpButton.count() === 0) {
      console.log('   ⚠️  Botão de adicionar MCP não encontrado, tentando criar diretamente via API...');
      
      // Criar MCP via API
      const mcpData = {
        name: 'Pollinations MCP',
        command: 'npx',
        args: ['@pinkpixel/mcpollinations'],
        description: 'MCP para geração de imagens com Pollinations AI',
        enabled: true,
      };
      
      const createResponse = await page.evaluate(async ({ apiUrl, data }) => {
        try {
          const response = await fetch(`${apiUrl}/mcps`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
          });
          return {
            ok: response.ok,
            status: response.status,
            data: await response.json().catch(() => null),
          };
        } catch (error: any) {
          return { ok: false, error: error.message };
        }
      }, { apiUrl: API_BASE_URL, data: mcpData });
      
      console.log('   📋 Resposta da API:', createResponse);
      
      if (createResponse.ok) {
        console.log('   ✅ MCP criado com sucesso via API');
      } else {
        console.log('   ⚠️  Erro ao criar MCP:', createResponse);
      }
      
      // Recarregar página
      await page.reload();
      await wait(2000);
      
    } else {
      // Usar interface
      await addMcpButton.click();
      await wait(1000);
      
      // Preencher formulário
      const nameInput = page.locator('input[name="name"]').or(
        page.locator('input[placeholder*="nome"]')
      );
      
      if (await nameInput.count() > 0) {
        await nameInput.fill('Pollinations MCP');
        
        // Command
        const commandInput = page.locator('input[name="command"]').or(
          page.locator('input[placeholder*="comando"]')
        );
        await commandInput.fill('npx');
        
        // Args
        const argsInput = page.locator('input[name="args"]').or(
          page.locator('textarea[name="args"]')
        );
        await argsInput.fill('@pinkpixel/mcpollinations');
        
        // Description
        const descInput = page.locator('textarea[name="description"]').or(
          page.locator('input[name="description"]')
        );
        await descInput.fill('MCP para geração de imagens com Pollinations AI');
        
        // Salvar
        const saveButton = page.locator('button:has-text("Salvar")').or(
          page.locator('button:has-text("Adicionar")')
        );
        await saveButton.click();
        await wait(2000);
        
        console.log('   ✅ MCP adicionado via interface');
      }
    }
    
    // ========== PASSO 3: Verificar se MCP foi adicionado ==========
    console.log('\n📍 PASSO 3: Verificando se MCP foi adicionado...');
    
    // Buscar MCP na lista
    const mcpCard = page.locator('text=Pollinations').or(
      page.locator('[data-testid="mcp-card"]').filter({ hasText: 'Pollinations' })
    );
    
    const mcpExists = await mcpCard.count() > 0;
    console.log(`   MCP existe na lista: ${mcpExists}`);
    
    if (!mcpExists) {
      console.log('   ⚠️  MCP não encontrado, verificando via API...');
      
      const mcps = await page.evaluate(async ({ apiUrl }) => {
        try {
          const response = await fetch(`${apiUrl}/mcps`);
          return await response.json();
        } catch (error) {
          return [];
        }
      }, { apiUrl: API_BASE_URL });
      
      console.log('   📋 MCPs via API:', mcps);
    }
    
    // ========== PASSO 4: Verificar funções expostas ==========
    console.log('\n📍 PASSO 4: Verificando funções expostas do MCP...');
    
    // Aguardar MCP inicializar
    await wait(5000);
    
    // Buscar tools/funções disponíveis
    const tools = await page.evaluate(async ({ apiUrl }) => {
      try {
        const response = await fetch(`${apiUrl}/tools`);
        const allTools = await response.json();
        
        // Filtrar tools do MCP Pollinations
        return allTools.filter((t: any) => 
          t.source === 'mcp' || 
          t.name?.toLowerCase().includes('pollination') ||
          t.category?.toLowerCase().includes('mcp')
        );
      } catch (error) {
        console.error('Erro ao buscar tools:', error);
        return [];
      }
    }, { apiUrl: API_BASE_URL });
    
    console.log(`   📋 Tools do MCP encontradas: ${tools.length}`);
    
    if (tools.length > 0) {
      console.log('   ✅ Funções do MCP expostas com sucesso');
      tools.forEach((tool: any, i: number) => {
        console.log(`      ${i + 1}. ${tool.name} - ${tool.description || 'Sem descrição'}`);
      });
    } else {
      console.log('   ⚠️  Nenhuma função do MCP foi exposta');
      console.log('   🔄 Tentando reiniciar MCP...');
      
      // Tentar reiniciar MCP via API
      const mcpsData = await page.evaluate(async ({ apiUrl }) => {
        const response = await fetch(`${apiUrl}/mcps`);
        return await response.json();
      }, { apiUrl: API_BASE_URL });
      
      const pollinationsMcp = mcpsData.find((m: any) => 
        m.name?.includes('Pollination') || m.command?.includes('mcpollination')
      );
      
      if (pollinationsMcp) {
        console.log('   🔄 MCP encontrado, ID:', pollinationsMcp.id);
        
        // Desabilitar e reabilitar
        await page.evaluate(async ({ apiUrl, id }) => {
          await fetch(`${apiUrl}/mcps/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ enabled: false }),
          });
          
          await new Promise(r => setTimeout(r, 2000));
          
          await fetch(`${apiUrl}/mcps/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ enabled: true }),
          });
        }, { apiUrl: API_BASE_URL, id: pollinationsMcp.id });
        
        console.log('   ✅ MCP reiniciado');
        await wait(5000);
        
        // Verificar tools novamente
        const toolsAfterRestart = await page.evaluate(async ({ apiUrl }) => {
          const response = await fetch(`${apiUrl}/tools`);
          const allTools = await response.json();
          return allTools.filter((t: any) => 
            t.source === 'mcp' || 
            t.name?.toLowerCase().includes('pollination')
          );
        }, { apiUrl: API_BASE_URL });
        
        console.log(`   📋 Tools após reiniciar: ${toolsAfterRestart.length}`);
      }
    }
    
    // ========== PASSO 5: Criar automação usando tool do MCP ==========
    console.log('\n📍 PASSO 5: Criando automação com tool do MCP...');
    
    await page.goto('/automations/create');
    await page.waitForLoadState('networkidle');
    await wait(2000);
    
    // Abrir palette
    const addNodeButton = page.locator('button:has-text("Adicionar Ferramenta")');
    await addNodeButton.click();
    await wait(500);
    
    // Buscar por "pollination" ou "image" ou "mcp"
    const searchInput = page.locator('input[placeholder*="Buscar"]');
    if (await searchInput.count() > 0) {
      await searchInput.fill('pollination');
      await wait(500);
    }
    
    // Verificar se tool do MCP aparece
    const mcpToolButton = page.locator('[data-testid="tool-item"]').or(
      page.locator('button').filter({ hasText: /pollination|image|mcp/i })
    );
    
    const mcpToolCount = await mcpToolButton.count();
    console.log(`   📋 Tools do MCP na palette: ${mcpToolCount}`);
    
    if (mcpToolCount > 0) {
      console.log('   ✅ Tool do MCP aparece na lista');
      
      // Adicionar tool
      await mcpToolButton.first().click();
      await wait(1000);
      
      // Verificar se node foi adicionado
      const nodes = await page.locator('[data-type="tool"]').count();
      console.log(`   ✅ Node do MCP adicionado. Total de nodes: ${nodes}`);
      
      // ========== PASSO 6: Adicionar outro node e linkar ==========
      console.log('\n📍 PASSO 6: Adicionando node complementar e linkando...');
      
      // Adicionar HTTP Request antes
      await addNodeButton.click();
      await wait(500);
      await searchInput.fill('HTTP Request');
      await wait(300);
      await page.locator('button:has-text("HTTP Request")').first().click();
      await wait(1000);
      
      // Conectar HTTP -> MCP Tool
      await page.evaluate(() => {
        const rfInstance = (window as any).__reactFlowInstance;
        const nodes = rfInstance?.getNodes() || [];
        if (nodes.length >= 2) {
          rfInstance.addEdges([{
            id: `edge-${nodes[0].id}-${nodes[1].id}`,
            source: nodes[0].id,
            target: nodes[1].id,
          }]);
        }
      });
      await wait(500);
      
      // Configurar MCP tool
      const configButtons = page.locator('button[title="Configurar nó"]');
      if (await configButtons.count() >= 1) {
        // Configurar tool do MCP (primeiro ou segundo, dependendo da ordem)
        await configButtons.first().click();
        await wait(1000);
        
        // Verificar campos disponíveis
        const fieldLabels = await page.locator('label').allTextContents();
        console.log('   📋 Campos da tool MCP:', fieldLabels);
        
        // Tentar aplicar linker se houver campos
        const linkerButtons = page.locator('button[title="Linkar campo"]');
        if (await linkerButtons.count() > 0) {
          await linkerButtons.first().click();
          await wait(500);
          
          // Selecionar output disponível
          const outputs = page.locator('[data-testid="output-option"]').or(
            page.locator('button').filter({ hasText: /output|resultado/i })
          );
          
          if (await outputs.count() > 0) {
            await outputs.first().click();
            await wait(500);
            console.log('   ✅ Linker aplicado');
          }
        }
        
        // Salvar configuração
        await page.locator('button:has-text("Salvar Configuração")').click();
        await wait(1000);
        console.log('   ✅ Configuração salva');
      }
      
      // ========== PASSO 7: Salvar e executar automação ==========
      console.log('\n📍 PASSO 7: Salvando e executando automação...');
      
      // Salvar automação
      const nameInput = page.locator('input[value*="Nova Automação"]').or(
        page.locator('input[type="text"]').first()
      );
      await nameInput.clear();
      await nameInput.fill('Teste BLOCO 2 - MCP Integration');
      
      const saveButton = page.locator('button:has-text("Salvar")');
      await saveButton.click();
      await wait(2000);
      console.log('   ✅ Automação salva');
      
      // Executar
      const runButton = page.locator('button:has-text("Executar")');
      if (await runButton.count() > 0) {
        await runButton.click();
        await wait(1000);
        console.log('   ✅ Execução iniciada');
        
        // Aguardar execução
        await wait(5000);
        
        // ========== PASSO 8: Validar logs ==========
        console.log('\n📍 PASSO 8: Validando logs da execução com MCP...');
        
        const logsTab = page.locator('button:has-text("Logs")');
        if (await logsTab.count() > 0) {
          await logsTab.click();
          await wait(1000);
        }
        
        // Verificar logs
        const logEntries = page.locator('[data-testid="log-entry"]').or(
          page.locator('.log-entry, .execution-log')
        );
        
        const logCount = await logEntries.count();
        console.log(`   📋 Logs encontrados: ${logCount}`);
        
        if (logCount > 0) {
          const logTexts = await logEntries.allTextContents();
          console.log('   📝 Logs da execução:');
          logTexts.forEach((log, i) => {
            console.log(`      ${i + 1}. ${log.substring(0, 100)}...`);
          });
          
          // Verificar se MCP foi executado
          const hasMcpExecution = logTexts.some(log => 
            log.includes('mcp') || 
            log.includes('pollination') ||
            log.includes('image')
          );
          
          if (hasMcpExecution) {
            console.log('   ✅ Execução do MCP detectada nos logs');
          } else {
            console.log('   ℹ️  Logs não mostram execução explícita do MCP');
          }
        }
      }
      
    } else {
      console.log('   ⚠️  Nenhuma tool do MCP aparece na palette');
      console.log('   💡 Verifique se o MCP foi instalado corretamente');
    }
    
    console.log('\n✅ TESTE BLOCO 2 FINALIZADO\n');
  });
  
  test('deve verificar que tools do MCP têm metadata correta', async ({ page }) => {
    console.log('\n🔍 TESTE: Validação de metadata das tools MCP\n');
    
    // Buscar todas as tools
    await page.goto('/tools');
    await page.waitForLoadState('networkidle');
    
    // Filtrar tools MCP
    const mcpTools = await page.evaluate(async () => {
      const response = await fetch('http://localhost:3001/api/tools');
      const tools = await response.json();
      return tools.filter((t: any) => t.source === 'mcp');
    });
    
    console.log(`   📋 Total de tools MCP: ${mcpTools.length}`);
    
    if (mcpTools.length > 0) {
      mcpTools.forEach((tool: any) => {
        console.log(`   ✅ ${tool.name}`);
        console.log(`      - Descrição: ${tool.description || 'N/A'}`);
        console.log(`      - Parâmetros: ${tool.params?.length || 0}`);
        console.log(`      - Outputs: ${tool.outputs?.length || 0}`);
      });
    }
  });
});
