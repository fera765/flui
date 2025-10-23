import { useState } from 'react'
import { Plus, Search } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { AgentCard } from '@/components/agents/AgentCard'
import { AgentModal } from '@/components/agents/AgentModal'
import { useAgents } from '@/hooks/useAgents'
import type { Agent } from '@/types/api'

export function Agents() {
  const [search, setSearch] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)

  const {
    agents,
    isLoading,
    createAgent,
    updateAgent,
    deleteAgent,
    isCreating,
    isUpdating,
  } = useAgents()

  const filteredAgents = agents.filter((agent: Agent) =>
    agent.name.toLowerCase().includes(search.toLowerCase()) ||
    agent.description.toLowerCase().includes(search.toLowerCase())
  )

  const handleCreate = () => {
    setSelectedAgent(null)
    setIsModalOpen(true)
  }

  const handleEdit = (agent: Agent) => {
    setSelectedAgent(agent)
    setIsModalOpen(true)
  }

  const handleSubmit = async (data: Partial<Agent>) => {
    if (selectedAgent) {
      await updateAgent({ id: selectedAgent.id, data })
    } else {
      await createAgent(data)
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this agent?')) {
      await deleteAgent(id)
    }
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Agents</h1>
          <p className="text-muted-foreground mt-1">
            Manage your AI agents and their configurations
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="w-5 h-5" />
          New Agent
        </Button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          placeholder="Search agents..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="text-center py-12">
          <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredAgents.length === 0 && (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
            <Plus className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium text-foreground mb-2">No agents yet</h3>
          <p className="text-muted-foreground mb-4">
            Create your first agent to get started
          </p>
          <Button onClick={handleCreate}>
            <Plus className="w-5 h-5" />
            Create Agent
          </Button>
        </div>
      )}

      {/* Grid */}
      {!isLoading && filteredAgents.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAgents.map((agent: Agent) => (
            <AgentCard
              key={agent.id}
              agent={agent}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      <AgentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        agent={selectedAgent}
        onSubmit={handleSubmit}
        isLoading={isCreating || isUpdating}
      />
    </div>
  )
}
