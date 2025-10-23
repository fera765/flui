/**
 * Task Tool - Execute background tasks in sandbox
 * Executes only in automation sandbox
 */

import { spawn, ChildProcess } from 'child_process';
import { randomBytes } from 'crypto';

const generateId = () => randomBytes(8).toString('hex');

export interface TaskParams {
  name?: string;
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  cwd?: string;
  action?: 'start' | 'status' | 'cancel' | 'list';
  taskId?: string;
}

export interface TaskResult {
  success: boolean;
  taskId?: string;
  name?: string;
  status?: 'running' | 'completed' | 'failed' | 'cancelled';
  output?: string;
  error?: string;
  tasks?: Array<{
    taskId: string;
    name: string;
    status: string;
  }>;
}

interface Task {
  id: string;
  name: string;
  process: ChildProcess;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  output: string[];
  error?: string;
  startedAt: Date;
  completedAt?: Date;
}

export class TaskTool {
  private static tasks: Map<string, Task> = new Map();

  async execute(params: TaskParams): Promise<TaskResult> {
    const action = params.action || 'start';

    switch (action) {
      case 'start':
        return this.startTask(params);
      case 'status':
        return this.getStatus(params.taskId!);
      case 'cancel':
        return this.cancelTask(params.taskId!);
      case 'list':
        return this.listTasks();
      default:
        return {
          success: false,
          error: `Unknown action: ${action}`,
        };
    }
  }

  private async startTask(params: TaskParams): Promise<TaskResult> {
    try {
      const taskId = generateId();
      const name = params.name || `task-${taskId}`;

      // Parse command
      let command: string;
      let args: string[] = [];

      if (params.command) {
        const parts = params.command.split(' ');
        command = parts[0];
        args = parts.slice(1);
      } else {
        return {
          success: false,
          error: 'Command is required',
        };
      }

      // Spawn process
      const childProcess = spawn(command, args, {
        env: { ...process.env, ...params.env },
        cwd: params.cwd,
        shell: true,
      });

      const task: Task = {
        id: taskId,
        name,
        process: childProcess,
        status: 'running',
        output: [],
        startedAt: new Date(),
      };

      // Capture output
      childProcess.stdout?.on('data', (data: Buffer) => {
        task.output.push(data.toString());
      });

      childProcess.stderr?.on('data', (data: Buffer) => {
        task.output.push(`[ERROR] ${data.toString()}`);
      });

      // Handle completion
      childProcess.on('exit', (code: number | null) => {
        if (task.status === 'running') {
          task.status = code === 0 ? 'completed' : 'failed';
          task.completedAt = new Date();
        }
      });

      TaskTool.tasks.set(taskId, task);

      return {
        success: true,
        taskId,
        name,
        status: 'running',
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  private async getStatus(taskId: string): Promise<TaskResult> {
    const task = TaskTool.tasks.get(taskId);

    if (!task) {
      return {
        success: false,
        error: `Task not found: ${taskId}`,
      };
    }

    return {
      success: true,
      taskId: task.id,
      name: task.name,
      status: task.status,
      output: task.output.join('\n'),
      error: task.error,
    };
  }

  private async cancelTask(taskId: string): Promise<TaskResult> {
    const task = TaskTool.tasks.get(taskId);

    if (!task) {
      return {
        success: false,
        error: `Task not found: ${taskId}`,
      };
    }

    if (task.status !== 'running') {
      return {
        success: false,
        error: `Task is not running: ${task.status}`,
      };
    }

    task.process.kill('SIGTERM');
    task.status = 'cancelled';
    task.completedAt = new Date();

    return {
      success: true,
      taskId: task.id,
      status: 'cancelled',
    };
  }

  private async listTasks(): Promise<TaskResult> {
    const tasks = Array.from(TaskTool.tasks.values()).map(task => ({
      taskId: task.id,
      name: task.name,
      status: task.status,
    }));

    return {
      success: true,
      tasks,
    };
  }
}
