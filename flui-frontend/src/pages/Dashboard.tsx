import { useQuery } from '@tanstack/react-query'
import { api } from '@/services/api'

export function Dashboard() {
  const { data: agents = [] } = useQuery({
    queryKey: ['agents'],
    queryFn: () => api.getAgents(),
  })
  
  const { data: mcps = [] } = useQuery({
    queryKey: ['mcps'],
    queryFn: () => api.getMCPs(),
  })
  
  const { data: automations = [] } = useQuery({
    queryKey: ['automations'],
    queryFn: () => api.getAutomations(),
  })
  
  const { data: tools = [] } = useQuery({
    queryKey: ['tools'],
    queryFn: () => api.getTools(),
  })

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold text-foreground mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="p-6 bg-card border border-border rounded-xl">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Total Agents</h3>
          <p className="text-3xl font-bold text-foreground">{agents.length}</p>
        </div>
        <div className="p-6 bg-card border border-border rounded-xl">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">MCPs</h3>
          <p className="text-3xl font-bold text-foreground">{mcps.length}</p>
        </div>
        <div className="p-6 bg-card border border-border rounded-xl">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Automations</h3>
          <p className="text-3xl font-bold text-foreground">{automations.length}</p>
        </div>
        <div className="p-6 bg-card border border-border rounded-xl">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Tools</h3>
          <p className="text-3xl font-bold text-foreground">{tools.length}</p>
        </div>
      </div>
    </div>
  )
}
