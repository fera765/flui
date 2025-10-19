import { nanoid } from 'nanoid';
import {
  Automation,
  AutomationExecution,
  AutomationNode,
  ExecutionLog,
  ExecutionStatus,
} from '../types/automation.js';
import { Sandbox, createSandbox } from './sandbox.js';
import { useStore } from '../store/store.js';
import { sendStreamingMessage } from './streaming.js';
import { createFileReader } from './fileReader.js';

export class AutomationExecutor {
  private automation: Automation;
  private execution: AutomationExecution;
  private sandbox: Sandbox | null = null;
  private onLog: (log: ExecutionLog) => void;

  constructor(automation: Automation, onLog: (log: ExecutionLog) => void) {
    this.automation = automation;
    this.onLog = onLog;
    this.execution = {
      id: nanoid(),
      automationId: automation.id,
      status: 'pending',
      startedAt: new Date().toISOString(),
      logs: [],
    };
  }

  private log(
    nodeId: string,
    nodeName: string,
    status: ExecutionStatus,
    message: string,
    data?: any,
    error?: string
  ): void {
    const log: ExecutionLog = {
      timestamp: new Date().toISOString(),
      nodeId,
      nodeName,
      status,
      message,
      data,
      error,
    };
    this.execution.logs.push(log);
    this.onLog(log);
  }

  async execute(): Promise<AutomationExecution> {
    this.execution.status = 'running';
    this.log('root', 'Automação', 'running', `Iniciando execução: ${this.automation.name}`);

    try {
      // Criar sandbox isolado para esta automação
      this.sandbox = await createSandbox();
      this.log(
        'sandbox',
        'Sandbox',
        'running',
        `Sandbox criado: ${this.sandbox.getSandboxPath()}`
      );

      // Encontrar nó inicial
      const startNode = this.automation.nodes.find((n) => n.id === this.automation.startNodeId);
      if (!startNode) {
        throw new Error('Nó inicial não encontrado');
      }

      // Executar a partir do nó inicial
      const context: Record<string, any> = {};
      await this.executeNode(startNode, context);

      this.execution.status = 'completed';
      this.execution.completedAt = new Date().toISOString();
      this.execution.result = context;
      this.log('root', 'Automação', 'completed', 'Execução concluída com sucesso');
    } catch (error: any) {
      this.execution.status = 'failed';
      this.execution.completedAt = new Date().toISOString();
      this.execution.error = error.message;
      this.log('root', 'Automação', 'failed', `Erro: ${error.message}`, undefined, error.message);
    } finally {
      // Limpar sandbox
      if (this.sandbox) {
        await this.sandbox.cleanup();
        this.log('sandbox', 'Sandbox', 'completed', 'Sandbox limpo');
      }
    }

    return this.execution;
  }

  private async executeNode(node: AutomationNode, context: Record<string, any>): Promise<void> {
    this.log(node.id, node.name, 'running', `Executando nó: ${node.type}`);

    try {
      switch (node.type) {
        case 'trigger':
          await this.executeTrigger(node, context);
          break;
        case 'agent':
          await this.executeAgent(node, context);
          break;
        case 'mcp_tool':
          await this.executeMCPTool(node, context);
          break;
        case 'condition':
          await this.executeCondition(node, context);
          break;
        case 'loop':
          await this.executeLoop(node, context);
          break;
        case 'delay':
          await this.executeDelay(node, context);
          break;
        case 'http_request':
          await this.executeHTTPRequest(node, context);
          break;
        case 'file_operation':
          await this.executeFileOperation(node, context);
          break;
        case 'data_transform':
          await this.executeDataTransform(node, context);
          break;
        default:
          throw new Error(`Tipo de nó desconhecido: ${node.type}`);
      }

      this.log(node.id, node.name, 'completed', `Nó concluído: ${node.type}`, context[node.id]);

      // Executar próximos nós
      for (const nextNodeId of node.nextNodes) {
        const nextNode = this.automation.nodes.find((n) => n.id === nextNodeId);
        if (nextNode) {
          await this.executeNode(nextNode, context);
        }
      }
    } catch (error: any) {
      this.log(
        node.id,
        node.name,
        'failed',
        `Erro ao executar nó: ${error.message}`,
        undefined,
        error.message
      );
      throw error;
    }
  }

  private async executeTrigger(node: AutomationNode, context: Record<string, any>): Promise<void> {
    context[node.id] = {
      triggered: true,
      timestamp: new Date().toISOString(),
      data: node.config.data || {},
    };
  }

  private async executeAgent(node: AutomationNode, context: Record<string, any>): Promise<void> {
    const store = useStore.getState();
    const agent = store.agents.find((a) => a.id === node.config.agentId);

    if (!agent) {
      throw new Error(`Agente não encontrado: ${node.config.agentId}`);
    }

    const prompt = node.config.prompt || '';
    const inputData = node.config.inputFrom
      ? context[node.config.inputFrom]
      : context;

    const fullPrompt = `${prompt}\n\nDados de entrada: ${JSON.stringify(inputData, null, 2)}`;

    let response = '';
    await new Promise<void>((resolve, reject) => {
      sendStreamingMessage(
        fullPrompt,
        agent,
        (chunk) => {
          response += chunk;
        },
        () => resolve(),
        (error) => reject(error)
      );
    });

    context[node.id] = {
      agent: agent.name,
      prompt: fullPrompt,
      response,
    };
  }

  private async executeMCPTool(
    node: AutomationNode,
    context: Record<string, any>
  ): Promise<void> {
    const store = useStore.getState();
    const mcp = store.mcps.find((m) => m.id === node.config.mcpId);

    if (!mcp) {
      throw new Error(`MCP não encontrado: ${node.config.mcpId}`);
    }

    const tool = mcp.tools.find((t) => t.id === node.config.toolId);
    if (!tool) {
      throw new Error(`Tool não encontrada: ${node.config.toolId}`);
    }

    // Executar tool baseado no handler
    const params = node.config.params || {};
    const result = await this.executeToolHandler(tool.handler, params);

    context[node.id] = {
      mcp: mcp.name,
      tool: tool.name,
      params,
      result,
    };
  }

  private async executeToolHandler(handler: string, params: any): Promise<any> {
    if (!this.sandbox) {
      throw new Error('Sandbox não inicializado');
    }

    if (handler.startsWith('filesystem.')) {
      const operation = handler.split('.')[1];
      if (operation === 'readFile') {
        return await this.sandbox.readFile(params.path);
      } else if (operation === 'writeFile') {
        await this.sandbox.writeFile(params.path, params.content);
        return { success: true };
      }
    } else if (handler.startsWith('execution.')) {
      const lang = handler.split('.')[1];
      if (lang === 'javascript') {
        return await this.sandbox.executeJavaScript(params.code);
      } else if (lang === 'python') {
        return await this.sandbox.executePython(params.code);
      } else if (lang === 'shell') {
        return await this.sandbox.executeShell(params.command);
      }
    }

    return { success: false, message: 'Handler não implementado' };
  }

  private async executeCondition(
    node: AutomationNode,
    context: Record<string, any>
  ): Promise<void> {
    const condition = node.config.condition || '';
    const inputData = node.config.inputFrom ? context[node.config.inputFrom] : context;

    // Avaliar condição
    const result = this.evaluateCondition(condition, inputData);

    context[node.id] = {
      condition,
      result,
      inputData,
    };

    // Executar branch baseado na condição
    if (result && node.config.trueBranch) {
      const trueNode = this.automation.nodes.find((n) => n.id === node.config.trueBranch);
      if (trueNode) {
        await this.executeNode(trueNode, context);
      }
    } else if (!result && node.config.falseBranch) {
      const falseNode = this.automation.nodes.find((n) => n.id === node.config.falseBranch);
      if (falseNode) {
        await this.executeNode(falseNode, context);
      }
    }
  }

  private evaluateCondition(condition: string, data: any): boolean {
    try {
      // Avaliação segura de condição
      const fn = new Function('data', `return ${condition}`);
      return fn(data);
    } catch {
      return false;
    }
  }

  private async executeLoop(node: AutomationNode, context: Record<string, any>): Promise<void> {
    const items = node.config.items || [];
    const results: any[] = [];

    for (const item of items) {
      const loopContext: Record<string, any> = { ...context, currentItem: item };

      // Executar nós do loop
      if (node.config.loopNodeId) {
        const loopNode = this.automation.nodes.find((n) => n.id === node.config.loopNodeId);
        if (loopNode) {
          await this.executeNode(loopNode, loopContext);
          results.push(loopContext[loopNode.id]);
        }
      }
    }

    context[node.id] = {
      itemCount: items.length,
      results,
    };
  }

  private async executeDelay(node: AutomationNode, context: Record<string, any>): Promise<void> {
    const delayMs = node.config.delayMs || 1000;
    await new Promise((resolve) => setTimeout(resolve, delayMs));

    context[node.id] = {
      delayed: delayMs,
    };
  }

  private async executeHTTPRequest(
    node: AutomationNode,
    context: Record<string, any>
  ): Promise<void> {
    const url = node.config.url || '';
    const method = node.config.method || 'GET';
    const headers = node.config.headers || {};
    const body = node.config.body;

    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await response.json().catch(() => response.text());

    context[node.id] = {
      url,
      method,
      status: response.status,
      data,
    };
  }

  private async executeFileOperation(
    node: AutomationNode,
    context: Record<string, any>
  ): Promise<void> {
    if (!this.sandbox) {
      throw new Error('Sandbox não inicializado');
    }

    const operation = node.config.operation || 'read';
    const filename = node.config.filename || 'output.txt';
    const filePath = node.config.filePath; // Caminho absoluto opcional

    if (operation === 'read') {
      if (filePath) {
        // Ler arquivo externo usando FileReader
        const fileReader = createFileReader();
        const fileContent = await fileReader.readFile(filePath);
        
        context[node.id] = {
          operation,
          filename: filePath,
          content: fileContent.content,
          type: fileContent.type,
          metadata: fileContent.metadata,
        };
      } else {
        // Ler do sandbox
        const content = await this.sandbox.readFile(filename);
        context[node.id] = { operation, filename, content };
      }
    } else if (operation === 'write') {
      const content = node.config.content || '';
      await this.sandbox.writeFile(filename, content);
      context[node.id] = { operation, filename, success: true };
    } else if (operation === 'read_contacts') {
      // Operação especializada para ler contatos
      if (!filePath) {
        throw new Error('filePath é obrigatório para read_contacts');
      }
      const fileReader = createFileReader();
      const contacts = await fileReader.readContactsFromFile(filePath);
      
      context[node.id] = {
        operation,
        filename: filePath,
        contacts,
        count: contacts.length,
      };
    }
  }

  private async executeDataTransform(
    node: AutomationNode,
    context: Record<string, any>
  ): Promise<void> {
    const inputData = node.config.inputFrom ? context[node.config.inputFrom] : context;
    const transformCode = node.config.transform || 'data';

    try {
      const fn = new Function('data', `return ${transformCode}`);
      const result = fn(inputData);

      context[node.id] = {
        input: inputData,
        output: result,
      };
    } catch (error: any) {
      throw new Error(`Erro ao transformar dados: ${error.message}`);
    }
  }
}

export const executeAutomation = async (
  automation: Automation,
  onLog: (log: ExecutionLog) => void
): Promise<AutomationExecution> => {
  const executor = new AutomationExecutor(automation, onLog);
  return await executor.execute();
};
