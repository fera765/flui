import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Link2 } from 'lucide-react'
import { useWorkflowStore } from '@/store/workflowStore'

export function LinkerModal() {
  const {
    isLinkerModalOpen,
    closeLinkerModal,
    selectedNode,
    nodes,
    linkOutput,
  } = useWorkflowStore()

  if (!selectedNode) return null

  // Get all nodes that appear BEFORE the selected node
  // In a real implementation, you'd traverse the graph properly
  const availableNodes = nodes.filter((node) => node.id !== selectedNode.id)

  const handleSelectOutput = (nodeId: string, outputPath: string) => {
    linkOutput(nodeId, outputPath)
    closeLinkerModal()
  }

  return (
    <Modal
      isOpen={isLinkerModalOpen}
      onClose={closeLinkerModal}
      title="Link Output from Previous Node"
      size="md"
    >
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Select an output from a previous node to link to this field. The value will be
          dynamically injected at runtime.
        </p>

        {availableNodes.length === 0 && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No previous nodes available</p>
          </div>
        )}

        {availableNodes.map((node) => (
          <div
            key={node.id}
            className="border border-border rounded-lg p-4 space-y-2"
          >
            <div className="font-medium text-sm">{node.data.name || node.data.type}</div>
            <div className="text-xs text-muted-foreground mb-2">
              Node ID: {node.id}
            </div>

            {/* Common output paths */}
            <div className="space-y-1">
              <button
                onClick={() => handleSelectOutput(node.id, 'output')}
                className="w-full text-left px-3 py-2 text-sm bg-muted hover:bg-muted/80 rounded flex items-center gap-2 transition-colors"
              >
                <Link2 className="w-4 h-4 text-primary" />
                <span>output</span>
                <span className="ml-auto text-xs text-muted-foreground font-mono">
                  {`{{${node.id}.output}}`}
                </span>
              </button>
              
              <button
                onClick={() => handleSelectOutput(node.id, 'result')}
                className="w-full text-left px-3 py-2 text-sm bg-muted hover:bg-muted/80 rounded flex items-center gap-2 transition-colors"
              >
                <Link2 className="w-4 h-4 text-primary" />
                <span>result</span>
                <span className="ml-auto text-xs text-muted-foreground font-mono">
                  {`{{${node.id}.result}}`}
                </span>
              </button>

              <button
                onClick={() => handleSelectOutput(node.id, 'data')}
                className="w-full text-left px-3 py-2 text-sm bg-muted hover:bg-muted/80 rounded flex items-center gap-2 transition-colors"
              >
                <Link2 className="w-4 h-4 text-primary" />
                <span>data</span>
                <span className="ml-auto text-xs text-muted-foreground font-mono">
                  {`{{${node.id}.data}}`}
                </span>
              </button>
            </div>
          </div>
        ))}

        <div className="flex justify-end gap-3 pt-4 border-t border-border">
          <Button type="button" variant="outline" onClick={closeLinkerModal}>
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  )
}
