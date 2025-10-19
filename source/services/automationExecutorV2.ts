/**
 * FLUI - Automation Executor V2
 * 
 * Nova versão completamente dinâmica baseada no FlowEngine
 * Remove todo código hard-coded e usa apenas o Tool Registry
 */

import { nanoid } from 'nanoid';
import {
  Automation,
  AutomationExecution,
  AutomationNode,
  ExecutionLog,
} from '../types/automation.js';
import { FlowEngine, executeFlow } from '../core/flowEngine.js';
import {
  FlowDefinition,
  FlowNode,
  FlowEdge,
  FlowNodeType,
} from '../core/flowTypes.js';

/**
 * Converte uma Automation (formato antigo) para FlowDefinition (novo formato)
 */
export function convertAutomationToFlow(automation: Automation): FlowDefinition {
  const nodes: FlowNode[] = [];
  const edges: FlowEdge[] = [];

  // Converter cada nó
  for (const node of automation.nodes) {
    const flowNode = convertNodeToFlowNode(node);
    nodes.push(flowNode);

    // Criar edges baseados em nextNodes
    for (const nextNodeId of node.nextNodes) {
      edges.push({
        id: nanoid(),
        source: node.id,
        target: nextNodeId,
      });
    }
  }

  return {
    id: automation.id,
    name: automation.name,
    description: automation.description,
    version: '2.0.0',
    nodes,
    edges,
    startNodeId: automation.startNodeId,
    metadata: {
      createdAt: automation.createdAt,
      updatedAt: automation.updatedAt,
    },
  };
}

/**
 * Converte um AutomationNode para FlowNode
 */
function convertNodeToFlowNode(node: AutomationNode): FlowNode {
  const baseNode: FlowNode = {
    id: node.id,
    type: mapNodeTypeToFlowType(node.type),
    name: node.name,
    config: node.config || {},
    position: node.position,
  };

  // Mapear configurações específicas de cada tipo
  switch (node.type) {
    case 'agent':
      // Converter para tool que executa agente
      baseNode.type = 'tool';
      baseNode.config = {
        toolId: 'agent-executor',
        params: {
          agentId: node.config.agentId,
          prompt: node.config.prompt || '',
          payload: node.config.inputFrom
            ? { inputRef: `{{${node.config.inputFrom}}}` }
            : {},
        },
      };
      break;

    case 'mcp_tool':
      // Converter para tool do MCP
      baseNode.type = 'tool';
      baseNode.config = {
        toolId: `mcp-${node.config.mcpId}-${node.config.toolId}`,
        params: node.config.params || {},
      };
      break;

    case 'http_request':
      // Converter para HTTP Request Tool
      baseNode.type = 'tool';
      baseNode.config = {
        toolId: 'http-request',
        params: {
          url: node.config.url,
          method: node.config.method || 'GET',
          headers: node.config.headers || {},
          body: node.config.body,
        },
      };
      break;

    case 'file_operation':
      // Converter para File Tools
      const operation = node.config.operation;
      let toolId = 'file-read';
      let params: any = {};

      if (operation === 'read') {
        toolId = 'file-read';
        params = {
          path: node.config.filePath || node.config.filename,
        };
      } else if (operation === 'write') {
        toolId = 'file-write';
        params = {
          path: node.config.filePath || node.config.filename,
          content: node.config.content || '',
          mode: 'overwrite',
        };
      }

      baseNode.type = 'tool';
      baseNode.config = {
        toolId,
        params,
      };
      break;

    case 'condition':
      baseNode.config = {
        condition: node.config.condition || 'true',
        trueNodeId: node.config.trueBranch,
        falseNodeId: node.config.falseBranch,
      };
      break;

    case 'loop':
      baseNode.config = {
        items: node.config.items || [],
        loopNodeId: node.config.loopNodeId,
        maxIterations: 1000,
      };
      break;

    case 'delay':
      baseNode.config = {
        duration: node.config.delayMs || 1000,
      };
      break;

    case 'data_transform':
      // Converter para Custom Code Tool
      baseNode.type = 'tool';
      baseNode.config = {
        toolId: 'custom-code',
        params: {
          language: 'javascript',
          code: `output = ${node.config.transform || 'input'}`,
          input: node.config.inputFrom
            ? { inputRef: `{{${node.config.inputFrom}}}` }
            : {},
        },
      };
      break;

    case 'trigger':
      // Trigger é apenas um nó inicial que passa dados
      baseNode.type = 'tool';
      baseNode.config = {
        toolId: 'system-info', // Usar uma tool simples como placeholder
        params: {},
      };
      break;

    default:
      // Tipos desconhecidos viram tool genérica
      baseNode.type = 'tool';
      baseNode.config = node.config;
  }

  return baseNode;
}

/**
 * Mapeia tipo de nó antigo para novo
 */
function mapNodeTypeToFlowType(oldType: string): FlowNodeType {
  const mapping: Record<string, FlowNodeType> = {
    trigger: 'tool',
    agent: 'tool',
    mcp_tool: 'tool',
    http_request: 'tool',
    file_operation: 'tool',
    data_transform: 'tool',
    condition: 'condition',
    loop: 'loop',
    delay: 'delay',
    webhook: 'tool',
  };

  return mapping[oldType] || 'tool';
}

/**
 * Executor de automação V2 - usa FlowEngine internamente
 */
export class AutomationExecutorV2 {
  private automation: Automation;
  private onLog: (log: ExecutionLog) => void;

  constructor(automation: Automation, onLog: (log: ExecutionLog) => void) {
    this.automation = automation;
    this.onLog = onLog;
  }

  async execute(initialData?: Record<string, any>): Promise<AutomationExecution> {
    // Converter automação para flow
    const flow = convertAutomationToFlow(this.automation);

    // Executar usando FlowEngine
    const flowExecution = await executeFlow(
      flow,
      initialData,
      (flowLog) => {
        // Converter log do flow para log de automação
        const log: ExecutionLog = {
          timestamp: flowLog.timestamp,
          nodeId: flowLog.nodeId,
          nodeName: flowLog.nodeName,
          status: flowLog.status,
          message: flowLog.message,
          data: flowLog.data,
          error: flowLog.error,
        };
        this.onLog(log);
      }
    );

    // Converter execução do flow para AutomationExecution
    const automationExecution: AutomationExecution = {
      id: flowExecution.id,
      automationId: this.automation.id,
      status: flowExecution.status,
      startedAt: flowExecution.startedAt,
      completedAt: flowExecution.completedAt,
      logs: flowExecution.logs.map((flowLog) => ({
        timestamp: flowLog.timestamp,
        nodeId: flowLog.nodeId,
        nodeName: flowLog.nodeName,
        status: flowLog.status,
        message: flowLog.message,
        data: flowLog.data,
        error: flowLog.error,
      })),
      result: flowExecution.result,
      error: flowExecution.error,
    };

    return automationExecution;
  }
}

/**
 * Helper para executar automação com novo executor
 */
export async function executeAutomationV2(
  automation: Automation,
  onLog: (log: ExecutionLog) => void,
  initialData?: Record<string, any>
): Promise<AutomationExecution> {
  const executor = new AutomationExecutorV2(automation, onLog);
  return await executor.execute(initialData);
}
