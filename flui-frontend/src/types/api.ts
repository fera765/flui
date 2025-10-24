// Flui API Types

export interface Agent {
  id: string
  name: string
  description: string
  systemPrompt: string
  model: string
  temperature: number
  maxTokens: number
  tools: string[]
  mcpIds: string[]
  enabled: boolean
  metadata?: {
    createdAt: string
    updatedAt: string
    executionCount: number
  }
  createdAt: string
  updatedAt: string
}

export interface MCP {
  id: string
  name: string
  description: string
  version: string
  server: string
  installType: 'npm' | 'npx' | 'github' | 'url'
  tools: MCPTool[]
  enabled: boolean
  envVars?: Record<string, string>
  metadata?: {
    createdAt: string
    updatedAt: string
    lastSyncedAt?: string
    importedFrom?: string
    installDir?: string
    authType?: string
  }
}

export interface MCPTool {
  id: string
  name: string
  description: string
  parameters: Record<string, any>
  handler: string
}

export interface AutomationNode {
  id: string
  type: string
  name: string
  description?: string
  config: Record<string, any>
  position?: { x: number; y: number }
  nextNodes?: string[]
}

export interface AutomationEdge {
  id: string
  source: string
  target: string
  condition?: string
  label?: string
}

export interface Automation {
  id: string
  name: string
  description: string
  nodes: AutomationNode[]
  edges: AutomationEdge[]
  startNodeId?: string
  enabled: boolean
  continuousExecution?: boolean
  version?: string
  createdAt: string
  updatedAt: string
  runCount?: number
  metadata?: {
    createdAt: string
    updatedAt: string
  }
}

export interface Tool {
  id: string
  name: string
  description: string
  category: string
  version: string
  params: ToolParam[]
  ui?: {
    tags?: string[]
    icon?: string
    color?: string
    examples?: any[]
  }
  capabilities?: Record<string, any>
  config?: {
    timeout?: number
    retries?: number
    sandbox?: boolean
    concurrent?: boolean
  }
  metrics?: {
    executionCount: number
    successCount: number
    failureCount: number
    averageExecutionTime: number
  }
}

export interface ToolParam {
  name: string
  key: string
  type: string
  description: string
  required: boolean
  default?: any
  ui?: {
    widgetType?: string
    placeholder?: string
    helperText?: string
    allowExpressions?: boolean
  }
}

export interface LLMConfig {
  endpoint: string
  apiKey: string
  hasApiKey: boolean
  model: string
  temperature: number
  maxTokens: number
}

export interface Model {
  id: string
  object: string
  created: number
  owned_by: string
  modalities?: {
    input: string[]
  }
}

export interface ExecutionResult {
  success: boolean
  executionId?: string
  status?: string
  startedAt?: string
  completedAt?: string
  logs?: ExecutionLog[]
  nodeResults?: Record<string, any>
  error?: string
}

export interface ExecutionLog {
  timestamp: string
  nodeId: string
  nodeName: string
  status: string
  message: string
  data?: any
  error?: string
}
