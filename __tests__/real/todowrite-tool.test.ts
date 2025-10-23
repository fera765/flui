/**
 * REAL Tests for TodoWrite Tool
 * Testing task management functionality
 */

import { mkdir, rm, readFile, access } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { randomBytes } from 'crypto';

const generateId = () => randomBytes(8).toString('hex');

describe('TodoWrite Tool - REAL', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = join(tmpdir(), `flui-todo-test-${generateId()}`);
    await mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  describe('Create Todo', () => {
    it('should create a new todo item', async () => {
      const { TodoWriteTool } = await import('../../source/tools/system/TodoWriteTool.js');
      const tool = new TodoWriteTool(testDir);

      const result = await tool.execute({
        action: 'create',
        title: 'Test Task',
        description: 'This is a test task',
        priority: 'high',
      });

      expect(result.success).toBe(true);
      expect(result.todo).toBeTruthy();
      expect(result.todo?.title).toBe('Test Task');
      expect(result.todo?.status).toBe('pending');
      expect(result.todo?.id).toBeTruthy();

      // Verify file was created
      const todoFile = join(testDir, '.todos.json');
      const content = await readFile(todoFile, 'utf-8');
      const todos = JSON.parse(content);
      expect(todos).toHaveLength(1);
      expect(todos[0].title).toBe('Test Task');
    });

    it('should create multiple todos', async () => {
      const { TodoWriteTool } = await import('../../source/tools/system/TodoWriteTool.js');
      const tool = new TodoWriteTool(testDir);

      await tool.execute({
        action: 'create',
        title: 'Task 1',
      });

      await tool.execute({
        action: 'create',
        title: 'Task 2',
      });

      const result = await tool.execute({
        action: 'list',
      });

      expect(result.success).toBe(true);
      expect(result.todos).toHaveLength(2);
    });
  });

  describe('Update Todo', () => {
    it('should update todo status', async () => {
      const { TodoWriteTool } = await import('../../source/tools/system/TodoWriteTool.js');
      const tool = new TodoWriteTool(testDir);

      const createResult = await tool.execute({
        action: 'create',
        title: 'Task to update',
      });

      const todoId = createResult.todo!.id;

      const result = await tool.execute({
        action: 'update',
        id: todoId,
        status: 'completed',
      });

      expect(result.success).toBe(true);
      expect(result.todo?.status).toBe('completed');

      // Verify in file
      const todoFile = join(testDir, '.todos.json');
      const content = await readFile(todoFile, 'utf-8');
      const todos = JSON.parse(content);
      expect(todos[0].status).toBe('completed');
    });

    it('should update todo priority', async () => {
      const { TodoWriteTool } = await import('../../source/tools/system/TodoWriteTool.js');
      const tool = new TodoWriteTool(testDir);

      const createResult = await tool.execute({
        action: 'create',
        title: 'Task',
        priority: 'low',
      });

      const result = await tool.execute({
        action: 'update',
        id: createResult.todo!.id,
        priority: 'urgent',
      });

      expect(result.success).toBe(true);
      expect(result.todo?.priority).toBe('urgent');
    });
  });

  describe('Delete Todo', () => {
    it('should delete a todo', async () => {
      const { TodoWriteTool } = await import('../../source/tools/system/TodoWriteTool.js');
      const tool = new TodoWriteTool(testDir);

      const createResult = await tool.execute({
        action: 'create',
        title: 'Task to delete',
      });

      const result = await tool.execute({
        action: 'delete',
        id: createResult.todo!.id,
      });

      expect(result.success).toBe(true);

      const listResult = await tool.execute({
        action: 'list',
      });

      expect(listResult.todos).toHaveLength(0);
    });
  });

  describe('List Todos', () => {
    it('should list all todos', async () => {
      const { TodoWriteTool } = await import('../../source/tools/system/TodoWriteTool.js');
      const tool = new TodoWriteTool(testDir);

      await tool.execute({ action: 'create', title: 'Task 1', priority: 'high' });
      await tool.execute({ action: 'create', title: 'Task 2', priority: 'low' });
      await tool.execute({ action: 'create', title: 'Task 3' });

      const result = await tool.execute({
        action: 'list',
      });

      expect(result.success).toBe(true);
      expect(result.todos).toHaveLength(3);
    });

    it('should filter todos by status', async () => {
      const { TodoWriteTool } = await import('../../source/tools/system/TodoWriteTool.js');
      const tool = new TodoWriteTool(testDir);

      const todo1 = await tool.execute({ action: 'create', title: 'Task 1' });
      await tool.execute({ action: 'create', title: 'Task 2' });
      await tool.execute({
        action: 'update',
        id: todo1.todo!.id,
        status: 'completed',
      });

      const result = await tool.execute({
        action: 'list',
        status: 'completed',
      });

      expect(result.success).toBe(true);
      expect(result.todos).toHaveLength(1);
      expect(result.todos![0].status).toBe('completed');
    });

    it('should filter todos by priority', async () => {
      const { TodoWriteTool } = await import('../../source/tools/system/TodoWriteTool.js');
      const tool = new TodoWriteTool(testDir);

      await tool.execute({ action: 'create', title: 'Task 1', priority: 'high' });
      await tool.execute({ action: 'create', title: 'Task 2', priority: 'low' });
      await tool.execute({ action: 'create', title: 'Task 3', priority: 'high' });

      const result = await tool.execute({
        action: 'list',
        priority: 'high',
      });

      expect(result.success).toBe(true);
      expect(result.todos).toHaveLength(2);
    });
  });

  describe('Clear Completed', () => {
    it('should clear all completed todos', async () => {
      const { TodoWriteTool } = await import('../../source/tools/system/TodoWriteTool.js');
      const tool = new TodoWriteTool(testDir);

      const todo1 = await tool.execute({ action: 'create', title: 'Task 1' });
      const todo2 = await tool.execute({ action: 'create', title: 'Task 2' });
      await tool.execute({ action: 'create', title: 'Task 3' });

      await tool.execute({ action: 'update', id: todo1.todo!.id, status: 'completed' });
      await tool.execute({ action: 'update', id: todo2.todo!.id, status: 'completed' });

      const result = await tool.execute({
        action: 'clear',
      });

      expect(result.success).toBe(true);
      expect(result.cleared).toBe(2);

      const listResult = await tool.execute({ action: 'list' });
      expect(listResult.todos).toHaveLength(1);
    });
  });

  describe('Statistics', () => {
    it('should return todo statistics', async () => {
      const { TodoWriteTool } = await import('../../source/tools/system/TodoWriteTool.js');
      const tool = new TodoWriteTool(testDir);

      const todo1 = await tool.execute({ action: 'create', title: 'Task 1', priority: 'high' });
      await tool.execute({ action: 'create', title: 'Task 2', priority: 'low' });
      await tool.execute({ action: 'create', title: 'Task 3' });

      await tool.execute({ action: 'update', id: todo1.todo!.id, status: 'completed' });

      const result = await tool.execute({
        action: 'stats',
      });

      expect(result.success).toBe(true);
      expect(result.stats).toBeTruthy();
      expect(result.stats!.total).toBe(3);
      expect(result.stats!.completed).toBe(1);
      expect(result.stats!.pending).toBe(2);
      expect(result.stats!.byPriority.high).toBe(1);
      expect(result.stats!.byPriority.low).toBe(1);
    });
  });
});
