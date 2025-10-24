import { Link2, ChevronDown, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { useWorkflowStore } from '@/store/workflowStore'

interface TypedLinkerModalProps {
  isOpen: boolean
  onClose: () => void
  targetField: string
  targetType: string
  onSelect: (reference: string) => void
}

// Type compatibility checker
function isTypeCompatible(outputType: string, targetType: string): boolean {
  // Exact match
  if (outputType === targetType) return true
  
  // String is compatible with most types (can be parsed)
  if (targetType === 'string') return true
  
  // Number can be used as string
  if (outputType === 'number' && targetType === 'string') return true
  
  // Boolean can be used as string
  if (outputType === 'boolean' && targetType === 'string') return true
  
  // Array/Object are compatible with json
  if ((outputType === 'array' || outputType === 'object') && targetType === 'json') return true
  if ((outputType === 'json') && (targetType === 'array' || targetType === 'object')) return true
  
  return false
}

export function TypedLinkerModal({ isOpen, onClose, targetField, targetType, onSelect }: TypedLinkerModalProps) {
  const { nodes, selectedNodeId } = useWorkflowStore()
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())

  // Get previous nodes (simplified - in real app would traverse edges)
  const availableNodes = nodes.filter(n => n.id !== selectedNodeId)

  // Mock output types for demo (in real app, would come from tool/agent schema)
  const getOutputsForNode = (node: any) => {
    const outputs: Array<{ key: string; type: string; description: string }> = [
      { key: 'output', type: 'string', description: 'Main output' },
      { key: 'success', type: 'boolean', description: 'Success status' },
      { key: 'data', type: 'json', description: 'Output data' },
    ]

    // Add type-specific outputs
    if (node.data.type === 'agent') {
      outputs.push(
        { key: 'response', type: 'string', description: 'Agent response' },
        { key: 'tokens', type: 'number', description: 'Tokens used' }
      )
    } else if (node.data.type === 'tool') {
      outputs.push(
        { key: 'result', type: 'string', description: 'Tool result' }
      )
    } else if (node.data.type === 'condition') {
      outputs.push(
        { key: 'matched', type: 'boolean', description: 'Condition matched' },
        { key: 'path', type: 'string', description: 'Chosen path' }
      )
    }

    return outputs
  }

  const toggleNode = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes)
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId)
    } else {
      newExpanded.add(nodeId)
    }
    setExpandedNodes(newExpanded)
  }

  const handleSelect = (nodeId: string, outputKey: string) => {
    onSelect(`{{${nodeId}.${outputKey}}}`)
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Link to ${targetField}`} size="md">
      <div className="space-y-4">
        <div className="p-3 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground">
            Select an output to link to <span className="font-mono text-foreground">{targetField}</span>
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Target type: <span className="font-mono text-primary">{targetType}</span>
            {' '}(showing compatible outputs only)
          </p>
        </div>

        <div className="max-h-96 overflow-y-auto space-y-2" data-testid="linker-nodes-list">
          {availableNodes.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No previous nodes available
            </div>
          )}

          {availableNodes.map((node) => {
            const outputs = getOutputsForNode(node)
            const compatibleOutputs = outputs.filter(output => 
              isTypeCompatible(output.type, targetType)
            )
            
            if (compatibleOutputs.length === 0) return null

            const isExpanded = expandedNodes.has(node.id)

            return (
              <div key={node.id} className="border border-border rounded-lg overflow-hidden">
                {/* Node Header */}
                <button
                  onClick={() => toggleNode(node.id)}
                  className="w-full p-3 bg-card hover:bg-accent transition-colors flex items-center gap-2"
                  data-testid={`linker-node-${node.id}`}
                >
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  )}
                  <div className="flex-1 text-left">
                    <div className="font-medium text-sm">{node.data.name || node.data.type}</div>
                    <div className="text-xs text-muted-foreground">{node.data.type}</div>
                  </div>
                  <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                    {compatibleOutputs.length} compatible
                  </span>
                </button>

                {/* Outputs */}
                {isExpanded && (
                  <div className="p-2 bg-muted/50 space-y-1">
                    {compatibleOutputs.map((output) => (
                      <button
                        key={output.key}
                        onClick={() => handleSelect(node.id, output.key)}
                        className="w-full p-2 bg-card hover:bg-accent rounded text-left flex items-center gap-2 transition-colors"
                        data-testid={`linker-output-${node.id}-${output.key}`}
                      >
                        <Link2 className="w-4 h-4 text-primary flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm">{output.key}</span>
                            <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                              {output.type}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground truncate">
                            {output.description}
                          </p>
                        </div>
                        <span className="text-xs text-muted-foreground font-mono">
                          {`{{${node.id}.${output.key}}}`}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div className="flex justify-end pt-4 border-t border-border">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  )
}
