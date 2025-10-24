import { Link2, Plus, Trash2 } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

interface Param {
  key: string
  type: string
  name: string
  description?: string
  required?: boolean
  default?: any
}

interface DynamicConfigInputProps {
  param: Param
  value: any
  onChange: (value: any) => void
  onLinkerClick: (key: string, type: string) => void
}

export function DynamicConfigInput({ param, value, onChange, onLinkerClick }: DynamicConfigInputProps) {
  // Função para detectar se um valor está linkado
  const isLinked = (val: any) => {
    return typeof val === 'string' && val.startsWith('{{') && val.endsWith('}}')
  }

  // String/Number - Input or Textarea
  if (param.type === 'string' || param.type === 'number') {
    const isLongText = param.description?.includes('long') || param.key.includes('prompt')
    const isValueLinked = isLinked(value)
    
    return (
      <div className="space-y-2">
        <div className="flex items-start gap-2">
          <div className="flex-1">
            {isLongText ? (
              <textarea
                value={value || ''}
                onChange={(e) => onChange(e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg text-sm resize-none ${
                  isValueLinked 
                    ? 'border-green-500 bg-green-50 dark:bg-green-950/20' 
                    : 'border-input bg-background'
                }`}
                rows={4}
                placeholder={param.description || `Enter ${param.name}`}
                data-testid={`input-${param.key}`}
              />
            ) : (
              <Input
                type={param.type === 'number' ? 'number' : 'text'}
                value={value || ''}
                onChange={(e) => onChange(param.type === 'number' ? Number(e.target.value) : e.target.value)}
                placeholder={param.description || `Enter ${param.name}`}
                className={isValueLinked ? 'border-green-500 bg-green-50 dark:bg-green-950/20' : ''}
                data-testid={`input-${param.key}`}
              />
            )}
          </div>
          <Button
            size="sm"
            variant={isValueLinked ? "default" : "secondary"}
            onClick={() => onLinkerClick(param.key, param.type)}
            title="Link output from previous node"
            className={isValueLinked ? "bg-green-500 hover:bg-green-600 text-white" : ""}
            data-testid={`linker-${param.key}`}
          >
            <Link2 className={`w-4 h-4 ${isValueLinked ? "text-white" : ""}`} />
          </Button>
        </div>
      </div>
    )
  }

  // Boolean - Switch
  if (param.type === 'boolean') {
    const isValueLinked = isLinked(value)
    
    return (
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <button
            onClick={() => onChange(!value)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              isValueLinked ? 'bg-green-500' : value ? 'bg-primary' : 'bg-muted'
            }`}
            data-testid={`switch-${param.key}`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                value ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
          <span className="ml-3 text-sm text-muted-foreground">
            {isValueLinked ? 'Linked' : value ? 'Enabled' : 'Disabled'}
          </span>
        </div>
        <Button
          size="sm"
          variant={isValueLinked ? "default" : "secondary"}
          onClick={() => onLinkerClick(param.key, 'boolean')}
          title="Link boolean output"
          className={isValueLinked ? "bg-green-500 hover:bg-green-600 text-white" : ""}
          data-testid={`linker-${param.key}`}
        >
          <Link2 className={`w-4 h-4 ${isValueLinked ? "text-white" : ""}`} />
        </Button>
      </div>
    )
  }

  // Array - Multiple inputs with add/remove
  if (param.type === 'array') {
    const arrayValue = Array.isArray(value) ? value : []
    const isValueLinked = isLinked(value)

    return (
      <div className="space-y-2">
        {isValueLinked ? (
          <div className="p-3 bg-green-50 dark:bg-green-950/20 border border-green-500 rounded-lg">
            <p className="text-sm text-green-700 dark:text-green-300 font-mono">{value}</p>
            <p className="text-xs text-green-600 dark:text-green-400 mt-1">Linked value</p>
          </div>
        ) : (
          arrayValue.map((item: any, index: number) => (
            <div key={index} className="flex items-center gap-2">
              <Input
                value={item}
                onChange={(e) => {
                  const newArray = [...arrayValue]
                  newArray[index] = e.target.value
                  onChange(newArray)
                }}
                placeholder={`Item ${index + 1}`}
                data-testid={`array-input-${param.key}-${index}`}
              />
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  const newArray = arrayValue.filter((_, i) => i !== index)
                  onChange(newArray)
                }}
                data-testid={`array-remove-${param.key}-${index}`}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))
        )}
        <div className="flex gap-2">
          {!isValueLinked && (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => onChange([...arrayValue, ''])}
              className="flex-1"
              data-testid={`array-add-${param.key}`}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Item
            </Button>
          )}
          <Button
            size="sm"
            variant={isValueLinked ? "default" : "secondary"}
            onClick={() => onLinkerClick(param.key, 'array')}
            title="Link array output"
            className={isValueLinked ? "bg-green-500 hover:bg-green-600 text-white" : ""}
            data-testid={`linker-${param.key}`}
          >
            <Link2 className={`w-4 h-4 ${isValueLinked ? "text-white" : ""}`} />
          </Button>
        </div>
      </div>
    )
  }

  // JSON/Object - Key-value pairs
  if (param.type === 'json' || param.type === 'object') {
    const objValue = value && typeof value === 'object' ? value : {}
    const entries = Object.entries(objValue)
    const isValueLinked = isLinked(value)

    return (
      <div className="space-y-2">
        {isValueLinked ? (
          <div className="p-3 bg-green-50 dark:bg-green-950/20 border border-green-500 rounded-lg">
            <p className="text-sm text-green-700 dark:text-green-300 font-mono">{value}</p>
            <p className="text-xs text-green-600 dark:text-green-400 mt-1">Linked value</p>
          </div>
        ) : (
          <>
            {entries.map(([key, val], index) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  value={key}
                  onChange={(e) => {
                    const newObj = { ...objValue }
                    delete newObj[key]
                    newObj[e.target.value] = val
                    onChange(newObj)
                  }}
                  placeholder="Key"
                  className="w-1/3"
                  data-testid={`json-key-${param.key}-${index}`}
                />
                <Input
                  value={String(val)}
                  onChange={(e) => {
                    onChange({ ...objValue, [key]: e.target.value })
                  }}
                  placeholder="Value"
                  className="flex-1"
                  data-testid={`json-value-${param.key}-${index}`}
                />
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    const newObj = { ...objValue }
                    delete newObj[key]
                    onChange(newObj)
                  }}
                  data-testid={`json-remove-${param.key}-${index}`}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </>
        )}
        <div className="flex gap-2">
          {!isValueLinked && (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => onChange({ ...objValue, [`key${entries.length + 1}`]: '' })}
              className="flex-1"
              data-testid={`json-add-${param.key}`}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Field
            </Button>
          )}
          <Button
            size="sm"
            variant={isValueLinked ? "default" : "secondary"}
            onClick={() => onLinkerClick(param.key, 'json')}
            title="Link object output"
            className={isValueLinked ? "bg-green-500 hover:bg-green-600 text-white" : ""}
            data-testid={`linker-${param.key}`}
          >
            <Link2 className={`w-4 h-4 ${isValueLinked ? "text-white" : ""}`} />
          </Button>
        </div>
      </div>
    )
  }

  // Fallback - Generic input
  const isValueLinked = isLinked(value)
  
  return (
    <div className="flex items-center gap-2">
      <Input
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={param.description || param.name}
        className={isValueLinked ? 'border-green-500 bg-green-50 dark:bg-green-950/20' : ''}
        data-testid={`input-${param.key}`}
      />
      <Button
        size="sm"
        variant={isValueLinked ? "default" : "secondary"}
        onClick={() => onLinkerClick(param.key, param.type)}
        className={isValueLinked ? "bg-green-500 hover:bg-green-600 text-white" : ""}
        data-testid={`linker-${param.key}`}
      >
        <Link2 className={`w-4 h-4 ${isValueLinked ? "text-white" : ""}`} />
      </Button>
    </div>
  )
}
