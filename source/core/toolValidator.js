"use strict";
/**
 * FLUI - Tool Validator
 *
 * Sistema de validação automática de parâmetros de ferramentas
 * Gera validadores baseados nas definições de ToolParam
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
exports.ToolValidator = void 0;
var ToolValidator = /** @class */ (function () {
    function ToolValidator() {
    }
    /**
     * Valida um conjunto de argumentos contra os parâmetros definidos
     */
    ToolValidator.validate = function (params, args) {
        var errors = [];
        // Validar cada parâmetro definido
        for (var _i = 0, params_1 = params; _i < params_1.length; _i++) {
            var param = params_1[_i];
            var paramKey = param.key || param.name;
            var value = args[paramKey];
            // Verificar obrigatoriedade
            if (param.required && (value === undefined || value === null || value === '')) {
                errors.push({
                    param: param.name || paramKey,
                    message: "Par\u00E2metro '".concat(param.name || paramKey, "' \u00E9 obrigat\u00F3rio"),
                    code: 'required',
                });
                continue;
            }
            // Se não obrigatório e não fornecido, pular
            if (value === undefined || value === null) {
                continue;
            }
            // Validar tipo
            var typeError = this.validateType(param, value);
            if (typeError) {
                errors.push(typeError);
                continue;
            }
            // Validar com função customizada se fornecida
            if (param.validation) {
                try {
                    var isValid = param.validation(value);
                    if (!isValid) {
                        errors.push({
                            param: param.name || paramKey,
                            message: "Valor inv\u00E1lido para '".concat(param.name || paramKey, "'"),
                            code: 'custom',
                        });
                    }
                }
                catch (error) {
                    errors.push({
                        param: param.name || paramKey,
                        message: "Erro na valida\u00E7\u00E3o de '".concat(param.name || paramKey, "': ").concat(error.message),
                        code: 'custom',
                    });
                }
            }
            // Validar opções (enum)
            if (param.options && param.options.length > 0) {
                if (!param.options.includes(value)) {
                    errors.push({
                        param: param.name || paramKey,
                        message: "'".concat(param.name || paramKey, "' deve ser um de: ").concat(param.options.join(', ')),
                        code: 'invalid_value',
                    });
                }
            }
        }
        return {
            valid: errors.length === 0,
            errors: errors,
        };
    };
    /**
     * Valida o tipo de um valor
     */
    ToolValidator.validateType = function (param, value) {
        var actualType = Array.isArray(value) ? 'array' : typeof value;
        switch (param.type) {
            case 'string':
                if (typeof value !== 'string') {
                    return {
                        param: param.name,
                        message: "'".concat(param.name, "' deve ser string, recebido ").concat(actualType),
                        code: 'invalid_type',
                    };
                }
                break;
            case 'number':
                if (typeof value !== 'number' || isNaN(value)) {
                    return {
                        param: param.name,
                        message: "'".concat(param.name, "' deve ser n\u00FAmero, recebido ").concat(actualType),
                        code: 'invalid_type',
                    };
                }
                break;
            case 'boolean':
                if (typeof value !== 'boolean') {
                    return {
                        param: param.name,
                        message: "'".concat(param.name, "' deve ser boolean, recebido ").concat(actualType),
                        code: 'invalid_type',
                    };
                }
                break;
            case 'object':
                if (typeof value !== 'object' || Array.isArray(value) || value === null) {
                    return {
                        param: param.name,
                        message: "'".concat(param.name, "' deve ser object, recebido ").concat(actualType),
                        code: 'invalid_type',
                    };
                }
                break;
            case 'array':
                if (!Array.isArray(value)) {
                    return {
                        param: param.name,
                        message: "'".concat(param.name, "' deve ser array, recebido ").concat(actualType),
                        code: 'invalid_type',
                    };
                }
                break;
            case 'json':
                if (typeof value === 'string') {
                    try {
                        JSON.parse(value);
                    }
                    catch (_a) {
                        return {
                            param: param.name,
                            message: "'".concat(param.name, "' deve ser JSON v\u00E1lido"),
                            code: 'invalid_value',
                        };
                    }
                }
                else if (typeof value !== 'object') {
                    return {
                        param: param.name,
                        message: "'".concat(param.name, "' deve ser JSON ou objeto"),
                        code: 'invalid_type',
                    };
                }
                break;
            case 'file':
                if (typeof value !== 'string') {
                    return {
                        param: param.name,
                        message: "'".concat(param.name, "' deve ser caminho de arquivo (string)"),
                        code: 'invalid_type',
                    };
                }
                break;
        }
        return null;
    };
    /**
     * Aplica valores padrão aos argumentos
     */
    ToolValidator.applyDefaults = function (params, args) {
        var result = __assign({}, args);
        for (var _i = 0, params_2 = params; _i < params_2.length; _i++) {
            var param = params_2[_i];
            var paramKey = param.key || param.name;
            if (result[paramKey] === undefined && param.default !== undefined) {
                result[paramKey] = param.default;
            }
        }
        return result;
    };
    /**
     * Gera mensagem de erro amigável
     */
    ToolValidator.formatErrors = function (errors) {
        if (errors.length === 0) {
            return '';
        }
        var messages = errors.map(function (err) { return "- ".concat(err.message); });
        return "Erros de valida\u00E7\u00E3o:\n".concat(messages.join('\n'));
    };
    /**
     * Valida e aplica defaults em uma única chamada
     */
    ToolValidator.validateAndApplyDefaults = function (params, args) {
        // Aplicar defaults primeiro
        var argsWithDefaults = this.applyDefaults(params, args);
        // Validar
        var validation = this.validate(params, argsWithDefaults);
        return {
            valid: validation.valid,
            args: argsWithDefaults,
            errors: validation.errors,
        };
    };
    return ToolValidator;
}());
exports.ToolValidator = ToolValidator;
