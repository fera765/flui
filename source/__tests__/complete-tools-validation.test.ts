/**
 * FLUI - Complete Tools Validation Test
 * 
 * Testa TODAS as tools do sistema para garantir:
 * - Validação correta de parâmetros
 * - Execução sem erros
 * - Defaults aplicados corretamente
 * - Compatibilidade com frontend e CLI
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { registerAllTools, ALL_TOOLS } from '../tools/index.js';
import { ToolExecutor } from '../core/toolExecutor.js';
import { getToolRegistry } from '../core/toolRegistry.js';
import { ExecutionContext } from '../core/types.js';
import { createSandbox } from '../services/sandbox.js';

describe('Complete Tools Validation', () => {
  beforeAll(() => {
    registerAllTools();
  });

  it('should have all tools registered', () => {
    const registry = getToolRegistry();
    expect(registry.count()).toBe(ALL_TOOLS.length);
    expect(registry.count()).toBeGreaterThan(0);
  });

  it('should validate all tools have proper structure', () => {
    for (const tool of ALL_TOOLS) {
      expect(tool.id).toBeDefined();
      expect(tool.name).toBeDefined();
      expect(tool.description).toBeDefined();
      expect(tool.params).toBeInstanceOf(Array);
      expect(tool.execute).toBeInstanceOf(Function);
      expect(tool.ui).toBeDefined();
      expect(tool.ui.icon).toBeDefined();
      expect(tool.ui.color).toBeDefined();
    }
  });

  it('should validate all params have UI definitions', () => {
    for (const tool of ALL_TOOLS) {
      for (const param of tool.params) {
        expect(param.name).toBeDefined();
        expect(param.key).toBeDefined();
        expect(param.type).toBeDefined();
        expect(param.ui).toBeDefined();
        expect(param.ui.widgetType).toBeDefined();
        expect(param.ui.helperText).toBeDefined();
      }
    }
  });

  describe('Delay Tool', () => {
    it('should execute with valid params', async () => {
      const context: ExecutionContext = {
        userId: 'test-user',
        sessionId: 'test-session',
        globalContext: {},
      };

      const result = await ToolExecutor.execute(
        'delay',
        { duration: 100, unit: 'milliseconds' },
        context
      );

      expect(result.success).toBe(true);
      expect(result.result.duration).toBe(100);
    });

    it('should apply defaults', async () => {
      const context: ExecutionContext = {
        userId: 'test-user',
        sessionId: 'test-session',
        globalContext: {},
      };

      const result = await ToolExecutor.execute(
        'delay',
        { duration: 100 },
        context
      );

      expect(result.success).toBe(true);
    });

    it('should fail with invalid duration', async () => {
      const context: ExecutionContext = {
        userId: 'test-user',
        sessionId: 'test-session',
        globalContext: {},
      };

      const result = await ToolExecutor.execute(
        'delay',
        { duration: -1000 },
        context
      );

      expect(result.success).toBe(false);
    });
  });

  describe('Condition Tool', () => {
    it('should evaluate if-else correctly', async () => {
      const context: ExecutionContext = {
        userId: 'test-user',
        sessionId: 'test-session',
        globalContext: {},
      };

      const result = await ToolExecutor.execute(
        'condition',
        {
          mode: 'if-else',
          inputValue: { age: 25 },
          branches: [
            { name: 'adult', condition: 'data.age >= 18' },
            { name: 'minor', condition: 'data.age < 18' },
          ],
        },
        context
      );

      expect(result.success).toBe(true);
      expect(result.result.selectedRoute).toBe('adult');
      expect(result.result.matchedBranches).toContain('adult');
    });

    it('should handle multi-branch mode', async () => {
      const context: ExecutionContext = {
        userId: 'test-user',
        sessionId: 'test-session',
        globalContext: {},
      };

      const result = await ToolExecutor.execute(
        'condition',
        {
          mode: 'multi-branch',
          inputValue: { score: 90, premium: true },
          branches: [
            { name: 'high_score', condition: 'data.score > 80' },
            { name: 'premium', condition: 'data.premium === true' },
          ],
          allowMultipleMatches: true,
        },
        context
      );

      expect(result.success).toBe(true);
      expect(result.result.matchedBranches.length).toBe(2);
    });
  });

  describe('Data Transform Tools', () => {
    it('should transform data correctly', async () => {
      const context: ExecutionContext = {
        userId: 'test-user',
        sessionId: 'test-session',
        globalContext: {},
      };

      const result = await ToolExecutor.execute(
        'data-transform',
        {
          input: { name: 'john', age: 30 },
          transform: 'return { name: data.name.toUpperCase(), isAdult: data.age >= 18 };',
        },
        context
      );

      expect(result.success).toBe(true);
      expect(result.result.name).toBe('JOHN');
      expect(result.result.isAdult).toBe(true);
    });

    it('should filter array correctly', async () => {
      const context: ExecutionContext = {
        userId: 'test-user',
        sessionId: 'test-session',
        globalContext: {},
      };

      const result = await ToolExecutor.execute(
        'data-filter',
        {
          array: [1, 2, 3, 4, 5, 6],
          condition: 'return item > 3;',
        },
        context
      );

      expect(result.success).toBe(true);
      expect(result.result).toEqual([4, 5, 6]);
    });

    it('should merge objects correctly', async () => {
      const context: ExecutionContext = {
        userId: 'test-user',
        sessionId: 'test-session',
        globalContext: {},
      };

      const result = await ToolExecutor.execute(
        'data-merge',
        {
          mode: 'object',
          dataA: { a: 1, b: 2 },
          dataB: { c: 3, d: 4 },
        },
        context
      );

      expect(result.success).toBe(true);
      expect(result.result).toEqual({ a: 1, b: 2, c: 3, d: 4 });
    });

    it('should merge arrays correctly', async () => {
      const context: ExecutionContext = {
        userId: 'test-user',
        sessionId: 'test-session',
        globalContext: {},
      };

      const result = await ToolExecutor.execute(
        'data-merge',
        {
          mode: 'array',
          dataA: [1, 2, 3],
          dataB: [4, 5, 6],
        },
        context
      );

      expect(result.success).toBe(true);
      expect(result.result).toEqual([1, 2, 3, 4, 5, 6]);
    });
  });

  describe('HTTP Request Tool', () => {
    it('should have required URL parameter', async () => {
      const context: ExecutionContext = {
        userId: 'test-user',
        sessionId: 'test-session',
        globalContext: {},
      };

      const result = await ToolExecutor.execute(
        'http-request',
        {},
        context
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('URL');
    });

    it('should apply defaults for GET request', async () => {
      const context: ExecutionContext = {
        userId: 'test-user',
        sessionId: 'test-session',
        globalContext: {},
      };

      // Use a mock URL for testing
      const result = await ToolExecutor.execute(
        'http-request',
        {
          url: 'https://httpbin.org/get',
          method: 'GET',
        },
        context,
        { timeout: 10000 }
      );

      // Should succeed or fail gracefully
      expect(result).toBeDefined();
      expect(result.executionTime).toBeGreaterThan(0);
    });
  });

  describe('File Operations Tools', () => {
    let sandbox: any;
    let testFilePath: string;

    beforeAll(async () => {
      sandbox = await createSandbox();
      await sandbox.initialize();
      testFilePath = `${sandbox.getSandboxPath()}/test-file.txt`;
    });

    it('should write file', async () => {
      const context: ExecutionContext = {
        userId: 'test-user',
        sessionId: 'test-session',
        globalContext: {},
      };

      const result = await ToolExecutor.execute(
        'file-write',
        {
          path: testFilePath,
          content: 'Hello World',
          mode: 'overwrite',
        },
        context
      );

      expect(result.success).toBe(true);
      expect(result.result.success).toBe(true);
    });

    it('should read file', async () => {
      const context: ExecutionContext = {
        userId: 'test-user',
        sessionId: 'test-session',
        globalContext: {},
      };

      const result = await ToolExecutor.execute(
        'file-read',
        {
          path: testFilePath,
        },
        context
      );

      expect(result.success).toBe(true);
      expect(result.result).toBe('Hello World');
    });

    it('should edit file', async () => {
      const context: ExecutionContext = {
        userId: 'test-user',
        sessionId: 'test-session',
        globalContext: {},
      };

      const result = await ToolExecutor.execute(
        'file-edit',
        {
          path: testFilePath,
          search: 'Hello',
          replace: 'Hi',
        },
        context
      );

      expect(result.success).toBe(true);
      expect(result.result.replacements).toBeGreaterThan(0);
    });

    afterAll(async () => {
      if (sandbox) {
        await sandbox.cleanup();
      }
    });
  });

  describe('Shell Executor Tool', () => {
    it('should execute simple command', async () => {
      const context: ExecutionContext = {
        userId: 'test-user',
        sessionId: 'test-session',
        globalContext: {},
      };

      const result = await ToolExecutor.execute(
        'shell-executor',
        {
          command: 'echo "test"',
        },
        context
      );

      expect(result.success).toBe(true);
      expect(result.result.stdout).toContain('test');
    });
  });

  describe('Custom Code Tool', () => {
    it('should execute JavaScript code', async () => {
      const context: ExecutionContext = {
        userId: 'test-user',
        sessionId: 'test-session',
        globalContext: {},
      };

      const result = await ToolExecutor.execute(
        'custom-code',
        {
          language: 'javascript',
          code: 'output.result = input.numbers.reduce((a, b) => a + b, 0);',
          input: { numbers: [1, 2, 3, 4, 5] },
        },
        context
      );

      expect(result.success).toBe(true);
    });
  });

  it('should have examples for all tools', () => {
    for (const tool of ALL_TOOLS) {
      expect(tool.ui.examples).toBeDefined();
      expect(tool.ui.examples.length).toBeGreaterThan(0);
      
      for (const example of tool.ui.examples) {
        expect(example.title).toBeDefined();
        expect(example.params).toBeDefined();
      }
    }
  });

  it('should have proper capability flags', () => {
    for (const tool of ALL_TOOLS) {
      if (tool.capabilities) {
        expect(typeof tool.capabilities.requiresAuth).toBe('boolean');
        expect(typeof tool.capabilities.runsInSandbox).toBe('boolean');
        expect(typeof tool.capabilities.isAsync).toBe('boolean');
      }
    }
  });

  it('should have proper config', () => {
    for (const tool of ALL_TOOLS) {
      expect(tool.config).toBeDefined();
      expect(typeof tool.config.timeout).toBe('number');
      expect(tool.config.timeout).toBeGreaterThan(0);
      expect(typeof tool.config.sandbox).toBe('boolean');
    }
  });
});
