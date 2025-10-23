/**
 * TDD Tests for MCP Import
 * Testing: npm, npx, github, url imports
 */

describe('MCP Importer - TDD', () => {
  describe('NPM Import', () => {
    it('should import MCP from npm package', async () => {
      const { MCPImporter } = await import('../../source/services/MCPImporter.js');
      const importer = new MCPImporter();

      const result = await importer.importFromNPM({
        package: '@modelcontextprotocol/server-filesystem',
        version: 'latest',
      });

      expect(result.success).toBe(true);
      expect(result.mcp).toBeTruthy();
      expect(result.mcp?.id).toBeTruthy();
      expect(result.mcp?.tools).toBeTruthy();
    });

    it('should import specific version', async () => {
      const { MCPImporter } = await import('../../source/services/MCPImporter.js');
      const importer = new MCPImporter();

      const result = await importer.importFromNPM({
        package: '@modelcontextprotocol/server-filesystem',
        version: '1.0.0',
      });

      expect(result.success).toBe(true);
      expect(result.mcp?.version).toBe('1.0.0');
    });

    it('should handle import errors gracefully', async () => {
      const { MCPImporter } = await import('../../source/services/MCPImporter.js');
      const importer = new MCPImporter();

      const result = await importer.importFromNPM({
        package: '@invalid/nonexistent-package',
        version: 'latest',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
    });
  });

  describe('NPX Import', () => {
    it('should import and execute MCP via npx', async () => {
      const { MCPImporter } = await import('../../source/services/MCPImporter.js');
      const importer = new MCPImporter();

      const result = await importer.importFromNPX({
        package: '@modelcontextprotocol/server-brave-search',
        args: ['--api-key', 'test-key'],
      });

      expect(result.success).toBe(true);
      expect(result.mcp).toBeTruthy();
      expect(result.mcp?.installType).toBe('npx');
    });

    it('should inject environment variables', async () => {
      const { MCPImporter} = await import('../../source/services/MCPImporter.js');
      const importer = new MCPImporter();

      const result = await importer.importFromNPX({
        package: '@test/mcp-server',
        env: {
          API_KEY: 'secret-key',
          BASE_URL: 'https://api.example.com',
        },
      });

      expect(result.success).toBe(true);
      expect(result.mcp?.envVars).toEqual({
        API_KEY: 'secret-key',
        BASE_URL: 'https://api.example.com',
      });
    });
  });

  describe('GitHub Import', () => {
    it('should import MCP from GitHub repository', async () => {
      const { MCPImporter } = await import('../../source/services/MCPImporter.js');
      const importer = new MCPImporter();

      const result = await importer.importFromGitHub({
        repo: 'modelcontextprotocol/servers',
        path: 'src/filesystem',
        ref: 'main',
      });

      expect(result.success).toBe(true);
      expect(result.mcp).toBeTruthy();
      expect(result.mcp?.installType).toBe('github');
    });

    it('should clone and discover tools', async () => {
      const { MCPImporter } = await import('../../source/services/MCPImporter.js');
      const importer = new MCPImporter();

      const result = await importer.importFromGitHub({
        repo: 'test/mcp-repo',
        path: 'server',
      });

      expect(result.success).toBe(true);
      expect(result.mcp?.tools).toBeInstanceOf(Array);
    });

    it('should support private repositories with token', async () => {
      const { MCPImporter } = await import('../../source/services/MCPImporter.js');
      const importer = new MCPImporter();

      const result = await importer.importFromGitHub({
        repo: 'private/mcp-repo',
        path: 'server',
        token: 'gh_token_123',
      });

      expect(result.success).toBe(true);
    });
  });

  describe('URL Import', () => {
    it('should import MCP from HTTP endpoint', async () => {
      const { MCPImporter } = await import('../../source/services/MCPImporter.js');
      const importer = new MCPImporter();

      const result = await importer.importFromURL({
        endpoint: 'https://mcp.example.com',
      });

      expect(result.success).toBe(true);
      expect(result.mcp).toBeTruthy();
      expect(result.mcp?.server).toBe('https://mcp.example.com');
      expect(result.mcp?.installType).toBe('url');
    });

    it('should support authentication', async () => {
      const { MCPImporter } = await import('../../source/services/MCPImporter.js');
      const importer = new MCPImporter();

      const result = await importer.importFromURL({
        endpoint: 'https://mcp.example.com',
        auth: {
          type: 'bearer',
          token: 'secret-token',
        },
      });

      expect(result.success).toBe(true);
      expect(result.mcp?.metadata?.authType).toBe('bearer');
    });

    it('should discover tools from endpoint', async () => {
      const { MCPImporter } = await import('../../source/services/MCPImporter.js');
      const importer = new MCPImporter();

      const result = await importer.importFromURL({
        endpoint: 'https://mcp.example.com',
      });

      expect(result.success).toBe(true);
      expect(result.mcp?.tools).toBeInstanceOf(Array);
      expect(result.mcp?.tools.length).toBeGreaterThan(0);
    });
  });

  describe('Tool Discovery', () => {
    it('should auto-discover tools from MCP', async () => {
      const { MCPImporter } = await import('../../source/services/MCPImporter.js');
      const importer = new MCPImporter();

      const result = await importer.discoverTools('test-mcp-id');

      expect(result.success).toBe(true);
      expect(result.tools).toBeInstanceOf(Array);
    });

    it('should validate tool schemas', async () => {
      const { MCPImporter } = await import('../../source/services/MCPImporter.js');
      const importer = new MCPImporter();

      const result = await importer.validateMCP({
        id: 'test-mcp',
        name: 'Test MCP',
        tools: [
          {
            id: 'tool-1',
            name: 'testTool',
            description: 'Test tool',
            parameters: {},
            handler: 'testHandler',
          },
        ],
      });

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });
});
