/**
 * WriteFile Tool - Write content to file
 * Executes only in automation sandbox
 */

import { writeFile, mkdir } from 'fs/promises';
import { dirname } from 'path';

export interface WriteFileParams {
  path: string;
  content: string;
  encoding?: 'utf-8' | 'binary' | 'base64';
  createDirs?: boolean;
  append?: boolean;
}

export interface WriteFileResult {
  success: boolean;
  path?: string;
  size?: number;
  error?: string;
}

export class WriteFileTool {
  async execute(params: WriteFileParams): Promise<WriteFileResult> {
    try {
      const encoding = params.encoding || 'utf-8';
      
      // Create parent directories if requested
      if (params.createDirs) {
        const dir = dirname(params.path);
        await mkdir(dir, { recursive: true });
      }

      // Prepare content
      let buffer: Buffer | string;
      
      if (encoding === 'base64') {
        buffer = Buffer.from(params.content, 'base64');
      } else if (encoding === 'binary') {
        buffer = Buffer.from(params.content, 'binary');
      } else {
        buffer = params.content;
      }

      // Write file
      if (params.append) {
        const fs = await import('fs/promises');
        await fs.appendFile(params.path, buffer);
      } else {
        await writeFile(params.path, buffer);
      }

      return {
        success: true,
        path: params.path,
        size: buffer.length,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }
}
