/**
 * SearchText Tool - Search for text patterns in files
 * Executes only in automation sandbox
 */

import { readFile, readdir, stat } from 'fs/promises';
import { join } from 'path';

export interface SearchTextParams {
  path: string;
  pattern: string;
  regex?: boolean;
  caseInsensitive?: boolean;
  recursive?: boolean;
  maxResults?: number;
}

export interface TextMatch {
  file: string;
  line: string;
  lineNumber: number;
  match: string;
}

export interface SearchTextResult {
  success: boolean;
  matches?: TextMatch[];
  totalMatches?: number;
  filesSearched?: number;
  error?: string;
}

export class SearchTextTool {
  async execute(params: SearchTextParams): Promise<SearchTextResult> {
    try {
      const matches: TextMatch[] = [];
      const maxResults = params.maxResults || 1000;
      
      const pathStat = await stat(params.path);
      let filesSearched = 0;

      if (pathStat.isDirectory()) {
        await this.searchInDirectory(
          params.path,
          params.pattern,
          params.regex || false,
          params.caseInsensitive || false,
          params.recursive || false,
          matches,
          maxResults,
          () => filesSearched++
        );
      } else {
        await this.searchInFile(
          params.path,
          params.pattern,
          params.regex || false,
          params.caseInsensitive || false,
          matches,
          maxResults
        );
        filesSearched = 1;
      }

      return {
        success: true,
        matches,
        totalMatches: matches.length,
        filesSearched,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  private async searchInDirectory(
    dir: string,
    pattern: string,
    regex: boolean,
    caseInsensitive: boolean,
    recursive: boolean,
    matches: TextMatch[],
    maxResults: number,
    onFileSearched: () => void
  ): Promise<void> {
    if (matches.length >= maxResults) return;

    const entries = await readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);

      if (entry.isDirectory() && recursive) {
        await this.searchInDirectory(
          fullPath,
          pattern,
          regex,
          caseInsensitive,
          recursive,
          matches,
          maxResults,
          onFileSearched
        );
      } else if (entry.isFile()) {
        await this.searchInFile(
          fullPath,
          pattern,
          regex,
          caseInsensitive,
          matches,
          maxResults
        );
        onFileSearched();
      }

      if (matches.length >= maxResults) break;
    }
  }

  private async searchInFile(
    file: string,
    pattern: string,
    regex: boolean,
    caseInsensitive: boolean,
    matches: TextMatch[],
    maxResults: number
  ): Promise<void> {
    try {
      const content = await readFile(file, 'utf-8');
      const lines = content.split('\n');

      let searchPattern: RegExp;
      
      if (regex) {
        const flags = caseInsensitive ? 'gi' : 'g';
        searchPattern = new RegExp(pattern, flags);
      } else {
        const escapedPattern = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const flags = caseInsensitive ? 'gi' : 'g';
        searchPattern = new RegExp(escapedPattern, flags);
      }

      for (let i = 0; i < lines.length && matches.length < maxResults; i++) {
        const line = lines[i];
        const match = line.match(searchPattern);
        
        if (match) {
          matches.push({
            file,
            line,
            lineNumber: i + 1,
            match: match[0],
          });
        }
      }
    } catch (error) {
      // Skip files that can't be read
    }
  }
}
