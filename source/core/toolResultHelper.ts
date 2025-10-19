/**
 * FLUI - Tool Result Helper
 * 
 * Utilitários para garantir que todos os nodes retornem outputs padronizados
 * Padrão consistente de saída para todos os tools
 */

import { ToolResult } from './types.js';

/**
 * Cria um resultado de sucesso padronizado
 */
export function createSuccessResult(
  result: any,
  metadata?: Record<string, any>,
  executionTime?: number
): ToolResult {
  return {
    success: true,
    result,
    metadata: metadata || {},
    executionTime,
  };
}

/**
 * Cria um resultado de erro padronizado
 */
export function createErrorResult(
  error: string | Error,
  metadata?: Record<string, any>,
  executionTime?: number
): ToolResult {
  const errorMessage = error instanceof Error ? error.message : error;
  
  return {
    success: false,
    error: errorMessage,
    metadata: metadata || {},
    executionTime,
  };
}

/**
 * Wrapper para execução de tool com tratamento de erros e tempo
 */
export async function executeWithStandardOutput<T>(
  fn: () => Promise<T>,
  metadata?: Record<string, any>
): Promise<ToolResult> {
  const startTime = Date.now();
  
  try {
    const result = await fn();
    const executionTime = Date.now() - startTime;
    
    return createSuccessResult(result, metadata, executionTime);
  } catch (error: any) {
    const executionTime = Date.now() - startTime;
    
    return createErrorResult(error, {
      ...metadata,
      stack: error.stack,
    }, executionTime);
  }
}

/**
 * Valida se um resultado está no formato padrão
 */
export function isValidToolResult(result: any): result is ToolResult {
  return (
    result &&
    typeof result === 'object' &&
    typeof result.success === 'boolean' &&
    (result.success === false ? typeof result.error === 'string' : true)
  );
}

/**
 * Normaliza um resultado para o formato padrão
 * Se já estiver no formato correto, retorna como está
 * Caso contrário, encapsula no formato padrão
 */
export function normalizeToolResult(result: any): ToolResult {
  // Se já está no formato padrão, retornar como está
  if (isValidToolResult(result)) {
    return result;
  }
  
  // Se é um erro, encapsular
  if (result instanceof Error) {
    return createErrorResult(result);
  }
  
  // Se é um objeto com 'error', considerar como erro
  if (result && typeof result === 'object' && 'error' in result) {
    return createErrorResult(result.error);
  }
  
  // Caso contrário, considerar como sucesso
  return createSuccessResult(result);
}

/**
 * Extrai o resultado útil de um ToolResult
 * Útil quando você só quer o dado, não o wrapper
 */
export function unwrapToolResult<T = any>(result: ToolResult): T {
  if (!result.success) {
    throw new Error(result.error || 'Execution failed');
  }
  
  return result.result as T;
}

/**
 * Combina múltiplos resultados de tools
 */
export function combineToolResults(results: ToolResult[]): ToolResult {
  const allSuccess = results.every(r => r.success);
  const errors = results.filter(r => !r.success).map(r => r.error).filter(Boolean);
  
  const totalExecutionTime = results.reduce(
    (sum, r) => sum + (r.executionTime || 0),
    0
  );
  
  if (allSuccess) {
    return createSuccessResult(
      results.map(r => r.result),
      {
        count: results.length,
        individual: results,
      },
      totalExecutionTime
    );
  }
  
  return createErrorResult(
    errors.join('; '),
    {
      count: results.length,
      successCount: results.filter(r => r.success).length,
      failureCount: errors.length,
      individual: results,
    },
    totalExecutionTime
  );
}

/**
 * Adiciona metadata a um resultado existente
 */
export function enrichToolResult(
  result: ToolResult,
  metadata: Record<string, any>
): ToolResult {
  return {
    ...result,
    metadata: {
      ...result.metadata,
      ...metadata,
    },
  };
}

/**
 * Wrapper para funções síncronas
 */
export async function executeSync<T>(
  fn: () => T,
  metadata?: Record<string, any>
): Promise<ToolResult> {
  return executeWithStandardOutput(async () => fn(), metadata);
}

/**
 * Formata um ToolResult para log/debug
 */
export function formatToolResult(result: ToolResult): string {
  const status = result.success ? '✅ SUCCESS' : '❌ ERROR';
  const time = result.executionTime ? ` (${result.executionTime}ms)` : '';
  
  let output = `${status}${time}\n`;
  
  if (result.success) {
    output += `Result: ${JSON.stringify(result.result, null, 2)}\n`;
  } else {
    output += `Error: ${result.error}\n`;
  }
  
  if (result.metadata && Object.keys(result.metadata).length > 0) {
    output += `Metadata: ${JSON.stringify(result.metadata, null, 2)}\n`;
  }
  
  return output;
}
