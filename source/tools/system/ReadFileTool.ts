/**
 * ReadFile Tool - Read file contents
 * Executes only in automation sandbox
 */

import { readFile } from 'fs/promises';

export interface ReadFileParams {
  path: string;
  encoding?: 'utf-8' | 'binary' | 'base64';
}

export interface ReadFileResult {
  success: boolean;
  content?: string;
  encoding?: string;
  size?: number;
  error?: string;
}

export class ReadFileTool {
  async execute(params: ReadFileParams): Promise<ReadFileResult> {
    try {
      const encoding = params.encoding || 'utf-8';
      
      let content: string;
      
      if (encoding === 'binary') {
        const buffer = await readFile(params.path);
        content = buffer.toString('base64');
      } else if (encoding === 'base64') {
        const buffer = await readFile(params.path);
        content = buffer.toString('base64');
      } else {
        content = await readFile(params.path, 'utf-8');
      }

      return {
        success: true,
        content,
        encoding,
        size: content.length,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }
}
