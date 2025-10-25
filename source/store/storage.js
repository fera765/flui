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
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearAllData = exports.deleteAutomation = exports.saveAutomation = exports.getAutomation = exports.getAutomations = exports.setActiveSessionId = exports.getActiveSessionId = exports.deleteSession = exports.saveSession = exports.getSession = exports.getSessions = exports.clearAllMCPs = exports.deleteMCP = exports.saveMCP = exports.getMCP = exports.getMCPs = exports.clearAllAgents = exports.deleteAgent = exports.saveAgent = exports.getAgent = exports.getAgents = exports.setConfig = exports.getConfig = void 0;
var conf_1 = require("conf");
var path_1 = require("path");
// 🎯 STORAGE CENTRALIZADO: workspace/storage/config.json
var STORAGE_PATH = (0, path_1.join)(process.cwd(), 'workspace', 'storage');
var config = new conf_1.default({
    projectName: 'flui',
    cwd: STORAGE_PATH,
    configName: 'config',
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
// 🔧 INICIALIZAR STORAGE SE NÃO EXISTIR
if (!config.get('agents')) {
    config.set('agents', []);
}
if (!config.get('mcps')) {
    config.set('mcps', []);
}
if (!config.get('automations')) {
    config.set('automations', []);
}
if (!config.get('sessions')) {
    config.set('sessions', []);
}
// 🔧 INICIALIZAR CONFIG DEFAULT SE NÃO EXISTIR
if (!config.get('config')) {
    var defaultConfig = {
        llm: {
            endpoint: 'https://api.llm7.io/v1',
            apiKey: '',
            model: 'deepseek-v3.1',
            temperature: 0.7,
            maxTokens: 2000,
        },
        theme: 'default',
        locale: 'pt-BR',
    };
    config.set('config', defaultConfig);
    console.log('✅ [Storage] Config padrão criado com endpoint LLM7');
}
console.log('✅ [Storage] Storage inicializado');
// ============= CONFIG =============
var getConfig = function () {
    return config.get('config');
};
exports.getConfig = getConfig;
var setConfig = function (newConfig) {
    var current = (0, exports.getConfig)() || {
        llm: {
            endpoint: 'https://api.llm7.io/v1',
            apiKey: '',
            model: 'gpt-4-turbo-preview',
            temperature: 0.7,
            maxTokens: 2000,
        },
        theme: 'default',
        locale: 'pt-BR',
    };
    config.set('config', __assign(__assign({}, current), newConfig));
};
exports.setConfig = setConfig;
// ============= AGENTES =============
var getAgents = function () {
    return config.get('agents') || [];
};
exports.getAgents = getAgents;
var getAgent = function (id) {
    var agents = (0, exports.getAgents)();
    return agents.find(function (a) { return a.id === id; }) || null;
};
exports.getAgent = getAgent;
var saveAgent = function (agent) {
    var agents = (0, exports.getAgents)();
    var index = agents.findIndex(function (a) { return a.id === agent.id; });
    if (index >= 0) {
        agents[index] = agent;
    }
    else {
        agents.push(agent);
    }
    config.set('agents', agents);
};
exports.saveAgent = saveAgent;
var deleteAgent = function (id) {
    var agents = (0, exports.getAgents)();
    config.set('agents', agents.filter(function (a) { return a.id !== id; }));
};
exports.deleteAgent = deleteAgent;
var clearAllAgents = function () {
    console.log('🗑️  Limpando todos os agentes...');
    config.set('agents', []);
    console.log('✅ Todos os agentes removidos');
};
exports.clearAllAgents = clearAllAgents;
// ============= MCPs =============
var getMCPs = function () {
    return config.get('mcps') || [];
};
exports.getMCPs = getMCPs;
var getMCP = function (id) {
    var mcps = (0, exports.getMCPs)();
    return mcps.find(function (m) { return m.id === id; }) || null;
};
exports.getMCP = getMCP;
var saveMCP = function (mcp) {
    var mcps = (0, exports.getMCPs)();
    var index = mcps.findIndex(function (m) { return m.id === mcp.id; });
    if (index >= 0) {
        mcps[index] = mcp;
    }
    else {
        mcps.push(mcp);
    }
    config.set('mcps', mcps);
};
exports.saveMCP = saveMCP;
var deleteMCP = function (id) {
    var mcps = (0, exports.getMCPs)();
    config.set('mcps', mcps.filter(function (m) { return m.id !== id; }));
};
exports.deleteMCP = deleteMCP;
var clearAllMCPs = function () {
    console.log('🗑️  Limpando todos os MCPs...');
    config.set('mcps', []);
    console.log('✅ Todos os MCPs removidos');
};
exports.clearAllMCPs = clearAllMCPs;
// ============= SESSÕES =============
var getSessions = function () {
    return config.get('sessions') || [];
};
exports.getSessions = getSessions;
var getSession = function (id) {
    var sessions = (0, exports.getSessions)();
    return sessions.find(function (s) { return s.id === id; }) || null;
};
exports.getSession = getSession;
var saveSession = function (session) {
    var sessions = (0, exports.getSessions)();
    var index = sessions.findIndex(function (s) { return s.id === session.id; });
    if (index >= 0) {
        sessions[index] = session;
    }
    else {
        sessions.push(session);
    }
    config.set('sessions', sessions);
};
exports.saveSession = saveSession;
var deleteSession = function (id) {
    var sessions = (0, exports.getSessions)();
    config.set('sessions', sessions.filter(function (s) { return s.id !== id; }));
};
exports.deleteSession = deleteSession;
var getActiveSessionId = function () {
    return config.get('activeSessionId') || null;
};
exports.getActiveSessionId = getActiveSessionId;
var setActiveSessionId = function (id) {
    config.set('activeSessionId', id);
};
exports.setActiveSessionId = setActiveSessionId;
// ============= AUTOMAÇÕES =============
var getAutomations = function () {
    return config.get('automations') || [];
};
exports.getAutomations = getAutomations;
var getAutomation = function (id) {
    var automations = (0, exports.getAutomations)();
    return automations.find(function (a) { return a.id === id; }) || null;
};
exports.getAutomation = getAutomation;
var saveAutomation = function (automation) {
    var automations = (0, exports.getAutomations)();
    var index = automations.findIndex(function (a) { return a.id === automation.id; });
    if (index >= 0) {
        automations[index] = automation;
    }
    else {
        automations.push(automation);
    }
    config.set('automations', automations);
};
exports.saveAutomation = saveAutomation;
var deleteAutomation = function (id) {
    var automations = (0, exports.getAutomations)();
    var initialLength = automations.length;
    var filtered = automations.filter(function (a) { return a.id !== id; });
    config.set('automations', filtered);
    return filtered.length < initialLength;
};
exports.deleteAutomation = deleteAutomation;
// ============= UTILITY =============
var clearAllData = function () {
    config.clear();
};
exports.clearAllData = clearAllData;
