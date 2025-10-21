/**
 * Local Output Extractor
 * 
 * Extrai outputs disponíveis localmente (para automações não salvas ainda)
 * Espelha a lógica do backend nodeOutputExtractor.ts
 */

interface Node {
  id: string;
  data: {
    label?: string;
    toolId?: string;
    config?: any;
  };
}

interface Edge {
  source: string;
  target: string;
}

/**
 * Obtém nodes pai de um node específico (recursivo)
 */
export function getParentNodes(edges: Edge[], targetNodeId: string): string[] {
  const parents = new Set<string>();
  const visited = new Set<string>();
  
  function findParents(nodeId: string) {
    if (visited.has(nodeId)) return;
    visited.add(nodeId);
    
    const parentEdges = edges.filter((e) => e.target === nodeId);
    parentEdges.forEach((edge) => {
      if (!parents.has(edge.source)) {
        parents.add(edge.source);
        findParents(edge.source); // Recursivo
      }
    });
  }
  
  findParents(targetNodeId);
  return Array.from(parents).sort();
}

/**
 * Extrai chaves de output baseado no tipo de tool
 */
export function getOutputKeysForTool(toolId: string): string[] {
  const outputMap: Record<string, string[]> = {
    // Webhooks
    'webhook-trigger': ['data', 'message', 'timestamp', 'source', 'rawData'],
    'webhook-response': ['sent', 'statusCode', 'response'],
    
    // HTTP
    'http-request': ['body', 'status', 'headers', 'statusText', 'duration'],
    
    // File Operations
    'file-read': ['content', 'path', 'size', 'encoding'],
    'file-write': ['path', 'written', 'bytes'],
    'file-edit': ['path', 'modified', 'content'],
    'file-search': ['files', 'count', 'paths'],
    
    // Text Operations
    'text-search': ['matches', 'count', 'results', 'found'],
    
    // System
    'system-info': ['platform', 'arch', 'cpus', 'memory', 'uptime'],
    'shell-executor': ['stdout', 'stderr', 'exitCode', 'duration'],
    
    // Data Operations
    'data-transform': ['result', 'transformed', 'count'],
    'data-filter': ['filtered', 'count', 'items'],
    'data-merge': ['merged', 'result'],
    
    // Control Flow
    'universal-condition': ['branch', 'matched', 'input', 'conditionMatched'],
    'delay': ['delayed', 'duration', 'completedAt', 'message'],
    
    // AI/Agent
    'agent-executor': ['response', 'agentName', 'tokensUsed', 'executionTime', 'model'],
    
    // Custom
    'custom-code': ['output', 'result', 'logs', 'error'],
  };
  
  return outputMap[toolId] || ['output', 'result', 'data'];
}

/**
 * Calcula outputs disponíveis localmente (sem API)
 */
export function calculateLocalOutputs(
  nodes: Node[],
  edges: Edge[],
  currentNodeId: string
): Array<{
  nodeId: string;
  nodeName: string;
  toolId?: string;
  outputKeys: string[];
}> {
  // Encontrar nodes pai
  const parentNodeIds = getParentNodes(edges, currentNodeId);
  
  // Para cada node pai, extrair outputs
  const availableOutputs = parentNodeIds
    .map((parentId) => {
      const parentNode = nodes.find((n) => n.id === parentId);
      if (!parentNode) return null;
      
      const toolId = parentNode.data.toolId;
      if (!toolId) return null;
      
      const outputKeys = getOutputKeysForTool(toolId);
      
      return {
        nodeId: parentId,
        nodeName: parentNode.data.label || 'Node',
        toolId: toolId,
        outputKeys: outputKeys,
      };
    })
    .filter(Boolean) as Array<{
      nodeId: string;
      nodeName: string;
      toolId?: string;
      outputKeys: string[];
    }>;
  
  return availableOutputs;
}
