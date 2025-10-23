import { create } from 'zustand'
import type { Node, Edge } from 'reactflow'

interface WorkflowState {
  nodes: Node[]
  edges: Edge[]
  selectedNode: Node | null
  isConfigModalOpen: boolean
  isLinkerModalOpen: boolean
  linkerTargetField: string | null
  
  setNodes: (nodes: Node[]) => void
  setEdges: (edges: Edge[]) => void
  addNode: (node: Node) => void
  updateNode: (id: string, data: any) => void
  deleteNode: (id: string) => void
  selectNode: (node: Node | null) => void
  openConfigModal: (node: Node) => void
  closeConfigModal: () => void
  openLinkerModal: (field: string) => void
  closeLinkerModal: () => void
  linkOutput: (nodeId: string, outputPath: string) => void
}

export const useWorkflowStore = create<WorkflowState>((set, get) => ({
  nodes: [],
  edges: [],
  selectedNode: null,
  isConfigModalOpen: false,
  isLinkerModalOpen: false,
  linkerTargetField: null,

  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),

  addNode: (node) => set((state) => ({
    nodes: [...state.nodes, node],
  })),

  updateNode: (id, data) => set((state) => ({
    nodes: state.nodes.map((node) =>
      node.id === id ? { ...node, data: { ...node.data, ...data } } : node
    ),
  })),

  deleteNode: (id) => set((state) => ({
    nodes: state.nodes.filter((node) => node.id !== id),
    edges: state.edges.filter((edge) => edge.source !== id && edge.target !== id),
    selectedNode: state.selectedNode?.id === id ? null : state.selectedNode,
  })),

  selectNode: (node) => set({ selectedNode: node }),

  openConfigModal: (node) => set({
    selectedNode: node,
    isConfigModalOpen: true,
  }),

  closeConfigModal: () => set({
    isConfigModalOpen: false,
  }),

  openLinkerModal: (field) => set({
    isLinkerModalOpen: true,
    linkerTargetField: field,
  }),

  closeLinkerModal: () => set({
    isLinkerModalOpen: false,
    linkerTargetField: null,
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
