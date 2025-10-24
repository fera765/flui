"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useStore = void 0;
var zustand_1 = require("zustand");
var id_js_1 = require("../utils/id.js");
var storage = require("./storage.js");
exports.useStore = (0, zustand_1.create)(function (set, get) { return ({
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
    setView: function (view) { return set({ currentView: view }); },
    // Config
    loadConfig: function () {
        var config = storage.getConfig();
        if (config) {
            set({ config: config, theme: config.theme });
        }
    },
    updateConfig: function (newConfig) {
        var current = get().config;
        var updated = __assign(__assign({}, current), newConfig);
        storage.setConfig(updated);
        set({ config: updated });
        if (newConfig.theme) {
            set({ theme: newConfig.theme });
        }
    },
    // Theme
    setTheme: function (theme) {
        set({ theme: theme });
        get().updateConfig({ theme: theme });
    },
    // Sessions
    loadSessions: function () {
        var sessions = storage.getSessions();
        var activeId = storage.getActiveSessionId();
        var currentSession = activeId ? storage.getSession(activeId) : null;
        set({
            sessions: sessions,
            currentSession: currentSession,
            messages: (currentSession === null || currentSession === void 0 ? void 0 : currentSession.messages) || [],
        });
    },
    createSession: function (name) {
        var session = {
            id: (0, id_js_1.generateId)(),
            name: name,
            messages: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        storage.saveSession(session);
        storage.setActiveSessionId(session.id);
        set({
            currentSession: session,
            messages: [],
            sessions: __spreadArray(__spreadArray([], get().sessions, true), [session], false),
        });
    },
    switchSession: function (id) {
        // Limpar mensagens antigas PRIMEIRO
        set({ messages: [] });
        var session = storage.getSession(id);
        if (session) {
            storage.setActiveSessionId(id);
            set({
                currentSession: session,
                messages: session.messages || [],
            });
        }
    },
    deleteSession: function (id) {
        var _a;
        storage.deleteSession(id);
        var sessions = storage.getSessions();
        set({ sessions: sessions });
        if (((_a = get().currentSession) === null || _a === void 0 ? void 0 : _a.id) === id) {
            var newSession = sessions[0] || null;
            set({
                currentSession: newSession,
                messages: (newSession === null || newSession === void 0 ? void 0 : newSession.messages) || [],
            });
            if (newSession) {
                storage.setActiveSessionId(newSession.id);
            }
        }
    },
    // Messages
    addMessage: function (message) {
        var newMessage = __assign(__assign({}, message), { id: (0, id_js_1.generateId)(), timestamp: new Date().toISOString() });
        var currentSession = get().currentSession;
        if (currentSession) {
            var updatedMessages = __spreadArray(__spreadArray([], currentSession.messages, true), [newMessage], false);
            var updatedSession = __assign(__assign({}, currentSession), { messages: updatedMessages, updatedAt: new Date().toISOString() });
            storage.saveSession(updatedSession);
            set({
                messages: updatedMessages,
                currentSession: updatedSession,
            });
        }
    },
    updateMessage: function (id, updates) {
        var currentSession = get().currentSession;
        if (currentSession) {
            var updatedMessages = currentSession.messages.map(function (msg) {
                return msg.id === id ? __assign(__assign({}, msg), updates) : msg;
            });
            var updatedSession = __assign(__assign({}, currentSession), { messages: updatedMessages, updatedAt: new Date().toISOString() });
            storage.saveSession(updatedSession);
            set({
                messages: updatedMessages,
                currentSession: updatedSession,
            });
        }
    },
    // Agents
    loadAgents: function () {
        var agents = storage.getAgents();
        console.log("\uD83D\uDCCB [Store] loadAgents() - ".concat(agents.length, " agentes carregados"));
        set({ agents: agents });
    },
    createAgent: function (agent) {
        var newAgent = __assign(__assign({}, agent), { id: agent.id || (0, id_js_1.generateId)(), createdAt: agent.createdAt || new Date().toISOString(), updatedAt: agent.updatedAt || new Date().toISOString() });
        storage.saveAgent(newAgent);
        set({ agents: __spreadArray(__spreadArray([], get().agents, true), [newAgent], false) });
    },
    updateAgent: function (id, updates) {
        var agent = get().agents.find(function (a) { return a.id === id; });
        if (agent) {
            var updatedAgent_1 = __assign(__assign(__assign({}, agent), updates), { updatedAt: new Date().toISOString() });
            storage.saveAgent(updatedAgent_1);
            set({
                agents: get().agents.map(function (a) { return (a.id === id ? updatedAgent_1 : a); }),
            });
        }
    },
    deleteAgent: function (id) {
        storage.deleteAgent(id);
        set({ agents: get().agents.filter(function (a) { return a.id !== id; }) });
    },
    getAgentById: function (id) {
        return get().agents.find(function (a) { return a.id === id; });
    },
    // MCPs
    loadMCPs: function () {
        var mcps = storage.getMCPs();
        console.log("\uD83D\uDCCB [Store] loadMCPs() - ".concat(mcps.length, " MCPs carregados"));
        set({ mcps: mcps });
    },
    createMCP: function (mcp) {
        var newMCP = __assign(__assign({}, mcp), { 
            // Usar ID fornecido se existir, senão gerar novo
            id: mcp.id || (0, id_js_1.generateId)() });
        storage.saveMCP(newMCP);
        set({ mcps: __spreadArray(__spreadArray([], get().mcps, true), [newMCP], false) });
        return newMCP; // Retornar o MCP criado
    },
    updateMCP: function (id, updates) {
        var mcp = get().mcps.find(function (m) { return m.id === id; });
        if (mcp) {
            var updatedMCP_1 = __assign(__assign({}, mcp), updates);
            storage.saveMCP(updatedMCP_1);
            set({
                mcps: get().mcps.map(function (m) { return (m.id === id ? updatedMCP_1 : m); }),
            });
        }
    },
    deleteMCP: function (id) {
        storage.deleteMCP(id);
        set({ mcps: get().mcps.filter(function (m) { return m.id !== id; }) });
    },
    // Input
    setInput: function (input) { return set({ input: input }); },
    // Command suggestions
    setShowCommandSuggestions: function (show) { return set({ showCommandSuggestions: show }); },
    setCommandFilter: function (filter) { return set({ commandFilter: filter }); },
    // Agent mentions
    setShowAgentMentions: function (show) { return set({ showAgentMentions: show }); },
    setMentionFilter: function (filter) { return set({ mentionFilter: filter }); },
    setSelectedAgent: function (agent) { return set({ selectedAgent: agent }); },
    // Initialization
    initialize: function () {
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
}); });
