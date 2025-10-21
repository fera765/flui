/**
 * MCPInstallModal - Modal para instalação e teste de MCPs
 * 
 * ✅ Suporte a NPX, NPM, GitHub, Local
 * ✅ Busca automática de metadados
 * ✅ Instalação e teste real
 * ✅ Validação de tools no registry
 */

import { useState } from 'react';
import { X, Loader2, Check, AlertCircle, Github, Package, Terminal, HardDrive } from 'lucide-react';
import {
  fetchMCPMetadata,
  installAndTestMCP,
  type MCPInstallation,
} from '../services/mcpService';

interface MCPInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function MCPInstallModal({
  isOpen,
  onClose,
  onSuccess,
}: MCPInstallModalProps) {
  const [installType, setInstallType] = useState<'npx' | 'npm' | 'github' | 'local'>('npx');
  const [server, setServer] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [version, setVersion] = useState('1.0.0');
  const [isFetching, setIsFetching] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [installProgress, setInstallProgress] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleFetchMetadata = async () => {
    if (!server.trim()) {
      alert('Preencha o campo de servidor/pacote');
      return;
    }

    setIsFetching(true);
    setError(null);

    try {
      const metadata = await fetchMCPMetadata(server, installType);
      
      if (metadata) {
        setName(metadata.name || '');
        setDescription(metadata.description || '');
        setVersion(metadata.version || '1.0.0');
        
        setInstallProgress((prev) => [
          ...prev,
          `✅ Metadados carregados: ${metadata.name}`,
        ]);
      } else {
        setError('Não foi possível buscar metadados. Preencha manualmente.');
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao buscar metadados');
    } finally {
      setIsFetching(false);
    }
  };

  const handleInstall = async () => {
    if (!name.trim() || !server.trim()) {
      alert('Preencha nome e servidor');
      return;
    }

    setIsInstalling(true);
    setError(null);
    setInstallProgress([]);
    setSuccess(false);

    try {
      setInstallProgress((prev) => [...prev, '📦 Iniciando instalação...']);

      const installation: MCPInstallation = {
        name,
        description,
        version,
        server,
        installType,
        enabled: true,
      };

      setInstallProgress((prev) => [...prev, '⏳ Instalando MCP...']);

      const result = await installAndTestMCP(installation);

      setInstallProgress((prev) => [
        ...prev,
        `✅ MCP instalado com ID: ${result.mcp.id}`,
        `🔄 Sincronização: ${result.testResult.toolsFound} tools encontradas`,
        `🧪 Teste: ${result.testResult.success ? 'SUCESSO' : 'FALHOU'}`,
        `📋 Tool Registry: ${result.toolsInRegistry.toolsCount} tools registradas`,
      ]);

      if (result.toolsInRegistry.tools.length > 0) {
        setInstallProgress((prev) => [
          ...prev,
          `📚 Tools disponíveis: ${result.toolsInRegistry.tools.join(', ')}`,
        ]);
      }

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Erro ao instalar MCP');
      setInstallProgress((prev) => [...prev, `❌ Erro: ${err.message}`]);
    } finally {
      setIsInstalling(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Instalar MCP</h2>
              <p className="text-sm text-gray-500 mt-1">
                Model Context Protocol - Adicionar novas ferramentas
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
              disabled={isInstalling}
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Install Type */}
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-3">
              Tipo de Instalação
            </label>
            <div className="grid grid-cols-4 gap-2">
              <button
                onClick={() => setInstallType('npx')}
                disabled={isInstalling}
                className={`p-4 rounded-xl border-2 transition-all ${
                  installType === 'npx'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Terminal className="w-6 h-6 mx-auto mb-2" />
                <div className="text-xs font-bold">NPX</div>
              </button>
              <button
                onClick={() => setInstallType('npm')}
                disabled={isInstalling}
                className={`p-4 rounded-xl border-2 transition-all ${
                  installType === 'npm'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Package className="w-6 h-6 mx-auto mb-2" />
                <div className="text-xs font-bold">NPM</div>
              </button>
              <button
                onClick={() => setInstallType('github')}
                disabled={isInstalling}
                className={`p-4 rounded-xl border-2 transition-all ${
                  installType === 'github'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Github className="w-6 h-6 mx-auto mb-2" />
                <div className="text-xs font-bold">GitHub</div>
              </button>
              <button
                onClick={() => setInstallType('local')}
                disabled={isInstalling}
                className={`p-4 rounded-xl border-2 transition-all ${
                  installType === 'local'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <HardDrive className="w-6 h-6 mx-auto mb-2" />
                <div className="text-xs font-bold">Local</div>
              </button>
            </div>
          </div>

          {/* Server */}
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">
              {installType === 'github' ? 'Repositório' : 
               installType === 'local' ? 'Caminho' : 'Pacote'} *
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={server}
                onChange={(e) => setServer(e.target.value)}
                placeholder={
                  installType === 'github'
                    ? 'owner/repository'
                    : installType === 'local'
                    ? '/caminho/para/mcp-server'
                    : '@modelcontextprotocol/server-github'
                }
                disabled={isInstalling}
                className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none font-mono text-sm"
              />
              <button
                onClick={handleFetchMetadata}
                disabled={isFetching || isInstalling || !server.trim()}
                className="px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-xl font-bold transition-colors flex items-center gap-2"
              >
                {isFetching ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  '🔍 Auto'
                )}
              </button>
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">
              Nome *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: GitHub MCP"
              disabled={isInstalling}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">
              Descrição
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Breve descrição do MCP"
              rows={2}
              disabled={isInstalling}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none resize-none"
            />
          </div>

          {/* Version */}
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">
              Versão
            </label>
            <input
              type="text"
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              placeholder="1.0.0"
              disabled={isInstalling}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-bold text-red-900">Erro</h4>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Progress */}
          {installProgress.length > 0 && (
            <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-4">
              <h4 className="font-bold text-gray-900 mb-2">Progresso</h4>
              <div className="space-y-1 font-mono text-xs">
                {installProgress.map((msg, index) => (
                  <div key={index} className="text-gray-700">
                    {msg}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Success */}
          {success && (
            <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-bold text-green-900">Sucesso!</h4>
                  <p className="text-sm text-green-700 mt-1">
                    MCP instalado e testado com sucesso. As ferramentas já estão disponíveis!
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isInstalling}
            className="px-6 py-3 text-gray-700 hover:text-gray-900 font-bold rounded-xl hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            {success ? 'Fechar' : 'Cancelar'}
          </button>
          {!success && (
            <button
              onClick={handleInstall}
              disabled={isInstalling || !name.trim() || !server.trim()}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-xl font-bold transition-colors shadow-lg flex items-center gap-2"
            >
              {isInstalling ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Instalando...
                </>
              ) : (
                <>
                  <Package className="w-5 h-5" />
                  Instalar e Testar
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
