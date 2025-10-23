/**
 * REAL API Integration Tests for MCP Import
 * Testing MCP import integration with store
 */

import { join } from 'path';
import { tmpdir } from 'os';
import { randomBytes } from 'crypto';
import { rm } from 'fs/promises';
import { useStore } from '../../source/store/store.js';

const generateId = () => randomBytes(8).toString('hex');

describe('MCP Import Store Integration - REAL', () => {
  let cacheDir: string;

  beforeEach(async () => {
    cacheDir = join(tmpdir(), `flui-mcp-store-test-${generateId()}`);
    // Reset store
    useStore.setState({ mcps: [], agents: [] });
  });

  afterEach(async () => {
    await rm(cacheDir, { recursive: true, force: true });
  });

  describe('NPM Import to Store', () => {
    it('should import npm package and save to store', async () => {
      const { MCPImporter } = await import('../../source/services/MCPImporter.js');
      const importer = new MCPImporter(cacheDir);

      const result = await importer.importFromNPM({
        package: 'chalk',
        version: '4.1.2',
      });

      expect(result.success).toBe(true);
      expect(result.mcp).toBeTruthy();

      // Save to store
      const store = useStore.getState();
      store.createMCP(result.mcp!);

      // Verify in store
      const mcps = store.mcps;
      expect(mcps).toHaveLength(1);
      expect(mcps[0].name).toBe('chalk');
      expect(mcps[0].installType).toBe('npm');
    }, 180000);

    it('should import multiple packages to store', async () => {
      const { MCPImporter } = await import('../../source/services/MCPImporter.js');
      const importer = new MCPImporter(cacheDir);

      const result1 = await importer.importFromNPM({
        package: 'lodash',
        version: '4.17.21',
      });

      const result2 = await importer.importFromNPM({
        package: 'axios',
        version: '1.6.0',
      });

      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);

      const store = useStore.getState();
      store.createMCP(result1.mcp!);
      store.createMCP(result2.mcp!);

      expect(store.mcps).toHaveLength(2);
      expect(store.mcps.map(m => m.name)).toContain('lodash');
      expect(store.mcps.map(m => m.name)).toContain('axios');
    }, 360000);
  });

  describe('GitHub Import to Store', () => {
    it('should import GitHub repo and save to store', async () => {
      const { MCPImporter } = await import('../../source/services/MCPImporter.js');
      const importer = new MCPImporter(cacheDir);

      const result = await importer.importFromGitHub({
        repo: 'octocat/Hello-World',
        ref: 'master',
      });

      expect(result.success).toBe(true);

      const store = useStore.getState();
      store.createMCP(result.mcp!);

      expect(store.mcps).toHaveLength(1);
      expect(store.mcps[0].installType).toBe('github');
    }, 120000);
  });

  describe('URL Import to Store', () => {
    it('should import URL endpoint and save to store', async () => {
      const { MCPImporter } = await import('../../source/services/MCPImporter.js');
      const importer = new MCPImporter(cacheDir);

      const result = await importer.importFromURL({
        endpoint: 'https://jsonplaceholder.typicode.com',
      });

      expect(result.success).toBe(true);

      const store = useStore.getState();
      store.createMCP(result.mcp!);

      expect(store.mcps).toHaveLength(1);
      expect(store.mcps[0].installType).toBe('url');
      expect(store.mcps[0].server).toBe('https://jsonplaceholder.typicode.com');
    }, 30000);
  });

  describe('MCP Management in Store', () => {
    it('should retrieve imported MCP by ID', async () => {
      const { MCPImporter } = await import('../../source/services/MCPImporter.js');
      const importer = new MCPImporter(cacheDir);

      const result = await importer.importFromNPM({
        package: 'uuid',
        version: '9.0.0',
      });

      const store = useStore.getState();
      store.createMCP(result.mcp!);

      const mcpId = result.mcp!.id;
      const foundMcp = store.mcps.find(m => m.id === mcpId);

      expect(foundMcp).toBeTruthy();
      expect(foundMcp?.name).toBe('uuid');
    }, 180000);

    it('should list all imported MCPs', async () => {
      const { MCPImporter } = await import('../../source/services/MCPImporter.js');
      const importer = new MCPImporter(cacheDir);

      const result1 = await importer.importFromNPM({ package: 'chalk', version: '4.1.2' });
      const result2 = await importer.importFromURL({ endpoint: 'https://jsonplaceholder.typicode.com' });

      const store = useStore.getState();
      store.createMCP(result1.mcp!);
      store.createMCP(result2.mcp!);

      const allMcps = store.mcps;
      expect(allMcps).toHaveLength(2);
      expect(allMcps.some(m => m.installType === 'npm')).toBe(true);
      expect(allMcps.some(m => m.installType === 'url')).toBe(true);
    }, 180000);
  });
});
