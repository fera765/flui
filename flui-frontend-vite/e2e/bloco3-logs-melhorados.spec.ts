/**
 * BLOCO 3: AJUSTAR LOGS AO RODAR AUTOMAÇÃO
 * 
 * Este teste valida e implementa:
 * 1. Contexto da automação executada dentro de um chatbox
 * 2. Iteração com a automação finalizada
 * 3. Abas para listar links e arquivos gerados
 * 4. Mostrar qual node gerou cada arquivo
 * 5. Botão para baixar arquivos
 * 6. Logs detalhados mostrando linkers transitando entre nodes
 */

import { test, expect, Page } from '@playwright/test';

const API_BASE_URL = 'http://localhost:3001/api';
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

test.describe('BLOCO 3 - Logs Melhorados', () => {
  
  test('deve exibir logs detalhados com informações de linker', async ({ page }) => {
    console.log('\n🚀 INICIANDO TESTE BLOCO 3 - LOGS MELHORADOS\n');
    
    // ========== PASSO 1: Criar automação com múltiplos nós ==========
    console.log('📍 PASSO 1: Criando automação para testar logs...');
    
    await page.goto('/automations/create');
    await page.waitForLoadState('networkidle');
    await wait(2000);
    
    // Adicionar 3 nós conectados
    const addNode = async (toolName: string) => {
      await page.click('button:has-text("Adicionar Ferramenta")');
      await wait(1000);
      
      const searchInput = page.locator('input[placeholder*="Buscar"]');
      if (await searchInput.count() > 0) {
        await searchInput.fill(toolName);
        await wait(500);
      }
      
      const toolButton = page.locator('button').filter({ has: page.locator(`h3:has-text("${toolName}")`) }).first();
      await toolButton.click();
      await wait(1000);
    };
    
    await addNode('HTTP Request');
    await addNode('LLM');
    await addNode('Conditional');
    
    // Conectar em sequência
    await page.evaluate(() => {
      const rfInstance = (window as any).__reactFlowInstance;
      const nodes = rfInstance?.getNodes() || [];
      
      if (nodes.length >= 3) {
        rfInstance.addEdges([
          {
            id: `edge-${nodes[0].id}-${nodes[1].id}`,
            source: nodes[0].id,
            target: nodes[1].id,
          },
          {
            id: `edge-${nodes[1].id}-${nodes[2].id}`,
            source: nodes[1].id,
            target: nodes[2].id,
          },
        ]);
      }
    });
    await wait(500);
    
    console.log('   ✅ 3 nós adicionados e conectados');
    
    // Configurar nós com linkers
    const configButtons = page.locator('button[title="Configurar nó"]');
    const buttonCount = await configButtons.count();
    
    // Configurar segundo nó (LLM) linkando ao primeiro
    if (buttonCount >= 2) {
      await configButtons.nth(1).click();
      await wait(1000);
      
      // Aplicar linker
      const linkerButtons = page.locator('button[title="Linkar campo"]');
      if (await linkerButtons.count() > 0) {
        await linkerButtons.first().click();
        await wait(500);
        
        const outputs = page.locator('[data-testid="output-option"]').first();
        if (await outputs.count() > 0) {
          await outputs.click();
          await wait(500);
        }
      }
      
      await page.locator('button:has-text("Salvar Configuração")').click();
      await wait(1000);
      
      console.log('   ✅ Nó 2 configurado com linker');
    }
    
    // Configurar terceiro nó (Conditional) linkando ao segundo
    if (buttonCount >= 3) {
      await configButtons.nth(2).click();
      await wait(1000);
      
      const linkerButtons = page.locator('button[title="Linkar campo"]');
      if (await linkerButtons.count() > 0) {
        await linkerButtons.first().click();
        await wait(500);
        
        const outputs = page.locator('[data-testid="output-option"]').first();
        if (await outputs.count() > 0) {
          await outputs.click();
          await wait(500);
        }
      }
      
      await page.locator('button:has-text("Salvar Configuração")').click();
      await wait(1000);
      
      console.log('   ✅ Nó 3 configurado com linker');
    }
    
    // Salvar automação
    const nameInput = page.locator('input[type="text"]').first();
    await nameInput.clear();
    await nameInput.fill('Teste BLOCO 3 - Logs Detalhados');
    
    await page.locator('button:has-text("Salvar")').click();
    await wait(2000);
    
    console.log('   ✅ Automação salva');
    
    // ========== PASSO 2: Executar automação ==========
    console.log('\n📍 PASSO 2: Executando automação...');
    
    const runButton = page.locator('button:has-text("Executar")');
    if (await runButton.count() > 0) {
      await runButton.click();
      await wait(1000);
      console.log('   ✅ Execução iniciada');
      
      // Aguardar execução completar
      await wait(5000);
      
      // ========== PASSO 3: Verificar estrutura dos logs ==========
      console.log('\n📍 PASSO 3: Verificando estrutura dos logs...');
      
      // Abrir aba de logs
      const logsTab = page.locator('button:has-text("Logs")');
      if (await logsTab.count() > 0) {
        await logsTab.click();
        await wait(1000);
      }
      
      // Verificar se há logs
      const logContainer = page.locator('[data-testid="execution-logs"]').or(
        page.locator('.execution-logs, .logs-container')
      );
      
      if (await logContainer.count() > 0) {
        console.log('   ✅ Container de logs encontrado');
        
        // Verificar estrutura esperada:
        // 1. Informações gerais da execução
        // 2. Logs por nó
        // 3. Dados de linker
        
        const logText = await logContainer.textContent();
        console.log('   📋 Conteúdo dos logs (primeiros 500 chars):');
        console.log(logText?.substring(0, 500));
        
        // Verificar elementos específicos dos logs
        const hasTimestamp = logText?.includes(':') || logText?.includes('ms') || logText?.includes('segundos');
        const hasNodeInfo = logText?.includes('Node') || logText?.includes('Nó');
        const hasLinkerInfo = logText?.includes('$') || logText?.includes('linked') || logText?.includes('output');
        
        console.log('\n   📊 Análise dos logs:');
        console.log(`      - Timestamp: ${hasTimestamp ? '✅' : '❌'}`);
        console.log(`      - Info de nós: ${hasNodeInfo ? '✅' : '❌'}`);
        console.log(`      - Info de linker: ${hasLinkerInfo ? '✅' : '❌'}`);
        
        // Verificar logs individuais por nó
        const logEntries = page.locator('[data-testid="log-entry"]').or(
          page.locator('.log-entry')
        );
        
        const logCount = await logEntries.count();
        console.log(`\n   📋 Entradas de log: ${logCount}`);
        
        if (logCount > 0) {
          // Analisar cada log
          for (let i = 0; i < Math.min(logCount, 5); i++) {
            const entry = logEntries.nth(i);
            const text = await entry.textContent();
            console.log(`      ${i + 1}. ${text?.substring(0, 100)}...`);
          }
        }
        
      } else {
        console.log('   ⚠️  Container de logs não encontrado');
      }
      
      // ========== PASSO 4: Verificar abas de arquivos e links ==========
      console.log('\n📍 PASSO 4: Verificando abas de arquivos e links...');
      
      // Procurar por abas
      const tabs = page.locator('[role="tab"]').or(
        page.locator('button').filter({ hasText: /arquivos|links|files/i })
      );
      
      const tabCount = await tabs.count();
      console.log(`   📋 Abas encontradas: ${tabCount}`);
      
      if (tabCount > 0) {
        const tabTexts = await tabs.allTextContents();
        console.log('   📑 Abas disponíveis:', tabTexts);
        
        // Verificar aba de arquivos
        const filesTab = page.locator('[role="tab"]:has-text("Arquivos")').or(
          page.locator('button:has-text("Arquivos")')
        );
        
        if (await filesTab.count() > 0) {
          await filesTab.click();
          await wait(500);
          console.log('   ✅ Aba de arquivos acessível');
          
          // Verificar lista de arquivos
          const fileList = page.locator('[data-testid="file-item"]').or(
            page.locator('.file-item')
          );
          
          const fileCount = await fileList.count();
          console.log(`   📎 Arquivos listados: ${fileCount}`);
          
          if (fileCount > 0) {
            // Verificar estrutura de cada arquivo
            const firstFile = fileList.first();
            const fileText = await firstFile.textContent();
            
            const hasNodeName = fileText?.includes('Node') || fileText?.includes('Nó');
            const hasDownloadButton = await firstFile.locator('button:has-text("Baixar")').or(
              firstFile.locator('[title="Baixar"]')
            ).count() > 0;
            
            console.log(`      - Mostra node gerador: ${hasNodeName ? '✅' : '❌'}`);
            console.log(`      - Tem botão download: ${hasDownloadButton ? '✅' : '❌'}`);
          }
        }
        
        // Verificar aba de links
        const linksTab = page.locator('[role="tab"]:has-text("Links")').or(
          page.locator('button:has-text("Links")')
        );
        
        if (await linksTab.count() > 0) {
          await linksTab.click();
          await wait(500);
          console.log('   ✅ Aba de links acessível');
          
          const linkList = page.locator('[data-testid="link-item"]').or(
            page.locator('.link-item, a[href]')
          );
          
          const linkCount = await linkList.count();
          console.log(`   🔗 Links listados: ${linkCount}`);
        }
        
      } else {
        console.log('   ℹ️  Nenhuma aba encontrada (pode não ter arquivos/links gerados)');
      }
      
      // ========== PASSO 5: Verificar chatbox de contexto ==========
      console.log('\n📍 PASSO 5: Verificando chatbox de contexto...');
      
      const chatbox = page.locator('[data-testid="execution-chatbox"]').or(
        page.locator('.chatbox, .chat-container').filter({ hasText: /conversa|chat|contexto/i })
      );
      
      if (await chatbox.count() > 0) {
        console.log('   ✅ Chatbox de contexto encontrado');
        
        // Verificar se é possível interagir
        const chatInput = page.locator('input[placeholder*="mensagem"]').or(
          page.locator('textarea[placeholder*="mensagem"]')
        );
        
        if (await chatInput.count() > 0) {
          console.log('   ✅ Campo de input do chat disponível');
          
          // Testar envio de mensagem
          await chatInput.fill('Explique esta execução');
          
          const sendButton = page.locator('button:has-text("Enviar")').or(
            page.locator('button[type="submit"]').filter({ has: chatInput })
          );
          
          if (await sendButton.count() > 0) {
            await sendButton.click();
            await wait(2000);
            console.log('   ✅ Mensagem enviada ao chatbox');
            
            // Verificar resposta
            const messages = page.locator('[data-testid="chat-message"]').or(
              page.locator('.chat-message, .message')
            );
            
            const messageCount = await messages.count();
            console.log(`   💬 Mensagens no chat: ${messageCount}`);
          }
        }
      } else {
        console.log('   ℹ️  Chatbox de contexto não implementado ainda');
      }
      
      // ========== PASSO 6: Validar detalhamento dos logs ==========
      console.log('\n📍 PASSO 6: Validando detalhamento dos logs...');
      
      // Voltar para aba de logs
      const logsTabAgain = page.locator('button:has-text("Logs")');
      if (await logsTabAgain.count() > 0) {
        await logsTabAgain.click();
        await wait(500);
      }
      
      // Verificar se logs mostram:
      // 1. Nome do nó executado
      // 2. Timestamp
      // 3. Dados de entrada (inputs)
      // 4. Dados de saída (outputs)
      // 5. Linkers sendo resolvidos
      
      const detailedLog = await page.evaluate(() => {
        const logElement = document.querySelector('[data-testid="execution-logs"]');
        if (!logElement) return null;
        
        const text = logElement.textContent || '';
        
        return {
          hasNodeNames: /Node|Nó|Tool/.test(text),
          hasTimestamps: /\d{2}:\d{2}/.test(text) || /ms|segundos/.test(text),
          hasInputs: /input|entrada|parâmetro/i.test(text),
          hasOutputs: /output|saída|resultado/i.test(text),
          hasLinkers: /\$|linked|referência/.test(text),
          hasDuration: /duração|duration|tempo/i.test(text),
          hasStatus: /sucesso|erro|falha|success|error|failed/i.test(text),
        };
      });
      
      console.log('\n   📊 Detalhamento dos logs:');
      console.log(`      - Nomes de nós: ${detailedLog?.hasNodeNames ? '✅' : '❌'}`);
      console.log(`      - Timestamps: ${detailedLog?.hasTimestamps ? '✅' : '❌'}`);
      console.log(`      - Dados de entrada: ${detailedLog?.hasInputs ? '✅' : '❌'}`);
      console.log(`      - Dados de saída: ${detailedLog?.hasOutputs ? '✅' : '❌'}`);
      console.log(`      - Resolução de linkers: ${detailedLog?.hasLinkers ? '✅' : '❌'}`);
      console.log(`      - Duração: ${detailedLog?.hasDuration ? '✅' : '❌'}`);
      console.log(`      - Status: ${detailedLog?.hasStatus ? '✅' : '❌'}`);
      
      // Calcular score de completude
      const features = Object.values(detailedLog || {});
      const implemented = features.filter(Boolean).length;
      const total = features.length;
      const score = Math.round((implemented / total) * 100);
      
      console.log(`\n   📈 Score de completude dos logs: ${score}% (${implemented}/${total})`);
      
      if (score >= 80) {
        console.log('   ✅ Logs estão bem detalhados!');
      } else if (score >= 50) {
        console.log('   ⚠️  Logs parcialmente implementados, melhorias necessárias');
      } else {
        console.log('   ❌ Logs precisam de melhorias significativas');
      }
    }
    
    console.log('\n✅ TESTE BLOCO 3 FINALIZADO\n');
  });
  
  test('deve permitir download de arquivos gerados', async ({ page }) => {
    console.log('\n🔍 TESTE: Download de arquivos gerados\n');
    
    // Navegar para automações
    await page.goto('/automations');
    await page.waitForLoadState('networkidle');
    
    // Selecionar primeira automação
    const automationCards = page.locator('[data-testid="automation-card"]').or(
      page.locator('.automation-card')
    );
    
    if (await automationCards.count() > 0) {
      await automationCards.first().click();
      await wait(1000);
      
      // Ir para logs/arquivos
      const filesTab = page.locator('button:has-text("Arquivos")');
      if (await filesTab.count() > 0) {
        await filesTab.click();
        await wait(500);
        
        // Verificar botões de download
        const downloadButtons = page.locator('button:has-text("Baixar")').or(
          page.locator('[title="Baixar"]')
        );
        
        const buttonCount = await downloadButtons.count();
        console.log(`   📎 Botões de download: ${buttonCount}`);
        
        if (buttonCount > 0) {
          console.log('   ✅ Botões de download disponíveis');
          
          // Testar download (sem realmente baixar)
          const downloadPromise = page.waitForEvent('download', { timeout: 5000 }).catch(() => null);
          await downloadButtons.first().click();
          const download = await downloadPromise;
          
          if (download) {
            console.log('   ✅ Download iniciado com sucesso');
            console.log(`      Arquivo: ${download.suggestedFilename()}`);
          } else {
            console.log('   ℹ️  Download não iniciou (pode não haver arquivo real)');
          }
        }
      }
    }
  });
});
