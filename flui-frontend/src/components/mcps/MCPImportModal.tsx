import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

const importSchema = z.object({
  type: z.enum(['npm', 'npx', 'github', 'url']),
  package: z.string().min(1, 'Package name is required'),
  version: z.string().optional(),
})

type ImportFormData = z.infer<typeof importSchema>

interface MCPImportModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: ImportFormData) => Promise<void>
  isLoading?: boolean
}

export function MCPImportModal({ isOpen, onClose, onSubmit, isLoading }: MCPImportModalProps) {
  const [selectedType, setSelectedType] = useState<'npm' | 'npx' | 'github' | 'url'>('npm')

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<ImportFormData>({
    resolver: zodResolver(importSchema),
    defaultValues: {
      type: 'npm',
      package: '',
      version: '',
    },
  })

  const handleTypeChange = (type: 'npm' | 'npx' | 'github' | 'url') => {
    setSelectedType(type)
    setValue('type', type)
  }

  const handleFormSubmit = async (data: ImportFormData) => {
    await onSubmit(data)
    onClose()
  }

  const types = [
    { id: 'npm', label: 'NPM Package', example: 'chalk' },
    { id: 'npx', label: 'NPX Command', example: '@modelcontextprotocol/server-filesystem' },
    { id: 'github', label: 'GitHub Repo', example: 'user/repo' },
    { id: 'url', label: 'Direct URL', example: 'https://...' },
  ] as const

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Import MCP" size="md">
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-foreground mb-3">
            Import Type
          </label>
          <div className="grid grid-cols-2 gap-3">
            {types.map((type) => (
              <button
                key={type.id}
                type="button"
                onClick={() => handleTypeChange(type.id as any)}
                className={`p-4 text-left border rounded-lg transition-colors ${
                  selectedType === type.id
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="font-medium text-sm">{type.label}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  e.g. {type.example}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Package Name *
          </label>
          <Input
            {...register('package')}
            placeholder={types.find(t => t.id === selectedType)?.example}
            error={errors.package?.message}
          />
        </div>

        {selectedType === 'npm' && (
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Version (optional)
            </label>
            <Input
              {...register('version')}
              placeholder="e.g. 4.1.2"
            />
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t border-border">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isLoading}>
            Import
          </Button>
        </div>
      </form>
    </Modal>
  )
}
