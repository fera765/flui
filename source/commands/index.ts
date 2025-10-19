/**
 * FLUI Commands
 * Export all CLI commands
 */

// Custom node commands
export { createNode } from './createNode.js';
export { uploadNode } from './uploadNode.js';

// Available commands definition
const AVAILABLE_COMMANDS = [
  { name: 'create-node', description: 'Create a new custom node' },
  { name: 'upload-node', description: 'Upload a custom node to the server' },
  { name: 'help', description: 'Show available commands' },
  { name: 'clear', description: 'Clear the chat history' },
  { name: 'settings', description: 'Open settings' },
  { name: 'agents', description: 'Manage agents' },
  { name: 'automations', description: 'Manage automations' },
  { name: 'mcps', description: 'Manage MCP servers' },
  { name: 'sessions', description: 'Manage sessions' },
  { name: 'theme', description: 'Change theme' },
];

// Legacy stubs for old components (to be refactored)
export async function executeCommand(_command: string): Promise<string> {
  return '';
}

export function getCommands(): Array<{ name: string; description: string }> {
  return AVAILABLE_COMMANDS;
}
