# Correção da rota de execução

## Problema
A rota `/api/automations/:id/execute` ainda estava usando FlowEngineV2 diretamente, ignorando o ExecutionQueue.

## Solução
Substituir por chamada ao ExecutionQueue.

Código correto:

```typescript
app.post('/api/automations/:id/execute', async (req: Request, res: Response) => {
  console.log('🚀 [API] POST /api/automations/:id/execute - USANDO EXECUTION QUEUE!', req.params.id);
  
  try {
    const automations = getAutomations();
    const automation = automations.find(a => a.id === req.params.id);
    
    if (!automation) {
      return res.status(404).json({ error: 'Automação não encontrada' });
    }

    // ✅ USAR EXECUTION QUEUE para execução em background
    const { getExecutionQueue } = await import('./executionQueue.js');
    const queue = getExecutionQueue();
    
    const executionId = await queue.enqueue({
      automationId: automation.id,
      automationName: automation.name,
      triggerType: 'manual',
      triggerData: req.body.initialData || {},
      priority: 10,
    });

    console.log('📥 [API] Automação enfileirada:', {
      executionId,
      automationId: automation.id,
      automationName: automation.name,
    });

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

    // Responder com dados da execução enfileirada
    res.json({
      success: true,
      executionId,
      status: 'queued',
      automationId: automation.id,
      automationName: automation.name,
      triggerType: 'manual',
      priority: 10,
      createdAt: new Date().toISOString(),
      message: 'Automação enfileirada e será executada em background',
    });
  } catch (error: any) {
    console.error('❌ [API] Erro ao enfileirar automação:', error);
    res.status(500).json({ 
      success: false,
      error: error.message,
    });
  }
});
```
