/**
 * ReadFolder Tool - List folder contents
 * Executes only in automation sandbox
 */

import { readdir, stat } from 'fs/promises';
import { join } from 'path';

export interface ReadFolderParams {
  path: string;
  includeStats?: boolean;
}

export interface FolderEntry {
  name: string;
  path: string;
  type: 'file' | 'directory' | 'symlink' | 'other';
  stats?: {
    size: number;
    created: string;
    modified: string;
    accessed: string;
  };
}

export interface ReadFolderResult {
  success: boolean;
  entries?: FolderEntry[];
  files?: string[];
  directories?: string[];
  error?: string;
}

export class ReadFolderTool {
  async execute(params: ReadFolderParams): Promise<ReadFolderResult> {
    try {
      const entries = await readdir(params.path, { withFileTypes: true });
      const result: FolderEntry[] = [];
      const files: string[] = [];
      const directories: string[] = [];

      for (const entry of entries) {
        const fullPath = join(params.path, entry.name);
        
        let type: FolderEntry['type'] = 'other';
        if (entry.isFile()) type = 'file';
        else if (entry.isDirectory()) type = 'directory';
        else if (entry.isSymbolicLink()) type = 'symlink';

        const folderEntry: FolderEntry = {
          name: entry.name,
          path: fullPath,
          type,
        };

        // Include stats if requested
        if (params.includeStats) {
          const stats = await stat(fullPath);
          folderEntry.stats = {
            size: stats.size,
            created: stats.birthtime.toISOString(),
            modified: stats.mtime.toISOString(),
            accessed: stats.atime.toISOString(),
          };
        }

        result.push(folderEntry);

        if (type === 'file') files.push(entry.name);
        if (type === 'directory') directories.push(entry.name);
      }

      return {
        success: true,
        entries: result,
        files,
        directories,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }
}
