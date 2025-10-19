/**
 * FLUI - Tools Index
 * 
 * Exporta e registra todas as ferramentas disponíveis
 */

import { Tool } from '../core/types.js';
import { getToolRegistry } from '../core/toolRegistry.js';

// System Tools
import { ShellExecutorTool } from './system/shellExecutor.js';
import {
  FileReadTool,
  FileWriteTool,
  FileEditTool,
  FileSearchTool,
  TextSearchTool,
} from './system/fileOperations.js';
import { HTTPRequestTool } from './system/httpRequest.js';
import { SystemInfoTool } from './system/systemInfo.js';
import { ConditionTool } from './system/condition.js';
import { DelayTool } from './system/delay.js';
import {
  DataTransformTool,
  DataFilterTool,
  DataMergeTool,
} from './system/dataTransform.js';

// Agent Tools
import { AgentExecutorTool } from './agent/agentExecutor.js';

// Custom Tools
import { CustomCodeTool } from './custom/customCode.js';

/**
 * Lista de todas as ferramentas built-in do sistema
 */
export const ALL_TOOLS: Tool[] = [
  // System & Control Flow
  ShellExecutorTool,
  FileReadTool,
  FileWriteTool,
  FileEditTool,
  FileSearchTool,
  TextSearchTool,
  HTTPRequestTool,
  SystemInfoTool,
  ConditionTool,
  DelayTool,
  
  // Data Transformation
  DataTransformTool,
  DataFilterTool,
  DataMergeTool,
  
  // Agent
  AgentExecutorTool,
  
  // Custom
  CustomCodeTool,
];

/**
 * Registra todas as ferramentas built-in no registry
 */
export function registerAllTools(): void {
  const registry = getToolRegistry();
  
  for (const tool of ALL_TOOLS) {
    try {
      registry.register(tool);
      console.log(`✅ Tool registrada: ${tool.name} (${tool.id})`);
    } catch (error: any) {
      console.error(`❌ Erro ao registrar tool '${tool.id}': ${error.message}`);
    }
  }
  
  console.log(`\n📦 Total de ferramentas registradas: ${registry.count()}`);
}

/**
 * Exportações individuais para uso direto
 */
export {
  // System & Control Flow
  ShellExecutorTool,
  FileReadTool,
  FileWriteTool,
  FileEditTool,
  FileSearchTool,
  TextSearchTool,
  HTTPRequestTool,
  SystemInfoTool,
  ConditionTool,
  DelayTool,
  
  // Data Transformation
  DataTransformTool,
  DataFilterTool,
  DataMergeTool,
  
  // Agent
  AgentExecutorTool,
  
  // Custom
  CustomCodeTool,
};
