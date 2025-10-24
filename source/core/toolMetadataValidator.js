"use strict";
/**
 * FLUI - Tool Metadata Validator
 *
 * Valida metadados de ferramentas usando JSON Schema
 * Garante que todas as ferramentas registradas sigam o padrão correto
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
exports.ToolMetadataSchema = void 0;
exports.validateToolMetadata = validateToolMetadata;
exports.prepareToolMetadata = prepareToolMetadata;
var zod_1 = require("zod");
var types_js_1 = require("./types.js");
// Schema completo de validação de metadados de Tool
exports.ToolMetadataSchema = zod_1.z.object({
    id: zod_1.z.string().regex(/^[a-z0-9-_]+$/, 'ID deve conter apenas letras minúsculas, números, hífens e underscores'),
    name: zod_1.z.string().min(1, 'Nome é obrigatório'),
    description: zod_1.z.string().min(10, 'Descrição deve ter pelo menos 10 caracteres'),
    category: types_js_1.ToolCategorySchema,
    version: zod_1.z.string().regex(/^\d+\.\d+\.\d+$/, 'Versão deve seguir semver (x.y.z)'),
    params: zod_1.z.array(types_js_1.ToolParamSchema).min(0),
    output: types_js_1.ToolOutputSchema,
    inputs: zod_1.z.array(types_js_1.PortSchema).optional(),
    outputs: zod_1.z.array(types_js_1.PortSchema).optional(),
    capabilities: zod_1.z.object({
        requiresAuth: zod_1.z.boolean().optional(),
        runsInSandbox: zod_1.z.boolean().optional(),
        isAsync: zod_1.z.boolean().optional(),
        supportsStreaming: zod_1.z.boolean().optional(),
        canBeCached: zod_1.z.boolean().optional(),
        isStateful: zod_1.z.boolean().optional(),
        requiresNetwork: zod_1.z.boolean().optional(),
        requiresFileSystem: zod_1.z.boolean().optional(),
    }).optional(),
    ui: zod_1.z.object({
        icon: zod_1.z.string().optional(),
        color: zod_1.z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Cor deve ser um hex válido (#RRGGBB)').optional(),
        tags: zod_1.z.array(zod_1.z.string()).optional(),
        examples: zod_1.z.array(zod_1.z.object({
            title: zod_1.z.string(),
            description: zod_1.z.string(),
            params: zod_1.z.record(zod_1.z.any()),
            expectedOutput: zod_1.z.any().optional(),
        })).optional(),
        category: zod_1.z.string().optional(),
        group: zod_1.z.string().optional(),
    }),
    config: zod_1.z.object({
        timeout: zod_1.z.number().positive().optional(),
        retries: zod_1.z.number().nonnegative().optional(),
        sandbox: zod_1.z.boolean().optional(),
        concurrent: zod_1.z.boolean().optional(),
        rateLimit: zod_1.z.object({
            max: zod_1.z.number().positive(),
            window: zod_1.z.number().positive(),
        }).optional(),
    }).optional(),
});
/**
 * Valida metadados de uma ferramenta
 */
function validateToolMetadata(metadata) {
    var _a, _b, _c, _d, _e, _f;
    var warnings = [];
    try {
        // Validar schema básico
        exports.ToolMetadataSchema.parse(metadata);
        // Validações adicionais
        // 1. Verificar se params tem keys únicas
        var paramKeys = new Set();
        for (var _i = 0, _g = metadata.params || []; _i < _g.length; _i++) {
            var param = _g[_i];
            if (paramKeys.has(param.key)) {
                return {
                    valid: false,
                    errors: ["Par\u00E2metro com key duplicada: ".concat(param.key)],
                };
            }
            paramKeys.add(param.key);
        }
        // 2. Verificar se há exemplos (warning se não houver)
        if (!((_a = metadata.ui) === null || _a === void 0 ? void 0 : _a.examples) || metadata.ui.examples.length === 0) {
            warnings.push('Recomenda-se adicionar pelo menos um exemplo de uso');
        }
        // 3. Verificar se params obrigatórios têm placeholder
        for (var _h = 0, _j = metadata.params || []; _h < _j.length; _h++) {
            var param = _j[_h];
            if (param.required && !((_b = param.ui) === null || _b === void 0 ? void 0 : _b.placeholder)) {
                warnings.push("Par\u00E2metro obrigat\u00F3rio '".concat(param.name, "' deveria ter um placeholder"));
            }
        }
        // 4. Verificar se ferramentas assíncronas têm timeout configurado
        if (((_c = metadata.capabilities) === null || _c === void 0 ? void 0 : _c.isAsync) && !((_d = metadata.config) === null || _d === void 0 ? void 0 : _d.timeout)) {
            warnings.push('Ferramentas assíncronas devem definir um timeout padrão');
        }
        // 5. Verificar se ferramentas que requerem rede têm timeout
        if (((_e = metadata.capabilities) === null || _e === void 0 ? void 0 : _e.requiresNetwork) && !((_f = metadata.config) === null || _f === void 0 ? void 0 : _f.timeout)) {
            warnings.push('Ferramentas que requerem rede devem definir um timeout');
        }
        return {
            valid: true,
            warnings: warnings.length > 0 ? warnings : undefined,
        };
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            var errors = error.errors.map(function (err) {
                var path = err.path.join('.');
                return "".concat(path, ": ").concat(err.message);
            });
            return {
                valid: false,
                errors: errors,
            };
        }
        return {
            valid: false,
            errors: ["Erro inesperado na valida\u00E7\u00E3o: ".concat(error.message)],
        };
    }
}
/**
 * Valida e prepara metadados para registro
 * Adiciona valores padrão e normaliza estrutura
 */
function prepareToolMetadata(metadata) {
    // Adicionar valores padrão
    var prepared = __assign(__assign({}, metadata), { inputs: metadata.inputs || [], outputs: metadata.outputs || [], capabilities: metadata.capabilities || {}, config: __assign({ timeout: 30000, retries: 0, sandbox: false, concurrent: true }, metadata.config), ui: __assign({ tags: [], examples: [] }, metadata.ui) });
    // Garantir que cada param tem ui config
    if (prepared.params) {
        prepared.params = prepared.params.map(function (param) { return (__assign(__assign({}, param), { key: param.key || param.name, ui: param.ui || inferUIConfig(param) })); });
    }
    return prepared;
}
/**
 * Infere configuração de UI com base no tipo do parâmetro
 */
function inferUIConfig(param) {
    var baseConfig = {
        placeholder: param.placeholder || "Digite ".concat(param.name, "..."),
        helperText: param.description,
        allowExpressions: true, // Por padrão permite expressões
    };
    // Inferir widgetType com base no type
    switch (param.type) {
        case 'string':
            baseConfig.widgetType = param.options ? 'select' : 'textInput';
            if (param.options) {
                baseConfig.options = param.options.map(function (opt) {
                    return typeof opt === 'string' ? { label: opt, value: opt } : opt;
                });
            }
            break;
        case 'number':
            baseConfig.widgetType = 'number';
            break;
        case 'boolean':
            baseConfig.widgetType = 'toggle';
            break;
        case 'object':
            // Se tiver keys específicas, usar keyValue, senão jsonEditor
            baseConfig.widgetType = param.name.includes('header') || param.name.includes('param')
                ? 'keyValue'
                : 'jsonEditor';
            break;
        case 'array':
            baseConfig.widgetType = 'multiSelect';
            break;
        case 'json':
            baseConfig.widgetType = 'jsonEditor';
            baseConfig.codeLanguage = 'json';
            break;
        case 'file':
            baseConfig.widgetType = 'filePicker';
            break;
        default:
            baseConfig.widgetType = 'textInput';
    }
    return baseConfig;
}
