/**
 * Teste: Agente com MCP Pollinations gerando imagens
 * 
 * Este script:
 * 1. Configura o MCP Pollinations
 * 2. Cria um agente com gpt-3.5-turbo
 * 3. Adiciona a tool de gerar imagem do MCP
 * 4. Cria uma automação Manual Trigger → Agent
 * 5. Executa e valida a geração de imagem
 */

import { useStore } from './source/store/store.js';
import { generateId } from './source/utils/id.js';
import { FlowEngineV2 } from './source/core/flowEngineV2.js';

async function testAgentWithMCPPollinations() {
  console.log('🧪 ========================================');
  console.log('🧪 TESTE: Agente + MCP Pollinations');
  console.log('🧪 ========================================\n');

  const store = useStore.getState();

  try {
    // ========================================
    // 1. CONFIGURAR MCP POLLINATIONS
    // ========================================
    console.log('📦 [1/5] Configurando MCP Pollinations...\n');

    const mcpId = generateId();
    const mcp = {
      id: mcpId,
      name: 'Pollinations',
      description: 'AI Image Generation via Pollinations',
      version: '1.0.0',
      server: '@pollinations/model-context-protocol',
      installType: 'npx' as const,
      envVars: {},
      tools: [
        {
          id: 'generate-image',
          name: 'generate-image',
          description: 'Generate an image from a text prompt using AI',
          parameters: {
            type: 'object',
            properties: {
              prompt: {
                type: 'string',
                description: 'The text prompt describing the image to generate'
              },
              width: {
                type: 'number',
                description: 'Image width (default: 1024)',
                default: 1024
              },
              height: {
                type: 'number',
                description: 'Image height (default: 1024)',
                default: 1024
              },
              seed: {
                type: 'number',
                description: 'Random seed for reproducibility (optional)'
              },
              nologo: {
                type: 'boolean',
                description: 'Remove Pollinations logo (default: true)',
                default: true
              }
            },
            required: ['prompt']
          },
          handler: 'generate-image'
        }
      ],
      enabled: true,
      metadata: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        installType: 'npx',
        importedFrom: 'test'
      }
    };

    // ✅ Primeiro, descobrir as tools REAIS do MCP
    console.log('🔍 Conectando ao MCP Pollinations para descobrir tools...\n');
    
    const { MCPClient } = await import('./source/services/mcpClient.js');
    const client = new MCPClient();
    
    try {
      // Conectar ao servidor MCP
      const initResult = await client.connect('npx', ['-y', '@pollinations/model-context-protocol']);
      console.log(`✅ Conectado ao MCP: ${initResult.serverInfo.name} v${initResult.serverInfo.version}`);
      
      // Listar tools disponíveis
      const tools = await client.listTools();
      console.log(`📋 Tools disponíveis: ${tools.length}`);
      
      tools.forEach((tool: any, idx: number) => {
        console.log(`   ${idx + 1}. ${tool.name}: ${tool.description}`);
      });
      
      // Atualizar MCP com tools reais
      mcp.tools = tools.map((tool: any) => ({
        id: tool.name,
        name: tool.name,
        description: tool.description || tool.name,
        parameters: tool.inputSchema || {},
        handler: tool.name
      }));
      
      console.log(`\n✅ MCP atualizado com ${mcp.tools.length} tools reais\n`);
      
      // Desconectar (será reconectado quando executar)
      client.disconnect();
      
    } catch (error: any) {
      console.error(`❌ Erro ao conectar ao MCP:`, error.message);
      console.log('⚠️  Usando tools mock...\n');
    }
    
    store.createMCP(mcp);
    console.log(`✅ MCP Pollinations criado: ${mcpId}`);
    console.log(`   Tools: ${mcp.tools.length} tool(s)`);
    if (mcp.tools.length > 0) {
      console.log(`   - ${mcp.tools[0].name}: ${mcp.tools[0].description}`);
    }
    console.log();

    // ========================================
    // 2. CONFIGURAR LLM (se não estiver configurado)
    // ========================================
    console.log('⚙️  [2/5] Verificando configuração LLM...\n');

    const config = store.config;
    if (!config?.llm?.endpoint) {
      console.log('⚠️  LLM não configurado. Configurando...');
      
      store.updateConfig({
        llm: {
          endpoint: 'https://api.llm7.io/v1',
          apiKey: 'not-needed',
          model: 'gpt-4o-mini',  // ✅ Modelo com melhor function calling
          temperature: 0.7,
          maxTokens: 2000
        },
        theme: 'default',
        locale: 'pt-BR'
      });
      
      console.log('✅ LLM configurado: https://api.llm7.io/v1');
      console.log('   Modelo: gpt-3.5-turbo\n');
    } else {
      console.log('✅ LLM já configurado');
      console.log(`   Endpoint: ${config.llm.endpoint}`);
      console.log(`   Modelo: ${config.llm.model}\n`);
    }

    // ========================================
    // 3. CRIAR AGENTE COM MCP TOOL
    // ========================================
    console.log('🤖 [3/5] Criando agente com MCP Pollinations...\n');

    const agentId = generateId();
    const agent = {
      id: agentId,
      name: 'Image Generator Bot',
      description: 'Agente que gera imagens usando Pollinations AI',
      systemPrompt: `You are an AI image generation assistant with access to the generate-image tool.

CRITICAL: You MUST use the generate-image tool to actually create images. Do NOT just write prompts or explain - USE THE TOOL.

When asked to generate an image:
1. Immediately call the generate-image function with a detailed English prompt
2. Wait for the result
3. Confirm the image was generated

USE THE TOOL NOW!`,
      model: 'gpt-4o-mini',  // ✅ Modelo com function calling
      temperature: 0.8,
      maxTokens: 2000,
      tools: [], // Sem FLUI tools
      mcpIds: [mcpId], // ✅ MCP Pollinations habilitado
      enabled: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      metadata: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        executionCount: 0
      }
    };

    store.createAgent(agent);
    console.log(`✅ Agente criado: ${agentId}`);
    console.log(`   Nome: ${agent.name}`);
    console.log(`   Modelo: ${agent.model}`);
    console.log(`   MCPs habilitados: ${agent.mcpIds.length}`);
    console.log(`   - Pollinations (generate-image)\n`);

    // ========================================
    // 4. CRIAR AUTOMAÇÃO
    // ========================================
    console.log('🔧 [4/5] Criando automação...\n');

    const automationId = generateId();
    const node1Id = `node-${Date.now()}`;
    const node2Id = `node-${Date.now() + 1}`;

    const automation = {
      id: automationId,
      name: 'Test MCP Pollinations',
      description: 'Teste de geração de imagem via MCP',
      version: '2.0.0',
      nodes: [
        {
          id: node1Id,
          type: 'tool',
          name: 'Manual Trigger',
          description: 'Trigger manual',
          config: {},
          position: { x: 100, y: 100 },
          toolId: 'manual-trigger'
        },
        {
          id: node2Id,
          type: 'agent',
          name: 'Image Generator',
          description: 'Gera imagem via Pollinations',
          config: {
            message: 'Generate an image of a cute cat looking at the moon'
          },
          position: { x: 400, y: 100 },
          agentId: agentId
        }
      ],
      edges: [
        {
          id: `edge-${node1Id}-${node2Id}`,
          source: node1Id,
          target: node2Id
        }
      ],
      startNodeId: node1Id,
      enabled: true,
      metadata: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    };

    // Salvar via storage
    const { saveAutomation } = await import('./source/store/automationStorage.js');
    saveAutomation(automation);

    console.log(`✅ Automação criada: ${automationId}`);
    console.log(`   Nodes: ${automation.nodes.length}`);
    console.log(`   - ${automation.nodes[0].name} (${automation.nodes[0].type})`);
    console.log(`   - ${automation.nodes[1].name} (${automation.nodes[1].type})`);
    console.log(`   Edges: ${automation.edges.length}\n`);

    // ========================================
    // 5. EXECUTAR AUTOMAÇÃO
    // ========================================
    console.log('🚀 [5/5] Executando automação...\n');
    console.log('=' .repeat(60));

    const executionFlow = {
      id: automation.id,
      name: automation.name,
      description: automation.description || '',
      version: automation.version || '2.0.0',
      nodes: automation.nodes.map(node => ({
        id: node.id,
        type: node.toolId || node.type || 'tool',
        name: node.name,
        config: node.config || {},
        position: node.position,
        ...(node.agentId && { agentId: node.agentId }),
        ...(node.toolId && { toolId: node.toolId }),
      })),
      edges: automation.edges || [],
      startNodeId: automation.startNodeId || automation.nodes[0]?.id,
    };

    const allLogs: any[] = [];
    const engine = new FlowEngineV2(
      executionFlow,
      (log: any) => {
        allLogs.push(log);
        
        // Mostrar logs importantes
        if (log.status === 'running') {
          console.log(`⚡ ${log.nodeName}: ${log.message}`);
        } else if (log.status === 'completed') {
          console.log(`✅ ${log.nodeName}: ${log.message}`);
          if (log.data?.output) {
            console.log(`   Output:`, JSON.stringify(log.data.output, null, 2));
          }
        } else if (log.status === 'failed') {
          console.error(`❌ ${log.nodeName}: ${log.message}`);
          if (log.error) {
            console.error(`   Erro:`, log.error);
          }
        }
      }
    );

    const result = await engine.execute({});

    console.log('=' .repeat(60));
    console.log('\n📊 RESULTADO DA EXECUÇÃO:\n');
    console.log(`Status: ${result.status}`);
    console.log(`Logs: ${result.logs.length}`);
    
    if (result.status === 'completed') {
      console.log('\n✅ ✅ ✅ SUCESSO! ✅ ✅ ✅\n');
      
      // Verificar se imagem foi gerada
      const agentLog = allLogs.find(log => log.nodeId === node2Id && log.status === 'completed');
      if (agentLog?.data?.output) {
        console.log('🖼️  IMAGEM GERADA:');
        console.log(JSON.stringify(agentLog.data.output, null, 2));
        console.log('\n🎉 MCP Pollinations funcionou corretamente!');
      }
    } else {
      console.log('\n❌ FALHOU\n');
      console.log('Erro:', result.error);
      
      // Mostrar todos os logs para debug
      console.log('\n📋 LOGS COMPLETOS:');
      allLogs.forEach((log, idx) => {
        console.log(`\n[${idx + 1}] ${log.nodeName} (${log.status})`);
        console.log(`    ${log.message}`);
        if (log.data) {
          console.log(`    Data:`, JSON.stringify(log.data, null, 2));
        }
        if (log.error) {
          console.log(`    Error:`, log.error);
        }
      });
    }

    console.log('\n🧪 ========================================');
    console.log('🧪 TESTE FINALIZADO');
    console.log('🧪 ========================================\n');

    return result.status === 'completed';

  } catch (error: any) {
    console.error('\n❌ ERRO NO TESTE:', error);
    console.error('Stack:', error.stack);
    return false;
  }
}

// Executar teste
testAgentWithMCPPollinations()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  });
