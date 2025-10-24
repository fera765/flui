import { useState } from 'react'
import { Plus, Search, Filter } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { AutomationCard } from '@/components/automations/AutomationCard'
import { useAutomations } from '@/hooks/useAutomations'
import type { Automation } from '@/types/api'

export function Automations() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'enabled' | 'disabled'>('all')
  const [executingId, setExecutingId] = useState<string | null>(null)

  const {
    automations,
    isLoading,
    deleteAutomation,
    executeAutomation,
  } = useAutomations()

  const filteredAutomations = automations
    .filter((auto: Automation) =>
      auto.name.toLowerCase().includes(search.toLowerCase()) ||
      auto.description.toLowerCase().includes(search.toLowerCase())
    )
    .filter((auto: Automation) => {
      if (filter === 'enabled') return auto.enabled
      if (filter === 'disabled') return !auto.enabled
      return true
    })

  const handleCreate = () => {
    // Navigate to workflow editor with new automation
    navigate('/automations/new')
  }

  const handleEdit = (automation: Automation) => {
    navigate(`/automations/${automation.id}/edit`)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this automation?')) {
      await deleteAutomation(id)
    }
  }

  const handleExecute = async (id: string) => {
    setExecutingId(id)
    await executeAutomation({ id })
    setExecutingId(null)
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Automations</h1>
          <p className="text-muted-foreground mt-1">
            Create and manage workflow automations
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="w-5 h-5" />
          New Automation
        </Button>
      </div>

      {/* Search & Filter */}
      <div className="flex gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search automations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            All
          </Button>
          <Button
            variant={filter === 'enabled' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('enabled')}
          >
            Enabled
          </Button>
          <Button
            variant={filter === 'disabled' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('disabled')}
          >
            Disabled
          </Button>
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="text-center py-12">
          <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredAutomations.length === 0 && (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
            <Plus className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium text-foreground mb-2">
            {search || filter !== 'all' ? 'No automations found' : 'No automations yet'}
          </h3>
          <p className="text-muted-foreground mb-4">
            {search || filter !== 'all'
              ? 'Try adjusting your search or filter'
              : 'Create your first automation to get started'}
          </p>
          <Button onClick={handleCreate}>
            <Plus className="w-5 h-5" />
            Create Automation
          </Button>
        </div>
      )}

      {/* Grid */}
      {!isLoading && filteredAutomations.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAutomations.map((automation: Automation) => (
            <AutomationCard
              key={automation.id}
              automation={automation}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onExecute={handleExecute}
              isExecuting={executingId === automation.id}
            />
          ))}
        </div>
      )}
    </div>
  )
}
