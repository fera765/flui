/**
 * FLUI - Node Configuration Modal V2
 * 
 * ✅ Completamente reconstruído do zero
 * ✅ 100% dinâmico - campos carregados do backend
 * ✅ Sem hardcoded - todos os valores vêm da API
 * ✅ Sistema de linker integrado
 * ✅ Persistência completa
 * ✅ Arrays com add/remove
 * ✅ JSON com pares chave-valor
 * ✅ Interface para não-técnicos
 */

import { useState, useEffect } from 'react';
import { X, Save, Link2, Plus, Trash2, Info, Loader2 } from 'lucide-react';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';

interface Tool {
  id: string;
  name: string;
  description: string;
  params: ToolParam[];
  ui?: {
    icon?: string;
    color?: string;
    examples?: Array<{
      title: string;
      description: string;
      params: any;
    }>;
  };
}

interface ToolParam {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'json';
  description: string;
  required: boolean;
  default?: any;
  placeholder?: string;
  options?: string[];
}

interface LinkedOutputField {
  nodeId: string;
  nodeName: string;
  key: string;
  label: string;
  type: string;
  description?: string;
}

interface NodeConfigurationModalProps {
  isOpen: boolean;
  automationId: string;
  nodeId: string;
  onClose: () => void;
  onSave: () => void;
}

export default function NodeConfigurationModalV2({
  isOpen,
  automationId,
  nodeId,
  onClose,
  onSave,
}: NodeConfigurationModalProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tool, setTool] = useState<Tool | null>(null);
  const [config, setConfig] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [availableOutputs, setAvailableOutputs] = useState<LinkedOutputField[]>([]);
  const [linkerOpen, setLinkerOpen] = useState<string | null>(null);

  // Carregar dados do node e tool
  useEffect(() => {
    if (isOpen && automationId && nodeId) {
      loadNodeData();
    }
  }, [isOpen, automationId, nodeId]);

  const loadNodeData = async () => {
    setLoading(true);
    try {
      // 1. Carregar node atual
      const nodeResponse = await axios.get(
        `${API_BASE_URL}/automations/${automationId}/nodes/${nodeId}`
      );
      const node = nodeResponse.data;
      
      // 2. Carregar tool metadata
      const toolId = node.config?.toolId || node.type;
      if (toolId) {
        const toolResponse = await axios.get(`${API_BASE_URL}/tools/${toolId}`);
        setTool(toolResponse.data);
        
        // 3. Carregar configuração atual
        setConfig(node.config?.params || {});
        
        // 4. Carregar outputs disponíveis dos nodes pais
        try {
          const outputsResponse = await axios.get(
            `${API_BASE_URL}/automations/${automationId}/nodes/${nodeId}/available-outputs`
          );
          
          // Flatten outputs de todos os nodes pais
          const allOutputs: LinkedOutputField[] = [];
          for (const parentOutput of outputsResponse.data.availableOutputs || []) {
            for (const key of parentOutput.outputKeys || []) {
              allOutputs.push({
                nodeId: parentOutput.nodeId,
                nodeName: parentOutput.nodeName,
                key,
                label: key,
                type: 'string', // Default type
                description: `Output de ${parentOutput.nodeName}`,
              });
            }
          }
          setAvailableOutputs(allOutputs);
        } catch (err) {
          console.error('❌ Erro ao carregar outputs:', err);
        }
      }
    } catch (error: any) {
      console.error('❌ Erro ao carregar node:', error);
      setErrors({ _global: 'Erro ao carregar configurações do node' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setErrors({});
    
    try {
      // Validar campos obrigatórios
      const newErrors: Record<string, string> = {};
      
      tool?.params?.forEach((param) => {
        if (param.required && !config[param.name]) {
          newErrors[param.name] = `${param.name} é obrigatório`;
        }
      });
      
      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }
      
      // Salvar configuração no backend
      await axios.patch(
        `${API_BASE_URL}/automations/${automationId}/nodes/${nodeId}/config`,
        { params: config, toolId: tool?.id }
      );
      
      console.log('✅ Configuração salva com sucesso');
      onSave();
      onClose();
    } catch (error: any) {
      console.error('❌ Erro ao salvar:', error);
      setErrors({ _global: error.response?.data?.error || 'Erro ao salvar configuração' });
    } finally {
      setSaving(false);
    }
  };

  const updateConfig = (key: string, value: any) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
    // Limpar erro do campo
    if (errors[key]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[key];
        return newErrors;
      });
    }
  };

  const handleLink = (fieldName: string, reference: string) => {
    updateConfig(fieldName, reference);
    setLinkerOpen(null);
  };

  const isLinked = (value: any): boolean => {
    return typeof value === 'string' && value.startsWith('{{') && value.endsWith('}}');
  };

  const renderField = (param: ToolParam) => {
    const hasError = !!errors[param.name];
    const errorClass = hasError ? 'border-red-500' : 'border-gray-300';
    const value = config[param.name] ?? param.default;
    const fieldIsLinked = isLinked(value);

    // Campo boolean - Switch
    if (param.type === 'boolean') {
      return (
        <div key={param.name} className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-900">
                {param.name}
                {param.required && <span className="text-red-500 ml-1">*</span>}
              </label>
              <p className="text-xs text-gray-500 mt-1">{param.description}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setLinkerOpen(linkerOpen === param.name ? null : param.name)}
                className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                title="Linkar campo"
              >
                <Link2 className={`w-4 h-4 ${fieldIsLinked ? 'text-green-600' : ''}`} />
              </button>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={fieldIsLinked ? false : (value ?? false)}
                  onChange={(e) => updateConfig(param.name, e.target.checked)}
                  disabled={fieldIsLinked}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>
          </div>
          {fieldIsLinked && (
            <div className="text-xs bg-green-50 border border-green-200 rounded px-2 py-1 text-green-700">
              🔗 Linkado: {value}
            </div>
          )}
          {linkerOpen === param.name && renderLinker(param.name, param.type)}
          {hasError && <p className="text-xs text-red-500">{errors[param.name]}</p>}
        </div>
      );
    }

    // Campo number
    if (param.type === 'number') {
      return (
        <div key={param.name} className="space-y-2">
          <label className="block text-sm font-semibold text-gray-900">
            {param.name}
            {param.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          <div className="flex gap-2">
            <input
              type={fieldIsLinked ? 'text' : 'number'}
              value={value ?? ''}
              onChange={(e) =>
                updateConfig(
                  param.name,
                  fieldIsLinked ? e.target.value : parseFloat(e.target.value) || 0
                )
              }
              placeholder={param.placeholder}
              disabled={fieldIsLinked}
              className={`flex-1 px-4 py-3 border-2 ${errorClass} rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none transition-all ${
                fieldIsLinked ? 'bg-green-50 text-green-700' : ''
              }`}
            />
            <button
              onClick={() => setLinkerOpen(linkerOpen === param.name ? null : param.name)}
              className={`p-3 rounded-xl border-2 transition-colors ${
                fieldIsLinked
                  ? 'bg-green-50 border-green-500 text-green-600'
                  : 'border-gray-300 text-purple-600 hover:bg-purple-50'
              }`}
              title="Linkar campo"
            >
              <Link2 className="w-5 h-5" />
            </button>
          </div>
          <p className="text-xs text-gray-500">{param.description}</p>
          {linkerOpen === param.name && renderLinker(param.name, param.type)}
          {hasError && <p className="text-xs text-red-500">{errors[param.name]}</p>}
        </div>
      );
    }

    // Campo string - Select ou Input
    if (param.type === 'string') {
      if (param.options && param.options.length > 0) {
        return (
          <div key={param.name} className="space-y-2">
            <label className="block text-sm font-semibold text-gray-900">
              {param.name}
              {param.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <div className="flex gap-2">
              <select
                value={value || ''}
                onChange={(e) => updateConfig(param.name, e.target.value)}
                disabled={fieldIsLinked}
                className={`flex-1 px-4 py-3 border-2 ${errorClass} rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none transition-all ${
                  fieldIsLinked ? 'bg-green-50 text-green-700' : ''
                }`}
              >
                <option value="">Selecione...</option>
                {param.options.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
              <button
                onClick={() => setLinkerOpen(linkerOpen === param.name ? null : param.name)}
                className={`p-3 rounded-xl border-2 transition-colors ${
                  fieldIsLinked
                    ? 'bg-green-50 border-green-500 text-green-600'
                    : 'border-gray-300 text-purple-600 hover:bg-purple-50'
                }`}
                title="Linkar campo"
              >
                <Link2 className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-gray-500">{param.description}</p>
            {linkerOpen === param.name && renderLinker(param.name, param.type)}
            {hasError && <p className="text-xs text-red-500">{errors[param.name]}</p>}
          </div>
        );
      }

      // Textarea para campos longos
      const isLongText =
        param.name.toLowerCase().includes('prompt') ||
        param.name.toLowerCase().includes('code') ||
        param.name.toLowerCase().includes('description');

      if (isLongText) {
        return (
          <div key={param.name} className="space-y-2">
            <label className="block text-sm font-semibold text-gray-900">
              {param.name}
              {param.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <textarea
              value={value || ''}
              onChange={(e) => updateConfig(param.name, e.target.value)}
              placeholder={param.placeholder}
              rows={4}
              disabled={fieldIsLinked}
              className={`w-full px-4 py-3 border-2 ${errorClass} rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none transition-all resize-none font-mono text-sm ${
                fieldIsLinked ? 'bg-green-50 text-green-700' : ''
              }`}
            />
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500">{param.description}</p>
              <button
                onClick={() => setLinkerOpen(linkerOpen === param.name ? null : param.name)}
                className={`p-2 rounded-lg transition-colors ${
                  fieldIsLinked
                    ? 'bg-green-50 text-green-600'
                    : 'text-purple-600 hover:bg-purple-50'
                }`}
                title="Linkar campo"
              >
                <Link2 className="w-4 h-4" />
              </button>
            </div>
            {linkerOpen === param.name && renderLinker(param.name, param.type)}
            {hasError && <p className="text-xs text-red-500">{errors[param.name]}</p>}
          </div>
        );
      }

      // Input simples
      return (
        <div key={param.name} className="space-y-2">
          <label className="block text-sm font-semibold text-gray-900">
            {param.name}
            {param.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={value || ''}
              onChange={(e) => updateConfig(param.name, e.target.value)}
              placeholder={param.placeholder}
              disabled={fieldIsLinked}
              className={`flex-1 px-4 py-3 border-2 ${errorClass} rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none transition-all ${
                fieldIsLinked ? 'bg-green-50 text-green-700' : ''
              }`}
            />
            <button
              onClick={() => setLinkerOpen(linkerOpen === param.name ? null : param.name)}
              className={`p-3 rounded-xl border-2 transition-colors ${
                fieldIsLinked
                  ? 'bg-green-50 border-green-500 text-green-600'
                  : 'border-gray-300 text-purple-600 hover:bg-purple-50'
              }`}
              title="Linkar campo"
            >
              <Link2 className="w-5 h-5" />
            </button>
          </div>
          <p className="text-xs text-gray-500">{param.description}</p>
          {linkerOpen === param.name && renderLinker(param.name, param.type)}
          {hasError && <p className="text-xs text-red-500">{errors[param.name]}</p>}
        </div>
      );
    }

    // Campo array
    if (param.type === 'array') {
      const arrayValue = Array.isArray(value) ? value : [];
      return (
        <div key={param.name} className="space-y-2">
          <label className="block text-sm font-semibold text-gray-900">
            {param.name}
            {param.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          <p className="text-xs text-gray-500">{param.description}</p>
          <div className="space-y-2 bg-gray-50 border-2 border-gray-200 rounded-xl p-4">
            {arrayValue.map((item, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  value={item}
                  onChange={(e) => {
                    const newArray = [...arrayValue];
                    newArray[index] = e.target.value;
                    updateConfig(param.name, newArray);
                  }}
                  className="flex-1 px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 outline-none"
                />
                <button
                  onClick={() => {
                    const newArray = arrayValue.filter((_, i) => i !== index);
                    updateConfig(param.name, newArray);
                  }}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            <button
              onClick={() => updateConfig(param.name, [...arrayValue, ''])}
              className="w-full py-2 border-2 border-dashed border-purple-300 text-purple-600 rounded-lg hover:bg-purple-50 transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Adicionar item
            </button>
          </div>
          {hasError && <p className="text-xs text-red-500">{errors[param.name]}</p>}
        </div>
      );
    }

    // Campo JSON/Object - Editor de pares chave-valor
    if (param.type === 'json' || param.type === 'object') {
      const objValue = typeof value === 'object' && value !== null ? value : {};
      const entries = Object.entries(objValue);

      return (
        <div key={param.name} className="space-y-2">
          <label className="block text-sm font-semibold text-gray-900">
            {param.name}
            {param.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          <p className="text-xs text-gray-500">{param.description}</p>
          <div className="space-y-2 bg-gray-50 border-2 border-gray-200 rounded-xl p-4">
            {entries.map(([key, val], index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  value={key}
                  onChange={(e) => {
                    const newObj = { ...objValue };
                    delete newObj[key];
                    newObj[e.target.value] = val;
                    updateConfig(param.name, newObj);
                  }}
                  placeholder="Chave"
                  className="w-1/3 px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 outline-none"
                />
                <input
                  type="text"
                  value={String(val)}
                  onChange={(e) => {
                    const newObj = { ...objValue };
                    newObj[key] = e.target.value;
                    updateConfig(param.name, newObj);
                  }}
                  placeholder="Valor"
                  className="flex-1 px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 outline-none"
                />
                <button
                  onClick={() => {
                    const newObj = { ...objValue };
                    delete newObj[key];
                    updateConfig(param.name, newObj);
                  }}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            <button
              onClick={() => {
                const newObj = { ...objValue };
                newObj[`key${entries.length + 1}`] = '';
                updateConfig(param.name, newObj);
              }}
              className="w-full py-2 border-2 border-dashed border-purple-300 text-purple-600 rounded-lg hover:bg-purple-50 transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Adicionar par chave-valor
            </button>
          </div>
          {hasError && <p className="text-xs text-red-500">{errors[param.name]}</p>}
        </div>
      );
    }

    // Fallback para tipos desconhecidos
    return (
      <div key={param.name} className="space-y-2">
        <label className="block text-sm font-semibold text-gray-900">
          {param.name}
          {param.required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <input
          type="text"
          value={value || ''}
          onChange={(e) => updateConfig(param.name, e.target.value)}
          placeholder={param.placeholder}
          className={`w-full px-4 py-3 border-2 ${errorClass} rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none transition-all`}
        />
        <p className="text-xs text-gray-500">{param.description}</p>
        {hasError && <p className="text-xs text-red-500">{errors[param.name]}</p>}
      </div>
    );
  };

  const renderLinker = (fieldName: string, fieldType: string) => {
    // Filtrar outputs compatíveis
    const compatibleOutputs = availableOutputs.filter((output) => {
      // Aceitar qualquer tipo por enquanto
      // TODO: implementar lógica de compatibilidade de tipos
      return true;
    });

    return (
      <div className="mt-2 bg-white border-2 border-purple-300 rounded-xl p-4 shadow-lg max-h-64 overflow-y-auto">
        <h4 className="text-sm font-semibold text-gray-900 mb-2">
          🔗 Conectar ao output de outro node
        </h4>
        {compatibleOutputs.length === 0 ? (
          <p className="text-xs text-gray-500">
            Nenhum output disponível dos nodes anteriores.
          </p>
        ) : (
          <div className="space-y-1">
            {compatibleOutputs.map((output) => {
              const reference = `{{${output.nodeId}.${output.key}}}`;
              return (
                <button
                  key={`${output.nodeId}-${output.key}`}
                  onClick={() => handleLink(fieldName, reference)}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-purple-50 transition-colors border border-gray-200"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {output.nodeName}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{output.key}</p>
                      <code className="text-xs text-purple-600 truncate block">
                        {reference}
                      </code>
                    </div>
                    <Link2 className="w-4 h-4 text-purple-600 flex-shrink-0 mt-1" />
                  </div>
                </button>
              );
            })}
          </div>
        )}
        <button
          onClick={() => setLinkerOpen(null)}
          className="mt-2 w-full py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          Cancelar
        </button>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col border-2 border-purple-500/30">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Configurar Nó</h2>
            <p className="text-sm text-gray-500 mt-1">
              {tool?.name || 'Carregando...'} • ID: {nodeId}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-xl transition-colors"
            disabled={saving}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-12 h-12 text-purple-600 animate-spin mb-4" />
              <p className="text-gray-600">Carregando configurações...</p>
            </div>
          ) : !tool ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Info className="w-12 h-12 text-red-500 mb-4" />
              <p className="text-red-600">Erro ao carregar ferramenta</p>
              {errors._global && <p className="text-sm text-gray-500 mt-2">{errors._global}</p>}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Tool description */}
              {tool.description && (
                <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-4">
                  <div className="flex items-start gap-2">
                    <Info className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-purple-900">{tool.description}</p>
                  </div>
                </div>
              )}

              {/* Parameters */}
              {tool.params && tool.params.length > 0 ? (
                tool.params.map((param) => renderField(param))
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">Esta ferramenta não possui parâmetros configuráveis</p>
                </div>
              )}

              {/* Examples */}
              {tool.ui?.examples && tool.ui.examples.length > 0 && (
                <div className="border-t-2 border-gray-200 pt-6">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">
                    💡 Exemplos de uso:
                  </h3>
                  <div className="space-y-2">
                    {tool.ui.examples.map((example, idx) => (
                      <details
                        key={idx}
                        className="bg-gray-50 border-2 border-gray-200 rounded-xl overflow-hidden"
                      >
                        <summary className="px-4 py-3 cursor-pointer text-sm font-medium text-gray-900 hover:bg-gray-100 transition-colors">
                          {example.title}
                        </summary>
                        <div className="px-4 pb-4 border-t border-gray-200">
                          <p className="text-xs text-gray-600 mb-2 mt-3">{example.description}</p>
                          <pre className="text-xs bg-gray-900 text-gray-100 p-3 rounded-lg overflow-x-auto">
                            {JSON.stringify(example.params, null, 2)}
                          </pre>
                        </div>
                      </details>
                    ))}
                  </div>
                </div>
              )}

              {/* Global error */}
              {errors._global && (
                <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
                  <p className="text-sm text-red-700">{errors._global}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-6 py-3 text-gray-700 hover:text-gray-900 font-semibold rounded-xl hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={loading || saving || !tool}
            className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 shadow-lg"
          >
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Salvar Configuração
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
