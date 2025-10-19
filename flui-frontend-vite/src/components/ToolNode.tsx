/**
 * ToolNode - Componente de nó estilo N8n
 * Visual profissional com ícones e cores dinâmicas
 */

import { memo } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';
import {
  Settings,
  Play,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react';

interface ToolNodeData {
  label: string;
  description?: string;
  toolId: string;
  category?: string;
  color?: string;
  icon?: string;
  status?: 'idle' | 'running' | 'completed' | 'failed';
  executionTime?: number;
  onConfigure?: () => void;
}

const categoryColors: Record<string, string> = {
  system: '#10b981',
  http: '#06b6d4',
  agent: '#8b5cf6',
  custom: '#f59e0b',
  mcp: '#a855f7',
  data: '#3b82f6',
  ai: '#ec4899',
};

const statusIcons = {
  idle: Clock,
  running: Play,
  completed: CheckCircle,
  failed: XCircle,
};

function ToolNode({ data, selected }: NodeProps<ToolNodeData>) {
  const color = data.color || categoryColors[data.category || 'system'] || '#64748b';
  const StatusIcon = statusIcons[data.status || 'idle'];

  return (
    <div
      className={`
        bg-white rounded-lg shadow-md border-2 transition-all duration-200
        ${selected ? 'border-blue-500 shadow-lg' : 'border-gray-200'}
        ${data.status === 'running' ? 'animate-pulse' : ''}
        hover:shadow-lg
        min-w-[200px] max-w-[300px]
      `}
    >
      {/* Handle de entrada (topo) */}
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-gray-400 !w-3 !h-3 !border-2 !border-white"
      />

      {/* Header com cor da categoria */}
      <div
        className="px-4 py-2 rounded-t-lg flex items-center justify-between"
        style={{ backgroundColor: color }}
      >
        <div className="flex items-center gap-2">
          <StatusIcon className="w-4 h-4 text-white" />
          <span className="text-white font-medium text-sm truncate">
            {data.label}
          </span>
        </div>
        
        {data.onConfigure && (
          <button
            onClick={data.onConfigure}
            className="text-white hover:bg-white/20 rounded p-1 transition-colors"
            title="Configurar nó"
          >
            <Settings className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Body */}
      <div className="px-4 py-3 bg-white">
        {data.description && (
          <p className="text-xs text-gray-600 mb-2 line-clamp-2">
            {data.description}
          </p>
        )}
        
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span className="bg-gray-100 px-2 py-1 rounded">
            {data.category || 'tool'}
          </span>
          
          {data.executionTime !== undefined && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {data.executionTime}ms
            </span>
          )}
        </div>
      </div>

      {/* Footer com status */}
      {data.status && data.status !== 'idle' && (
        <div
          className={`
            px-4 py-1 text-xs rounded-b-lg
            ${data.status === 'running' ? 'bg-blue-50 text-blue-700' : ''}
            ${data.status === 'completed' ? 'bg-green-50 text-green-700' : ''}
            ${data.status === 'failed' ? 'bg-red-50 text-red-700' : ''}
          `}
        >
          {data.status === 'running' && 'Executando...'}
          {data.status === 'completed' && 'Concluído'}
          {data.status === 'failed' && 'Falhou'}
        </div>
      )}

      {/* Handle de saída (fundo) */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-gray-400 !w-3 !h-3 !border-2 !border-white"
      />
    </div>
  );
}

export default memo(ToolNode);
