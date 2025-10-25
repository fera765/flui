import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { api } from '@/services/api'
import { toast } from 'sonner'
import { Copy, RefreshCw, Trash2, Plus, X } from 'lucide-react'

const webhookSchema = z.object({
  automationId: z.string().min(1),
  path: z.string().optional(),
  method: z.string().default('POST'),
  requireAuth: z.boolean().default(true),
  enabled: z.boolean().default(true),
  rateLimit: z.number().min(0).default(60),
})

type WebhookFormData = z.infer<typeof webhookSchema>

interface WebhookField {
  key: string
  type: 'string' | 'number' | 'boolean' | 'json' | 'array' | 'object'
  required: boolean
  description?: string
}

interface WebhookTriggerModalProps {
  isOpen: boolean
  onClose: () => void
  automationId: string
  existingWebhook?: any
}

export function WebhookTriggerModal({ 
  isOpen, 
  onClose, 
  automationId,
  existingWebhook 
}: WebhookTriggerModalProps) {
  const [isSaving, setIsSaving] = useState(false)
  const [webhookData, setWebhookData] = useState<any>(existingWebhook)
  const [jsonFields, setJsonFields] = useState<WebhookField[]>([])
  const [isRegeneratingToken, setIsRegeneratingToken] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<WebhookFormData>({
    resolver: zodResolver(webhookSchema),
    defaultValues: {
      automationId,
      path: existingWebhook?.path || '',
      method: existingWebhook?.method || 'POST',
      requireAuth: existingWebhook?.requireAuth !== false,
      enabled: existingWebhook?.enabled !== false,
      rateLimit: existingWebhook?.rateLimit || 60,
    },
  })

  useEffect(() => {
    if (existingWebhook?.jsonSchema?.fields) {
      setJsonFields(existingWebhook.jsonSchema.fields)
    }
  }, [existingWebhook])

  const onSubmit = async (data: WebhookFormData) => {
    setIsSaving(true)
    try {
      const payload = {
        ...data,
        jsonSchema: jsonFields.length > 0 ? { fields: jsonFields } : undefined,
      }

      const response: any = existingWebhook
        ? await api.put(`/api/webhooks/${existingWebhook.id}`, payload)
        : await api.post('/api/webhooks', payload)

      const webhookResult = (response as any).webhook || response
      setWebhookData(webhookResult)

      toast.success(existingWebhook ? 'Webhook atualizado!' : 'Webhook criado!', {
        description: 'URL disponível abaixo',
      })
    } catch (error: any) {
      console.error('Erro ao salvar webhook:', error)
      toast.error('Erro ao salvar webhook', {
        description: error.response?.data?.error || error.message,
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleRegenerateToken = async () => {
    if (!webhookData?.id) return

    setIsRegeneratingToken(true)
    try {
      const response: any = await api.post(`/api/webhooks/${webhookData.id}/regenerate-token`)
      
      setWebhookData({
        ...webhookData,
        secretToken: (response.webhook || response).secretToken,
      })

      toast.success('Token regenerado!', {
        description: 'Use o novo token abaixo',
      })
    } catch (error: any) {
      toast.error('Erro ao regenerar token', {
        description: error.message,
      })
    } finally {
      setIsRegeneratingToken(false)
    }
  }

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} copiado!`)
  }

  const addField = () => {
    setJsonFields([
      ...jsonFields,
      { key: '', type: 'string', required: false, description: '' },
    ])
  }

  const removeField = (index: number) => {
    setJsonFields(jsonFields.filter((_, i) => i !== index))
  }

  const updateField = (index: number, updates: Partial<WebhookField>) => {
    setJsonFields(
      jsonFields.map((field, i) => (i === index ? { ...field, ...updates } : field))
    )
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={existingWebhook ? 'Editar Webhook Trigger' : 'Novo Webhook Trigger'}
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Webhook criado - Mostrar URL e Token */}
        {webhookData && (
          <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-lg p-6 space-y-4">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <span className="text-2xl">🔗</span>
              Webhook Ativo
            </h3>

            {/* URL */}
            <div>
              <label className="block text-sm font-medium mb-2">Webhook URL</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={webhookData.url || ''}
                  readOnly
                  className="flex-1 px-3 py-2 bg-background/50 border border-input rounded-md text-sm font-mono"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopy(webhookData.url, 'URL')}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Token */}
            <div>
              <label className="block text-sm font-medium mb-2">Secret Token</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={webhookData.secretToken || ''}
                  readOnly
                  className="flex-1 px-3 py-2 bg-background/50 border border-input rounded-md text-sm font-mono"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopy(webhookData.secretToken, 'Token')}
                >
                  <Copy className="w-4 h-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleRegenerateToken}
                  disabled={isRegeneratingToken}
                >
                  <RefreshCw className={`w-4 h-4 ${isRegeneratingToken ? 'animate-spin' : ''}`} />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Use este token no header: <code className="text-xs bg-muted px-1 py-0.5 rounded">X-Webhook-Secret</code>
              </p>
            </div>

            {/* Exemplo CURL */}
            {webhookData.curlExample && (
              <div>
                <label className="block text-sm font-medium mb-2">Exemplo (CURL)</label>
                <div className="flex gap-2">
                  <pre className="flex-1 px-3 py-2 bg-background/50 border border-input rounded-md text-xs font-mono overflow-x-auto">
                    {webhookData.curlExample}
                  </pre>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopy(webhookData.curlExample, 'CURL')}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Configurações */}
        <div className="space-y-4">
          <h3 className="font-semibold">Configurações</h3>

          {/* Path */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Path Customizado (opcional)
            </label>
            <Input
              {...register('path')}
              placeholder="/meu-webhook"
              error={errors.path?.message}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Deixe vazio para gerar automaticamente
            </p>
          </div>

          {/* Method */}
          <div>
            <label className="block text-sm font-medium mb-2">Método HTTP</label>
            <select
              {...register('method')}
              className="w-full px-3 py-2 bg-background border border-input rounded-md"
            >
              <option value="POST">POST</option>
              <option value="GET">GET</option>
              <option value="PUT">PUT</option>
              <option value="PATCH">PATCH</option>
              <option value="DELETE">DELETE</option>
              <option value="ANY">Qualquer</option>
            </select>
          </div>

          {/* Rate Limit */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Rate Limit (requisições/minuto)
            </label>
            <Input
              type="number"
              {...register('rateLimit', { valueAsNumber: true })}
              placeholder="60"
              error={errors.rateLimit?.message}
            />
            <p className="text-xs text-muted-foreground mt-1">
              0 = ilimitado
            </p>
          </div>

          {/* Toggles */}
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                {...register('requireAuth')}
                className="w-4 h-4 rounded border-input"
              />
              <span className="text-sm">Requer Autenticação</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                {...register('enabled')}
                className="w-4 h-4 rounded border-input"
              />
              <span className="text-sm">Habilitado</span>
            </label>
          </div>
        </div>

        {/* JSON Schema */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">JSON Schema (Campos Esperados)</h3>
            <Button type="button" size="sm" onClick={addField}>
              <Plus className="w-4 h-4 mr-1" />
              Adicionar Campo
            </Button>
          </div>

          {jsonFields.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Nenhum campo definido</p>
              <p className="text-sm">Clique em "Adicionar Campo" para definir a estrutura esperada</p>
            </div>
          ) : (
            <div className="space-y-3">
              {jsonFields.map((field, index) => (
                <div
                  key={index}
                  className="p-4 bg-muted/30 border border-border rounded-lg space-y-3"
                >
                  <div className="flex items-start gap-3">
                    {/* Key */}
                    <div className="flex-1">
                      <input
                        type="text"
                        value={field.key}
                        onChange={(e) => updateField(index, { key: e.target.value })}
                        placeholder="Nome do campo (ex: name)"
                        className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm"
                      />
                    </div>

                    {/* Type */}
                    <div className="w-32">
                      <select
                        value={field.type}
                        onChange={(e) =>
                          updateField(index, { type: e.target.value as any })
                        }
                        className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm"
                      >
                        <option value="string">String</option>
                        <option value="number">Number</option>
                        <option value="boolean">Boolean</option>
                        <option value="json">JSON</option>
                        <option value="array">Array</option>
                        <option value="object">Object</option>
                      </select>
                    </div>

                    {/* Required */}
                    <label className="flex items-center gap-2 cursor-pointer pt-2">
                      <input
                        type="checkbox"
                        checked={field.required}
                        onChange={(e) => updateField(index, { required: e.target.checked })}
                        className="w-4 h-4 rounded border-input"
                      />
                      <span className="text-sm whitespace-nowrap">Obrigatório</span>
                    </label>

                    {/* Delete */}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeField(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Description */}
                  <input
                    type="text"
                    value={field.description || ''}
                    onChange={(e) => updateField(index, { description: e.target.value })}
                    placeholder="Descrição (opcional)"
                    className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onClose}>
            Fechar
          </Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? 'Salvando...' : existingWebhook ? 'Atualizar' : 'Criar Webhook'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
