/**
 * FLUI - Type Matching System
 * 
 * Sistema inteligente de compatibilidade de tipos entre nodes
 * SUPERIOR AO N8N: Type-safe, visual, para não-técnicos
 */

export type FieldType = 'string' | 'number' | 'boolean' | 'object' | 'array' | 'json' | 'file';

/**
 * Verifica se dois tipos são compatíveis para linkagem
 */
export function areTypesCompatible(sourceType: FieldType, targetType: FieldType): boolean {
  // Compatibilidade direta
  if (sourceType === targetType) {
    return true;
  }
  
  // JSON é compatível com object e array
  if (sourceType === 'json' && (targetType === 'object' || targetType === 'array')) {
    return true;
  }
  if (targetType === 'json' && (sourceType === 'object' || sourceType === 'array')) {
    return true;
  }
  
  // Object é compatível com JSON
  if (sourceType === 'object' && targetType === 'json') {
    return true;
  }
  
  // Number pode ser convertido para string
  if (sourceType === 'number' && targetType === 'string') {
    return true;
  }
  
  // Boolean pode ser convertido para string
  if (sourceType === 'boolean' && targetType === 'string') {
    return true;
  }
  
  return false;
}

/**
 * Interface de um campo de output de um node
 */
export interface OutputField {
  key: string;
  type: FieldType;
  label?: string;
  description?: string;
  value?: any;
}

/**
 * Interface de um campo de input de um node
 */
export interface InputField {
  key: string;
  type: FieldType;
  label?: string;
  description?: string;
  required?: boolean;
  linkedFrom?: {
    nodeId: string;
    nodeName: string;
    fieldKey: string;
    fieldLabel?: string;
  };
}

/**
 * Filtra outputs compatíveis com um input específico
 */
export function getCompatibleOutputs(
  inputField: InputField,
  parentNodes: Array<{
    id: string;
    name: string;
    outputs: OutputField[];
  }>
): Array<{
  nodeId: string;
  nodeName: string;
  field: OutputField;
}> {
  const compatible: Array<{
    nodeId: string;
    nodeName: string;
    field: OutputField;
  }> = [];
  
  for (const node of parentNodes) {
    for (const output of node.outputs) {
      if (areTypesCompatible(output.type, inputField.type)) {
        compatible.push({
          nodeId: node.id,
          nodeName: node.name,
          field: output,
        });
      }
    }
  }
  
  return compatible;
}

/**
 * Extrai outputs de um node baseado no seu tipo/toolId
 */
export function extractNodeOutputs(node: any): OutputField[] {
  const toolId = node.data?.toolId || node.type;
  
  // Manual Trigger
  if (toolId === 'manual-trigger') {
    return [
      { key: 'triggered', type: 'boolean', label: 'Disparado', description: 'Se o trigger foi acionado' },
      { key: 'triggerTime', type: 'string', label: 'Horário', description: 'Timestamp do disparo' },
      { key: 'triggerMessage', type: 'string', label: 'Mensagem', description: 'Mensagem configurada' },
      { key: 'data', type: 'object', label: 'Dados', description: 'Dados iniciais' },
      { key: 'metadata', type: 'object', label: 'Metadata', description: 'Informações adicionais' },
    ];
  }
  
  // Cron Trigger
  if (toolId === 'cron-trigger') {
    return [
      { key: 'triggered', type: 'boolean', label: 'Disparado', description: 'Se o trigger foi acionado' },
      { key: 'taskId', type: 'string', label: 'ID da Tarefa', description: 'Identificador único' },
      { key: 'cronExpression', type: 'string', label: 'Expressão Cron', description: 'Agendamento configurado' },
      { key: 'scheduledAt', type: 'string', label: 'Agendado em', description: 'Timestamp do agendamento' },
      { key: 'status', type: 'string', label: 'Status', description: 'scheduled ou disabled' },
    ];
  }
  
  // Webhook Trigger
  if (toolId === 'webhook-trigger') {
    return [
      { key: 'triggered', type: 'boolean', label: 'Disparado', description: 'Se o webhook foi acionado' },
      { key: 'webhookUrl', type: 'string', label: 'URL do Webhook', description: 'URL completa' },
      { key: 'webhookId', type: 'string', label: 'ID do Webhook', description: 'Identificador único' },
      { key: 'method', type: 'string', label: 'Método HTTP', description: 'GET, POST, etc' },
      { key: 'headers', type: 'object', label: 'Headers', description: 'Headers da requisição' },
      { key: 'body', type: 'object', label: 'Body', description: 'Corpo da requisição' },
      { key: 'query', type: 'object', label: 'Query Params', description: 'Parâmetros da URL' },
    ];
  }
  
  // Node genérico - tentar extrair do config
  if (node.data?.config?.outputKeys) {
    return node.data.config.outputKeys;
  }
  
  // Fallback: outputs padrão
  return [
    { key: 'result', type: 'object', label: 'Resultado', description: 'Resultado da execução' },
    { key: 'success', type: 'boolean', label: 'Sucesso', description: 'Se executou com sucesso' },
  ];
}

/**
 * Extrai inputs de um node baseado no seu tipo/toolId
 */
export function extractNodeInputs(node: any): InputField[] {
  const toolId = node.data?.toolId || node.type;
  
  // Manual Trigger
  if (toolId === 'manual-trigger') {
    return [
      { 
        key: 'triggerMessage', 
        type: 'string', 
        label: 'Mensagem de Disparo', 
        description: 'Mensagem opcional',
        required: false,
      },
      { 
        key: 'initialData', 
        type: 'object', 
        label: 'Dados Iniciais', 
        description: 'Dados a serem passados',
        required: false,
      },
      { 
        key: 'debugMode', 
        type: 'boolean', 
        label: 'Modo Debug', 
        description: 'Ativa logs detalhados',
        required: false,
      },
    ];
  }
  
  // Cron Trigger
  if (toolId === 'cron-trigger') {
    return [
      { 
        key: 'cronExpression', 
        type: 'string', 
        label: 'Expressão Cron', 
        description: 'Ex: */5 * * * *',
        required: true,
      },
      { 
        key: 'timezone', 
        type: 'string', 
        label: 'Timezone', 
        description: 'Ex: America/Sao_Paulo',
        required: false,
      },
      { 
        key: 'enabled', 
        type: 'boolean', 
        label: 'Ativo', 
        description: 'Ativa ou desativa',
        required: false,
      },
      { 
        key: 'triggerData', 
        type: 'object', 
        label: 'Dados do Trigger', 
        description: 'Dados por execução',
        required: false,
      },
      { 
        key: 'maxExecutions', 
        type: 'number', 
        label: 'Máximo de Execuções', 
        description: '0 = ilimitado',
        required: false,
      },
    ];
  }
  
  // Webhook Trigger
  if (toolId === 'webhook-trigger') {
    return [
      { 
        key: 'webhookPath', 
        type: 'string', 
        label: 'Caminho do Webhook', 
        description: 'Ex: /my-webhook',
        required: false,
      },
      { 
        key: 'httpMethod', 
        type: 'string', 
        label: 'Método HTTP', 
        description: 'GET, POST, etc',
        required: false,
      },
      { 
        key: 'requireAuth', 
        type: 'boolean', 
        label: 'Requer Autenticação', 
        description: 'Token secreto',
        required: false,
      },
      { 
        key: 'rateLimit', 
        type: 'number', 
        label: 'Rate Limit', 
        description: 'Requisições/minuto',
        required: false,
      },
    ];
  }
  
  // Node genérico
  if (node.data?.config?.inputKeys) {
    return node.data.config.inputKeys;
  }
  
  // Fallback
  return [];
}

/**
 * Formata valor para exibição amigável
 */
export function formatValueForDisplay(value: any, type: FieldType): string {
  if (value === null || value === undefined) {
    return 'não definido';
  }
  
  switch (type) {
    case 'boolean':
      return value ? 'Sim' : 'Não';
    case 'number':
      return value.toString();
    case 'string':
      return value;
    case 'array':
      return `Array (${value.length} itens)`;
    case 'object':
    case 'json':
      return 'Objeto';
    case 'file':
      return 'Arquivo';
    default:
      return String(value);
  }
}

/**
 * Ícone por tipo de campo
 */
export function getTypeIcon(type: FieldType): string {
  switch (type) {
    case 'string': return '📝';
    case 'number': return '🔢';
    case 'boolean': return '✓';
    case 'object': return '📦';
    case 'array': return '📋';
    case 'json': return '{}';
    case 'file': return '📁';
    default: return '❓';
  }
}

/**
 * Cor por tipo de campo
 */
export function getTypeColor(type: FieldType): string {
  switch (type) {
    case 'string': return '#3b82f6'; // Azul
    case 'number': return '#10b981'; // Verde
    case 'boolean': return '#f59e0b'; // Laranja
    case 'object': return '#8b5cf6'; // Roxo
    case 'array': return '#ec4899'; // Rosa
    case 'json': return '#6366f1'; // Índigo
    case 'file': return '#14b8a6'; // Teal
    default: return '#6b7280'; // Cinza
  }
}
