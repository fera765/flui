import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { Bot, Zap, Hammer, Webhook, Settings } from 'lucide-react';

interface CustomNodeProps {
  data: {
    label: string;
    description: string;
    toolType: string;
    config?: any;
    onConfigure?: () => void;
  };
  selected?: boolean;
}

const CustomNode = memo(({ data, selected }: CustomNodeProps) => {
  const getIcon = () => {
    switch (data.toolType) {
      case 'agent': return Bot;
      case 'mcp': return Hammer;
      case 'webhook': return Webhook;
      default: return Zap;
    }
  };

  const getColors = () => {
    switch (data.toolType) {
      case 'agent':
        return {
          bg: 'bg-blue-500/20',
          border: selected ? 'border-blue-400' : 'border-blue-500/50',
          text: 'text-blue-400',
          icon: 'bg-blue-500',
        };
      case 'mcp':
        return {
          bg: 'bg-purple-500/20',
          border: selected ? 'border-purple-400' : 'border-purple-500/50',
          text: 'text-purple-400',
          icon: 'bg-purple-500',
        };
      case 'webhook':
        return {
          bg: 'bg-yellow-500/20',
          border: selected ? 'border-yellow-400' : 'border-yellow-500/50',
          text: 'text-yellow-400',
          icon: 'bg-yellow-500',
        };
      default:
        return {
          bg: 'bg-cyan-500/20',
          border: selected ? 'border-cyan-400' : 'border-cyan-500/50',
          text: 'text-cyan-400',
          icon: 'bg-cyan-500',
        };
    }
  };

  const Icon = getIcon();
  const colors = getColors();
  const hasConfig = data.config && Object.keys(data.config).length > 0;

  return (
    <div
      className={`
        ${colors.bg} ${colors.border}
        border-2 rounded-xl p-3 min-w-[200px] max-w-[280px]
        backdrop-blur-sm shadow-lg
        transition-all duration-200
        ${selected ? 'ring-2 ring-offset-2 ring-offset-slate-900' : ''}
        hover:scale-105
      `}
    >
      {/* Handles de conexão */}
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 !bg-purple-500 !border-2 !border-slate-900"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 !bg-purple-500 !border-2 !border-slate-900"
      />

      {/* Header do nó */}
      <div className="flex items-center gap-2 mb-2">
        <div className={`${colors.icon} p-1.5 rounded-lg`}>
          <Icon className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className={`font-semibold text-sm text-white truncate`}>
            {data.label}
          </h3>
        </div>
        {data.onConfigure && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              data.onConfigure?.();
            }}
            className="p-1 hover:bg-white/10 rounded transition"
            title="Configurar"
          >
            <Settings className={`w-4 h-4 ${colors.text}`} />
          </button>
        )}
      </div>

      {/* Descrição */}
      <p className={`text-xs ${colors.text} opacity-80 mb-2 line-clamp-2`}>
        {data.description}
      </p>

      {/* Badge de status */}
      <div className="flex items-center justify-between">
        <span className={`text-xs px-2 py-0.5 rounded bg-slate-900/50 ${colors.text}`}>
          {data.toolType.toUpperCase()}
        </span>
        {hasConfig && (
          <span className="text-xs text-green-400 flex items-center gap-1">
            <span className="w-2 h-2 bg-green-400 rounded-full"></span>
            Configurado
          </span>
        )}
      </div>
    </div>
  );
});

CustomNode.displayName = 'CustomNode';

export default CustomNode;
