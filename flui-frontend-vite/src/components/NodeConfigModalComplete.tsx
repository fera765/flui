/**
 * FLUI - Modal de Configuração de Nó COMPLETO
 * 
 * ✅ Reconstruído do zero
 * ✅ Carregamento dinâmico do backend
 * ✅ Sistema de linkers funcional
 * ✅ Persistência completa
 * ✅ Interface para não-técnicos
 * ✅ Nenhum hardcoded
 */

import { useState, useEffect } from 'react';
import { X, Save, Play, AlertCircle, Info, Link2, CheckCircle, Loader2 } from 'lucide-react';
import axios from 'axios';
import SmartFieldLinker from './SmartFieldLinker';
import { extractNodeInputs, extractNodeOutputs, type InputField } from '../utils/typeMatching';

// ============= TYPES =============

interface ToolParam {
  name: string;
  key: string;
  type: string;
  description: string;
  required: boolean;
  default?: any;
  ui: {
    widgetType: 'textInput' | 'textArea' | 'number' | 'select' | 'toggle' | 'keyValue' | 'jsonEditor';
    placeholder?: string;
    helperText?: string;
    options?: Array<string | { label: string; value: any; description?: string }>;
    validation?: {
      min?: number;
      max?: number;
      minLength?: number;
      maxLength?: number;
      pattern?: string;
    };
    advanced?: boolean;
  };
}

interface Tool {
  id: string;
  name: string;
  description: string;
  params: ToolParam[];
  ui: {
    icon?: string;
    color?: string;
    examples?: Array<{
      title: string;
      description: string;
      params: any;
    }>;
  };
}

interface NodeConfigModalCompleteProps {
  isOpen: boolean;
  nodeId: string;
  toolId: string;
  initialConfig?: any;
  automationId?: string;
  localNodes?: any[];
  localEdges?: any[];
  onClose: () => void;
  onSave: (config: any) => void;
  onTest?: (config: any) => void;
}

// ============= COMPONENT =============

export default function NodeConfigModalComplete({
  isOpen,
  nodeId,
  toolId,
  initialConfig = {},
  automationId,
  localNodes = [],
  localEdges = [],
  onClose,
  onSave,
  onTest,
}: NodeConfigModalCompleteProps) {
  const [tool, setTool] = useState<Tool | null>(null);
  const [config, setConfig] = useState<any>(initialConfig);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // Linker state
  const [showLinker, setShowLinker] = useState(false);
  const [linkingField, setLinkingField] = useState<{ key: string; label: string; type: any } | null>(null);

  // Carregar metadados da tool
  useEffect(() => {
    if (isOpen && toolId) {
      loadToolMetadata();
    }
  }, [isOpen, toolId]);

  // Inicializar config com defaults
  useEffect(() => {
    if (tool && Object.keys(config).length === 0) {
      const defaultConfig: any = {};
      tool.params.forEach((param: ToolParam) => {
        if (param.default !== undefined) {
          defaultConfig[param.key] = param.default;
        }
      });
      setConfig(defaultConfig);
    }
  }, [tool]);

  const loadToolMetadata = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`http://localhost:3001/api/tools/${toolId}`);
      const toolData = response.data;
      setTool(toolData);
    } catch (error) {
      console.error('Erro ao carregar metadados da tool:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateConfig = (key: string, value: any) => {
    setConfig((prev: any) => ({ ...prev, [key]: value }));
    
    // Limpar erro do campo
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
      
      // Verificar obrigatório
      if (param.required && (value === undefined || value === null || value === '')) {
        newErrors[param.key] = 'Campo obrigatório';
        continue;
      }
      
      // Validações específicas
      if (param.ui.validation && value) {
        const { min, max, minLength, maxLength, pattern } = param.ui.validation;
        
        if (typeof value === 'number') {
          if (min !== undefined && value < min) {
            newErrors[param.key] = `Valor mínimo: ${min}`;
          }
          if (max !== undefined && value > max) {
            newErrors[param.key] = `Valor máximo: ${max}`;
          }
        }
        
        if (typeof value === 'string') {
          if (minLength !== undefined && value.length < minLength) {
            newErrors[param.key] = `Comprimento mínimo: ${minLength}`;
          }
          if (maxLength !== undefined && value.length > maxLength) {
            newErrors[param.key] = `Comprimento máximo: ${maxLength}`;
          }
          if (pattern && !new RegExp(pattern).test(value)) {
            newErrors[param.key] = 'Formato inválido';
          }
        }
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validateConfig()) {
      onSave(config);
      onClose();
    }
  };

  const handleTest = async () => {
    if (!validateConfig()) return;
    
    setIsTesting(true);
    setTestResult(null);
    
    try {
      if (automationId && localNodes && localEdges) {
        const response = await axios.post(
          `http://localhost:3001/api/automations/${automationId}/nodes/${nodeId}/test`,
          {
            nodes: localNodes,
            edges: localEdges,
          }
        );
        setTestResult(response.data);
      } else {
        const response = await axios.post(`http://localhost:3001/api/nodes/${nodeId}/test`, {
          toolId,
          params: config,
        });
        setTestResult(response.data);
      }
    } catch (error: any) {
      console.error('Erro no teste:', error);
      setTestResult({
        error: error.response?.data?.error || error.message,
      });
    } finally {
      setIsTesting(false);
    }
  };

  const renderWidget = (param: ToolParam) => {
    const value = config[param.key];
    const error = errors[param.key];
    const { ui } = param;

    const isLinked = typeof value === 'string' && value.startsWith('{{') && value.endsWith('}}');
    
    const baseClasses = `w-full px-4 py-3 rounded-lg border transition-colors font-medium ${
      error 
        ? 'border-red-500 bg-red-50 text-red-900' 
        : isLinked
          ? 'border-green-500 bg-green-50 text-green-900'
          : 'border-gray-300 bg-white text-gray-900'
    } focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none placeholder:text-gray-500`;

    switch (ui.widgetType) {
      case 'textInput':
        return (
          <div className="relative">
            <input
              type="text"
              value={value || ''}
              onChange={(e) => updateConfig(param.key, e.target.value)}
              placeholder={ui.placeholder}
              className={baseClasses}
            />
            {localNodes && localNodes.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setLinkingField({ key: param.key, label: param.name, type: param.type });
                  setShowLinker(true);
                }}
                className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg transition ${
                  isLinked
                    ? 'bg-green-500 text-white hover:bg-green-600'
                    : 'bg-purple-500 text-white hover:bg-purple-600'
                }`}
                title="Conectar com node anterior"
              >
                <Link2 className="w-4 h-4" />
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
              placeholder={ui.placeholder}
              rows={4}
              className={`${baseClasses} min-h-[100px] resize-y`}
            />
            {localNodes && localNodes.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setLinkingField({ key: param.key, label: param.name, type: param.type });
                  setShowLinker(true);
                }}
                className={`absolute right-2 top-2 p-2 rounded-lg transition ${
                  isLinked
                    ? 'bg-green-500 text-white hover:bg-green-600'
                    : 'bg-purple-500 text-white hover:bg-purple-600'
                }`}
                title="Conectar com node anterior"
              >
                <Link2 className="w-4 h-4" />
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
            placeholder={ui.placeholder}
            min={ui.validation?.min}
            max={ui.validation?.max}
            className={baseClasses}
          />
        );

      case 'select':
        return (
          <select
            value={value || ''}
            onChange={(e) => updateConfig(param.key, e.target.value)}
            className={baseClasses}
          >
            <option value="">{ui.placeholder || 'Selecione...'}</option>
            {ui.options?.map((option, idx) => {
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
        return (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => updateConfig(param.key, !value)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                value ? 'bg-purple-600' : 'bg-slate-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  value ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className="text-sm text-gray-300">
              {value ? 'Ativado' : 'Desativado'}
            </span>
          </div>
        );

      case 'keyValue':
        return <KeyValueWidget value={value || {}} onChange={(v) => updateConfig(param.key, v)} />;

      case 'jsonEditor':
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
            placeholder={ui.placeholder}
            className={`${baseClasses} min-h-[150px] font-mono text-sm`}
          />
        );

      default:
        return (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => updateConfig(param.key, e.target.value)}
            placeholder={ui.placeholder}
            className={baseClasses}
          />
        );
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-800 rounded-xl border border-purple-500/30 w-full max-w-4xl shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-purple-500/20">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-white">Configurar Nó</h2>
            {tool && (
              <p className="text-sm text-purple-400 mt-1">
                {tool.name} • {tool.description}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-purple-300 hover:text-white transition ml-4"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
            </div>
          ) : tool ? (
            <div className="space-y-6">
              {/* Tool description */}
              {tool.description && (
                <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <Info className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-purple-300">{tool.description}</p>
                  </div>
                </div>
              )}

              {/* Basic Fields */}
              {tool.params
                .filter((p) => !p.ui.advanced)
                .map((param) => (
                  <div key={param.key}>
                    <label className="block text-purple-300 text-sm font-semibold mb-2">
                      {param.name}
                      {param.required && <span className="text-red-400 ml-1">*</span>}
                    </label>
                    {param.ui.helperText && (
                      <p className="text-xs text-gray-400 mb-2">{param.ui.helperText}</p>
                    )}
                    {renderWidget(param)}
                    {errors[param.key] && (
                      <div className="flex items-center gap-2 mt-2 text-red-400 text-sm">
                        <AlertCircle className="w-4 h-4" />
                        {errors[param.key]}
                      </div>
                    )}
                  </div>
                ))}

              {/* Advanced Fields */}
              {tool.params.some((p) => p.ui.advanced) && (
                <div className="border-t border-slate-700 pt-4">
                  <button
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="flex items-center gap-2 text-purple-400 hover:text-purple-300 transition"
                  >
                    {showAdvanced ? '▼' : '▶'} Opções Avançadas
                  </button>

                  {showAdvanced && (
                    <div className="mt-4 space-y-6">
                      {tool.params
                        .filter((p) => p.ui.advanced)
                        .map((param) => (
                          <div key={param.key}>
                            <label className="block text-purple-300 text-sm font-semibold mb-2">
                              {param.name}
                              {param.required && <span className="text-red-400 ml-1">*</span>}
                            </label>
                            {param.ui.helperText && (
                              <p className="text-xs text-gray-400 mb-2">{param.ui.helperText}</p>
                            )}
                            {renderWidget(param)}
                            {errors[param.key] && (
                              <div className="flex items-center gap-2 mt-2 text-red-400 text-sm">
                                <AlertCircle className="w-4 h-4" />
                                {errors[param.key]}
                              </div>
                            )}
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              )}

              {/* Test Result */}
              {testResult && (
                <div className={`rounded-lg p-4 border ${
                  testResult.error ? 'bg-red-900/20 border-red-500' : 'bg-green-900/20 border-green-500'
                }`}>
                  <h4 className="font-semibold mb-2 text-white">Resultado do Teste</h4>
                  <pre className="text-sm overflow-auto max-h-48 text-gray-300">
                    {JSON.stringify(testResult, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400">
              Erro ao carregar metadados da ferramenta
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 p-6 border-t border-purple-500/20">
          <button
            onClick={onClose}
            className="px-6 py-2 text-purple-300 hover:text-white transition"
          >
            Cancelar
          </button>

          <div className="flex items-center gap-3">
            {onTest && (
              <button
                onClick={handleTest}
                disabled={isTesting}
                className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50"
              >
                <Play className="w-4 h-4" />
                {isTesting ? 'Testando...' : 'Testar Nó'}
              </button>
            )}

            <button
              onClick={handleSave}
              className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-2 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition"
            >
              <Save className="w-4 h-4" />
              Salvar
            </button>
          </div>
        </div>
      </div>
      
      {/* SmartFieldLinker Modal */}
      {showLinker && linkingField && (
        <SmartFieldLinker
          isOpen={showLinker}
          onClose={() => {
            setShowLinker(false);
            setLinkingField(null);
          }}
          fieldKey={linkingField.key}
          fieldLabel={linkingField.label}
          fieldType={linkingField.type}
          currentValue={config[linkingField.key]}
          availableOutputs={
            localNodes.flatMap(node => 
              extractNodeOutputs(node).map(field => ({
                ...field,
                nodeId: node.id,
                nodeName: node.data?.label || node.type || 'Node',
              }))
            )
          }
          onLink={(reference) => {
            updateConfig(linkingField.key, reference);
            setShowLinker(false);
            setLinkingField(null);
          }}
        />
      )}
    </div>
  );
}

// ============= KEY-VALUE WIDGET =============

interface KeyValueWidgetProps {
  value: Record<string, string>;
  onChange: (value: Record<string, string>) => void;
}

function KeyValueWidget({ value, onChange }: KeyValueWidgetProps) {
  const entries = Object.entries(value || {});

  const addEntry = () => {
    onChange({ ...value, '': '' });
  };

  const updateEntry = (oldKey: string, newKey: string, newValue: string) => {
    const newEntries = { ...value };
    if (oldKey !== newKey) {
      delete newEntries[oldKey];
    }
    newEntries[newKey] = newValue;
    onChange(newEntries);
  };

  const removeEntry = (key: string) => {
    const newEntries = { ...value };
    delete newEntries[key];
    onChange(newEntries);
  };

  return (
    <div className="space-y-2">
      {entries.map(([key, val], idx) => (
        <div key={idx} className="flex items-center gap-2">
          <input
            type="text"
            value={key}
            onChange={(e) => updateEntry(key, e.target.value, val)}
            placeholder="Chave"
            className="flex-1 bg-slate-700 text-white px-3 py-2 rounded-lg border border-purple-500/30 focus:border-purple-500 outline-none text-sm"
          />
          <input
            type="text"
            value={val}
            onChange={(e) => updateEntry(key, key, e.target.value)}
            placeholder="Valor"
            className="flex-1 bg-slate-700 text-white px-3 py-2 rounded-lg border border-purple-500/30 focus:border-purple-500 outline-none text-sm"
          />
          <button
            onClick={() => removeEntry(key)}
            className="text-red-400 hover:text-red-300 p-2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
      <button
        onClick={addEntry}
        className="w-full py-2 border-2 border-dashed border-purple-500/30 rounded-lg text-purple-400 hover:border-purple-500 hover:text-purple-300 transition text-sm"
      >
        + Adicionar
      </button>
    </div>
  );
}