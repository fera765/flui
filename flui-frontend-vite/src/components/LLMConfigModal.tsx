/**
 * FLUI - LLM Configuration Modal
 * 
 * Modal elegante para configurar:
 * - Endpoint da API
 * - API Key
 * - Modelo padrão
 */

import { useState, useEffect } from 'react';
import { X, Save, Key, Globe, Sparkles, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import axios from 'axios';

interface LLMConfig {
  endpoint: string;
  apiKey: string;
  defaultModel: string;
}

interface Model {
  id: string;
  object: string;
  created?: number;
  owned_by?: string;
}

interface LLMConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: LLMConfig) => void;
  currentConfig?: LLMConfig;
}

export default function LLMConfigModal({
  isOpen,
  onClose,
  onSave,
  currentConfig,
}: LLMConfigModalProps) {
  const [endpoint, setEndpoint] = useState(currentConfig?.endpoint || 'https://api.llm7.io/v1');
  const [apiKey, setApiKey] = useState(currentConfig?.apiKey || '');
  const [defaultModel, setDefaultModel] = useState(currentConfig?.defaultModel || '');
  const [models, setModels] = useState<Model[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);

  // Carregar modelos ao abrir modal
  useEffect(() => {
    if (isOpen && endpoint && apiKey) {
      loadModels();
    }
  }, [isOpen]);

  const loadModels = async () => {
    if (!endpoint || !apiKey) {
      setError('Preencha o endpoint e API key primeiro');
      return;
    }

    setLoadingModels(true);
    setError('');
    setConnectionStatus('idle');

    try {
      const modelsEndpoint = `${endpoint}/models`;
      console.log('🔄 Carregando modelos de:', modelsEndpoint);

      const response = await axios.get(modelsEndpoint, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.data && response.data.data) {
        const modelsList = response.data.data;
        setModels(modelsList);
        setConnectionStatus('success');
        
        // Se não tem modelo selecionado, selecionar o primeiro que contém "gpt"
        if (!defaultModel && modelsList.length > 0) {
          const gptModel = modelsList.find((m: Model) => m.id.includes('gpt')) || modelsList[0];
          setDefaultModel(gptModel.id);
        }
        
        console.log(`✅ ${modelsList.length} modelos carregados`);
      } else {
        throw new Error('Resposta inválida do servidor');
      }
    } catch (err: any) {
      console.error('❌ Erro ao carregar modelos:', err);
      setConnectionStatus('error');
      setError(err.response?.data?.error?.message || err.message || 'Erro ao carregar modelos');
    } finally {
      setLoadingModels(false);
    }
  };

  const testConnection = async () => {
    setTestingConnection(true);
    setError('');
    setConnectionStatus('idle');

    try {
      const response = await axios.get(`${endpoint}/models`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
        timeout: 10000,
      });

      if (response.data && response.data.data) {
        setConnectionStatus('success');
        setTimeout(() => setConnectionStatus('idle'), 3000);
      }
    } catch (err: any) {
      setConnectionStatus('error');
      setError(err.response?.data?.error?.message || 'Falha na conexão');
    } finally {
      setTestingConnection(false);
    }
  };

  const handleSave = () => {
    if (!endpoint) {
      setError('Endpoint é obrigatório');
      return;
    }

    if (!apiKey) {
      setError('API Key é obrigatória');
      return;
    }

    if (!defaultModel) {
      setError('Selecione um modelo padrão');
      return;
    }

    const config: LLMConfig = {
      endpoint,
      apiKey,
      defaultModel,
    };

    console.log('💾 Salvando configuração LLM:', { ...config, apiKey: '***' });
    onSave(config);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-gradient-to-br from-white to-purple-50 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col border-2 border-purple-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-purple-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Configuração LLM</h2>
              <p className="text-sm text-gray-600 mt-1">Configure sua conexão com o modelo de linguagem</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-xl transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Endpoint */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-900">
              <Globe className="w-4 h-4 text-purple-600" />
              Endpoint da API
            </label>
            <input
              type="text"
              value={endpoint}
              onChange={(e) => setEndpoint(e.target.value)}
              placeholder="https://api.llm7.io/v1"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none transition-all text-gray-900"
            />
            <p className="text-xs text-gray-500">URL base do serviço de LLM</p>
          </div>

          {/* API Key */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-900">
              <Key className="w-4 h-4 text-purple-600" />
              API Key
            </label>
            <div className="relative">
              <input
                type={showApiKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-..."
                className="w-full px-4 py-3 pr-24 border-2 border-gray-300 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none transition-all text-gray-900 font-mono text-sm"
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 text-xs font-medium text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
              >
                {showApiKey ? 'Ocultar' : 'Mostrar'}
              </button>
            </div>
            <p className="text-xs text-gray-500">Sua chave de autenticação da API</p>
          </div>

          {/* Test Connection & Load Models */}
          <div className="flex gap-3">
            <button
              onClick={testConnection}
              disabled={!endpoint || !apiKey || testingConnection}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-cyan-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {testingConnection ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Testando...
                </>
              ) : connectionStatus === 'success' ? (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  Conexão OK
                </>
              ) : connectionStatus === 'error' ? (
                <>
                  <AlertCircle className="w-5 h-5" />
                  Erro
                </>
              ) : (
                <>
                  <Globe className="w-5 h-5" />
                  Testar Conexão
                </>
              )}
            </button>

            <button
              onClick={loadModels}
              disabled={!endpoint || !apiKey || loadingModels}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loadingModels ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Carregando...
                </>
              ) : (
                <>
                  <RefreshCw className="w-5 h-5" />
                  Carregar Modelos
                </>
              )}
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
              <p className="text-sm text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {error}
              </p>
            </div>
          )}

          {/* Model Selection */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-900">
              <Sparkles className="w-4 h-4 text-purple-600" />
              Modelo Padrão
            </label>
            
            {models.length > 0 ? (
              <select
                value={defaultModel}
                onChange={(e) => setDefaultModel(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none transition-all text-gray-900"
              >
                <option value="">Selecione um modelo...</option>
                {models.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.id}
                    {model.owned_by && ` (${model.owned_by})`}
                  </option>
                ))}
              </select>
            ) : (
              <div className="px-4 py-8 border-2 border-dashed border-gray-300 rounded-xl text-center">
                <Sparkles className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">
                  Clique em "Carregar Modelos" para ver os modelos disponíveis
                </p>
              </div>
            )}
            
            {models.length > 0 && (
              <p className="text-xs text-gray-500">
                {models.length} modelo(s) disponível(is)
              </p>
            )}
          </div>

          {/* Success Status */}
          {connectionStatus === 'success' && models.length > 0 && (
            <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4">
              <p className="text-sm text-green-700 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Conexão estabelecida com sucesso! {models.length} modelo(s) disponível(is)
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-purple-200">
          <button
            onClick={onClose}
            className="px-6 py-3 text-gray-700 hover:text-gray-900 font-semibold rounded-xl hover:bg-gray-100 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={!endpoint || !apiKey || !defaultModel}
            className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            <Save className="w-5 h-5" />
            Salvar Configuração
          </button>
        </div>
      </div>
    </div>
  );
}
