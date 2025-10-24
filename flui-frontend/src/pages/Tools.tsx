import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, Zap } from 'lucide-react'
import { api } from '@/services/api'
import { Input } from '@/components/ui/Input'

export function Tools() {
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  
  const { data: tools = [], isLoading } = useQuery({
    queryKey: ['tools'],
    queryFn: () => api.getTools(),
  })

  // Get unique categories
  const categories = ['all', ...new Set(tools.map((t: any) => t.category))]

  const filteredTools = tools.filter((tool: any) => {
    const matchesSearch = tool.name.toLowerCase().includes(search.toLowerCase()) ||
                         tool.description.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || tool.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Tools</h1>
          <p className="text-muted-foreground mt-1">
            Browse all available tools in the system
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search tools..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                categoryFilter === cat
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {cat === 'all' ? 'All' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="text-center py-12">
          <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredTools.length === 0 && (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
            <Zap className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium text-foreground mb-2">No tools found</h3>
          <p className="text-muted-foreground">
            {search || categoryFilter !== 'all' ? 'Try adjusting your filters' : 'No tools available'}
          </p>
        </div>
      )}

      {/* Tools Grid */}
      {!isLoading && filteredTools.length > 0 && (
        <>
          <div className="text-sm text-muted-foreground mb-4">
            Showing {filteredTools.length} of {tools.length} tools
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTools.map((tool: any) => (
              <div
                key={tool.id}
                className="p-4 bg-card border border-border rounded-lg hover:border-primary/50 transition-colors"
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Zap className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground truncate">
                      {tool.name}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {tool.category} • v{tool.version}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                  {tool.description}
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{tool.params?.length || 0} parameters</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
