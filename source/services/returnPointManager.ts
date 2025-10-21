/**
 * FLUI - Return Point Manager
 * 
 * Gerencia pontos de retorno em automações
 * Permite que um node retorne seu valor para um node anterior
 */

export interface ReturnPoint {
  fromNodeId: string; // Node que retorna
  toNodeId: string;   // Node que recebe o retorno
  returnValue?: any;  // Valor retornado
}

export class ReturnPointManager {
  private returnPoints: Map<string, ReturnPoint[]> = new Map();
  private executionStack: string[] = [];

  /**
   * Registra um ponto de retorno
   */
  registerReturnPoint(executionId: string, returnPoint: ReturnPoint): void {
    if (!this.returnPoints.has(executionId)) {
      this.returnPoints.set(executionId, []);
    }
    
    const points = this.returnPoints.get(executionId)!;
    points.push(returnPoint);
    
    console.log(`🔄 [ReturnPoint] Registrado: ${returnPoint.fromNodeId} → ${returnPoint.toNodeId}`);
  }

  /**
   * Verifica se um node tem ponto de retorno
   */
  hasReturnPoint(executionId: string, nodeId: string): boolean {
    const points = this.returnPoints.get(executionId) || [];
    return points.some(p => p.fromNodeId === nodeId);
  }

  /**
   * Obtém o ponto de retorno de um node
   */
  getReturnPoint(executionId: string, nodeId: string): ReturnPoint | undefined {
    const points = this.returnPoints.get(executionId) || [];
    return points.find(p => p.fromNodeId === nodeId);
  }

  /**
   * Define o valor de retorno
   */
  setReturnValue(executionId: string, nodeId: string, value: any): void {
    const points = this.returnPoints.get(executionId) || [];
    const point = points.find(p => p.fromNodeId === nodeId);
    
    if (point) {
      point.returnValue = value;
      console.log(`✅ [ReturnPoint] Valor definido para ${nodeId}:`, value);
    }
  }

  /**
   * Executa o fluxo de retorno
   * Retorna true se deve continuar fluxo normal, false se deve parar
   */
  async executeReturn(
    executionId: string,
    nodeId: string,
    nodeResult: any,
    onReturn?: (toNodeId: string, returnValue: any) => Promise<void>
  ): Promise<{ shouldContinue: boolean; nextNodeId?: string }> {
    const returnPoint = this.getReturnPoint(executionId, nodeId);
    
    if (!returnPoint) {
      // Sem ponto de retorno, continuar fluxo normal
      return { shouldContinue: true };
    }

    // Definir valor de retorno
    this.setReturnValue(executionId, nodeId, nodeResult);

    // Notificar retorno
    if (onReturn) {
      await onReturn(returnPoint.toNodeId, nodeResult);
    }

    console.log(`🔙 [ReturnPoint] Retornando de ${nodeId} para ${returnPoint.toNodeId}`);

    // Retornar para o node de destino
    return {
      shouldContinue: true,
      nextNodeId: returnPoint.toNodeId,
    };
  }

  /**
   * Push node na pilha de execução
   */
  pushExecutionStack(nodeId: string): void {
    this.executionStack.push(nodeId);
  }

  /**
   * Pop node da pilha de execução
   */
  popExecutionStack(): string | undefined {
    return this.executionStack.pop();
  }

  /**
   * Obtém a pilha de execução atual
   */
  getExecutionStack(): string[] {
    return [...this.executionStack];
  }

  /**
   * Limpa pontos de retorno de uma execução
   */
  clearExecution(executionId: string): void {
    this.returnPoints.delete(executionId);
    this.executionStack = [];
    console.log(`🧹 [ReturnPoint] Pontos de retorno limpos para ${executionId}`);
  }

  /**
   * Lista todos os pontos de retorno de uma execução
   */
  listReturnPoints(executionId: string): ReturnPoint[] {
    return this.returnPoints.get(executionId) || [];
  }
}

// Instância global
let globalReturnPointManager: ReturnPointManager | null = null;

export function getReturnPointManager(): ReturnPointManager {
  if (!globalReturnPointManager) {
    globalReturnPointManager = new ReturnPointManager();
  }
  return globalReturnPointManager;
}
