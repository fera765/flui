import { memo } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';
import { 
  Bot, 
  Zap, 
  Hammer, 
  Webhook, 
  Settings, 
  Activity,
  GitBranch,
  ChevronRight,
  AlertCircle
} from 'lucide-react';

interface ElegantNodeData {
  label: string;
  description?: string;
  toolType: string;
  config?: any;
  status?: 'idle' | 'running' | 'success' | 'error';
  isReturnPoint?: boolean;
  onConfigure?: () => void;
}

const ElegantNode = memo(({ data, selected }: NodeProps<ElegantNodeData>) => {
  const getIcon = () => {
    switch (data.toolType) {
      case 'agent': return Bot;
      case 'mcp': return Hammer;
      case 'webhook': return Webhook;
      case 'condition': return GitBranch;
      default: return Zap;
    }
  };

  const getColors = () => {
    if (data.status === 'running') {
      return {
        bg: 'bg-blue-500/10',
        border: 'border-blue-400/50',
        text: 'text-blue-400',
        icon: 'bg-blue-500',
        glow: 'shadow-lg shadow-blue-500/20',
      };
    }
    
    if (data.status === 'success') {
      return {
        bg: 'bg-green-500/10',
        border: 'border-green-400/50',
        text: 'text-green-400',
        icon: 'bg-green-500',
        glow: 'shadow-lg shadow-green-500/20',
      };
    }
    
    if (data.status === 'error') {
      return {
        bg: 'bg-red-500/10',
        border: 'border-red-400/50',
        text: 'text-red-400',
        icon: 'bg-red-500',
        glow: 'shadow-lg shadow-red-500/20',
      };
    }

    switch (data.toolType) {
      case 'agent':
        return {
          bg: 'bg-gradient-to-br from-blue-500/5 to-purple-500/5',
          border: selected ? 'border-blue-400' : 'border-blue-500/30',
          text: 'text-blue-400',
          icon: 'bg-gradient-to-br from-blue-500 to-blue-600',
          glow: selected ? 'shadow-xl shadow-blue-500/30' : 'shadow-lg shadow-blue-500/10',
        };
      case 'mcp':
        return {
          bg: 'bg-gradient-to-br from-purple-500/5 to-pink-500/5',
          border: selected ? 'border-purple-400' : 'border-purple-500/30',
          text: 'text-purple-400',
          icon: 'bg-gradient-to-br from-purple-500 to-pink-500',
          glow: selected ? 'shadow-xl shadow-purple-500/30' : 'shadow-lg shadow-purple-500/10',
        };
      case 'webhook':
        return {
          bg: 'bg-gradient-to-br from-yellow-500/5 to-orange-500/5',
          border: selected ? 'border-yellow-400' : 'border-yellow-500/30',
          text: 'text-yellow-400',
          icon: 'bg-gradient-to-br from-yellow-500 to-orange-500',
          glow: selected ? 'shadow-xl shadow-yellow-500/30' : 'shadow-lg shadow-yellow-500/10',
        };
      case 'condition':
        return {
          bg: 'bg-gradient-to-br from-cyan-500/5 to-teal-500/5',
          border: selected ? 'border-cyan-400' : 'border-cyan-500/30',
          text: 'text-cyan-400',
          icon: 'bg-gradient-to-br from-cyan-500 to-teal-500',
          glow: selected ? 'shadow-xl shadow-cyan-500/30' : 'shadow-lg shadow-cyan-500/10',
        };
      default:
        return {
          bg: 'bg-gradient-to-br from-slate-500/5 to-gray-500/5',
          border: selected ? 'border-gray-400' : 'border-gray-500/30',
          text: 'text-gray-400',
          icon: 'bg-gradient-to-br from-gray-500 to-gray-600',
          glow: selected ? 'shadow-xl shadow-gray-500/30' : 'shadow-lg shadow-gray-500/10',
        };
    }
  };

  const Icon = getIcon();
  const colors = getColors();
  const hasConfig = data.config && Object.keys(data.config).length > 0;

  return (
    <div
      className={`
        ${colors.bg} ${colors.border} ${colors.glow}
        border-2 rounded-2xl min-w-[240px] max-w-[280px]
        backdrop-blur-sm
        transition-all duration-300 ease-in-out
        ${selected ? 'ring-4 ring-offset-2 ring-offset-slate-900 scale-105' : 'hover:scale-102'}
        ${data.status === 'running' ? 'animate-pulse' : ''}
      `}
    >
      {/* Handles de conexão - Estilizados */}
      <Handle
        type="target"
        position={Position.Left}
        className="w-4 h-4 !bg-gradient-to-br from-purple-500 to-pink-500 !border-2 !border-slate-900 hover:scale-125 transition-transform"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="w-4 h-4 !bg-gradient-to-br from-purple-500 to-pink-500 !border-2 !border-slate-900 hover:scale-125 transition-transform"
      />

      {/* Return Point Indicator */}
      {data.isReturnPoint && (
        <div className="absolute -top-3 -right-3 bg-orange-500 text-white rounded-full p-1.5 shadow-lg shadow-orange-500/50 z-10">
          <ChevronRight className="w-3 h-3" />
        </div>
      )}

      {/* Status Indicator */}
      {data.status && data.status !== 'idle' && (
        <div className="absolute -top-2 -left-2 z-10">
          {data.status === 'running' && (
            <div className="bg-blue-500 text-white rounded-full p-1.5 shadow-lg animate-pulse">
              <Activity className="w-3 h-3" />
            </div>
          )}
          {data.status === 'error' && (
            <div className="bg-red-500 text-white rounded-full p-1.5 shadow-lg">
              <AlertCircle className="w-3 h-3" />
            </div>
          )}
        </div>
      )}

      {/* Header do nó */}
      <div className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className={`${colors.icon} p-2.5 rounded-xl shadow-lg`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className={`font-bold text-sm text-white truncate max-w-[160px]`} title={data.label}>
              {data.label}
            </h3>
            <div className={`text-xs px-2 py-0.5 rounded-full inline-block mt-1 ${colors.text} bg-current/10`}>
              {data.toolType}
            </div>
          </div>
          {data.onConfigure && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                data.onConfigure?.();
              }}
              className={`p-2 hover:bg-white/10 rounded-lg transition-all hover:scale-110 ${colors.text}`}
              title="Configurar"
            >
              <Settings className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Descrição */}
        {data.description && (
          <p className={`text-xs ${colors.text} opacity-70 line-clamp-2 mb-3 leading-relaxed`}>
            {data.description}
          </p>
        )}

        {/* Info adicional */}
        <div className="flex items-center justify-between pt-2 border-t border-white/5">
          <span className={`text-xs ${colors.text} opacity-50`}>
            {hasConfig ? 'Configurado' : 'Não configurado'}
          </span>
          {hasConfig && (
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          )}
        </div>
      </div>
    </div>
  );
});

ElegantNode.displayName = 'ElegantNode';

export default ElegantNode;
