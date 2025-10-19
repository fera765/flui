import { describe, it, expect, afterEach } from 'vitest';
import { createSandbox, Sandbox } from '../services/sandbox';

describe('Sandbox System', () => {
  let sandbox: Sandbox;

  afterEach(async () => {
    if (sandbox) {
      await sandbox.cleanup();
    }
  });

  describe('Sandbox Creation', () => {
    it('should create sandbox', async () => {
      sandbox = await createSandbox();
      expect(sandbox).toBeDefined();
      expect(sandbox.getSandboxPath()).toBeDefined();
    });
  });

  describe('JavaScript Execution', () => {
    it('should execute simple JavaScript', async () => {
      sandbox = await createSandbox();
      const result = await sandbox.executeJavaScript('console.log("Hello");');
      
      expect(result.success).toBe(true);
      expect(result.exitCode).toBe(0);
    });

    it('should capture output', async () => {
      sandbox = await createSandbox();
      const result = await sandbox.executeJavaScript('console.log("Test output");');
      
      expect(result.output).toContain('Test output');
    });

    it('should handle errors', async () => {
      sandbox = await createSandbox();
      const result = await sandbox.executeJavaScript('throw new Error("Test error");');
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('File Operations', () => {
    it('should write and read files', async () => {
      sandbox = await createSandbox();
      const content = 'Test file content';
      
      await sandbox.writeFile('test.txt', content);
      const read = await sandbox.readFile('test.txt');
      
      expect(read).toBe(content);
    });
  });
});
