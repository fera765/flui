/**
 * TodoWrite Tool - Task management
 * Executes only in automation sandbox
 */

import { readFile, writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { randomBytes } from 'crypto';

const generateId = () => randomBytes(8).toString('hex');

export interface Todo {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  tags?: string[];
}

export interface TodoWriteParams {
  action: 'create' | 'update' | 'delete' | 'list' | 'clear' | 'stats';
  id?: string;
  title?: string;
  description?: string;
  status?: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  tags?: string[];
}

export interface TodoWriteResult {
  success: boolean;
  todo?: Todo;
  todos?: Todo[];
  cleared?: number;
  stats?: {
    total: number;
    pending: number;
    in_progress: number;
    completed: number;
    cancelled: number;
    byPriority: {
      low: number;
      medium: number;
      high: number;
      urgent: number;
    };
  };
  error?: string;
}

export class TodoWriteTool {
  private storageDir: string;
  private todoFile: string;

  constructor(storageDir?: string) {
    this.storageDir = storageDir || process.cwd();
    this.todoFile = join(this.storageDir, '.todos.json');
  }

  async execute(params: TodoWriteParams): Promise<TodoWriteResult> {
    try {
      switch (params.action) {
        case 'create':
          return await this.createTodo(params);
        case 'update':
          return await this.updateTodo(params);
        case 'delete':
          return await this.deleteTodo(params);
        case 'list':
          return await this.listTodos(params);
        case 'clear':
          return await this.clearCompleted();
        case 'stats':
          return await this.getStats();
        default:
          return {
            success: false,
            error: `Unknown action: ${params.action}`,
          };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  private async createTodo(params: TodoWriteParams): Promise<TodoWriteResult> {
    if (!params.title) {
      return {
        success: false,
        error: 'Title is required for creating a todo',
      };
    }

    const todos = await this.loadTodos();

    const todo: Todo = {
      id: generateId(),
      title: params.title,
      description: params.description,
      status: 'pending',
      priority: params.priority || 'medium',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: params.tags,
    };

    todos.push(todo);
    await this.saveTodos(todos);

    return {
      success: true,
      todo,
    };
  }

  private async updateTodo(params: TodoWriteParams): Promise<TodoWriteResult> {
    if (!params.id) {
      return {
        success: false,
        error: 'ID is required for updating a todo',
      };
    }

    const todos = await this.loadTodos();
    const todoIndex = todos.findIndex(t => t.id === params.id);

    if (todoIndex === -1) {
      return {
        success: false,
        error: `Todo with ID ${params.id} not found`,
      };
    }

    const todo = todos[todoIndex];

    if (params.title !== undefined) todo.title = params.title;
    if (params.description !== undefined) todo.description = params.description;
    if (params.status !== undefined) {
      todo.status = params.status;
      if (params.status === 'completed') {
        todo.completedAt = new Date().toISOString();
      }
    }
    if (params.priority !== undefined) todo.priority = params.priority;
    if (params.tags !== undefined) todo.tags = params.tags;

    todo.updatedAt = new Date().toISOString();

    todos[todoIndex] = todo;
    await this.saveTodos(todos);

    return {
      success: true,
      todo,
    };
  }

  private async deleteTodo(params: TodoWriteParams): Promise<TodoWriteResult> {
    if (!params.id) {
      return {
        success: false,
        error: 'ID is required for deleting a todo',
      };
    }

    const todos = await this.loadTodos();
    const filteredTodos = todos.filter(t => t.id !== params.id);

    if (filteredTodos.length === todos.length) {
      return {
        success: false,
        error: `Todo with ID ${params.id} not found`,
      };
    }

    await this.saveTodos(filteredTodos);

    return {
      success: true,
    };
  }

  private async listTodos(params: TodoWriteParams): Promise<TodoWriteResult> {
    let todos = await this.loadTodos();

    // Filter by status
    if (params.status) {
      todos = todos.filter(t => t.status === params.status);
    }

    // Filter by priority
    if (params.priority) {
      todos = todos.filter(t => t.priority === params.priority);
    }

    return {
      success: true,
      todos,
    };
  }

  private async clearCompleted(): Promise<TodoWriteResult> {
    const todos = await this.loadTodos();
    const beforeCount = todos.length;
    const filteredTodos = todos.filter(t => t.status !== 'completed');
    const cleared = beforeCount - filteredTodos.length;

    await this.saveTodos(filteredTodos);

    return {
      success: true,
      cleared,
    };
  }

  private async getStats(): Promise<TodoWriteResult> {
    const todos = await this.loadTodos();

    const stats = {
      total: todos.length,
      pending: todos.filter(t => t.status === 'pending').length,
      in_progress: todos.filter(t => t.status === 'in_progress').length,
      completed: todos.filter(t => t.status === 'completed').length,
      cancelled: todos.filter(t => t.status === 'cancelled').length,
      byPriority: {
        low: todos.filter(t => t.priority === 'low').length,
        medium: todos.filter(t => t.priority === 'medium').length,
        high: todos.filter(t => t.priority === 'high').length,
        urgent: todos.filter(t => t.priority === 'urgent').length,
      },
    };

    return {
      success: true,
      stats,
    };
  }

  private async loadTodos(): Promise<Todo[]> {
    try {
      const content = await readFile(this.todoFile, 'utf-8');
      return JSON.parse(content);
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        return [];
      }
      throw error;
    }
  }

  private async saveTodos(todos: Todo[]): Promise<void> {
    // Ensure directory exists
    const dir = dirname(this.todoFile);
    await mkdir(dir, { recursive: true });

    await writeFile(this.todoFile, JSON.stringify(todos, null, 2), 'utf-8');
  }
}
