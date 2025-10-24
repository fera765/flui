import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Save, TestTube, CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { api } from '@/services/api'
import { toast } from 'sonner'

const llmConfigSchema = z.object({
  endpoint: z.string().url('Endpoint inválido'),
  apiKey: z.string().optional(),
  model: z.string().min(1, 'Modelo é obrigatório'),
  temperature: z.number().min(0).max(2).default(0.7),
  maxTokens: z.number().min(100).max(100000).default(2000),
})

type LLMConfigData = z.infer<typeof llmConfigSchema>

export function Settings() {
  const [isSaving, setIsSaving] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [testStatus, setTestStatus] = useState<'idle' | 'success' | 'error'>('idle')
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<LLMConfigData>({
    resolver: zodResolver(llmConfigSchema),
    defaultValues: {
      endpoint: 'https://api.openai.com/v1',
      apiKey: '',
      model: 'gpt-4-turbo-preview',
      temperature: 0.7,
      maxTokens: 2000,
    },
  })
  
  // Carregar configuração atual
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const config = await api.get('/api/llm/config')
        if (config.llm) {
          setValue('endpoint', config.llm.endpoint)
          setValue('apiKey', config.llm.apiKey || '')
          setValue('model', config.llm.model)
          setValue('temperature', config.llm.temperature)
          setValue('maxTokens', config.llm.maxTokens)
        }
      } catch (error: any) {
        console.error('Erro ao carregar config:', error)
      }
    }
    
    loadConfig()
  }, [setValue])
  
  const onSubmit = async (data: LLMConfigData) => {
    setIsSaving(true)
    try {
      await api.post('/api/llm/config', data)
      
      toast.success('Configuração salva!', {
        description: 'As configurações do LLM foram atualizadas'
      })
      
      setTestStatus('idle')
    } catch (error: any) {
      toast.error('Erro ao salvar', {
        description: error.message
      })
    } finally {
      setIsSaving(false)
    }
  }
  
  const handleTest = async () => {
    setIsTesting(true)
    setTestStatus('idle')
    
    try {
      const response = await api.post('/api/llm/test', {
        message: 'Hello! Please respond with a simple greeting.',
      })
      
      if (response.success && response.response) {
        setTestStatus('success')
        toast.success('Teste bem-sucedido!', {
          description: `Modelo: ${response.model}`,
        })
      } else {
        setTestStatus('error')
        toast.error('Teste falhou', {
          description: 'Resposta inválida do LLM'
        })
      }
    } catch (error: any) {
      setTestStatus('error')
      toast.error('Teste falhou', {
        description: error.message
      })
    } finally {
      setIsTesting(false)
    }
  }
  
  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-4xl mx-auto p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Configurações</h1>
          <p className="text-muted-foreground">
            Configure o endpoint LLM e outras configurações do sistema
          </p>
        </div>
        
        {/* LLM Configuration */}
        <div className="bg-card border border-border rounded-lg p-6 mb-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-foreground mb-2 flex items-center gap-2">
              🤖 Configuração LLM
            </h2>
            <p className="text-sm text-muted-foreground">
              Configure o endpoint e credenciais para o modelo de linguagem
            </p>
          </div>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Endpoint */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Endpoint *
              </label>
              <Input
                {...register('endpoint')}
                placeholder="https://api.openai.com/v1"
                error={errors.endpoint?.message}
              />
              <p className="text-xs text-muted-foreground mt-1">
                URL base da API compatível com OpenAI (ex: OpenAI, Azure, OpenRouter, Ollama)
              </p>
            </div>
            
            {/* API Key */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                API Key
              </label>
              <Input
                {...register('apiKey')}
                type="password"
                placeholder="sk-..."
                error={errors.apiKey?.message}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Opcional se o endpoint não exigir autenticação
              </p>
            </div>
            
            {/* Model */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Modelo *
              </label>
              <Input
                {...register('model')}
                placeholder="gpt-4-turbo-preview"
                error={errors.model?.message}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Nome do modelo a ser usado (ex: gpt-4-turbo-preview, gpt-3.5-turbo, claude-3-opus)
              </p>
            </div>
            
            {/* Temperature */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Temperature
                </label>
                <Input
                  {...register('temperature', { valueAsNumber: true })}
                  type="number"
                  step="0.1"
                  min="0"
                  max="2"
                  placeholder="0.7"
                  error={errors.temperature?.message}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  0 = determinístico, 2 = criativo
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Max Tokens
                </label>
                <Input
                  {...register('maxTokens', { valueAsNumber: true })}
                  type="number"
                  min="100"
                  max="100000"
                  placeholder="2000"
                  error={errors.maxTokens?.message}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Limite de tokens na resposta
                </p>
              </div>
            </div>
            
            {/* Actions */}
            <div className="flex items-center gap-3 pt-4 border-t border-border">
              <Button
                type="submit"
                isLoading={isSaving}
                disabled={isSaving || isTesting}
              >
                <Save className="w-4 h-4 mr-2" />
                Salvar Configuração
              </Button>
              
              <Button
                type="button"
                variant="outline"
                onClick={handleTest}
                isLoading={isTesting}
                disabled={isSaving || isTesting}
              >
                {isTesting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Testando...
                  </>
                ) : testStatus === 'success' ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2 text-green-500" />
                    Testado
                  </>
                ) : testStatus === 'error' ? (
                  <>
                    <XCircle className="w-4 h-4 mr-2 text-destructive" />
                    Erro
                  </>
                ) : (
                  <>
                    <TestTube className="w-4 h-4 mr-2" />
                    Testar Conexão
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
        
        {/* System Info */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
            ℹ️ Informações do Sistema
          </h2>
          
          <div className="space-y-3 text-sm">
            <div className="flex justify-between py-2 border-b border-border">
              <span className="text-muted-foreground">Versão</span>
              <span className="font-medium">1.0.0</span>
            </div>
            
            <div className="flex justify-between py-2 border-b border-border">
              <span className="text-muted-foreground">Backend</span>
              <span className="font-medium text-green-500">● Conectado</span>
            </div>
            
            <div className="flex justify-between py-2 border-b border-border">
              <span className="text-muted-foreground">API Endpoint</span>
              <span className="font-mono text-xs">/api</span>
            </div>
            
            <div className="flex justify-between py-2">
              <span className="text-muted-foreground">Ambiente</span>
              <span className="font-medium">Production</span>
            </div>
          </div>
        </div>
        
        {/* Help Section */}
        <div className="mt-6 p-4 bg-muted rounded-lg">
          <h3 className="font-medium text-foreground mb-2">💡 Dicas</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Para OpenAI: use <code className="text-xs bg-background px-1 py-0.5 rounded">https://api.openai.com/v1</code></li>
            <li>• Para Ollama local: use <code className="text-xs bg-background px-1 py-0.5 rounded">http://localhost:11434/v1</code></li>
            <li>• Para Azure OpenAI: use o endpoint da sua instância</li>
            <li>• Teste a conexão após salvar para garantir que está funcionando</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
