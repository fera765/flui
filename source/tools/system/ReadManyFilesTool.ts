/**
 * ReadManyFiles Tool - Read multiple files at once
 * Executes only in automation sandbox
 */

import { readFile } from 'fs/promises';

export interface ReadManyFilesParams {
  paths: string[];
  encoding?: 'utf-8' | 'binary' | 'base64';
  continueOnError?: boolean;
}

export interface FileReadResult {
  path: string;
  success: boolean;
  content?: string;
  error?: string;
  size?: number;
}

export interface ReadManyFilesResult {
  success: boolean;
  files: FileReadResult[];
  successCount?: number;
  errorCount?: number;
  error?: string;
}

export class ReadManyFilesTool {
  async execute(params: ReadManyFilesParams): Promise<ReadManyFilesResult> {
    const encoding = params.encoding || 'utf-8';
    const files: FileReadResult[] = [];
    let successCount = 0;
    let errorCount = 0;

    for (const path of params.paths) {
      try {
        let content: string;
        
        if (encoding === 'binary' || encoding === 'base64') {
          const buffer = await readFile(path);
          content = buffer.toString('base64');
        } else {
          content = await readFile(path, 'utf-8');
        }

        files.push({
          path,
          success: true,
          content,
          size: content.length,
        });
        
        successCount++;
      } catch (error: any) {
        errorCount++;
        
        if (params.continueOnError) {
          files.push({
            path,
            success: false,
            error: error.message,
          });
        } else {
          return {
            success: false,
            files,
            error: `Failed to read ${path}: ${error.message}`,
          };
        }
      }
    }

    return {
      success: true,
      files,
      successCount,
      errorCount,
    };
  }
}
