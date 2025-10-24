import { useCallback, useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import ReactFlow, {
  Background,
  Controls,
  addEdge,
  useNodesState,
  useEdgesState,
  Connection,
  Panel,
  Edge,
  EdgeChange,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { Plus, Save, Play, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { CustomNode } from '@/components/workflow/CustomNode'
import { NodeConfigModal } from '@/components/workflow/NodeConfigModal'
import { TypedLinkerModal } from '@/components/workflow/TypedLinkerModal'
import { AddNodeModal } from '@/components/workflow/AddNodeModal'
import { DeleteEdgeButton } from '@/components/workflow/DeleteEdgeButton'
import { ExecutionModal } from '@/components/automations/ExecutionModal'
import { useWorkflowStore } from '@/store/workflowStore'
import { useAutomations } from '@/hooks/useAutomations'
import { api } from '@/services/api'
import { toast } from 'sonner'

const nodeTypes = {
  custom: CustomNode,
}

const edgeTypes = {
  default: DeleteEdgeButton,
}

export function WorkflowEditor() {
  const { id } = useParams()
  const navigate = useNavigate()
  
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [isAddNodeModalOpen, setIsAddNodeModalOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isExecuting, setIsExecuting] = useState(false)
  const [executionContext, setExecutionContext] = useState<any>(null)
  const [currentAutomationId, setCurrentAutomationId] = useState<string | null>(null)
  const autosaveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const hasUnsavedChanges = useRef(false)

  // 🔄 Enable edge reconnection (drag to reconnect)
  const onReconnect = useCallback((oldEdge: any, newConnection: any) => {
    console.log('[WorkflowEditor] Reconnecting edge:', oldEdge.id, 'to', newConnection)
    setEdges((els) => {
      const filtered = els.filter((e) => e.id !== oldEdge.id)
      const newEdge = addEdge(newConnection, filtered)
      toast.success('Edge reconnected!', { duration: 2000 })
      return newEdge
    })
  }, [setEdges])

  // 🔄 Enable edge updates (for dragging connections to new targets)
  const onEdgeUpdate = useCallback((oldEdge: any, newConnection: any) => {
    console.log('[WorkflowEditor] Updating edge:', oldEdge.id, 'to', newConnection)
    setEdges((els) => {
      const filtered = els.filter((e) => e.id !== oldEdge.id)
      return addEdge(newConnection, filtered)
    })
  }, [setEdges])
  
  // 🗑️ Handle edge deletion (when disconnecting without reconnecting)
  const onEdgesDelete = useCallback((edgesToDelete: Edge[]) => {
    console.log('[WorkflowEditor] Deleting edges:', edgesToDelete.length)
    toast.info(`${edgesToDelete.length} edge(s) removed`, { duration: 2000 })
  }, [])

  const workflowStore = useWorkflowStore()
  const { createAutomation, updateAutomation, executeAutomation } = useAutomations()
  const isSyncingFromStore = useRef(false)

  // ✅ BIDIRECTIONAL SYNC: ReactFlow ↔ Zustand Store
  // Sync ReactFlow → Store
  useEffect(() => {
    if (!isSyncingFromStore.current && nodes.length > 0) {
      workflowStore.setNodes(nodes)
      hasUnsavedChanges.current = true
      // ✅ FIX: Só dispara autosave se não for automação nova
      if (currentAutomationId && currentAutomationId !== 'new') {
        triggerAutosave()
      }
    }
  }, [nodes])

  useEffect(() => {
    if (!isSyncingFromStore.current) {
      workflowStore.setEdges(edges)
      hasUnsavedChanges.current = true
      // ✅ FIX: Só dispara autosave se não for automação nova
      if (currentAutomationId && currentAutomationId !== 'new') {
        triggerAutosave()
      }
    }
  }, [edges])
  
  // ✅ BIDIRECTIONAL SYNC: Store → ReactFlow
  // Subscribe to store changes (for delete operations)
  useEffect(() => {
    const unsubscribe = useWorkflowStore.subscribe((state) => {
      // ✅ FIX: Reduzir logging verboso
      isSyncingFromStore.current = true
      setNodes(state.nodes)
      setEdges(state.edges)
      requestAnimationFrame(() => {
        isSyncingFromStore.current = false
      })
    })
    
    return () => {
      unsubscribe()
    }
  }, [setNodes, setEdges])

  // 🔄 AUTOSAVE: Salva automaticamente após 5 segundos de inatividade
  const triggerAutosave = useCallback(() => {
    if (!currentAutomationId || currentAutomationId === 'new') return
    
    if (autosaveTimeoutRef.current) {
      clearTimeout(autosaveTimeoutRef.current)
    }
    
    // ✅ FIX: Aumentar delay para 5 segundos e evitar saves desnecessários
    autosaveTimeoutRef.current = setTimeout(() => {
      if (hasUnsavedChanges.current) {
        console.log('[WorkflowEditor] 💾 Autosave triggered after 5s of inactivity')
        performSilentSave()
      }
    }, 5000) // Aumentado de 2s para 5s
  }, [currentAutomationId])

  // 💾 Silent Save: Salva sem mostrar toast
  const performSilentSave = async () => {
    if (!currentAutomationId || currentAutomationId === 'new') return
    
    // ✅ FIX: Evitar múltiplos saves simultâneos
    if (isSaving) {
      console.log('[WorkflowEditor] ⏭️ Skipping autosave - save already in progress')
      return
    }
    
    try {
      const storeState = useWorkflowStore.getState()
      const latestNodes = storeState.nodes
      const latestEdges = storeState.edges
      
      console.log('[WorkflowEditor] 💾 Autosave:', latestNodes.length, 'nodes,', latestEdges.length, 'edges')
      
      const automationData = {
        name: `Automation ${currentAutomationId}`,
        description: 'Workflow automation',
        nodes: latestNodes.map((node) => ({
          id: node.id,
          type: node.data.type,
          name: node.data.name,
          description: node.data.description,
          config: node.data.config || {},
          position: node.position,
          // ✅ FIX: Preserve node identifiers needed for configuration
          ...(node.data.agentId && { agentId: node.data.agentId }),
          ...(node.data.toolId && { toolId: node.data.toolId }),
          ...(node.data.mcpId && { mcpId: node.data.mcpId }),
          ...(node.data.mcpToolId && { mcpToolId: node.data.mcpToolId }),
        })),
        edges: latestEdges.map((edge) => ({
          id: edge.id,
          source: edge.source,
          target: edge.target,
        })),
        startNodeId: latestNodes[0]?.id || '',
      }
      
      await updateAutomation({ id: currentAutomationId, data: automationData })
      hasUnsavedChanges.current = false
      console.log('[WorkflowEditor] ✅ Autosave completed')
    } catch (error) {
      console.error('❌ Erro no autosave:', error)
    }
  }

  // Cleanup autosave timeout on unmount
  useEffect(() => {
    return () => {
      if (autosaveTimeoutRef.current) {
        clearTimeout(autosaveTimeoutRef.current)
      }
    }
  }, [])

  // Load automation if editing
  useEffect(() => {
    if (id && id !== 'new') {
      setCurrentAutomationId(id)
      loadAutomation(id)
    } else {
      setCurrentAutomationId('new')
    }
  }, [id])

  const loadAutomation = async (automationId: string) => {
    try {
      const automation = await api.getAutomation(automationId)
      if (automation && automation.nodes && automation.edges) {
        console.log('[WorkflowEditor] Loading automation:', automationId, 'with', automation.nodes.length, 'nodes', automation.edges.length, 'edges')
        console.log('[WorkflowEditor] Raw edges from API:', JSON.stringify(automation.edges, null, 2))
        
        const loadedNodes = automation.nodes.map((node: any) => {
          console.log('[WorkflowEditor] Loading node:', node.id, 'config:', node.config)
          return {
            id: node.id,
            type: 'custom',
            position: node.position || { x: 0, y: 0 },
            data: {
              type: node.type,
              name: node.name,
              description: node.description,
              config: node.config || {},
              // ✅ FIX: Preserve additional node data (agentId, toolId, mcpId, mcpToolId)
              ...(node.agentId && { agentId: node.agentId }),
              ...(node.toolId && { toolId: node.toolId }),
              ...(node.mcpId && { mcpId: node.mcpId }),
              ...(node.mcpToolId && { mcpToolId: node.mcpToolId }),
            },
          }
        })
        
        const loadedEdges = automation.edges.map((edge: any) => {
          console.log('[WorkflowEditor] Processing edge:', edge)
          return {
            id: edge.id,
            source: edge.source,
            target: edge.target,
            animated: true,
            style: { stroke: 'hsl(var(--primary))' },
          }
        })
        
        console.log('[WorkflowEditor] Loaded edges for ReactFlow:', loadedEdges)
        
        // ✅ FIX: Sync to both ReactFlow AND Zustand store
        setNodes(loadedNodes)
        setEdges(loadedEdges)
        
        // ✅ CRITICAL FIX: Also update Zustand store directly
        // This ensures that when we save, the store has the current edges
        workflowStore.setNodes(loadedNodes)
        workflowStore.setEdges(loadedEdges)
        
        console.log('[WorkflowEditor] Synced to Zustand store:', {
          nodes: loadedNodes.length,
          edges: loadedEdges.length
        })
        
        hasUnsavedChanges.current = false
        console.log('[WorkflowEditor] Automation loaded successfully')
      }
    } catch (error: any) {
      console.error('Erro ao carregar automação:', error)
      toast.error('Erro ao carregar automação', {
        description: error.message
      })
    }
  }

  const onConnect = useCallback(
    (params: Connection) => {
      const newEdge = {
        ...params,
        data: { onDelete: handleDeleteEdge },
      };
      setEdges((eds) => addEdge(newEdge, eds));
    },
    [setEdges]
  )
  
  // Handle edge deletion via button
  const handleDeleteEdge = useCallback((edgeId: string) => {
    setEdges((eds) => eds.filter((e) => e.id !== edgeId));
    toast.info('Conexão removida', { duration: 2000 });
  }, [setEdges]);

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

  const handleSave = async (silent = false) => {
    setIsSaving(true)
    
    try {
      // ✅ CRITICAL FIX: Read from store instead of local state
      // This ensures we get the latest updates from NodeConfigModal
      const storeState = useWorkflowStore.getState()
      const latestNodes = storeState.nodes
      const latestEdges = storeState.edges
      
      console.log('[WorkflowEditor] 🔍 MANUAL SAVE - Store state:', {
        nodes: latestNodes.length,
        edges: latestEdges.length,
        edgeDetails: latestEdges.map(e => ({ id: e.id, source: e.source, target: e.target }))
      })
      
      if (latestEdges.length === 0) {
        console.warn('[WorkflowEditor] ⚠️ WARNING: Attempting to save with ZERO edges! This will lose connections!')
      }
      
      const automationData = {
        name: `Automation ${currentAutomationId || 'New'}`,
        description: 'Workflow automation',
        nodes: latestNodes.map((node) => ({
          id: node.id,
          type: node.data.type,
          name: node.data.name,
          description: node.data.description,
          config: node.data.config || {},
          position: node.position,
          // ✅ FIX: Preserve node identifiers needed for configuration
          ...(node.data.agentId && { agentId: node.data.agentId }),
          ...(node.data.toolId && { toolId: node.data.toolId }),
          ...(node.data.mcpId && { mcpId: node.data.mcpId }),
          ...(node.data.mcpToolId && { mcpToolId: node.data.mcpToolId }),
        })),
        edges: latestEdges.map((edge) => ({
          id: edge.id,
          source: edge.source,
          target: edge.target,
        })),
        startNodeId: latestNodes[0]?.id || '',
      }

      let result: any
      
      if (currentAutomationId && currentAutomationId !== 'new') {
        await updateAutomation({ id: currentAutomationId, data: automationData })
        if (!silent) toast.success('Automation saved!')
        hasUnsavedChanges.current = false
        result = { id: currentAutomationId }
      } else {
        result = await createAutomation(automationData)
        if (!silent) toast.success('Automation created!')
        setCurrentAutomationId(result.id)
        hasUnsavedChanges.current = false
        navigate(`/automations/${result.id}/edit`)
      }
      
      return result
    } catch (error: any) {
      if (!silent) {
        toast.error(error.message || 'Failed to save automation')
      }
      return null
    } finally {
      setIsSaving(false)
    }
  }

  const handleRun = async () => {
    // 💾 Primeiro, salva silenciosamente
    let automationIdToRun = currentAutomationId
    
    if (!automationIdToRun || automationIdToRun === 'new') {
      // Se for nova, cria primeiro
      const result = await handleSave(true)
      if (!result) return
      automationIdToRun = result.id
    } else if (hasUnsavedChanges.current) {
      // Se tem mudanças, salva silenciosamente
      await performSilentSave()
    }

    setIsExecuting(true)
    
    try {
      // Iniciar execução
      const execution = await executeAutomation({ id: automationIdToRun })
      
      // Abrir modal de execução com contexto
      setExecutionContext({
        automationName: `Automation ${automationIdToRun}`,
        automationId: automationIdToRun,
        status: 'running',
        nodesExecuted: 0,
        files: [],
        logs: [],
      })
      
      // Simular progresso (em produção, isso viria via WebSocket ou polling)
      setTimeout(() => {
        setExecutionContext((prev: any) => ({
          ...prev,
          status: 'completed',
          nodesExecuted: nodes.length,
          duration: 1234,
        }))
      }, 3000)
      
    } catch (error: any) {
      toast.error('Erro ao executar automação', {
        description: error.message
      })
      setExecutionContext(null)
    } finally {
      setIsExecuting(false)
    }
  }

  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onEdgesDelete={onEdgesDelete}
        onConnect={onConnect}
        onReconnect={onReconnect}
        onEdgeUpdate={onEdgeUpdate}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        deleteKeyCode="Delete"
        multiSelectionKeyCode="Shift"
        panOnDrag={true}
        panOnScroll={false}
        zoomOnScroll={true}
        zoomOnDoubleClick={false}
        selectNodesOnDrag={false}
        // 🎯 Enable edge reconnection on drag
        reconnectRadius={20}
        edgeUpdaterRadius={10}
        defaultEdgeOptions={{
          animated: true,
          style: { stroke: 'hsl(var(--primary))' },
          data: { onDelete: handleDeleteEdge },
        }}
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
          <Button onClick={() => handleSave()} size="sm" isLoading={isSaving} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save
              </>
            )}
          </Button>
          <Button 
            onClick={handleRun} 
            size="sm" 
            variant="secondary"
            isLoading={isExecuting}
            disabled={isExecuting || isSaving}
          >
            {isExecuting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Running...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Run
              </>
            )}
          </Button>
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
      
      {/* Execution Modal */}
      {executionContext && (
        <ExecutionModal
          isOpen={!!executionContext}
          onClose={() => setExecutionContext(null)}
          context={executionContext}
        />
      )}
    </div>
  )
}
