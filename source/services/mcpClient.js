"use strict";
/**
 * FLUI - MCP Client
 *
 * Cliente para comunicação com MCPs via JSON-RPC sobre stdio
 * Implementa o Model Context Protocol corretamente
 */
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
exports.MCPClient = void 0;
exports.connectAndExtractTools = connectAndExtractTools;
exports.testMCPConnection = testMCPConnection;
var child_process_1 = require("child_process");
var events_1 = require("events");
/**
 * Cliente MCP que se comunica via JSON-RPC sobre stdio
 */
var MCPClient = /** @class */ (function (_super) {
    __extends(MCPClient, _super);
    function MCPClient() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.process = null;
        _this.messageQueue = [];
        _this.currentId = 0;
        _this.buffer = '';
        _this.initialized = false;
        return _this;
    }
    /**
     * Conecta ao servidor MCP
     */
    MCPClient.prototype.connect = function (command_1) {
        return __awaiter(this, arguments, void 0, function (command, args) {
            var _this = this;
            if (args === void 0) { args = []; }
            return __generator(this, function (_a) {
                console.log("\uD83D\uDD0C [MCPClient] Conectando ao MCP: ".concat(command, " ").concat(args.join(' ')));
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        // Spawn do processo MCP
                        _this.process = (0, child_process_1.spawn)(command, args, {
                            stdio: ['pipe', 'pipe', 'pipe'],
                        });
                        if (!_this.process.stdout || !_this.process.stdin || !_this.process.stderr) {
                            return reject(new Error('Falha ao criar processo MCP'));
                        }
                        // Configurar listeners
                        _this.process.stdout.on('data', function (data) {
                            _this.handleData(data.toString());
                        });
                        _this.process.stderr.on('data', function (data) {
                            var message = data.toString();
                            // Ignorar mensagens informativas do stderr
                            if (!message.includes('running on stdio')) {
                                console.log("\uD83D\uDCDD [MCPClient] stderr: ".concat(message));
                            }
                        });
                        _this.process.on('error', function (error) {
                            console.error('❌ [MCPClient] Erro no processo:', error);
                            reject(error);
                        });
                        _this.process.on('exit', function (code) {
                            console.log("\uD83D\uDD1A [MCPClient] Processo encerrado com c\u00F3digo: ".concat(code));
                        });
                        // Enviar initialize
                        _this.sendRequest('initialize', {
                            protocolVersion: '2024-11-05',
                            capabilities: {},
                            clientInfo: {
                                name: 'flui',
                                version: '1.0.0',
                            },
                        })
                            .then(function (result) {
                            _this.initialized = true;
                            console.log('✅ [MCPClient] Inicializado com sucesso');
                            resolve(result);
                        })
                            .catch(reject);
                    })];
            });
        });
    };
    /**
     * Lista as tools disponíveis no servidor MCP
     */
    MCPClient.prototype.listTools = function () {
        return __awaiter(this, void 0, void 0, function () {
            var result, tools;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.initialized) {
                            throw new Error('MCP não inicializado. Chame connect() primeiro.');
                        }
                        console.log('📋 [MCPClient] Listando tools...');
                        return [4 /*yield*/, this.sendRequest('tools/list', {})];
                    case 1:
                        result = _a.sent();
                        tools = result.tools || [];
                        console.log("\u2705 [MCPClient] ".concat(tools.length, " tools encontradas"));
                        return [2 /*return*/, tools];
                }
            });
        });
    };
    /**
     * Chama uma tool específica
     */
    MCPClient.prototype.callTool = function (name_1) {
        return __awaiter(this, arguments, void 0, function (name, args) {
            var result;
            if (args === void 0) { args = {}; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.initialized) {
                            throw new Error('MCP não inicializado. Chame connect() primeiro.');
                        }
                        console.log("\uD83D\uDD27 [MCPClient] Chamando tool: ".concat(name));
                        return [4 /*yield*/, this.sendRequest('tools/call', {
                                name: name,
                                arguments: args,
                            })];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result];
                }
            });
        });
    };
    /**
     * Desconecta do servidor MCP
     */
    MCPClient.prototype.disconnect = function () {
        if (this.process) {
            this.process.kill();
            this.process = null;
            this.initialized = false;
            console.log('🔌 [MCPClient] Desconectado');
        }
    };
    /**
     * Envia uma requisição JSON-RPC
     */
    MCPClient.prototype.sendRequest = function (method, params) {
        return __awaiter(this, void 0, void 0, function () {
            var id, request;
            var _this = this;
            return __generator(this, function (_a) {
                if (!this.process || !this.process.stdin) {
                    throw new Error('Processo MCP não está rodando');
                }
                id = ++this.currentId;
                request = {
                    jsonrpc: '2.0',
                    id: id,
                    method: method,
                    params: params,
                };
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        // Adicionar à fila
                        _this.messageQueue.push({ id: id, resolve: resolve, reject: reject });
                        // Enviar requisição
                        var message = JSON.stringify(request) + '\n';
                        _this.process.stdin.write(message);
                        // Timeout de 30s
                        setTimeout(function () {
                            var index = _this.messageQueue.findIndex(function (item) { return item.id === id; });
                            if (index !== -1) {
                                _this.messageQueue.splice(index, 1);
                                reject(new Error("Timeout ao aguardar resposta do m\u00E9todo ".concat(method)));
                            }
                        }, 30000);
                    })];
            });
        });
    };
    /**
     * Processa dados recebidos do stdout
     */
    MCPClient.prototype.handleData = function (data) {
        this.buffer += data;
        // Processar mensagens completas (separadas por \n)
        var lines = this.buffer.split('\n');
        this.buffer = lines.pop() || ''; // Manter linha incompleta no buffer
        for (var _i = 0, lines_1 = lines; _i < lines_1.length; _i++) {
            var line = lines_1[_i];
            if (!line.trim())
                continue;
            try {
                var message = JSON.parse(line);
                this.handleMessage(message);
            }
            catch (error) {
                console.error('❌ [MCPClient] Erro ao parsear mensagem:', line);
            }
        }
    };
    /**
     * Processa uma mensagem JSON-RPC
     */
    MCPClient.prototype.handleMessage = function (message) {
        // Resposta a uma requisição
        if (message.id !== undefined) {
            var queueItem = this.messageQueue.find(function (item) { return item.id === message.id; });
            if (queueItem) {
                // Remover da fila
                var index = this.messageQueue.indexOf(queueItem);
                this.messageQueue.splice(index, 1);
                // Resolver ou rejeitar
                if (message.error) {
                    queueItem.reject(new Error(message.error.message || 'Erro MCP'));
                }
                else {
                    queueItem.resolve(message.result);
                }
            }
        }
        // Notificação (não tem id)
        else if (message.method) {
            this.emit('notification', message);
        }
    };
    return MCPClient;
}(events_1.EventEmitter));
exports.MCPClient = MCPClient;
/**
 * Conecta a um MCP via NPX e extrai suas tools
 */
function connectAndExtractTools(packageName) {
    return __awaiter(this, void 0, void 0, function () {
        var client, initResult, tools;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    client = new MCPClient();
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, , 4, 5]);
                    return [4 /*yield*/, client.connect('npx', ['-y', packageName])];
                case 2:
                    initResult = _a.sent();
                    return [4 /*yield*/, client.listTools()];
                case 3:
                    tools = _a.sent();
                    return [2 /*return*/, {
                            serverInfo: initResult.serverInfo,
                            tools: tools,
                        }];
                case 4:
                    // Sempre desconectar
                    client.disconnect();
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    });
}
/**
 * Testa a conexão com um MCP
 */
function testMCPConnection(packageName) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, serverInfo, tools, error_1;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, connectAndExtractTools(packageName)];
                case 1:
                    _a = _b.sent(), serverInfo = _a.serverInfo, tools = _a.tools;
                    return [2 /*return*/, {
                            success: true,
                            message: "Conectado ao ".concat(serverInfo.name, " v").concat(serverInfo.version),
                            toolCount: tools.length,
                        }];
                case 2:
                    error_1 = _b.sent();
                    return [2 /*return*/, {
                            success: false,
                            message: error_1.message,
                            toolCount: 0,
                        }];
                case 3: return [2 /*return*/];
            }
        });
    });
}
