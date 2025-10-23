/**
 * Shell Tool - Execute shell commands in sandbox
 * Executes only in automation sandbox
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface ShellParams {
  command: string;
  timeout?: number;
  env?: Record<string, string>;
  cwd?: string;
}

export interface ShellResult {
  success: boolean;
  stdout?: string;
  stderr?: string;
  exitCode?: number;
  error?: string;
}

export class ShellTool {
  async execute(params: ShellParams): Promise<ShellResult> {
    try {
      const timeout = params.timeout || 30000; // 30s default
      
      const result = await execAsync(params.command, {
        timeout,
        env: { ...process.env, ...params.env },
        cwd: params.cwd,
        maxBuffer: 10 * 1024 * 1024, // 10MB
      });

      return {
        success: true,
        stdout: result.stdout,
        stderr: result.stderr,
        exitCode: 0,
      };
    } catch (error: any) {
      if (error.killed && error.signal === 'SIGTERM') {
        return {
          success: false,
          error: `Command timeout after ${params.timeout}ms`,
          exitCode: -1,
        };
      }

      return {
        success: false,
        stdout: error.stdout || '',
        stderr: error.stderr || '',
        exitCode: error.code || 1,
        error: error.message,
      };
    }
  }
}
