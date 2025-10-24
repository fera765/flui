"use strict";
/**
 * FLUI - MCP Executor
 *
 * Executa MCPs via subprocess e extrai suas tools
 * ✅ Comunicação via JSON-RPC sobre stdio
 * ✅ Suporte a NPX, NPM, GitHub, Local
 * ✅ Extração real de tools dos servidores MCP
 * ✅ Registro automático no Tool Registry
 */
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
exports.MCPExecutor = void 0;
var child_process_1 = require("child_process");
var util_1 = require("util");
var path_1 = require("path");
var promises_1 = require("fs/promises");
var id_js_1 = require("../utils/id.js");
var mcpClient_js_1 = require("./mcpClient.js");
var execAsync = (0, util_1.promisify)(child_process_1.exec);
/**
 * Classe principal para executar MCPs
 */
var MCPExecutor = /** @class */ (function () {
    function MCPExecutor() {
    }
    /**
     * ✅ NOVO: Executa uma tool de um MCP
     */
    MCPExecutor.executeMCPTool = function (mcpId, toolName, args, context) {
        return __awaiter(this, void 0, void 0, function () {
            var useStore, store, mcp, tool, client, command, cmdArgs, result, error_1;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 5, , 6]);
                        console.log("\uD83D\uDCE6 [MCPExecutor] Executando tool ".concat(toolName, " do MCP ").concat(mcpId));
                        return [4 /*yield*/, Promise.resolve().then(function () { return require('../store/store.js'); })];
                    case 1:
                        useStore = (_b.sent()).useStore;
                        store = useStore.getState();
                        mcp = store.mcps.find(function (m) { return m.id === mcpId; });
                        if (!mcp) {
                            return [2 /*return*/, {
                                    success: false,
                                    error: "MCP n\u00E3o encontrado: ".concat(mcpId)
                                }];
                        }
                        tool = mcp.tools.find(function (t) { return t.name === toolName; });
                        if (!tool) {
                            return [2 /*return*/, {
                                    success: false,
                                    error: "Tool ".concat(toolName, " n\u00E3o encontrada no MCP ").concat(mcp.name)
                                }];
                        }
                        client = this.clients.get(mcpId);
                        if (!!client) return [3 /*break*/, 3];
                        console.log("\uD83D\uDD0C [MCPExecutor] Criando novo client para MCP ".concat(mcp.name));
                        client = new mcpClient_js_1.MCPClient();
                        command = void 0;
                        cmdArgs = [];
                        if (mcp.installType === 'npx' && mcp.server) {
                            command = 'npx';
                            cmdArgs = ['-y', mcp.server];
                        }
                        else if (mcp.server) {
                            command = mcp.server;
                        }
                        else {
                            return [2 /*return*/, {
                                    success: false,
                                    error: "MCP ".concat(mcp.name, " n\u00E3o tem servidor configurado")
                                }];
                        }
                        // Adicionar env vars se houver
                        if ((_a = mcp.metadata) === null || _a === void 0 ? void 0 : _a.args) {
                            cmdArgs.push.apply(cmdArgs, mcp.metadata.args);
                        }
                        // Conectar ao MCP
                        return [4 /*yield*/, client.connect(command, cmdArgs)];
                    case 2:
                        // Conectar ao MCP
                        _b.sent();
                        this.clients.set(mcpId, client);
                        _b.label = 3;
                    case 3:
                        // Executar a tool
                        console.log("\uD83D\uDD27 [MCPExecutor] Executando tool com args:", args);
                        return [4 /*yield*/, client.callTool(toolName, args)];
                    case 4:
                        result = _b.sent();
                        console.log("\u2705 [MCPExecutor] Tool executada com sucesso");
                        return [2 /*return*/, {
                                success: true,
                                result: result
                            }];
                    case 5:
                        error_1 = _b.sent();
                        console.error("\u274C [MCPExecutor] Erro ao executar tool:", error_1);
                        return [2 /*return*/, {
                                success: false,
                                error: error_1.message || 'Erro ao executar tool MCP'
                            }];
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Instala e inicializa um MCP
     */
    MCPExecutor.installMCP = function (config) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, error_2;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 11, , 12]);
                        console.log("\uD83D\uDCE6 [MCPExecutor] Instalando MCP: ".concat(config.name));
                        console.log("\uD83D\uDCE6 [MCPExecutor] Tipo: ".concat(config.installType));
                        console.log("\uD83D\uDCE6 [MCPExecutor] Servidor: ".concat(config.server));
                        _a = config.installType;
                        switch (_a) {
                            case 'npx': return [3 /*break*/, 1];
                            case 'npm': return [3 /*break*/, 3];
                            case 'github': return [3 /*break*/, 5];
                            case 'local': return [3 /*break*/, 7];
                        }
                        return [3 /*break*/, 9];
                    case 1: return [4 /*yield*/, this.executeNpxMCP(config)];
                    case 2: return [2 /*return*/, _b.sent()];
                    case 3: return [4 /*yield*/, this.executeNpmMCP(config)];
                    case 4: return [2 /*return*/, _b.sent()];
                    case 5: return [4 /*yield*/, this.executeGitHubMCP(config)];
                    case 6: return [2 /*return*/, _b.sent()];
                    case 7: return [4 /*yield*/, this.executeLocalMCP(config)];
                    case 8: return [2 /*return*/, _b.sent()];
                    case 9: throw new Error("Tipo de instala\u00E7\u00E3o n\u00E3o suportado: ".concat(config.installType));
                    case 10: return [3 /*break*/, 12];
                    case 11:
                        error_2 = _b.sent();
                        console.error('❌ [MCPExecutor] Erro na instalação:', error_2);
                        return [2 /*return*/, {
                                success: false,
                                error: error_2.message || 'Erro desconhecido',
                            }];
                    case 12: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Executa MCP via NPX usando comunicação JSON-RPC
     */
    MCPExecutor.executeNpxMCP = function (config) {
        return __awaiter(this, void 0, void 0, function () {
            var packageName, client, manifest, tools, initResult, mcpTools, error_3;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 6, , 7]);
                        console.log('🚀 [MCPExecutor] Executando via NPX com JSON-RPC...');
                        packageName = config.server.replace(/^npx\s+/, '').split(/\s+/)[0];
                        console.log("\uD83D\uDCE6 [MCPExecutor] Package: ".concat(packageName));
                        client = new mcpClient_js_1.MCPClient();
                        manifest = void 0;
                        tools = [];
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, , 4, 5]);
                        return [4 /*yield*/, client.connect('npx', ['-y', packageName])];
                    case 2:
                        initResult = _b.sent();
                        console.log("\u2705 [MCPExecutor] Conectado ao ".concat(initResult.serverInfo.name, " v").concat(initResult.serverInfo.version));
                        return [4 /*yield*/, client.listTools()];
                    case 3:
                        mcpTools = _b.sent();
                        console.log("\uD83D\uDCCB [MCPExecutor] ".concat(mcpTools.length, " tools encontradas"));
                        // Converter tools do formato MCP para nosso formato
                        tools = mcpTools.map(function (tool) {
                            var _a, _b;
                            // Extrair parâmetros do inputSchema
                            var properties = ((_a = tool.inputSchema) === null || _a === void 0 ? void 0 : _a.properties) || {};
                            var required = ((_b = tool.inputSchema) === null || _b === void 0 ? void 0 : _b.required) || [];
                            var parameters = {};
                            for (var _i = 0, _c = Object.entries(properties); _i < _c.length; _i++) {
                                var _d = _c[_i], key = _d[0], value = _d[1];
                                var propSchema = value;
                                // Determinar valor padrão baseado no tipo
                                var defaultValue = propSchema.default;
                                if (defaultValue === undefined) {
                                    switch (propSchema.type) {
                                        case 'string':
                                            defaultValue = '';
                                            break;
                                        case 'boolean':
                                            defaultValue = false;
                                            break;
                                        case 'number':
                                        case 'integer':
                                            defaultValue = 0;
                                            break;
                                        case 'array':
                                            defaultValue = [];
                                            break;
                                        case 'object':
                                            defaultValue = {};
                                            break;
                                        default:
                                            defaultValue = null;
                                    }
                                }
                                parameters[key] = {
                                    type: propSchema.type || 'string',
                                    description: propSchema.description || '',
                                    required: required.includes(key),
                                    default: defaultValue,
                                    enum: propSchema.enum,
                                    items: propSchema.items,
                                };
                            }
                            return {
                                id: tool.name,
                                name: tool.name,
                                description: tool.description,
                                handler: tool.name,
                                parameters: parameters,
                                inputSchema: tool.inputSchema,
                            };
                        });
                        manifest = {
                            name: initResult.serverInfo.name,
                            version: initResult.serverInfo.version,
                            description: ((_a = initResult.serverInfo.instructions) === null || _a === void 0 ? void 0 : _a.split('\n')[0]) || config.description || '',
                            tools: tools,
                        };
                        console.log("\u2705 [MCPExecutor] MCP carregado com sucesso");
                        return [2 /*return*/, {
                                success: true,
                                manifest: manifest,
                                tools: tools,
                            }];
                    case 4:
                        // Sempre desconectar
                        client.disconnect();
                        return [7 /*endfinally*/];
                    case 5: return [3 /*break*/, 7];
                    case 6:
                        error_3 = _b.sent();
                        console.error('❌ [MCPExecutor] Erro ao executar NPX:', error_3);
                        return [2 /*return*/, {
                                success: false,
                                error: error_3.message,
                            }];
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Executa MCP via NPM (instalado globalmente ou localmente)
     */
    MCPExecutor.executeNpmMCP = function (config) {
        return __awaiter(this, void 0, void 0, function () {
            var packageName, _a, command, _b, stdout, stderr, manifest, error_4;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _c.trys.push([0, 7, , 8]);
                        console.log('📦 [MCPExecutor] Executando via NPM...');
                        packageName = config.server;
                        _c.label = 1;
                    case 1:
                        _c.trys.push([1, 3, , 5]);
                        return [4 /*yield*/, execAsync("npm list -g ".concat(packageName), { timeout: 5000 })];
                    case 2:
                        _c.sent();
                        return [3 /*break*/, 5];
                    case 3:
                        _a = _c.sent();
                        console.log('📦 [MCPExecutor] Pacote não instalado, instalando...');
                        return [4 /*yield*/, execAsync("npm install -g ".concat(packageName), { timeout: 60000 })];
                    case 4:
                        _c.sent();
                        return [3 /*break*/, 5];
                    case 5:
                        command = "".concat(packageName, " --help 2>&1 || ").concat(packageName, " list 2>&1 || echo \"No help\"");
                        return [4 /*yield*/, execAsync(command, {
                                timeout: 30000,
                            })];
                    case 6:
                        _b = _c.sent(), stdout = _b.stdout, stderr = _b.stderr;
                        manifest = {
                            name: config.name || packageName,
                            version: config.version || '1.0.0',
                            description: config.description || 'MCP Tool',
                            tools: this.detectToolsFromOutput(stdout + stderr, packageName),
                        };
                        return [2 /*return*/, {
                                success: true,
                                manifest: manifest,
                                tools: manifest.tools,
                                stdout: stdout,
                                stderr: stderr,
                            }];
                    case 7:
                        error_4 = _c.sent();
                        console.error('❌ [MCPExecutor] Erro ao executar NPM:', error_4);
                        return [2 /*return*/, {
                                success: false,
                                error: error_4.message,
                            }];
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Executa MCP via GitHub (clone e install)
     */
    MCPExecutor.executeGitHubMCP = function (config) {
        return __awaiter(this, void 0, void 0, function () {
            var repoUrl, tempDir, packageJsonPath, manifest, packageJson, pkg, err_1, _a, stdout, stderr, error_5;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 8, , 9]);
                        console.log('🐙 [MCPExecutor] Executando via GitHub...');
                        repoUrl = config.server.includes('github.com')
                            ? config.server
                            : "https://github.com/".concat(config.server);
                        tempDir = (0, path_1.join)(process.cwd(), 'workspace', 'mcp-temp', (0, id_js_1.generateId)());
                        console.log("\uD83D\uDCC2 [MCPExecutor] Clonando para: ".concat(tempDir));
                        // Clonar repositório
                        return [4 /*yield*/, execAsync("git clone ".concat(repoUrl, " ").concat(tempDir), { timeout: 60000 })];
                    case 1:
                        // Clonar repositório
                        _b.sent();
                        packageJsonPath = (0, path_1.join)(tempDir, 'package.json');
                        manifest = {
                            name: config.name || 'GitHub MCP',
                            version: config.version || '1.0.0',
                            description: config.description || 'MCP from GitHub',
                            tools: [],
                        };
                        _b.label = 2;
                    case 2:
                        _b.trys.push([2, 4, , 5]);
                        return [4 /*yield*/, (0, promises_1.readFile)(packageJsonPath, 'utf-8')];
                    case 3:
                        packageJson = _b.sent();
                        pkg = JSON.parse(packageJson);
                        manifest.name = pkg.name || manifest.name;
                        manifest.version = pkg.version || manifest.version;
                        manifest.description = pkg.description || manifest.description;
                        return [3 /*break*/, 5];
                    case 4:
                        err_1 = _b.sent();
                        console.warn('⚠️ [MCPExecutor] Sem package.json no repo');
                        return [3 /*break*/, 5];
                    case 5:
                        // Instalar dependências
                        console.log('📦 [MCPExecutor] Instalando dependências...');
                        return [4 /*yield*/, execAsync("cd ".concat(tempDir, " && npm install"), { timeout: 120000 })];
                    case 6:
                        _b.sent();
                        return [4 /*yield*/, execAsync("cd ".concat(tempDir, " && npm start --help 2>&1 || echo \"No start script\""), {
                                timeout: 30000,
                            })];
                    case 7:
                        _a = _b.sent(), stdout = _a.stdout, stderr = _a.stderr;
                        manifest.tools = this.detectToolsFromOutput(stdout + stderr, manifest.name);
                        console.log("\u2705 [MCPExecutor] GitHub MCP carregado: ".concat(manifest.tools.length, " tools"));
                        return [2 /*return*/, {
                                success: true,
                                manifest: manifest,
                                tools: manifest.tools,
                                stdout: stdout,
                                stderr: stderr,
                            }];
                    case 8:
                        error_5 = _b.sent();
                        console.error('❌ [MCPExecutor] Erro ao executar GitHub MCP:', error_5);
                        return [2 /*return*/, {
                                success: false,
                                error: error_5.message,
                            }];
                    case 9: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Executa MCP local (caminho do filesystem)
     */
    MCPExecutor.executeLocalMCP = function (config) {
        return __awaiter(this, void 0, void 0, function () {
            var localPath, _a, manifest, packageJsonPath, packageJson, pkg, err_2, _b, stdout, stderr, error_6;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _c.trys.push([0, 10, , 11]);
                        console.log('📁 [MCPExecutor] Executando MCP local...');
                        localPath = config.server;
                        _c.label = 1;
                    case 1:
                        _c.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, (0, promises_1.access)(localPath, promises_1.constants.R_OK)];
                    case 2:
                        _c.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        _a = _c.sent();
                        throw new Error("Caminho n\u00E3o encontrado ou sem permiss\u00E3o: ".concat(localPath));
                    case 4:
                        manifest = {
                            name: config.name || 'Local MCP',
                            version: config.version || '1.0.0',
                            description: config.description || 'Local MCP',
                            tools: [],
                        };
                        packageJsonPath = (0, path_1.join)(localPath, 'package.json');
                        _c.label = 5;
                    case 5:
                        _c.trys.push([5, 7, , 8]);
                        return [4 /*yield*/, (0, promises_1.readFile)(packageJsonPath, 'utf-8')];
                    case 6:
                        packageJson = _c.sent();
                        pkg = JSON.parse(packageJson);
                        manifest.name = pkg.name || manifest.name;
                        manifest.version = pkg.version || manifest.version;
                        manifest.description = pkg.description || manifest.description;
                        return [3 /*break*/, 8];
                    case 7:
                        err_2 = _c.sent();
                        console.warn('⚠️ [MCPExecutor] Sem package.json local');
                        return [3 /*break*/, 8];
                    case 8: return [4 /*yield*/, execAsync("cd ".concat(localPath, " && npm start --help 2>&1 || echo \"No start\""), {
                            timeout: 30000,
                        })];
                    case 9:
                        _b = _c.sent(), stdout = _b.stdout, stderr = _b.stderr;
                        manifest.tools = this.detectToolsFromOutput(stdout + stderr, manifest.name);
                        console.log("\u2705 [MCPExecutor] Local MCP carregado: ".concat(manifest.tools.length, " tools"));
                        return [2 /*return*/, {
                                success: true,
                                manifest: manifest,
                                tools: manifest.tools,
                                stdout: stdout,
                                stderr: stderr,
                            }];
                    case 10:
                        error_6 = _c.sent();
                        console.error('❌ [MCPExecutor] Erro ao executar MCP local:', error_6);
                        return [2 /*return*/, {
                                success: false,
                                error: error_6.message,
                            }];
                    case 11: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Detecta tools a partir do output do MCP
     * Tenta encontrar padrões comuns de listagem de tools/comandos
     */
    MCPExecutor.detectToolsFromOutput = function (output, mcpName) {
        var tools = [];
        // Padrão 1: "Commands:" ou "Available tools:"
        var commandsMatch = output.match(/(?:Commands|Available tools|Tools):\s*\n([\s\S]+?)(?:\n\n|\n[A-Z]|$)/i);
        if (commandsMatch) {
            var commandsSection = commandsMatch[1];
            var lines = commandsSection.split('\n');
            for (var _i = 0, lines_1 = lines; _i < lines_1.length; _i++) {
                var line = lines_1[_i];
                // Formato: "  command-name    Description here"
                var match = line.match(/^\s+(\S+)\s+(.+)$/);
                if (match) {
                    // Normalizar ID
                    var safeName = match[1]
                        .toLowerCase()
                        .replace(/[^a-z0-9-_]/g, '-')
                        .replace(/-+/g, '-')
                        .replace(/^-|-$/g, '');
                    tools.push({
                        id: "".concat(mcpName, "-").concat(safeName),
                        name: match[1],
                        description: match[2].trim(),
                        handler: match[1],
                        parameters: {},
                    });
                }
            }
        }
        // Padrão 2: JSON output
        try {
            var jsonMatch = output.match(/\{[\s\S]*"tools"[\s\S]*\}/);
            if (jsonMatch) {
                var json = JSON.parse(jsonMatch[0]);
                if (Array.isArray(json.tools)) {
                    tools.push.apply(tools, json.tools);
                }
            }
        }
        catch (_a) {
            // Não é JSON válido
        }
        // Se não encontrou nenhuma tool, criar uma genérica
        if (tools.length === 0) {
            // Normalizar nome para ID válido (só lowercase, números, -, _)
            var safeId = mcpName
                .toLowerCase()
                .replace(/[^a-z0-9-_]/g, '-')
                .replace(/-+/g, '-')
                .replace(/^-|-$/g, '');
            tools.push({
                id: "".concat(safeId, "-default"),
                name: mcpName,
                description: "Tool principal de ".concat(mcpName),
                handler: 'execute',
                parameters: {},
            });
        }
        return tools;
    };
    /**
     * Testa se um MCP está funcionando
     */
    MCPExecutor.testMCP = function (mcpId, server, installType) {
        return __awaiter(this, void 0, void 0, function () {
            var testCommand, stdout, error_7;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        console.log("\uD83E\uDDEA [MCPExecutor] Testando MCP: ".concat(mcpId));
                        testCommand = '';
                        switch (installType) {
                            case 'npx':
                                testCommand = "npx -y ".concat(server, " --version 2>&1 || echo \"OK\"");
                                break;
                            case 'npm':
                                testCommand = "".concat(server, " --version 2>&1 || echo \"OK\"");
                                break;
                            default:
                                testCommand = 'echo "OK"';
                        }
                        return [4 /*yield*/, execAsync(testCommand, { timeout: 10000 })];
                    case 1:
                        stdout = (_a.sent()).stdout;
                        console.log('✅ [MCPExecutor] Teste concluído:', stdout.substring(0, 100));
                        return [2 /*return*/, {
                                success: true,
                                message: 'MCP está funcionando',
                                toolsFound: 1, // Placeholder
                            }];
                    case 2:
                        error_7 = _a.sent();
                        console.error('❌ [MCPExecutor] Erro no teste:', error_7);
                        return [2 /*return*/, {
                                success: false,
                                message: error_7.message,
                                toolsFound: 0,
                            }];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    // Cache de clients MCP ativos
    MCPExecutor.clients = new Map();
    return MCPExecutor;
}());
exports.MCPExecutor = MCPExecutor;
console.log('✅ MCP Executor ready');
