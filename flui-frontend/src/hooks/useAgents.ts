import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/services/api'
import { toast } from 'sonner'
import type { Agent } from '@/types/api'

export function useAgents() {
  const queryClient = useQueryClient()

  const { data: agents = [], isLoading, error } = useQuery({
    queryKey: ['agents'],
    queryFn: () => api.getAgents(),
  })

  const createMutation = useMutation({
    mutationFn: (data: Partial<Agent>) => api.createAgent(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] })
      toast.success('Agent created successfully!')
    },
    onError: (error: Error) => {
      toast.error(`Failed to create agent: ${error.message}`)
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Agent> }) =>
      api.updateAgent(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] })
      toast.success('Agent updated successfully!')
    },
    onError: (error: Error) => {
      toast.error(`Failed to update agent: ${error.message}`)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteAgent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] })
      toast.success('Agent deleted successfully!')
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete agent: ${error.message}`)
    },
  })

  return {
    agents,
    isLoading,
    error,
    createAgent: createMutation.mutateAsync,
    updateAgent: updateMutation.mutateAsync,
    deleteAgent: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  }
}

export function useModels() {
  return useQuery({
    queryKey: ['models'],
    queryFn: () => api.getModels(),
  })
}

export function useTools() {
  return useQuery({
    queryKey: ['tools'],
    queryFn: () => api.getTools(),
  })
}

export function useMCPs() {
  return useQuery({
    queryKey: ['mcps'],
    queryFn: () => api.getMCPs(),
  })
}
