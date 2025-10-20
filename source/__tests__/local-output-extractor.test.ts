/**
 * FLUI - Local Output Extractor Tests
 * 
 * Testa o sistema de extração local de outputs (para automações não salvas)
 */

import { describe, it, expect } from 'vitest';

// Mock da função que será usada no frontend
function getParentNodesLocal(edges: any[], targetNodeId: string): string[] {
  const parents = new Set<string>();
  const visited = new Set<string>();
  
  function findParents(nodeId: string) {
    if (visited.has(nodeId)) return;
    visited.add(nodeId);
    
    const parentEdges = edges.filter((e: any) => e.target === nodeId);
    parentEdges.forEach((edge: any) => {
      if (!parents.has(edge.source)) {
        parents.add(edge.source);
        findParents(edge.source);
      }
    });
  }
  
  findParents(targetNodeId);
  return Array.from(parents).sort();
}

function calculateLocalOutputsTest(
  nodes: any[],
  edges: any[],
  currentNodeId: string
): any[] {
  const parentNodeIds = getParentNodesLocal(edges, currentNodeId);
  
  const availableOutputs = parentNodeIds
    .map((parentId) => {
      const parentNode = nodes.find((n) => n.id === parentId);
      if (!parentNode) return null;
      
      const toolId = parentNode.data.toolId;
      if (!toolId) return null;
      
      // Outputs padrão por tool
      const outputMap: Record<string, string[]> = {
        'webhook-trigger': ['data', 'message', 'timestamp'],
        'data-transform': ['result', 'transformed'],
        'http-request': ['body', 'status', 'headers'],
      };
      
      const outputKeys = outputMap[toolId] || ['output', 'result'];
      
      return {
        nodeId: parentId,
        nodeName: parentNode.data.label || 'Node',
        toolId: toolId,
        outputKeys: outputKeys,
      };
    })
    .filter(Boolean);
  
  return availableOutputs;
}

describe('Local Output Extractor', () => {
  describe('getParentNodes', () => {
    it('should find direct parent', () => {
      const edges = [
        { source: 'node-1', target: 'node-2' },
      ];

      const parents = getParentNodesLocal(edges, 'node-2');

      expect(parents).toEqual(['node-1']);
    });

    it('should find multiple parents', () => {
      const edges = [
        { source: 'node-1', target: 'node-3' },
        { source: 'node-2', target: 'node-3' },
      ];

      const parents = getParentNodesLocal(edges, 'node-3');

      expect(parents).toContain('node-1');
      expect(parents).toContain('node-2');
      expect(parents.length).toBe(2);
    });

    it('should find parents recursively', () => {
      const edges = [
        { source: 'node-1', target: 'node-2' },
        { source: 'node-2', target: 'node-3' },
        { source: 'node-3', target: 'node-4' },
      ];

      const parents = getParentNodesLocal(edges, 'node-4');

      expect(parents).toContain('node-1');
      expect(parents).toContain('node-2');
      expect(parents).toContain('node-3');
      expect(parents.length).toBe(3);
    });

    it('should handle node with no parents', () => {
      const edges = [
        { source: 'node-1', target: 'node-2' },
      ];

      const parents = getParentNodesLocal(edges, 'node-1');

      expect(parents).toEqual([]);
    });

    it('should handle complex graph', () => {
      const edges = [
        { source: 'node-1', target: 'node-2' },
        { source: 'node-1', target: 'node-3' },
        { source: 'node-2', target: 'node-4' },
        { source: 'node-3', target: 'node-4' },
      ];

      const parents = getParentNodesLocal(edges, 'node-4');

      expect(parents).toContain('node-1');
      expect(parents).toContain('node-2');
      expect(parents).toContain('node-3');
      expect(parents.length).toBe(3);
    });

    it('should handle circular references gracefully', () => {
      const edges = [
        { source: 'node-1', target: 'node-2' },
        { source: 'node-2', target: 'node-1' }, // Circular
      ];

      const parents = getParentNodesLocal(edges, 'node-2');

      expect(parents).toContain('node-1');
      // No caso circular, pode retornar ambos (comportamento aceitável)
      expect(parents.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('calculateLocalOutputs', () => {
    it('should calculate outputs for node with one parent', () => {
      const nodes = [
        {
          id: 'node-1',
          data: { toolId: 'webhook-trigger', label: 'Webhook' },
        },
        {
          id: 'node-2',
          data: { toolId: 'data-transform', label: 'Transform' },
        },
      ];

      const edges = [
        { source: 'node-1', target: 'node-2' },
      ];

      const outputs = calculateLocalOutputsTest(nodes, edges, 'node-2');

      expect(outputs.length).toBe(1);
      expect(outputs[0].nodeId).toBe('node-1');
      expect(outputs[0].nodeName).toBe('Webhook');
      expect(outputs[0].outputKeys).toContain('data');
      expect(outputs[0].outputKeys).toContain('message');
    });

    it('should calculate outputs for node with multiple parents', () => {
      const nodes = [
        {
          id: 'node-1',
          data: { toolId: 'webhook-trigger', label: 'Webhook' },
        },
        {
          id: 'node-2',
          data: { toolId: 'http-request', label: 'HTTP' },
        },
        {
          id: 'node-3',
          data: { toolId: 'data-transform', label: 'Transform' },
        },
      ];

      const edges = [
        { source: 'node-1', target: 'node-3' },
        { source: 'node-2', target: 'node-3' },
      ];

      const outputs = calculateLocalOutputsTest(nodes, edges, 'node-3');

      expect(outputs.length).toBe(2);
      
      const webhookOutput = outputs.find((o) => o.nodeId === 'node-1');
      expect(webhookOutput?.outputKeys).toContain('data');
      
      const httpOutput = outputs.find((o) => o.nodeId === 'node-2');
      expect(httpOutput?.outputKeys).toContain('body');
    });

    it('should handle deep hierarchy', () => {
      const nodes = [
        { id: 'node-1', data: { toolId: 'webhook-trigger', label: 'Start' } },
        { id: 'node-2', data: { toolId: 'data-transform', label: 'Step 2' } },
        { id: 'node-3', data: { toolId: 'data-transform', label: 'Step 3' } },
        { id: 'node-4', data: { toolId: 'http-request', label: 'End' } },
      ];

      const edges = [
        { source: 'node-1', target: 'node-2' },
        { source: 'node-2', target: 'node-3' },
        { source: 'node-3', target: 'node-4' },
      ];

      const outputs = calculateLocalOutputsTest(nodes, edges, 'node-4');

      expect(outputs.length).toBe(3);
      expect(outputs.map((o) => o.nodeId)).toContain('node-1');
      expect(outputs.map((o) => o.nodeId)).toContain('node-2');
      expect(outputs.map((o) => o.nodeId)).toContain('node-3');
    });

    it('should return empty for first node', () => {
      const nodes = [
        { id: 'node-1', data: { toolId: 'webhook-trigger', label: 'First' } },
      ];

      const edges: any[] = [];

      const outputs = calculateLocalOutputsTest(nodes, edges, 'node-1');

      expect(outputs.length).toBe(0);
    });

    it('should ignore nodes without toolId', () => {
      const nodes = [
        { id: 'node-1', data: { label: 'Invalid Node' } }, // Sem toolId
        { id: 'node-2', data: { toolId: 'webhook-trigger', label: 'Valid' } },
        { id: 'node-3', data: { toolId: 'data-transform', label: 'Target' } },
      ];

      const edges = [
        { source: 'node-1', target: 'node-3' },
        { source: 'node-2', target: 'node-3' },
      ];

      const outputs = calculateLocalOutputsTest(nodes, edges, 'node-3');

      expect(outputs.length).toBe(1); // Apenas node-2 (node-1 sem toolId)
      expect(outputs[0].nodeId).toBe('node-2');
    });
  });

  describe('Realistic Workflow Scenarios', () => {
    it('should handle WhatsApp workflow', () => {
      const nodes = [
        { id: 'node-1', data: { toolId: 'webhook-trigger', label: 'Receber Mensagem' } },
        { id: 'node-2', data: { toolId: 'data-transform', label: 'Extrair Nome' } },
        { id: 'node-3', data: { toolId: 'http-request', label: 'Enviar Resposta' } },
      ];

      const edges = [
        { source: 'node-1', target: 'node-2' },
        { source: 'node-2', target: 'node-3' },
      ];

      // Node 3 deve ver outputs de node 1 e 2
      const outputs = calculateLocalOutputsTest(nodes, edges, 'node-3');

      expect(outputs.length).toBe(2);
      expect(outputs.find((o) => o.nodeName === 'Receber Mensagem')).toBeDefined();
      expect(outputs.find((o) => o.nodeName === 'Extrair Nome')).toBeDefined();
    });

    it('should handle conditional workflow', () => {
      const nodes = [
        { id: 'node-1', data: { toolId: 'webhook-trigger', label: 'Input' } },
        { id: 'node-2', data: { toolId: 'data-transform', label: 'Condition' } },
        { id: 'node-3a', data: { toolId: 'http-request', label: 'Branch A' } },
        { id: 'node-3b', data: { toolId: 'http-request', label: 'Branch B' } },
      ];

      const edges = [
        { source: 'node-1', target: 'node-2' },
        { source: 'node-2', target: 'node-3a' },
        { source: 'node-2', target: 'node-3b' },
      ];

      // Branch A deve ver node 1 e 2
      const outputsA = calculateLocalOutputsTest(nodes, edges, 'node-3a');
      expect(outputsA.length).toBe(2);

      // Branch B deve ver node 1 e 2
      const outputsB = calculateLocalOutputsTest(nodes, edges, 'node-3b');
      expect(outputsB.length).toBe(2);
    });
  });
});
