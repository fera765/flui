"use strict";
/**
 * FLUI - Reference Resolver
 *
 * Resolve referências {{nodeId.key}} nos inputs dos nodes
 * Suporta:
 * - Referências simples: {{node-1.email}}
 * - Referências aninhadas: {{node-1.user.name}}
 * - Múltiplas referências: "Olá {{node-1.nome}}, email: {{node-1.email}}"
 * - Arrays e objetos recursivos
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveReferences = resolveReferences;
exports.hasReferences = hasReferences;
exports.extractReferences = extractReferences;
exports.validateReferences = validateReferences;
/**
 * Resolve todas as referências em um objeto de configuração
 */
function resolveReferences(config, context) {
    var resolved = {};
    for (var _i = 0, _a = Object.entries(config); _i < _a.length; _i++) {
        var _b = _a[_i], key = _b[0], value = _b[1];
        // Não resolver campos internos ou metadados
        if (key === 'inputConfig' || key === 'toolId' || key === 'nodeId') {
            resolved[key] = value;
            continue;
        }
        resolved[key] = resolveValue(value, context);
    }
    return resolved;
}
/**
 * Resolve um valor individual (string, object, array, etc)
 */
function resolveValue(value, context) {
    if (typeof value === 'string') {
        return resolveString(value, context);
    }
    if (Array.isArray(value)) {
        return value.map(function (item) { return resolveValue(item, context); });
    }
    if (typeof value === 'object' && value !== null) {
        var resolved = {};
        for (var _i = 0, _a = Object.entries(value); _i < _a.length; _i++) {
            var _b = _a[_i], k = _b[0], v = _b[1];
            resolved[k] = resolveValue(v, context);
        }
        return resolved;
    }
    return value;
}
/**
 * Resolve referências em uma string
 * Formato: {{nodeId.key}} ou múltiplas
 */
function resolveString(str, context) {
    // Se é apenas uma referência (sem texto ao redor), retornar o valor direto
    var singleRefMatch = str.match(/^\{\{([^}]+)\}\}$/);
    if (singleRefMatch) {
        return resolveReference(singleRefMatch[1], context);
    }
    // Se tem múltiplas referências ou texto ao redor, substituir todas
    if (str.includes('{{')) {
        return str.replace(/\{\{([^}]+)\}\}/g, function (match, ref) {
            var resolved = resolveReference(ref, context);
            return String(resolved);
        });
    }
    return str;
}
/**
 * Resolve uma referência específica: "nodeId.key.subkey"
 */
function resolveReference(ref, context) {
    var parts = ref.trim().split('.');
    if (parts.length < 2) {
        console.warn("\u26A0\uFE0F  Refer\u00EAncia inv\u00E1lida (formato esperado: nodeId.key): ".concat(ref));
        return "{{".concat(ref, "}}");
    }
    var nodeId = parts[0], keyPath = parts.slice(1);
    // Buscar output do node
    var nodeOutput = context.nodeOutputs.get(nodeId);
    if (!nodeOutput || nodeOutput.length === 0) {
        console.warn("\u26A0\uFE0F  Node n\u00E3o encontrado ou sem output: ".concat(nodeId));
        return "{{".concat(ref, "}}");
    }
    // Pegar o último item do output (mais recente)
    var outputData = nodeOutput[nodeOutput.length - 1].json;
    // Navegar pelo caminho de chaves
    var value = outputData;
    for (var _i = 0, keyPath_1 = keyPath; _i < keyPath_1.length; _i++) {
        var key = keyPath_1[_i];
        if (value && typeof value === 'object' && key in value) {
            value = value[key];
        }
        else {
            console.warn("\u26A0\uFE0F  Chave n\u00E3o encontrada: ".concat(keyPath.join('.'), " em node ").concat(nodeId));
            return "{{".concat(ref, "}}");
        }
    }
    return value;
}
/**
 * Verifica se um valor contém referências
 */
function hasReferences(value) {
    if (typeof value === 'string') {
        return /\{\{[^}]+\}\}/.test(value);
    }
    if (Array.isArray(value)) {
        return value.some(hasReferences);
    }
    if (typeof value === 'object' && value !== null) {
        return Object.values(value).some(hasReferences);
    }
    return false;
}
/**
 * Extrai todas as referências de um valor
 */
function extractReferences(value) {
    var refs = [];
    if (typeof value === 'string') {
        var matches = value.matchAll(/\{\{([^}]+)\}\}/g);
        for (var _i = 0, matches_1 = matches; _i < matches_1.length; _i++) {
            var match = matches_1[_i];
            refs.push(match[1]);
        }
    }
    else if (Array.isArray(value)) {
        for (var _a = 0, value_1 = value; _a < value_1.length; _a++) {
            var item = value_1[_a];
            refs.push.apply(refs, extractReferences(item));
        }
    }
    else if (typeof value === 'object' && value !== null) {
        for (var _b = 0, _c = Object.values(value); _b < _c.length; _b++) {
            var v = _c[_b];
            refs.push.apply(refs, extractReferences(v));
        }
    }
    return refs;
}
/**
 * Valida se todas as referências podem ser resolvidas
 */
function validateReferences(config, context) {
    var errors = [];
    var refs = extractReferences(config);
    for (var _i = 0, refs_1 = refs; _i < refs_1.length; _i++) {
        var ref = refs_1[_i];
        var parts = ref.trim().split('.');
        if (parts.length < 2) {
            errors.push("Refer\u00EAncia inv\u00E1lida (formato esperado: nodeId.key): ".concat(ref));
            continue;
        }
        var nodeId = parts[0];
        var nodeOutput = context.nodeOutputs.get(nodeId);
        if (!nodeOutput || nodeOutput.length === 0) {
            errors.push("Node n\u00E3o encontrado: ".concat(nodeId, " (refer\u00EAncia: ").concat(ref, ")"));
        }
    }
    return {
        valid: errors.length === 0,
        errors: errors,
    };
}
