"use strict";
/**
 * FLUI - Tool Executor
 *
 * Executor genérico de ferramentas com suporte a:
 * - Timeout
 * - Retries
 * - Hooks de lifecycle
 * - Métricas automáticas
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
exports.ToolExecutor = void 0;
var toolRegistry_js_1 = require("./toolRegistry.js");
var toolValidator_js_1 = require("./toolValidator.js");
var ToolExecutor = /** @class */ (function () {
    function ToolExecutor() {
    }
    /**
     * Executa uma ferramenta pelo ID
     */
    ToolExecutor.execute = function (toolId, args, context, options) {
        return __awaiter(this, void 0, void 0, function () {
            var registry, tool;
            return __generator(this, function (_a) {
                registry = (0, toolRegistry_js_1.getToolRegistry)();
                // 🔥 SUPORTE A AGENTES: Se toolId começa com 'agent-', executar agente
                if (toolId.startsWith('agent-')) {
                    return [2 /*return*/, this.executeAgent(toolId, args, context, options)];
                }
                tool = registry.get(toolId);
                if (!tool) {
                    return [2 /*return*/, {
                            success: false,
                            error: "Ferramenta n\u00E3o encontrada: ".concat(toolId),
                        }];
                }
                return [2 /*return*/, this.executeTool(tool, args, context, options)];
            });
        });
    };
    /**
     * Executa um agente dinamicamente com integração REAL ao LLM
     */
    ToolExecutor.executeAgent = function (toolId, args, context, options) {
        return __awaiter(this, void 0, void 0, function () {
            var startTime, agentId_1, useStore, store, agent, userInput, sendMessage, response, error_1;
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        startTime = Date.now();
                        _c.label = 1;
                    case 1:
                        _c.trys.push([1, 5, , 6]);
                        agentId_1 = toolId.replace('agent-', '');
                        return [4 /*yield*/, Promise.resolve().then(function () { return require('../store/store.js'); })];
                    case 2:
                        useStore = (_c.sent()).useStore;
                        store = useStore.getState();
                        agent = store.agents.find(function (a) { return a.id === agentId_1; });
                        if (!agent) {
                            return [2 /*return*/, {
                                    success: false,
                                    error: "Agente n\u00E3o encontrado: ".concat(agentId_1),
                                    executionTime: Date.now() - startTime,
                                }];
                        }
                        console.log("\uD83E\uDD16 [AgentExecutor] Executando agente: ".concat(agent.name));
                        console.log("\uD83D\uDCCB [AgentExecutor] Model: ".concat(agent.model || 'padrão'));
                        console.log("\uD83D\uDD27 [AgentExecutor] Tools: ".concat(((_a = agent.tools) === null || _a === void 0 ? void 0 : _a.length) || 0));
                        userInput = args.input || args.prompt || args.message || '';
                        if (!userInput) {
                            return [2 /*return*/, {
                                    success: false,
                                    error: 'Input é obrigatório para o agente',
                                    executionTime: Date.now() - startTime,
                                }];
                        }
                        return [4 /*yield*/, Promise.resolve().then(function () { return require('../services/llm.js'); })];
                    case 3:
                        sendMessage = (_c.sent()).sendMessage;
                        console.log("\uD83D\uDCAC [AgentExecutor] Enviando mensagem para LLM: \"".concat(userInput.substring(0, 100)).concat(userInput.length > 100 ? '...' : '', "\""));
                        return [4 /*yield*/, sendMessage(userInput, agent, context)];
                    case 4:
                        response = _c.sent();
                        console.log("\u2705 [AgentExecutor] Resposta recebida (".concat(response.length, " chars)"));
                        return [2 /*return*/, {
                                success: true,
                                result: {
                                    response: response,
                                    agentName: agent.name,
                                    agentId: agent.id,
                                    model: agent.model,
                                    systemPrompt: agent.systemPrompt,
                                    toolsUsed: ((_b = agent.tools) === null || _b === void 0 ? void 0 : _b.length) || 0,
                                },
                                executionTime: Date.now() - startTime,
                            }];
                    case 5:
                        error_1 = _c.sent();
                        console.error("\u274C [AgentExecutor] Erro ao executar agente:", error_1);
                        return [2 /*return*/, {
                                success: false,
                                error: "Erro ao executar agente: ".concat(error_1.message),
                                executionTime: Date.now() - startTime,
                            }];
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Executa uma ferramenta diretamente
     */
    ToolExecutor.executeTool = function (tool, args, context, options) {
        return __awaiter(this, void 0, void 0, function () {
            var startTime, registry, validation, errorMessage_1, validatedArgs_1, timeout, retries, lastError, attempt, result, executionTime_1, error_2, executionTime, errorMessage, error_3, executionTime;
            var _a, _b, _c, _d, _e, _f, _g;
            return __generator(this, function (_h) {
                switch (_h.label) {
                    case 0:
                        startTime = Date.now();
                        registry = (0, toolRegistry_js_1.getToolRegistry)();
                        _h.label = 1;
                    case 1:
                        _h.trys.push([1, 16, , 17]);
                        validation = toolValidator_js_1.ToolValidator.validateAndApplyDefaults(tool.params, args);
                        if (!validation.valid) {
                            errorMessage_1 = toolValidator_js_1.ToolValidator.formatErrors(validation.errors);
                            return [2 /*return*/, {
                                    success: false,
                                    error: errorMessage_1,
                                }];
                        }
                        validatedArgs_1 = validation.args;
                        if (!((_a = tool.hooks) === null || _a === void 0 ? void 0 : _a.beforeExecute)) return [3 /*break*/, 3];
                        return [4 /*yield*/, tool.hooks.beforeExecute(validatedArgs_1, context)];
                    case 2:
                        _h.sent();
                        _h.label = 3;
                    case 3:
                        timeout = (options === null || options === void 0 ? void 0 : options.timeout) || ((_b = tool.config) === null || _b === void 0 ? void 0 : _b.timeout) || 30000;
                        retries = (_e = (_c = options === null || options === void 0 ? void 0 : options.retries) !== null && _c !== void 0 ? _c : (_d = tool.config) === null || _d === void 0 ? void 0 : _d.retries) !== null && _e !== void 0 ? _e : 0;
                        lastError = null;
                        attempt = 0;
                        _h.label = 4;
                    case 4:
                        if (!(attempt <= retries)) return [3 /*break*/, 13];
                        _h.label = 5;
                    case 5:
                        _h.trys.push([5, 9, , 12]);
                        return [4 /*yield*/, this.executeWithTimeout(function () { return tool.execute(validatedArgs_1, context); }, timeout, options === null || options === void 0 ? void 0 : options.signal)];
                    case 6:
                        result = _h.sent();
                        if (!((_f = tool.hooks) === null || _f === void 0 ? void 0 : _f.afterExecute)) return [3 /*break*/, 8];
                        return [4 /*yield*/, tool.hooks.afterExecute(result, context)];
                    case 7:
                        _h.sent();
                        _h.label = 8;
                    case 8:
                        executionTime_1 = Date.now() - startTime;
                        registry.updateMetrics(tool.id, result.success, executionTime_1);
                        // Adicionar tempo de execução ao resultado
                        return [2 /*return*/, __assign(__assign({}, result), { executionTime: executionTime_1 })];
                    case 9:
                        error_2 = _h.sent();
                        lastError = error_2;
                        attempt++;
                        if (!(attempt <= retries)) return [3 /*break*/, 11];
                        // Aguardar antes de retry (exponential backoff)
                        return [4 /*yield*/, this.sleep(Math.pow(2, attempt) * 1000)];
                    case 10:
                        // Aguardar antes de retry (exponential backoff)
                        _h.sent();
                        _h.label = 11;
                    case 11: return [3 /*break*/, 12];
                    case 12: return [3 /*break*/, 4];
                    case 13:
                        executionTime = Date.now() - startTime;
                        errorMessage = (lastError === null || lastError === void 0 ? void 0 : lastError.message) || 'Erro desconhecido';
                        if (!(((_g = tool.hooks) === null || _g === void 0 ? void 0 : _g.onError) && lastError)) return [3 /*break*/, 15];
                        return [4 /*yield*/, tool.hooks.onError(lastError, context)];
                    case 14:
                        _h.sent();
                        _h.label = 15;
                    case 15:
                        registry.updateMetrics(tool.id, false, executionTime);
                        return [2 /*return*/, {
                                success: false,
                                error: "Falha ap\u00F3s ".concat(attempt, " tentativa(s): ").concat(errorMessage),
                                executionTime: executionTime,
                            }];
                    case 16:
                        error_3 = _h.sent();
                        executionTime = Date.now() - startTime;
                        registry.updateMetrics(tool.id, false, executionTime);
                        return [2 /*return*/, {
                                success: false,
                                error: error_3.message || 'Erro desconhecido',
                                executionTime: executionTime,
                            }];
                    case 17: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Executa uma função com timeout
     */
    ToolExecutor.executeWithTimeout = function (fn, timeout, signal) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) { return __awaiter(_this, void 0, void 0, function () {
                        var timeoutId, abortHandler, result, error_4;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    timeoutId = setTimeout(function () {
                                        reject(new Error("Timeout ap\u00F3s ".concat(timeout, "ms")));
                                    }, timeout);
                                    if (signal) {
                                        abortHandler = function () {
                                            clearTimeout(timeoutId);
                                            reject(new Error('Execução abortada'));
                                        };
                                        signal.addEventListener('abort', abortHandler);
                                    }
                                    _a.label = 1;
                                case 1:
                                    _a.trys.push([1, 3, , 4]);
                                    return [4 /*yield*/, fn()];
                                case 2:
                                    result = _a.sent();
                                    clearTimeout(timeoutId);
                                    if (abortHandler && signal) {
                                        signal.removeEventListener('abort', abortHandler);
                                    }
                                    resolve(result);
                                    return [3 /*break*/, 4];
                                case 3:
                                    error_4 = _a.sent();
                                    clearTimeout(timeoutId);
                                    if (abortHandler && signal) {
                                        signal.removeEventListener('abort', abortHandler);
                                    }
                                    reject(error_4);
                                    return [3 /*break*/, 4];
                                case 4: return [2 /*return*/];
                            }
                        });
                    }); })];
            });
        });
    };
    /**
     * Aguarda um tempo específico
     */
    ToolExecutor.sleep = function (ms) {
        return new Promise(function (resolve) { return setTimeout(resolve, ms); });
    };
    /**
     * Executa múltiplas ferramentas em paralelo
     */
    ToolExecutor.executeMany = function (executions) {
        return __awaiter(this, void 0, void 0, function () {
            var promises;
            var _this = this;
            return __generator(this, function (_a) {
                promises = executions.map(function (exec) {
                    return _this.execute(exec.toolId, exec.args, exec.context, exec.options);
                });
                return [2 /*return*/, Promise.all(promises)];
            });
        });
    };
    /**
     * Executa ferramentas em sequência
     */
    ToolExecutor.executeSequence = function (executions) {
        return __awaiter(this, void 0, void 0, function () {
            var results, _i, executions_1, exec, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        results = [];
                        _i = 0, executions_1 = executions;
                        _a.label = 1;
                    case 1:
                        if (!(_i < executions_1.length)) return [3 /*break*/, 4];
                        exec = executions_1[_i];
                        return [4 /*yield*/, this.execute(exec.toolId, exec.args, exec.context, exec.options)];
                    case 2:
                        result = _a.sent();
                        results.push(result);
                        // Se falhou e não tem retries, parar
                        if (!result.success) {
                            return [3 /*break*/, 4];
                        }
                        _a.label = 3;
                    case 3:
                        _i++;
                        return [3 /*break*/, 1];
                    case 4: return [2 /*return*/, results];
                }
            });
        });
    };
    return ToolExecutor;
}());
exports.ToolExecutor = ToolExecutor;
