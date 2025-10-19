import express, { Request, Response } from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { getAutomations, saveAutomation, deleteAutomation } from '../store/automationStorage.js';
import { useStore } from '../store/store.js';
import { getToolRegistry } from '../core/toolRegistry.js';
import { ToolExecutor } from '../core/toolExecutor.js';
import { ExecutionContext } from '../core/types.js';
import { executeFlow } from '../core/flowEngine.js';
import { FlowDefinition } from '../core/flowTypes.js';

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

app.post('/api/automations', (req: Request, res: Response) => {
  const automation = req.body;
  saveAutomation({
    ...automation,
    id: automation.id || Date.now().toString(),
    startNodeId: automation.nodes[0]?.id || '',
    enabled: true,
    runCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  res.json({ success: true });
});

app.delete('/api/automations/:id', (req: Request, res: Response) => {
  deleteAutomation(req.params.id);
  res.json({ success: true });
});

// Agentes
app.get('/api/agents', (_req: Request, res: Response) => {
  const store = useStore.getState();
  res.json(store.agents);
});

// MCPs
app.get('/api/mcps', (_req: Request, res: Response) => {
  const store = useStore.getState();
  res.json(store.mcps);
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
      nodes: flow.nodes.map((node) => ({
        id: node.id,
        type: 'mcp_tool' as any, // Converter todos para tipo compatível
        name: node.name,
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

export const startApiServer = () => {
  httpServer.listen(PORT, () => {
    console.log(`🚀 API Server rodando em http://localhost:${PORT}`);
    console.log(`📡 WebSocket Server rodando em ws://localhost:${PORT}`);
  });
};
