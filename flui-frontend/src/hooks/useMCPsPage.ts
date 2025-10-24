import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/services/api'
import { toast } from 'sonner'
import type { MCP } from '@/types/api'

export function useMCPsPage() {
  const queryClient = useQueryClient()

  const { data: mcps = [], isLoading, error } = useQuery({
    queryKey: ['mcps'],
    queryFn: () => api.getMCPs(),
  })

  const createMutation = useMutation({
    mutationFn: (data: Partial<MCP>) => api.createMCP(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mcps'] })
      toast.success('MCP created successfully!')
    },
    onError: (error: Error) => {
      toast.error(`Failed to create MCP: ${error.message}`)
    },
  })

  const importMutation = useMutation({
    mutationFn: (data: { type: string; package: string; version?: string }) => {
      const loadingToast = toast.loading('Importing MCP package...')
      return api.importMCP(data).then((result: any) => {
        toast.dismiss(loadingToast)
        return result
      }).catch((error: any) => {
        toast.dismiss(loadingToast)
        throw error
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mcps'] })
      toast.success('MCP imported successfully!', {
        description: 'Tools are now available for use',
      })
    },
    onError: (error: Error) => {
      toast.error('Failed to import MCP', {
        description: error.message,
      })
    },
  })

  const syncMutation = useMutation({
    mutationFn: (id: string) => {
      const loadingToast = toast.loading('Syncing MCP...')
      return api.syncMCP(id).then((result: any) => {
        toast.dismiss(loadingToast)
        return result
      }).catch((error: any) => {
        toast.dismiss(loadingToast)
        throw error
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mcps'] })
      toast.success('MCP synced successfully!', {
        description: 'Tools have been updated',
      })
    },
    onError: (error: Error) => {
      toast.error('Failed to sync MCP', {
        description: error.message,
      })
    },
  })

  const testMutation = useMutation({
    mutationFn: (id: string) => api.testMCP(id),
    onSuccess: (data: any) => {
      toast.success('MCP connection successful!', {
        description: `Found ${data.toolsFound} tools`,
      })
    },
    onError: (error: Error) => {
      toast.error('MCP connection failed', {
        description: error.message,
      })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<MCP> }) =>
      api.updateMCP(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mcps'] })
      toast.success('MCP updated successfully!')
    },
    onError: (error: Error) => {
      toast.error(`Failed to update MCP: ${error.message}`)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteMCP(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mcps'] })
      toast.success('MCP deleted successfully!')
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete MCP: ${error.message}`)
    },
  })

  return {
    mcps,
    isLoading,
    error,
    createMCP: createMutation.mutateAsync,
    importMCP: importMutation.mutateAsync,
    syncMCP: syncMutation.mutateAsync,
    testMCP: testMutation.mutateAsync,
    updateMCP: updateMutation.mutateAsync,
    deleteMCP: deleteMutation.mutateAsync,
    isImporting: importMutation.isPending,
    isSyncing: syncMutation.isPending,
    isTesting: testMutation.isPending,
  }
}
