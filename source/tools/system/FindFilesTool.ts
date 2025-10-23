/**
 * FindFiles Tool - Search for files by pattern
 * Executes only in automation sandbox
 */

import { readdir } from 'fs/promises';
import { join, basename } from 'path';
import { minimatch } from 'minimatch';

export interface FindFilesParams {
  path: string;
  pattern: string;
  recursive?: boolean;
  maxDepth?: number;
}

export interface FindFilesResult {
  success: boolean;
  files: string[];
  error?: string;
  totalFound?: number;
}

export class FindFilesTool {
  async execute(params: FindFilesParams): Promise<FindFilesResult> {
    try {
      const files = await this.findFiles(
        params.path,
        params.pattern,
        params.recursive,
        params.maxDepth || 10,
        0
      );

      return {
        success: true,
        files,
        totalFound: files.length,
      };
    } catch (error: any) {
      return {
        success: false,
        files: [],
        error: error.message,
      };
    }
  }

  private async findFiles(
    dir: string,
    pattern: string,
    recursive: boolean = false,
    maxDepth: number,
    currentDepth: number
  ): Promise<string[]> {
    if (currentDepth > maxDepth) {
      return [];
    }

    const entries = await readdir(dir, { withFileTypes: true });
    const files: string[] = [];

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);

      if (entry.isDirectory() && recursive) {
        const nestedFiles = await this.findFiles(
          fullPath,
          pattern,
          recursive,
          maxDepth,
          currentDepth + 1
        );
        files.push(...nestedFiles);
      } else if (entry.isFile()) {
        // Match pattern
        if (this.matchPattern(entry.name, pattern) || 
            this.matchPattern(fullPath, pattern)) {
          files.push(fullPath);
        }
      }
    }

    return files;
  }

  private matchPattern(filename: string, pattern: string): boolean {
    return minimatch(filename, pattern, { nocase: true });
  }
}
