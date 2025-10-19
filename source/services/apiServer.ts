import express, { Request, Response } from 'express';
import cors from 'cors';
import { getAutomations, saveAutomation, deleteAutomation } from '../store/automationStorage.js';
import { useStore } from '../store/store.js';
import { getToolRegistry } from '../core/toolRegistry.js';
import { ToolExecutor } from '../core/toolExecutor.js';
import { ExecutionContext } from '../core/types.js';

const app = express();
const PORT = 3001;

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

export const startApiServer = () => {
  app.listen(PORT, () => {
    console.log(`API rodando em http://localhost:${PORT}`);
  });
};
