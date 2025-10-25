import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { api } from '@/services/api'
import { toast } from 'sonner'
import { Calendar, Clock, Globe, Play, Pause } from 'lucide-react'

const cronSchema = z.object({
  automationId: z.string().min(1),
  cronExpression: z.string().min(1),
  timezone: z.string().default('America/Sao_Paulo'),
  enabled: z.boolean().default(true),
  maxExecutions: z.number().min(0).default(0),
  triggerData: z.string().optional(),
})

type CronFormData = z.infer<typeof cronSchema>

interface CronTriggerModalProps {
  isOpen: boolean
  onClose: () => void
  automationId: string
  existingCron?: any
}

export function CronTriggerModal({
  isOpen,
  onClose,
  automationId,
  existingCron,
}: CronTriggerModalProps) {
  const [isSaving, setIsSaving] = useState(false)
  const [cronData, setCronData] = useState<any>(existingCron)
  const [selectedPreset, setSelectedPreset] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<CronFormData>({
    resolver: zodResolver(cronSchema),
    defaultValues: {
      automationId,
      cronExpression: existingCron?.cronExpression || '0 * * * *',
      timezone: existingCron?.timezone || 'America/Sao_Paulo',
      enabled: existingCron?.enabled !== false,
      maxExecutions: existingCron?.maxExecutions || 0,
      triggerData: existingCron?.triggerData ? JSON.stringify(existingCron.triggerData, null, 2) : '',
    },
  })

  const cronPresets = [
    { label: 'A cada minuto', value: '* * * * *' },
    { label: 'A cada 5 minutos', value: '*/5 * * * *' },
    { label: 'A cada 15 minutos', value: '*/15 * * * *' },
    { label: 'A cada 30 minutos', value: '*/30 * * * *' },
    { label: 'A cada hora', value: '0 * * * *' },
    { label: 'A cada dia (00:00)', value: '0 0 * * *' },
    { label: 'A cada semana (segunda 00:00)', value: '0 0 * * 1' },
    { label: 'A cada mês (dia 1, 00:00)', value: '0 0 1 * *' },
  ]

  const timezones = [
    'America/Sao_Paulo',
    'America/New_York',
    'Europe/London',
    'Europe/Paris',
    'Asia/Tokyo',
    'Australia/Sydney',
    'UTC',
  ]

  const handlePresetSelect = (preset: string) => {
    setValue('cronExpression', preset)
    setSelectedPreset(preset)
  }

  const onSubmit = async (data: CronFormData) => {
    setIsSaving(true)
    try {
      // Parsear triggerData de string para JSON
      let parsedTriggerData = {}
      if (data.triggerData && data.triggerData.trim()) {
        try {
          parsedTriggerData = JSON.parse(data.triggerData)
        } catch (e) {
          toast.error('JSON inválido no Trigger Data')
          setIsSaving(false)
          return
        }
      }

      const payload = {
        ...data,
        triggerData: parsedTriggerData,
      }

      const response: any = existingCron
        ? await api.put(`/api/crons/${existingCron.id}`, payload)
        : await api.post('/api/crons', payload)

      setCronData(response.cron || response)

      toast.success(existingCron ? 'Cron atualizado!' : 'Cron criado!', {
        description: `Executará: ${data.cronExpression}`,
      })
    } catch (error: any) {
      console.error('Erro ao salvar cron:', error)
      toast.error('Erro ao salvar cron', {
        description: error.response?.data?.error || error.message,
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleToggle = async () => {
    if (!cronData?.id) return

    try {
      const newEnabled = !cronData.enabled
      const endpoint = newEnabled ? `/api/crons/${cronData.id}/start` : `/api/crons/${cronData.id}/stop`

      await api.post(endpoint)

      setCronData({ ...cronData, enabled: newEnabled, isActive: newEnabled })
      setValue('enabled', newEnabled)

      toast.success(newEnabled ? 'Cron iniciado!' : 'Cron parado!')
    } catch (error: any) {
      toast.error('Erro ao alterar status', {
        description: error.message,
      })
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={existingCron ? 'Editar Cron Trigger' : 'Novo Cron Trigger'}
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Status do Cron */}
        {cronData && (
          <div className={`border rounded-lg p-4 ${cronData.enabled ? 'bg-green-500/10 border-green-500/20' : 'bg-gray-500/10 border-gray-500/20'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold flex items-center gap-2">
                  {cronData.enabled ? (
                    <>
                      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                      Ativo
                    </>
                  ) : (
                    <>
                      <span className="w-2 h-2 bg-gray-500 rounded-full"></span>
                      Inativo
                    </>
                  )}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Execuções: {cronData.executionCount || 0} / {cronData.maxExecutions || '∞'}
                </p>
                {cronData.lastExecutedAt && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Última execução: {new Date(cronData.lastExecutedAt).toLocaleString('pt-BR')}
                  </p>
                )}
              </div>

              <Button
                type="button"
                variant={cronData.enabled ? 'outline' : 'default'}
                size="sm"
                onClick={handleToggle}
              >
                {cronData.enabled ? (
                  <>
                    <Pause className="w-4 h-4 mr-1" />
                    Parar
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-1" />
                    Iniciar
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Presets */}
        <div>
          <label className="block text-sm font-medium mb-2">
            <Calendar className="w-4 h-4 inline mr-1" />
            Presets Rápidos
          </label>
          <div className="grid grid-cols-2 gap-2">
            {cronPresets.map((preset) => (
              <button
                key={preset.value}
                type="button"
                onClick={() => handlePresetSelect(preset.value)}
                className={`px-3 py-2 text-sm border rounded-md transition-colors ${
                  watch('cronExpression') === preset.value
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background border-input hover:bg-accent'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Cron Expression */}
        <div>
          <label className="block text-sm font-medium mb-2">
            <Clock className="w-4 h-4 inline mr-1" />
            Expressão Cron *
          </label>
          <Input
            {...register('cronExpression')}
            placeholder="*/5 * * * *"
            error={errors.cronExpression?.message}
            className="font-mono"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Formato: minuto hora dia mês dia-da-semana
          </p>
          <p className="text-xs text-blue-400 mt-1">
            Use{' '}
            <a
              href="https://crontab.guru"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              crontab.guru
            </a>{' '}
            para ajuda
          </p>
        </div>

        {/* Timezone */}
        <div>
          <label className="block text-sm font-medium mb-2">
            <Globe className="w-4 h-4 inline mr-1" />
            Timezone
          </label>
          <select
            {...register('timezone')}
            className="w-full px-3 py-2 bg-background border border-input rounded-md"
          >
            {timezones.map((tz) => (
              <option key={tz} value={tz}>
                {tz}
              </option>
            ))}
          </select>
        </div>

        {/* Max Executions */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Máximo de Execuções
          </label>
          <Input
            type="number"
            {...register('maxExecutions', { valueAsNumber: true })}
            placeholder="0"
            error={errors.maxExecutions?.message}
          />
          <p className="text-xs text-muted-foreground mt-1">
            0 = ilimitado (cron roda indefinidamente)
          </p>
        </div>

        {/* Trigger Data */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Dados Iniciais (JSON)
          </label>
          <textarea
            {...register('triggerData')}
            placeholder='{"source": "cron", "message": "Scheduled execution"}'
            rows={4}
            className="w-full px-3 py-2 bg-background border border-input rounded-md font-mono text-sm resize-none"
          />
          <p className="text-xs text-muted-foreground mt-1">
            JSON que será passado para a automação em cada execução
          </p>
        </div>

        {/* Enabled Toggle */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            {...register('enabled')}
            className="w-4 h-4 rounded border-input"
            id="cron-enabled"
          />
          <label htmlFor="cron-enabled" className="text-sm cursor-pointer">
            Habilitar agendamento automaticamente
          </label>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onClose}>
            Fechar
          </Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? 'Salvando...' : existingCron ? 'Atualizar' : 'Criar Cron'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
