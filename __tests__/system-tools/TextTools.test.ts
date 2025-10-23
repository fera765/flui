/**
 * TDD Tests for Text Tools
 * Testing: SearchText, EditText
 */

import { mkdir, writeFile, rm } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { randomBytes } from 'crypto';

const generateId = () => randomBytes(8).toString('hex');

describe('Text Tools - TDD', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = join(tmpdir(), `flui-test-${generateId()}`);
    await mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  describe('SearchText Tool', () => {
    it('should search for text pattern in file', async () => {
      const testFile = join(testDir, 'test.txt');
      await writeFile(testFile, `
        Line 1: Hello World
        Line 2: Testing search
        Line 3: Hello again
      `);

      const { SearchTextTool } = await import('../../source/tools/system/SearchTextTool.js');
      const tool = new SearchTextTool();

      const result = await tool.execute({
        path: testFile,
        pattern: 'Hello',
      });

      expect(result.success).toBe(true);
      expect(result.matches).toBeDefined();
      expect(result.matches).toHaveLength(2);
      if (result.matches) {
        expect(result.matches[0].line).toContain('Hello World');
        expect(result.matches[1].line).toContain('Hello again');
      }
    });

    it('should search with regex pattern', async () => {
      const testFile = join(testDir, 'test.txt');
      await writeFile(testFile, 'Email: test@example.com\nEmail: user@test.com');

      const { SearchTextTool } = await import('../../source/tools/system/SearchTextTool.js');
      const tool = new SearchTextTool();

      const result = await tool.execute({
        path: testFile,
        pattern: '\\w+@\\w+\\.com',
        regex: true,
      });

      expect(result.success).toBe(true);
      expect(result.matches).toBeDefined();
      expect(result.matches).toHaveLength(2);
    });

    it('should search in multiple files', async () => {
      await writeFile(join(testDir, 'file1.txt'), 'Hello from file 1');
      await writeFile(join(testDir, 'file2.txt'), 'Hello from file 2');

      const { SearchTextTool } = await import('../../source/tools/system/SearchTextTool.js');
      const tool = new SearchTextTool();

      const result = await tool.execute({
        path: testDir,
        pattern: 'Hello',
        recursive: true,
      });

      expect(result.success).toBe(true);
      expect(result.totalMatches).toBeGreaterThanOrEqual(2);
    });
  });

  describe('EditText Tool', () => {
    it('should replace text in file', async () => {
      const testFile = join(testDir, 'test.txt');
      await writeFile(testFile, 'Hello World');

      const { EditTextTool } = await import('../../source/tools/system/EditTextTool.js');
      const tool = new EditTextTool();

      const result = await tool.execute({
        path: testFile,
        find: 'World',
        replace: 'Universe',
      });

      expect(result.success).toBe(true);
      expect(result.replacements).toBe(1);

      const fs = await import('fs/promises');
      const content = await fs.readFile(testFile, 'utf-8');
      expect(content).toBe('Hello Universe');
    });

    it('should replace all occurrences', async () => {
      const testFile = join(testDir, 'test.txt');
      await writeFile(testFile, 'Hello Hello Hello');

      const { EditTextTool } = await import('../../source/tools/system/EditTextTool.js');
      const tool = new EditTextTool();

      const result = await tool.execute({
        path: testFile,
        find: 'Hello',
        replace: 'Hi',
        replaceAll: true,
      });

      expect(result.success).toBe(true);
      expect(result.replacements).toBe(3);

      const fs = await import('fs/promises');
      const content = await fs.readFile(testFile, 'utf-8');
      expect(content).toBe('Hi Hi Hi');
    });

    it('should use regex for replacement', async () => {
      const testFile = join(testDir, 'test.txt');
      await writeFile(testFile, 'Price: $100, Cost: $200');

      const { EditTextTool } = await import('../../source/tools/system/EditTextTool.js');
      const tool = new EditTextTool();

      const result = await tool.execute({
        path: testFile,
        find: '\\$\\d+',
        replace: '€PRICE',
        regex: true,
        replaceAll: true,
      });

      expect(result.success).toBe(true);
      expect(result.replacements).toBe(2);

      const fs = await import('fs/promises');
      const content = await fs.readFile(testFile, 'utf-8');
      expect(content).toBe('Price: €PRICE, Cost: €PRICE');
    });
  });
});
