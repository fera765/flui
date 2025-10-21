/**
 * FLUI - Field Linker Component
 * 
 * Sistema visual de linkagem entre campos de nodes
 * SUPERIOR AO N8N: Drag-and-drop, type-safe, para não-técnicos
 */

import { useState } from 'react';
import { X, Link2, AlertCircle, ChevronDown, ChevronRight } from 'lucide-react';
import {
  getCompatibleOutputs,
  extractNodeOutputs,
  getTypeIcon,
  getTypeColor,
  type InputField,
  type OutputField,
} from '../utils/typeMatching';

interface FieldLinkerProps {
  inputField: InputField;
  currentNodeId: string;
  parentNodes: Array<{
    id: string;
    name: string;
    type: string;
    data: any;
  }>;
  onLink: (linkConfig: {
    nodeId: string;
    nodeName: string;
    fieldKey: string;
    fieldLabel?: string;
  }) => void;
  onUnlink: () => void;
  onClose: () => void;
}

export default function FieldLinker({
  inputField,
  parentNodes,
  onLink,
  onUnlink,
  onClose,
}: FieldLinkerProps) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  
  // Extrair outputs de cada parent node
  const parentNodesWithOutputs = parentNodes.map(node => ({
    ...node,
    outputs: extractNodeOutputs(node),
  }));
  
  // Filtrar apenas outputs compatíveis
  const compatibleOutputs = getCompatibleOutputs(inputField, parentNodesWithOutputs);
  
  // Filtrar por busca
  const filteredOutputs = compatibleOutputs.filter(item => {
    const searchLower = searchTerm.toLowerCase();
    return (
      item.nodeName?.toLowerCase().includes(searchLower) ||
      item.field.key?.toLowerCase().includes(searchLower) ||
      item.field.label?.toLowerCase().includes(searchLower)
    );
  });
  
  // Agrupar por node
  const groupedByNode = filteredOutputs.reduce((acc, item) => {
    if (!acc[item.nodeId]) {
      acc[item.nodeId] = {
        nodeId: item.nodeId,
        nodeName: item.nodeName,
        fields: [],
      };
    }
    acc[item.nodeId].fields.push(item.field);
    return acc;
  }, {} as Record<string, { nodeId: string; nodeName: string; fields: OutputField[] }>);
  
  const toggleNodeExpansion = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };
  
  const handleLinkField = (nodeId: string, nodeName: string, field: OutputField) => {
    onLink({
      nodeId,
      nodeName,
      fieldKey: field.key,
      fieldLabel: field.label,
    });
    onClose();
  };
  
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
              style={{ backgroundColor: `${getTypeColor(inputField.type)}20` }}
            >
              {getTypeIcon(inputField.type)}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Conectar Campo
              </h2>
              <p className="text-sm text-gray-600">
                {inputField.label || inputField.key}
                <span className="ml-2 px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs font-medium">
                  {inputField.type}
                </span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        {/* Search */}
        <div className="p-4 border-b">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar campos..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>
        
        {/* Current Link */}
        {inputField.linkedFrom && (
          <div className="p-4 bg-blue-50 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Link2 className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-blue-900 font-medium">
                  Conectado a: {inputField.linkedFrom.nodeName} → {inputField.linkedFrom.fieldLabel || inputField.linkedFrom.fieldKey}
                </span>
              </div>
              <button
                onClick={() => {
                  onUnlink();
                  onClose();
                }}
                className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-sm font-medium transition"
              >
                Desconectar
              </button>
            </div>
          </div>
        )}
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {Object.keys(groupedByNode).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="w-16 h-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Nenhum campo compatível encontrado
              </h3>
              <p className="text-sm text-gray-600 max-w-md">
                Não há campos do tipo <strong>{inputField.type}</strong> nos nodes anteriores.
                {compatibleOutputs.length === 0 && parentNodes.length > 0 && (
                  <span className="block mt-2">
                    Os nodes anteriores não possuem outputs compatíveis.
                  </span>
                )}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {Object.values(groupedByNode).map(group => (
                <div key={group.nodeId} className="border border-gray-200 rounded-lg overflow-hidden">
                  {/* Node Header */}
                  <button
                    onClick={() => toggleNodeExpansion(group.nodeId)}
                    className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition"
                  >
                    <div className="flex items-center gap-3">
                      {expandedNodes.has(group.nodeId) ? (
                        <ChevronDown className="w-5 h-5 text-gray-500" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-gray-500" />
                      )}
                      <div className="text-left">
                        <div className="font-semibold text-gray-900">
                          {group.nodeName}
                        </div>
                        <div className="text-xs text-gray-500">
                          {group.fields.length} campo{group.fields.length !== 1 ? 's' : ''} compatível{group.fields.length !== 1 ? 'is' : ''}
                        </div>
                      </div>
                    </div>
                  </button>
                  
                  {/* Fields List */}
                  {expandedNodes.has(group.nodeId) && (
                    <div className="border-t border-gray-200">
                      {group.fields.map(field => (
                        <button
                          key={field.key}
                          onClick={() => handleLinkField(group.nodeId, group.nodeName, field)}
                          className="w-full flex items-center justify-between p-4 hover:bg-blue-50 transition group"
                        >
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-8 h-8 rounded flex items-center justify-center text-sm"
                              style={{ backgroundColor: `${getTypeColor(field.type)}20` }}
                            >
                              {getTypeIcon(field.type)}
                            </div>
                            <div className="text-left">
                              <div className="font-medium text-gray-900 group-hover:text-blue-600 transition">
                                {field.label || field.key}
                              </div>
                              {field.description && (
                                <div className="text-xs text-gray-500 mt-0.5">
                                  {field.description}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span 
                              className="px-2 py-1 rounded text-xs font-medium"
                              style={{ 
                                backgroundColor: `${getTypeColor(field.type)}20`,
                                color: getTypeColor(field.type),
                              }}
                            >
                              {field.type}
                            </span>
                            <Link2 className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition" />
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t bg-gray-50">
          <div className="flex items-start gap-2 text-sm text-gray-600">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <p>
              Apenas campos do tipo <strong>{inputField.type}</strong> ou compatíveis são mostrados.
              {compatibleOutputs.length > 0 && (
                <span className="block mt-1">
                  {compatibleOutputs.length} campo{compatibleOutputs.length !== 1 ? 's' : ''} compatível{compatibleOutputs.length !== 1 ? 'is' : ''} encontrado{compatibleOutputs.length !== 1 ? 's' : ''}.
                </span>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
