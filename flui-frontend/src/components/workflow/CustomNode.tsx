import { memo } from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import { Settings, Trash2, Bot, Zap, GitBranch, PlayCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useWorkflowStore } from '@/store/workflowStore'

const nodeIcons = {
  tool: Zap,
  agent: Bot,
  condition: GitBranch,
  'manual-trigger': PlayCircle,
  'cron-trigger': PlayCircle,
  'webhook-trigger': PlayCircle,
}

const nodeColors = {
  tool: 'bg-blue-500',
  agent: 'bg-purple-500',
  condition: 'bg-yellow-500',
  'manual-trigger': 'bg-green-500',
  'cron-trigger': 'bg-green-500',
  'webhook-trigger': 'bg-green-500',
}

export const CustomNode = memo(({ data, id }: NodeProps) => {
  const { openConfigModal, deleteNode, nodes } = useWorkflowStore()
  
  const Icon = nodeIcons[data.type as keyof typeof nodeIcons] || Zap
  const colorClass = nodeColors[data.type as keyof typeof nodeColors] || 'bg-gray-500'

  const currentNode = nodes.find(n => n.id === id)

  const handleConfig = () => {
    if (currentNode) {
      openConfigModal(currentNode)
    }
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    console.log('[CustomNode] Deleting node:', id)
    deleteNode(id)
    console.log('[CustomNode] Node deleted from store')
  }

  return (
    <div 
      className="relative bg-card border-2 border-border rounded-xl p-4 min-w-[240px] hover:border-primary/50 transition-colors"
      onPointerDown={(e) => e.stopPropagation()}
    >
      {/* Handles */}
      {!data.type?.includes('trigger') && (
        <Handle
          type="target"
          position={Position.Top}
          className="w-3 h-3 !bg-primary"
        />
      )}
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 !bg-primary"
      />

      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <div className={cn('p-2 rounded-lg', colorClass)}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm text-foreground truncate">
            {data.name || data.type}
          </h3>
          <p className="text-xs text-muted-foreground line-clamp-2">
            {data.description || `${data.type} node`}
          </p>
        </div>
      </div>

      {/* Config Preview */}
      {data.config && Object.keys(data.config).length > 0 && (
        <div className="mb-3 p-2 bg-muted rounded text-xs">
          <div className="text-muted-foreground mb-1">Configuration:</div>
          {Object.entries(data.config).slice(0, 2).map(([key, value]) => (
            <div key={key} className="truncate">
              <span className="font-medium">{key}:</span>{' '}
              <span className="text-muted-foreground">{String(value)}</span>
            </div>
          ))}
          {Object.keys(data.config).length > 2 && (
            <div className="text-muted-foreground">
              +{Object.keys(data.config).length - 2} more...
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={handleConfig}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg text-sm font-medium transition-colors"
          title="Configure node"
          data-testid="node-config-button"
        >
          <Settings className="w-4 h-4" />
          Config
        </button>
        <button
          onClick={handleDelete}
          className="p-2 bg-destructive/10 hover:bg-destructive/20 text-destructive rounded-lg transition-colors"
          title="Delete node"
          data-testid="node-delete-button"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
})

CustomNode.displayName = 'CustomNode'
