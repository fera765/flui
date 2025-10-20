/**
 * OutputSelector - Dropdown para selecionar outputs de nodes pai
 * Integra diretamente nos campos de input das configurações
 */

import React, { useState, useEffect, useRef } from 'react';
import { Link2, X, Search } from 'lucide-react';
import axios from 'axios';

interface OutputOption {
  nodeId: string;
  nodeName: string;
  toolId?: string;
  outputKeys: string[];
}

interface OutputSelectorProps {
  automationId?: string;
  currentNodeId: string;
  fieldName?: string; // Opcional, usado para identificação interna
  fieldValue: string;
  onSelect: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export const OutputSelector: React.FC<OutputSelectorProps> = ({
  automationId,
  currentNodeId,
  fieldName: _fieldName, // Prefixado com _ para indicar não usado
  fieldValue,
  onSelect,
  placeholder = 'Digite ou selecione...',
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [availableOutputs, setAvailableOutputs] = useState<OutputOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Carregar outputs disponíveis
  useEffect(() => {
    if (isOpen && currentNodeId && automationId) {
      loadAvailableOutputs();
    }
  }, [isOpen, currentNodeId, automationId]);

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
    if (!automationId || !currentNodeId) {
      setError('ID de automação ou node não disponível');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.get(
        `http://localhost:3001/api/automations/${automationId}/nodes/${currentNodeId}/available-outputs`
      );
      setAvailableOutputs(response.data.availableOutputs || []);
    } catch (error: any) {
      console.error('Erro ao carregar outputs:', error);
      setError(error.response?.data?.error || 'Erro ao carregar outputs disponíveis');
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
              <div className="p-4 text-center text-red-400 text-sm">
                <div className="mb-2">⚠️ {error}</div>
                <button
                  onClick={loadAvailableOutputs}
                  className="text-xs text-blue-400 hover:text-blue-300 underline"
                >
                  Tentar novamente
                </button>
              </div>
            ) : filteredOutputs.length === 0 ? (
              <div className="p-4 text-center text-gray-400 text-sm">
                {availableOutputs.length === 0
                  ? '📭 Nenhum node pai encontrado.\nAdicione nodes antes deste para usar seus outputs.'
                  : '🔍 Nenhum resultado encontrado para sua busca.'}
              </div>
            ) : (
              filteredOutputs.map((output) => (
                <div key={output.nodeId} className="border-b border-slate-700 last:border-b-0">
                  {/* Node Name */}
                  <div className="px-3 py-2 bg-slate-750 sticky top-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-purple-400 uppercase tracking-wide">
                        {output.nodeName}
                      </span>
                      <span className="text-xs text-gray-500">
                        {output.outputKeys.length} chave{output.outputKeys.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    {output.toolId && (
                      <span className="text-xs text-gray-500">
                        {output.toolId}
                      </span>
                    )}
                  </div>

                  {/* Output Keys */}
                  <div className="py-1">
                    {output.outputKeys.map((key) => (
                      <button
                        key={key}
                        onClick={() => handleSelectOutput(output.nodeId, key)}
                        className="w-full px-4 py-2 text-left hover:bg-slate-700 transition-colors flex items-center justify-between group"
                        type="button"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                          <code className="text-sm font-mono text-blue-300">{key}</code>
                        </div>
                        <code className="text-xs font-mono text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">
                          {`{{${output.nodeId}.${key}}}`}
                        </code>
                      </button>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {availableOutputs.length > 0 && (
            <div className="p-2 border-t border-slate-700 bg-slate-750">
              <p className="text-xs text-gray-400 text-center">
                💡 Clique em uma chave para inserir a referência
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
