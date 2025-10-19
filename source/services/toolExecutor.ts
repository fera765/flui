import { createSandbox } from './sandbox.js';
import { writeFile, readFile, readdir } from 'fs/promises';
import { join } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface ToolResult {
  success: boolean;
  result?: any;
  error?: string;
}

export const executeTool = async (
  toolName: string,
  args: any
): Promise<ToolResult> => {
  try {
    // Separar MCP name do tool name
    const [mcpName, ...toolNameParts] = toolName.split('_');
    const actualToolName = toolNameParts.join('_');

    // Tools do FileSystem MCP
    if (mcpName === 'FileSystem' || actualToolName.includes('file') || actualToolName.includes('File')) {
      return await executeFileSystemTool(actualToolName, args);
    }

    // Tools do Shell MCP
    if (mcpName === 'Shell' || actualToolName.includes('shell') || actualToolName.includes('exec')) {
      return await executeShellTool(actualToolName, args);
    }

    // Tools do Search MCP
    if (mcpName === 'Search' || actualToolName.includes('search') || actualToolName.includes('find')) {
      return await executeSearchTool(actualToolName, args);
    }

    // Tool genérica não reconhecida
    return {
      success: false,
      error: `Tool não reconhecida: ${toolName}`,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
};

// FileSystem Tools
const executeFileSystemTool = async (
  toolName: string,
  args: any
): Promise<ToolResult> => {
  const sandbox = await createSandbox();
  await sandbox.initialize();

  try {
    switch (toolName) {
      case 'createFile':
      case 'writeFile':
        if (!args.filename || !args.content) {
          return { success: false, error: 'filename e content são obrigatórios' };
        }
        await sandbox.writeFile(args.filename, args.content);
        return {
          success: true,
          result: `Arquivo ${args.filename} criado com sucesso`,
        };

      case 'readFile':
        if (!args.filename) {
          return { success: false, error: 'filename é obrigatório' };
        }
        const content = await sandbox.readFile(args.filename);
        return {
          success: true,
          result: content,
        };

      case 'editFile':
      case 'replaceInFile':
        if (!args.filename || !args.search || args.replace === undefined) {
          return {
            success: false,
            error: 'filename, search e replace são obrigatórios',
          };
        }
        const fileContent = await sandbox.readFile(args.filename);
        const newContent = fileContent.replace(
          new RegExp(args.search, 'g'),
          args.replace
        );
        await sandbox.writeFile(args.filename, newContent);
        return {
          success: true,
          result: `Arquivo ${args.filename} editado com sucesso`,
        };

      case 'listFiles':
        const sandboxPath = sandbox.getSandboxPath();
        const files = await readdir(sandboxPath);
        return {
          success: true,
          result: files,
        };

      default:
        return {
          success: false,
          error: `FileSystem tool não reconhecida: ${toolName}`,
        };
    }
  } finally {
    await sandbox.cleanup();
  }
};

// Shell Tools
const executeShellTool = async (
  toolName: string,
  args: any
): Promise<ToolResult> => {
  const sandbox = await createSandbox();
  await sandbox.initialize();

  try {
    switch (toolName) {
      case 'execute':
      case 'exec':
      case 'run':
        if (!args.command) {
          return { success: false, error: 'command é obrigatório' };
        }
        
        const language = args.language || 'shell';
        let result;

        if (language === 'javascript' || language === 'js') {
          result = await sandbox.executeJavaScript(args.command);
        } else if (language === 'python' || language === 'py') {
          result = await sandbox.executePython(args.command);
        } else {
          result = await sandbox.executeShell(args.command);
        }

        return {
          success: result.success,
          result: result.output,
          error: result.error,
        };

      default:
        return {
          success: false,
          error: `Shell tool não reconhecida: ${toolName}`,
        };
    }
  } finally {
    await sandbox.cleanup();
  }
};

// Search Tools
const executeSearchTool = async (
  toolName: string,
  args: any
): Promise<ToolResult> => {
  const sandbox = await createSandbox();
  await sandbox.initialize();

  try {
    switch (toolName) {
      case 'searchInFiles':
      case 'grep':
      case 'find':
        if (!args.pattern) {
          return { success: false, error: 'pattern é obrigatório' };
        }

        const sandboxPath = sandbox.getSandboxPath();
        const files = await readdir(sandboxPath);
        const matches: Array<{ file: string; lines: Array<{ line: number; content: string }> }> = [];

        for (const file of files) {
          try {
            const content = await readFile(join(sandboxPath, file), 'utf-8');
            const lines = content.split('\n');
            const matchingLines: Array<{ line: number; content: string }> = [];

            lines.forEach((line, index) => {
              if (line.includes(args.pattern)) {
                matchingLines.push({
                  line: index + 1,
                  content: line,
                });
              }
            });

            if (matchingLines.length > 0) {
              matches.push({
                file,
                lines: matchingLines,
              });
            }
          } catch {
            // Ignorar arquivos que não podem ser lidos
          }
        }

        return {
          success: true,
          result: matches,
        };

      default:
        return {
          success: false,
          error: `Search tool não reconhecida: ${toolName}`,
        };
    }
  } finally {
    await sandbox.cleanup();
  }
};
