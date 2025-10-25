import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Save, TestTube, CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { api } from '@/services/api'
import { toast } from 'sonner'

interface ModelInfo {
  id: string
  object: string
  created: number
  owned_by: string
  modalities?: { input: string[] }
}

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
  const [availableModels, setAvailableModels] = useState<ModelInfo[]>([])
  const [isLoadingModels, setIsLoadingModels] = useState(false)
  const [currentEndpoint, setCurrentEndpoint] = useState('https://api.llm7.io/v1')
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<LLMConfigData>({
    resolver: zodResolver(llmConfigSchema),
    defaultValues: {
      endpoint: 'https://api.llm7.io/v1',
      apiKey: '',
      model: 'deepseek-v3.1',
      temperature: 0.7,
      maxTokens: 2000,
    },
  })
  
  const endpoint = watch('endpoint')
  const selectedModel = watch('model')
  
  // Carregar configuração atual
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const config: any = await api.get('/api/llm/config')
        console.log('✅ Config carregada do backend:', config)
        
        if (config && config.llm) {
          const endpoint = config.llm.endpoint || 'https://api.llm7.io/v1'
          const apiKey = config.llm.apiKey === '***' ? '' : (config.llm.apiKey || '')
          const model = config.llm.model || 'deepseek-v3.1'
          const temp = config.llm.temperature ?? 0.7
          const tokens = config.llm.maxTokens || 2000
          
          console.log('📝 Preenchendo formulário:', { endpoint, model, temp, tokens, hasApiKey: !!apiKey })
          
          setValue('endpoint', endpoint)
          setValue('apiKey', apiKey)
          setValue('model', model)
          setValue('temperature', temp)
          setValue('maxTokens', tokens)
          setCurrentEndpoint(endpoint)
          
          console.log('✅ Formulário preenchido com sucesso')
        }
      } catch (error: any) {
        console.error('❌ Erro ao carregar config:', error)
        toast.error('Erro ao carregar configuração', {
          description: error.message
        })
      }
    }
    
    loadConfig()
  }, [setValue])
  
  // 🚀 Carregar modelos disponíveis quando endpoint OU apiKey mudarem
  useEffect(() => {
    const apiKey = watch('apiKey')
    
    if (endpoint && endpoint !== currentEndpoint) {
      setCurrentEndpoint(endpoint)
      // ✅ Delay para garantir que API key foi preenchida
      const timer = setTimeout(() => {
        loadAvailableModels(endpoint)
      }, 500)
      
      return () => clearTimeout(timer)
    }
  }, [endpoint, watch('apiKey')])
  
  // Carregar modelos na inicialização
  useEffect(() => {
    if (currentEndpoint) {
      loadAvailableModels(currentEndpoint)
    }
  }, [])
  
  const loadAvailableModels = async (endpointUrl: string) => {
    setIsLoadingModels(true)
    setAvailableModels([])  // ✅ Limpar modelos enquanto carrega
    
    try {
      console.log('🔍 Carregando modelos de:', endpointUrl)
      
      // Tentar carregar modelos do endpoint
      const modelsUrl = endpointUrl.endsWith('/') ? `${endpointUrl}models` : `${endpointUrl}/models`
      
      // ✅ Pegar API key do formulário atual
      const currentApiKey = watch('apiKey')
      
      const response = await fetch(modelsUrl, {
        headers: {
          ...(currentApiKey && { 'Authorization': `Bearer ${currentApiKey}` }),
          'Content-Type': 'application/json',
        },
      })
      
      if (response.ok) {
        const data = await response.json()
        
        // Suportar formato OpenAI (data.data) ou formato direto (array)
        const models = Array.isArray(data) ? data : data.data || []
        setAvailableModels(models)
        
        console.log(`✅ Loaded ${models.length} models from ${endpointUrl}`)
      } else {
        console.warn('Failed to load models:', response.statusText)
        setAvailableModels([])
      }
    } catch (error) {
      console.error('Error loading models:', error)
      setAvailableModels([])
    } finally {
      setIsLoadingModels(false)
    }
  }
  
  const onSubmit = async (data: LLMConfigData) => {
    setIsSaving(true)
    try {
      console.log('📤 Enviando config para salvar:', {
        endpoint: data.endpoint,
        model: data.model,
        temperature: data.temperature,
        maxTokens: data.maxTokens,
        hasApiKey: !!data.apiKey
      })
      
      const response: any = await api.post('/api/llm/config', data)
      
      console.log('✅ Config salva com sucesso:', response)
      
      toast.success('Configuração salva!', {
        description: `Modelo: ${data.model}`
      })
      
      // ✅ Recarregar config para confirmar que foi salva
      setTimeout(async () => {
        const savedConfig: any = await api.get('/api/llm/config')
        console.log('🔍 Verificando config salva:', savedConfig)
      }, 500)
      
      setTestStatus('idle')
    } catch (error: any) {
      console.error('❌ Erro ao salvar config:', error)
      
      toast.error('Erro ao salvar', {
        description: error.response?.data?.error || error.message
      })
    } finally {
      setIsSaving(false)
    }
  }
  
  const handleTest = async () => {
    setIsTesting(true)
    setTestStatus('idle')
    
    try {
      const response: any = await api.post('/api/llm/test', {
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
              
              {availableModels.length > 0 ? (
                <div>
                  <select
                    {...register('model')}
                    className="w-full px-3 py-2 bg-background border border-input rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    disabled={isLoadingModels}
                  >
                    {availableModels.map((model) => (
                      <option key={model.id} value={model.id}>
                        {model.id} {model.owned_by ? `(${model.owned_by})` : ''}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-muted-foreground mt-1">
                    {availableModels.length} modelos disponíveis no endpoint
                  </p>
                </div>
              ) : (
                <div>
                  <Input
                    {...register('model')}
                    placeholder="deepseek-v3.1"
                    error={errors.model?.message}
                    disabled={isLoadingModels}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {isLoadingModels 
                      ? 'Carregando modelos...' 
                      : 'Digite o nome do modelo manualmente ou configure o endpoint para carregar automáticamente'
                    }
                  </p>
                </div>
              )}
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
                {testStatus === 'success' ? (
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
            <li>• Para LLM7 (padrão): use <code className="text-xs bg-background px-1 py-0.5 rounded">https://api.llm7.io/v1</code></li>
            <li>• Para OpenAI: use <code className="text-xs bg-background px-1 py-0.5 rounded">https://api.openai.com/v1</code></li>
            <li>• Para Ollama local: use <code className="text-xs bg-background px-1 py-0.5 rounded">http://localhost:11434/v1</code></li>
            <li>• Para Azure OpenAI: use o endpoint da sua instância</li>
            <li>• Os modelos são carregados automaticamente ao trocar o endpoint</li>
            <li>• Teste a conexão após salvar para garantir que está funcionando</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
