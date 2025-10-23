import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/services/api'
import { toast } from 'sonner'
import type { Automation } from '@/types/api'

export function useAutomations() {
  const queryClient = useQueryClient()

  const { data: automations = [], isLoading } = useQuery({
    queryKey: ['automations'],
    queryFn: () => api.getAutomations(),
  })

  const createMutation = useMutation({
    mutationFn: (data: Partial<Automation>) => api.createAutomation(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automations'] })
      toast.success('Automation created successfully!')
    },
    onError: (error: Error) => {
      toast.error(`Failed to create automation: ${error.message}`)
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Automation> }) =>
      api.updateAutomation(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automations'] })
      toast.success('Automation updated successfully!')
    },
    onError: (error: Error) => {
      toast.error(`Failed to update automation: ${error.message}`)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteAutomation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automations'] })
      toast.success('Automation deleted successfully!')
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete automation: ${error.message}`)
    },
  })

  const executeMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data?: any }) =>
      api.executeAutomation(id, data),
    onSuccess: () => {
      toast.success('Automation executed successfully!')
    },
    onError: (error: Error) => {
      toast.error(`Failed to execute automation: ${error.message}`)
    },
  })

  return {
    automations,
    isLoading,
    createAutomation: createMutation.mutateAsync,
    updateAutomation: updateMutation.mutateAsync,
    deleteAutomation: deleteMutation.mutateAsync,
    executeAutomation: executeMutation.mutateAsync,
    isExecuting: executeMutation.isPending,
  }
}
