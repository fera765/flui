import { useCallback, useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import ReactFlow, {
  Background,
  Controls,
  addEdge,
  useNodesState,
  useEdgesState,
  Connection,
  Panel,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { Plus, Save, Play } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { CustomNode } from '@/components/workflow/CustomNode'
import { NodeConfigModal } from '@/components/workflow/NodeConfigModal'
import { TypedLinkerModal } from '@/components/workflow/TypedLinkerModal'
import { AddNodeModal } from '@/components/workflow/AddNodeModal'
import { useWorkflowStore } from '@/store/workflowStore'
import { useAutomations } from '@/hooks/useAutomations'
import { api } from '@/services/api'
import { toast } from 'sonner'

const nodeTypes = {
  custom: CustomNode,
}

export function WorkflowEditor() {
  const { id } = useParams()
  const navigate = useNavigate()
  
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [isAddNodeModalOpen, setIsAddNodeModalOpen] = useState(false)

  // Enable edge reconnection
  const onReconnect = useCallback((oldEdge: any, newConnection: any) => {
    console.log('[WorkflowEditor] Reconnecting edge:', oldEdge.id)
    setEdges((els) => {
      const filtered = els.filter((e) => e.id !== oldEdge.id)
      return addEdge(newConnection, filtered)
    })
  }, [setEdges])

  // Enable edge updates (for dragging connections)
  const onEdgeUpdate = useCallback((oldEdge: any, newConnection: any) => {
    console.log('[WorkflowEditor] Updating edge:', oldEdge.id)
    setEdges((els) => {
      const filtered = els.filter((e) => e.id !== oldEdge.id)
      return addEdge(newConnection, filtered)
    })
  }, [setEdges])

  const workflowStore = useWorkflowStore()
  const { createAutomation, updateAutomation, executeAutomation } = useAutomations()

  // Sync with store - Bidirectional sync
  useEffect(() => {
    workflowStore.setNodes(nodes)
  }, [nodes])

  useEffect(() => {
    workflowStore.setEdges(edges)
  }, [edges])

  // Subscribe to store updates and sync to React Flow
  useEffect(() => {
    const unsubscribe = useWorkflowStore.subscribe((state) => {
      // When store nodes change, update React Flow
      setNodes(state.nodes)
    })
    return unsubscribe
  }, [setNodes])

  // Load automation if editing
  useEffect(() => {
    if (id && id !== 'new') {
      // TODO: Load automation from API
      // For now, start empty
    }
    // Start with empty canvas (no initial node)
  }, [id])

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  )

  const handleAddNodeFromModal = (type: string, data: any) => {
    const id = `node-${Date.now()}`
    const newNode = {
      id,
      type: 'custom',
      position: {
        x: Math.random() * 400 + 100,
        y: Math.random() * 400 + 100,
      },
      data: {
        type,
        ...data,
      },
    }
    setNodes((nds) => [...nds, newNode])
    toast.success(`Added ${data.name}`)
  }

  const handleSave = async () => {
    // ✅ CRITICAL FIX: Read from store instead of local state
    // This ensures we get the latest updates from NodeConfigModal
    const storeState = useWorkflowStore.getState()
    const latestNodes = storeState.nodes
    const latestEdges = storeState.edges
    
    console.log('[WorkflowEditor] Saving with store nodes:', latestNodes.length)
    
    const automationData = {
      name: `Automation ${id || 'New'}`,
      description: 'Workflow automation',
      nodes: latestNodes.map((node) => ({
        id: node.id,
        type: node.data.type,
        name: node.data.name,
        description: node.data.description,
        config: node.data.config,
        position: node.position,
      })),
      edges: latestEdges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
      })),
      startNodeId: latestNodes[0]?.id || '',
    }

    try {
      if (id && id !== 'new') {
        await updateAutomation({ id, data: automationData })
        toast.success('Automation saved!')
      } else {
        const result: any = await createAutomation(automationData)
        toast.success('Automation created!')
        navigate(`/automations/${result.id}/edit`)
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to save automation')
    }
  }

  const handleRun = async () => {
    if (!id || id === 'new') {
      toast.error('Please save the automation first')
      return
    }

    try {
      await executeAutomation(id)
      toast.success('Automation executed successfully!')
    } catch (error: any) {
      toast.error(error.message || 'Failed to execute automation')
    }
  }

  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onReconnect={onReconnect}
        onEdgeUpdate={onEdgeUpdate}
        nodeTypes={nodeTypes}
        fitView
        deleteKeyCode="Delete"
        multiSelectionKeyCode="Shift"
        panOnDrag={true}
        panOnScroll={false}
        zoomOnScroll={true}
        zoomOnDoubleClick={false}
        selectNodesOnDrag={false}
        defaultEdgeOptions={{
          animated: true,
          style: { stroke: 'hsl(var(--primary))' },
        }}
        edgesReconnectable={true}
        reconnectRadius={20}
      >
        <Background />
        <Controls showInteractive={false} />
        
        {/* Add Node Button */}
        <Panel position="top-right">
          <Button 
            size="lg" 
            onClick={() => setIsAddNodeModalOpen(true)}
            className="shadow-lg"
            data-testid="add-node-button"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Node
          </Button>
        </Panel>

        {/* Action Buttons */}
        <Panel position="top-left" className="flex gap-2">
          <Button onClick={handleSave} size="sm">
            <Save className="w-4 h-4 mr-2" />
            Save
          </Button>
          {id && id !== 'new' && (
            <Button onClick={handleRun} size="sm" variant="secondary">
              <Play className="w-4 h-4 mr-2" />
              Run
            </Button>
          )}
        </Panel>
      </ReactFlow>

      <NodeConfigModal />
      <TypedLinkerModal
        isOpen={workflowStore.isLinkerModalOpen}
        onClose={workflowStore.closeLinkerModal}
        targetField={workflowStore.linkerTargetField || ''}
        targetType={workflowStore.linkerTargetType}
        onSelect={(reference) => {
          // Extract nodeId and outputPath from reference "{{nodeId.output}}"
          const match = reference.match(/\{\{(.+?)\.(.+?)\}\}/)
          if (match) {
            workflowStore.linkOutput(match[1], match[2])
          }
          workflowStore.closeLinkerModal()
        }}
      />
      <AddNodeModal
        isOpen={isAddNodeModalOpen}
        onClose={() => setIsAddNodeModalOpen(false)}
        onAddNode={handleAddNodeFromModal}
      />
    </div>
  )
}
