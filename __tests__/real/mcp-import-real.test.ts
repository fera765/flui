/**
 * REAL Tests for MCP Import
 * Testing actual package installation, cloning, and HTTP connections
 */

import { rm } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { randomBytes } from 'crypto';

const generateId = () => randomBytes(8).toString('hex');

describe('MCP Import - REAL', () => {
  let cacheDir: string;

  beforeEach(async () => {
    cacheDir = join(tmpdir(), `flui-mcp-cache-${generateId()}`);
  });

  afterEach(async () => {
    await rm(cacheDir, { recursive: true, force: true });
  });

  describe('NPM Import - REAL', () => {
    it('should install real npm package and discover structure', async () => {
      const { MCPImporter } = await import('../../source/services/MCPImporter.js');
      const importer = new MCPImporter(cacheDir);

      // Use a small, real package for testing
      const result = await importer.importFromNPM({
        package: 'chalk',
        version: '4.1.2', // Specific version for consistency
      });

      expect(result.success).toBe(true);
      expect(result.mcp).toBeTruthy();
      expect(result.mcp?.id).toBeTruthy();
      expect(result.mcp?.name).toBe('chalk');
      expect(result.mcp?.version).toBe('4.1.2');
      expect(result.mcp?.installType).toBe('npm');
      expect(result.mcp?.metadata?.installDir).toBeTruthy();
    }, 180000); // 3 minutes timeout for npm install

    it('should handle package installation errors', async () => {
      const { MCPImporter } = await import('../../source/services/MCPImporter.js');
      const importer = new MCPImporter(cacheDir);

      const result = await importer.importFromNPM({
        package: 'this-package-absolutely-does-not-exist-xyz123',
        version: 'latest',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
      expect(result.error).toContain('Failed to import from NPM');
    }, 60000);
  });

  describe('GitHub Import - REAL', () => {
    it('should clone real public repository', async () => {
      const { MCPImporter } = await import('../../source/services/MCPImporter.js');
      const importer = new MCPImporter(cacheDir);

      // Use a small public repo for testing
      const result = await importer.importFromGitHub({
        repo: 'octocat/Hello-World',
        ref: 'master',
      });

      expect(result.success).toBe(true);
      expect(result.mcp).toBeTruthy();
      expect(result.mcp?.name).toContain('Hello-World');
      expect(result.mcp?.installType).toBe('github');
      expect(result.mcp?.version).toBe('master');
    }, 120000); // 2 minutes for git clone

    it('should handle clone errors for invalid repos', async () => {
      const { MCPImporter } = await import('../../source/services/MCPImporter.js');
      const importer = new MCPImporter(cacheDir);

      const result = await importer.importFromGitHub({
        repo: 'invalid-user/nonexistent-repo-xyz123',
        ref: 'main',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
    }, 60000);
  });

  describe('URL Import - REAL', () => {
    it('should connect to real HTTP endpoint', async () => {
      const { MCPImporter } = await import('../../source/services/MCPImporter.js');
      const importer = new MCPImporter(cacheDir);

      // Use a real test API endpoint
      const result = await importer.importFromURL({
        endpoint: 'https://jsonplaceholder.typicode.com',
      });

      expect(result.success).toBe(true);
      expect(result.mcp).toBeTruthy();
      expect(result.mcp?.server).toBe('https://jsonplaceholder.typicode.com');
      expect(result.mcp?.installType).toBe('url');
    }, 30000);

    it('should handle connection errors', async () => {
      const { MCPImporter } = await import('../../source/services/MCPImporter.js');
      const importer = new MCPImporter(cacheDir);

      const result = await importer.importFromURL({
        endpoint: 'https://this-domain-does-not-exist-xyz123.invalid',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
    }, 30000);
  });

  describe('Tool Discovery - REAL', () => {
    it('should discover package.json from installed npm package', async () => {
      const { MCPImporter } = await import('../../source/services/MCPImporter.js');
      const importer = new MCPImporter(cacheDir);

      const result = await importer.importFromNPM({
        package: 'express',
        version: '4.18.2',
      });

      expect(result.success).toBe(true);
      expect(result.mcp?.metadata?.installDir).toBeTruthy();
      
      // Verify package.json can be read
      const fs = await import('fs/promises');
      const packageJsonPath = join(
        result.mcp!.metadata!.installDir!,
        'node_modules',
        'express',
        'package.json'
      );
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));
      expect(packageJson.name).toBe('express');
      expect(packageJson.version).toBe('4.18.2');
    }, 180000);
  });

  describe('Cleanup', () => {
    it('should cleanup cache directory', async () => {
      const { MCPImporter } = await import('../../source/services/MCPImporter.js');
      const importer = new MCPImporter(cacheDir);

      await importer.importFromNPM({
        package: 'lodash',
        version: '4.17.21',
      });

      await importer.cleanup();

      // Verify cache is cleaned
      const fs = await import('fs/promises');
      try {
        await fs.access(cacheDir);
        // If we get here, directory still exists
        expect(false).toBe(true); // Should not reach here
      } catch (error: any) {
        expect(error.code).toBe('ENOENT');
      }
    }, 180000);
  });
});
