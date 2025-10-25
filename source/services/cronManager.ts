/**
 * FLUI - Cron Manager
 * Gerencia agendamentos cron persistentes
 */

import { getConfig, setConfig } from '../store/storage.js';
import { generateId } from '../utils/id.js';
import * as cron from 'node-cron';

export interface CronConfig {
  id: string;
  automationId: string;
  cronExpression: string;
  timezone: string;
  triggerData: any;
  enabled: boolean;
  maxExecutions: number;
  executionCount: number;
  createdAt: string;
  lastExecutedAt?: string;
  nextExecutionAt?: string;
}

interface ActiveCronTask {
  config: CronConfig;
  task: cron.ScheduledTask;
  onTrigger: (config: CronConfig) => Promise<void>;
}

class CronManager {
  private crons: Map<string, CronConfig> = new Map();
  private activeTasks: Map<string, ActiveCronTask> = new Map();

  constructor() {
    this.loadFromStorage();
  }

  /**
   * Carrega crons do storage
   */
  private loadFromStorage(): void {
    try {
      const config = getConfig();
      const cronsData = (config as any).crons || {};
      
      Object.values(cronsData).forEach((cronConfig: any) => {
        this.crons.set(cronConfig.id, cronConfig);
      });
      
      console.log(`✅ [CronManager] ${this.crons.size} crons carregados`);
    } catch (error) {
      console.error('❌ [CronManager] Erro ao carregar crons:', error);
    }
  }

  /**
   * Salva crons no storage
   */
  private saveToStorage(): void {
    try {
      const config = getConfig();
      const cronsData: Record<string, CronConfig> = {};
      
      this.crons.forEach((cronConfig, id) => {
        cronsData[id] = cronConfig;
      });
      
      setConfig({
        ...config,
        crons: cronsData,
      });
      
      console.log(`💾 [CronManager] ${this.crons.size} crons salvos`);
    } catch (error) {
      console.error('❌ [CronManager] Erro ao salvar crons:', error);
    }
  }

  /**
   * Cria novo cron
   */
  createCron(params: {
    automationId: string;
    cronExpression: string;
    timezone?: string;
    triggerData?: any;
    enabled?: boolean;
    maxExecutions?: number;
  }): CronConfig {
    // Validar expressão cron
    if (!cron.validate(params.cronExpression)) {
      throw new Error(`Expressão cron inválida: ${params.cronExpression}`);
    }

    const id = `cron-${generateId()}`;
    
    const cronConfig: CronConfig = {
      id,
      automationId: params.automationId,
      cronExpression: params.cronExpression,
      timezone: params.timezone || 'America/Sao_Paulo',
      triggerData: params.triggerData || {},
      enabled: params.enabled !== false,
      maxExecutions: params.maxExecutions || 0,
      executionCount: 0,
      createdAt: new Date().toISOString(),
    };

    // Calcular próxima execução
    cronConfig.nextExecutionAt = this.calculateNextExecution(params.cronExpression);

    this.crons.set(id, cronConfig);
    this.saveToStorage();

    console.log(`✅ [CronManager] Cron criado: ${params.cronExpression} → automation ${params.automationId}`);

    return cronConfig;
  }

  /**
   * Atualiza cron existente
   */
  updateCron(id: string, updates: Partial<CronConfig>): CronConfig {
    const cronConfig = this.crons.get(id);
    if (!cronConfig) {
      throw new Error(`Cron ${id} não encontrado`);
    }

    // Se mudar expressão, validar
    if (updates.cronExpression && updates.cronExpression !== cronConfig.cronExpression) {
      if (!cron.validate(updates.cronExpression)) {
        throw new Error(`Expressão cron inválida: ${updates.cronExpression}`);
      }
      
      // Recalcular próxima execução
      updates.nextExecutionAt = this.calculateNextExecution(updates.cronExpression);
    }

    const updated = { ...cronConfig, ...updates };
    this.crons.set(id, updated);
    this.saveToStorage();

    // Se mudou enabled ou expressão, recarregar task
    if (updates.enabled !== undefined || updates.cronExpression) {
      this.stopCronTask(id);
      if (updated.enabled) {
        // Task será reativada externamente via startCron
      }
    }

    console.log(`✅ [CronManager] Cron ${id} atualizado`);

    return updated;
  }

  /**
   * Busca cron por ID
   */
  getCron(id: string): CronConfig | undefined {
    return this.crons.get(id);
  }

  /**
   * Lista crons de uma automação
   */
  getCronsByAutomation(automationId: string): CronConfig[] {
    return Array.from(this.crons.values()).filter(
      (c) => c.automationId === automationId
    );
  }

  /**
   * Lista todos os crons
   */
  getAllCrons(): CronConfig[] {
    return Array.from(this.crons.values());
  }

  /**
   * Remove cron
   */
  deleteCron(id: string): boolean {
    const cronConfig = this.crons.get(id);
    if (!cronConfig) {
      return false;
    }

    // Parar task se ativa
    this.stopCronTask(id);

    this.crons.delete(id);
    this.saveToStorage();

    console.log(`🗑️  [CronManager] Cron ${id} removido`);

    return true;
  }

  /**
   * Remove todos os crons de uma automação
   */
  deleteCronsByAutomation(automationId: string): number {
    const cronConfigs = this.getCronsByAutomation(automationId);

    cronConfigs.forEach((cronConfig) => {
      this.stopCronTask(cronConfig.id);
      this.crons.delete(cronConfig.id);
    });

    this.saveToStorage();

    console.log(`🗑️  [CronManager] ${cronConfigs.length} crons removidos da automação ${automationId}`);

    return cronConfigs.length;
  }

  /**
   * Inicia task cron
   */
  startCron(id: string, onTrigger: (config: CronConfig) => Promise<void>): boolean {
    const cronConfig = this.crons.get(id);
    if (!cronConfig) {
      console.error(`❌ [CronManager] Cron ${id} não encontrado`);
      return false;
    }

    if (!cronConfig.enabled) {
      console.log(`⏸️  [CronManager] Cron ${id} está desabilitado`);
      return false;
    }

    // Se já está ativa, não recriar
    if (this.activeTasks.has(id)) {
      console.log(`⚠️  [CronManager] Cron ${id} já está ativa`);
      return true;
    }

    try {
      // Criar task com timezone
      const task = cron.schedule(
        cronConfig.cronExpression,
        async () => {
          await this.executeCronTask(id, onTrigger);
        },
        {
          timezone: cronConfig.timezone as any, // node-cron types podem ser limitados
        }
      );

      this.activeTasks.set(id, {
        config: cronConfig,
        task,
        onTrigger,
      });

      console.log(`✅ [CronManager] Cron ${id} iniciado: ${cronConfig.cronExpression} (${cronConfig.timezone})`);

      return true;
    } catch (error: any) {
      console.error(`❌ [CronManager] Erro ao iniciar cron ${id}:`, error.message);
      return false;
    }
  }

  /**
   * Para task cron
   */
  stopCronTask(id: string): boolean {
    const activeTask = this.activeTasks.get(id);
    if (!activeTask) {
      return false;
    }

    try {
      activeTask.task.stop();
      this.activeTasks.delete(id);

      console.log(`🛑 [CronManager] Cron ${id} parado`);

      return true;
    } catch (error: any) {
      console.error(`❌ [CronManager] Erro ao parar cron ${id}:`, error.message);
      return false;
    }
  }

  /**
   * Para todas as tasks ativas
   */
  stopAllCronTasks(): void {
    console.log(`🛑 [CronManager] Parando ${this.activeTasks.size} crons ativos...`);

    this.activeTasks.forEach((activeTask, id) => {
      try {
        activeTask.task.stop();
        console.log(`  ✓ Cron ${id} parado`);
      } catch (error: any) {
        console.error(`  ✗ Erro ao parar cron ${id}:`, error.message);
      }
    });

    this.activeTasks.clear();

    console.log(`✅ [CronManager] Todos os crons foram parados`);
  }

  /**
   * Recarrega todos os crons habilitados
   */
  reloadAllCrons(onTrigger: (config: CronConfig) => Promise<void>): number {
    console.log(`🔄 [CronManager] Recarregando crons habilitados...`);

    let loaded = 0;

    this.crons.forEach((cronConfig) => {
      if (cronConfig.enabled) {
        const started = this.startCron(cronConfig.id, onTrigger);
        if (started) {
          loaded++;
        }
      }
    });

    console.log(`✅ [CronManager] ${loaded} crons recarregados`);

    return loaded;
  }

  /**
   * Executa task cron
   */
  private async executeCronTask(id: string, onTrigger: (config: CronConfig) => Promise<void>): Promise<void> {
    const cronConfig = this.crons.get(id);
    if (!cronConfig) {
      console.error(`❌ [CronManager] Cron ${id} não encontrado ao executar`);
      return;
    }

    console.log(`⏰ [CronManager] Executando cron ${id} (${cronConfig.executionCount + 1}/${cronConfig.maxExecutions || '∞'})`);

    try {
      // Atualizar contadores
      cronConfig.executionCount++;
      cronConfig.lastExecutedAt = new Date().toISOString();
      cronConfig.nextExecutionAt = this.calculateNextExecution(cronConfig.cronExpression);

      this.crons.set(id, cronConfig);

      // Salvar a cada 10 execuções (otimização)
      if (cronConfig.executionCount % 10 === 0) {
        this.saveToStorage();
      }

      // Executar callback
      await onTrigger(cronConfig);

      // Verificar se atingiu máximo de execuções
      if (cronConfig.maxExecutions > 0 && cronConfig.executionCount >= cronConfig.maxExecutions) {
        console.log(`🛑 [CronManager] Cron ${id} atingiu máximo de ${cronConfig.maxExecutions} execuções`);
        this.stopCronTask(id);

        // Desabilitar no config
        cronConfig.enabled = false;
        this.crons.set(id, cronConfig);
        this.saveToStorage();
      }
    } catch (error: any) {
      console.error(`❌ [CronManager] Erro ao executar cron ${id}:`, error.message);
    }
  }

  /**
   * Calcula próxima execução
   */
  private calculateNextExecution(cronExpression: string): string {
    try {
      // node-cron não tem método getNextDate(), então vamos simular
      // Implementação simplificada: retorna próximo minuto
      const now = new Date();
      const next = new Date(now.getTime() + 60000); // +1 minuto
      return next.toISOString();
    } catch (error) {
      return new Date(Date.now() + 60000).toISOString();
    }
  }

  /**
   * Lista tasks ativas
   */
  getActiveCronTasks(): string[] {
    return Array.from(this.activeTasks.keys());
  }

  /**
   * Verifica se cron está ativo
   */
  isCronActive(id: string): boolean {
    return this.activeTasks.has(id);
  }
}

// Singleton
let cronManagerInstance: CronManager | null = null;

export function getCronManager(): CronManager {
  if (!cronManagerInstance) {
    cronManagerInstance = new CronManager();
  }
  return cronManagerInstance;
}
