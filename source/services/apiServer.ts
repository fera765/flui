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

// GET /api/tools - Listar todas as ferramentas
app.get('/api/tools', (req: Request, res: Response) => {
  try {
    const registry = getToolRegistry();
    const category = req.query.category as string | undefined;
    const search = req.query.search as string | undefined;
    
    const tools = registry.list({
      category: category as any,
      search,
    });
    
    res.json(tools);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
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

// POST /api/tools/:id/execute - Executar uma ferramenta
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

export const startApiServer = () => {
  httpServer.listen(PORT, () => {
    console.log(`🚀 API Server rodando em http://localhost:${PORT}`);
    console.log(`📡 WebSocket Server rodando em ws://localhost:${PORT}`);
  });
};
