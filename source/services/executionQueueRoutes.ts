/**
 * FLUI - Execution Queue Routes
 * Rotas de API para gerenciar fila de execuções
 */

import { Router, Request, Response } from 'express';
import { getExecutionQueue } from './executionQueue.js';

const router = Router();

/**
 * GET /api/executions - Listar execuções
 */
router.get('/executions', async (req: Request, res: Response) => {
  try {
    const queue = getExecutionQueue();
    
    const filters = {
      automationId: req.query.automationId as string | undefined,
      status: req.query.status as any,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 100,
    };
    
    const executions = queue.listExecutions(filters);
    
    res.json({ executions });
  } catch (error: any) {
    console.error('❌ [API] Erro ao listar execuções:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/executions/:id - Buscar execução por ID
 */
router.get('/executions/:id', async (req: Request, res: Response) => {
  try {
    const queue = getExecutionQueue();
    const execution = queue.getExecution(req.params.id);
    
    if (!execution) {
      return res.status(404).json({ error: 'Execução não encontrada' });
    }
    
    res.json({ execution });
  } catch (error: any) {
    console.error('❌ [API] Erro ao buscar execução:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/executions/:id/cancel - Cancelar execução
 */
router.post('/executions/:id/cancel', async (req: Request, res: Response) => {
  try {
    const queue = getExecutionQueue();
    const cancelled = queue.cancelExecution(req.params.id);
    
    if (!cancelled) {
      return res.status(400).json({ 
        error: 'Não foi possível cancelar. Execução pode já ter iniciado ou não existe.' 
      });
    }
    
    res.json({ success: true, message: 'Execução cancelada' });
  } catch (error: any) {
    console.error('❌ [API] Erro ao cancelar execução:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/executions/stats - Estatísticas da fila
 */
router.get('/executions-stats', async (_req: Request, res: Response) => {
  try {
    const queue = getExecutionQueue();
    const stats = queue.getStats();
    
    res.json({ stats });
  } catch (error: any) {
    console.error('❌ [API] Erro ao buscar estatísticas:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/executions/completed - Limpar execuções completadas
 */
router.delete('/executions/completed', async (_req: Request, res: Response) => {
  try {
    const queue = getExecutionQueue();
    const count = queue.clearCompleted();
    
    res.json({ success: true, cleared: count });
  } catch (error: any) {
    console.error('❌ [API] Erro ao limpar execuções:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
