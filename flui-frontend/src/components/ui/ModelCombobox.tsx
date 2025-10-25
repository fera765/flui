import { useState, useEffect, useRef } from 'react'
import { ChevronDown, Loader2, RefreshCw, Search, X } from 'lucide-react'

interface ModelInfo {
  id: string
  name?: string
  owned_by?: string
  description?: string
}

interface ModelComboboxProps {
  value: string
  onChange: (value: string) => void
  endpoint: string
  apiKey?: string
  placeholder?: string
  disabled?: boolean
  error?: string
  className?: string
}

export function ModelCombobox({
  value,
  onChange,
  endpoint,
  apiKey,
  placeholder = 'Digite ou selecione um modelo',
  disabled = false,
  error,
  className = '',
}: ModelComboboxProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [models, setModels] = useState<ModelInfo[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [inputValue, setInputValue] = useState(value)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Sync inputValue com value prop
  useEffect(() => {
    setInputValue(value)
  }, [value])

  // Carregar modelos quando endpoint ou apiKey mudar
  useEffect(() => {
    if (!endpoint) return

    const loadModels = async () => {
      setIsLoading(true)
      setLoadError(null)

      try {
        // Tentar diferentes formatos de URL
        let modelsUrl = endpoint

        if (endpoint.includes('openrouter.ai')) {
          modelsUrl = 'https://openrouter.ai/api/v1/models'
        } else if (!endpoint.endsWith('/models')) {
          // Se não termina com /models, adicionar
          modelsUrl = endpoint.replace(/\/$/, '') + '/models'
        }

        console.log('🔍 [ModelCombobox] Carregando modelos de:', modelsUrl)

        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        }

        if (apiKey) {
          headers['Authorization'] = `Bearer ${apiKey}`
        }

        // Headers específicos para OpenRouter
        if (endpoint.includes('openrouter.ai')) {
          headers['HTTP-Referer'] = 'https://flui.app'
          headers['X-Title'] = 'FLUI Platform'
        }

        const response = await fetch(modelsUrl, { headers })

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const data = await response.json()

        // Normalizar formato (OpenAI vs OpenRouter)
        let modelsList: ModelInfo[] = []

        if (data.data && Array.isArray(data.data)) {
          modelsList = data.data
        } else if (Array.isArray(data)) {
          modelsList = data
        } else {
          throw new Error('Formato de resposta inválido')
        }

        setModels(modelsList)
        console.log(`✅ [ModelCombobox] ${modelsList.length} modelos carregados`)
      } catch (err: any) {
        console.warn('⚠️  [ModelCombobox] Erro ao carregar modelos:', err.message)
        setLoadError(err.message)
        setModels([])
      } finally {
        setIsLoading(false)
      }
    }

    // Delay para evitar múltiplas requisições
    const timeoutId = setTimeout(loadModels, 500)
    return () => clearTimeout(timeoutId)
  }, [endpoint, apiKey])

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Filtrar modelos por searchTerm
  const filteredModels = models.filter(model =>
    model.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    model.name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setInputValue(newValue)
    onChange(newValue)
    setSearchTerm(newValue)

    // Abrir dropdown ao digitar se houver modelos
    if (models.length > 0 && !isOpen) {
      setIsOpen(true)
    }
  }

  const handleSelectModel = (modelId: string) => {
    setInputValue(modelId)
    onChange(modelId)
    setIsOpen(false)
    setSearchTerm('')
  }

  const handleClear = () => {
    setInputValue('')
    onChange('')
    setSearchTerm('')
    inputRef.current?.focus()
  }

  const handleRefresh = async () => {
    setModels([])
    setLoadError(null)
    // Trigger useEffect by updating a dummy state
    setIsLoading(true)
    setTimeout(() => setIsLoading(false), 100)
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Input Field */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => models.length > 0 && setIsOpen(true)}
          placeholder={placeholder}
          disabled={disabled || isLoading}
          className={`
            w-full px-3 py-2 pr-20 
            bg-background border rounded-md
            text-foreground placeholder-muted-foreground
            focus:outline-none focus:ring-2 focus:ring-primary
            disabled:opacity-50 disabled:cursor-not-allowed
            ${error ? 'border-destructive' : 'border-input'}
          `}
        />

        {/* Right Icons */}
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {isLoading && (
            <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />
          )}

          {!isLoading && inputValue && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 hover:bg-accent rounded"
              disabled={disabled}
            >
              <X className="w-3 h-3 text-muted-foreground" />
            </button>
          )}

          {!isLoading && models.length > 0 && (
            <button
              type="button"
              onClick={handleRefresh}
              className="p-1 hover:bg-accent rounded"
              disabled={disabled}
              title="Recarregar modelos"
            >
              <RefreshCw className="w-3 h-3 text-muted-foreground" />
            </button>
          )}

          {models.length > 0 && (
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className="p-1 hover:bg-accent rounded"
              disabled={disabled}
            >
              <ChevronDown
                className={`w-4 h-4 text-muted-foreground transition-transform ${
                  isOpen ? 'rotate-180' : ''
                }`}
              />
            </button>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <p className="mt-1 text-xs text-destructive">{error}</p>
      )}

      {/* Helper Text */}
      {!error && (
        <p className="mt-1 text-xs text-muted-foreground">
          {isLoading ? (
            'Carregando modelos...'
          ) : loadError ? (
            `Erro ao carregar: ${loadError} - Digite o modelo manualmente`
          ) : models.length > 0 ? (
            `${models.length} modelo(s) disponível(eis) - Clique para selecionar ou digite`
          ) : (
            'Digite o nome do modelo manualmente'
          )}
        </p>
      )}

      {/* Dropdown */}
      {isOpen && models.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-background border border-input rounded-md shadow-lg max-h-60 overflow-y-auto">
          {/* Search in Dropdown */}
          {models.length > 10 && (
            <div className="sticky top-0 bg-background border-b border-input p-2">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar modelo..."
                  className="w-full pl-8 pr-3 py-1 text-sm bg-background border border-input rounded focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
          )}

          {/* Models List */}
          <div className="py-1">
            {filteredModels.length === 0 ? (
              <div className="px-3 py-2 text-sm text-muted-foreground text-center">
                Nenhum modelo encontrado
              </div>
            ) : (
              filteredModels.map((model) => (
                <button
                  key={model.id}
                  type="button"
                  onClick={() => handleSelectModel(model.id)}
                  className={`
                    w-full px-3 py-2 text-left text-sm
                    hover:bg-accent transition-colors
                    ${model.id === inputValue ? 'bg-accent font-medium' : ''}
                  `}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="font-mono text-xs truncate">
                        {model.id}
                      </div>
                      {model.name && (
                        <div className="text-xs text-muted-foreground truncate mt-0.5">
                          {model.name}
                        </div>
                      )}
                    </div>
                    {model.owned_by && (
                      <div className="text-xs text-muted-foreground shrink-0">
                        {model.owned_by}
                      </div>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
