/**
 * FLUI - Node Config Modal (REFATORADO)
 * 
 * Gera campos de configuração dinamicamente baseado nos parâmetros da tool
 */

import { useState, useEffect } from 'react';
import { X, Save, Info } from 'lucide-react';

interface NodeConfigModalProps {
  isOpen: boolean;
  node: any;
  onClose: () => void;
  onSave: (nodeId: string, config: any) => void;
}

export default function NodeConfigModalNew({ isOpen, node, onClose, onSave }: NodeConfigModalProps) {
  const [config, setConfig] = useState<any>({});
  const [toolDetails, setToolDetails] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (node && isOpen) {
      // Carregar configuração atual
      setConfig(node.data?.config || {});
      
      // Carregar detalhes da tool da API
      loadToolDetails(node.data?.config?.id || node.id);
    }
  }, [node, isOpen]);

  const loadToolDetails = async (toolId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:3001/api/tools/${toolId}`);
      if (response.ok) {
        const tool = await response.json();
        setToolDetails(tool);
        
        // Aplicar defaults
        const defaultConfig: any = {};
        tool.params?.forEach((param: any) => {
          if (param.default !== undefined) {
            defaultConfig[param.name] = param.default;
          }
        });
        setConfig((prev: any) => ({ ...defaultConfig, ...prev }));
      }
    } catch (error) {
      console.error('Erro ao carregar tool:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !node) return null;

  const handleSave = () => {
    // Validar campos obrigatórios
    const newErrors: Record<string, string> = {};
    
    toolDetails?.params?.forEach((param: any) => {
      if (param.required && !config[param.name]) {
        newErrors[param.name] = `${param.name} é obrigatório`;
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSave(node.id, config);
    onClose();
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

  const renderField = (param: any) => {
    const hasError = !!errors[param.name];
    const errorClass = hasError ? 'border-red-500' : 'border-purple-500/30';

    switch (param.type) {
      case 'string':
        if (param.options && param.options.length > 0) {
          // Select dropdown
          return (
            <div key={param.name} className="space-y-2">
              <label className="block text-purple-300 text-sm font-semibold">
                {param.name}
                {param.required && <span className="text-red-400 ml-1">*</span>}
              </label>
              <select
                value={config[param.name] || param.default || ''}
                onChange={(e) => updateConfig(param.name, e.target.value)}
                className={`w-full bg-slate-700 text-white px-4 py-3 rounded-lg border ${errorClass} focus:border-purple-500 outline-none`}
              >
                <option value="">Selecione...</option>
                {param.options.map((opt: string) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
              <p className="text-xs text-purple-400/70">{param.description}</p>
              {hasError && <p className="text-xs text-red-400">{errors[param.name]}</p>}
            </div>
          );
        }
        
        // Textarea para strings longas
        if (param.name.includes('code') || param.name.includes('prompt') || param.name.includes('description')) {
          return (
            <div key={param.name} className="space-y-2">
              <label className="block text-purple-300 text-sm font-semibold">
                {param.name}
                {param.required && <span className="text-red-400 ml-1">*</span>}
              </label>
              <textarea
                value={config[param.name] || param.default || ''}
                onChange={(e) => updateConfig(param.name, e.target.value)}
                placeholder={param.placeholder}
                className={`w-full bg-slate-700 text-white px-4 py-3 rounded-lg border ${errorClass} focus:border-purple-500 outline-none min-h-[120px] font-mono text-sm`}
              />
              <p className="text-xs text-purple-400/70">{param.description}</p>
              {hasError && <p className="text-xs text-red-400">{errors[param.name]}</p>}
            </div>
          );
        }
        
        // Input normal
        return (
          <div key={param.name} className="space-y-2">
            <label className="block text-purple-300 text-sm font-semibold">
              {param.name}
              {param.required && <span className="text-red-400 ml-1">*</span>}
            </label>
            <input
              type="text"
              value={config[param.name] || param.default || ''}
              onChange={(e) => updateConfig(param.name, e.target.value)}
              placeholder={param.placeholder}
              className={`w-full bg-slate-700 text-white px-4 py-3 rounded-lg border ${errorClass} focus:border-purple-500 outline-none`}
            />
            <p className="text-xs text-purple-400/70">{param.description}</p>
            {hasError && <p className="text-xs text-red-400">{errors[param.name]}</p>}
          </div>
        );

      case 'number':
        return (
          <div key={param.name} className="space-y-2">
            <label className="block text-purple-300 text-sm font-semibold">
              {param.name}
              {param.required && <span className="text-red-400 ml-1">*</span>}
            </label>
            <input
              type="number"
              value={config[param.name] ?? param.default ?? 0}
              onChange={(e) => updateConfig(param.name, parseFloat(e.target.value))}
              className={`w-full bg-slate-700 text-white px-4 py-3 rounded-lg border ${errorClass} focus:border-purple-500 outline-none`}
            />
            <p className="text-xs text-purple-400/70">{param.description}</p>
            {hasError && <p className="text-xs text-red-400">{errors[param.name]}</p>}
          </div>
        );

      case 'boolean':
        return (
          <div key={param.name} className="space-y-2">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={config[param.name] ?? param.default ?? false}
                onChange={(e) => updateConfig(param.name, e.target.checked)}
                className="w-5 h-5 rounded border-purple-500/30 bg-slate-700 text-purple-500 focus:ring-purple-500"
              />
              <div>
                <span className="text-purple-300 text-sm font-semibold">{param.name}</span>
                <p className="text-xs text-purple-400/70">{param.description}</p>
              </div>
            </label>
          </div>
        );

      case 'object':
      case 'json':
        return (
          <div key={param.name} className="space-y-2">
            <label className="block text-purple-300 text-sm font-semibold">
              {param.name} (JSON)
              {param.required && <span className="text-red-400 ml-1">*</span>}
            </label>
            <textarea
              value={
                typeof config[param.name] === 'object'
                  ? JSON.stringify(config[param.name], null, 2)
                  : config[param.name] || param.default || '{}'
              }
              onChange={(e) => {
                try {
                  const parsed = JSON.parse(e.target.value);
                  updateConfig(param.name, parsed);
                } catch {
                  updateConfig(param.name, e.target.value);
                }
              }}
              className={`w-full bg-slate-700 text-white px-4 py-3 rounded-lg border ${errorClass} focus:border-purple-500 outline-none min-h-[100px] font-mono text-sm`}
            />
            <p className="text-xs text-purple-400/70">{param.description}</p>
            {hasError && <p className="text-xs text-red-400">{errors[param.name]}</p>}
          </div>
        );

      default:
        return (
          <div key={param.name} className="space-y-2">
            <label className="block text-purple-300 text-sm font-semibold">
              {param.name}
              {param.required && <span className="text-red-400 ml-1">*</span>}
            </label>
            <input
              type="text"
              value={config[param.name] || param.default || ''}
              onChange={(e) => updateConfig(param.name, e.target.value)}
              className={`w-full bg-slate-700 text-white px-4 py-3 rounded-lg border ${errorClass} focus:border-purple-500 outline-none`}
            />
            <p className="text-xs text-purple-400/70">{param.description}</p>
            {hasError && <p className="text-xs text-red-400">{errors[param.name]}</p>}
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-800 rounded-xl border border-purple-500/30 w-full max-w-3xl shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-purple-500/20">
          <div>
            <h2 className="text-xl font-bold text-white">Configurar Nó</h2>
            <p className="text-sm text-purple-400 mt-1">
              {toolDetails?.name || node.data?.label} • ID: {node.id}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-purple-300 hover:text-white transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading ? (
            <div className="text-center py-12">
              <p className="text-purple-400">Carregando configurações...</p>
            </div>
          ) : !toolDetails ? (
            <div className="text-center py-12">
              <p className="text-red-400">Erro ao carregar ferramenta</p>
            </div>
          ) : (
            <>
              {/* Tool description */}
              {toolDetails.description && (
                <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <Info className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-purple-300">{toolDetails.description}</p>
                  </div>
                </div>
              )}

              {/* Parameters */}
              {toolDetails.params && toolDetails.params.length > 0 ? (
                toolDetails.params.map((param: any) => renderField(param))
              ) : (
                <p className="text-center text-purple-400 py-8">
                  Esta ferramenta não possui parâmetros configuráveis
                </p>
              )}

              {/* Examples */}
              {toolDetails.ui?.examples && toolDetails.ui.examples.length > 0 && (
                <div className="border-t border-purple-500/20 pt-4 mt-4">
                  <h3 className="text-sm font-semibold text-purple-300 mb-3">
                    Exemplos de uso:
                  </h3>
                  <div className="space-y-2">
                    {toolDetails.ui.examples.map((example: any, idx: number) => (
                      <details key={idx} className="bg-slate-700/50 rounded-lg">
                        <summary className="px-4 py-2 cursor-pointer text-sm text-purple-300 hover:text-white">
                          {example.title}
                        </summary>
                        <div className="px-4 pb-3">
                          <p className="text-xs text-purple-400/70 mb-2">{example.description}</p>
                          <pre className="text-xs bg-slate-900/50 p-2 rounded overflow-x-auto">
                            {JSON.stringify(example.params, null, 2)}
                          </pre>
                        </div>
                      </details>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-purple-500/20">
          <button
            onClick={onClose}
            className="px-6 py-2 text-purple-300 hover:text-white transition"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-2 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}
