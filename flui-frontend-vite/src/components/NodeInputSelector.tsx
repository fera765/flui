/**
 * FLUI - Node Input Selector
 * 
 * Componente para selecionar quais chaves dos nodes anteriores
 * serão consumidas como input do node atual
 */

import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, CheckSquare, Square } from 'lucide-react';

interface InputMapping {
  sourceNodeId: string;
  sourceNodeName?: string;
  selectedKeys: string[];
  mapTo?: string;
}

interface NodeInputSelectorProps {
  currentNodeId: string;
  previousNodes: Array<{ id: string; name: string }>;
  currentMappings: InputMapping[];
  onChange: (mappings: InputMapping[]) => void;
}

export const NodeInputSelector: React.FC<NodeInputSelectorProps> = ({
  previousNodes,
  currentMappings,
  onChange,
}) => {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [nodeOutputs, setNodeOutputs] = useState<Map<string, string[]>>(new Map());
  const [mappings, setMappings] = useState<InputMapping[]>(currentMappings || []);

  useEffect(() => {
    // Carregar outputs disponíveis de cada node anterior
    loadNodeOutputs();
  }, [previousNodes]);

  const loadNodeOutputs = async () => {
    const outputs = new Map<string, string[]>();
    
    for (const prevNode of previousNodes) {
      // Buscar chaves disponíveis do node anterior
      // Por enquanto, retornar chaves mockadas
      // TODO: Implementar endpoint /api/nodes/:id/output-keys
      const mockKeys = getMockOutputKeys(prevNode.id);
      outputs.set(prevNode.id, mockKeys);
    }
    
    setNodeOutputs(outputs);
  };

  const toggleNodeExpansion = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const toggleKeySelection = (nodeId: string, nodeName: string, key: string) => {
    const existingMapping = mappings.find((m) => m.sourceNodeId === nodeId);
    
    if (existingMapping) {
      // Toggle a chave
      const newSelectedKeys = existingMapping.selectedKeys.includes(key)
        ? existingMapping.selectedKeys.filter((k) => k !== key)
        : [...existingMapping.selectedKeys, key];
      
      const newMappings = mappings.map((m) =>
        m.sourceNodeId === nodeId
          ? { ...m, selectedKeys: newSelectedKeys }
          : m
      );
      
      // Remover mapping se não tem mais chaves selecionadas
      const filteredMappings = newMappings.filter((m) => m.selectedKeys.length > 0);
      
      setMappings(filteredMappings);
      onChange(filteredMappings);
    } else {
      // Criar novo mapping
      const newMapping: InputMapping = {
        sourceNodeId: nodeId,
        sourceNodeName: nodeName,
        selectedKeys: [key],
      };
      
      const newMappings = [...mappings, newMapping];
      setMappings(newMappings);
      onChange(newMappings);
    }
  };

  const isKeySelected = (nodeId: string, key: string): boolean => {
    const mapping = mappings.find((m) => m.sourceNodeId === nodeId);
    return mapping ? mapping.selectedKeys.includes(key) : false;
  };

  const getSelectedCount = (nodeId: string): number => {
    const mapping = mappings.find((m) => m.sourceNodeId === nodeId);
    return mapping ? mapping.selectedKeys.length : 0;
  };

  if (previousNodes.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <p className="text-sm text-gray-500">
          Este é o primeiro node. Não há dados de entrada disponíveis.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-700">
          Selecionar Dados de Entrada
        </h4>
        <span className="text-xs text-gray-500">
          {previousNodes.length} node(s) anterior(es)
        </span>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-2">
        {previousNodes.map((prevNode) => {
          const isExpanded = expandedNodes.has(prevNode.id);
          const keys = nodeOutputs.get(prevNode.id) || [];
          const selectedCount = getSelectedCount(prevNode.id);

          return (
            <div key={prevNode.id} className="bg-white border border-gray-200 rounded-md">
              {/* Header do Node */}
              <button
                onClick={() => toggleNodeExpansion(prevNode.id)}
                className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-gray-600" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-600" />
                  )}
                  <span className="font-medium text-sm text-gray-800">
                    {prevNode.name}
                  </span>
                  {selectedCount > 0 && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                      {selectedCount} selecionada(s)
                    </span>
                  )}
                </div>
                <span className="text-xs text-gray-500">
                  {keys.length} chave(s)
                </span>
              </button>

              {/* Chaves disponíveis */}
              {isExpanded && (
                <div className="border-t border-gray-200 p-3 space-y-1.5">
                  {keys.length === 0 ? (
                    <p className="text-xs text-gray-400 italic">
                      Nenhuma chave disponível (execute o workflow primeiro)
                    </p>
                  ) : (
                    keys.map((key) => {
                      const selected = isKeySelected(prevNode.id, key);
                      
                      return (
                        <button
                          key={key}
                          onClick={() => toggleKeySelection(prevNode.id, prevNode.name, key)}
                          className={`w-full flex items-center gap-2 p-2 rounded hover:bg-gray-50 transition-colors ${
                            selected ? 'bg-blue-50' : ''
                          }`}
                        >
                          {selected ? (
                            <CheckSquare className="w-4 h-4 text-blue-600" />
                          ) : (
                            <Square className="w-4 h-4 text-gray-400" />
                          )}
                          <code className="text-xs font-mono text-gray-700">{key}</code>
                        </button>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="text-xs text-gray-500 bg-blue-50 border border-blue-200 rounded p-2">
        💡 <strong>Dica:</strong> Selecione as chaves que este node deve receber dos nodes anteriores.
        As chaves selecionadas estarão disponíveis como parâmetros de entrada.
      </div>
    </div>
  );
};

/**
 * Mock de chaves disponíveis (substituir por chamada real à API)
 */
function getMockOutputKeys(nodeId: string): string[] {
  // Simular diferentes outputs baseado no tipo de node
  if (nodeId.includes('webhook')) {
    return ['data', 'message', 'user', 'timestamp'];
  }
  if (nodeId.includes('condition')) {
    return ['branch', 'matched', 'input', 'conditionMatched'];
  }
  if (nodeId.includes('agent')) {
    return ['response', 'agentName', 'tokensUsed', 'executionTime'];
  }
  if (nodeId.includes('http')) {
    return ['body', 'status', 'headers', 'duration'];
  }
  
  return ['init', 'result', 'output'];
}
