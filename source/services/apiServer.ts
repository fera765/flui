import express, { Request, Response } from 'express';
import cors from 'cors';
import { getAutomations, saveAutomation, deleteAutomation } from '../store/automationStorage.js';
import { useStore } from '../store/store.js';

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

export const startApiServer = () => {
  app.listen(PORT, () => {
    console.log(`API rodando em http://localhost:${PORT}`);
  });
};
