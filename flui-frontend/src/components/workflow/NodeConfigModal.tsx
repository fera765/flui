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
  const [nodeName, setNodeName] = useState('')
  const [nodeDescription, setNodeDescription] = useState('')

  useEffect(() => {
    if (selectedNode) {
      setConfig(selectedNode.data.config || {})
      setNodeName(selectedNode.data.name || '')
      setNodeDescription(selectedNode.data.description || '')
    }
  }, [selectedNode])

  if (!selectedNode) return null

  // Get parameters based on node type
  let params: any[] = []
  let itemData: any = null
  
  if (selectedNode.data.type === 'tool' && selectedNode.data.toolId) {
    // Tool node
    const tool = tools.find((t: any) => t.id === selectedNode.data.toolId)
    params = tool?.params || []
    itemData = tool
  } else if (selectedNode.data.type === 'agent' && selectedNode.data.agentId) {
    // Agent node - criar parâmetros baseado nas propriedades do agente
    const agent = agents.find((a: any) => a.id === selectedNode.data.agentId)
    itemData = agent
    
    if (agent) {
      params = [
        {
          key: 'message',
          name: 'Message',
          description: 'Mensagem para o agente processar',
          type: 'string',
          required: true,
        },
        {
          key: 'model',
          name: 'Model Override',
          description: `Modelo a usar (padrão: ${agent.model})`,
          type: 'string',
          required: false,
        },
        {
          key: 'temperature',
          name: 'Temperature Override',
          description: `Temperature (padrão: ${agent.temperature})`,
          type: 'number',
          required: false,
        },
      ]
    }
  } else if (selectedNode.data.mcpId) {
    // MCP node
    const mcp = mcps.find((m: any) => m.id === selectedNode.data.mcpId)
    itemData = mcp
    
    // MCPs have tools, get params from MCP tools
    if (mcp && mcp.tools && mcp.tools.length > 0) {
      const mcpTool = mcp.tools[0]
      params = mcpTool.params || []
    }
  }

  const handleSave = () => {
    updateNode(selectedNode.id, {
      name: nodeName,
      description: nodeDescription,
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
        {/* Name & Description */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Node Name
          </label>
          <Input
            value={nodeName}
            onChange={(e) => setNodeName(e.target.value)}
            placeholder="Enter node name"
            data-testid="node-name-input"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Description
          </label>
          <Input
            value={nodeDescription}
            onChange={(e) => setNodeDescription(e.target.value)}
            placeholder="Enter description"
            data-testid="node-description-input"
          />
        </div>

        {/* Dynamic Parameters */}
        {params.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-foreground mb-3">Parameters</h3>
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

        {/* Item Info */}
        {itemData && (
          <div className="bg-muted p-3 rounded-lg mb-4">
            <h4 className="text-sm font-medium text-foreground mb-1">
              {selectedNode.data.type.charAt(0).toUpperCase() + selectedNode.data.type.slice(1)} Info
            </h4>
            <p className="text-xs text-muted-foreground">
              {itemData.description || 'No description available'}
            </p>
            {selectedNode.data.type === 'agent' && itemData.systemPrompt && (
              <p className="text-xs text-muted-foreground mt-2">
                <strong>System Prompt:</strong> {itemData.systemPrompt.substring(0, 100)}...
              </p>
            )}
          </div>
        )}
        
        {/* Generic Config for other node types */}
        {params.length === 0 && !itemData && (
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
