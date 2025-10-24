import { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useWorkflowStore } from '@/store/workflowStore'
import { useTools, useMCPs } from '@/hooks/useAgents'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/services/api'
import { DynamicConfigInput } from './DynamicConfigInput'

export function NodeConfigModal() {
  const {
    isConfigModalOpen,
    closeConfigModal,
    selectedNode,
    updateNode,
    openLinkerModal,
  } = useWorkflowStore()

  const { data: tools = [] } = useTools()
  const { data: mcps = [] } = useMCPs()
  const { data: agents = [] } = useQuery({
    queryKey: ['agents'],
    queryFn: () => api.getAgents(),
  })

  const [config, setConfig] = useState<Record<string, any>>({})

  useEffect(() => {
    if (selectedNode) {
      setConfig(selectedNode.data.config || {})
    }
  }, [selectedNode])

  if (!selectedNode) return null

  // Get parameters based on node type
  let params: any[] = []
  let itemData: any = null
  
  if (selectedNode.data.type === 'agent' && selectedNode.data.agentId) {
    // ✅ Agent node - apenas o input (message)
    const agent = agents.find((a: any) => a.id === selectedNode.data.agentId)
    itemData = agent
    
    if (agent) {
      params = [
        {
          key: 'message',
          name: 'User Input',
          description: 'Mensagem/input para o agente processar',
          type: 'string',
          required: true,
        },
      ]
    }
  } else if (selectedNode.data.mcpToolId || selectedNode.data.mcpId) {
    // ✅ MCP Tool node - buscar tool específica
    const mcpId = selectedNode.data.mcpId
    const toolId = selectedNode.data.mcpToolId
    
    const mcp = mcps.find((m: any) => m.id === mcpId)
    if (mcp && mcp.tools) {
      const mcpTool = mcp.tools.find((t: any) => 
        t.id === toolId || `${mcpId}-${t.name}` === toolId
      )
      
      if (mcpTool) {
        itemData = { ...mcpTool, mcpName: mcp.name }
        // ✅ Usar parameters em vez de inputSchema (padrão do backend)
        params = mcpTool.parameters && Object.keys(mcpTool.parameters).length > 0
          ? Object.entries(mcpTool.parameters).map(([key, prop]: [string, any]) => ({
              key,
              name: prop.title || key,
              description: prop.description,
              type: prop.type || 'string',
              required: prop.required || false,
            }))
          : []
      }
    }
  } else if (selectedNode.data.toolId) {
    // ✅ System Tool
    const tool = tools.find((t: any) => t.id === selectedNode.data.toolId)
    params = tool?.params || []
    itemData = tool
  }

  const handleSave = () => {
    // ✅ Salvar apenas config, nome/descrição são do agente/tool
    updateNode(selectedNode.id, {
      config,
    })
    closeConfigModal()
  }

  const handleConfigChange = (key: string, value: any) => {
    setConfig((prev) => ({ ...prev, [key]: value }))
  }

  const handleLinkerClick = (fieldKey: string, fieldType: string) => {
    openLinkerModal(fieldKey, fieldType)
  }

  return (
    <Modal
      isOpen={isConfigModalOpen}
      onClose={closeConfigModal}
      title={`Configure ${selectedNode.data.type} Node`}
      size="lg"
    >
      <div className="space-y-6">
        {/* ✅ Node Info (read-only) */}
        <div className="bg-muted p-3 rounded-lg">
          <h4 className="text-sm font-medium text-foreground mb-1">
            {selectedNode.data.name || selectedNode.data.type}
          </h4>
          <p className="text-xs text-muted-foreground">
            {selectedNode.data.description || 'No description'}
          </p>
          {itemData?.mcpName && (
            <p className="text-xs text-purple-500 mt-1">
              MCP: {itemData.mcpName}
            </p>
          )}
        </div>

        {/* ✅ Input Parameters (only) */}
        {params.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-foreground mb-3">
              {selectedNode.data.type === 'agent' ? 'Agent Input' : 'Tool Parameters'}
            </h3>
            <div className="space-y-4">
              {params.map((param: any) => (
                <div key={param.key}>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    {param.name}
                    {param.required && <span className="text-destructive ml-1">*</span>}
                  </label>
                  <DynamicConfigInput
                    param={param}
                    value={config[param.key]}
                    onChange={(value) => handleConfigChange(param.key, value)}
                    onLinkerClick={(key, type) => handleLinkerClick(key, type)}
                  />
                  {param.description && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {param.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Generic Config for other node types */}
        {params.length === 0 && (
          <div>
            <h3 className="text-sm font-medium text-foreground mb-3">Configuration</h3>
            <p className="text-sm text-muted-foreground mb-4">
              No parameters defined for this node type
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end gap-3 pt-4 border-t border-border">
          <Button type="button" variant="outline" onClick={closeConfigModal}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSave} data-testid="save-node-config">
            Save
          </Button>
        </div>
      </div>
    </Modal>
  )
}
