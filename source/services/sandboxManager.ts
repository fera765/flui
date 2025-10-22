/**
 * FLUI - Sandbox Manager
 * 
 * Gerencia sandboxes únicos para cada automação
 * Cada sandbox tem seu próprio diretório e arquivo .env
 */

import { mkdir, writeFile, readFile, rm } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export interface SandboxConfig {
  automationId: string;
  mcpEnvVars?: Record<string, Record<string, string>>; // mcpId -> env vars
  customEnvVars?: Record<string, string>;
}

export class SandboxManager {
  private baseSandboxPath: string;

  constructor(basePath: string = join(process.cwd(), 'workspace', 'sandboxes')) {
    this.baseSandboxPath = basePath;
  }

  /**
   * Cria um sandbox único para uma automação
   */
  async createSandbox(config: SandboxConfig): Promise<string> {
    const sandboxPath = join(this.baseSandboxPath, config.automationId);

    try {
      // Criar diretório do sandbox
      await mkdir(sandboxPath, { recursive: true });

      // Criar arquivo .env com variáveis de ambiente
      const envContent = this.buildEnvFile(config);
      const envFilePath = join(sandboxPath, '.env');
      await writeFile(envFilePath, envContent, 'utf-8');

      console.log(`✅ [SandboxManager] Sandbox criado: ${sandboxPath}`);

      return sandboxPath;
    } catch (error: any) {
      console.error(`❌ [SandboxManager] Erro ao criar sandbox: ${error.message}`);
      throw error;
    }
  }

  /**
   * Constrói o conteúdo do arquivo .env
   */
  private buildEnvFile(config: SandboxConfig): string {
    const lines: string[] = [];

    // Adicionar header
    lines.push('# FLUI Automation Sandbox Environment');
    lines.push(`# Automation ID: ${config.automationId}`);
    lines.push(`# Created: ${new Date().toISOString()}`);
    lines.push('');

    // Adicionar variáveis customizadas
    if (config.customEnvVars && Object.keys(config.customEnvVars).length > 0) {
      lines.push('# Custom Environment Variables');
      for (const [key, value] of Object.entries(config.customEnvVars)) {
        lines.push(`${key}=${value}`);
      }
      lines.push('');
    }

    // Adicionar variáveis de MCPs
    if (config.mcpEnvVars) {
      for (const [mcpId, vars] of Object.entries(config.mcpEnvVars)) {
        lines.push(`# MCP: ${mcpId}`);
        for (const [key, value] of Object.entries(vars)) {
          lines.push(`${key}=${value}`);
        }
        lines.push('');
      }
    }

    return lines.join('\n');
  }

  /**
   * Obtém o caminho do sandbox de uma automação
   */
  getSandboxPath(automationId: string): string {
    return join(this.baseSandboxPath, automationId);
  }

  /**
   * Verifica se um sandbox existe
   */
  sandboxExists(automationId: string): boolean {
    const sandboxPath = this.getSandboxPath(automationId);
    return existsSync(sandboxPath);
  }

  /**
   * Lê variáveis de ambiente de um sandbox
   */
  async readEnvVars(automationId: string): Promise<Record<string, string>> {
    const envFilePath = join(this.getSandboxPath(automationId), '.env');
    const envVars: Record<string, string> = {};

    try {
      const content = await readFile(envFilePath, 'utf-8');
      const lines = content.split('\n');

      for (const line of lines) {
        // Ignorar comentários e linhas vazias
        if (line.trim().startsWith('#') || !line.trim()) continue;

        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
          envVars[key.trim()] = valueParts.join('=').trim();
        }
      }

      return envVars;
    } catch (error: any) {
      console.warn(`⚠️ [SandboxManager] Erro ao ler .env: ${error.message}`);
      return {};
    }
  }

  /**
   * Atualiza variáveis de ambiente de um sandbox
   */
  async updateEnvVars(
    automationId: string,
    updates: Record<string, string>
  ): Promise<void> {
    const currentVars = await this.readEnvVars(automationId);
    const mergedVars = { ...currentVars, ...updates };

    const config: SandboxConfig = {
      automationId,
      customEnvVars: mergedVars,
    };

    const envContent = this.buildEnvFile(config);
    const envFilePath = join(this.getSandboxPath(automationId), '.env');
    await writeFile(envFilePath, envContent, 'utf-8');
  }

  /**
   * Remove um sandbox
   */
  async removeSandbox(automationId: string): Promise<void> {
    const sandboxPath = this.getSandboxPath(automationId);

    try {
      if (existsSync(sandboxPath)) {
        await rm(sandboxPath, { recursive: true, force: true });
        console.log(`✅ [SandboxManager] Sandbox removido: ${sandboxPath}`);
      }
    } catch (error: any) {
      console.error(`❌ [SandboxManager] Erro ao remover sandbox: ${error.message}`);
      throw error;
    }
  }

  /**
   * Lista todos os sandboxes
   */
  async listSandboxes(): Promise<string[]> {
    try {
      if (!existsSync(this.baseSandboxPath)) {
        return [];
      }

      const { readdir } = await import('fs/promises');
      return await readdir(this.baseSandboxPath);
    } catch (error: any) {
      console.error(`❌ [SandboxManager] Erro ao listar sandboxes: ${error.message}`);
      return [];
    }
  }

  /**
   * Limpa sandboxes antigos (mais de 7 dias)
   */
  async cleanupOldSandboxes(maxAgeDays: number = 7): Promise<number> {
    try {
      const sandboxes = await this.listSandboxes();
      const maxAgeMs = maxAgeDays * 24 * 60 * 60 * 1000;
      const now = Date.now();
      let cleaned = 0;

      for (const sandbox of sandboxes) {
        const sandboxPath = join(this.baseSandboxPath, sandbox);
        const { stat } = await import('fs/promises');
        const stats = await stat(sandboxPath);
        const ageMs = now - stats.mtimeMs;

        if (ageMs > maxAgeMs) {
          await this.removeSandbox(sandbox);
          cleaned++;
        }
      }

      console.log(`✅ [SandboxManager] ${cleaned} sandboxes antigos removidos`);
      return cleaned;
    } catch (error: any) {
      console.error(`❌ [SandboxManager] Erro ao limpar sandboxes: ${error.message}`);
      return 0;
    }
  }
}

// Instância global
let globalSandboxManager: SandboxManager | null = null;

export function getSandboxManager(): SandboxManager {
  if (!globalSandboxManager) {
    globalSandboxManager = new SandboxManager();
  }
  return globalSandboxManager;
}
