/**
 * FLUI - Sandbox Defaults Helper
 * 
 * Fornece valores padrão e auto-preenchimento para tools que usam sandbox
 */

import { createSandbox } from './sandbox.js';

export interface SandboxInfo {
  sandboxPath: string;
  workingDirectory: string;
  defaultTimeout: number;
  defaultEncoding: string;
}

let cachedSandboxInfo: SandboxInfo | null = null;

/**
 * Obtém informações do sandbox para auto-preenchimento
 */
export async function getSandboxInfo(): Promise<SandboxInfo> {
  if (cachedSandboxInfo) {
    return cachedSandboxInfo;
  }

  const sandbox = await createSandbox();
  await sandbox.initialize();
  
  const sandboxPath = sandbox.getSandboxPath();
  
  cachedSandboxInfo = {
    sandboxPath,
    workingDirectory: sandboxPath,
    defaultTimeout: 30000,
    defaultEncoding: 'utf-8',
  };

  await sandbox.cleanup();
  
  return cachedSandboxInfo;
}

/**
 * Aplica defaults de sandbox a parâmetros de tool
 */
export async function applySandboxDefaults(
  toolId: string,
  params: any
): Promise<any> {
  // Tools que usam sandbox
  const sandboxTools = [
    'shell-executor',
    'file-write',
    'file-read',
    'file-edit',
    'file-search',
    'text-search',
    'custom-code',
  ];

  if (!sandboxTools.includes(toolId)) {
    return params;
  }

  const sandboxInfo = await getSandboxInfo();
  const result = { ...params };

  // Auto-preencher directory/path com sandbox path
  if (toolId === 'shell-executor') {
    if (!result.directory || result.directory === '.') {
      result.directory = sandboxInfo.sandboxPath;
    }
  }

  if (['file-read', 'file-write', 'file-edit'].includes(toolId)) {
    if (result.path && !result.path.startsWith('/')) {
      // Converter path relativo para absoluto no sandbox
      result.path = `${sandboxInfo.sandboxPath}/${result.path}`;
    } else if (!result.path) {
      // Sugerir path no sandbox
      result.path = `${sandboxInfo.sandboxPath}/file.txt`;
    }
  }

  if (['file-search', 'text-search'].includes(toolId)) {
    if (!result.directory || result.directory === '.') {
      result.directory = sandboxInfo.sandboxPath;
    }
  }

  return result;
}

/**
 * Obtém exemplos de configuração para uma tool no sandbox
 */
export async function getSandboxExamples(toolId: string): Promise<any> {
  const sandboxInfo = await getSandboxInfo();

  const examples: Record<string, any> = {
    'shell-executor': {
      command: 'ls -la',
      directory: sandboxInfo.sandboxPath,
    },
    'file-write': {
      path: `${sandboxInfo.sandboxPath}/example.txt`,
      content: 'Hello from sandbox!',
      mode: 'overwrite',
    },
    'file-read': {
      path: `${sandboxInfo.sandboxPath}/example.txt`,
      encoding: 'utf-8',
    },
    'file-edit': {
      path: `${sandboxInfo.sandboxPath}/example.txt`,
      search: 'old',
      replace: 'new',
    },
    'file-search': {
      pattern: '**/*.txt',
      directory: sandboxInfo.sandboxPath,
    },
    'text-search': {
      pattern: 'Hello',
      directory: sandboxInfo.sandboxPath,
      filePattern: '**/*.txt',
    },
  };

  return examples[toolId] || {};
}

/**
 * Limpa cache de informações do sandbox
 */
export function clearSandboxCache(): void {
  cachedSandboxInfo = null;
}
