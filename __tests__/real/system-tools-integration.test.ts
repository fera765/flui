/**
 * REAL Integration Tests for System Tools
 * NO MOCKS, NO SIMULATION - Real file operations and execution
 */

import { mkdir, writeFile, rm, readFile } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { randomBytes } from 'crypto';
import { registerSystemTools } from '../../source/tools/system/index.js';

// Helper to generate unique IDs
const generateId = () => randomBytes(8).toString('hex');

describe('System Tools - REAL Integration', () => {
  let testDir: string;
  let systemTools: any[];

  beforeAll(() => {
    // Register all system tools
    systemTools = registerSystemTools();
  });

  beforeEach(async () => {
    testDir = join(tmpdir(), `flui-real-test-${generateId()}`);
    await mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  describe('file-write tool - REAL execution', () => {
    it('should write file and verify content on disk', async () => {
      const fileWriteTool = systemTools.find(t => t.id === 'file-write');
      expect(fileWriteTool).toBeTruthy();

      const testFile = join(testDir, 'test.txt');
      const content = 'Hello from REAL test';

      // Execute tool
      const result = await fileWriteTool.execute({
        path: testFile,
        content,
      });

      expect(result.success).toBe(true);
      expect(result.path).toBe(testFile);

      // REAL verification - read from disk
      const actualContent = await readFile(testFile, 'utf-8');
      expect(actualContent).toBe(content);
    });

    it('should create nested directories when createDirs is true', async () => {
      const fileWriteTool = systemTools.find(t => t.id === 'file-write');
      const nestedFile = join(testDir, 'a', 'b', 'c', 'file.txt');

      const result = await fileWriteTool.execute({
        path: nestedFile,
        content: 'nested content',
        createDirs: true,
      });

      expect(result.success).toBe(true);

      // REAL verification
      const content = await readFile(nestedFile, 'utf-8');
      expect(content).toBe('nested content');
    });
  });

  describe('file-read tool - REAL execution', () => {
    it('should read actual file from disk', async () => {
      const testFile = join(testDir, 'read-test.txt');
      const expectedContent = 'Content to read';
      await writeFile(testFile, expectedContent);

      const fileReadTool = systemTools.find(t => t.id === 'file-read');
      const result = await fileReadTool.execute({ path: testFile });

      expect(result.success).toBe(true);
      expect(result.content).toBe(expectedContent);
    });

    it('should read binary file as base64', async () => {
      const testFile = join(testDir, 'binary.bin');
      const buffer = Buffer.from([0x00, 0x01, 0x02, 0xFF]);
      await writeFile(testFile, buffer);

      const fileReadTool = systemTools.find(t => t.id === 'file-read');
      const result = await fileReadTool.execute({
        path: testFile,
        encoding: 'binary',
      });

      expect(result.success).toBe(true);
      expect(result.content).toBeTruthy();
      
      // Verify it's base64
      const decoded = Buffer.from(result.content!, 'base64');
      expect(decoded).toEqual(buffer);
    });
  });

  describe('file-search tool - REAL execution', () => {
    it('should find files matching pattern in real directory', async () => {
      // Create real files
      await writeFile(join(testDir, 'file1.txt'), 'content1');
      await writeFile(join(testDir, 'file2.txt'), 'content2');
      await writeFile(join(testDir, 'other.md'), 'markdown');

      const fileSearchTool = systemTools.find(t => t.id === 'file-search');
      const result = await fileSearchTool.execute({
        path: testDir,
        pattern: '*.txt',
      });

      expect(result.success).toBe(true);
      expect(result.files).toHaveLength(2);
      expect(result.files.some((f: string) => f.includes('file1.txt'))).toBe(true);
      expect(result.files.some((f: string) => f.includes('file2.txt'))).toBe(true);
    });

    it('should find files recursively in nested directories', async () => {
      await mkdir(join(testDir, 'subdir'), { recursive: true });
      await writeFile(join(testDir, 'root.txt'), 'root');
      await writeFile(join(testDir, 'subdir', 'nested.txt'), 'nested');

      const fileSearchTool = systemTools.find(t => t.id === 'file-search');
      const result = await fileSearchTool.execute({
        path: testDir,
        pattern: '**/*.txt',
        recursive: true,
      });

      expect(result.success).toBe(true);
      expect(result.files).toHaveLength(2);
    });
  });

  describe('text-search tool - REAL execution', () => {
    it('should search text in real file', async () => {
      const testFile = join(testDir, 'search.txt');
      await writeFile(testFile, 'Line 1: Hello World\nLine 2: Testing\nLine 3: Hello again');

      const textSearchTool = systemTools.find(t => t.id === 'text-search');
      const result = await textSearchTool.execute({
        path: testFile,
        pattern: 'Hello',
      });

      expect(result.success).toBe(true);
      expect(result.matches).toHaveLength(2);
      expect(result.matches![0].line).toContain('Hello World');
      expect(result.matches![1].line).toContain('Hello again');
    });

    it('should search with regex pattern', async () => {
      const testFile = join(testDir, 'email.txt');
      await writeFile(testFile, 'Contact: john@example.com\nSupport: help@test.com');

      const textSearchTool = systemTools.find(t => t.id === 'text-search');
      const result = await textSearchTool.execute({
        path: testFile,
        pattern: '\\w+@\\w+\\.com',
        regex: true,
      });

      expect(result.success).toBe(true);
      expect(result.matches).toHaveLength(2);
    });
  });

  describe('text-replace tool - REAL execution', () => {
    it('should replace text in real file', async () => {
      const testFile = join(testDir, 'replace.txt');
      await writeFile(testFile, 'Hello World');

      const textReplaceTool = systemTools.find(t => t.id === 'text-replace');
      const result = await textReplaceTool.execute({
        path: testFile,
        find: 'World',
        replace: 'Universe',
      });

      expect(result.success).toBe(true);
      expect(result.replacements).toBe(1);

      // REAL verification
      const content = await readFile(testFile, 'utf-8');
      expect(content).toBe('Hello Universe');
    });

    it('should replace all occurrences', async () => {
      const testFile = join(testDir, 'replace-all.txt');
      await writeFile(testFile, 'foo bar foo baz foo');

      const textReplaceTool = systemTools.find(t => t.id === 'text-replace');
      const result = await textReplaceTool.execute({
        path: testFile,
        find: 'foo',
        replace: 'XXX',
        replaceAll: true,
      });

      expect(result.success).toBe(true);
      expect(result.replacements).toBe(3);

      const content = await readFile(testFile, 'utf-8');
      expect(content).toBe('XXX bar XXX baz XXX');
    });
  });

  describe('shell-exec tool - REAL execution', () => {
    it('should execute real shell command', async () => {
      const shellTool = systemTools.find(t => t.id === 'shell-exec');
      const result = await shellTool.execute({
        command: 'echo "Hello from shell"',
      });

      expect(result.success).toBe(true);
      expect(result.stdout).toContain('Hello from shell');
      expect(result.exitCode).toBe(0);
    });

    it('should handle command with environment variables', async () => {
      const shellTool = systemTools.find(t => t.id === 'shell-exec');
      const result = await shellTool.execute({
        command: 'echo $TEST_VAR',
        env: { TEST_VAR: 'test_value' },
      });

      expect(result.success).toBe(true);
      expect(result.stdout).toContain('test_value');
    });

    it('should respect timeout', async () => {
      const shellTool = systemTools.find(t => t.id === 'shell-exec');
      const result = await shellTool.execute({
        command: 'sleep 5',
        timeout: 1000,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
    });
  });

  describe('http-request tool - REAL execution', () => {
    it('should make real HTTP request', async () => {
      const httpTool = systemTools.find(t => t.id === 'http-request');
      const result = await httpTool.execute({
        url: 'https://jsonplaceholder.typicode.com/posts/1',
      });

      expect(result.success).toBe(true);
      expect(result.status).toBe(200);
      expect(result.data).toBeTruthy();
      expect(result.data.id).toBe(1);
      expect(result.data.userId).toBeTruthy();
    });

    it('should make POST request with body', async () => {
      const httpTool = systemTools.find(t => t.id === 'http-request');
      const result = await httpTool.execute({
        url: 'https://jsonplaceholder.typicode.com/posts',
        method: 'POST',
        body: {
          title: 'Test Post',
          body: 'Test content',
          userId: 1,
        },
      });

      expect(result.success).toBe(true);
      expect(result.status).toBe(201);
      expect(result.data.title).toBe('Test Post');
    });
  });

  describe('folder-list tool - REAL execution', () => {
    it('should list real directory contents', async () => {
      await writeFile(join(testDir, 'file1.txt'), 'content');
      await writeFile(join(testDir, 'file2.txt'), 'content');
      await mkdir(join(testDir, 'subdir'));

      const folderListTool = systemTools.find(t => t.id === 'folder-list');
      const result = await folderListTool.execute({ path: testDir });

      expect(result.success).toBe(true);
      expect(result.entries).toHaveLength(3);
      expect(result.files).toHaveLength(2);
      expect(result.directories).toHaveLength(1);
    });

    it('should include file stats when requested', async () => {
      await writeFile(join(testDir, 'test.txt'), 'content');

      const folderListTool = systemTools.find(t => t.id === 'folder-list');
      const result = await folderListTool.execute({
        path: testDir,
        includeStats: true,
      });

      expect(result.success).toBe(true);
      expect(result.entries![0].stats).toBeTruthy();
      expect(result.entries![0].stats!.size).toBeGreaterThan(0);
    });
  });

  describe('files-read-batch tool - REAL execution', () => {
    it('should read multiple files in parallel', async () => {
      const file1 = join(testDir, 'file1.txt');
      const file2 = join(testDir, 'file2.txt');
      await writeFile(file1, 'content1');
      await writeFile(file2, 'content2');

      const batchReadTool = systemTools.find(t => t.id === 'files-read-batch');
      const result = await batchReadTool.execute({
        paths: [file1, file2],
      });

      expect(result.success).toBe(true);
      expect(result.files).toHaveLength(2);
      expect(result.files![0].content).toBe('content1');
      expect(result.files![1].content).toBe('content2');
      expect(result.successCount).toBe(2);
    });

    it('should handle missing files with continueOnError', async () => {
      const file1 = join(testDir, 'exists.txt');
      const file2 = join(testDir, 'missing.txt');
      await writeFile(file1, 'content');

      const batchReadTool = systemTools.find(t => t.id === 'files-read-batch');
      const result = await batchReadTool.execute({
        paths: [file1, file2],
        continueOnError: true,
      });

      expect(result.success).toBe(true);
      expect(result.files).toHaveLength(2);
      expect(result.files![0].success).toBe(true);
      expect(result.files![1].success).toBe(false);
      expect(result.successCount).toBe(1);
      expect(result.errorCount).toBe(1);
    });
  });
});
