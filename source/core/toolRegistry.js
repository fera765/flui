"use strict";
/**
 * FLUI - Tool Registry
 *
 * Registro central dinâmico de todas as ferramentas do sistema
 * Permite adicionar, remover e executar ferramentas dinamicamente
 */
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
exports.ToolRegistry = void 0;
exports.getToolRegistry = getToolRegistry;
exports.initializeToolRegistry = initializeToolRegistry;
exports.resetToolRegistry = resetToolRegistry;
var toolMetadataValidator_js_1 = require("./toolMetadataValidator.js");
var ToolRegistry = /** @class */ (function () {
    function ToolRegistry(options) {
        if (options === void 0) { options = {}; }
        this.tools = new Map();
        this.options = {
            maxTools: options.maxTools || 1000,
            allowDuplicateIds: options.allowDuplicateIds || false,
            validateOnRegister: options.validateOnRegister !== false,
        };
    }
    /**
     * Registra uma nova ferramenta
     */
    ToolRegistry.prototype.register = function (tool) {
        var _a;
        // Validar ID único
        if (!this.options.allowDuplicateIds && this.tools.has(tool.id)) {
            throw new Error("Tool com ID '".concat(tool.id, "' j\u00E1 est\u00E1 registrada"));
        }
        // Validar limite
        if (this.tools.size >= (this.options.maxTools || 1000)) {
            throw new Error("Limite de ferramentas atingido: ".concat(this.options.maxTools));
        }
        // Preparar metadados primeiro (adicionar defaults, incluindo keys)
        var preparedMetadata = (0, toolMetadataValidator_js_1.prepareToolMetadata)(tool);
        // Validar estrutura e metadados se necessário
        if (this.options.validateOnRegister) {
            this.validateToolStructure(preparedMetadata);
            // Validar metadados usando JSON Schema
            var validation = (0, toolMetadataValidator_js_1.validateToolMetadata)(preparedMetadata);
            if (!validation.valid) {
                throw new Error("Metadados inv\u00E1lidos para tool '".concat(tool.id, "':\n") +
                    ((_a = validation.errors) === null || _a === void 0 ? void 0 : _a.join('\n')));
            }
            // Log warnings
            if (validation.warnings && validation.warnings.length > 0) {
                console.warn("\u26A0\uFE0F  Avisos para tool '".concat(tool.id, "':"));
                validation.warnings.forEach(function (w) { return console.warn("   - ".concat(w)); });
            }
        }
        // Criar RegisteredTool com métricas, preservando execute e validate do tool original
        var registeredTool = __assign(__assign({}, preparedMetadata), { execute: tool.execute, validate: tool.validate, hooks: tool.hooks, registeredAt: new Date().toISOString(), metrics: {
                executionCount: 0,
                successCount: 0,
                failureCount: 0,
                averageExecutionTime: 0,
            } });
        this.tools.set(tool.id, registeredTool);
    };
    /**
     * Remove uma ferramenta do registro
     */
    ToolRegistry.prototype.unregister = function (toolId) {
        return this.tools.delete(toolId);
    };
    /**
     * Obtém uma ferramenta por ID
     */
    ToolRegistry.prototype.get = function (toolId) {
        return this.tools.get(toolId);
    };
    /**
     * Get all registered tools
     */
    ToolRegistry.prototype.getAllTools = function () {
        return Array.from(this.tools.values());
    };
    /**
     * Get a specific tool by ID (alias for get)
     */
    ToolRegistry.prototype.getTool = function (toolId) {
        return this.get(toolId);
    };
    /**
     * Get tools by category
     */
    ToolRegistry.prototype.getToolsByCategory = function (category) {
        return Array.from(this.tools.values()).filter(function (t) { return t.category === category; });
    };
    /**
     * Lista todas as ferramentas (com filtros opcionais e paginação)
     */
    ToolRegistry.prototype.list = function (filter) {
        var tools = Array.from(this.tools.values());
        // Aplicar filtros
        if (filter) {
            // Filtrar por categoria
            if (filter.category) {
                tools = tools.filter(function (t) { return t.category === filter.category; });
            }
            // Filtrar por busca (nome ou descrição)
            if (filter.search) {
                var search_1 = filter.search.toLowerCase();
                tools = tools.filter(function (t) {
                    return t.name.toLowerCase().includes(search_1) ||
                        t.description.toLowerCase().includes(search_1) ||
                        t.id.toLowerCase().includes(search_1);
                });
            }
            // Filtrar por tags
            if (filter.tags && filter.tags.length > 0) {
                tools = tools.filter(function (t) {
                    return filter.tags.some(function (tag) { var _a; return (_a = t.ui.tags) === null || _a === void 0 ? void 0 : _a.includes(tag); });
                });
            }
        }
        var total = tools.length;
        // Aplicar paginação
        var page = (filter === null || filter === void 0 ? void 0 : filter.page) || 1;
        var pageSize = (filter === null || filter === void 0 ? void 0 : filter.pageSize) || 50;
        var startIndex = (page - 1) * pageSize;
        var endIndex = startIndex + pageSize;
        var paginatedTools = tools.slice(startIndex, endIndex);
        var totalPages = Math.ceil(total / pageSize);
        return {
            tools: paginatedTools,
            total: total,
            page: page,
            pageSize: pageSize,
            totalPages: totalPages,
        };
    };
    /**
     * Lista todas as categorias disponíveis
     */
    ToolRegistry.prototype.getCategories = function () {
        var categories = new Set();
        for (var _i = 0, _a = this.tools.values(); _i < _a.length; _i++) {
            var tool = _a[_i];
            categories.add(tool.category);
        }
        return Array.from(categories);
    };
    /**
     * Obtém métricas de uma ferramenta
     */
    ToolRegistry.prototype.getMetrics = function (toolId) {
        var _a;
        return (_a = this.tools.get(toolId)) === null || _a === void 0 ? void 0 : _a.metrics;
    };
    /**
     * Atualiza métricas após execução
     */
    ToolRegistry.prototype.updateMetrics = function (toolId, success, executionTime) {
        var tool = this.tools.get(toolId);
        if (!tool)
            return;
        var metrics = tool.metrics;
        metrics.executionCount++;
        if (success) {
            metrics.successCount++;
        }
        else {
            metrics.failureCount++;
        }
        // Atualizar tempo médio de execução (moving average)
        if (metrics.executionCount === 1) {
            metrics.averageExecutionTime = executionTime;
        }
        else {
            metrics.averageExecutionTime =
                (metrics.averageExecutionTime * (metrics.executionCount - 1) +
                    executionTime) /
                    metrics.executionCount;
        }
        metrics.lastExecutedAt = new Date().toISOString();
    };
    /**
     * Verifica se uma ferramenta existe
     */
    ToolRegistry.prototype.has = function (toolId) {
        return this.tools.has(toolId);
    };
    /**
     * Obtém o total de ferramentas registradas
     */
    ToolRegistry.prototype.count = function () {
        return this.tools.size;
    };
    /**
     * Limpa todas as ferramentas
     */
    ToolRegistry.prototype.clear = function () {
        this.tools.clear();
    };
    /**
     * Exporta todas as ferramentas (para backup/debug)
     */
    ToolRegistry.prototype.export = function () {
        return Array.from(this.tools.values());
    };
    /**
     * Valida a estrutura de uma ferramenta
     */
    ToolRegistry.prototype.validateToolStructure = function (tool) {
        if (!tool.id || typeof tool.id !== 'string') {
            throw new Error('Tool ID é obrigatório e deve ser string');
        }
        if (!tool.name || typeof tool.name !== 'string') {
            throw new Error('Tool name é obrigatório e deve ser string');
        }
        if (!tool.description || typeof tool.description !== 'string') {
            throw new Error('Tool description é obrigatório e deve ser string');
        }
        if (typeof tool.execute !== 'function') {
            throw new Error('Tool execute deve ser uma função');
        }
        if (!Array.isArray(tool.params)) {
            throw new Error('Tool params deve ser um array');
        }
        // Validar cada parâmetro
        for (var _i = 0, _a = tool.params; _i < _a.length; _i++) {
            var param = _a[_i];
            if (!param.name || typeof param.name !== 'string') {
                throw new Error("Par\u00E2metro inv\u00E1lido: name \u00E9 obrigat\u00F3rio");
            }
            if (!param.type) {
                throw new Error("Par\u00E2metro '".concat(param.name, "': type \u00E9 obrigat\u00F3rio"));
            }
        }
    };
    return ToolRegistry;
}());
exports.ToolRegistry = ToolRegistry;
// Instância global do registry (singleton)
var globalRegistry = null;
/**
 * Obtém a instância global do registry
 */
function getToolRegistry() {
    if (!globalRegistry) {
        globalRegistry = new ToolRegistry();
    }
    return globalRegistry;
}
/**
 * Inicializa o registry com opções customizadas
 */
function initializeToolRegistry(options) {
    globalRegistry = new ToolRegistry(options);
    return globalRegistry;
}
/**
 * Reseta o registry global (útil para testes)
 */
function resetToolRegistry() {
    globalRegistry = null;
}
