/**
 * FLUI Commands
 * Export all CLI commands
 */

// Custom node commands
export { createNode } from './createNode.js';
export { uploadNode } from './uploadNode.js';

// Legacy stubs for old components (to be refactored)
export async function executeCommand(_command: string): Promise<string> {
  return '';
}

export function getCommands(): Array<{ name: string; description: string }> {
  return [];
}
