import { describe, it, expect } from 'vitest';
import { getCommands } from '../commands/index';
import { getDefaultAgents, getDefaultMCPs } from '../services/defaultData';

describe('Basic Functionality', () => {
  it('should have commands defined', () => {
    const commands = getCommands();
    expect(commands.length).toBeGreaterThan(0);
    expect(commands[0]).toHaveProperty('name');
    expect(commands[0]).toHaveProperty('description');
    expect(commands[0]).toHaveProperty('handler');
  });

  it('should have default agents', () => {
    const agents = getDefaultAgents();
    expect(agents.length).toBeGreaterThan(0);
    expect(agents[0]).toHaveProperty('name');
    expect(agents[0]).toHaveProperty('systemPrompt');
  });

  it('should have default MCPs', () => {
    const mcps = getDefaultMCPs();
    expect(mcps.length).toBeGreaterThan(0);
    expect(mcps[0]).toHaveProperty('name');
    expect(mcps[0]).toHaveProperty('tools');
    expect(mcps[0].tools.length).toBeGreaterThan(0);
  });

  it('should have required MCP tools structure', () => {
    const mcps = getDefaultMCPs();
    const firstTool = mcps[0].tools[0];
    expect(firstTool).toHaveProperty('id');
    expect(firstTool).toHaveProperty('name');
    expect(firstTool).toHaveProperty('description');
    expect(firstTool).toHaveProperty('parameters');
    expect(firstTool).toHaveProperty('handler');
  });
});
