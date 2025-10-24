import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useModels, useTools, useMCPs } from '@/hooks/useAgents'
import type { Agent } from '@/types/api'

const agentSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().min(1, 'Description is required'),
  systemPrompt: z.string().min(1, 'System prompt is required'),
  model: z.string().min(1, 'Model is required'),
  temperature: z.number().min(0).max(2),
  maxTokens: z.number().min(1).max(100000),
  enabled: z.boolean(),
})

type AgentFormData = z.infer<typeof agentSchema>

interface AgentModalProps {
  isOpen: boolean
  onClose: () => void
  agent?: Agent | null
  onSubmit: (data: Partial<Agent>) => Promise<void>
  isLoading?: boolean
}

export function AgentModal({ isOpen, onClose, agent, onSubmit, isLoading }: AgentModalProps) {
  const [activeTab, setActiveTab] = useState<'general' | 'tools'>('general')
  const [selectedTools, setSelectedTools] = useState<string[]>(agent?.tools || [])
  const [selectedMCPTools, setSelectedMCPTools] = useState<string[]>(agent?.mcpToolIds || [])

  const { data: models = [] } = useModels()
  const { data: tools = [] } = useTools()
  const { data: mcps = [] } = useMCPs()
  
  // ✅ Extract MCP tools into individual selectable items
  const mcpToolsList = mcps.flatMap((mcp: any) => 
    (mcp.tools || []).map((tool: any) => ({
      ...tool,
      mcpName: mcp.name,
      mcpId: mcp.id,
      id: tool.id || `${mcp.id}-${tool.name}`,
      displayName: `${tool.name} (${mcp.name})`,
    }))
  )

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AgentFormData>({
    resolver: zodResolver(agentSchema),
    defaultValues: {
      name: agent?.name || '',
      description: agent?.description || '',
      systemPrompt: agent?.systemPrompt || '',
      model: agent?.model || '',
      temperature: agent?.temperature || 0.7,
      maxTokens: agent?.maxTokens || 4000,
      enabled: agent?.enabled ?? true,
    },
  })

  const handleFormSubmit = async (data: AgentFormData) => {
    await onSubmit({
      ...data,
      tools: selectedTools,
      mcpToolIds: selectedMCPTools,
    })
    onClose()
  }

  const toggleTool = (toolId: string) => {
    setSelectedTools((prev) =>
      prev.includes(toolId)
        ? prev.filter((id) => id !== toolId)
        : [...prev, toolId]
    )
  }

  const toggleMCPTool = (toolId: string) => {
    setSelectedMCPTools((prev) =>
      prev.includes(toolId) ? prev.filter((id) => id !== toolId) : [...prev, toolId]
    )
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={agent ? 'Edit Agent' : 'Create Agent'}
      size="lg"
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* Tabs */}
        <div className="flex gap-2 border-b border-border">
          <button
            type="button"
            onClick={() => setActiveTab('general')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'general'
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            General
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('tools')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'tools'
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Tools & MCPs
          </button>
        </div>

        {/* General Tab */}
        {activeTab === 'general' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Name *
              </label>
              <Input {...register('name')} error={errors.name?.message} />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Description *
              </label>
              <Input {...register('description')} error={errors.description?.message} />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                System Prompt *
              </label>
              <textarea
                {...register('systemPrompt')}
                rows={4}
                className="w-full px-3 py-2 border border-input bg-background rounded-lg text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              {errors.systemPrompt && (
                <p className="mt-1 text-sm text-destructive">{errors.systemPrompt.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Model *
              </label>
              <select
                {...register('model')}
                className="w-full h-10 px-3 border border-input bg-background rounded-lg text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Select a model</option>
                {((models as any)?.data || models || []).map((model: any) => (
                  <option key={model.id} value={model.id}>
                    {model.id}
                  </option>
                ))}
              </select>
              {errors.model && (
                <p className="mt-1 text-sm text-destructive">{errors.model.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Temperature
                </label>
                <Input
                  type="number"
                  step="0.1"
                  {...register('temperature', { valueAsNumber: true })}
                  error={errors.temperature?.message}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Max Tokens
                </label>
                <Input
                  type="number"
                  {...register('maxTokens', { valueAsNumber: true })}
                  error={errors.maxTokens?.message}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="enabled"
                {...register('enabled')}
                className="w-4 h-4 rounded border-input"
              />
              <label htmlFor="enabled" className="text-sm text-foreground">
                Enabled
              </label>
            </div>
          </div>
        )}

        {/* Tools Tab */}
        {activeTab === 'tools' && (
          <div className="space-y-6">
            {/* Tools Section */}
            <div>
              <h3 className="text-sm font-medium text-foreground mb-3">Available Tools</h3>
              <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto scrollbar-thin">
                {tools.map((tool: any) => (
                  <button
                    key={tool.id}
                    type="button"
                    onClick={() => toggleTool(tool.id)}
                    className={`p-3 text-left border rounded-lg transition-colors ${
                      selectedTools.includes(tool.id)
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="font-medium text-sm">{tool.name}</div>
                    <div className="text-xs text-muted-foreground line-clamp-1">
                      {tool.description}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* MCP Tools Section */}
            <div>
              <h3 className="text-sm font-medium text-foreground mb-3">
                MCP Tools ({mcpToolsList.length})
              </h3>
              <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto scrollbar-thin">
                {mcpToolsList.map((tool: any) => (
                  <button
                    key={tool.id}
                    type="button"
                    onClick={() => toggleMCPTool(tool.id)}
                    className={`p-3 text-left border rounded-lg transition-colors ${
                      selectedMCPTools.includes(tool.id)
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="font-medium text-sm">{tool.displayName || tool.name}</div>
                    <div className="text-xs text-muted-foreground line-clamp-1">
                      {tool.description}
                    </div>
                    <div className="text-xs text-purple-500 mt-1">
                      MCP: {tool.mcpName}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end gap-3 pt-4 border-t border-border">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isLoading}>
            {agent ? 'Update' : 'Create'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
