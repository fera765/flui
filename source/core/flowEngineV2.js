"use strict";
/**
 * FLUI - Flow Engine V2 (com padrão universal de Input/Output)
 *
 * Motor de execução completamente refatorado para suportar:
 * - Padrão universal de dados entre nodes
 * - Mapeamento dinâmico de inputs
 * - Rastreabilidade completa
 * - Conexão automática e inteligente
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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FlowEngineV2 = void 0;
exports.executeFlow = executeFlow;
var id_js_1 = require("../utils/id.js");
var toolExecutor_js_1 = require("./toolExecutor.js");
var nodeDataTypes_js_1 = require("./nodeDataTypes.js");
var referenceResolver_js_1 = require("./referenceResolver.js");
var FlowEngineV2 = /** @class */ (function () {
    function FlowEngineV2(flow, onLog) {
        // Armazena outputs de cada node no formato padronizado
        this.nodeOutputs = new Map();
        this.flow = flow;
        this.onLogCallback = onLog;
        this.abortController = new AbortController();
        this.execution = {
            id: (0, id_js_1.generateId)(),
            flowId: flow.id,
            status: 'pending',
            startedAt: new Date().toISOString(),
            logs: [],
            nodeResults: {},
        };
    }
    /**
     * Executar fluxo até um node específico (para testes)
     */
    FlowEngineV2.prototype.executeUntilNode = function (targetNodeId_1) {
        return __awaiter(this, arguments, void 0, function (targetNodeId, initialData) {
            var executionOrder, targetIndex, nodesToExecute, _loop_1, this_1, _i, nodesToExecute_1, nodeId, error_1;
            if (initialData === void 0) { initialData = {}; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log('🎯 [FlowEngineV2] Executando até node:', targetNodeId);
                        this.execution.status = 'running';
                        this.execution.startedAt = new Date().toISOString();
                        this.log('flow', 'Flow Engine V2', 'running', "Iniciando execu\u00E7\u00E3o at\u00E9 node: ".concat(targetNodeId));
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 6, , 7]);
                        // Validar fluxo
                        this.validateFlow();
                        executionOrder = this.getExecutionOrder();
                        console.log('📋 [FlowEngineV2] Ordem de execução:', executionOrder);
                        targetIndex = executionOrder.indexOf(targetNodeId);
                        if (targetIndex === -1) {
                            throw new Error("Node ".concat(targetNodeId, " n\u00E3o encontrado na ordem de execu\u00E7\u00E3o"));
                        }
                        nodesToExecute = executionOrder.slice(0, targetIndex + 1);
                        console.log('🎯 [FlowEngineV2] Executando nodes:', nodesToExecute);
                        _loop_1 = function (nodeId) {
                            var node;
                            return __generator(this, function (_b) {
                                switch (_b.label) {
                                    case 0:
                                        // Verificar se foi cancelado
                                        if (this_1.abortController.signal.aborted) {
                                            throw new Error('Execução cancelada');
                                        }
                                        node = this_1.flow.nodes.find(function (n) { return n.id === nodeId; });
                                        if (!node) {
                                            this_1.log(nodeId, 'Unknown', 'failed', "Node ".concat(nodeId, " n\u00E3o encontrado"));
                                            return [2 /*return*/, "continue"];
                                        }
                                        return [4 /*yield*/, this_1.executeNodeV2(node)];
                                    case 1:
                                        _b.sent();
                                        return [2 /*return*/];
                                }
                            });
                        };
                        this_1 = this;
                        _i = 0, nodesToExecute_1 = nodesToExecute;
                        _a.label = 2;
                    case 2:
                        if (!(_i < nodesToExecute_1.length)) return [3 /*break*/, 5];
                        nodeId = nodesToExecute_1[_i];
                        return [5 /*yield**/, _loop_1(nodeId)];
                    case 3:
                        _a.sent();
                        _a.label = 4;
                    case 4:
                        _i++;
                        return [3 /*break*/, 2];
                    case 5:
                        this.execution.status = 'completed';
                        this.execution.completedAt = new Date().toISOString();
                        // Resultado é o output do node testado
                        this.execution.result = this.nodeOutputs.get(targetNodeId);
                        this.log('flow', 'Flow Engine V2', 'completed', "Fluxo executado at\u00E9 node ".concat(targetNodeId, " com sucesso"));
                        return [3 /*break*/, 7];
                    case 6:
                        error_1 = _a.sent();
                        this.execution.status = 'failed';
                        this.execution.completedAt = new Date().toISOString();
                        this.execution.error = error_1.message;
                        this.log('flow', 'Flow Engine V2', 'failed', "Erro: ".concat(error_1.message), undefined, error_1.message);
                        return [3 /*break*/, 7];
                    case 7: return [2 /*return*/, this.execution];
                }
            });
        });
    };
    /**
     * Executa o fluxo completo com novo padrão
     */
    FlowEngineV2.prototype.execute = function () {
        return __awaiter(this, arguments, void 0, function (initialData) {
            var executionOrder, _loop_2, this_2, _i, executionOrder_1, nodeId, lastNodeId, error_2;
            if (initialData === void 0) { initialData = {}; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.execution.status = 'running';
                        this.log('flow', 'Flow Engine V2', 'running', "Iniciando execu\u00E7\u00E3o: ".concat(this.flow.name));
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 6, , 7]);
                        // Validar fluxo
                        this.validateFlow();
                        executionOrder = this.getExecutionOrder();
                        _loop_2 = function (nodeId) {
                            var node;
                            return __generator(this, function (_b) {
                                switch (_b.label) {
                                    case 0:
                                        // Verificar se foi cancelado
                                        if (this_2.abortController.signal.aborted) {
                                            throw new Error('Execução cancelada');
                                        }
                                        node = this_2.flow.nodes.find(function (n) { return n.id === nodeId; });
                                        if (!node)
                                            return [2 /*return*/, "continue"];
                                        // Para o node inicial, injetar dados iniciais
                                        if (nodeId === this_2.flow.startNodeId && Object.keys(initialData).length > 0) {
                                            // Adicionar dados iniciais ao config temporariamente
                                            node.config = __assign(__assign({}, node.config), initialData);
                                        }
                                        return [4 /*yield*/, this_2.executeNodeV2(node)];
                                    case 1:
                                        _b.sent();
                                        return [2 /*return*/];
                                }
                            });
                        };
                        this_2 = this;
                        _i = 0, executionOrder_1 = executionOrder;
                        _a.label = 2;
                    case 2:
                        if (!(_i < executionOrder_1.length)) return [3 /*break*/, 5];
                        nodeId = executionOrder_1[_i];
                        return [5 /*yield**/, _loop_2(nodeId)];
                    case 3:
                        _a.sent();
                        _a.label = 4;
                    case 4:
                        _i++;
                        return [3 /*break*/, 2];
                    case 5:
                        this.execution.status = 'completed';
                        this.execution.completedAt = new Date().toISOString();
                        lastNodeId = executionOrder[executionOrder.length - 1];
                        this.execution.result = this.nodeOutputs.get(lastNodeId);
                        this.log('flow', 'Flow Engine V2', 'completed', 'Execução concluída com sucesso');
                        return [3 /*break*/, 7];
                    case 6:
                        error_2 = _a.sent();
                        this.execution.status = 'failed';
                        this.execution.completedAt = new Date().toISOString();
                        this.execution.error = error_2.message;
                        this.log('flow', 'Flow Engine V2', 'failed', "Erro: ".concat(error_2.message), undefined, error_2.message);
                        return [3 /*break*/, 7];
                    case 7: return [2 /*return*/, this.execution];
                }
            });
        });
    };
    /**
     * Executa um node individual com novo padrão
     */
    FlowEngineV2.prototype.executeNodeV2 = function (node) {
        return __awaiter(this, void 0, void 0, function () {
            var startTime, previousNodes, inputData, output, validation, duration, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.log(node.id, node.name, 'running', "Executando node: ".concat(node.name));
                        startTime = Date.now();
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 11, , 12]);
                        previousNodes = this.getPreviousNodes(node.id);
                        inputData = this.prepareInputData(node, previousNodes);
                        output = void 0;
                        if (!(node.type === 'tool')) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.executeToolNode(node, inputData)];
                    case 2:
                        output = _a.sent();
                        return [3 /*break*/, 10];
                    case 3:
                        if (!(node.type === 'agent')) return [3 /*break*/, 5];
                        return [4 /*yield*/, this.executeAgentNode(node, inputData)];
                    case 4:
                        // ✅ FIX: Adicionar suporte para nodes de Agent
                        output = _a.sent();
                        return [3 /*break*/, 10];
                    case 5:
                        if (!(node.type === 'condition')) return [3 /*break*/, 7];
                        return [4 /*yield*/, this.executeConditionNode(node, inputData)];
                    case 6:
                        output = _a.sent();
                        return [3 /*break*/, 10];
                    case 7:
                        if (!(node.type === 'loop')) return [3 /*break*/, 9];
                        return [4 /*yield*/, this.executeLoopNode(node, inputData)];
                    case 8:
                        output = _a.sent();
                        return [3 /*break*/, 10];
                    case 9:
                        if (node.type === 'manual-trigger' || node.type === 'cron-trigger' || node.type === 'webhook-trigger') {
                            // Triggers são nodes especiais que apenas iniciam o fluxo
                            // Retornar no formato NodeOutput (array de NodeDataItem com json e meta)
                            output = [{
                                    json: {
                                        triggered: true,
                                        timestamp: new Date().toISOString(),
                                        triggerType: node.type,
                                        triggerData: inputData || {},
                                        message: node.config.triggerMessage || "Trigger ".concat(node.type, " ativado"),
                                        success: true
                                    },
                                    meta: {
                                        nodeId: node.id,
                                        nodeName: node.name || node.type,
                                        timestamp: Date.now(),
                                        executionId: this.execution.id
                                    }
                                }];
                        }
                        else {
                            throw new Error("Tipo de node n\u00E3o suportado: ".concat(node.type));
                        }
                        _a.label = 10;
                    case 10:
                        validation = (0, nodeDataTypes_js_1.validateNodeOutput)(output);
                        if (!validation.valid) {
                            throw new Error("Output inv\u00E1lido: ".concat(validation.errors.join(', ')));
                        }
                        // Armazenar output
                        this.nodeOutputs.set(node.id, output);
                        this.execution.nodeResults[node.id] = output;
                        duration = Date.now() - startTime;
                        this.log(node.id, node.name, 'completed', "Node executado com sucesso (".concat(duration, "ms)"), { output: output, availableKeys: (0, nodeDataTypes_js_1.extractAvailableKeys)(output) });
                        return [3 /*break*/, 12];
                    case 11:
                        error_3 = _a.sent();
                        this.log(node.id, node.name, 'failed', "Erro ao executar node: ".concat(error_3.message), undefined, error_3.message);
                        throw error_3;
                    case 12: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Executa um node do tipo "tool"
     */
    FlowEngineV2.prototype.executeToolNode = function (node, inputData) {
        return __awaiter(this, void 0, void 0, function () {
            var toolId, resolvedConfig, validation, finalInput, context, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        toolId = node.config.toolId;
                        if (!toolId) {
                            throw new Error('toolId não especificado no config');
                        }
                        resolvedConfig = __assign({}, node.config);
                        if ((0, referenceResolver_js_1.hasReferences)(node.config)) {
                            validation = (0, referenceResolver_js_1.validateReferences)(node.config, {
                                nodeOutputs: this.nodeOutputs,
                            });
                            if (!validation.valid) {
                                console.warn('⚠️  Referências inválidas encontradas:', validation.errors);
                            }
                            resolvedConfig = (0, referenceResolver_js_1.resolveReferences)(node.config, {
                                nodeOutputs: this.nodeOutputs,
                            });
                            this.log(node.id, node.name, 'running', 'Referências resolvidas', { original: node.config, resolved: resolvedConfig });
                        }
                        finalInput = __assign(__assign({}, inputData), resolvedConfig);
                        // Remover campos internos que não devem ser passados para a tool
                        delete finalInput.inputConfig;
                        delete finalInput.nodeId;
                        context = {
                            automationId: this.flow.id,
                            nodeId: node.id,
                            globalContext: {},
                            previousResults: Object.fromEntries(this.nodeOutputs),
                            sandboxPath: node.config.sandboxPath || finalInput.sandboxPath,
                        };
                        return [4 /*yield*/, toolExecutor_js_1.ToolExecutor.execute(toolId, finalInput, context)];
                    case 1:
                        result = _a.sent();
                        if (!result.success) {
                            throw new Error(result.error || 'Tool execution failed');
                        }
                        // Converter resultado para formato padronizado
                        return [2 /*return*/, [(0, nodeDataTypes_js_1.createNodeDataItem)(result.result || {}, node.id, node.name, this.execution.id)]];
                }
            });
        });
    };
    /**
     * Executa um node do tipo "agent"
     */
    FlowEngineV2.prototype.executeAgentNode = function (node, inputData) {
        return __awaiter(this, void 0, void 0, function () {
            var agentId, resolvedConfig, validation, message, context, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        agentId = node.agentId;
                        if (!agentId) {
                            throw new Error('agentId não especificado no node');
                        }
                        console.log("\uD83E\uDD16 [FlowEngineV2] Executando agent node: ".concat(node.name, " (").concat(agentId, ")"));
                        resolvedConfig = __assign({}, node.config);
                        if ((0, referenceResolver_js_1.hasReferences)(node.config)) {
                            validation = (0, referenceResolver_js_1.validateReferences)(node.config, {
                                nodeOutputs: this.nodeOutputs,
                            });
                            if (!validation.valid) {
                                console.warn('⚠️  Referências inválidas encontradas:', validation.errors);
                            }
                            resolvedConfig = (0, referenceResolver_js_1.resolveReferences)(node.config, {
                                nodeOutputs: this.nodeOutputs,
                            });
                            this.log(node.id, node.name, 'running', 'Referências resolvidas', { original: node.config, resolved: resolvedConfig });
                        }
                        message = resolvedConfig.message || resolvedConfig.input || resolvedConfig.prompt || inputData.message || '';
                        if (!message) {
                            throw new Error('Mensagem/input é obrigatório para o agente');
                        }
                        this.log(node.id, node.name, 'running', 'Executando agente...', { message: message });
                        context = {
                            automationId: this.flow.id,
                            nodeId: node.id,
                            globalContext: {},
                            previousResults: Object.fromEntries(this.nodeOutputs),
                            sandboxPath: node.config.sandboxPath || resolvedConfig.sandboxPath,
                        };
                        return [4 /*yield*/, toolExecutor_js_1.ToolExecutor.execute("agent-".concat(agentId), __assign({ message: message }, resolvedConfig), context)];
                    case 1:
                        result = _a.sent();
                        if (!result.success) {
                            throw new Error(result.error || 'Agent execution failed');
                        }
                        // Converter resultado para formato padronizado
                        return [2 /*return*/, [(0, nodeDataTypes_js_1.createNodeDataItem)(result.result || {}, node.id, node.name, this.execution.id)]];
                }
            });
        });
    };
    /**
     * Executa um node do tipo "condition"
     */
    FlowEngineV2.prototype.executeConditionNode = function (node, inputData) {
        return __awaiter(this, void 0, void 0, function () {
            var condition, result;
            return __generator(this, function (_a) {
                condition = node.config.condition;
                result = this.evaluateCondition(condition, inputData);
                return [2 /*return*/, [(0, nodeDataTypes_js_1.createNodeDataItem)(__assign({ conditionResult: result }, inputData), node.id, node.name, this.execution.id)]];
            });
        });
    };
    /**
     * Executa um node do tipo "loop"
     */
    FlowEngineV2.prototype.executeLoopNode = function (node, inputData) {
        return __awaiter(this, void 0, void 0, function () {
            var arrayKey, array, results, i;
            return __generator(this, function (_a) {
                arrayKey = node.config.arrayKey;
                array = inputData[arrayKey];
                if (!Array.isArray(array)) {
                    throw new Error("".concat(arrayKey, " n\u00E3o \u00E9 um array"));
                }
                results = [];
                for (i = 0; i < array.length; i++) {
                    results.push((0, nodeDataTypes_js_1.createNodeDataItem)({ item: array[i], index: i }, node.id, node.name, this.execution.id));
                }
                return [2 /*return*/, results];
            });
        });
    };
    /**
     * Prepara dados de entrada baseado em mapeamentos configurados
     */
    FlowEngineV2.prototype.prepareInputData = function (node, previousNodes) {
        var _this = this;
        var inputConfig = node.config.inputConfig;
        // Se não tem configuração de input, usar dados de todos os nodes anteriores
        if (!inputConfig || !inputConfig.mappings || inputConfig.mappings.length === 0) {
            return this.getDefaultInputData(previousNodes);
        }
        // Aplicar mapeamentos configurados
        var previousResults = {};
        previousNodes.forEach(function (nodeId) {
            var output = _this.nodeOutputs.get(nodeId);
            if (output) {
                previousResults[nodeId] = output;
            }
        });
        return (0, nodeDataTypes_js_1.applyInputMappings)(previousResults, inputConfig);
    };
    /**
     * Obtém dados de entrada padrão (merge de todos os nodes anteriores)
     */
    FlowEngineV2.prototype.getDefaultInputData = function (previousNodes) {
        var _this = this;
        var result = {};
        previousNodes.forEach(function (nodeId) {
            var output = _this.nodeOutputs.get(nodeId);
            if (output && output.length > 0) {
                // Merge do json de todos os items
                output.forEach(function (item) {
                    Object.assign(result, item.json);
                });
            }
        });
        return result;
    };
    /**
     * Obtém IDs dos nodes anteriores
     */
    FlowEngineV2.prototype.getPreviousNodes = function (nodeId) {
        return this.flow.edges
            .filter(function (edge) { return edge.target === nodeId; })
            .map(function (edge) { return edge.source; });
    };
    /**
     * Obtém ordem de execução (topological sort)
     */
    FlowEngineV2.prototype.getExecutionOrder = function () {
        var _this = this;
        var visited = new Set();
        var order = [];
        var visit = function (nodeId) {
            if (visited.has(nodeId))
                return;
            visited.add(nodeId);
            // Visitar dependências primeiro
            var previousNodes = _this.getPreviousNodes(nodeId);
            previousNodes.forEach(visit);
            order.push(nodeId);
        };
        // Começar do node inicial
        visit(this.flow.startNodeId);
        // Visitar nodes restantes
        this.flow.nodes.forEach(function (node) { return visit(node.id); });
        return order;
    };
    /**
     * Valida o fluxo
     */
    FlowEngineV2.prototype.validateFlow = function () {
        var _this = this;
        if (!this.flow.nodes || this.flow.nodes.length === 0) {
            throw new Error('Fluxo não contém nodes');
        }
        if (!this.flow.startNodeId) {
            throw new Error('Node inicial não definido');
        }
        var startNode = this.flow.nodes.find(function (n) { return n.id === _this.flow.startNodeId; });
        if (!startNode) {
            throw new Error('Node inicial não encontrado');
        }
    };
    /**
     * Avalia uma condição
     */
    FlowEngineV2.prototype.evaluateCondition = function (condition, data) {
        try {
            var func = new Function('data', "return ".concat(condition));
            return func(data);
        }
        catch (_a) {
            return false;
        }
    };
    /**
     * Registra um log
     */
    FlowEngineV2.prototype.log = function (nodeId, nodeName, status, message, data, error) {
        var log = {
            timestamp: new Date().toISOString(),
            nodeId: nodeId,
            nodeName: nodeName,
            status: status,
            message: message,
            data: data,
            error: error,
        };
        this.execution.logs.push(log);
        if (this.onLogCallback) {
            this.onLogCallback(log);
        }
    };
    /**
     * Cancela execução
     */
    FlowEngineV2.prototype.abort = function () {
        this.abortController.abort();
        this.execution.status = 'cancelled';
        this.log('flow', 'Flow Engine V2', 'cancelled', 'Execução cancelada pelo usuário');
    };
    /**
     * Obtém output de um node específico
     */
    FlowEngineV2.prototype.getNodeOutput = function (nodeId) {
        return this.nodeOutputs.get(nodeId);
    };
    /**
     * Obtém todas as chaves disponíveis de um node
     */
    FlowEngineV2.prototype.getAvailableKeys = function (nodeId) {
        var output = this.nodeOutputs.get(nodeId);
        if (!output)
            return [];
        return (0, nodeDataTypes_js_1.extractAvailableKeys)(output);
    };
    return FlowEngineV2;
}());
exports.FlowEngineV2 = FlowEngineV2;
/**
 * Função helper para executar um fluxo V2
 */
function executeFlow(flow, initialData, onLog) {
    return __awaiter(this, void 0, void 0, function () {
        var engine;
        return __generator(this, function (_a) {
            engine = new FlowEngineV2(flow, onLog);
            return [2 /*return*/, engine.execute(initialData)];
        });
    });
}
