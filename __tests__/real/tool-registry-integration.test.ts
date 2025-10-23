/**
 * REAL Integration Tests for Tool Registry
 * Testing that System Tools are registered and executable
 */

import { mkdir, writeFile, rm } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { randomBytes } from 'crypto';
import { getToolRegistry } from '../../source/core/toolRegistry.js';
import { registerAllTools } from '../../source/tools/registerAllTools.js';

const generateId = () => randomBytes(8).toString('hex');

describe('Tool Registry Integration - REAL', () => {
  let testDir: string;

  beforeAll(async () => {
    // Register all tools including system tools
    await registerAllTools();
  });

  beforeEach(async () => {
    testDir = join(tmpdir(), `flui-registry-test-${generateId()}`);
    await mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  describe('System Tools Registration', () => {
    it('should have file-write tool registered', () => {
      const registry = getToolRegistry();
      const fileWriteTool = registry.getTool('file-write');

      expect(fileWriteTool).toBeTruthy();
      expect(fileWriteTool?.id).toBe('file-write');
      expect(fileWriteTool?.name).toBe('File Write');
      expect(fileWriteTool?.category).toBe('system');
    });

    it('should have all 10 system tools registered', () => {
      const registry = getToolRegistry();
      const systemToolIds = [
        'file-search',
        'file-read',
        'folder-list',
        'files-read-batch',
        'file-write',
        'text-search',
        'text-replace',
        'shell-exec',
        'background-task',
        'http-request',
      ];

      systemToolIds.forEach(toolId => {
        const tool = registry.getTool(toolId);
        expect(tool).toBeTruthy();
        expect(tool?.category).toBe('system');
      });
    });

    it('should list system tools in getAllTools', () => {
      const registry = getToolRegistry();
      const allTools = registry.getAllTools();
      
      const systemTools = allTools.filter(t => t.category === 'system');
      expect(systemTools.length).toBeGreaterThanOrEqual(10);
    });
  });

  describe('Tool Execution via Registry', () => {
    it('should execute file-write tool through registry', async () => {
      const registry = getToolRegistry();
      const fileWriteTool = registry.getTool('file-write');

      expect(fileWriteTool).toBeTruthy();
      expect(fileWriteTool?.execute).toBeTruthy();

      const testFile = join(testDir, 'registry-test.txt');
      const result = await fileWriteTool!.execute({
        path: testFile,
        content: 'Written via registry',
      });

      expect(result.success).toBe(true);

      // Verify file exists
      const fs = await import('fs/promises');
      const content = await fs.readFile(testFile, 'utf-8');
      expect(content).toBe('Written via registry');
    });

    it('should execute file-read tool through registry', async () => {
      const testFile = join(testDir, 'read-via-registry.txt');
      await writeFile(testFile, 'Content to read');

      const registry = getToolRegistry();
      const fileReadTool = registry.getTool('file-read');

      const result = await fileReadTool!.execute({ path: testFile });

      expect(result.success).toBe(true);
      expect(result.content).toBe('Content to read');
    });

    it('should execute shell-exec tool through registry', async () => {
      const registry = getToolRegistry();
      const shellTool = registry.getTool('shell-exec');

      const result = await shellTool!.execute({
        command: 'echo "Registry test"',
      });

      expect(result.success).toBe(true);
      expect(result.stdout).toContain('Registry test');
    });

    it('should execute http-request tool through registry', async () => {
      const registry = getToolRegistry();
      const httpTool = registry.getTool('http-request');

      const result = await httpTool!.execute({
        url: 'https://jsonplaceholder.typicode.com/posts/1',
      });

      expect(result.success).toBe(true);
      expect(result.status).toBe(200);
      expect(result.data).toBeTruthy();
    });

    it('should execute text-search tool through registry', async () => {
      const testFile = join(testDir, 'search-test.txt');
      await writeFile(testFile, 'Find this text\nAnd this line\nFind again');

      const registry = getToolRegistry();
      const searchTool = registry.getTool('text-search');

      const result = await searchTool!.execute({
        path: testFile,
        pattern: 'Find',
      });

      expect(result.success).toBe(true);
      expect(result.matches).toHaveLength(2);
    });
  });

  describe('Tool Categories', () => {
    it('should categorize system tools correctly', () => {
      const registry = getToolRegistry();
      const systemTools = registry.getToolsByCategory('system');

      expect(systemTools.length).toBeGreaterThanOrEqual(10);
      systemTools.forEach(tool => {
        expect(tool.category).toBe('system');
      });
    });
  });

  describe('Tool Validation', () => {
    it('should validate tool parameters', () => {
      const registry = getToolRegistry();
      const fileWriteTool = registry.getTool('file-write');

      expect(fileWriteTool?.params).toBeTruthy();
      expect(Array.isArray(fileWriteTool?.params)).toBe(true);

      // Check required parameters
      const pathParam = fileWriteTool?.params.find((p: any) => p.name === 'path');
      expect(pathParam).toBeTruthy();
      expect(pathParam?.required).toBe(true);

      const contentParam = fileWriteTool?.params.find((p: any) => p.name === 'content');
      expect(contentParam).toBeTruthy();
      expect(contentParam?.required).toBe(true);
    });
  });
});
