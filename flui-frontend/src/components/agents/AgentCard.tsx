import { Bot, Settings, Trash2, Zap } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import type { Agent } from '@/types/api'

interface AgentCardProps {
  agent: Agent
  onEdit: (agent: Agent) => void
  onDelete: (id: string) => void
}

export function AgentCard({ agent, onEdit, onDelete }: AgentCardProps) {
  return (
    <div className="group relative bg-card border border-border rounded-xl p-6 hover:border-primary/50 transition-colors">
      {/* Status indicator */}
      <div className="absolute top-4 right-4">
        <div
          className={cn(
            'w-3 h-3 rounded-full',
            agent.enabled ? 'bg-green-500' : 'bg-gray-400'
          )}
          title={agent.enabled ? 'Enabled' : 'Disabled'}
        />
      </div>

      {/* Icon & Name */}
      <div className="flex items-start gap-4 mb-4">
        <div className="p-3 bg-primary/10 rounded-lg">
          <Bot className="w-6 h-6 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-foreground truncate">
            {agent.name}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
            {agent.description}
          </p>
        </div>
      </div>

      {/* Model & Tools */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Model:</span>
          <span className="text-foreground font-mono text-xs bg-muted px-2 py-1 rounded">
            {agent.model}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Zap className="w-4 h-4 text-muted-foreground" />
          <span className="text-muted-foreground">
            {agent.tools?.length || 0} tools
          </span>
          {agent.mcpIds && agent.mcpIds.length > 0 && (
            <>
              <span className="text-muted-foreground">•</span>
              <span className="text-muted-foreground">
                {agent.mcpIds.length} MCPs
              </span>
            </>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-4 border-t border-border">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onEdit(agent)}
          className="flex-1"
        >
          <Settings className="w-4 h-4" />
          Configure
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => onDelete(agent.id)}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}
