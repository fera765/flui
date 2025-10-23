import { describe, it, expect, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAgents } from '@/hooks/useAgents'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
})

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
)

describe('useAgents Hook', () => {
  it('starts with empty agents array', () => {
    const { result } = renderHook(() => useAgents(), { wrapper })
    expect(result.current.agents).toEqual([])
  })

  it('provides CRUD methods', () => {
    const { result } = renderHook(() => useAgents(), { wrapper })
    
    expect(typeof result.current.createAgent).toBe('function')
    expect(typeof result.current.updateAgent).toBe('function')
    expect(typeof result.current.deleteAgent).toBe('function')
  })
})
