import { create } from 'zustand';
import { generateId } from '../utils/id.js';
import { Agent, Message, MCP, Session, View, Theme, Config } from '../types/index.js';
import * as storage from './storage.js';

interface AppState {
  // View management
  currentView: View;
  setView: (view: View) => void;

  // Config
  config: Config | null;
  loadConfig: () => void;
  updateConfig: (config: Partial<Config>) => void;

  // Theme
  theme: Theme;
  setTheme: (theme: Theme) => void;

  // Session management
  currentSession: Session | null;
  sessions: Session[];
  loadSessions: () => void;
  createSession: (name: string) => void;
  switchSession: (id: string) => void;
  deleteSession: (id: string) => void;

  // Messages
  messages: Message[];
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void;
  updateMessage: (id: string, updates: Partial<Message>) => void;

  // Agents
  agents: Agent[];
  loadAgents: () => void;
  createAgent: (agent: Omit<Agent, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateAgent: (id: string, updates: Partial<Agent>) => void;
  deleteAgent: (id: string) => void;
  getAgentById: (id: string) => Agent | undefined;

  // MCPs
  mcps: MCP[];
  loadMCPs: () => void;
  createMCP: (mcp: Omit<MCP, 'id'> | MCP) => MCP;
  updateMCP: (id: string, updates: Partial<MCP>) => void;
  deleteMCP: (id: string) => void;

  // Input
  input: string;
  setInput: (input: string) => void;

  // Command suggestions
  showCommandSuggestions: boolean;
  setShowCommandSuggestions: (show: boolean) => void;
  commandFilter: string;
  setCommandFilter: (filter: string) => void;

  // Agent mentions
  showAgentMentions: boolean;
  setShowAgentMentions: (show: boolean) => void;
  mentionFilter: string;
  setMentionFilter: (filter: string) => void;
  selectedAgent: Agent | null;
  setSelectedAgent: (agent: Agent | null) => void;

  // Initialization
  initialize: () => void;
}

export const useStore = create<AppState>((set, get) => ({
  // Initial state
  currentView: 'chat',
  config: null,
  theme: 'default',
  currentSession: null,
  sessions: [],
  messages: [],
  agents: [],
  mcps: [],
  input: '',
  showCommandSuggestions: false,
  commandFilter: '',
  showAgentMentions: false,
  mentionFilter: '',
  selectedAgent: null,

  // View management
  setView: (view) => set({ currentView: view }),

  // Config
  loadConfig: () => {
    const config = storage.getConfig();
    if (config) {
      set({ config, theme: config.theme });
    }
  },

  updateConfig: (newConfig) => {
    const current = get().config;
    const updated = { ...current, ...newConfig } as Config;
    storage.setConfig(updated);
    set({ config: updated });
    if (newConfig.theme) {
      set({ theme: newConfig.theme });
    }
  },

  // Theme
  setTheme: (theme) => {
    set({ theme });
    get().updateConfig({ theme });
  },

  // Sessions
  loadSessions: () => {
    const sessions = storage.getSessions();
    const activeId = storage.getActiveSessionId();
    const currentSession = activeId ? storage.getSession(activeId) : null;
    set({
      sessions,
      currentSession,
      messages: currentSession?.messages || [],
    });
  },

  createSession: (name) => {
    const session: Session = {
      id: generateId(),
      name,
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    storage.saveSession(session);
    storage.setActiveSessionId(session.id);
    set({
      currentSession: session,
      messages: [],
      sessions: [...get().sessions, session],
    });
  },

  switchSession: (id) => {
    // Limpar mensagens antigas PRIMEIRO
    set({ messages: [] });
    
    const session = storage.getSession(id);
    if (session) {
      storage.setActiveSessionId(id);
      set({
        currentSession: session,
        messages: session.messages || [],
      });
    }
  },

  deleteSession: (id) => {
    storage.deleteSession(id);
    const sessions = storage.getSessions();
    set({ sessions });
    if (get().currentSession?.id === id) {
      const newSession = sessions[0] || null;
      set({
        currentSession: newSession,
        messages: newSession?.messages || [],
      });
      if (newSession) {
        storage.setActiveSessionId(newSession.id);
      }
    }
  },

  // Messages
  addMessage: (message) => {
    const newMessage: Message = {
      ...message,
      id: generateId(),
      timestamp: new Date().toISOString(),
    };

    const currentSession = get().currentSession;
    if (currentSession) {
      const updatedMessages = [...currentSession.messages, newMessage];
      const updatedSession = {
        ...currentSession,
        messages: updatedMessages,
        updatedAt: new Date().toISOString(),
      };
      storage.saveSession(updatedSession);
      set({
        messages: updatedMessages,
        currentSession: updatedSession,
      });
    }
  },

  updateMessage: (id, updates) => {
    const currentSession = get().currentSession;
    if (currentSession) {
      const updatedMessages = currentSession.messages.map((msg) =>
        msg.id === id ? { ...msg, ...updates } : msg
      );
      const updatedSession = {
        ...currentSession,
        messages: updatedMessages,
        updatedAt: new Date().toISOString(),
      };
      storage.saveSession(updatedSession);
      set({
        messages: updatedMessages,
        currentSession: updatedSession,
      });
    }
  },

  // Agents
  loadAgents: () => {
    const agents = storage.getAgents();
    console.log(`📋 [Store] loadAgents() - ${agents.length} agentes carregados`);
    set({ agents });
  },

  createAgent: (agent) => {
    const newAgent: Agent = {
      ...agent,
      id: (agent as any).id || generateId(), // Respect provided ID if exists
      createdAt: (agent as any).createdAt || new Date().toISOString(),
      updatedAt: (agent as any).updatedAt || new Date().toISOString(),
    };
    storage.saveAgent(newAgent);
    set({ agents: [...get().agents, newAgent] });
  },

  updateAgent: (id, updates) => {
    const agent = get().agents.find((a) => a.id === id);
    if (agent) {
      const updatedAgent = {
        ...agent,
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      storage.saveAgent(updatedAgent);
      set({
        agents: get().agents.map((a) => (a.id === id ? updatedAgent : a)),
      });
    }
  },

  deleteAgent: (id) => {
    storage.deleteAgent(id);
    set({ agents: get().agents.filter((a) => a.id !== id) });
  },

  getAgentById: (id) => {
    return get().agents.find((a) => a.id === id);
  },

  // MCPs
  loadMCPs: () => {
    const mcps = storage.getMCPs();
    console.log(`📋 [Store] loadMCPs() - ${mcps.length} MCPs carregados`);
    set({ mcps });
  },

  createMCP: (mcp) => {
    const newMCP: MCP = {
      ...mcp,
      // Usar ID fornecido se existir, senão gerar novo
      id: (mcp as any).id || generateId(),
    };
    storage.saveMCP(newMCP);
    set({ mcps: [...get().mcps, newMCP] });
    return newMCP; // Retornar o MCP criado
  },

  updateMCP: (id, updates) => {
    const mcp = get().mcps.find((m) => m.id === id);
    if (mcp) {
      const updatedMCP = { ...mcp, ...updates };
      storage.saveMCP(updatedMCP);
      set({
        mcps: get().mcps.map((m) => (m.id === id ? updatedMCP : m)),
      });
    }
  },

  deleteMCP: (id) => {
    storage.deleteMCP(id);
    set({ mcps: get().mcps.filter((m) => m.id !== id) });
  },

  // Input
  setInput: (input) => set({ input }),

  // Command suggestions
  setShowCommandSuggestions: (show) => set({ showCommandSuggestions: show }),
  setCommandFilter: (filter) => set({ commandFilter: filter }),

  // Agent mentions
  setShowAgentMentions: (show) => set({ showAgentMentions: show }),
  setMentionFilter: (filter) => set({ mentionFilter: filter }),
  setSelectedAgent: (agent) => set({ selectedAgent: agent }),

  // Initialization
  initialize: () => {
    get().loadConfig();
    get().loadSessions();
    get().loadAgents();
    get().loadMCPs();

    // Create default session if none exists
    if (get().sessions.length === 0) {
      get().createSession('Nova Sessão');
    }

    // Create default config if none exists
    if (!get().config) {
      get().updateConfig({
        llm: {
          endpoint: 'https://api.llm7.io/v1',
          apiKey: '',
          model: 'gpt-4-turbo-preview',
          temperature: 0.7,
          maxTokens: 2000,
        },
        theme: 'default',
        locale: 'pt-BR',
      });
    }
  },
}));
