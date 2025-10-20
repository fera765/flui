/**
 * OutputSelector - Dropdown para selecionar outputs de nodes pai
 * Integra diretamente nos campos de input das configurações
 */

import React, { useState, useEffect, useRef } from 'react';
import { Link2, X, Search } from 'lucide-react';
import axios from 'axios';
import { calculateLocalOutputs } from '../utils/localOutputExtractor';

interface OutputOption {
  nodeId: string;
  nodeName: string;
  toolId?: string;
  outputKeys: string[];
}

interface LocalNode {
  id: string;
  data: {
    label?: string;
    toolId?: string;
    config?: any;
  };
}

interface LocalEdge {
  source: string;
  target: string;
}

interface OutputSelectorProps {
  automationId?: string;
  currentNodeId: string;
  fieldName?: string; // Opcional, usado para identificação interna
  fieldValue: string;
  onSelect: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  // 🆕 Para automações não salvas (em criação)
  localNodes?: LocalNode[];
  localEdges?: LocalEdge[];
}

export const OutputSelector: React.FC<OutputSelectorProps> = ({
  automationId,
  currentNodeId,
  fieldName: _fieldName, // Prefixado com _ para indicar não usado
  fieldValue,
  onSelect,
  placeholder = 'Digite ou selecione...',
  disabled = false,
  localNodes,
  localEdges,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [availableOutputs, setAvailableOutputs] = useState<OutputOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [usingLocalMode, setUsingLocalMode] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Carregar outputs disponíveis
  useEffect(() => {
    if (isOpen && currentNodeId) {
      // Dispara se tem automationId OU se tem localNodes+localEdges
      if (automationId || (localNodes && localEdges)) {
        loadAvailableOutputs();
      }
    }
  }, [isOpen, currentNodeId, automationId, localNodes, localEdges]);

  // Fechar ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const loadAvailableOutputs = async () => {
    console.log('🔍 [OutputSelector] loadAvailableOutputs iniciado', {
      automationId,
      currentNodeId,
      hasLocalNodes: !!localNodes,
      localNodesCount: localNodes?.length || 0,
      hasLocalEdges: !!localEdges,
      localEdgesCount: localEdges?.length || 0
    });

    setIsLoading(true);
    setError(null);
    setUsingLocalMode(false);

    try {
      // 🆕 MODO HÍBRIDO: Tenta API primeiro, se falhar usa cálculo local
      
      if (automationId && currentNodeId) {
        console.log('🌐 [OutputSelector] Tentando modo API...');

        // Modo 1: Automação já salva - usar API
        try {
          const response = await axios.get(
            `http://localhost:3001/api/automations/${automationId}/nodes/${currentNodeId}/available-outputs`
          );
          
          const outputs = response.data.availableOutputs || [];
          
          if (outputs.length === 0) {
            setError('📭 Nenhum node anterior encontrado.\n\n💡 Adicione nodes antes deste na automação.');
          }
          
          setAvailableOutputs(outputs);
          return; // Success via API
        } catch (apiError) {
          console.warn('⚠️  API falhou, tentando modo local...', apiError);
          // Continua para modo local abaixo
        }
      }
      
      // Modo 2: Automação em criação - calcular localmente
      if (localNodes && localEdges && currentNodeId) {
        console.log('🔧 Usando modo local (automação ainda não salva)');
        const outputs = calculateLocalOutputs(localNodes, localEdges, currentNodeId);
        
        if (outputs.length === 0) {
          setError('📭 Nenhum node anterior conectado.\n\n💡 Adicione e conecte nodes antes deste para usar seus outputs.');
        } else {
          setUsingLocalMode(true);
        }
        
        setAvailableOutputs(outputs);
        return;
      }
      
      // Modo 3: Nenhum modo disponível
      console.warn('⚠️  Nem automationId nem localNodes disponíveis');
      setAvailableOutputs([]);
      setError('⚠️ Configure a automação corretamente.\n\nAdicione nodes anteriores e tente novamente.');
    } catch (error: any) {
      console.error('Erro ao carregar outputs:', error);
      const errorMsg = error.response?.data?.error || error.message || 'Erro ao carregar outputs disponíveis';
      setError(errorMsg);
      setAvailableOutputs([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectOutput = (nodeId: string, key: string) => {
    const reference = `{{${nodeId}.${key}}}`;
    onSelect(reference);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleClearSelection = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect('');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSelect(e.target.value);
  };

  const isReferenceValue = fieldValue?.startsWith('{{') && fieldValue?.endsWith('}}');

  // Filtrar outputs baseado na busca
  const filteredOutputs = availableOutputs.filter((output) =>
    output.nodeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    output.outputKeys.some((key) => key.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Input Field */}
      <div className="relative">
        <input
          type="text"
          value={fieldValue || ''}
          onChange={handleInputChange}
          onFocus={() => !disabled && setIsOpen(true)}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full px-3 py-2 pr-20 bg-slate-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-colors ${
            isReferenceValue
              ? 'border-blue-500 focus:ring-blue-500'
              : 'border-slate-600 focus:ring-purple-500'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        />
        
        {/* Ícones de ação */}
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {isReferenceValue && !disabled && (
            <button
              onClick={handleClearSelection}
              className="p-1 hover:bg-slate-600 rounded text-gray-400 hover:text-white transition-colors"
              title="Limpar seleção"
              type="button"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          {!disabled && (
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-1 hover:bg-slate-600 rounded text-gray-400 hover:text-white transition-colors"
              title="Selecionar output de node pai"
              type="button"
            >
              <Link2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-2 w-full bg-slate-800 border border-slate-600 rounded-lg shadow-2xl max-h-96 overflow-hidden">
          {/* Header */}
          <div className="p-3 border-b border-slate-700">
            <div className="flex items-center gap-2 mb-2">
              <Link2 className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-medium text-blue-400">
                Outputs Disponíveis
              </span>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar node ou chave..."
                className="w-full pl-9 pr-3 py-1.5 bg-slate-700 border border-slate-600 rounded text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Content */}
          <div className="max-h-80 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-center text-gray-400">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto mb-2"></div>
                Carregando outputs...
              </div>
            ) : error ? (
              <div className="p-4 text-center">
                <div className="mb-3 text-yellow-400 text-sm whitespace-pre-line">
                  {error}
                </div>
                {!error.includes('Salve a automação') && (
                  <button
                    onClick={loadAvailableOutputs}
                    className="text-xs text-blue-400 hover:text-blue-300 underline"
                  >
                    Tentar novamente
                  </button>
                )}
              </div>
            ) : filteredOutputs.length === 0 ? (
              <div className="p-4 text-center text-gray-400 text-sm whitespace-pre-line">
                {availableOutputs.length === 0
                  ? '📭 Nenhum node pai encontrado.\n\n💡 Adicione nodes antes deste na automação.'
                  : '🔍 Nenhum resultado encontrado para sua busca.'}
              </div>
            ) : (
              <div className="divide-y divide-slate-700">
                {filteredOutputs.map((output) => (
                  <div key={output.nodeId} className="py-2">
                    {/* Node Name - Mais destacado e separado */}
                    <div className="px-4 py-2 bg-gradient-to-r from-purple-900/30 to-transparent">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                          <span className="text-sm font-bold text-purple-300">
                            {output.nodeName}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500 bg-slate-800 px-2 py-0.5 rounded">
                          {output.outputKeys.length} chave{output.outputKeys.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                      {output.toolId && (
                        <span className="text-xs text-gray-500 ml-4">
                          {output.toolId}
                        </span>
                      )}
                    </div>

                    {/* Output Keys - Bem separado e indentado */}
                    <div className="px-4 py-1 space-y-1">
                      {output.outputKeys.map((key) => (
                        <button
                          key={key}
                          onClick={() => handleSelectOutput(output.nodeId, key)}
                          className="w-full px-3 py-2 text-left hover:bg-slate-700 rounded transition-colors flex items-center justify-between group"
                          type="button"
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
                            <code className="text-sm font-mono text-blue-300">{key}</code>
                          </div>
                          <code className="text-xs font-mono text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">
                            {`{{${output.nodeId}.${key}}}`}
                          </code>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {availableOutputs.length > 0 && (
            <div className="p-2 border-t border-slate-700 bg-slate-750">
              <p className="text-xs text-gray-400 text-center">
                💡 Clique em uma chave para inserir a referência
                {usingLocalMode && (
                  <span className="block mt-1 text-yellow-400">
                    ⚠️ Salve a automação para garantir dados reais
                  </span>
                )}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Indicator de referência ativa */}
      {isReferenceValue && (
        <div className="mt-1 flex items-center gap-1 text-xs text-blue-400">
          <Link2 className="w-3 h-3" />
          <span>Usando output de node pai</span>
        </div>
      )}
    </div>
  );
};
