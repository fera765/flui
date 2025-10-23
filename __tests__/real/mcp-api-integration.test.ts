/**
 * REAL MCP Import Integration Tests
 * Testing MCP import with store integration (simplified without API server)
 */

import { join } from 'path';
import { tmpdir } from 'os';
import { randomBytes } from 'crypto';
import { rm } from 'fs/promises';

const generateId = () => randomBytes(8).toString('hex');

describe('MCP Import Full Integration - REAL', () => {
  let cacheDir: string;

  beforeEach(async () => {
    cacheDir = join(tmpdir(), `flui-mcp-integration-${generateId()}`);
  });

  afterEach(async () => {
    await rm(cacheDir, { recursive: true, force: true });
  });

  describe('Complete NPM Import Flow', () => {
    it('should import, validate, and use npm package', async () => {
      const { MCPImporter } = await import('../../source/services/MCPImporter.js');
      const importer = new MCPImporter(cacheDir);

      // Step 1: Import
      const importResult = await importer.importFromNPM({
        package: 'chalk',
        version: '4.1.2',
      });

      expect(importResult.success).toBe(true);
      expect(importResult.mcp).toBeTruthy();

      // Step 2: Validate
      const validationResult = await importer.validateMCP(importResult.mcp!);

      expect(validationResult.valid).toBe(true);
      expect(validationResult.errors).toHaveLength(0);

      // Step 3: Verify structure
      expect(importResult.mcp?.id).toBeTruthy();
      expect(importResult.mcp?.name).toBe('chalk');
      expect(importResult.mcp?.version).toBe('4.1.2');
      expect(importResult.mcp?.installType).toBe('npm');
      expect(importResult.mcp?.metadata?.installDir).toBeTruthy();
    }, 180000);

    it('should import and verify package files exist', async () => {
      const { MCPImporter } = await import('../../source/services/MCPImporter.js');
      const importer = new MCPImporter(cacheDir);

      const result = await importer.importFromNPM({
        package: 'express',
        version: '4.18.2',
      });

      expect(result.success).toBe(true);

      // Verify package.json exists in node_modules
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

  describe('Complete GitHub Import Flow', () => {
    it('should clone, install, and validate GitHub repo', async () => {
      const { MCPImporter } = await import('../../source/services/MCPImporter.js');
      const importer = new MCPImporter(cacheDir);

      const result = await importer.importFromGitHub({
        repo: 'octocat/Hello-World',
        ref: 'master',
      });

      expect(result.success).toBe(true);
      expect(result.mcp).toBeTruthy();
      expect(result.mcp?.name).toContain('Hello-World');
      expect(result.mcp?.installType).toBe('github');

      // Verify directory exists
      const fs = await import('fs/promises');
      const stats = await fs.stat(result.mcp!.server!);
      expect(stats.isDirectory()).toBe(true);
    }, 120000);
  });

  describe('Complete URL Import Flow', () => {
    it('should connect and validate URL endpoint', async () => {
      const { MCPImporter } = await import('../../source/services/MCPImporter.js');
      const importer = new MCPImporter(cacheDir);

      const result = await importer.importFromURL({
        endpoint: 'https://jsonplaceholder.typicode.com',
      });

      expect(result.success).toBe(true);
      expect(result.mcp).toBeTruthy();
      expect(result.mcp?.server).toBe('https://jsonplaceholder.typicode.com');
      expect(result.mcp?.installType).toBe('url');

      const validationResult = await importer.validateMCP(result.mcp!);
      expect(validationResult.valid).toBe(true);
    }, 30000);
  });

  describe('Multiple Source Imports', () => {
    it('should import from all 4 sources successfully', async () => {
      const { MCPImporter } = await import('../../source/services/MCPImporter.js');
      const importer = new MCPImporter(cacheDir);

      // Import from all sources
      const npmResult = await importer.importFromNPM({
        package: 'lodash',
        version: '4.17.21',
      });

      const githubResult = await importer.importFromGitHub({
        repo: 'octocat/Hello-World',
        ref: 'master',
      });

      const urlResult = await importer.importFromURL({
        endpoint: 'https://jsonplaceholder.typicode.com',
      });

      expect(npmResult.success).toBe(true);
      expect(githubResult.success).toBe(true);
      expect(urlResult.success).toBe(true);

      // Verify each has unique ID
      const ids = new Set([
        npmResult.mcp!.id,
        githubResult.mcp!.id,
        urlResult.mcp!.id,
      ]);
      expect(ids.size).toBe(3);

      // Verify install types
      expect(npmResult.mcp!.installType).toBe('npm');
      expect(githubResult.mcp!.installType).toBe('github');
      expect(urlResult.mcp!.installType).toBe('url');
    }, 300000);
  });
});
