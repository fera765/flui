import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile, mkdir, rm } from 'fs/promises';
import { join } from 'path';
import { nanoid } from 'nanoid';
import { tmpdir } from 'os';

const execAsync = promisify(exec);

export interface SandboxOptions {
  timeout?: number; // em ms
  memory?: number; // em MB
  env?: Record<string, string>;
}

export interface SandboxResult {
  success: boolean;
  output: string;
  error?: string;
  exitCode: number;
  executionTime: number;
}

export class Sandbox {
  private sandboxId: string;
  private sandboxPath: string;

  constructor() {
    this.sandboxId = nanoid();
    this.sandboxPath = join(tmpdir(), 'flui-sandbox', this.sandboxId);
  }

  async initialize(): Promise<void> {
    await mkdir(this.sandboxPath, { recursive: true });
  }

  async executeJavaScript(code: string, options: SandboxOptions = {}): Promise<SandboxResult> {
    const startTime = Date.now();
    const timeout = options.timeout || 30000; // 30s padrão

    try {
      // Criar arquivo temporário
      const scriptPath = join(this.sandboxPath, 'script.js');
      await writeFile(scriptPath, code);

      // Executar com Node.js
      const command = `node ${scriptPath}`;
      const { stdout, stderr } = await execAsync(command, {
        cwd: this.sandboxPath,
        timeout,
        maxBuffer: 1024 * 1024 * 10, // 10MB
        env: {
          ...process.env,
          ...options.env,
          NODE_ENV: 'sandbox',
        },
      });

      const executionTime = Date.now() - startTime;

      return {
        success: true,
        output: stdout,
        error: stderr || undefined,
        exitCode: 0,
        executionTime,
      };
    } catch (error: any) {
      const executionTime = Date.now() - startTime;
      return {
        success: false,
        output: error.stdout || '',
        error: error.message || error.stderr || 'Erro desconhecido',
        exitCode: error.code || 1,
        executionTime,
      };
    }
  }

  async executePython(code: string, options: SandboxOptions = {}): Promise<SandboxResult> {
    const startTime = Date.now();
    const timeout = options.timeout || 30000;

    try {
      const scriptPath = join(this.sandboxPath, 'script.py');
      await writeFile(scriptPath, code);

      const command = `python3 ${scriptPath}`;
      const { stdout, stderr } = await execAsync(command, {
        cwd: this.sandboxPath,
        timeout,
        maxBuffer: 1024 * 1024 * 10,
        env: {
          ...process.env,
          ...options.env,
          PYTHONUNBUFFERED: '1',
        },
      });

      const executionTime = Date.now() - startTime;

      return {
        success: true,
        output: stdout,
        error: stderr || undefined,
        exitCode: 0,
        executionTime,
      };
    } catch (error: any) {
      const executionTime = Date.now() - startTime;
      return {
        success: false,
        output: error.stdout || '',
        error: error.message || error.stderr || 'Erro desconhecido',
        exitCode: error.code || 1,
        executionTime,
      };
    }
  }

  async executeShell(command: string, options: SandboxOptions = {}): Promise<SandboxResult> {
    const startTime = Date.now();
    const timeout = options.timeout || 30000;

    try {
      const { stdout, stderr } = await execAsync(command, {
        cwd: this.sandboxPath,
        timeout,
        maxBuffer: 1024 * 1024 * 10,
        env: {
          ...process.env,
          ...options.env,
        },
      });

      const executionTime = Date.now() - startTime;

      return {
        success: true,
        output: stdout,
        error: stderr || undefined,
        exitCode: 0,
        executionTime,
      };
    } catch (error: any) {
      const executionTime = Date.now() - startTime;
      return {
        success: false,
        output: error.stdout || '',
        error: error.message || error.stderr || 'Erro desconhecido',
        exitCode: error.code || 1,
        executionTime,
      };
    }
  }

  async writeFile(filename: string, content: string): Promise<void> {
    const filePath = join(this.sandboxPath, filename);
    await writeFile(filePath, content, 'utf-8');
  }

  async readFile(filename: string): Promise<string> {
    const filePath = join(this.sandboxPath, filename);
    const { readFile } = await import('fs/promises');
    return await readFile(filePath, 'utf-8');
  }

  getSandboxPath(): string {
    return this.sandboxPath;
  }

  async cleanup(): Promise<void> {
    try {
      await rm(this.sandboxPath, { recursive: true, force: true });
    } catch (error) {
      console.error('Erro ao limpar sandbox:', error);
    }
  }
}

export const createSandbox = async (): Promise<Sandbox> => {
  const sandbox = new Sandbox();
  await sandbox.initialize();
  return sandbox;
};
