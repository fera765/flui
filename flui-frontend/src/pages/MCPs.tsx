import { useState } from 'react'
import { Search, Download } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { MCPCard } from '@/components/mcps/MCPCard'
import { MCPImportModal } from '@/components/mcps/MCPImportModal'
import { useMCPsPage } from '@/hooks/useMCPsPage'
import type { MCP } from '@/types/api'

export function MCPs() {
  const [search, setSearch] = useState('')
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [syncingId, setSyncingId] = useState<string | null>(null)
  const [testingId, setTestingId] = useState<string | null>(null)

  const {
    mcps,
    isLoading,
    importMCP,
    syncMCP,
    testMCP,
    deleteMCP,
    isImporting,
  } = useMCPsPage()

  const filteredMCPs = mcps.filter((mcp: MCP) =>
    mcp.name.toLowerCase().includes(search.toLowerCase()) ||
    mcp.description.toLowerCase().includes(search.toLowerCase())
  )

  const handleImport = async (data: any) => {
    try {
      await importMCP(data)
      setIsImportModalOpen(false) // Fechar modal após sucesso
    } catch (error) {
      // Toast de erro já é mostrado pelo hook
      // Modal permanece aberto para correção
    }
  }

  const handleSync = async (id: string) => {
    setSyncingId(id)
    await syncMCP(id)
    setSyncingId(null)
  }

  const handleTest = async (id: string) => {
    setTestingId(id)
    await testMCP(id)
    setTestingId(null)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this MCP?')) {
      await deleteMCP(id)
    }
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">MCPs</h1>
          <p className="text-muted-foreground mt-1">
            Import and manage Model Context Protocol packages
          </p>
        </div>
        <Button onClick={() => setIsImportModalOpen(true)}>
          <Download className="w-5 h-5" />
          Import MCP
        </Button>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          placeholder="Search MCPs..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {isLoading && (
        <div className="text-center py-12">
          <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!isLoading && filteredMCPs.length === 0 && (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
            <Download className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium text-foreground mb-2">No MCPs yet</h3>
          <p className="text-muted-foreground mb-4">
            Import your first MCP package to get started
          </p>
          <Button onClick={() => setIsImportModalOpen(true)}>
            <Download className="w-5 h-5" />
            Import MCP
          </Button>
        </div>
      )}

      {!isLoading && filteredMCPs.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMCPs.map((mcp: MCP) => (
            <MCPCard
              key={mcp.id}
              mcp={mcp}
              onSync={handleSync}
              onTest={handleTest}
              onEdit={() => {}}
              onDelete={handleDelete}
              isSyncing={syncingId === mcp.id}
              isTesting={testingId === mcp.id}
            />
          ))}
        </div>
      )}

      <MCPImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSubmit={handleImport}
        isLoading={isImporting}
      />
    </div>
  )
}
