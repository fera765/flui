/**
 * FLUI - Cron Routes
 * Rotas de API para gerenciar crons
 */

import { Router, Request, Response } from 'express';
import { getCronManager } from './cronManager.js';
import { FlowEngineV2 } from '../core/flowEngineV2.js';
import { getAutomations } from '../store/automationStorage.js';

const router = Router();

/**
 * Callback para executar automação quando cron dispara (via fila)
 */
async function executeCronAutomation(cronConfig: any): Promise<void> {
  try {
    console.log(`🚀 [Cron] Disparando automação ${cronConfig.automationId}...`);

    const automations = getAutomations();
    const automationsList = Object.values(automations);
    const automation = automationsList.find((a: any) => a.id === cronConfig.automationId);

    if (!automation) {
      console.error(`❌ [Cron] Automação ${cronConfig.automationId} não encontrada`);
      return;
    }

    const { getExecutionQueue } = await import('./executionQueue.js');
    const queue = getExecutionQueue();

    // Adicionar à fila
    const executionId = await queue.enqueue({
      automationId: automation.id,
      automationName: automation.name,
      triggerType: 'cron',
      triggerData: {
        cronId: cronConfig.id,
        cronData: cronConfig.triggerData,
        cronExpression: cronConfig.cronExpression,
        executionCount: cronConfig.executionCount,
      },
      priority: 3, // Crons têm prioridade média
    });

    console.log(`✅ [Cron] Automação ${automation.id} enfileirada: ${executionId}`);
  } catch (error: any) {
    console.error(`❌ [Cron] Erro ao enfileirar:`, error);
  }
}

/**
 * POST /api/crons - Criar novo cron
 */
router.post('/crons', async (req: Request, res: Response) => {
  try {
    const { automationId, cronExpression, timezone, triggerData, enabled, maxExecutions } = req.body;

    if (!automationId) {
      return res.status(400).json({ error: 'automationId é obrigatório' });
    }

    if (!cronExpression) {
      return res.status(400).json({ error: 'cronExpression é obrigatório' });
    }

    // Verificar se automação existe
    const automations = getAutomations();
    const automationsList = Object.values(automations);
    const automation = automationsList.find((a: any) => a.id === automationId);

    if (!automation) {
      return res.status(404).json({ error: `Automação ${automationId} não encontrada` });
    }

    const manager = getCronManager();
    const cronConfig = manager.createCron({
      automationId,
      cronExpression,
      timezone,
      triggerData,
      enabled,
      maxExecutions,
    });

    // Se habilitado, iniciar task
    if (cronConfig.enabled) {
      manager.startCron(cronConfig.id, executeCronAutomation);
    }

    res.json({
      success: true,
      cron: cronConfig,
    });
  } catch (error: any) {
    console.error('❌ [API] Erro ao criar cron:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/crons - Listar todos os crons
 */
router.get('/crons', async (_req: Request, res: Response) => {
  try {
    const manager = getCronManager();
    const crons = manager.getAllCrons();

    // Adicionar flag de ativo
    const cronsWithStatus = crons.map((cronConfig) => ({
      ...cronConfig,
      isActive: manager.isCronActive(cronConfig.id),
    }));

    res.json({ crons: cronsWithStatus });
  } catch (error: any) {
    console.error('❌ [API] Erro ao listar crons:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/crons/:id - Buscar cron por ID
 */
router.get('/crons/:id', async (req: Request, res: Response) => {
  try {
    const manager = getCronManager();
    const cronConfig = manager.getCron(req.params.id);

    if (!cronConfig) {
      return res.status(404).json({ error: 'Cron não encontrado' });
    }

    res.json({
      cron: {
        ...cronConfig,
        isActive: manager.isCronActive(cronConfig.id),
      },
    });
  } catch (error: any) {
    console.error('❌ [API] Erro ao buscar cron:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/crons/automation/:automationId - Buscar crons de uma automação
 */
router.get('/crons/automation/:automationId', async (req: Request, res: Response) => {
  try {
    const manager = getCronManager();
    const crons = manager.getCronsByAutomation(req.params.automationId);

    const cronsWithStatus = crons.map((cronConfig) => ({
      ...cronConfig,
      isActive: manager.isCronActive(cronConfig.id),
    }));

    res.json({ crons: cronsWithStatus });
  } catch (error: any) {
    console.error('❌ [API] Erro ao buscar crons:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/crons/:id - Atualizar cron
 */
router.put('/crons/:id', async (req: Request, res: Response) => {
  try {
    const manager = getCronManager();
    const cronConfig = manager.updateCron(req.params.id, req.body);

    // Se mudou para enabled=true, iniciar task
    if (req.body.enabled === true && !manager.isCronActive(cronConfig.id)) {
      manager.startCron(cronConfig.id, executeCronAutomation);
    }

    // Se mudou para enabled=false, parar task
    if (req.body.enabled === false && manager.isCronActive(cronConfig.id)) {
      manager.stopCronTask(cronConfig.id);
    }

    res.json({
      success: true,
      cron: {
        ...cronConfig,
        isActive: manager.isCronActive(cronConfig.id),
      },
    });
  } catch (error: any) {
    console.error('❌ [API] Erro ao atualizar cron:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/crons/:id/start - Iniciar cron manualmente
 */
router.post('/crons/:id/start', async (req: Request, res: Response) => {
  try {
    const manager = getCronManager();
    const started = manager.startCron(req.params.id, executeCronAutomation);

    if (!started) {
      return res.status(400).json({ error: 'Não foi possível iniciar o cron' });
    }

    res.json({ success: true, message: 'Cron iniciado' });
  } catch (error: any) {
    console.error('❌ [API] Erro ao iniciar cron:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/crons/:id/stop - Parar cron manualmente
 */
router.post('/crons/:id/stop', async (req: Request, res: Response) => {
  try {
    const manager = getCronManager();
    const stopped = manager.stopCronTask(req.params.id);

    if (!stopped) {
      return res.status(400).json({ error: 'Cron não estava ativo' });
    }

    res.json({ success: true, message: 'Cron parado' });
  } catch (error: any) {
    console.error('❌ [API] Erro ao parar cron:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/crons/:id - Deletar cron
 */
router.delete('/crons/:id', async (req: Request, res: Response) => {
  try {
    const manager = getCronManager();
    const deleted = manager.deleteCron(req.params.id);

    if (!deleted) {
      return res.status(404).json({ error: 'Cron não encontrado' });
    }

    res.json({ success: true });
  } catch (error: any) {
    console.error('❌ [API] Erro ao deletar cron:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Export função para recarregar crons ao iniciar servidor
 */
export function reloadAllCrons(): number {
  const manager = getCronManager();
  return manager.reloadAllCrons(executeCronAutomation);
}

export default router;
