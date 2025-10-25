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
exports.LLM = exports.listModels = exports.sendMessage = exports.getLLMClient = exports.initializeLLM = void 0;
var openai_1 = require("openai");
var store_js_1 = require("../store/store.js");
var toolRegistry_js_1 = require("../core/toolRegistry.js");
var toolExecutor_js_1 = require("../core/toolExecutor.js");
var openaiClient = null;
var initializeLLM = function (endpoint, apiKey) {
    openaiClient = new openai_1.default({
        baseURL: endpoint,
        apiKey: apiKey,
    });
};
exports.initializeLLM = initializeLLM;
var getLLMClient = function () {
    return openaiClient;
};
exports.getLLMClient = getLLMClient;
/**
 * Converte tools do FLUI para formato OpenAI Function Calling
 */
function convertToolToOpenAIFunction(tool) {
    var properties = {};
    var required = [];
    // Converter parâmetros
    tool.params.forEach(function (param) {
        properties[param.key || param.name] = __assign(__assign({ type: param.type === 'number' ? 'number' :
                param.type === 'boolean' ? 'boolean' :
                    param.type === 'array' ? 'array' :
                        param.type === 'object' ? 'object' : 'string', description: param.description || '' }, (param.enum ? { enum: param.enum } : {})), (param.items ? { items: param.items } : {}));
        if (param.required) {
            required.push(param.key || param.name);
        }
    });
    return {
        type: 'function',
        function: {
            name: tool.id,
            description: tool.description || tool.name,
            parameters: {
                type: 'object',
                properties: properties,
                required: required,
            },
        },
    };
}
/**
 * Executa uma tool chamada pela LLM (FLUI Tool ou MCP Tool)
 */
function executeToolCall(toolCall, context) {
    return __awaiter(this, void 0, void 0, function () {
        var toolName, args, _a, mcpId, mcpToolName, MCPExecutor, result_1, result;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    toolName = toolCall.function.name;
                    args = JSON.parse(toolCall.function.arguments);
                    console.log("\uD83D\uDD27 [LLM] Executando tool: ".concat(toolName), args);
                    if (!toolName.includes('__')) return [3 /*break*/, 3];
                    _a = toolName.split('__'), mcpId = _a[0], mcpToolName = _a[1];
                    console.log("\uD83D\uDCE6 [LLM] Tool MCP detectada: ".concat(mcpToolName, " do MCP ").concat(mcpId));
                    return [4 /*yield*/, Promise.resolve().then(function () { return require('./mcpExecutor.js'); })];
                case 1:
                    MCPExecutor = (_b.sent()).MCPExecutor;
                    return [4 /*yield*/, MCPExecutor.executeMCPTool(mcpId, mcpToolName, args, context)];
                case 2:
                    result_1 = _b.sent();
                    if (!result_1.success) {
                        throw new Error(result_1.error || 'MCP Tool execution failed');
                    }
                    return [2 /*return*/, result_1.result];
                case 3: return [4 /*yield*/, toolExecutor_js_1.ToolExecutor.execute(toolName, args, context)];
                case 4:
                    result = _b.sent();
                    if (!result.success) {
                        throw new Error(result.error || 'Tool execution failed');
                    }
                    return [2 /*return*/, result.result];
            }
        });
    });
}
var sendMessage = function (content, agent, context) { return __awaiter(void 0, void 0, void 0, function () {
    var store, config, needsApiKey, messages, openaiMessages, tools, registry, _i, _a, toolId, tool, _loop_1, _b, _c, mcpId, model, temperature, currentMessages, iterationCount, maxIterations, requestParams, response, message, _d, _e, toolCall, toolResult, error_1, content_1, result, lastMessage, lastContent, error_2;
    var _f, _g, _h, _j, _k, _l, _m, _o, _p;
    return __generator(this, function (_q) {
        switch (_q.label) {
            case 0:
                store = store_js_1.useStore.getState();
                config = store.config;
                needsApiKey = ((_f = config === null || config === void 0 ? void 0 : config.llm) === null || _f === void 0 ? void 0 : _f.endpoint) && !config.llm.endpoint.includes('llm7.io');
                if (!config || !config.llm) {
                    throw new Error('LLM não configurado. Use /settings para configurar.');
                }
                if (needsApiKey && !config.llm.apiKey) {
                    throw new Error('API Key é obrigatória para este endpoint. Configure em /settings.');
                }
                if (!openaiClient) {
                    (0, exports.initializeLLM)(config.llm.endpoint, config.llm.apiKey || '');
                }
                if (!openaiClient) {
                    throw new Error('Falha ao inicializar cliente LLM');
                }
                messages = store.messages.slice(-10);
                openaiMessages = messages.map(function (msg) { return ({
                    role: msg.role === 'agent' ? 'assistant' : msg.role,
                    content: msg.content,
                }); });
                // Adicionar system prompt do agente se houver
                if (agent) {
                    openaiMessages.unshift({
                        role: 'system',
                        content: agent.systemPrompt,
                    });
                }
                // Adicionar mensagem do usuário
                openaiMessages.push({
                    role: 'user',
                    content: content,
                });
                tools = [];
                registry = (0, toolRegistry_js_1.getToolRegistry)();
                if (agent) {
                    // ✅ 1. Carregar FLUI Tools (tools do registry)
                    if (agent.tools && agent.tools.length > 0) {
                        console.log("\uD83D\uDD27 [LLM] Carregando ".concat(agent.tools.length, " FLUI tools para o agente ").concat(agent.name));
                        for (_i = 0, _a = agent.tools; _i < _a.length; _i++) {
                            toolId = _a[_i];
                            tool = registry.get(toolId);
                            if (tool) {
                                tools.push(convertToolToOpenAIFunction(tool));
                                console.log("  \u2705 FLUI Tool carregada: ".concat(tool.name, " (").concat(tool.id, ")"));
                            }
                            else {
                                console.warn("  \u26A0\uFE0F  FLUI Tool n\u00E3o encontrada: ".concat(toolId));
                            }
                        }
                    }
                    // ✅ 2. Carregar MCP Tools (tools dos MCPs associados)
                    if (agent.mcpIds && agent.mcpIds.length > 0) {
                        console.log("\uD83D\uDD27 [LLM] Carregando tools de ".concat(agent.mcpIds.length, " MCPs para o agente ").concat(agent.name));
                        _loop_1 = function (mcpId) {
                            var mcp = store.mcps.find(function (m) { return m.id === mcpId; });
                            if (mcp && mcp.tools) {
                                console.log("  \uD83D\uDCE6 MCP: ".concat(mcp.name, " (").concat(mcp.tools.length, " tools)"));
                                for (var _r = 0, _s = mcp.tools; _r < _s.length; _r++) {
                                    var mcpTool = _s[_r];
                                    // Converter tool MCP para formato OpenAI
                                    var openAITool = {
                                        type: 'function',
                                        function: {
                                            name: "".concat(mcpId, "__").concat(mcpTool.name), // Prefixo com MCP ID para evitar conflitos
                                            description: mcpTool.description || mcpTool.name,
                                            parameters: mcpTool.parameters || {
                                                type: 'object',
                                                properties: {},
                                                required: []
                                            }
                                        }
                                    };
                                    tools.push(openAITool);
                                    console.log("    \u2705 MCP Tool carregada: ".concat(mcpTool.name, " (").concat(mcp.name, ")"));
                                }
                            }
                            else {
                                console.warn("  \u26A0\uFE0F  MCP n\u00E3o encontrado: ".concat(mcpId));
                            }
                        };
                        for (_b = 0, _c = agent.mcpIds; _b < _c.length; _b++) {
                            mcpId = _c[_b];
                            _loop_1(mcpId);
                        }
                    }
                    if (tools.length > 0) {
                        console.log("\uD83C\uDFAF [LLM] Total de ".concat(tools.length, " tools dispon\u00EDveis para o agente"));
                    }
                }
                model = (agent === null || agent === void 0 ? void 0 : agent.model) || config.llm.model;
                temperature = (_g = agent === null || agent === void 0 ? void 0 : agent.temperature) !== null && _g !== void 0 ? _g : config.llm.temperature;
                _q.label = 1;
            case 1:
                _q.trys.push([1, 12, , 13]);
                currentMessages = __spreadArray([], openaiMessages, true);
                iterationCount = 0;
                maxIterations = 10;
                _q.label = 2;
            case 2:
                if (!(iterationCount < maxIterations)) return [3 /*break*/, 11];
                iterationCount++;
                console.log("\uD83D\uDD04 [LLM] Itera\u00E7\u00E3o ".concat(iterationCount, "/").concat(maxIterations));
                requestParams = {
                    model: model,
                    messages: currentMessages,
                    temperature: temperature,
                    max_tokens: config.llm.maxTokens,
                };
                // Adicionar tools se disponíveis
                if (tools.length > 0) {
                    requestParams.tools = tools;
                    requestParams.tool_choice = 'auto';
                }
                console.log("\uD83D\uDCE4 [LLM] Enviando request para: ".concat(config.llm.endpoint));
                console.log("\uD83D\uDCE4 [LLM] Model: ".concat(model, ", Messages: ").concat(currentMessages.length, ", Tools: ").concat(tools.length));
                return [4 /*yield*/, openaiClient.chat.completions.create(requestParams)];
            case 3:
                response = _q.sent();
                console.log("\uD83D\uDCE5 [LLM] Resposta recebida:", {
                    finishReason: (_h = response.choices[0]) === null || _h === void 0 ? void 0 : _h.finish_reason,
                    hasToolCalls: !!((_k = (_j = response.choices[0]) === null || _j === void 0 ? void 0 : _j.message) === null || _k === void 0 ? void 0 : _k.tool_calls),
                    toolCallsCount: ((_o = (_m = (_l = response.choices[0]) === null || _l === void 0 ? void 0 : _l.message) === null || _m === void 0 ? void 0 : _m.tool_calls) === null || _o === void 0 ? void 0 : _o.length) || 0,
                });
                message = (_p = response.choices[0]) === null || _p === void 0 ? void 0 : _p.message;
                if (!message) {
                    throw new Error('Sem resposta do modelo');
                }
                // Adicionar mensagem do assistente ao histórico
                currentMessages.push(message);
                if (!(message.tool_calls && message.tool_calls.length > 0)) return [3 /*break*/, 10];
                console.log("\uD83D\uDD27 [LLM] ".concat(message.tool_calls.length, " tool call(s) detectada(s)"), message.tool_calls.map(function (tc) { return tc.function.name; }));
                _d = 0, _e = message.tool_calls;
                _q.label = 4;
            case 4:
                if (!(_d < _e.length)) return [3 /*break*/, 9];
                toolCall = _e[_d];
                _q.label = 5;
            case 5:
                _q.trys.push([5, 7, , 8]);
                return [4 /*yield*/, executeToolCall(toolCall, context || {
                        automationId: 'chat',
                        nodeId: 'chat-node',
                        previousResults: {},
                        globalContext: {},
                    })];
            case 6:
                toolResult = _q.sent();
                // Adicionar resultado da tool ao histórico
                currentMessages.push({
                    role: 'tool',
                    tool_call_id: toolCall.id,
                    content: JSON.stringify(toolResult),
                });
                console.log("\u2705 [LLM] Tool executada: ".concat(toolCall.function.name));
                return [3 /*break*/, 8];
            case 7:
                error_1 = _q.sent();
                console.error("\u274C [LLM] Erro ao executar tool ".concat(toolCall.function.name, ":"), error_1);
                // Adicionar erro ao histórico
                currentMessages.push({
                    role: 'tool',
                    tool_call_id: toolCall.id,
                    content: JSON.stringify({ error: error_1.message }),
                });
                return [3 /*break*/, 8];
            case 8:
                _d++;
                return [3 /*break*/, 4];
            case 9: 
            // Continuar o loop para obter resposta final
            return [3 /*break*/, 2];
            case 10:
                // Se chegou aqui, não há mais tool calls - retornar resposta final
                console.log("\u2705 [LLM] Resposta final recebida ap\u00F3s ".concat(iterationCount, " itera\u00E7\u00F5es"));
                content_1 = message.content;
                if (typeof content_1 === 'string') {
                    console.log("\uD83D\uDCAC [LLM] Conte\u00FAdo: ".concat(content_1.substring(0, 100)).concat(content_1.length > 100 ? '...' : ''));
                    return [2 /*return*/, content_1];
                }
                else if (content_1 && Array.isArray(content_1)) {
                    result = content_1.map(function (part) {
                        return typeof part === 'string' ? part :
                            'text' in part ? part.text : '';
                    }).join('');
                    console.log("\uD83D\uDCAC [LLM] Conte\u00FAdo array: ".concat(result.substring(0, 100)).concat(result.length > 100 ? '...' : ''));
                    return [2 /*return*/, result];
                }
                console.warn("\u26A0\uFE0F  [LLM] Sem conte\u00FAdo na resposta");
                return [2 /*return*/, 'Sem resposta do modelo.'];
            case 11:
                // Se chegou aqui, atingiu limite de iterações
                console.warn("\u26A0\uFE0F  [LLM] Limite de itera\u00E7\u00F5es atingido (".concat(maxIterations, ")"));
                lastMessage = currentMessages[currentMessages.length - 1];
                lastContent = lastMessage === null || lastMessage === void 0 ? void 0 : lastMessage.content;
                if (typeof lastContent === 'string') {
                    return [2 /*return*/, lastContent];
                }
                else if (lastContent && Array.isArray(lastContent)) {
                    return [2 /*return*/, lastContent.map(function (part) {
                            return typeof part === 'string' ? part :
                                'text' in part ? part.text : '';
                        }).join('')];
                }
                return [2 /*return*/, 'Limite de iterações atingido.'];
            case 12:
                error_2 = _q.sent();
                console.error('❌ [LLM] Erro:', error_2);
                console.error('❌ [LLM] Error details:', {
                    message: error_2.message,
                    status: error_2.status,
                    code: error_2.code,
                });
                if (error_2.stack) {
                    console.error('❌ [LLM] Stack:', error_2.stack);
                }
                throw new Error("Erro ao comunicar com LLM: ".concat(error_2.message));
            case 13: return [2 /*return*/];
        }
    });
}); };
exports.sendMessage = sendMessage;
var listModels = function () { return __awaiter(void 0, void 0, void 0, function () {
    var store, config, response, error_3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                store = store_js_1.useStore.getState();
                config = store.config;
                if (!config || !config.llm.apiKey) {
                    throw new Error('LLM não configurado.');
                }
                if (!openaiClient) {
                    (0, exports.initializeLLM)(config.llm.endpoint, config.llm.apiKey);
                }
                if (!openaiClient) {
                    throw new Error('Falha ao inicializar cliente LLM');
                }
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                return [4 /*yield*/, openaiClient.models.list()];
            case 2:
                response = _a.sent();
                return [2 /*return*/, response.data.map(function (model) { return model.id; })];
            case 3:
                error_3 = _a.sent();
                throw new Error("Erro ao listar modelos: ".concat(error_3.message));
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.listModels = listModels;
// Export LLM object for easy import
exports.LLM = {
    initialize: exports.initializeLLM,
    getClient: exports.getLLMClient,
    chat: function (messages) { return __awaiter(void 0, void 0, void 0, function () {
        var store, config, response;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    store = store_js_1.useStore.getState();
                    config = store.config;
                    if (!config || !config.llm) {
                        throw new Error('LLM não configurado');
                    }
                    if (!openaiClient) {
                        (0, exports.initializeLLM)(config.llm.endpoint, config.llm.apiKey || '');
                    }
                    if (!openaiClient) {
                        throw new Error('Falha ao inicializar cliente LLM');
                    }
                    return [4 /*yield*/, openaiClient.chat.completions.create({
                            model: config.llm.model,
                            messages: messages,
                            temperature: config.llm.temperature,
                            max_tokens: config.llm.maxTokens,
                        })];
                case 1:
                    response = _c.sent();
                    return [2 /*return*/, {
                            content: ((_b = (_a = response.choices[0]) === null || _a === void 0 ? void 0 : _a.message) === null || _b === void 0 ? void 0 : _b.content) || '',
                            model: response.model,
                        }];
            }
        });
    }); },
    sendMessage: exports.sendMessage,
    listModels: exports.listModels,
};
