/**
 * NodeConfigPanel - Painel de configuração dinâmico para nós
 * 
 * Renderiza campos automaticamente com base nos metadados da ferramenta
 * Suporta múltiplos tipos de widgets: TextInput, Select, KeyValue, CodeEditor, etc
 */

import { useState, useEffect } from 'react';
import { X, Save, Play, AlertCircle, Info, ChevronDown, ChevronUp } from 'lucide-react';
import axios from 'axios';
import { NodeInputSelector } from './NodeInputSelector';
import { OutputSelector } from './OutputSelector';

// ============= TYPES =============

interface UIConfig {
  widgetType: 'textInput' | 'textArea' | 'number' | 'select' | 'multiSelect' | 
              'checkbox' | 'toggle' | 'keyValue' | 'codeEditor' | 'jsonEditor' | 
              'filePicker' | 'datePicker' | 'timePicker' | 'colorPicker' | 'slider' | 'radio';
  placeholder?: string;
  helperText?: string;
  options?: Array<string | { label: string; value: any; description?: string; icon?: string }>;
  validation?: {
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
    pattern?: string;
  };
  advanced?: boolean;
  dependsOn?: string;
  showIf?: string;
  codeLanguage?: string;
  allowExpressions?: boolean;
  multiline?: boolean;
  rows?: number;
}

interface ToolParam {
  name: string;
  key: string;
  type: string;
  description: string;
  required: boolean;
  default?: any;
  ui: UIConfig;
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

interface NodeConfigPanelProps {
  isOpen: boolean;
  nodeId: string;
  toolId: string;
  initialConfig?: any;
  previousNodes?: Array<{ id: string; name: string }>; // Nodes anteriores conectados
  automationId?: string; // ID da automação atual
  onClose: () => void;
  onSave: (config: any) => void;
  onTest?: (config: any) => void;
}

// ============= COMPONENT =============

export default function NodeConfigPanel({
  isOpen,
  nodeId,
  toolId,
  initialConfig = {},
  previousNodes = [],
  automationId,
  onClose,
  onSave,
  onTest,
}: NodeConfigPanelProps) {
  const [tool, setTool] = useState<Tool | null>(null);
  const [config, setConfig] = useState<any>(initialConfig);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [selectedExample, setSelectedExample] = useState<number>(-1);

  // Carregar metadados da tool
  useEffect(() => {
    if (isOpen && toolId) {
      loadToolMetadata();
    }
  }, [isOpen, toolId]);

  const loadToolMetadata = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`http://localhost:3001/api/tools/${toolId}`);
      let toolData = response.data;
      
      // Para agent-executor, carregar agentes disponíveis dinamicamente
      if (toolId === 'agent-executor') {
        try {
          const agentsResponse = await axios.get('http://localhost:3001/api/agents');
          const agents = agentsResponse.data;
          
          // Atualizar opções do parâmetro agentId
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
      
      // Inicializar config com defaults se vazio
      if (Object.keys(config).length === 0 && toolData.params) {
        const defaultConfig: any = {};
        toolData.params.forEach((param: ToolParam) => {
          if (param.default !== undefined) {
            defaultConfig[param.key] = param.default;
          }
        });
        setConfig(defaultConfig);
      }
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
      const response = await axios.post(`http://localhost:3001/api/nodes/${nodeId}/test`, {
        toolId,
        params: config,
      });
      
      setTestResult(response.data);
    } catch (error: any) {
      setTestResult({
        error: error.response?.data?.error || error.message,
      });
    } finally {
      setIsTesting(false);
    }
  };

  const loadExample = (exampleIndex: number) => {
    if (!tool || !tool.ui.examples || exampleIndex < 0) return;
    
    const example = tool.ui.examples[exampleIndex];
    setConfig(example.params);
    setSelectedExample(exampleIndex);
  };

  const renderWidget = (param: ToolParam) => {
    const value = config[param.key];
    const error = errors[param.key];
    const { ui } = param;

    // Verificar se deve mostrar (showIf)
    if (ui.showIf) {
      try {
        const shouldShow = new Function('config', `with(config) { return ${ui.showIf}; }`)(config);
        if (!shouldShow) return null;
      } catch {
        // Se erro na expressão, mostrar mesmo assim
      }
    }

    const baseClasses = `w-full bg-slate-700 text-white px-4 py-3 rounded-lg border ${
      error ? 'border-red-500' : 'border-purple-500/30'
    } focus:border-purple-500 outline-none transition-colors`;

    switch (ui.widgetType) {
      case 'textInput':
        return (
          <OutputSelector
            automationId={automationId}
            currentNodeId={nodeId}
            fieldName={param.key}
            fieldValue={value || ''}
            onSelect={(newValue) => updateConfig(param.key, newValue)}
            placeholder={ui.placeholder}
          />
        );

      case 'textArea':
        return (
          <OutputSelector
            automationId={automationId}
            currentNodeId={nodeId}
            fieldName={param.key}
            fieldValue={value || ''}
            onSelect={(newValue) => updateConfig(param.key, newValue)}
            placeholder={ui.placeholder}
          />
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
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
            </div>
          ) : tool ? (
            <div className="space-y-6">
              {/* Input Selector Section (NEW) */}
              {previousNodes.length > 0 && (
                <div className="bg-slate-700/50 rounded-lg p-4 border border-blue-500/20">
                  <div className="flex items-center gap-2 mb-3">
                    <Info className="w-5 h-5 text-blue-400" />
                    <h3 className="font-semibold text-blue-300">Dados de Entrada</h3>
                  </div>
                  <NodeInputSelector
                    currentNodeId={nodeId}
                    previousNodes={previousNodes}
                    currentMappings={config.inputConfig?.mappings || []}
                    onChange={(mappings) => {
                      setConfig((prev: any) => ({
                        ...prev,
                        inputConfig: {
                          ...prev.inputConfig,
                          mappings,
                        },
                      }));
                    }}
                  />
                </div>
              )}

              {/* Examples */}
              {tool.ui.examples && tool.ui.examples.length > 0 && (
                <div className="bg-slate-700/50 rounded-lg p-4 border border-purple-500/20">
                  <div className="flex items-center gap-2 mb-3">
                    <Info className="w-5 h-5 text-purple-400" />
                    <h3 className="font-semibold text-purple-300">Exemplos</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {tool.ui.examples.map((example, idx) => (
                      <button
                        key={idx}
                        onClick={() => loadExample(idx)}
                        className={`text-left p-3 rounded-lg border transition-colors ${
                          selectedExample === idx
                            ? 'bg-purple-600/30 border-purple-500'
                            : 'bg-slate-800 border-slate-600 hover:border-purple-500/50'
                        }`}
                      >
                        <div className="font-medium text-white text-sm">{example.title}</div>
                        <div className="text-xs text-gray-400 mt-1">{example.description}</div>
                      </button>
                    ))}
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
                    {showAdvanced ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    <span className="font-medium">Opções Avançadas</span>
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
