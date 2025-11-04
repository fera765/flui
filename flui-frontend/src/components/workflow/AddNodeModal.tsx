import { useState } from 'react'
import { Search, Bot, Puzzle, Zap } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/services/api'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

interface AddNodeModalProps {
  isOpen: boolean
  onClose: () => void
  onAddNode: (type: string, data: any) => void
}

export function AddNodeModal({ isOpen, onClose, onAddNode }: AddNodeModalProps) {
  const [search, setSearch] = useState('')
  const [selectedTab, setSelectedTab] = useState<'tools' | 'agents' | 'mcps'>('tools')

  const { data: tools = [] } = useQuery({
    queryKey: ['tools'],
    queryFn: () => api.getTools(),
    enabled: isOpen && selectedTab === 'tools',
  })

  const { data: agents = [] } = useQuery({
    queryKey: ['agents'],
    queryFn: () => api.getAgents(),
    enabled: isOpen && selectedTab === 'agents',
  })

  const { data: mcps = [] } = useQuery({
    queryKey: ['mcps'],
    queryFn: () => api.getMCPs(),
    enabled: isOpen && selectedTab === 'mcps',
  })

  // ✅ Group MCP tools by MCP for better organization
  const mcpGroups = mcps.map((mcp: any) => ({
    mcpId: mcp.id,
    mcpName: mcp.name,
    tools: (mcp.tools || []).map((tool: any) => ({
      ...tool,
      mcpName: mcp.name,
      mcpId: mcp.id,
      id: tool.id || `${mcp.id}-${tool.name}`,
      displayName: tool.name,
    }))
  })).filter(group => group.tools.length > 0)

  const filteredItems = (() => {
    let items: any[] = []
    
    if (selectedTab === 'tools') {
      items = tools
    } else if (selectedTab === 'agents') {
      items = agents
    }
    
    if (!search) return items
    return items.filter((item: any) => 
      (item.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (item.description || '').toLowerCase().includes(search.toLowerCase())
    )
  })()
  
  // Filter MCP groups by search
  const filteredMcpGroups = selectedTab === 'mcps' 
    ? mcpGroups.map(group => ({
        ...group,
        tools: search 
          ? group.tools.filter((tool: any) =>
              (tool.name || '').toLowerCase().includes(search.toLowerCase()) ||
              (tool.description || '').toLowerCase().includes(search.toLowerCase()) ||
              (group.mcpName || '').toLowerCase().includes(search.toLowerCase())
            )
          : group.tools
      })).filter(group => group.tools.length > 0)
    : []
  
  const totalMcpTools = mcpGroups.reduce((acc, group) => acc + group.tools.length, 0)

  const handleAddNode = (item: any) => {
    if (selectedTab === 'tools') {
      onAddNode('tool', {
        name: item.name,
        description: item.description,
        toolId: item.id,
        config: {},
      })
    } else if (selectedTab === 'agents') {
      onAddNode('agent', {
        name: item.name,
        description: item.description,
        agentId: item.id,
        config: {},
      })
    } else if (selectedTab === 'mcps') {
      // ✅ Add MCP tool (not the MCP itself)
      onAddNode('tool', {
        name: item.displayName || item.name,
        description: item.description || `Tool from ${item.mcpName}`,
        mcpToolId: item.id, // Tool ID
        mcpId: item.mcpId,  // MCP ID for reference
        mcpName: item.mcpName,
        config: {},
      })
    }
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Node" size="lg">
      <div className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search nodes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
            data-testid="add-node-search"
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-border">
          <button
            onClick={() => setSelectedTab('tools')}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
              selectedTab === 'tools'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
            data-testid="tab-tools"
          >
            <Zap className="w-4 h-4 inline mr-2" />
            Tools ({tools.length})
          </button>
          <button
            onClick={() => setSelectedTab('agents')}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
              selectedTab === 'agents'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
            data-testid="tab-agents"
          >
            <Bot className="w-4 h-4 inline mr-2" />
            Agents ({agents.length})
          </button>
          <button
            onClick={() => setSelectedTab('mcps')}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
              selectedTab === 'mcps'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
            data-testid="tab-mcps"
          >
            <Puzzle className="w-4 h-4 inline mr-2" />
            MCP Tools ({totalMcpTools})
          </button>
        </div>

        {/* Items Grid - Tools & Agents */}
        {selectedTab !== 'mcps' && (
          <div className="max-h-96 overflow-y-auto space-y-2" data-testid="nodes-list">
            {filteredItems.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No {selectedTab} found
              </div>
            )}
            
            {filteredItems.map((item: any) => (
              <button
                key={item.id}
                onClick={() => handleAddNode(item)}
                className="w-full p-4 bg-card border border-border rounded-lg hover:border-primary transition-colors text-left"
                data-testid={`node-item-${item.id}`}
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    {selectedTab === 'tools' && <Zap className="w-5 h-5 text-primary" />}
                    {selectedTab === 'agents' && <Bot className="w-5 h-5 text-primary" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground truncate">
                      {item.name}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                      {item.description || 'No description'}
                    </p>
                    {selectedTab === 'tools' && item.category && (
                      <span className="inline-block mt-2 px-2 py-0.5 text-xs bg-primary/10 text-primary rounded">
                        {item.category}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
        
        {/* MCP Tools - Grouped by MCP */}
        {selectedTab === 'mcps' && (
          <div className="max-h-96 overflow-y-auto space-y-4" data-testid="nodes-list">
            {filteredMcpGroups.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No MCP tools found
              </div>
            )}
            
            {filteredMcpGroups.map((group: any) => (
              <div key={group.mcpId} className="space-y-2">
                {/* MCP Header */}
                <div className="flex items-center gap-2 px-2 py-1 bg-purple-500/10 rounded">
                  <Puzzle className="w-4 h-4 text-purple-500" />
                  <h3 className="font-semibold text-sm text-purple-500">
                    {group.mcpName}
                  </h3>
                  <span className="text-xs text-muted-foreground">
                    ({group.tools.length} {group.tools.length === 1 ? 'tool' : 'tools'})
                  </span>
                </div>
                
                {/* MCP Tools */}
                {group.tools.map((tool: any) => (
                  <button
                    key={tool.id}
                    onClick={() => handleAddNode(tool)}
                    className="w-full p-3 ml-4 bg-card border border-border rounded-lg hover:border-primary transition-colors text-left"
                    data-testid={`node-item-${tool.id}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Puzzle className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm text-foreground truncate">
                          {tool.displayName || tool.name}
                        </h3>
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                          {tool.description || 'No description'}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end pt-4 border-t border-border">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  )
}
