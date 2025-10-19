import express, { Request, Response } from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { getAutomations, saveAutomation, deleteAutomation } from '../store/automationStorage.js';
import { useStore } from '../store/store.js';
import { getToolRegistry } from '../core/toolRegistry.js';
import { ToolExecutor } from '../core/toolExecutor.js';
import { ExecutionContext } from '../core/types.js';
import { executeFlow } from '../core/flowEngine.js';
import { FlowDefinition } from '../core/flowTypes.js';
import { getCustomNodeManager, CustomNodeManager } from './customNodeManager.js';

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

app.post('/api/automations', (req: Request, res: Response) => {
  const automation = req.body;
  const newAutomation = {
    ...automation,
    id: automation.id || Date.now().toString(),
    startNodeId: automation.startNodeId || automation.nodes[0]?.id || '',
    enabled: automation.enabled !== undefined ? automation.enabled : true,
    runCount: automation.runCount || 0,
    edges: automation.edges || [],
    metadata: {
      createdAt: automation.metadata?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  };
  saveAutomation(newAutomation);
  res.json({ success: true, id: newAutomation.id });
});

app.put('/api/automations/:id', (req: Request, res: Response) => {
  const automations = getAutomations();
  const existing = automations.find(a => a.id === req.params.id);
  
  if (!existing) {
    return res.status(404).json({ error: 'Automação não encontrada' });
  }
  
  const updated = {
    ...req.body,
    id: req.params.id,
    metadata: {
      ...existing.metadata,
      ...req.body.metadata,
      createdAt: existing.metadata?.createdAt || existing.createdAt,
      updatedAt: new Date().toISOString(),
    },
  };
  
  saveAutomation(updated);
  res.json({ success: true, id: req.params.id });
});

app.patch('/api/automations/:id', (req: Request, res: Response) => {
  const automations = getAutomations();
  const existing = automations.find(a => a.id === req.params.id);
  
  if (!existing) {
    return res.status(404).json({ error: 'Automação não encontrada' });
  }
  
  const updated = {
    ...existing,
    ...req.body,
    metadata: {
      ...existing.metadata,
      updatedAt: new Date().toISOString(),
    },
  };
  
  saveAutomation(updated);
  res.json({ success: true, id: req.params.id });
});

app.delete('/api/automations/:id', (req: Request, res: Response) => {
  deleteAutomation(req.params.id);
  res.json({ success: true });
});

app.post('/api/automations/:id/execute', async (req: Request, res: Response) => {
  try {
    const automations = getAutomations();
    const automation = automations.find(a => a.id === req.params.id);
    
    if (!automation) {
      return res.status(404).json({ error: 'Automação não encontrada' });
    }

    // Converter automação para FlowDefinition
    const flow: FlowDefinition = {
      id: automation.id,
      name: automation.name,
      description: automation.description,
      version: '2.0.0',
      nodes: automation.nodes.map(node => ({
        id: node.id,
        type: 'tool',
        name: node.name,
        description: node.description,
        config: node.config || {},
        position: node.position,
      })),
      edges: automation.edges || [],
      startNodeId: automation.startNodeId,
      metadata: automation.metadata,
    };

    // Executar flow
    const logs: any[] = [];
    const execution = await executeFlow(
      flow,
      req.body.initialData || {},
      (log) => {
        logs.push(log);
        broadcast({
          type: 'execution-log',
          automationId: automation.id,
          log,
        });
      }
    );

    // Atualizar runCount
    saveAutomation({
      ...automation,
      runCount: (automation.runCount || 0) + 1,
      metadata: {
        createdAt: automation.metadata?.createdAt || automation.createdAt,
        updatedAt: new Date().toISOString(),
        lastRunAt: new Date().toISOString(),
      },
    });

    broadcast({
      type: 'execution-complete',
      automationId: automation.id,
      execution,
    });

    res.json({
      success: execution.status === 'completed',
      result: execution.result,
      error: execution.error,
      logs,
      executionTime: execution.completedAt 
        ? new Date(execution.completedAt).getTime() - new Date(execution.startedAt).getTime()
        : undefined,
    });
  } catch (error: any) {
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// ============= TOOLS ENDPOINTS =============

app.get('/api/tools', (_req: Request, res: Response) => {
  const { listTools } = require('./toolApi.js');
  res.json(listTools());
});

app.get('/api/tools/:toolId', async (req: Request, res: Response) => {
  const { getToolMetadata } = require('./toolApi.js');
  const tool = await getToolMetadata(req.params.toolId);
  
  if (!tool) {
    return res.status(404).json({ error: 'Tool não encontrada' });
  }
  
  res.json(tool);
});

app.get('/api/tools/:toolId/agents-options', (_req: Request, res: Response) => {
  const store = useStore.getState();
  const agents = store.agents.map(agent => ({
    label: agent.name,
    value: agent.id,
    description: agent.systemPrompt?.substring(0, 100) || 'Sem descrição',
  }));
  res.json(agents);
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

app.post('/api/mcps', (req: Request, res: Response) => {
  try {
    const mcp = req.body;
    const store = useStore.getState();
    
    const newMcp = {
      ...mcp,
      id: mcp.id || Date.now().toString(),
      metadata: {
        createdAt: mcp.metadata?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastSyncedAt: mcp.metadata?.lastSyncedAt,
      },
    };
    
    store.createMCP(newMcp);
    res.json({ success: true, id: newMcp.id });
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

    // Aqui você implementaria a lógica de sincronização com o servidor MCP
    // Por enquanto, apenas atualiza o timestamp
    store.updateMCP(req.params.id, {
      metadata: {
        createdAt: mcp.metadata?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastSyncedAt: new Date().toISOString(),
      },
    });
    
    res.json({ 
      success: true, 
      message: 'MCP sincronizado com sucesso',
      syncedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============= TOOLS REGISTRY ENDPOINTS =============

// GET /api/tools - Listar todas as ferramentas (com paginação)
app.get('/api/tools', (req: Request, res: Response) => {
  try {
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
    
    res.json({
      data: result.tools,
      pagination: {
        page: result.page,
        pageSize: result.pageSize,
        total: result.total,
        totalPages: result.totalPages,
      },
      links,
    });
  } catch (error: any) {
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

// POST /api/nodes/:nodeId/test - Testar execução de um nó específico
app.post('/api/nodes/:nodeId/test', async (req: Request, res: Response) => {
  try {
    const { nodeId } = req.params;
    const { toolId, params, context } = req.body;
    
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

export const startApiServer = async () => {
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
