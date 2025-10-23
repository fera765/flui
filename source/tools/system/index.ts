/**
 * System Tools - Tools that run in automation sandbox
 * 
 * All these tools execute ONLY within the automation's sandbox environment
 * providing file system access, text manipulation, and execution capabilities
 */

import { Tool } from '../../core/types.js';
import { FindFilesTool } from './FindFilesTool.js';
import { ReadFileTool } from './ReadFileTool.js';
import { ReadFolderTool } from './ReadFolderTool.js';
import { ReadManyFilesTool } from './ReadManyFilesTool.js';
import { WriteFileTool } from './WriteFileTool.js';
import { SearchTextTool } from './SearchTextTool.js';
import { EditTextTool } from './EditTextTool.js';
import { ShellTool } from './ShellTool.js';
import { TaskTool } from './TaskTool.js';
import { WebFetchTool } from './WebFetchTool.js';

/**
 * Register all system tools in the tool registry
 */
export function registerSystemTools(): Partial<Tool>[] {
  return [
    {
      id: 'file-search',
      name: 'File Search',
      description: 'Find files by pattern in directories',
      category: 'system',
      version: '1.0.0',
      params: [
        {
          name: 'path',
          type: 'string',
          description: 'Directory path to search',
          required: true,
        },
        {
          name: 'pattern',
          type: 'string',
          description: 'File pattern (e.g., *.txt, **/*.js)',
          required: true,
        },
        {
          name: 'recursive',
          type: 'boolean',
          description: 'Search recursively in subdirectories',
          required: false,
        },
      ],
      execute: async (args: any) => {
        const tool = new FindFilesTool();
        return await tool.execute(args);
      },
    },
    {
      id: 'file-read',
      name: 'File Read',
      description: 'Read file contents',
      category: 'system',
      version: '1.0.0',
      params: [
        {
          name: 'path',
          type: 'string',
          description: 'File path to read',
          required: true,
        },
        {
          name: 'encoding',
          type: 'string',
          description: 'Encoding (utf-8, binary, base64)',
          required: false,
        },
      ],
      execute: async (args: any) => {
        const tool = new ReadFileTool();
        return await tool.execute(args);
      },
    },
    {
      id: 'folder-list',
      name: 'Folder List',
      description: 'List folder contents with details',
      category: 'system',
      version: '1.0.0',
      params: [
        {
          name: 'path',
          type: 'string',
          description: 'Folder path to list',
          required: true,
        },
        {
          name: 'includeStats',
          type: 'boolean',
          description: 'Include file statistics',
          required: false,
        },
      ],
      execute: async (args: any) => {
        const tool = new ReadFolderTool();
        return await tool.execute(args);
      },
    },
    {
      id: 'files-read-batch',
      name: 'Batch File Read',
      description: 'Read multiple files at once',
      category: 'system',
      version: '1.0.0',
      params: [
        {
          name: 'paths',
          type: 'array',
          description: 'Array of file paths',
          required: true,
        },
        {
          name: 'encoding',
          type: 'string',
          description: 'Encoding for all files',
          required: false,
        },
        {
          name: 'continueOnError',
          type: 'boolean',
          description: 'Continue if some files fail',
          required: false,
        },
      ],
      execute: async (args: any) => {
        const tool = new ReadManyFilesTool();
        return await tool.execute(args);
      },
    },
    {
      id: 'file-write',
      name: 'File Write',
      description: 'Write content to file',
      category: 'system',
      version: '1.0.0',
      params: [
        {
          name: 'path',
          type: 'string',
          description: 'File path to write',
          required: true,
        },
        {
          name: 'content',
          type: 'string',
          description: 'Content to write',
          required: true,
        },
        {
          name: 'createDirs',
          type: 'boolean',
          description: 'Create parent directories',
          required: false,
        },
        {
          name: 'append',
          type: 'boolean',
          description: 'Append instead of overwrite',
          required: false,
        },
      ],
      execute: async (args: any) => {
        const tool = new WriteFileTool();
        return await tool.execute(args);
      },
    },
    {
      id: 'text-search',
      name: 'Text Search',
      description: 'Search for text patterns in files',
      category: 'system',
      version: '1.0.0',
      params: [
        {
          name: 'path',
          type: 'string',
          description: 'File or directory path',
          required: true,
        },
        {
          name: 'pattern',
          type: 'string',
          description: 'Text pattern to search',
          required: true,
        },
        {
          name: 'regex',
          type: 'boolean',
          description: 'Use regex pattern',
          required: false,
        },
        {
          name: 'recursive',
          type: 'boolean',
          description: 'Search in subdirectories',
          required: false,
        },
      ],
      execute: async (args: any) => {
        const tool = new SearchTextTool();
        return await tool.execute(args);
      },
    },
    {
      id: 'text-replace',
      name: 'Text Replace',
      description: 'Find and replace text in files',
      category: 'system',
      version: '1.0.0',
      params: [
        {
          name: 'path',
          type: 'string',
          description: 'File path',
          required: true,
        },
        {
          name: 'find',
          type: 'string',
          description: 'Text to find',
          required: true,
        },
        {
          name: 'replace',
          type: 'string',
          description: 'Replacement text',
          required: true,
        },
        {
          name: 'regex',
          type: 'boolean',
          description: 'Use regex',
          required: false,
        },
        {
          name: 'replaceAll',
          type: 'boolean',
          description: 'Replace all occurrences',
          required: false,
        },
      ],
      execute: async (args: any) => {
        const tool = new EditTextTool();
        return await tool.execute(args);
      },
    },
    {
      id: 'shell-exec',
      name: 'Shell Execute',
      description: 'Execute shell commands in sandbox',
      category: 'system',
      version: '1.0.0',
      params: [
        {
          name: 'command',
          type: 'string',
          description: 'Command to execute',
          required: true,
        },
        {
          name: 'timeout',
          type: 'number',
          description: 'Timeout in milliseconds',
          required: false,
        },
        {
          name: 'env',
          type: 'object',
          description: 'Environment variables',
          required: false,
        },
      ],
      execute: async (args: any) => {
        const tool = new ShellTool();
        return await tool.execute(args);
      },
    },
    {
      id: 'background-task',
      name: 'Background Task',
      description: 'Run and manage background tasks',
      category: 'system',
      version: '1.0.0',
      params: [
        {
          name: 'action',
          type: 'string',
          description: 'Action: start, status, cancel, list',
          required: false,
        },
        {
          name: 'command',
          type: 'string',
          description: 'Command to run',
          required: false,
        },
        {
          name: 'taskId',
          type: 'string',
          description: 'Task ID for status/cancel',
          required: false,
        },
      ],
      execute: async (args: any) => {
        const tool = new TaskTool();
        return await tool.execute(args);
      },
    },
    {
      id: 'http-request',
      name: 'HTTP Request',
      description: 'Make HTTP requests to external APIs',
      category: 'system',
      version: '1.0.0',
      params: [
        {
          name: 'url',
          type: 'string',
          description: 'URL to fetch',
          required: true,
        },
        {
          name: 'method',
          type: 'string',
          description: 'HTTP method (GET, POST, etc.)',
          required: false,
        },
        {
          name: 'headers',
          type: 'object',
          description: 'HTTP headers',
          required: false,
        },
        {
          name: 'body',
          type: 'object',
          description: 'Request body',
          required: false,
        },
      ],
      execute: async (args: any) => {
        const tool = new WebFetchTool();
        return await tool.execute(args);
      },
    },
  ];
}
