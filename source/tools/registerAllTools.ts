/**
 * Register all available tools
 * This will register default tools + system tools + custom nodes + MCP tools
 */

import { getToolRegistry } from '../core/toolRegistry.js';
import { registerSystemTools } from './system/index.js';
import { manualTrigger } from './triggers/manualTrigger.js';
import { cronTrigger } from './triggers/cronTrigger.js';
import { webhookTrigger } from './triggers/webhookTrigger.js';
import { conditionFlexTool } from './conditionFlexTool.js';

/**
 * Initialize and register all tools
 */
export async function initializeTools(): Promise<void> {
  const registry = getToolRegistry();

  // Register triggers
  registry.register(manualTrigger);
  registry.register(cronTrigger);
  registry.register(webhookTrigger);

  // Register control flow
  registry.register(conditionFlexTool);

  // Register system tools
  const systemTools = registerSystemTools();
  systemTools.forEach(tool => {
    registry.register(tool as any);
  });

  console.log(`✅ ${registry.count()} tools registered (including ${systemTools.length} system tools)`);

  // MCP tools and custom nodes are registered dynamically
  // when they are loaded/imported
}

/**
 * Register all tools (alias for initializeTools)
 */
export async function registerAllTools(): Promise<void> {
  return initializeTools();
}
