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
exports.getExecutionsByAutomation = exports.saveExecution = exports.getExecution = exports.getExecutions = exports.deleteAutomation = exports.saveAutomation = exports.getAutomation = exports.getAutomations = void 0;
var conf_1 = require("conf");
var path_1 = require("path");
var id_js_1 = require("../utils/id.js");
var automation_js_1 = require("../types/automation.js");
// 🎯 STORAGE CENTRALIZADO: workspace/storage/config.json
var STORAGE_PATH = (0, path_1.join)(process.cwd(), 'workspace', 'storage');
var config = new conf_1.default({
    projectName: 'flui',
    cwd: STORAGE_PATH,
    configName: 'config',
});
// 🔧 INICIALIZAR STORAGE SE NÃO EXISTIR
if (!config.get('automations')) {
    config.set('automations', []);
}
if (!config.get('executions')) {
    config.set('executions', []);
}
console.log('✅ [AutomationStorage] Storage inicializado');
/**
 * Valida e normaliza uma automação antes de salvar
 * Garante que todos os campos obrigatórios existem com defaults apropriados
 */
function validateAndNormalizeAutomation(automation) {
    // ✅ FIX: Reduzir logging verboso
    var _a, _b;
    // Garantir campos básicos
    var normalized = {
        id: automation.id || (0, id_js_1.generateId)(),
        name: automation.name || 'Nova Automação',
        description: automation.description || '',
        nodes: Array.isArray(automation.nodes) ? automation.nodes : [],
        edges: Array.isArray(automation.edges) ? automation.edges : [],
        startNodeId: automation.startNodeId || ((_b = (_a = automation.nodes) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.id) || '',
        enabled: automation.enabled !== undefined ? automation.enabled : true,
        continuousExecution: automation.continuousExecution || false, // 🔁 Execução contínua
        schedule: automation.schedule || undefined,
        version: automation.version || '2.0.0',
        createdAt: automation.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(), // Sempre atualiza
        lastRun: automation.lastRun || undefined,
        runCount: automation.runCount || 0,
        metadata: automation.metadata || {
            createdAt: automation.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
    };
    // Garantir que cada node tem campos necessários
    normalized.nodes = normalized.nodes.map(function (node) {
        // ✅ Node type já vem correto do frontend (manual-trigger, cron-trigger, etc)
        // Apenas garantir que existe um tipo válido
        var nodeType = node.type || 'tool';
        // ✅ REMOVIDO: Migração automática de tipos (causava problemas)
        // Os tipos agora são aceitos conforme definidos no AutomationNodeTypeSchema
        return __assign(__assign(__assign(__assign({ id: node.id || (0, id_js_1.generateId)(), type: nodeType, name: node.name || 'Node', description: node.description || '', config: node.config || {}, position: node.position || { x: 0, y: 0 }, nextNodes: Array.isArray(node.nextNodes) ? node.nextNodes : [] }, (node.agentId && { agentId: node.agentId })), (node.toolId && { toolId: node.toolId })), (node.mcpId && { mcpId: node.mcpId })), (node.mcpToolId && { mcpToolId: node.mcpToolId }));
    });
    // Garantir que cada edge tem id
    normalized.edges = normalized.edges.map(function (edge, index) { return ({
        id: edge.id || "edge-".concat(index),
        source: edge.source || edge.from || '',
        target: edge.target || edge.to || '',
    }); });
    // Validar com Zod
    try {
        return automation_js_1.AutomationSchema.parse(normalized);
    }
    catch (error) {
        console.error('❌ [Storage] Erro de validação:', error);
        // Retornar versão normalizada mesmo com erro de validação
        // para evitar perda de dados
        return normalized;
    }
}
/**
 * Migra automação de schema antigo para novo
 * Garante compatibilidade com versões anteriores
 */
function migrateAutomation(automation) {
    var _a, _b;
    // ✅ FIX: Se já está na versão 2.0.0, retornar sem validar novamente
    // validateAndNormalizeAutomation será chamada depois se necessário
    if (automation.version === '2.0.0') {
        return automation;
    }
    console.log('🔄 [Storage] Migrando automação:', automation.id, 'de versão', automation.version || '1.x', '→ 2.0.0');
    // Migration de versão 1.x para 2.0
    var edges = automation.edges || [];
    // Se não tem edges mas tem connections (formato antigo), converter
    if (edges.length === 0 && automation.connections) {
        console.log('🔄 [Storage] Convertendo connections → edges');
        edges = automation.connections.map(function (conn, index) { return ({
            id: conn.id || "edge-".concat(index),
            source: conn.from || conn.source,
            target: conn.to || conn.target,
        }); });
    }
    var migrated = __assign(__assign({}, automation), { version: '2.0.0', edges: edges, startNodeId: automation.startNodeId || ((_b = (_a = automation.nodes) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.id) || '', metadata: automation.metadata || {
            createdAt: automation.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        } });
    // Remover campo 'connections' se existir
    delete migrated.connections;
    console.log('✅ [Storage] Migração concluída', { version: '2.0.0', edgesCount: edges.length });
    return migrated;
}
// ============= AUTOMATIONS =============
var getAutomations = function () {
    var automations = config.get('automations') || [];
    // Migrar cada automação ao carregar (com tratamento de erro)
    return automations.map(function (a) {
        try {
            return migrateAutomation(a);
        }
        catch (error) {
            console.error("\u274C [Storage] Erro ao migrar automa\u00E7\u00E3o ".concat(a.id, ":"), error.message);
            // Retornar automação sem migração em caso de erro
            return a;
        }
    }).filter(Boolean); // Remover nulls/undefineds
};
exports.getAutomations = getAutomations;
var getAutomation = function (id) {
    var _a, _b;
    var automations = config.get('automations');
    if (!automations)
        return null;
    var automation = automations.find(function (a) { return a.id === id; });
    if (!automation)
        return null;
    console.log("\uD83D\uDCD6 [Storage] Loading automation ".concat(id, " - ").concat(((_a = automation.nodes) === null || _a === void 0 ? void 0 : _a.length) || 0, " nodes, ").concat(((_b = automation.edges) === null || _b === void 0 ? void 0 : _b.length) || 0, " edges"));
    // ✅ FIX: Migrar apenas se necessário
    var result = automation;
    if (automation.version !== '2.0.0') {
        result = migrateAutomation(automation);
    }
    // ✅ FIX: Validar UMA ÚNICA VEZ
    var validated = validateAndNormalizeAutomation(result);
    return validated;
};
exports.getAutomation = getAutomation;
var saveAutomation = function (automation) {
    var _a;
    console.log('💾 [Storage] Salvando automação:', automation.id || 'nova', '- Edges:', ((_a = automation.edges) === null || _a === void 0 ? void 0 : _a.length) || 0);
    // ✅ FIX: Migrar apenas se necessário (versão antiga)
    var toSave = automation;
    if (automation.version !== '2.0.0') {
        toSave = migrateAutomation(automation);
    }
    // ✅ FIX: Validar e normalizar UMA ÚNICA VEZ
    var validated = validateAndNormalizeAutomation(toSave);
    var automations = config.get('automations') || [];
    var index = automations.findIndex(function (a) { return a.id === validated.id; });
    if (index >= 0) {
        console.log('✅ [Storage] Automação atualizada');
        automations[index] = validated;
    }
    else {
        console.log('✅ [Storage] Automação criada');
        automations.push(validated);
    }
    config.set('automations', automations);
    return validated;
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
// ============= EXECUTIONS =============
var getExecutions = function () {
    return config.get('executions') || [];
};
exports.getExecutions = getExecutions;
var getExecution = function (id) {
    var executions = (0, exports.getExecutions)();
    return executions.find(function (e) { return e.id === id; }) || null;
};
exports.getExecution = getExecution;
var saveExecution = function (execution) {
    var executions = (0, exports.getExecutions)();
    var index = executions.findIndex(function (e) { return e.id === execution.id; });
    if (index >= 0) {
        executions[index] = execution;
    }
    else {
        executions.push(execution);
    }
    // Manter apenas últimas 100 execuções
    if (executions.length > 100) {
        executions.splice(0, executions.length - 100);
    }
    config.set('executions', executions);
};
exports.saveExecution = saveExecution;
var getExecutionsByAutomation = function (automationId) {
    var executions = (0, exports.getExecutions)();
    return executions.filter(function (e) { return e.automationId === automationId; });
};
exports.getExecutionsByAutomation = getExecutionsByAutomation;
