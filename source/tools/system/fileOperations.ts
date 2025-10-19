/**
 * FLUI - File Operations Tools
 * 
 * Ferramentas para manipulação de arquivos:
 * - fileRead: Ler arquivo
 * - fileWrite: Escrever arquivo
 * - fileEdit: Editar arquivo (find/replace)
 * - fileSearch: Buscar arquivos
 * - textSearch: Buscar texto em arquivos
 */

import { Tool, ExecutionContext, ToolResult } from '../../core/types.js';
import { createSandbox } from '../../services/sandbox.js';
import { readFile, writeFile, readdir } from 'fs/promises';
import { join, basename } from 'path';
import { glob } from 'glob';

// =================== FILE READ ===================

export const FileReadTool: Tool = {
  id: 'file-read',
  name: 'File Read',
  description: 'Lê o conteúdo de um arquivo',
  category: 'system',
  version: '1.0.0',

  params: [
    {
      name: 'Caminho do Arquivo',
      key: 'path',
      type: 'string',
      description: 'Caminho do arquivo',
      required: true,
      placeholder: '/path/to/file.txt',
      ui: {
        widgetType: 'textInput',
        placeholder: '/path/to/file.txt',
        helperText: 'Caminho completo ou relativo do arquivo a ser lido',
        allowExpressions: true,
      },
    },
    {
      name: 'Codificação',
      key: 'encoding',
      type: 'string',
      description: 'Codificação do arquivo',
      required: false,
      default: 'utf-8',
      options: ['utf-8', 'ascii', 'base64', 'hex'],
      ui: {
        widgetType: 'select',
        options: [
          { label: 'UTF-8', value: 'utf-8' },
          { label: 'ASCII', value: 'ascii' },
          { label: 'Base64', value: 'base64' },
          { label: 'Hexadecimal', value: 'hex' },
        ],
        helperText: 'Formato de codificação do arquivo',
        advanced: true,
      },
    },
  ],

  output: {
    type: 'string',
    description: 'Conteúdo do arquivo',
  },

  async execute(args: any, context: ExecutionContext): Promise<ToolResult> {
    try {
      const content = await readFile(args.path, { encoding: args.encoding });
      return {
        success: true,
        result: content,
      };
    } catch (error: any) {
      return {
        success: false,
        error: `Erro ao ler arquivo: ${error.message}`,
      };
    }
  },

  ui: {
    icon: 'FileText',
    color: '#3b82f6', // blue
    tags: ['file', 'read', 'content'],
    examples: [
      {
        title: 'Ler arquivo de texto',
        description: 'Lê conteúdo de um arquivo txt',
        params: {
          path: '/path/to/file.txt',
        },
      },
    ],
  },

  config: {
    timeout: 10000,
    sandbox: false,
  },
};

// =================== FILE WRITE ===================

export const FileWriteTool: Tool = {
  id: 'file-write',
  name: 'File Write',
  description: 'Escreve conteúdo em um arquivo',
  category: 'system',
  version: '1.0.0',

  params: [
    {
      name: 'Caminho do Arquivo',
      key: 'path',
      type: 'string',
      description: 'Caminho do arquivo',
      required: true,
      placeholder: '/path/to/file.txt',
      ui: {
        widgetType: 'textInput',
        placeholder: '/path/to/file.txt',
        helperText: 'Caminho onde o arquivo será criado ou sobrescrito',
        allowExpressions: true,
      },
    },
    {
      name: 'Conteúdo',
      key: 'content',
      type: 'string',
      description: 'Conteúdo a ser escrito',
      required: true,
      ui: {
        widgetType: 'textArea',
        placeholder: 'Digite o conteúdo do arquivo...',
        helperText: 'Texto que será escrito no arquivo',
        allowExpressions: true,
        rows: 8,
      },
    },
    {
      name: 'Modo',
      key: 'mode',
      type: 'string',
      description: 'Modo de escrita',
      required: false,
      default: 'overwrite',
      options: ['overwrite', 'append'],
      ui: {
        widgetType: 'select',
        options: [
          { label: 'Sobrescrever', value: 'overwrite', description: 'Substitui conteúdo existente' },
          { label: 'Adicionar', value: 'append', description: 'Adiciona ao final do arquivo' },
        ],
        helperText: 'Como o conteúdo será escrito',
      },
    },
    {
      name: 'Codificação',
      key: 'encoding',
      type: 'string',
      description: 'Codificação do arquivo',
      required: false,
      default: 'utf-8',
      ui: {
        widgetType: 'textInput',
        placeholder: 'utf-8',
        helperText: 'Formato de codificação (padrão: utf-8)',
        advanced: true,
      },
    },
  ],

  output: {
    type: 'object',
    description: 'Status da operação',
    schema: {
      success: 'boolean',
      bytesWritten: 'number',
    },
  },

  async execute(args: any, context: ExecutionContext): Promise<ToolResult> {
    try {
      const options: any = { encoding: args.encoding };
      
      if (args.mode === 'append') {
        options.flag = 'a';
      }

      await writeFile(args.path, args.content, options);
      
      const bytesWritten = Buffer.byteLength(args.content, args.encoding);

      return {
        success: true,
        result: {
          success: true,
          bytesWritten,
          path: args.path,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: `Erro ao escrever arquivo: ${error.message}`,
      };
    }
  },

  ui: {
    icon: 'FilePlus',
    color: '#10b981', // green
    tags: ['file', 'write', 'save'],
    examples: [
      {
        title: 'Criar arquivo',
        description: 'Cria um novo arquivo com conteúdo',
        params: {
          path: '/path/to/new-file.txt',
          content: 'Hello World',
        },
      },
      {
        title: 'Adicionar ao arquivo',
        description: 'Adiciona conteúdo ao final do arquivo',
        params: {
          path: '/path/to/file.txt',
          content: '\nNova linha',
          mode: 'append',
        },
      },
    ],
  },

  config: {
    timeout: 10000,
    sandbox: false,
  },
};

// =================== FILE EDIT ===================

export const FileEditTool: Tool = {
  id: 'file-edit',
  name: 'File Edit',
  description: 'Edita conteúdo de arquivo usando busca e substituição (regex)',
  category: 'system',
  version: '1.0.0',

  params: [
    {
      name: 'Caminho do Arquivo',
      key: 'path',
      type: 'string',
      description: 'Caminho do arquivo',
      required: true,
      placeholder: '/path/to/file.txt',
      ui: {
        widgetType: 'textInput',
        placeholder: '/path/to/file.txt',
        helperText: 'Arquivo que será editado',
        allowExpressions: true,
      },
    },
    {
      name: 'Buscar',
      key: 'search',
      type: 'string',
      description: 'Expressão de busca (regex)',
      required: true,
      placeholder: 'old_text',
      ui: {
        widgetType: 'textInput',
        placeholder: 'old_text',
        helperText: 'Texto ou expressão regular a ser buscada',
        allowExpressions: true,
      },
    },
    {
      name: 'Substituir',
      key: 'replace',
      type: 'string',
      description: 'Texto de substituição',
      required: true,
      placeholder: 'new_text',
      ui: {
        widgetType: 'textInput',
        placeholder: 'new_text',
        helperText: 'Novo texto que substituirá as ocorrências',
        allowExpressions: true,
      },
    },
    {
      name: 'Flags Regex',
      key: 'flags',
      type: 'string',
      description: 'Flags regex (g, i, m)',
      required: false,
      default: 'g',
      placeholder: 'g',
      ui: {
        widgetType: 'textInput',
        placeholder: 'g',
        helperText: 'g=global, i=case insensitive, m=multiline',
        advanced: true,
      },
    },
  ],

  output: {
    type: 'object',
    description: 'Resultado da edição',
    schema: {
      success: 'boolean',
      replacements: 'number',
    },
  },

  async execute(args: any, context: ExecutionContext): Promise<ToolResult> {
    try {
      // Ler arquivo
      const content = await readFile(args.path, 'utf-8');

      // Aplicar regex
      const regex = new RegExp(args.search, args.flags);
      let replacements = 0;
      
      const newContent = content.replace(regex, () => {
        replacements++;
        return args.replace;
      });

      // Escrever de volta
      await writeFile(args.path, newContent, 'utf-8');

      return {
        success: true,
        result: {
          success: true,
          replacements,
          path: args.path,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: `Erro ao editar arquivo: ${error.message}`,
      };
    }
  },

  ui: {
    icon: 'FileEdit',
    color: '#f59e0b', // amber
    tags: ['file', 'edit', 'replace', 'regex'],
    examples: [
      {
        title: 'Substituir texto',
        description: 'Substitui todas as ocorrências',
        params: {
          path: '/path/to/file.txt',
          search: 'old',
          replace: 'new',
        },
      },
      {
        title: 'Substituir com regex',
        description: 'Usa regex para substituição',
        params: {
          path: '/path/to/file.txt',
          search: '\\d+',
          replace: '0',
        },
      },
    ],
  },

  config: {
    timeout: 10000,
    sandbox: false,
  },
};

// =================== FILE SEARCH ===================

export const FileSearchTool: Tool = {
  id: 'file-search',
  name: 'File Search',
  description: 'Busca arquivos por nome/padrão usando glob',
  category: 'system',
  version: '1.0.0',

  params: [
    {
      name: 'Padrão de Busca',
      key: 'pattern',
      type: 'string',
      description: 'Padrão de busca (glob)',
      required: true,
      placeholder: '**/*.js',
      ui: {
        widgetType: 'textInput',
        placeholder: '**/*.js',
        helperText: 'Padrão glob: ** = qualquer subdiretório, * = qualquer nome',
        allowExpressions: true,
      },
    },
    {
      name: 'Diretório',
      key: 'directory',
      type: 'string',
      description: 'Diretório base',
      required: false,
      default: '.',
      placeholder: '.',
      ui: {
        widgetType: 'textInput',
        placeholder: '.',
        helperText: 'Diretório onde iniciar a busca (padrão: atual)',
        allowExpressions: true,
      },
    },
    {
      name: 'Máximo de Resultados',
      key: 'maxResults',
      type: 'number',
      description: 'Número máximo de resultados',
      required: false,
      default: 100,
      ui: {
        widgetType: 'number',
        placeholder: '100',
        helperText: 'Limita quantidade de arquivos retornados',
        validation: {
          min: 1,
          max: 1000,
        },
        advanced: true,
      },
    },
  ],

  output: {
    type: 'array',
    description: 'Lista de caminhos encontrados',
  },

  async execute(args: any, context: ExecutionContext): Promise<ToolResult> {
    try {
      const files = await glob(args.pattern, {
        cwd: args.directory,
        absolute: true,
      });

      const results = files.slice(0, args.maxResults);

      return {
        success: true,
        result: results,
        metadata: {
          totalFound: files.length,
          returned: results.length,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: `Erro ao buscar arquivos: ${error.message}`,
      };
    }
  },

  ui: {
    icon: 'Search',
    color: '#8b5cf6', // purple
    tags: ['file', 'search', 'find', 'glob'],
    examples: [
      {
        title: 'Buscar arquivos JS',
        description: 'Encontra todos os arquivos .js',
        params: {
          pattern: '**/*.js',
          directory: './src',
        },
      },
      {
        title: 'Buscar por nome',
        description: 'Encontra arquivos com nome específico',
        params: {
          pattern: '**/config.json',
        },
      },
    ],
  },

  config: {
    timeout: 15000,
    sandbox: false,
  },
};

// =================== TEXT SEARCH ===================

export const TextSearchTool: Tool = {
  id: 'text-search',
  name: 'Text Search',
  description: 'Busca texto dentro de múltiplos arquivos',
  category: 'system',
  version: '1.0.0',

  params: [
    {
      name: 'Padrão de Busca',
      key: 'pattern',
      type: 'string',
      description: 'Texto ou regex a buscar',
      required: true,
      placeholder: 'function',
      ui: {
        widgetType: 'textInput',
        placeholder: 'function',
        helperText: 'Texto ou expressão regular para buscar nos arquivos',
        allowExpressions: true,
      },
    },
    {
      name: 'Diretório',
      key: 'directory',
      type: 'string',
      description: 'Diretório base',
      required: false,
      default: '.',
      placeholder: '.',
      ui: {
        widgetType: 'textInput',
        placeholder: '.',
        helperText: 'Diretório onde buscar arquivos',
        allowExpressions: true,
      },
    },
    {
      name: 'Padrão de Arquivos',
      key: 'filePattern',
      type: 'string',
      description: 'Padrão de arquivos (glob)',
      required: false,
      default: '**/*',
      placeholder: '**/*.js',
      ui: {
        widgetType: 'textInput',
        placeholder: '**/*.js',
        helperText: 'Filtrar tipos de arquivo (ex: **/*.{js,ts})',
        allowExpressions: true,
        advanced: true,
      },
    },
    {
      name: 'Case Sensitive',
      key: 'caseSensitive',
      type: 'boolean',
      description: 'Busca case-sensitive',
      required: false,
      default: false,
      ui: {
        widgetType: 'toggle',
        helperText: 'Diferenciar maiúsculas/minúsculas',
        advanced: true,
      },
    },
    {
      name: 'Linhas de Contexto',
      key: 'contextLines',
      type: 'number',
      description: 'Linhas de contexto ao redor',
      required: false,
      default: 2,
      ui: {
        widgetType: 'number',
        placeholder: '2',
        helperText: 'Número de linhas antes/depois da ocorrência',
        validation: {
          min: 0,
          max: 10,
        },
        advanced: true,
      },
    },
    {
      name: 'Máximo de Resultados',
      key: 'maxResults',
      type: 'number',
      description: 'Máximo de ocorrências',
      required: false,
      default: 50,
      ui: {
        widgetType: 'number',
        placeholder: '50',
        helperText: 'Limitar número de ocorrências retornadas',
        validation: {
          min: 1,
          max: 500,
        },
        advanced: true,
      },
    },
  ],

  output: {
    type: 'array',
    description: 'Ocorrências encontradas',
    schema: {
      items: {
        file: 'string',
        line: 'number',
        column: 'number',
        match: 'string',
        context: 'string',
      },
    },
  },

  async execute(args: any, context: ExecutionContext): Promise<ToolResult> {
    try {
      // Buscar arquivos
      const files = await glob(args.filePattern, {
        cwd: args.directory,
        absolute: true,
        nodir: true,
      });

      const results: any[] = [];
      const regex = new RegExp(
        args.pattern,
        args.caseSensitive ? 'g' : 'gi'
      );

      for (const file of files) {
        if (results.length >= args.maxResults) break;

        try {
          const content = await readFile(file, 'utf-8');
          const lines = content.split('\n');

          lines.forEach((line, lineIndex) => {
            if (results.length >= args.maxResults) return;

            const matches = Array.from(line.matchAll(regex));
            
            matches.forEach((match) => {
              if (results.length >= args.maxResults) return;

              // Coletar contexto
              const startLine = Math.max(0, lineIndex - args.contextLines);
              const endLine = Math.min(lines.length - 1, lineIndex + args.contextLines);
              const contextLines = lines.slice(startLine, endLine + 1);

              results.push({
                file: basename(file),
                filePath: file,
                line: lineIndex + 1,
                column: match.index || 0,
                match: match[0],
                context: contextLines.join('\n'),
              });
            });
          });
        } catch {
          // Ignorar arquivos que não podem ser lidos
        }
      }

      return {
        success: true,
        result: results,
        metadata: {
          filesSearched: files.length,
          matchesFound: results.length,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: `Erro ao buscar texto: ${error.message}`,
      };
    }
  },

  ui: {
    icon: 'FileSearch',
    color: '#ec4899', // pink
    tags: ['text', 'search', 'grep', 'find'],
    examples: [
      {
        title: 'Buscar função',
        description: 'Encontra definições de função',
        params: {
          pattern: 'function\\s+\\w+',
          filePattern: '**/*.js',
        },
      },
      {
        title: 'Buscar TODO',
        description: 'Encontra comentários TODO',
        params: {
          pattern: 'TODO:',
          filePattern: '**/*.{js,ts}',
        },
      },
    ],
  },

  config: {
    timeout: 20000,
    sandbox: false,
  },
};
