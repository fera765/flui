import { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useWorkflowStore } from '@/store/workflowStore'
import { useTools } from '@/hooks/useAgents'
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

  // Get tool parameters if this is a tool node
  const tool = tools.find((t: any) => t.id === selectedNode.data.toolId)
  const params = tool?.params || []

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
