import { Workflow, Play, Settings, Trash2, Clock } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { formatTimeAgo } from '@/lib/utils'
import type { Automation } from '@/types/api'

interface AutomationCardProps {
  automation: Automation
  onEdit: (automation: Automation) => void
  onDelete: (id: string) => void
  onExecute: (id: string) => void
  isExecuting?: boolean
}

export function AutomationCard({ automation, onEdit, onDelete, onExecute, isExecuting }: AutomationCardProps) {
  return (
    <div className="group relative bg-card border border-border rounded-xl p-6 hover:border-primary/50 transition-colors">
      {/* Status */}
      <div className="absolute top-4 right-4">
        <div
          className={cn(
            'w-3 h-3 rounded-full',
            automation.enabled ? 'bg-green-500' : 'bg-gray-400'
          )}
          title={automation.enabled ? 'Enabled' : 'Disabled'}
        />
      </div>

      {/* Icon & Name */}
      <div className="flex items-start gap-4 mb-4">
        <div className="p-3 bg-primary/10 rounded-lg">
          <Workflow className="w-6 h-6 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-foreground truncate">
            {automation.name}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
            {automation.description}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">
            {automation.nodes?.length || 0} nodes
          </span>
          <span className="text-muted-foreground">•</span>
          <span className="text-muted-foreground">
            {automation.edges?.length || 0} connections
          </span>
        </div>
        {automation.runCount !== undefined && (
          <div className="flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              {automation.runCount} executions
            </span>
          </div>
        )}
        {automation.updatedAt && (
          <div className="text-xs text-muted-foreground">
            Updated {formatTimeAgo(automation.updatedAt)}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-4 border-t border-border">
        <Button
          variant="default"
          size="sm"
          onClick={() => onExecute(automation.id)}
          isLoading={isExecuting}
          disabled={!automation.enabled}
        >
          <Play className="w-4 h-4" />
          Run
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onEdit(automation)}
          className="flex-1"
        >
          <Settings className="w-4 h-4" />
          Edit
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => onDelete(automation.id)}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}
