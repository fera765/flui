import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { initializeToolRegistry, getToolRegistry } from '../core/toolRegistry.js';
import { registerAllTools } from '../tools/index.js';
import { ToolExecutor } from '../core/toolExecutor.js';
import { ExecutionContext } from '../core/types.js';
import { writeFile, mkdir, rm } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { nanoid } from 'nanoid';

describe('Tools Integration Tests', () => {
  let testDir: string;
  let context: ExecutionContext;

  beforeEach(async () => {
    testDir = join(tmpdir(), 'flui-tools-test', nanoid());
    await mkdir(testDir, { recursive: true });
    
    initializeToolRegistry();
    registerAllTools();
    
    context = {
      automationId: 'test',
      nodeId: 'test-node',
      previousResults: {},
      globalContext: {},
    };
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  describe('FileSystem Tools', () => {
    it('deve criar e ler arquivo', async () => {
      const filePath = join(testDir, 'test.txt');
      const content = 'Hello World';

      // Criar arquivo
      const writeResult = await ToolExecutor.execute(
        'file-write',
        { path: filePath, content, mode: 'overwrite' },
        context
      );
      expect(writeResult.success).toBe(true);

      // Ler arquivo
      const readResult = await ToolExecutor.execute(
        'file-read',
        { path: filePath },
        context
      );
      expect(readResult.success).toBe(true);
      expect(readResult.result).toBe(content);
    });

    it('deve editar arquivo com replace', async () => {
      const filePath = join(testDir, 'test.txt');
      
      // Criar arquivo
      await writeFile(filePath, 'Hello World', 'utf-8');

      // Editar
      const editResult = await ToolExecutor.execute(
        'file-edit',
        {
          path: filePath,
          search: 'World',
          replace: 'Flui',
          flags: 'g'
        },
        context
      );
      expect(editResult.success).toBe(true);
      expect(editResult.result.replacements).toBeGreaterThan(0);

      // Verificar
      const readResult = await ToolExecutor.execute(
        'file-read',
        { path: filePath },
        context
      );
      expect(readResult.result).toBe('Hello Flui');
    });

    it('deve lidar com conteúdo grande', async () => {
      const filePath = join(testDir, 'large.txt');
      const largeContent = 'A'.repeat(100000);

      const writeResult = await ToolExecutor.execute(
        'file-write',
        { path: filePath, content: largeContent },
        context
      );
      expect(writeResult.success).toBe(true);

      const readResult = await ToolExecutor.execute(
        'file-read',
        { path: filePath },
        context
      );
      expect(readResult.success).toBe(true);
      expect(readResult.result.length).toBe(100000);
    });

    it('deve falhar ao ler arquivo inexistente', async () => {
      const result = await ToolExecutor.execute(
        'file-read',
        { path: '/path/that/does/not/exist.txt' },
        context
      );
      expect(result.success).toBe(false);
    });
  });

  describe('Search Tools', () => {
    it('deve buscar arquivos por padrão', async () => {
      // Criar arquivos de teste
      await writeFile(join(testDir, 'test1.txt'), 'content', 'utf-8');
      await writeFile(join(testDir, 'test2.js'), 'code', 'utf-8');

      const result = await ToolExecutor.execute(
        'file-search',
        {
          pattern: '*.txt',
          directory: testDir,
          maxResults: 10
        },
        context
      );

      expect(result.success).toBe(true);
      expect(Array.isArray(result.result)).toBe(true);
      expect(result.result.length).toBeGreaterThanOrEqual(1);
    });

    it('deve buscar texto em arquivos', async () => {
      // Criar arquivos com conteúdo
      await writeFile(join(testDir, 'search1.txt'), 'Flui is awesome', 'utf-8');
      await writeFile(join(testDir, 'search2.txt'), 'Flui is powerful', 'utf-8');

      const result = await ToolExecutor.execute(
        'text-search',
        {
          pattern: 'Flui',
          directory: testDir,
          filePattern: '*.txt',
          maxResults: 10
        },
        context
      );

      expect(result.success).toBe(true);
      expect(Array.isArray(result.result)).toBe(true);
      expect(result.result.length).toBeGreaterThanOrEqual(2);
    });

    it('deve buscar pattern complexo', async () => {
      await writeFile(
        join(testDir, 'complex.txt'),
        'test@email.com\nuser@domain.org\ninvalid-email',
        'utf-8'
      );

      const result = await ToolExecutor.execute(
        'text-search',
        {
          pattern: '@',
          directory: testDir,
          filePattern: '*.txt',
          caseSensitive: false,
          maxResults: 10
        },
        context
      );

      expect(result.success).toBe(true);
      expect(result.result.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('HTTP Request Tool', () => {
    it('deve fazer requisição GET', async () => {
      const result = await ToolExecutor.execute(
        'http-request',
        {
          url: 'https://api.github.com/zen',
          method: 'GET'
        },
        context
      );

      expect(result.success).toBe(true);
      expect(result.result.status).toBe(200);
      expect(result.result.body).toBeDefined();
    });
  });

  describe('System Info Tool', () => {
    it('deve retornar informações básicas', async () => {
      const result = await ToolExecutor.execute(
        'system-info',
        { detailed: false },
        context
      );

      expect(result.success).toBe(true);
      expect(result.result.platform).toBeDefined();
      expect(result.result.arch).toBeDefined();
      expect(result.result.cpus).toBeGreaterThan(0);
    });

    it('deve retornar informações detalhadas', async () => {
      const result = await ToolExecutor.execute(
        'system-info',
        { detailed: true },
        context
      );

      expect(result.success).toBe(true);
      expect(result.result.cpuInfo).toBeDefined();
      expect(Array.isArray(result.result.cpuInfo)).toBe(true);
    });
  });

  describe('Custom Code Tool', () => {
    it('deve executar JavaScript simples', async () => {
      const result = await ToolExecutor.execute(
        'custom-code',
        {
          language: 'javascript',
          code: 'output.result = 2 + 2;',
          input: {}
        },
        context
      );

      expect(result.success).toBe(true);
    });

    it('deve processar input em JavaScript', async () => {
      const result = await ToolExecutor.execute(
        'custom-code',
        {
          language: 'javascript',
          code: 'output.sum = input.numbers.reduce((a, b) => a + b, 0);',
          input: { numbers: [1, 2, 3, 4, 5] }
        },
        context
      );

      expect(result.success).toBe(true);
    });

    it('deve bloquear imports', async () => {
      const result = await ToolExecutor.execute(
        'custom-code',
        {
          language: 'javascript',
          code: 'const fs = require("fs");',
          input: {}
        },
        context
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Imports não são permitidos');
    });
  });

  describe('Tool Registry', () => {
    it('deve listar todas as ferramentas', () => {
      const registry = getToolRegistry();
      const tools = registry.list();
      
      expect(tools.length).toBeGreaterThanOrEqual(10);
    });

    it('deve filtrar por categoria', () => {
      const registry = getToolRegistry();
      const systemTools = registry.list({ category: 'system' });
      
      expect(systemTools.length).toBeGreaterThan(0);
      systemTools.forEach(tool => {
        expect(tool.category).toBe('system');
      });
    });

    it('deve buscar ferramentas', () => {
      const registry = getToolRegistry();
      const httpTools = registry.list({ search: 'http' });
      
      expect(httpTools.length).toBeGreaterThan(0);
    });

    it('deve obter métricas', async () => {
      const registry = getToolRegistry();
      
      await ToolExecutor.execute('system-info', {}, context);
      
      const metrics = registry.getMetrics('system-info');
      expect(metrics).toBeDefined();
      expect(metrics!.executionCount).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('deve retornar erro para ferramenta inexistente', async () => {
      const result = await ToolExecutor.execute(
        'non-existent-tool',
        {},
        context
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('não encontrada');
    });

    it('deve validar parâmetros obrigatórios', async () => {
      const result = await ToolExecutor.execute(
        'file-read',
        {},
        context
      );

      expect(result.success).toBe(false);
    });
  });
});
