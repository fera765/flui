/**
 * TDD Tests for Execution Tools
 * Testing: Shell, Task, WebFetch
 */

describe('Execution Tools - TDD', () => {
  describe('Shell Tool', () => {
    it('should execute shell command in sandbox', async () => {
      const { ShellTool } = await import('../../source/tools/system/ShellTool.js');
      const tool = new ShellTool();

      const result = await tool.execute({
        command: 'echo "Hello from shell"',
      });

      expect(result.success).toBe(true);
      expect(result.stdout).toContain('Hello from shell');
      expect(result.exitCode).toBe(0);
    });

    it('should handle command errors', async () => {
      const { ShellTool } = await import('../../source/tools/system/ShellTool.js');
      const tool = new ShellTool();

      const result = await tool.execute({
        command: 'exit 1',
      });

      expect(result.success).toBe(false);
      expect(result.exitCode).toBe(1);
    });

    it('should respect timeout', async () => {
      const { ShellTool } = await import('../../source/tools/system/ShellTool.js');
      const tool = new ShellTool();

      const result = await tool.execute({
        command: 'sleep 10',
        timeout: 1000,
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('timeout');
    });

    it('should work with environment variables', async () => {
      const { ShellTool } = await import('../../source/tools/system/ShellTool.js');
      const tool = new ShellTool();

      const result = await tool.execute({
        command: 'echo $TEST_VAR',
        env: {
          TEST_VAR: 'test_value',
        },
      });

      expect(result.success).toBe(true);
      expect(result.stdout).toContain('test_value');
    });
  });

  describe('Task Tool', () => {
    it('should execute background task', async () => {
      const { TaskTool } = await import('../../source/tools/system/TaskTool.js');
      const tool = new TaskTool();

      const result = await tool.execute({
        name: 'test-task',
        command: 'echo "Background task"',
      });

      expect(result.success).toBe(true);
      expect(result.taskId).toBeTruthy();
      expect(result.status).toBe('running');
    });

    it('should check task status', async () => {
      const { TaskTool } = await import('../../source/tools/system/TaskTool.js');
      const tool = new TaskTool();

      // Start task
      const startResult = await tool.execute({
        name: 'test-task',
        command: 'sleep 1 && echo "done"',
      });

      // Check status
      const statusResult = await tool.execute({
        action: 'status',
        taskId: startResult.taskId,
      });

      expect(statusResult.success).toBe(true);
      expect(['running', 'completed']).toContain(statusResult.status);
    });

    it('should cancel running task', async () => {
      const { TaskTool } = await import('../../source/tools/system/TaskTool.js');
      const tool = new TaskTool();

      // Start long-running task
      const startResult = await tool.execute({
        name: 'long-task',
        command: 'sleep 100',
      });

      // Cancel task
      const cancelResult = await tool.execute({
        action: 'cancel',
        taskId: startResult.taskId,
      });

      expect(cancelResult.success).toBe(true);
      expect(cancelResult.status).toBe('cancelled');
    });
  });

  describe('WebFetch Tool', () => {
    it('should fetch data from URL', async () => {
      const { WebFetchTool } = await import('../../source/tools/system/WebFetchTool.js');
      const tool = new WebFetchTool();

      const result = await tool.execute({
        url: 'https://jsonplaceholder.typicode.com/posts/1',
      });

      expect(result.success).toBe(true);
      expect(result.status).toBe(200);
      expect(result.data).toBeTruthy();
      expect(result.data.id).toBe(1);
    });

    it('should make POST request', async () => {
      const { WebFetchTool } = await import('../../source/tools/system/WebFetchTool.js');
      const tool = new WebFetchTool();

      const result = await tool.execute({
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

    it('should handle request errors', async () => {
      const { WebFetchTool } = await import('../../source/tools/system/WebFetchTool.js');
      const tool = new WebFetchTool();

      const result = await tool.execute({
        url: 'https://invalid-domain-that-does-not-exist.com',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
    });

    it('should support custom headers', async () => {
      const { WebFetchTool } = await import('../../source/tools/system/WebFetchTool.js');
      const tool = new WebFetchTool();

      const result = await tool.execute({
        url: 'https://httpbin.org/headers',
        headers: {
          'X-Custom-Header': 'test-value',
        },
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      // httpbin.org returns headers in a nested object
      if (result.data && typeof result.data === 'object' && 'headers' in result.data) {
        const headers = (result.data as any).headers;
        expect(headers['X-Custom-Header']).toBe('test-value');
      }
    }, 30000); // 30 seconds timeout for HTTP request
  });
});
