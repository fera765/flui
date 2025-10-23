import { useCallback, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import ReactFlow, {
  Background,
  Controls,
  addEdge,
  useNodesState,
  useEdgesState,
  Connection,
  Edge,
  Panel,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { Plus, Save, Play } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { CustomNode } from '@/components/workflow/CustomNode'
import { NodeConfigModal } from '@/components/workflow/NodeConfigModal'
import { LinkerModal } from '@/components/workflow/LinkerModal'
import { useWorkflowStore } from '@/store/workflowStore'
import { useAutomations } from '@/hooks/useAutomations'
import { toast } from 'sonner'

const nodeTypes = {
  custom: CustomNode,
}

export function WorkflowEditor() {
  const { id } = useParams()
  const navigate = useNavigate()
  
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])

  const workflowStore = useWorkflowStore()
  const { createAutomation, updateAutomation, executeAutomation } = useAutomations()

  // Sync with store
  useEffect(() => {
    workflowStore.setNodes(nodes)
  }, [nodes])

  useEffect(() => {
    workflowStore.setEdges(edges)
  }, [edges])

  // Load automation if editing
  useEffect(() => {
    if (id && id !== 'new') {
      // Load automation from API
      // For now, just create empty
      if (nodes.length === 0) {
        addInitialNode()
      }
    } else if (nodes.length === 0) {
      addInitialNode()
    }
  }, [id])

  const addInitialNode = () => {
    const initialNode = {
      id: 'start-1',
      type: 'custom',
      position: { x: 250, y: 100 },
      data: {
        type: 'manual-trigger',
        name: 'Manual Trigger',
        description: 'Start automation manually',
        config: {},
      },
    }
    setNodes([initialNode])
  }

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  )

  const addNode = (type: string) => {
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
        name: `New ${type}`,
        description: `${type} node`,
        config: {},
      },
    }
    setNodes((nds) => [...nds, newNode])
  }

  const handleSave = async () => {
    const automationData = {
      name: `Automation ${id || 'New'}`,
      description: 'Created from workflow editor',
      nodes: nodes.map((node) => ({
        id: node.id,
        type: node.data.type,
        name: node.data.name,
        description: node.data.description,
        config: node.data.config,
        position: node.position,
      })),
      edges: edges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
      })),
      enabled: true,
    }

    try {
      if (id && id !== 'new') {
        await updateAutomation({ id, data: automationData })
        toast.success('Automation saved!')
      } else {
        const result = await createAutomation(automationData)
        toast.success('Automation created!')
        navigate(`/automations/${result.id}/edit`)
      }
    } catch (error) {
      toast.error('Failed to save automation')
    }
  }

  const handleRun = async () => {
    if (!id || id === 'new') {
      toast.error('Please save the automation first')
      return
    }
    
    await executeAutomation({ id })
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card">
        <div>
          <h1 className="text-xl font-bold text-foreground">Workflow Editor</h1>
          <p className="text-sm text-muted-foreground">{id === 'new' ? 'New Automation' : `Edit: ${id}`}</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleSave} variant="outline">
            <Save className="w-4 h-4" />
            Save
          </Button>
          <Button onClick={handleRun} disabled={id === 'new'}>
            <Play className="w-4 h-4" />
            Run
          </Button>
        </div>
      </div>

      {/* React Flow Canvas */}
      <div className="flex-1 bg-background">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
          defaultEdgeOptions={{
            animated: true,
            style: { stroke: 'hsl(var(--primary))' },
          }}
        >
          <Background />
          <Controls showInteractive={false} />

          {/* Add Node Panel */}
          <Panel position="top-right" className="space-y-2">
            <div className="bg-card border border-border rounded-lg p-3 shadow-lg space-y-2">
              <div className="text-sm font-medium text-foreground mb-2">Add Node</div>
              <Button onClick={() => addNode('tool')} variant="outline" size="sm" className="w-full justify-start">
                Tool
              </Button>
              <Button onClick={() => addNode('agent')} variant="outline" size="sm" className="w-full justify-start">
                Agent
              </Button>
              <Button onClick={() => addNode('condition')} variant="outline" size="sm" className="w-full justify-start">
                Condition
              </Button>
            </div>
          </Panel>
        </ReactFlow>
      </div>

      {/* Modals */}
      <NodeConfigModal />
      <LinkerModal />
    </div>
  )
}
