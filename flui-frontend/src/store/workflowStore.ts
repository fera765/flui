import { create } from 'zustand'
import type { Node, Edge } from 'reactflow'

interface WorkflowState {
  nodes: Node[]
  edges: Edge[]
  selectedNode: Node | null
  selectedNodeId: string | null
  isConfigModalOpen: boolean
  isLinkerModalOpen: boolean
  linkerTargetField: string | null
  linkerTargetType: string
  
  setNodes: (nodes: Node[]) => void
  setEdges: (edges: Edge[]) => void
  addNode: (node: Node) => void
  updateNode: (id: string, data: any) => void
  deleteNode: (id: string) => void
  selectNode: (node: Node | null) => void
  openConfigModal: (node: Node) => void
  closeConfigModal: () => void
  openLinkerModal: (field: string, type: string) => void
  closeLinkerModal: () => void
  linkOutput: (nodeId: string, outputPath: string) => void
}

export const useWorkflowStore = create<WorkflowState>((set, get) => ({
  nodes: [],
  edges: [],
  selectedNode: null,
  selectedNodeId: null,
  isConfigModalOpen: false,
  isLinkerModalOpen: false,
  linkerTargetField: null,
  linkerTargetType: 'string',

  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),

  addNode: (node) => set((state) => ({
    nodes: [...state.nodes, node],
  })),

  updateNode: (id, data) => {
    set((state) => {
      const updatedNodes = state.nodes.map((node) =>
        node.id === id ? { ...node, data: { ...node.data, ...data } } : node
      )
      console.log('[WorkflowStore] Node updated:', id, data)
      return { nodes: updatedNodes }
    })
  },

  deleteNode: (id) => set((state) => ({
    nodes: state.nodes.filter((node) => node.id !== id),
    edges: state.edges.filter((edge) => edge.source !== id && edge.target !== id),
    selectedNode: state.selectedNode?.id === id ? null : state.selectedNode,
    selectedNodeId: state.selectedNodeId === id ? null : state.selectedNodeId,
  })),

  selectNode: (node) => set({ 
    selectedNode: node,
    selectedNodeId: node?.id || null,
  }),

  openConfigModal: (node) => set({
    selectedNode: node,
    selectedNodeId: node.id,
    isConfigModalOpen: true,
  }),

  closeConfigModal: () => set({
    isConfigModalOpen: false,
  }),

  openLinkerModal: (field, type = 'string') => set({
    isLinkerModalOpen: true,
    linkerTargetField: field,
    linkerTargetType: type,
  }),

  closeLinkerModal: () => set({
    isLinkerModalOpen: false,
    linkerTargetField: null,
    linkerTargetType: 'string',
  }),

  linkOutput: (nodeId, outputPath) => {
    const { selectedNode, linkerTargetField } = get()
    if (!selectedNode || !linkerTargetField) return

    const linkedValue = `{{${nodeId}.${outputPath}}}`
    
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === selectedNode.id
          ? {
              ...node,
              data: {
                ...node.data,
                config: {
                  ...node.data.config,
                  [linkerTargetField]: linkedValue,
                },
              },
            }
          : node
      ),
      isLinkerModalOpen: false,
      linkerTargetField: null,
    }))
  },
}))
