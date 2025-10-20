import Conf from 'conf';
import { Config, Agent, MCP, Session, Automation } from '../types/index.js';

// Configuração do Conf para persistência
const config = new Conf({
  projectName: 'flui',
  schema: {
    config: {
      type: 'object',
      properties: {
        llm: {
          type: 'object',
          properties: {
            endpoint: { type: 'string' },
            apiKey: { type: 'string' },
            model: { type: 'string' },
            temperature: { type: 'number' },
            maxTokens: { type: 'number' },
          },
        },
        theme: { type: 'string' },
        locale: { type: 'string' },
      },
    },
    agents: { type: 'array' },
    mcps: { type: 'array' },
    sessions: { type: 'array' },
    automations: { type: 'array' },
    activeSessionId: { type: 'string' },
  },
});

// ============= CONFIG =============
export const getConfig = (): Config | null => {
  return config.get('config') as Config | null;
};

export const setConfig = (newConfig: Partial<Config>): void => {
  const current = getConfig() || {
    llm: {
      endpoint: 'https://api.llm7.io/v1',
      apiKey: '',
      model: 'gpt-4-turbo-preview',
      temperature: 0.7,
      maxTokens: 2000,
    },
    theme: 'default' as const,
    locale: 'pt-BR',
  };
  config.set('config', { ...current, ...newConfig });
};

// ============= AGENTES =============
export const getAgents = (): Agent[] => {
  return (config.get('agents') as Agent[]) || [];
};

export const getAgent = (id: string): Agent | null => {
  const agents = getAgents();
  return agents.find((a) => a.id === id) || null;
};

export const saveAgent = (agent: Agent): void => {
  const agents = getAgents();
  const index = agents.findIndex((a) => a.id === agent.id);
  if (index >= 0) {
    agents[index] = agent;
  } else {
    agents.push(agent);
  }
  config.set('agents', agents);
};

export const deleteAgent = (id: string): void => {
  const agents = getAgents();
  config.set(
    'agents',
    agents.filter((a) => a.id !== id)
  );
};

export const clearAllAgents = (): void => {
  console.log('🗑️  Limpando todos os agentes...');
  config.set('agents', []);
  console.log('✅ Todos os agentes removidos');
};

// ============= MCPs =============
export const getMCPs = (): MCP[] => {
  return (config.get('mcps') as MCP[]) || [];
};

export const getMCP = (id: string): MCP | null => {
  const mcps = getMCPs();
  return mcps.find((m) => m.id === id) || null;
};

export const saveMCP = (mcp: MCP): void => {
  const mcps = getMCPs();
  const index = mcps.findIndex((m) => m.id === mcp.id);
  if (index >= 0) {
    mcps[index] = mcp;
  } else {
    mcps.push(mcp);
  }
  config.set('mcps', mcps);
};

export const deleteMCP = (id: string): void => {
  const mcps = getMCPs();
  config.set(
    'mcps',
    mcps.filter((m) => m.id !== id)
  );
};

export const clearAllMCPs = (): void => {
  console.log('🗑️  Limpando todos os MCPs...');
  config.set('mcps', []);
  console.log('✅ Todos os MCPs removidos');
};

// ============= SESSÕES =============
export const getSessions = (): Session[] => {
  return (config.get('sessions') as Session[]) || [];
};

export const getSession = (id: string): Session | null => {
  const sessions = getSessions();
  return sessions.find((s) => s.id === id) || null;
};

export const saveSession = (session: Session): void => {
  const sessions = getSessions();
  const index = sessions.findIndex((s) => s.id === session.id);
  if (index >= 0) {
    sessions[index] = session;
  } else {
    sessions.push(session);
  }
  config.set('sessions', sessions);
};

export const deleteSession = (id: string): void => {
  const sessions = getSessions();
  config.set(
    'sessions',
    sessions.filter((s) => s.id !== id)
  );
};

export const getActiveSessionId = (): string | null => {
  return (config.get('activeSessionId') as string) || null;
};

export const setActiveSessionId = (id: string): void => {
  config.set('activeSessionId', id);
};

// ============= AUTOMAÇÕES =============
export const getAutomations = (): Automation[] => {
  return (config.get('automations') as Automation[]) || [];
};

export const getAutomation = (id: string): Automation | null => {
  const automations = getAutomations();
  return automations.find((a) => a.id === id) || null;
};

export const saveAutomation = (automation: Automation): void => {
  const automations = getAutomations();
  const index = automations.findIndex((a) => a.id === automation.id);
  if (index >= 0) {
    automations[index] = automation;
  } else {
    automations.push(automation);
  }
  config.set('automations', automations);
};

export const deleteAutomation = (id: string): void => {
  const automations = getAutomations();
  config.set(
    'automations',
    automations.filter((a) => a.id !== id)
  );
};

// ============= UTILITY =============
export const clearAllData = (): void => {
  config.clear();
};
