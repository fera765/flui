import { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';

interface NodeConfigModalProps {
  isOpen: boolean;
  node: any;
  onClose: () => void;
  onSave: (nodeId: string, config: any) => void;
}

export default function NodeConfigModal({ isOpen, node, onClose, onSave }: NodeConfigModalProps) {
  const [config, setConfig] = useState<any>({});

  useEffect(() => {
    if (node) {
      setConfig(node.data?.config || {});
    }
  }, [node]);

  if (!isOpen || !node) return null;

  const handleSave = () => {
    onSave(node.id, config);
    onClose();
  };

  const updateConfig = (key: string, value: any) => {
    setConfig((prev: any) => ({ ...prev, [key]: value }));
  };

  const renderConfigFields = () => {
    const nodeType = node.data?.toolType;

    switch (nodeType) {
      case 'agent':
        return (
          <>
            <div>
              <label className="block text-purple-300 text-sm font-semibold mb-2">
                Prompt do Agente
              </label>
              <textarea
                value={config.prompt || ''}
                onChange={(e) => updateConfig('prompt', e.target.value)}
                className="w-full bg-slate-700 text-white px-4 py-3 rounded-lg border border-purple-500/30 focus:border-purple-500 outline-none min-h-[120px]"
                placeholder="Digite o prompt para o agente..."
              />
            </div>
            <div>
              <label className="block text-purple-300 text-sm font-semibold mb-2">
                Temperatura (0-1)
              </label>
              <input
                type="number"
                min="0"
                max="1"
                step="0.1"
                value={config.temperature || 0.7}
                onChange={(e) => updateConfig('temperature', parseFloat(e.target.value))}
                className="w-full bg-slate-700 text-white px-4 py-3 rounded-lg border border-purple-500/30 focus:border-purple-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-purple-300 text-sm font-semibold mb-2">
                Max Tokens
              </label>
              <input
                type="number"
                value={config.maxTokens || 1000}
                onChange={(e) => updateConfig('maxTokens', parseInt(e.target.value))}
                className="w-full bg-slate-700 text-white px-4 py-3 rounded-lg border border-purple-500/30 focus:border-purple-500 outline-none"
              />
            </div>
          </>
        );

      case 'webhook':
        return (
          <>
            <div>
              <label className="block text-purple-300 text-sm font-semibold mb-2">
                URL do Webhook
              </label>
              <input
                type="text"
                value={config.url || ''}
                onChange={(e) => updateConfig('url', e.target.value)}
                className="w-full bg-slate-700 text-white px-4 py-3 rounded-lg border border-purple-500/30 focus:border-purple-500 outline-none"
                placeholder="https://..."
              />
            </div>
            <div>
              <label className="block text-purple-300 text-sm font-semibold mb-2">
                Método HTTP
              </label>
              <select
                value={config.method || 'POST'}
                onChange={(e) => updateConfig('method', e.target.value)}
                className="w-full bg-slate-700 text-white px-4 py-3 rounded-lg border border-purple-500/30 focus:border-purple-500 outline-none"
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
              </select>
            </div>
          </>
        );

      case 'http_request':
        return (
          <>
            <div>
              <label className="block text-purple-300 text-sm font-semibold mb-2">
                URL
              </label>
              <input
                type="text"
                value={config.url || ''}
                onChange={(e) => updateConfig('url', e.target.value)}
                className="w-full bg-slate-700 text-white px-4 py-3 rounded-lg border border-purple-500/30 focus:border-purple-500 outline-none"
                placeholder="https://api.example.com/endpoint"
              />
            </div>
            <div>
              <label className="block text-purple-300 text-sm font-semibold mb-2">
                Método
              </label>
              <select
                value={config.method || 'GET'}
                onChange={(e) => updateConfig('method', e.target.value)}
                className="w-full bg-slate-700 text-white px-4 py-3 rounded-lg border border-purple-500/30 focus:border-purple-500 outline-none"
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
              </select>
            </div>
            <div>
              <label className="block text-purple-300 text-sm font-semibold mb-2">
                Headers (JSON)
              </label>
              <textarea
                value={config.headers || ''}
                onChange={(e) => updateConfig('headers', e.target.value)}
                className="w-full bg-slate-700 text-white px-4 py-3 rounded-lg border border-purple-500/30 focus:border-purple-500 outline-none min-h-[80px] font-mono text-sm"
                placeholder='{"Content-Type": "application/json"}'
              />
            </div>
          </>
        );

      case 'condition':
        return (
          <>
            <div>
              <label className="block text-purple-300 text-sm font-semibold mb-2">
                Condição (JavaScript)
              </label>
              <textarea
                value={config.condition || ''}
                onChange={(e) => updateConfig('condition', e.target.value)}
                className="w-full bg-slate-700 text-white px-4 py-3 rounded-lg border border-purple-500/30 focus:border-purple-500 outline-none min-h-[100px] font-mono text-sm"
                placeholder="result.status === 'success'"
              />
            </div>
          </>
        );

      case 'delay':
        return (
          <>
            <div>
              <label className="block text-purple-300 text-sm font-semibold mb-2">
                Tempo de Atraso (ms)
              </label>
              <input
                type="number"
                value={config.duration || 1000}
                onChange={(e) => updateConfig('duration', parseInt(e.target.value))}
                className="w-full bg-slate-700 text-white px-4 py-3 rounded-lg border border-purple-500/30 focus:border-purple-500 outline-none"
              />
            </div>
          </>
        );

      case 'mcp':
        return (
          <>
            <div>
              <label className="block text-purple-300 text-sm font-semibold mb-2">
                Ferramenta MCP
              </label>
              <select
                value={config.tool || ''}
                onChange={(e) => updateConfig('tool', e.target.value)}
                className="w-full bg-slate-700 text-white px-4 py-3 rounded-lg border border-purple-500/30 focus:border-purple-500 outline-none"
              >
                <option value="">Selecione uma ferramenta...</option>
                {node.data?.toolConfig?.tools?.map((tool: any) => (
                  <option key={tool.name} value={tool.name}>
                    {tool.name} - {tool.description}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-purple-300 text-sm font-semibold mb-2">
                Parâmetros (JSON)
              </label>
              <textarea
                value={config.params || ''}
                onChange={(e) => updateConfig('params', e.target.value)}
                className="w-full bg-slate-700 text-white px-4 py-3 rounded-lg border border-purple-500/30 focus:border-purple-500 outline-none min-h-[100px] font-mono text-sm"
                placeholder='{"param1": "value1"}'
              />
            </div>
          </>
        );

      default:
        return (
          <div>
            <label className="block text-purple-300 text-sm font-semibold mb-2">
              Configuração (JSON)
            </label>
            <textarea
              value={JSON.stringify(config, null, 2)}
              onChange={(e) => {
                try {
                  setConfig(JSON.parse(e.target.value));
                } catch {}
              }}
              className="w-full bg-slate-700 text-white px-4 py-3 rounded-lg border border-purple-500/30 focus:border-purple-500 outline-none min-h-[200px] font-mono text-sm"
            />
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-800 rounded-xl border border-purple-500/30 w-full max-w-2xl shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-purple-500/20">
          <div>
            <h2 className="text-xl font-bold text-white">Configurar Nó</h2>
            <p className="text-sm text-purple-400 mt-1">
              {node.data?.label} • ID: {node.id}
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
          {renderConfigFields()}
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
            className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-2 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition"
          >
            <Save className="w-4 h-4" />
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}
