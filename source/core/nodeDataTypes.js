"use strict";
/**
 * FLUI - Node Data Types (Padrão Universal)
 *
 * Sistema padronizado de Input/Output para todos os nodes
 * Garante comunicação consistente e rastreável entre nodes
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
exports.NodeOutputSchema = exports.NodeDataItemSchema = exports.NodeMetaSchema = void 0;
exports.createNodeDataItem = createNodeDataItem;
exports.createInitialOutput = createInitialOutput;
exports.extractAvailableKeys = extractAvailableKeys;
exports.applyInputMappings = applyInputMappings;
exports.validateNodeOutput = validateNodeOutput;
exports.convertLegacyOutput = convertLegacyOutput;
exports.mergeNodeOutputs = mergeNodeOutputs;
exports.filterOutputKeys = filterOutputKeys;
var zod_1 = require("zod");
// ============= PADRÃO BASE DE DADOS =============
/**
 * Metadados obrigatórios para rastreabilidade
 */
exports.NodeMetaSchema = zod_1.z.object({
    nodeId: zod_1.z.string(),
    nodeName: zod_1.z.string().optional(),
    timestamp: zod_1.z.number(),
    executionId: zod_1.z.string().optional(),
});
/**
 * Estrutura padrão de dados de um node
 *
 * Formato universal:
 * [
 *   {
 *     json: { chave1: valor1, chave2: valor2, ... },
 *     meta: { nodeId: "abc", timestamp: 123456789 }
 *   }
 * ]
 */
exports.NodeDataItemSchema = zod_1.z.object({
    json: zod_1.z.record(zod_1.z.any()), // Dados livres e dinâmicos
    meta: exports.NodeMetaSchema, // Metadados obrigatórios
});
/**
 * Formato padrão de saída de qualquer node
 * Sempre um array de itens
 */
exports.NodeOutputSchema = zod_1.z.array(exports.NodeDataItemSchema);
// ============= HELPERS =============
/**
 * Cria um NodeDataItem padrão
 */
function createNodeDataItem(json, nodeId, nodeName, executionId) {
    return {
        json: json,
        meta: {
            nodeId: nodeId,
            nodeName: nodeName,
            timestamp: Date.now(),
            executionId: executionId,
        },
    };
}
/**
 * Cria output inicial de um node
 */
function createInitialOutput(nodeId, nodeName) {
    return [
        createNodeDataItem({ init: true }, nodeId, nodeName || 'Start Node'),
    ];
}
/**
 * Extrai todas as chaves disponíveis de um NodeOutput
 */
function extractAvailableKeys(output) {
    var allKeys = new Set();
    output.forEach(function (item) {
        Object.keys(item.json).forEach(function (key) { return allKeys.add(key); });
    });
    return Array.from(allKeys).sort();
}
/**
 * Aplica mapeamentos de input para criar dados de entrada de um node
 */
function applyInputMappings(previousResults, inputConfig) {
    var result = {};
    inputConfig.mappings.forEach(function (mapping) {
        var sourceOutput = previousResults[mapping.sourceNodeId];
        if (!sourceOutput || sourceOutput.length === 0) {
            console.warn("Output do node ".concat(mapping.sourceNodeId, " n\u00E3o encontrado"));
            return;
        }
        // Para cada item do output do node anterior
        sourceOutput.forEach(function (item) {
            mapping.selectedKeys.forEach(function (key) {
                if (item.json[key] !== undefined) {
                    var targetKey = mapping.mapTo || key;
                    if (inputConfig.mergeStrategy === 'array') {
                        if (!result[targetKey])
                            result[targetKey] = [];
                        result[targetKey].push(item.json[key]);
                    }
                    else if (inputConfig.mergeStrategy === 'merge') {
                        if (typeof item.json[key] === 'object' && !Array.isArray(item.json[key])) {
                            result[targetKey] = __assign(__assign({}, result[targetKey]), item.json[key]);
                        }
                        else {
                            result[targetKey] = item.json[key];
                        }
                    }
                    else {
                        // replace (default)
                        result[targetKey] = item.json[key];
                    }
                }
            });
        });
    });
    return result;
}
/**
 * Valida se um output está no formato correto
 */
function validateNodeOutput(output) {
    var errors = [];
    if (!Array.isArray(output)) {
        errors.push('Output deve ser um array');
        return { valid: false, errors: errors };
    }
    output.forEach(function (item, index) {
        if (!item.json) {
            errors.push("Item ".concat(index, ": campo 'json' obrigat\u00F3rio"));
        }
        if (!item.meta) {
            errors.push("Item ".concat(index, ": campo 'meta' obrigat\u00F3rio"));
        }
        else {
            if (!item.meta.nodeId) {
                errors.push("Item ".concat(index, ": meta.nodeId obrigat\u00F3rio"));
            }
            if (!item.meta.timestamp) {
                errors.push("Item ".concat(index, ": meta.timestamp obrigat\u00F3rio"));
            }
        }
    });
    return { valid: errors.length === 0, errors: errors };
}
/**
 * Converte output antigo para novo formato
 * (Compatibilidade com código legado)
 */
function convertLegacyOutput(legacyOutput, nodeId, nodeName) {
    // Se já está no formato correto, retornar
    if (Array.isArray(legacyOutput) && legacyOutput.length > 0 && legacyOutput[0].json && legacyOutput[0].meta) {
        return legacyOutput;
    }
    // Se é um objeto simples, converter
    if (typeof legacyOutput === 'object' && !Array.isArray(legacyOutput)) {
        return [createNodeDataItem(legacyOutput, nodeId, nodeName)];
    }
    // Se é um valor primitivo, encapsular
    return [createNodeDataItem({ result: legacyOutput }, nodeId, nodeName)];
}
/**
 * Mescla múltiplos outputs em um único output
 */
function mergeNodeOutputs(outputs) {
    return outputs.flat();
}
/**
 * Filtra output por chaves específicas
 */
function filterOutputKeys(output, keys) {
    return output.map(function (item) { return ({
        json: Object.keys(item.json)
            .filter(function (key) { return keys.includes(key); })
            .reduce(function (obj, key) {
            obj[key] = item.json[key];
            return obj;
        }, {}),
        meta: item.meta,
    }); });
}
