import express, { Request, Response } from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { getAutomations, getAutomation, saveAutomation, deleteAutomation } from '../store/automationStorage.js';
import { useStore } from '../store/store.js';
import { getToolRegistry } from '../core/toolRegistry.js';
import { ToolExecutor } from '../core/toolExecutor.js';
import { ExecutionContext } from '../core/types.js';
import { executeFlow } from '../core/flowEngine.js';
import { FlowDefinition, FlowExecutionLog } from '../core/flowTypes.js';
import { FlowEngineV2 } from '../core/flowEngineV2.js';
import { getCustomNodeManager, CustomNodeManager } from './customNodeManager.js';
import { listTools, getToolMetadata } from './toolApi.js';
import { registerAllTools } from '../tools/index.js';
import { extractNodeOutputKeys } from './nodeOutputExtractor.js';

const app = express();
const PORT = 3001;
const httpServer = createServer(app);
const wss = new WebSocketServer({ server: httpServer });

// Gerenciar conexões WebSocket
const clients = new Set<WebSocket>();

wss.on('connection', (ws: WebSocket) => {
  console.log('📡 Cliente WebSocket conectado');
  clients.add(ws);

  ws.on('close', () => {
    console.log('📡 Cliente WebSocket desconectado');
    clients.delete(ws);
  });

  ws.on('error', (error) => {
    console.error('❌ Erro WebSocket:', error);
    clients.delete(ws);
  });
});

// Broadcast para todos os clientes conectados
function broadcast(data: any) {
  const message = JSON.stringify(data);
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

app.use(cors());
app.use(express.json());

// Automações
app.get('/api/automations', (_req: Request, res: Response) => {
  const automations = getAutomations();
  res.json(automations);
});

app.get('/api/automations/:id', (req: Request, res: Response) => {
  const automations = getAutomations();
  const automation = automations.find(a => a.id === req.params.id);

  if (!automation) {
    return res.status(404).json({ error: 'Automação não encontrada' });
  }

  res.json(automation);
});

// 🆕 Novo endpoint: Buscar outputs disponíveis para um node
app.get('/api/automations/:automationId/nodes/:nodeId/available-outputs', (req: Request, res: Response) => {
  try {
    const { automationId, nodeId } = req.params;
    
    // Buscar automação
    const automations = getAutomations();
    const automation = automations.find(a => a.id === automationId);
    
    if (!automation) {
      return res.status(404).json({ error: 'Automação não encontrada' });
    }
    
    // Encontrar node target
    const targetNode = automation.nodes?.find((n: any) => n.id === nodeId);
    if (!targetNode) {
      return res.status(404).json({ error: 'Node não encontrado' });
    }
    
    // Calcular nodes anteriores (pais) via edges
    const parentNodeIds = getParentNodesRecursive(automation.edges || [], nodeId);
    
    // Para cada node pai, extrair outputs disponíveis
    const availableOutputs = parentNodeIds.map((parentId: string) => {
      const parentNode = automation.nodes?.find((n: any) => n.id === parentId);
      if (!parentNode) return null;
      
      const outputKeys = extractNodeOutputKeys(parentNode);
      
      // Node pode ter estrutura antiga (data) ou nova (config diretamente)
      const nodeData = (parentNode as any).data || parentNode;
      
      return {
        nodeId: parentId,
        nodeName: nodeData.label || parentNode.name || 'Node',
        toolId: nodeData.toolId || parentNode.config?.toolId,
        outputKeys: outputKeys,
      };
    }).filter(Boolean);
    
    const targetData = (targetNode as any).data || targetNode;
    
    res.json({
      nodeId,
      nodeName: targetData.label || targetNode.name,
      availableOutputs,
    });
  } catch (error: any) {
    console.error('❌ Erro ao buscar outputs disponíveis:', error);
    res.status(500).json({ error: error.message });
  }
});

// Helper: Obter todos os nodes pai (recursivo)
function getParentNodesRecursive(edges: any[], targetNodeId: string): string[] {
  const parents = new Set<string>();
  const visited = new Set<string>();
  
  function findParents(nodeId: string) {
    if (visited.has(nodeId)) return;
    visited.add(nodeId);
    
    const parentEdges = edges.filter((e: any) => e.target === nodeId);
    parentEdges.forEach((edge: any) => {
      if (!parents.has(edge.source)) {
        parents.add(edge.source);
        findParents(edge.source); // Recursivo: buscar pais dos pais
      }
    });
  }
  
  findParents(targetNodeId);
  return Array.from(parents).sort();
}

app.post('/api/automations', (req: Request, res: Response) => {
  console.log('📝 [API] POST /api/automations');
  try {
    // saveAutomation agora faz validação e normalização
    const saved = saveAutomation(req.body);
    console.log('✅ [API] Automação salva:', saved.id);
    res.json({ success: true, id: saved.id, automation: saved });
  } catch (error: any) {
    console.error('❌ [API] Erro ao salvar automação:', error);
    res.status(400).json({ error: error.message });
  }
});

app.put('/api/automations/:id', (req: Request, res: Response) => {
  console.log('📝 [API] PUT /api/automations/:id', req.params.id);
  try {
    // Verificar se existe
    const existing = getAutomation(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Automação não encontrada' });
    }
    
    // Merge com dados existentes
    const toUpdate = {
      ...req.body,
      id: req.params.id,
      createdAt: existing.createdAt, // Preservar createdAt original
    };
    
    // saveAutomation faz validação e normalização
    const saved = saveAutomation(toUpdate);
    console.log('✅ [API] Automação atualizada:', saved.id);
    res.json({ success: true, id: saved.id, automation: saved });
  } catch (error: any) {
    console.error('❌ [API] Erro ao atualizar automação:', error);
    res.status(400).json({ error: error.message });
  }
});

app.patch('/api/automations/:id', (req: Request, res: Response) => {
  console.log('📝 [API] PATCH /api/automations/:id', req.params.id);
  try {
    const existing = getAutomation(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Automação não encontrada' });
    }
    
    // Merge parcial (PATCH)
    const updated = {
      ...existing,
      ...req.body,
      id: req.params.id, // Garantir que ID não muda
      createdAt: existing.createdAt, // Preservar createdAt original
    };
    
    // saveAutomation faz validação e normalização
    const saved = saveAutomation(updated);
    console.log('✅ [API] Automação atualizada (patch):', saved.id);
    res.json({ success: true, id: saved.id, automation: saved });
  } catch (error: any) {
    console.error('❌ [API] Erro ao atualizar automação:', error);
    res.status(400).json({ error: error.message });
  }
});

app.delete('/api/automations/:id', (req: Request, res: Response) => {
  deleteAutomation(req.params.id);
  res.json({ success: true });
});

app.post('/api/automations/:id/execute', async (req: Request, res: Response) => {
  console.log('🚀🚀🚀 [API] POST /api/automations/:id/execute - USANDO EXECUTIONENGINE V3!', req.params.id);
  
  try {
    const automations = getAutomations();
    const automation = automations.find(a => a.id === req.params.id);
    
    if (!automation) {
      return res.status(404).json({ error: 'Automação não encontrada' });
    }

    // Criar sandbox único para esta automação
    const { getSandboxManager } = await import('./sandboxManager.js');
    const sandboxManager = getSandboxManager();
    
    // Coletar env vars dos MCPs usados
    const store = useStore.getState();
    const mcpEnvVars: Record<string, Record<string, string>> = {};
    
    for (const mcp of store.mcps) {
      if (mcp.envVars && Object.keys(mcp.envVars).length > 0) {
        mcpEnvVars[mcp.id] = mcp.envVars;
      }
    }
    
    const sandboxPath = await sandboxManager.createSandbox({
      automationId: automation.id,
      mcpEnvVars,
      customEnvVars: {},
    });
    
    console.log(`📦 [API] Sandbox criado: ${sandboxPath}`);

    console.log('✨ [API] Importando ExecutionEngineV3...');
    // Converter para ExecutionFlow (formato do novo engine)
    const { ExecutionEngineV3 } = await import('./executionEngine.js');
    console.log('✅ [API] ExecutionEngineV3 importado com sucesso!');
    
    const executionFlow = {
      id: automation.id,
      name: automation.name,
      nodes: automation.nodes.map(node => ({
        id: node.id,
        type: node.config?.toolId || node.type || 'shell-executor', // Usar toolId como type
        name: node.name,
        config: node.config || {},
        position: node.position,
      })),
      edges: automation.edges || [],
      startNodeId: automation.startNodeId || automation.nodes[0]?.id,
    };

    console.log('📊 [API] Execução iniciada:', { 
      flowId: executionFlow.id,
      nodesCount: executionFlow.nodes.length
    });

    // Coletar logs e atualizações de nodes em tempo real
    const allLogs: any[] = [];
    const nodeResults: any[] = [];

    const engine = new ExecutionEngineV3(
      executionFlow,
      {
        debugMode: req.body.debugMode || false,
        enableCache: req.body.enableCache !== false,
        maxRetries: req.body.maxRetries || 3,
      },
      (log) => {
        allLogs.push(log);
        // Broadcast em tempo real via WebSocket
        broadcast({
          type: 'execution-log',
          automationId: automation.id,
          log,
        });
      },
      (nodeResult) => {
        nodeResults.push(nodeResult);
        // Broadcast atualização de node em tempo real
        broadcast({
          type: 'node-update',
          automationId: automation.id,
          nodeResult,
        });
      }
    );

    // Executar automação
    const result = await engine.execute(req.body.initialData || {});

    console.log('✅ [API] Execução concluída:', {
      status: result.status,
      duration: result.duration,
      nodesExecuted: result.nodes.size,
    });

    // Atualizar runCount e metadata
    saveAutomation({
      ...automation,
      runCount: (automation.runCount || 0) + 1,
      metadata: {
        createdAt: automation.metadata?.createdAt || automation.createdAt,
        updatedAt: new Date().toISOString(),
        lastRunAt: new Date().toISOString(),
      },
    });

    // Broadcast conclusão
    broadcast({
      type: 'execution-complete',
      automationId: automation.id,
      result,
    });

    // Responder com resultado detalhado
    res.json({
      success: result.status === 'completed',
      executionId: result.id,
      status: result.status,
      startTime: result.startTime,
      endTime: result.endTime,
      duration: result.duration,
      finalOutput: result.finalOutput,
      error: result.error,
      logs: allLogs,
      nodes: Array.from(result.nodes.values()),
    });
  } catch (error: any) {
    console.error('❌ [API] Erro na execução:', error);
    res.status(500).json({ 
      success: false,
      error: error.message,
      stack: error.stack,
    });
  }
});

// ============= TOOLS ENDPOINTS (via toolApi) =============

// GET /api/tools/:toolId/agents-options - Obter opções de agentes para select
app.get('/api/tools/:toolId/agents-options', (_req: Request, res: Response) => {
  const store = useStore.getState();
  const agents = store.agents.map(agent => ({
    label: agent.name,
    value: agent.id,
    description: agent.systemPrompt?.substring(0, 100) || 'Sem descrição',
  }));
  res.json(agents);
});

// GET /api/agents/:id/as-tool - Obter agente como ferramenta executável
app.get('/api/agents/:id/as-tool', (req: Request, res: Response) => {
  try {
    const store = useStore.getState();
    const agent = store.agents.find(a => a.id === req.params.id);
    
    if (!agent) {
      return res.status(404).json({ error: 'Agente não encontrado' });
    }
    
    // Converter agente para formato de tool
    const toolVersion = {
      id: `agent-${agent.id}`,
      name: agent.name,
      description: agent.systemPrompt || 'Agente AI configurável',
      category: 'agent',
      version: '1.0.0',
      params: [
        {
          name: 'prompt',
          key: 'prompt',
          type: 'string',
          description: 'Prompt/instrução para o agente',
          required: true,
          placeholder: 'Digite sua instrução...',
          ui: {
            widgetType: 'textInput',
            allowExpressions: true,
          },
        },
        {
          name: 'temperature',
          key: 'temperature',
          type: 'number',
          description: 'Temperatura de geração (0-1)',
          required: false,
          default: 0.7,
          ui: {
            widgetType: 'number',
          },
        },
        {
          name: 'maxTokens',
          key: 'maxTokens',
          type: 'number',
          description: 'Máximo de tokens na resposta',
          required: false,
          default: 1000,
          ui: {
            widgetType: 'number',
          },
        },
      ],
      ui: {
        icon: 'Bot',
        color: '#3b82f6',
        tags: ['agent', 'ai', agent.model],
        examples: [],
      },
      capabilities: {},
      config: {
        timeout: 60000,
        retries: 0,
        sandbox: false,
        concurrent: false,
      },
    };
    
    console.log(`🤖 [API] Agente como tool: ${toolVersion.id}`);
    
    res.json(toolVersion);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============= AGENTS ENDPOINTS =============

app.get('/api/agents', (_req: Request, res: Response) => {
  const store = useStore.getState();
  res.json(store.agents);
});

app.get('/api/agents/:id', (req: Request, res: Response) => {
  const store = useStore.getState();
  const agent = store.agents.find(a => a.id === req.params.id);
  
  if (!agent) {
    return res.status(404).json({ error: 'Agente não encontrado' });
  }
  
  res.json(agent);
});

app.post('/api/agents', (req: Request, res: Response) => {
  try {
    const agent = req.body;
    const store = useStore.getState();
    
    const newAgent = {
      ...agent,
      id: agent.id || Date.now().toString(),
      metadata: {
        createdAt: agent.metadata?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        executionCount: agent.metadata?.executionCount || 0,
      },
    };
    
    store.createAgent(newAgent);
    res.json({ success: true, id: newAgent.id });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.put('/api/agents/:id', (req: Request, res: Response) => {
  try {
    const store = useStore.getState();
    const existing = store.agents.find(a => a.id === req.params.id);
    
    if (!existing) {
      return res.status(404).json({ error: 'Agente não encontrado' });
    }
    
    const updates = {
      ...req.body,
      id: req.params.id,
      metadata: {
        ...existing.metadata,
        ...req.body.metadata,
        createdAt: existing.metadata?.createdAt || existing.createdAt,
        updatedAt: new Date().toISOString(),
      },
    };
    
    store.updateAgent(req.params.id, updates);
    res.json({ success: true, id: req.params.id });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.patch('/api/agents/:id', (req: Request, res: Response) => {
  try {
    const store = useStore.getState();
    const existing = store.agents.find(a => a.id === req.params.id);
    
    if (!existing) {
      return res.status(404).json({ error: 'Agente não encontrado' });
    }
    
    store.updateAgent(req.params.id, req.body);
    res.json({ success: true, id: req.params.id });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.delete('/api/agents/:id', (req: Request, res: Response) => {
  try {
    const store = useStore.getState();
    store.deleteAgent(req.params.id);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============= MCPs ENDPOINTS =============

app.get('/api/mcps', (_req: Request, res: Response) => {
  const store = useStore.getState();
  res.json(store.mcps);
});

app.get('/api/mcps/:id', (req: Request, res: Response) => {
  const store = useStore.getState();
  const mcp = store.mcps.find(m => m.id === req.params.id);
  
  if (!mcp) {
    return res.status(404).json({ error: 'MCP não encontrado' });
  }
  
  res.json(mcp);
});

app.post('/api/mcps', async (req: Request, res: Response) => {
  try {
    const mcp = req.body;
    const store = useStore.getState();
    
    // Preparar dados do MCP
    const mcpData = {
      ...mcp,
      id: mcp.id || Date.now().toString(),
      tools: [],
      metadata: {
        createdAt: mcp.metadata?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastSyncedAt: null,
      },
    };
    
    // Salvar MCP e pegar o objeto retornado
    const newMcp = store.createMCP(mcpData);
    
    // Tentar sincronizar automaticamente (não bloqueia resposta)
    setImmediate(async () => {
      try {
        console.log(`🔄 [API] Auto-sincronizando MCP: ${newMcp.name}`);
        
        // Executar MCPExecutor para buscar tools
        const { MCPExecutor } = await import('./mcpExecutor.js');
        
        // Extrair package name corretamente dos args
        // Se args = ["-y", "@pkg/name"], pegar o que não é flag
        let packageName = newMcp.name;
        if (mcp.args && Array.isArray(mcp.args)) {
          // Filtrar flags (começam com -)
          const nonFlagArgs = mcp.args.filter((arg: string) => !arg.startsWith('-'));
          if (nonFlagArgs.length > 0) {
            packageName = nonFlagArgs[0];
          }
        }
        
        // Usar installType do próprio MCP
        const actualInstallType = newMcp.installType || (mcp.command === 'npx' ? 'npx' : 'npm');
        
        console.log(`📦 [API] installType: ${actualInstallType}, server: ${newMcp.server || packageName}`);
        
        const result = await MCPExecutor.installMCP({
          name: newMcp.name,
          description: newMcp.description,
          version: newMcp.version || '1.0.0',
          server: newMcp.server || packageName,
          installType: actualInstallType as any,
        });
        
        console.log(`🔍 [API] Resultado do MCPExecutor:`, {
          success: result.success,
          toolsCount: result.tools?.length || 0,
        });
        
        // Se o MCPExecutor não encontrou tools automaticamente, criar uma tool genérica
        const toolsToRegister = (result.success && result.tools && result.tools.length > 0) 
          ? result.tools 
          : [{
              id: `${(newMcp.server || '').replace(/[@\/]/g, '-').replace(/^-+/, '')}-default`,
              name: newMcp.server || 'unknown',
              description: `Tool principal de ${newMcp.name}`,
              handler: 'execute',
              parameters: {},
            }];
        
        console.log(`📦 [API] Atualizando MCP ${newMcp.id} com ${toolsToRegister.length} tools...`);
        
        // Atualizar MCP com tools
        store.updateMCP(newMcp.id, {
          tools: toolsToRegister,
          metadata: {
            createdAt: newMcp.metadata?.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            lastSyncedAt: new Date().toISOString(),
          },
        });
        
        console.log(`✅ [API] MCP atualizado no store`);
        
        // Aguardar um pouco para garantir que store foi atualizado
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Pegar MCP atualizado do store - IMPORTANTE: pegar estado fresco!
        const freshStore = useStore.getState();
        const updatedMCP = freshStore.mcps.find(m => m.id === newMcp.id);
        console.log(`🔍 [API] MCP do store (fresh):`, {
          found: !!updatedMCP,
          id: updatedMCP?.id,
          toolsCount: updatedMCP?.tools?.length || 0,
        });
        
        if (updatedMCP && updatedMCP.tools && updatedMCP.tools.length > 0) {
          console.log(`🔧 [API] Carregando tools no registry...`);
          
          // Registrar tools no registry
          const { MCPLoader } = await import('./mcpLoader.js');
          await MCPLoader.loadMCP(updatedMCP);
          
          console.log(`✅ [API] MCP auto-sincronizado: ${updatedMCP.tools.length} tools registradas no registry`);
        } else {
          console.warn(`⚠️ [API] MCP não encontrado no store após update`);
        }
      } catch (error: any) {
        console.error(`❌ [API] Erro ao auto-sincronizar MCP: ${error.message}`);
      }
    });
    
    res.json({ success: true, id: newMcp.id, message: 'MCP adicionado, sincronizando tools em background...' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.put('/api/mcps/:id', (req: Request, res: Response) => {
  try {
    const store = useStore.getState();
    const existing = store.mcps.find(m => m.id === req.params.id);
    
    if (!existing) {
      return res.status(404).json({ error: 'MCP não encontrado' });
    }
    
    const updates = {
      ...req.body,
      id: req.params.id,
      metadata: {
        ...existing.metadata,
        ...req.body.metadata,
        updatedAt: new Date().toISOString(),
      },
    };
    
    store.updateMCP(req.params.id, updates);
    res.json({ success: true, id: req.params.id });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.patch('/api/mcps/:id', (req: Request, res: Response) => {
  try {
    const store = useStore.getState();
    const existing = store.mcps.find(m => m.id === req.params.id);
    
    if (!existing) {
      return res.status(404).json({ error: 'MCP não encontrado' });
    }
    
    store.updateMCP(req.params.id, req.body);
    res.json({ success: true, id: req.params.id });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.delete('/api/mcps/:id', (req: Request, res: Response) => {
  try {
    const store = useStore.getState();
    store.deleteMCP(req.params.id);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/mcps/:id/sync', async (req: Request, res: Response) => {
  try {
    const store = useStore.getState();
    const mcp = store.mcps.find(m => m.id === req.params.id);
    
    if (!mcp) {
      return res.status(404).json({ error: 'MCP não encontrado' });
    }

    console.log('🔄 [API] Sincronizando MCP:', mcp.name);

    // Importar MCPExecutor
    const { MCPExecutor } = await import('./mcpExecutor.js');
    
    // Extrair package name corretamente dos args
    let packageName = mcp.server || '';
    if (!packageName && (mcp as any).args && Array.isArray((mcp as any).args)) {
      const nonFlagArgs = (mcp as any).args.filter((arg: string) => !arg.startsWith('-'));
      if (nonFlagArgs.length > 0) {
        packageName = nonFlagArgs[0];
      }
    }
    
    // Executar MCP e extrair tools atualizadas
    const result = await MCPExecutor.installMCP({
      name: mcp.name,
      description: mcp.description,
      version: mcp.version,
      server: packageName || mcp.name,
      installType: (mcp as any).installType || 'npx',
    });

    if (!result.success) {
      return res.status(500).json({ 
        error: result.error,
        success: false,
      });
    }

    // Atualizar tools no MCP
    const updatedTools = result.tools || [];
    
    store.updateMCP(req.params.id, {
      tools: updatedTools,
      metadata: {
        createdAt: mcp.metadata?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastSyncedAt: new Date().toISOString(),
      },
    });

    // Registrar tools no Tool Registry
    const { MCPLoader } = await import('./mcpLoader.js');
    // Pegar estado fresco do store
    const freshStore = useStore.getState();
    const updatedMCP = freshStore.mcps.find(m => m.id === req.params.id);
    if (updatedMCP) {
      await MCPLoader.loadMCP(updatedMCP);
    }

    console.log(`✅ [API] MCP sincronizado: ${updatedTools.length} tools`);
    
    res.json({ 
      success: true, 
      message: 'MCP sincronizado com sucesso',
      syncedAt: new Date().toISOString(),
      toolsFound: updatedTools.length,
      tools: updatedTools,
    });
  } catch (error: any) {
    console.error('❌ [API] Erro ao sincronizar MCP:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/mcps/:id/test - Testar MCP
app.post('/api/mcps/:id/test', async (req: Request, res: Response) => {
  try {
    const store = useStore.getState();
    const mcp = store.mcps.find(m => m.id === req.params.id);
    
    if (!mcp) {
      return res.status(404).json({ error: 'MCP não encontrado' });
    }

    console.log('🧪 [API] Testando MCP:', mcp.name);

    // Importar MCPExecutor
    const { MCPExecutor } = await import('./mcpExecutor.js');
    
    // Testar MCP
    const result = await MCPExecutor.testMCP(
      mcp.id,
      mcp.server || '',
      (mcp as any).installType || 'npx'
    );

    console.log(`${result.success ? '✅' : '❌'} [API] Teste de MCP concluído`);
    
    res.json(result);
  } catch (error: any) {
    console.error('❌ [API] Erro ao testar MCP:', error);
    res.status(500).json({ 
      success: false,
      message: error.message,
      toolsFound: 0,
    });
  }
});

// ============= TOOLS REGISTRY ENDPOINTS =============

// GET /api/tools - Listar todas as ferramentas (compatível com frontend)
app.get('/api/tools', (req: Request, res: Response) => {
  try {
    // Se tem query params de paginação, usar API avançada
    if (req.query.page || req.query.pageSize) {
      const registry = getToolRegistry();
      const category = req.query.category as string | undefined;
      const search = req.query.search as string | undefined;
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 20;
      const tags = req.query.tags ? (req.query.tags as string).split(',') : undefined;
      
      const result = registry.list({
        category: category as any,
        search,
        tags,
        page,
        pageSize,
      });
      
      // Adicionar links de paginação
      const baseUrl = `${req.protocol}://${req.get('host')}${req.path}`;
      const queryParams = new URLSearchParams(req.query as any);
      
      const links: any = {};
      
      // First
      queryParams.set('page', '1');
      links.first = `${baseUrl}?${queryParams}`;
      
      // Last
      queryParams.set('page', result.totalPages.toString());
      links.last = `${baseUrl}?${queryParams}`;
      
      // Prev
      if (result.page > 1) {
        queryParams.set('page', (result.page - 1).toString());
        links.prev = `${baseUrl}?${queryParams}`;
      }
      
      // Next
      if (result.page < result.totalPages) {
        queryParams.set('page', (result.page + 1).toString());
        links.next = `${baseUrl}?${queryParams}`;
      }
      
      return res.json({
        data: result.tools,
        pagination: {
          page: result.page,
          pageSize: result.pageSize,
          total: result.total,
          totalPages: result.totalPages,
        },
        links,
      });
    }
    
    // Sem paginação, usar toolApi (compatível com frontend)
    const tools = listTools();
    
    // Adicionar agentes como tools (temporariamente comentado - corrigir depois)
    // const store = useStore.getState();
    // const { convertAgentsToTools } = require('./agentAsToolConverter.js');
    // const agentTools = convertAgentsToTools(store.agents);
    
    res.json(tools);
  } catch (error: any) {
    console.error('❌ Erro ao listar tools:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/tools - Registrar nova ferramenta dinamicamente
app.post('/api/tools', async (req: Request, res: Response) => {
  try {
    const registry = getToolRegistry();
    const toolData = req.body;
    
    // Validar que tem função execute (não pode ser enviada via JSON, então precisa ser carregada)
    if (!toolData.execute) {
      return res.status(400).json({ 
        error: 'Ferramenta deve incluir função execute. Para registrar dinamicamente, use o endpoint de módulo ou CLI.' 
      });
    }
    
    registry.register(toolData);
    
    res.status(201).json({ 
      success: true, 
      message: 'Ferramenta registrada com sucesso',
      id: toolData.id 
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// GET /api/tools/:id - Detalhes de uma ferramenta
app.get('/api/tools/:id', (req: Request, res: Response) => {
  try {
    const registry = getToolRegistry();
    const tool = registry.get(req.params.id);
    
    if (!tool) {
      return res.status(404).json({ error: 'Tool não encontrada' });
    }
    
    res.json(tool);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/tools/:id - Atualizar ferramenta
app.put('/api/tools/:id', (req: Request, res: Response) => {
  try {
    const registry = getToolRegistry();
    const toolId = req.params.id;
    
    // Verificar se existe
    if (!registry.has(toolId)) {
      return res.status(404).json({ error: 'Tool não encontrada' });
    }
    
    // Remover antiga
    registry.unregister(toolId);
    
    // Registrar nova versão
    const updatedTool = req.body;
    registry.register(updatedTool);
    
    res.json({ 
      success: true, 
      message: 'Ferramenta atualizada com sucesso' 
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE /api/tools/:id - Deletar ferramenta
app.delete('/api/tools/:id', (req: Request, res: Response) => {
  try {
    const registry = getToolRegistry();
    const toolId = req.params.id;
    
    // Verificar se existe
    if (!registry.has(toolId)) {
      return res.status(404).json({ error: 'Tool não encontrada' });
    }
    
    // TODO: Verificar se algum workflow está usando esta tool
    // const workflows = getAutomations();
    // const isUsed = workflows.some(wf => 
    //   wf.nodes.some(node => node.config?.toolId === toolId)
    // );
    // if (isUsed && !req.query.force) {
    //   return res.status(409).json({ 
    //     error: 'Tool está sendo usada em workflows ativos',
    //     suggestion: 'Use ?force=true para forçar exclusão'
    //   });
    // }
    
    const removed = registry.unregister(toolId);
    
    if (removed) {
      res.json({ 
        success: true, 
        message: 'Ferramenta removida com sucesso' 
      });
    } else {
      res.status(500).json({ error: 'Erro ao remover ferramenta' });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/tools/:id/execute - Executar uma ferramenta (test)
app.post('/api/tools/:id/execute', async (req: Request, res: Response) => {
  try {
    const { args, context } = req.body;
    
    // Criar contexto padrão se não fornecido
    const execContext: ExecutionContext = context || {
      automationId: 'api-test',
      nodeId: 'api-test',
      previousResults: {},
      globalContext: {},
    };
    
    const result = await ToolExecutor.execute(
      req.params.id,
      args || {},
      execContext
    );
    
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/automations/:automationId/nodes/:nodeId/test - Testar node com fluxo completo V3
app.post('/api/automations/:automationId/nodes/:nodeId/test', async (req: Request, res: Response) => {
  console.log('🧪 [API] POST /api/automations/:automationId/nodes/:nodeId/test', {
    automationId: req.params.automationId,
    nodeId: req.params.nodeId,
  });
  
  try {
    const { automationId, nodeId } = req.params;
    const { nodes: bodyNodes, edges: bodyEdges } = req.body;
    
    let flowNodes = bodyNodes;
    let flowEdges = bodyEdges;
    
    // Se não passou nodes/edges no body, tenta carregar da store
    if (!flowNodes || !flowEdges) {
      const automations = getAutomations();
      const automation = automations.find((a: any) => a.id === automationId);
      if (!automation) {
        return res.status(404).json({ error: 'Automação não encontrada' });
      }
      flowNodes = automation.nodes || [];
      flowEdges = automation.edges || [];
    }
    
    if (!flowNodes || flowNodes.length === 0) {
      return res.status(400).json({ error: 'Nenhum node encontrado para teste' });
    }
    
    // Converter para ExecutionFlow (formato do ExecutionEngineV3)
    const { ExecutionEngineV3 } = await import('./executionEngine.js');
    
    const executionFlow = {
      id: automationId || 'test-flow',
      name: 'Test Node Flow',
      nodes: flowNodes.map((n: any) => ({
        id: n.id,
        type: n.type || 'tool',
        name: n.data?.label || n.name || 'Node',
        config: {
          toolId: n.data?.toolId || n.config?.toolId,
          params: n.data?.config || n.config?.params || {},
        },
        position: n.position,
      })),
      edges: flowEdges.map((e: any) => ({
        id: e.id || `${e.source}-${e.target}`,
        source: e.source,
        target: e.target,
      })),
      startNodeId: flowNodes[0]?.id || 'start',
    };
    
    console.log('🔧 [API] Flow montado para teste:', {
      nodes: executionFlow.nodes.length,
      edges: executionFlow.edges.length,
      targetNode: nodeId,
    });
    
    // Coletar logs e atualizações
    const allLogs: any[] = [];
    const nodeResults: any[] = [];
    
    const engine = new ExecutionEngineV3(
      executionFlow,
      {
        debugMode: true,
        enableCache: false, // Desabilitar cache para testes
        maxRetries: 0, // Sem retry em testes
      },
      (log) => {
        allLogs.push(log);
      },
      (nodeResult) => {
        nodeResults.push(nodeResult);
      }
    );
    
    // Executar até o node de teste
    const result = await engine.executeUntilNode(nodeId, req.body.initialData || {});
    
    console.log('✅ [API] Teste de node concluído:', {
      status: result.status,
      duration: result.duration,
      nodesExecuted: result.nodes.size,
    });
    
    // Pegar resultado específico do node testado
    const nodeOutput = engine.getNodeOutput(nodeId);
    
    res.json({
      success: result.status === 'completed',
      nodeId,
      result: nodeOutput,
      status: result.status,
      duration: result.duration,
      logs: allLogs,
      nodes: Array.from(result.nodes.values()),
      finalOutput: result.finalOutput,
      error: result.error,
    });
  } catch (error: any) {
    console.error('❌ [API] Erro no teste de node:', error);
    res.status(500).json({ error: error.message, stack: error.stack });
  }
});

// POST /api/nodes/:nodeId/test - Testar execução de um nó específico (LEGACY)
app.post('/api/nodes/:nodeId/test', async (req: Request, res: Response) => {
  try {
    const { nodeId } = req.params;
    const { toolId, params, context } = req.body;
    
    console.warn('⚠️ [API] Usando endpoint legacy /api/nodes/:nodeId/test');
    console.warn('⚠️ [API] Use /api/automations/:automationId/nodes/:nodeId/test para resolver referências');
    
    if (!toolId) {
      return res.status(400).json({ error: 'toolId é obrigatório' });
    }
    
    // Verificar se tool existe
    const registry = getToolRegistry();
    if (!registry.has(toolId)) {
      return res.status(404).json({ error: `Tool '${toolId}' não encontrada` });
    }
    
    // Executar em sandbox se configurado
    const tool = registry.get(toolId);
    const shouldUseSandbox = tool?.config?.sandbox || false;
    
    const execContext: ExecutionContext = context || {
      automationId: 'node-test',
      nodeId,
      previousResults: {},
      globalContext: {},
    };
    
    const startTime = Date.now();
    const result = await ToolExecutor.execute(
      toolId,
      params || {},
      execContext
    );
    const executionTime = Date.now() - startTime;
    
    res.json({
      nodeId,
      toolId,
      result,
      executionTime,
      sandbox: shouldUseSandbox,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============= NODE CONFIGURATION ENDPOINTS =============

// GET /api/automations/:automationId/nodes/:nodeId - Obter configuração de um nó
app.get('/api/automations/:automationId/nodes/:nodeId', (req: Request, res: Response) => {
  try {
    const { automationId, nodeId } = req.params;
    
    const automations = getAutomations();
    const automation = automations.find(a => a.id === automationId);
    
    if (!automation) {
      return res.status(404).json({ error: 'Automação não encontrada' });
    }
    
    const node = automation.nodes?.find((n: any) => n.id === nodeId);
    if (!node) {
      return res.status(404).json({ error: 'Node não encontrado' });
    }
    
    res.json(node);
  } catch (error: any) {
    console.error('❌ Erro ao buscar node:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/automations/:automationId/nodes/:nodeId - Atualizar configuração de um nó
app.put('/api/automations/:automationId/nodes/:nodeId', (req: Request, res: Response) => {
  try {
    const { automationId, nodeId } = req.params;
    const nodeUpdates = req.body;
    
    const automations = getAutomations();
    const automation = automations.find(a => a.id === automationId);
    
    if (!automation) {
      return res.status(404).json({ error: 'Automação não encontrada' });
    }
    
    const nodeIndex = automation.nodes?.findIndex((n: any) => n.id === nodeId);
    if (nodeIndex === -1 || nodeIndex === undefined) {
      return res.status(404).json({ error: 'Node não encontrado' });
    }
    
    // Atualizar node preservando campos não editados
    automation.nodes[nodeIndex] = {
      ...automation.nodes[nodeIndex],
      ...nodeUpdates,
      id: nodeId, // Garantir que ID não muda
    };
    
    // Salvar automação
    const saved = saveAutomation(automation);
    
    console.log('✅ Node atualizado:', nodeId);
    res.json({ 
      success: true, 
      node: saved.nodes[nodeIndex],
      message: 'Node atualizado com sucesso' 
    });
  } catch (error: any) {
    console.error('❌ Erro ao atualizar node:', error);
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/automations/:automationId/nodes/:nodeId/config - Atualizar apenas config do nó
app.patch('/api/automations/:automationId/nodes/:nodeId/config', (req: Request, res: Response) => {
  try {
    const { automationId, nodeId } = req.params;
    const configUpdates = req.body;
    
    const automations = getAutomations();
    const automation = automations.find(a => a.id === automationId);
    
    if (!automation) {
      return res.status(404).json({ error: 'Automação não encontrada' });
    }
    
    const nodeIndex = automation.nodes?.findIndex((n: any) => n.id === nodeId);
    if (nodeIndex === -1 || nodeIndex === undefined) {
      return res.status(404).json({ error: 'Node não encontrado' });
    }
    
    // Atualizar apenas o config, fazendo merge
    automation.nodes[nodeIndex].config = {
      ...automation.nodes[nodeIndex].config,
      ...configUpdates,
    };
    
    // Salvar automação
    const saved = saveAutomation(automation);
    
    console.log('✅ Config do node atualizado:', nodeId);
    res.json({ 
      success: true, 
      config: saved.nodes[nodeIndex].config,
      message: 'Configuração atualizada com sucesso' 
    });
  } catch (error: any) {
    console.error('❌ Erro ao atualizar config:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/tools/categories - Listar categorias disponíveis
app.get('/api/tools/categories', (_req: Request, res: Response) => {
  try {
    const registry = getToolRegistry();
    const categories = registry.getCategories();
    res.json(categories);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/tools/:id/metrics - Obter métricas de uma ferramenta
app.get('/api/tools/:id/metrics', (req: Request, res: Response) => {
  try {
    const registry = getToolRegistry();
    const metrics = registry.getMetrics(req.params.id);
    
    if (!metrics) {
      return res.status(404).json({ error: 'Tool não encontrada' });
    }
    
    res.json(metrics);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============= FLOWS ENDPOINTS =============

// POST /api/flows/execute - Executar um flow com logs em tempo real
app.post('/api/flows/execute', async (req: Request, res: Response) => {
  try {
    const flow: FlowDefinition = req.body;
    const initialData = req.body.initialData || {};

    // Executar flow e transmitir logs via WebSocket
    const execution = await executeFlow(
      flow,
      initialData,
      (log) => {
        // Broadcast log para todos os clientes conectados
        broadcast({
          type: 'execution-log',
          flowId: flow.id,
          log,
        });
      }
    );

    // Broadcast conclusão
    broadcast({
      type: 'execution-complete',
      flowId: flow.id,
      execution,
    });

    res.json(execution);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/flows - Listar flows salvos
app.get('/api/flows', (_req: Request, res: Response) => {
  try {
    const automations = getAutomations();
    res.json(automations);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/flows - Salvar flow
app.post('/api/flows', (req: Request, res: Response) => {
  try {
    const flow: FlowDefinition = req.body;
    
    saveAutomation({
      id: flow.id,
      name: flow.name,
      description: flow.description,
      version: flow.version || '2.0.0',
      edges: flow.edges || [],
      nodes: flow.nodes.map((node) => ({
        id: node.id,
        type: 'mcp_tool' as any, // Converter todos para tipo compatível
        name: node.name,
        description: node.description,
        config: node.config,
        position: node.position,
        nextNodes: [],
      })),
      startNodeId: flow.startNodeId,
      enabled: true,
      runCount: 0,
      createdAt: flow.metadata?.createdAt || new Date().toISOString(),
      updatedAt: flow.metadata?.updatedAt || new Date().toISOString(),
    });

    res.json({ success: true, id: flow.id });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/workflows/:id/save - Salvar alterações em workflow (versionamento)
app.put('/api/workflows/:id/save', (req: Request, res: Response) => {
  try {
    const workflowId = req.params.id;
    const updates = req.body;
    
    // Buscar workflow existente
    const workflows = getAutomations();
    const existing = workflows.find(w => w.id === workflowId);
    
    if (!existing) {
      return res.status(404).json({ error: 'Workflow não encontrado' });
    }
    
    // Criar nova versão
    const newVersion = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
      version: incrementVersion(existing.updatedAt), // Incrementar versão
    };
    
    saveAutomation(newVersion);
    
    res.json({ 
      success: true, 
      id: workflowId,
      version: newVersion.version,
      message: 'Workflow salvo com sucesso'
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/workflows/:id - Obter workflow específico
app.get('/api/workflows/:id', (req: Request, res: Response) => {
  try {
    const workflows = getAutomations();
    const workflow = workflows.find(w => w.id === req.params.id);
    
    if (!workflow) {
      return res.status(404).json({ error: 'Workflow não encontrado' });
    }
    
    res.json(workflow);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Helper para incrementar versão
function incrementVersion(lastUpdate: string): string {
  const date = new Date(lastUpdate);
  return `v${date.getTime()}`;
}

// ============= CUSTOM NODES ENDPOINTS =============

// GET /api/custom-nodes - Listar custom nodes instalados
app.get('/api/custom-nodes', (_req: Request, res: Response) => {
  try {
    const manager = getCustomNodeManager();
    const nodes = manager.listNodes();
    res.json(nodes);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/custom-nodes/:fingerprint - Obter custom node específico
app.get('/api/custom-nodes/:fingerprint', (req: Request, res: Response) => {
  try {
    const manager = getCustomNodeManager();
    const node = manager.getNode(req.params.fingerprint);
    
    if (!node) {
      return res.status(404).json({ error: 'Custom node não encontrado' });
    }
    
    res.json(node);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/custom-nodes/upload - Upload de custom node
// TODO: Implementar upload com multer após adicionar dependência
app.post('/api/custom-nodes/upload', async (req: Request, res: Response) => {
  res.status(501).json({ 
    success: false,
    message: 'Upload via API será implementado em breve. Use o CLI: flui --upload-node',
    isUpdate: false,
  });
});

// POST /api/custom-nodes/validate - Validar pacote sem instalar
app.post('/api/custom-nodes/validate', async (req: Request, res: Response) => {
  res.status(501).json({ 
    valid: false,
    errors: ['Validação via API será implementada em breve'],
  });
});

// DELETE /api/custom-nodes/:fingerprint - Remover custom node
app.delete('/api/custom-nodes/:fingerprint', async (req: Request, res: Response) => {
  try {
    const manager = getCustomNodeManager();
    const removed = await manager.removeNode(req.params.fingerprint);
    
    if (removed) {
      broadcast({
        type: 'custom-node-removed',
        fingerprint: req.params.fingerprint,
      });
      
      res.json({ success: true, message: 'Custom node removido com sucesso' });
    } else {
      res.status(404).json({ success: false, error: 'Custom node não encontrado' });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/custom-nodes/:fingerprint/versions - Listar versões de um node
app.get('/api/custom-nodes/:fingerprint/versions', (req: Request, res: Response) => {
  try {
    const manager = getCustomNodeManager();
    const node = manager.getNode(req.params.fingerprint);
    
    if (!node) {
      return res.status(404).json({ error: 'Custom node não encontrado' });
    }
    
    res.json(node.versions);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== LOGS & CHAT ENDPOINTS ====================

// GET /api/automations/:id/executions - Listar execuções de uma automação
app.get('/api/automations/:id/executions', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Mock data - em produção, isso viria de um banco de dados
    const executions = [
      {
        id: `exec-${id}-1`,
        automationId: id,
        status: 'completed',
        startedAt: new Date(Date.now() - 3600000).toISOString(),
        completedAt: new Date(Date.now() - 3000000).toISOString(),
      },
      {
        id: `exec-${id}-2`,
        automationId: id,
        status: 'failed',
        startedAt: new Date(Date.now() - 7200000).toISOString(),
        completedAt: new Date(Date.now() - 6600000).toISOString(),
      },
    ];
    
    res.json(executions);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/automations/:id/logs - Obter logs de execução de uma automação
app.get('/api/automations/:id/logs', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const automation = getAutomation(id);
    
    if (!automation) {
      return res.status(404).json({ error: 'Automação não encontrada' });
    }
    
    // Mock data - em produção, isso viria de um banco de dados
    const logs = [
      {
        id: '1',
        timestamp: new Date().toISOString(),
        level: 'info',
        message: 'Iniciando execução da automação',
        nodeId: 'node-1',
        nodeName: 'Manual Trigger'
      },
      {
        id: '2',
        timestamp: new Date(Date.now() + 1000).toISOString(),
        level: 'success',
        message: 'Node Manual Trigger executado com sucesso',
        nodeId: 'node-1',
        nodeName: 'Manual Trigger'
      },
      {
        id: '3',
        timestamp: new Date(Date.now() + 2000).toISOString(),
        level: 'info',
        message: 'Executando próximo node...',
        nodeId: 'node-2',
        nodeName: 'Tool Executor'
      }
    ];
    
    res.json({
      id: `exec-${id}`,
      automationId: id,
      automationName: automation.name,
      status: 'running',
      startedAt: new Date().toISOString(),
      logs,
      context: {
        nodes: automation.nodes,
        edges: automation.edges,
        results: {
          'node-1': { success: true, data: { triggered: true } }
        },
        globalContext: {
          executionId: `exec-${id}`,
          startTime: new Date().toISOString()
        }
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/automations/:id/chat - Chat contextual sobre execução de automação
app.post('/api/automations/:id/chat', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { message, context } = req.body;
    
    const automation = getAutomation(id);
    
    if (!automation) {
      return res.status(404).json({ error: 'Automação não encontrada' });
    }
    
    // Construir resposta contextual baseada na mensagem do usuário
    const msg = message.toLowerCase();
    let response = '';
    
    if (msg.includes('status') || msg.includes('como está')) {
      response = `A automação "${automation.name}" possui ${automation.nodes?.length || 0} nodes configurados e está ${automation.enabled ? 'ativa' : 'inativa'}.`;
    } else if (msg.includes('erro') || msg.includes('problema')) {
      const errorLogs = context?.logs?.filter((log: any) => log.level === 'error') || [];
      if (errorLogs.length === 0) {
        response = 'Até o momento, não foram detectados erros na execução desta automação. Tudo está funcionando conforme esperado! ✅';
      } else {
        response = `Foram detectados ${errorLogs.length} erro(s) durante a execução:\n\n${errorLogs.map((e: any) => `• ${e.message}`).join('\n')}`;
      }
    } else if (msg.includes('node') || msg.includes('nó')) {
      const nodeNames = automation.nodes?.map((n: any) => n.data?.label || 'Sem nome') || [];
      response = `Esta automação possui os seguintes nodes:\n\n${nodeNames.map((n: string, i: number) => `${i + 1}. ${n}`).join('\n')}`;
    } else if (msg.includes('último') || msg.includes('ultima') || msg.includes('recente')) {
      const lastLog = context?.logs?.[context.logs.length - 1];
      if (!lastLog) {
        response = 'Ainda não há logs registrados para esta execução.';
      } else {
        response = `O último evento foi: "${lastLog.message}" (${lastLog.level}) registrado em ${new Date(lastLog.timestamp).toLocaleTimeString()}.`;
      }
    } else {
      response = `Com base no contexto da automação "${automation.name}", posso fornecer informações sobre status, erros, nodes executados ou eventos específicos. Como posso ajudar?`;
    }
    
    res.json({
      response,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export const startApiServer = async () => {
  // Registrar todas as ferramentas
  console.log('🔧 Registrando ferramentas...');
  registerAllTools();
  const registry = getToolRegistry();
  const toolsCount = registry.list().tools.length;
  console.log(`✅ ${toolsCount} ferramentas registradas`);
  
  // Carregar MCPs e registrar suas tools
  console.log('🔌 Carregando MCPs...');
  try {
    const { MCPLoader } = await import('./mcpLoader.js');
    const mcpsLoaded = await MCPLoader.loadAllMCPs();
    console.log(`✅ ${mcpsLoaded} MCPs carregados com sucesso`);
    
    // Contar tools após carregar MCPs
    const toolsCountAfterMCPs = registry.list().tools.length;
    console.log(`📦 Total de ferramentas (incluindo MCPs): ${toolsCountAfterMCPs}`);
  } catch (error: any) {
    console.error('❌ Erro ao carregar MCPs:', error.message);
  }
  
  // Inicializar custom node manager
  try {
    const manager = getCustomNodeManager();
    await manager.initialize();
    console.log('✅ Custom Node Manager initialized');
  } catch (error) {
    console.error('❌ Failed to initialize Custom Node Manager:', error);
  }
  
  httpServer.listen(PORT, () => {
    console.log(`🚀 API Server rodando em http://localhost:${PORT}`);
    console.log(`📡 WebSocket Server rodando em ws://localhost:${PORT}`);
  });
};

// Export for manual start (don't auto-start)
export default startApiServer;
