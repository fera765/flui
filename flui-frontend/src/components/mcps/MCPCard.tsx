import { Puzzle, RefreshCw, Settings, Trash2, Zap, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import type { MCP } from '@/types/api'

interface MCPCardProps {
  mcp: MCP
  onSync: (id: string) => void
  onTest: (id: string) => void
  onEdit: (mcp: MCP) => void
  onDelete: (id: string) => void
  isSyncing?: boolean
  isTesting?: boolean
}

export function MCPCard({ mcp, onSync, onTest, onEdit, onDelete, isSyncing, isTesting }: MCPCardProps) {
  return (
    <div className="group relative bg-card border border-border rounded-xl p-6 hover:border-primary/50 transition-colors">
      <div className="absolute top-4 right-4">
        <div
          className={cn(
            'w-3 h-3 rounded-full',
            mcp.enabled ? 'bg-green-500' : 'bg-gray-400'
          )}
          title={mcp.enabled ? 'Enabled' : 'Disabled'}
        />
      </div>

      <div className="flex items-start gap-4 mb-4">
        <div className="p-3 bg-primary/10 rounded-lg">
          <Puzzle className="w-6 h-6 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-foreground truncate">
            {mcp.name}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
            {mcp.description}
          </p>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Type:</span>
          <span className="text-foreground font-mono text-xs bg-muted px-2 py-1 rounded">
            {mcp.installType}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Zap className="w-4 h-4 text-muted-foreground" />
          <span className="text-muted-foreground">
            {mcp.tools?.length || 0} tools
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 pt-4 border-t border-border">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onSync(mcp.id)}
          isLoading={isSyncing}
          title="Sync tools"
        >
          <RefreshCw className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onTest(mcp.id)}
          isLoading={isTesting}
          title="Test connection"
        >
          <CheckCircle2 className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onEdit(mcp)}
          className="flex-1"
        >
          <Settings className="w-4 h-4" />
          Configure
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => onDelete(mcp.id)}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}
