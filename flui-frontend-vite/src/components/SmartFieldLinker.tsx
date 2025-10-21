/**
 * SmartFieldLinker - Sistema de Linker Inteligente SUPERIOR ao N8n
 * 
 * Features:
 * - Type-safe: apenas campos compatíveis
 * - Mobile-friendly: responsivo
 * - Visual claro: ícones, cores, agrupamento
 * - Busca em tempo real
 * - Validação automática
 * - Preview de dados
 */

import { useState, useMemo } from 'react';
import { X, Search, Link2, CheckCircle, AlertCircle } from 'lucide-react';
import { 
  getTypeIcon, 
  getTypeColor, 
  areTypesCompatible,
  type FieldType,
  type LinkedOutputField 
} from '../utils/typeMatching';

// ============= TYPES =============

type OutputField = LinkedOutputField;

interface SmartFieldLinkerProps {
  isOpen: boolean;
  onClose: () => void;
  
  // Campo atual que está sendo linkado
  fieldKey: string;
  fieldLabel: string;
  fieldType: FieldType;
  currentValue?: string;
  
  // Nodes disponíveis
  availableOutputs: OutputField[];
  
  // Callback quando linkar
  onLink: (reference: string) => void;
}

// ============= COMPONENT =============

export default function SmartFieldLinker({
  isOpen,
  onClose,
  fieldLabel,
  fieldType,
  currentValue,
  availableOutputs,
  onLink,
}: SmartFieldLinkerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filtrar apenas outputs compatíveis com o tipo do campo
  const compatibleOutputs = useMemo(() => {
    return availableOutputs.filter(output => 
      areTypesCompatible(output.type, fieldType)
    );
  }, [availableOutputs, fieldType]);
  
  // Filtrar pela busca
  const filteredOutputs = useMemo(() => {
    if (!searchTerm) return compatibleOutputs;
    
    const term = searchTerm.toLowerCase();
    return compatibleOutputs.filter(output => 
      output.label.toLowerCase().includes(term) ||
      output.nodeName.toLowerCase().includes(term) ||
      output.key.toLowerCase().includes(term)
    );
  }, [compatibleOutputs, searchTerm]);
  
  // Agrupar por node
  const groupedByNode = useMemo(() => {
    const groups: Record<string, OutputField[]> = {};
    
    filteredOutputs.forEach(output => {
      const groupKey = `${output.nodeId}:${output.nodeName}`;
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(output);
    });
    
    return Object.entries(groups).map(([, fields]) => ({
      nodeId: fields[0].nodeId,
      nodeName: fields[0].nodeName,
      fields,
    }));
  }, [filteredOutputs]);
  
  // Verificar se campo já está linkado
  const isLinked = currentValue?.startsWith('{{') && currentValue?.endsWith('}}');
  
  const handleLink = (output: OutputField) => {
    const reference = `{{${output.nodeId}.${output.key}}}`;
    onLink(reference);
    onClose();
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col border border-purple-500/30">
        
        {/* Header */}
        <div className="p-6 border-b border-purple-500/20">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <Link2 className="w-6 h-6 text-purple-400" />
                <h2 className="text-xl font-bold text-white">
                  Conectar Campo
                </h2>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-3 border border-purple-500/20">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-2xl ${getTypeColor(fieldType)}`}>
                    {getTypeIcon(fieldType)}
                  </span>
                  <span className="font-semibold text-purple-300">
                    {fieldLabel}
                  </span>
                  <span className="text-xs px-2 py-1 rounded bg-purple-500/20 text-purple-300">
                    {fieldType}
                  </span>
                </div>
                <p className="text-xs text-gray-400">
                  Selecione um valor compatível de um node anterior
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="ml-4 text-gray-400 hover:text-white transition p-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {/* Search */}
        <div className="p-4 border-b border-purple-500/10">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar campos..."
              className="w-full pl-10 pr-4 py-3 bg-slate-800 text-white rounded-lg border border-purple-500/30 focus:border-purple-500 outline-none transition"
            />
          </div>
        </div>
        
        {/* Current Connection (if exists) */}
        {isLinked && (
          <div className="p-4 bg-green-500/10 border-b border-green-500/20">
            <div className="flex items-center gap-2 text-green-400">
              <CheckCircle className="w-5 h-5" />
              <span className="text-sm font-medium">
                Atualmente conectado: <code className="text-xs bg-slate-800 px-2 py-1 rounded">{currentValue}</code>
              </span>
            </div>
          </div>
        )}
        
        {/* Output List */}
        <div className="flex-1 overflow-y-auto p-4">
          {groupedByNode.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="w-16 h-16 text-gray-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-400 mb-2">
                Nenhum campo compatível encontrado
              </h3>
              <p className="text-sm text-gray-500 max-w-md">
                Não há campos do tipo <strong className="text-purple-400">{fieldType}</strong> disponíveis nos nodes anteriores.
              </p>
              <p className="text-xs text-gray-600 mt-2">
                Tipos compatíveis: {fieldType === 'string' ? 'string, number, boolean' : fieldType}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {groupedByNode.map(({ nodeId, nodeName, fields }) => (
                <div key={nodeId} className="bg-slate-800/50 rounded-xl border border-purple-500/20 overflow-hidden">
                  {/* Node Header */}
                  <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 px-4 py-3 border-b border-purple-500/20">
                    <h3 className="font-semibold text-white flex items-center gap-2">
                      <span className="text-purple-400">▶</span>
                      {nodeName}
                    </h3>
                    <p className="text-xs text-gray-400 mt-1">
                      {fields.length} campo{fields.length !== 1 ? 's' : ''} compatível{fields.length !== 1 ? 'is' : ''}
                    </p>
                  </div>
                  
                  {/* Fields */}
                  <div className="divide-y divide-purple-500/10">
                    {fields.map((field) => {
                      const reference = `{{${field.nodeId}.${field.key}}}`;
                      const isCurrentlyLinked = currentValue === reference;
                      
                      return (
                        <div
                          key={field.key}
                          className={`p-4 hover:bg-purple-500/5 transition ${
                            isCurrentlyLinked ? 'bg-green-500/10' : ''
                          }`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            {/* Field Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`text-xl ${getTypeColor(field.type)}`}>
                                  {getTypeIcon(field.type)}
                                </span>
                                <span className="font-medium text-white truncate">
                                  {field.label}
                                </span>
                                <span className="text-xs px-2 py-0.5 rounded bg-slate-700 text-gray-300">
                                  {field.type}
                                </span>
                                {isCurrentlyLinked && (
                                  <CheckCircle className="w-4 h-4 text-green-400" />
                                )}
                              </div>
                              {field.description && (
                                <p className="text-xs text-gray-400 mb-2">
                                  {field.description}
                                </p>
                              )}
                              <code className="text-xs bg-slate-900 px-2 py-1 rounded text-purple-300">
                                {reference}
                              </code>
                            </div>
                            
                            {/* Link Button */}
                            <button
                              onClick={() => handleLink(field)}
                              className={`px-4 py-2 rounded-lg font-medium transition whitespace-nowrap ${
                                isCurrentlyLinked
                                  ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                  : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600'
                              }`}
                            >
                              {isCurrentlyLinked ? 'Conectado' : 'Conectar'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-purple-500/20 bg-slate-900/50">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>
              {compatibleOutputs.length} campo{compatibleOutputs.length !== 1 ? 's' : ''} compatível{compatibleOutputs.length !== 1 ? 'is' : ''}
            </span>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition"
            >
              Cancelar
            </button>
          </div>
        </div>
        
      </div>
    </div>
  );
}
