/**
 * FLUI - MCP Client
 * 
 * Cliente para comunicação com MCPs via JSON-RPC sobre stdio
 * Implementa o Model Context Protocol corretamente
 */

import { spawn, ChildProcess } from 'child_process';
import { EventEmitter } from 'events';

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: string;
    properties?: Record<string, any>;
    required?: string[];
  };
}

export interface MCPServerInfo {
  name: string;
  version: string;
  instructions?: string;
}

export interface MCPCapabilities {
  tools?: {
    listChanged?: boolean;
  };
  resources?: any;
  prompts?: any;
}

export interface MCPInitializeResult {
  protocolVersion: string;
  capabilities: MCPCapabilities;
  serverInfo: MCPServerInfo;
}

/**
 * Cliente MCP que se comunica via JSON-RPC sobre stdio
 */
export class MCPClient extends EventEmitter {
  private process: ChildProcess | null = null;
  private messageQueue: Array<{
    id: number;
    resolve: (value: any) => void;
    reject: (error: Error) => void;
  }> = [];
  private currentId = 0;
  private buffer = '';
  private initialized = false;

  /**
   * Conecta ao servidor MCP
   */
  async connect(command: string, args: string[] = []): Promise<MCPInitializeResult> {
    console.log(`🔌 [MCPClient] Conectando ao MCP: ${command} ${args.join(' ')}`);

    return new Promise((resolve, reject) => {
      // Spawn do processo MCP
      this.process = spawn(command, args, {
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      if (!this.process.stdout || !this.process.stdin || !this.process.stderr) {
        return reject(new Error('Falha ao criar processo MCP'));
      }

      // Configurar listeners
      this.process.stdout.on('data', (data) => {
        this.handleData(data.toString());
      });

      this.process.stderr.on('data', (data) => {
        const message = data.toString();
        // Ignorar mensagens informativas do stderr
        if (!message.includes('running on stdio')) {
          console.log(`📝 [MCPClient] stderr: ${message}`);
        }
      });

      this.process.on('error', (error) => {
        console.error('❌ [MCPClient] Erro no processo:', error);
        reject(error);
      });

      this.process.on('exit', (code) => {
        console.log(`🔚 [MCPClient] Processo encerrado com código: ${code}`);
      });

      // Enviar initialize
      this.sendRequest('initialize', {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: {
          name: 'flui',
          version: '1.0.0',
        },
      })
        .then((result) => {
          this.initialized = true;
          console.log('✅ [MCPClient] Inicializado com sucesso');
          resolve(result as MCPInitializeResult);
        })
        .catch(reject);
    });
  }

  /**
   * Lista as tools disponíveis no servidor MCP
   */
  async listTools(): Promise<MCPTool[]> {
    if (!this.initialized) {
      throw new Error('MCP não inicializado. Chame connect() primeiro.');
    }

    console.log('📋 [MCPClient] Listando tools...');

    const result = await this.sendRequest('tools/list', {});
    const tools = (result as any).tools || [];

    console.log(`✅ [MCPClient] ${tools.length} tools encontradas`);

    return tools;
  }

  /**
   * Chama uma tool específica
   */
  async callTool(name: string, args: Record<string, any> = {}): Promise<any> {
    if (!this.initialized) {
      throw new Error('MCP não inicializado. Chame connect() primeiro.');
    }

    console.log(`🔧 [MCPClient] Chamando tool: ${name}`);

    const result = await this.sendRequest('tools/call', {
      name,
      arguments: args,
    });

    return result;
  }

  /**
   * Desconecta do servidor MCP
   */
  disconnect(): void {
    if (this.process) {
      this.process.kill();
      this.process = null;
      this.initialized = false;
      console.log('🔌 [MCPClient] Desconectado');
    }
  }

  /**
   * Envia uma requisição JSON-RPC
   */
  private async sendRequest(method: string, params: any): Promise<any> {
    if (!this.process || !this.process.stdin) {
      throw new Error('Processo MCP não está rodando');
    }

    const id = ++this.currentId;
    const request = {
      jsonrpc: '2.0',
      id,
      method,
      params,
    };

    return new Promise((resolve, reject) => {
      // Adicionar à fila
      this.messageQueue.push({ id, resolve, reject });

      // Enviar requisição
      const message = JSON.stringify(request) + '\n';
      this.process!.stdin!.write(message);

      // Timeout de 30s
      setTimeout(() => {
        const index = this.messageQueue.findIndex((item) => item.id === id);
        if (index !== -1) {
          this.messageQueue.splice(index, 1);
          reject(new Error(`Timeout ao aguardar resposta do método ${method}`));
        }
      }, 30000);
    });
  }

  /**
   * Processa dados recebidos do stdout
   */
  private handleData(data: string): void {
    this.buffer += data;

    // Processar mensagens completas (separadas por \n)
    const lines = this.buffer.split('\n');
    this.buffer = lines.pop() || ''; // Manter linha incompleta no buffer

    for (const line of lines) {
      if (!line.trim()) continue;

      try {
        const message = JSON.parse(line);
        this.handleMessage(message);
      } catch (error) {
        console.error('❌ [MCPClient] Erro ao parsear mensagem:', line);
      }
    }
  }

  /**
   * Processa uma mensagem JSON-RPC
   */
  private handleMessage(message: any): void {
    // Resposta a uma requisição
    if (message.id !== undefined) {
      const queueItem = this.messageQueue.find((item) => item.id === message.id);
      if (queueItem) {
        // Remover da fila
        const index = this.messageQueue.indexOf(queueItem);
        this.messageQueue.splice(index, 1);

        // Resolver ou rejeitar
        if (message.error) {
          queueItem.reject(new Error(message.error.message || 'Erro MCP'));
        } else {
          queueItem.resolve(message.result);
        }
      }
    }
    // Notificação (não tem id)
    else if (message.method) {
      this.emit('notification', message);
    }
  }
}

/**
 * Conecta a um MCP via NPX e extrai suas tools
 */
export async function connectAndExtractTools(
  packageName: string
): Promise<{ serverInfo: MCPServerInfo; tools: MCPTool[] }> {
  const client = new MCPClient();

  try {
    // Conectar ao MCP
    const initResult = await client.connect('npx', ['-y', packageName]);

    // Listar tools
    const tools = await client.listTools();

    return {
      serverInfo: initResult.serverInfo,
      tools,
    };
  } finally {
    // Sempre desconectar
    client.disconnect();
  }
}

/**
 * Testa a conexão com um MCP
 */
export async function testMCPConnection(
  packageName: string
): Promise<{ success: boolean; message: string; toolCount: number }> {
  try {
    const { serverInfo, tools } = await connectAndExtractTools(packageName);

    return {
      success: true,
      message: `Conectado ao ${serverInfo.name} v${serverInfo.version}`,
      toolCount: tools.length,
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message,
      toolCount: 0,
    };
  }
}
