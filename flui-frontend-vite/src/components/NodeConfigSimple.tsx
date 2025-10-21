/**
 * NodeConfigSimple - UI de configuração simples, elegante e 100% responsiva
 * 
 * Design focado em usuários não-técnicos com interface intuitiva
 */

import { useState, useEffect } from 'react';
import { X, Save, Link2, AlertCircle, Check, Loader2 } from 'lucide-react';
import axios from 'axios';
import FieldLinker from './FieldLinker';
import { extractNodeInputs, extractNodeOutputs, type InputField } from '../utils/typeMatching';

interface Tool {
  id: string;
  name: string;
  description: string;
  params: ToolParam[];
  ui: {
    icon?: string;
    color?: string;
  };
}

interface ToolParam {
  name: string;
  key: string;
  type: string;
  description: string;
  required: boolean;
  default?: any;
  ui: {
    widgetType: string;
    placeholder?: string;
    helperText?: string;
    options?: Array<string | { label: string; value: any; description?: string }>;
  };
}

interface NodeConfigSimpleProps {
  isOpen: boolean;
  nodeId: string;
  toolId: string;
  initialConfig?: any;
  automationId?: string;
  localNodes?: any[];
  localEdges?: any[];
  onClose: () => void;
  onSave: (config: any) => void;
}

export default function NodeConfigSimple({
  isOpen,
  nodeId,
  toolId,
  initialConfig = {},
  automationId,
  localNodes = [],
  localEdges = [],
  onClose,
  onSave,
}: NodeConfigSimpleProps) {
  const [tool, setTool] = useState<Tool | null>(null);
  const [config, setConfig] = useState<any>(initialConfig);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [linkingField, setLinkingField] = useState<{ key: string; label: string; type: any } | null>(null);
  const [parentNodes, setParentNodes] = useState<any[]>([]);

  // Carregar tool metadata
  useEffect(() => {
    if (isOpen && toolId) {
      loadToolMetadata();
      loadParentNodes();
    }
  }, [isOpen, toolId]);

  const loadToolMetadata = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`http://localhost:3001/api/tools/${toolId}`);
      let toolData = response.data;

      // Para agent-executor, carregar agentes disponíveis
      if (toolId === 'agent-executor') {
        try {
          const agentsResponse = await axios.get('http://localhost:3001/api/agents');
          const agents = agentsResponse.data;

          toolData.params = toolData.params.map((param: any) => {
            if (param.key === 'agentId') {
              return {
                ...param,
                ui: {
                  ...param.ui,
                  options: agents.map((agent: any) => ({
                    label: agent.name,
                    value: agent.id,
                    description: agent.systemPrompt?.substring(0, 80) + '...' || 'Sem descrição',
                  })),
                },
              };
            }
            return param;
          });
        } catch (error) {
          console.error('Erro ao carregar agentes:', error);
        }
      }

      setTool(toolData);
    } catch (error) {
      console.error('Erro ao carregar metadados da tool:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadParentNodes = () => {
    // Filtrar nodes pais (que vêm antes do node atual)
    if (!localNodes || localNodes.length === 0) {
      setParentNodes([]);
      return;
    }

    // Encontrar nodes que têm edges conectando a este node
    const incomingEdges = localEdges?.filter((e: any) => e.target === nodeId) || [];
    const parentNodeIds = incomingEdges.map((e: any) => e.source);
    
    // Pegar os nodes pais completos
    const parents = localNodes.filter((n: any) => 
      parentNodeIds.includes(n.id) && n.id !== nodeId
    );

    setParentNodes(parents);
  };

  const updateConfig = (key: string, value: any) => {
    setConfig((prev: any) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[key];
        return newErrors;
      });
    }
  };

  const validateConfig = (): boolean => {
    if (!tool) return false;

    const newErrors: Record<string, string> = {};

    for (const param of tool.params) {
      const value = config[param.key];

      if (param.required && (value === undefined || value === null || value === '')) {
        newErrors[param.key] = 'Campo obrigatório';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateConfig()) return;

    setIsSaving(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 300)); // Feedback visual
      onSave(config);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const renderField = (param: ToolParam) => {
    const value = config[param.key];
    const error = errors[param.key];
    const isLinked = typeof value === 'string' && value.startsWith('{{') && value.endsWith('}}');

    const baseInputClasses = `w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 text-base ${
      error
        ? 'border-red-300 bg-red-50 text-red-900 focus:border-red-500 focus:ring-4 focus:ring-red-100'
        : isLinked
        ? 'border-green-300 bg-green-50 text-green-900 focus:border-green-500 focus:ring-4 focus:ring-green-100'
        : 'border-gray-200 bg-white text-gray-900 focus:border-blue-500 focus:ring-4 focus:ring-blue-100'
    } outline-none placeholder:text-gray-400`;

    switch (param.ui.widgetType) {
      case 'textInput':
        return (
          <div className="relative">
            <input
              type="text"
              value={value || ''}
              onChange={(e) => updateConfig(param.key, e.target.value)}
              placeholder={param.ui.placeholder}
              className={baseInputClasses}
            />
            {parentNodes.length > 0 && (
              <button
                type="button"
                onClick={() => setLinkingField({ key: param.key, label: param.name, type: param.type })}
                className={`absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-all duration-200 ${
                  isLinked
                    ? 'bg-green-500 text-white hover:bg-green-600 shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                title="Conectar com node anterior"
              >
                <Link2 className="w-5 h-5" />
              </button>
            )}
          </div>
        );

      case 'textArea':
        return (
          <div className="relative">
            <textarea
              value={value || ''}
              onChange={(e) => updateConfig(param.key, e.target.value)}
              placeholder={param.ui.placeholder}
              rows={4}
              className={`${baseInputClasses} min-h-[120px] resize-y`}
            />
            {parentNodes.length > 0 && (
              <button
                type="button"
                onClick={() => setLinkingField({ key: param.key, label: param.name, type: param.type })}
                className={`absolute right-3 top-3 p-2 rounded-lg transition-all duration-200 ${
                  isLinked
                    ? 'bg-green-500 text-white hover:bg-green-600 shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                title="Conectar com node anterior"
              >
                <Link2 className="w-5 h-5" />
              </button>
            )}
          </div>
        );

      case 'number':
        return (
          <input
            type="number"
            value={value ?? ''}
            onChange={(e) => updateConfig(param.key, parseFloat(e.target.value) || 0)}
            placeholder={param.ui.placeholder}
            className={baseInputClasses}
          />
        );

      case 'select':
        return (
          <select
            value={value || ''}
            onChange={(e) => updateConfig(param.key, e.target.value)}
            className={`${baseInputClasses} cursor-pointer`}
          >
            <option value="">{param.ui.placeholder || 'Selecione uma opção...'}</option>
            {param.ui.options?.map((option, idx) => {
              const opt = typeof option === 'string' ? { label: option, value: option } : option;
              return (
                <option key={idx} value={opt.value}>
                  {opt.label}
                </option>
              );
            })}
          </select>
        );

      case 'toggle':
      case 'checkbox':
        return (
          <label className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer">
            <div className="relative">
              <input
                type="checkbox"
                checked={!!value}
                onChange={(e) => updateConfig(param.key, e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-14 h-8 bg-gray-300 rounded-full peer-checked:bg-blue-600 transition-colors"></div>
              <div className="absolute left-1 top-1 w-6 h-6 bg-white rounded-full transition-transform peer-checked:translate-x-6 shadow-md"></div>
            </div>
            <span className="text-sm font-medium text-gray-700">
              {value ? 'Ativado' : 'Desativado'}
            </span>
          </label>
        );

      case 'jsonEditor':
      case 'codeEditor':
        return (
          <textarea
            value={typeof value === 'object' ? JSON.stringify(value, null, 2) : value || ''}
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value);
                updateConfig(param.key, parsed);
              } catch {
                updateConfig(param.key, e.target.value);
              }
            }}
            placeholder={param.ui.placeholder}
            className={`${baseInputClasses} min-h-[180px] font-mono text-sm`}
          />
        );

      default:
        return (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => updateConfig(param.key, e.target.value)}
            placeholder={param.ui.placeholder}
            className={baseInputClasses}
          />
        );
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 sm:p-8 border-b border-gray-100">
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 truncate">
                {isLoading ? 'Carregando...' : tool?.name || 'Configurar'}
              </h2>
              {tool && (
                <p className="text-sm text-gray-500 mt-1 line-clamp-1">
                  {tool.description}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="ml-4 text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-xl"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 sm:p-8">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
                <p className="text-gray-600">Carregando configurações...</p>
              </div>
            ) : tool ? (
              <div className="space-y-6">
                {/* Info Banner - Parent Nodes */}
                {parentNodes.length > 0 && (
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-blue-500 rounded-lg">
                        <Link2 className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-1">
                          Conectar Campos
                        </h4>
                        <p className="text-sm text-gray-600">
                          Clique no ícone <Link2 className="w-4 h-4 inline" /> para conectar um campo a um node anterior
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Fields */}
                {tool.params.map((param) => (
                  <div key={param.key} className="space-y-2">
                    <label className="block">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-gray-900">
                          {param.name}
                          {param.required && (
                            <span className="text-red-500 ml-1">*</span>
                          )}
                        </span>
                        {config[param.key] && typeof config[param.key] === 'string' && 
                         config[param.key].startsWith('{{') && config[param.key].endsWith('}}') && (
                          <span className="flex items-center gap-1 text-xs font-medium text-green-600 bg-green-100 px-2 py-1 rounded-full">
                            <Check className="w-3 h-3" />
                            Conectado
                          </span>
                        )}
                      </div>
                      {param.ui.helperText && (
                        <p className="text-xs text-gray-500 mb-2">
                          {param.ui.helperText}
                        </p>
                      )}
                      {renderField(param)}
                      {errors[param.key] && (
                        <div className="flex items-center gap-2 mt-2 text-red-600 text-sm font-medium">
                          <AlertCircle className="w-4 h-4" />
                          {errors[param.key]}
                        </div>
                      )}
                    </label>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                Erro ao carregar configurações
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 sm:p-8 border-t border-gray-100 bg-gray-50 rounded-b-3xl">
            <button
              onClick={onClose}
              className="px-6 py-3 text-gray-700 hover:text-gray-900 font-medium transition-colors rounded-xl hover:bg-gray-200"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-xl font-semibold transition-all disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Salvar
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Field Linker Modal */}
      {linkingField && (
        <FieldLinker
          inputField={{
            key: linkingField.key,
            label: linkingField.label,
            type: linkingField.type,
            required: false,
          }}
          currentNodeId={nodeId}
          parentNodes={parentNodes.map(n => ({
            id: n.id,
            name: n.data?.label || n.type || 'Node',
            type: n.type,
            data: n.data,
          }))}
          onLink={(linkConfig) => {
            // Criar referência no formato {{nodeId.fieldKey}}
            const reference = `{{${linkConfig.nodeId}.${linkConfig.fieldKey}}}`;
            updateConfig(linkingField.key, reference);
            setLinkingField(null);
          }}
          onUnlink={() => {
            updateConfig(linkingField.key, '');
            setLinkingField(null);
          }}
          onClose={() => setLinkingField(null)}
        />
      )}
    </>
  );
}
