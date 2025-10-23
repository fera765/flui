import { useState, useEffect } from 'react'
import { Link2 } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useWorkflowStore } from '@/store/workflowStore'
import { useTools } from '@/hooks/useAgents'

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

  const handleLinkerClick = (fieldKey: string) => {
    openLinkerModal(fieldKey)
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
                  <div className="flex gap-2">
                    <Input
                      value={config[param.key] || ''}
                      onChange={(e) => handleConfigChange(param.key, e.target.value)}
                      placeholder={param.description}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleLinkerClick(param.key)}
                      title="Link output from previous node"
                    >
                      <Link2 className="w-4 h-4" />
                    </Button>
                  </div>
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
            <div className="space-y-4">
              <div>
                <div className="flex gap-2 mb-2">
                  <Input
                    placeholder="Key"
                    className="flex-1"
                    id="new-config-key"
                  />
                  <Input
                    placeholder="Value"
                    className="flex-1"
                    id="new-config-value"
                  />
                  <Button
                    type="button"
                    onClick={() => {
                      const key = (document.getElementById('new-config-key') as HTMLInputElement)?.value
                      const value = (document.getElementById('new-config-value') as HTMLInputElement)?.value
                      if (key && value) {
                        handleConfigChange(key, value)
                        ;(document.getElementById('new-config-key') as HTMLInputElement).value = ''
                        ;(document.getElementById('new-config-value') as HTMLInputElement).value = ''
                      }
                    }}
                  >
                    Add
                  </Button>
                </div>
              </div>

              {/* Show existing config */}
              {Object.entries(config).map(([key, value]) => (
                <div key={key} className="flex gap-2 items-center p-3 bg-muted rounded">
                  <div className="flex-1">
                    <div className="font-medium text-sm">{key}</div>
                    <div className="text-xs text-muted-foreground">{String(value)}</div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleLinkerClick(key)}
                  >
                    <Link2 className="w-4 h-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const newConfig = { ...config }
                      delete newConfig[key]
                      setConfig(newConfig)
                    }}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end gap-3 pt-4 border-t border-border">
          <Button type="button" variant="outline" onClick={closeConfigModal}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSave}>
            Save
          </Button>
        </div>
      </div>
    </Modal>
  )
}
